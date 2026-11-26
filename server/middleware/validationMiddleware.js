const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-() ]{7,20}$/;

/**
 * Validation Middleware for User Registration
 */
export function validateRegister(req, res, next) {
  const { username, name, email, password, confirmPassword } = req.body;
  const errors = [];

  const displayName = (name || username || "").trim();
  if (!displayName || displayName.length < 2) {
    errors.push("Full name or username must be at least 2 characters.");
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid email address is required.");
  }

  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long.");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

/**
 * Validation Middleware for User Login
 */
export function validateLogin(req, res, next) {
  const { username, email, password } = req.body;
  const identifier = (email || username || "").trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: "Please enter your email or username.",
    });
  }

  if (!password) {
    return res.status(400).json({
      success: false,
      message: "Please enter your password.",
    });
  }

  next();
}

/**
 * Validation Middleware for Password Reset Request
 */
export function validateForgotPassword(req, res, next) {
  const { email } = req.body;
  if (!email || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "A valid email address is required.",
    });
  }
  next();
}

/**
 * Validation Middleware for Password Reset Completion
 */
export function validateResetPassword(req, res, next) {
  const { password, confirmPassword } = req.body;
  const errors = [];

  if (!password || password.length < 8) {
    errors.push("New password must be at least 8 characters long.");
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.push("Passwords do not match.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

/**
 * Validation Middleware for Booking Creation
 */
export function validateBooking(req, res, next) {
  const { hotelId, checkIn, checkOut, guestName, email, phone } = req.body;
  const errors = [];

  if (!hotelId) errors.push("Hotel selection is required.");
  if (!checkIn) errors.push("Check-in date is required.");
  if (!checkOut) errors.push("Check-out date is required.");

  if (checkIn && checkOut) {
    const inDate = new Date(`${checkIn}T00:00:00`);
    const outDate = new Date(`${checkOut}T00:00:00`);
    if (outDate <= inDate) {
      errors.push("Check-out date must be after check-in date.");
    }
  }

  if (!guestName || !guestName.trim()) {
    errors.push("Guest name is required.");
  }

  if (!email || !EMAIL_REGEX.test(email.trim())) {
    errors.push("A valid contact email is required.");
  }

  if (!phone || !PHONE_REGEX.test(phone.trim())) {
    errors.push("A valid contact phone number is required.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
}

/**
 * Validation Middleware for User Profile Updates
 */
export function validateProfileUpdate(req, res, next) {
  const { name, email, phone } = req.body;

  if (name !== undefined && name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Name must be at least 2 characters.",
    });
  }

  if (email !== undefined && !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address.",
    });
  }

  next();
}
