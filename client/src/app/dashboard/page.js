"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
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
      } catch (error) {
        console.error(error);

        localStorage.removeItem("token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">
          <div className="welcome-section">
            <h1>Dashboard</h1>

            {user && (
              <p>
                Welcome back, <strong>{user.name}</strong> 👋
              </p>
            )}
          </div>

          <div className="dashboard-grid">

            <div
              className="dashboard-card"
              onClick={() => router.push("/customers")}
            >
              <div className="card-icon">👥</div>

              <h2>Customers</h2>

              <p>
                Manage your customers and customer information.
              </p>

              <button>
                View Customers
              </button>
            </div>

            <div
              className="dashboard-card"
              onClick={() => router.push("/leads")}
            >
              <div className="card-icon">🎯</div>

              <h2>Leads</h2>

              <p>
                Track and manage your sales leads.
              </p>

              <button>
                View Leads
              </button>
            </div>

            <div
              className="dashboard-card"
              onClick={() => router.push("/tasks")}
            >
              <div className="card-icon">✅</div>

              <h2>Tasks</h2>

              <p>
                Manage tasks and follow-ups.
              </p>

              <button>
                View Tasks
              </button>
            </div>

            <div
              className="dashboard-card"
              onClick={() => router.push("/users")}
            >
              <div className="card-icon">👤</div>

              <h2>Users</h2>

              <p>
                Manage CRM users and roles.
              </p>

              <button>
                View Users
              </button>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}