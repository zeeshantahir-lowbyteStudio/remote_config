import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      const res = await fetch(`${API_BASE}/auth/google`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("rc_token", data.token);
      localStorage.setItem("rc_user", JSON.stringify(data.user));
      onLogin(data.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    }
  }
  async function handleCredentialsLogin(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("rc_token", data.token);
      localStorage.setItem("rc_user", JSON.stringify(data.user));
      onLogin(data.user);
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Could not connect to server. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm w-full max-w-sm p-6 text-center">
        <h1 className="text-lg font-semibold mb-1">Remote Config</h1>
        <p className="text-sm text-gray-500 mb-6">Sign in with your Lowbyte Studio account</p>

        {error && (
          <div className="mb-4 text-xs text-red-700 bg-red-50 px-3 py-2 rounded-md">
            {error}
          </div>
        )}

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in failed")}
          />
        </div>
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or sign in with invite credentials</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleCredentialsLogin} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}