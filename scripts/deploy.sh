#!/bin/bash

# HyperDAG Automated Deployment Script
# This script handles deployment and GitHub synchronization

# Print colored output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting HyperDAG deployment process...${NC}"

# Step 1: Ask for GitHub token if not set
if [ -z "$GITHUB_TOKEN" ]; then
  echo -e "${YELLOW}GitHub token not found in environment variables.${NC}"
  echo -e "You can set it permanently using: ${YELLOW}export GITHUB_TOKEN=your_token${NC}"
  read -p "Enter your GitHub token (or press Enter to skip GitHub sync): " token
  
  if [ ! -z "$token" ]; then
    export GITHUB_TOKEN=$token
    echo -e "${GREEN}GitHub token set for this session.${NC}"
  else
    echo -e "${YELLOW}GitHub sync will be skipped.${NC}"
  fi
fi

# Step 2: Run deployment
echo -e "\n${GREEN}Deploying HyperDAG application...${NC}"
# Run deployment command (this will depend on your Replit setup)
# For example, this might be handled by the Replit UI

# Step 3: Run post-deployment scripts
echo -e "\n${GREEN}Running post-deployment tasks...${NC}"
node scripts/complete-deployment.mjs

# Step 4: Display results
if [ $? -eq 0 ]; then
  echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
  echo -e "${GREEN}Your changes have been pushed to GitHub @dealappseo${NC}"
  echo -e "${GREEN}Lovable.dev has been notified of the deployment${NC}"
else
  echo -e "\n${RED}⚠️ Deployment process encountered some issues.${NC}"
  echo -e "${YELLOW}Please check the logs above for more information.${NC}"
fi

echo -e "\n${GREEN}Deployment process finished at $(date)${NC}"