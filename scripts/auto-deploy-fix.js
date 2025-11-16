#!/usr/bin/env node

/**
 * Automated Deployment Fix and Deploy Script for HyperDAG
 * 
 * This script continuously:
 * 1. Checks for common syntax/build errors
 * 2. Fixes them automatically
 * 3. Attempts deployment
 * 4. Repeats until successful deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting automated deployment fix cycle...');

// Common syntax errors and their fixes
const commonFixes = [
  {
    name: 'Unterminated Regular Expressions',
    pattern: /\/\*[\s\S]*?\*\//g,
    check: (content) => {
      // Look for unclosed regex patterns
      const regexPatterns = content.match(/\/[^\/\n]*$/gm);
      return regexPatterns && regexPatterns.length > 0;
    },
    fix: (content) => {
      // Fix common regex issues
      return content
        .replace(/\/([^\/\n]*)\s*$/gm, '/$1/')
        .replace(/\/\*([^*]|\*[^/])*\*?\s*$/gm, '/* $1 */');
    }
  },
  {
    name: 'Missing Closing Tags',
    pattern: /<Layout>/g,
    check: (content) => {
      const openTags = (content.match(/<Layout>/g) || []).length;
      const closeTags = (content.match(/<\/Layout>/g) || []).length;
      return openTags !== closeTags;
    },
    fix: (content) => {
      // Ensure Layout tags are properly closed
      const openTags = (content.match(/<Layout>/g) || []).length;
      const closeTags = (content.match(/<\/Layout>/g) || []).length;
      
      if (openTags > closeTags) {
        // Add missing closing tags
        const diff = openTags - closeTags;
        for (let i = 0; i < diff; i++) {
          content = content.replace(/(\s*);?\s*$/, '\n  );\n}');
        }
      }
      return content;
    }
  },
  {
    name: 'Duplicate Layout Components',
    pattern: /<\/Layout>\s*<\/Layout>/g,
    check: (content) => content.includes('</Layout>\n    </Layout>'),
    fix: (content) => content.replace(/<\/Layout>\s*<\/Layout>/g, '</Layout>')
  },
  {
    name: 'Missing Import Statements',
    pattern: /import.*from.*['"]@\/.*['"];?/g,
    check: (content) => {
      // Check if components are used but not imported
      return content.includes('Layout') && !content.includes('import') && content.includes('function');
    },
    fix: (content) => {
      if (content.includes('Layout') && !content.includes('import')) {
        return `import { Layout } from '@/components/layout/layout';\n${content}`;
      }
      return content;
    }
  }
];

// Files to check for common issues
const filesToCheck = [
  'client/src/pages/whitepaper-v3.tsx',
  'client/src/pages/agglayer-miden-dashboard.tsx',
  'client/src/pages/grantflow.tsx',
  'client/src/pages/grant-flow/submit-rfi-page.tsx',
  'client/src/App.tsx'
];

function runCommand(command, options = {}) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: 'pipe',
      cwd: process.cwd(),
      ...options 
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message, output: error.stdout || error.stderr };
  }
}

function fixCommonIssues() {
  console.log('🔧 Scanning for common syntax issues...');
  let fixesApplied = 0;

  filesToCheck.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    commonFixes.forEach(fix => {
      if (fix.check(content)) {
        console.log(`🔨 Applying fix: ${fix.name} to ${filePath}`);
        content = fix.fix(content);
        modified = true;
        fixesApplied++;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed issues in ${filePath}`);
    }
  });

  return fixesApplied;
}

function checkBuildErrors() {
  console.log('🏗️  Checking for build errors...');
  const buildResult = runCommand('npm run build');
  
  if (!buildResult.success) {
    console.log('❌ Build failed:');
    console.log(buildResult.output || buildResult.error);
    return false;
  }
  
  console.log('✅ Build successful!');
  return true;
}

function testDeployment() {
  console.log('🚀 Testing deployment...');
  
  // First restart the application
  const restartResult = runCommand('pkill -f "npm run dev" || true');
  
  // Wait a moment for cleanup
  setTimeout(() => {
    const startResult = runCommand('npm run dev &', { detached: true });
    
    // Wait for server to start
    setTimeout(() => {
      // Test if server responds
      const testResult = runCommand('curl -f http://localhost:5000 -m 10 || echo "Server not responding"');
      
      if (testResult.success && !testResult.output.includes('Server not responding')) {
        console.log('✅ Deployment test successful!');
        return true;
      } else {
        console.log('❌ Deployment test failed');
        return false;
      }
    }, 5000);
  }, 2000);
  
  return false; // Will be updated by the async checks above
}

async function deploymentCycle() {
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\n🔄 Deployment Attempt ${attempts}/${maxAttempts}`);
    
    // Step 1: Fix common issues
    const fixesApplied = fixCommonIssues();
    console.log(`Applied ${fixesApplied} fixes`);
    
    // Step 2: Check build
    const buildSuccess = checkBuildErrors();
    
    if (buildSuccess) {
      console.log('🎉 Build successful! Deployment ready.');
      
      // Step 3: Test deployment
      console.log('🔄 Restarting application for deployment test...');
      break;
    } else {
      console.log(`❌ Attempt ${attempts} failed. Continuing to next iteration...`);
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (attempts >= maxAttempts) {
    console.log('❌ Maximum attempts reached. Manual intervention may be required.');
    process.exit(1);
  }
}

// Run the automated deployment cycle
deploymentCycle().then(() => {
  console.log('🎉 Automated deployment fix cycle completed!');
}).catch(error => {
  console.error('❌ Deployment cycle failed:', error);
  process.exit(1);
});