import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Auth.css";

/**
 * StayEase — Reset Password Page
 */
export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const passwordStrength = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Password reset token is missing from the link URL.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authAPI.resetPassword(token, { password, confirmPassword });
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/login", { state: { resetComplete: true } });
      }, 2500);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
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

          <h1>Create new password</h1>

          {isSuccess ? (
            <div className="text-center py-4 space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf3ec] text-2xl text-[#244b38]">
                ✓
              </div>
              <h2 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Password updated!
              </h2>
              <p className="text-xs leading-5 text-[#6d7468] dark:text-[#9ea8a1]">
                Your password has been successfully reset. Redirecting you to login...
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-center text-[#6d7468] mb-6 dark:text-[#9ea8a1]">
                Please enter a secure new password of at least 8 characters.
              </p>

              <form onSubmit={handleSubmit} noValidate>
                <div className="auth__field">
                  <label htmlFor="password">New password</label>
                  <div className="auth__password">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {password && (
                  <div className="mb-4">
                    <div className="flex gap-1 h-1.5 w-full bg-[#eeece6] rounded-full overflow-hidden">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`flex-1 transition-all ${
                            step <= passwordStrength
                              ? passwordStrength <= 2
                                ? "bg-[#e53e3e]"
                                : passwordStrength === 3
                                ? "bg-[#d69e2e]"
                                : "bg-[#38a169]"
                              : "bg-transparent"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#757b72] mt-1 block">
                      Strength: {passwordStrength <= 1 ? "Weak" : passwordStrength === 2 ? "Fair" : passwordStrength === 3 ? "Good" : "Strong"}
                    </span>
                  </div>
                )}

                <div className="auth__field">
                  <label htmlFor="confirmPassword">Confirm new password</label>
                  <div className="auth__password">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((s) => !s)}
                      aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                    >
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {error && <p className="auth__server-error" role="alert">{error}</p>}

                <button type="submit" className="auth__submit" disabled={loading}>
                  {loading ? "Updating password…" : "Reset Password"}
                </button>

                <p className="auth__switch">
                  Back to <Link to="/login">Log in</Link>
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
