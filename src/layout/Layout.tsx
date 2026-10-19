import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen min-h-0 flex-col bg-gray-100 md:flex-row">
      <Sidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0"><TopBar /></div>

        <main className="min-h-0 min-w-0 flex-1 overflow-auto p-3 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
