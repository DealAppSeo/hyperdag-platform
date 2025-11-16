import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_MINUTE = 60 * 1000;

// Configure different rate limiters based on security requirements
export const limiters = {
  // For standard API endpoints
  standardLimiter: rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    }
  }),

  // For authentication-related endpoints that require stricter limits
  authLimiter: rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.'
    }
  }),

  // For sensitive operations that need very strict limits
  strictLimiter: rateLimit({
    windowMs: FIVE_MINUTES,
    max: 5, // limit each IP to 5 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many attempts for this sensitive operation, please try again later.'
    }
  }),

  // For very fast operations that need frequent access
  quickLimiter: rateLimit({
    windowMs: ONE_MINUTE,
    max: 30, // limit each IP to 30 requests per minute
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Request rate exceeded, please slow down.'
    }
  }),

  // For API endpoints used by automated services
  apiLimiter: rateLimit({
    windowMs: FIFTEEN_MINUTES,
    max: 300, // limit each IP to 300 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'API rate limit exceeded, please slow down your requests.'
    }
  })
};