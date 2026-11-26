import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleAccountModal from "../components/GoogleAccountModal";
import "./Auth.css";

const API_URL = "http://localhost:5001/api/auth";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values, isRegister) {
  const errors = {};
  if (!values.username.trim()) errors.username = "Enter a username.";
  else if (values.username.trim().length < 3) errors.username = "Username must be at least 3 characters.";

  if (isRegister) {
    if (!values.email.trim()) errors.email = "Enter your email address.";
    else if (!EMAIL_RE.test(values.email)) errors.email = "Enter a valid email address.";
  }

  if (!values.password) errors.password = "Enter a password.";
  else if (isRegister && values.password.length < 8) errors.password = "Password must be at least 8 characters.";

  if (isRegister && values.confirm !== values.password) errors.confirm = "Passwords do not match.";
  return errors;
}

export default function Auth() {
  const { pathname, state } = useLocation();
  const navigate = useNavigate();
  const { user, login } = useAuth();
  const isRegister = pathname === "/register";

  const [values, setValues] = useState({ username: "", email: "", password: "", confirm: "", remember: true });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const found = validate(values, isRegister);
    setErrors(found);
    if (Object.keys(found).length) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${isRegister ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: values.username.trim(),
          email: values.email.trim(),
          password: values.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Something went wrong.");

      if (isRegister) {
        navigate("/login", { state: { registered: true } });
      } else {
        login(data.token, data.user, values.remember);
        navigate(state?.from || "/", { replace: true });
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setServerError("");
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
              await handleGoogleLoginSuccess(userInfo);
            } catch (err) {
              setServerError(err.message || "Failed to log in with Google.");
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

  const handleGoogleLoginSuccess = async (userInfo) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userInfo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Google sign-in failed.");

      login(data.token, data.user, values.remember);
      setGoogleModalOpen(false);
      navigate(state?.from || "/", { replace: true });
    } catch (err) {
      setServerError(err.message || "Failed to log in with Google.");
    } finally {
      setLoading(false);
    }
  };

  const justRegistered = state?.registered;

  // Already signed in: skip the form
  if (user) return <Navigate to={state?.from || "/"} replace />;

  return (
    <div className="auth">
      <section className="auth__panel">
        <div className="auth__form-wrap">
          <Link to="/" className="auth__brand">Stay Ease</Link>
          <h1>{isRegister ? "Create your account" : "Log in to Stay Ease"}</h1>
          {justRegistered && !isRegister && (
            <p className="auth__notice" role="status">Account created. Log in to continue.</p>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="auth__field">
              <label htmlFor="username">User name</label>
              <input
                id="username" name="username" type="text" autoComplete="username"
                placeholder="Enter a user name" value={values.username} onChange={handleChange}
                aria-invalid={!!errors.username}
              />
              {errors.username && <small className="auth__error">{errors.username}</small>}
            </div>

            {isRegister && (
              <div className="auth__field">
                <label htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  placeholder="Enter your email" value={values.email} onChange={handleChange}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <small className="auth__error">{errors.email}</small>}
              </div>
            )}

            <div className="auth__field">
              <label htmlFor="password">Password</label>
              <div className="auth__password">
                <input
                  id="password" name="password" type={showPassword ? "text" : "password"}
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  placeholder="Enter a password" value={values.password} onChange={handleChange}
                  aria-invalid={!!errors.password}
                />
                <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <small className="auth__error">{errors.password}</small>}
            </div>

            {isRegister && (
              <div className="auth__field">
                <label htmlFor="confirm">Confirm password</label>
                <input
                  id="confirm" name="confirm" type={showPassword ? "text" : "password"}
                  autoComplete="new-password" placeholder="Re-enter your password"
                  value={values.confirm} onChange={handleChange} aria-invalid={!!errors.confirm}
                />
                {errors.confirm && <small className="auth__error">{errors.confirm}</small>}
              </div>
            )}

            {!isRegister && (
              <div className="auth__row">
                <label className="auth__check">
                  <input type="checkbox" name="remember" checked={values.remember} onChange={handleChange} />
                  Remember me
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}

            {serverError && <p className="auth__server-error" role="alert">{serverError}</p>}

            <button type="submit" className="auth__submit" disabled={loading}>
              {loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}
            </button>

            <div className="auth__divider"><span>or</span></div>

            <button type="button" className="auth__google" onClick={handleGoogleAuth} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.7c4.3-4 6.9-9.9 6.9-17.1z" />
                <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.2.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.9-6.1z" />
                <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.300 0-11.600-4.100-13.500-9.800l-7.900 6.100C6.5 42.6 14.600 48 24 48z" />
              </svg>
              Continue with Google
            </button>

            <p className="auth__switch">
              {isRegister ? (
                <>Already have an account? <Link to="/login">Log in</Link></>
              ) : (
                <>Don't have an account? <Link to="/signup">Sign up</Link></>
              )}
            </p>
          </form>
        </div>
      </section>

      <aside className="auth__image" aria-hidden="true" />

      <GoogleAccountModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSelectAccount={handleGoogleLoginSuccess}
      />
    </div>
  );
}
