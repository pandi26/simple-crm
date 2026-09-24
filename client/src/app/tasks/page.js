"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function TasksPage() {
  const router = useRouter();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const params = {};

      if (status) {
        params.status = status;
      }

      if (priority) {
        params.priority = priority;
      }

      const response = await axios.get(
        "http://localhost:5000/api/tasks",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          params,
        }
      );

      setTasks(response.data.tasks || []);
    } catch (error) {
      console.error("Get Tasks Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Failed to load tasks"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [status, priority]);

  const handleComplete = async (id) => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/api/tasks/${id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchTasks();
    } catch (error) {
      console.error("Complete Task Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to complete task"
      );
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/tasks/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchTasks();
    } catch (error) {
      console.error("Delete Task Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to delete task"
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
              <h1>Tasks</h1>

              <p>
                Manage CRM tasks and follow-ups
              </p>
            </div>

            <button
              onClick={() =>
                router.push("/tasks/new")
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
              + Add Task
            </button>
          </div>

          {/* Filters */}

          <div
            style={{
              display: "flex",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value)
              }
              style={{
                padding: "10px",
              }}
            >
              <option value="">
                All Status
              </option>

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

            <select
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value)
              }
              style={{
                padding: "10px",
              }}
            >
              <option value="">
                All Priority
              </option>

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

          {/* Message */}

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

          {/* Task List */}

          {loading ? (
            <p>Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <div className="dashboard-card">
              <h2>No Tasks</h2>

              <p>
                No tasks found.
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
                    <th style={{ padding: "15px" }}>
                      Title
                    </th>

                    <th style={{ padding: "15px" }}>
                      Lead
                    </th>

                    <th style={{ padding: "15px" }}>
                      Assigned To
                    </th>

                    <th style={{ padding: "15px" }}>
                      Priority
                    </th>

                    <th style={{ padding: "15px" }}>
                      Status
                    </th>

                    <th style={{ padding: "15px" }}>
                      Due Date
                    </th>

                    <th style={{ padding: "15px" }}>
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {tasks.map((task) => (
                    <tr key={task._id}>

                      <td style={{ padding: "15px" }}>
                        {task.title}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {task.lead?.name || "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {task.assignedTo?.name || "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {task.priority || "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {task.status || "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {task.dueDate
                          ? new Date(
                              task.dueDate
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        <div
                          style={{
                            display: "flex",
                            gap: "7px",
                          }}
                        >
                          {task.status !==
                            "completed" && (
                            <button
                              onClick={() =>
                                handleComplete(
                                  task._id
                                )
                              }
                              style={{
                                padding:
                                  "7px 10px",
                                cursor:
                                  "pointer",
                              }}
                            >
                              Complete
                            </button>
                          )}

                          <button
                            onClick={() =>
                              router.push(
                                `/tasks/${task._id}/edit`
                              )
                            }
                            style={{
                              padding:
                                "7px 10px",
                              cursor:
                                "pointer",
                            }}
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                task._id
                              )
                            }
                            style={{
                              padding:
                                "7px 10px",
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