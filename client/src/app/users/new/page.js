"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function NewUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      await axios.post(
        "http://localhost:5000/api/users",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/users");
    } catch (error) {
      console.error("Create User Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">

          <div style={{ marginBottom: "25px" }}>
            <h1>Add User</h1>
            <p>Create a new CRM user</p>
          </div>

          <div
            style={{
              maxWidth: "600px",
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <form onSubmit={handleSubmit}>

              {/* Name */}

              <div style={{ marginBottom: "18px" }}>
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter name"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                />
              </div>

              {/* Email */}

              <div style={{ marginBottom: "18px" }}>
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter email"
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                />
              </div>

              {/* Password */}

              <div style={{ marginBottom: "18px" }}>
                <label>Password</label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                  minLength={6}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                />
              </div>

              {/* Role */}

              <div style={{ marginBottom: "18px" }}>
                <label>Role</label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                >
                  <option value="user">
                    User
                  </option>

                  <option value="sales">
                    Sales
                  </option>

                  <option value="admin">
                    Admin
                  </option>
                </select>
              </div>

              {/* Error */}

              {message && (
                <p
                  style={{
                    color: "red",
                    marginBottom: "15px",
                  }}
                >
                  {message}
                </p>
              )}

              {/* Buttons */}

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer",
                  }}
                >
                  {loading
                    ? "Creating..."
                    : "Create User"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/users")
                  }
                  style={{
                    padding: "10px 18px",
                    background: "#e5e7eb",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>

        </main>
      </div>
    </div>
  );
}