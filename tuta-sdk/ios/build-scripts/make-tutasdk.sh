#!/usr/bin/env bash
set -eEuvx

bash $SRCROOT/build-scripts/xc-universal-binary.sh tuta-sdk $SRCROOT/../rust "$CONFIGURATION"
bash $SRCROOT/build-scripts/generate-swift.sh $SRCROOT/../rust "$CONFIGURATION"
