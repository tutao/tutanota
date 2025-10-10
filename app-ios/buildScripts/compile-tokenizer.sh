# exit if some command fails
set -e
# print what is executed
set -x
# error on unbound variables
set -u

SCRIPTS="$SRCROOT/../tuta-sdk/ios/build-scripts"
EXTENSION_DIR="$SRCROOT/../libs/Signal-FTS5-Extension"
CARGO_TARGET_DIR="$EXTENSION_DIR/target" # could be set to "$PROJECT_TEMP_DIR/cargo_target" but then we should also fix clean action

IS_SIMULATOR=0
if [ "${LLVM_TARGET_TRIPLE_SUFFIX-}" = "-simulator" ]; then
  IS_SIMULATOR=1
fi

RELFLAG=debug
if [[ "${CONFIGURATION}" != Debug* ]]; then
    RELFLAG=release
fi


TRIPLES=$(bash "${SCRIPTS}/rust-triple.sh" $IS_SIMULATOR ${ARCHS[@]})
LIPO_ARGS=""
for triple in $TRIPLES; do
	bash $SCRIPTS/xc-universal-binary.sh signal-tokenizer $EXTENSION_DIR "$CONFIGURATION" '--crate-type=staticlib' '--features=extension'
	LIB_PATH="$CARGO_TARGET_DIR/$triple/$RELFLAG/libsignal_tokenizer.a"
	# note the newline
	LIPO_ARGS+="$LIB_PATH
"
done

TRIPLE_FOLDER=$(tr '\n' '_' <<<"$TRIPLES")
LIPO_OUTPUT_DIR="$CARGO_TARGET_DIR/$TRIPLE_FOLDER/$RELFLAG"
LIPO_OUTPUT_FILE="$LIPO_OUTPUT_DIR/libsignal_tokenizer.a"
mkdir -p $LIPO_OUTPUT_DIR

# We want to avoid running lipo if it's up-to-date.
# So we do some ad-hoc make-like timestamp check.
NEEDS_TO_RUN_LIPO=0
# If lipo-ed file is there and is not older than any of the inputs
# then we don't need to do anything.
# Cargo is nice enough where it won't update the timestamp for something that didn't change.
if [ -e "$LIPO_OUTPUT_FILE" ]; then
	for LIB_PATH in $LIPO_ARGS; do
		if [ "$LIB_PATH" -nt "$LIPO_OUTPUT_FILE" ]; then
			echo "I have found a NEW lib! $LIB_PATH"
			NEEDS_TO_RUN_LIPO=1
		fi
	done
else
	NEEDS_TO_RUN_LIPO=1
fi

if [ $NEEDS_TO_RUN_LIPO = 1 ]; then
	# Replace newline with \0
	# Pass LIPO_ARGS to lipo, splitting on \0
	tr '\n' '\0' <<<"$LIPO_ARGS" | xargs -0 lipo -create -output "$LIPO_OUTPUT_FILE"
else
	echo "$LIPO_OUTPUT_FILE is up to date"
fi

cp -p $LIPO_OUTPUT_FILE $SCRIPT_OUTPUT_FILE_0
