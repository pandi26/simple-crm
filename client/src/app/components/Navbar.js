"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Navbar() {
  const router = useRouter();

  const [user, setUser] = useState(null);

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
        console.error("Navbar Profile Error:", error);

        localStorage.removeItem("token");
        router.replace("/login");
      }
    };

    getProfile();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  return (
    <header className="navbar">
      <div>
        <h2>CRM Dashboard</h2>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}
      >
        {user && (
          <div style={{ textAlign: "right" }}>
            <strong>{user.name}</strong>

            <div
              style={{
                fontSize: "13px",
                color: "#6b7280",
                textTransform: "capitalize",
              }}
            >
              {user.role}
            </div>
          </div>
        )}

        <button onClick={handleLogout}>Logout</button>
      </div>
    </header>
  );
}