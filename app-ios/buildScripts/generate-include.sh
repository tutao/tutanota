#!/usr/bin/env bash

WASM_PATH="../libs/webassembly"
pushd ../libs/webassembly
make -f Makefile_liboqs include
popd
cp -r "${WASM_PATH}/include" "${BUILD_DIR}/liboqs-include"
touch "${BUILD_DIR}/liboqs-include/malloc.h"
