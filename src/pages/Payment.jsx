import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";

/**
 * StayEase — Payment Gateway Presentation Page
 *
 * NOTE (Phase 1 Frontend Requirement):
 * Razorpay is clearly presented as a placeholder pending backend integration (Phase 2).
 * This component strictly DOES NOT simulate a successful payment or confirmed booking.
 */
export default function Payment({ onNotify }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();

  const [selectedMethod, setSelectedMethod] = useState("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);

  // Extract booking details passed from Booking.jsx or use fallback demo state
  const bookingData = useMemo(() => {
    if (state?.booking) return state.booking;

    try {
      const saved = localStorage.getItem("stayeasePendingBooking");
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }

    // Default prototype state if accessed directly
    return {
      hotelName: "Coastal Palm Retreat",
      hotelCity: "Goa",
      hotelImage:
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=900&q=80",
      roomName: "Standard Double Room",
      roomPrice: 4500,
      checkIn: "2026-12-20",
      checkOut: "2026-12-24",
      nights: 4,
      guests: 2,
      rooms: 1,
      guestName: "Aarav Sharma",
      email: "aarav@stayease.com",
      phone: "+91 98765 43210",
      subtotal: 18000,
      taxes: 2160,
      total: 20160,
    };
  }, [state]);

  const handleAttemptPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (onNotify) {
        onNotify({
          type: "warning",
          title: "Payment Gateway Offline",
          message:
            "Razorpay API integration is pending Phase 2 backend setup. No transaction was processed and no booking was confirmed.",
        });
      }
    }, 800);
  };

  return (
    <main className="min-h-screen bg-[#fcfbf8] pb-24 text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <div className="mx-auto max-w-[1100px] px-5 pt-8 sm:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-[#85877f] dark:text-[#9ea8a1]">
          <Link to="/" className="hover:text-[#244b38] dark:hover:text-[#34d399]">
            Home
          </Link>
          <span>/</span>
          <Link to="/booking" className="hover:text-[#244b38] dark:hover:text-[#34d399]">
            Booking
          </Link>
          <span>/</span>
          <span className="text-[#244b38] dark:text-[#34d399]">Payment</span>
        </nav>

        {/* Phase 1 Integration Banner */}
        <div className="mt-6 rounded-2xl border border-[#fbbf24] bg-[#fef9ee] p-4 text-xs text-[#92400e] dark:border-[#78350f] dark:bg-[#231707] dark:text-[#fde68a]">
          <div className="flex items-start gap-2.5">
            <span className="text-base">⚠️</span>
            <div>
              <strong className="font-semibold block text-sm">
                Frontend Preview Mode — Payment Gateway Not Yet Connected
              </strong>
              <p className="mt-1 leading-5">
                The Razorpay server-side order creation, HMAC signature verification, and atomic inventory hold engine are scheduled for <strong>Phase 2 (Backend & Payments)</strong>. Clicking the payment action below will not charge your card or create a real confirmed booking.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_390px]">
          {/* Left Column: Payment Methods Presentation */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-[#e9e6df] bg-white p-6 shadow-xs sm:p-8 dark:border-[#2a3c30] dark:bg-[#152019]">
              <h2 className="font-serif text-2xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Select Payment Method
              </h2>
              <p className="mt-1 text-xs text-[#757b72] dark:text-[#9aa59d]">
                Supported transaction gateways for domestic and international reservations.
              </p>

              {/* Payment Methods Options */}
              <div className="mt-6 space-y-3">
                {/* Razorpay Option */}
                <label
                  onClick={() => setSelectedMethod("razorpay")}
                  className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4.5 transition-all ${
                    selectedMethod === "razorpay"
                      ? "border-[#244b38] bg-[#f8faf8] shadow-xs dark:border-[#34d399] dark:bg-[#1b2b21]"
                      : "border-[#e5e1d8] hover:bg-[#faf9f5] dark:border-[#2a3c30] dark:hover:bg-[#19241d]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedMethod === "razorpay"}
                      onChange={() => setSelectedMethod("razorpay")}
                      className="mt-1 accent-[#244b38] dark:accent-[#34d399]"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-semibold">
                          Razorpay Secure Checkout
                        </strong>
                        <span className="rounded-full bg-[#edf3ec] px-2 py-0.5 text-[10px] font-bold text-[#244b38] dark:bg-[#1e3426] dark:text-[#34d399]">
                          Recommended
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#757b72] dark:text-[#9aa59d]">
                        UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, NetBanking, and Wallets.
                      </p>
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] text-[#858f87]">
                        <span>🔒 256-Bit SSL Encrypted</span>
                        <span>•</span>
                        <span>Status: Configured for Phase 2</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg">💳</span>
                </label>

                {/* NetBanking / Direct Bank Option */}
                <label
                  onClick={() => setSelectedMethod("netbanking")}
                  className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4.5 transition-all ${
                    selectedMethod === "netbanking"
                      ? "border-[#244b38] bg-[#f8faf8] shadow-xs dark:border-[#34d399] dark:bg-[#1b2b21]"
                      : "border-[#e5e1d8] hover:bg-[#faf9f5] dark:border-[#2a3c30] dark:hover:bg-[#19241d]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedMethod === "netbanking"}
                      onChange={() => setSelectedMethod("netbanking")}
                      className="mt-1 accent-[#244b38] dark:accent-[#34d399]"
                    />
                    <div>
                      <strong className="text-sm font-semibold">
                        Direct Corporate Bank Transfer / NEFT
                      </strong>
                      <p className="mt-1 text-xs text-[#757b72] dark:text-[#9aa59d]">
                        Available for long-stay bookings, event retreats, and corporate invoices.
                      </p>
                    </div>
                  </div>
                  <span className="text-lg">🏛️</span>
                </label>

                {/* Pay at Hotel Option */}
                <label
                  onClick={() => setSelectedMethod("payathotel")}
                  className={`flex cursor-pointer items-start justify-between rounded-2xl border p-4.5 transition-all ${
                    selectedMethod === "payathotel"
                      ? "border-[#244b38] bg-[#f8faf8] shadow-xs dark:border-[#34d399] dark:bg-[#1b2b21]"
                      : "border-[#e5e1d8] hover:bg-[#faf9f5] dark:border-[#2a3c30] dark:hover:bg-[#19241d]"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <input
                      type="radio"
                      name="payment-method"
                      checked={selectedMethod === "payathotel"}
                      onChange={() => setSelectedMethod("payathotel")}
                      className="mt-1 accent-[#244b38] dark:accent-[#34d399]"
                    />
                    <div>
                      <strong className="text-sm font-semibold">
                        Pay upon Check-in
                      </strong>
                      <p className="mt-1 text-xs text-[#757b72] dark:text-[#9aa59d]">
                        Guarantee with credit card; pay at the property front desk.
                      </p>
                    </div>
                  </div>
                  <span className="text-lg">🏨</span>
                </label>
              </div>

              {/* Pay Action Button */}
              <div className="mt-8 border-t border-[#eeece6] pt-6 dark:border-[#2a3c30]">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleAttemptPayment}
                  className="w-full rounded-2xl bg-[#244b38] py-4 text-sm font-semibold text-white shadow-md transition hover:bg-[#183728] active:scale-99 dark:bg-[#34d399] dark:text-[#0b120e] dark:hover:bg-[#28b881]"
                >
                  {isProcessing
                    ? "Connecting to gateway…"
                    : `Pay ${formatPrice(bookingData.total)} via Razorpay (Phase 2 Preview)`}
                </button>

                <p className="mt-3 text-center text-[11px] text-[#757b72] dark:text-[#88998d]">
                  By initiating this test transaction, you acknowledge this is a preview interface.
                </p>
              </div>
            </div>

            {/* Guest Summary Card */}
            <div className="rounded-3xl border border-[#e9e6df] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
              <h3 className="font-serif text-lg font-medium text-[#244b38] dark:text-[#f0f4f0]">
                Primary Guest Information
              </h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-3 text-xs">
                <div>
                  <span className="text-[#858f87] block">Guest Name</span>
                  <strong className="mt-0.5 block">{bookingData.guestName}</strong>
                </div>
                <div>
                  <span className="text-[#858f87] block">Email</span>
                  <strong className="mt-0.5 block">{bookingData.email}</strong>
                </div>
                <div>
                  <span className="text-[#858f87] block">Phone Number</span>
                  <strong className="mt-0.5 block">{bookingData.phone}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reservation & Price Breakdown */}
          <aside className="h-fit rounded-3xl border border-[#e9e6df] bg-white p-6 shadow-xs dark:border-[#2a3c30] dark:bg-[#152019]">
            <h3 className="font-serif text-xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
              Stay Summary
            </h3>

            {/* Hotel Thumbnail & Name */}
            <div className="mt-4 flex gap-3.5 border-b border-[#eeece6] pb-4 dark:border-[#2a3c30]">
              {bookingData.hotelImage && (
                <img
                  src={bookingData.hotelImage}
                  alt={bookingData.hotelName}
                  className="h-18 w-20 rounded-xl object-cover"
                />
              )}
              <div>
                <h4 className="font-serif text-sm font-semibold text-[#244b38] dark:text-[#f0f4f0]">
                  {bookingData.hotelName}
                </h4>
                <p className="text-[11px] text-[#757b72] dark:text-[#9aa59d]">
                  📍 {bookingData.hotelCity}
                </p>
                <p className="mt-1 text-[11px] font-medium text-[#b18a57] dark:text-[#fbbf24]">
                  {bookingData.roomName}
                </p>
              </div>
            </div>

            {/* Schedule Details */}
            <div className="mt-4 space-y-2.5 text-xs border-b border-[#eeece6] pb-4 dark:border-[#2a3c30]">
              <div className="flex justify-between">
                <span className="text-[#757b72] dark:text-[#9aa59d]">Check-in</span>
                <strong>{bookingData.checkIn} {bookingData.checkInTime ? `(${bookingData.checkInTime})` : ""}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757b72] dark:text-[#9aa59d]">Check-out</span>
                <strong>{bookingData.checkOut} {bookingData.checkOutTime ? `(${bookingData.checkOutTime})` : ""}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757b72] dark:text-[#9aa59d]">Duration</span>
                <strong>
                  {bookingData.isSameDay
                    ? "1 Day (Day-Use Stay)"
                    : `${bookingData.nights} Nights`}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#757b72] dark:text-[#9aa59d]">Guests & Rooms</span>
                <strong>
                  {bookingData.guests} Guests · {bookingData.rooms} Room
                </strong>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between text-[#757b72] dark:text-[#9aa59d]">
                <span>
                  Room Rate ({bookingData.nights} {bookingData.isSameDay ? "day" : "nights"})
                </span>
                <span>{formatPrice(bookingData.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[#757b72] dark:text-[#9aa59d]">
                <span>Taxes & GST (12%)</span>
                <span>{formatPrice(bookingData.taxes)}</span>
              </div>
              {bookingData.pointsDiscount > 0 && (
                <div className="flex justify-between font-semibold text-[#16a34a] dark:text-[#34d399]">
                  <span>✦ StayEase Points Website Discount</span>
                  <span>- {formatPrice(bookingData.pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#eeece6] pt-3 text-base font-bold text-[#244b38] dark:border-[#2a3c30] dark:text-[#34d399]">
                <span>Total Due</span>
                <span>{formatPrice(bookingData.total)}</span>
              </div>
            </div>

            {/* Back action */}
            <div className="mt-6 border-t border-[#eeece6] pt-4 dark:border-[#2a3c30]">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full text-center text-xs font-semibold text-[#244b38] hover:underline dark:text-[#34d399]"
              >
                ← Modify Reservation Details
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
