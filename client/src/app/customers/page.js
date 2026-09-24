"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function CustomersPage() {
  const router = useRouter();

  

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ✅ Hooks must be INSIDE the component
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Get customers
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/customers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCustomers(response.data.customers || response.data);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // Delete customer
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this customer?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await axios.delete(
        `http://localhost:5000/api/customers/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCustomers((prevCustomers) =>
        prevCustomers.filter(
          (customer) => customer._id !== id
        )
      );

      setMessage("Customer deleted successfully");
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Failed to delete customer"
      );
    }
  };

  // Search + status filtering
  const filteredCustomers = customers.filter((customer) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      customer.name?.toLowerCase().includes(searchText) ||
      customer.email?.toLowerCase().includes(searchText) ||
      customer.company?.toLowerCase().includes(searchText) ||
      customer.phone?.includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      customer.status?.toLowerCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <p>Loading customers...</p>;
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
              <h1>Customers</h1>
              <p>Manage your CRM customers</p>
            </div>

            <button
              onClick={() => router.push("/customers/new")}
              style={{
                padding: "10px 18px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              + Add Customer
            </button>
          </div>

          {/* Search + Filter */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
            }}
          >
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "10px 14px",
                width: "300px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
              }}
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              style={{
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {message && (
            <p style={{ marginBottom: "15px" }}>
              {message}
            </p>
          )}

          {/* Customer Table */}
          {filteredCustomers.length === 0 ? (
            <div className="dashboard-card">
              <h2>No Customers</h2>
              <p>
                No customers match your search/filter.
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
                      Name
                    </th>

                    <th style={{ padding: "15px" }}>
                      Email
                    </th>

                    <th style={{ padding: "15px" }}>
                      Phone
                    </th>

                    <th style={{ padding: "15px" }}>
                      Company
                    </th>

                    <th style={{ padding: "15px" }}>
                      Status
                    </th>

                    <th style={{ padding: "15px" }}>
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer._id}>
                      <td style={{ padding: "15px" }}>
                        {customer.name}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {customer.email}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {customer.phone}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {customer.company || "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {customer.status}
                      </td>

                      <td style={{ padding: "15px" }}>
                        <button
                          onClick={() =>
                            router.push(
                              `/customers/${customer._id}/edit`
                            )
                          }
                          style={{
                            padding: "7px 12px",
                            background: "#2563eb",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDelete(customer._id)
                          }
                          style={{
                            padding: "7px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
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