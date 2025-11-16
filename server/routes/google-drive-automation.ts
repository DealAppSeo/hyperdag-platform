/**
 * Google Drive Automation API Routes
 */

import { Router } from 'express';
import { googleDriveService } from '../services/google-drive-automation';
import { taskAutomationService } from '../services/task-automation';

const router = Router();

/**
 * Test Google Drive connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    const isAuthenticated = await googleDriveService.isAuthenticated();
    res.json({
      success: true,
      authenticated: isAuthenticated,
      message: isAuthenticated ? 'Google Drive connected successfully' : 'Authentication required'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Connection test failed'
    });
  }
});

/**
 * Upload competitive package to Google Drive
 */
router.post('/upload-competitive-package', async (req, res) => {
  try {
    const packagePath = './hyperdagmanager_competitive_final_2025-08-07';
    
    // Create HyperDAG folder structure
    const folderId = await googleDriveService.createHyperDAGStructure();
    
    // Upload the competitive package
    await googleDriveService.uploadDirectory(packagePath, folderId);
    
    res.json({
      success: true,
      message: 'Competitive package uploaded to Google Drive',
      folderId: folderId,
      status: 'CHAMPION TIER DOCUMENTED'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed'
    });
  }
});

/**
 * Upload specific file to Google Drive
 */
router.post('/upload-file', async (req, res) => {
  try {
    const { filePath, fileName, folderId } = req.body;
    
    if (!filePath) {
      return res.status(400).json({
        success: false,
        error: 'File path is required'
      });
    }
    
    const uploadUrl = await googleDriveService.uploadFile(filePath, fileName, folderId);
    
    res.json({
      success: true,
      uploadUrl: uploadUrl,
      message: 'File uploaded successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'File upload failed'
    });
  }
});

/**
 * Create new task
 */
router.post('/create-task', async (req, res) => {
  try {
    const { name, instructions, priority = 'medium', deadline } = req.body;
    
    if (!name || !instructions) {
      return res.status(400).json({
        success: false,
        error: 'Name and instructions are required'
      });
    }
    
    await taskAutomationService.createTask(name, instructions, priority, deadline);
    
    res.json({
      success: true,
      message: 'Task created successfully',
      task: { name, priority, deadline }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Task creation failed'
    });
  }
});

/**
 * Get task queue status
 */
router.get('/task-status', (req, res) => {
  try {
    const status = taskAutomationService.getQueueStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get task status'
    });
  }
});

/**
 * Trigger immediate Google Drive sync
 */
router.post('/sync-now', async (req, res) => {
  try {
    const { directoryPath } = req.body;
    const targetPath = directoryPath || './hyperdagmanager_competitive_final_2025-08-07';
    
    await googleDriveService.uploadDirectory(targetPath);
    
    res.json({
      success: true,
      message: 'Google Drive sync completed',
      syncedPath: targetPath
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Sync failed'
    });
  }
});

export default router;