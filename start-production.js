#!/usr/bin/env node
/**
 * Production Server Starter for HyperDAG
 * 
 * This script ensures the server runs correctly in production mode
 * with proper environment variables and error handling.
 */

import { existsSync } from 'fs';
import { spawn } from 'child_process';

const log = (message) => {
  console.log(`[start] ${message}`);
};

function startProductionServer() {
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Check if compiled server exists
  if (!existsSync('server/index.js')) {
    log('✗ Production server file not found at server/index.js');
    log('Please run the build process first: node build.js');
    process.exit(1);
  }
  
  // Check if client build exists
  if (!existsSync('server/public/index.html')) {
    log('✗ Client build not found at server/public/index.html');
    log('Please run the build process first: node build.js');
    process.exit(1);
  }
  
  log('Starting HyperDAG production server...');
  log(`Port: ${process.env.PORT || 5000}`);
  log(`Environment: ${process.env.NODE_ENV}`);
  
  // Start the server
  const server = spawn('node', ['server/index.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  });
  
  server.on('error', (error) => {
    log(`✗ Server startup failed: ${error.message}`);
    process.exit(1);
  });
  
  server.on('exit', (code, signal) => {
    if (code !== 0) {
      log(`✗ Server exited with code ${code} and signal ${signal}`);
      process.exit(1);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    log('Received SIGTERM, shutting down gracefully...');
    server.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    log('Received SIGINT, shutting down gracefully...');
    server.kill('SIGINT');
  });
}

startProductionServer();