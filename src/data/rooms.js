
export function getRoomsForHotel(hotel) {
  const basePrice = Number(hotel?.price) || 2000;

  return [
    {
      id: `${hotel.id}-standard`,
      name: "Standard Double Room",
      description: "A comfortable room for couples and solo travellers.",
      capacity: 2,
      beds: "1 double bed",
      size: "220 sq ft",
      price: basePrice,
      amenities: ["Free Wi-Fi", "Air conditioning", "Private bathroom"],
      image:
        "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: `${hotel.id}-twin`,
      name: "Twin Bed Room",
      description: "Two separate beds for friends or colleagues.",
      capacity: 2,
      beds: "2 single beds",
      size: "250 sq ft",
      price: Math.round(basePrice * 1.2),
      amenities: ["Free Wi-Fi", "Air conditioning", "Work desk"],
      image:
        "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: `${hotel.id}-triple`,
      name: "Triple Sharing Room",
      description: "Extra sleeping space for a small group or family.",
      capacity: 3,
      beds: "3 single beds",
      size: "320 sq ft",
      price: Math.round(basePrice * 1.5),
      amenities: ["Free Wi-Fi", "Air conditioning", "Private bathroom"],
      image:
        "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1000&q=80",
    },
    {
      id: `${hotel.id}-family`,
      name: "Family Suite",
      description: "A spacious suite for families and small groups.",
      capacity: 4,
      beds: "1 king bed + 1 sofa bed",
      size: "450 sq ft",
      price: Math.round(basePrice * 2),
      amenities: ["Free Wi-Fi", "Air conditioning", "Seating area", "TV"],
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80",
    },
  ];
}
