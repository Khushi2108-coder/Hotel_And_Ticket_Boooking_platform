
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function BookingConfirmation() {
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    try {
      const savedBooking = localStorage.getItem("stayeaseLatestBooking");

      if (savedBooking) {
        setBooking(JSON.parse(savedBooking));
      }
    } catch {
      setBooking(null);
    }
  }, []);

  if (!booking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fcfbf8] px-5">
        <div className="max-w-md text-center">
          <h1 className="font-serif text-4xl text-[#26382d]">
            No booking found
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#777b70]">
            Please choose a hotel and room to start your demo booking.
          </p>
          <Link
            to="/search"
            className="mt-6 inline-block bg-[#294c3a] px-6 py-3 text-sm text-white"
          >
            Explore stays
          </Link>
        </div>
      </main>
    );
  }

  const formatDate = (date) =>
    date
      ? new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "Not selected";

  return (
    <main className="min-h-screen bg-[#fcfbf8] px-5 py-12 text-[#26382d] md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="border border-[#e9e6df] bg-white p-6 text-center sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf3ec] text-3xl text-[#294c3a]">
            ✓
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[2px] text-[#9a8767]">
            StayEase demo
          </p>

          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">
            Booking details saved!
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-[#777b70]">
            Your demo booking information has been saved in this browser. This
            is not a confirmed real-world hotel reservation.
          </p>

          <div className="mt-8 border-y border-[#e9e6df] py-5">
            <p className="text-xs text-[#777b70]">Demo reference number</p>
            <p className="mt-2 text-xl font-semibold tracking-wider">
              {booking.reference}
            </p>
          </div>

          <div className="mt-8 text-left">
            <h2 className="font-serif text-2xl">Your stay summary</h2>

            <div className="mt-5 space-y-4">
              <div className="flex justify-between gap-4 border-b border-[#eeece6] pb-4">
                <span className="text-sm text-[#777b70]">Hotel</span>
                <span className="text-right text-sm font-medium">
                  {booking.hotelName}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-[#eeece6] pb-4">
                <span className="text-sm text-[#777b70]">Room type</span>
                <span className="text-right text-sm font-medium">
                  {booking.roomName}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-[#eeece6] pb-4">
                <span className="text-sm text-[#777b70]">Check-in</span>
                <span className="text-right text-sm font-medium">
                  {formatDate(booking.checkIn)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-[#eeece6] pb-4">
                <span className="text-sm text-[#777b70]">Check-out</span>
                <span className="text-right text-sm font-medium">
                  {formatDate(booking.checkOut)}
                </span>
              </div>

              <div className="flex justify-between gap-4 border-b border-[#eeece6] pb-4">
                <span className="text-sm text-[#777b70]">Guests / rooms</span>
                <span className="text-right text-sm font-medium">
                  {booking.guests} guests · {booking.rooms} rooms
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 bg-[#f7f6f1] p-5 text-left">
            <h2 className="font-serif text-xl">Guest details</h2>
            <p className="mt-3 text-sm">{booking.guestName}</p>
            <p className="mt-1 text-sm text-[#777b70]">{booking.email}</p>
            <p className="mt-1 text-sm text-[#777b70]">{booking.phone}</p>
          </div>

          <div className="mt-8 border-t border-[#e9e6df] pt-6">
            <div className="flex justify-between gap-4 text-sm">
              <span className="text-[#777b70]">Room subtotal</span>
              <span>₹{Number(booking.subtotal).toLocaleString("en-IN")}</span>
            </div>

            <div className="mt-3 flex justify-between gap-4 text-sm">
              <span className="text-[#777b70]">Sample taxes</span>
              <span>₹{Number(booking.taxes).toLocaleString("en-IN")}</span>
            </div>

            <div className="mt-4 flex justify-between gap-4 border-t border-[#e9e6df] pt-5 text-lg font-semibold">
              <span>Estimated total</span>
              <span>₹{Number(booking.total).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to={`/hotels/${booking.hotelId}`}
              className="bg-[#294c3a] px-6 py-3 text-sm font-semibold text-white hover:bg-[#1e392b]"
            >
              Back to hotel
            </Link>

            <Link
              to="/search"
              className="border border-[#294c3a] px-6 py-3 text-sm font-semibold text-[#294c3a] hover:bg-[#f1f4ef]"
            >
              Explore more stays
            </Link>

            <button
              type="button"
              onClick={() => window.print()}
              className="border border-[#e9e6df] px-6 py-3 text-sm font-semibold hover:bg-[#f7f6f1]"
            >
              Print summary
            </button>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#85877f]">
          Portfolio demo only. No payment was processed and no live room
          availability or reservation was confirmed.
        </p>
      </div>
    </main>
  );
}
