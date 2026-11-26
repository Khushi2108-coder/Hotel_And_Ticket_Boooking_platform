import Hotel from "../models/Hotel.js";

/**
 * HotelRepository – MongoDB Atlas ONLY. No JSON fallback.
 */
export class HotelRepository {
  async findById(id) {
    if (!id) return null;
    let hotel = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      hotel = await Hotel.findById(id).lean();
    }
    if (!hotel) {
      const numId = Number(id);
      if (!isNaN(numId)) {
        hotel = await Hotel.findOne({ legacyId: numId }).lean();
      }
    }
    return hotel;
  }

  async find(filterOrPredicate = {}) {
    if (typeof filterOrPredicate === "function") {
      const hotels = await Hotel.find({ isActive: true }).lean();
      return hotels.filter(filterOrPredicate);
    }
    const query = { isActive: true, ...filterOrPredicate };
    return Hotel.find(query).lean();
  }

  async findByCity(city) {
    if (!city) return this.find();
    return Hotel.find({
      isActive: true,
      $or: [
        { city: { $regex: new RegExp(`^${city}$`, "i") } },
        { "location.city": { $regex: new RegExp(`^${city}$`, "i") } },
      ],
    }).lean();
  }

  async findByOwnerId(ownerId) {
    return Hotel.find({ ownerId, isActive: true }).lean();
  }

  async create(hotelData) {
    const hotel = new Hotel(hotelData);
    await hotel.save();
    return hotel.toObject();
  }

  async updateById(id, updateData) {
    let filter = /^[0-9a-fA-F]{24}$/.test(String(id))
      ? { _id: id }
      : { legacyId: Number(id) };
    return Hotel.findOneAndUpdate(filter, { $set: updateData }, { new: true, runValidators: true }).lean();
  }

  async deleteById(id) {
    let filter = /^[0-9a-fA-F]{24}$/.test(String(id))
      ? { _id: id }
      : { legacyId: Number(id) };
    return Hotel.findOneAndDelete(filter).lean();
  }

  async count(filter = {}) {
    return Hotel.countDocuments(filter);
  }
}

export const hotelRepository = new HotelRepository();
export default hotelRepository;
