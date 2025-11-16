#!/usr/bin/env node
/**
 * Production Build Script for HyperDAG
 * 
 * This script handles the complete production build process:
 * 1. Builds the client application
 * 2. Compiles the TypeScript server to JavaScript
 * 3. Ensures all production files are ready for deployment
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const log = (message) => {
  console.log(`[build] ${message}`);
};

const runCommand = (command, description) => {
  log(`${description}...`);
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completed successfully`);
  } catch (error) {
    log(`✗ ${description} failed: ${error.message}`);
    process.exit(1);
  }
};

async function buildProduction() {
  log('Starting production build process...');
  
  // Ensure directories exist
  if (!existsSync('server/public')) {
    mkdirSync('server/public', { recursive: true });
  }
  
  // Build client application
  runCommand(
    'vite build --mode production --minify esbuild',
    'Building client application'
  );
  
  // Compile TypeScript server to JavaScript with production optimizations
  const serverBuildCommand = [
    'esbuild server/index.ts',
    '--platform=node',
    '--packages=external',
    '--bundle',
    '--format=esm',
    '--outfile=server/index.js',
    '--minify',
    '--target=node18',
    '--define:process.env.NODE_ENV=\\"production\\"',
    '--define:process.env.HYPERDAG_COMPILED=\\"true\\"',
    '--sourcemap=external',
    '--tree-shaking=true'
  ].join(' ');
  
  runCommand(serverBuildCommand, 'Compiling server TypeScript to JavaScript');
  
  // Verify build outputs
  if (!existsSync('server/public/index.html')) {
    log('⚠ Warning: Client build output not found at server/public/index.html');
    log('Checking dist directory...');
    
    if (existsSync('dist/index.html')) {
      log('Found client build in dist/, copying to server/public/...');
      runCommand('cp -r dist/* server/public/', 'Copying client build to server/public');
    } else {
      log('✗ Client build not found in expected locations');
      process.exit(1);
    }
  }
  
  if (!existsSync('server/index.js')) {
    log('✗ Server compilation failed - server/index.js not found');
    process.exit(1);
  }
  
  // Add production flag to compiled server
  const compiledServer = readFileSync('server/index.js', 'utf8');
  const productionServer = `// HyperDAG Production Build - ${new Date().toISOString()}\nprocess.env.HYPERDAG_COMPILED = 'true';\n${compiledServer}`;
  writeFileSync('server/index.js', productionServer);
  
  log('✓ Production build completed successfully!');
  log('✓ Client build: server/public/');
  log('✓ Server build: server/index.js'); 
  log('Ready for deployment with: npm start');
}

buildProduction().catch(error => {
  log(`✗ Build failed: ${error.message}`);
  process.exit(1);
});