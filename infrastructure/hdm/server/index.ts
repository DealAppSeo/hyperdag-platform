import { createServer } from "http";
import express from "express";
import compression from "compression";
import cors from "cors";
import { WebSocketServer } from "ws";
import path from "path";
import { setupVite, serveStatic, log } from "./vite";
import { db } from "./db";
import apiRouter from "./api";
import { metricsCollectionMiddleware, errorCollectionMiddleware } from "./middleware/metrics-collector";

// Initialize Trinity DragonflyDB Cache - Production
// @ts-ignore
import trinityCache from '../trinity-dragonfly-production.js';

// Initialize Trinity Distributed Messaging
import { initializeTrinityDistributed } from "./routes/trinity-distributed-api";

// Initialize Unified Supabase Client
import { unifiedSupabase } from "./services/shared/unified-supabase-client";

// Initialize Autonomous Decision-Making System
import { autonomous } from "./services/autonomous";

// Initialize Trinity Supabase Coordinator
import { trinityCoordinator } from "./services/trinity/trinity-supabase-coordinator";

// Initialize Trinity Tasks Seeder
import { seedTrinityTasks } from "./services/trinity/trinity-tasks-seeder";

// Initialize Autonomous Free Coding (must be imported eagerly to run singleton initialization)
import { autonomousFreeCoding } from "./services/autonomous/autonomous-free-coding";
import { freeTierMonitor } from "./services/autonomous/free-tier-quota-monitor";

// Initialize Veritas-enhanced Trinity (hallucination suppression with 95% confidence threshold)
import { veritasAutonomousEngine } from "./services/autonomous/veritas-integration";
import { veritasEnhancedTrinity } from "./services/trinity/veritas-enhanced-trinity";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for Trinity Symphony cross-deployment coordination
  app.use(cors({
    origin: true, // Allow all origins for Trinity coordination
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Trinity-Manager'],
    exposedHeaders: ['X-Trinity-Response-Time', 'X-Manager-Id']
  }));
  
  // Enable gzip compression for all responses (20-30% smaller payloads)
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6, // Balanced compression level (1=fast, 9=best compression)
  }));
  
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  
  // Wire real metrics collection into all requests
  app.use(metricsCollectionMiddleware);

  // Initialize Trinity Symphony DragonflyDB cache (non-blocking)
  console.log('🎼 Initializing Trinity Symphony DragonflyDB...');
  trinityCache.initialize()
    .then(() => console.log('✅ Trinity Symphony DragonflyDB cache ready'))
    .catch((error: any) => console.warn('⚠️ DragonflyDB not available, using mock cache:', error.message));

  // Initialize Unified Supabase Client (non-blocking)
  console.log('📦 Initializing Unified Supabase Client...');
  unifiedSupabase.initialize()
    .then(() => console.log('✅ Unified Supabase client ready'))
    .catch((error) => console.warn('⚠️ Supabase not configured:', error.message));

  // Initialize Trinity Distributed Communication (non-blocking)
  console.log('📡 Initializing Trinity Distributed Messaging...');
  initializeTrinityDistributed()
    .then(() => console.log('✅ Trinity distributed coordination ready'))
    .catch((error) => console.warn('⚠️ Trinity distributed messaging not available:', error.message));

  // Initialize Trinity Supabase Coordinator (non-blocking)
  console.log('🎼 Initializing Trinity Supabase Coordinator...');
  trinityCoordinator.initialize()
    .then(() => console.log('✅ Trinity Supabase coordination ready'))
    .catch((error) => console.warn('⚠️ Trinity Supabase coordinator not available:', error.message));

  // Initialize Autonomous Decision-Making System (non-blocking)
  console.log('🤖 Initializing Autonomous Decision-Making System...');
  try {
    autonomous.initialize();
    console.log('✅ Autonomous system ready');
    console.log('   - Decision Engine: No-downside heuristic active');
    console.log('   - Problem Detector: Monitoring every 5 minutes');
    console.log('   - Debate Protocol: Anti-loop mechanisms enabled');
    console.log('   - Auto-Fix Executor: Test & rollback ready');
  } catch (error: any) {
    console.warn('⚠️ Autonomous system initialization failed:', error.message);
  }

  // Seed Trinity Tasks (non-blocking)
  console.log('📋 Initializing Trinity Roadmap...');
  seedTrinityTasks()
    .then(() => console.log('✅ Trinity roadmap ready at /trinity-roadmap'))
    .catch((error) => console.warn('⚠️ Trinity tasks seeding failed:', error.message));

  // Initialize Autonomous Free Coding
  console.log('🤖💰 Initializing Autonomous Free Coding...');
  const freeStatus = autonomousFreeCoding.getStatus();
  console.log('✅ Autonomous free coding enabled');
  console.log(`   - Free providers available: ${freeStatus.freeProvidersAvailable}`);
  console.log(`   - Can run now: ${freeStatus.canRunNow}`);
  console.log(`   - Estimated daily savings: $${freeStatus.estimatedDailySavings.toFixed(2)}`);

  // API routes
  app.use("/api", apiRouter);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Temporary direct HTML route to bypass React mounting issues
  app.get("/direct", (req, res) => {
    res.sendFile(path.join(import.meta.dirname, "../client/index-direct.html"));
  });

  // QuantumMath.ai landing page (MUST be before Vite middleware)
  app.get("/quantummath", (req, res) => {
    res.sendFile(path.join(import.meta.dirname, "../client/quantummath.html"));
  });

  // Setup Vite in development or serve static files in production
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }
  
  // Wire error collection middleware (must be after all routes)
  app.use(errorCollectionMiddleware);

  // Initialize WebSocket Server for Trinity Symphony real-time coordination
  const wss = new WebSocketServer({ server, path: '/ws/trinity' });
  
  wss.on('connection', (ws, req) => {
    const managerId = req.headers['x-trinity-manager'] as string || 'unknown';
    log(`[Trinity WebSocket] Manager connected: ${managerId}`);
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        log(`[Trinity WebSocket] Message from ${managerId}: ${message.type}`);
        
        // Broadcast to all other managers
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === 1) { // WebSocket.OPEN = 1
            client.send(JSON.stringify({
              from: managerId,
              ...message,
              timestamp: Date.now()
            }));
          }
        });
      } catch (error) {
        console.error('[Trinity WebSocket] Parse error:', error);
      }
    });
    
    ws.on('close', () => {
      log(`[Trinity WebSocket] Manager disconnected: ${managerId}`);
    });
    
    ws.on('error', (error) => {
      console.error(`[Trinity WebSocket] Error for ${managerId}:`, error);
    });
  });
  
  log(`[Trinity WebSocket] Server initialized on path /ws/trinity`);
  
  // Start server
  const PORT = parseInt(process.env.PORT || "5000", 10);

  server.listen(PORT, "0.0.0.0", () => {
    log(`Server running on port ${PORT}`);
    log(`[Trinity WebSocket] Available at ws://0.0.0.0:${PORT}/ws/trinity`);
  });

  return server;
}

startServer().catch(console.error);

export default startServer;