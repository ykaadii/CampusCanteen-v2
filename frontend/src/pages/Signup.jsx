import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { sendSignupOtp, verifyOtpAndSignup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: User info, Step 2: OTP verification
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [demoCode, setDemoCode] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  // Resend Timer countdown
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setError("");
    setNotice("");
    setPending(true);

    try {
      const res = await sendSignupOtp(form);
      // Extract the real 6-digit verification code from API response
      const code = res.otp || (res.otpNotice && res.otpNotice.match(/\d{6}/)?.[0]);
      if (code) {
        setDemoCode(code);
        setOtp(code); // Pre-fill the real code directly into input for instant verification!
      }
      setNotice(`A 6-digit verification code was sent to ${form.email}`);
      setStep(2);
      setResendTimer(60); // 60s cooldown for resending
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send verification code");
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    setError("");
    setPending(true);

    try {
      await verifyOtpAndSignup({ ...form, otp });
      navigate("/student"); // Signup creates a STUDENT account
    } catch (err) {
      setError(err.response?.data?.error || "OTP verification failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/70 flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-200/80 shadow-xl shadow-gray-200/50 p-6 sm:p-8 flex flex-col gap-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-orange-500/30 mb-1">
            CC
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
            {step === 1 ? "Create your account" : "Verify Email Address"}
          </h1>
          <p className="text-xs text-gray-500 max-w-xs leading-relaxed font-medium">
            {step === 1
              ? "Sign up as a student to pre-order food, get instant tokens, and skip campus canteen lines."
              : `Verification code sent to ${form.email}`}
          </p>
        </div>

        {/* Progress Step Indicator */}
        <div className="flex items-center justify-center gap-3 text-xs font-bold">
          <span
            className={`px-3 py-1 rounded-full border transition-all ${
              step === 1
                ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                : "bg-gray-100 text-gray-400 border-gray-200"
            }`}
          >
            1. Account Details
          </span>
          <span className="text-gray-300 font-bold">&rarr;</span>
          <span
            className={`px-3 py-1 rounded-full border transition-all ${
              step === 2
                ? "bg-gray-900 text-white border-gray-900 shadow-2xs"
                : "bg-gray-100 text-gray-400 border-gray-200"
            }`}
          >
            2. Email Verification
          </span>
        </div>

        {/* STEP 1: ACCOUNT DETAILS FORM */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">Full Name</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all font-medium"
                placeholder="Alex Smith"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all font-medium"
                placeholder="alex@student.edu"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none transition-all font-medium"
                placeholder="••••••••"
              />
              <p className="mt-1 text-[11px] text-gray-400 font-medium">Must be at least 8 characters</p>
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-semibold">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 py-3 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              {pending ? "Sending Verification Code..." : "Send Verification Code ➔"}
            </button>
          </form>
        )}

        {/* STEP 2: 6-DIGIT OTP VERIFICATION FORM */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            
            {/* Enterprise Verification Notice Banner */}
            <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-amber-200/90 p-4 rounded-2xl flex flex-col items-center gap-2 text-center shadow-2xs">
              <span className="text-xs font-semibold text-gray-700">
                Verification code sent to <strong className="text-gray-900">{form.email}</strong>.
              </span>

              {demoCode && (
                <div className="flex flex-col items-center gap-1.5 mt-1 pt-2 border-t border-amber-200/60 w-full">
                  <span className="text-[11px] font-extrabold text-amber-900 uppercase tracking-wider">
                    Your Real Verification Code:
                  </span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-4 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-mono font-black text-xl rounded-xl tracking-widest shadow-xs">
                      {demoCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtp(demoCode)}
                      className="px-3 py-1.5 bg-white border border-amber-300 text-amber-950 text-xs font-bold rounded-lg hover:bg-amber-100 transition-colors shadow-2xs cursor-pointer"
                    >
                      Auto-fill
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700 text-center">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full text-center text-2xl font-black tracking-widest font-mono rounded-2xl border border-gray-300 px-3 py-3 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 focus:outline-none bg-gray-50/50 transition-all"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 font-semibold text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending || otp.length !== 6}
              className="w-full rounded-xl bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 py-3 text-sm font-extrabold text-white hover:opacity-95 disabled:opacity-50 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              {pending ? "Verifying Code..." : "Verify Code & Create Account"}
            </button>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                &larr; Change Email
              </button>

              <button
                type="button"
                onClick={handleSendOtp}
                disabled={resendTimer > 0 || pending}
                className="font-bold text-orange-600 hover:text-orange-700 disabled:text-gray-400 disabled:no-underline cursor-pointer"
              >
                {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend Code"}
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t border-gray-100 text-center text-xs text-gray-500 font-medium">
          Already have an account?{" "}
          <Link to="/login" className="font-extrabold text-orange-600 hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </main>
  );
}
