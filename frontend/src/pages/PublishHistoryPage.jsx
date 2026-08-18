import { useConfig } from "../context/useConfig";
import Badge from "../components/ui/Badge";

export default function PublishHistoryPage() {
  const { history } = useConfig();

  return (
    <div>
      <div className="mb-4">
        <h2 className="text-base font-semibold">Publish History</h2>
        <p className="text-sm text-gray-500">Every published version.</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
        {history.length === 0 && (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">No publishes yet</div>
        )}
        {history.map((h, i) => (
          <div key={h.id} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge color={i === 0 ? "green" : "gray"}>v{h.version}</Badge>
              <div>
                <div className="text-sm font-medium">{h.summary}</div>
                <div className="text-xs text-gray-500">
                  {new Date(h.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}