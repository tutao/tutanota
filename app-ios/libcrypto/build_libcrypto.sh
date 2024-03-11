#!/usr/bin/env bash

set -e

BUILDER_PREFIX="OpenSSL-for-iPhone"
BINARY_OUTPUT="lib"

BUILD_LIBSSL_SCRIPT="${BUILDER_PREFIX}/build-libssl.sh"
BIN_DIR="${BUILDER_PREFIX}/bin"

function clean() {
    rm -rf $BIN_DIR $BINARY_OUTPUT
}

if [[ ! -f $BUILD_LIBSSL_SCRIPT ]]; then
    echo "Could not find \`${BUILD_LIBSSL_SCRIPT}\`! Did you forget to clone submodules?" 2>&1
    exit 1
fi

if [[ "$#" == 1 ]]; then
    if [[ "${1}" == "clean" ]]; then
        clean
        exit 0
    else
        echo "Unknown argument ${1}" 2>&1
        exit 1
    fi
elif [[ "$#" != 0 ]]; then
    echo "Usage: ${0} [clean]"
    exit 1
fi

if [[ -d $BINARY_OUTPUT ]]; then
    # No arguments passed, but we don't want to recompile
    echo "Already built; nothing more to do"
    exit 0
fi

clean

# OpenSSL has a lot of stuff that we do not need
CONFIG_OPTIONS="no-aria no-bf no-blake2 no-camellia no-cast no-chacha no-cmac no-des no-dh no-dsa no-ecdh no-ecdsa no-idea no-md2 no-md4 no-mdc2 no-ocb no-poly1305 no-rc2 no-rc4 no-rc5 no-rmd160 no-scrypt no-seed no-siphash no-sm2 no-sm3 no-sm4 no-whirlpool no-zlib no-zlib-dynamic"
CURL_OPTIONS=""

# This targets both x86_64 and arm64 simulators (to work on Intel-based Macs) as well as native
TARGETS="ios-cross-arm64 ios-sim-cross-arm64 ios-sim-cross-x86_64"

# Now we build... and wait
(cd $BUILDER_PREFIX; ../$BUILD_LIBSSL_SCRIPT --targets="${TARGETS}")

# We now want to merge the binaries
mkdir -p $BINARY_OUTPUT
lipo -create $BIN_DIR/iPhoneSimulator*.sdk/lib/libcrypto.a -output "${BINARY_OUTPUT}/libcrypto-sim.a"
lipo -create $BIN_DIR/iPhoneOS*.sdk/lib/libcrypto.a -output "${BINARY_OUTPUT}/libcrypto.a"
