import { Link } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCurrency } from "../context/CurrencyContext";

export default function WishlistDrawer() {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    favoriteHotels,
    removeFavorite,
    clearWishlist,
    favoritesCount,
  } = useWishlist();
  const { formatPrice } = useCurrency();

  if (!isWishlistOpen) return null;

  return (
    <div className="fixed inset-0 z-[99990] flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => setIsWishlistOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <aside
        role="dialog"
        aria-label="Saved Stays Wishlist"
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-[#e9e5dc] bg-[#fcfbf8] shadow-2xl transition-transform duration-300 dark:border-[#2a3c30] dark:bg-[#121a15]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e9e5dc] px-6 py-5 dark:border-[#2a3c30]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#c53030]/10 text-base text-[#c53030]">
              ❤️
            </span>
            <div>
              <h2 className="font-serif text-xl font-medium text-[#24402f] dark:text-[#f0f4f0]">
                Saved Stays
              </h2>
              <p className="text-xs text-[#777b70] dark:text-[#9ea8a1]">
                {favoritesCount} {favoritesCount === 1 ? "property" : "properties"} in your wishlist
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsWishlistOpen(false)}
            aria-label="Close wishlist"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e2d9] text-base text-[#777b70] transition hover:bg-[#f0eee7] hover:text-[#24402f] dark:border-[#2a3c30] dark:text-[#9ea8a1] dark:hover:bg-[#1a251e] dark:hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Stays List */}
        <div className="flex-1 overflow-y-auto p-6">
          {favoriteHotels.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#edf3ec] text-4xl shadow-inner dark:bg-[#1e2a22]">
                ❤️
              </div>
              <h3 className="mt-5 font-serif text-xl font-medium text-[#24402f] dark:text-white">
                No saved stays yet
              </h3>
              <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#777b70] dark:text-[#9ea8a1]">
                Tap the heart on any hotel or retreat while browsing to save it to your personal collection.
              </p>
              <button
                type="button"
                onClick={() => setIsWishlistOpen(false)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#244b38] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-[#193829]"
              >
                Explore Properties
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="group relative flex gap-4 overflow-hidden rounded-xl border border-[#e9e5dc] bg-white p-3.5 shadow-sm transition hover:shadow-md dark:border-[#2a3c30] dark:bg-[#1a251f]"
                >
                  <img
                    src={hotel.image}
                    alt={hotel.name}
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                  />

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                          {hotel.city}
                        </span>
                        <span className="text-xs font-bold text-[#244b38] dark:text-[#34d399]">
                          ★ {hotel.rating}
                        </span>
                      </div>
                      <h4 className="font-serif text-base font-semibold leading-tight text-[#24402f] dark:text-[#f0f4f0]">
                        {hotel.name}
                      </h4>
                      <p className="mt-1 text-xs font-semibold text-[#244b38] dark:text-[#34d399]">
                        {formatPrice(hotel.price, true)}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        to={`/hotels/${hotel.id}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="rounded-md bg-[#244b38] px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-[#193829]"
                      >
                        Details
                      </Link>
                      <Link
                        to={`/booking?hotelId=${hotel.id}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="rounded-md border border-[#244b38] px-3 py-1.5 text-[11px] font-semibold text-[#244b38] transition hover:bg-[#edf3ec] dark:border-[#34d399] dark:text-[#34d399] dark:hover:bg-[#1f3025]"
                      >
                        Book
                      </Link>
                      <button
                        type="button"
                        onClick={() => removeFavorite(hotel.id)}
                        title="Remove from wishlist"
                        aria-label={`Remove ${hotel.name} from wishlist`}
                        className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-[#c53030] transition hover:bg-[#c53030]/10"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {favoriteHotels.length > 0 && (
          <div className="border-t border-[#e9e5dc] p-5 dark:border-[#2a3c30]">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={clearWishlist}
                className="text-xs font-semibold text-[#c53030] transition hover:underline"
              >
                Clear all ({favoriteHotels.length})
              </button>

              <button
                type="button"
                onClick={() => setIsWishlistOpen(false)}
                className="rounded-lg bg-[#244b38] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#193829]"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
