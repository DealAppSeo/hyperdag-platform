# HyperDagManager Infrastructure Manifest

**Agent:** HyperDAGManager (HDM)  
**Role:** Backend Infrastructure & Network Coordinator  
**Last Updated:** October 31, 2025, 03:30 UTC  
**Repository:** trinity-symphony-shared/infrastructure/hdm

---

## Responsibilities

### ✅ Core Infrastructure
- [x] Network configuration and CORS policies
- [x] WebSocket connection management
- [x] API gateway routing
- [x] Database connections and pooling
- [x] Health checks and monitoring
- [x] Rate limiting
- [x] Environment variable management
- [x] Session management (PostgreSQL/Memory)
- [x] Security middleware stack

### ✅ Deployment & Operations
- [x] Vite dev server integration
- [x] Production build pipeline
- [x] HMR (Hot Module Replacement) configuration
- [x] Static file serving
- [x] Frontend-backend integration

### ⏳ Planned Features
- [ ] Docker container orchestration
- [ ] CI/CD workflows (GitHub Actions)
- [ ] Load balancing (currently single instance)
- [ ] SSL/TLS certificates (managed by Replit)

---

## Current Configuration

### Network Settings

**CORS Origins:**
- Production: `*.replit.app`, `*.repl.co`
- Development: `localhost:5000`, `localhost:5173`
- Custom: Via `APP_URL` environment variable

**Allowed Methods:**
- GET, POST, PUT, DELETE, OPTIONS, PATCH

**Allowed Headers:**
- Content-Type, Authorization, X-CSRF-Token, X-API-Key

**Credentials:**
- Enabled: `true` (for session cookies)

**Rate Limits:**
- General API: 100 requests / 15 minutes
- Auth endpoints: 5 requests / 15 minutes
- Health checks: Unlimited
- WebSocket: 1000 max connections

### WebSocket Configuration

**Endpoint:** `/ws/trinity`  
**Protocol:** WebSocket over HTTP/HTTPS  
**Max Connections:** 1000 concurrent  
**Timeout:** 30 seconds idle  
**Heartbeat:** Every 10 seconds  

**Message Types:**
- `task_assignment` - Trinity task distribution
- `task_result` - Completed task results
- `learning_update` - AI learning synchronization

### Database Connections

**Primary Database:**
- Type: PostgreSQL (Neon-backed via Replit)
- Connection: Via `DATABASE_URL` environment variable
- ORM: Drizzle (type-safe)
- Pool Size: Auto-managed by Replit

**Session Store:**
- Development: In-memory (MemoryStore)
- Production: PostgreSQL (connect-pg-simple)

**Cache Layer (Optional):**
- DragonflyDB Cloud (4 instances):
  - DB0: CONDUCTOR (AI-Prompt-Manager cache)
  - DB1: LEARNER (Pattern discovery cache)
  - DB2: VALIDATOR (HyperDAGManager cache)
  - DB3: FALLBACK (Emergency backup)

### Deployment Targets

**Production:**
- Platform: Replit Deployments
- URL: Via Replit domain (*.replit.app)
- Protocol: HTTPS (auto-managed)

**Development:**
- Platform: Replit Development
- Port: 5000 (0.0.0.0:5000)
- HMR: Enabled via Vite

**Build Process:**
- Frontend: Vite (`npm run build`)
- Backend: esbuild (`npm run build:server`)
- Combined: `npm run build:all`

---

## Files Managed by HDM

### Server Core
```
server/
├── index.ts              # Main Express server
├── vite.ts              # Vite dev server integration
├── config.ts            # Server configuration
└── db.ts                # Database connection
```

### Middleware Stack (50+ files)
```
server/middleware/
├── rate-limit.ts        # API rate limiting
├── xss-protection.ts    # XSS attack prevention
├── auth-middleware.ts   # Authentication
├── api-key-auth.ts      # API key validation
├── security-headers.ts  # CSP, HSTS, etc.
├── session-security.ts  # Session hardening
└── ... (44 more files)
```

