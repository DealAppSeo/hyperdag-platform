#!/bin/bash

# HyperDAG Cloudflare DNS Update Script
# This script helps update Cloudflare DNS records for HyperDAG

# Colors for console output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Cloudflare API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo -e "${RED}Error: CLOUDFLARE_API_TOKEN environment variable is not set${NC}"
  echo "Please export your Cloudflare API token before running this script:"
  echo "export CLOUDFLARE_API_TOKEN=your_cloudflare_api_token"
  exit 1
fi

# Check if jq is installed
if ! command -v jq &> /dev/null; then
  echo -e "${YELLOW}Warning: jq is not installed. This script requires jq for JSON processing.${NC}"
  echo "Please install jq and try again."
  exit 1
fi

# Get domain from argument or ask user
DOMAIN=${1:-hyperdag.org}
echo -e "${GREEN}Using domain: ${DOMAIN}${NC}"

# Get zone ID
echo "Fetching Cloudflare zone ID for $DOMAIN..."
ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.result[0].id')

if [ -z "$ZONE_ID" ] || [ "$ZONE_ID" == "null" ]; then
  echo -e "${RED}Error: Could not find zone ID for domain $DOMAIN${NC}"
  echo "Make sure the domain is added to your Cloudflare account and the API token has permission to access it."
  exit 1
fi

echo -e "${GREEN}Found zone ID: $ZONE_ID${NC}"

# Get Replit app URL
read -p "Enter your Replit app URL (e.g., your-hyperdag-app.replit.app): " REPLIT_APP_URL

# Validate URL format
if [[ ! $REPLIT_APP_URL =~ ^[a-zA-Z0-9-]+\.replit\.app$ ]]; then
  echo -e "${RED}Error: Invalid Replit app URL format. Should be something like 'your-hyperdag-app.replit.app'${NC}"
  exit 1
fi

# Create or update 'api' subdomain CNAME record
echo "Creating/updating 'api' subdomain CNAME record..."
API_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data @- <<EOF
{
  "type": "CNAME",
  "name": "api",
  "content": "$REPLIT_APP_URL",
  "ttl": 1,
  "proxied": true
}
EOF
)

API_SUCCESS=$(echo $API_RESPONSE | jq -r '.success')

if [ "$API_SUCCESS" != "true" ]; then
  # Check if record already exists
  ERROR_CODE=$(echo $API_RESPONSE | jq -r '.errors[0].code')
  if [ "$ERROR_CODE" == "81057" ]; then
    echo "Record already exists. Attempting to update..."
    
    # Get the existing record ID
    RECORD_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records?type=CNAME&name=api.$DOMAIN" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" | jq -r '.result[0].id')
    
    if [ -z "$RECORD_ID" ] || [ "$RECORD_ID" == "null" ]; then
      echo -e "${RED}Error: Could not find existing record ID${NC}"
      exit 1
    fi
    
    # Update the record
    UPDATE_RESPONSE=$(curl -s -X PUT "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records/$RECORD_ID" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data @- <<EOF
{
  "type": "CNAME",
  "name": "api",
  "content": "$REPLIT_APP_URL",
  "ttl": 1,
  "proxied": true
}
EOF
    )
    
    UPDATE_SUCCESS=$(echo $UPDATE_RESPONSE | jq -r '.success')
    
    if [ "$UPDATE_SUCCESS" == "true" ]; then
      echo -e "${GREEN}Successfully updated 'api' subdomain record${NC}"
    else
      echo -e "${RED}Error updating 'api' subdomain record:${NC}"
      echo $UPDATE_RESPONSE | jq
      exit 1
    fi
  else
    echo -e "${RED}Error creating 'api' subdomain record:${NC}"
    echo $API_RESPONSE | jq
    exit 1
  fi
else
  echo -e "${GREEN}Successfully created 'api' subdomain record${NC}"
fi

# Success message
echo -e "\n${GREEN}===========================================${NC}"
echo -e "${GREEN}DNS Configuration Complete!${NC}"
echo -e "${GREEN}===========================================${NC}"
echo -e "API domain: ${YELLOW}https://api.$DOMAIN${NC}"
echo -e "\nNext steps:"
echo -e "1. Wait for DNS propagation (may take 5-30 minutes)"
echo -e "2. Make sure your Replit app is deployed and running"
echo -e "3. Update your OAuth providers with the new callback URLs"
echo -e "4. Update APP_URL in your .env file to 'https://api.$DOMAIN'"
echo -e "\nTesting commands:"
echo -e "$ curl https://api.$DOMAIN/api/health"
echo -e "$ curl https://api.$DOMAIN/api/csrf-token"

exit 0