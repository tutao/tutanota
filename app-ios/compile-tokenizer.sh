SCRIPTS=$SRCROOT/../tuta-sdk/ios/build-scripts
echo "SCRIPT=${SCRIPTS}"

echo "Temp dir exists: $(stat $PROJECT_TEMP_DIR)"
export CARGO_TARGET_DIR="${PROJECT_TEMP_DIR}/cargo_target"
echo "CARGO_TARGET_DIR=$CARGO_TARGET_DIR"
mkdir -p "${CARGO_TARGET_DIR}"

bash $SCRIPTS/xc-universal-binary.sh signal-tokenizer $SRCROOT/../libs/Signal-FTS5-Extension "$CONFIGURATION" '--crate-type=staticlib'
# FIXME: lipo
for triple in $(bash "${SCRIPTS}/rust-triple.sh"); do
	cp "$CARGO_TARGET_DIR/$triple/$CONFIGURATION/libsignal_tokenizer.a" "${TARGET_BUILD_DIR}/libsignal_tokenizer.a"
	echo "Copying files: $CARGO_TARGET_DIR/$triple/$CONFIGURATION/libsignal_tokenizer.a ${TARGET_BUILD_DIR}/libsignal_tokenizer.a"
done


