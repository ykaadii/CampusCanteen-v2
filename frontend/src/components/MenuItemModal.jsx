import { useState, useEffect } from "react";

export default function MenuItemModal({ isOpen, onClose, onSave, item = null, canteenId }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    isAvailable: true,
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item) {
      setForm({
        name: item.name || "",
        description: item.description || "",
        price: item.price || "",
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
      });
    } else {
      setForm({
        name: "",
        description: "",
        price: "",
        isAvailable: true,
      });
    }
    setFile(null);
    setError("");
  }, [item, isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("canteenId", canteenId);
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("isAvailable", form.isAvailable);

      if (file) {
        formData.append("image", file);
      }

      await onSave(formData, item?.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save menu item");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{item ? "Edit Menu Item" : "Add Menu Item"}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {error && <p className="text-sm text-red-600 bg-red-50 p-2.5 rounded-md border border-red-200">{error}</p>}

          <div>
            <label className="block text-sm font-medium mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="e.g. Paneer Butter Masala"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="Short item description..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="e.g. 150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Image Upload (Cloudinary)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isAvailable"
              checked={form.isAvailable}
              onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
              className="rounded text-black focus:ring-black h-4 w-4"
            />
            <label htmlFor="isAvailable" className="text-sm font-medium text-gray-700">
              Available for Ordering
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving..." : item ? "Update Item" : "Create Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
