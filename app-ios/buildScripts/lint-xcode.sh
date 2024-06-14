#!/usr/bin/env bash
# Copied from the SwiftLint readme: https://github.com/realm/SwiftLint
if [[ "$(uname -m)" == arm64 ]]; then
    export PATH="/opt/homebrew/bin:$PATH"
fi

if which swiftlint > /dev/null; then
  swiftlint lint tutanota TutanotaSharedFramework TutanotaShareExtension TutanotaNotificationExtension tutanotaTests TutanotaSharedTests
else
  echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
fi