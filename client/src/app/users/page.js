"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function UsersPage() {
  const router = useRouter();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
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

      setUsers(response.data.users || []);
    } catch (error) {
      console.error("Get Users Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("User deleted successfully");

      await fetchUsers();
    } catch (error) {
      console.error("Delete User Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to delete user"
      );
    }
  };

  return (
    <div className="crm-layout">
      <Sidebar />

      <div className="main-section">
        <Navbar />

        <main className="dashboard-content">

          {/* Header */}

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "25px",
            }}
          >
            <div>
              <h1>Users</h1>

              <p>
                Manage CRM users and roles
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/users/new")
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
              + Add User
            </button>
          </div>

          {/* Message */}

          {message && (
            <p
              style={{
                marginBottom: "15px",
              }}
            >
              {message}
            </p>
          )}

          {/* Users */}

          {loading ? (
            <p>Loading users...</p>
          ) : users.length === 0 ? (
            <div className="dashboard-card">
              <h2>No Users</h2>

              <p>
                No users found.
              </p>
            </div>
          ) : (
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                overflow: "hidden",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "#f9fafb",
                      textAlign: "left",
                    }}
                  >
                    <th
                      style={{
                        padding: "15px",
                      }}
                    >
                      Name
                    </th>

                    <th
                      style={{
                        padding: "15px",
                      }}
                    >
                      Email
                    </th>

                    <th
                      style={{
                        padding: "15px",
                      }}
                    >
                      Role
                    </th>

                    <th
                      style={{
                        padding: "15px",
                      }}
                    >
                      Created
                    </th>

                    <th
                      style={{
                        padding: "15px",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr key={user._id}>

                      <td
                        style={{
                          padding: "15px",
                        }}
                      >
                        {user.name}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                        }}
                      >
                        {user.email}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                        }}
                      >
                        {user.role}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                        }}
                      >
                        {user.createdAt
                          ? new Date(
                              user.createdAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td
                        style={{
                          padding: "15px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                          }}
                        >
                          <button
                            onClick={() =>
                              router.push(
                                `/users/${user._id}/edit`
                              )
                            }
                            style={{
                              padding:
                                "7px 12px",
                              cursor:
                                "pointer",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                user._id
                              )
                            }
                            style={{
                              padding:
                                "7px 12px",
                              background:
                                "#dc2626",
                              color:
                                "white",
                              border:
                                "none",
                              borderRadius:
                                "5px",
                              cursor:
                                "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}