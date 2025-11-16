import { Router, Request, Response } from 'express';
import { storage } from '../../storage';
import { emailService } from '../../services/email-service';
import { sbtService } from '../../services/sbt-service';
import { v4 as uuidv4 } from 'uuid';
import { requireAuth } from '../../middleware/auth-middleware';
import { z } from 'zod';
import crypto from 'crypto';

const router = Router();

// Validation schema for nonprofit submission
const submitOrganizationSchema = z.object({
  name: z.string().min(3, "Organization name must be at least 3 characters"),
  type: z.string(),
  website: z.string().url("Please enter a valid URL"),
  email: z.string().email("Please enter a valid email address"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  mission: z.string().min(10, "Mission statement must be at least 10 characters"),
  referralCode: z.string().optional(),
});

// Submit a new nonprofit organization
router.post('/submit', async (req: Request, res: Response) => {
  try {
    // Validate submission data
    const validationResult = submitOrganizationSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false, 
        error: validationResult.error.format() 
      });
    }

    const { name, type, website, email, description, mission, referralCode } = validationResult.data;

    // Check if organization with this email already exists
    const existingOrg = await storage.getOrganizationByEmail(email);
    if (existingOrg) {
      return res.status(400).json({
        success: false,
        error: "An organization with this email address is already registered"
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create organization submission
    await storage.createOrganizationSubmission({
      name,
      type,
      website,
      email,
      description,
      mission,
      status: 'pending',
      verificationToken,
      referralCode: referralCode || null,
      submittedAt: new Date(),
      verifiedAt: null,
      approvedAt: null,
    });

    // Send verification email
    const emailSent = await emailService.sendOrganizationVerificationEmail({
      to: email,
      organizationName: name,
      verificationToken
    });

    if (!emailSent) {
      console.error(`Failed to send verification email to ${email}`);
      // Continue anyway, we've saved the submission
    }

    // Send admin notification
    await emailService.sendAdminNotification({
      subject: 'New Organization Submission',
      message: `Organization "${name}" has been submitted for verification. Website: ${website}, Email: ${email}`,
    });

    return res.status(201).json({
      success: true,
      message: "Organization submitted successfully. Please check your email for verification instructions."
    });
  } catch (error) {
    console.error('Error submitting organization:', error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred while submitting the organization" 
    });
  }
});

// Verify organization email
router.get('/verify/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find organization submission by token
    const submission = await storage.getOrganizationSubmissionByToken(token);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired verification token"
      });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: "This organization has already been verified"
      });
    }

    // Update status to verified
    await storage.updateOrganizationSubmissionStatus(submission.id, 'verified', new Date());

    // Check if there was a referral and reward the referrer
    if (submission.referralCode) {
      const referrer = await storage.getUserByReferralCode(submission.referralCode);
      if (referrer && referrer.email) {
        // Reward tokens to the referrer
        const referralReward = process.env.rewards?.NONPROFIT_REFERRAL || 10;
        await storage.updateUserTokens(referrer.id, referrer.tokens + referralReward);

        // Send email notification to referrer
        await emailService.sendReferralRewardEmail({
          to: referrer.email,
          referrerName: referrer.username,
          organizationName: submission.name,
          tokenAmount: referralReward
        });
      }
    }

    // For now, automatically approve the organization
    // In production, this would typically involve manual review
    const sbtId = await createVerifiedOrganization(submission);

    return res.status(200).json({
      success: true,
      message: "Organization verified successfully",
      sbtId
    });
  } catch (error) {
    console.error('Error verifying organization:', error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred while verifying the organization" 
    });
  }
});

// Get all verified organizations
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizations = await storage.getVerifiedOrganizations();
    return res.status(200).json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred while fetching organizations" 
    });
  }
});

// Get organization by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid organization ID"
      });
    }

    const organization = await storage.getOrganizationById(id);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "Organization not found"
      });
    }

    return res.status(200).json(organization);
  } catch (error) {
    console.error('Error fetching organization:', error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred while fetching the organization" 
    });
  }
});

// Donate to an organization
router.post('/:id/donate', requireAuth, async (req: Request, res: Response) => {
  try {
    const organizationId = parseInt(req.params.id);
    if (isNaN(organizationId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid organization ID"
      });
    }

    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid donation amount"
      });
    }

    // Get organization and check it exists
    const organization = await storage.getOrganizationById(organizationId);
    if (!organization) {
      return res.status(404).json({
        success: false,
        error: "Organization not found"
      });
    }

    // Check if user has enough tokens
    const userId = req.user.id;
    if (req.user.tokens < amount) {
      return res.status(400).json({
        success: false,
        error: "Insufficient tokens for donation"
      });
    }

    // Create donation record
    await storage.createDonation({
      userId,
      organizationId,
      amount,
      timestamp: new Date(),
      transactionHash: uuidv4(), // In a real blockchain implementation, this would be the actual transaction hash
    });

    // Update user's token balance
    await storage.updateUserTokens(userId, req.user.tokens - amount);

    // Update organization's token balance
    await storage.updateOrganizationTokens(organizationId, organization.tokens + amount);

    return res.status(200).json({
      success: true,
      message: `Successfully donated ${amount} tokens to ${organization.name}`,
      remainingTokens: req.user.tokens - amount
    });
  } catch (error) {
    console.error('Error donating to organization:', error);
    return res.status(500).json({ 
      success: false, 
      error: "An error occurred while processing the donation" 
    });
  }
});

/**
 * Helper function to create a verified organization from a submission
 * and issue a Soulbound Token (SBT)
 */
async function createVerifiedOrganization(submission: any) {
  // Create organization record with initial reputation scores
  const organization = await storage.createOrganization({
    name: submission.name,
    type: submission.type,
    description: submission.description,
    mission: submission.mission,
    verified: true,
    verificationDate: new Date(),
    verificationMethod: 'email',
    website: submission.website,
    email: submission.email,
    profileImageUrl: null,
    coverImageUrl: null,
    categories: [],
    reputationScore: 30, // Initial reputation score
    transparencyScore: 25,
    impactScore: 30,
    governanceScore: 35,
    financialScore: 30,
    tokens: 0, // Start with 0 tokens
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create an SBT for the organization
  const sbtData = {
    organizationId: organization.id,
    name: organization.name,
    type: organization.type,
    website: organization.website,
    verificationDate: organization.verificationDate,
    reputationScore: organization.reputationScore,
  };

  // Issue SBT using the SBT service
  const sbtId = await sbtService.createOrganizationSBT(sbtData);

  // Update organization with SBT ID
  await storage.updateOrganizationSBT(organization.id, sbtId);

  // Send approval email
  await emailService.sendOrganizationApprovalEmail({
    to: organization.email,
    organizationName: organization.name,
    sbtId
  });

  return sbtId;
}

export default router;