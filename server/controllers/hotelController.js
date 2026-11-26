import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";

/**
 * Get all hotels with search and filtering – MongoDB Atlas only.
 * GET /api/hotels
 */
export async function getHotels(req, res, next) {
  try {
    const { city, q, minPrice, maxPrice, sort } = req.query;

    const filter = { isActive: true };

    if (city) {
      filter.$or = [
        { city: { $regex: new RegExp(`^${city}$`, "i") } },
        { "location.city": { $regex: new RegExp(`^${city}$`, "i") } },
      ];
    }

    if (q) {
      const regex = new RegExp(q, "i");
      const textFilter = {
        $or: [
          { name: regex },
          { city: regex },
          { "location.address": regex },
          { "location.city": regex },
          { description: regex },
        ],
      };
      // Merge with existing $or for city
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, textFilter];
        delete filter.$or;
      } else {
        Object.assign(filter, textFilter);
      }
    }

    if (minPrice) filter.price = { ...(filter.price || {}), $gte: Number(minPrice) };
    if (maxPrice) filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };

    let sortOption = {};
    if (sort === "price_asc")  sortOption = { price: 1 };
    else if (sort === "price_desc") sortOption = { price: -1 };
    else if (sort === "rating")     sortOption = { rating: -1 };
    else                            sortOption = { createdAt: -1 };

    const hotels = await Hotel.find(filter).sort(sortOption).lean();

    return res.status(200).json({
      success: true,
      count: hotels.length,
      hotels,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single hotel by ID (MongoDB ObjectId or legacyId)
 * GET /api/hotels/:id
 */
export async function getHotelById(req, res, next) {
  try {
    const { id } = req.params;
    let hotel = null;

    if (/^[0-9a-fA-F]{24}$/.test(id)) {
      hotel = await Hotel.findById(id).lean();
    }
    if (!hotel) {
      const numId = Number(id);
      if (!isNaN(numId)) {
        hotel = await Hotel.findOne({ legacyId: numId }).lean();
      }
    }

    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel with ID ${id} was not found.`,
      });
    }

    return res.status(200).json({ success: true, hotel });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new hotel
 * POST /api/hotels
 */
export async function createHotel(req, res, next) {
  try {
    const { name, city, location, price, rating, image, amenities, description } = req.body;

    if (!name || !city || !price) {
      return res.status(400).json({
        success: false,
        message: "Hotel name, city, and price per night are required.",
      });
    }

    const hotel = new Hotel({
      name:        name.trim(),
      city:        city.trim(),
      location: {
        address: (location || `${city}, India`).trim(),
        city:    city.trim(),
        country: "India",
      },
      price:       Number(price),
      rating:      Number(rating) || 4.5,
      starRating:  Math.round(Number(rating) || 4),
      image:       image || "",
      images:      image ? [image] : [],
      amenities:   Array.isArray(amenities) ? amenities : ["Free Wi-Fi", "Restaurant", "Room Service"],
      description: description || `Experience comfortable luxury at ${name} in ${city}.`,
      ownerId:     req.user?._id || req.user?.id,
      approvalStatus: "pending",
      isActive: true,
    });

    await hotel.save();

    return res.status(201).json({
      success: true,
      message: "Hotel created successfully.",
      hotel: hotel.toObject(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing hotel
 * PUT /api/hotels/:id
 */
export async function updateHotel(req, res, next) {
  try {
    const { id } = req.params;

    let filter = /^[0-9a-fA-F]{24}$/.test(id)
      ? { _id: id }
      : { legacyId: Number(id) };

    const existing = await Hotel.findOne(filter);
    if (!existing) {
      return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
    }

    const updated = await Hotel.findOneAndUpdate(
      filter,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({ success: true, message: "Hotel updated successfully.", hotel: updated });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a hotel
 * DELETE /api/hotels/:id
 */
export async function deleteHotel(req, res, next) {
  try {
    const { id } = req.params;

    let filter = /^[0-9a-fA-F]{24}$/.test(id)
      ? { _id: id }
      : { legacyId: Number(id) };

    const deleted = await Hotel.findOneAndDelete(filter).lean();

    if (!deleted) {
      return res.status(404).json({ success: false, message: `Hotel with ID ${id} not found.` });
    }

    return res.status(200).json({ success: true, message: "Hotel deleted successfully.", deletedHotel: deleted });
  } catch (error) {
    next(error);
  }
}
