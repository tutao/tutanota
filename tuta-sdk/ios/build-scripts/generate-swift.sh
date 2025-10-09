#!/usr/bin/env bash
set -eEuvx

SRC_ROOT=${1}; shift
echo "SRC_ROOT: $SRC_ROOT"
BUILDVARIANT=$(echo "${1}" | tr '[:upper:]' '[:lower:]')
echo "BUILDVARIANT: ${BUILDVARIANT}"

IS_SIMULATOR="${2}"; shift 2
echo "IS_SIMULATOR: $IS_SIMULATOR"

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
    mkdir -p "${SRC_ROOT}/target/combined/"
    mkdir -p "${SRC_ROOT}/target/combined/${RELFLAG}"

    if [ -d "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src" ]; then
        rm -r "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src"
    fi

    mkdir "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src"
    mkdir "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src/headers"
    mkdir "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src/Sources"
}

generateLibrary() {
    for arch in $ARCH_LIST; do
      if [ $arch -nt "${SRC_ROOT}/target/combined/${RELFLAG}/libtutasdk.a" ]; then
        echo "$arch is newer!"
        echo $(date -r $arch)
        echo $(date -r "${SRC_ROOT}/target/combined/${RELFLAG}/libtutasdk.a" || echo "output of lipo doesn't exist")
        lipo -create $ARCH_LIST -output "${SRC_ROOT}/target/combined/${RELFLAG}/libtutasdk.a"
        break
      fi
    done

    cp -p "${SRC_ROOT}/target/combined/${RELFLAG}/libtutasdk.a" "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src/tutasdk.a"

    cp -p $SRC_ROOT/bindings/*.h "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src/headers/"
    cp -p $SRC_ROOT/bindings/*.modulemap "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src/headers/"
    cp -p $SRC_ROOT/bindings/*.swift "${SRC_ROOT}/tuta-sdk/ios/tutasdk/generated-src/Sources/"
}

genSwiftIfNeeded() {
  if [ "${SRC_ROOT}/target/$1/${RELFLAG}/libtutasdk.dylib" -nt "$SRC_ROOT/bindings/tutasdk.swift" ]; then
    cargo run --package uniffi-bindgen -- generate --library "${SRC_ROOT}/target/$1/${RELFLAG}/libtutasdk.dylib" --out-dir "$SRC_ROOT/bindings" --language=swift
  else
    echo "File $SRC_ROOT/bindings/tutasdk.swift is up to date, no need to rengenerate"
  fi
}

cd $SRC_ROOT

ARCHS=( "$@" )

echo "ARCHS: $ARCHS"

for arch in $ARCHS; do
  case "$arch" in
    x86_64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        echo "Building for x86_64, but not a simulator build. What's going on?" >&2
        exit 2
      fi

      # Intel iOS simulator
    genSwiftIfNeeded x86_64-apple-ios
    includeArch "${SRC_ROOT}/target/x86_64-apple-ios/${RELFLAG}/libtutasdk.a";
      ;;

    arm64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        # Hardware iOS targets
        genSwiftIfNeeded aarch64-apple-ios
        includeArch "${SRC_ROOT}/target/aarch64-apple-ios/${RELFLAG}/libtutasdk.a";
      else
        # M1 iOS simulator
        genSwiftIfNeeded aarch64-apple-ios-sim
        includeArch "${SRC_ROOT}/target/aarch64-apple-ios-sim/${RELFLAG}/libtutasdk.a";
      fi
  esac
done

createFolderStructure;
generateLibrary;
