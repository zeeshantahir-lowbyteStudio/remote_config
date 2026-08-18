import { useState } from "react";
import { useConfig } from "../context/useConfig";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";

const statusColor = { running: "green", paused: "amber", completed: "gray", draft: "indigo" };

export default function ExperimentsPage() {
  const { experiments, params, addExperiment, setExperimentStatus } = useConfig();
  const [isModalOpen, setIsModalOpen] = useState(false);

  function handleCreate(data) {
    addExperiment(data);
    setIsModalOpen(false);
  }

  function conversionRate(variant) {
    if (!variant.users) return "0%";
    return `${((variant.conversions / variant.users) * 100).toFixed(1)}%`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-semibold">A/B Testing</h2>
          <p className="text-sm text-gray-500">Run experiments on a parameter and compare variant performance.</p>
        </div>
        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>+ New experiment</Button>
      </div>

      <div className="space-y-4">
        {experiments.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-10 text-center text-gray-400 text-sm">
            No experiments yet
          </div>
        )}
        {experiments.map((exp) => (
          <div key={exp.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold">{exp.name}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={statusColor[exp.status]}>{exp.status}</Badge>
                {exp.status === "draft" && (
                  <Button variant="link" onClick={() => setExperimentStatus(exp.id, "running")}>Start</Button>
                )}
                {exp.status === "running" && (
                  <Button variant="link" onClick={() => setExperimentStatus(exp.id, "paused")}>Pause</Button>
                )}
                {exp.status === "paused" && (
                  <Button variant="link" onClick={() => setExperimentStatus(exp.id, "running")}>Resume</Button>
                )}
                {(exp.status === "running" || exp.status === "paused") && (
                  <Button variant="danger" onClick={() => setExperimentStatus(exp.id, "completed")}>Complete</Button>
                )}
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Variant</th>
                  <th className="py-2 font-medium">Value</th>
                  <th className="py-2 font-medium">Split</th>
                  <th className="py-2 font-medium">Users</th>
                  <th className="py-2 font-medium">Conversions</th>
                  <th className="py-2 font-medium">Rate</th>
                </tr>
              </thead>
              <tbody>
                {exp.variants.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 font-medium">{v.name}</td>
                    <td className="py-2 font-mono text-gray-600">{v.value}</td>
                    <td className="py-2">{v.splitPercent}%</td>
                    <td className="py-2">{v.users}</td>
                    <td className="py-2">{v.conversions}</td>
                    <td className="py-2 font-medium text-indigo-700">{conversionRate(v)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ExperimentModal params={params} onClose={() => setIsModalOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}

function ExperimentModal({ params, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [paramKey, setParamKey] = useState(params[0]?.key || "");
  const [variantA, setVariantA] = useState("");
  const [variantB, setVariantB] = useState("");
  const [split, setSplit] = useState(50);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !variantA.trim() || !variantB.trim()) return;
    onCreate({
      name,
      paramKey,
      variants: [
        { name: "Control", value: variantA, split: Number(split) },
        { name: "Variant B", value: variantB, split: 100 - Number(split) },
      ],
    });
  }

  return (
    <Modal title="New experiment" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Experiment name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Button color test" required />
        <Select label="Target parameter" value={paramKey} onChange={(e) => setParamKey(e.target.value)}>
          {params.map((p) => <option key={p.id} value={p.key}>{p.key}</option>)}
        </Select>
        <Input label="Control value" value={variantA} onChange={(e) => setVariantA(e.target.value)} required />
        <Input label="Variant B value" value={variantB} onChange={(e) => setVariantB(e.target.value)} required />
        <Input
          label={`Traffic split (Control ${split}% / Variant B ${100 - split}%)`}
          type="range"
          min={0}
          max={100}
          value={split}
          onChange={(e) => setSplit(e.target.value)}
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create experiment</Button>
        </div>
      </form>
    </Modal>
  );
}