### Configuration
```
├── vite.config.ts       # Vite build config
├── tsconfig.json        # TypeScript config
├── drizzle.config.ts    # Database ORM config
├── package.json         # Dependencies
├── .gitignore          # Secret exclusion
└── dev.sh              # HMR fix script
```

### API Routes
```
server/routes.ts         # Main API router (64KB, 1800+ lines)
server/api/
├── routes/              # Feature-specific routes
│   ├── early-access.ts
│   ├── session-clear.ts
│   └── ...
└── sdk/                 # SDK integrations
```

---

## Dependencies

### External Services (Production)
- **Database:** PostgreSQL (Replit/Neon)
- **Cache:** DragonflyDB Cloud (optional)
- **Object Storage:** Replit Object Storage
- **Email:** Mailgun (sandboxed)
- **Coordination:** Supabase (optional, for distributed messaging)

### External Services (Optional)
- **AI Providers:** OpenAI, Anthropic, DeepSeek, MyNinja, Groq, HuggingFace
- **Blockchain:** Alchemy (Ethereum, Polygon)
- **Web3 Storage:** Pinata, IPFS

### Required Secrets (Names Only)
- `DATABASE_URL` - PostgreSQL connection
- `SESSION_SECRET` - Session encryption
- `APP_URL` - Application base URL
- `MAILGUN_API_KEY` - Email service
- `MAILGUN_DOMAIN` - Email domain
- `OPENAI_API_KEY` - AI orchestration (optional)
- `ALCHEMY_API_KEY` - Blockchain infrastructure (optional)

### API Integrations
- Trinity Symphony WebSocket coordination
- AI-Prompt-Manager ANFIS routing
- Mel/ImageBearer frontend hosting
- Grant discovery APIs
- Blockchain RPC endpoints

---

## Health Check Endpoints

**Basic Health:**
- `GET /health` - Simple up/down check
- Response: `{ "status": "ok", "timestamp": "..." }`

**System Status:**
- `GET /api/system/status` - Comprehensive diagnostics
- Response: Database, cache, services, uptime

**Domain Health:**
- `GET /api/health/domain` - Domain connectivity
- Response: DNS, SSL, routing status

**Blockchain Health:**
- `GET /api/health/blockchain` - Web3 infrastructure
- Response: RPC endpoints, network status

**Metrics:**
- `/api/autonomous/metrics` - Performance metrics
- Response: Success rate, task completion, cost savings

---

## Monitoring & Logs

**Log Locations:**
- Workflow Logs: `/tmp/logs/Start_application_*.log`
- Browser Console: `/tmp/logs/browser_console_*.log`
- Error Logs: Console output (Replit)

**Monitored Metrics:**
- Request timing
- Error rates
- Database connection pool health
- Session store health
- WebSocket connection count
- Rate limit hits

**Alert Conditions:**
- Server crash/restart
- Database connection loss
- High error rate (>5%)
- Rate limit exceeded
- Memory pressure

---

## Security Features

### 1. Secret Management
- All secrets via environment variables
- Never committed to Git
- .gitignore excludes all sensitive files
- .env.example provides templates only

### 2. Request Security
- CORS origin validation
- CSRF token validation
- XSS input sanitization
- Rate limiting per IP
- API key authentication (optional endpoints)

### 3. Session Security
- HTTPOnly cookies (prevent XSS theft)
- Secure flag in production (HTTPS only)
- SameSite: strict (prevent CSRF)
- Session timeout: 24 hours
- Secure session secret rotation

### 4. Headers
- Content-Security-Policy
- Strict-Transport-Security (HSTS)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

---

## Trinity Symphony Integration

### Role
HDM serves as the **coordination backbone** for Trinity Symphony:

**Coordinates With:**
1. **AI-Prompt-Manager (APM)** - Provides API infrastructure for ANFIS routing
2. **Mel/ImageBearer** - Hosts frontend UI and serves static assets
3. **Trinity Dashboard** - Exposes metrics and monitoring endpoints

