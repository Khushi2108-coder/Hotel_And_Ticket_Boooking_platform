import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { hotels } from "../data/hotels";
import HotelCard from "../components/HotelCard";
import QuickViewModal from "../components/QuickViewModal";
import { useAuth } from "../context/AuthContext";
import { feedbackAPI } from "../services/api";

const destinations = [
  {
    name: "Goa",
    subtitle: "Coastal escapes",
    image:
      "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Udaipur",
    subtitle: "Palaces & heritage",
    image:
      "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Manali",
    subtitle: "Mountain retreats",
    image:
      "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Jaipur",
    subtitle: "Culture & character",
    image:
      "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Alleppey",
    subtitle: "Backwaters & houseboats",
    image:
      "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Varanasi",
    subtitle: "Sacred ghats & Ganga",
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Ooty",
    subtitle: "Misty tea hills & pines",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Rishikesh",
    subtitle: "River Ganga & wellness",
    image:
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=900&q=85",
  },
];

const categoryPills = [
  { label: "🏖️ Beach Escapes", city: "Goa" },
  { label: "🏔️ Mountain Stays", city: "Manali" },
  { label: "🏰 Royal Palaces", city: "Udaipur" },
  { label: "🌺 Pink Heritage", city: "Jaipur" },
  { label: "🌊 Backwaters", city: "Alleppey" },
  { label: "🌿 Hill Tea Gardens", city: "Ooty" },
  { label: "🛕 Spiritual Ghats", city: "Varanasi" },
  { label: "🧘 Yoga & River", city: "Rishikesh" },
];

const initialGuestTestimonials = [
  {
    id: 1,
    name: "Aarav & Simran Sharma",
    location: "Mumbai",
    rating: 5,
    hotelStayed: "Lakeview Heritage Palace, Udaipur",
    comment:
      "Our 3-night anniversary retreat in Udaipur was absolutely celestial. The Jharokha views over Lake Pichola and the personalized dining made it our most cherished trip ever.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    date: "November 2026",
    badge: "Verified Guest",
  },
  {
    id: 2,
    name: "Karan Singhania",
    location: "Bengaluru",
    rating: 5,
    hotelStayed: "Coastal Palm Retreat, Goa",
    comment:
      "StayEase made the entire booking seamless. We redeemed our loyalty points directly at checkout and got an instant cash discount on the room tariff. Exceptional value!",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    date: "October 2026",
    badge: "Gold Explorer",
  },
  {
    id: 3,
    name: "Meera Nair",
    location: "Delhi",
    rating: 5,
    hotelStayed: "Backwater Palms Houseboat, Alleppey",
    comment:
      "Gliding across the Vembanad backwaters while the private chef served authentic Kerala cuisine was pure bliss. Clean rooms, tranquil breeze, and 100% authentic property photos.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    date: "November 2026",
    badge: "Verified Guest",
  },
  {
    id: 4,
    name: "Vikram & Ananya Joshi",
    location: "Pune",
    rating: 5,
    hotelStayed: "Nilgiri Mist Tea Estate, Ooty",
    comment:
      "The cool eucalyptus morning air and panoramic tea garden terrace in Ooty were unmatched. The flexible check-in timings made our single day mountain roadtrip completely hassle-free.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    date: "November 2026",
    badge: "Platinum Member",
  },
];

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <path d="M5 12h14m-6-6 6 6-6 6" />
  </svg>
);

