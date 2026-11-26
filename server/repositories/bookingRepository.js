import Booking from "../models/Booking.js";

/**
 * BookingRepository – MongoDB Atlas ONLY. No JSON fallback.
 */
export class BookingRepository {
  async findById(id) {
    if (!id) return null;
    let booking = null;
    if (/^[0-9a-fA-F]{24}$/.test(String(id))) {
      booking = await Booking.findById(id).lean();
    }
    if (!booking) {
      booking = await Booking.findOne({ legacyId: String(id) }).lean();
    }
    return booking;
  }

  async findByReference(reference) {
    if (!reference) return null;
    return Booking.findOne({ reference: reference.toUpperCase().trim() }).lean();
  }

  async findByUserId(userId, userEmail) {
    const orConditions = [];
    if (userId && /^[0-9a-fA-F]{24}$/.test(String(userId))) {
      orConditions.push({ userId });
    }
    if (userId) {
      orConditions.push({ userId: String(userId) });
    }
    if (userEmail) {
      orConditions.push({ "guestDetails.email": userEmail.toLowerCase() });
    }
    if (orConditions.length === 0) return [];
    return Booking.find({ $or: orConditions }).sort({ createdAt: -1 }).lean();
  }

  async find(filterOrPredicate) {
    if (typeof filterOrPredicate === "function") {
      const bookings = await Booking.find().lean();
      return bookings.filter(filterOrPredicate);
    }
    return Booking.find(filterOrPredicate || {}).sort({ createdAt: -1 }).lean();
  }

  async create(bookingData) {
    const booking = new Booking(bookingData);
    await booking.save();
    return booking.toObject();
  }

  async updateById(id, updateData) {
    let filter = /^[0-9a-fA-F]{24}$/.test(String(id))
      ? { _id: id }
      : { legacyId: String(id) };
    return Booking.findOneAndUpdate(filter, { $set: updateData }, { new: true, runValidators: true }).lean();
  }

  async deleteById(id) {
    let filter = /^[0-9a-fA-F]{24}$/.test(String(id))
      ? { _id: id }
      : { legacyId: String(id) };
    return Booking.findOneAndDelete(filter).lean();
  }

  async count(filter = {}) {
    return Booking.countDocuments(filter);
  }
}

export const bookingRepository = new BookingRepository();
export default bookingRepository;
