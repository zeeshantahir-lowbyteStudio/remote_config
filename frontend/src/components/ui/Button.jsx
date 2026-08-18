export default function Button({ children, variant = "primary", className = "", ...props }) {
  const base = "text-sm font-medium px-4 py-2 rounded-md transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
    danger: "text-red-600 hover:underline text-xs font-medium px-0 py-0",
    link: "text-indigo-600 hover:underline text-xs font-medium px-0 py-0",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}