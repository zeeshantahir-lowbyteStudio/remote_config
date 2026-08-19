import { useConfig } from "../../context/useConfig";
import { hasRole } from "../../lib/roles";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function Topbar({ user }) {
  const {
    projects, currentProject, setCurrentProject,
    environments, currentEnv, setCurrentEnv,
    hasDraftChanges, publishChanges,
  } = useConfig();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Select value={currentProject} onChange={(e) => setCurrentProject(e.target.value)} className="w-40">
          {projects.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Select value={currentEnv} onChange={(e) => setCurrentEnv(e.target.value)} className="w-32">
          {environments.map((env) => <option key={env} value={env}>{env}</option>)}
        </Select>
      </div>

      <div className="flex items-center gap-3">
        {hasDraftChanges && <Badge color="amber">Unpublished changes</Badge>}
        {hasRole(user, "publisher") && (
          <Button disabled={!hasDraftChanges} onClick={() => publishChanges("Manual publish")}>
            Publish changes
          </Button>
        )}
      </div>
    </header>
  );
}