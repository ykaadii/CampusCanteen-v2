import { useState } from "react";
import { api } from "../api/axios";

export default function CartDrawer({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  canteen,
  onOrderCreated,
}) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [orderType, setOrderType] = useState("DINE_IN");
  const [pickupDelayMinutes, setPickupDelayMinutes] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const total = cart.reduce((acc, item) => acc + Number(item.price) * item.quantity, 0);

  async function handleCheckout() {
    if (cart.length === 0 || !canteen) return;
    setLoading(true);
    setError("");

    try {
      const payload = {
        canteenId: canteen.id,
        paymentMethod,
        orderType,
        pickupDelayMinutes,
        items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
      };

      const { data } = await api.post("/orders", payload);
      const order = data.order;

      // Handle Razorpay payment initiation if paymentMethod === 'RAZORPAY'
      if (paymentMethod === "RAZORPAY") {
        try {
          const razorpayRes = await api.post("/payments/create-razorpay-order", {
            orderId: order.id,
          });

          if (razorpayRes.data.mock) {
            // Mock razorpay payment completion for dev environment
            await api.post("/payments/verify-razorpay", {
              orderId: order.id,
              razorpay_order_id: razorpayRes.data.razorpayOrderId,
              razorpay_payment_id: "pay_mock_" + Date.now(),
              razorpay_signature: "signature_mock",
            });
          } else if (window.Razorpay) {
            const options = {
              key: razorpayRes.data.key,
              amount: razorpayRes.data.amount,
              currency: razorpayRes.data.currency,
              name: canteen.name,
              description: `Order Token #${order.token} (${orderType === "TAKEAWAY" ? "Pack" : "Dine-In"})`,
              order_id: razorpayRes.data.razorpayOrderId,
              handler: async function (response) {
                await api.post("/payments/verify-razorpay", {
                  orderId: order.id,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                });
                onClearCart();
                onOrderCreated(order);
                onClose();
              },
            };
            const rzp = new window.Razorpay(options);
            rzp.open();
            setLoading(false);
            return;
          }
        } catch (rzpErr) {
          console.warn("Razorpay flow notice:", rzpErr.message);
        }
      }

      onClearCart();
      onOrderCreated(order);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "Order placement failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Checkout Cart</h2>
            <p className="text-xs text-gray-500">{canteen?.name || "Selected Canteen"}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">{error}</p>}

          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 gap-2">
              <p className="font-bold text-gray-700">Your cart is empty</p>
              <p className="text-xs text-gray-500">Add items from the menu to get started!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Cart Items ({cart.reduce((a, c) => a + c.quantity, 0)})
              </div>

              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">{item.name}</h4>
                    <p className="text-xs text-gray-500">₹{Number(item.price).toFixed(2)} each</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="text-gray-400 hover:text-red-600 p-1 text-xs font-bold"
                      title="Remove item"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Checkout Controls */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50 flex flex-col gap-4">
            {/* 1. ORDER TYPE: DINE-IN VS TAKEAWAY */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
                1. Order Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderType("DINE_IN")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    orderType === "DINE_IN"
                      ? "border-black bg-black text-white shadow-xs"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Dine-In (Default)
                </button>
                <button
                  type="button"
                  onClick={() => setOrderType("TAKEAWAY")}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    orderType === "TAKEAWAY"
                      ? "border-black bg-black text-white shadow-xs"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Takeaway / Pack
                </button>
              </div>
            </div>

            {/* 2. PRE-ORDER PICKUP TIMING */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider">
                  2. Preparation Timing
                </label>
                <span className="text-[11px] text-gray-400 font-medium">Max 1 hour pre-order</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: "ASAP", mins: 0 },
                  { label: "+15m", mins: 15 },
                  { label: "+30m", mins: 30 },
                  { label: "+45m", mins: 45 },
                  { label: "+60m", mins: 60 },
                ].map((t) => (
                  <button
                    key={t.mins}
                    type="button"
                    onClick={() => setPickupDelayMinutes(t.mins)}
                    className={`py-2 px-1 text-[11px] font-bold rounded-lg border text-center transition-all ${
                      pickupDelayMinutes === t.mins
                        ? "border-black bg-black text-white shadow-xs"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {pickupDelayMinutes > 0 && (
                <p className="text-[11px] text-emerald-800 font-semibold mt-1.5 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                  Food will be prepared for pickup at{" "}
                  {new Date(Date.now() + pickupDelayMinutes * 60 * 1000).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  (In {pickupDelayMinutes} mins)
                </p>
              )}
            </div>

            {/* 3. PAYMENT METHOD */}
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">
                3. Payment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={`p-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
                    paymentMethod === "CASH"
                      ? "border-black bg-black text-white shadow-xs"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Cash on Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("RAZORPAY")}
                  className={`p-2.5 text-xs font-medium rounded-xl border text-center transition-all ${
                    paymentMethod === "RAZORPAY"
                      ? "border-black bg-black text-white shadow-xs"
                      : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Razorpay Online
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Amount</span>
              <span>₹{total.toFixed(2)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-md flex items-center justify-center gap-2"
            >
              {loading ? "Processing Order..." : `Place Order • ₹${total.toFixed(2)}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
