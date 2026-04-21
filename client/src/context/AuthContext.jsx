import { createContext, useContext, useEffect, useState } from "react";
import API from "../utils/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const res = await API.get("/auth/me");
      setUser(res.data.user);
    } catch (error) {
      console.log("Failed to fetch user:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Optional: Token refresh every 30 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchUser();
      }
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(interval);
  }, [user]);

  const value = {
    user,
    setUser,
    fetchUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};