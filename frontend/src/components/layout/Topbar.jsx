import { useConfig } from "../../context/useConfig";
import { hasRole } from "../../lib/roles";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import { Menu } from "lucide-react";

export default function Topbar({ user, onMenuClick }) {
  const {
    projects, currentProject, setCurrentProject,
    environments, currentEnv, setCurrentEnv,
    hasDraftChanges, publishChanges,
  } = useConfig();

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        aria-label="Open menu"
      >
        <Menu size={18} />
      </button>

      {/* Project + environment selectors */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select
          value={currentProject}
          onChange={(e) => setCurrentProject(e.target.value)}
          className="w-36 sm:w-40"
        >
          {projects.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select
          value={currentEnv}
          onChange={(e) => setCurrentEnv(e.target.value)}
          className="w-28 sm:w-32"
        >
          {environments.map((env) => <option key={env} value={env}>{env}</option>)}
        </Select>
      </div>

      {/* Publish controls — pushed to the right on larger screens */}
      <div className="flex items-center gap-3 sm:ml-auto flex-wrap">
        {hasDraftChanges && (
          <Badge color="amber">
            <span className="hidden sm:inline">Unpublished changes</span>
            <span className="sm:hidden">Unpublished</span>
          </Badge>
        )}
        {hasRole(user, "publisher") && (
          <Button disabled={!hasDraftChanges} onClick={() => publishChanges("Manual publish")}>
            <span className="hidden sm:inline">Publish changes</span>
            <span className="sm:hidden">Publish</span>
          </Button>
        )}
      </div>
    </header>
  );
}
