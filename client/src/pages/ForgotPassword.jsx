import { useState } from "react";
import toast from "react-hot-toast";
import API from "../utils/axios";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await API.post("/auth/password/forgot", { email });
      toast.success("Password reset link sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500 flex items-center justify-center px-4 py-12">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="relative w-full h-full">
          <div className="absolute top-[10%] left-[5%] w-24 h-24 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-white/10 animate-pulse"></div>
          <div className="absolute top-[70%] left-[85%] w-16 h-16 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-white/10 animate-pulse animation-delay-1000"></div>
          <div className="absolute top-[40%] left-[75%] w-20 h-20 rounded-[30%_70%_70%_30%/30%_30%_70%_70%] bg-white/10 animate-pulse animation-delay-2000"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <i className="bi bi-shield-lock text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">LEARN HUB</h1>
            <h2 className="text-xl font-semibold text-white/90 mb-2">Reset Password</h2>
            <p className="text-white/80 text-sm">Enter your email to receive reset instructions</p>
          </div>

          {/* Form Section */}
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="bi bi-envelope text-gray-400"></i>
                  </div>
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all duration-200 text-sm"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 text-sm ${
                  isLoading
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending Instructions...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <i className="bi bi-send mr-2"></i>
                    Send Reset Link
                  </span>
                )}
              </button>

              {/* Back to Login Link */}
              <div className="text-center pt-2">
                <Link 
                  to="/login" 
                  className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors duration-200"
                >
                  <i className="bi bi-arrow-left mr-1"></i>
                  Back to Login
                </Link>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start">
                <i className="bi bi-info-circle text-blue-500 mt-0.5 mr-2"></i>
                <p className="text-blue-800 text-xs">
                  <span className="font-medium">Note:</span> Check your spam/junk folder if you don't receive the email within a few minutes.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-white/70 text-sm">
            © 2024 LEARN HUB. All rights reserved.
          </p>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.15; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        body {
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}