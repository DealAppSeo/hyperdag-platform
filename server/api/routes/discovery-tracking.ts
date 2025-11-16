import express from 'express';
import { discoveryRewardService } from '../services/discovery-reward-service';

const router = express.Router();

/**
 * Track grant search behavior - triggers variable reward system
 */
router.post('/track/grant-search', async (req, res) => {
  try {
    const { userId, searchTerms, filters } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    // Track the discovery event
    await discoveryRewardService.trackDiscoveryEvent({
      userId,
      eventType: 'grant_search',
      searchParams: { searchTerms, filters },
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Grant search tracked',
      pointsEarned: 3
    });

  } catch (error) {
    console.error('[Discovery Tracking] Grant search error:', error);
    res.status(500).json({ success: false, message: 'Failed to track grant search' });
  }
});

/**
 * Track RFI submission - higher reward potential
 */
router.post('/track/rfi-submission', async (req, res) => {
  try {
    const { userId, rfiData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    await discoveryRewardService.trackDiscoveryEvent({
      userId,
      eventType: 'rfi_submission',
      searchParams: rfiData,
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      message: 'RFI submission tracked',
      pointsEarned: 8
    });

  } catch (error) {
    console.error('[Discovery Tracking] RFI submission error:', error);
    res.status(500).json({ success: false, message: 'Failed to track RFI submission' });
  }
});

/**
 * Track team exploration behavior
 */
router.post('/track/team-exploration', async (req, res) => {
  try {
    const { userId, exploreAction } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    await discoveryRewardService.trackDiscoveryEvent({
      userId,
      eventType: 'team_exploration',
      searchParams: exploreAction,
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Team exploration tracked',
      pointsEarned: 5
    });

  } catch (error) {
    console.error('[Discovery Tracking] Team exploration error:', error);
    res.status(500).json({ success: false, message: 'Failed to track team exploration' });
  }
});

/**
 * Track skill match clicks - builds team discovery habits
 */
router.post('/track/skill-match-click', async (req, res) => {
  try {
    const { userId, matchData } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID required' });
    }

    await discoveryRewardService.trackDiscoveryEvent({
      userId,
      eventType: 'skill_match_click',
      searchParams: matchData,
      timestamp: new Date()
    });

    res.json({ 
      success: true, 
      message: 'Skill match click tracked',
      pointsEarned: 2
    });

  } catch (error) {
    console.error('[Discovery Tracking] Skill match click error:', error);
    res.status(500).json({ success: false, message: 'Failed to track skill match click' });
  }
});

export default router;