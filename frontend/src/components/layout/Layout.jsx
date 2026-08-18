import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      <Sidebar user={user} onLogout={onLogout} />
      <div className="flex-1">
        <Topbar user={user} />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}