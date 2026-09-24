"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lead: "",
    assignedTo: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!params.id) return;

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.replace("/login");
          return;
        }

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const [taskResponse, leadResponse, userResponse] =
          await Promise.all([
            axios.get(
              `http://localhost:5000/api/tasks/${params.id}`,
              config
            ),
            axios.get(
              "http://localhost:5000/api/leads",
              config
            ),
            axios.get(
              "http://localhost:5000/api/users",
              config
            ),
          ]);

        const task = taskResponse.data.task;

        setLeads(leadResponse.data.leads || []);

        const users = userResponse.data.users || [];

        setSalesUsers(
          users.filter(
            (user) => user.role === "sales"
          )
        );

        setFormData({
          title: task.title || "",
          description: task.description || "",
          lead: task.lead?._id || task.lead || "",
          assignedTo:
            task.assignedTo?._id ||
            task.assignedTo ||
            "",
          priority: task.priority || "medium",
          status: task.status || "pending",
          dueDate: task.dueDate
            ? task.dueDate.split("T")[0]
            : "",
        });
      } catch (error) {
        console.error("Load Task Error:", error);

        setMessage(
          error.response?.data?.message ||
            "Failed to load task"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

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

      await axios.put(
        `http://localhost:5000/api/tasks/${params.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/tasks");
    } catch (error) {
      console.error("Update Task Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to update task"
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
            <p>Loading task...</p>
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
            <h1>Edit Task</h1>

            <p>
              Update task details
            </p>
          </div>

          <div
            style={{
              maxWidth: "650px",
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
            }}
          >
            <form onSubmit={handleSubmit}>

              {/* Title */}

              <div style={{ marginBottom: "18px" }}>
                <label>Task Title</label>

                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                />
              </div>

              {/* Description */}

              <div style={{ marginBottom: "18px" }}>
                <label>Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                    resize: "vertical",
                  }}
                />
              </div>

              {/* Lead */}

              <div style={{ marginBottom: "18px" }}>
                <label>Lead</label>

                <select
                  name="lead"
                  value={formData.lead}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                >
                  <option value="">
                    Select Lead
                  </option>

                  {leads.map((lead) => (
                    <option
                      key={lead._id}
                      value={lead._id}
                    >
                      {lead.name}
                      {lead.company
                        ? ` - ${lead.company}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned User */}

              <div style={{ marginBottom: "18px" }}>
                <label>Assign To</label>

                <select
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                >
                  <option value="">
                    Select Sales User
                  </option>

                  {salesUsers.map((user) => (
                    <option
                      key={user._id}
                      value={user._id}
                    >
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}

              <div style={{ marginBottom: "18px" }}>
                <label>Priority</label>

                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                >
                  <option value="low">
                    Low
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="high">
                    High
                  </option>

                  <option value="urgent">
                    Urgent
                  </option>
                </select>
              </div>

              {/* Status */}

              <div style={{ marginBottom: "18px" }}>
                <label>Status</label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                >
                  <option value="pending">
                    Pending
                  </option>

                  <option value="in_progress">
                    In Progress
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
                </select>
              </div>

              {/* Due Date */}

              <div style={{ marginBottom: "18px" }}>
                <label>Due Date</label>

                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginTop: "6px",
                  }}
                />
              </div>

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
                    : "Update Task"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/tasks")
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