export default function Home({ onNotify }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2 Guests");
  const [activeTab, setActiveTab] = useState("all");
  const [quickViewHotel, setQuickViewHotel] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [testimonials, setTestimonials] = useState(initialGuestTestimonials);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    name: "",
    location: "",
    rating: 5,
    hotelStayed: "",
    comment: "",
  });

  // Load public feedback from database so all users see it
  useEffect(() => {
    async function loadFeedbacks() {
      try {
        const res = await feedbackAPI.getAll();
        if (res.success && Array.isArray(res.feedbacks) && res.feedbacks.length > 0) {
          setTestimonials(res.feedbacks);
        }
      } catch (err) {
        console.warn("Could not load backend feedbacks, using initial:", err.message);
      }
    }
    loadFeedbacks();
  }, []);

  // Pre-fill user info when opening feedback modal
  useEffect(() => {
    if (isFeedbackModalOpen && user) {
      setFeedbackForm((prev) => ({
        ...prev,
        name: prev.name || user.name || user.username || "",
        location: prev.location || user.city || "",
      }));
    }
  }, [isFeedbackModalOpen, user]);

  const today = new Date().toISOString().split("T")[0];

  function handleSearch(event) {
    event.preventDefault();

    const params = new URLSearchParams();

    if (city.trim()) params.set("city", city.trim());
    if (checkIn) params.set("checkIn", checkIn);
    if (checkOut) params.set("checkOut", checkOut);
    if (guests) params.set("guests", guests);

    navigate(`/search?${params.toString()}`);
  }

  function handlePillClick(pillCity) {
    setCity(pillCity);
    navigate(`/search?${new URLSearchParams({ city: pillCity }).toString()}`);
  }

  function handleNewsletter(e) {
    e.preventDefault();
    if (!newsletterEmail) return;
    if (onNotify) {
      onNotify({
        type: "success",
        title: "Subscribed! 🎉",
        message: `Thank you for joining our private travel club, ${newsletterEmail}!`,
      });
    }
    setNewsletterEmail("");
  }

  function handleFeedbackSubmit(e) {
    e.preventDefault();
    if (!feedbackForm.name.trim() || !feedbackForm.comment.trim()) return;

    const newFeedback = {
      id: Date.now(),
      name: feedbackForm.name.trim(),
      location: feedbackForm.location.trim() || "India",
      rating: Number(feedbackForm.rating),
      hotelStayed: feedbackForm.hotelStayed.trim() || "StayEase Luxury Stay",
      comment: feedbackForm.comment.trim(),
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      date: "Just now",
      badge: "Verified Guest",
    };

    setTestimonials((prev) => [newFeedback, ...prev]);
    setIsFeedbackModalOpen(false);
    setFeedbackForm({ name: "", location: "", rating: 5, hotelStayed: "", comment: "" });

    if (onNotify) {
      onNotify({
        type: "success",
        title: "Feedback Shared! ⭐",
        message: "Thank you for sharing your StayEase travel experience!",
      });
    }
  }

  // Filter collection based on active tab
  const filteredFeatured = hotels.filter((h) => {
    if (activeTab === "all") return true;
    if (activeTab === "beach") return ["Goa", "Puri", "Pondicherry"].includes(h.city);
    if (activeTab === "hills") return ["Manali", "Shimla", "Munnar", "Mussoorie", "Coorg"].includes(h.city);
    if (activeTab === "heritage") return ["Udaipur", "Jaipur", "Agra", "Jodhpur", "Jaisalmer"].includes(h.city);
    return true;
  }).slice(0, 6);

  return (
    <main className="overflow-hidden bg-[#fbfaf7] text-[#26382d] transition-colors duration-300 dark:bg-[#0c120e] dark:text-[#f0f4f0]">
      {/* HERO SECTION */}
      <section className="px-4 pt-4 sm:px-6 lg:px-10">
        <div className="relative mx-auto min-h-[620px] max-w-[1600px] overflow-hidden rounded-3xl bg-[#26382d] shadow-2xl sm:min-h-[680px] lg:min-h-[720px]">
          <img
            src="https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2200&q=90"
            alt="Luxury resort surrounded by tropical greenery"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 scale-102"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#0c1712]/85 via-[#0c1712]/45 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1712]/75 via-transparent to-[#0c1712]/20" />

          <div className="relative flex min-h-[620px] flex-col justify-center px-6 py-16 text-white sm:min-h-[680px] sm:px-12 lg:min-h-[720px] lg:px-20">
            <div className="mb-6 flex items-center gap-3">
              <span className="h-px w-10 bg-[#e6c587]" />
              <p className="text-[10px] font-semibold uppercase tracking-[3px] text-[#f0ddbd] sm:text-xs">
                A more thoughtful way to travel
              </p>
            </div>

            <h1 className="max-w-3xl font-serif text-5xl font-normal leading-[1.08] tracking-[-1.5px] sm:text-6xl lg:text-[84px]">
              Find your place
              <br />
              <span className="italic text-[#e6d1aa]">in the world.</span>
            </h1>

            <p className="mt-6 max-w-lg text-sm leading-7 text-white/85 sm:text-base sm:leading-8">
              Discover considered stays, memorable destinations, and architectural spaces
              that make every journey feel extraordinary.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() =>
                  document
                    .getElementById("booking-search")
                    ?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className="inline-flex items-center gap-3 rounded-xl bg-[#f4eee2] px-6 py-4 text-xs font-semibold uppercase tracking-[1.5px] text-[#26382d] shadow-lg transition hover:bg-white hover:shadow-xl"
              >
                Find your stay <ArrowIcon />
              </button>

              <a
                href="#destinations"
                className="rounded-xl border border-white/40 bg-white/10 px-5 py-3.5 text-xs font-medium tracking-wide text-white backdrop-blur-md transition hover:border-white hover:bg-white/20"
              >
                Explore destinations
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[11px] font-medium tracking-wider text-white/80 sm:mt-16">
              <span className="flex items-center gap-1.5">
                <span className="text-[#e6c587]">★</span> 4.9/5 Guest Rating
              </span>
              <span className="hidden text-white/30 sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#34d399]">✓</span> 30+ Handpicked Escapes
              </span>
              <span className="hidden text-white/30 sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[#38bdf8]">🛡️</span> Best Price Guarantee
              </span>
            </div>
          </div>

          <div className="absolute bottom-8 right-8 hidden text-right text-white/80 lg:block">
            <p className="text-[10px] uppercase tracking-[2px]">Your next story</p>
            <p className="mt-1 font-serif text-xl italic text-[#e6d1aa]">Starts somewhere new.</p>
          </div>
        </div>
      </section>

      {/* BOOKING SEARCH BAR */}
      <section
        id="booking-search"
        className="relative z-10 mx-auto -mt-6 max-w-[1330px] px-4 pt-2 sm:px-6 lg:-mt-10 lg:px-10"
      >
        <form
          onSubmit={handleSearch}
          className="grid gap-0 rounded-2xl border border-[#e8e4db] bg-white p-3 shadow-[0_20px_50px_rgba(20,40,30,0.12)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_0.85fr_auto] lg:items-center lg:p-4 dark:border-[#2a3c30] dark:bg-[#152019]"
        >
          <div className="border-b border-[#eeece6] px-4 py-4 sm:pr-5 lg:border-b-0 lg:border-r dark:border-[#2a3c30]">
            <label
              htmlFor="destination"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[1.6px] text-[#777b70] dark:text-[#9ea8a1]"
            >
              Destination
            </label>
            <input
              id="destination"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Where would you like to go?"
              className="w-full bg-transparent text-sm font-medium text-[#26382d] outline-none placeholder:text-[#9b9c94] dark:text-[#f0f4f0]"
            />
          </div>

          <div className="border-b border-[#eeece6] px-4 py-4 lg:border-b-0 lg:border-r dark:border-[#2a3c30]">
            <label
              htmlFor="checkin"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[1.6px] text-[#777b70] dark:text-[#9ea8a1]"
            >
              Check in
            </label>
            <input
              id="checkin"
              type="date"
              min={today}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) {
                  setCheckOut("");
                }
              }}
              className="w-full bg-transparent text-sm font-medium text-[#26382d] outline-none dark:text-[#f0f4f0]"
            />
          </div>

          <div className="border-b border-[#eeece6] px-4 py-4 sm:border-b-0 sm:border-r dark:border-[#2a3c30]">
            <label
              htmlFor="checkout"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[1.6px] text-[#777b70] dark:text-[#9ea8a1]"
            >
              Check out
            </label>
            <input
              id="checkout"
              type="date"
              min={checkIn || today}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#26382d] outline-none dark:text-[#f0f4f0]"
            />
          </div>

          <div className="px-4 py-4 lg:border-r lg:border-[#eeece6] dark:border-[#2a3c30]">
            <label
              htmlFor="guests"
              className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[1.6px] text-[#777b70] dark:text-[#9ea8a1]"
            >
              Travellers
            </label>
            <select
              id="guests"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full bg-transparent text-sm font-medium text-[#26382d] outline-none dark:text-[#f0f4f0]"
            >
              <option>1 Guest</option>
              <option>2 Guests</option>
              <option>3 Guests</option>
              <option>4 Guests</option>
              <option>5+ Guests</option>
            </select>
          </div>

          <div className="p-1 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-[#244b38] px-7 text-xs font-semibold uppercase tracking-[1.5px] text-white shadow-md transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
            >
              Search <ArrowIcon />
            </button>
          </div>
        </form>

        {/* Quick Category / Mood Filter Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#777b70] dark:text-[#9ea8a1]">
            Trending Escapes:
          </span>
          {categoryPills.map((pill) => (
            <button
              key={pill.city}
              type="button"
              onClick={() => handlePillClick(pill.city)}
              className="rounded-full border border-[#e8e4db] bg-white/80 px-3.5 py-1.5 text-xs font-medium text-[#244b38] shadow-2xs backdrop-blur-sm transition hover:scale-105 hover:border-[#244b38] hover:bg-white dark:border-[#2a3c30] dark:bg-[#18231c] dark:text-[#34d399] dark:hover:border-[#34d399]"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </section>

      {/* PHILOSOPHY INTRO */}
      <section className="mx-auto grid max-w-[1330px] gap-6 px-6 py-20 sm:px-10 sm:py-24 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-16 lg:py-28">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[#8c7654] dark:text-[#e6c587]">
            Travel, with intention
          </p>
          <h2 className="mt-4 max-w-xl font-serif text-4xl font-normal leading-tight tracking-[-0.8px] sm:text-5xl dark:text-[#f0f4f0]">
            Not just somewhere to stay.
            <span className="italic text-[#75816e] dark:text-[#34d399]"> Somewhere to belong.</span>
          </h2>
        </div>

        <div className="max-w-xl lg:justify-self-end">
          <p className="text-sm leading-7 text-[#777b70] sm:text-base sm:leading-8 dark:text-[#9ea8a1]">
            From quiet coastal hideaways to character-filled city retreats,
            discover places chosen to make your time away feel meaningful.
            Your journey deserves more than an ordinary booking.
          </p>

          <div className="mt-7 grid grid-cols-3 border-t border-[#dedbd1] pt-5 dark:border-[#2a3c30]">
            <div>
              <p className="font-serif text-2xl font-bold text-[#244b38] dark:text-[#34d399]">01</p>
              <p className="mt-1 text-[9px] uppercase tracking-[1px] text-[#777b70] dark:text-[#9ea8a1] sm:text-[10px]">
                Discover
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold text-[#244b38] dark:text-[#34d399]">02</p>
              <p className="mt-1 text-[9px] uppercase tracking-[1px] text-[#777b70] dark:text-[#9ea8a1] sm:text-[10px]">
                Compare
              </p>
            </div>
            <div>
              <p className="font-serif text-2xl font-bold text-[#244b38] dark:text-[#34d399]">03</p>
              <p className="mt-1 text-[9px] uppercase tracking-[1px] text-[#777b70] dark:text-[#9ea8a1] sm:text-[10px]">
                Experience
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED COLLECTION WITH TABS */}
      <section id="featured-stays" className="bg-[#f1efe8] py-20 transition-colors duration-300 sm:py-24 dark:bg-[#121915]">
        <div className="mx-auto max-w-[1330px] px-6 sm:px-10">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[#8c7654] dark:text-[#e6c587]">
                The StayEase Collection
              </p>
              <h2 className="mt-3 font-serif text-4xl font-normal tracking-[-0.8px] sm:text-5xl dark:text-[#f0f4f0]">
                Stays worth discovering
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#777b70] dark:text-[#9ea8a1]">
                Find a space that matches your pace, whether it is a slow
                weekend retreat or your next memorable expedition.
              </p>
            </div>

            <button
              onClick={() => navigate("/search")}
              className="inline-flex w-fit items-center gap-3 rounded-full border border-[#244b38] px-5 py-2.5 text-xs font-semibold uppercase tracking-[1.2px] text-[#244b38] transition hover:bg-[#244b38] hover:text-white dark:border-[#34d399] dark:text-[#34d399] dark:hover:bg-[#34d399] dark:hover:text-[#0c120e]"
            >
              View all 30+ stays <ArrowIcon />
            </button>
          </div>

          {/* Tab Filter Pills */}
          <div className="mt-8 flex flex-wrap gap-2 border-b border-[#dedbd1] pb-4 dark:border-[#2a3c30]">
            {[
              { id: "all", label: "🌟 All Signature Stays" },
              { id: "beach", label: "🏖️ Coastal & Beach" },
              { id: "hills", label: "🏔️ Hills & Mountains" },
              { id: "heritage", label: "🏰 Palaces & Heritage" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-[#244b38] text-white shadow-sm dark:bg-[#34d399] dark:text-[#0c120e]"
                    : "border border-[#dedbd1] bg-white text-[#777b70] hover:border-[#244b38] hover:text-[#244b38] dark:border-[#2a3c30] dark:bg-[#18231c] dark:text-[#9ea8a1] dark:hover:text-[#34d399]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {filteredFeatured.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onQuickView={(h) => setQuickViewHotel(h)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS SHOWCASE */}
      <section id="destinations" className="mx-auto max-w-[1330px] px-6 py-20 sm:px-10 sm:py-28">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[#8c7654] dark:text-[#e6c587]">
              A world of possibilities
            </p>
            <h2 className="mt-3 font-serif text-4xl font-normal tracking-[-0.8px] sm:text-5xl dark:text-[#f0f4f0]">
              Where will you go next?
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-[#777b70] dark:text-[#9ea8a1]">
            Curated destinations designed for slow mornings, scenic views, and unforgettable moments.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {destinations.map((destination, index) => (
            <button
              type="button"
              key={destination.name}
              onClick={() => {
                setCity(destination.name);
                navigate(`/search?${new URLSearchParams({ city: destination.name })}`);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`group relative h-[340px] overflow-hidden rounded-2xl bg-[#dedbd1] text-left shadow-sm transition hover:shadow-xl sm:h-[400px] ${
                index % 2 === 1 ? "lg:mt-8" : ""
              }`}
            >
              <img
                src={destination.image}
                alt={`${destination.name} destination`}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-108"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/5" />

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-6 text-white">
                <div>
                  <p className="mb-1 text-[10px] uppercase tracking-[2px] text-white/80">
                    {destination.subtitle}
                  </p>
                  <h3 className="font-serif text-3xl font-normal">
                    {destination.name}
                  </h3>
                </div>
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 backdrop-blur-sm transition group-hover:bg-white group-hover:text-[#26382d]">
                  <ArrowIcon />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* GUEST REVIEWS & VERIFIED FEEDBACK */}
      <section className="bg-[#f7f5ef] py-20 transition-colors duration-300 sm:py-24 dark:bg-[#101712]">
        <div className="mx-auto max-w-[1330px] px-6 sm:px-10">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[#8c7654] dark:text-[#e6c587]">
                Real Stories & Journeys
              </p>
              <h2 className="mt-3 font-serif text-4xl font-normal tracking-[-0.8px] sm:text-5xl dark:text-[#f0f4f0]">
                Guest Reviews & Experiences
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-[#777b70] dark:text-[#9ea8a1]">
                Read verified impressions from fellow travelers across our retreats, heritage havelis, and tranquil mountain chalets.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsFeedbackModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#244b38] px-6 py-3 text-xs font-semibold uppercase tracking-[1.2px] text-white shadow-md transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#28b881]"
            >
              <span>✎</span> Write a Review / Share Feedback
            </button>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded-2xl border border-[#e5e1d7] bg-white p-6 shadow-xs transition hover:shadow-lg dark:border-[#2a3c30] dark:bg-[#152019]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex text-amber-500 text-sm">
                      {"★".repeat(t.rating)}
                    </span>
                    <span className="rounded-full bg-[#edf3ec] px-2.5 py-0.5 text-[10px] font-semibold text-[#244b38] dark:bg-[#1f3025] dark:text-[#34d399]">
                      {t.badge}
                    </span>
                  </div>

                  <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-[#b18a57] dark:text-[#e6c587]">
                    📍 {t.hotelStayed}
                  </p>

                  <p className="mt-3 text-xs leading-6 text-[#52574e] dark:text-[#b4beb7]">
                    "{t.comment}"
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-3 border-t border-[#f0eee9] pt-4 dark:border-[#2a3c30]">
                  <img
                    src={t.avatar}
                    alt={t.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#244b38]/10 dark:ring-[#34d399]/20"
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                      {t.name}
                    </h4>
                    <p className="text-[10px] text-[#85877f] dark:text-[#9ea8a1]">
                      {t.location} • {t.date}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CLOSING BANNER */}
      <section className="px-4 pb-6 sm:px-6 lg:px-10">
        <div className="relative mx-auto max-w-[1600px] overflow-hidden rounded-3xl bg-[#244b38] px-6 py-16 text-center text-white shadow-2xl sm:px-12 sm:py-24 dark:bg-[#16271e]">
          <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-12 h-72 w-72 rounded-full border border-white/10" />

          <div className="relative mx-auto max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[2.5px] text-[#e4cba4]">
              Your next chapter awaits
            </p>
            <h2 className="mt-4 font-serif text-4xl font-normal leading-tight sm:text-5xl">
              Make room for somewhere new.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/80">
              A different view. A slower morning. A memory you will carry
              home. It all begins with finding the right place.
            </p>
            <button
              onClick={() => navigate("/search")}
              className="mt-8 inline-flex items-center gap-3 rounded-xl bg-[#f4eee2] px-8 py-4 text-xs font-semibold uppercase tracking-[1.5px] text-[#244b38] shadow-lg transition hover:bg-white hover:shadow-xl"
            >
              Explore all stays <ArrowIcon />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-16 bg-[#16291f] text-white dark:bg-[#080d0a]">
        <div className="mx-auto max-w-[1440px] px-6 pb-10 pt-14 sm:px-10 lg:px-14 lg:pt-16">
          <div className="grid gap-10 border-b border-white/15 pb-12 lg:grid-cols-[1fr_0.8fr] lg:gap-20">
            <div>
              <a href="/" className="inline-flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3eee3] font-serif text-xl font-bold text-[#19372b]">
                  S
                </span>
                <span>
                  <span className="block font-serif text-2xl tracking-tight">
                    StayEase<span className="text-[#c9a978]">.</span>
                  </span>
                  <span className="mt-1 block text-[9px] uppercase tracking-[2px] text-white/60">
                    Luxury Stays & Experiences
                  </span>
                </span>
              </a>

              <p className="mt-5 max-w-md text-sm leading-7 text-white/70">
                Discover distinctive stays, inspiring destinations and spaces
                that make every journey memorable. Your next getaway starts here.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate("/search")}
                  className="rounded-xl bg-[#e7d4b2] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[#19372b] transition hover:bg-white"
                >
                  Explore Stays →
                </button>
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="lg:justify-self-end lg:w-full lg:max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[2px] text-[#e1c69a]">
                A little travel inspiration
              </p>
              <h3 className="mt-2 font-serif text-2xl">
                Your next favourite place, in your inbox.
              </h3>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Join our private community for member discounts and curated hideaways.
              </p>

              <form className="mt-5 flex gap-2" onSubmit={handleNewsletter}>
                <input
                  type="email"
                  required
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none placeholder:text-white/45 focus:border-[#e1c69a]"
                />
                <button
                  type="submit"
                  aria-label="Subscribe to newsletter"
                  className="rounded-xl bg-[#e7d4b2] px-5 text-sm font-semibold text-[#19372b] transition hover:bg-white"
                >
                  Join
                </button>
              </form>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 lg:grid-cols-4">
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#e1c69a]">
                Discover
              </h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                <button onClick={() => navigate("/search")} className="text-left transition hover:text-white">
                  Find a stay
                </button>
                <a href="#featured-stays" className="transition hover:text-white">
                  Featured stays
                </a>
                <a href="#destinations" className="transition hover:text-white">
                  Destinations
                </a>
                <a href="#booking-search" className="transition hover:text-white">
                  Plan your trip
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#e1c69a]">
                Popular Destinations
              </h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                {["Goa", "Udaipur", "Manali", "Jaipur", "Kerala"].map((place) => (
                  <button
                    key={place}
                    onClick={() =>
                      navigate(`/search?${new URLSearchParams({ city: place })}`)
                    }
                    className="text-left transition hover:text-white"
                  >
                    Stays in {place}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#e1c69a]">
                Guest Support
              </h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                <a href="mailto:support@stayease.com" className="transition hover:text-white">
                  24/7 Concierge Support
                </a>
                <a href="#booking-search" className="transition hover:text-white">
                  Booking Assistance
                </a>
                <button onClick={() => navigate("/profile")} className="text-left transition hover:text-white">
                  My Reservations
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-[1.7px] text-[#e1c69a]">
                Experiences
              </h4>
              <div className="mt-4 flex flex-col gap-3 text-sm text-white/70">
                <span>✦ Private Pool Villas</span>
                <span>✦ Heritage Haveli Stays</span>
                <span>✦ Himalayan Chalets</span>
                <span>✦ Wellness Spa Retreats</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/55">
              © {new Date().getFullYear()} StayEase Luxury Stays. All rights reserved.
            </p>

            <p className="text-xs tracking-wide text-white/55">
              Thoughtful stays. Meaningful journeys.
            </p>

            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="w-fit text-xs text-white/75 transition hover:text-white"
            >
              Back to top ↑
            </button>
          </div>
        </div>
      </footer>

      {/* Quick View Modal */}
      <QuickViewModal
        hotel={quickViewHotel}
        isOpen={Boolean(quickViewHotel)}
        onClose={() => setQuickViewHotel(null)}
        onNotify={onNotify}
      />

      {/* Guest Feedback & Review Modal */}
      {isFeedbackModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsFeedbackModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl border border-[#e5e1d7] bg-white p-6 shadow-2xl transition sm:p-8 dark:border-[#2a3c30] dark:bg-[#152019]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7859] dark:text-[#e6c587]">
                  Guest Feedback
                </p>
                <h3 className="mt-1 font-serif text-2xl font-medium text-[#244b38] dark:text-[#f0f4f0]">
                  Share Your Travel Story
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-[#777b70] hover:bg-[#eeece6] dark:hover:bg-[#2a3c30] dark:text-[#a0aca3]"
                aria-label="Close feedback modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={feedbackForm.name}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g. Ananya Sen"
                  className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3.5 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                    Your City / Region
                  </label>
                  <input
                    type="text"
                    value={feedbackForm.location}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="e.g. Mumbai, India"
                    className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3.5 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                    Star Rating
                  </label>
                  <select
                    value={feedbackForm.rating}
                    onChange={(e) =>
                      setFeedbackForm((prev) => ({ ...prev, rating: Number(e.target.value) }))
                    }
                    className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                  >
                    <option value={5}>★★★★★ (5 - Exceptional)</option>
                    <option value={4}>★★★★☆ (4 - Very Good)</option>
                    <option value={3}>★★★☆☆ (3 - Average)</option>
                    <option value={2}>★★☆☆☆ (2 - Below Expectations)</option>
                    <option value={1}>★☆☆☆☆ (1 - Poor)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  Hotel / Destination Visited
                </label>
                <input
                  type="text"
                  value={feedbackForm.hotelStayed}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({ ...prev, hotelStayed: e.target.value }))
                  }
                  placeholder="e.g. Ganges Heritage Haveli, Varanasi"
                  className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3.5 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#24402f] dark:text-[#f0f4f0]">
                  Your Experience & Review *
                </label>
                <textarea
                  rows={4}
                  required
                  value={feedbackForm.comment}
                  onChange={(e) =>
                    setFeedbackForm((prev) => ({ ...prev, comment: e.target.value }))
                  }
                  placeholder="Tell future travelers about the ambiance, views, check-in timings, staff warmth, and stay comfort..."
                  className="mt-1 w-full rounded-xl border border-[#e5e1d7] bg-[#fcfbf8] px-3.5 py-2.5 text-xs outline-none focus:border-[#244b38] dark:border-[#2a3c30] dark:bg-[#111914] dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="rounded-xl border border-[#e5e1d7] px-4 py-2.5 text-xs font-medium text-[#686f66] hover:bg-[#f6f4ee] dark:border-[#2a3c30] dark:text-[#a0aca3]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#244b38] px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#183728] dark:bg-[#34d399] dark:text-[#0c120e] dark:hover:bg-[#2cb884]"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
