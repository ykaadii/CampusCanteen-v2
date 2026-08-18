import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { socket, connectSocket } from "../api/socket";
import { useAuth } from "../context/AuthContext";
import DashboardShell from "../components/DashboardShell";
import StatusBadge from "../components/StatusBadge";
import MenuItemModal from "../components/MenuItemModal";

export default function CanteenDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("queue");
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);

  const [orders, setOrders] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Menu Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    connectSocket(user);

    // Fetch list of canteens assigned to this staff member
    api
      .get("/canteens")
      .then(({ data }) => {
        setCanteens(data.canteens);
        if (data.canteens.length > 0) {
          const firstCanteen = data.canteens[0];
          setSelectedCanteen(firstCanteen);
          fetchCanteenData(firstCanteen.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load assigned canteens");
        setLoading(false);
      });
  }, [user]);

  // Join canteen room in Socket.IO for live queue updates
  useEffect(() => {
    if (!selectedCanteen) return;

    socket.emit("join:canteen", selectedCanteen.id);

    function handleOrderCreated(newOrder) {
      if (newOrder.canteenId === selectedCanteen.id) {
        setOrders((prev) => [newOrder, ...prev]);
      }
    }

    function handleOrderUpdated(updatedOrder) {
      if (updatedOrder.canteenId === selectedCanteen.id) {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
      }
    }

    socket.on("order:created", handleOrderCreated);
    socket.on("order:updated", handleOrderUpdated);

    return () => {
      socket.off("order:created", handleOrderCreated);
      socket.off("order:updated", handleOrderUpdated);
    };
  }, [selectedCanteen]);

  async function fetchCanteenData(canteenId) {
    setLoading(true);
    setError("");
    try {
      const [ordersRes, canteenRes] = await Promise.all([
        api.get(`/orders/canteen/${canteenId}`),
        api.get(`/canteens/${canteenId}`),
      ]);
      setOrders(ordersRes.data.orders);
      setMenuItems(canteenRes.data.canteen.menuItems || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load canteen data");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectCanteen(e) {
    const canteenId = e.target.value;
    const found = canteens.find((c) => c.id === canteenId);
    if (found) {
      setSelectedCanteen(found);
      fetchCanteenData(canteenId);
    }
  }

  async function handleToggleCanteenStatus() {
    if (!selectedCanteen) return;
    try {
      const newStatus = !selectedCanteen.isOpen;
      const { data } = await api.put(`/canteens/${selectedCanteen.id}`, {
        isOpen: newStatus,
      });
      setSelectedCanteen(data.canteen);
      setCanteens((prev) =>
        prev.map((c) => (c.id === data.canteen.id ? data.canteen : c))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update canteen status");
    }
  }

  async function handleUpdateOrderStatus(orderId, nextStatus) {
    try {
      const { data } = await api.patch(`/orders/${orderId}/status`, {
        status: nextStatus,
      });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? data.order : o))
      );
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update order status");
    }
  }

  async function handleMarkCashPaid(orderId) {
    try {
      await api.patch(`/payments/order/${orderId}/cash-paid`);
      fetchCanteenData(selectedCanteen.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to mark cash paid");
    }
  }

  async function handleSaveMenuItem(formData) {
    try {
      if (editingItem) {
        await api.put(`/menu/${editingItem.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post(`/menu/canteen/${selectedCanteen.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      fetchCanteenData(selectedCanteen.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save menu item");
    }
  }

  async function handleToggleAvailability(item) {
    try {
      await api.patch(`/menu/${item.id}/availability`, {
        isAvailable: !item.isAvailable,
      });
      fetchCanteenData(selectedCanteen.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update availability");
    }
  }

  async function handleDeleteMenuItem(id) {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      const { data } = await api.delete(`/menu/${id}`);
      if (data.message) {
        alert(data.message);
      }
      fetchCanteenData(selectedCanteen.id);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to delete menu item");
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter === "ALL") return true;
    return order.status === statusFilter;
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Canteen Staff Portal</h1>
              {selectedCanteen && (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Live Queue</span>
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Manage live order queue, fulfill pre-orders, and configure menu items.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {canteens.length > 1 ? (
              <div>
                <select
                  value={selectedCanteen?.id || ""}
                  onChange={handleSelectCanteen}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm font-semibold focus:border-black focus:outline-none bg-white shadow-xs"
                >
                  {canteens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.campus?.name})
                    </option>
                  ))}
                </select>
              </div>
            ) : selectedCanteen ? (
              <div className="bg-gray-100 text-gray-900 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>Managed Canteen:</span>
                <span className="text-black underline font-bold">{selectedCanteen.name}</span>
              </div>
            ) : null}

            {selectedCanteen && (
              <button
                onClick={handleToggleCanteenStatus}
                className={`py-2 px-4 text-xs font-bold rounded-xl border transition-all shadow-xs ${
                  selectedCanteen.isOpen
                    ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"
                    : "bg-rose-500 text-white border-rose-600 hover:bg-rose-600"
                }`}
              >
                {selectedCanteen.isOpen ? "Canteen Status: OPEN" : "Canteen Status: CLOSED"}
              </button>
            )}
          </div>
        </div>

        {!selectedCanteen ? (
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-3">
            <h3 className="text-lg font-bold text-amber-900">No Canteen Assigned</h3>
            <p className="text-sm text-amber-700 max-w-md">
              Your account has the Canteen Staff role, but you are not linked to an active canteen yet.
              Please ask a System Administrator to assign you to your canteen.
            </p>
          </div>
        ) : (
          <>
            {/* Tab Navigation */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-2">
              <div className="flex items-center gap-6 text-sm font-bold">
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === "queue"
                      ? "bg-black text-white shadow-md font-bold"
                      : "text-gray-600 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <span>Live Orders Queue</span>
                  <span className="bg-gray-800 text-white text-xs px-2 py-0.5 rounded-full font-extrabold">
                    {orders.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("menu")}
                  className={`py-2 px-4 rounded-xl transition-all flex items-center gap-2 ${
                    activeTab === "menu"
                      ? "bg-black text-white shadow-md font-bold"
                      : "text-gray-600 hover:text-black hover:bg-gray-100"
                  }`}
                >
                  <span>Menu Management</span>
                  <span className="bg-gray-200 text-gray-800 text-xs px-2 py-0.5 rounded-full font-extrabold">
                    {menuItems.length}
                  </span>
                </button>
              </div>

              {activeTab === "queue" && (
                <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                  {["ALL", "PENDING", "ACCEPTED", "PREPARING", "READY", "DELIVERED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1 rounded-md transition-all ${
                        statusFilter === st ? "bg-white text-black shadow-xs font-bold" : "text-gray-600 hover:text-black"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "menu" && (
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIsModalOpen(true);
                  }}
                  className="py-1.5 px-3 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  + Add Menu Item
                </button>
              )}
            </div>

            {error && <p className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</p>}

            {loading ? (
              <div className="py-16 text-center text-gray-500 text-sm">Loading live queue...</div>
            ) : (
              <>
                {/* LIVE ORDER QUEUE TAB */}
                {activeTab === "queue" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredOrders.length === 0 ? (
                      <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-200 text-gray-400">
                        <p className="font-medium text-gray-600">No orders matching filter</p>
                      </div>
                    ) : (
                      filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`bg-white rounded-3xl border p-6 shadow-xs flex flex-col justify-between transition-all duration-300 hover:shadow-lg ${
                            order.status === "PENDING"
                              ? "border-amber-300 ring-2 ring-amber-100/80 bg-amber-50/10"
                              : order.status === "READY"
                              ? "border-emerald-400 ring-2 ring-emerald-100 bg-emerald-50/10"
                              : "border-gray-200"
                          }`}
                        >
                          <div>
                            {/* Token Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 mb-3.5">
                              <div className="flex items-center gap-3">
                                <span className="bg-black text-white px-3 py-1.5 rounded-2xl text-xl font-black tracking-tight shadow-md">
                                  #{order.token}
                                </span>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">{order.user?.name}</div>
                                  <div className="text-[11px] text-gray-400 font-medium">
                                    Placed at: {new Date(order.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <StatusBadge status={order.status} type="order" />
                                <StatusBadge status={order.payment?.status} type="payment" />
                              </div>
                            </div>

                            {/* Order Type & Pre-Order Pickup Timing Badges */}
                            <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-2xl mb-4 border border-gray-200/70 text-xs">
                              <span
                                className={`font-black px-2.5 py-1 rounded-xl border ${
                                  order.orderType === "TAKEAWAY"
                                    ? "bg-amber-100 text-amber-900 border-amber-300 shadow-2xs"
                                    : "bg-gray-200 text-gray-800 border-gray-300 shadow-2xs"
                                }`}
                              >
                                {order.orderType === "TAKEAWAY" ? "TAKEAWAY (PACK)" : "DINE-IN"}
                              </span>

                              <span className="font-bold text-gray-700 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                                Pickup:{" "}
                                {order.pickupTime
                                  ? new Date(order.pickupTime).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : "ASAP"}
                              </span>
                            </div>

                            {/* Order Items Checklist */}
                            <div className="flex flex-col gap-2 mb-5 bg-gray-50/50 p-3.5 rounded-2xl border border-gray-100">
                              {order.items?.map((item) => (
                                <div key={item.id} className="flex justify-between text-xs text-gray-900 font-bold">
                                  <span>
                                    {item.quantity}x {item.menuItem?.name}
                                  </span>
                                  <span className="text-gray-500 font-medium">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Footer & Actions */}
                          <div className="pt-3 border-t border-gray-100 flex flex-col gap-3">
                            <div className="flex justify-between items-center text-sm font-semibold">
                              <span className="text-xs text-gray-500 font-normal">
                                Payment: {order.payment?.method}
                              </span>
                              <span>Total: ₹{Number(order.totalAmount).toFixed(2)}</span>
                            </div>

                            {/* Cash payment collection toggle */}
                            {order.payment?.method === "CASH" && order.payment?.status !== "SUCCESS" && (
                              <button
                                onClick={() => handleMarkCashPaid(order.id)}
                                className="w-full py-1.5 bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-semibold rounded-lg border border-amber-300 transition-colors"
                              >
                                Mark Cash Paid (at counter)
                              </button>
                            )}

                            {/* Status Transition Action Buttons */}
                            <div className="flex flex-wrap gap-2 pt-1">
                              {order.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "ACCEPTED")}
                                  className="flex-1 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                  Accept Order
                                </button>
                              )}

                              {order.status === "ACCEPTED" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                                  className="flex-1 py-2 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition-colors"
                                >
                                  Start Preparing
                                </button>
                              )}

                              {order.status === "PREPARING" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "READY")}
                                  className="flex-1 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                                >
                                  Mark Ready for Pickup
                                </button>
                              )}

                              {order.status === "READY" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                                  className="flex-1 py-2 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-black transition-colors"
                                >
                                  Deliver / Hand Over
                                </button>
                              )}

                              {order.status !== "DELIVERED" && order.status !== "CANCELLED" && (
                                <button
                                  onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                                  className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* MENU MANAGEMENT TAB */}
                {activeTab === "menu" && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900">
                        Menu Items in "{selectedCanteen.name}" ({menuItems.length})
                      </span>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {menuItems.length === 0 ? (
                        <p className="p-8 text-center text-sm text-gray-500">No menu items created yet.</p>
                      ) : (
                        menuItems.map((item) => (
                          <div key={item.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50">
                            <div className="flex items-center gap-4">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400">
                                  Item
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-500">
                                  ₹{Number(item.price).toFixed(2)} • {item.isAvailable ? "In Stock" : "Sold Out"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleAvailability(item)}
                                className={`text-xs px-3 py-1.5 rounded-lg font-semibold border ${
                                  item.isAvailable
                                    ? "border-emerald-300 text-emerald-800 bg-emerald-50"
                                    : "border-rose-300 text-rose-800 bg-rose-50"
                                }`}
                              >
                                {item.isAvailable ? "Available" : "Sold Out"}
                              </button>

                              <button
                                onClick={() => {
                                  setEditingItem(item);
                                  setIsModalOpen(true);
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-300"
                              >
                                Edit
                              </button>

                              <button
                                onClick={() => handleDeleteMenuItem(item.id)}
                                className="text-xs text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Menu Item Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveMenuItem}
        item={editingItem}
      />
    </DashboardShell>
  );
}
