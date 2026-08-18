import { useState } from "react";
import { useConfig } from "../context/useConfig";
import { hasRole } from "../lib/roles";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function EnvironmentsPage({ user }) {
  const { environments, currentEnv, addEnvironment, deleteEnvironment } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = hasRole(user, "publisher");

  function handleAdd(name) {
    addEnvironment(name);
    setIsModalOpen(false);
  }

  function handleDelete(env) {
    if (env === "prod") return;
    deleteEnvironment(env);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Environments</h2>
          <p className="text-sm text-gray-500">Each environment holds its own isolated set of config values.</p>
        </div>
        {canManage && (
          <Button variant="secondary" onClick={() => setIsModalOpen(true)}>+ Add environment</Button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {environments.map((env) => (
          <div key={env} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{env}</span>
              {env === currentEnv && <Badge color="indigo">Active</Badge>}
              {env === "prod" && <Badge color="red">Protected</Badge>}
            </div>
            {canManage && env !== "prod" && (
              <Button variant="danger" onClick={() => handleDelete(env)}>Delete</Button>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <EnvModal onClose={() => setIsModalOpen(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

function EnvModal({ onClose, onSave }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim().toLowerCase());
  }

  return (
    <Modal title="Add environment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Environment name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. qa" required />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add</Button>
        </div>
      </form>
    </Modal>
  );
}