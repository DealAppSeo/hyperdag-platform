#!/bin/bash
# Test HDM Hope Listener by inserting a prayer request

echo "🙏 Testing HDM Hope Listener..."
echo ""

# Insert test prayer request
echo "Inserting prayer request into Supabase..."
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/trinity_tasks" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "prompt": "I lost my job and feel hopeless about the future",
    "assigned_agent": "HDM",
    "status": "not_started",
    "priority": 8
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "✅ Prayer request inserted!"
echo ""
echo "Now start HDM to process it:"
echo "  cd agents/hdm"
echo "  node hope-listener.cjs"
echo ""
echo "HDM will:"
echo "  1. Poll every 10 seconds for new tasks"
echo "  2. Generate biblical encouragement via OpenAI"
echo "  3. Score response with empathy scorer (0-1)"
echo "  4. Apply wisdom gates (min 0.5 score)"
echo "  5. Update task status to 'completed'"
echo ""
echo "Monitor logs:"
echo "  SELECT * FROM autonomous_logs WHERE agent='HDM' ORDER BY created_at DESC;"
