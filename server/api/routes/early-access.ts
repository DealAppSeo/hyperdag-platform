import { Router } from 'express';
import { db } from '../../db';
import { earlyAccessApplications, insertEarlyAccessApplicationSchema } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Submit early access application
router.post('/apply', async (req, res) => {
  try {
    // Validate request body
    const validatedData = insertEarlyAccessApplicationSchema.parse(req.body);
    
    // Check if email already exists
    const existingApplication = await db
      .select()
      .from(earlyAccessApplications)
      .where(eq(earlyAccessApplications.email, validatedData.email))
      .limit(1);

    if (existingApplication.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists'
      });
    }

    // Insert new application
    const newApplication = await db
      .insert(earlyAccessApplications)
      .values({
        ...validatedData,
        status: 'pending'
      })
      .returning();

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        applicationId: newApplication[0].id,
        status: newApplication[0].status
      }
    });

  } catch (error) {
    console.error('Early access application error:', error);
    
    if (error instanceof Error && error.message.includes('validation')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application data',
        error: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

// Get application status (optional endpoint for users to check status)
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    const application = await db
      .select({
        id: earlyAccessApplications.id,
        status: earlyAccessApplications.status,
        createdAt: earlyAccessApplications.createdAt,
        accessLevel: earlyAccessApplications.accessLevel
      })
      .from(earlyAccessApplications)
      .where(eq(earlyAccessApplications.email, email))
      .limit(1);

    if (application.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No application found for this email'
      });
    }

    res.json({
      success: true,
      data: application[0]
    });

  } catch (error) {
    console.error('Application status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check application status'
    });
  }
});

export default router;