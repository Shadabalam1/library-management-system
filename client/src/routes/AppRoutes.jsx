import { Routes, Route, Navigate } from "react-router-dom";
import Register from "../pages/Register.jsx";
import VerifyOtp from "../pages/VerifyOtp.jsx";
import Login from "../pages/Login.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import BookBrowsePage from "../pages/BookBrowsePage.jsx"; // ✅ Add this
import ForgotPassword from "../pages/ForgotPassword.jsx";
import ResetPassword from "../pages/ResetPassword.jsx";
import UpdatePassword from "../pages/UpdatePassword.jsx";
import AdminDashboard from "../pages/AdminDashboard.jsx";
import AddBook from "../pages/AddBook.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";
import MyBooks from "../pages/MyBooks.jsx"; // ✅ Ye line honi chahiye
import EditBook from "../pages/EditBook";


// ✅ Add Admin Protected Route
function AdminProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  // Check if user is admin
  if (user && user.role === "Admin") {
    return children;
  }
  
  return <Navigate to="/login" />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
}

export default function AppRoutes() {
  const { user } = useAuth();
  
  // Hide navbar on auth pages
  const hideNavbar = window.location.pathname === '/login' || 
                     window.location.pathname === '/register' || 
                     window.location.pathname === '/forgot-password' || 
                     window.location.pathname === '/verify-otp' ||
                     window.location.pathname.startsWith('/password/reset/') ||
                     window.location.pathname === '/admin/login';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Navbar sabhi protected pages pe dikhayi dega */}
      {!hideNavbar && user && <Navbar />}
      <main>
        <Routes>
        
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password/reset/:token" element={<ResetPassword />} />
          <Route path="/admin/edit-book/:id" element={<EditBook />} />
          {/* ✅ User Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/books"
            element={
              <ProtectedRoute>
                <BookBrowsePage />
              </ProtectedRoute>
            }
          />

            <Route
  path="/my-books"
  element={
    <ProtectedRoute>
      <MyBooks />
    </ProtectedRoute>
  }
/>

          <Route
            path="/update-password"
            element={
              <ProtectedRoute>
                <UpdatePassword />
              </ProtectedRoute>
            }
          />
          
          {/* ✅ Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/add-book"
            element={
              <AdminProtectedRoute>
                <AddBook />
              </AdminProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}