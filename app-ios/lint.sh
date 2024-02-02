#!/usr/bin/env bash
# Use this script to format and/or lint the swift code. It has the same usage as the NPM scripts.
set -eux -o pipefail

set_homebrew_path() {
  if [[ "$(uname -m)" == arm64 ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
  fi
}

format() {
  set_homebrew_path
  
  # Write changes to the files if $2 is true
  local fix_command="lint"
  if [ "$2" == true ]; then
    fix_command="format"
  fi
  
  if which swift-format > /dev/null; then
    FILES=$(find "$1" | grep -v "GeneratedIpc" | grep -E "\.swift")
    swift-format $fix_command --configuration .swift-format.json --recursive --parallel "$FILES"
  else
    echo "warning: swift-format not installed, download from https://github.com/apple/swift-format"
  fi
}

lint() {
  set_homebrew_path
  
  # Write changes to the files if $2 is true
  local fix_command=""
  if [ "$2" == true ]; then
    fix_command="--fix"
  fi
  
  if which swiftlint > /dev/null; then
    swiftlint lint "$1" $fix_command
  else
    echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
  fi
}

# Default to current directory.
directory=${2:-"."}

# Parse the arguments from the command line.
if [ "$1" == "check" ]; then
  format "$directory" false
  lint "$directory" false
elif [ "$1" == "style:check" ]; then
  format "$directory" false
elif [ "$1" == "lint:check" ]; then
  lint "$directory" false
elif [ "$1" == "fix" ]; then
  format "$directory" true
  lint "$directory" true
elif [ "$1" == "style:fix" ]; then
  format "$directory" true
elif [ "$1" == "lint:fix" ]; then
  lint "$directory" true
fi
