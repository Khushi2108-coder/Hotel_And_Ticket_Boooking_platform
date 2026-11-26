import express from 'express';
const router = express.Router();

// Placeholder implementation – to be replaced with actual room routes
router.all('*', (req, res) => {
  res.status(501).json({ success: false, message: 'Room routes not implemented yet.' });
});

export default router;
