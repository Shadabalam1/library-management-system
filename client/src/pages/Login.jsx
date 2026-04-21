import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../utils/axios";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLogin, setIsAdminLogin] = useState(false); // Toggle for admin login
  const { fetchUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let response;
      // ✅ Use different endpoints based on login type
      if (isAdminLogin) {
        response = await API.post("/auth/admin/login", form);
      } else {
        response = await API.post("/auth/login", form); // Standard user login
      }

      toast.success(isAdminLogin ? "Admin login successful" : "Login successful");
      await fetchUser(); // Fetch the logged-in user details

      if (response.data.user?.role === "Admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err); // Log for debugging
      const errorMessage = err.response?.data?.message || (isAdminLogin ? "Admin login failed" : "Login failed");
      toast.error(errorMessage);
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
                {isAdminLogin ? (
                  <i className="bi bi-shield-lock text-xl"></i>
                ) : (
                  <i className="bi bi-box-arrow-in-right text-xl"></i>
                )}
              </div>
              <h1 className="text-2xl font-bold text-indigo-600 mb-1">LEARN HUB</h1>
              <h2 className="text-xl font-bold text-indigo-600">
                {isAdminLogin ? "Admin Login" : "Welcome Back"}
              </h2>
              <p className="text-gray-500 text-sm">
                {isAdminLogin ? "Access admin dashboard" : "Sign in to your account"}
              </p>
            </div>

            {/* Toggle Button */}
            <div className="flex justify-center mb-4">
              <button
                type="button" // Prevent form submission
                onClick={() => setIsAdminLogin(!isAdminLogin)}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center"
              >
                {isAdminLogin ? (
                  <>
                    <i className="bi bi-arrow-left mr-1"></i>
                    User Login
                  </>
                ) : (
                  <>
                    Admin Login
                    <i className="bi bi-arrow-right ml-1"></i>
                  </>
                )}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  {isAdminLogin ? "Admin Email" : "Email Address"}
                </label>
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <span className="bg-gray-100 px-3 py-2">
                    <i className="bi bi-envelope text-indigo-600 text-sm"></i>
                  </span>
                  <input
                    type="email"
                    className="w-full px-3 py-2 outline-none text-sm"
                    placeholder={isAdminLogin ? "Enter admin email" : "Enter your email"}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-5">
                <label className="block text-gray-700 font-semibold mb-2 text-sm">Password</label>
                <div className="flex items-center border border-gray-300 rounded-full overflow-hidden focus-within:ring-2 focus-within:ring-indigo-400">
                  <span className="bg-gray-100 px-3 py-2">
                    <i className="bi bi-lock text-indigo-600 text-sm"></i>
                  </span>
                  <input
                    type="password"
                    className="w-full px-3 py-2 outline-none text-sm"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                {/* Optionally hide Forgot Password for Admin login */}
                {!isAdminLogin && (
                  <div className="text-end mt-2">
                    <Link to="/forgot-password" className="text-gray-500 hover:text-indigo-600 text-xs transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-2.5 rounded-full font-bold text-white shadow-md transition-all duration-300 text-sm ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : isAdminLogin 
                      ? "bg-indigo-700 hover:bg-indigo-800 hover:-translate-y-1 hover:shadow-lg"
                      : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-1 hover:shadow-lg"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <span className="spinner-border spinner-border-sm mr-2"></span>
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    {isAdminLogin ? (
                      <>
                        <i className="bi bi-shield-lock mr-2"></i> Admin Login
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right mr-2"></i> Login
                      </>
                    )}
                  </span>
                )}
              </button>

              {/* Links */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between items-center mt-4 text-gray-600 text-sm">
                {/* Optionally hide Sign Up for Admin login */}
                {!isAdminLogin && (
                  <Link to="/register" className="font-semibold text-indigo-600 hover:underline">
                    Sign Up
                  </Link>
                )}
                {/* Optionally hide/show Forgot Password based on login type */}
                {!isAdminLogin && (
                  <Link to="/forgot-password" className="font-semibold text-indigo-600 hover:underline">
                    Forgot Password?
                  </Link>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}