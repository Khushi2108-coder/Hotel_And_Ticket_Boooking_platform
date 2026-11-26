/**
 * StayEase API Client
 * Demonstrates:
 * - JavaScript Promises and async/await
 * - HTTP API Fetching with error handling
 * - Clean modular folder structure
 * - Automatic Access Token Refresh on 401
 */

const API_BASE_URL = "http://localhost:5001/api";

function getStoredToken() {
  return localStorage.getItem("token") || sessionStorage.getItem("token") || null;
}

function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  const activeToken = token || getStoredToken();
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  return headers;
}

/**
 * Enhanced fetch with automatic token refresh on 401 (access token expired)
 */
async function fetchWithAuth(url, options = {}, retryOn401 = true) {
  options.headers = options.headers || getHeaders();
  options.credentials = options.credentials || "include";

  let res = await fetch(url, options);

  if (res.status === 401 && retryOn401) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.token) {
          const isLocal = !!localStorage.getItem("token");
          const storage = isLocal ? localStorage : sessionStorage;
          storage.setItem("token", refreshData.token);

          // Retry original request with new access token
          options.headers["Authorization"] = `Bearer ${refreshData.token}`;
          res = await fetch(url, options);
        }
      }
    } catch {
      // Refresh failed, proceed to return original 401
    }
  }

  return res;
}

// ----------------- Auth API -----------------
export const authAPI = {
  async register(data) {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Registration failed.");
    return result;
  },

  async login(credentials) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
      body: JSON.stringify(credentials),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Login failed.");
    return result;
  },

  async refreshToken() {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to refresh token.");
    return result;
  },

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: getHeaders(),
        credentials: "include",
      });
    } catch {
      // Best-effort logout
    }
  },

  async forgotPassword(data) {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Password reset request failed.");
    return result;
  },

  async resetPassword(token, data) {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to reset password.");
    return result;
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: getHeaders(token),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to fetch user.");
    return result;
  },
};

// ----------------- Hotels API (CRUD) -----------------
export const hotelAPI = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.city) query.append("city", params.city);
    if (params.q) query.append("q", params.q);
    if (params.minPrice) query.append("minPrice", params.minPrice);
    if (params.maxPrice) query.append("maxPrice", params.maxPrice);
    if (params.sort) query.append("sort", params.sort);

    const queryString = query.toString() ? `?${query.toString()}` : "";
    const res = await fetch(`${API_BASE_URL}/hotels${queryString}`, {
      method: "GET",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to fetch hotels.");
    return result;
  },

  async getById(id) {
    const res = await fetch(`${API_BASE_URL}/hotels/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Hotel not found.");
    return result;
  },
};

// ----------------- Bookings API (CRUD) -----------------
export const bookingAPI = {
  async create(bookingData) {
    const res = await fetchWithAuth(`${API_BASE_URL}/bookings`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(bookingData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to create booking.");
    return result;
  },

  async getMyBookings() {
    const res = await fetchWithAuth(`${API_BASE_URL}/bookings/my`, {
      method: "GET",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to fetch bookings.");
    return result;
  },

  async getById(id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
      method: "GET",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Booking not found.");
    return result;
  },

  async cancel(id) {
    const res = await fetchWithAuth(`${API_BASE_URL}/bookings/${id}`, {
      method: "DELETE",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to cancel booking.");
    return result;
  },
};

// ----------------- User Profile API -----------------
export const userAPI = {
  async getProfile() {
    const res = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
      method: "GET",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to load user profile.");
    return result;
  },

  async updateProfile(profileData) {
    const res = await fetchWithAuth(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(profileData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to update profile.");
    return result;
  },

  async changePassword(passwordData) {
    const res = await fetchWithAuth(`${API_BASE_URL}/users/change-password`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(passwordData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to change password.");
    return result;
  },
};

// ----------------- Public Feedback & Reviews API -----------------
export const feedbackAPI = {
  async getAll() {
    const res = await fetch(`${API_BASE_URL}/feedback`, {
      method: "GET",
      headers: getHeaders(),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to load feedbacks.");
    return result;
  },

  async create(feedbackData) {
    const res = await fetch(`${API_BASE_URL}/feedback`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(feedbackData),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || "Failed to submit feedback.");
    return result;
  },
};
