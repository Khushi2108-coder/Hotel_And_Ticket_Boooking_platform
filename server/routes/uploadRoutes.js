import express from 'express';
const router = express.Router();

// Placeholder implementation – to be replaced with actual upload routes
router.all('*', (req, res) => {
  res.status(501).json({ success: false, message: 'Upload routes not implemented yet.' });
});

export default router;
