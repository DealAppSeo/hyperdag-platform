#!/bin/bash

# Kill background processes on exit
trap 'kill $(jobs -p) 2>/dev/null' EXIT

# Start backend (no watch mode to prevent HMR restart loop)
NODE_ENV=development node --import tsx/esm server/index.ts &

# Start Vite frontend
vite

# Wait for all background jobs
wait
