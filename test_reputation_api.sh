#!/bin/bash

# Use existing cookies file
COOKIE_FILE=cookies.txt

# Test case 1: Basic endpoint with no parameters
echo -e "\nTest 1: Basic endpoint (no parameters)"
curl -s -b $COOKIE_FILE http://localhost:5000/api/reputation/activities | jq

# Test case 2: With pagination (limit & offset)
echo -e "\nTest 2: With pagination (limit=2, offset=0)"
curl -s -b $COOKIE_FILE "http://localhost:5000/api/reputation/activities?limit=2&offset=0" | jq

# Test case 3: With type filter
echo -e "\nTest 3: Filter by activity type 'social-media-connection'"
curl -s -b $COOKIE_FILE "http://localhost:5000/api/reputation/activities?type=social-media-connection" | jq

# Test case 4: With date filter (last 30 days)
THIRTY_DAYS_AGO=$(date -d "30 days ago" +%Y-%m-%d)
echo -e "\nTest 4: Activities from last 30 days"
curl -s -b $COOKIE_FILE "http://localhost:5000/api/reputation/activities?fromDate=${THIRTY_DAYS_AGO}" | jq

# Test case 5: Combined filters with sorting
echo -e "\nTest 5: Combined filters with points sorting (ascending)"
curl -s -b $COOKIE_FILE "http://localhost:5000/api/reputation/activities?limit=3&sortBy=points&sortOrder=asc" | jq

echo -e "\nAPI testing complete."
