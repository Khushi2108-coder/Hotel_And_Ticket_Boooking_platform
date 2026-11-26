import { useState } from "react";
import "./GoogleAccountModal.css";

const DEFAULT_ACCOUNTS = [
  {
    name: "Khushi",
    email: "khushi@gmail.com",
    avatarBg: "#1a73e8",
    initial: "K",
  },
  {
    name: "Khushi Attri",
    email: "khushiattri@gmail.com",
    avatarBg: "#0f9d58",
    initial: "K",
  },
];

export default function GoogleAccountModal({ isOpen, onClose, onSelectAccount }) {
  const [customEmail, setCustomEmail] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSelect = (account) => {
    onSelectAccount({
      email: account.email,
      name: account.name,
      picture: "",
      sub: `google_${account.email.replace(/[^a-zA-Z0-9]/g, "_")}`,
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    const clean = customEmail.trim().toLowerCase();
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setError("Please enter a valid Google email address.");
      return;
    }
    const name = clean.split("@")[0].replace(/[._-]/g, " ");
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    onSelectAccount({
      email: clean,
      name: capitalizedName,
      picture: "",
      sub: `google_${Date.now()}`,
    });
  };

  return (
    <div className="google-modal-backdrop" onClick={onClose}>
      <div className="google-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="google-modal-close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        {/* Google G Logo */}
        <div className="google-logo-wrap">
          <svg width="32" height="32" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
            <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.1z" />
            <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.5 42.6 14.600 48 24 48z" />
          </svg>
        </div>

        <h2 className="google-modal-title">Choose an account</h2>
        <p className="google-modal-subtitle">to continue to <strong>StayEase</strong></p>

        {error && <div className="google-modal-error">{error}</div>}

        {/* Account List */}
        <div className="google-account-list">
          {DEFAULT_ACCOUNTS.map((acc) => (
            <button
              key={acc.email}
              className="google-account-item"
              onClick={() => handleSelect(acc)}
            >
              <div
                className="google-account-avatar"
                style={{ backgroundColor: acc.avatarBg }}
              >
                {acc.initial}
              </div>
              <div className="google-account-info">
                <span className="google-account-name">{acc.name}</span>
                <span className="google-account-email">{acc.email}</span>
              </div>
            </button>
          ))}

          {/* Use another account option */}
          {!showCustomInput ? (
            <button
              className="google-account-item google-use-another"
              onClick={() => setShowCustomInput(true)}
            >
              <div className="google-account-avatar google-another-avatar">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div className="google-account-info">
                <span className="google-account-name">Use another account</span>
              </div>
            </button>
          ) : (
            <form className="google-custom-form" onSubmit={handleCustomSubmit}>
              <input
                type="email"
                placeholder="Enter your Gmail address"
                value={customEmail}
                onChange={(e) => {
                  setCustomEmail(e.target.value);
                  setError("");
                }}
                autoFocus
                className="google-custom-input"
              />
              <div className="google-custom-actions">
                <button
                  type="button"
                  className="google-custom-cancel"
                  onClick={() => setShowCustomInput(false)}
                >
                  Back
                </button>
                <button type="submit" className="google-custom-submit">
                  Continue
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="google-modal-footer">
          To continue, Google will share your name, email address, and profile picture with StayEase.
        </div>
      </div>
    </div>
  );
}
