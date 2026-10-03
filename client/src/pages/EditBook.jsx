import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../utils/axios";
import toast from "react-hot-toast";

export default function EditBook() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    author: "",
    description: "",
    bookUrl: "",
    price: "",
    quantity: "",
  });

  // Fetch single book
  useEffect(() => {
    const fetchBook = async () => {
      try {
        const res = await API.get(`/book/${id}`);

        setFormData({
          title: res.data.book.title,
          author: res.data.book.author,
          description: res.data.book.description || "",
          bookUrl: res.data.book.bookUrl || "",
          price: res.data.book.price,
          quantity: res.data.book.quantity,
        });
      } catch {
        toast.error("Failed to fetch book");
      }
    };

    fetchBook();
  }, [id]);

  // Handle input change
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Update book
  const handleUpdateBook = async (e) => {
    e.preventDefault();

    if (formData.bookUrl && !/^https?:\/\/\S+$/i.test(formData.bookUrl)) {
      toast.error("Book URL must start with http:// or https://");
      return;
    }

    try {
      await API.put(`/book/${id}`, formData);

      toast.success("Book updated successfully");

      navigate("/admin/dashboard");
    } catch {
      toast.error("Failed to update book");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <form
        onSubmit={handleUpdateBook}
        className="bg-white shadow-lg rounded-xl p-8 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          Edit Book
        </h2>

        <input
          type="text"
          name="title"
          placeholder="Book Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-4"
        />

        <input
          type="text"
          name="author"
          placeholder="Author"
          value={formData.author}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-4"
        />

        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-4"
          rows="4"
        />

        <input
          type="url"
          name="bookUrl"
          placeholder="Book Link / Cover Image URL (optional)"
          value={formData.bookUrl}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-4"
        />

        {formData.bookUrl && (
          <div className="mb-4 w-32 h-44 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
            <img
              src={formData.bookUrl}
              alt="Book cover preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <input
          type="number"
          name="price"
          placeholder="Price"
          value={formData.price}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-4"
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={formData.quantity}
          onChange={handleChange}
          className="w-full border p-3 rounded mb-6"
        />

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded"
        >
          Update Book
        </button>
      </form>
    </div>
  );
}