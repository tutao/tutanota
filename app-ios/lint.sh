#!/usr/bin/env bash
# Use this script to format and/or lint the swift code. It has the same usage as the NPM scripts.
set -eux -o pipefail

# Run a command while allowing errors. This will change the final exit code of the script so CI fails.
ERRORS_FOUND=false
capture_errors() {
  ${@} || ERRORS_FOUND=true
}

set_homebrew_path() {
  if [[ "$(uname -m)" == arm64 ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
  fi
}

format() {
  set_homebrew_path
  
  # Write changes to the files if $2 is true; otherwise, use --strict so the exit code is non-zero if issues are found
  local fix_command="lint --strict"
  if [ "$2" == true ]; then
    fix_command="format --in-place"
  fi
  
  if which swift-format > /dev/null; then
    FILES=$(find "${1}" -name "*.swift" -type f -not -path "*/GeneratedIpc/*" -not -name "*.generated.swift")
    capture_errors swift-format $fix_command --configuration .swift-format.json --recursive --parallel $FILES
  else
    echo "warning: swift-format not installed, download from https://github.com/apple/swift-format"
  fi
}

lint() {
  set_homebrew_path
  
  # Write changes to the files if $2 is true; otherwise, use --strict so the exit code is non-zero if issues are found
  local arg="--strict"
  if [ "$2" == true ]; then
    arg="--fix"
  fi
  
  if which swiftlint > /dev/null; then
    capture_errors swiftlint lint "$1" $arg
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
else
  echo "Failed to match \`$1\`; exiting"
  exit 1
fi

if [ "$ERRORS_FOUND" == true ]; then
  echo "Error: Warnings/errors found with linting/formatting. Please fix them!"
  exit 1
else
  echo "Looks good to me!"
  exit 0
fi
