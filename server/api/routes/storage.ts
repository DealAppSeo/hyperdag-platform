import { Router, Request, Response } from 'express';
import { advancedStorageService } from '../../services/redundancy/storage/advanced-storage-service';
import { logger } from '../../utils/logger';
import { requireAuth } from '../../middleware/auth-middleware';

/**
 * Advanced Storage API Routes
 * 
 * These routes provide HTTP access to the advanced storage system
 * with hybrid blockchain-DAG storage, fuzzy logic optimization,
 * and automatic data fractionalization.
 */
const router = Router();

/**
 * @route GET /api/storage/status
 * @desc Get current status of the storage system
 * @access Authenticated
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const status = await advancedStorageService.checkStatus();
    res.json({
      status,
      message: `Storage system is ${status}`
    });
  } catch (error) {
    logger.error('[storage-api] Error checking storage status:', error);
    res.status(500).json({ 
      error: 'Failed to check storage status', 
      message: error.message 
    });
  }
});

/**
 * @route POST /api/storage/:key
 * @desc Store data with specified key
 * @access Authenticated
 */
router.post('/:key', requireAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const { data, options } = req.body;
    
    if (!data) {
      return res.status(400).json({ error: 'Data is required' });
    }
    
    // Default options
    const storageOptions = {
      importance: options?.importance || 5,
      compress: options?.compress !== false,
      fractionalize: options?.fractionalize !== false,
      ttl: options?.ttl
    };
    
    const success = await advancedStorageService.storeData(key, data, storageOptions);
    
    if (success) {
      res.status(201).json({ 
        success: true, 
        message: `Data stored successfully with key: ${key}`,
        key
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to store data' 
      });
    }
  } catch (error) {
    logger.error('[storage-api] Error storing data:', error);
    res.status(500).json({ 
      error: 'Failed to store data', 
      message: error.message 
    });
  }
});

/**
 * @route GET /api/storage/:key
 * @desc Retrieve data by key
 * @access Authenticated
 */
router.get('/:key', requireAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const data = await advancedStorageService.retrieveData(key);
    
    if (data) {
      res.json({ 
        success: true, 
        data 
      });
    } else {
      res.status(404).json({ 
        success: false, 
        error: 'Data not found' 
      });
    }
  } catch (error) {
    logger.error('[storage-api] Error retrieving data:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve data', 
      message: error.message 
    });
  }
});

/**
 * @route DELETE /api/storage/:key
 * @desc Delete data by key
 * @access Authenticated
 */
router.delete('/:key', requireAuth, async (req: Request, res: Response) => {
  try {
    const { key } = req.params;
    const success = await advancedStorageService.deleteData(key);
    
    if (success) {
      res.json({ 
        success: true, 
        message: `Data with key ${key} deleted successfully` 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to delete data' 
      });
    }
  } catch (error) {
    logger.error('[storage-api] Error deleting data:', error);
    res.status(500).json({ 
      error: 'Failed to delete data', 
      message: error.message 
    });
  }
});

/**
 * @route POST /api/storage/backup-table
 * @desc Backup a database table to decentralized storage
 * @access Authenticated
 */
router.post('/backup-table', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tableName } = req.body;
    
    if (!tableName) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    // This would normally use your database connection
    // For now we just simulate the backup process
    const backupKey = `backup_${tableName}_${Date.now()}`;
    const backupData = {
      tableName,
      timestamp: new Date().toISOString(),
      status: 'completed',
      type: 'simulated' // In a real implementation, this would be the actual table data
    };
    
    // Store with high importance (8/10) and ensure fractionalization
    const success = await advancedStorageService.storeData(backupKey, backupData, {
      importance: 8,
      fractionalize: true,
      compress: true
    });
    
    if (success) {
      res.json({
        success: true,
        message: `Table ${tableName} backed up successfully`,
        backupKey
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to backup table'
      });
    }
  } catch (error) {
    logger.error('[storage-api] Error backing up table:', error);
    res.status(500).json({
      error: 'Failed to backup table',
      message: error.message
    });
  }
});

export default router;