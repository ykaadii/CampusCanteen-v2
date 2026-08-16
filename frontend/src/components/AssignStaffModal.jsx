import { useState } from "react";

export default function AssignStaffModal({
  isOpen,
  onClose,
  canteen,
  allUsers,
  onAssignStaff,
  onRemoveStaff,
}) {
  const [search, setSearch] = useState("");
  const [loadingUserId, setLoadingUserId] = useState(null);

  if (!isOpen || !canteen) return null;

  const assignedUserIds = new Set(canteen.staff?.map((s) => s.userId || s.user?.id) || []);

  const filteredUsers = allUsers.filter((u) => {
    const query = search.toLowerCase();
    return u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
  });

  async function handleAssign(userId) {
    setLoadingUserId(userId);
    try {
      await onAssignStaff(canteen.id, userId);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to assign staff member");
    } finally {
      setLoadingUserId(null);
    }
  }

  async function handleRemove(userId) {
    setLoadingUserId(userId);
    try {
      await onRemoveStaff(canteen.id, userId);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to remove staff member");
    } finally {
      setLoadingUserId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
          <div>
            <h2 className="text-base font-bold text-gray-900">Manage Canteen Staff</h2>
            <p className="text-xs text-gray-500">
              Assign staff members to <span className="font-semibold text-black">{canteen.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
          >
            &times;
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search users by name or email..."
            className="w-full rounded-xl border border-gray-300 px-3.5 py-2 text-sm focus:border-black focus:outline-none"
          />
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-100">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-400">No users found matching search.</div>
          ) : (
            filteredUsers.map((user) => {
              const isAssigned = assignedUserIds.has(user.id);
              const isLoading = loadingUserId === user.id;

              return (
                <div key={user.id} className="py-3 px-2 flex items-center justify-between hover:bg-gray-50/70 rounded-xl transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          user.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "CANTEEN_STAFF"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>

                  <div>
                    {isAssigned ? (
                      <button
                        onClick={() => handleRemove(user.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold rounded-lg border border-rose-200 disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? "Removing..." : "Remove Staff"}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssign(user.id)}
                        disabled={isLoading}
                        className="px-3 py-1 bg-black text-white hover:bg-gray-800 text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors"
                      >
                        {isLoading ? "Assigning..." : "+ Assign Staff"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {canteen.staff?.length || 0} staff member(s) assigned
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