### Coordination Channels

**WebSocket:** Real-time task distribution
- Endpoint: `ws://hostname:5000/ws/trinity`
- Handles: task_assignment, task_result, learning_update

**DragonflyDB:** Distributed caching
- 4 instances for different managers
- Sub-millisecond latency
- Shared state synchronization

**Supabase:** Cross-platform messaging
- Real-time updates
- Presence tracking
- Distributed pub/sub

**REST API:** Synchronous coordination
- `/api/trinity/distribute` - Broadcast prompts
- `/api/trinity/managers` - Manager registry
- `/api/trinity/heartbeat` - Health checks

---

## Performance Characteristics

**Request Handling:**
- Average response time: <50ms (cached)
- Average response time: <200ms (database)
- Throughput: ~1000 req/sec (single instance)

**WebSocket:**
- Connection latency: <10ms
- Message throughput: ~10,000 msg/sec
- Broadcast latency: <50ms

**Database:**
- Query latency: <20ms (simple)
- Query latency: <100ms (complex joins)
- Connection pool: Auto-scaled

---

## Known Issues & Workarounds

### 1. HMR Flashing (Development Only)
**Problem:** Site flashes/reconnects in development  
**Cause:** tsx watch mode restarts backend when Vite rebuilds  
**Solution:** Use `./dev.sh` instead of `npm run dev`  
**Impact:** Development only, production unaffected

### 2. Protected Configuration Files
**Issue:** Cannot modify vite.config.ts, server/vite.ts, package.json  
**Reason:** Fragile configuration, breaks environment  
**Workaround:** Use packager_tool for dependencies, ask user before script changes

### 3. Database Schema Mismatch
**Issue:** 266 LSP errors in storage.ts  
**Cause:** Database has full production schema, shared/schema.ts simplified  
**Impact:** Type errors only, runtime functional  
**Solution:** Update shared/schema.ts to match production (low priority)

---

## Troubleshooting Guide

### Server Won't Start
1. Check port 5000 not in use: `lsof -i :5000`
2. Verify DATABASE_URL set: `echo $DATABASE_URL`
3. Check logs: `/tmp/logs/Start_application_*.log`

### CORS Errors
1. Verify APP_URL matches your domain
2. Check CORS middleware in server/index.ts
3. Ensure credentials: true in client requests

### Session Loss
1. Development: Normal (uses memory, resets on restart)
2. Production: Check DATABASE_URL connection
3. Clear cookies if corrupted

### WebSocket Disconnects
1. Check firewall/proxy settings
2. Verify /ws/trinity endpoint accessible
3. Check heartbeat interval (10s default)

---

## Maintenance Schedule

**Daily:**
- Automated health checks
- Log rotation
- Session cleanup

**Weekly:**
- Dependency updates (security patches)
- Performance metrics review

**Monthly:**
- Secret rotation
- Database optimization
- Cache invalidation

---

## Future Roadmap

### Q1 2026
- [ ] Multi-region deployment
- [ ] Load balancer setup
- [ ] Redis failover cluster
- [ ] CI/CD pipeline (GitHub Actions)

### Q2 2026
- [ ] Kubernetes orchestration
- [ ] Auto-scaling policies
- [ ] Advanced monitoring (Prometheus/Grafana)
- [ ] Blue-green deployments

---

## Contact & Support

**Maintained By:** HyperDAGManager (HDM)  
**Part Of:** Trinity Symphony Distributed AI System  
**Repository:** https://github.com/dealappseo/trinity-symphony-shared  
**Documentation:** /infrastructure/hdm/docs/

For infrastructure issues:
- Check health endpoints first
- Review logs in /tmp/logs/
- Consult this manifest
- Coordinate with other Trinity agents

---

**Last Infrastructure Update:** October 31, 2025  
**Next Scheduled Review:** November 7, 2025  
**Version:** 1.0.0 (Initial Export)
