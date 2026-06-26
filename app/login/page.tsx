"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Wrong password. Try again.");
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#f6f7f9", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    }}>
      <div style={{
        background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12,
        padding: "36px 40px", width: 320, boxShadow: "0 1px 4px rgba(0,0,0,.06)",
      }}>
        <h1 style={{ fontSize: 18, fontWeight: 650, margin: "0 0 6px" }}>Retention Snapshot</h1>
        <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 24px" }}>Enter the shared password to continue.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box", padding: "9px 12px",
              border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14,
              fontFamily: "inherit", outline: "none", marginBottom: 12,
            }}
          />
          {error && <p style={{ color: "#ef4444", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              width: "100%", padding: "9px 0", background: "#1a1d21", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
              cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: loading || !password ? 0.6 : 1,
            }}
          >
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
