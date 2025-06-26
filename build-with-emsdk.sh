#!/bin/bash

# Script to build tutanota with proper emsdk environment
# Usage: ./build-with-emsdk.sh [build-command]

set -e

# Source emsdk environment
echo "Setting up emsdk environment..."
cd /mnt/c/Users/sdomb/Downloads/School/sdp/emsdk
source ./emsdk_env.sh

# Change to project directory
cd /mnt/c/Users/sdomb/Downloads/Research/sdptutanota

# Run the build command (default to "node make prod")
BUILD_CMD="${1:-node make prod}"
echo "Running: $BUILD_CMD"
eval "$BUILD_CMD" 