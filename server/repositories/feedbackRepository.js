import Feedback from "../models/Feedback.js";

/**
 * FeedbackRepository – MongoDB Atlas ONLY. No JSON fallback.
 */
export class FeedbackRepository {
  async find(filterOrPredicate) {
    if (typeof filterOrPredicate === "function") {
      const list = await Feedback.find({ isApproved: true }).sort({ createdAt: -1 }).lean();
      return list.filter(filterOrPredicate);
    }
    return Feedback.find({ isApproved: true, ...(filterOrPredicate || {}) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findAll(filter = {}) {
    return Feedback.find(filter).sort({ createdAt: -1 }).lean();
  }

  async create(feedbackData) {
    const feedback = new Feedback(feedbackData);
    await feedback.save();
    return feedback.toObject();
  }

  async updateById(id, updateData) {
    return Feedback.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
  }

  async count(filter = {}) {
    return Feedback.countDocuments(filter);
  }
}

export const feedbackRepository = new FeedbackRepository();
export default feedbackRepository;
