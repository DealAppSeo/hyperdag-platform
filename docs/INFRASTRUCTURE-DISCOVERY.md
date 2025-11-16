# Infrastructure Discovery System

## Overview

The Infrastructure Discovery System enables Trinity Symphony agents (HDM, APM, ATS, MEL) to automatically discover, report, and audit deployed infrastructure components across Replit, Supabase, GitHub, and other platforms.

## Architecture

### Database Schema

**Table:** `infrastructure_audit`

| Column | Type | Description |
|--------|------|-------------|
| id | serial | Primary key |
| agent_id | text | Agent identifier (HDM, APM, ATS, MEL) |
| component | text | Component type (Replit, Supabase, GitHub, etc.) |
| status | text | Component status (active, missing, degraded, error) |
| url | text | Deployment URL or endpoint |
| details | text | Additional information |
| discovered_at | timestamp | Discovery timestamp |
| metadata | jsonb | Additional metadata |

### API Endpoints

#### POST /api/infrastructure/discover
Report a single infrastructure component discovery.

**Request:**
```json
{
  "agentId": "HDM",
  "component": "Replit",
  "status": "active",
  "url": "https://hyperdag.dealappseo.repl.co",
  "details": "HyperDAG Manager running on Replit",
  "metadata": {
    "nodeVersion": "v20.19.3",
    "uptime": 3600
  }
}
```

**Response:**
```json
{
  "success": true,
  "audit": { /* full audit record */ },
  "message": "Infrastructure component Replit discovered by HDM"
}
```

#### POST /api/infrastructure/discover/batch
Report multiple infrastructure discoveries at once.

**Request:**
```json
{
  "discoveries": [
    {
      "agentId": "HDM",
      "component": "Replit",
      "status": "active",
      "url": "https://hyperdag.dealappseo.repl.co",
      "details": "Running"
    },
    {
      "agentId": "HDM",
      "component": "PostgreSQL",
      "status": "active",
      "url": "localhost",
      "details": "Local database connected"
    }
  ]
}
```

#### GET /api/infrastructure/audit
Retrieve infrastructure audit logs with optional filtering.

**Query Parameters:**
- `agent` - Filter by agent ID (HDM, APM, etc.)
- `component` - Filter by component type
- `limit` - Number of records (default: 100)

**Example:**
```bash
GET /api/infrastructure/audit?agent=HDM&limit=50
```

#### GET /api/infrastructure/status
Get latest status of all infrastructure components (deduplicated).

**Response:**
```json
{
  "success": true,
  "count": 5,
  "components": [
    {
      "agentId": "HDM",
      "component": "Replit",
      "status": "active",
      "url": "https://hyperdag.dealappseo.repl.co",
      "details": "Running",
      "discoveredAt": "2025-11-15T00:53:00Z"
    }
  ]
}
```

#### POST /api/infrastructure/run-discovery
Trigger automated discovery scan from the server.

**Request:**
```json
{
  "agentId": "HDM"
}
```

## Usage

### 1. Manual Discovery via Script

Run the bash script to discover and report all infrastructure:

```bash
# Basic usage
./scripts/infrastructure-discovery.sh

# With custom agent ID
AGENT_ID=APM ./scripts/infrastructure-discovery.sh

# With custom API URL (for remote reporting)
API_URL=https://hyperdag.dealappseo.repl.co ./scripts/infrastructure-discovery.sh
```

### 2. Automated Cron Job

Add to crontab for periodic discovery:

```bash
# Run every 6 hours
0 */6 * * * /path/to/scripts/infrastructure-discovery.sh

# Run daily at 3 AM
0 3 * * * /path/to/scripts/infrastructure-discovery.sh
```

### 3. Programmatic Discovery via API

Use the API endpoint from any agent:

```typescript
// Discover Replit deployment
const response = await fetch('http://localhost:5000/api/infrastructure/discover', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentId: 'HDM',
    component: 'Replit',
    status: 'active',
    url: 'https://hyperdag.dealappseo.repl.co',
    details: 'HyperDAG Manager running'
  })
});
```

### 4. Trigger Server-Side Discovery

```bash
curl -X POST http://localhost:5000/api/infrastructure/run-discovery \
  -H "Content-Type: application/json" \
  -d '{"agentId": "HDM"}'
```

## Integration with Supabase

To send discoveries to Supabase (for cross-deployment coordination):

1. Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are configured
2. Create matching `infrastructure_audit` table in Supabase
3. Modify the discovery script to POST to both local and Supabase APIs

**Supabase Table SQL:**
```sql
CREATE TABLE infrastructure_audit (
  id SERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL,
  component TEXT NOT NULL,
  status TEXT NOT NULL,
  url TEXT,
  details TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_infrastructure_agent ON infrastructure_audit(agent_id);
CREATE INDEX idx_infrastructure_component ON infrastructure_audit(component);
CREATE INDEX idx_infrastructure_status ON infrastructure_audit(status);
```

## Components Discovered

The system currently discovers:

1. **Replit** - Deployment status and URL
2. **PostgreSQL** - Local database connection
3. **Supabase** - Remote coordination database
4. **Node.js** - Runtime environment
5. **GitHub CLI** - Git integration
6. **Object Storage** - Replit object storage buckets
7. **App Server** - Application health check
8. **Flutter** - Mobile/web app presence
9. **AI Providers** - Configured AI API keys

## Next Steps

1. **Fix .replit file** - Add `run = "npm run dev"` to enable workflows
2. **Push database schema** - Run `npm run db:push` to create the table
3. **Test discovery** - Run `./scripts/infrastructure-discovery.sh`
4. **Configure Supabase** - Add credentials for cross-deployment reporting
5. **Deploy APM/MEL** - Set up other Trinity managers on separate Repls
6. **Enable cron** - Schedule periodic infrastructure audits

## Troubleshooting

### Script fails with "Connection refused"
- Ensure the app server is running on port 5000
- Check `API_URL` environment variable

### No discoveries reported
- Check database connection (`DATABASE_URL`)
- Verify API endpoint is registered (check server logs for "Infrastructure Discovery")

### Supabase reporting fails
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
- Ensure Supabase table exists with correct schema
- Check Supabase RLS policies allow INSERT

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│ Infrastructure Discovery System                     │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐     │
│  │   HDM    │    │   APM    │    │   MEL    │     │
│  │ (Replit) │    │ (Replit) │    │(Lovable) │     │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘     │
│       │               │               │            │
│       └───────────────┼───────────────┘            │
│                       │                            │
│              ┌────────▼────────┐                   │
│              │  Discovery API  │                   │
│              │  /infrastructure│                   │
│              └────────┬────────┘                   │
│                       │                            │
│       ┌───────────────┼───────────────┐            │
│       │               │               │            │
│  ┌────▼─────┐    ┌───▼────┐    ┌────▼─────┐      │
│  │PostgreSQL│    │Supabase│    │GitHub API│      │
│  │  (Local) │    │(Remote)│    │ (Issues) │      │
│  └──────────┘    └────────┘    └──────────┘      │
│                                                      │
└─────────────────────────────────────────────────────┘
```

## Autonomous Operation

Once configured, the system enables:
- **Zero-touch deployment tracking** - Agents auto-report their status
- **Cross-deployment coordination** - All managers know about each other
- **Health monitoring** - Automatic detection of missing/degraded services
- **Audit trail** - Complete history of infrastructure changes
- **GitHub integration** - Auto-create issues for missing components

## Cost: $0.00

All discovery operations use free-tier services:
- Local PostgreSQL (included with Replit)
- Supabase free tier (500MB database)
- GitHub API (5000 requests/hour)
- Bash scripting (zero cost)
