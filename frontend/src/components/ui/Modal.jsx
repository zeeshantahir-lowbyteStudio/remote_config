export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto my-auto p-6 max-h-[90vh] overflow-y-auto">
        {title && <h2 className="text-base font-semibold mb-4">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
