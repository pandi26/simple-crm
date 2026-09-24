"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);

  const [stats, setStats] = useState({
    customers: 0,
    leads: 0,
    newLeads: 0,
    convertedLeads: 0,
    pendingTasks: 0,
    completedTasks: 0,
  });

  const [recentLeads, setRecentLeads] = useState([]);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] =
    useState(true);

  // =========================
  // Fetch Profile
  // =========================

  const getProfile = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return null;
    }

    try {
      const response = await axios.get(
        "http://localhost:5000/api/auth/profile",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUser(response.data.user);

      return token;
    } catch (error) {
      console.error(
        "Profile Error:",
        error
      );

      localStorage.removeItem("token");
      router.replace("/login");

      return null;
    }
  };

  // =========================
  // Fetch Dashboard Data
  // =========================

  const getDashboardData = async (token) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [
        customersResponse,
        leadsResponse,
        tasksResponse,
      ] = await Promise.all([
        axios.get(
          "http://localhost:5000/api/customers",
          config
        ),

        axios.get(
          "http://localhost:5000/api/leads",
          config
        ),

        axios.get(
          "http://localhost:5000/api/tasks",
          config
        ),
      ]);

      const customers =
        customersResponse.data.customers || [];

      const leads =
        leadsResponse.data.leads || [];

      const tasks =
        tasksResponse.data.tasks || [];

      // Lead statistics

      const newLeads = leads.filter(
        (lead) => lead.status === "new"
      ).length;

      const convertedLeads = leads.filter(
        (lead) =>
          lead.status === "converted"
      ).length;

      // Task statistics

      const pendingTasks = tasks.filter(
        (task) =>
          task.status === "pending" ||
          task.status === "in_progress"
      ).length;

      const completedTasks = tasks.filter(
        (task) =>
          task.status === "completed"
      ).length;

      setStats({
        customers: customers.length,
        leads: leads.length,
        newLeads,
        convertedLeads,
        pendingTasks,
        completedTasks,
      });

      // Show latest 5 leads

      const sortedLeads = [...leads]
        .sort(
          (a, b) =>
            new Date(b.createdAt) -
            new Date(a.createdAt)
        )
        .slice(0, 5);

      setRecentLeads(sortedLeads);
    } catch (error) {
      console.error(
        "Dashboard Data Error:",
        error
      );
    } finally {
      setStatsLoading(false);
    }
  };

  // =========================
  // Load Dashboard
  // =========================

  useEffect(() => {
    const loadDashboard = async () => {
      const token = await getProfile();

      if (token) {
        await getDashboardData(token);
      }

      setLoading(false);
    };

    loadDashboard();
  }, [router]);

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="loading">
        Loading...
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

          {/* Welcome */}

          <div className="welcome-section">
            <h1>Dashboard</h1>

            {user && (
              <p>
                Welcome back,{" "}
                <strong>
                  {user.name}
                </strong>{" "}
                👋
              </p>
            )}
          </div>

          {/* =========================
              Statistics
          ========================= */}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              marginBottom: "30px",
            }}
          >

            {/* Customers */}

            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/customers")
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div className="card-icon">
                👥
              </div>

              <h2>
                {statsLoading
                  ? "..."
                  : stats.customers}
              </h2>

              <p>Total Customers</p>
            </div>

            {/* Leads */}

            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/leads")
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div className="card-icon">
                🎯
              </div>

              <h2>
                {statsLoading
                  ? "..."
                  : stats.leads}
              </h2>

              <p>Total Leads</p>
            </div>

            {/* New Leads */}

            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/leads")
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div className="card-icon">
                🆕
              </div>

              <h2>
                {statsLoading
                  ? "..."
                  : stats.newLeads}
              </h2>

              <p>New Leads</p>
            </div>

            {/* Converted */}

            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/leads")
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div className="card-icon">
                🎉
              </div>

              <h2>
                {statsLoading
                  ? "..."
                  : stats.convertedLeads}
              </h2>

              <p>Converted Leads</p>
            </div>

            {/* Pending Tasks */}

            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/tasks")
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div className="card-icon">
                ⏳
              </div>

              <h2>
                {statsLoading
                  ? "..."
                  : stats.pendingTasks}
              </h2>

              <p>Pending Tasks</p>
            </div>

            {/* Completed Tasks */}

            <div
              className="dashboard-card"
              onClick={() =>
                router.push("/tasks")
              }
              style={{
                cursor: "pointer",
              }}
            >
              <div className="card-icon">
                ✅
              </div>

              <h2>
                {statsLoading
                  ? "..."
                  : stats.completedTasks}
              </h2>

              <p>Completed Tasks</p>
            </div>

          </div>

          {/* =========================
              Quick Navigation
          ========================= */}

          <h2
            style={{
              marginBottom: "20px",
            }}
          >
            Quick Access
          </h2>

          <div className="dashboard-grid">

            <div className="dashboard-card">
              <div className="card-icon">
                👥
              </div>

              <h2>Customers</h2>

              <p>
                Manage your customers and
                customer information.
              </p>

              <button
                onClick={() =>
                  router.push(
                    "/customers"
                  )
                }
              >
                View Customers
              </button>
            </div>

            <div className="dashboard-card">
              <div className="card-icon">
                🎯
              </div>

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

            <div className="dashboard-card">
              <div className="card-icon">
                ✅
              </div>

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

            <div className="dashboard-card">
              <div className="card-icon">
                👤
              </div>

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

          </div>

          {/* =========================
              Recent Leads
          ========================= */}

          <div
            className="dashboard-card"
            style={{
              marginTop: "30px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2>
                Recent Leads
              </h2>

              <button
                onClick={() =>
                  router.push("/leads")
                }
              >
                View All
              </button>
            </div>

            {statsLoading ? (
              <p>
                Loading recent leads...
              </p>
            ) : recentLeads.length === 0 ? (
              <p>
                No leads found.
              </p>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse:
                      "collapse",
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
                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Name
                      </th>

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Company
                      </th>

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Status
                      </th>

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Value
                      </th>

                      <th
                        style={{
                          padding: "12px",
                        }}
                      >
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {recentLeads.map(
                      (lead) => (
                        <tr
                          key={lead._id}
                          style={{
                            borderBottom:
                              "1px solid #f1f5f9",
                          }}
                        >
                          <td
                            style={{
                              padding:
                                "12px",
                            }}
                          >
                            {lead.name}
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                            }}
                          >
                            {lead.company ||
                              "-"}
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                            }}
                          >
                            {lead.status}
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                            }}
                          >
                            ₹
                            {lead.value ||
                              0}
                          </td>

                          <td
                            style={{
                              padding:
                                "12px",
                            }}
                          >
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
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </main>
      </div>
    </div>
  );
}