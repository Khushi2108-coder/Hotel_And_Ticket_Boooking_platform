import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { useWishlist } from "../context/WishlistContext";

export default function HotelCard({ hotel, onQuickView }) {
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const { isFavorite, toggleFavorite } = useWishlist();

  const [isHovered, setIsHovered] = useState(false);

  const amenities = Array.isArray(hotel.amenities)
    ? hotel.amenities.slice(0, 3)
    : [];

  const isFav = isFavorite(hotel.id);

  function openDetails() {
    navigate(`/hotels/${hotel.id}`);
  }

  function handleQuickView(e) {
    e.stopPropagation();
    if (onQuickView) {
      onQuickView(hotel);
    } else {
      openDetails();
    }
  }

  return (
    <article
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e9e6df] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_45px_rgba(20,40,30,0.12)] dark:border-[#2a3c30] dark:bg-[#16211a] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.4)]"
    >
      {/* Hotel image banner */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#eeece6] dark:bg-[#1c2a22]">
        <img
          src={hotel.image}
          alt={hotel.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Featured Badge */}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[9px] font-semibold uppercase tracking-[1.4px] text-[#244b38] shadow-sm backdrop-blur-md dark:bg-[#131b16]/95 dark:text-[#34d399]">
          Featured stay
        </span>

        {/* Wishlist Heart Toggle */}
        <button
          type="button"
          onClick={(e) => toggleFavorite(hotel, e)}
          title={isFav ? "Remove from wishlist" : "Save to wishlist"}
          aria-label={isFav ? "Remove from wishlist" : "Save to wishlist"}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full backdrop-blur-md transition-all duration-200 active:scale-90 ${
            isFav
              ? "bg-[#fff5f5] text-[#c53030] shadow-md dark:bg-[#2e1515]"
              : "bg-black/30 text-white hover:bg-white hover:text-[#c53030] dark:hover:bg-white dark:hover:text-[#c53030]"
          }`}
        >
          <span className="text-base transition-transform group-hover:scale-110">
            {isFav ? "❤️" : "🤍"}
          </span>
        </button>

        {/* Quick View Button Overlay on Hover */}
        <div
          className={`absolute inset-x-3 bottom-3 flex items-center justify-center transition-all duration-300 ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
          }`}
        >
          <button
            type="button"
            onClick={handleQuickView}
            className="flex items-center gap-1.5 rounded-xl bg-white/90 px-4 py-2 text-xs font-semibold text-[#244b38] shadow-lg backdrop-blur-md transition hover:bg-white hover:shadow-xl dark:bg-[#121915]/90 dark:text-[#f0f4f0] dark:hover:bg-[#121915]"
          >
            <span>👁️</span>
            <span>Quick Preview</span>
          </button>
        </div>
      </div>

      {/* Hotel information */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[1.6px] text-[#777b70] dark:text-[#9ea8a1]">
              📍 {hotel.city || "India"}
            </p>

            {hotel.rating != null && (
              <span className="flex items-center gap-1 rounded-md bg-[#edf3ec] px-2 py-0.5 text-xs font-bold text-[#244b38] dark:bg-[#1f3025] dark:text-[#34d399]">
                ★ {hotel.rating}
              </span>
            )}
          </div>

          <h3
            onClick={openDetails}
            className="mt-2.5 cursor-pointer truncate font-serif text-xl font-semibold text-[#26382d] transition hover:text-[#244b38] dark:text-[#f0f4f0] dark:hover:text-[#34d399]"
          >
            {hotel.name}
          </h3>

          {hotel.location && (
            <p className="mt-1 truncate text-xs text-[#85877f] dark:text-[#9aa59d]">
              {hotel.location}
            </p>
          )}

          {/* Amenities tags */}
          <div className="mt-4 flex min-h-6 flex-wrap gap-1.5">
            {amenities.map((amenity) => (
              <span
                key={amenity}
                className="rounded-md border border-[#e9e6df] bg-[#fcfbf8] px-2.5 py-1 text-[10px] font-medium text-[#5a6058] dark:border-[#2a3c30] dark:bg-[#18241c] dark:text-[#aab8ae]"
              >
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Price and Details CTA */}
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#eeece6] pt-4 dark:border-[#2a3c30]">
          <div>
            <p className="text-[10px] text-[#85877f] dark:text-[#9aa59d]">
              Starting from
            </p>

            <p className="mt-0.5 text-lg font-bold text-[#244b38] dark:text-[#34d399]">
              {formatPrice(hotel.price)}
              <span className="ml-1 text-xs font-normal text-[#85877f] dark:text-[#9aa59d]">
                / night
              </span>
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openDetails}
              className="rounded-xl bg-[#244b38] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
            >
              Explore →
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
