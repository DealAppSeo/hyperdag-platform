import { db } from "../db";
import { projects, rfis } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * This script migrates existing projects to RFIs
 */
export async function migrateProjectsToRfis() {
  try {
    console.log("[migration] Starting project to RFI migration");
    
    // Get all projects
    const existingProjects = await db.select().from(projects);
    
    // Convert each project to an RFI
    let migrationCount = 0;
    for (const project of existingProjects) {
      // Check if an RFI with this title already exists
      const [existingRfi] = await db
        .select()
        .from(rfis)
        .where(eq(rfis.title, project.title));
      
      if (existingRfi) {
        console.log(`[migration] RFI for "${project.title}" already exists, skipping`);
        continue;
      }
      
      // Create a new RFI for this project
      await db.insert(rfis).values({
        title: project.title,
        description: project.description || "No description provided",
        category: project.categories?.[0] || "Other",
        problem: `This project aims to address issues related to ${project.categories?.join(", ") || "various areas"}.`,
        impact: `This initiative can positively impact communities through ${project.title}.`,
        status: "published",
        submitterId: project.creatorId
      });
      
      migrationCount++;
    }
    
    console.log(`[migration] Successfully migrated ${migrationCount} projects to RFIs`);
    return migrationCount;
  } catch (error) {
    console.error("[migration] Error migrating projects to RFIs:", error);
    throw error;
  }
}