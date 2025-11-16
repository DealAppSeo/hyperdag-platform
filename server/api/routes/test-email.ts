import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth-middleware';
import { sendEmail } from '../../services/email-service-helper';

/**
 * Routes for testing email functionality
 */
export const testEmailRouter = Router();

/**
 * Test endpoint to send an email
 * @route POST /api/test/email
 * @access Protected (requires authentication)
 */
testEmailRouter.post('/email', requireAuth, async (req: Request, res: Response) => {
  try {
    const { to, subject, text, html } = req.body;

    // Validate required fields
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient email (to) is required'
      });
    }

    // Send the email using our email service
    const htmlContent = html || `<div style="font-family: Arial, sans-serif;">
        <h2 style="color: #4F46E5;">HyperDAG Email Test</h2>
        <p>This is a test email from the HyperDAG platform.</p>
        <p>If you received this email, it means our email service is working correctly.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply to this email.</p>
      </div>`;
    
    const textContent = text || 'This is a test email from the HyperDAG platform.';
    
    const emailSent = await sendEmail(
      to,
      subject || 'HyperDAG Test Email',
      htmlContent,
      textContent
    );

    if (emailSent) {
      return res.json({
        success: true,
        message: 'Test email sent successfully',
        details: {
          to,
          subject: subject || 'HyperDAG Test Email',
          textLength: text ? text.length : 0,
          htmlLength: html ? html.length : 0
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email. Check server logs for details.'
      });
    }
  } catch (error) {
    console.error('Error in test email route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending test email',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});