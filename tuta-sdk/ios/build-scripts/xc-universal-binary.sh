#!/usr/bin/env bash
set -eEuvx

function error_help()
{
    ERROR_MSG="It looks like something went wrong building the Example App Universal Binary."
    echo "error: ${ERROR_MSG}"
}
trap error_help ERR

# XCode tries to be helpful and overwrites the PATH. Reset that.
PATH="$(bash -l -c 'echo $PATH')"

# This should be invoked from inside xcode, not manually
if [[ "${#}" -ne 3 ]]
then
    echo "Usage (note: only call inside xcode!):"
    echo "path/to/build-scripts/xc-universal-binary.sh <FFI_TARGET> <SRC_ROOT_PATH> <buildvariant>"
    exit 1
fi
# what to pass to cargo build -p, e.g. logins_ffi
FFI_TARGET=${1}
# path to source code root
SRC_ROOT=${2}
# buildvariant from our xcconfigs
BUILDVARIANT=$(echo "${3}" | tr '[:upper:]' '[:lower:]')

RELFLAG=
if [[ "${BUILDVARIANT}" != debug* ]]; then
    RELFLAG=--release
fi

IS_SIMULATOR=0
if [ "${LLVM_TARGET_TRIPLE_SUFFIX-}" = "-simulator" ]; then
  IS_SIMULATOR=1
fi

for arch in $ARCHS; do
  case "$arch" in
    x86_64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        echo "Building for x86_64, but not a simulator build. What's going on?" >&2
        exit 2
      fi

      # Intel iOS simulator
      export CFLAGS_x86_64_apple_ios="-target x86_64-apple-ios"
      cargo rustc --manifest-path="${SRC_ROOT}/Cargo.toml" -p "${FFI_TARGET}" --lib $RELFLAG --target x86_64-apple-ios -v
      ;;

    arm64)
      if [ $IS_SIMULATOR -eq 0 ]; then
        # Hardware iOS targets
        cargo rustc --manifest-path="${SRC_ROOT}/Cargo.toml" -p "${FFI_TARGET}" --lib $RELFLAG --target aarch64-apple-ios -v
      else
        # M1 iOS simulator
        cargo rustc --manifest-path="${SRC_ROOT}/Cargo.toml" -p "${FFI_TARGET}" --lib $RELFLAG --target aarch64-apple-ios-sim -v
      fi
  esac
done
