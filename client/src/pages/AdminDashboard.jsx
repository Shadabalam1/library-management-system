import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import toast from "react-hot-toast";
import AdminManagementModal from "../components/AdminManagementModal.jsx";

export default function AdminDashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBooks: 0,
    borrowedBooks: 0,
    pendingRequests: 0,
  });

  // ✅ New states for user profile view
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userBorrowHistory, setUserBorrowHistory] = useState([]);
  const [loadingUserHistory, setLoadingUserHistory] = useState(false);

  const [showAdminModal, setShowAdminModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [books, setBooks] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // ✅ NEW: State for delete loading
  const [deletingUserId, setDeletingUserId] = useState(null);

  // ✅ New functions for admin management
  const handleAddAdmin = () => {
    setShowAdminModal(true);
  };

  const handleAdminAdded = () => {
    toast.success("New admin added successfully");
  };

  // ✅ NEW: Delete user function
  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingUserId(userId);
    try {
      await API.delete(`/user/${userId}`);
      
      // Remove deleted user from local state
      setUsers(prev => prev.filter(u => u._id !== userId));
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalUsers: Math.max(0, prev.totalUsers - 1)
      }));
      
      toast.success("User deleted successfully");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to delete user";
      toast.error(msg);
      console.error("Delete User Error:", error.response?.data || error.message);
    } finally {
      setDeletingUserId(null);
    }
  };

  // ✅ Fetch user borrow history
  const fetchUserBorrowHistory = async (userId) => {
    try {
      setLoadingUserHistory(true);
      const res = await API.get(`/borrow/user/${userId}/history`);
      setSelectedUser(res.data.user);
      setUserBorrowHistory(res.data.borrowHistory);
      setShowUserModal(true);
    } catch (error) {
      toast.error("Failed to fetch user history");
    } finally {
      setLoadingUserHistory(false);
    }
  };

  // ✅ User History Modal Component
  const UserHistoryModal = () => {
    if (!showUserModal || !selectedUser) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">User Borrow History</h2>
            <button 
              onClick={() => setShowUserModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="bi bi-x-lg text-xl"></i>
            </button>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-800 text-2xl font-bold">
                    {selectedUser.name?.charAt(0)}
                  </span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-gray-600">{selectedUser.email}</p>
                  <p className="text-sm text-gray-500">Member since: {new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-500">Role: {selectedUser.role}</p>
                </div>
              </div>
            </div>

            {/* Borrow History */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Borrow History ({userBorrowHistory.length} records)
              </h3>
              
              {loadingUserHistory ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : userBorrowHistory.length === 0 ? (
                <div className="text-center py-8">
                  <i className="bi bi-journal-bookmark text-3xl text-gray-300 mb-2"></i>
                  <p className="text-gray-500">No borrow history found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userBorrowHistory.map((record) => (
                    <div key={record._id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{record.book?.title}</h4>
                          <p className="text-sm text-gray-600">by {record.book?.author}</p>
                          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Borrowed:</span>
                              <p className="font-medium">{record.borrowDate ? new Date(record.borrowDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Due Date:</span>
                              <p className="font-medium">{record.dueDate ? new Date(record.dueDate).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            {record.returnDate && (
                              <div>
                                <span className="text-gray-500">Returned:</span>
                                <p className="font-medium">{new Date(record.returnDate).toLocaleDateString()}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Price:</span>
                              <p className="font-medium">₹{record.price || 0}</p>
                            </div>
                          </div>
                        </div>
                        <div className="ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === "returned" 
                              ? "bg-blue-100 text-blue-800" 
                              : new Date() > new Date(record.dueDate)
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                          }`}>
                            {record.status === "returned" 
                              ? "Returned" 
                              : new Date() > new Date(record.dueDate)
                                ? "Overdue"
                                : "Borrowed"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== "Admin") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch dashboard data - Fixed to fetch all stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("🔍 Fetching dashboard data...");

        // Fetch all required data in parallel
        const [booksRes, requestsRes, usersRes] = await Promise.allSettled([
          API.get("/book/all"),
          API.get("/borrow/pending-requests"),
          API.get("/user/all"),
        ]);

        // Handle books data
        let booksData = [];
        if (booksRes.status === "fulfilled") {
          booksData = booksRes.value.data.books || [];
          setBooks(booksData);
        } else {
          setBooks([]);
          console.log("⚠️ Failed to fetch books");
        }

        // Handle pending requests
        let pendingRequestsData = [];
        if (requestsRes.status === "fulfilled") {
          pendingRequestsData = requestsRes.value.data.requests || [];
          setBorrowRequests(pendingRequestsData);
        } else {
          setBorrowRequests([]);
          console.log("⚠️ Failed to fetch pending requests");
        }

        // Handle users data
        let usersData = [];
        if (usersRes.status === "fulfilled") {
          usersData = usersRes.value.data.users || [];
          setUsers(usersData);
        } else {
          setUsers([]);
          console.log("⚠️ Failed to fetch users");
        }

        // Calculate borrowed books from approved requests
        let borrowedCount = 0;
        if (requestsRes.status === "fulfilled") {
          const allRequests = requestsRes.value.data.requests || [];
          borrowedCount = allRequests.filter(
            (req) => req.status === "approved"
          ).length;
        }

        // Update stats with all data
        setStats({
          totalUsers: usersData.length,
          totalBooks: booksData.length,
          borrowedBooks: borrowedCount,
          pendingRequests: pendingRequestsData.length,
        });
      } catch (error) {
        console.log("❌ API Error:", error);
        toast.error("Failed to fetch dashboard data");
        setBooks([]);
        setBorrowRequests([]);
        setUsers([]);
        setStats({
          totalUsers: 0,
          totalBooks: 0,
          borrowedBooks: 0,
          pendingRequests: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === "Admin") {
      fetchData();
    }
  }, [user]);

  // Function to fetch borrowed books - FIXED to show all borrowed books with user details
  const fetchBorrowedBooks = async () => {
    try {
      console.log("🔍 Fetching all borrowed books...");
      
      // ✅ Fetch from the correct endpoint that shows all borrowed books with user details
      const res = await API.get("/borrow/borrowed-books-by-users");
      console.log("📥 Borrowed books response:", res.data);
      
      const borrowedBooksData = res.data.borrowedBooks || [];
      console.log("📚 Borrowed books data:", borrowedBooksData);
      
      setBorrowedBooks(borrowedBooksData);
    } catch (error) {
      console.log("❌ Error fetching borrowed books:", error);
      setBorrowedBooks([]);
      toast.error("Failed to load borrowed books");
    }
  };

  // Fetch borrowed books when borrowed tab is active
  useEffect(() => {
    console.log("🔄 Tab changed to:", activeTab);
    if (activeTab === "borrowed") {
      console.log("🚀 Calling fetchBorrowedBooks...");
      fetchBorrowedBooks();
    }
  }, [activeTab]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await API.get("/auth/logout");
      setUser(null);
      toast.success("Logged out successfully");
      navigate("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  // Handle book actions
  const handleAddBook = () => {
    navigate("/admin/add-book");
  };

  const handleEditBook = (bookId) => {
  navigate(`/admin/edit-book/${bookId}`);
};

  const handleDeleteBook = async (bookId) => {
    if (window.confirm("Are you sure you want to delete this book?")) {
      try {
        await API.delete(`/book/delete/${bookId}`);
        setBooks(books.filter((book) => book._id !== bookId));
        toast.success("Book deleted successfully");

        // Update stats
        setStats((prev) => ({
          ...prev,
          totalBooks: prev.totalBooks - 1,
        }));
      } catch {
        toast.error("Failed to delete book");
      }
    }
  };

  // Updated approve function
  const handleApproveRequest = async (requestId) => {
    try {
      await API.put(`/borrow/approve/${requestId}`);
      toast.success("Request approved");

      // Refresh requests
      const res = await API.get("/borrow/pending-requests");
      setBorrowRequests(res.data.requests);

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingRequests: res.data.requests.length,
        borrowedBooks: prev.borrowedBooks + 1,
      }));

      // Refresh borrowed books if needed
      if (activeTab === "borrowed") {
        fetchBorrowedBooks();
      }
    } catch {
      toast.error("Failed to approve request");
    }
  };

  // Updated reject function
  const handleRejectRequest = async (requestId) => {
    try {
      await API.put(`/borrow/reject/${requestId}`);
      toast.success("Request rejected");

      // Refresh requests
      const res = await API.get("/borrow/pending-requests");
      setBorrowRequests(res.data.requests);

      // Update stats
      setStats((prev) => ({
        ...prev,
        pendingRequests: res.data.requests.length,
      }));

      // Refresh borrowed books if needed
      if (activeTab === "borrowed") {
        fetchBorrowedBooks();
      }
    } catch {
      toast.error("Failed to reject request");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-500">
        <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Redirect non-admin users
  if (user && user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* ✅ Add Admin Management Modal */}
      <AdminManagementModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onAdminAdded={handleAdminAdded}
      />

      {/* ✅ User History Modal */}
      <UserHistoryModal />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab("dashboard")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "dashboard"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-speedometer2 mr-2"></i>
                Dashboard
              </button>
              
              <button
                onClick={() => setActiveTab("users")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "users"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-people mr-2"></i>
                Users
              </button>
              
              <button
                onClick={() => setActiveTab("books")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "books"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-book mr-2"></i>
                Books
              </button>
              
              <button
                onClick={() => setActiveTab("requests")}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "requests"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-clipboard-check mr-2"></i>
                Borrow Requests
              </button>
              
              <button
                onClick={() => {
                  console.log("🖱️ Borrowed Books tab clicked");
                  setActiveTab("borrowed");
                }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === "borrowed"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-journal-bookmark mr-2"></i>
                Borrow Records
              </button>
            </nav>
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                onClick={() => setActiveTab("users")}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Users
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalUsers}
                    </p>
                  </div>
                  <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl">
                    <i className="bi bi-people"></i>
                  </div>
                </div>
              </div>

              <div
                onClick={() => setActiveTab("books")}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Books
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.totalBooks}
                    </p>
                  </div>
                  <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl">
                    <i className="bi bi-book"></i>
                  </div>
                </div>
              </div>

            

              <div
                onClick={() => setActiveTab("requests")}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Pending Requests
                    </p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {stats.pendingRequests}
                    </p>
                  </div>
                  <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl">
                    <i className="bi bi-clipboard-check"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions - Updated with Add Admin button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <button
                  onClick={handleAddBook}
                  className="flex flex-col items-center justify-center p-6 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-book text-3xl text-indigo-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Add Book
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("users")}
                  className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-people text-3xl text-blue-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Manage Users
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab("requests")}
                  className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-clipboard-check text-3xl text-green-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Borrow Requests
                  </span>
                </button>

                {/* ✅ Add Admin Management Button */}
                <button
                  onClick={handleAddAdmin}
                  className="flex flex-col items-center justify-center p-6 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-person-plus text-3xl text-purple-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Add Admin
                  </span>
                </button>

                <button
                  onClick={() => toast.info("Feature coming soon")}
                  className="flex flex-col items-center justify-center p-6 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-gear text-3xl text-amber-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Users
              </h2>
            </div>
            <div className="overflow-x-auto">
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <i className="bi bi-people text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No users found
                  </h3>
                  <p className="text-gray-500">
                    Users will appear here once they register.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Member Since
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-indigo-800 font-medium">
                                  {user.name?.charAt(0)}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {/* ✅ View History Button */}
                          <button 
                            onClick={() => fetchUserBorrowHistory(user._id)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <i className="bi bi-eye"></i> View History
                          </button>
                          <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                            <i className="bi bi-pencil"></i>
                          </button>
                          {/* ✅ FIXED: Delete button with onClick handler */}
                          <button 
                            onClick={() => handleDeleteUser(user._id, user.name)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deletingUserId === user._id}
                            title="Delete user"
                          >
                            {deletingUserId === user._id ? (
                              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                            ) : (
                              <i className="bi bi-trash"></i>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Books Tab */}
        {activeTab === "books" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Manage Books
              </h2>
              <button
                onClick={handleAddBook}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
              >
                <i className="bi bi-plus-lg mr-2"></i>
                Add Book
              </button>
            </div>
            <div className="overflow-x-auto">
              {books.length === 0 ? (
                <div className="text-center py-12">
                  <i className="bi bi-book text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No books found
                  </h3>
                  <p className="text-gray-500">
                    Get started by adding a new book.
                  </p>
                  <button
                    onClick={handleAddBook}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <i className="bi bi-plus-lg mr-2"></i>
                    Add Book
                  </button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">

{books.map((book) => (
  <tr key={book._id} className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-medium text-gray-900">{book.title}</div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {book.author}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      ₹{book.price}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {book.quantity}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
        book.availability ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
      }`}>
        {book.availability ? "Available" : "Not Available"}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
      {/* ✅ FIXED: Edit button with onClick */}
      <button
        onClick={() => handleEditBook(book._id)}
        className="text-indigo-600 hover:text-indigo-900 mr-3"
        title="Edit book details"
      >
        <i className="bi bi-pencil"></i>
      </button>
      <button
        onClick={() => handleDeleteBook(book._id)}
        className="text-red-600 hover:text-red-900"
        title="Delete book"
      >
        <i className="bi bi-trash"></i>
      </button>
    </td>
  </tr>
))}
 



                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Borrow Requests Tab */}
        {activeTab === "requests" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Borrow Requests
              </h2>
            </div>
            <div className="overflow-x-auto">
              {borrowRequests.length === 0 ? (
                <div className="text-center py-12">
                  <i className="bi bi-clipboard-check text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No pending requests
                  </h3>
                  <p className="text-gray-500">
                    Borrow requests will appear here when users request books.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Request Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {borrowRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.user?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.user?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.book?.title}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.book?.author}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleApproveRequest(request._id)}
                            className="text-green-600 hover:text-green-900 mr-3"
                          >
                            <i className="bi bi-check-circle"></i> Approve
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <i className="bi bi-x-circle"></i> Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Borrow Records Tab - FIXED to show all borrowed books with user details */}
        {activeTab === "borrowed" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                All Borrow Records ({borrowedBooks.length})
              </h2>
              <button 
                onClick={fetchBorrowedBooks}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700"
              >
                Refresh Data
              </button>
            </div>
            <div className="overflow-x-auto">
              {borrowedBooks.length === 0 ? (
                <div className="text-center py-12">
                  <i className="bi bi-journal-bookmark text-4xl text-gray-300 mb-4"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No borrow records found
                  </h3>
                  <p className="text-gray-500">
                    Records will appear here when users borrow books.
                  </p>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Book
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Borrow Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {borrowedBooks.map((borrow) => {
                      // Status based styling
                      let statusClass = "";
                      let statusText = "";
                      
                      if (borrow.isOverdue && borrow.status !== "returned") {
                        statusClass = "bg-red-100 text-red-800";
                        statusText = "Overdue";
                      } else {
                        switch(borrow.status) {
                          case "approved":
                            statusClass = "bg-green-100 text-green-800";
                            statusText = "Borrowed";
                            break;
                          case "returned":
                            statusClass = "bg-blue-100 text-blue-800";
                            statusText = "Returned";
                            break;
                          default:
                            statusClass = "bg-gray-100 text-gray-800";
                            statusText = borrow.status;
                        }
                      }
                      
                      return (
                        <tr key={borrow.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {borrow.userName || "Unknown User"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {borrow.userEmail || "No email"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {borrow.bookTitle || "Unknown Book"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {borrow.bookAuthor || "Unknown Author"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {borrow.borrowDate ? new Date(borrow.borrowDate).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {borrow.dueDate ? new Date(borrow.dueDate).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ₹{borrow.price || 0}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClass}`}>
                              {statusText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
}