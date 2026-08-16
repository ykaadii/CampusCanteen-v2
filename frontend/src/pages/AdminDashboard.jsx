import { useState, useEffect } from "react";
import { api } from "../api/axios";
import DashboardShell from "../components/DashboardShell";
import AssignStaffModal from "../components/AssignStaffModal";
import AssignOwnerModal from "../components/AssignOwnerModal";
import EditCanteenPhotoModal from "../components/EditCanteenPhotoModal";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("canteens");
  const [campuses, setCampuses] = useState([]);
  const [canteens, setCanteens] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Forms state
  const [newCampus, setNewCampus] = useState({ name: "", city: "" });
  const [newCanteen, setNewCanteen] = useState({ name: "", campusId: "" });
  const [canteenImageFile, setCanteenImageFile] = useState(null);

  // Assign Staff Modal state
  const [selectedCanteenForStaff, setSelectedCanteenForStaff] = useState(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Assign Owner Modal state
  const [selectedCanteenForOwner, setSelectedCanteenForOwner] = useState(null);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);

  // Edit Canteen Photo Modal state
  const [selectedCanteenForPhoto, setSelectedCanteenForPhoto] = useState(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    setError("");
    try {
      const [campusesRes, canteensRes, usersRes] = await Promise.all([
        api.get("/campuses"),
        api.get("/canteens"),
        api.get("/admin/users"),
      ]);
      setCampuses(campusesRes.data.campuses);
      setCanteens(canteensRes.data.canteens);
      setUsers(usersRes.data.users);

      // Keep selected canteen fresh if modal is open
      if (selectedCanteenForStaff) {
        const updated = canteensRes.data.canteens.find((c) => c.id === selectedCanteenForStaff.id);
        if (updated) setSelectedCanteenForStaff(updated);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCampus(e) {
    e.preventDefault();
    try {
      await api.post("/campuses", newCampus);
      setNewCampus({ name: "", city: "" });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create campus");
    }
  }

  async function handleDeleteCampus(id) {
    if (!confirm("Are you sure you want to delete this campus?")) return;
    try {
      await api.delete(`/campuses/${id}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete campus");
    }
  }

  async function handleCreateCanteen(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", newCanteen.name);
      formData.append("campusId", newCanteen.campusId);
      if (canteenImageFile) {
        formData.append("image", canteenImageFile);
      }

      await api.post("/canteens", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setNewCanteen({ name: "", campusId: "" });
      setCanteenImageFile(null);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to create canteen");
    }
  }

  async function handleToggleCanteenOpen(canteen) {
    try {
      await api.put(`/canteens/${canteen.id}`, { isOpen: !canteen.isOpen });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update canteen status");
    }
  }

  async function handleDeleteCanteen(id) {
    if (!confirm("Are you sure you want to delete this canteen?")) return;
    try {
      await api.delete(`/canteens/${id}`);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete canteen");
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update user role");
    }
  }

  async function handleAssignStaff(canteenId, userId) {
    await api.post(`/canteens/${canteenId}/staff`, { userId });
    await fetchAdminData();
  }

  async function handleRemoveStaff(canteenId, userId) {
    await api.delete(`/canteens/${canteenId}/staff/${userId}`);
    await fetchAdminData();
  }

  async function handleAssignOwner(canteenId, userId) {
    await api.post(`/canteens/${canteenId}/owner`, { userId });
    await fetchAdminData();
  }

  async function handleRemoveOwner(canteenId, userId) {
    await api.delete(`/canteens/${canteenId}/owner/${userId}`);
    await fetchAdminData();
  }

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Admin Management Panel</h1>
            <p className="text-sm text-gray-500">Configure campuses, canteens, assign staff, upload photos, and manage user roles.</p>
          </div>

          <div className="flex items-center gap-2 bg-gray-200/70 p-1 rounded-xl text-sm font-medium">
            <button
              onClick={() => setActiveTab("campuses")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "campuses" ? "bg-white text-black shadow-xs font-semibold" : "text-gray-600 hover:text-black"
              }`}
            >
              Campuses ({campuses.length})
            </button>
            <button
              onClick={() => setActiveTab("canteens")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "canteens" ? "bg-white text-black shadow-xs font-semibold" : "text-gray-600 hover:text-black"
              }`}
            >
              Canteens & Staff ({canteens.length})
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-4 py-1.5 rounded-lg transition-all ${
                activeTab === "users" ? "bg-white text-black shadow-xs font-semibold" : "text-gray-600 hover:text-black"
              }`}
            >
              Users & Roles ({users.length})
            </button>
          </div>
        </div>

        {error && <p className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</p>}

        {loading ? (
          <div className="py-12 text-center text-gray-500 text-sm">Loading admin details...</div>
        ) : (
          <>
            {/* CAMPUSES TAB */}
            {activeTab === "campuses" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-4">
                  <h3 className="text-base font-semibold">Add New Campus</h3>
                  <form onSubmit={handleCreateCampus} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Campus Name</label>
                      <input
                        type="text"
                        required
                        value={newCampus.name}
                        onChange={(e) => setNewCampus({ ...newCampus, name: e.target.value })}
                        placeholder="e.g. Main Campus"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newCampus.city}
                        onChange={(e) => setNewCampus({ ...newCampus, city: e.target.value })}
                        placeholder="e.g. Tech City"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-2 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      + Create Campus
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-sm">
                    Registered Campuses
                  </div>
                  <div className="divide-y divide-gray-100">
                    {campuses.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500">No campuses registered yet.</p>
                    ) : (
                      campuses.map((campus) => (
                        <div key={campus.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50">
                          <div>
                            <h4 className="font-semibold text-gray-900">{campus.name}</h4>
                            <p className="text-xs text-gray-500">
                              City: {campus.city} • {campus._count?.canteens || 0} canteens attached
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCampus(campus.id)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* CANTEENS TAB */}
            {activeTab === "canteens" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-4">
                  <h3 className="text-base font-semibold">Add New Canteen</h3>
                  <form onSubmit={handleCreateCanteen} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Select Campus</label>
                      <select
                        required
                        value={newCanteen.campusId}
                        onChange={(e) => setNewCanteen({ ...newCanteen, campusId: e.target.value })}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      >
                        <option value="">-- Choose Campus --</option>
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.city})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Canteen Name</label>
                      <input
                        type="text"
                        required
                        value={newCanteen.name}
                        onChange={(e) => setNewCanteen({ ...newCanteen, name: e.target.value })}
                        placeholder="e.g. Central Student Food Court"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Canteen Cover Photo (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCanteenImageFile(e.target.files[0])}
                        className="w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                    </div>
                    <button
                      type="submit"
                      className="mt-2 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      + Create Canteen
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-sm">
                    Canteens & Assigned Staff
                  </div>
                  <div className="divide-y divide-gray-100">
                    {canteens.length === 0 ? (
                      <p className="p-6 text-sm text-gray-500">No canteens registered yet.</p>
                    ) : (
                      canteens.map((canteen) => (
                        <div key={canteen.id} className="p-5 flex flex-col gap-3 hover:bg-gray-50/50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              {canteen.imageUrl ? (
                                <img
                                  src={canteen.imageUrl}
                                  alt={canteen.name}
                                  className="w-14 h-14 rounded-xl object-cover border border-gray-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-xl text-gray-400">
                                  🏪
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-bold text-gray-900">{canteen.name}</h4>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                      canteen.isOpen ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                                    }`}
                                  >
                                    {canteen.isOpen ? "Open" : "Closed"}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  Campus: {canteen.campus?.name} • {canteen._count?.menuItems || 0} menu items
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedCanteenForPhoto(canteen);
                                  setIsPhotoModalOpen(true);
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors border border-gray-300 shadow-2xs"
                              >
                                Change Photo
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedCanteenForOwner(canteen);
                                  setIsOwnerModalOpen(true);
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <span>Assign Owner</span>
                                <span className="bg-amber-700 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                                  {canteen.owners?.length || 0}
                                </span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedCanteenForStaff(canteen);
                                  setIsAssignModalOpen(true);
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-black text-white hover:bg-gray-800 transition-colors flex items-center gap-1 shadow-xs"
                              >
                                <span>Assign Staff</span>
                                <span className="bg-gray-700 text-white px-1.5 py-0.2 rounded-full text-[10px]">
                                  {canteen.staff?.length || 0}
                                </span>
                              </button>

                              <button
                                onClick={() => handleToggleCanteenOpen(canteen)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-medium border ${
                                  canteen.isOpen
                                    ? "border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100"
                                    : "border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100"
                                }`}
                              >
                                {canteen.isOpen ? "Close Canteen" : "Open Canteen"}
                              </button>

                              <button
                                onClick={() => handleDeleteCanteen(canteen.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>

                          {/* Currently Assigned Owners List Badges */}
                          {canteen.owners && canteen.owners.length > 0 && (
                            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/70">
                              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-1.5">
                                Assigned Canteen Owner(s):
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {canteen.owners.map((o) => (
                                  <div
                                    key={o.id || o.user?.id}
                                    className="flex items-center gap-1.5 bg-white border border-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-900 shadow-2xs"
                                  >
                                    <span>Owner: {o.user?.name || "Canteen Owner"}</span>
                                    <span className="text-[10px] text-amber-700 font-normal">({o.user?.email})</span>
                                    <button
                                      onClick={() => handleRemoveOwner(canteen.id, o.userId || o.user?.id)}
                                      className="text-amber-500 hover:text-red-600 font-bold ml-1"
                                      title="Remove owner assignment"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Currently Assigned Staff List Badges */}
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                              Assigned Canteen Staff:
                            </div>
                            {!canteen.staff || canteen.staff.length === 0 ? (
                              <p className="text-xs text-gray-400 italic">No staff assigned yet. Click "Assign Staff" above to add staff.</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {canteen.staff.map((s) => (
                                  <div
                                    key={s.id || s.user?.id}
                                    className="flex items-center gap-1.5 bg-white border border-gray-200 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-800 shadow-2xs"
                                  >
                                    <span>👤 {s.user?.name || "Staff Member"}</span>
                                    <span className="text-[10px] text-gray-400">({s.user?.email})</span>
                                    <button
                                      onClick={() => handleRemoveStaff(canteen.id, s.userId || s.user?.id)}
                                      className="text-gray-400 hover:text-red-600 font-bold ml-1"
                                      title="Remove staff assignment"
                                    >
                                      &times;
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-sm flex items-center justify-between">
                  <span>Platform Users ({users.length})</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-3">User</th>
                        <th className="px-6 py-3">Current Role</th>
                        <th className="px-6 py-3">Assigned Staff Canteen(s)</th>
                        <th className="px-6 py-3 text-right">Actions / Change Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">{u.name}</div>
                            <div className="text-xs text-gray-500">{u.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                u.role === "ADMIN"
                                  ? "bg-purple-100 text-purple-800"
                                  : u.role === "CANTEEN_STAFF"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            {u.staffCanteens && u.staffCanteens.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {u.staffCanteens.map((sc) => (
                                  <span key={sc.canteenId} className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-[11px] font-medium">
                                    {sc.canteen?.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">None</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-black focus:outline-none"
                            >
                              <option value="STUDENT">STUDENT</option>
                              <option value="CANTEEN_STAFF">CANTEEN_STAFF</option>
                              <option value="CANTEEN_OWNER">CANTEEN_OWNER</option>
                              <option value="ADMIN">ADMIN</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Staff Assignment Modal */}
      <AssignStaffModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        canteen={selectedCanteenForStaff}
        allUsers={users}
        onAssignStaff={handleAssignStaff}
        onRemoveStaff={handleRemoveStaff}
      />

      {/* Canteen Owner Assignment Modal */}
      <AssignOwnerModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        canteen={selectedCanteenForOwner}
        allUsers={users}
        onAssignOwner={handleAssignOwner}
        onRemoveOwner={handleRemoveOwner}
      />

      {/* Edit Canteen Cover Photo Modal */}
      <EditCanteenPhotoModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        canteen={selectedCanteenForPhoto}
        onPhotoUpdated={fetchAdminData}
      />
    </DashboardShell>
  );
}
