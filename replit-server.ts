import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";

const app = express();

// Critical Replit configuration
app.set('trust proxy', true);
app.disable('x-powered-by');

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Essential CORS for Replit external access
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Basic request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    host: '0.0.0.0',
    replit_ready: true
  });
});

// Serve static files for production or development
const staticPath = path.join(process.cwd(), 'client', 'dist');
const devIndexPath = path.join(process.cwd(), 'client', 'index.html');

if (fs.existsSync(staticPath)) {
  // Production mode
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else if (fs.existsSync(devIndexPath)) {
  // Development mode - serve index.html directly
  app.get('/', (req, res) => {
    res.sendFile(devIndexPath);
  });
  
  // Serve client assets
  app.use('/src', express.static(path.join(process.cwd(), 'client', 'src')));
  app.use('/node_modules', express.static(path.join(process.cwd(), 'node_modules')));
  
  // Fallback for SPA routes
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API endpoint not found' });
    } else {
      res.sendFile(devIndexPath);
    }
  });
} else {
  // Fallback HTML
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>HyperDAG Platform</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          .status { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>HyperDAG Platform</h1>
        <div class="status">
          <h3>Server Status: Running</h3>
          <p>Port: ${process.env.PORT || 5000}</p>
          <p>Time: ${new Date().toISOString()}</p>
          <p>External Access: Enabled</p>
          <p>Replit Domain: Active</p>
        </div>
        <p><a href="/health">Health Check</a></p>
      </body>
      </html>
    `);
  });
}

// Create HTTP server
const httpServer = createServer(app);

// Configure server for external access
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`🚀 HyperDAG Server running on ${HOST}:${PORT}`);
  console.log(`🌐 External access enabled for Replit domain`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`⚡ Ready to accept connections`);
});

// Handle server errors
httpServer.on('error', (error: any) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default httpServer;