#!/bin/bash

# Use existing cookies file for authentication
COOKIE_FILE=cookies.txt

# Get current authenticated user ID
CURRENT_USER_ID=$(curl -s -b $COOKIE_FILE http://localhost:5000/api/user | jq -r '.id')
echo "Creating activities for user ID: $CURRENT_USER_ID"

# Create various types of reputation activities for testing
echo "Creating reputation activities for testing..."

# Social Media Connection Activities
echo "Creating social media connection activities..."
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "social-media-connection",
  "description": "Connected X account",
  "points": 50,
  "metadata": {"platform": "x", "username": "@dev_user"}
}' http://localhost:5000/api/reputation/create-activity

curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "social-media-connection",
  "description": "Connected LinkedIn account",
  "points": 75,
  "metadata": {"platform": "linkedin", "username": "dev-hyperdag"}
}' http://localhost:5000/api/reputation/create-activity

# Project Contribution Activities
echo "Creating project contribution activities..."
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "project-contribution",
  "description": "Contributed to HyperDAG Core",
  "points": 100,
  "metadata": {"projectId": 1, "commitHash": "abc123"}
}' http://localhost:5000/api/reputation/create-activity

curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "project-contribution",
  "description": "Added new feature to RepID",
  "points": 150,
  "metadata": {"projectId": 2, "commitHash": "def456"}
}' http://localhost:5000/api/reputation/create-activity

# Referral Activities
echo "Creating referral activities..."
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "referral",
  "description": "Referred new user",
  "points": 25,
  "metadata": {"referredUserId": 14}
}' http://localhost:5000/api/reputation/create-activity

curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "referral",
  "description": "Referred new user",
  "points": 25,
  "metadata": {"referredUserId": 15}
}' http://localhost:5000/api/reputation/create-activity

# Verification Activities
echo "Creating verification activities..."
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "credential-verification",
  "description": "Verified GitHub credential",
  "points": 30,
  "metadata": {"credentialType": "github", "credentialId": "xyz789"}
}' http://localhost:5000/api/reputation/create-activity

curl -s -b $COOKIE_FILE -H "Content-Type: application/json" -X POST -d '{
  "userId": '$CURRENT_USER_ID',
  "type": "credential-verification",
  "description": "Verified email address",
  "points": 10,
  "metadata": {"credentialType": "email"}
}' http://localhost:5000/api/reputation/create-activity

echo "All reputation activities created!"

# Now test the filtering capabilities
echo -e "\nTesting filtering capabilities:"

# Test 1: Get all activities
echo -e "\nTest 1: All activities"
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" http://localhost:5000/api/reputation/activities | jq

# Test 2: Filter by type
echo -e "\nTest 2: Filter by type (social-media-connection)"
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" "http://localhost:5000/api/reputation/activities?type=social-media-connection" | jq

# Test 3: Pagination
echo -e "\nTest 3: Pagination (limit=3, offset=0)"
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" "http://localhost:5000/api/reputation/activities?limit=3&offset=0" | jq

# Test 4: Sorting by points (highest first)
echo -e "\nTest 4: Sorting by points (highest first)"
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" "http://localhost:5000/api/reputation/activities?sortBy=points&sortOrder=desc" | jq

# Test 5: Sorting by timestamp (oldest first)
echo -e "\nTest 5: Sorting by timestamp (oldest first)"
curl -s -b $COOKIE_FILE -H "Content-Type: application/json" "http://localhost:5000/api/reputation/activities?sortBy=timestamp&sortOrder=asc" | jq

echo -e "\nAll tests completed!"
