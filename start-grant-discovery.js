/**
 * Start Grant Discovery Service
 * 
 * Initializes and runs the automated grant discovery system
 */

import axios from 'axios';

async function startGrantDiscovery() {
  console.log('Starting automated grant discovery system...\n');
  
  try {
    // Import the discovery service directly
    const { GrantDiscoveryService } = await import('./server/services/grant-discovery/web-scraper.js');
    const discoveryService = GrantDiscoveryService.getInstance();
    
    console.log('1. Initializing grant discovery service...');
    
    // Start the discovery service
    await discoveryService.startDiscovery();
    
    console.log('✓ Discovery service started successfully');
    
    // Get initial status
    const status = discoveryService.getDiscoveryStats();
    console.log(`✓ Service running: ${status.isRunning}`);
    console.log(`✓ Sources configured: ${status.sourcesConfigured}`);
    
    // Force an immediate discovery run to demonstrate
    console.log('\n2. Running immediate grant discovery...');
    await discoveryService.forceDiscovery();
    
    console.log('✓ Discovery round completed');
    
    // Check results
    const updatedStatus = discoveryService.getDiscoveryStats();
    console.log(`✓ Last scrape time: ${updatedStatus.lastScrapeTime}`);
    console.log(`✓ Next scheduled scrape: ${updatedStatus.nextScrapeTime}`);
    
    console.log('\n3. Grant discovery system is now active and will:');
    console.log('• Search GitHub for grant-related repositories every 6 hours');
    console.log('• Monitor Web3 Foundation and Protocol Labs for new opportunities');
    console.log('• Use AI to research and validate discovered grants');
    console.log('• Automatically categorize and enhance grant information');
    console.log('• Detect and prevent duplicate entries');
    console.log('• Update the database with fresh opportunities');
    
    // Verify API endpoint is working
    console.log('\n4. Verifying API endpoints...');
    const apiStatus = await axios.get('http://localhost:5000/api/grant-discovery/status');
    console.log(`✓ API status: ${apiStatus.data.success ? 'Available' : 'Unavailable'}`);
    
    console.log('\n🎯 Automated grant discovery is now operational!');
    console.log('The system will continuously find new grant opportunities from:');
    console.log('• GitHub repositories and organizations');
    console.log('• Web3 Foundation grant programs');
    console.log('• Protocol Labs ecosystem funding');
    console.log('• AI-powered web research');
    
  } catch (error) {
    console.error('Failed to start grant discovery:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Run the startup
startGrantDiscovery().catch(console.error);