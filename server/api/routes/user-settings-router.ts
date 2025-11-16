import { Router } from 'express';
import { getUserSettings, updateUserSettings, getCategorySettings, updateCategorySettings, runSettingsMigration } from './user-settings';

const router = Router();

// Run the migration to add the settings column (will be skipped if already exists)
runSettingsMigration()
  .then(success => {
    if (success) {
      console.log('User settings migration completed successfully');
    } else {
      console.error('User settings migration failed');
    }
  })
  .catch(error => {
    console.error('Error during user settings migration:', error);
  });

// Get all user settings
router.get('/', getUserSettings);

// Update all user settings
router.patch('/', updateUserSettings);

// Get specific category of settings
router.get('/:category', getCategorySettings);

// Update specific category of settings
router.patch('/:category', updateCategorySettings);

export default router;