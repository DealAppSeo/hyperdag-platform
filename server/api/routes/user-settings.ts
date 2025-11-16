import { Request, Response } from 'express';
import { db } from '../../db';
import { users } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { userSettingsSchema } from '@shared/schema';

// Get all user settings
export async function getUserSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = req.user;
    // Return the user's settings, defaulting to an empty object if not set
    res.json(user.settings || {});
    
  } catch (error) {
    console.error("Error fetching user settings:", error);
    res.status(500).json({ message: "Failed to fetch user settings" });
  }
}

// Update all user settings
export async function updateUserSettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const updatedSettings = req.body;
    
    // Validate the settings against our schema
    try {
      // Merge existing settings with updated settings
      const existingSettings = req.user.settings || {};
      const mergedSettings = { ...existingSettings, ...updatedSettings };
      
      // Parse the merged settings to validate against our schema
      // This will throw if the data doesn't conform to our schema
      userSettingsSchema.parse(mergedSettings);
      
      // Update the user's settings in the database
      const [updatedUser] = await db
        .update(users)
        .set({ settings: mergedSettings })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser.settings);
    } catch (validationError) {
      console.error("Settings validation error:", validationError);
      return res.status(400).json({ message: "Invalid settings format", error: validationError });
    }
  } catch (error) {
    console.error("Error updating user settings:", error);
    res.status(500).json({ message: "Failed to update user settings" });
  }
}

// Get specific category of settings
export async function getCategorySettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const category = req.params.category;
    const validCategories = [
      'privacy', 'communication', 'wallet', 'collaboration', 
      'grantPreferences', 'teamFormation', 'persona', 'reputation',
      'interface', 'language', 'accessibility', 'dataManagement'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid settings category" });
    }

    const user = req.user;
    const settings = user.settings || {};
    
    res.json(settings[category] || {});
  } catch (error) {
    console.error(`Error fetching ${req.params.category} settings:`, error);
    res.status(500).json({ message: `Failed to fetch ${req.params.category} settings` });
  }
}

// Update specific category of settings
export async function updateCategorySettings(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const category = req.params.category;
    const updatedCategorySettings = req.body;
    
    const validCategories = [
      'privacy', 'communication', 'wallet', 'collaboration', 
      'grantPreferences', 'teamFormation', 'persona', 'reputation',
      'interface', 'language', 'accessibility', 'dataManagement'
    ];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid settings category" });
    }

    // Get current settings
    const existingSettings = req.user.settings || {};
    
    // Create new settings object with updated category
    const newSettings = {
      ...existingSettings,
      [category]: {
        ...(existingSettings[category] || {}),
        ...updatedCategorySettings
      }
    };
    
    // Validate against our schema
    try {
      // This will throw if the data doesn't conform to our schema
      userSettingsSchema.parse(newSettings);
      
      // Update the user's settings in the database
      const [updatedUser] = await db
        .update(users)
        .set({ settings: newSettings })
        .where(eq(users.id, userId))
        .returning();

      res.json(updatedUser.settings[category]);
    } catch (validationError) {
      console.error("Settings validation error:", validationError);
      return res.status(400).json({ message: "Invalid settings format", error: validationError });
    }
  } catch (error) {
    console.error(`Error updating ${req.params.category} settings:`, error);
    res.status(500).json({ message: `Failed to update ${req.params.category} settings` });
  }
}

// Export the migration helper to run from other files
export async function runSettingsMigration() {
  try {
    // Check if settings column exists, if not add it
    const result = await db.execute(sql`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'settings';
    `);
    
    if (result.rowCount === 0) {
      console.log('Settings column does not exist. Adding it now...');
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN settings JSONB DEFAULT '{}'::jsonb;
      `);
      console.log('Settings column added successfully');
    } else {
      console.log('Settings column already exists');
    }
    
    return true;
  } catch (error) {
    console.error('Error running settings migration:', error);
    return false;
  }
}