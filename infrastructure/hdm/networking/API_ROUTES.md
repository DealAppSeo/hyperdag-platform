# HDM Networking & API Routes Structure

**Last Updated:** October 31, 2025  
**Component:** HyperDAGManager Backend Infrastructure

## 🌐 Server Configuration

### Base Server
- **Host:** 0.0.0.0
- **Port:** 5000
- **Protocol:** HTTP/HTTPS
- **WebSocket:** Enabled at `/ws/trinity`

### CORS Configuration
```typescript
Origins Allowed:
- Production: *.replit.app, *.repl.co
- Development: localhost:5000, localhost:5173
- Custom: Process.env.APP_URL

Credentials: true
Methods: GET, POST, PUT, DELETE, OPTIONS
```

## 📡 API Route Structure

### Core Routes

#### Health & Status
```
GET /health                    - Basic health check
GET /api/health/domain        - Domain connectivity status
GET /api/health/blockchain    - Blockchain infrastructure status
GET /api/system/status        - Full system diagnostics
```

#### Authentication
```
POST /api/register            - User registration
POST /api/login               - User login
POST /api/logout              - User logout
GET  /api/user                - Get current user
```

#### Trinity Symphony Coordination
```
GET  /trinity-roadmap         - Trinity task dashboard
GET  /api/trinity/managers    - List all Trinity managers
POST /api/trinity/managers    - Register new manager
POST /api/trinity/heartbeat   - Manager health ping
POST /api/trinity/distribute  - Distribute prompt to all managers
GET  /api/trinity/tasks       - Get prioritized tasks
```

#### AI Orchestration
```
POST /api/ai/execute          - Execute AI task with ANFIS routing
GET  /api/ai/providers        - List available AI providers
GET  /api/ai/usage            - AI usage statistics
POST /api/anfis/optimize      - ANFIS fuzzy logic optimization
```

#### Autonomous Systems
```
GET  /api/autonomous/status   - Autonomous decision system status
POST /api/autonomous/detect   - Trigger problem detection
GET  /api/autonomous/metrics  - Performance metrics
```

#### Free-Tier Monitoring
```
GET  /api/free-tier/status    - Free-tier utilization
GET  /api/free-tier/savings   - Cost savings report
POST /api/free-tier/allocate  - Allocate free-tier resources
```

#### Web3 & Blockchain
```
POST /api/blockchain/deploy   - Deploy smart contract
GET  /api/blockchain/networks - List supported networks
POST /api/repid/create        - Create RepID credential
GET  /api/repid/:userId       - Get user RepID
POST /api/zkp/prove           - Generate zero-knowledge proof
POST /api/zkp/verify          - Verify ZK proof
```

#### Early Access & Newsletter
```
POST /api/early-access        - Submit early access form
POST /api/newsletter          - Newsletter signup
```

### Service Routes

#### Grant Discovery
```
GET  /api/grants              - Search grants
POST /api/grants/match        - Match user to grants
GET  /api/grants/:id          - Get grant details
```

#### Analytics
```
GET  /api/analytics/dashboard - Analytics overview
POST /api/analytics/track     - Track event
GET  /api/analytics/export    - Export data
```

#### File Storage
```
GET  /api/offloaded-files     - List offloaded files
GET  /api/offloaded-files/:id - Get specific file
GET  /api/offloaded-files/path/* - Get file by path
GET  /api/offloaded-files/stats - Storage statistics
```

## 🔒 Security Middleware Chain

### Request Flow
```
1. CORS Check           - Origin validation
2. Rate Limiting        - Prevent abuse
3. XSS Protection       - Input sanitization
4. Session Management   - User session handling
5. CSRF Validation      - Token verification
6. API Key Auth         - Service authentication (optional)
7. Route Handler        - Business logic
8. Error Handler        - Graceful error responses
```

### Rate Limits
```typescript
General API: 100 requests / 15 minutes
Auth endpoints: 5 requests / 15 minutes
Health checks: Unlimited
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-10-31T00:00:00Z"
}
```

### Error Response
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

## 🔄 WebSocket Protocol

### Connection
```
ws://hostname:5000/ws/trinity
```

### Message Types
```json
{
  "type": "task_assignment",
  "payload": { ... }
}

{
  "type": "task_result",
  "payload": { ... }
}

{
  "type": "learning_update",
  "payload": { ... }
}
```

## 🌍 External Integrations

### Blockchain RPC Endpoints
- Ethereum: via Alchemy
- Polygon: via Alchemy
- Solana: Public RPC

### AI Provider Endpoints
- OpenAI: api.openai.com
- Anthropic: api.anthropic.com
- DeepSeek: api.deepseek.com
- MyNinja: my-ninja.com/api
- HuggingFace: huggingface.co/api

### Storage & Caching
- PostgreSQL: Primary database
- DragonflyDB: Distributed cache (4 instances)
- Supabase: Cross-platform coordination
- Replit Object Storage: File storage

## 📝 Implementation Notes

### Port Binding
- MUST bind to 0.0.0.0:5000 (not localhost)
- Frontend and backend on same port
- Vite middleware handles frontend routes
- Express handles API routes

### Static Files
- Frontend: Served by Vite in dev, Express in production
- Public assets: /server/public
- Object storage: Offloaded to Replit storage

### Session Management
- Development: In-memory (MemoryStore)
- Production: PostgreSQL (connect-pg-simple)
- Cookie: httpOnly, secure (production), sameSite: strict

## 🐛 Common Issues

### CORS Errors
- Verify APP_URL matches your domain
- Check CORS middleware configuration
- Ensure credentials: true in client requests

### 502 Bad Gateway
- Server not bound to 0.0.0.0
- Port 5000 blocked
- Backend crashed (check logs)

### Session Loss
- Development uses memory (resets on restart)
- Production uses PostgreSQL (persistent)
- Clear cookies if session corrupted

---

**Part of:** Trinity Symphony Infrastructure  
**Maintained by:** HyperDAGManager (HDM)  
**Related:** AI-Prompt-Manager (routing), Mel (frontend)
