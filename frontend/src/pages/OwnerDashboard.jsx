import { useState, useEffect, useCallback } from "react";
import { api } from "../api/axios";
import { useAuth } from "../context/AuthContext";
import DashboardShell from "../components/DashboardShell";
import StatusBadge from "../components/StatusBadge";

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [canteens, setCanteens] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState("");
  const [historyFilter, setHistoryFilter] = useState("ALL");
  const [revenueTab, setRevenueTab] = useState("DAILY"); // "DAILY", "MONTHLY", "HOURLY"

  const fetchAnalytics = useCallback(async (canteenId) => {
    setAnalyticsLoading(true);
    setError("");
    try {
      const { data } = await api.get(`/canteens/${canteenId}/analytics`);
      setAnalytics(data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load canteen analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    api
      .get("/canteens")
      .then(({ data }) => {
        setCanteens(data.canteens);
        if (data.canteens.length > 0) {
          const defaultCanteen = data.canteens[0];
          setSelectedCanteen(defaultCanteen);
          fetchAnalytics(defaultCanteen.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        setError(err.response?.data?.error || "Failed to load canteens");
        setLoading(false);
      })
      .finally(() => setLoading(false));
  }, [user, fetchAnalytics]);

  function handleSelectCanteen(e) {
    const cId = e.target.value;
    const found = canteens.find((c) => c.id === cId);
    if (found) {
      setSelectedCanteen(found);
      fetchAnalytics(found.id);
    }
  }

  const metrics = analytics?.metrics;
  const topDishes = analytics?.topSellingDishes || [];
  const dailySales = analytics?.dailySales || [];
  const monthlySales = analytics?.monthlySales || [];
  const hourlySales = analytics?.hourlySales || [];
  const recentOrders = analytics?.recentOrders || [];

  const filteredHistory = recentOrders.filter((order) => {
    if (historyFilter === "ALL") return true;
    return order.status === historyFilter;
  });

  return (
    <DashboardShell>
      <div className="flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Canteen Owner Business Portal</h1>
              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Owner Analytics
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Real-time day-wise & month-wise revenue reports, order statistics, top selling dishes & transaction logs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canteens.length > 1 ? (
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
            ) : selectedCanteen ? (
              <div className="bg-gray-100 text-gray-900 border border-gray-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <span>Canteen:</span>
                <span className="text-black underline font-bold">{selectedCanteen.name}</span>
              </div>
            ) : null}
          </div>
        </div>

        {error && <p className="p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{error}</p>}

        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Loading owner portal...</div>
        ) : canteens.length === 0 ? (
          <div className="p-8 bg-amber-50 border border-amber-200 rounded-2xl text-center flex flex-col items-center gap-3">
            <h3 className="text-lg font-bold text-amber-900">No Canteen Assigned</h3>
            <p className="text-sm text-amber-700 max-w-md">
              Your account has the Canteen Owner role, but you are not linked to an active canteen yet.
              Please ask a System Administrator to assign you as the owner of your canteen.
            </p>
          </div>
        ) : analyticsLoading ? (
          <div className="py-16 text-center text-gray-500 text-sm">Fetching sales reports & analytics...</div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* KPI METRICS CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {/* Card 1: Total Revenue */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Lifetime Revenue</div>
                <div className="text-3xl font-black text-gray-900 my-2.5 tracking-tight">
                  ₹{Number(metrics?.totalRevenue || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-500 font-semibold flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">Cash: ₹{Number(metrics?.paymentBreakdown?.CASH_REVENUE || 0).toFixed(0)}</span>
                  <span className="bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200">Online: ₹{Number(metrics?.paymentBreakdown?.RAZORPAY_REVENUE || 0).toFixed(0)}</span>
                </div>
              </div>

              {/* Card 2: Total Orders */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Orders</div>
                <div className="text-3xl font-black text-gray-900 my-2.5 tracking-tight">{metrics?.totalOrdersCount || 0}</div>
                <div className="text-[11px] text-gray-500 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-emerald-700 font-bold">{metrics?.statusCounts?.DELIVERED || 0} Completed</span>
                  <span className="text-rose-600 font-bold">{metrics?.statusCounts?.CANCELLED || 0} Cancelled</span>
                </div>
              </div>

              {/* Card 3: Average Order Value */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Avg Order Value (AOV)</div>
                <div className="text-3xl font-black text-gray-900 my-2.5 tracking-tight">
                  ₹{Number(metrics?.averageOrderValue || 0).toFixed(2)}
                </div>
                <div className="text-[11px] text-gray-500 font-semibold border-t border-gray-100 pt-3">
                  Per customer transaction
                </div>
              </div>

              {/* Card 4: Order Type Ratio */}
              <div className="bg-white p-6 rounded-3xl border border-gray-200/80 shadow-xs flex flex-col justify-between hover:shadow-lg transition-shadow">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Preferences</div>
                <div className="flex items-center gap-4 my-2">
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Dine-In</span>
                    <span className="text-2xl font-black text-gray-900">{metrics?.orderTypeBreakdown?.DINE_IN || 0}</span>
                  </div>
                  <span className="text-gray-200 font-light text-2xl">|</span>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-amber-700 uppercase">Takeaway</span>
                    <span className="text-2xl font-black text-amber-900">{metrics?.orderTypeBreakdown?.TAKEAWAY || 0}</span>
                  </div>
                </div>
                <div className="text-[11px] text-gray-500 font-semibold border-t border-gray-100 pt-3">
                  {metrics?.orderTypeBreakdown?.TAKEAWAY > 0 ? "Includes takeaway packaging" : "100% Dine-In"}
                </div>
              </div>
            </div>

            {/* REVENUE BREAKDOWN TAB SYSTEM */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-base text-gray-900">Sales & Revenue Breakdown Reports</h3>
                  <p className="text-xs text-gray-500">Analyze business performance day-by-day, month-by-month, and peak hours</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-200/70 p-1 rounded-xl text-xs font-semibold">
                  <button
                    onClick={() => setRevenueTab("DAILY")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      revenueTab === "DAILY" ? "bg-white text-black shadow-xs font-bold" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Day-Wise ({dailySales.length})
                  </button>
                  <button
                    onClick={() => setRevenueTab("MONTHLY")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      revenueTab === "MONTHLY" ? "bg-white text-black shadow-xs font-bold" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Month-Wise ({monthlySales.length})
                  </button>
                  <button
                    onClick={() => setRevenueTab("HOURLY")}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      revenueTab === "HOURLY" ? "bg-white text-black shadow-xs font-bold" : "text-gray-600 hover:text-black"
                    }`}
                  >
                    Today's Peak Hours
                  </button>
                </div>
              </div>

              {/* TAB 1: DAY-WISE REVENUE TABLE */}
              {revenueTab === "DAILY" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Total Orders</th>
                        <th className="px-6 py-3">Cash Sales</th>
                        <th className="px-6 py-3">Razorpay Online</th>
                        <th className="px-6 py-3">Average Order Value</th>
                        <th className="px-6 py-3 text-right">Daily Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {dailySales.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                            No daily sales records available yet.
                          </td>
                        </tr>
                      ) : (
                        dailySales.map((day) => (
                          <tr key={day.dateStr} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3.5 font-bold text-gray-900">{day.formattedDate}</td>
                            <td className="px-6 py-3.5">
                              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-md font-bold">
                                {day.ordersCount} orders
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-gray-600">₹{Number(day.cashRevenue).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-gray-600">₹{Number(day.onlineRevenue).toFixed(2)}</td>
                            <td className="px-6 py-3.5 text-gray-500">
                              ₹{(day.revenue / day.ordersCount).toFixed(2)}
                            </td>
                            <td className="px-6 py-3.5 text-right font-black text-gray-900 text-sm">
                              ₹{Number(day.revenue).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: MONTH-WISE REVENUE TABLE */}
              {revenueTab === "MONTHLY" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="px-6 py-3">Month</th>
                        <th className="px-6 py-3">Total Orders</th>
                        <th className="px-6 py-3">Avg Revenue / Order</th>
                        <th className="px-6 py-3 text-right">Monthly Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                      {monthlySales.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                            No monthly sales records available yet.
                          </td>
                        </tr>
                      ) : (
                        monthlySales.map((month) => (
                          <tr key={month.monthStr} className="hover:bg-gray-50/50">
                            <td className="px-6 py-3.5 font-bold text-gray-900">{month.monthName}</td>
                            <td className="px-6 py-3.5">
                              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                                {month.ordersCount} orders
                              </span>
                            </td>
                            <td className="px-6 py-3.5 text-gray-600">
                              ₹{(month.revenue / month.ordersCount).toFixed(2)}
                            </td>
                            <td className="px-6 py-3.5 text-right font-black text-emerald-800 text-sm">
                              ₹{Number(month.revenue).toFixed(2)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: TODAY'S HOURLY PEAK SALES */}
              {revenueTab === "HOURLY" && (
                <div className="p-6">
                  {hourlySales.length === 0 ? (
                    <p className="py-8 text-center text-sm text-gray-400">No orders placed today yet.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {hourlySales.map((h) => (
                        <div
                          key={h.hour}
                          className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 flex flex-col items-center justify-between text-center"
                        >
                          <span className="text-xs font-bold text-gray-500">{h.hourLabel}</span>
                          <span className="text-lg font-black text-gray-900 my-1">₹{Number(h.revenue).toFixed(0)}</span>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            {h.ordersCount} orders
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION 3: TOP SELLING DISHES & PAYMENT ANALYSIS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* TOP SELLING DISHES TABLE */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-bold text-sm text-gray-900 flex items-center justify-between">
                  <span>Top 5 Selling Dishes</span>
                  <span className="text-xs text-gray-500 font-medium">Ranked by Quantity Sold</span>
                </div>

                <div className="divide-y divide-gray-100">
                  {topDishes.length === 0 ? (
                    <p className="p-8 text-center text-sm text-gray-500">No dish sales recorded yet.</p>
                  ) : (
                    topDishes.map((dish, index) => (
                      <div key={dish.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-gray-50/50">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center">
                            #{index + 1}
                          </span>
                          {dish.imageUrl ? (
                            <img
                              src={dish.imageUrl}
                              alt={dish.name}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-xs font-bold text-gray-400">
                              Item
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm">{dish.name}</h4>
                            <p className="text-xs text-gray-500">{dish.quantitySold} units sold</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-sm">₹{Number(dish.revenue).toFixed(2)}</div>
                          <span className="text-[11px] text-emerald-700 font-semibold">Revenue Generated</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PAYMENT & STATUS SUMMARY CARD */}
              <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-4">
                <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">
                  Order Status Breakdown
                </h3>

                <div className="flex flex-col gap-2.5 text-xs font-medium">
                  <div className="flex justify-between items-center p-2 bg-amber-50 rounded-xl text-amber-900 border border-amber-200">
                    <span>Pending Orders</span>
                    <span className="font-bold">{metrics?.statusCounts?.PENDING || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded-xl text-blue-900 border border-blue-200">
                    <span>Accepted / In Queue</span>
                    <span className="font-bold">{metrics?.statusCounts?.ACCEPTED || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded-xl text-purple-900 border border-purple-200">
                    <span>Preparing in Kitchen</span>
                    <span className="font-bold">{metrics?.statusCounts?.PREPARING || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-emerald-50 rounded-xl text-emerald-900 border border-emerald-200">
                    <span>Ready for Pickup</span>
                    <span className="font-bold">{metrics?.statusCounts?.READY || 0}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-gray-100 rounded-xl text-gray-900 border border-gray-200">
                    <span>Delivered / Handed Over</span>
                    <span className="font-bold">{metrics?.statusCounts?.DELIVERED || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 4: RECENT ORDERS AUDIT LOG */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Recent Canteen Order History Logs</h3>
                  <p className="text-xs text-gray-500">Audit trail of transactions placed at this canteen</p>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  {["ALL", "PENDING", "PREPARING", "READY", "DELIVERED", "CANCELLED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setHistoryFilter(st)}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                        historyFilter === st ? "bg-black text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-6 py-3">Token #</th>
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-6 py-3">Preference</th>
                      <th className="px-6 py-3">Payment</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Order Status</th>
                      <th className="px-6 py-3 text-right">Time Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-800">
                    {filteredHistory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-400">
                          No order logs matching selected filter.
                        </td>
                      </tr>
                    ) : (
                      filteredHistory.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50">
                          <td className="px-6 py-3.5">
                            <span className="font-bold bg-black text-white px-2 py-0.5 rounded-lg text-xs">
                              #{order.token}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="font-bold text-gray-900">{order.user?.name}</div>
                            <div className="text-[11px] text-gray-400">{order.user?.email}</div>
                          </td>
                          <td className="px-6 py-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                order.orderType === "TAKEAWAY"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {order.orderType === "TAKEAWAY" ? "Takeaway" : "Dine-In"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={order.payment?.status} type="payment" />
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-900">
                            ₹{Number(order.totalAmount).toFixed(2)}
                          </td>
                          <td className="px-6 py-3.5">
                            <StatusBadge status={order.status} type="order" />
                          </td>
                          <td className="px-6 py-3.5 text-right text-gray-500">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
