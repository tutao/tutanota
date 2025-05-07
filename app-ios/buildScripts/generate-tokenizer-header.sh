#!/usr/bin/env bash

# exit if some command fails
set -e
# print what is executed
set -x
# error on unbound variables
set -u

# XCode tries to be helpful and overwrites the PATH. Reset that.
# If we don't do this compiling a binary to run it will fail with fun issues
PATH="$(bash -l -c 'echo $PATH')"

EXTENSION_DIR="$SRCROOT/../libs/Signal-FTS5-Extension"
cargo run --manifest-path="${EXTENSION_DIR}/Cargo.toml" --features=cbindgen --bin generate-header -- "$SCRIPT_OUTPUT_FILE_0"
