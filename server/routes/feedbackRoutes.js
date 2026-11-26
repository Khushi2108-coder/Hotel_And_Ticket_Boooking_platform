import { Router } from "express";
import { getFeedbacks, createFeedback } from "../controllers/feedbackController.js";
import { optionalAuth } from "../middleware/authMiddleware.js";

const router = Router();

// GET /api/feedback (Public - visible to all users)
router.get("/", getFeedbacks);

// POST /api/feedback (Attach user info if signed in)
router.post("/", optionalAuth, createFeedback);

export default router;
