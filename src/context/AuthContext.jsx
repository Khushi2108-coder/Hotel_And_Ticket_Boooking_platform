import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { userAPI, authAPI } from "../services/api";

const AuthContext = createContext(null);

// Reads the saved user from localStorage (Remember me) or sessionStorage
function readUser() {
  try {
    const raw = localStorage.getItem("user") || sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser);
  const [token, setToken] = useState(readToken);
  const [loading, setLoading] = useState(true);

  // Sync with backend on initial load if token exists
  useEffect(() => {
    async function syncCurrentUser() {
      const currentToken = readToken();
      if (!currentToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authAPI.getMe(currentToken);
        if (res.success && res.user) {
          setUser(res.user);
          // Update stored copy
          if (localStorage.getItem("token")) {
            localStorage.setItem("user", JSON.stringify(res.user));
          } else if (sessionStorage.getItem("token")) {
            sessionStorage.setItem("user", JSON.stringify(res.user));
          }
        }
      } catch (err) {
        console.warn("Session verification warning:", err.message);
        // If access token is expired, try refreshing via HTTP-only cookie
        try {
          const refreshRes = await authAPI.refreshToken();
          if (refreshRes.success && refreshRes.token) {
            const storage = localStorage.getItem("token") ? localStorage : sessionStorage;
            storage.setItem("token", refreshRes.token);
            setToken(refreshRes.token);

            // Re-fetch profile with fresh token
            const userRes = await authAPI.getMe(refreshRes.token);
            if (userRes.success && userRes.user) {
              setUser(userRes.user);
              storage.setItem("user", JSON.stringify(userRes.user));
            }
          }
        } catch (refreshErr) {
          console.warn("Token refresh failed on init:", refreshErr.message);
        }
      } finally {
        setLoading(false);
      }
    }

    syncCurrentUser();
  }, []);

  const login = useCallback((newToken, userData, remember = true) => {
    const storage = remember ? localStorage : sessionStorage;
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");

    storage.setItem("token", newToken);
    storage.setItem("user", JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch {
      // Best-effort
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedFields };
      if (localStorage.getItem("token")) {
        localStorage.setItem("user", JSON.stringify(merged));
      } else if (sessionStorage.getItem("token")) {
        sessionStorage.setItem("user", JSON.stringify(merged));
      }
      return merged;
    });
  }, []);

  const updateProfile = useCallback(
    async (profileData) => {
      try {
        const res = await userAPI.updateProfile(profileData);
        if (res.success && res.user) {
          updateUser(res.user);
          return res.user;
        }
      } catch (err) {
        updateUser(profileData);
        throw err;
      }
    },
    [updateUser]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoggedIn: !!user,
      loading,
      login,
      logout,
      updateUser,
      updateProfile,
    }),
    [user, token, loading, login, logout, updateUser, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
