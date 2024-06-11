#!/usr/bin/env bash
set -eEuvx

SRC_ROOT=${1}
BUILDVARIANT=$(echo "${2}" | tr '[:upper:]' '[:lower:]')
echo "BUILDVARIANT: ${BUILDVARIANT}"

IS_SIMULATOR=0
if [ "${LLVM_TARGET_TRIPLE_SUFFIX-}" = "-simulator" ]; then
  IS_SIMULATOR=1
fi

RELFLAG=debug
if [[ "${BUILDVARIANT}" != debug* ]]; then
    RELFLAG=release
fi
echo "RELFLAG: ${RELFLAG}"

ARCH_LIST=""
includeArch() {
    if [[ -z "$ARCH_LIST" ]]; then
        ARCH_LIST=$1
    else
        ARCH_LIST="$ARCH_LIST $1"
    fi
}

createFolderStructure() {
    if [ -d "${SRC_ROOT}/target/combined" ]; then
        rm -r "${SRC_ROOT}/target/combined"
    fi

    mkdir "${SRC_ROOT}/target/combined/"
    mkdir "${SRC_ROOT}/target/combined/${RELFLAG}"

    if [ -d "${SRC_ROOT}/../ios/tutasdk/generated-src" ]; then
        rm -r "${SRC_ROOT}/../ios/tutasdk/generated-src"
    fi

    mkdir "${SRC_ROOT}/../ios/tutasdk/generated-src"
    mkdir "${SRC_ROOT}/../ios/tutasdk/generated-src/headers"
    mkdir "${SRC_ROOT}/../ios/tutasdk/generated-src/Sources"
}

generateLibrary() {
    lipo -create $ARCH_LIST -output "${SRC_ROOT}/target/combined/${RELFLAG}/libtutasdk.a"

    cp "${SRC_ROOT}/target/combined/${RELFLAG}/libtutasdk.a" "${SRC_ROOT}/../ios/tutasdk/generated-src/tutasdk.a"

    mv $SRC_ROOT/bindings/*.h "${SRC_ROOT}/../ios/tutasdk/generated-src/headers/"
    mv $SRC_ROOT/bindings/*.modulemap "${SRC_ROOT}/../ios/tutasdk/generated-src/headers/"
    mv $SRC_ROOT/bindings/*.swift "${SRC_ROOT}/../ios/tutasdk/generated-src/Sources/"

    # xcodebuild -create-xcframework \
    # -library "${SRC_ROOT}/../ios/tutasdk/generated-src/tutasdk.a" \
    # -headers "${SRC_ROOT}/../ios/tutasdk/generated-src/headers" \
    # -output "${SRC_ROOT}/../ios/tutasdk/generated-src/tutasdk.xcframework"
}


# if [[ -n "${SDK_DIR:-}" ]]; then
#   # Assume we're in Xcode, which means we're probably cross-compiling.
#   # In this case, we need to add an extra library search path for build scripts and proc-macros,
#   # which run on the host instead of the target.
#   # (macOS Big Sur does not have linkable libraries in /usr/lib/.)
#   export LIBRARY_PATH="${SDK_DIR}/usr/lib:${LIBRARY_PATH:-}"
# fi

export LIBRARY_PATH="/Library/Developer/CommandLineTools/SDKs/MacOSX.sdk/usr/lib:${LIBRARY_PATH:-}"

echo "$LIBRARY_PATH"

cd $SRC_ROOT

for arch in $ARCHS; do
  case "$arch" in
    x86_64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        echo "Building for x86_64, but not a simulator build. What's going on?" >&2
        exit 2
      fi

      # Intel iOS simulator
    $HOME/.cargo/bin/cargo run --bin uniffi-bindgen generate --library "${SRC_ROOT}/target/x86_64-apple-ios-sim/${RELFLAG}/libtutasdk.dylib" --out-dir "$SRC_ROOT/bindings" --language=swift -vv
    includeArch "${SRC_ROOT}/target/x86_64-apple-ios-sim/${RELFLAG}/libtutasdk.a";
      ;;

    arm64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        # Hardware iOS targets
        $HOME/.cargo/bin/cargo run --bin uniffi-bindgen generate --library "${SRC_ROOT}/target/aarch64-apple-ios/${RELFLAG}/libtutasdk.dylib" --out-dir "$SRC_ROOT/bindings" --language=swift -vv
        includeArch "${SRC_ROOT}/target/aarch64-apple-ios/${RELFLAG}/libtutasdk.a";
      else
        # M1 iOS simulator
        $HOME/.cargo/bin/cargo run --bin uniffi-bindgen generate --library "${SRC_ROOT}/target/aarch64-apple-ios-sim/${RELFLAG}/libtutasdk.dylib" --out-dir "$SRC_ROOT/bindings" --language=swift -vv
        includeArch "${SRC_ROOT}/target/aarch64-apple-ios-sim/${RELFLAG}/libtutasdk.a";
      fi
  esac
done

createFolderStructure;
generateLibrary;