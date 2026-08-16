import Razorpay from "razorpay";

// Only instantiate if keys are present, so the server can still boot in
// dev/testing without Razorpay configured (payments routes will just
// error clearly if someone hits them without keys set).
export const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      })
    : null;
