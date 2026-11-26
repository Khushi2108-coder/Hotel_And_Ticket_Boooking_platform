import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { WishlistProvider } from "./context/WishlistContext";
import Navbar from "./components/Navbar";
import ThemeSelectorModal from "./components/ThemeSelectorModal";
import WishlistDrawer from "./components/WishlistDrawer";
import Toast from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";

// Core Guest Pages
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import HotelDetails from "./pages/HotelDetails";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";
import Auth from "./pages/Auth";
import Signup from "./pages/Signup";
import MyProfile from "./pages/MyProfile";

// User Pages (Phase 1 Additions)
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Payment from "./pages/Payment";
import AvailabilityCalendarPage from "./pages/AvailabilityCalendarPage";

// Owner Portal Pages
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import PropertyManagement from "./pages/owner/PropertyManagement";
import RoomManagement from "./pages/owner/RoomManagement";
import InventoryCalendar from "./pages/owner/InventoryCalendar";
import PricingManagement from "./pages/owner/PricingManagement";
import BookingManagement from "./pages/owner/BookingManagement";
import RevenueReports from "./pages/owner/RevenueReports";

// Admin Portal Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import PropertyApprovals from "./pages/admin/PropertyApprovals";
import BookingOverview from "./pages/admin/BookingOverview";

function AppContent() {
  const { theme, isDark } = useTheme();
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState(null);

  const showToast = (toastData) => {
    setActiveToast(toastData);
  };

  return (
    <WishlistProvider onNotify={showToast}>
      <BrowserRouter>
        <div
          data-theme={theme}
          className={`app min-h-screen transition-colors duration-300 ${
            isDark ? "dark dark-mode" : ""
          }`}
        >
          <Navbar onOpenThemeModal={() => setIsThemeModalOpen(true)} />

          <Routes>
            {/* Guest Stays & Booking Routes */}
            <Route path="/" element={<Home onNotify={showToast} />} />
            <Route path="/search" element={<SearchResults onNotify={showToast} />} />
            <Route path="/hotels/:id" element={<HotelDetails onNotify={showToast} />} />
            <Route path="/booking" element={<Booking onNotify={showToast} />} />
            <Route path="/payment" element={<Payment onNotify={showToast} />} />
            <Route
              path="/booking-confirmation"
              element={<BookingConfirmation />}
            />
            <Route
              path="/availability"
              element={<AvailabilityCalendarPage onNotify={showToast} />}
            />

            {/* Authentication Routes */}
            <Route path="/login" element={<Auth />} />
            <Route path="/register" element={<Auth />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />

            {/* Protected Customer Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MyProfile />
                </ProtectedRoute>
              }
            />

            {/* Protected Owner Dashboard Routes (Owner & Admin only) */}
            <Route
              path="/owner"
              element={<Navigate to="/owner/dashboard" replace />}
            />
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <OwnerDashboard onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/properties"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <PropertyManagement onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/rooms"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <RoomManagement onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/calendar"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <InventoryCalendar onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/pricing"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <PricingManagement onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/bookings"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <BookingManagement onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/owner/revenue"
              element={
                <ProtectedRoute allowedRoles={["owner", "admin"]}>
                  <RevenueReports onNotify={showToast} />
                </ProtectedRoute>
              }
            />

            {/* Protected Admin Dashboard Routes (Admin only) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/properties"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <PropertyApprovals onNotify={showToast} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <BookingOverview onNotify={showToast} />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Theme Selector Modal */}
          <ThemeSelectorModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
            onNotify={showToast}
          />

          {/* Slide-over Saved Stays Wishlist Drawer */}
          <WishlistDrawer />

          {/* Floating Aesthetic Toast Notification */}
          <Toast toast={activeToast} onClose={() => setActiveToast(null)} />
        </div>
      </BrowserRouter>
    </WishlistProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CurrencyProvider>
          <AppContent />
        </CurrencyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
