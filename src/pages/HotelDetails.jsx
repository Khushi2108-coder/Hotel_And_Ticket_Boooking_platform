import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { hotels } from "../data/hotels";
import { getRoomsForHotel } from "../data/rooms";
import { useCurrency } from "../context/CurrencyContext";
import { useWishlist } from "../context/WishlistContext";

const galleryPhotos = [
  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
];

const facilities = [
  { icon: "📶", name: "High-Speed Wi-Fi", detail: "Complimentary across the retreat" },
  { icon: "❄️", name: "Climate Control", detail: "Individual temperature presets" },
  { icon: "🅿️", name: "Valet Parking", detail: "Secure on-site private parking" },
  { icon: "🍽️", name: "Gourmet Dining", detail: "Curated chef tasting menus" },
  { icon: "🛎️", name: "24/7 Concierge", detail: "Personalized stay assistance" },
  { icon: "🧖", name: "Luxury Spa", detail: "Holistic treatments & sauna" },
];

const demoReviews = [
  {
    name: "Aarav Sharma",
    rating: 5,
    text: "The room was extraordinarily comfortable and the scenic morning views made our vacation feel truly magical.",
    date: "Stayed 2 weeks ago",
  },
  {
    name: "Meera Kapoor",
    rating: 5,
    text: "Warm hospitality, impeccable cleanliness, and world-class culinary experiences. Will definitely visit again!",
    date: "Stayed last month",
  },
  {
    name: "Rohan Verma",
    rating: 4,
    text: "The suite options made comparing budgets effortless. Great infinity pool and tranquil atmosphere.",
    date: "Stayed recently",
  },
];

const ratingBreakdown = [
  { label: "Cleanliness", score: 4.9 },
  { label: "Location & View", score: 4.8 },
  { label: "Service & Staff", score: 4.9 },
  { label: "Comfort & Bed Quality", score: 4.7 },
  { label: "Value for Money", score: 4.6 },
];

const policies = [
  {
    title: "Check-in & Check-out",
    text: "Standard check-in starts at 2:00 PM. Express check-out is available up to 11:00 AM.",
  },
  {
    title: "Flexible Cancellation",
    text: "Free cancellation up to 48 hours before arrival on standard flexible rates.",
  },
  {
    title: "Identification",
    text: "Valid government-issued photo ID required at reception upon arrival.",
  },
  {
    title: "Children and Extra Beds",
    text: "Children of all ages are welcome. Cribs and extra rollaway beds available on request.",
  },
];

const faqs = [
  {
    question: "How do I secure this room?",
    answer: "Choose your preferred suite, dates, and number of guests, then proceed to the instant booking summary.",
  },
  {
    question: "Are taxes included in the room price?",
    answer: "Prices reflect the baseline room rates. Taxes (12% GST) are clearly itemized on the checkout confirmation.",
  },
  {
    question: "Can I request early check-in or late check-out?",
    answer: "Yes, early arrivals and late departures are accommodated subject to availability upon contacting the concierge.",
  },
];

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7859] dark:text-[#e6c587]">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-serif text-3xl font-medium text-[#26382d] sm:text-4xl dark:text-[#f0f4f0]">
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-2xl text-xs leading-6 text-[#777b70] sm:text-sm dark:text-[#9ea8a1]">
          {description}
        </p>
      )}
    </div>
  );
}

