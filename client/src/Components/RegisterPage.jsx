import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import logo from "../Assets/education-school-logo-design-template_731136-92.avif";

const roles = ["Student", "Supervisor"];

const API_ENDPOINTS = {
  Student:    "/api/student/register",
  Supervisor: "/api/supervisor/register",
};

export default function RegisterPage() {
  const [selectedRole, setSelectedRole] = useState("Student");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = API_ENDPOINTS[selectedRole];
      const response = await axios.post(endpoint, {
        full_name: fullName,
        email,
        password,
      });

      const { full_name } = response.data;
      setSuccess(`Account created successfully${full_name ? ` for ${full_name}` : ""}! You can now sign in.`);

      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Something went wrong. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen font-sans bg-slate-50">

      {/* ── LEFT PANEL: Register Form ── */}
      <div className="flex items-center justify-center w-full px-8 py-16 lg:w-1/2">
        <div className="w-full max-w-md">

          {/* Logo mark */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center bg-indigo-600 rounded-lg w-9 h-9">
          <img src={logo} alt="Logo" className=" rounded rounded-md" />
            </div>
            <span className="text-sm font-semibold tracking-widest uppercase text-slate-500">
              Apex Digital
            </span>
          </div>

          {/* Heading */}
          <h1 className="mb-1 text-3xl font-bold tracking-tight text-slate-900">
            Create an account
          </h1>
          <p className="mb-8 text-sm text-slate-400">
            Register to get started with Apex Digital
          </p>

          {/* Role selector */}
          <div className="flex gap-2 p-1 mb-8 bg-slate-100 rounded-xl">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role);
                  setError("");
                  setSuccess("");
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${selectedRole === role
                    ? "bg-white text-indigo-600 shadow-sm shadow-slate-200"
                    : "text-slate-400 hover:text-slate-600"
                  }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 mb-5 border border-red-100 rounded-xl bg-red-50">
              <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Success message */}
          {success && (
            <div className="flex items-start gap-3 px-4 py-3 mb-5 border border-green-100 rounded-xl bg-green-50">
              <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Full Name */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                className="w-full px-4 py-3 text-sm transition-all duration-200 bg-white border rounded-xl border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.rw"
                required
                className="w-full px-4 py-3 text-sm transition-all duration-200 bg-white border rounded-xl border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 py-3 text-sm transition-all duration-200 bg-white border pr-11 rounded-xl border-slate-200 text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-2 text-xs font-semibold tracking-widest uppercase text-slate-500">
                Confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={`w-full px-4 py-3 pr-11 rounded-xl border bg-white text-slate-800
                             text-sm placeholder-slate-300
                             focus:outline-none focus:ring-2 focus:border-transparent
                             transition-all duration-200
                             ${confirmPassword && password !== confirmPassword
                               ? "border-red-300 focus:ring-red-400"
                               : confirmPassword && password === confirmPassword
                               ? "border-green-300 focus:ring-green-400"
                               : "border-slate-200 focus:ring-indigo-500"
                             }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute transition-colors -translate-y-1/2 right-3 top-1/2 text-slate-300 hover:text-slate-500"
                >
                  {showConfirmPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1.5 text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200
                ${loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account…
                </span>
              ) : (
                `Register as ${selectedRole}`
              )}
            </button>

          </form>

          {/* Login link */}
          <p className="mt-6 text-sm text-center text-slate-400">
            Already have an account?{" "}
                <Link to="/loginpage" className="font-medium text-indigo-500 transition-colors hover:text-indigo-700">
                Sign in
                </Link>
          </p>

        </div>
      </div>

      {/* ── RIGHT PANEL: Branding ── */}
      <div className="relative flex-col items-center justify-center hidden w-1/2 px-16 overflow-hidden text-white bg-indigo-600 lg:flex">

        {/* Decorative circles */}
        <div className="absolute bg-indigo-500 rounded-full -top-24 -right-24 w-96 h-96 opacity-40" />
        <div className="absolute bg-indigo-700 rounded-full opacity-50 -bottom-32 -left-20 w-80 h-80" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500 rounded-full opacity-10" />

        {/* Content */}
        <div className="relative z-10 max-w-sm text-center">

          {/* Icon */}
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-8 border bg-white/10 backdrop-blur-sm border-white/20 rounded-2xl">
          <img src={logo} alt="Logo" className=" rounded rounded-md" />
          </div>

          <h2 className="mb-1 text-4xl font-bold tracking-tight">Apex Digital</h2>
          <h2 className="mb-6 text-4xl font-bold tracking-tight text-indigo-200">Solutions</h2>

          <p className="mb-8 text-sm leading-relaxed text-indigo-100">
            A place of learning and joy, located in a quiet and peaceful area.
            Beautiful classrooms, a spacious campus, and a well-stocked library — 
            everything a student needs to thrive.
          </p>

          {/* Stats row */}
          <div className="flex items-center justify-center gap-8 pt-6 border-t border-white/20">
            <div className="text-center">
              <p className="text-2xl font-bold">1,200+</p>
              <p className="mt-1 text-xs text-indigo-200">Students</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">80+</p>
              <p className="mt-1 text-xs text-indigo-200">Teachers</p>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">40+</p>
              <p className="mt-1 text-xs text-indigo-200">Courses</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
