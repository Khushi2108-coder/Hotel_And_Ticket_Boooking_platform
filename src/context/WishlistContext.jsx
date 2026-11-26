import { createContext, useContext, useEffect, useState } from "react";
import { hotels as allHotels } from "../data/hotels";

const WishlistContext = createContext(null);

export function WishlistProvider({ children, onNotify }) {
  const [favoriteIds, setFavoriteIds] = useState(() => {
    try {
      const saved = localStorage.getItem("stayease-wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("stayease-wishlist", JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const isFavorite = (hotelId) => {
    return favoriteIds.includes(Number(hotelId));
  };

  const toggleFavorite = (hotel, event) => {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    const id = Number(hotel.id);
    const exists = favoriteIds.includes(id);

    if (exists) {
      setFavoriteIds((prev) => prev.filter((item) => item !== id));
      if (onNotify) {
        onNotify({
          type: "info",
          title: "Removed from Wishlist",
          message: `${hotel.name} was removed from your saved stays.`,
        });
      }
    } else {
      setFavoriteIds((prev) => [...prev, id]);
      if (onNotify) {
        onNotify({
          type: "success",
          title: "Saved to Wishlist ❤️",
          message: `${hotel.name} was added to your saved collection.`,
        });
      }
    }
  };

  const removeFavorite = (hotelId) => {
    setFavoriteIds((prev) => prev.filter((id) => id !== Number(hotelId)));
  };

  const clearWishlist = () => {
    setFavoriteIds([]);
  };

  // Find full hotel objects for favorited IDs
  const favoriteHotels = favoriteIds
    .map((id) => allHotels.find((h) => h.id === id))
    .filter(Boolean);

  return (
    <WishlistContext.Provider
      value={{
        favoriteIds,
        favoriteHotels,
        favoritesCount: favoriteIds.length,
        isFavorite,
        toggleFavorite,
        removeFavorite,
        clearWishlist,
        isWishlistOpen,
        setIsWishlistOpen,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