export default function HotelDetails({ onNotify }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useWishlist();

  const hotel = hotels.find((item) => String(item.id) === String(id));

  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("11:00");
  const [guests, setGuests] = useState("2");
  const [roomCount, setRoomCount] = useState("1");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [dateError, setDateError] = useState("");
  const [reviewsList, setReviewsList] = useState(demoReviews);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    rating: 5,
    text: "",
  });

  if (!hotel) {
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center bg-[#fcfbf8] px-5 text-center dark:bg-[#0c120e]">
        <h1 className="font-serif text-4xl text-[#26382d] dark:text-[#f0f4f0]">
          Property Not Found
        </h1>
        <p className="mt-3 text-sm text-[#777b70] dark:text-[#9ea8a1]">
          This retreat is not available in the current active collection.
        </p>
        <Link
          to="/search"
          className="mt-6 rounded-xl bg-[#244b38] px-6 py-3 text-sm font-semibold text-white dark:bg-[#34d399] dark:text-[#0c120e]"
        >
          Explore Available Stays
        </Link>
      </main>
    );
  }

  const rooms = getRoomsForHotel(hotel);
  const selectedRoom = rooms.find((room) => String(room.id) === String(selectedRoomId));

  const hotelName = hotel.name || "StayEase Luxury Stay";
  const hotelCity = hotel.city || "India";
  const hotelLocation = hotel.location || hotelCity;
  const hotelPrice = Number(hotel.price) || 2000;
  const hotelRating = Number(hotel.rating) || 4.5;

  const photos = [
    hotel.image || galleryPhotos[0],
    ...galleryPhotos.filter((photo) => photo !== hotel.image),
  ].slice(0, 5);

  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
  const description =
    hotel.description ||
    `Welcome to ${hotelName}, positioned gracefully in ${hotelLocation}. Featuring serene surroundings, signature architectural aesthetics, bespoke amenities, and personalized guest services crafted for memorable escapes.`;

  const today = new Date().toLocaleDateString("en-CA");
  const isFav = isFavorite(hotel.id);

  const bookingReady =
    Boolean(selectedRoom) &&
    Boolean(checkIn) &&
    Boolean(checkOut) &&
    Boolean(guests) &&
    Boolean(roomCount) &&
    checkIn >= today &&
    checkOut > checkIn;

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: hotelName,
        text: `Look at ${hotelName} in ${hotelLocation} on StayEase!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        if (onNotify) {
          onNotify({
            type: "info",
            title: "Link Copied! 📋",
            message: "Property link copied to clipboard. Share with your travel companions!",
          });
        }
      });
    }
  };

  function handleCheckInChange(value) {
    setCheckIn(value);
    setDateError("");
    if (checkOut && value && checkOut < value) {
      setCheckOut("");
    }
  }

  function handleBooking(event) {
    event.preventDefault();
    setDateError("");

    if (!selectedRoom) {
      setDateError("Please select a room type first.");
      scrollToRooms();
      return;
    }

    if (!checkIn || !checkOut || !guests || !roomCount) {
      setDateError("Please complete all reservation fields.");
      return;
    }

    if (checkIn < today) {
      setDateError("Check-in date cannot be in the past.");
      return;
    }

    if (checkOut < checkIn) {
      setDateError("Check-out date cannot be before check-in date.");
      return;
    }

    if (Number(guests) > Number(roomCount) * selectedRoom.capacity) {
      setDateError(
        `This room type accommodates up to ${
          Number(roomCount) * selectedRoom.capacity
        } guests for ${roomCount} room(s).`
      );
      return;
    }

    const params = new URLSearchParams({
      hotelId: String(hotel.id),
      roomId: String(selectedRoom.id),
      roomName: selectedRoom.name,
      roomPrice: String(selectedRoom.price),
      checkIn,
      checkOut,
      checkInTime,
      checkOutTime,
      guests,
      rooms: roomCount,
    });

    navigate(`/booking?${params.toString()}`);
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.text.trim()) return;

    const newRev = {
      name: reviewForm.name.trim(),
      rating: Number(reviewForm.rating),
      text: reviewForm.text.trim(),
      date: "Stayed recently",
    };

    setReviewsList((prev) => [newRev, ...prev]);
    setIsReviewModalOpen(false);
    setReviewForm({ name: "", rating: 5, text: "" });

    if (onNotify) {
      onNotify({
        type: "success",
        title: "Review Published! ⭐",
        message: `Thank you for sharing your experience at ${hotelName}.`,
      });
    }
  }

  function scrollToRooms() {
    document.getElementById("room-options")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <main className="min-h-screen bg-[#fcfbf8] pb-28 text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      {/* Breadcrumbs & Header Controls */}
      <div className="mx-auto max-w-7xl px-5 pt-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <nav className="flex flex-wrap items-center gap-2 text-xs text-[#85877f] dark:text-[#9ea8a1]">
            <Link to="/" className="hover:text-[#244b38] dark:hover:text-[#34d399]">Home</Link>
            <span>/</span>
            <Link to="/search" className="hover:text-[#244b38] dark:hover:text-[#34d399]">
              Explore Stays
            </Link>
            <span>/</span>
            <span className="max-w-52 truncate text-[#244b38] dark:text-[#34d399]">
              {hotelName}
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              title="Share property link"
              aria-label="Share property link"
              className="flex items-center gap-1.5 rounded-full border border-[#e5e2d9] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#244b38] shadow-2xs transition hover:bg-[#f0eee7] dark:border-[#2a3c30] dark:bg-[#152019] dark:text-[#34d399]"
            >
              <span>🔗</span> Share
            </button>

            <button
              type="button"
              onClick={(e) => toggleFavorite(hotel, e)}
              title={isFav ? "Remove from wishlist" : "Save to wishlist"}
              aria-label={isFav ? "Remove from wishlist" : "Save to wishlist"}
              className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition ${
                isFav
                  ? "border-[#c53030] bg-[#fff5f5] text-[#c53030] dark:bg-[#2b1515]"
                  : "border-[#e5e2d9] bg-white text-[#777b70] hover:bg-[#f0eee7] hover:text-[#c53030] dark:border-[#2a3c30] dark:bg-[#152019] dark:text-[#9ea8a1]"
              }`}
            >
              <span>{isFav ? "❤️" : "🤍"}</span>
              <span>{isFav ? "Saved" : "Save"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hotel Title Section */}
      <section className="mx-auto max-w-7xl px-5 pb-6 pt-6 sm:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#b18a57] dark:text-[#e6c587]">
              <span>Luxury Collection</span>
              <span>•</span>
              <span>{hotelCity}</span>
            </div>
            <h1 className="mt-2 font-serif text-3xl font-medium leading-tight sm:text-5xl dark:text-[#f0f4f0]">
              {hotelName}
            </h1>
            <p className="mt-2 text-xs text-[#777b70] sm:text-sm dark:text-[#9ea8a1]">
              📍 {hotelLocation}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="inline-flex items-center gap-1 rounded-lg bg-[#edf3ec] px-3 py-1 text-sm font-bold text-[#244b38] dark:bg-[#1f3025] dark:text-[#34d399]">
                ★ {hotelRating.toFixed(1)} / 5.0
              </span>
              <p className="mt-1 text-[11px] text-[#85877f] dark:text-[#9ea8a1]">
                300+ Verified Guest Ratings
              </p>
            </div>
            <button
              type="button"
              onClick={scrollToRooms}
              className="rounded-xl bg-[#244b38] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
            >
              Choose Room ↓
            </button>
          </div>
        </div>
      </section>

      {/* Gallery Showcase */}
      <section className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-2.5 sm:grid-cols-4 sm:grid-rows-2">
          {/* Main Large Photo */}
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative min-h-64 overflow-hidden rounded-2xl bg-[#eeece6] sm:col-span-2 sm:row-span-2 sm:min-h-[440px] dark:bg-[#1c2a22]"
          >
            <img
              src={photos[activePhoto]}
              alt={`${hotelName} photo`}
              className="h-full min-h-64 w-full object-cover transition duration-700 ease-out group-hover:scale-105 sm:min-h-[440px]"
            />
            <span className="absolute bottom-4 left-4 flex items-center gap-2 rounded-xl bg-white/95 px-4 py-2 text-xs font-semibold text-[#244b38] shadow-md backdrop-blur-md dark:bg-[#131b16]/95 dark:text-[#34d399]">
              <span>🔍</span> View Lightbox ({photos.length} photos)
            </span>
          </button>

          {/* Thumbnail tiles */}
          {photos.slice(1, 5).map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => {
                setActivePhoto(index + 1);
                setLightboxOpen(true);
              }}
              className="group hidden min-h-40 overflow-hidden rounded-2xl bg-[#eeece6] sm:block dark:bg-[#1c2a22]"
            >
              <img
                src={photo}
                alt={`Gallery photo ${index + 2}`}
                className="h-full min-h-40 w-full object-cover transition duration-700 ease-out group-hover:scale-108"
              />
            </button>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-[#85877f] dark:text-[#9ea8a1]">
            Tap any photo to view full-screen high-resolution gallery
          </p>
          <div className="flex gap-1.5">
            {photos.map((photo, index) => (
              <button
                key={photo}
                type="button"
                onClick={() => setActivePhoto(index)}
                className={`h-2.5 rounded-full transition-all ${
                  activePhoto === index
                    ? "w-8 bg-[#244b38] dark:bg-[#34d399]"
                    : "w-2.5 bg-[#d7d4ca] dark:bg-[#2a3c30]"
                }`}
                aria-label={`View photo ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Main Two-Column Content: Left Information, Right Booking Card */}
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-12 sm:px-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          {/* Overview */}
          <section id="overview" className="scroll-mt-24">
            <SectionHeading
              eyebrow="The Property"
              title="About this stay"
              description="Discover unique ambiance, private architecture, and thoughtful hospitality."
            />
            <p className="max-w-3xl text-sm leading-7 text-[#5e665d] dark:text-[#b4beb7]">
              {description}
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: "📍", label: "Location", value: hotelCity },
                { icon: "★", label: "Guest Score", value: `${hotelRating}/5 (Exceptional)` },
                {
                  icon: "💳",
                  label: "Starting Rate",
                  value: `${formatPrice(hotelPrice)} / night`,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-[#e9e6df] bg-white p-4.5 shadow-2xs dark:border-[#2a3c30] dark:bg-[#152019]"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[1px] text-[#85877f] dark:text-[#9ea8a1]">
                    {item.label}
                  </p>
                  <p className="mt-1 font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="my-12 border-t border-[#e9e6df] dark:border-[#2a3c30]" />

          {/* Facilities */}
          <section id="facilities" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Comfort and convenience"
              title="Facilities & amenities"
              description="Tailored luxury inclusions designed for effortless relaxation."
            />
            <div className="grid gap-3.5 sm:grid-cols-2">
              {facilities.map((facility) => (
                <div
                  key={facility.name}
                  className="flex items-start gap-4 rounded-2xl border border-[#e9e6df] bg-white p-4 shadow-2xs dark:border-[#2a3c30] dark:bg-[#152019]"
                >
                  <span className="text-2xl">{facility.icon}</span>
                  <div>
                    <h3 className="text-sm font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                      {facility.name}
                    </h3>
                    <p className="mt-0.5 text-xs text-[#85877f] dark:text-[#9ea8a1]">
                      {facility.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {amenities.length > 0 && (
              <div className="mt-6">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                  Signature Inclusions
                </h4>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span
                      key={amenity}
                      className="rounded-xl border border-[#e9e6df] bg-white px-3.5 py-2 text-xs font-medium text-[#244b38] dark:border-[#2a3c30] dark:bg-[#152019] dark:text-[#34d399]"
                    >
                      ✓ {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="my-12 border-t border-[#e9e6df] dark:border-[#2a3c30]" />

          {/* Room options */}
          <section id="room-options" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Find your ideal space"
              title="Choose your suite"
              description="Select one room type to proceed. Rates automatically convert to your selected currency."
            />

            <div className="space-y-5">
              {rooms.map((room) => {
                const isSelected = String(selectedRoomId) === String(room.id);

                return (
                  <article
                    key={room.id}
                    className={`overflow-hidden rounded-2xl border bg-white transition-all duration-200 shadow-sm dark:bg-[#152019] ${
                      isSelected
                        ? "border-[#244b38] ring-2 ring-[#244b38]/30 dark:border-[#34d399] dark:ring-[#34d399]/30"
                        : "border-[#e9e6df] hover:border-[#b18a57] dark:border-[#2a3c30]"
                    }`}
                  >
                    <div className="grid sm:grid-cols-[230px_1fr]">
                      <img
                        src={room.image}
                        alt={room.name}
                        loading="lazy"
                        className="h-56 w-full object-cover sm:h-full sm:min-h-[280px]"
                      />

                      <div className="flex flex-col p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h3 className="font-serif text-2xl font-medium text-[#24402f] dark:text-[#f0f4f0]">
                              {room.name}
                            </h3>
                            <p className="mt-1 text-xs leading-5 text-[#777b70] dark:text-[#9ea8a1]">
                              {room.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif text-2xl font-bold text-[#244b38] dark:text-[#34d399]">
                              {formatPrice(room.price)}
                            </p>
                            <p className="text-[10px] text-[#85877f] dark:text-[#9ea8a1]">
                              per room / night
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#62685f] dark:text-[#a6b4aa]">
                          <span>🛏 {room.beds}</span>
                          <span>👤 Up to {room.capacity} guests</span>
                          <span>📐 {room.size}</span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {room.amenities?.map((amenity) => (
                            <span
                              key={amenity}
                              className="rounded-lg bg-[#f5f3ed] px-2.5 py-1 text-[11px] text-[#62685f] dark:bg-[#1c2a22] dark:text-[#c4d0c8]"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>

                        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#eeece6] pt-5 dark:border-[#2a3c30]">
                          <span className="text-xs font-semibold text-[#244b38] dark:text-[#34d399]">
                            ⚡ Instant Confirmation
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRoomId(String(room.id));
                              setDateError("");
                            }}
                            className={`rounded-xl px-5 py-2.5 text-xs font-semibold uppercase tracking-wider transition ${
                              isSelected
                                ? "bg-[#edf3ec] text-[#244b38] dark:bg-[#1f3025] dark:text-[#34d399]"
                                : "bg-[#244b38] text-white hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
                            }`}
                          >
                            {isSelected ? "✓ Selected Room" : "Select Suite"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="my-12 border-t border-[#e9e6df] dark:border-[#2a3c30]" />

          {/* Reviews & Breakdown */}
          <section id="reviews" className="scroll-mt-24">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <SectionHeading
                eyebrow="Guest Sentiment"
                title="Reviews & Ratings"
                description="Verified experiences from guests who stayed at this property."
              />
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="mb-4 inline-flex items-center gap-2 rounded-xl bg-[#244b38] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#183728] sm:mb-0 dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#28b881]"
              >
                <span>✎</span> Write a Review
              </button>
            </div>

            {/* Overall & Category breakdown */}
            <div className="mb-6 rounded-2xl border border-[#e9e6df] bg-white p-6 shadow-sm dark:border-[#2a3c30] dark:bg-[#152019]">
              <div className="flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4 border-b border-[#eeece6] pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-8 dark:border-[#2a3c30]">
                  <p className="font-serif text-5xl font-bold text-[#244b38] dark:text-[#34d399]">
                    {hotelRating.toFixed(1)}
                  </p>
                  <div>
                    <p className="font-serif text-base font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                      Exceptional Experience
                    </p>
                    <p className="text-xs text-[#85877f] dark:text-[#9ea8a1]">
                      Based on {reviewsList.length + 317} verified guest impressions
                    </p>
                  </div>
                </div>

                <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {ratingBreakdown.map((item) => (
                    <div key={item.label} className="text-xs">
                      <div className="flex justify-between font-medium text-[#555a52] dark:text-[#b4beb7]">
                        <span>{item.label}</span>
                        <span>{item.score}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[#eeece6] dark:bg-[#23352a]">
                        <div
                          className="h-full rounded-full bg-[#244b38] dark:bg-[#34d399]"
                          style={{ width: `${(item.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Individual review cards */}
            <div className="space-y-4">
              {reviewsList.map((review, idx) => (
                <article
                  key={`${review.name}-${idx}`}
                  className="rounded-2xl border border-[#e9e6df] bg-white p-5 shadow-2xs dark:border-[#2a3c30] dark:bg-[#152019]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#244b38] font-bold text-white text-xs dark:bg-[#34d399] dark:text-[#0c120e]">
                        {review.name ? review.name[0] : "G"}
                      </span>
                      <div>
                        <h4 className="text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                          {review.name}
                        </h4>
                        <p className="text-[10px] text-[#85877f] dark:text-[#9ea8a1]">
                          {review.date}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-[#b18a57] dark:text-[#e6c587]">
                      {"★".repeat(review.rating)}
                    </span>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#555a52] dark:text-[#b4beb7]">
                    "{review.text}"
                  </p>
                </article>
              ))}
            </div>
          </section>

          <div className="my-12 border-t border-[#e9e6df] dark:border-[#2a3c30]" />

          {/* Policies */}
          <section id="policies" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Stay Guidelines"
              title="Hotel Policies & Terms"
            />
            <div className="divide-y divide-[#e9e6df] rounded-2xl border border-[#e9e6df] bg-white px-6 dark:divide-[#2a3c30] dark:border-[#2a3c30] dark:bg-[#152019]">
              {policies.map((policy) => (
                <div key={policy.title} className="py-5">
                  <h4 className="text-sm font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                    {policy.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-6 text-[#777b70] dark:text-[#9ea8a1]">
                    {policy.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="my-12 border-t border-[#e9e6df] dark:border-[#2a3c30]" />

          {/* FAQ Accordion */}
          <section id="faq" className="scroll-mt-24">
            <SectionHeading
              eyebrow="Clear answers"
              title="Frequently Asked Questions"
            />
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-2xl border border-[#e9e6df] bg-white p-5 shadow-2xs dark:border-[#2a3c30] dark:bg-[#152019]"
                >
                  <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                    {faq.question}
                    <span className="float-right text-[#b18a57] group-open:rotate-45 dark:text-[#e6c587]">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-xs leading-6 text-[#777b70] dark:text-[#9ea8a1]">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>

        {/* Right Sticky Booking Sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <form
            id="booking-form"
            onSubmit={handleBooking}
            className="rounded-3xl border border-[#e5e1d7] bg-white p-6 shadow-xl dark:border-[#2a3c30] dark:bg-[#152019]"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7859] dark:text-[#e6c587]">
              Reserve Your Escape
            </p>
            <h3 className="mt-1 font-serif text-3xl font-medium dark:text-[#f0f4f0]">
              Plan your dates
            </h3>

            <div className="mt-4 border-b border-[#eeece6] pb-4 dark:border-[#2a3c30]">
              <p className="text-[11px] text-[#85877f] dark:text-[#9ea8a1]">Starting from</p>
              <p className="mt-0.5 font-serif text-3xl font-bold text-[#244b38] dark:text-[#34d399]">
                {formatPrice(hotelPrice)}
                <span className="ml-1 text-xs font-normal text-[#85877f] dark:text-[#9ea8a1]">
                  / night
                </span>
              </p>
            </div>

            <label className="mt-4 block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
              Check-in
              <input
                type="date"
                value={checkIn}
                min={today}
                onChange={(e) => handleCheckInChange(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                required
              />
            </label>

            <label className="mt-3 block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
              Check-out
              <input
                type="date"
                value={checkOut}
                min={checkIn || today}
                onChange={(e) => {
                  setCheckOut(e.target.value);
                  setDateError("");
                }}
                className="mt-1.5 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                required
              />
            </label>

            {/* Same Day / 1-Day Stay Indicator */}
            {checkIn && checkOut && checkIn === checkOut && (
              <div className="mt-2.5 rounded-xl border border-[#34d399]/40 bg-[#edf3ec] p-2.5 text-xs text-[#244b38] dark:bg-[#152a1d] dark:text-[#34d399]">
                <div className="flex items-center gap-1.5 font-semibold">
                  <span>⚡</span>
                  <span>1-Day Stay / Day-Use Active</span>
                </div>
                <p className="mt-0.5 text-[11px] text-[#556b5a] dark:text-[#a0c2ab]">
                  Full access to suite & resort amenities for single-day relaxation.
                </p>
              </div>
            )}

            {/* Check-in & Check-out Time Slot Pickers */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                Arrival Time
                <select
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-2 py-2 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                >
                  <option value="14:00">02:00 PM (Standard)</option>
                  <option value="10:00">10:00 AM (Day-Use)</option>
                  <option value="12:00">12:00 PM (Early)</option>
                  <option value="16:00">04:00 PM (Afternoon)</option>
                  <option value="18:00">06:00 PM (Evening)</option>
                </select>
              </label>

              <label className="text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                Departure Time
                <select
                  value={checkOutTime}
                  onChange={(e) => setCheckOutTime(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-2 py-2 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                >
                  <option value="11:00">11:00 AM (Standard)</option>
                  <option value="14:00">02:00 PM (Late checkout)</option>
                  <option value="18:00">06:00 PM (Day-Use departure)</option>
                  <option value="20:00">08:00 PM (Evening)</option>
                </select>
              </label>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                Guests
                <select
                  value={guests}
                  onChange={(e) => {
                    setGuests(e.target.value);
                    setDateError("");
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-2 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Guest" : "Guests"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                Rooms
                <select
                  value={roomCount}
                  onChange={(e) => {
                    setRoomCount(e.target.value);
                    setDateError("");
                  }}
                  className="mt-1.5 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-2 py-2.5 text-sm outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-[#f0f4f0]"
                  required
                >
                  {[1, 2, 3, 4].map((n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "Room" : "Rooms"}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* Selected Room indicator */}
            <div className="mt-5 rounded-2xl border border-[#e9e6df] bg-[#fcfbf8] p-4 dark:border-[#2a3c30] dark:bg-[#111914]">
              <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#85877f] dark:text-[#9ea8a1]">
                Selected Suite
              </p>
              <p className="mt-1 text-sm font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                {selectedRoom ? selectedRoom.name : "No suite chosen yet"}
              </p>
              {selectedRoom ? (
                <p className="mt-1 text-sm font-bold text-[#244b38] dark:text-[#34d399]">
                  {formatPrice(selectedRoom.price)} / night
                </p>
              ) : (
                <button
                  type="button"
                  onClick={scrollToRooms}
                  className="mt-1.5 text-xs font-semibold text-[#244b38] hover:underline dark:text-[#34d399]"
                >
                  Browse available suites ↓
                </button>
              )}
            </div>

            {dateError && (
              <p role="alert" className="mt-3 text-xs leading-5 text-red-600 dark:text-red-400">
                {dateError}
              </p>
            )}

            {bookingReady ? (
              <button
                type="submit"
                className="mt-5 w-full rounded-xl bg-[#244b38] py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
              >
                Proceed to Checkout →
              </button>
            ) : (
              <button
                type="submit"
                className="mt-5 w-full rounded-xl bg-[#244b38]/60 py-3.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#244b38] dark:bg-[#34d399]/60 dark:text-[#0c120e] dark:hover:bg-[#34d399]"
              >
                {selectedRoom ? "Select Valid Dates" : "Choose Suite to Book"}
              </button>
            )}

            <p className="mt-3 text-center text-[10px] text-[#85877f] dark:text-[#9ea8a1]">
              Instant booking · Free cancellation terms apply
            </p>
          </form>
        </aside>
      </div>

      {/* Floating Lightbox Viewer */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close Lightbox"
            className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white text-lg transition hover:bg-white/20"
          >
            ✕
          </button>

          <div className="relative max-h-[85vh] max-w-5xl overflow-hidden rounded-2xl">
            <img
              src={photos[activePhoto]}
              alt={`Full view ${activePhoto + 1}`}
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-3 flex items-center justify-between text-white/80 text-xs">
              <span>{hotelName} — Photo {activePhoto + 1} of {photos.length}</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActivePhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1))}
                  className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
                >
                  ← Prev
                </button>
                <button
                  type="button"
                  onClick={() => setActivePhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0))}
                  className="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Review Submission Modal */}
      {isReviewModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsReviewModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[#e5e1d7] bg-white p-6 shadow-2xl transition sm:p-8 dark:border-[#2a3c30] dark:bg-[#152019]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7859] dark:text-[#e6c587]">
                  Verified Review
                </p>
                <h3 className="mt-1 font-serif text-2xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  Review {hotelName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#777b70] hover:bg-[#eeece6] dark:hover:bg-[#2a3c30] dark:text-[#a0aca3]"
                aria-label="Close review modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleReviewSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={reviewForm.name}
                  onChange={(e) =>
                    setReviewForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Radhika Sharma"
                  className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3.5 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  Overall Rating *
                </label>
                <select
                  value={reviewForm.rating}
                  onChange={(e) =>
                    setReviewForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                  }
                  className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                >
                  <option value={5}>★★★★★ (5.0 - Exceptional Luxury)</option>
                  <option value={4}>★★★★☆ (4.0 - Wonderful Stay)</option>
                  <option value={3}>★★★☆☆ (3.0 - Satisfactory)</option>
                  <option value={2}>★★☆☆☆ (2.0 - Needs Improvement)</option>
                  <option value={1}>★☆☆☆☆ (1.0 - Poor Experience)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  Your Experience Details *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewForm.text}
                  onChange={(e) =>
                    setReviewForm((prev) => ({ ...prev, text: e.target.value }))
                  }
                  placeholder="Share details about check-in timing, room comfort, hospitality, dining, and scenic views..."
                  className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3.5 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="rounded-xl border border-[#e5e1d7] px-4 py-2.5 text-xs font-medium text-[#686f66] hover:bg-[#f6f4ee] dark:border-[#2a3c30] dark:text-[#a0aca3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#244b38] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
                >
                  Publish Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
