import { useState } from "react";
import { Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Auth.css";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * StayEase — Forgot Password Page
 */
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devResetUrl, setDevResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!EMAIL_RE.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword({ email: email.trim() });
      if (res.devResetUrl) {
        setDevResetUrl(res.devResetUrl);
      }
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to process password reset. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <section className="auth__panel">
        <div className="auth__form-wrap">
          <Link to="/" className="auth__brand">
            StayEase.
          </Link>

          <h1>Reset your password</h1>

          {isSubmitted ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf3ec] text-2xl text-[#244b38]">
                ✉
              </div>
              <h2 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Check your inbox
              </h2>
              <p className="text-xs leading-5 text-[#6d7468] dark:text-[#9ea8a1]">
                If an account exists for <strong>{email}</strong>, you will receive an email with instructions to securely reset your password.
              </p>

              {devResetUrl && (
                <div className="p-3 my-2 text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg text-xs">
                  <span className="font-semibold text-amber-800 dark:text-amber-300">Development preview link:</span>
                  <a
                    href={devResetUrl}
                    className="block text-blue-600 dark:text-blue-400 underline break-all mt-1"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}

              <div className="pt-4 border-t border-[#d6dbd2] dark:border-[#2a3c30]">
                <Link
                  to="/login"
                  className="inline-block rounded-xl bg-[#244b38] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#183728]"
                >
                  Return to log in
                </Link>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-center text-[#6d7468] mb-6 dark:text-[#9ea8a1]">
                Enter the email address associated with your StayEase account, and we will send you a password reset link.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="auth__field">
                  <label htmlFor="email">Email address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    aria-invalid={!!error}
                  />
                  {error && <small className="auth__error">{error}</small>}
                </div>

                <button type="submit" className="auth__submit" disabled={loading}>
                  {loading ? "Sending instructions…" : "Send Reset Link"}
                </button>

                <p className="auth__switch">
                  Remember your password? <Link to="/login">Log in</Link>
                </p>
              </form>
            </>
          )}
        </div>
      </section>

      <aside className="auth__image" aria-hidden="true" />
    </div>
  );
}
