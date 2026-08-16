import { useState } from "react";
import { api } from "../api/axios";

export default function EditCanteenPhotoModal({ isOpen, onClose, canteen, onPhotoUpdated }) {
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !canteen) return null;

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!imageFile) {
      setError("Please select a new photo file first.");
      return;
    }

    setError("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", imageFile);

      await api.put(`/canteens/${canteen.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onPhotoUpdated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update canteen photo");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <h3 className="font-bold text-lg text-gray-900">Update Canteen Cover Photo</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-black font-bold text-xl">
            &times;
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Upload a new cover photo for <strong>{canteen.name}</strong> ({canteen.campus?.name}).
        </p>

        {/* Current / Preview Image */}
        <div className="w-full h-40 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 flex items-center justify-center">
          {previewUrl || canteen.imageUrl ? (
            <img
              src={previewUrl || canteen.imageUrl}
              alt={canteen.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-sm">No cover photo set</span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Select New Cover Photo</label>
            <input
              type="file"
              accept="image/*"
              required
              onChange={handleFileChange}
              className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !imageFile}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {uploading ? "Uploading Photo..." : "Save New Cover Photo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
