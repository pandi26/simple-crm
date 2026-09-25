"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );

      setSuccess("Account created successfully!");

      setTimeout(() => {
        router.push("/login");
      }, 1000);
    } catch (error) {
      console.error("Register Error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to create account"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#f5f6f8",
      }}
    >
      <div
        style={{
          width: "400px",
          background: "#fff",
          padding: "30px",
          borderRadius: "10px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginBottom: "8px" }}>Create Account</h1>

        <p style={{ color: "#666", marginBottom: "25px" }}>
          Create your CRM account
        </p>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#b91c1c",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "10px",
              borderRadius: "6px",
              marginBottom: "15px",
            }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label>Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              style={{
                width: "100%",
                padding: "10px",
                marginTop: "6px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: "20px", textAlign: "center" }}>
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            style={{
              border: "none",
              background: "none",
              color: "#2563eb",
              cursor: "pointer",
            }}
          >
            Login
          </button>
        </p>
      </div>
    </main>
  );
}