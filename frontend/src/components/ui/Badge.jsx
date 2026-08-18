export default function Badge({ children, color = "gray" }) {
  const colors = {
    gray: "bg-gray-100 text-gray-600",
    indigo: "bg-indigo-50 text-indigo-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[color]}`}>
      {children}
    </span>
  );
}