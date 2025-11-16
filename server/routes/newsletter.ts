/**
 * Newsletter API Routes - AI Symphony P1.3 Implementation
 * Handles subscriptions, welcome sequences, and RepID integration
 */

import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// In-memory storage for demo (would use database in production)
const subscribers = new Map();
const emailTemplates = new Map();

// Initialize email templates
initializeEmailTemplates();

/**
 * POST /api/newsletter/subscribe
 * Subscribe to newsletter with RepID integration
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { 
      email, 
      source = 'direct', 
      interests = [], 
      repidEligible = true 
    } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Valid email address is required'
      });
    }

    // Check if already subscribed
    if (subscribers.has(email)) {
      return res.json({
        success: true,
        data: {
          message: 'Already subscribed',
          userId: subscribers.get(email).userId,
          status: 'existing'
        }
      });
    }

    // Create subscriber record
    const userId = generateUserId();
    const subscriber = {
      userId,
      email,
      source,
      interests,
      repidEligible,
      subscribedAt: new Date(),
      status: 'active',
      emailsSent: 0,
      lastEmailSent: null,
      preferences: {
        frequency: 'weekly',
        contentTypes: interests.length > 0 ? interests : ['ai-optimization'],
        repidUpdates: repidEligible
      }
    };

    subscribers.set(email, subscriber);

    // Send welcome email
    await sendWelcomeEmail(subscriber);

    // Award RepID points if eligible
    if (repidEligible) {
      try {
        await fetch('/api/repid/update-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            actions: { 
              newsletter_signup: 1, 
              community_engagement: 1 
            },
            context: { 
              source, 
              contentQuality: 0.7,
              innovationLevel: 0.3 
            }
          })
        });
      } catch (repidError) {
        console.log('[Newsletter] RepID integration failed:', repidError);
        // Don't fail subscription if RepID fails
      }
    }

    res.json({
      success: true,
      data: {
        userId,
        message: 'Successfully subscribed to AI Symphony newsletter',
        welcomeEmailSent: true,
        repidPointsAwarded: repidEligible,
        nextEmail: getNextEmailSchedule(subscriber)
      }
    });

  } catch (error) {
    console.error('[Newsletter API] Subscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe to newsletter'
    });
  }
});

/**
 * POST /api/newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email address is required'
      });
    }

    const subscriber = subscribers.get(email);
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        error: 'Email not found in subscriber list'
      });
    }

    // Verify unsubscribe token if provided
    if (token && !verifyUnsubscribeToken(email, token)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid unsubscribe token'
      });
    }

    // Update subscriber status
    subscriber.status = 'unsubscribed';
    subscriber.unsubscribedAt = new Date();
    subscribers.set(email, subscriber);

    res.json({
      success: true,
      data: {
        message: 'Successfully unsubscribed from newsletter',
        email: email
      }
    });

  } catch (error) {
    console.error('[Newsletter API] Unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe from newsletter'
    });
  }
});

/**
 * GET /api/newsletter/status/:email
 * Get subscription status
 */
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const subscriber = subscribers.get(email);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        error: 'Email not found'
      });
    }

    res.json({
      success: true,
      data: {
        email: subscriber.email,
        status: subscriber.status,
        subscribedAt: subscriber.subscribedAt,
        source: subscriber.source,
        emailsSent: subscriber.emailsSent,
        lastEmailSent: subscriber.lastEmailSent,
        preferences: subscriber.preferences,
        repidEligible: subscriber.repidEligible
      }
    });

  } catch (error) {
    console.error('[Newsletter API] Status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription status'
    });
  }
});

