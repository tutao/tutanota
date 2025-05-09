# Add custom stage with this script, $SRCROOT/../libs/Signal-FTS5-Extension/libsignal_tokenizer.a as an output
# Add the output file to the project, link against it
# Modify library search path to include its directory
# ...
# PROFIT!

SCRIPTS=$SRCROOT/../tuta-sdk/ios/build-scripts
EXTENSION_DIR=$SRCROOT/../libs/Signal-FTS5-Extension

# export CARGO_TARGET_DIR="${PROJECT_TEMP_DIR}/cargo_target"
#mkdir -p "${CARGO_TARGET_DIR}"

IS_SIMULATOR=0
if [ "${LLVM_TARGET_TRIPLE_SUFFIX-}" = "-simulator" ]; then
  IS_SIMULATOR=1
fi

RELFLAG=debug
if [[ "${BUILDVARIANT}" != debug* ]]; then
    RELFLAG=release
fi
echo "RELFLAG: ${RELFLAG}"


TRIPLES=$(bash "${SCRIPTS}/rust-triple.sh" $IS_SIMULATOR ${ARCHS[@]})
LIPO_ARGS=""
for triple in $TRIPLES; do
	bash $SCRIPTS/xc-universal-binary.sh signal-tokenizer $EXTENSION_DIR "$CONFIGURATION" '--crate-type=staticlib' '--features=extension'
	#cp "$CARGO_TARGET_DIR/$triple/$CONFIGURATION/libsignal_tokenizer.a" "${DERIVED_FILE_DIR}/libsignal_tokenizer.a"
	#echo "Copying files: $CARGO_TARGET_DIR/$triple/$CONFIGURATION/libsignal_tokenizer.a ${DERIVED_FILE_DIR}/libsignal_tokenizer.a"
	
	# note the newline
	LIPO_ARGS+="$EXTENSION_DIR/target/$triple/$RELFLAG/libsignal_tokenizer.a
"
done

echo "LIPO_ARGS: $LIPO_ARGS"
tr '\n' '\0' <<<"$LIPO_ARGS" | xargs -0 echo lipo -output "$SCRIPT_OUTPUT_FILE_0" -create
tr '\n' '\0' <<<"$LIPO_ARGS" | xargs -0 lipo -output "$SCRIPT_OUTPUT_FILE_0" -create

echo "lipo-ed"




