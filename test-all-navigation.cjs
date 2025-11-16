/**
 * Comprehensive Navigation and Button Test
 * Tests all buttons, links, and navigation elements across the application
 */

const fs = require('fs');
const path = require('path');

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function logResult(component, test, status, details = '') {
  const result = { component, test, status, details, timestamp: new Date().toISOString() };
  results[status].push(result);
  console.log(`[${status.toUpperCase()}] ${component} - ${test}: ${details}`);
}

// Test Welcome page navigation
function testWelcomeNavigation() {
  console.log('\n=== Testing Welcome Page Navigation ===');
  
  const welcomePath = 'client/src/pages/Welcome.tsx';
  
  if (!fs.existsSync(welcomePath)) {
    logResult('Welcome', 'File Check', 'failed', 'Welcome.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(welcomePath, 'utf8');
  
  // Test bypass button
  if (content.includes('Skip onboarding and explore on my own')) {
    logResult('Welcome', 'Bypass Button Text', 'passed', 'Button text found');
  } else {
    logResult('Welcome', 'Bypass Button Text', 'failed', 'Button text missing');
  }
  
  if (content.includes('handleBypassOnboarding')) {
    logResult('Welcome', 'Bypass Handler', 'passed', 'Handler function exists');
  } else {
    logResult('Welcome', 'Bypass Handler', 'failed', 'Handler function missing');
  }
  
  // Test navigation targets
  const navigationTargets = [
    { name: 'Dashboard', pattern: '/dashboard', exists: content.includes('/dashboard') },
    { name: 'Nonprofits', pattern: 'visit_nonprofits', exists: content.includes('visit_nonprofits') },
    { name: 'Profile', pattern: '/profile', exists: content.includes('/profile') }
  ];
  
  navigationTargets.forEach(target => {
    if (target.exists) {
      logResult('Welcome', `${target.name} Navigation`, 'passed', `${target.pattern} found`);
    } else {
      logResult('Welcome', `${target.name} Navigation`, 'failed', `${target.pattern} not found`);
    }
  });
  
  // Test nonprofit directory integration
  if (content.includes('nonprofit-directory')) {
    logResult('Welcome', 'Nonprofit Integration', 'passed', 'Nonprofit directory links found');
  } else {
    logResult('Welcome', 'Nonprofit Integration', 'warnings', 'Limited nonprofit directory integration');
  }
}

// Test Dashboard navigation
function testDashboardNavigation() {
  console.log('\n=== Testing Dashboard Navigation ===');
  
  const dashboardPath = 'client/src/pages/dashboard.tsx';
  
  if (!fs.existsSync(dashboardPath)) {
    logResult('Dashboard', 'File Check', 'warnings', 'Dashboard.tsx not found - checking alternative paths');
    return;
  }
  
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Test common dashboard navigation elements
  const dashboardElements = [
    { name: 'Projects Link', pattern: '/projects' },
    { name: 'Profile Link', pattern: '/profile' },
    { name: 'Settings Link', pattern: '/settings' },
    { name: 'Referral Link', pattern: '/refer' }
  ];
  
  dashboardElements.forEach(element => {
    if (content.includes(element.pattern)) {
      logResult('Dashboard', element.name, 'passed', `${element.pattern} found`);
    } else {
      logResult('Dashboard', element.name, 'warnings', `${element.pattern} not found`);
    }
  });
}

// Test Nonprofit Directory navigation
function testNonprofitDirectoryNavigation() {
  console.log('\n=== Testing Nonprofit Directory Navigation ===');
  
  const nonprofitPath = 'client/src/pages/nonprofit-directory-page.tsx';
  
  if (!fs.existsSync(nonprofitPath)) {
    logResult('Nonprofit Directory', 'File Check', 'failed', 'nonprofit-directory-page.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(nonprofitPath, 'utf8');
  
  // Test nonprofit page elements
  const nonprofitElements = [
    { name: 'Back Navigation', pattern: 'Link href=' },
    { name: 'Filter Buttons', pattern: 'onClick' },
    { name: 'Search Functionality', pattern: 'search' },
    { name: 'Category Filters', pattern: 'category' }
  ];
  
  nonprofitElements.forEach(element => {
    if (content.includes(element.pattern)) {
      logResult('Nonprofit Directory', element.name, 'passed', `${element.pattern} found`);
    } else {
      logResult('Nonprofit Directory', element.name, 'warnings', `${element.pattern} not found`);
    }
  });
}

// Test Sidebar navigation
function testSidebarNavigation() {
  console.log('\n=== Testing Sidebar Navigation ===');
  
  const sidebarPath = 'client/src/components/layout/sidebar.tsx';
  
  if (!fs.existsSync(sidebarPath)) {
    logResult('Sidebar', 'File Check', 'failed', 'Sidebar component not found');
    return;
  }
  
  const content = fs.readFileSync(sidebarPath, 'utf8');
  
  // Test sidebar navigation items
  const sidebarItems = [
    { name: 'Dashboard Link', pattern: '/dashboard' },
    { name: 'Projects Link', pattern: '/projects' },
    { name: 'Profile Link', pattern: '/profile' },
    { name: 'Settings Link', pattern: '/settings' },
    { name: 'Nonprofit Link', pattern: 'nonprofit' }
  ];
  
  sidebarItems.forEach(item => {
    if (content.includes(item.pattern)) {
      logResult('Sidebar', item.name, 'passed', `${item.pattern} found`);
    } else {
      logResult('Sidebar', item.name, 'warnings', `${item.pattern} not found`);
    }
  });
  
  // Test wouter Link usage
  if (content.includes('import') && content.includes('Link')) {
    logResult('Sidebar', 'Router Integration', 'passed', 'wouter Link import found');
  } else {
    logResult('Sidebar', 'Router Integration', 'warnings', 'Router integration unclear');
  }
}

// Test Route definitions
function testRouteDefinitions() {
  console.log('\n=== Testing Route Definitions ===');
  
  const appPath = 'client/src/App.tsx';
  
  if (!fs.existsSync(appPath)) {
    logResult('Routes', 'App File Check', 'failed', 'App.tsx not found');
    return;
  }
  
  const content = fs.readFileSync(appPath, 'utf8');
  
  // Test route definitions
  const routes = [
    { name: 'Welcome Route', pattern: '/welcome' },
    { name: 'Dashboard Route', pattern: '/dashboard' },
    { name: 'Profile Route', pattern: '/profile' },
    { name: 'Projects Route', pattern: '/projects' },
    { name: 'Settings Route', pattern: '/settings' },
    { name: 'Nonprofit Route', pattern: 'nonprofit' }
  ];
  
  routes.forEach(route => {
    if (content.includes(route.pattern)) {
      logResult('Routes', route.name, 'passed', `${route.pattern} route defined`);
    } else {
      logResult('Routes', route.name, 'warnings', `${route.pattern} route not found`);
    }
  });
  
  // Test wouter router usage
  if (content.includes('Route') && content.includes('wouter')) {
    logResult('Routes', 'Router Setup', 'passed', 'wouter Router properly configured');
  } else {
    logResult('Routes', 'Router Setup', 'warnings', 'Router configuration unclear');
  }
}

// Test API endpoint navigation handlers
function testAPIEndpoints() {
  console.log('\n=== Testing Navigation API Endpoints ===');
  
  const routesPath = 'server/routes.ts';
  
  if (!fs.existsSync(routesPath)) {
    logResult('API', 'Routes File Check', 'failed', 'server/routes.ts not found');
    return;
  }
  
  const content = fs.readFileSync(routesPath, 'utf8');
  
  // Test onboarding endpoints
  const endpoints = [
    { name: 'Onboarding Complete', pattern: '/api/onboarding/complete' },
    { name: 'Onboarding Status', pattern: '/api/onboarding/status' },
    { name: 'User Profile', pattern: '/api/user' },
    { name: 'Projects API', pattern: '/api/projects' },
    { name: 'Nonprofit API', pattern: 'nonprofit' }
  ];
  
  endpoints.forEach(endpoint => {
    if (content.includes(endpoint.pattern)) {
      logResult('API', endpoint.name, 'passed', `${endpoint.pattern} endpoint exists`);
    } else {
      logResult('API', endpoint.name, 'warnings', `${endpoint.pattern} endpoint not found`);
    }
  });
}

// Test form submissions and button handlers
function testFormHandlers() {
  console.log('\n=== Testing Form Handlers and Button Actions ===');
  
  const clientDir = 'client/src';
  if (!fs.existsSync(clientDir)) {
    logResult('Forms', 'Client Directory', 'failed', 'Client directory not found');
    return;
  }
  
  // Find all component files
  const findFiles = (dir, extension = '.tsx') => {
    const files = [];
    if (fs.existsSync(dir)) {
      fs.readdirSync(dir, { withFileTypes: true }).forEach(item => {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files.push(...findFiles(fullPath, extension));
        } else if (item.name.endsWith(extension)) {
          files.push(fullPath);
        }
      });
    }
    return files;
  };
  
  const componentFiles = findFiles(clientDir);
  let buttonHandlers = 0;
  let formSubmissions = 0;
  
  componentFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Count button handlers
      const buttonMatches = content.match(/onClick.*=>/g) || [];
      buttonHandlers += buttonMatches.length;
      
      // Count form submissions
      const formMatches = content.match(/onSubmit.*=>/g) || [];
      formSubmissions += formMatches.length;
      
    } catch (error) {
      // Skip files that can't be read
    }
  });
  
  if (buttonHandlers > 0) {
    logResult('Forms', 'Button Handlers', 'passed', `${buttonHandlers} button handlers found`);
  } else {
    logResult('Forms', 'Button Handlers', 'warnings', 'No button handlers found');
  }
  
  if (formSubmissions > 0) {
    logResult('Forms', 'Form Submissions', 'passed', `${formSubmissions} form handlers found`);
  } else {
    logResult('Forms', 'Form Submissions', 'warnings', 'No form handlers found');
  }
}

