import { useState } from "react";
import { useConfig } from "../context/useConfig";
import { hasRole } from "../lib/roles";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

export default function ConditionsPage({ user }) {
  const { conditions, addCondition, updateCondition, deleteCondition } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const canEdit = hasRole(user, "editor");

  function handleSave(data) {
    if (editing) {
      updateCondition(editing.id, data);
    } else {
      addCondition(data);
    }
    setIsModalOpen(false);
  }

  function handleDelete(cond) {
    deleteCondition(cond.id);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">Conditions</h2>
          <p className="text-sm text-gray-500">Reusable targeting rules you can attach to any parameter.</p>
        </div>
        {canEdit && (
          <Button variant="secondary" onClick={() => { setEditing(null); setIsModalOpen(true); }}>
            + Add condition
          </Button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {conditions.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">No conditions yet</div>
        )}
        {conditions.map((c) => (
          <div key={c.id} className="px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">{c.name}</div>
              <div className="text-xs text-gray-500 font-mono mt-0.5">{c.ruleExpression}</div>
            </div>
            {canEdit && (
              <div className="space-x-3">
                <Button variant="link" onClick={() => { setEditing(c); setIsModalOpen(true); }}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(c)}>Delete</Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ConditionModal initial={editing} onClose={() => setIsModalOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}

function ConditionModal({ initial, onClose, onSave }) {
  const [name, setName] = useState(initial?.name || "");
  const [rules, setRules] = useState(initial?.ruleExpression || "");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !rules.trim()) return;
    onSave({ name, rules });
  }

  return (
    <Modal title={initial ? "Edit condition" : "Add condition"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Condition name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. iOS users" required />
        <Input
          label="Rule expression"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          className="font-mono"
          placeholder="e.g. platform == ios"
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </Modal>
  );
}