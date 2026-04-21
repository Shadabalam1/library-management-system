import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../utils/axios";

export default function AddBook() {
  const [form, setForm] = useState({
    title: "",
    author: "",
    description: "",
    price: "",
    quantity: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Debugging - Check if component mounts
  useEffect(() => {
    console.log("AddBook component mounted");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate form data
      if (!form.title.trim() || !form.author.trim()) {
        throw new Error("Title and Author are required");
      }

      if (form.price <= 0) {
        throw new Error("Price must be greater than 0");
      }

      if (form.quantity < 0) {
        throw new Error("Quantity cannot be negative");
      }

      // Convert price and quantity to numbers
      const bookData = {
        ...form,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      };

      console.log("Sending book data:", bookData); // Debugging

      await API.post("/book/admin/add", bookData);
      toast.success("Book added successfully");
      navigate("/admin/dashboard");
     
    } catch (err) {
      console.error("Add book error:", err);
      console.log("Error details:", {
        message: err.message,
        response: err.response,
        request: err.request,
      });

      if (err.response) {
        // Server responded with error
        console.log("Response data:", err.response.data);
        console.log("Response status:", err.response.status);
        console.log("Response headers:", err.response.headers);
        toast.error(
          err.response.data?.message || `Server error: ${err.response.status}`
        );
      } else if (err.request) {
        // Request was made but no response received
        console.log("Request details:", err.request);
        toast.error("Network error. Please check your connection.");
      } else {
        // Something else happened
        console.log("Error message:", err.message);
        toast.error(err.message || "Failed to add book");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar */}
      <nav className="bg-white/20 backdrop-blur-md border-b border-white/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <i className="bi bi-book text-white text-xl mr-2"></i>
                <span className="text-white font-bold text-lg">
                  LEARN HUB ADMIN
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Add New Book
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Enter book title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Author *
              </label>
              <input
                type="text"
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Enter author name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                placeholder="Enter book description"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="Enter price"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm({ ...form, quantity: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                  placeholder="Enter quantity"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate("/admin/dashboard")}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Adding..." : "Add Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
