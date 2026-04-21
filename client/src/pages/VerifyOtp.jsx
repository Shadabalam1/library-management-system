import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import API from "../utils/axios";

export default function VerifyOtp() {
  const [form, setForm] = useState({ email: "", otp: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await API.post("/auth/verify-otp", form);
      toast.success("Account verified successfully!");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "OTP verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 bg-light d-flex align-items-center justify-content-center">
      <div className="row w-100 justify-content-center">
        <div className="col-md-5 col-lg-4">
          <div className="card shadow-lg border-0 rounded-4 animate__animated animate__fadeIn">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="card-title fw-bold text-primary">Verify OTP</h2>
                <p className="text-muted">Enter the code sent to your email</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="otp" className="form-label">OTP Code</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="otp"
                    placeholder="Enter 6-digit code"
                    value={form.otp}
                    onChange={(e) => setForm({ ...form, otp: e.target.value })}
                    required
                  />
                </div>
                <div className="d-grid">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Verifying...
                      </>
                    ) : (
                      "Verify OTP"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}