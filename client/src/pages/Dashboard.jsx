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
  const [submittingBookId, setSubmittingBookId] = useState(null);
  const [bookSearch, setBookSearch] = useState("");

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
    setSubmittingBookId(bookId);
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
    } finally {
      setSubmittingBookId(null);
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
      description: "All-time reading activity",
      icon: "bi-journal-bookmark-fill",
      color: "bg-sky-500",
      iconBg: "bg-sky-50 text-sky-600",
    },
    {
      title: "Active Loans",
      value: realStats.activeLoans.toString(),
      description: "Currently with you",
      icon: "bi-book-half",
      color: "bg-teal-500",
      iconBg: "bg-teal-50 text-teal-600",
    },
    {
      title: "Due Soon",
      value: realStats.dueSoon.toString(),
      description: "Due within 3 days",
      icon: "bi-alarm-fill",
      color: "bg-amber-500",
      iconBg: "bg-amber-50 text-amber-600",
    },
    {
      title: "Total Fines",
      value: `₹${realStats.totalFines}`,
      description: "Outstanding balance",
      icon: "bi-wallet2",
      color: "bg-rose-500",
      iconBg: "bg-rose-50 text-rose-600",
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

  const pendingBookIds = new Set(
    pendingRequests.map((request) => request.book?._id || request.book)
  );

  const visibleBooks = books.filter((book) => {
    const search = bookSearch.trim().toLowerCase();
    return (
      !search ||
      book.title.toLowerCase().includes(search) ||
      book.author.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen bg-[#f4f7f9]">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-teal-900 p-6 sm:p-8 mb-8 shadow-xl shadow-indigo-950/10">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border-[28px] border-white/5"></div>
          <div className="absolute right-24 -bottom-32 h-72 w-72 rounded-full border-[18px] border-teal-300/10"></div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center">
              <div className="relative">
                <div
                  className="w-16 h-16 bg-white/15 ring-4 ring-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/25 transition-colors overflow-hidden"
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
                    <span className="text-white text-xl font-bold uppercase">
                      {user?.name?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                  <i className="bi bi-camera text-xs text-gray-600"></i>
                </div>
              </div>
              <div className="ml-4 relative z-10">
                <p className="text-xs uppercase tracking-[0.2em] text-teal-200 font-semibold mb-1">
                  Learner dashboard
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Welcome back, {user?.name}!
                </h1>
                <p className="text-indigo-100 mt-1">
                  Keep your reading journey moving forward.
                </p>
              </div>
            </div>
            <div className="relative z-10 mt-6 sm:mt-0 flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/update-password")}
                className="inline-flex items-center px-4 py-2 border border-white/20 rounded-lg text-sm font-medium text-white bg-white/10 hover:bg-white/20 transition-colors"
              >
                <i className="bi bi-key mr-2"></i>
                Change Password
              </button>
              <button
                onClick={() => {
                  setUser(null);
                  navigate("/login");
                }}
                className="inline-flex items-center px-4 py-2 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-colors"
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
              className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 hover:-translate-y-0.5 hover:shadow-lg transition-all stats-card"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {stat.value}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{stat.description}</p>
                </div>
                <div
                  className={`${stat.iconBg} w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm`}
                >
                  <i className={`bi ${stat.icon}`}></i>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* ✅ My Borrow Requests Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-indigo-600 font-semibold">Activity</p>
                  <h2 className="text-lg font-semibold text-slate-900">My Borrow Requests</h2>
                </div>
                <span className="min-w-8 h-8 px-2 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center text-sm font-bold">
                  {pendingRequests.length}
                </span>
              </div>
              <div className="space-y-4">
                {pendingRequests.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl">
                    No pending borrow requests.
                  </p>
                ) : (
                  pendingRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">
                          {request.book.title}
                        </h3>
                        <p className="text-sm text-slate-500">
                          {request.book.author}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          Awaiting approval
                        </span>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(request.requestDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ✅ My Borrowed Books Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  My Borrowed Books
                </h2>
                <button
                  onClick={() => navigate("/my-books")}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-semibold"
                >
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {activeBorrows.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl">
                    You haven't borrowed any books yet.
                  </p>
                ) : (
                  activeBorrows.map((borrow, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between gap-4 p-4 border border-slate-200 rounded-xl hover:border-teal-200 hover:bg-teal-50/30 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-slate-900">
                          {borrow.bookTitle}
                        </h3>
                        <p className="text-sm text-slate-500">
                          Borrowed:{" "}
                          {new Date(borrow.borrowedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">
                          Due: {new Date(borrow.dueDate).toLocaleDateString()}
                        </p>
                        <button
                          onClick={() => handleReturn(borrow.bookId)}
                          className="mt-2 bg-rose-500 hover:bg-rose-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
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
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-teal-600 font-semibold">Explore</p>
                  <h2 className="text-lg font-semibold text-slate-900">Available Books</h2>
                </div>
                <button onClick={() => navigate("/books")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                  Browse all
                </button>
              </div>
              <div className="relative mb-4">
                <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                <input
                  type="search"
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  placeholder="Search by title or author"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {visibleBooks.length === 0 ? (
                    <p className="text-slate-500 text-center py-6 bg-slate-50 rounded-xl">
                    {books.length === 0
                      ? "No books available."
                      : "No books match your search."}
                  </p>
                ) : (
                  visibleBooks.map((book) => (
                    (() => {
                      const isRequestPending = pendingBookIds.has(book._id);

                      return (
                    <div
                      key={book._id}
                      className="flex items-center justify-between gap-3 p-3 border border-slate-200 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
                    >
                      <div className="w-12 h-16 shrink-0 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center">
                        {book.bookUrl ? (
                          <img src={book.bookUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                        ) : (
                          <i className="bi bi-book text-xl text-slate-300"></i>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-slate-900 truncate">
                          {book.title}
                        </h3>
                        <p className="text-sm text-slate-500 truncate">{book.author}</p>
                        <p className="text-xs text-slate-400">
                          {book.quantity} copies available
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isRequestPending ? (
                          <span className="inline-flex items-center px-3 py-1 rounded text-sm bg-yellow-100 text-yellow-800">
                            Request Submitted
                          </span>
                        ) : book.availability && book.quantity > 0 ? (
                          <button
                            onClick={() => handleBorrowRequest(book._id)}
                            disabled={submittingBookId === book._id}
                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm"
                          >
                            {submittingBookId === book._id
                              ? "Submitting..."
                              : "Submit Request"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Not Available
                          </span>
                        )}
                      </div>
                    </div>
                      );
                    })()
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Quick Actions
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => navigate("/books")}
                  className="flex flex-col items-center justify-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                >
                  <i className="bi bi-search text-2xl text-indigo-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Browse Books
                  </span>
                </button>
                <button
                  onClick={() => navigate("/my-books")}
                  className="flex flex-col items-center justify-center p-4 bg-sky-50 hover:bg-sky-100 rounded-xl transition-colors"
                >
                  <i className="bi bi-book text-2xl text-blue-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    My Books
                  </span>
                </button>
                <button
                  onClick={() => navigate("/my-books")}
                  className="flex flex-col items-center justify-center p-4 bg-teal-50 hover:bg-teal-100 rounded-xl transition-colors"
                >
                  <i className="bi bi-arrow-repeat text-2xl text-green-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Renew Books
                  </span>
                </button>
                <button
                  onClick={() => toast.info("Feature coming soon")}
                  className="flex flex-col items-center justify-center p-4 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors"
                >
                  <i className="bi bi-exclamation-triangle text-2xl text-amber-600 mb-2"></i>
                  <span className="text-sm font-medium text-gray-700">
                    Report
                  </span>
                </button>
              </div>
            </div>

            {/* Account Info - Enhanced with loading state */}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
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
