import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCurrency } from "../context/CurrencyContext";
import { hotels } from "../data/hotels";
import { getRoomsForHotel } from "../data/rooms";

export default function Booking({ onNotify }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();

  const hotelId = searchParams.get("hotelId");
  const hotel = hotels.find((item) => String(item.id) === String(hotelId));

  const roomsForHotel = hotel ? getRoomsForHotel(hotel) : [];
  const roomId = searchParams.get("roomId");
  const selectedRoom = roomsForHotel.find((room) => room.id === roomId);

  const roomName = selectedRoom?.name || searchParams.get("roomName") || "Standard Double Suite";
  const roomPrice = selectedRoom?.price
    ?? (Number(searchParams.get("roomPrice")) || Number(hotel?.price) || 2000);

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [checkInTime, setCheckInTime] = useState(searchParams.get("checkInTime") || "14:00");
  const [checkOutTime, setCheckOutTime] = useState(searchParams.get("checkOutTime") || "11:00");
  const [guests, setGuests] = useState(searchParams.get("guests") || "2");
  const [rooms, setRooms] = useState(searchParams.get("rooms") || "1");
  const [guestName, setGuestName] = useState(() => user?.name || user?.username || "");
  const [email, setEmail] = useState(() => user?.email || "");
  const [phone, setPhone] = useState(() => user?.phone || "");
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setGuestName((prev) => prev || user.name || user.username || "");
      setEmail((prev) => prev || user.email || "");
      setPhone((prev) => prev || user.phone || "");
    }
  }, [user]);

  const isSameDay = Boolean(checkIn && checkOut && checkIn === checkOut);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;

    const start = new Date(`${checkIn}T00:00:00`);
    const end = new Date(`${checkOut}T00:00:00`);

    const diffDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (diffDays === 0) return 1; // Single-day / Day-Use stay
    return Math.max(0, diffDays);
  }, [checkIn, checkOut]);

  const userPoints = user?.loyaltyPoints ?? 1250;
  const subtotal = roomPrice * nights * Number(rooms);
  const taxes = Math.round(subtotal * 0.12);

  // 1 Point = 1 INR website discount (max up to 500 points or 50% of subtotal)
  const maxRedeemablePoints = Math.min(userPoints, 500, Math.floor(subtotal * 0.5));
  const pointsDiscount = redeemPoints ? maxRedeemablePoints : 0;
  const total = Math.max(0, subtotal + taxes - pointsDiscount);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!hotel) {
      setError("Hotel details could not be found. Please select a property again.");
      return;
    }

    if (!checkIn || !checkOut || checkOut < checkIn) {
      setError("Please select valid check-in and check-out dates.");
      return;
    }

    if (new Date(`${checkIn}T00:00:00`) < new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00`)) {
      setError("Check-in date cannot be in the past.");
      return;
    }

    if (!guestName.trim() || !email.trim() || !phone.trim()) {
      setError("Please fill in your name, email and phone number.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9+\-() ]{7,20}$/.test(phone.trim())) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (selectedRoom && Number(guests) > selectedRoom.capacity * Number(rooms)) {
      setError(
        `Your selected room accommodates up to ${selectedRoom.capacity} guests per room. Please select more rooms or another room type.`
      );
      return;
    }

    const bookingPayload = {
      reference: `ST-${Date.now().toString().slice(-8)}`,
      hotelId: hotel.id,
      hotelName: hotel.name,
      hotelCity: hotel.city || "",
      hotelImage: hotel.image || "",
      roomId: selectedRoom?.id || roomId || "",
      roomName,
      roomPrice,
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
      isSameDay,
      guests: Number(guests),
      rooms: Number(rooms),
      nights,
      guestName: guestName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      subtotal,
      taxes,
      pointsRedeemed: redeemPoints ? maxRedeemablePoints : 0,
      pointsDiscount,
      total,
      createdAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    localStorage.setItem("stayeasePendingBooking", JSON.stringify(bookingPayload));
    if (onNotify) {
      onNotify({
        type: "info",
        title: "Reservation Details Saved",
        message: `Proceeding to payment preview for ${hotel.name}.`,
      });
    }
    navigate("/payment", { state: { booking: bookingPayload } });
    setIsSubmitting(false);
  }

  if (!hotel) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-[#fcfbf8] px-5 text-center dark:bg-[#0c120e]">
        <h1 className="font-serif text-3xl font-medium dark:text-[#f0f4f0]">
          No Hotel Selected
        </h1>
        <p className="mt-2 text-xs text-[#777b70] dark:text-[#9ea8a1]">
          Please browse our collection and select a property to continue booking.
        </p>
        <Link
          to="/search"
          className="mt-5 rounded-xl bg-[#244b38] px-5 py-2.5 text-xs font-semibold text-white dark:bg-[#34d399] dark:text-[#0c120e]"
        >
          Explore Stays
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fcfbf8] pb-24 text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      <div className="mx-auto max-w-[1200px] px-5 pt-8 sm:px-8">
        <nav className="flex items-center gap-2 text-xs text-[#85877f] dark:text-[#9ea8a1]">
          <Link to="/" className="hover:text-[#244b38] dark:hover:text-[#34d399]">Home</Link>
          <span>/</span>
          <Link to={`/hotels/${hotel.id}`} className="hover:text-[#244b38] dark:hover:text-[#34d399]">
            {hotel.name}
          </Link>
          <span>/</span>
          <span className="text-[#244b38] dark:text-[#34d399]">Checkout</span>
        </nav>

        <h1 className="mt-4 font-serif text-3xl font-medium sm:text-4xl dark:text-[#f0f4f0]">
          Complete Your Reservation
        </h1>
        <p className="mt-1 text-xs text-[#777b70] dark:text-[#9ea8a1]">
          Review your stay details, guest information, and rate breakdown.
        </p>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Left Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-8 rounded-3xl border border-[#e9e6df] bg-white p-6 shadow-sm sm:p-8 dark:border-[#2a3c30] dark:bg-[#152019]"
          >
            {/* Guest info */}
            <div>
              <h2 className="font-serif text-xl font-medium dark:text-[#f0f4f0]">
                1. Guest Information
              </h2>
              <p className="mt-1 text-xs text-[#777b70] dark:text-[#9ea8a1]">
                Booking confirmation and key details will be dispatched here.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="guest-name" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Full Name *
                  </label>
                  <input
                    id="guest-name"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    placeholder="e.g. John Doe"
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  />
                </div>

                <div>
                  <label htmlFor="guest-email" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Email Address *
                  </label>
                  <input
                    id="guest-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="john@example.com"
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  />
                </div>

                <div>
                  <label htmlFor="guest-phone" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Phone Number *
                  </label>
                  <input
                    id="guest-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  />
                </div>
              </div>
            </div>

            {/* Stay details */}
            <div className="border-t border-[#e9e6df] pt-6 dark:border-[#2a3c30]">
              <h2 className="font-serif text-xl font-medium dark:text-[#f0f4f0]">
                2. Stay Schedule & Timing
              </h2>

              {isSameDay && (
                <div className="mt-3 rounded-2xl border border-[#34d399]/40 bg-[#edf3ec] p-3.5 text-xs text-[#244b38] dark:bg-[#152a1d] dark:text-[#34d399]">
                  <div className="flex items-center gap-2 font-semibold">
                    <span>⚡</span>
                    <span>Single-Day Stay / Day-Use Active</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#556b5a] dark:text-[#a0c2ab]">
                    Same-day stay selected. Enjoy exclusive suite relaxation, pool & property amenities with customized timing.
                  </p>
                </div>
              )}

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="booking-checkin" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Check-in Date *
                  </label>
                  <input
                    id="booking-checkin"
                    type="date"
                    min={new Date().toISOString().slice(0, 10)}
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (checkOut && e.target.value > checkOut) {
                        setCheckOut(e.target.value);
                      }
                    }}
                    required
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  />
                </div>

                <div>
                  <label htmlFor="booking-checkout" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Check-out Date *
                  </label>
                  <input
                    id="booking-checkout"
                    type="date"
                    min={checkIn || new Date().toISOString().slice(0, 10)}
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  />
                </div>

                <div>
                  <label htmlFor="booking-checkin-time" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Check-in Arrival Time
                  </label>
                  <select
                    id="booking-checkin-time"
                    value={checkInTime}
                    onChange={(e) => setCheckInTime(e.target.value)}
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  >
                    <option value="14:00">02:00 PM (Standard Check-in)</option>
                    <option value="10:00">10:00 AM (Day-Use / Early)</option>
                    <option value="12:00">12:00 PM (Mid-day)</option>
                    <option value="16:00">04:00 PM (Afternoon)</option>
                    <option value="18:00">06:00 PM (Evening)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="booking-checkout-time" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Check-out Departure Time
                  </label>
                  <select
                    id="booking-checkout-time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  >
                    <option value="11:00">11:00 AM (Standard Check-out)</option>
                    <option value="14:00">02:00 PM (Late Departure)</option>
                    <option value="18:00">06:00 PM (Day-Use Departure)</option>
                    <option value="20:00">08:00 PM (Late Evening)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="booking-guests" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Total Guests
                  </label>
                  <select
                    id="booking-guests"
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Guest" : "Guests"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="booking-rooms" className="mb-1 block text-xs font-medium dark:text-[#f0f4f0]">
                    Number of Rooms
                  </label>
                  <select
                    id="booking-rooms"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="w-full rounded-xl border border-[#deded5] bg-[#fcfbf8] px-3.5 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  >
                    {[1, 2, 3, 4].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "Room" : "Rooms"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. StayEase Website Points & Discount */}
            <div className="border-t border-[#e9e6df] pt-6 dark:border-[#2a3c30]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-serif text-xl font-medium dark:text-[#f0f4f0]">
                  3. StayEase Points & Website Discount
                </h2>
                <span className="rounded-full bg-[#f4ece1] px-3 py-1 text-xs font-bold text-[#8c6b38] dark:bg-[#2c2317] dark:text-[#e4be78]">
                  ✦ {userPoints} Points in Your Balance
                </span>
              </div>

              <div className="mt-4 rounded-2xl border border-[#d9ceb9] bg-[#fdfbf7] p-4.5 dark:border-[#384a3c] dark:bg-[#121c16]">
                <div className="flex items-start gap-3">
                  <input
                    id="redeem-points-toggle"
                    type="checkbox"
                    checked={redeemPoints}
                    onChange={(e) => setRedeemPoints(e.target.checked)}
                    className="mt-1 h-4 w-4 cursor-pointer rounded accent-[#244b38]"
                  />
                  <label htmlFor="redeem-points-toggle" className="cursor-pointer text-xs">
                    <strong className="block text-sm font-semibold text-[#244b38] dark:text-[#34d399]">
                      Redeem {maxRedeemablePoints} Points for instant {formatPrice(maxRedeemablePoints)} website discount
                    </strong>
                    <span className="mt-1 block text-[#6a7266] dark:text-[#9ea8a1]">
                      Direct cash deduction applied to your stay total. StayEase points convert at 100 points = ₹100 direct cash discount.
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-[#e8d8c9] bg-[#fbf4ec] p-3 text-xs leading-5 text-[#85553b] dark:bg-[#2b1919] dark:text-[#ff9999] dark:border-[#522]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#244b38] py-4 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#183728] disabled:opacity-75 dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Securing Your Stay...
                </>
              ) : (
                "Proceed to Payment & Review →"
              )}
            </button>
          </form>

          {/* Right Summary Sidebar */}
          <aside className="h-fit rounded-3xl border border-[#e9e6df] bg-white p-6 shadow-sm dark:border-[#2a3c30] dark:bg-[#152019] lg:sticky lg:top-24">
            <img
              src={selectedRoom?.image || hotel.image}
              alt={roomName}
              className="h-44 w-full rounded-2xl object-cover shadow-2xs"
            />

            <div className="mt-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#b18a57] dark:text-[#e6c587]">
                Selected Retreat
              </span>
              <h3 className="mt-1 font-serif text-2xl font-medium dark:text-[#f0f4f0]">
                {hotel.name}
              </h3>
              <p className="text-xs text-[#777b70] dark:text-[#9ea8a1]">
                📍 {hotel.city || hotel.location}
              </p>
            </div>

            <div className="mt-4 border-t border-[#e9e6df] pt-4 dark:border-[#2a3c30]">
              <p className="text-sm font-semibold text-[#244b38] dark:text-[#34d399]">
                {roomName}
              </p>
              {selectedRoom && (
                <p className="mt-0.5 text-xs text-[#777b70] dark:text-[#9ea8a1]">
                  {selectedRoom.beds} · Up to {selectedRoom.capacity} guests
                </p>
              )}
            </div>

            <div className="mt-4 space-y-2.5 border-t border-[#e9e6df] pt-4 text-xs dark:border-[#2a3c30]">
              {isSameDay && (
                <div className="flex justify-between font-medium text-[#244b38] dark:text-[#34d399]">
                  <span>Stay Format</span>
                  <span>⚡ 1-Day / Day-Use Stay</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">Arrival & Departure</span>
                <span className="font-medium">{checkInTime} – {checkOutTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">Rate / Room</span>
                <span className="font-medium">{formatPrice(roomPrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">Duration</span>
                <span className="font-medium">{isSameDay ? "1 Day (Day-Use)" : `${nights} Nights`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">Rooms</span>
                <span className="font-medium">{rooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">Subtotal</span>
                <span className="font-medium">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">Taxes & Fees (12%)</span>
                <span className="font-medium">{formatPrice(taxes)}</span>
              </div>
              {pointsDiscount > 0 && (
                <div className="flex justify-between font-semibold text-[#16a34a] dark:text-[#34d399]">
                  <span>✦ StayEase Points Discount</span>
                  <span>- {formatPrice(pointsDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#e9e6df] pt-3 text-sm font-bold text-[#244b38] dark:border-[#2a3c30] dark:text-[#34d399]">
                <span>Estimated Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
