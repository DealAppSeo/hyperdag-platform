/**
 * Simplified Server Configuration for External Connectivity
 * Removes all blocking middleware to ensure Replit domain access
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { registerRoutes } from './routes';
import { setupVite, serveStatic, log } from './vite';

const app = express();

// Minimal required middleware for external access
app.set('trust proxy', true);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Enable CORS for all requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`${req.method} ${req.path}`);
  }
  next();
});

async function startServer() {
  try {
    // Register API routes
    const server = await registerRoutes(app);
    
    // Setup Vite or static serving
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Listen on all interfaces for external access
    server.listen(port, '0.0.0.0', () => {
      console.log(`🚀 HyperDAG server running on port ${port}`);
      console.log(`📡 External access enabled at 0.0.0.0:${port}`);
      console.log(`🌐 Replit domain should be accessible`);
      log(`serving on port ${port}`);
    });
    
    return server;
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

export default startServer;