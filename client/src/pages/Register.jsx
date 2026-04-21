import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../utils/axios";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await API.post("/auth/register", form);
      toast.success("OTP sent to email");
      navigate("/verify-otp");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500">
      {/* Main Content */}
      <div className="flex items-center justify-center h-screen px-4 py-8 relative z-10">
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
          <div className="p-6">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
                <i className="bi bi-person-plus text-xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-indigo-600 mb-1">
                LEARN HUB
              </h1>
              <h2 className="text-xl font-bold text-indigo-600">
                Create Account
              </h2>
              <p className="text-gray-500 text-sm">
                Get started with our platform
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Full Name
                </label>
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <span className="bg-gray-100 px-3 py-2">
                    <i className="bi bi-person text-indigo-600 text-sm"></i>
                  </span>
                  <input
                    type="text"
                    className="w-full px-3 py-2 outline-none text-sm"
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Email Address
                </label>
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <span className="bg-gray-100 px-3 py-2">
                    <i className="bi bi-envelope text-indigo-600 text-sm"></i>
                  </span>
                  <input
                    type="email"
                    className="w-full px-3 py-2 outline-none text-sm"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Password
                </label>
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <span className="bg-gray-100 px-3 py-2">
                    <i className="bi bi-lock text-indigo-600 text-sm"></i>
                  </span>
                  <input
                    type="password"
                    className="w-full px-3 py-2 outline-none text-sm"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-full font-bold text-white shadow-md transition-all duration-300 text-sm ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="spinner-border spinner-border-sm mr-2"></span>
                    Creating Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="bi bi-person-plus mr-2"></i> Register
                  </span>
                )}
              </button>

              {/* Sign In Link */}
              <div className="text-center mt-4 text-gray-600 text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-indigo-600 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
