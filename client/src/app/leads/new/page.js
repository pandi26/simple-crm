"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function NewLeadPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "other",
    status: "new",
    value: "",
    assignedTo: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [message, setMessage] = useState("");

  // Get sales users
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:5000/api/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const allUsers = response.data.users || [];

        // Only show sales users for assignment
        const salesUsers = allUsers.filter(
          (user) => user.role === "sales"
        );

        setUsers(salesUsers);
      } catch (error) {
        console.error("Users Error:", error);

        setMessage(
          error.response?.data?.message ||
            "Failed to load users"
        );
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const data = {
        ...formData,
        value: Number(formData.value) || 0,
      };

      // Don't send empty assignment
      if (!data.assignedTo) {
        delete data.assignedTo;
      }

      await axios.post(
        "http://localhost:5000/api/leads",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Lead created successfully!");

      setTimeout(() => {
        router.push("/leads");
      }, 1000);
    } catch (error) {
      console.error("Create Lead Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to create lead"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1>Create Lead</h1>

      <p style={{ marginBottom: "25px" }}>
        Add a new sales lead
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "600px",
        }}
      >
        {/* Name */}
        <div>
          <label>Name</label>
          <br />

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Lead name"
            required
          />
        </div>

        <br />

        {/* Email */}
        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Lead email"
            required
          />
        </div>

        <br />

        {/* Phone */}
        <div>
          <label>Phone</label>
          <br />

          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Lead phone"
            required
          />
        </div>

        <br />

        {/* Company */}
        <div>
          <label>Company</label>
          <br />

          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Company name"
          />
        </div>

        <br />

        {/* Source */}
        <div>
          <label>Source</label>
          <br />

          <select
            name="source"
            value={formData.source}
            onChange={handleChange}
          >
            <option value="website">Website</option>
            <option value="referral">Referral</option>
            <option value="social_media">
              Social Media
            </option>
            <option value="advertisement">
              Advertisement
            </option>
            <option value="other">Other</option>
          </select>
        </div>

        <br />

        {/* Status */}
        <div>
          <label>Status</label>
          <br />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
        </div>

        <br />

        {/* Value */}
        <div>
          <label>Lead Value</label>
          <br />

          <input
            type="number"
            name="value"
            value={formData.value}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />
        </div>

        <br />

        {/* Assign */}
        <div>
          <label>Assign To</label>
          <br />

          {loadingUsers ? (
            <p>Loading sales users...</p>
          ) : (
            <select
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleChange}
            >
              <option value="">
                -- Unassigned --
              </option>

              {users.map((user) => (
                <option
                  key={user._id}
                  value={user._id}
                >
                  {user.name} - {user.email}
                </option>
              ))}
            </select>
          )}
        </div>

        <br />

        <button
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create Lead"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/leads")}
          style={{ marginLeft: "10px" }}
        >
          Cancel
        </button>
      </form>

      {message && (
        <p style={{ marginTop: "20px" }}>
          {message}
        </p>
      )}
    </div>
  );
}