import { useConfig } from "../../context/useConfig";
import { hasRole } from "../../lib/roles";
import Select from "../ui/Select";
import Button from "../ui/Button";
import Badge from "../ui/Badge";

export default function Topbar({ user }) {
  const { environments, currentEnv, setCurrentEnv, hasDraftChanges, publishChanges } = useConfig();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Select value={currentEnv} onChange={(e) => setCurrentEnv(e.target.value)} className="w-32">
        {environments.map((env) => (
          <option key={env} value={env}>{env}</option>
        ))}
      </Select>

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