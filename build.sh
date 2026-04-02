#!/bin/bash
set -e

echo "Installing dependencies..."
npm install --legacy-peer-deps

echo "Building application..."
node node_modules/react-scripts/bin/react-scripts.js build

echo "Build complete!"
