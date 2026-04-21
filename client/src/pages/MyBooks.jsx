import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import toast from "react-hot-toast";

export default function MyBooks() {
  const navigate = useNavigate();
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("borrowed"); // borrowed, history

  // Fetch borrowed books
  const fetchBorrowedBooks = async () => {
    try {
      setLoading(true);
      const response = await API.get("/borrow/my-borrowed-books");
      setBorrowedBooks(response.data.borrowedBooks || []);
    } catch (error) {
      console.error("Error fetching borrowed books:", error);
      toast.error("Failed to load borrowed books");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowedBooks();
  }, []);

  // Handle book return
  const handleReturn = async (bookId) => {
    try {
      const res = await API.put(`/borrow/return-borrowed-book/${bookId}`);
      toast.success(res.data.message);
      fetchBorrowedBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to return book");
    }
  };

  // ✅ Handle book renew
  const handleRenew = async (bookId) => {
    try {
      const res = await API.post(`/borrow/renew/${bookId}`);
      toast.success(res.data.message);
      fetchBorrowedBooks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to renew book");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your books...</p>
        </div>
      </div>
    );
  }

  // Separate active and returned books
  const activeBooks = borrowedBooks.filter(book => !book.returned);
  const returnedBooks = borrowedBooks.filter(book => book.returned);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Books</h1>
              <p className="text-gray-600 mt-1">Manage your borrowed books and reading history</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <i className="bi bi-arrow-left mr-2"></i>
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("borrowed")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "borrowed"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-book mr-2"></i>
                Currently Borrowed ({activeBooks.length})
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === "history"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <i className="bi bi-clock-history mr-2"></i>
                Reading History ({returnedBooks.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "borrowed" ? (
              // Currently Borrowed Books
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Currently Borrowed Books</h2>
                {activeBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="bi bi-book text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No books borrowed</h3>
                    <p className="text-gray-600 mb-4">You haven't borrowed any books yet.</p>
                    <button
                      onClick={() => navigate("/books")}
                      className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                    >
                      <i className="bi bi-search mr-2"></i>
                      Browse Books
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeBooks.map((borrow) => (
                      <div key={borrow._id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{borrow.bookTitle}</h3>
                            <p className="text-gray-600">by {borrow.bookAuthor}</p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Borrowed:</span>{" "}
                                {new Date(borrow.borrowedDate).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-medium">Due Date:</span>{" "}
                                <span className={new Date() > new Date(borrow.dueDate) ? "text-red-600 font-medium" : ""}>
                                  {new Date(borrow.dueDate).toLocaleDateString()}
                                </span>
                              </p>
                              {borrow.renewed && (
                                <p>
                                  <span className="font-medium">Renewed:</span>{" "}
                                  {new Date(borrow.renewedDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            {/* Overdue warning */}
                            {new Date() > new Date(borrow.dueDate) && !borrow.returned && (
                              <div className="mt-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                <i className="bi bi-exclamation-triangle mr-1"></i>
                                Overdue
                              </div>
                            )}
                          </div>
                          <div className="mt-4 sm:mt-0 flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
                            {/* ✅ Renew Button */}
                            {!borrow.renewed && new Date() < new Date(borrow.dueDate) ? (
                              <button
                                onClick={() => handleRenew(borrow.bookId)}
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                              >
                                <i className="bi bi-arrow-repeat mr-1"></i>
                                Renew
                              </button>
                            ) : borrow.renewed ? (
                              <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600">
                                Renewed
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-600">
                                Overdue
                              </span>
                            )}
                            
                            {/* Return Button */}
                            <button
                              onClick={() => handleReturn(borrow.bookId)}
                              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              <i className="bi bi-box-arrow-in-left mr-1"></i>
                              Return
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Reading History
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Reading History</h2>
                {returnedBooks.length === 0 ? (
                  <div className="text-center py-12">
                    <i className="bi bi-clock-history text-4xl text-gray-300 mb-4"></i>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No reading history</h3>
                    <p className="text-gray-600">Your returned books will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {returnedBooks.map((borrow) => (
                      <div key={borrow._id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{borrow.bookTitle}</h3>
                            <p className="text-gray-600">by {borrow.bookAuthor}</p>
                            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Borrowed:</span>{" "}
                                {new Date(borrow.borrowedDate).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-medium">Returned:</span>{" "}
                                {new Date(borrow.returnedDate).toLocaleDateString()}
                              </p>
                              <p>
                                <span className="font-medium">Duration:</span>{" "}
                                {Math.ceil(
                                  (new Date(borrow.returnedDate) - new Date(borrow.borrowedDate)) /
                                    (1000 * 60 * 60 * 24)
                                )} days
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              <i className="bi bi-check-circle mr-1"></i>
                              Returned
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}