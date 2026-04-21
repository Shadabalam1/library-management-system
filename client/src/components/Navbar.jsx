
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../utils/axios";
import toast from "react-hot-toast";

export default function Navbar() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // ✅ Add profile picture upload function
  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profilePic', file);

      // Using your existing backend endpoint
      const response = await API.post("/auth/upload-profile-pic", formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user with new avatar
      setUser({ 
        ...user, 
        avatar: { 
          ...user?.avatar, 
          url: response.data.avatarUrl 
        } 
      });
      toast.success("Profile picture updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload profile picture");
    }
  };

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

  if (!user) return null;

  return (
    <nav className="bg-blue-500 backdrop-blur-md border-b border-white/30 sticky top-0 z-50">
      {/* ✅ Hidden file input - Add this */}
      <input
        type="file"
        id="profilePicInput"
        accept="image/*"
        onChange={handleProfilePicUpload}
        className="hidden"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <i className="bi bi-book text-black text-xl mr-2"></i>
              <span className="text-black font-bold text-lg">LEARN HUB</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Profile Picture - Updated with camera icon */}
            <div className="relative">
              <div 
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/30 flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors"
                onClick={() => {
                  const input = document.getElementById('profilePicInput');
                  if (input) input.click();
                }}
              >
                {user?.avatar?.url ? (
                  <img 
                    src={user.avatar.url} 
                    alt="Profile" 
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-sm">{user?.name?.charAt(0)}</span>
                )}
              </div>
              {/* ✅ Add camera icon for visual feedback */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border-2 border-blue-500">
                <i className="bi bi-camera text-xs text-gray-600"></i>
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center whitespace-nowrap"
            >
              <i className="bi bi-box-arrow-right mr-1 text-sm"></i>
              <span className="hidden xs:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}