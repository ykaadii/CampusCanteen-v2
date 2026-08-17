import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const { sendSignupOtp, verifyOtpAndSignup } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // Step 1: User info, Step 2: OTP verification
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [actualOtp, setActualOtp] = useState("");
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
    setDemoOtp("");
    setActualOtp("");
    setPending(true);

    try {
      const res = await sendSignupOtp(form);
      setNotice(res.otpNotice || res.message || `A 6-digit verification code was sent to ${form.email}`);
      const code = res.actualOtp || res.demoOtp;
      if (code) {
        setActualOtp(code);
        setDemoOtp(code);
      }
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
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          {step === 1
            ? "Sign up as a student with email verification."
            : `Enter the 6-digit code sent to ${form.email}`}
        </p>
      </div>

      {/* Progress Step Indicator */}
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        <span className={`px-2 py-0.5 rounded-full ${step === 1 ? "bg-black text-white" : "bg-gray-200"}`}>
          1. Account Details
        </span>
        <span>&rarr;</span>
        <span className={`px-2.5 py-0.5 rounded-full ${step === 2 ? "bg-black text-white" : "bg-gray-200"}`}>
          2. Email OTP
        </span>
      </div>

      {/* STEP 1: SIGNUP FORM */}
      {step === 1 && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          {/* 🧪 Test Case Quick Fill Helper */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-900 mb-2">
              <span className="flex items-center gap-1">⚡ Test Case Helper</span>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm({
                  name: "Test Student " + Math.floor(Math.random() * 900 + 100),
                  email: "test.student" + Math.floor(Math.random() * 900 + 100) + "@student.edu",
                  password: "studentpassword123",
                })
              }
              className="w-full py-2 px-3 bg-white hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-950 transition-all cursor-pointer text-left flex items-center justify-between shadow-2xs"
            >
              <div>
                <div className="font-bold text-gray-900">🎓 Quick Fill Test Student Info</div>
                <span className="text-[10px] text-gray-500">Auto-fills name, test student email & password</span>
              </div>
              <span className="text-sm">➔</span>
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Full name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="Alex Smith"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email address</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="alex@student.edu"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-black focus:outline-none"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-400">At least 8 characters</p>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
          >
            {pending ? "Sending Verification Code..." : "Send Verification Code ➔"}
          </button>
        </form>
      )}

      {/* STEP 2: 6-DIGIT OTP VERIFICATION FORM */}
      {step === 2 && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          {/* ✉️ Blue Box Notice with Test Code */}
          <div className="p-4 bg-blue-50 border-2 border-blue-300 text-blue-900 rounded-xl text-xs font-semibold leading-relaxed shadow-2xs flex flex-col gap-2.5">
            <div>
              ✉️ A 6-digit verification code was sent to your email. (Test Code: <span className="font-mono font-bold text-sm bg-blue-200 text-blue-950 px-2 py-0.5 rounded border border-blue-400 tracking-wider">{actualOtp || demoOtp}</span>)
            </div>
            {(actualOtp || demoOtp) && (
              <button
                type="button"
                onClick={() => setOtp(actualOtp || demoOtp)}
                className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>⚡</span> Auto-Fill Test Code ({actualOtp || demoOtp})
              </button>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Enter 6-Digit OTP Code</label>
            <input
              type="text"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="e.g. 123456"
              className="w-full text-center text-2xl font-bold tracking-widest font-mono rounded-xl border border-gray-300 px-3 py-3 focus:border-black focus:outline-none bg-gray-50"
            />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">{error}</p>}

          <button
            type="submit"
            disabled={pending || otp.length !== 6}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-md"
          >
            {pending ? "Verifying Code..." : "Verify OTP & Create Account"}
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-gray-500 hover:text-black underline"
            >
              &larr; Change Email
            </button>

            <button
              type="button"
              onClick={handleSendOtp}
              disabled={resendTimer > 0 || pending}
              className="text-xs font-semibold text-black hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {resendTimer > 0 ? `Resend Code in ${resendTimer}s` : "Resend OTP Code"}
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-black underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
