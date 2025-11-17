// Load environment variables first
import * as dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createDevHubAccessTable } from './migrations/dev-hub-access-table';
import { addAuthLevelColumn } from './migrations/auth-level-migration';
import { migrateNetworkingGoals } from './migrations/networking-goals-migration';
import { addConnectedWalletsColumn } from './migrations/add-connected-wallets';

const app = express();

// Critical: Trust proxy for Replit infrastructure
app.set('trust proxy', 1);

// Parse JSON and URL-encoded data
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Essential CORS and headers for external access
app.use((req, res, next) => {
  // Allow all origins for external access
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Credentials', 'false');
  
  // Prevent caching issues
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  next();
});

// Basic logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${req.ip}`);
  next();
});

// Immediate health check (before any other routes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'HyperDAG',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    external_access: true
  });
});

// Root endpoint for external verification
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>HyperDAG Platform</title>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body>
      <h1>HyperDAG Platform</h1>
      <p>Service is running and accessible</p>
      <p>External domain connectivity: <strong>ACTIVE</strong></p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    </body>
    </html>
  `);
});

async function startServer() {
  console.log('Starting HyperDAG server...');
  
  try {
    // Create HTTP server first
    const httpServer = createServer(app);
    
    // Register all routes
    await registerRoutes(app);
    
    // Setup Vite in development, static files in production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }
    
    // Get port from environment or default to 5000
    const port = parseInt(process.env.PORT || '5000', 10);
    
    // Listen on all interfaces for external access
    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`✅ HyperDAG server running on 0.0.0.0:${port}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ External access: ENABLED`);
      console.log(`✅ Health check: http://localhost:${port}/health`);
      console.log(`✅ Replit domain should now be accessible`);
      
      // Run database migrations after server is ready
      setTimeout(async () => {
        try {
          await createDevHubAccessTable();
          await addAuthLevelColumn();
          await migrateNetworkingGoals();
          await addConnectedWalletsColumn();
          console.log('✅ Database migrations completed');
        } catch (error) {
          console.error('❌ Migration error:', error);
        }
      }, 1000);
    });
    
    // Handle server errors
    httpServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();