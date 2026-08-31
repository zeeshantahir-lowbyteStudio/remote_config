import { useState, useEffect, useCallback } from "react";
import { useConfig } from "../context/useConfig";
import { apiFetch } from "../lib/api";
import { hasRole } from "../lib/roles";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { RefreshCw, Trash2 } from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";

const GROUP_OPTIONS = [
  { value: "minute", label: "Per Minute" },
  { value: "hour",   label: "Per Hour"   },
  { value: "day",    label: "Per Day"    },
  { value: "week",   label: "Per Week"   },
  { value: "month",  label: "Per Month"  },
];

const PRESETS = [
  { label: "Last 30 min", minutes: 30 },
  { label: "Last 1 hr",   minutes: 60 },
  { label: "Last 24 hrs", minutes: 60 * 24 },
  { label: "Last 7 days", minutes: 60 * 24 * 7 },
  { label: "Last 30 days",minutes: 60 * 24 * 30 },
  { label: "Custom",      minutes: null },
];

function toLocalDatetimeValue(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function StatCard({ label, value, sub, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-700",
    green:  "bg-green-50  text-green-700",
    red:    "bg-red-50    text-red-700",
    gray:   "bg-gray-50   text-gray-700",
  };
  return (
    <div className={`rounded-lg px-4 py-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold mt-0.5">{value?.toLocaleString() ?? "—"}</p>
      {sub && <p className="text-xs opacity-60 mt-0.5">{sub}</p>}
    </div>
  );
}

function RetentionModal({ app, onClose, onSaved }) {
  const [days, setDays] = useState(app.logRetentionDays ?? 90);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e) {
    e.preventDefault();
    if (!days || Number(days) < 1) return setError("Must be at least 1 day");
    setSaving(true);
    const res = await apiFetch(`/api/apps/${app.id}/retention`, {
      method: "PUT",
      body: JSON.stringify({ days: Number(days) }),
    });
    setSaving(false);
    if (res?.error) return setError(res.error);
    onSaved(Number(days));
    onClose();
  }

  return (
    <Modal title="Log retention" onClose={onClose}>
      <form onSubmit={handleSave} className="space-y-4">
        <p className="text-sm text-gray-500">
          Logs older than this many days are automatically deleted by the server cron (runs hourly).
        </p>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Retention period (days)</label>
          <input
            type="number"
            min={1}
            max={3650}
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

// Purge logs confirmation modal
function PurgeModal({ app, from, to, onClose, onPurged }) {
  const [purging, setPurging] = useState(false);

  async function handlePurge() {
    setPurging(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to)   params.set("to",   to);
    await apiFetch(`/api/apps/${app.id}/logs?${params}`, { method: "DELETE" });
    setPurging(false);
    onPurged();
    onClose();
  }

  return (
    <Modal title="Purge logs" onClose={onClose}>
      <p className="text-sm text-gray-600 mb-5">
        This will permanently delete all request logs for <strong>{app.name}</strong>
        {from || to ? " within the selected date range" : " (all time)"}. This cannot be undone.
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <button
          onClick={handlePurge}
          disabled={purging}
          className="text-sm font-medium px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {purging ? "Purging…" : "Yes, delete logs"}
        </button>
      </div>
    </Modal>
  );
}

export default function TrafficPage({ user }) {
  const { apps } = useConfig();
  const isAdmin = hasRole(user, "admin");

  // Selected app
  const [selectedAppId, setSelectedAppId] = useState("");

  // Filters
  const [preset, setPreset]     = useState(PRESETS[4]); // Last 30 days
  const [groupBy, setGroupBy]   = useState("day");
  const [action, setAction]     = useState("all");
  const [fromDt, setFromDt]     = useState(() => toLocalDatetimeValue(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const [toDt, setToDt]         = useState(() => toLocalDatetimeValue(Date.now()));

  // Data
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // Modals
  const [showRetention, setShowRetention] = useState(false);
  const [showPurge, setShowPurge]         = useState(false);

  // Pick first app by default when apps load
  useEffect(() => {
    if (apps.length > 0 && !selectedAppId) setSelectedAppId(String(apps[0].id));
  }, [apps]);

  // When preset changes, update fromDt/toDt
  function applyPreset(p) {
    setPreset(p);
    if (p.minutes) {
      setFromDt(toLocalDatetimeValue(Date.now() - p.minutes * 60 * 1000));
      setToDt(toLocalDatetimeValue(Date.now()));
      // Auto groupBy based on range
      if (p.minutes <= 60)           setGroupBy("minute");
      else if (p.minutes <= 60 * 24) setGroupBy("hour");
      else if (p.minutes <= 60 * 24 * 7) setGroupBy("day");
      else setGroupBy("day");
    }
  }

  const fetchStats = useCallback(async () => {
    if (!selectedAppId) return;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      from: new Date(fromDt).toISOString(),
      to:   new Date(toDt).toISOString(),
      groupBy,
      action,
    });
    const data = await apiFetch(`/api/apps/${selectedAppId}/stats?${params}`);
    setLoading(false);
    if (!data || data.error) {
      setError(data?.error || "Failed to load stats");
      return;
    }
    setStats(data);
  }, [selectedAppId, fromDt, toDt, groupBy, action]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const selectedApp = apps.find((a) => String(a.id) === selectedAppId);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Traffic Monitor</h2>
          <p className="text-sm text-gray-500">Request logs per app — config fetches and event tracks.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && selectedApp && (
            <>
              <button
                onClick={() => setShowRetention(true)}
                className="text-xs text-gray-500 hover:text-indigo-600 border border-gray-300 rounded px-3 py-1.5 whitespace-nowrap"
              >
                Retention: {stats?.app?.logRetentionDays ?? selectedApp.logRetentionDays ?? 90}d
              </button>
              <button
                onClick={() => setShowPurge(true)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 rounded px-3 py-1.5 whitespace-nowrap"
              >
                <Trash2 size={12} /> Purge logs
              </button>
            </>
          )}
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 border border-gray-300 rounded px-3 py-1.5 disabled:opacity-50 whitespace-nowrap"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-3 items-end">
        {/* App selector */}
        <div className="w-full sm:w-auto">
          <label className="block text-xs text-gray-500 mb-1">App</label>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {apps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        {/* Quick presets */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quick range</label>
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`text-xs px-2.5 py-1.5 rounded border transition ${
                  preset.label === p.label
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom date range — shown always, editable when Custom selected */}
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end w-full sm:w-auto">
          <div>
            <label className="block text-xs text-gray-500 mb-1">From</label>
            <input
              type="datetime-local"
              value={fromDt}
              onChange={(e) => { setFromDt(e.target.value); setPreset(PRESETS[5]); }}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">To</label>
            <input
              type="datetime-local"
              value={toDt}
              onChange={(e) => { setToDt(e.target.value); setPreset(PRESETS[5]); }}
              className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Group by</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {GROUP_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All actions</option>
            <option value="config_fetch">Config fetch</option>
            <option value="event_track">Event track</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-lg">{error}</div>
      )}
      {stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Total requests"  value={stats.summary.total}       color="indigo" />
            <StatCard label="Successful"      value={stats.summary.success}     color="green"  sub="2xx responses" />
            <StatCard label="Errors"          value={stats.summary.errors}      color="red"    sub="4xx / 5xx" />
            <StatCard label="Unique users"    value={stats.summary.uniqueUsers} color="gray"   />
          </div>

        
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium mb-4">Requests over time</h3>
            {stats.timeSeries.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-sm text-gray-400">
                No data for this range
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.timeSeries} margin={{ top: 4, right: 8, left: -10, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: "#6b7280" }}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: "1px solid #e5e7eb" }}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="success" name="Success" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="errors"  name="Errors"  fill="#ef4444" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">By action</h3>
              {stats.byAction.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <div className="space-y-2">
                  {stats.byAction.map((row) => {
                    const pct = stats.summary.total > 0 ? Math.round((row.total / stats.summary.total) * 100) : 0;
                    return (
                      <div key={row.action}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 font-mono">{row.action}</span>
                          <span className="text-gray-800 font-medium">{row.total.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">By platform</h3>
              {stats.byPlatform.length === 0 ? (
                <p className="text-sm text-gray-400">No data</p>
              ) : (
                <div className="space-y-2">
                  {stats.byPlatform.map((row) => {
                    const pct = stats.summary.total > 0 ? Math.round((row.total / stats.summary.total) * 100) : 0;
                    const colors = { ios: "bg-blue-500", android: "bg-green-500", web: "bg-purple-500" };
                    const bar = colors[row.platform] || "bg-gray-400";
                    return (
                      <div key={row.platform}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 capitalize">{row.platform}</span>
                          <span className="text-gray-800 font-medium">{row.total.toLocaleString()} ({pct}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${bar} h-1.5 rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center h-48 text-sm text-gray-400">Loading stats…</div>
      )}

      {showRetention && selectedApp && (
        <RetentionModal
          app={{ ...selectedApp, logRetentionDays: stats?.app?.logRetentionDays ?? selectedApp.logRetentionDays ?? 90 }}
          onClose={() => setShowRetention(false)}
          onSaved={(days) => setStats((s) => s ? { ...s, app: { ...s.app, logRetentionDays: days } } : s)}
        />
      )}
      {showPurge && selectedApp && (
        <PurgeModal
          app={selectedApp}
          from={fromDt ? new Date(fromDt).toISOString() : null}
          to={toDt   ? new Date(toDt).toISOString()   : null}
          onClose={() => setShowPurge(false)}
          onPurged={fetchStats}
        />
      )}
    </div>
  );
}