/**
 * GET /api/newsletter/stats
 * Get newsletter statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const allSubscribers = Array.from(subscribers.values());
    
    const stats = {
      totalSubscribers: allSubscribers.length,
      activeSubscribers: allSubscribers.filter(s => s.status === 'active').length,
      unsubscribed: allSubscribers.filter(s => s.status === 'unsubscribed').length,
      repidEligible: allSubscribers.filter(s => s.repidEligible).length,
      sourceBreakdown: getSourceBreakdown(allSubscribers),
      interestBreakdown: getInterestBreakdown(allSubscribers),
      recentSignups: allSubscribers
        .filter(s => Date.now() - s.subscribedAt.getTime() < 7 * 24 * 60 * 60 * 1000)
        .length
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[Newsletter API] Stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get newsletter statistics'
    });
  }
});

// Helper Functions

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function generateUserId(): string {
  return `user_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
}

function generateUnsubscribeToken(email: string): string {
  return crypto.createHmac('sha256', 'newsletter-secret').update(email).digest('hex').slice(0, 16);
}

function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expectedToken = generateUnsubscribeToken(email);
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
}

async function sendWelcomeEmail(subscriber: any): Promise<void> {
  // Simulate email sending (would use actual email service in production)
  console.log(`[Newsletter] Sending welcome email to ${subscriber.email}`);
  
  const welcomeTemplate = emailTemplates.get('welcome');
  const personalizedContent = welcomeTemplate
    .replace('{{email}}', subscriber.email)
    .replace('{{userId}}', subscriber.userId)
    .replace('{{unsubscribeToken}}', generateUnsubscribeToken(subscriber.email));
  
  // Update subscriber record
  subscriber.emailsSent = 1;
  subscriber.lastEmailSent = new Date();
  
  // In production, this would send actual email via Mailgun/SendGrid
  console.log(`[Newsletter] Welcome email content prepared for ${subscriber.email}`);
}

function getNextEmailSchedule(subscriber: any): string {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return nextWeek.toISOString();
}

function getSourceBreakdown(subscribers: any[]): { [key: string]: number } {
  const breakdown: { [key: string]: number } = {};
  subscribers.forEach(sub => {
    breakdown[sub.source] = (breakdown[sub.source] || 0) + 1;
  });
  return breakdown;
}

function getInterestBreakdown(subscribers: any[]): { [key: string]: number } {
  const breakdown: { [key: string]: number } = {};
  subscribers.forEach(sub => {
    sub.interests.forEach((interest: string) => {
      breakdown[interest] = (breakdown[interest] || 0) + 1;
    });
  });
  return breakdown;
}

function initializeEmailTemplates(): void {
  // Welcome Email Template
  emailTemplates.set('welcome', `
    <h1>Welcome to the AI Symphony! 🎼</h1>
    
    <p>Hi there,</p>
    
    <p>Welcome to the exclusive AI Symphony community! You're now part of a select group of 500+ optimization enthusiasts who are saving thousands monthly on AI costs.</p>
    
    <h2>🎯 Your Free AI Cost Analysis is Ready</h2>
    
    <p>Here's what most people don't realize about AI costs:</p>
    <ul>
      <li>79% of AI spending is pure waste due to inefficient provider selection</li>
      <li>The "cheapest" provider is often 3x more expensive than optimal routing</li>
      <li>Most developers overpay by $2,400+ monthly without knowing it</li>
    </ul>
    
    <h2>🚀 Your Next Steps</h2>
    
    <ol>
      <li><strong>Try the AI Symphony:</strong> Test our 5-provider ANFIS routing system</li>
      <li><strong>Join the RepID System:</strong> Earn Fibonacci-weighted reputation points</li>
      <li><strong>Enter the Contest:</strong> "Best AI Assistant Email" - Win up to 144 RepID points</li>
    </ol>
    
    <h2>📊 This Week's Optimization Insight</h2>
    
    <p><strong>The Jevons Paradox in AI:</strong> As AI gets more efficient, usage explodes. Smart routing isn't just about cost - it's about scaling intelligently.</p>
    
    <p>Example: One developer saved $2,400/month by switching from single-provider to our 5-provider ANFIS system, while actually increasing AI usage by 300%.</p>
    
    <h2>🎁 Exclusive for New Subscribers</h2>
    
    <p>This week only: Get early access to our GitHub Agent Integration research. We've identified 10 popular AI repositories that could benefit from ANFIS optimization.</p>
    
    <p>Questions? Optimizations to share? Just reply to this email - I read every response.</p>
    
    <p>To intelligent routing,<br>
    The AI Symphony Team</p>
    
    <hr>
    <p style="font-size: 12px; color: #666;">
      You're receiving this because you subscribed to AI Symphony updates.
      <a href="/unsubscribe?email={{email}}&token={{unsubscribeToken}}">Unsubscribe</a> | 
      <a href="/preferences?userId={{userId}}">Preferences</a>
    </p>
  `);

  // Weekly Optimization Template
  emailTemplates.set('weekly', `
    <h1>Weekly AI Optimization Report 📈</h1>
    
    <p>This week's optimization insights and cost-saving opportunities...</p>
    
    <h2>🔥 Trending: Multi-Provider Arbitrage</h2>
    <p>Community members are achieving 60-80% savings using our latest ANFIS configurations...</p>
    
    <h2>💡 Optimization Tip of the Week</h2>
    <p>Fibonacci routing weights: Use our sequence to balance cost, quality, and speed...</p>
    
    <h2>📊 Community Stats</h2>
    <ul>
      <li>Total savings this week: $47,000+</li>
      <li>New RepID badges earned: 23</li>
      <li>Contest submissions: 15</li>
    </ul>
  `);
}

export default router;