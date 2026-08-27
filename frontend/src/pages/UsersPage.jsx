import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Modal from "../components/ui/Modal";

const ROLES = ["viewer", "editor", "publisher", "admin"];
const roleColor = { viewer: "gray", editor: "indigo", publisher: "green", admin: "red" };
function SuccessAnimation({ email, onClose }) {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <div className="w-16 h-16 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-4 animate-bounce-once">
        <svg
          className="w-8 h-8 text-green-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "drawCheck 0.4s ease forwards" }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">Invitation sent!</h3>
      <p className="text-sm text-gray-500 mb-1">
        An email with login credentials has been sent to
      </p>
      <p className="text-sm font-medium text-indigo-600 mb-6">{email}</p>
      <Button onClick={onClose}>Done</Button>
    </div>
  );
}
function InviteModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ email: "", name: "", role: "viewer" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [done, setDone] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.email.trim()) return setError("Email is required");
    setError("");
    setLoading(true);

    const data = await apiFetch("/api/users/invite", {
      method: "POST",
      body: JSON.stringify({ email: form.email.trim(), name: form.name.trim() || undefined, role: form.role }),
    });

    setLoading(false);

    if (!data) return;

    if (data.error) {
      setError(data.error);
      return;
    }

    if (data.warning) setWarning(data.warning);
    onSuccess();
    setDone(true);
  }

  if (done) return (
    <Modal title="" onClose={onClose}>
      <SuccessAnimation email={form.email} onClose={onClose} />
    </Modal>
  );

  return (
    <Modal title="Invite user" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address *"
          type="email"
          placeholder="user@example.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          autoFocus
        />
        <Input
          label="Display name (optional)"
          type="text"
          placeholder="Jane Doe"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
        <Select
          label="Role"
          value={form.role}
          onChange={(e) => set("role", e.target.value)}
        >
          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>

        {error && (
          <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
        )}
        {warning && (
          <p className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-md">{warning}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Sending…" : "Send invite"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  async function loadUsers() {
    setLoading(true);
    const data = await apiFetch("/api/users");
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleRoleChange(userId, newRole) {
    await apiFetch(`/api/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role: newRole }),
    });
    await loadUsers();
  }
  const isAdmin = currentUser?.role === "admin";

  return (
    <div>
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-base font-semibold">Users</h2>
          <p className="text-sm text-gray-500">Manage roles for everyone with access to this workspace.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            + Invite user
          </Button>
        )}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">Loading…</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium">{u.name || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  {u.id === currentUser.id ? (
                    <Badge color={roleColor[u.role]}>{u.role} (you)</Badge>
                  ) : isAdmin ? (
                    <Select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="w-36"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  ) : (
                    <Badge color={roleColor[u.role]}>{u.role}</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onSuccess={loadUsers}
        />
      )}
    </div>
  );
}