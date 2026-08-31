import { useConfig } from "../context/useConfig";

export default function AuditLogPage() {
  const { auditLog } = useConfig();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold">Audit Log</h2>
        <p className="text-sm text-gray-500">Who changed what, when.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400">No activity yet</td></tr>
              )}
              {auditLog.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-600">{entry.action}</td>
                  <td className="px-4 py-3 font-mono text-gray-800 break-all">{entry.target}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}