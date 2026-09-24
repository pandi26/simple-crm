"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();

  const id = params?.id;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "active",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!id) {
      return;
    }

    const fetchCustomer = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:5000/api/customers/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Customer response:", response.data);

        const customer = response.data.customer;

        if (!customer) {
          setMessage("Customer not found");
          return;
        }

        setFormData({
          name: customer.name || "",
          email: customer.email || "",
          phone: customer.phone || "",
          company: customer.company || "",
          status: customer.status || "active",
        });
      } catch (error) {
        console.error("Get Customer Error:", error);

        setMessage(
          error.response?.data?.message ||
            "Failed to load customer"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [id, router]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!id) {
      setMessage("Customer ID is missing");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await axios.put(
        `http://localhost:5000/api/customers/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Update response:", response.data);

      setMessage("Customer updated successfully!");

      setTimeout(() => {
        router.push("/customers");
      }, 1000);
    } catch (error) {
      console.error("Update Customer Error:", error);

      setMessage(
        error.response?.data?.message ||
          "Failed to update customer"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading customer...</p>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Edit Customer</h1>

      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: "500px",
          marginTop: "25px",
        }}
      >
        <div>
          <label>Name</label>
          <br />

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Email</label>
          <br />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Phone</label>
          <br />

          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Company</label>
          <br />

          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
          />
        </div>

        <br />

        <div>
          <label>Status</label>
          <br />

          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <br />

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Update Customer"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/customers")}
          style={{ marginLeft: "10px" }}
        >
          Cancel
        </button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}