import { Router } from 'express';
import { db } from '../../db';
import { newsletterSubscribers } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Subscribe handler function (used by both /subscribe and /signup)
async function handleNewsletterSubscribe(req: any, res: any) {
  try {
    const { email, source, interests, repidEligible, variation, incentive } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Valid email is required'
      });
    }

    // Check if email already exists
    const existingSubscriber = await db
      .select()
      .from(newsletterSubscribers)
      .where(eq(newsletterSubscribers.email, email))
      .limit(1);

    if (existingSubscriber.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'Already subscribed!',
        data: { userId: existingSubscriber[0].id }
      });
    }

    // Insert new subscriber
    const newSubscriber = await db
      .insert(newsletterSubscribers)
      .values({
        email,
        source: source || 'landing',
        interests: interests || [],
        repidEligible: repidEligible || false,
        isActive: true,
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed!',
      data: {
        userId: newSubscriber[0].id,
        email: newSubscriber[0].email
      }
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe. Please try again.'
    });
  }
}

// Subscribe to newsletter (primary endpoint)
router.post('/subscribe', handleNewsletterSubscribe);

// Signup alias (for compatibility with landing pages)
router.post('/signup', handleNewsletterSubscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    await db
      .update(newsletterSubscribers)
      .set({ isActive: false })
      .where(eq(newsletterSubscribers.email, email));

    res.json({
      success: true,
      message: 'Successfully unsubscribed'
    });

  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
});

export default router;
