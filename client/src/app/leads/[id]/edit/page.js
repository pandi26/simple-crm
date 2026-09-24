"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

export default function EditLeadPage() {
  const params = useParams();
  const id = params?.id;

  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    source: "other",
    status: "new",
    value: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchLead = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await axios.get(
          `http://localhost:5000/api/leads/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const lead = response.data.lead;

        setFormData({
          name: lead.name || "",
          email: lead.email || "",
          phone: lead.phone || "",
          company: lead.company || "",
          source: lead.source || "other",
          status: lead.status || "new",
          value: lead.value || 0,
        });
      } catch (error) {
        console.error("Get Lead Error:", error);

        setMessage(
          error.response?.data?.message ||
            "Failed to load lead"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const token = localStorage.getItem("token");

      await axios.put(
        `http://localhost:5000/api/leads/${id}`,
        {
          ...formData,
          value: Number(formData.value),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Lead updated successfully!");

      setTimeout(() => {
        router.push(`/leads/${id}`);
      }, 700);
    } catch (error) {
      console.error("Update Lead Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to update lead"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p style={{ padding: "30px" }}>
        Loading lead...
      </p>
    );
  }

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">

          <button
            onClick={() => router.push(`/leads/${id}`)}
            style={{
              marginBottom: "20px",
              padding: "8px 15px",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>

          <div className="dashboard-card">

            <h1>Edit Lead</h1>

            {message && (
              <p style={{ marginTop: "15px" }}>
                {message}
              </p>
            )}

            <form
              onSubmit={handleSubmit}
              style={{
                marginTop: "25px",
                display: "grid",
                gap: "15px",
              }}
            >

              <div>
                <label>Name</label>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Email</label>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Phone</label>

                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Company</label>

                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Source</label>

                <select
                  name="source"
                  value={formData.source}
                  onChange={handleChange}
                >
                  <option value="website">
                    Website
                  </option>

                  <option value="referral">
                    Referral
                  </option>

                  <option value="social_media">
                    Social Media
                  </option>

                  <option value="advertisement">
                    Advertisement
                  </option>

                  <option value="other">
                    Other
                  </option>
                </select>
              </div>

              <div>
                <label>Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="new">
                    New
                  </option>

                  <option value="contacted">
                    Contacted
                  </option>

                  <option value="qualified">
                    Qualified
                  </option>

                  <option value="converted">
                    Converted
                  </option>

                  <option value="lost">
                    Lost
                  </option>
                </select>
              </div>

              <div>
                <label>Value</label>

                <input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  min="0"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "12px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer",
                }}
              >
                {saving
                  ? "Saving..."
                  : "Update Lead"}
              </button>

            </form>
          </div>

        </main>
      </div>
    </div>
  );
}