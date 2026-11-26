import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { hotels } from "../data/hotels";
import HotelCard from "../components/HotelCard";
import QuickViewModal from "../components/QuickViewModal";
import { useCurrency } from "../context/CurrencyContext";

const amenitiesList = [
  "Swimming Pool",
  "Free Wi-Fi",
  "Restaurant",
  "Spa",
  "Parking",
];

const popularCities = [
  "Goa",
  "Udaipur",
  "Manali",
  "Jaipur",
  "Alleppey",
  "Varanasi",
  "Ooty",
  "Rishikesh",
  "Mumbai",
  "Shimla",
  "Munnar",
];

export default function SearchResults({ onNotify }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { formatPrice } = useCurrency();

  const city = searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const guests = searchParams.get("guests") || "2";

  const [maxPrice, setMaxPrice] = useState(15000);
  const [minRating, setMinRating] = useState("0");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState("recommended");
  const [searchCity, setSearchCity] = useState(city);
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [quickViewHotel, setQuickViewHotel] = useState(null);

  const filteredHotels = useMemo(() => {
    let result = hotels.filter((hotel) => {
      const matchesCity =
        !city ||
        `${hotel.city || ""} ${hotel.location || ""}`
          .toLowerCase()
          .includes(city.toLowerCase());

      const matchesPrice = Number(hotel.price || 0) <= maxPrice;
      const matchesRating = Number(hotel.rating || 0) >= Number(minRating);

      const hotelAmenities = Array.isArray(hotel.amenities)
        ? hotel.amenities.map((item) => item.toLowerCase())
        : [];

      const matchesAmenities = selectedAmenities.every((amenity) =>
        hotelAmenities.some((item) =>
          item.includes(amenity.toLowerCase())
        )
      );

      return matchesCity && matchesPrice && matchesRating && matchesAmenities;
    });

    if (sortBy === "price-low") {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating") {
      result.sort((a, b) => Number(b.rating) - Number(a.rating));
    }

    return result;
  }, [city, maxPrice, minRating, selectedAmenities, sortBy]);

  function toggleAmenity(amenity) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((item) => item !== amenity)
        : [...prev, amenity]
    );
  }

  function updateSearch(event) {
    event.preventDefault();
    const next = new URLSearchParams(searchParams);

    if (searchCity.trim()) {
      next.set("city", searchCity.trim());
    } else {
      next.delete("city");
    }

    setSearchParams(next);
  }

  function handleCityTag(tagCity) {
    setSearchCity(tagCity);
    const next = new URLSearchParams(searchParams);
    next.set("city", tagCity);
    setSearchParams(next);
  }

  function clearFilters() {
    setMaxPrice(15000);
    setMinRating("0");
    setSelectedAmenities([]);
    setSortBy("recommended");
  }

  const hasFilters =
    maxPrice !== 15000 ||
    minRating !== "0" ||
    selectedAmenities.length > 0;

  return (
    <main className="min-h-screen bg-[#fcfbf8] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      {/* Page Header Banner */}
      <section className="border-b border-[#e9e5dc] bg-[#f4f1e9] transition-colors duration-300 dark:border-[#2a3c30] dark:bg-[#121915]">
        <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
          <p className="text-xs font-semibold uppercase tracking-[3px] text-[#a17a49] dark:text-[#e6c587]">
            Your next luxury getaway
          </p>

          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl dark:text-[#f0f4f0]">
            {city ? `Stays in ${city}` : "Find your perfect retreat"}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-[#73766d] sm:text-base dark:text-[#9ea8a1]">
            Discover handpicked hotels, peaceful seaside villas, and boutique heritage havelis.
          </p>

          {/* Search bar inside header */}
          <form
            onSubmit={updateSearch}
            className="mt-8 grid gap-3 rounded-2xl border border-[#e7e2d8] bg-white p-4 shadow-sm backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_auto] lg:items-end lg:p-5 dark:border-[#2a3c30] dark:bg-[#152019]"
          >
            <div>
              <label
                htmlFor="destination"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#777b72] dark:text-[#9ea8a1]"
              >
                Destination
              </label>
              <input
                id="destination"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Where do you want to go?"
                className="w-full rounded-xl border border-[#e5e2d9] bg-transparent px-3 py-2.5 text-sm font-medium outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:text-[#f0f4f0]"
              />
            </div>

            <div>
              <label
                htmlFor="check-in"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#777b72] dark:text-[#9ea8a1]"
              >
                Check-in
              </label>
              <input
                id="check-in"
                type="date"
                value={checkIn}
                min={new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set("checkIn", e.target.value);
                  setSearchParams(next);
                }}
                className="w-full rounded-xl border border-[#e5e2d9] bg-transparent px-3 py-2.5 text-sm font-medium outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:text-[#f0f4f0]"
              />
            </div>

            <div>
              <label
                htmlFor="check-out"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#777b72] dark:text-[#9ea8a1]"
              >
                Check-out
              </label>
              <input
                id="check-out"
                type="date"
                value={checkOut}
                min={checkIn || new Date().toISOString().slice(0, 10)}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set("checkOut", e.target.value);
                  setSearchParams(next);
                }}
                className="w-full rounded-xl border border-[#e5e2d9] bg-transparent px-3 py-2.5 text-sm font-medium outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:text-[#f0f4f0]"
              />
            </div>

            <div>
              <label
                htmlFor="guests"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#777b72] dark:text-[#9ea8a1]"
              >
                Guests
              </label>
              <select
                id="guests"
                value={guests}
                onChange={(e) => {
                  const next = new URLSearchParams(searchParams);
                  next.set("guests", e.target.value);
                  setSearchParams(next);
                }}
                className="w-full rounded-xl border border-[#e5e2d9] bg-transparent px-3 py-2.5 text-sm font-medium outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:text-[#f0f4f0]"
              >
                {[1, 2, 3, 4, 5, 6].map((count) => (
                  <option key={count} value={String(count)}>
                    {count} {count === 1 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#244b38] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
            >
              Update ↗
            </button>
          </form>

          {/* Quick city pills */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777b72] dark:text-[#9ea8a1]">
              Quick Cities:
            </span>
            {popularCities.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => handleCityTag(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  city.toLowerCase() === c.toLowerCase()
                    ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                    : "border border-[#e5e2d9] bg-white/70 text-[#244b38] hover:bg-white dark:border-[#2a3c30] dark:bg-[#18231c] dark:text-[#34d399]"
                }`}
              >
                {c}
              </button>
            ))}
            {city && (
              <button
                type="button"
                onClick={() => handleCityTag("")}
                className="text-xs font-semibold text-[#c53030] hover:underline"
              >
                Clear city ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Results Section */}
      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
        {/* Results Toolbar: Count, Active Filter Chips, Grid/List Toggle, Sort */}
        <div className="flex flex-col justify-between gap-5 border-b border-[#eeece6] pb-6 sm:flex-row sm:items-end dark:border-[#2a3c30]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-[2px] text-[#a17a49] dark:text-[#e6c587]">
                Available Stays
              </span>
              <span className="rounded-full bg-[#244b38]/10 px-2.5 py-0.5 text-xs font-bold text-[#244b38] dark:bg-[#34d399]/15 dark:text-[#34d399]">
                {filteredHotels.length}
              </span>
            </div>
            <h2 className="mt-1 font-serif text-3xl font-medium sm:text-4xl dark:text-[#f0f4f0]">
              {city ? `Stays in ${city}` : "All Properties"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Toggle: Grid vs List */}
            <div className="flex rounded-xl border border-[#e5e2d9] bg-white p-1 dark:border-[#2a3c30] dark:bg-[#18231c]">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                title="Grid view"
                aria-label="Grid view"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                    : "text-[#777b70] hover:text-[#244b38] dark:text-[#9ea8a1]"
                }`}
              >
                ▦ Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                title="List view"
                aria-label="List view"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "list"
                    ? "bg-[#244b38] text-white dark:bg-[#34d399] dark:text-[#0c120e]"
                    : "text-[#777b70] hover:text-[#244b38] dark:text-[#9ea8a1]"
                }`}
              >
                ☰ List
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <label htmlFor="sort" className="shrink-0 text-xs text-[#73766d] dark:text-[#9ea8a1]">
                Sort:
              </label>
              <select
                id="sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-xl border border-[#e5e2d9] bg-white px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#18231c] dark:text-[#f0f4f0]"
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold text-[#777b70] dark:text-[#9ea8a1]">
              Active Filters:
            </span>
            {maxPrice < 15000 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-medium text-[#244b38] dark:bg-[#1a2d21] dark:text-[#34d399]">
                Max {formatPrice(maxPrice)}
                <button
                  type="button"
                  onClick={() => setMaxPrice(15000)}
                  className="hover:font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {minRating !== "0" && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-medium text-[#244b38] dark:bg-[#1a2d21] dark:text-[#34d399]">
                Rating {minRating}+
                <button
                  type="button"
                  onClick={() => setMinRating("0")}
                  className="hover:font-bold"
                >
                  ✕
                </button>
              </span>
            )}
            {selectedAmenities.map((amenity) => (
              <span
                key={amenity}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#edf3ec] px-3 py-1 text-xs font-medium text-[#244b38] dark:bg-[#1a2d21] dark:text-[#34d399]"
              >
                {amenity}
                <button
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className="hover:font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-semibold text-[#c53030] hover:underline"
            >
              Reset all
            </button>
          </div>
        )}

        {/* Content Layout */}
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Filters Sidebar */}
          <aside className="rounded-2xl border border-[#e8e4db] bg-white p-5 shadow-sm sm:p-6 dark:border-[#2a3c30] dark:bg-[#152019]">
            <div className="flex items-center justify-between border-b border-[#eeece6] pb-4 dark:border-[#2a3c30]">
              <h3 className="font-serif text-xl font-medium dark:text-[#f0f4f0]">Filters</h3>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-[#8c6b42] hover:underline dark:text-[#e6c587]"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Price Range Filter with Currency Symbol */}
            <div className="mt-5 border-b border-[#eeeae2] pb-6 dark:border-[#2a3c30]">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                  Max Price / Night
                </h4>
                <span className="font-serif text-base font-bold text-[#244b38] dark:text-[#34d399]">
                  {formatPrice(maxPrice)}
                </span>
              </div>
              <input
                aria-label="Maximum price per night"
                type="range"
                min="1000"
                max="15000"
                step="500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="mt-4 w-full accent-[#244b38] dark:accent-[#34d399]"
              />
              <div className="mt-1 flex justify-between text-[11px] text-[#85877f] dark:text-[#9ea8a1]">
                <span>{formatPrice(1000)}</span>
                <span>{formatPrice(15000)}+</span>
              </div>
            </div>

            {/* Guest Rating Filter */}
            <div className="mt-5 border-b border-[#eeeae2] pb-6 dark:border-[#2a3c30]">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                Minimum Rating
              </h4>
              <div className="mt-3.5 space-y-2.5">
                {[
                  ["0", "All ratings"],
                  ["3", "★ 3.0+ (Good)"],
                  ["4", "★ 4.0+ (Very Good)"],
                  ["4.5", "★ 4.5+ (Exceptional)"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#62685f] hover:text-[#244b38] dark:text-[#a6b4aa] dark:hover:text-[#34d399]"
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={minRating === value}
                      onChange={(e) => setMinRating(e.target.value)}
                      className="accent-[#244b38] dark:accent-[#34d399]"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities Checkboxes */}
            <div className="mt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
                Popular Amenities
              </h4>
              <div className="mt-3.5 space-y-2.5">
                {amenitiesList.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex cursor-pointer items-center gap-2.5 text-xs font-medium text-[#62685f] hover:text-[#244b38] dark:text-[#a6b4aa] dark:hover:text-[#34d399]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                      className="h-4 w-4 rounded-md accent-[#244b38] dark:accent-[#34d399]"
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 w-full rounded-xl border border-[#244b38] py-2.5 text-xs font-semibold text-[#244b38] transition hover:bg-[#edf3ec] dark:border-[#34d399] dark:text-[#34d399] dark:hover:bg-[#1a2d21]"
              >
                Reset Filters
              </button>
            )}
          </aside>

          {/* Hotel Listings */}
          <div className="min-w-0">
            {filteredHotels.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === "grid"
                      ? "grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                      : "space-y-4"
                  }
                >
                  {filteredHotels.map((hotel) => (
                    <HotelCard
                      key={hotel.id}
                      hotel={hotel}
                      onQuickView={(h) => setQuickViewHotel(h)}
                    />
                  ))}
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#e8e4db] pt-7 sm:flex-row dark:border-[#2a3c30]">
                  <p className="text-xs text-[#777b72] dark:text-[#9ea8a1]">
                    Displaying {filteredHotels.length} verified luxury properties
                  </p>
                  <Link
                    to="/"
                    className="rounded-xl border border-[#244b38] px-5 py-2.5 text-xs font-semibold text-[#244b38] transition hover:bg-[#244b38] hover:text-white dark:border-[#34d399] dark:text-[#34d399] dark:hover:bg-[#34d399] dark:hover:text-[#0c120e]"
                  >
                    Explore Home Collections ↗
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#dcd8ce] bg-white px-6 py-14 text-center dark:border-[#2a3c30] dark:bg-[#152019]">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#edf3ec] text-3xl dark:bg-[#1f3025]">
                  🔍
                </span>
                <h3 className="mt-4 font-serif text-2xl font-medium dark:text-[#f0f4f0]">
                  No matching stays found
                </h3>
                <p className="mt-2 max-w-md text-xs leading-6 text-[#777b72] dark:text-[#9ea8a1]">
                  Try another destination, adjust your price range, or reset selected amenities.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    clearFilters();
                    setSearchCity("");
                    setSearchParams({});
                  }}
                  className="mt-5 rounded-xl bg-[#244b38] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
                >
                  Show all stays
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <QuickViewModal
        hotel={quickViewHotel}
        isOpen={Boolean(quickViewHotel)}
        onClose={() => setQuickViewHotel(null)}
        onNotify={onNotify}
      />
    </main>
  );
}
