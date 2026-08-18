export default function Select({ label, children, className = "", ...props }) {
  return (
    <div>
      {label && <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>}
      <select
        className={`w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}