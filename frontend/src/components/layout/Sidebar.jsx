import { NavLink } from "react-router-dom";
import { Sliders, GitBranch, FlaskConical, FolderKanban, Server, KeyRound, History, ScrollText, LogOut, Users, Activity, X } from "lucide-react";
import { hasRole } from "../../lib/roles";

const navItems = [
  { to: "/",             label: "Parameters",     icon: Sliders      },
  { to: "/conditions",   label: "Conditions",     icon: GitBranch    },
  { to: "/experiments",  label: "A/B Testing",    icon: FlaskConical },
  { to: "/environments", label: "Environments",   icon: Server       },
  { to: "/apps",         label: "Apps & API Keys", icon: KeyRound    },
  { to: "/traffic",      label: "Traffic",         icon: Activity    },
  { to: "/history",      label: "Publish History", icon: History     },
  { to: "/audit-log",    label: "Audit Log",       icon: ScrollText  },
  { to: "/projects",     label: "Projects",        icon: FolderKanban},
];

export default function Sidebar({ user, onLogout, onClose }) {
  return (
    <aside className="w-56 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
        <h1 className="text-sm font-semibold">Remote Config</h1>
        {/* Close button — only visible on mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 py-3 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2 text-sm font-medium mx-2 rounded-md ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}

        {hasRole(user, "admin") && (
          <NavLink
            to="/users"
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-4 py-2 text-sm font-medium mx-2 rounded-md ${
                isActive ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"
              }`
            }
          >
            <Users size={16} />
            Users
          </NavLink>
        )}
      </nav>

      <div className="border-t border-gray-200 px-4 py-3">
        {user?.email && (
          <div className="text-xs text-gray-500 mb-2 truncate">{user.email}</div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 w-full"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
