"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/users/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const user = response.data.user;

      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        role: user.role || "user",
      });
    } catch (error) {
      console.error("Get User Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to load user"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchUser();
    }
  }, [params.id]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const updateData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // Only send password if entered
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await axios.put(
        `http://localhost:5000/api/users/${params.id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/users");
    } catch (error) {
      console.error("Update User Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to update user"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="crm-layout">
        <Sidebar />

        <div className="main-section">
          <Navbar />

          <main className="dashboard-content">
            <p>Loading user...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">

          <div style={{ marginBottom: "25px" }}>
            <h1>Edit User</h1>
            <p>Update CRM user details</p>
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
                <label>
                  New Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Leave empty to keep current password"
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
                  disabled={saving}
                  style={{
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer",
                  }}
                >
                  {saving
                    ? "Saving..."
                    : "Update User"}
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