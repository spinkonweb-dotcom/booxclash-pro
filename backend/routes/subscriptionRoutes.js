// routes/subscriptionRoutes.js

import express from 'express';
import { activateSubscription, getSubscriptionStatus } from '../controllers/subscriptionControllers.js';
// import { verifyToken } from '../middleware/authMiddleware.js'; // Optional: add auth middleware

const router = express.Router();

// Route to activate a subscription
router.post('/:parentId/activate', activateSubscription); // You might want to add verifyToken here

// Route to get subscription status
router.get('/:parentId/status', getSubscriptionStatus); // And here

export default router;