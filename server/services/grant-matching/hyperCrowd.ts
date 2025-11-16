/**
 * HyperCrowd Service - Main Entry Point
 * 
 * This file exports the complete HyperCrowd functionality, bringing together:
 * 1. Grant Matching Algorithm
 * 2. Funding Distribution System
 * 3. Project Proposal Submission system
 * 4. RFP/RFI Conversion
 * 5. Team Formation Tools
 * 6. Grant Source Integration
 */

// Export core grant matching functionality
export * from './index';

// Export funding distribution system
export * from './funding-distribution';

// Export project proposal system
export * from './project-proposal';

// Export RFP/RFI conversion system
export * from './rfp-conversion';

// Export team formation tools
export * from './team-formation';

// Export grant source integration
export * from './grant-source-integration';

// Log module initialization
import { config } from '../../config';
try {
  if (config.logging.enabled) {
    console.log('HyperCrowd service initialized successfully');
  }
} catch (error) {
  console.error('Error initializing HyperCrowd service:', error);
}