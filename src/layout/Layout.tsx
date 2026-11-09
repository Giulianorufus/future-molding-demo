import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="fm-shell flex h-dvh min-h-0 flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <Sidebar />
        <main className="fm-workspace min-h-0 min-w-0 flex-1 overflow-auto p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
