import { useState } from "react";

export default function AssignOwnerModal({
  isOpen,
  onClose,
  canteen,
  allUsers,
  onAssignOwner,
  onRemoveOwner,
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !canteen) return null;

  const currentOwnerUserIds = new Set(canteen.owners?.map((o) => o.userId || o.user?.id) || []);
  const availableUsers = allUsers.filter((u) => !currentOwnerUserIds.has(u.id));

  async function handleAssign(e) {
    e.preventDefault();
    if (!selectedUserId) return;

    setSubmitting(true);
    setError("");
    try {
      await onAssignOwner(canteen.id, selectedUserId);
      setSelectedUserId("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to assign canteen owner");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(userId) {
    if (!confirm("Are you sure you want to remove this owner from the canteen?")) return;
    try {
      await onRemoveOwner(canteen.id, userId);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove canteen owner");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-xl flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-lg text-gray-900">👑 Manage Canteen Owners</h3>
            <p className="text-xs text-gray-500">
              Assigned owners gain full access to revenue reports & sales analytics for <strong>{canteen.name}</strong>.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black font-bold text-xl">
            &times;
          </button>
        </div>

        {/* Currently Assigned Owners List */}
        <div>
          <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider mb-2">
            Currently Assigned Owners ({canteen.owners?.length || 0})
          </h4>

          {!canteen.owners || canteen.owners.length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 p-3 rounded-xl border border-gray-200">
              No owner assigned yet to this canteen.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {canteen.owners.map((ownerItem) => (
                <div
                  key={ownerItem.id || ownerItem.user?.id}
                  className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200"
                >
                  <div>
                    <div className="text-sm font-bold text-amber-900">👑 {ownerItem.user?.name}</div>
                    <div className="text-xs text-amber-700">{ownerItem.user?.email}</div>
                  </div>
                  <button
                    onClick={() => handleRemove(ownerItem.userId || ownerItem.user?.id)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 bg-white px-2.5 py-1 rounded-lg border border-rose-200"
                  >
                    Remove Owner
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Owner Form */}
        <form onSubmit={handleAssign} className="flex flex-col gap-3 border-t border-gray-100 pt-4">
          <h4 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">
            Assign New Canteen Owner
          </h4>

          <div>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-medium focus:border-black focus:outline-none"
            >
              <option value="">-- Choose User to Assign as Owner --</option>
              {availableUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email}) — Current Role: {u.role}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedUserId}
              className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-xs"
            >
              {submitting ? "Assigning..." : "+ Assign as Canteen Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
