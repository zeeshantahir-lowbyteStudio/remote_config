import { useState } from "react";
import { useConfig } from "../context/useConfig";
import { hasRole } from "../lib/roles";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function ProjectsPage({ user }) {
  const { projects, currentProject, addProject } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canManage = hasRole(user, "publisher");

  function handleAdd(name) {
    addProject(name);
    setIsModalOpen(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Projects</h2>
          <p className="text-sm text-gray-500">Each project has its own isolated dev/staging/prod config.</p>
        </div>
        {canManage && <Button variant="secondary" onClick={() => setIsModalOpen(true)}>+ Add project</Button>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {projects.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">No projects yet</div>
        )}
        {projects.map((p) => (
          <div key={p} className="px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-medium">{p}</span>
            {p === currentProject && <Badge color="indigo">Active</Badge>}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ProjectModal onClose={() => setIsModalOpen(false)} onSave={handleAdd} />
      )}
    </div>
  );
}

function ProjectModal({ onClose, onSave }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim().toLowerCase().replace(/\s+/g, "_"));
  }

  return (
    <Modal title="Add project" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Project name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. gold_app" required />
        <p className="text-xs text-gray-500">This will automatically create dev, staging, and prod environments.</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create project</Button>
        </div>
      </form>
    </Modal>
  );
}