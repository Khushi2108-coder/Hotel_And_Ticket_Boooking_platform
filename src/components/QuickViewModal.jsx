import { useState } from "react";
import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { useWishlist } from "../context/WishlistContext";

export default function QuickViewModal({ hotel, isOpen, onClose, onNotify }) {
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useWishlist();

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedNights, setSelectedNights] = useState(2);

  if (!isOpen || !hotel) return null;

  // Additional preview gallery photos
  const photos = [
    hotel.image,
    "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=900&q=80",
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
  ];

  const currentPhoto = photos[activePhotoIndex] || hotel.image;
  const isFav = isFavorite(hotel.id);

  const handleShare = () => {
    const url = `${window.location.origin}/hotels/${hotel.id}`;
    if (navigator.share) {
      navigator.share({
        title: hotel.name,
        text: `Check out ${hotel.name} in ${hotel.city} on StayEase!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        if (onNotify) {
          onNotify({
            type: "info",
            title: "Link Copied!",
            message: "Property link copied to clipboard. Share with your travel partners!",
          });
        }
      });
    }
  };

  const amenities = Array.isArray(hotel.amenities)
    ? hotel.amenities
    : ["Free Wi-Fi", "Swimming Pool", "Restaurant", "Spa"];

  const amenityIcons = {
    "Swimming Pool": "🏊",
    "Free Wi-Fi": "📶",
    "Restaurant": "🍽️",
    "Spa": "🧖",
    "Parking": "🅿️",
  };

  const totalPrice = Number(hotel.price || 0) * selectedNights;

  return (
    <div className="fixed inset-0 z-[99992] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${hotel.name} Quick Preview`}
        className="relative z-10 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#e9e5dc] bg-[#fcfbf8] shadow-2xl transition-all dark:border-[#2a3c30] dark:bg-[#131b16]"
      >
        {/* Top Floating Controls */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#e9e5dc]/80 bg-[#fcfbf8]/90 px-6 py-4 backdrop-blur-md dark:border-[#2a3c30] dark:bg-[#131b16]/90">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#244b38]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#244b38] dark:bg-[#34d399]/15 dark:text-[#34d399]">
              Quick Preview
            </span>
            <span className="text-xs text-[#777b70] dark:text-[#9ea8a1]">
              {hotel.city}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleShare}
              title="Share property"
              aria-label="Share property link"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e2d9] text-sm text-[#777b70] transition hover:bg-[#f0eee7] hover:text-[#244b38] dark:border-[#2a3c30] dark:text-[#9ea8a1] dark:hover:bg-[#1a251e] dark:hover:text-white"
            >
              🔗
            </button>

            <button
              type="button"
              onClick={(e) => toggleFavorite(hotel, e)}
              title={isFav ? "Remove from wishlist" : "Save to wishlist"}
              aria-label={isFav ? "Remove from wishlist" : "Save to wishlist"}
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-base transition ${
                isFav
                  ? "border-[#c53030] bg-[#fff5f5] text-[#c53030] dark:bg-[#2b1616]"
                  : "border-[#e5e2d9] text-[#777b70] hover:bg-[#f0eee7] hover:text-[#c53030] dark:border-[#2a3c30] dark:text-[#9ea8a1] dark:hover:bg-[#1a251e]"
              }`}
            >
              {isFav ? "❤️" : "🤍"}
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e2d9] text-sm text-[#777b70] transition hover:bg-[#f0eee7] hover:text-[#244b38] dark:border-[#2a3c30] dark:text-[#9ea8a1] dark:hover:bg-[#1a251e] dark:hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Photos Showcase */}
          <div className="space-y-3">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-[#eeece6] shadow-sm">
              <img
                src={currentPhoto}
                alt={hotel.name}
                className="h-full w-full object-cover transition duration-300"
              />
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
                Photo {activePhotoIndex + 1} of {photos.length}
              </span>
            </div>

            {/* Thumbnail selector */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((src, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActivePhotoIndex(idx)}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    activePhotoIndex === idx
                      ? "border-[#244b38] ring-2 ring-[#244b38]/30 dark:border-[#34d399]"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Thumbnail ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Hotel Details Info */}
          <div className="mt-6 flex flex-col justify-between gap-6 md:flex-row md:items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#b18a57]">
                <span>{hotel.city}</span>
                <span>•</span>
                <span>★ {hotel.rating} (Superb)</span>
              </div>

              <h3 className="mt-2 font-serif text-2xl font-medium text-[#24402f] sm:text-3xl dark:text-[#f0f4f0]">
                {hotel.name}
              </h3>

              <p className="mt-1 text-xs text-[#777b70] dark:text-[#9ea8a1]">
                📍 {hotel.location}
              </p>

              <p className="mt-3 text-xs leading-relaxed text-[#555a52] dark:text-[#b4beb7]">
                Experience high-end hospitality surrounded by tranquil environments, tailored luxury amenities, premium suites, and personalized guest services.
              </p>

              {/* Amenities Pills */}
              <div className="mt-4 flex flex-wrap gap-2">
                {amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="flex items-center gap-1.5 rounded-lg border border-[#e9e5dc] bg-white px-3 py-1.5 text-xs text-[#333a34] dark:border-[#2a3c30] dark:bg-[#18231c] dark:text-[#d3ded6]"
                  >
                    <span>{amenityIcons[amenity] || "✦"}</span>
                    <span>{amenity}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Quick Pricing & Booking Card */}
            <div className="w-full shrink-0 rounded-2xl border border-[#e9e5dc] bg-white p-5 shadow-sm md:w-72 dark:border-[#2a3c30] dark:bg-[#18231c]">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                Rate per night
              </p>

              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-3xl font-semibold text-[#24402f] dark:text-[#34d399]">
                  {formatPrice(hotel.price)}
                </span>
                <span className="text-xs text-[#777b70] dark:text-[#9ea8a1]">
                  / night
                </span>
              </div>

              {/* Quick nights selector */}
              <div className="mt-4">
                <label
                  htmlFor="quickview-nights"
                  className="block text-[11px] font-medium text-[#777b70] dark:text-[#9ea8a1]"
                >
                  Stay Duration:
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-lg border border-[#e9e5dc] bg-[#fcfbf8] p-1.5 dark:border-[#2a3c30] dark:bg-[#121915]">
                  {[1, 2, 3, 5, 7].map((n) => (
                    <button
                      key={n}
                      id={n === selectedNights ? "quickview-nights" : undefined}
                      type="button"
                      onClick={() => setSelectedNights(n)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        selectedNights === n
                          ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                          : "text-[#555a52] hover:bg-black/5 dark:text-[#9ea8a1] dark:hover:bg-white/5"
                      }`}
                    >
                      {n}N
                    </button>
                  ))}
                </div>
              </div>

              {/* Total preview */}
              <div className="mt-4 flex items-center justify-between border-t border-[#eeece6] pt-3 text-xs dark:border-[#2a3c30]">
                <span className="text-[#777b70] dark:text-[#9ea8a1]">
                  Total ({selectedNights} nights):
                </span>
                <span className="font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 space-y-2">
                <Link
                  to={`/booking?hotelId=${hotel.id}`}
                  onClick={onClose}
                  className="block w-full rounded-xl bg-[#244b38] py-3 text-center text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#193829] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
                >
                  Reserve Stay →
                </Link>

                <Link
                  to={`/hotels/${hotel.id}`}
                  onClick={onClose}
                  className="block w-full rounded-xl border border-[#e9e5dc] py-2.5 text-center text-xs font-semibold text-[#244b38] transition hover:bg-[#f0eee7] dark:border-[#2a3c30] dark:text-[#34d399] dark:hover:bg-[#1f3025]"
                >
                  Full Property Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
