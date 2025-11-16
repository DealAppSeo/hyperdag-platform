import { Router } from 'express';
import { db } from '../db';
import { organizations, type Organization, type InsertOrganization } from '@shared/schema';
import { eq, desc } from 'drizzle-orm';
import { ensureAuthenticated as requireAuth } from '../middleware/auth';

const router = Router();

// Register a new organization
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { name, type, taxId, website, description, mission, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization name and email are required' 
      });
    }

    // Check if organization already exists
    const existingOrg = await db.select()
      .from(organizations)
      .where(eq(organizations.email, email))
      .limit(1);

    if (existingOrg.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Organization with this email already exists'
      });
    }

    // Create new organization
    const [newOrg] = await db.insert(organizations).values({
      name,
      type: type || 'non-profit',
      taxId,
      website,
      description,
      mission,
      email,
      verified: false, // Starts as unverified
      reputationScore: 0
    }).returning();

    res.json({
      success: true,
      data: newOrg,
      message: 'Organization registered successfully and pending verification'
    });

  } catch (error) {
    console.error('Error registering organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register organization'
    });
  }
});

// Get all organizations
router.get('/', async (req, res) => {
  try {
    const orgs = await db.select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt));

    res.json({
      success: true,
      data: orgs
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organizations'
    });
  }
});

// Get organization by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [org] = await db.select()
      .from(organizations)
      .where(eq(organizations.id, parseInt(id)))
      .limit(1);

    if (!org) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    res.json({
      success: true,
      data: org
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch organization'
    });
  }
});

export default router;