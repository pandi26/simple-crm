"use client";

import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/login");
  };

  return (
    <header className="navbar">
      <div>
        <h2>CRM Dashboard</h2>
      </div>

      <button onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
}