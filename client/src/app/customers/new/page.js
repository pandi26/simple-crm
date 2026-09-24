"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function NewCustomerPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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

    try {
      setLoading(true);
      setMessage("");

      await axios.post(
        "http://localhost:5000/api/customers",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage("Customer created successfully!");

      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
      });

      setTimeout(() => {
        router.push("/customers");
      }, 1000);
    } catch (error) {
      console.error(error);

      setMessage(
        error.response?.data?.message ||
          "Failed to create customer"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Create Customer</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <br />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Customer name"
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
            placeholder="Customer email"
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
            placeholder="Customer phone"
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
            placeholder="Company name"
          />
        </div>

        <br />

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Customer"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/customers")}
        >
          Cancel
        </button>
      </form>

      <p>{message}</p>
    </div>
  );
}