 
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import {
  sendVerificationCode,
  verifyCode,
  resetPassword,
} from "../../config/auth/authAPI";

function ForgotPassword() {
  const navigate = useNavigate();

  // STEP
  const [step, setStep] = useState(1);

  // FORM DATA
  const [email, setEmail] = useState("");
  const [verifCode, setVerifCode] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // PASSWORD VISIBILITY
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  // ==========================================
  // STEP 1 - SEND VERIFICATION CODE
  // ==========================================

  const handleSendCode = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const res = await sendVerificationCode(email);

      toast.success(res.data.message);

      setStep(2);

    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to send verification code";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // STEP 2 - VERIFY CODE
  // ==========================================

  const handleVerifyCode = async (e) => {
    e.preventDefault();

    if (!verifCode) {
      toast.error("Please enter the verification code");
      return;
    }

    try {
      setLoading(true);

      const res = await verifyCode({
        email,
        verifCode,
      });

      toast.success(res.data.message);

      setStep(3);

    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Invalid verification code";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // STEP 3 - RESET PASSWORD
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await resetPassword({
        email,
        verifCode,
        newPassword,
      });

      // Automatically login
      localStorage.setItem("token", res.data.token);

      toast.success("Password reset successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Failed to reset password";

      toast.error(message);

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#f4f7fb] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-2 lg:gap-12 lg:px-16 xl:gap-16 xl:px-20 lg:py-10">

      {/* ==========================================
          LEFT SIDE
      ========================================== */}

      <div className="hidden flex-col justify-between rounded-[2rem] bg-[#102a43] p-8 text-white lg:flex xl:p-10">

        <div className="flex items-center gap-3">

          <div className="grid size-10 place-items-center rounded-xl bg-[#47c5b0] text-lg font-bold text-[#102a43]">
            ₹
          </div>

          <span className="text-lg font-bold tracking-tight">
            ExpenseMate
          </span>

        </div>


        <div>

          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#8bded2]">
            Account Recovery
          </p>

          <h1 className="max-w-lg text-4xl font-bold leading-tight tracking-tight xl:text-5xl xl:leading-[1.05]">
            Get back into your account.
          </h1>

          <p className="mt-6 max-w-md text-sm leading-7 text-slate-300 xl:text-base">
            Verify your email, create a new password, and get back to
            managing your expenses.
          </p>

        </div>


        <p className="text-sm text-slate-400">
          Simple tracking for real-life groups.
        </p>

      </div>


      {/* ==========================================
          RIGHT SIDE
      ========================================== */}

      <div className="mx-auto flex w-full max-w-md flex-col justify-center lg:max-w-lg">

        {/* MOBILE LOGO */}

        <div className="mb-6 flex items-center gap-3 sm:mb-8 lg:hidden">

          <div className="grid size-10 place-items-center rounded-xl bg-[#102a43] text-lg font-bold text-[#8bded2]">
            ₹
          </div>

          <span className="text-lg font-bold tracking-tight text-[#102a43]">
            ExpenseMate
          </span>

        </div>


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(16,42,67,0.08)] sm:rounded-3xl sm:p-10">


          {/* ==========================================
              STEP 1
          ========================================== */}

          {step === 1 && (

            <>

              <div className="mb-8">

                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
                  Account Recovery
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-[#102a43]">
                  Forgot Password?
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Enter your registered email and we'll send you a
                  verification code.
                </p>

              </div>


              <form
                className="space-y-5"
                onSubmit={handleSendCode}
              >

                <div>

                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="email"
                  >
                    Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                  />

                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] focus:outline-none focus:ring-4 focus:ring-[#159a8c]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? "Sending..."
                    : "Send Verification Code"}

                </button>

              </form>

            </>

          )}


          {/* ==========================================
              STEP 2
          ========================================== */}

          {step === 2 && (

            <>

              <div className="mb-8">

                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
                  Verify Email
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-[#102a43]">
                  Enter Verification Code
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  We sent a verification code to:
                </p>

                <p className="mt-1 font-semibold text-[#102a43]">
                  {email}
                </p>

              </div>


              <form
                className="space-y-5"
                onSubmit={handleVerifyCode}
              >

                <div>

                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="verifCode"
                  >
                    Verification Code
                  </label>

                  <input
                    id="verifCode"
                    type="text"
                    placeholder="Enter verification code"
                    value={verifCode}
                    onChange={(e) =>
                      setVerifCode(e.target.value.toUpperCase())
                    }
                    maxLength={5}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-center text-lg font-bold uppercase tracking-[0.3em] text-slate-900 outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                  />

                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] focus:outline-none focus:ring-4 focus:ring-[#159a8c]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? "Verifying..."
                    : "Verify Code"}

                </button>


                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-sm font-semibold text-[#117d72] hover:text-[#102a43]"
                >
                  Change Email
                </button>

              </form>

            </>

          )}


          {/* ==========================================
              STEP 3
          ========================================== */}

          {step === 3 && (

            <>

              <div className="mb-8">

                <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#159a8c]">
                  New Password
                </p>

                <h2 className="text-3xl font-bold tracking-tight text-[#102a43]">
                  Reset Password
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Create a new password for your account.
                </p>

              </div>


              <form
                className="space-y-5"
                onSubmit={handleResetPassword}
              >


                {/* NEW PASSWORD */}

                <div className="relative">

                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="newPassword"
                  >
                    New Password
                  </label>

                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    className="absolute right-3 top-[2.35rem] text-slate-500 hover:text-[#159a8c]"
                  >

                    {showPassword
                      ? <FaEyeSlash size={18} />
                      : <FaEye size={18} />
                    }

                  </button>

                </div>


                {/* CONFIRM PASSWORD */}

                <div className="relative">

                  <label
                    className="mb-2 block text-sm font-semibold text-slate-700"
                    htmlFor="confirmPassword"
                  >
                    Confirm New Password
                  </label>

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#159a8c] focus:bg-white focus:ring-4 focus:ring-[#159a8c]/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                    className="absolute right-3 top-[2.35rem] text-slate-500 hover:text-[#159a8c]"
                  >

                    {showConfirmPassword
                      ? <FaEyeSlash size={18} />
                      : <FaEye size={18} />
                    }

                  </button>

                </div>


                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#159a8c] px-4 py-3 font-bold text-white shadow-lg shadow-[#159a8c]/20 transition hover:bg-[#117d72] focus:outline-none focus:ring-4 focus:ring-[#159a8c]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading
                    ? "Resetting Password..."
                    : "Reset Password"}

                </button>

              </form>

            </>

          )}


          {/* BACK TO LOGIN */}

          <div className="mt-6 text-center text-sm text-slate-500">

            Remember your password?{" "}

            <Link
              className="font-bold text-[#117d72] hover:text-[#102a43]"
              to="/login"
            >
              Login
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword; 