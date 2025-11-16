import { db } from "../db";
import { rfps, projects } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * This script creates new RFPs based on the top disruptive areas 
 * for AI-enhanced Web3 platforms
 */
export async function createNewRfps() {
  try {
    console.log("[migration] Starting creation of new RFPs");
    
    // Define our new RFPs based on the document
    const newRfps = [
      {
        title: "Decentralized Content Creation Platform",
        description: "Development of an AI-enhanced content marketplace with ownership tracking and fair compensation for creators.",
        category: "Content Creation",
        requirements: [
          "Smart contract-based royalty systems for automatic payments",
          "AI-powered content recommendation engine",
          "Tokenized ownership of creative works through NFTs",
          "Creator-first monetization tools"
        ],
        deliverables: [
          "Decentralized marketplace for digital content",
          "Creator dashboard with analytics",
          "AI content recommendation system",
          "Tokenized ownership and royalty distribution"
        ],
        fundingGoal: 500000,
        budget: 500000,
        timeline: 180,
        skillsRequired: ["Smart Contracts", "Frontend Development", "AI/ML", "Tokenomics"],
        tags: "content,creative,marketplace,AI,Web3",
        status: "published",
        submitterId: 1
      },
      {
        title: "Adaptive Learning Platform with Web3 Credentials",
        description: "Educational platform combining AI-personalized learning with blockchain-verified credentials to transform skill acquisition and verification.",
        category: "Education",
        requirements: [
          "AI-powered adaptive learning algorithms",
          "Web3 credential verification system",
          "Decentralized skill marketplace",
          "Token-based learning incentives"
        ],
        deliverables: [
          "Learning platform with personalized paths",
          "Credential verification system",
          "Incentive system for learning achievements",
          "Integration with reputation systems"
        ],
        fundingGoal: 350000,
        budget: 350000,
        timeline: 150,
        skillsRequired: ["Education Tech", "AI/ML", "Smart Contracts", "Frontend Development"],
        tags: "education,learning,credentials,AI,Web3",
        status: "published",
        submitterId: 1
      },
      {
        title: "AI-Enhanced DeFi Risk Assessment Platform",
        description: "Financial services platform leveraging AI for risk assessment in decentralized lending with automated compliance systems.",
        category: "Financial Services",
        requirements: [
          "AI-powered risk assessment algorithms",
          "Automated compliance and fraud detection",
          "Personalized financial advice engine",
          "Smart contract-based investment strategies"
        ],
        deliverables: [
          "Risk assessment dashboard for DeFi lending",
          "Compliance automation system",
          "Financial advisory AI engine",
          "Automated investment strategy tools"
        ],
        fundingGoal: 450000,
        budget: 450000,
        timeline: 200,
        skillsRequired: ["DeFi", "AI/ML", "Smart Contracts", "Financial Modeling"],
        tags: "defi,finance,risk,compliance,AI,Web3",
        status: "published",
        submitterId: 1
      }
    ];
    
    // Create each RFP
    let createdCount = 0;
    for (const rfpData of newRfps) {
      // Check if an RFP with this title already exists
      const [existingRfp] = await db
        .select()
        .from(rfps)
        .where(eq(rfps.title, rfpData.title));
      
      if (existingRfp) {
        console.log(`[migration] RFP "${rfpData.title}" already exists, skipping`);
        continue;
      }
      
      // Insert the RFP
      const [newRfp] = await db.insert(rfps).values(rfpData).returning();
      
      // Create a matching project for the dashboard
      const [existingProject] = await db
        .select()
        .from(projects)
        .where(eq(projects.title, rfpData.title));
      
      if (!existingProject) {
        await db.insert(projects).values({
          title: rfpData.title,
          description: rfpData.description,
          type: "rfp",
          categories: rfpData.category.split(","),
          teamRoles: rfpData.skillsRequired,
          fundingGoal: rfpData.fundingGoal / 10000, // Scale down for display
          durationDays: rfpData.timeline,
          currentFunding: 0,
          creatorId: rfpData.submitterId
        });
      }
      
      createdCount++;
    }
    
    console.log(`[migration] Successfully created ${createdCount} new RFPs`);
    return createdCount;
  } catch (error) {
    console.error("[migration] Error creating new RFPs:", error);
    throw error;
  }
}