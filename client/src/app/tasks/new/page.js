"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function NewTaskPage() {
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    lead: "",
    assignedTo: "",
    priority: "medium",
    dueDate: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");

  // Load leads and sales users
  useEffect(() => {
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

        const [leadResponse, userResponse] =
          await Promise.all([
            axios.get(
              "http://localhost:5000/api/leads",
              config
            ),
            axios.get(
              "http://localhost:5000/api/users",
              config
            ),
          ]);

        setLeads(leadResponse.data.leads || []);

        const users = userResponse.data.users || [];

        setSalesUsers(
          users.filter(
            (user) => user.role === "sales"
          )
        );
      } catch (error) {
        console.error("Load Task Data Error:", error);

        setMessage(
          error.response?.data?.message ||
            "Failed to load task data"
        );
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [router]);

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

      if (!formData.lead) {
        setMessage("Please select a lead");
        setLoading(false);
        return;
      }

      if (!formData.assignedTo) {
        setMessage(
          "Please select a sales user"
        );
        setLoading(false);
        return;
      }

      await axios.post(
        "http://localhost:5000/api/tasks",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      router.push("/tasks");
    } catch (error) {
      console.error("Create Task Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to create task"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="crm-layout">
        <Sidebar />

        <div className="main-section">
          <Navbar />

          <main className="dashboard-content">
            <p>Loading task form...</p>
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
            <h1>Add Task</h1>

            <p>
              Create a new CRM task
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
                  placeholder="Example: Call customer"
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
                  placeholder="Enter task details"
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
                      {lead.name}{" "}
                      {lead.company
                        ? `- ${lead.company}`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sales User */}

              <div style={{ marginBottom: "18px" }}>
                <label>
                  Assign To
                </label>

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
                    : "Create Task"}
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