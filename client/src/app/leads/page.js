"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import axios from "axios";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function LeadsPage() {
  const router = useRouter();

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/leads",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLeads(response.data.leads || []);
    } catch (error) {
      console.error("Get Leads Error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      setMessage(
        error.response?.data?.message ||
          "Failed to load leads"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const filteredLeads = leads.filter((lead) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      lead.name?.toLowerCase().includes(searchText) ||
      lead.email?.toLowerCase().includes(searchText) ||
      lead.company?.toLowerCase().includes(searchText) ||
      lead.phone?.includes(search);

    const matchesStatus =
      statusFilter === "all" ||
      lead.status === statusFilter;

    const matchesSource =
      sourceFilter === "all" ||
      lead.source === sourceFilter;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesSource
    );
  });

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
              <h1>Leads</h1>
              <p>Manage your sales leads</p>
            </div>

            <button
              onClick={() => router.push("/leads/new")}
              style={{
                padding: "10px 18px",
                background: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              + Add Lead
            </button>
          </div>

          {/* Search + Filters */}
          <div
            style={{
              display: "flex",
              gap: "15px",
              marginBottom: "20px",
              flexWrap: "wrap",
            }}
          >
            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
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
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="converted">Converted</option>
              <option value="lost">Lost</option>
            </select>

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value)
              }
              style={{
                padding: "10px 14px",
                border: "1px solid #d1d5db",
                borderRadius: "7px",
              }}
            >
              <option value="all">All Sources</option>
              <option value="website">Website</option>
              <option value="referral">Referral</option>
              <option value="social_media">
                Social Media
              </option>
              <option value="advertisement">
                Advertisement
              </option>
              <option value="other">Other</option>
            </select>
          </div>

          {message && (
            <p style={{ marginBottom: "15px" }}>
              {message}
            </p>
          )}

          {/* Table */}
          {loading ? (
            <p>Loading leads...</p>
          ) : filteredLeads.length === 0 ? (
            <div className="dashboard-card">
              <h2>No Leads</h2>
              <p>
                No leads match your search or filters.
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
                      Company
                    </th>

                    <th style={{ padding: "15px" }}>
                      Source
                    </th>

                    <th style={{ padding: "15px" }}>
                      Status
                    </th>

                    <th style={{ padding: "15px" }}>
                      Value
                    </th>

                    <th style={{ padding: "15px" }}>
                      Assigned To
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLeads.map((lead) => (
                    <tr key={lead._id}>

                     <td style={{ padding: "15px" }}>
  <button
    onClick={() =>
      router.push(`/leads/${lead._id}`)
    }
    style={{
      border: "none",
      background: "transparent",
      color: "#2563eb",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    {lead.name}
  </button>
</td>

                      <td style={{ padding: "15px" }}>
                        {lead.email}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {lead.company || "-"}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {lead.source}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {lead.status}
                      </td>

                      <td style={{ padding: "15px" }}>
                        ₹{lead.value || 0}
                      </td>

                      <td style={{ padding: "15px" }}>
                        {lead.assignedTo?.name || "Unassigned"}
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