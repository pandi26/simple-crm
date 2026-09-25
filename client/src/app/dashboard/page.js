"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

const initialStats = {
  customers: 0,
  leads: 0,
  newLeads: 0,
  convertedLeads: 0,
  pendingTasks: 0,
  completedTasks: 0,
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(initialStats);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
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

      try {
        // --------------------------------
        // Get logged-in user
        // --------------------------------
        const profileResponse = await axios.get(
          `${API_URL}/auth/profile`,
          config
        );

        const currentUser = profileResponse.data.user;

        setUser(currentUser);

        const role = currentUser.role;

        // --------------------------------
        // Dashboard data
        // --------------------------------
        let customers = [];
        let leads = [];
        let tasks = [];

        // Admin can access everything
        if (role === "admin") {
          const [customersResponse, leadsResponse, tasksResponse] =
            await Promise.all([
              axios.get(`${API_URL}/customers`, config),
              axios.get(`${API_URL}/leads`, config),
              axios.get(`${API_URL}/tasks`, config),
            ]);

          customers = customersResponse.data.customers || [];
          leads = leadsResponse.data.leads || [];
          tasks = tasksResponse.data.tasks || [];
        }

        // Sales can access leads and tasks
        else if (role === "sales") {
          const [leadsResponse, tasksResponse] =
            await Promise.all([
              axios.get(`${API_URL}/leads`, config),
              axios.get(`${API_URL}/tasks`, config),
            ]);

          leads = leadsResponse.data.leads || [];
          tasks = tasksResponse.data.tasks || [];
        }

        // Normal users don't have access
        // to customers, leads or tasks
        else {
          customers = [];
          leads = [];
          tasks = [];
        }

        // --------------------------------
        // Calculate statistics
        // --------------------------------
        const newLeads = leads.filter(
          (lead) => lead.status === "new"
        ).length;

        const convertedLeads = leads.filter(
          (lead) => lead.status === "converted"
        ).length;

        const pendingTasks = tasks.filter(
          (task) =>
            task.status === "pending" ||
            task.status === "in_progress"
        ).length;

        const completedTasks = tasks.filter(
          (task) => task.status === "completed"
        ).length;

        setStats({
          customers: customers.length,
          leads: leads.length,
          newLeads,
          convertedLeads,
          pendingTasks,
          completedTasks,
        });

        // --------------------------------
        // Recent leads
        // --------------------------------
        const sortedLeads = [...leads]
          .sort(
            (a, b) =>
              new Date(b.createdAt) -
              new Date(a.createdAt)
          )
          .slice(0, 5);

        setRecentLeads(sortedLeads);
      } catch (error) {
        console.error("Dashboard Error:", error);

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          router.replace("/login");
        }
      } finally {
        setStatsLoading(false);
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  // --------------------------------
  // Loading
  // --------------------------------

  if (loading) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isSales =
    user?.role === "admin" ||
    user?.role === "sales";

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">
          {/* Welcome */}
          <div className="welcome-section">
            <h1>Dashboard</h1>

            {user && (
              <p>
                Welcome back,{" "}
                <strong>{user.name}</strong> 👋
              </p>
            )}
          </div>

          {/* Statistics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            {/* Customers - Admin only */}
            {isAdmin && (
              <div
                className="dashboard-card"
                onClick={() =>
                  router.push("/customers")
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-icon">👥</div>

                <h2>
                  {statsLoading
                    ? "..."
                    : stats.customers}
                </h2>

                <p>Total Customers</p>
              </div>
            )}

            {/* Total Leads */}
            {isSales && (
              <div
                className="dashboard-card"
                onClick={() =>
                  router.push("/leads")
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-icon">🎯</div>

                <h2>
                  {statsLoading
                    ? "..."
                    : stats.leads}
                </h2>

                <p>Total Leads</p>
              </div>
            )}

            {/* New Leads */}
            {isSales && (
              <div
                className="dashboard-card"
                onClick={() =>
                  router.push("/leads")
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-icon">🆕</div>

                <h2>
                  {statsLoading
                    ? "..."
                    : stats.newLeads}
                </h2>

                <p>New Leads</p>
              </div>
            )}

            {/* Converted Leads */}
            {isSales && (
              <div
                className="dashboard-card"
                onClick={() =>
                  router.push("/leads")
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-icon">🎉</div>

                <h2>
                  {statsLoading
                    ? "..."
                    : stats.convertedLeads}
                </h2>

                <p>Converted Leads</p>
              </div>
            )}

            {/* Pending Tasks */}
            {isSales && (
              <div
                className="dashboard-card"
                onClick={() =>
                  router.push("/tasks")
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-icon">⏳</div>

                <h2>
                  {statsLoading
                    ? "..."
                    : stats.pendingTasks}
                </h2>

                <p>Pending Tasks</p>
              </div>
            )}

            {/* Completed Tasks */}
            {isSales && (
              <div
                className="dashboard-card"
                onClick={() =>
                  router.push("/tasks")
                }
                style={{ cursor: "pointer" }}
              >
                <div className="card-icon">✅</div>

                <h2>
                  {statsLoading
                    ? "..."
                    : stats.completedTasks}
                </h2>

                <p>Completed Tasks</p>
              </div>
            )}
          </div>

          {/* Quick Access */}
          <h2 style={{ marginBottom: "20px" }}>
            Quick Access
          </h2>

          <div className="dashboard-grid">
            {/* Customers */}
            {isAdmin && (
              <div className="dashboard-card">
                <div className="card-icon">👥</div>

                <h2>Customers</h2>

                <p>
                  Manage your customers and
                  customer information.
                </p>

                <button
                  onClick={() =>
                    router.push("/customers")
                  }
                >
                  View Customers
                </button>
              </div>
            )}

            {/* Leads */}
            {isSales && (
              <div className="dashboard-card">
                <div className="card-icon">🎯</div>

                <h2>Leads</h2>

                <p>
                  Track and manage your sales
                  leads.
                </p>

                <button
                  onClick={() =>
                    router.push("/leads")
                  }
                >
                  View Leads
                </button>
              </div>
            )}

            {/* Tasks */}
            {isSales && (
              <div className="dashboard-card">
                <div className="card-icon">✅</div>

                <h2>Tasks</h2>

                <p>
                  Manage tasks and follow-ups.
                </p>

                <button
                  onClick={() =>
                    router.push("/tasks")
                  }
                >
                  View Tasks
                </button>
              </div>
            )}

            {/* Users */}
            {isAdmin && (
              <div className="dashboard-card">
                <div className="card-icon">👤</div>

                <h2>Users</h2>

                <p>
                  Manage CRM users and roles.
                </p>

                <button
                  onClick={() =>
                    router.push("/users")
                  }
                >
                  View Users
                </button>
              </div>
            )}
          </div>

          {/* Recent Leads */}
          {isSales && (
            <div
              className="dashboard-card"
              style={{ marginTop: "30px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h2>Recent Leads</h2>

                <button
                  onClick={() =>
                    router.push("/leads")
                  }
                >
                  View All
                </button>
              </div>

              {statsLoading ? (
                <p>Loading recent leads...</p>
              ) : recentLeads.length === 0 ? (
                <p>No leads found.</p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          textAlign: "left",
                          borderBottom:
                            "1px solid #e5e7eb",
                        }}
                      >
                        <th style={{ padding: "12px" }}>
                          Name
                        </th>

                        <th style={{ padding: "12px" }}>
                          Company
                        </th>

                        <th style={{ padding: "12px" }}>
                          Status
                        </th>

                        <th style={{ padding: "12px" }}>
                          Value
                        </th>

                        <th style={{ padding: "12px" }}>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {recentLeads.map((lead) => (
                        <tr
                          key={lead._id}
                          style={{
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <td style={{ padding: "12px" }}>
                            {lead.name}
                          </td>

                          <td style={{ padding: "12px" }}>
                            {lead.company || "-"}
                          </td>

                          <td style={{ padding: "12px" }}>
                            {lead.status}
                          </td>

                          <td style={{ padding: "12px" }}>
                            ₹{lead.value || 0}
                          </td>

                          <td style={{ padding: "12px" }}>
                            <button
                              onClick={() =>
                                router.push(
                                  `/leads/${lead._id}`
                                )
                              }
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}