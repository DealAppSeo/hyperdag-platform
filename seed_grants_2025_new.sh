#!/bin/bash

# Script to run the 2025 grants seeding process
echo "Starting 2025 grants seeding process"
cd "$(dirname "$0")"
npx tsx server/scripts/grants-2025-seed.ts
echo "Process completed"