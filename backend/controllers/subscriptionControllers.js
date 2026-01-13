import User from '../models/User.js';

// Helper to get child limit based on plan
const getChildrenLimitForPlan = (plan) => {
  switch (plan) {
    case 'free_trial': // NEW
      return 1;
    case 'one_child':
      return 1;
    case 'family':
      return 5;
    case 'school':
      return 50; // Example large number
    case 'enterprise':
      return 100; // Example very large number
    default:
      return 0; // 'none' or invalid plan
  }
};

// Activate a subscription (simplified - no actual payment gateway integration here)
export const activateSubscription = async (req, res) => {
  const { parentId } = req.params;
  // Destructure the new trial fields from the request body
  const { plan, isTrial = false, startDate, endDate } = req.body;

  if (!plan) {
    return res.status(400).json({ error: "Subscription plan is required." });
  }

  try {
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: "Parent not found." });
    }

    // --- NEW: Check for an existing trial ---
    // This assumes your User model has an `isTrial` field and it's set to true
    // the first time they start a trial.
    if (plan === 'free_trial' && parent.subscription.plan === 'free_trial') {
        return res.status(400).json({ error: "You have already used your free trial." });
    }

    // Simulate payment success here
    const paymentSuccessful = (plan === 'free_trial' || true); // Free trial always "succeeds"

    if (paymentSuccessful) {
      const childrenLimit = getChildrenLimitForPlan(plan);
      const now = new Date();
      let subscriptionEndDate;

      if (plan === 'free_trial') {
        // Set end date to 7 days from now
        subscriptionEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7);
      } else {
        // For paid plans, default to 30 days or handle it as you see fit
        subscriptionEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
      }

      // Reset subscription fields to avoid inconsistencies
      parent.subscription.plan = plan;
      parent.subscription.status = 'active';
      parent.subscription.startDate = now;
      parent.subscription.endDate = subscriptionEndDate;
      parent.subscription.childrenLimit = childrenLimit;
      parent.subscription.isTrial = (plan === 'free_trial'); // Set isTrial flag

      await parent.save();

      res.status(200).json({
        message: `Subscription for ${plan} activated successfully!`,
        subscription: parent.subscription,
      });
    } else {
      res.status(400).json({ error: "Payment failed. Please try again." });
    }

  } catch (error) {
    console.error("Error activating subscription:", error);
    res.status(500).json({ error: "Internal server error during subscription activation." });
  }
};

// Get parent's subscription status
export const getSubscriptionStatus = async (req, res) => {
  const { parentId } = req.params;

  try {
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: "Parent not found." });
    }

    // --- NEW: Check for expired trial ---
    if (parent.subscription.isTrial && parent.subscription.endDate && parent.subscription.endDate < new Date()) {
      // Trial has expired, update subscription status to 'inactive'
      parent.subscription.status = 'inactive';
      parent.subscription.plan = 'none';
      parent.subscription.isTrial = false;
      parent.subscription.childrenLimit = 0;
      await parent.save();
      // Send the updated inactive subscription
      return res.status(200).json({ subscription: parent.subscription });
    }

    res.status(200).json({ subscription: parent.subscription });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ error: "Internal server error fetching subscription status." });
  }
};