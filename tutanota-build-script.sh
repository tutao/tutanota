#!/bin/bash

# Tutanota Build Automation Script

# Exit immediately if a command exits with a non-zero status
set -e

# Function to print error messages and exit
error_exit() {
    echo "Error: $1" >&2
    exit 1
}

# Function to print informational messages
info_message() {
    echo -e "\n[INFO] $1"
}

# Main build process
main() {
    # Repository and clone details
    REPO_URL="https://github.com/sdpteam30/sdptutanota.git"
    UPSTREAM_REPO="https://github.com/tutao/tutanota.git"
    
    # Check if git is installed
    command -v git >/dev/null 2>&1 || error_exit "Git is not installed. Please install git first."
    
    # Clean up any existing directory to ensure fresh clone
    if [ -d "sdptutanota" ]; then
        info_message "Removing existing sdptutanota directory"
        rm -rf sdptutanota
    fi

    # Clone repository
    info_message "Cloning repository from $REPO_URL"
    git clone "$REPO_URL" || error_exit "Failed to clone repository"
    
    # Change to repository directory
    cd sdptutanota || error_exit "Cannot change to sdptutanota directory"
    
    # Add upstream repository
    info_message "Adding upstream repository"
    git remote add upstream "$UPSTREAM_REPO"
    
    # Fetch upstream branches
    info_message "Fetching upstream branches"
    git fetch upstream
    
    # Get the latest release tag (replace 'xxx' with actual tag)
    # Note: You might want to manually specify the exact tag
    LATEST_TAG=$(git ls-remote --tags upstream | grep -v '{}' | sort -V | tail -n 1 | cut -d/ -f3)
    
    if [ -z "$LATEST_TAG" ]; then
        error_exit "Could not find latest release tag"
    fi
    
    info_message "Checking out latest release tag: $LATEST_TAG"
    git checkout "$LATEST_TAG"
    
    # Fetch again
    git fetch
    
    # Initialize and update submodules
    info_message "Initializing and updating submodules"
    git submodule init
    git submodule sync --recursive
    git submodule update
    
    # Switch to development branch
    info_message "Switching to my-testing-branch"
    git checkout my-testing-branch
    git pull

    # Check npm is installed
    command -v npm >/dev/null 2>&1 || error_exit "npm is not installed. Please install Node.js and npm."
    
    # Install dependencies
    info_message "Installing dependencies"
    npm ci
    
    # Build packages
    info_message "Building packages"
    npm run build-packages
    
    # Build web part
    info_message "Building web part"
    node make prod
    
    # Change to build directory
    cd build || error_exit "Cannot change to build directory"
    
    # Print server start instructions
    echo -e "\n[DONE] Build process completed successfully!"
    echo "You can start a local server using one of these commands:"
    echo "1. npx serve . -s -p 9000"
    echo "2. python -m http.server 9000"
}

# Run the main function
main
