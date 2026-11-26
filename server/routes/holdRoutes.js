import express from 'express';
const router = express.Router();

// Placeholder implementation – to be replaced with actual hold routes
router.all('*', (req, res) => {
  res.status(501).json({ success: false, message: 'Hold routes not implemented yet.' });
});

export default router;
