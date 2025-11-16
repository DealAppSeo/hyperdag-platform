#!/bin/bash

# Test script for grant matching functionality

# Get the API base URL
API_URL="http://localhost:5000/api"

# Login and get session cookie
login() {
  echo "Logging in..."
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "testuser",
      "password": "password"
    }' --cookie-jar cookies.txt)
  
  echo $LOGIN_RESPONSE
  echo ""
}

# Get CSRF token
get_csrf_token() {
  echo "Getting CSRF token..."
  CSRF_RESPONSE=$(curl -s -X GET "$API_URL/csrf-token" --cookie cookies.txt)
  CSRF_TOKEN=$(echo $CSRF_RESPONSE | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
  echo "CSRF Token: $CSRF_TOKEN"
  echo ""
}

# Get all grant sources
get_grant_sources() {
  echo "Getting all grant sources..."
  SOURCES_RESPONSE=$(curl -s -X GET "$API_URL/grant-sources" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    --cookie cookies.txt)
  
  echo $SOURCES_RESPONSE | jq '.'
  echo ""
}

# Get active grant sources
get_active_grant_sources() {
  echo "Getting active grant sources..."
  ACTIVE_SOURCES_RESPONSE=$(curl -s -X GET "$API_URL/grant-sources?isActive=true" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    --cookie cookies.txt)
  
  echo $ACTIVE_SOURCES_RESPONSE | jq '.'
  echo ""
}

# Get grant sources by category
get_grant_sources_by_category() {
  CATEGORY=$1
  echo "Getting grant sources for category: $CATEGORY..."
  CATEGORY_SOURCES_RESPONSE=$(curl -s -X GET "$API_URL/grant-sources?category=$CATEGORY" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    --cookie cookies.txt)
  
  echo $CATEGORY_SOURCES_RESPONSE | jq '.'
  echo ""
}

# Find grant matches for an RFP
find_grant_matches() {
  RFP_ID=$1
  echo "Finding grant matches for RFP ID: $RFP_ID..."
  MATCHES_RESPONSE=$(curl -s -X GET "$API_URL/grant-matches/rfp/$RFP_ID" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    --cookie cookies.txt)
  
  echo $MATCHES_RESPONSE | jq '.'
  echo ""
}

# Test simple grant search
test_simple_grant_search() {
  RFP_ID=$1
  echo "Testing simple grant search for RFP ID: $RFP_ID..."
  SEARCH_RESPONSE=$(curl -s -X POST "$API_URL/simple-grant-search" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -d "{
      \"rfpId\": $RFP_ID
    }" \
    --cookie cookies.txt)
  
  echo $SEARCH_RESPONSE | jq '.'
  echo ""
}

# Test blockchain grant matching feature
test_blockchain_grant_matching() {
  RFP_ID=$1
  echo "Testing blockchain grant matching for RFP ID: $RFP_ID..."
  TEST_RESPONSE=$(curl -s -X POST "$API_URL/test-blockchain-grant-matching" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -d "{
      \"rfpId\": $RFP_ID
    }" \
    --cookie cookies.txt)
  
  echo $TEST_RESPONSE | jq '.'
  echo ""
}

# Run tests
echo "=== GRANT MATCHING API TEST ==="
echo ""

login
get_csrf_token
get_grant_sources
get_active_grant_sources
get_grant_sources_by_category "AI"

# Get the first RFP ID from the database
RFP_ID=$(curl -s -X GET "$API_URL/rfps" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  --cookie cookies.txt | jq '.data[0].id')

if [ "$RFP_ID" != "null" ] && [ -n "$RFP_ID" ]; then
  echo "Using RFP ID: $RFP_ID for tests"
  find_grant_matches $RFP_ID
  test_simple_grant_search $RFP_ID
  test_blockchain_grant_matching $RFP_ID
else
  echo "No RFPs found in database. Skipping RFP-specific tests."
fi

echo "=== TEST COMPLETED ==="