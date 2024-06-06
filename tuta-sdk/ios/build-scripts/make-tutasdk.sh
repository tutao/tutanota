#!/usr/bin/env bash
set -eEuvx

IS_SIMULATOR=0
if [ "${LLVM_TARGET_TRIPLE_SUFFIX-}" = "-simulator" ]; then
  IS_SIMULATOR=1
fi

bash $SRCROOT/build-scripts/xc-universal-binary.sh tuta-sdk $SRCROOT/../rust "$CONFIGURATION"
env -i HOME="$HOME" bash -l -c "$SRCROOT/build-scripts/generate-swift.sh $SRCROOT/../rust \"$CONFIGURATION\" \"$IS_SIMULATOR\" \"${ARCHS[@]}\""
