
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleAccountModal from "../components/GoogleAccountModal";
import "./Signup.css";

const API_URL = "http://localhost:5001/api/auth";

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const passwordStrength = [
    form.password.length >= 8,
    /[A-Z]/.test(form.password),
    /[0-9]/.test(form.password),
    /[^A-Za-z0-9]/.test(form.password),
  ].filter(Boolean).length;

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (form.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Your passwords don't match. Please check again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            "We couldn't create your account. Please try again."
        );
      }

      navigate("/login", {
        replace: true,
        state: { registered: true },
      });
    } catch (err) {
      setError(
        err.message || "Unable to connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const handleGoogleSignup = () => {
    setError("");
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    // If client ID is present, try live Google popup
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse) => {
            if (tokenResponse.error) return;
            setLoading(true);
            try {
              const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const userInfo = await infoRes.json();
              await handleGoogleSignupSuccess(userInfo);
            } catch (err) {
              setError(err.message || "Failed to sign up with Google.");
            } finally {
              setLoading(false);
            }
          },
        });
        client.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err) {
        console.error("Live Google OAuth error:", err);
      }
    }

    // Opens the Google Account Picker modal directly
    setGoogleModalOpen(true);
  };

  const handleGoogleSignupSuccess = async (userInfo) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userInfo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google sign-up failed.");

      login(data.token, data.user, true);
      setGoogleModalOpen(false);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to sign up with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="se-signup">
      <section className="se-signup-left">
        <div className="se-form-area">
          <div className="se-overline">
            <span />
            JOIN STAYEASE
          </div>

          <h1>
            Create your account
            <br />
            <em>and start exploring.</em>
          </h1>

          <p className="se-intro">
            Discover beautiful stays, exclusive deals and unforgettable
            experiences — all in one place.
          </p>

          <div className="se-member-note">
            Already a member?
            <Link to="/login">Log in ↗</Link>
          </div>

          {error && (
            <div className="se-error" role="alert">
              <span>!</span>
              {error}
            </div>
          )}

          <form className="se-form-card" onSubmit={handleSubmit}>
            <div className="se-field">
              <label htmlFor="se-name">
                <span className="se-field-icon">♙</span>
                Full Name
              </label>

              <input
                id="se-name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                autoComplete="name"
                value={form.name}
                onChange={handleChange}
                minLength={2}
                required
              />
            </div>

            <div className="se-field">
              <label htmlFor="se-email">
                <span className="se-field-icon">✉</span>
                Email Address
              </label>

              <input
                id="se-email"
                name="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="se-field">
              <label htmlFor="se-password">
                <span className="se-field-icon">♙</span>
                Password
              </label>

              <div className="se-input-action">
                <input
                  id="se-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleChange}
                  minLength={8}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {form.password && (
                <div className="se-strength">
                  <div className="se-strength-bars">
                    {[1, 2, 3, 4].map((number) => (
                      <span
                        key={number}
                        className={number <= passwordStrength ? "filled" : ""}
                      />
                    ))}
                  </div>

                  <small>
                    Strength:{" "}
                    <strong>
                      {passwordStrength <= 1
                        ? "Weak"
                        : passwordStrength === 2
                          ? "Fair"
                          : passwordStrength === 3
                            ? "Good"
                            : "Strong"}
                    </strong>
                  </small>
                </div>
              )}
            </div>

            <div className="se-field">
              <label htmlFor="se-confirm">
                <span className="se-field-icon">✓</span>
                Confirm Password
              </label>

              <div className="se-input-action">
                <input
                  id="se-confirm"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowConfirm((value) => !value)}
                  aria-label={
                    showConfirm ? "Hide confirmation" : "Show confirmation"
                  }
                >
                  {showConfirm ? "Hide" : "Show"}
                </button>
              </div>

              {form.confirmPassword && (
                <small
                  className={
                    form.password === form.confirmPassword
                      ? "se-match"
                      : "se-no-match"
                  }
                >
                  {form.password === form.confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords don't match yet"}
                </small>
              )}
            </div>

            <label className="se-consent">
              <input type="checkbox" required />

              <span>
                I agree to the <Link to="/">Terms of Service</Link> and{" "}
                <Link to="/">Privacy Policy</Link>.
              </span>
            </label>

            <button
              className="se-submit"
              type="submit"
              disabled={loading}
            >
              <span>
                {loading ? "Creating your account..." : "Create Account"}
              </span>
              {!loading && <span className="se-submit-arrow">↗</span>}
            </button>

            <div className="se-divider">
              <span>OR SIGN UP WITH</span>
            </div>

            <button
              className="se-google"
              type="button"
              onClick={handleGoogleSignup}
            >
              <span className="se-google-g">G</span>
              Continue with Google
            </button>
          </form>

          <p className="se-bottom-note">
            <span>✦</span>
            Thoughtfully chosen stays. Unforgettable memories.
          </p>
        </div>
      </section>

      <aside className="se-signup-visual">
        <div className="se-visual-overlay" />

        <div className="se-visual-top">
          <span>LUXURY STAYS</span>
          <i />
          <span>UNIQUE EXPERIENCES</span>
          <i />
          <span>WORLDWIDE</span>
        </div>

        <div className="se-visual-quote">
          <div className="se-quote-line" />
          <span className="se-quote-label">YOUR NEXT CHAPTER BEGINS HERE</span>

          <h2>
            More than just
            <br />
            a place to stay.
            <br />
            <em>A feeling.</em>
          </h2>

          <p>
            Find the places that make you pause,
            <br />
            unwind, and create stories worth telling.
          </p>
        </div>

        <div className="se-visual-bottom">
          <div className="se-benefit">
            <span className="se-benefit-icon">⌂</span>
            <div>
              <strong>Handpicked stays</strong>
              <p>Places with a little more character.</p>
            </div>
          </div>

          <div className="se-benefit">
            <span className="se-benefit-icon">◇</span>
            <div>
              <strong>Made for you</strong>
              <p>Discover stays for every occasion.</p>
            </div>
          </div>

          <div className="se-visual-signature">
            Your journey, beautifully yours.
          </div>
        </div>
      </aside>

      <GoogleAccountModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSelectAccount={handleGoogleSignupSuccess}
      />
    </main>
  );
}
