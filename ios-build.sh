#!/bin/bash

# iOS App Build Script
# This script automates the process of building iOS apps as described in the instructions

# Exit on error
set -e

echo "=== iOS App Build Script ==="
echo "Checking prerequisites..."

# Check if XCode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo "Error: XCode is not installed. Please install XCode from the App Store."
    exit 1
fi

# Check if xcodegen is installed
if ! command -v xcodegen &> /dev/null; then
    echo "Error: xcodegen is not installed. Installing with Homebrew..."
    brew install xcodegen
fi

# Check if swiftlint and swift-format are installed
if ! command -v swiftlint &> /dev/null; then
    echo "swiftlint is not installed. Installing with Homebrew..."
    brew install swiftlint
fi

if ! command -v swift-format &> /dev/null; then
    echo "swift-format is not installed. Installing with Homebrew..."
    brew install swift-format
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js using Homebrew."
    exit 1
fi

echo "Building web part..."
# Build the web part
node make prod

echo "Generating iOS projects..."

# Navigate to SDK directory and generate XCode project
pushd tuta-sdk/ios # go into SDK directory
echo "Generating SDK XCode project..."
xcodegen # generate XCode project
popd # go back

# Create build directories
echo "Creating build directories..."
mkdir -p build
mkdir -p build-calendar-app

# Go into iOS app directory and generate projects for both apps
echo "Generating app projects..."
cd app-ios # go into iOS app directory
xcodegen --spec calendar-project.yml
xcodegen --spec mail-project.yml

echo "=== iOS App Build Complete ==="
echo "You can now open the generated XCode projects to build and run the apps."

exit 0
