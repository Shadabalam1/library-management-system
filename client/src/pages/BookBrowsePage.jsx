import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import toast from "react-hot-toast";

export default function BookBrowsePage() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("title");

  // Fetch all books
  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await API.get("/book/all");
      setBooks(response.data.books);
      setFilteredBooks(response.data.books);
    } catch (error) {
      console.error("Error fetching books:", error);
      toast.error("Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort books
  useEffect(() => {
    let result = [...books];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (book) =>
          book.title.toLowerCase().includes(term) ||
          book.author.toLowerCase().includes(term) ||
          book.category?.toLowerCase().includes(term) ||
          book.description?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter((book) => book.category === selectedCategory);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "author") {
        return a.author.localeCompare(b.author);
      } else if (sortBy === "newest") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

    setFilteredBooks(result);
  }, [books, searchTerm, selectedCategory, sortBy]);

  // Get unique categories
  const categories = [
    ...new Set(books.map((book) => book.category).filter(Boolean)),
  ];

  useEffect(() => {
    fetchBooks();
  }, []);

  // Handle borrow request
  const handleBorrowRequest = async (bookId) => {
    try {
      const res = await API.post(`/borrow/request/${bookId}`);
      toast.success(res.data.message);
      // Refresh books data
      fetchBooks();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send borrow request"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Browse Books</h1>
              <p className="text-gray-600 mt-1">
                Discover and borrow books from our collection
              </p>
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

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Books
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by title, author, category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <i className="bi bi-search absolute left-3 top-2.5 text-gray-400"></i>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="title">Title (A-Z)</option>
                <option value="author">Author (A-Z)</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing{" "}
            <span className="font-semibold">{filteredBooks.length}</span> of{" "}
            <span className="font-semibold">{books.length}</span> books
          </p>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <i className="bi bi-book text-4xl text-gray-300 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No books found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book._id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {book.author}
                      </p>
                    </div>
                    {book.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {book.category}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {book.publisher && (
                      <p>
                        <span className="font-medium">Publisher:</span>{" "}
                        {book.publisher}
                      </p>
                    )}
                    {book.publishedYear && (
                      <p>
                        <span className="font-medium">Year:</span>{" "}
                        {book.publishedYear}
                      </p>
                    )}
                    <p>
                      <span className="font-medium">Copies:</span>{" "}
                      {book.quantity} available
                    </p>
                  </div>

                  {book.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {book.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      {book.availability && book.quantity > 0 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Available
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Not Available
                        </span>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {book.availability && book.quantity > 0 ? (
                        <button
                          onClick={() => handleBorrowRequest(book._id)}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Request
                        </button>
                      ) : (
                        <button
                          disabled
                          className="bg-gray-300 text-gray-500 px-3 py-1 rounded text-sm cursor-not-allowed"
                        >
                          Unavailable
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
