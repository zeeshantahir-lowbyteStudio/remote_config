import { useState } from "react";
import { useConfig } from "../context/useConfig";
import { hasRole } from "../lib/roles";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

export default function ParametersPage({ user }) {
  const { params, addParam, updateParam, deleteParam } = useConfig();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingParam, setEditingParam] = useState(null);
  const canEdit = hasRole(user, "editor");

  const filtered = params.filter((p) => p.key.toLowerCase().includes(search.toLowerCase()));

  function openAdd() {
    setEditingParam(null);
    setIsModalOpen(true);
  }

  function openEdit(param) {
    setEditingParam(param);
    setIsModalOpen(true);
  }

  function handleSave(data) {
    if (editingParam) {
      updateParam(editingParam.id, { defaultValue: data.defaultValue });
    } else {
      addParam(data);
    }
    setIsModalOpen(false);
  }

  function handleDelete(param) {
    deleteParam(param.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Input
          placeholder="Search parameters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-72"
        />
        {canEdit && <Button variant="secondary" onClick={openAdd}>+ Add parameter</Button>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Parameter key</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Default value</th>
              <th className="px-4 py-3 font-medium">Draft</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              {canEdit && <th className="px-4 py-3 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={canEdit ? 6 : 5} className="px-4 py-10 text-center text-gray-400">No parameters found</td></tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-800">{p.key}</td>
                <td className="px-4 py-3 text-gray-500">{p.type}</td>
                <td className="px-4 py-3 text-gray-800">{p.draftValue}</td>
                <td className="px-4 py-3">
                  {p.hasDraftChange ? <Badge color="amber">Unpublished</Badge> : <Badge color="green">Published</Badge>}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "-"}</td>
                {canEdit && (
                  <td className="px-4 py-3 text-right space-x-3">
                    <Button variant="link" onClick={() => openEdit(p)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(p)}>Delete</Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ParamModal initial={editingParam} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}

function ParamModal({ initial, onClose, onSave }) {
  const [key, setKey] = useState(initial?.key || "");
  const [type, setType] = useState(initial?.type || "String");
  const [defaultValue, setDefaultValue] = useState(initial?.draftValue || "");

  function handleSubmit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    onSave({ key, type, defaultValue });
  }

  return (
    <Modal title={initial ? "Edit parameter" : "Add parameter"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Parameter key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          disabled={!!initial}
          className="font-mono disabled:bg-gray-100"
          placeholder="e.g. feature_flag_x"
          required
        />
        <Select label="Data type" value={type} onChange={(e) => setType(e.target.value)} disabled={!!initial}>
          <option>String</option>
          <option>Boolean</option>
          <option>Number</option>
          <option>JSON</option>
        </Select>
        <Input label="Default value" value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} required />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}