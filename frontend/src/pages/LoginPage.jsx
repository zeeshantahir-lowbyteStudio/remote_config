import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginPage({ onLogin }) {
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleGoogleSuccess(credentialResponse) {
    setError("");
    try {
      const res = await fetch("/auth/google", {
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
      </div>
    </div>
  );
}