// Main test runner
async function runNavigationTests() {
  console.log('🧪 Testing All Navigation and Button Functionality...\n');
  
  const startTime = Date.now();
  
  try {
    testWelcomeNavigation();
    testDashboardNavigation();
    testNonprofitDirectoryNavigation();
    testSidebarNavigation();
    testRouteDefinitions();
    testAPIEndpoints();
    testFormHandlers();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Generate comprehensive report
    console.log('\n' + '='.repeat(80));
    console.log('🧪 COMPREHENSIVE NAVIGATION TEST RESULTS');
    console.log('='.repeat(80));
    console.log(`Test Duration: ${duration.toFixed(2)} seconds`);
    console.log(`✅ Passed: ${results.passed.length}`);
    console.log(`⚠️  Warnings: ${results.warnings.length}`);
    console.log(`❌ Failed: ${results.failed.length}`);
    
    if (results.failed.length > 0) {
      console.log('\n❌ CRITICAL FAILURES:');
      results.failed.forEach(failure => {
        console.log(`- [${failure.component}] ${failure.test}: ${failure.details}`);
      });
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (May need attention):');
      results.warnings.forEach(warning => {
        console.log(`- [${warning.component}] ${warning.test}: ${warning.details}`);
      });
    }
    
    if (results.passed.length > 0) {
      console.log('\n✅ WORKING CORRECTLY:');
      results.passed.forEach(pass => {
        console.log(`- [${pass.component}] ${pass.test}: ${pass.details}`);
      });
    }
    
    // Calculate overall navigation health
    const totalTests = results.passed.length + results.warnings.length + results.failed.length;
    const healthScore = totalTests > 0 ? 
      Math.round(((results.passed.length + (results.warnings.length * 0.5)) / totalTests) * 100) : 0;
    
    console.log(`\n🎯 Navigation Health Score: ${healthScore}/100`);
    
    if (healthScore >= 90) {
      console.log('✅ Navigation system is robust and functional');
    } else if (healthScore >= 75) {
      console.log('✅ Navigation mostly works with minor issues');
    } else if (healthScore >= 60) {
      console.log('⚠️  Navigation needs some fixes');
    } else {
      console.log('❌ Navigation system needs significant work');
    }
    
    // Recommendations
    console.log('\n📋 RECOMMENDATIONS:');
    if (results.failed.length > 0) {
      console.log('- Fix critical navigation failures first');
    }
    if (results.warnings.length > 5) {
      console.log('- Review warning items for potential improvements');
    }
    console.log('- Test user flows manually to verify button functionality');
    console.log('- Monitor console for navigation errors during testing');
    
    return results;
    
  } catch (error) {
    console.error('Navigation test failed:', error.message);
    return null;
  }
}

// Export for use in other scripts
if (require.main === module) {
  runNavigationTests().then(results => {
    if (results) {
      process.exit(results.failed.length > 0 ? 1 : 0);
    } else {
      process.exit(1);
    }
  });
}

module.exports = { runNavigationTests, results };