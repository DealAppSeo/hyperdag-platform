import { addTypeColumnToVerificationCodes } from "./migrations/add-type-to-verification-codes";

/**
 * Script to run verification codes migration
 */
async function main() {
  try {
    console.log("Starting verification codes migration...");
    
    await addTypeColumnToVerificationCodes();
    
    console.log("Verification codes migration completed successfully!");
    
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

main();