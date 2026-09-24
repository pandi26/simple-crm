"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

export default function TaskDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/tasks/${params.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setTask(response.data.task);
    } catch (error) {
      console.error("Get Task Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to load task"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchTask();
    }
  }, [params.id]);

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.patch(
        `http://localhost:5000/api/tasks/${params.id}/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchTask();
    } catch (error) {
      console.error(
        "Complete Task Error:",
        error
      );

      setMessage(
        error.response?.data?.message ||
          "Failed to complete task"
      );
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

  if (!task) {
    return (
      <div className="crm-layout">
        <Sidebar />

        <div className="main-section">
          <Navbar />

          <main className="dashboard-content">
            <h1>Task Not Found</h1>

            <button
              onClick={() => router.push("/tasks")}
            >
              Back to Tasks
            </button>
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
              <h1>{task.title}</h1>

              <p>
                Task Details
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() =>
                  router.push(
                    `/tasks/${task._id}/edit`
                  )
                }
                style={{
                  padding: "10px 16px",
                  cursor: "pointer",
                }}
              >
                Edit
              </button>

              {task.status !== "completed" && (
                <button
                  onClick={handleComplete}
                  style={{
                    padding: "10px 16px",
                    background: "#16a34a",
                    color: "white",
                    border: "none",
                    borderRadius: "7px",
                    cursor: "pointer",
                  }}
                >
                  Mark Complete
                </button>
              )}

              <button
                onClick={() =>
                  router.push("/tasks")
                }
                style={{
                  padding: "10px 16px",
                  background: "#e5e7eb",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            </div>
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

          {/* Task Information */}

          <div
            style={{
              background: "white",
              padding: "25px",
              borderRadius: "12px",
              border: "1px solid #e5e7eb",
              maxWidth: "800px",
            }}
          >
            <h2
              style={{
                marginBottom: "20px",
              }}
            >
              Task Information
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "180px 1fr",
                gap: "16px",
              }}
            >
              <strong>Title</strong>
              <span>{task.title}</span>

              <strong>Description</strong>
              <span>
                {task.description || "-"}
              </span>

              <strong>Lead</strong>
              <span>
                {task.lead?.name || "-"}
              </span>

              <strong>Assigned To</strong>
              <span>
                {task.assignedTo?.name || "-"}
              </span>

              <strong>Email</strong>
              <span>
                {task.assignedTo?.email || "-"}
              </span>

              <strong>Priority</strong>
              <span>
                {task.priority || "-"}
              </span>

              <strong>Status</strong>
              <span>
                {task.status || "-"}
              </span>

              <strong>Due Date</strong>
              <span>
                {task.dueDate
                  ? new Date(
                      task.dueDate
                    ).toLocaleDateString()
                  : "-"}
              </span>

              <strong>Created</strong>
              <span>
                {task.createdAt
                  ? new Date(
                      task.createdAt
                    ).toLocaleDateString()
                  : "-"}
              </span>

              <strong>Updated</strong>
              <span>
                {task.updatedAt
                  ? new Date(
                      task.updatedAt
                    ).toLocaleDateString()
                  : "-"}
              </span>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}