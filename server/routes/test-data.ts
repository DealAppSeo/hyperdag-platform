import { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import * as schema from '../../shared/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const router = Router();

// Test data creation for all three token types
router.post('/create-all-samples', async (req, res) => {
  try {
    const userId = 1; // Use existing user for testing

    // Create SBT test credentials
    const sbtSamples = [
      {
        type: 'identity',
        title: 'Government ID Verification',
        description: 'Verified government-issued identification document',
        issuer: 'Department of Motor Vehicles',
        isMonetizable: false,
        pricePerAccess: null
      },
      {
        type: 'education',
        title: 'Computer Science Degree',
        description: 'Bachelor of Science in Computer Science from MIT',
        issuer: 'Massachusetts Institute of Technology',
        isMonetizable: true,
        pricePerAccess: 0.01
      },
      {
        type: 'professional',
        title: 'Certified Blockchain Developer',
        description: 'Professional certification in blockchain development',
        issuer: 'Blockchain Institute',
        isMonetizable: true,
        pricePerAccess: 0.005
      }
    ];

    const sbtCredentials = [];
    for (const credData of sbtSamples) {
      const mockData = JSON.stringify({
        credential: credData,
        timestamp: Date.now(),
        userId: userId
      });
      
      const encryptedDataHash = crypto.createHash('sha256').update(mockData).digest('hex');
      const ipfsHash = `Qm${crypto.randomBytes(22).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 44)}`;
      
      const mockZkpProof = {
        proof: crypto.randomBytes(32).toString('hex'),
        publicInputs: [userId.toString(), credData.type, Date.now().toString()],
        verificationKey: crypto.randomBytes(16).toString('hex')
      };

      const credential = await storage.createSBTCredential({
        userId,
        type: credData.type as any,
        title: credData.title,
        description: credData.description,
        encryptedDataHash,
        ipfsHash,
        issuer: credData.issuer,
        isMonetizable: credData.isMonetizable,
        pricePerAccess: credData.pricePerAccess || null,
        maxAccesses: null,
        contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
        chainId: 1,
        zkpProof: JSON.stringify(mockZkpProof)
      });

      sbtCredentials.push(credential);
    }

    // Create CBT test credentials
    const cbtSamples = [
      {
        charityId: 1,
        charityName: 'Clean Water Foundation',
        charityType: 'environmental',
        charityDescription: 'Providing clean water access to underserved communities worldwide',
        charityWebsite: 'https://cleanwaterfoundation.org',
        accountabilityRating: 92,
        transparencyRating: 88,
        financialEfficiencyRating: 85,
        impactRating: 94,
        overallRating: 90,
        programExpenseRatio: '0.78',
        adminExpenseRatio: '0.12',
        fundraisingExpenseRatio: '0.10',
        totalRevenue: 2500000,
        totalExpenses: 2350000,
        beneficiariesServed: 50000,
        impactDescription: 'Built 150 water wells serving 50,000 people in rural communities'
      },
      {
        charityId: 2,
        charityName: 'Education First Initiative',
        charityType: 'education',
        charityDescription: 'Providing quality education resources to children in developing countries',
        charityWebsite: 'https://educationfirst.org',
        accountabilityRating: 87,
        transparencyRating: 91,
        financialEfficiencyRating: 89,
        impactRating: 86,
        overallRating: 88,
        programExpenseRatio: '0.82',
        adminExpenseRatio: '0.08',
        fundraisingExpenseRatio: '0.10',
        totalRevenue: 1800000,
        totalExpenses: 1650000,
        beneficiariesServed: 25000,
        impactDescription: 'Educated 25,000 children through digital learning platforms and local teachers'
      }
    ];

    const cbtCredentials = [];
    for (const cbtData of cbtSamples) {
      const credential = await db.insert(schema.cbtCredentials).values({
        entityId: 1,
        tokenId: crypto.randomBytes(16).toString('hex'),
        contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
        chainId: 1,
        accountabilityRating: cbtData.accountabilityRating,
        transparencyRating: cbtData.transparencyRating,
        financialEfficiencyRating: cbtData.financialEfficiencyRating,
        impactRating: cbtData.impactRating,
        overallRating: cbtData.overallRating,
        programExpenseRatio: cbtData.programExpenseRatio,
        adminExpenseRatio: cbtData.adminExpenseRatio,
        fundraisingExpenseRatio: cbtData.fundraisingExpenseRatio,
        totalRevenue: cbtData.totalRevenue,
        totalExpenses: cbtData.totalExpenses,
        form990Filed: true,
        auditedFinancials: true,
        boardGovernance: true,
        conflictOfInterestPolicy: true,
        whistleblowerPolicy: true,
        beneficiariesServed: cbtData.beneficiariesServed,
        impactDescription: cbtData.impactDescription,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        isRevoked: false,
        verificationLevel: 3,
        lastAudited: new Date(),
        nextAuditDue: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        entityName: cbtData.charityName,
        entityType: cbtData.charityType,
        entityWebsite: cbtData.charityWebsite,
        entityDescription: cbtData.charityDescription
      }).returning();

      cbtCredentials.push(credential[0]);
    }

    // Create DBT test credentials
    const dbtSamples = [
      {
        entityId: 1,
        entityName: 'GPT-4 API Service',
        entityType: 'ai_agent',
        entityDescription: 'Advanced language model API for natural language processing',
        organizationName: 'OpenAI',
        performanceRating: 95,
        reliabilityRating: 92,
        securityRating: 88,
        efficiencyRating: 90,
        overallRating: 91,
        uptimePercentage: '99.9',
        responseTime: 150,
        errorRate: '0.01',
        throughput: 10000,
        dataProcessed: 500000,
        aiModelVersion: 'gpt-4-turbo',
        apiEndpoints: 15,
        energyEfficiencyRating: 85,
        carbonFootprint: 120
      },
      {
        entityId: 2,
        entityName: 'Claude Analytics Engine',
        entityType: 'ml_model',
        entityDescription: 'AI-powered data analytics and insights generation platform',
        organizationName: 'Anthropic',
        performanceRating: 89,
        reliabilityRating: 94,
        securityRating: 96,
        efficiencyRating: 87,
        overallRating: 92,
        uptimePercentage: '99.95',
        responseTime: 200,
        errorRate: '0.005',
        throughput: 8500,
        dataProcessed: 750000,
        aiModelVersion: 'claude-3-sonnet',
        apiEndpoints: 12,
        energyEfficiencyRating: 92,
        carbonFootprint: 95
      }
    ];

    const dbtCredentials = [];
    for (const dbtData of dbtSamples) {
      const credential = await db.insert(schema.dbtCredentials).values({
        entityId: dbtData.entityId,
        tokenId: crypto.randomBytes(16).toString('hex'),
        contractAddress: `0x${crypto.randomBytes(20).toString('hex')}`,
        chainId: 1,
        performanceRating: dbtData.performanceRating,
        reliabilityRating: dbtData.reliabilityRating,
        securityRating: dbtData.securityRating,
        efficiencyRating: dbtData.efficiencyRating,
        overallRating: dbtData.overallRating,
        uptimePercentage: dbtData.uptimePercentage,
        responseTime: dbtData.responseTime,
        errorRate: dbtData.errorRate,
        throughput: dbtData.throughput,
        dataProcessed: dbtData.dataProcessed,
        aiModelVersion: dbtData.aiModelVersion,
        apiEndpoints: dbtData.apiEndpoints,
        securityAudited: true,
        complianceStatus: 'compliant',
        lastPerformanceCheck: new Date().toISOString(),
        energyEfficiencyRating: dbtData.energyEfficiencyRating,
        carbonFootprint: dbtData.carbonFootprint,
        issuedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        verificationLevel: 3,
        entityName: dbtData.entityName,
        entityType: dbtData.entityType,
        entityDescription: dbtData.entityDescription,
        organizationName: dbtData.organizationName
      }).returning();

      dbtCredentials.push(credential[0]);
    }

    res.json({
      success: true,
      data: {
        sbt: sbtCredentials,
        cbt: cbtCredentials,
        dbt: dbtCredentials
      },
      message: 'Sample credentials created for all token types'
    });

  } catch (error) {
    console.error('Error creating sample credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create sample credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Clear all test data
router.delete('/clear-all-samples', async (req, res) => {
  try {
    // Clear SBT credentials for test user
    await db.delete(schema.sbtCredentials).where(
      eq(schema.sbtCredentials.userId, 1)
    );

    // Clear CBT credentials
    await db.delete(schema.cbtCredentials);

    // Clear DBT credentials
    await db.delete(schema.dbtCredentials);

    res.json({
      success: true,
      message: 'All sample credentials cleared'
    });

  } catch (error) {
    console.error('Error clearing sample credentials:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear sample credentials'
    });
  }
});

export default router;