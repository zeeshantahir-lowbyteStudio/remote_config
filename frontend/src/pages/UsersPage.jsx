import { useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import Select from "../components/ui/Select";
import Badge from "../components/ui/Badge";

const ROLES = ["viewer", "editor", "publisher", "admin"];
const roleColor = { viewer: "gray", editor: "indigo", publisher: "green", admin: "red" };

export default function UsersPage({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold">Users</h2>
        <p className="text-sm text-gray-500">Manage roles for everyone with access to this workspace.</p>
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
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No users found</td></tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{u.name || "-"}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3">
                  {u.id === currentUser.id ? (
                    <Badge color={roleColor[u.role]}>{u.role} (you)</Badge>
                  ) : (
                    <Select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="w-36"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </Select>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}