/**
 * CORS Configuration for PurposeHub.AI Integration
 * 
 * Allows requests from MGX/Lovable hosted PurposeHub.AI application
 */

export const PURPOSEHUB_ALLOWED_ORIGINS = [
  // PurposeHub.AI production domains
  'https://purposehub.ai',
  'https://www.purposehub.ai',
  
  // MGX/Lovable hosting domains
  'https://*.lovable.app',
  'https://*.lovableproject.com',
  'https://*.mgx.com',
  
  // Development domains
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5000',
  
  // Replit domains for testing
  'https://*.replit.dev',
  'https://*.repl.co'
];

/**
 * Check if origin is allowed for PurposeHub API access
 */
export function isPurposeHubOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  
  // Check exact matches
  if (PURPOSEHUB_ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }
  
  // Check wildcard patterns
  for (const allowedOrigin of PURPOSEHUB_ALLOWED_ORIGINS) {
    if (allowedOrigin.includes('*')) {
      const pattern = allowedOrigin.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * CORS middleware specifically for PurposeHub API endpoints
 */
export function purposeHubCorsMiddleware(req: any, res: any, next: any) {
  const origin = req.headers.origin;
  
  if (isPurposeHubOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
}
