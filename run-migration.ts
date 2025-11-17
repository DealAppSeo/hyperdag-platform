import { runRfpMigrations } from "./migrations/run-rfp-migrations";
import { addStatusColumnToReferrals } from "./migrations/fix-referrals-schema";
import { main as createStorageTable } from "./migrations/create-storage-table";
import { logger } from "./utils/logger";

/**
 * Script to run migrations
 */
async function main() {
  try {
    logger.info("[migration] Starting migrations...");
    
    // First, fix the referrals schema
    await addStatusColumnToReferrals();
    
    // Then run RFP migrations
    const result = await runRfpMigrations();
    
    // Create storage table for advanced storage service
    await createStorageTable();
    
    logger.info("[migration] Migration completed successfully!");
    logger.info(`[migration] Migrated ${result.migratedCount} projects to RFIs`);
    logger.info(`[migration] Created ${result.createdCount} new RFPs`);
    
    process.exit(0);
  } catch (error) {
    logger.error("[migration] Migration failed:", error);
    process.exit(1);
  }
}

main();