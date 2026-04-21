import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [books, setBooks] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [borrowRequests, setBorrowRequests] = useState([]);

  // ✅ Add debug logs in fetchData function
  const fetchData = async () => {
    try {
      console.log("🔍 Fetching dashboard data...");

      // Fetch all books
      const booksRes = await API.get("/book/all");
      setBooks(booksRes.data.books);

      // Fetch my borrowed books
      const borrowsRes = await API.get("/borrow/my-borrowed-books");
      console.log("📖 Borrowed books:", borrowsRes.data); // ✅ Debug log
      setMyBorrows(borrowsRes.data.borrowedBooks || []);

      // Fetch my borrow requests
      const requestsRes = await API.get("/borrow/my-requests");
      console.log("📨 Borrow requests:", requestsRes.data); // ✅ Debug log
      setBorrowRequests(requestsRes.data.requests || []);
    } catch (error) {
      console.log("❌ Fetch error:", error);
      console.log("Error details:", error.response?.data);
      toast.error("Failed to fetch dashboard data");
    }
  };

  // ✅ Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Auto refresh every 5 seconds to check for approved requests
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Only refresh borrowed books and requests
        const borrowsRes = await API.get("/borrow/my-borrowed-books"); // ✅ FIXED
        const requestsRes = await API.get("/borrow/my-requests");

        setMyBorrows(borrowsRes.data.borrowedBooks || []);
        setBorrowRequests(requestsRes.data.requests || []);
      } catch (error) {
        console.log(
          "Auto refresh failed:",
          error.response?.data || error.message
        );
      }
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Handle profile picture upload
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const response = await API.post("/auth/upload-profile-pic", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setUser({
        ...user,
        avatar: {
          ...user?.avatar,
          url: response.data.avatarUrl,
        },
      });
      toast.success("Profile picture updated successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to upload profile picture"
      );
    } finally {
      setIsUploading(false);
    }
  };

  // ✅ Request to borrow a book
  const handleBorrowRequest = async (bookId) => {
    try {
      const res = await API.post(`/borrow/request/${bookId}`);
      toast.success(res.data.message);

      // ✅ Refresh requests only
      const requestsRes = await API.get("/borrow/my-requests");
      setBorrowRequests(requestsRes.data.requests);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send borrow request"
      );
    }
  };

  // ✅ Return a book function
  const handleReturn = async (bookId) => {
    try {
      const res = await API.put(`/borrow/return-borrowed-book/${bookId}`);
      toast.success(res.data.message);

      // ✅ Refresh all data
      await fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to return book");
    }
  };

  // ✅ Add this new code (Lines 55-57)
  const [realStats, setRealStats] = useState({
    booksBorrowed: 0,
    activeLoans: 0,
    dueSoon: 0,
    totalFines: 0,
  });

  // ✅ Add this useEffect (Lines 59-95)
  useEffect(() => {
    const calculateRealStats = () => {
      const activeBorrows = myBorrows.filter((borrow) => !borrow.returned);
      const currentDate = new Date();

      // Calculate Due Soon (books due in next 3 days)
      const dueSoonCount = activeBorrows.filter((borrow) => {
        const dueDate = new Date(borrow.dueDate);
        const diffTime = dueDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      }).length;

      // Calculate Total Fines (₹5 per overdue day)
      const totalFines = activeBorrows.reduce((total, borrow) => {
        const dueDate = new Date(borrow.dueDate);
        const diffTime = currentDate - dueDate;
        const overdueDays = Math.max(
          0,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        );

        // ₹5 fine per day
        const fine = overdueDays * 5;
        return total + fine;
      }, 0);

      return {
        booksBorrowed: activeBorrows.length,
        activeLoans: activeBorrows.length,
        dueSoon: dueSoonCount,
        totalFines: totalFines,
      };
    };

    setRealStats(calculateRealStats());
  }, [myBorrows]);

  // ✅ Add this new stats array (Lines 97-110)
  const stats = [
    {
      title: "Books Borrowed",
      value: realStats.booksBorrowed.toString(),
      icon: "📚",
      color: "bg-blue-500",
    },
    {
      title: "Active Loans",
      value: realStats.activeLoans.toString(),
      icon: "📖",
      color: "bg-green-500",
    },
    {
      title: "Due Soon",
      value: realStats.dueSoon.toString(),
      icon: "⏰",
      color: "bg-amber-500",
    },
    {
      title: "Total Fines",
      value: `₹${realStats.totalFines}`,
      icon: "₹",
      color: "bg-red-500",
    },
  ];

  // Stats data
  // const stats = [
  //   { title: "Books Borrowed", value: myBorrows.filter(b => !b.returned).length.toString(), icon: "📚", color: "bg-blue-500" },
  //   { title: "Active Loans", value: myBorrows.filter(b => !b.returned).length.toString(), icon: "📖", color: "bg-green-500" },
  //   { title: "Due Soon", value: "1", icon: "⏰", color: "bg-amber-500" },
  //   { title: "Total Fines", value: "₹50", icon: "₹", color: "bg-red-500" },
  // ];

  // Filter data
  const activeBorrows = myBorrows.filter((borrow) => !borrow.returned);
  const pendingRequests = borrowRequests.filter(
    (request) => request.status === "pending"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Hidden file input */}
      <input
        type="file"
        id="profilePicInput"
        accept="image/*"
        onChange={handleProfilePicUpload}
        className="hidden"
        disabled={isUploading}
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div
                  className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() =>
                    document.getElementById("profilePicInput")?.click()
                  }
                >
                  {isUploading ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : user?.avatar?.url ? (
                    <img
                      src={user.avatar.url}
                      alt="Profile"
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {user?.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <i className="bi bi-camera text-xs text-gray-600"></i>
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-gray-600">
                  Happy reading! Here's your library dashboard.
                </p>
              </div>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button
                onClick={() => navigate("/update-password")}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <i className="bi bi-key mr-2"></i>
                Change Password
              </button>
              <button
                onClick={() => {
                  setUser(null);
                  navigate("/login");
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                <i className="bi bi-box-arrow-right mr-2"></i>
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow stats-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div
                  className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl`}
                >
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* ✅ My Borrow Requests Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  My Borrow Requests
                </h2>
              </div>
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No pending borrow requests.
                  </p>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {request.book.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.book.author}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ✅ My Borrowed Books Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  My Borrowed Books
                </h2>
                <button
                  onClick={() => navigate("/my-books")}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {activeBorrows.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    You haven't borrowed any books yet.
                  </p>
                ) : (
                  activeBorrows.map((borrow, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {borrow.bookTitle}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Borrowed:{" "}
                          {new Date(borrow.borrowedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Due: {new Date(borrow.dueDate).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleReturn(borrow.bookId)}
                          className="mt-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Return
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Available Books Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Books
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {books.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No books available.
                  </p>
                ) : (
                  books.map((book) => (
                    <div
                      key={book._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {book.title}
                        </h3>
                        <p className="text-sm text-gray-600">{book.author}</p>
                        <p className="text-xs text-gray-500">
                          {book.quantity} copies available
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {book.availability && book.quantity > 0 ? (
                          <button
                            onClick={() => handleBorrowRequest(book._id)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm"
                          >
                            Request Borrow
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Not Available
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/books")}
                  className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-search text-2xl text-indigo-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Browse Books
                  </span>
                </button>
                <button
                  onClick={() => navigate("/my-books")}
                  className="flex flex-col items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-book text-2xl text-blue-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    My Books
                  </span>
                </button>
                <button
                  onClick={() => navigate("/my-books")}
                  className="flex flex-col items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-arrow-repeat text-2xl text-green-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Renew Books
                  </span>
                </button>
                <button
                  onClick={() => toast.info("Feature coming soon")}
                  className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors"
                >
                  <i className="bi bi-exclamation-triangle text-2xl text-amber-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Report
                  </span>
                </button>
              </div>
            </div>

            {/* Account Info - Enhanced with loading state */}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Account Information
              </h2>
              <div className="space-y-3">
                {user ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Full Name</span>
                      <span className="font-medium">{user.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email</span>
                      <span className="font-medium">{user.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Member Since</span>
                      <span className="font-medium">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "N/A"}
                      </span>
                    </div>
                    {user.role && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Role</span>
                        <span className="font-medium capitalize">
                          {user.role}
                        </span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone</span>
                        <span className="font-medium">{user.phone}</span>
                      </div>
                    )}
                    {user.address && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address</span>
                        <span className="font-medium text-right text-sm">
                          {user.address}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </>
                ) : (
                  // Loading skeleton
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
