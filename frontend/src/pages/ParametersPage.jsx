import { useState, useEffect } from "react";
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
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <Input
          placeholder="Search parameters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72"
        />
        {canEdit && <Button variant="secondary" onClick={openAdd}>+ Add parameter</Button>}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Parameter key</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Default value</th>
                <th className="px-4 py-3 font-medium">Draft</th>
                <th className="px-4 py-3 font-medium">Last updated</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No parameters found</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-800 break-all">{p.key}</td>
                  <td className="px-4 py-3 text-gray-500">{p.type}</td>
                  <td className="px-4 py-3 text-gray-800 max-w-[160px] truncate">{p.draftValue}</td>
                  <td className="px-4 py-3">
                    {p.hasDraftChange ? <Badge color="amber">Unpublished</Badge> : <Badge color="green">Published</Badge>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <Button variant="link" onClick={() => openEdit(p)}>
                      {canEdit ? "Edit" : "View"}
                    </Button>
                    {canEdit && (
                      <Button variant="danger" onClick={() => handleDelete(p)}>Delete</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ParamModal initial={editingParam} onClose={() => setIsModalOpen(false)} onSave={handleSave} canEdit={canEdit} />
      )}
    </div>
  );
}

function TabBar({ tabs, active, onChange }) {
  return (
    <div className="flex border-b border-gray-200 mb-4 -mx-6 px-6">
      {tabs.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={`mr-4 pb-2 text-sm font-medium border-b-2 transition ${
            active === t
              ? "border-gray-900 text-gray-900"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
function ConditionsPanel({ param, canEdit }) {
  const { conditions, getParamConditions, attachCondition, updateConditionLink, detachCondition } = useConfig();

  const [links, setLinks] = useState([]);
  const [loadingLinks, setLoadingLinks] = useState(true);
  const [selectedConditionId, setSelectedConditionId] = useState("");
  const [overrideValue, setOverrideValue] = useState("");
  const [priority, setPriority] = useState(0);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [editOverride, setEditOverride] = useState("");
  const [editPriority, setEditPriority] = useState(0);

  async function reload() {
    const data = await getParamConditions(param.id);
    setLinks(Array.isArray(data) ? data : []);
    setLoadingLinks(false);
  }

  useEffect(() => {
    reload();
  }, [param.id]);
  const attachedIds = new Set(links.map((l) => l.conditionId));
  const available = conditions.filter((c) => !attachedIds.has(c.id));

  async function handleAttach(e) {
    e.preventDefault();
    if (!selectedConditionId) return setAddError("Select a condition");
    if (overrideValue.trim() === "") return setAddError("Override value is required");
    setAddError("");
    setAdding(true);
    const result = await attachCondition(param.id, Number(selectedConditionId), overrideValue.trim(), Number(priority));
    setAdding(false);
    if (result?.error) {
      setAddError(result.error);
      return;
    }
    setSelectedConditionId("");
    setOverrideValue("");
    setPriority(0);
    await reload();
  }

  async function handleSaveEdit(linkId) {
    await updateConditionLink(param.id, linkId, editOverride, Number(editPriority));
    setEditingLinkId(null);
    await reload();
  }

  async function handleDetach(linkId) {
    await detachCondition(param.id, linkId);
    await reload();
  }

  function startEdit(link) {
    setEditingLinkId(link.id);
    setEditOverride(link.overrideValue);
    setEditPriority(link.priority);
  }

  return (
    <div className="space-y-3">
      {/* Attached conditions list */}
      {loadingLinks && (
        <p className="text-xs text-gray-400 py-4 text-center">Loading…</p>
      )}
      {!loadingLinks && links.length === 0 && (
        <p className="text-xs text-gray-400 py-4 text-center border border-gray-200 rounded-lg">No conditions attached yet</p>
      )}
      {links.map((link) => (
        <div key={link.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
          {editingLinkId === link.id ? (
            /* Edit mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-700">{link.conditionName}</span>
                <span className="text-xs font-mono text-gray-400">{link.ruleExpression}</span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="flex-1 min-w-24">
                  <label className="block text-xs text-gray-500 mb-1">Override value</label>
                  <input
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editOverride}
                    onChange={(e) => setEditOverride(e.target.value)}
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-gray-500 mb-1">Priority</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="secondary" onClick={() => setEditingLinkId(null)}>Cancel</Button>
                <Button onClick={() => handleSaveEdit(link.id)}>Save</Button>
              </div>
            </div>
          ) : (
            /* View mode */
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-0.5 min-w-0">
                <p className="text-xs font-semibold text-gray-800">{link.conditionName}</p>
                <p className="text-xs font-mono text-gray-400">{link.ruleExpression}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-right">
                  <p className="text-xs text-gray-500">Override</p>
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{link.overrideValue}</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Priority</p>
                  <p className="text-xs font-medium text-gray-700">{link.priority}</p>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEdit(link)}
                      className="text-xs text-indigo-600 hover:text-indigo-800 px-2 py-1 rounded hover:bg-indigo-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDetach(link.id)}
                      className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Attach new condition form */}
      {canEdit && (
        <form onSubmit={handleAttach} className="border border-dashed border-gray-300 rounded-lg p-3 space-y-3">
          <p className="text-xs font-medium text-gray-600">Attach a condition</p>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Condition</label>
            <select
              value={selectedConditionId}
              onChange={(e) => setSelectedConditionId(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select condition…</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>{c.name} — {c.ruleExpression}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">Override value</label>
              <input
                type="text"
                placeholder="e.g. true"
                value={overrideValue}
                onChange={(e) => setOverrideValue(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-500 mb-1">Priority</label>
              <input
                type="number"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {available.length === 0 && (
            <p className="text-xs text-gray-400">All conditions are already attached or none exist yet.</p>
          )}
          {addError && <p className="text-xs text-red-600">{addError}</p>}
          <div className="flex justify-end">
            <Button type="submit" disabled={adding}>
              {adding ? "Attaching…" : "Attach"}
            </Button>
          </div>
        </form>
      )}
      <p className="text-xs text-gray-400">Lower priority number = evaluated first. First match wins.</p>
    </div>
  );
}
function ConditionsPanelFooter({ onClose }) {
  return (
    <div className="flex justify-end pt-2">
      <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
    </div>
  );
}
function ParamModal({ initial, onClose, onSave, canEdit }) {
  const [activeTab, setActiveTab] = useState("Value");
  const [key, setKey] = useState(initial?.key || "");
  const [type, setType] = useState(initial?.type || "String");
  const [defaultValue, setDefaultValue] = useState(initial?.draftValue || "");
  const tabs = initial ? ["Value", "Conditions"] : ["Value"];

  function handleSubmit(e) {
    e.preventDefault();
    if (!key.trim()) return;
    onSave({ key, type, defaultValue });
  }

  return (
    <Modal title={initial ? `Edit — ${initial.key}` : "Add parameter"} onClose={onClose}>
      {tabs.length > 1 && (
        <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />
      )}
      {activeTab === "Value" && (
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
      )}
      {activeTab === "Conditions" && initial && (
        <>
          <ConditionsPanel param={initial} canEdit={canEdit} />
          <ConditionsPanelFooter onClose={onClose} />
        </>
      )}
    </Modal>
  );
}