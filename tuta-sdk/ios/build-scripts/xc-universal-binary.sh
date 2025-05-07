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
if [[ "${#}" -lt 3 ]]
then
    echo "Usage (note: only call inside xcode!):"
    echo "path/to/build-scripts/xc-universal-binary.sh <FFI_TARGET> <SRC_ROOT_PATH> <buildvariant>"
    exit 1
fi
# what to pass to cargo build -p, e.g. logins_ffi
FFI_TARGET=${1}
# path to source code root
SRC_ROOT=${2}
echo SRC_ROOT=$SRC_ROOT
# buildvariant from our xcconfigs
BUILDVARIANT=$(echo "${3}" | tr '[:upper:]' '[:lower:]')

RUSTC_ARGS=${@:4}

RELFLAG=
if [[ "${BUILDVARIANT}" != debug* ]]; then
    RELFLAG=--release
fi

IS_SIMULATOR=0
if [ "${LLVM_TARGET_TRIPLE_SUFFIX-}" = "-simulator" ]; then
  IS_SIMULATOR=1
fi


SCRIPT_DIR=$(dirname "$0")
for triple in $(bash "$SCRIPT_DIR/rust-triple.sh" $IS_SIMULATOR $ARCHS); do
  cargo rustc --manifest-path="${SRC_ROOT}/Cargo.toml" -p "${FFI_TARGET}" --lib $RELFLAG --target $triple -v $RUSTC_ARGS
done

