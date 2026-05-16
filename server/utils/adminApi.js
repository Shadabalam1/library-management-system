import axios from "axios";
import toast from "react-hot-toast";

export const handleDeleteUser = async (userId, navigate) => {
  try {
    const token = localStorage.getItem("token"); // Adjust if you store token differently
    const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

    const response = await axios.delete(`${baseURL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success(response.data.message);
    // Refresh list or update state
    if (navigate) navigate(0); // Forces re-fetch, or trigger your existing fetchUserList()
  } catch (error) {
    const msg = error.response?.data?.message || "Failed to delete user";
    toast.error(msg);
  }
};