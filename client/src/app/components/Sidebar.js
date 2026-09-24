"use client";

import { useRouter } from "next/navigation";

export default function Sidebar() {
  const router = useRouter();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        CRM
      </div>

      <nav className="sidebar-nav">
        <button onClick={() => router.push("/dashboard")}>
          Dashboard
        </button>

        <button onClick={() => router.push("/customers")}>
          Customers
        </button>

        <button onClick={() => router.push("/leads")}>
          Leads
        </button>

        <button onClick={() => router.push("/tasks")}>
          Tasks
        </button>

        <button onClick={() => router.push("/users")}>
          Users
        </button>
      </nav>
    </aside>
  );
}