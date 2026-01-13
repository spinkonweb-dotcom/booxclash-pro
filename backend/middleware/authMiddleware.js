import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // Adjust the path to your user model


/**
 * @description Middleware to protect routes by verifying JWT.
 * It checks for a valid token in the Authorization header, verifies it,
 * and attaches the user's data (excluding password) to the request object.
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the database using the ID from the token.
      // This is crucial to ensure the user still exists and to get the most up-to-date user info (like their role).
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({ error: 'Not authorized, user not found' });
      }

      // Attach the user object to the request for use in subsequent middleware/controllers
      req.user = user;

      next(); // Proceed to the next middleware or the route handler
    } catch (error) {
      console.error('Authentication error (token failed):', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token provided' });
  }
};

/**
 * @description Middleware for role-based authorization.
 * @param {...string} roles - A list of roles that are allowed to access the route.
 * @returns A middleware function that checks if the authenticated user's role is in the allowed list.
 *
 * @example
 * // Allow only 'superadmin'
 * router.get('/superadmin-data', protect, authorize('superadmin'), getSuperAdminData);
 *
 * @example
 * // Allow 'superadmin' OR 'admin'
 * router.get('/admin-data', protect, authorize('superadmin', 'admin'), getAdminData);
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      // This should technically not happen if 'protect' middleware runs first
      return res.status(403).json({ error: 'Not authorized, user role not found.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden. User with role '${req.user.role}' is not authorized to access this route.`,
      });
    }

    next(); // User has one of the required roles, proceed.
  };
};
