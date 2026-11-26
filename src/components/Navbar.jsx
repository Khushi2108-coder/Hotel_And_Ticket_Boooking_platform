import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useWishlist } from "../context/WishlistContext";

export default function Navbar({ onOpenThemeModal }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const navigate = useNavigate();

  const { user, isLoggedIn, logout } = useAuth();
  const { currentTheme } = useTheme();
  const { currency, setCurrency, currencies } = useCurrency();
  const { favoritesCount, setIsWishlistOpen } = useWishlist();

  const navClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive
        ? "font-semibold text-[#244b38] dark:text-[#34d399]"
        : "text-[#666b63] hover:text-[#244b38] dark:text-[#a6b4aa] dark:hover:text-[#34d399]"
    }`;

  const closeMenu = () => {
    setMenuOpen(false);
    setCurrencyOpen(false);
  };

  const handleBack = () => {
    closeMenu();
    if (window.history.state?.idx > 0) {
      navigate(-1);
    } else if (window.location.pathname !== "/search") {
      navigate("/search", { replace: true });
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const displayName = user?.name || user?.username || "Account";
  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#e9e5dc] bg-[#fcfbf8]/95 backdrop-blur-xl transition-colors duration-300 dark:border-[#2a3c30] dark:bg-[#0f1712]/95">
        <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-5 sm:px-8 lg:px-12">
          {/* Brand Logo */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#244b38] font-serif text-2xl font-bold text-white shadow-md shadow-[#244b38]/20 transition-transform hover:scale-105 dark:bg-[#34d399] dark:text-[#0a120e]">
              S
            </span>
            <span>
              <span className="block font-serif text-[26px] leading-none text-[#24402f] dark:text-[#f0f4f0]">
                StayEase<span className="text-[#b18a57] dark:text-[#34d399]">.</span>
              </span>
              <span className="mt-1 block text-[9px] uppercase tracking-[2.2px] text-[#85877f] dark:text-[#8e9c92]">
                Luxury Stays & Retreats
              </span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-6 xl:gap-7 lg:flex">
            <NavLink to="/" end className={navClass}>Home</NavLink>
            <NavLink to="/search" className={navClass}>Explore Stays</NavLink>
            <NavLink to="/availability" className={navClass}>Calendar</NavLink>
            <Link to="/#destinations" className="text-sm font-medium text-[#666b63] transition hover:text-[#244b38] dark:text-[#a6b4aa] dark:hover:text-[#34d399]">
              Destinations
            </Link>
            <Link to="/#featured-stays" className="text-sm font-medium text-[#666b63] transition hover:text-[#244b38] dark:text-[#a6b4aa] dark:hover:text-[#34d399]">
              Collection
            </Link>
            {isLoggedIn && (
              <NavLink to="/profile" className={navClass}>
                My Bookings
              </NavLink>
            )}
            <NavLink to="/owner/dashboard" className={navClass}>
              Owner
            </NavLink>
            <NavLink to="/admin" className={navClass}>
              Admin
            </NavLink>
          </nav>

          {/* Action Buttons: Currency, Theme Switcher, Wishlist, Auth */}
          <div className="hidden items-center gap-2.5 sm:flex">
            {/* Currency Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCurrencyOpen(!currencyOpen)}
                title="Change currency"
                aria-label={`Selected currency: ${currency}`}
                className="flex h-10 items-center gap-1.5 rounded-full border border-[#e5e2d9] bg-white/70 px-3.5 text-xs font-semibold text-[#244b38] shadow-xs backdrop-blur-sm transition hover:bg-[#f0eee7] dark:border-[#2a3c30] dark:bg-[#16211a] dark:text-[#34d399] dark:hover:bg-[#1e2d23]"
              >
                <span>{currencies.find((c) => c.code === currency)?.flag || "🌐"}</span>
                <span>{currency}</span>
                <span className="text-[10px] opacity-60">▾</span>
              </button>

              {currencyOpen && (
                <div className="absolute right-0 top-12 z-50 w-44 rounded-2xl border border-[#e9e5dc] bg-white p-2 shadow-xl dark:border-[#2a3c30] dark:bg-[#16211a]">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                    Select Currency
                  </p>
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCurrency(c.code);
                        setCurrencyOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition ${
                        currency === c.code
                          ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                          : "text-[#26382d] hover:bg-[#edf3ec] dark:text-[#e0eae3] dark:hover:bg-[#1f3025]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{c.code} ({c.symbol})</span>
                      </span>
                      {currency === c.code && <span>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme Selector Trigger */}
            <button
              type="button"
              onClick={onOpenThemeModal}
              title={`Current Theme: ${currentTheme.name}. Click to change theme`}
              aria-label="Theme selector"
              className="flex h-10 items-center gap-2 rounded-full border border-[#e5e2d9] bg-white/70 px-3.5 text-xs font-semibold text-[#244b38] shadow-xs backdrop-blur-sm transition hover:bg-[#f0eee7] dark:border-[#2a3c30] dark:bg-[#16211a] dark:text-[#e0eae3] dark:hover:bg-[#1e2d23]"
            >
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/10 shadow-xs" style={{ backgroundColor: currentTheme.colors.primary }} />
              <span className="hidden xl:inline">{currentTheme.name.split(" ")[0]}</span>
              <span className="text-[11px]">🎨</span>
            </button>

            {/* Wishlist Trigger Button */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              title="Saved stays"
              aria-label={`Wishlist with ${favoritesCount} items`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e2d9] bg-white/70 text-base text-[#244b38] shadow-xs transition hover:bg-[#f0eee7] dark:border-[#2a3c30] dark:bg-[#16211a] dark:text-[#e0eae3] dark:hover:bg-[#1e2d23]"
            >
              <span>❤️</span>
              {favoritesCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#c53030] text-[10px] font-bold text-white shadow-xs animate-pulse">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* User Auth Buttons */}
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  aria-label="My Profile"
                  title="View Profile & Bookings"
                  className="flex items-center gap-2.5 rounded-full border border-[#244b38]/20 bg-[#edf3ec] px-3.5 py-1.5 text-sm font-medium text-[#244b38] transition hover:bg-[#dfeade] dark:border-[#34d399]/30 dark:bg-[#1a2d21] dark:text-[#34d399]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#244b38] text-xs font-semibold text-white dark:bg-[#34d399] dark:text-[#0c120e] overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </span>
                  <span className="max-w-[120px] truncate text-xs font-semibold">
                    {displayName.split(" ")[0]}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl border border-[#e5e2d9] px-3 py-2 text-xs font-semibold text-[#777b70] transition hover:border-[#d4cfc5] hover:bg-[#f0eee7] hover:text-[#244b38] dark:border-[#2a3c30] dark:text-[#a0aca3] dark:hover:bg-[#1e2d23] dark:hover:text-white"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#244b38] transition hover:bg-[#f0eee7] dark:text-[#34d399] dark:hover:bg-[#1e2d23]"
                >
                  Log in
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/signup")}
                  className="rounded-xl bg-[#244b38] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
                >
                  Sign up ↗
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e5e2d9] text-[#244b38] sm:hidden dark:border-[#2a3c30] dark:text-[#34d399]"
          >
            {menuOpen ? <span className="text-2xl">✕</span> : <span className="text-xl">☰</span>}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {menuOpen && (
          <div className="border-t border-[#e9e5dc] bg-[#fcfbf8] px-5 pb-6 pt-5 sm:hidden dark:border-[#2a3c30] dark:bg-[#0f1712]">
            <nav className="flex flex-col gap-4">
              {isLoggedIn && (
                <div className="flex items-center gap-3 rounded-xl bg-[#edf3ec] p-3 text-[#244b38] dark:bg-[#1a2d21] dark:text-[#34d399]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#244b38] font-bold text-white dark:bg-[#34d399] dark:text-[#0c120e] overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={displayName} className="h-full w-full object-cover" />
                    ) : (
                      userInitial
                    )}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{displayName}</p>
                    <p className="text-xs text-[#5f7566] dark:text-[#a0aca3]">{user?.email}</p>
                  </div>
                </div>
              )}

              <NavLink to="/" end onClick={closeMenu} className={navClass}>Home</NavLink>
              <NavLink to="/search" onClick={closeMenu} className={navClass}>Explore Stays</NavLink>
              <NavLink to="/availability" onClick={closeMenu} className={navClass}>Availability Calendar</NavLink>
              <NavLink to="/owner/dashboard" onClick={closeMenu} className={navClass}>Owner Portal</NavLink>
              <NavLink to="/admin" onClick={closeMenu} className={navClass}>Admin Control</NavLink>
              <Link to="/#destinations" onClick={closeMenu} className="text-sm font-medium text-[#666b63] dark:text-[#a6b4aa]">Destinations</Link>
              <Link to="/#featured-stays" onClick={closeMenu} className="text-sm font-medium text-[#666b63] dark:text-[#a6b4aa]">Our Collection</Link>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => { closeMenu(); navigate("/profile"); }}
                  className="flex items-center gap-3 text-left text-sm font-medium text-[#244b38] dark:text-[#34d399]"
                >
                  <span>👤</span> My Profile & Bookings
                </button>
              )}

              {/* Wishlist Link Mobile */}
              <button
                type="button"
                onClick={() => { closeMenu(); setIsWishlistOpen(true); }}
                className="flex items-center justify-between text-left text-sm font-medium text-[#244b38] dark:text-[#34d399]"
              >
                <span className="flex items-center gap-2">
                  <span>❤️</span> Saved Stays
                </span>
                <span className="rounded-full bg-[#c53030] px-2 py-0.5 text-xs font-bold text-white">
                  {favoritesCount}
                </span>
              </button>

              {/* Theme Selector Trigger Mobile */}
              <button
                type="button"
                onClick={() => { closeMenu(); onOpenThemeModal(); }}
                className="flex items-center justify-between text-left text-sm font-medium text-[#244b38] dark:text-[#34d399]"
              >
                <span className="flex items-center gap-2">
                  <span>🎨</span> Theme: {currentTheme.name}
                </span>
                <span className="text-xs text-[#85877f]">Change →</span>
              </button>

              {/* Currency Selector Mobile */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm text-[#666b63] dark:text-[#a6b4aa]">Currency:</span>
                <div className="flex gap-1.5">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setCurrency(c.code)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        currency === c.code
                          ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                          : "border border-[#e5e2d9] text-[#244b38] dark:border-[#2a3c30] dark:text-[#a6b4aa]"
                      }`}
                    >
                      {c.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Auth Actions */}
              <div className="border-t border-[#e9e5dc] pt-4 dark:border-[#2a3c30]">
                {isLoggedIn ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full rounded-xl border border-[#c43c3c] py-2.5 text-center text-sm font-semibold text-[#c43c3c]"
                  >
                    Log out
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => { closeMenu(); navigate("/login"); }}
                      className="rounded-xl border border-[#244b38] px-4 py-2.5 text-sm font-semibold text-[#244b38] dark:border-[#34d399] dark:text-[#34d399]"
                    >
                      Log in
                    </button>
                    <button
                      type="button"
                      onClick={() => { closeMenu(); navigate("/signup"); }}
                      className="rounded-xl bg-[#244b38] px-4 py-2.5 text-sm font-semibold text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                    >
                      Sign up ↗
                    </button>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Floating Back Button */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go to previous page"
        className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2 rounded-full border border-[#e5e2d9] bg-[#fcfbf8] px-5 py-3 text-sm font-semibold text-[#244b38] shadow-lg transition hover:bg-[#244b38] hover:text-white dark:border-[#2a3c30] dark:bg-[#131b16] dark:text-[#34d399] dark:hover:bg-[#34d399] dark:hover:text-[#0c120e]"
      >
        <span aria-hidden="true" className="text-lg">←</span>
        Back
      </button>
    </>
  );
}
