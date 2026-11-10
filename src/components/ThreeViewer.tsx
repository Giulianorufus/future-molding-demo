import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
type SurfacePoint = { x: number; y: number; z: number };
type DefectPin = { id: string; x?: number; y?: number; defect?: string; severity?: number }

export type ThreeViewerProps = {
  viewerUrl?: string | null;
  pins?: DefectPin[];
  selectedPinId?: string | null;
  selectedPin?: { x: number; y: number; z: number } | null;
  onPickPoint?: (point: SurfacePoint) => void;
  onSelectPin?: (id: string | null) => void;
};

export const ThreeViewer: React.FC<ThreeViewerProps> = ({ viewerUrl, pins, selectedPinId, selectedPin, onSelectPin, onPickPoint }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<string>("Idle");
  const observation = useRef({ selectedPin, onPickPoint });
  useEffect(() => { observation.current = { selectedPin, onPickPoint }; }, [selectedPin, onPickPoint]);
  const effectiveUrl = viewerUrl ?? null;

  useEffect(() => {
    if (!containerRef.current) return;
    if (!effectiveUrl) {
      console.warn("ThreeViewer: url mancante, niente da caricare.");
      setStatus("No viewer");
      return;
    }

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 300;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 150);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height);
    renderer.setClearColor(0xf5f5f5, 1);
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(50, 50, 100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    let stop = false;
    let controls: any = null;
    let model: THREE.Object3D | null = null;
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(1.25, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0xffb000 }),
    );
    marker.visible = false;
    scene.add(marker);
    const raycaster = new THREE.Raycaster();
    let pointerStart: { x: number; y: number; id: number } | null = null;
    const startPick = (event: PointerEvent) => {
      if (event.isPrimary && event.button === 0) {
        pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
      }
    };
    const cancelPick = () => { pointerStart = null; };
    const finishPick = (event: PointerEvent) => {
      const start = pointerStart;
      cancelPick();
      const onPick = observation.current.onPickPoint;
      if (!start || start.id !== event.pointerId || !model || !onPick ||
          Math.hypot(start.x - event.clientX, start.y - event.clientY) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const pointer = new THREE.Vector2(
        (event.clientX - rect.left) * 2 / rect.width - 1,
        1 - (event.clientY - rect.top) * 2 / rect.height,
      );
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObject(model, true).find(entry => entry.object instanceof THREE.Mesh);
      if (hit) onPick({ x: hit.point.x, y: hit.point.y, z: hit.point.z });
    };
    renderer.domElement.addEventListener('pointerdown', startPick);
    renderer.domElement.addEventListener('pointerup', finishPick);
    renderer.domElement.addEventListener('pointercancel', cancelPick);
    const animate = () => {
      if (stop) return;
      requestAnimationFrame(animate);
      controls?.update?.();
      const point = observation.current.selectedPin;
      marker.visible = Boolean(point);
      if (point) marker.position.set(point.x, point.y, point.z);
      renderer.render(scene, camera);
    };

    (async () => {
      try {
        setStatus("Importing loader");
        const [loaderMod, controlsMod]: any[] = await Promise.all([
          import("three/examples/jsm/loaders/GLTFLoader"),
          import("three/examples/jsm/controls/OrbitControls"),
        ]);
        if (stop) return;
        const GLTFLoader = loaderMod.GLTFLoader ?? loaderMod.default;
        const OrbitControls = controlsMod.OrbitControls ?? controlsMod.default;
        controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        const loader = new GLTFLoader();
        setStatus("Loading model");
        loader.load(
          effectiveUrl as string,
          (gltf: any) => {
            if (stop) return;
            setStatus("Model loaded");
            const root = gltf?.scene;
            if (!root) {
              console.error("ThreeViewer: GLB senza scene.");
              setStatus("No scene in GLB");
              return;
            }

            // CAD exports can contain materials that are technically valid GLTF
            // but render black/invisible in the simple viewer. Use a neutral,
            // double-sided material so the actual geometry is always visible.
            root.traverse((obj: any) => {
              if (obj?.isMesh) {
                obj.visible = true;
                obj.frustumCulled = false;
                obj.material = new THREE.MeshStandardMaterial({
                  color: 0xb8c4d1,
                  roughness: 0.72,
                  metalness: 0.05,
                  side: THREE.DoubleSide,
                });
              }
            });

            const box = new THREE.Box3().setFromObject(root);
            const size = new THREE.Vector3();
            const center = new THREE.Vector3();
            box.getSize(size);
            box.getCenter(center);
            root.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z) || 1;
            const scale = 80 / maxDim;
            root.scale.setScalar(scale);

            scene.add(root);
            model = root;

            // Fit the camera to the converted model and orbit around its center.
            const fittedSize = maxDim * scale;
            const distance = fittedSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
            camera.near = Math.max(0.01, distance / 100);
            camera.far = Math.max(1000, distance * 100);
            camera.position.set(distance * 0.75, distance * 0.55, distance * 1.15);
            camera.lookAt(0, 0, 0);
            camera.updateProjectionMatrix();
            controls?.target?.set(0, 0, 0);
            controls?.update?.();

            animate();
            setStatus("Ready");
          },
          (xhr) => {
            try {
              const pct = xhr.loaded && xhr.total ? Math.round((xhr.loaded / xhr.total) * 100) : null;
              if (pct !== null) setStatus(`Loading ${pct}%`);
            } catch (e) {}
          },
          (err) => {
            console.error("ThreeViewer: errore caricando GLB", err);
            setStatus("Error loading model");
          }
        );
      } catch (err) {
        console.error("ThreeViewer: errore import GLTFLoader", err);
        setStatus("Error importing loader");
      }
    })();

    return () => {
      stop = true;
      renderer.domElement.removeEventListener('pointerdown', startPick);
      renderer.domElement.removeEventListener('pointerup', finishPick);
      renderer.domElement.removeEventListener('pointercancel', cancelPick);
      marker.geometry.dispose();
      marker.material.dispose();
      controls?.dispose?.();
      renderer.dispose();
      renderer.forceContextLoss?.();
      containerRef.current && (containerRef.current.innerHTML = "");
    };
  }, [effectiveUrl]);

  return (
    <div style={{ position: "relative", width: "100%", height: "320px", borderRadius: 8, overflow: "hidden" }}>
      <div ref={containerRef} style={{ width: "100%", height: "320px" }} />
      <div style={{ position: "absolute", left: 12, top: 12, padding: "6px 8px", background: "rgba(0,0,0,0.6)", color: "#fff", borderRadius: 6, fontSize: 12 }}>
        {status}
      </div>
    </div>
  );
};

export default ThreeViewer;
