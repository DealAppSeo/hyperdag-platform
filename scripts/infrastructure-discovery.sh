#!/usr/bin/env bash
# AITS INFRASTRUCTURE DISCOVERY SCRIPT - HDM Edition
# Runs on HyperDAG Replit, reports to local PostgreSQL + Supabase
# Can be executed manually or via cron

set -e

# Configuration
AGENT_ID="${AGENT_ID:-HDM}"
API_URL="${API_URL:-http://localhost:5000}"
LOG_FILE="/tmp/infrastructure-discovery-$(date +%Y%m%d-%H%M%S).log"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log() {
  echo -e "${GREEN}[$AGENT_ID]${NC} $*" | tee -a "$LOG_FILE"
}

warn() {
  echo -e "${YELLOW}[$AGENT_ID]${NC} ⚠️  $*" | tee -a "$LOG_FILE"
}

error() {
  echo -e "${RED}[$AGENT_ID]${NC} ❌ $*" | tee -a "$LOG_FILE"
}

# Function to send discovery to API
send_discovery() {
  local component="$1"
  local status="$2"
  local url="$3"
  local details="$4"
  
  curl -s -X POST "$API_URL/api/infrastructure/discover" \
    -H "Content-Type: application/json" \
    -d "{
      \"agentId\": \"$AGENT_ID\",
      \"component\": \"$component\",
      \"status\": \"$status\",
      \"url\": \"$url\",
      \"details\": \"$details\"
    }" > /dev/null 2>&1
  
  log "Reported: $component - $status"
}

log "========================================="
log "Infrastructure Discovery Started"
log "Agent: $AGENT_ID"
log "Timestamp: $(date -u +%Y-%m-%d\ %H:%M:%S\ UTC)"
log "========================================="

# 1. REPLIT CHECK
log "Checking Replit environment..."
if [ -n "$REPL_SLUG" ]; then
  REPL_URL="https://${REPL_SLUG}.${REPL_OWNER}.repl.co"
  send_discovery "Replit" "active" "$REPL_URL" "Running as $AGENT_ID on Replit"
else
  warn "REPL_SLUG not found - not running on Replit"
  send_discovery "Replit" "unknown" "" "Environment variables not detected"
fi

# 2. DATABASE CHECK
log "Checking PostgreSQL database..."
if [ -n "$DATABASE_URL" ]; then
  send_discovery "PostgreSQL" "active" "localhost" "Local PostgreSQL database connected"
else
  error "DATABASE_URL not found"
  send_discovery "PostgreSQL" "missing" "" "No database connection configured"
fi

# 3. SUPABASE CHECK
log "Checking Supabase connection..."
if [ -n "$SUPABASE_URL" ]; then
  if [ -n "$SUPABASE_SERVICE_KEY" ]; then
    send_discovery "Supabase" "active" "$SUPABASE_URL" "Supabase configured with service key"
  else
    send_discovery "Supabase" "degraded" "$SUPABASE_URL" "Supabase URL set but no service key"
  fi
else
  warn "SUPABASE_URL not found"
  send_discovery "Supabase" "missing" "" "Supabase not configured"
fi

# 4. NODE.JS ENVIRONMENT
log "Checking Node.js environment..."
NODE_VERSION=$(node --version 2>/dev/null || echo "not installed")
NPM_VERSION=$(npm --version 2>/dev/null || echo "not installed")
send_discovery "Node.js" "active" "" "Node $NODE_VERSION, npm $NPM_VERSION"

# 5. GITHUB INTEGRATION
log "Checking GitHub CLI..."
if command -v gh &> /dev/null; then
  GH_VERSION=$(gh --version | head -1)
  send_discovery "GitHub CLI" "active" "" "$GH_VERSION"
else
  warn "GitHub CLI not installed"
  send_discovery "GitHub CLI" "missing" "" "gh command not found"
fi

# 6. OBJECT STORAGE
log "Checking Object Storage..."
if [ -n "$DEFAULT_OBJECT_STORAGE_BUCKET_ID" ]; then
  send_discovery "Object Storage" "active" "" "Bucket ID: $DEFAULT_OBJECT_STORAGE_BUCKET_ID"
else
  send_discovery "Object Storage" "missing" "" "No bucket configured"
fi

# 7. APP SERVER STATUS
log "Checking application server..."
if curl -s -f "$API_URL/api/health" > /dev/null 2>&1; then
  send_discovery "App Server" "active" "$API_URL" "Server responding on port 5000"
else
  warn "App server not responding"
  send_discovery "App Server" "degraded" "$API_URL" "Server not responding (may be starting)"
fi

# 8. FLUTTER APP CHECK
log "Checking for Flutter/Dart files..."
DART_FILES=$(find . -name "*.dart" 2>/dev/null | wc -l)
if [ "$DART_FILES" -gt 0 ]; then
  send_discovery "Flutter" "active" "$(pwd)" "$DART_FILES Dart files found"
else
  send_discovery "Flutter" "missing" "" "No Flutter/Dart files detected"
fi

# 9. AI PROVIDER KEYS
log "Checking AI provider configuration..."
AI_PROVIDERS=0
[ -n "$OPENAI_API_KEY" ] && ((AI_PROVIDERS++))
[ -n "$ANTHROPIC_API_KEY" ] && ((AI_PROVIDERS++))
[ -n "$GROQ_API_KEY" ] && ((AI_PROVIDERS++))
send_discovery "AI Providers" "active" "" "$AI_PROVIDERS providers configured"

log "========================================="
log "Discovery Complete"
log "Log saved to: $LOG_FILE"
log "========================================="

# Summary
echo ""
log "📊 Summary sent to: $API_URL/api/infrastructure"
log "View audit: $API_URL/api/infrastructure/audit"
log "View status: $API_URL/api/infrastructure/status"
