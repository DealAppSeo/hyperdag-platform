# HyperDAGManager (HDM) Infrastructure Export

**Agent:** HyperDAGManager  
**Role:** Backend Infrastructure & Deployment Coordinator  
**Export Date:** October 31, 2025  
**Mission:** Trinity Symphony GitHub Sync

## 🎯 Purpose

This directory contains the core infrastructure code for HyperDAGManager, the backbone of Trinity Symphony's deployment, networking, and CORS configuration.

## 📁 Directory Structure

```
infrastructure/hdm/
├── server/              # Core server infrastructure
│   ├── index.ts        # Main server entry point
│   ├── vite.ts         # Vite dev server integration
│   ├── config.ts       # Server configuration
│   └── middleware/     # Security & API middleware
├── deployment/         # Build & deployment configs
│   ├── package.json    # Dependencies
│   ├── vite.config.ts  # Vite build configuration
│   ├── tsconfig.json   # TypeScript configuration
│   ├── drizzle.config.ts # Database ORM config
│   └── dev.sh          # Development startup script
├── networking/         # API routes & networking
└── docs/              # Documentation (this file)
```

## 🔧 Key Infrastructure Components

### 1. Server Setup (server/index.ts)
- Express server initialization
- Session management
- CORS configuration
- API route registration
- WebSocket support
- Trinity Symphony coordination

### 2. Vite Integration (server/vite.ts)
- Dev server middleware
- HMR (Hot Module Replacement)
- Frontend-backend integration
- Static file serving

### 3. Middleware Stack
- **CORS:** Cross-origin request handling
- **Sessions:** Express session management
- **Rate Limiting:** API rate limits
- **XSS Protection:** Input sanitization
- **API Key Auth:** Authentication middleware
- **Turnstile:** Bot protection

### 4. Deployment Configuration
- **Vite:** Frontend build system
- **TypeScript:** Type-safe compilation
- **Drizzle:** Database ORM
- **npm scripts:** Build automation

## 🌐 Networking Architecture

### CORS Policy
```typescript
// Allows requests from:
- Production domains (*.replit.app)
- Development servers (localhost:5000)
- Trinity Symphony coordination endpoints
```

### Session Configuration
```typescript
// Session settings:
- Store: PostgreSQL (production) / Memory (development)
- Secure cookies in production
- SameSite: strict
- HTTPOnly: true
```

### API Structure
```
/api/               - Main API routes
/trinity/           - Trinity Symphony coordination
/ws/trinity         - WebSocket for real-time sync
/health             - Health check endpoints
```

## 🚀 Deployment Process

### Development
```bash
# Run with HMR fix (prevents site flashing)
./dev.sh

# Or standard npm dev (may have HMR reconnection loop)
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Start production server
npm start
```

### Environment Variables Required
See `.env.example` for complete list. Critical variables:
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption
- `NODE_ENV` - Environment (development/production)
- `APP_URL` - Application base URL

## 🔒 Security Features

1. **No Secrets in Code:** All sensitive data via environment variables
2. **CSRF Protection:** Token validation on state-changing requests
3. **Rate Limiting:** Prevents abuse
4. **XSS Protection:** Input sanitization
5. **Secure Sessions:** HTTPOnly, Secure, SameSite cookies

## 📊 Monitoring & Health

### Health Check Endpoints
- `/health` - Basic server health
- `/api/health/domain` - Domain connectivity
- `/api/health/blockchain` - Web3 infrastructure
- `/api/system/status` - Full system status

### Performance Metrics
- Request timing
- Error rates
- Database connection pool
- Session store health

## 🔄 Trinity Symphony Integration

HDM serves as the coordination backbone for:
- **AI-Prompt-Manager (APM):** ANFIS routing coordination
- **Mel/ImageBearer:** Frontend hosting & API
- **Trinity Dashboard:** Metrics & monitoring

### Coordination Protocol
1. WebSocket connection at `/ws/trinity`
2. Real-time task distribution
3. Distributed caching (DragonflyDB)
4. Cross-platform messaging (Supabase)

## 🛠 Troubleshooting

### Site Flashing (HMR Loop)
**Problem:** Vite reconnects constantly in development  
**Cause:** tsx watch mode restarts backend when files change  
**Solution:** Use `./dev.sh` instead of `npm run dev`

### CORS Errors
**Check:** APP_URL environment variable matches your domain  
**Verify:** CORS middleware allows your origin

### Session Issues
**Development:** Uses in-memory store (resets on restart)  
**Production:** Uses PostgreSQL (persistent)

## 📝 Implementation Notes

- **Port Binding:** Frontend MUST bind to 0.0.0.0:5000
- **Database:** PostgreSQL via Drizzle ORM
- **Migrations:** Use `npm run db:push` (never manual SQL)
- **Protected Files:** Cannot modify vite.config.ts, server/vite.ts, package.json

## 🤝 Contributing

When modifying HDM infrastructure:
1. Test in development first
2. Verify no secrets committed
3. Update this documentation
4. Push to GitHub
5. Coordinate with other Trinity agents

## 📞 Support

For issues with HDM infrastructure:
- Check `/tmp/logs/` for error logs
- Review health endpoints
- Consult Trinity Symphony coordination logs

---

**Last Updated:** October 31, 2025  
**Maintained By:** HyperDAGManager (HDM)  
**Part Of:** Trinity Symphony Distributed AI System
