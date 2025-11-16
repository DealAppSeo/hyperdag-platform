#!/bin/bash

# Test script for wallet bridge functionality

# Get the API base URL
API_URL="http://localhost:5000/api"

# Register a test user if needed
register_user() {
  echo "Registering test user..."
  curl -s -X POST "$API_URL/register" \
    -H "Content-Type: application/json" \
    -d '{
      "username": "wallettest",
      "password": "password123",
      "email": "wallet@test.com",
      "referralCode": "testcode"
    }'
  echo ""
}

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

# Connect an external wallet
connect_wallet() {
  echo "Connecting external wallet..."
  # Mock signature for testing - in production this would be a valid cryptographic signature
  MOCK_SIGNATURE="0x7f9b1a7cb715c35d9c3a1c98a51f72c19da786ea15651e253f39d0bce7d847e57c1574a8c56f90a93673f6af2398a373d4d45cd51ce12234d70b7709e5ce17161c"
  
  CONNECT_RESPONSE=$(curl -s -X POST "$API_URL/wallet-bridge/connect-wallet" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -d "{
      \"walletAddress\": \"0x742d35Cc6634C0532925a3b844Bc454e4438f44e\",
      \"network\": \"polygon\",
      \"signature\": \"$MOCK_SIGNATURE\"
    }" --cookie cookies.txt)
  
  echo $CONNECT_RESPONSE
  echo ""
}

# Get wallet balances
get_balances() {
  echo "Getting wallet balances..."
  BALANCES_RESPONSE=$(curl -s -X GET "$API_URL/wallet-bridge/balances" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    --cookie cookies.txt)
  
  echo $BALANCES_RESPONSE
  echo ""
}

# Get available networks
get_networks() {
  echo "Getting available networks..."
  NETWORKS_RESPONSE=$(curl -s -X GET "$API_URL/wallet-bridge/available-networks" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    --cookie cookies.txt)
  
  echo $NETWORKS_RESPONSE
  echo ""
}

# Disconnect a wallet
disconnect_wallet() {
  echo "Disconnecting wallet..."
  DISCONNECT_RESPONSE=$(curl -s -X POST "$API_URL/wallet-bridge/disconnect-wallet" \
    -H "Content-Type: application/json" \
    -H "X-CSRF-Token: $CSRF_TOKEN" \
    -d '{
      "network": "polygon"
    }' --cookie cookies.txt)
  
  echo $DISCONNECT_RESPONSE
  echo ""
}

# Run tests
echo "=== WALLET BRIDGE API TEST ==="
echo ""

#register_user
login
get_csrf_token
get_networks
connect_wallet
get_balances
disconnect_wallet

echo "=== TEST COMPLETED ==="