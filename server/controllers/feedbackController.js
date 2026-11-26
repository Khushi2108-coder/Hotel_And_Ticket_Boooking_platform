import { feedbackRepository } from "../repositories/feedbackRepository.js";

const initialTestimonials = [
  {
    id: "fb_1",
    name: "Aanya Singhania",
    location: "Mumbai",
    rating: 5,
    hotelStayed: "Coastal Palm Retreat, Goa",
    comment: "The candle-lit cabana dinner at sunset was truly unmatched. Impeccable concierge attention throughout our entire weekend escape.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    date: "November 2026",
    badge: "Verified Guest",
    createdAt: new Date("2026-11-10").toISOString(),
  },
  {
    id: "fb_2",
    name: "Vikramaditya Roy",
    location: "Bengaluru",
    rating: 5,
    hotelStayed: "Lakeview Heritage Palace, Udaipur",
    comment: "Waking up to shimmering lake waters while savoring authentic Rajasthani breakfast felt like living in royal poetry. Exquisite.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    date: "October 2026",
    badge: "Platinum Member",
    createdAt: new Date("2026-10-22").toISOString(),
  },
  {
    id: "fb_3",
    name: "Devika & Rohan Nair",
    location: "New Delhi",
    rating: 5,
    hotelStayed: "Himalayan Pine Chalet, Manali",
    comment: "The cedar wood scent, crackling fireplace, and mountain views made our honeymoon unforgettable. StayEase made it effortless.",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    date: "September 2026",
    badge: "Verified Guest",
    createdAt: new Date("2026-09-18").toISOString(),
  },
  {
    id: "fb_4",
    name: "Dr. K. S. Mehra",
    location: "Chandigarh",
    rating: 5,
    hotelStayed: "Emerald Tea Estate Bungalow, Munnar",
    comment: "Morning walks through misty slopes followed by custom spa rituals. Pristine, private, and rejuvenating in every single way.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    date: "August 2026",
    badge: "Verified Guest",
    createdAt: new Date("2026-08-05").toISOString(),
  },
];

/**
 * Get all public feedbacks / testimonials
 * GET /api/feedback
 */
export async function getFeedbacks(req, res, next) {
  try {
    let feedbacks = await feedbackRepository.find();
    if (!feedbacks || feedbacks.length === 0) {
      // Seed default testimonials
      for (const item of initialTestimonials) {
        await feedbackRepository.create(item);
      }
      feedbacks = await feedbackRepository.find();
    }

    // Sort newest first
    feedbacks.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    return res.status(200).json({
      success: true,
      count: feedbacks.length,
      feedbacks,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit public feedback / review
 * POST /api/feedback
 */
export async function createFeedback(req, res, next) {
  try {
    const { name, location, rating, hotelStayed, comment, avatar } = req.body;

    if (!name?.trim() || !comment?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name and review comment are required.",
      });
    }

    const userAvatar = avatar || req.user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80";

    const newFeedback = await feedbackRepository.create({
      name: name.trim(),
      location: location?.trim() || "India",
      rating: Number(rating) || 5,
      hotelStayed: hotelStayed?.trim() || "StayEase Luxury Retreat",
      comment: comment.trim(),
      avatar: userAvatar,
      date: "Just now",
      badge: "Verified Guest",
      userId: req.user?.id || null,
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully! It is now visible to all users.",
      feedback: newFeedback,
    });
  } catch (error) {
    next(error);
  }
}
