#!/bin/bash

# Script to run the grants seeding process
echo "Starting seed grant sources process"
cd "$(dirname "$0")"
npx tsx server/scripts/seed-new-grants.ts
echo "Process completed"