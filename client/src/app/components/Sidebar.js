"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Sidebar() {
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
        console.error(
          "Sidebar Profile Error:",
          error
        );

        localStorage.removeItem("token");
        router.replace("/login");
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  if (loading) {
    return (
      <aside className="sidebar">
        <div className="sidebar-logo">
          CRM
        </div>
      </aside>
    );
  }

  const role = user?.role;

  return (
    <aside className="sidebar">

      {/* Logo */}

      <div className="sidebar-logo">
        CRM
      </div>

      {/* User */}

      {user && (
        <div
          style={{
            padding: "15px",
            marginBottom: "10px",
            borderBottom:
              "1px solid #e5e7eb",
          }}
        >
          <strong>
            {user.name}
          </strong>

          <div
            style={{
              fontSize: "13px",
              marginTop: "4px",
              color: "#6b7280",
              textTransform: "capitalize",
            }}
          >
            {role}
          </div>
        </div>
      )}

      {/* Navigation */}

      <nav className="sidebar-nav">

        {/* Dashboard - Everyone */}

        <button
          onClick={() =>
            router.push("/dashboard")
          }
        >
          Dashboard
        </button>

        {/* Customers - Admin */}

        {role === "admin" && (
          <button
            onClick={() =>
              router.push("/customers")
            }
          >
            Customers
          </button>
        )}

        {/* Leads - Admin + Sales */}

        {(role === "admin" ||
          role === "sales") && (
          <button
            onClick={() =>
              router.push("/leads")
            }
          >
            Leads
          </button>
        )}

        {/* Tasks - Admin + Sales */}

        {(role === "admin" ||
          role === "sales") && (
          <button
            onClick={() =>
              router.push("/tasks")
            }
          >
            Tasks
          </button>
        )}

        {/* Users - Admin */}

        {role === "admin" && (
          <button
            onClick={() =>
              router.push("/users")
            }
          >
            Users
          </button>
        )}

      </nav>
    </aside>
  );
}