#!/usr/bin/env bash
# Modified from the SwiftLint readme: https://github.com/realm/SwiftLint
if [[ "$(uname -m)" == arm64 ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
fi

if which swift-format > /dev/null; then
  FILES=$(find tutanota TutanotaSharedFramework TutanotaShareExtension TutanotaNotificationExtension tutanotaTests TutanotaSharedTests | grep -v "GeneratedIpc" | grep -E "\.swift")
  swift-format lint --configuration .swift-format.json --recursive --parallel $FILES
else
  echo "warning: swift-format not installed, download from https://github.com/apple/swift-format"
fi
