// Load environment variables
import * as dotenv from 'dotenv';
dotenv.config();

import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { createDevHubAccessTable } from './migrations/dev-hub-access-table';
import { addAuthLevelColumn } from './migrations/auth-level-migration';
import { migrateNetworkingGoals } from './migrations/networking-goals-migration';
import { addConnectedWalletsColumn } from './migrations/add-connected-wallets';

const app = express();

// Essential configuration for external access
app.set('trust proxy', true);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

// Enable CORS for external access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Simple request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

async function startServer() {
  try {
    const server = await registerRoutes(app);

    // Setup Vite in development, static files in production
    if (process.env.NODE_ENV === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    
    server.listen(port, '0.0.0.0', () => {
      log(`serving on port ${port}`);
      console.log(`HyperDAG server running on 0.0.0.0:${port}`);
      console.log(`External access enabled for Replit domain`);
      
      // Run migrations after server starts
      setImmediate(async () => {
        try {
          await createDevHubAccessTable();
          await addAuthLevelColumn();
          await migrateNetworkingGoals();
          await addConnectedWalletsColumn();
          log('Database migrations completed successfully', 'migration');
        } catch (error) {
          console.error('Migration error:', error);
        }
      });
    });

  } catch (error) {
    console.error('Server startup failed:', error);
    process.exit(1);
  }
}

startServer();