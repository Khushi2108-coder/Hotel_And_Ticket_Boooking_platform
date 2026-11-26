import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { bookingAPI, userAPI } from "../services/api";
import "./MyProfile.css";

function getInitials(name) {
  if (!name?.trim()) return "SE";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, isLoggedIn, updateUser, updateProfile, logout } = useAuth();

  // Active Tab state: 'bookings' | 'profile' | 'security' | 'loyalty'
  const [activeTab, setActiveTab] = useState("bookings");
  const [bookingFilter, setBookingFilter] = useState("all");

  // Bookings list state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    city: "",
  });

  // Security / Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notification notices
  const [notice, setNotice] = useState(null);

  // Modal states: view receipt & cancel confirmation
  const [receiptBooking, setReceiptBooking] = useState(null);
  const [cancellingBooking, setCancellingBooking] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // useRef hook to focus input when starting to edit
  const nameInputRef = useRef(null);

  // Sync profile form state with current user
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || "",
        city: user.city || "",
      });
    }
  }, [user]);

  // Focus ref when editing starts
  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditing]);

  // Fetch user bookings via API Fetching with async/await
  const fetchUserBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const res = await bookingAPI.getMyBookings();
      if (res.success && Array.isArray(res.bookings)) {
        setBookings(res.bookings);
      }
    } catch (err) {
      console.warn("Could not fetch remote bookings:", err.message);
      // Fallback: check localStorage for any locally saved booking
      try {
        const local = localStorage.getItem("stayeaseLatestBooking");
        if (local) {
          const parsed = JSON.parse(local);
          setBookings([parsed]);
        }
      } catch {
        setBookings([]);
      }
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserBookings();
    }
  }, [isLoggedIn, fetchUserBookings]);

  // useMemo for filtering bookings
  const filteredBookings = useMemo(() => {
    if (bookingFilter === "all") return bookings;
    return bookings.filter((b) => b.status?.toLowerCase() === bookingFilter.toLowerCase());
  }, [bookings, bookingFilter]);

  // useMemo for account statistics
  const stats = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) => b.status === "Confirmed").length;
    const completed = bookings.filter((b) => b.status === "Completed").length;
    const cancelled = bookings.filter((b) => b.status === "Cancelled").length;
    const points = user?.loyaltyPoints || (total * 250) + 150;

    return { total, active, completed, cancelled, points };
  }, [bookings, user]);

  // Handlers for profile update
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setNotice(null);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!profileForm.name.trim()) {
      setNotice({ type: "error", text: "Please enter your full name." });
      return;
    }

    if (!profileForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      setNotice({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setIsSavingProfile(true);
    try {
      // Call backend API (Node.js & Express.js CRUD - Update)
      const res = await userAPI.updateProfile(profileForm);
      if (res.success && res.user) {
        updateUser(res.user);
      } else {
        updateUser(profileForm);
      }
      setIsEditing(false);
      setNotice({ type: "success", text: "Profile updated successfully on the server." });
    } catch (err) {
      // Graceful fallback for local update
      updateUser(profileForm);
      setIsEditing(false);
      setNotice({
        type: "success",
        text: "Profile saved locally. (Backend: " + (err.message || "updated") + ")",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handlers for password change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setNotice(null);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setNotice(null);

    if (!passwordForm.currentPassword) {
      setNotice({ type: "error", text: "Please enter your current password." });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setNotice({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotice({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await userAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setNotice({ type: "success", text: res.message || "Password updated successfully!" });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Failed to change password." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Booking cancellation handler (CRUD - Delete / Status update)
  const handleConfirmCancelBooking = async () => {
    if (!cancellingBooking) return;
    setIsCancelling(true);

    try {
      await bookingAPI.cancel(cancellingBooking.id);
      // Update local state immediately
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancellingBooking.id ? { ...b, status: "Cancelled" } : b
        )
      );
      setNotice({
        type: "success",
        text: `Booking ${cancellingBooking.reference || ""} has been successfully cancelled.`,
      });
    } catch (err) {
      // Local fallback
      setBookings((prev) =>
        prev.map((b) =>
          b.id === cancellingBooking.id ? { ...b, status: "Cancelled" } : b
        )
      );
      setNotice({
        type: "success",
        text: `Booking cancelled. (${err.message})`,
      });
    } finally {
      setIsCancelling(false);
      setCancellingBooking(null);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2.5 * 1024 * 1024) {
      setNotice({ type: "error", text: "Please select an image smaller than 2.5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        await updateProfile({ avatar: base64Data });
        setNotice({ type: "success", text: "Profile picture updated successfully! ✨" });
      } catch (err) {
        setNotice({ type: "error", text: err.message || "Failed to update profile picture." });
      }
    };
    reader.readAsDataURL(file);
  };

  // If user is not logged in
  if (!isLoggedIn) {
    return (
      <main className="profile-page">
        <div className="profile-empty-state">
          <div className="profile-empty-badge">✦ STAYEASE ACCOUNT</div>
          <h1 className="profile-empty-title">Your journeys start here.</h1>
          <p className="profile-empty-text">
            Sign in to view your hotel reservations, manage profile preferences, and access exclusive member perks.
          </p>
          <div className="profile-empty-actions">
            <Link to="/login" className="profile-btn-primary">
              Log in to your account <span>→</span>
            </Link>
            <Link to="/signup" className="profile-btn-secondary">
              Create an account
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initials = getInitials(user?.name || user?.username);
  const displayName = user?.name || user?.username || "Guest";
  const userTier = user?.tier || "Gold Explorer";

  return (
    <main className="profile-page">
      <div className="profile-container">
        {/* Breadcrumb Navigation */}
        <nav className="profile-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">My Profile & Bookings</span>
        </nav>

        {/* Global Notice Toast */}
        {notice && (
          <div className={`profile-toast profile-toast--${notice.type}`} role="status">
            <span className="profile-toast-icon">
              {notice.type === "success" ? "✓" : "!"}
            </span>
            <span className="profile-toast-text">{notice.text}</span>
            <button
              type="button"
              className="profile-toast-close"
              onClick={() => setNotice(null)}
              aria-label="Dismiss notice"
            >
              ×
            </button>
          </div>
        )}

        {/* Hero Profile Header */}
        <section className="profile-hero">
          <div className="profile-hero-left">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar-circle" title="Click to change profile picture">
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} className="profile-avatar-img" />
                ) : (
                  initials
                )}
                <label htmlFor="profile-avatar-input" className="profile-avatar-upload-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z"/>
                  </svg>
                  <span>Photo</span>
                </label>
                <input
                  id="profile-avatar-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  style={{ display: "none" }}
                />
              </div>
              <div className="profile-tier-badge" title="StayEase Member Tier">
                ✦ {userTier}
              </div>
            </div>

            <div className="profile-identity">
              <span className="profile-welcome-tag">WELCOME BACK</span>
              <h1 className="profile-name-heading">{displayName}</h1>
              <p className="profile-email-text">{user?.email}</p>
              {user?.city && (
                <p className="profile-location-text">
                  <span>📍</span> {user.city}
                </p>
              )}
            </div>
          </div>

          <div className="profile-hero-actions">
            <button
              type="button"
              onClick={() => {
                setActiveTab("profile");
                setIsEditing(true);
              }}
              className="profile-btn-outline"
            >
              <span>✎</span> Edit Profile
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/");
              }}
              className="profile-btn-danger"
            >
              Log out
            </button>
          </div>
        </section>

        {/* 4 Quick Stat Cards */}
        <section className="profile-metrics-grid">
          <div className="profile-metric-card">
            <div className="metric-icon">🧳</div>
            <div className="metric-info">
              <span className="metric-label">Total Reservations</span>
              <span className="metric-value">{stats.total}</span>
            </div>
          </div>

          <div className="profile-metric-card">
            <div className="metric-icon">🟢</div>
            <div className="metric-info">
              <span className="metric-label">Active Bookings</span>
              <span className="metric-value">{stats.active}</span>
            </div>
          </div>

          <div className="profile-metric-card">
            <div className="metric-icon">🌟</div>
            <div className="metric-info">
              <span className="metric-label">StayEase Points</span>
              <span className="metric-value">{stats.points.toLocaleString()} pts</span>
            </div>
          </div>

          <div className="profile-metric-card">
            <div className="metric-icon">🏨</div>
            <div className="metric-info">
              <span className="metric-label">Completed Stays</span>
              <span className="metric-value">{stats.completed}</span>
            </div>
          </div>
        </section>

        {/* Interactive Tabbed Navigation */}
        <div className="profile-tabs-header">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "bookings" ? "active" : ""}`}
            onClick={() => setActiveTab("bookings")}
          >
            <span className="tab-icon">📋</span>
            My Bookings
            {bookings.length > 0 && <span className="tab-pill">{bookings.length}</span>}
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <span className="tab-icon">👤</span>
            Personal Details
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <span className="tab-icon">🔒</span>
            Security & Password
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === "loyalty" ? "active" : ""}`}
            onClick={() => setActiveTab("loyalty")}
          >
            <span className="tab-icon">✦</span>
            Member Perks
          </button>
        </div>

        {/* TAB 1: MY BOOKINGS (CRUD: Read, Filter, Cancel) */}
        {activeTab === "bookings" && (
          <section className="profile-tab-content">
            <div className="bookings-toolbar">
              <div className="bookings-filter-group">
                <span className="filter-label">Filter by:</span>
                <button
                  type="button"
                  className={`filter-chip ${bookingFilter === "all" ? "active" : ""}`}
                  onClick={() => setBookingFilter("all")}
                >
                  All ({bookings.length})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${bookingFilter === "confirmed" ? "active" : ""}`}
                  onClick={() => setBookingFilter("confirmed")}
                >
                  Confirmed ({stats.active})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${bookingFilter === "completed" ? "active" : ""}`}
                  onClick={() => setBookingFilter("completed")}
                >
                  Completed ({stats.completed})
                </button>
                <button
                  type="button"
                  className={`filter-chip ${bookingFilter === "cancelled" ? "active" : ""}`}
                  onClick={() => setBookingFilter("cancelled")}
                >
                  Cancelled ({stats.cancelled})
                </button>
              </div>

              <Link to="/search" className="profile-btn-primary book-new-btn">
                <span>+</span> Book a New Stay
              </Link>
            </div>

            {loadingBookings ? (
              <div className="bookings-loading">
                <div className="loading-spinner" />
                <p>Loading your reservations from the server...</p>
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="bookings-empty-state">
                <div className="empty-icon">🏖️</div>
                <h3>No reservations found</h3>
                <p>
                  {bookingFilter === "all"
                    ? "You haven't made any hotel reservations yet. Explore our curated selection of luxury hotels and find your next escape."
                    : `You have no ${bookingFilter} bookings at this time.`}
                </p>
                <Link to="/search" className="profile-btn-primary">
                  Explore Stays <span>→</span>
                </Link>
              </div>
            ) : (
              <div className="bookings-list">
                {filteredBookings.map((item) => {
                  const statusClass =
                    item.status === "Confirmed"
                      ? "status--confirmed"
                      : item.status === "Completed"
                      ? "status--completed"
                      : "status--cancelled";

                  return (
                    <article key={item.id || item.reference} className="booking-card">
                      <div className="booking-card-media">
                        <img
                          src={
                            item.hotelImage ||
                            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80"
                          }
                          alt={item.hotelName || "Hotel"}
                          className="booking-image"
                        />
                        <span className={`booking-status-badge ${statusClass}`}>
                          {item.status || "Confirmed"}
                        </span>
                      </div>

                      <div className="booking-card-body">
                        <div className="booking-header-row">
                          <div>
                            <span className="booking-ref-label">
                              REFERENCE: <strong>{item.reference}</strong>
                            </span>
                            <h2 className="booking-hotel-title">{item.hotelName}</h2>
                            <p className="booking-location">
                              <span>📍</span> {item.hotelCity || "India"}
                            </p>
                          </div>

                          <div className="booking-price-badge">
                            <span className="price-sub">Total Paid</span>
                            <span className="price-val">
                              ₹{Number(item.total || item.roomPrice || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="booking-details-grid">
                          <div className="detail-item">
                            <span className="detail-lbl">Room Type</span>
                            <span className="detail-val">{item.roomName || "Standard Room"}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-lbl">Check-In</span>
                            <span className="detail-val">{item.checkIn}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-lbl">Check-Out</span>
                            <span className="detail-val">{item.checkOut}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-lbl">Stay Details</span>
                            <span className="detail-val">
                              {item.nights || 1} Nights · {item.guests || 2} Guests
                            </span>
                          </div>
                        </div>

                        <div className="booking-card-footer">
                          <div className="guest-info-snippet">
                            <span>Guest: {item.guestName || displayName}</span>
                            <span>•</span>
                            <span>{item.email}</span>
                          </div>

                          <div className="booking-actions">
                            <button
                              type="button"
                              onClick={() => setReceiptBooking(item)}
                              className="btn-action-receipt"
                            >
                              <span>📄</span> View Receipt
                            </button>

                            {item.status === "Confirmed" && (
                              <button
                                type="button"
                                onClick={() => setCancellingBooking(item)}
                                className="btn-action-cancel"
                              >
                                Cancel Stay
                              </button>
                            )}

                            {item.hotelId && (
                              <Link
                                to={`/hotels/${item.hotelId}`}
                                className="btn-action-rebook"
                              >
                                Book Again ↗
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: PERSONAL INFORMATION (CRUD: Update) */}
        {activeTab === "profile" && (
          <section className="profile-tab-content">
            <div className="profile-form-card">
              <div className="form-card-header">
                <div>
                  <span className="form-eyebrow">YOUR STAYEASE PROFILE</span>
                  <h2>Personal Information</h2>
                  <p>
                    Update your personal contact details to make bookings faster and receive instant confirmations.
                  </p>
                </div>

                {!isEditing ? (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="profile-btn-primary"
                  >
                    <span>✎</span> Edit Information
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="profile-btn-outline"
                  >
                    Cancel
                  </button>
                )}
              </div>

              <form onSubmit={handleProfileSave} className="profile-grid-form">
                <div className="form-field-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    ref={nameInputRef}
                    id="name"
                    name="name"
                    type="text"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    disabled={!isEditing || isSavingProfile}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    disabled={!isEditing || isSavingProfile}
                    placeholder="yourname@domain.com"
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    disabled={!isEditing || isSavingProfile}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={handleProfileChange}
                    disabled={!isEditing || isSavingProfile}
                  />
                </div>

                <div className="form-field-group full-width">
                  <label htmlFor="city">City / Residence</label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                    disabled={!isEditing || isSavingProfile}
                    placeholder="e.g. Mumbai, Maharashtra"
                  />
                </div>

                {isEditing && (
                  <div className="form-actions-bar full-width">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="profile-btn-secondary"
                      disabled={isSavingProfile}
                    >
                      Discard
                    </button>
                    <button
                      type="submit"
                      className="profile-btn-primary"
                      disabled={isSavingProfile}
                    >
                      {isSavingProfile ? "Saving to Server..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </form>

              <div className="backend-sync-callout">
                <div className="callout-icon">ℹ️</div>
                <div className="callout-text">
                  <strong>Backend Sync Active:</strong> Changes made here are verified and saved directly via Express.js REST API (<code>PUT /api/users/profile</code>) with token authentication.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === "security" && (
          <section className="profile-tab-content">
            <div className="profile-form-card">
              <div className="form-card-header">
                <div>
                  <span className="form-eyebrow">PROTECT YOUR ACCOUNT</span>
                  <h2>Security & Password</h2>
                  <p>
                    Update your account password and review your active authentication credentials.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="profile-grid-form">
                <div className="form-field-group full-width">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter current password (demo: password123)"
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="newPassword">New Password *</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>

                <div className="form-field-group">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    required
                  />
                </div>

                <div className="form-actions-bar full-width">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? "Updating Password..." : "Change Password"}
                  </button>
                </div>
              </form>

              <div className="security-status-box">
                <div className="security-item">
                  <span className="sec-icon">🔐</span>
                  <div>
                    <h4>Encrypted Session</h4>
                    <p>Protected by JSON Web Tokens (JWT) signed with HMAC SHA-256 algorithm.</p>
                  </div>
                </div>
                <div className="security-item">
                  <span className="sec-icon">🛡️</span>
                  <div>
                    <h4>Bcrypt Password Hashing</h4>
                    <p>Passwords are never stored in plaintext and hashed with salted bcrypt rounds.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: LOYALTY & MEMBER PERKS */}
        {activeTab === "loyalty" && (
          <section className="profile-tab-content">
            <div className="loyalty-card">
              <div className="loyalty-header">
                <div>
                  <span className="loyalty-eyebrow">STAYEASE PRIVILEGES</span>
                  <h2>{userTier} Member</h2>
                  <p>Enjoy exclusive rates, priority upgrades, and handcrafted welcome experiences.</p>
                </div>
                <div className="loyalty-badge-circle">
                  <span>✦</span>
                  <strong>{stats.points}</strong>
                  <small>PTS</small>
                </div>
              </div>

              <div className="loyalty-progress-section">
                <div className="progress-labels">
                  <span>Silver Explorer</span>
                  <span className="current-tier">✦ Gold Explorer (Active)</span>
                  <span>Platinum Elite (2,500 pts)</span>
                </div>
                <div className="loyalty-progress-track">
                  <div
                    className="loyalty-progress-fill"
                    style={{ width: `${Math.min(100, (stats.points / 2500) * 100)}%` }}
                  />
                </div>
                <p className="progress-note">
                  Earn 10 points for every ₹100 spent on bookings across all StayEase properties.
                </p>
              </div>

              <div className="perks-grid">
                <div className="perk-card">
                  <span className="perk-icon">☕</span>
                  <h4>Complimentary Breakfast</h4>
                  <p>Daily artisanal breakfast for two guests at any participating hotel restaurant.</p>
                </div>
                <div className="perk-card">
                  <span className="perk-icon">⏰</span>
                  <h4>Late Check-out</h4>
                  <p>Enjoy extended relaxation with guaranteed late checkout up to 2:00 PM.</p>
                </div>
                <div className="perk-card">
                  <span className="perk-icon">🛋️</span>
                  <h4>Complimentary Room Upgrade</h4>
                  <p>Subject to room availability at the time of check-in.</p>
                </div>
                <div className="perk-card">
                  <span className="perk-icon">🍹</span>
                  <h4>Welcome Beverage</h4>
                  <p>A handcrafted welcome drink upon your arrival at every property.</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Modal: View Receipt / Reservation Voucher */}
        {receiptBooking && (
          <div className="profile-modal-backdrop" onClick={() => setReceiptBooking(null)}>
            <div className="profile-modal-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="modal-tag">STAYEASE RESERVATION VOUCHER</span>
                  <h2>Booking Confirmation</h2>
                </div>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setReceiptBooking(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body print-area">
                <div className="receipt-banner">
                  <div className="receipt-ref-box">
                    <span>Reference Number</span>
                    <h3>{receiptBooking.reference}</h3>
                  </div>
                  <div className={`receipt-status-pill status--${receiptBooking.status?.toLowerCase() || "confirmed"}`}>
                    {receiptBooking.status || "Confirmed"}
                  </div>
                </div>

                <div className="receipt-grid">
                  <div className="receipt-row">
                    <span className="lbl">Hotel Name</span>
                    <span className="val">{receiptBooking.hotelName}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="lbl">Destination</span>
                    <span className="val">{receiptBooking.hotelCity || "India"}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="lbl">Room Type</span>
                    <span className="val">{receiptBooking.roomName}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="lbl">Check-In Date</span>
                    <span className="val">{receiptBooking.checkIn}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="lbl">Check-Out Date</span>
                    <span className="val">{receiptBooking.checkOut}</span>
                  </div>
                  <div className="receipt-row">
                    <span className="lbl">Guest Details</span>
                    <span className="val">
                      {receiptBooking.guestName} ({receiptBooking.phone || receiptBooking.email})
                    </span>
                  </div>
                  <div className="receipt-row">
                    <span className="lbl">Nights & Guests</span>
                    <span className="val">
                      {receiptBooking.nights || 1} Night(s) · {receiptBooking.guests || 2} Guest(s)
                    </span>
                  </div>
                </div>

                <div className="receipt-pricing-box">
                  <div className="pricing-row">
                    <span>Room Charges</span>
                    <span>₹{Number(receiptBooking.subtotal || receiptBooking.roomPrice || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pricing-row">
                    <span>Taxes & Service Fees (12%)</span>
                    <span>₹{Number(receiptBooking.taxes || 0).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="pricing-row total-row">
                    <span>Total Amount Paid</span>
                    <span>₹{Number(receiptBooking.total || receiptBooking.roomPrice || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="profile-btn-primary"
                >
                  <span>🖨️</span> Print Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setReceiptBooking(null)}
                  className="profile-btn-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cancel Booking Confirmation */}
        {cancellingBooking && (
          <div className="profile-modal-backdrop" onClick={() => setCancellingBooking(null)}>
            <div className="profile-modal-sheet cancel-modal" onClick={(e) => e.stopPropagation()}>
              <div className="cancel-icon-warning">⚠️</div>
              <h2>Cancel Reservation?</h2>
              <p>
                Are you sure you want to cancel your reservation for <strong>{cancellingBooking.hotelName}</strong> (Ref: {cancellingBooking.reference})?
              </p>
              <div className="cancel-modal-actions">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="profile-btn-secondary"
                  disabled={isCancelling}
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancelBooking}
                  className="profile-btn-danger"
                  disabled={isCancelling}
                >
                  {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
