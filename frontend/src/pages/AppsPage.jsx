import { useState } from "react";
import { useConfig } from "../context/useConfig";
import { hasRole } from "../lib/roles";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Modal from "../components/ui/Modal";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

export default function AppsPage({ user }) {
  const { apps, environments, addApp, regenerateAppKey, deleteApp } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState({});
  const canManage = hasRole(user, "publisher");

  function toggleVisible(id) {
    setVisibleKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleAdd(data) {
    addApp(data);
    setIsModalOpen(false);
  }

  function handleRegenerate(app) {
    regenerateAppKey(app.id);
  }

  function handleDelete(app) {
    deleteApp(app.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Apps & API Keys</h2>
          <p className="text-sm text-gray-500">Each app authenticates to the config fetch endpoint with its own key.</p>
        </div>
        {canManage && (
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>+ Add app</Button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {apps.map((app) => (
          <div key={app.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{app.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <code className="text-xs bg-gray-50 px-2 py-1 rounded font-mono">
                  {visibleKeys[app.id] ? app.apiKey : "•".repeat(app.apiKey.length)}
                </code>
                <button onClick={() => toggleVisible(app.id)} className="text-gray-400 hover:text-gray-600">
                  {visibleKeys[app.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            {canManage && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleRegenerate(app)}
                  className="text-xs text-gray-500 hover:text-indigo-600 flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Regenerate
                </button>
                <Button variant="danger" onClick={() => handleDelete(app)}>Delete</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <AppModal environments={environments} onClose={() => setIsModalOpen(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

function AppModal({ environments, onClose, onSave }) {
  const [name, setName] = useState("");
  const [environment, setEnvironment] = useState(environments[0] || "");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name, environment });
  }

  return (
    <Modal title="Add app" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="App name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mobile App" required />
        <Select label="Environment" value={environment} onChange={(e) => setEnvironment(e.target.value)}>
          {environments.map((env) => <option key={env} value={env}>{env}</option>)}
        </Select>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create & generate key</Button>
        </div>
      </form>
    </Modal>
  );
}