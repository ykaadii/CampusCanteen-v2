import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { socket, connectSocket } from "../api/socket";
import { requestWebNotificationPermission } from "../api/firebase";
import { useAuth } from "../context/AuthContext";
import DashboardShell from "../components/DashboardShell";
import StatusBadge from "../components/StatusBadge";
import CartDrawer from "../components/CartDrawer";

const DEFAULT_CANTEEN_IMAGE =
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop";

export default function StudentDashboard() {
  const { user, updateDefaultCampus } = useAuth();
  const [activeTab, setActiveTab] = useState("menu");

  const [campuses, setCampuses] = useState([]);
  const [selectedCampus, setSelectedCampus] = useState(null);

  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);

  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [canteenLoading, setCanteenLoading] = useState(false);
  const [error, setError] = useState("");
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [savingDefault, setSavingDefault] = useState(false);

  // Load campuses and initial data
  useEffect(() => {
    connectSocket(user);

    api
      .get("/campuses")
      .then(({ data }) => {
        setCampuses(data.campuses);
        if (data.campuses.length > 0) {
          let defaultCampus = data.campuses.find((c) => c.id === user?.campusId);
          if (!defaultCampus) {
            defaultCampus = data.campuses[0];
          }
          setSelectedCampus(defaultCampus);
          fetchCanteensForCampus(defaultCampus.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load campuses");
        setLoading(false);
      });

    fetchMyOrders();
  }, [user]);

  // Real-time updates for student's orders via Socket.IO
  useEffect(() => {
    if (!user) return;

    socket.emit("join:user", user.id);

    function handleOrderUpdated(updatedOrder) {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    }

    function handleOrderCreated(newOrder) {
      setOrders((prev) => [newOrder, ...prev]);
    }

    socket.on("order:updated", handleOrderUpdated);
    socket.on("order:created", handleOrderCreated);

    return () => {
      socket.off("order:updated", handleOrderUpdated);
      socket.off("order:created", handleOrderCreated);
    };
  }, [user]);

  async function handleEnablePushNotifications() {
    const granted = await requestWebNotificationPermission();
    if (granted) {
      setNotificationEnabled(true);
      alert("Push Notifications Enabled! You will receive instant alerts when your order is READY.");
    } else {
      alert("Notification permission was denied or not granted.");
    }
  }

  async function handleSetDefaultCampus() {
    if (!selectedCampus) return;
    setSavingDefault(true);
    try {
      await updateDefaultCampus(selectedCampus.id);
      alert(`"${selectedCampus.name}" is now set as your Default Campus!`);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update default campus");
    } finally {
      setSavingDefault(false);
    }
  }

  async function fetchCanteensForCampus(campusId) {
    setCanteenLoading(true);
    try {
      const { data } = await api.get(`/canteens?campusId=${campusId}`);
      setCanteens(data.canteens);
      if (data.canteens.length > 0) {
        const firstCanteen = data.canteens[0];
        setSelectedCanteen(firstCanteen);
        setMenuItems(firstCanteen.menuItems || []);
      } else {
        setSelectedCanteen(null);
        setMenuItems([]);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load canteens");
    } finally {
      setLoading(false);
      setCanteenLoading(false);
    }
  }

  function handleSelectCanteenCard(canteen) {
    setSelectedCanteen(canteen);
    setMenuItems(canteen.menuItems || []);
  }

  async function fetchMyOrders() {
    try {
      const { data } = await api.get("/orders/my");
      setOrders(data.orders);
    } catch (err) {
      console.warn("Failed to fetch order history:", err.message);
    }
  }

  function handleCampusChange(e) {
    const campusId = e.target.value;
    const found = campuses.find((c) => c.id === campusId);
    if (found) {
      setSelectedCampus(found);
      fetchCanteensForCampus(campusId);
    }
  }

  function handleAddToCart(item) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function handleUpdateQuantity(itemId, quantity) {
    if (quantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity } : i)));
  }

  function handleRemoveItem(itemId) {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
  }

  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const cartSubtotal = cart.reduce((acc, i) => acc + Number(i.price) * i.quantity, 0);

  const isCurrentCampusDefault = user?.campusId === selectedCampus?.id;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        {/* VIBRANT WARM FOOD HERO BANNER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white p-7 sm:p-9 rounded-3xl shadow-xl shadow-orange-500/15 flex flex-col md:flex-row md:items-center justify-between gap-6 border border-orange-400/30">
          {/* Decorative radial background accent blur */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-orange-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col gap-2.5 relative z-10 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white border border-white/35 text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md shadow-2xs">
                Skip The Line • Order Ahead
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight drop-shadow-xs">
              Order Fresh Meals directly from your Campus Canteens
            </h1>
            <p className="text-xs sm:text-sm text-orange-100 font-semibold leading-relaxed">
              Explore canteens on your campus, pre-order for instant pickup, choose Dine-In or Takeaway, and track live kitchen status.
            </p>
          </div>

          <div className="relative z-10 bg-black/20 backdrop-blur-md p-5 rounded-2xl border border-white/25 flex flex-col gap-3 min-w-[280px] shadow-lg">
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-orange-100 mb-1.5">
                <span>Selected Campus</span>
                {isCurrentCampusDefault && <span className="text-amber-200 font-extrabold">Default Campus</span>}
              </div>
              <select
                value={selectedCampus?.id || ""}
                onChange={handleCampusChange}
                className="w-full rounded-xl border border-white/35 bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-white shadow-2xs"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                    {c.name} ({c.city}) {user?.campusId === c.id ? "(Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {selectedCampus && !isCurrentCampusDefault && (
              <button
                onClick={handleSetDefaultCampus}
                disabled={savingDefault}
                className="py-2 px-3.5 bg-white text-orange-950 hover:bg-orange-50 text-xs font-black rounded-xl transition-all shadow-md flex items-center justify-center gap-1"
              >
                {savingDefault ? "Saving..." : "Set as Default Campus"}
              </button>
            )}
          </div>
        </div>

        {/* NAVIGATION TAB STRIP */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-2">
          <div className="flex items-center gap-3 text-sm font-bold">
            <button
              onClick={() => setActiveTab("menu")}
              className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "menu"
                  ? "bg-black text-white shadow-md font-bold"
                  : "text-gray-600 hover:text-black hover:bg-gray-100/80"
              }`}
            >
              <span>Canteens & Menu</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold ${activeTab === "menu" ? "bg-gray-800 text-white" : "bg-gray-200 text-gray-800"}`}>
                {canteens.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("orders")}
              className={`py-2.5 px-4 rounded-xl transition-all flex items-center gap-2 ${
                activeTab === "orders"
                  ? "bg-black text-white shadow-md font-bold"
                  : "text-gray-600 hover:text-black hover:bg-gray-100/80"
              }`}
            >
              <span>My Orders & Live Tracker</span>
              {orders.filter((o) => ["PENDING", "ACCEPTED", "PREPARING", "READY"].includes(o.status)).length > 0 && (
                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full font-extrabold animate-pulse">
                  Active
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {!notificationEnabled && (
              <button
                onClick={handleEnablePushNotifications}
                className="py-2 px-3.5 bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200 text-xs font-bold rounded-xl transition-all shadow-2xs"
              >
                Enable Push Alerts
              </button>
            )}

            {cartItemCount > 0 && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="py-2.5 px-4.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 animate-bounce"
              >
                <span>View Cart ({cartItemCount})</span>
                <span>• ₹{cartSubtotal.toFixed(2)}</span>
              </button>
            )}
          </div>
        </div>

        {error && <p className="p-3.5 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 font-medium">{error}</p>}

        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm font-medium">Loading campus details...</div>
        ) : (
          <>
            {/* CANTEENS & MENU ITEMS TAB */}
            {activeTab === "menu" && (
              <div className="flex flex-col gap-8">
                {/* SECTION 1: VISUAL CANTEEN CARDS GRID */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900">
                        Canteens in {selectedCampus?.name}
                      </h2>
                      <p className="text-xs text-gray-500">Select a canteen below to view its dishes</p>
                    </div>
                  </div>

                  {canteenLoading ? (
                    <div className="py-12 text-center text-gray-400 text-xs">Loading canteens...</div>
                  ) : canteens.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 bg-white rounded-3xl border border-gray-200">
                      No canteens available in this campus.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {canteens.map((canteen) => {
                        const isSelected = selectedCanteen?.id === canteen.id;
                        return (
                          <div
                            key={canteen.id}
                            onClick={() => handleSelectCanteenCard(canteen)}
                            className={`cursor-pointer bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between group ${
                              isSelected
                                ? "border-orange-500 ring-2 ring-orange-500/80 shadow-2xl scale-[1.01]"
                                : "border-gray-200/80 hover:border-gray-400 hover:shadow-xl hover:-translate-y-1"
                            }`}
                          >
                            <div className="relative overflow-hidden h-44">
                              <img
                                src={canteen.imageUrl || DEFAULT_CANTEEN_IMAGE}
                                alt={canteen.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                              <div className="absolute top-3.5 right-3.5">
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-black shadow-md backdrop-blur-md ${
                                    canteen.isOpen
                                      ? "bg-emerald-500 text-white"
                                      : "bg-rose-500 text-white"
                                  }`}
                                >
                                  {canteen.isOpen ? "OPEN" : "CLOSED"}
                                </span>
                              </div>

                              {isSelected && (
                                <div className="absolute top-3.5 left-3.5 bg-black text-white px-3 py-1 rounded-full text-xs font-black shadow-md">
                                  ✓ Selected
                                </div>
                              )}

                              <div className="absolute bottom-3.5 left-4 right-4 text-white">
                                <h3 className="font-black text-xl drop-shadow-md leading-tight">{canteen.name}</h3>
                              </div>
                            </div>

                            <div className="p-4 flex items-center justify-between text-xs text-gray-600 bg-gray-50/50 border-t border-gray-100">
                              <span>Campus: {canteen.campus?.name}</span>
                              <span className="font-bold text-gray-900 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                                {canteen.menuItems?.length || 0} Dishes
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: ITEMS LISTED UNDER SELECTED CANTEEN */}
                {selectedCanteen && (
                  <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
                      <div>
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-2.5">
                          <span>Dishes in "{selectedCanteen.name}"</span>
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-extrabold ${
                              selectedCanteen.isOpen ? "bg-emerald-100 text-emerald-900 border border-emerald-200" : "bg-rose-100 text-rose-900 border border-rose-200"
                            }`}
                          >
                            {selectedCanteen.isOpen ? "Accepting Orders" : "Closed"}
                          </span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Select your favorite dishes and click Add to Cart.
                        </p>
                      </div>

                      <span className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
                        {menuItems.length} items available
                      </span>
                    </div>

                    {!selectedCanteen.isOpen && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
                        This canteen is currently closed. You can view items, but new orders are paused.
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {menuItems.length === 0 ? (
                        <div className="col-span-full py-16 text-center text-gray-400">
                          <p className="font-bold text-gray-600">No dishes listed in this canteen yet.</p>
                        </div>
                      ) : (
                        menuItems.map((item) => {
                          const cartQty = cart.find((i) => i.id === item.id)?.quantity || 0;
                          return (
                            <div
                              key={item.id}
                              className="bg-white rounded-3xl border border-gray-200/80 overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 group"
                            >
                              <div>
                                {item.imageUrl ? (
                                  <div className="h-44 overflow-hidden relative">
                                    <img
                                      src={item.imageUrl}
                                      alt={item.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-full h-44 bg-gray-100 flex items-center justify-center text-[11px] text-gray-400 font-medium uppercase tracking-wider">
                                    No Image
                                  </div>
                                )}

                                <div className="p-5 flex flex-col gap-1.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                                      {item.name}
                                    </h3>
                                    <span className="font-black text-gray-900 text-base whitespace-nowrap bg-gray-50 px-2.5 py-1 rounded-xl border border-gray-200">
                                      ₹{Number(item.price).toFixed(2)}
                                    </span>
                                  </div>

                                  {item.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{item.description}</p>
                                  )}
                                </div>
                              </div>

                              <div className="p-5 pt-0">
                                {item.isAvailable && selectedCanteen?.isOpen ? (
                                  cartQty > 0 ? (
                                    <div className="flex items-center justify-between border border-gray-300 rounded-2xl p-1 bg-gray-50 shadow-2xs">
                                      <button
                                        onClick={() => handleUpdateQuantity(item.id, cartQty - 1)}
                                        className="px-3.5 py-1.5 bg-white rounded-xl border border-gray-200 text-xs font-black hover:bg-gray-100"
                                      >
                                        -
                                      </button>
                                      <span className="text-xs font-black text-gray-900">{cartQty} in cart</span>
                                      <button
                                        onClick={() => handleUpdateQuantity(item.id, cartQty + 1)}
                                        className="px-3.5 py-1.5 bg-white rounded-xl border border-gray-200 text-xs font-black hover:bg-gray-100"
                                      >
                                        +
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => handleAddToCart(item)}
                                      className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-2xl hover:bg-orange-600 transition-colors shadow-md flex items-center justify-center gap-1"
                                    >
                                      <span>+ Add to Cart</span>
                                    </button>
                                  )
                                ) : (
                                  <button
                                    disabled
                                    className="w-full py-2.5 bg-gray-100 text-gray-400 text-xs font-semibold rounded-2xl cursor-not-allowed border border-gray-200"
                                  >
                                    {item.isAvailable ? "Canteen Closed" : "Sold Out"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MY ORDERS & TRACKER TAB */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-6">
                {orders.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 bg-white rounded-3xl border border-gray-200 shadow-xs">
                    <p className="font-bold text-gray-700 text-base">No orders placed yet</p>
                    <p className="text-xs mt-1 text-gray-400">Order your first meal to skip the line!</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-3xl border border-gray-200 p-6 shadow-xs flex flex-col gap-5 hover:shadow-md transition-shadow"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-black text-white px-3.5 py-2 rounded-2xl text-xl font-black tracking-tight shadow-md">
                            Token #{order.token}
                          </div>
                          <div>
                            <h3 className="font-black text-gray-900 text-base">{order.canteen?.name}</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                              Placed at: {new Date(order.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-xs font-bold px-3 py-1 rounded-xl border shadow-2xs ${
                              order.orderType === "TAKEAWAY"
                                ? "bg-amber-100 text-amber-900 border-amber-300"
                                : "bg-gray-100 text-gray-800 border-gray-200"
                            }`}
                          >
                            {order.orderType === "TAKEAWAY" ? "TAKEAWAY" : "DINE-IN"}
                          </span>
                          <StatusBadge status={order.status} type="order" />
                          <StatusBadge status={order.payment?.status} type="payment" />
                        </div>
                      </div>

                      {/* Visual Progress Bar */}
                      <div className="py-3 px-5 bg-gray-50 rounded-2xl border border-gray-200/80">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-400">
                          <span className={order.status === "PENDING" ? "text-amber-600 font-black text-sm" : ""}>
                            1. Order Sent
                          </span>
                          <span className={order.status === "ACCEPTED" ? "text-blue-600 font-black text-sm" : ""}>
                            2. Accepted
                          </span>
                          <span className={order.status === "PREPARING" ? "text-purple-600 font-black text-sm" : ""}>
                            3. Preparing
                          </span>
                          <span className={order.status === "READY" ? "text-emerald-600 font-black text-sm animate-bounce" : ""}>
                            4. READY FOR PICKUP!
                          </span>
                          <span className={order.status === "DELIVERED" ? "text-gray-900 font-black text-sm" : ""}>
                            5. Delivered
                          </span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="flex flex-col gap-2 text-xs text-gray-700 font-semibold bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        {order.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center">
                            <span>
                              {item.quantity}x {item.menuItem?.name}
                            </span>
                            <span className="font-bold text-gray-900">₹{(Number(item.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer Total */}
                      <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-gray-100">
                        <span className="text-gray-500">Payment: {order.payment?.method}</span>
                        <span className="text-lg font-black text-gray-900">Total: ₹{Number(order.totalAmount).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Mobile Cart Button for Smartphones */}
      {cartItemCount > 0 && (
        <div className="sm:hidden fixed bottom-5 right-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="py-3 px-5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-black rounded-full shadow-2xl shadow-orange-500/40 flex items-center gap-2.5 animate-bounce border border-white/20"
          >
            <span>View Cart ({cartItemCount})</span>
            <span>• ₹{cartSubtotal.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={() => setCart([])}
        canteen={selectedCanteen}
        onOrderCreated={(newOrder) => {
          setOrders((prev) => [newOrder, ...prev]);
          setActiveTab("orders");
        }}
      />
    </DashboardShell>
  );
}
