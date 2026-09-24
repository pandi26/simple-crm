"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  // =========================
  // Lead
  // =========================

  const [lead, setLead] = useState(null);

  // =========================
  // Activities
  // =========================

  const [activities, setActivities] = useState([]);
  const [activityType, setActivityType] = useState("note");
  const [activityDescription, setActivityDescription] =
    useState("");
  const [activityLoading, setActivityLoading] =
    useState(false);

  // =========================
  // Sales Users
  // =========================

  const [salesUsers, setSalesUsers] = useState([]);
  const [selectedSalesUser, setSelectedSalesUser] =
    useState("");
  const [assignLoading, setAssignLoading] =
    useState(false);

  // =========================
  // Page
  // =========================

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // =========================
  // Fetch Lead
  // =========================

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

      setLead(response.data.lead);
    } catch (error) {
      console.error("Get Lead Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Failed to load lead"
      );
    }
  };

  // =========================
  // Fetch Activities
  // =========================

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/leads/${id}/activities`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActivities(
        response.data.activities || []
      );
    } catch (error) {
      console.error(
        "Get Activities Error:",
        error
      );
    }
  };

  // =========================
  // Fetch Sales Users
  // =========================

  const fetchSalesUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const users = response.data.users || [];

      const sales = users.filter(
        (user) => user.role === "sales"
      );

      setSalesUsers(sales);
    } catch (error) {
      console.error(
        "Get Sales Users Error:",
        error
      );
    }
  };

  // =========================
  // Add Activity
  // =========================

  const handleAddActivity = async (e) => {
    e.preventDefault();

    if (!activityDescription.trim()) {
      setMessage(
        "Please enter an activity description"
      );
      return;
    }

    try {
      setActivityLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      await axios.post(
        `http://localhost:5000/api/leads/${id}/activities`,
        {
          type: activityType,
          description:
            activityDescription.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setActivityDescription("");
      setActivityType("note");

      await fetchActivities();

      setMessage(
        "Activity added successfully!"
      );
    } catch (error) {
      console.error(
        "Add Activity Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to add activity"
      );
    } finally {
      setActivityLoading(false);
    }
  };

  // =========================
  // Assign Lead
  // =========================

  const handleAssignLead = async () => {
    if (!selectedSalesUser) {
      setMessage(
        "Please select a sales user"
      );
      return;
    }

    try {
      setAssignLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      await axios.put(
        `http://localhost:5000/api/leads/${id}/assign`,
        {
          assignedTo: selectedSalesUser,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage(
        "Lead assigned successfully!"
      );

      setSelectedSalesUser("");

      await fetchLead();
      await fetchActivities();
    } catch (error) {
      console.error(
        "Assign Lead Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to assign lead"
      );
    } finally {
      setAssignLoading(false);
    }
  };

  // =========================
  // Load Page
  // =========================

  useEffect(() => {
    if (!id) {
      return;
    }

    const loadData = async () => {
      await fetchLead();
      await fetchActivities();
      await fetchSalesUsers();

      setLoading(false);
    };

    loadData();
  }, [id]);

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="crm-layout">
        <Sidebar />

        <div className="main-section">
          <Navbar />

          <main className="dashboard-content">
            <p>Loading lead...</p>
          </main>
        </div>
      </div>
    );
  }

  // =========================
  // Lead Not Found
  // =========================

  if (!lead) {
    return (
      <div className="crm-layout">
        <Sidebar />

        <div className="main-section">
          <Navbar />

          <main className="dashboard-content">
            <h2>Lead not found</h2>

            <p>{message}</p>

            <button
              onClick={() =>
                router.push("/leads")
              }
              style={{
                marginTop: "15px",
                padding: "10px 15px",
                cursor: "pointer",
              }}
            >
              Back to Leads
            </button>
          </main>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">

          {/* Back Button */}

          <button
            onClick={() =>
              router.push("/leads")
            }
            style={{
              marginBottom: "20px",
              padding: "8px 15px",
              cursor: "pointer",
            }}
          >
            ← Back to Leads
          </button>

          {/* Header */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
              gap: "15px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1>{lead.name}</h1>

              <p>
                {lead.company ||
                  "No company"}
              </p>
            </div>

            <button
              onClick={() =>
                router.push(
                  `/leads/${lead._id}/edit`
                )
              }
              style={{
                padding: "10px 18px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              Edit Lead
            </button>
          </div>

          {/* Message */}

          {message && (
            <div
              style={{
                marginBottom: "20px",
                padding: "12px 15px",
                background: "#f3f4f6",
                borderRadius: "7px",
              }}
            >
              {message}
            </div>
          )}

          {/* =========================
              Lead Information
          ========================= */}

          <div
            className="dashboard-card"
            style={{
              marginBottom: "25px",
            }}
          >
            <h2>Lead Information</h2>

            <div
              style={{
                marginTop: "20px",
                lineHeight: "2",
              }}
            >
              <p>
                <strong>Email:</strong>{" "}
                {lead.email}
              </p>

              <p>
                <strong>Phone:</strong>{" "}
                {lead.phone}
              </p>

              <p>
                <strong>Company:</strong>{" "}
                {lead.company || "-"}
              </p>

              <p>
                <strong>Source:</strong>{" "}
                {lead.source || "-"}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {lead.status || "-"}
              </p>

              <p>
                <strong>Value:</strong>{" "}
                ₹{lead.value || 0}
              </p>

              <p>
                <strong>Assigned To:</strong>{" "}
                {lead.assignedTo?.name ||
                  "Unassigned"}
              </p>

              <p>
                <strong>Created By:</strong>{" "}
                {lead.createdBy?.name ||
                  "-"}
              </p>
            </div>

            {/* =========================
                Assign Lead
            ========================= */}

            <div
              style={{
                marginTop: "25px",
                padding: "18px",
                background: "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <h3>Assign Lead</h3>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  marginTop: "12px",
                  flexWrap: "wrap",
                }}
              >
                <select
                  value={selectedSalesUser}
                  onChange={(e) =>
                    setSelectedSalesUser(
                      e.target.value
                    )
                  }
                  style={{
                    padding: "10px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                    minWidth: "250px",
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
                      {user.name} (
                      {user.email})
                    </option>
                  ))}
                </select>

                <button
                  onClick={
                    handleAssignLead
                  }
                  disabled={assignLoading}
                  style={{
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {assignLoading
                    ? "Assigning..."
                    : "Assign Lead"}
                </button>
              </div>

              {salesUsers.length === 0 && (
                <p
                  style={{
                    marginTop: "10px",
                    color: "#6b7280",
                  }}
                >
                  No sales users found.
                </p>
              )}
            </div>
          </div>

          {/* =========================
              Activity History
          ========================= */}

          <div className="dashboard-card">

            <h2>Activity History</h2>

            {/* Add Activity */}

            <form
              onSubmit={handleAddActivity}
              style={{
                marginTop: "20px",
                padding: "20px",
                background: "#f8fafc",
                borderRadius: "8px",
              }}
            >
              <h3>Add Activity</h3>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "15px",
                  flexWrap: "wrap",
                }}
              >
                {/* Activity Type */}

                <select
                  value={activityType}
                  onChange={(e) =>
                    setActivityType(
                      e.target.value
                    )
                  }
                  style={{
                    padding: "10px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                >
                  <option value="note">
                    Note
                  </option>

                  <option value="call">
                    Call
                  </option>

                  <option value="email">
                    Email
                  </option>

                  <option value="meeting">
                    Meeting
                  </option>
                </select>

                {/* Description */}

                <input
                  type="text"
                  placeholder="Enter activity description..."
                  value={activityDescription}
                  onChange={(e) =>
                    setActivityDescription(
                      e.target.value
                    )
                  }
                  style={{
                    flex: 1,
                    minWidth: "250px",
                    padding: "10px",
                    border:
                      "1px solid #d1d5db",
                    borderRadius: "6px",
                  }}
                />

                {/* Add Button */}

                <button
                  type="submit"
                  disabled={activityLoading}
                  style={{
                    padding: "10px 18px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  {activityLoading
                    ? "Adding..."
                    : "Add Activity"}
                </button>
              </div>
            </form>

            {/* Activity List */}

            {activities.length === 0 ? (
              <div
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  textAlign: "center",
                  background: "#f9fafb",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                  }}
                >
                  No activities yet.
                </p>

                <small
                  style={{
                    color: "#6b7280",
                  }}
                >
                  Add a note, call, email,
                  or meeting above.
                </small>
              </div>
            ) : (
              <div
                style={{
                  marginTop: "20px",
                }}
              >
                {activities.map(
                  (activity) => (
                    <div
                      key={activity._id}
                      style={{
                        padding: "16px",
                        marginBottom: "12px",
                        background: "#f9fafb",
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          alignItems:
                            "center",
                          gap: "10px",
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <strong
                          style={{
                            textTransform:
                              "uppercase",
                          }}
                        >
                          {activity.type}
                        </strong>

                        <small
                          style={{
                            color:
                              "#6b7280",
                          }}
                        >
                          {activity.createdAt
                            ? new Date(
                                activity.createdAt
                              ).toLocaleString()
                            : "-"}
                        </small>
                      </div>

                      <p
                        style={{
                          margin: "10px 0",
                        }}
                      >
                        {activity.description}
                      </p>

                      <small
                        style={{
                          color:
                            "#6b7280",
                        }}
                      >
                        Added by{" "}
                        <strong>
                          {activity.user
                            ?.name ||
                            "Unknown"}
                        </strong>
                      </small>
                    </div>
                  )
                )}
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}