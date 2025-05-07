#!/usr/bin/env bash

ARCHS=${@:2}
IS_SIMULATOR=$1

for arch in $ARCHS; do
  case "$arch" in
    x86_64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        echo "Building for x86_64, but not a simulator build. What's going on?" >&2
        exit 2
      fi

      # Intel iOS simulator
      echo x86_64-apple-ios
      ;;

    arm64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        # Hardware iOS targets
        echo aarch64-apple-ios
      else
        # M1 iOS simulator
        echo aarch64-apple-ios-sim
      fi
  esac
done
