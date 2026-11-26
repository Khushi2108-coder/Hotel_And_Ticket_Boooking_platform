import express from 'express';
const router = express.Router();

// Placeholder implementation – to be replaced with actual availability routes
router.all('*', (req, res) => {
  res.status(501).json({ success: false, message: 'Availability routes not implemented yet.' });
});

export default router;
