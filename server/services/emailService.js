import { config } from "../config/config.js";

let transporter = null;
let nodemailerLoaded = false;

async function getTransporter() {
  if (!transporter) {
    try {
      const { default: nodemailer } = await import("nodemailer");
      nodemailerLoaded = true;
      transporter = nodemailer.createTransport({
        host: config.EMAIL_HOST,
        port: config.EMAIL_PORT,
        secure: config.EMAIL_PORT === 465,
        auth: {
          user: config.EMAIL_USER,
          pass: config.EMAIL_PASS,
        },
      });
    } catch {
      // Nodemailer not installed or SMTP not reachable
      return null;
    }
  }
  return transporter;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(toEmail, resetUrl, userName) {
  const trans = await getTransporter();

  // If email transporter or credentials are not configured, log notice gracefully
  if (!trans || !config.EMAIL_USER || !config.EMAIL_PASS) {
    console.log(`ℹ️  [EmailService] Password reset token for ${toEmail}: ${resetUrl}`);
    return;
  }

  try {
    await trans.sendMail({
      from: config.EMAIL_FROM,
      to: toEmail,
      subject: "StayEase – Reset Your Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🏨 StayEase</h1>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Hello ${userName || "there"},</h2>
            <p>You requested to reset your password. Click the button below to set a new password.</p>
            <p>This link expires in <strong>1 hour</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #888; font-size: 13px;">If you didn't request this, ignore this email – your password won't change.</p>
            <p style="color: #888; font-size: 13px;">Link: ${resetUrl}</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn("⚠️  [EmailService] Failed to send password reset email:", err.message);
  }
}

/**
 * Send booking confirmation email
 */
export async function sendBookingConfirmationEmail(toEmail, booking, hotel, room) {
  const trans = await getTransporter();
  if (!trans || !config.EMAIL_USER || !config.EMAIL_PASS) return;

  try {
    const checkIn = new Date(booking.checkIn).toLocaleDateString("en-IN", { dateStyle: "long" });
    const checkOut = new Date(booking.checkOut).toLocaleDateString("en-IN", { dateStyle: "long" });

    await trans.sendMail({
      from: config.EMAIL_FROM,
      to: toEmail,
      subject: `StayEase – Booking Confirmed! ${booking.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">🏨 StayEase</h1>
            <p style="color: #e0d7ff; margin: 10px 0 0;">Booking Confirmed</p>
          </div>
          <div style="padding: 30px; background: #f9f9f9;">
            <h2>Your booking is confirmed! ✅</h2>
            <p><strong>Reference:</strong> ${booking.reference}</p>
            <hr/>
            <p><strong>Hotel:</strong> ${hotel?.name || "StayEase Hotel"}</p>
            <p><strong>Room:</strong> ${room?.name || "Standard Room"}</p>
            <p><strong>Check-in:</strong> ${checkIn} at ${booking.checkInTime || "14:00"}</p>
            <p><strong>Check-out:</strong> ${checkOut} at ${booking.checkOutTime || "11:00"}</p>
            <p><strong>Guests:</strong> ${booking.guests}</p>
            <p><strong>Rooms:</strong> ${booking.rooms}</p>
            <hr/>
            <p><strong>Total Paid:</strong> ₹${(booking.pricing?.totalAmount / 100).toLocaleString("en-IN")}</p>
            <p style="color: #888; font-size: 13px;">Points earned: ${booking.pointsEarned} 🌟</p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.warn("⚠️  [EmailService] Failed to send booking confirmation email:", err.message);
  }
}

/**
 * Send booking cancellation email
 */
export async function sendCancellationEmail(toEmail, booking, refundAmount) {
  const trans = await getTransporter();
  if (!trans || !config.EMAIL_USER || !config.EMAIL_PASS) return;

  try {
    await trans.sendMail({
      from: config.EMAIL_FROM,
      to: toEmail,
      subject: `StayEase – Booking Cancelled: ${booking.reference}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px;">
          <h2>Booking Cancelled</h2>
          <p>Your booking <strong>${booking.reference}</strong> has been cancelled.</p>
          ${refundAmount > 0
            ? `<p>A refund of <strong>₹${(refundAmount / 100).toLocaleString("en-IN")}</strong> will be processed within 5-7 business days.</p>`
            : `<p>No refund is applicable based on the cancellation policy.</p>`
          }
        </div>
      `,
    });
  } catch (err) {
    console.warn("⚠️  [EmailService] Failed to send cancellation email:", err.message);
  }
}
