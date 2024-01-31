#!/usr/bin/env bash
set -eEuvx

bash $SRCROOT/xc-universal-binary.sh tuta-sdk $SRCROOT/../tuta-sdk $CONFIGURATION
bash $SRCROOT/generate-swift.sh $SRCROOT/../tuta-sdk $CONFIGURATION