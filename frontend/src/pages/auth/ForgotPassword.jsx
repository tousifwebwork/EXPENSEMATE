import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, ArrowRight, Shield, Sparkles, CheckCircle2, Lock, Mail, KeyRound } from 'lucide-react'

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
        navigate("/groups");
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
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-12 overflow-hidden rounded-3xl bg-white border border-stone-200/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)]">

        {/* ==========================================
            LEFT SIDE
        ========================================== */}

        <div className="relative hidden lg:flex lg:col-span-5 flex-col justify-between p-10 xl:p-12 bg-[#121f28] text-white overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-[#159a8c]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-[#47c5b0]/10 blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] shadow-md shadow-[#159a8c]/20 text-white font-bold text-lg tracking-tight">
              ₹
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-white">ExpenseMate</span>
              <span className="text-[10px] uppercase tracking-widest font-medium text-stone-400">Financial Suite</span>
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 my-auto py-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159a8c]/15 text-[#8bded2] text-xs font-semibold mb-6 border border-[#159a8c]/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Account Recovery</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Regain access to your account securely.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              Verify your email address, create a secure new password, and restore full access to your expense management dashboard.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                'Email-based identity verification',
                'Secure password reset process',
                'Instant account restoration'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-2.5 text-xs text-stone-200">
                  <CheckCircle2 className="w-4 h-4 text-[#47c5b0] shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Footer note */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-stone-400">
            <span>Encrypted verification</span>
            <span className="flex items-center gap-1 text-stone-400">
              <Shield className="w-3.5 h-3.5 text-[#47c5b0]" /> Secure reset
            </span>
          </div>
        </div>


        {/* ==========================================
            RIGHT SIDE
        ========================================== */}

        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 xl:p-14 flex flex-col justify-center bg-white">

          {/* MOBILE LOGO */}

          <div className="flex lg:hidden items-center gap-3 mb-8">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#159a8c] to-[#0e6d63] text-white font-bold text-lg">
              ₹
            </div>

            <span className="text-xl font-bold tracking-tight text-[#1a1a1a]">
              ExpenseMate
            </span>

          </div>


          <div className="max-w-md w-full mx-auto animate-fade-in-up">


            {/* ==========================================
                STEP 1
            ========================================== */}

            {step === 1 && (

              <>

                <div className="mb-8">

                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1.5">
                    Account Recovery
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
                    Forgot your password?
                  </h2>

                  <p className="mt-2 text-sm text-stone-500">
                    Enter your registered email and we'll send you a verification code.
                  </p>

                </div>


                <form
                  className="space-y-5"
                  onSubmit={handleSendCode}
                >

                  <div>

                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                      htmlFor="email"
                    >
                      Email Address
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                        required
                      />
                    </div>

                  </div>


                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >

                    <span>{loading
                      ? "Sending..."
                      : "Send Verification Code"}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}

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

                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1.5">
                    Verify Email
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
                    Enter verification code
                  </h2>

                  <p className="mt-2 text-sm text-stone-500">
                    We sent a verification code to:
                  </p>

                  <p className="mt-1 font-semibold text-[#1a1a1a]">
                    {email}
                  </p>

                </div>


                <form
                  className="space-y-5"
                  onSubmit={handleVerifyCode}
                >

                  <div>

                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                      htmlFor="verifCode"
                    >
                      Verification Code
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        id="verifCode"
                        type="text"
                        placeholder="Enter 5-digit code"
                        value={verifCode}
                        onChange={(e) =>
                          setVerifCode(e.target.value.toUpperCase())
                        }
                        maxLength={5}
                        className="w-full pl-10 pr-4 py-3 text-center rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-lg font-bold uppercase tracking-[0.3em] placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                        required
                      />
                    </div>

                  </div>


                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >

                    <span>{loading
                      ? "Verifying..."
                      : "Verify Code"}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}

                  </button>


                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-full text-sm font-medium text-[#159a8c] hover:text-[#117d72] transition-colors"
                  >
                    Change Email Address
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

                  <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#159a8c] mb-1.5">
                    New Password
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
                    Reset your password
                  </h2>

                  <p className="mt-2 text-sm text-stone-500">
                    Create a new secure password for your account.
                  </p>

                </div>


                <form
                  className="space-y-5"
                  onSubmit={handleResetPassword}
                >


                  {/* NEW PASSWORD */}

                  <div>

                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                      htmlFor="newPassword"
                    >
                      New Password
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create new password"
                        value={newPassword}
                        onChange={(e) =>
                          setNewPassword(e.target.value)
                        }
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(!showPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >

                        {showPassword
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }

                      </button>
                    </div>

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div>

                    <label
                      className="block text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2"
                      htmlFor="confirmPassword"
                    >
                      Confirm New Password
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                        <Lock className="w-4 h-4" />
                      </div>
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
                        className="w-full pl-10 pr-11 py-3 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-sm placeholder:text-stone-400 transition-all duration-200 focus:bg-white focus:border-[#159a8c] focus:ring-4 focus:ring-[#159a8c]/10 outline-none"
                        required
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            !showConfirmPassword
                          )
                        }
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >

                        {showConfirmPassword
                          ? <EyeOff className="w-4 h-4" />
                          : <Eye className="w-4 h-4" />
                        }

                      </button>
                    </div>

                  </div>


                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[#159a8c] px-5 py-3.5 text-sm font-semibold text-white shadow-sm shadow-[#159a8c]/30 hover:bg-[#117d72] active:scale-[0.99] transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >

                    <span>{loading
                      ? "Resetting Password..."
                      : "Reset Password"}</span>
                    {!loading && <ArrowRight className="w-4 h-4" />}

                  </button>

                </form>

              </>

            )}


            {/* BACK TO LOGIN */}

            <div className="mt-8 pt-6 border-t border-stone-100 text-center">

              <p className="text-sm text-stone-500">
                Remember your password?{' '}

                <Link
                  className="font-semibold text-[#159a8c] hover:text-[#117d72] transition-colors"
                  to="/login"
                >
                  Sign in instead
                </Link>
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default ForgotPassword;
