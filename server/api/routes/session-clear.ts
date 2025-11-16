import { Router, Request, Response } from 'express';
import { storage } from '../../storage';

const router = Router();

/**
 * Development endpoint to completely clear sessions and force logout
 * This allows testing of new user flows and welcome screens
 */
router.post('/clear-all-sessions', async (req: Request, res: Response) => {
  try {
    console.log('[session-clear] Starting complete session cleanup...');
    
    // Clear the current session if it exists
    if (req.session) {
      const sessionId = req.sessionID;
      console.log(`[session-clear] Destroying session: ${sessionId}`);
      
      req.session.destroy((err) => {
        if (err) {
          console.error('[session-clear] Session destruction error:', err);
        }
      });
    }
    
    // Clear all cookies
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      secure: false, // Development mode
      sameSite: 'lax' as const
    };
    
    res.clearCookie('connect.sid', cookieOptions);
    res.clearCookie('session', cookieOptions);
    res.clearCookie('sessionId', cookieOptions);
    res.clearCookie('connect.sid');
    res.clearCookie('session');
    
    // Set headers to prevent caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    console.log('[session-clear] Session cleanup completed successfully');
    
    res.json({
      success: true,
      message: 'All sessions cleared successfully',
      instructions: [
        'Refresh your browser to see the authentication page',
        'Clear browser cache if auto-login persists',
        'Use incognito mode for clean testing'
      ]
    });
    
  } catch (error) {
    console.error('[session-clear] Error during session cleanup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear sessions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Development endpoint to check authentication status
 */
router.get('/auth-status', (req: Request, res: Response) => {
  const isAuthenticated = req.isAuthenticated();
  const user = req.user;
  const sessionId = req.sessionID;
  
  res.json({
    isAuthenticated,
    user: user ? { id: user.id, username: user.username } : null,
    sessionId,
    cookies: req.headers.cookie || 'No cookies',
    timestamp: new Date().toISOString()
  });
});

export default router;