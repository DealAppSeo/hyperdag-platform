import { migrateProjectsToRfis } from "./migrate-projects-to-rfis";
import { createNewRfps } from "./create-new-rfps";

/**
 * Run all RFP-related migrations
 */
export async function runRfpMigrations() {
  try {
    console.log("[migration] Starting RFP migrations");
    
    // First migrate existing projects to RFIs
    const migratedCount = await migrateProjectsToRfis();
    console.log(`[migration] Migrated ${migratedCount} projects to RFIs`);
    
    // Then create new RFPs
    const createdCount = await createNewRfps();
    console.log(`[migration] Created ${createdCount} new RFPs`);
    
    console.log("[migration] All RFP migrations completed successfully");
    return {
      migratedCount,
      createdCount
    };
  } catch (error) {
    console.error("[migration] Error running RFP migrations:", error);
    throw error;
  }
}