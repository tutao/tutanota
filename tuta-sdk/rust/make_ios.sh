set -euxo pipefail

TARGETS=(
  x86_64-apple-ios
  aarch64-apple-ios
  aarch64-apple-ios-sim
)

# XCode tries to be helpful and overwrites the PATH. Reset that.
PATH="$(bash -l -c 'echo $PATH')"



for target in "${TARGETS[@]}"; do
  OUT_DIR="out/${target}"
  RELEASE_DIR="target/${target}/release"

  SWIFTC_TARGET=""
  case "${target}" in
    x86_64-apple-ios)
      SWIFTC_TARGET="x86_64-apple-ios17.2-simulator"
      ;;
    aarch64-apple-ios-sim)
      SWIFTC_TARGET="aarch64-apple-ios17.2-simulator"
      ;;
    aarch64-apple-ios)
      SWIFTC_TARGET="aarch64-apple-ios17.2"
      ;;
    *)
      SWIFTC_TARGET="aarch64-apple-ios17.2-simulator"
  esac

  SWIFTC_SDK_PATH=""
  case "${target}" in
    x86_64-apple-ios)
      SWIFTC_SDK_PATH="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk"
      ;;
    aarch64-apple-ios-sim)
      SWIFTC_SDK_PATH="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk"
      ;;
    aarch64-apple-ios)
      SWIFTC_SDK_PATH="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk"
      ;;
    *)
      SWIFTC_SDK_PATH="/Applications/Xcode.app/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk"
  esac

  cargo build --lib --target "${target}" --release

  # generate bindings for our target
  cargo run --bin uniffi-bindgen generate --library "${RELEASE_DIR}/libtutasdk.dylib" --language swift --out-dir "${OUT_DIR}/"

  # generate swift module from dynamic library and bindings
#   swiftc \
#     -module-name tutasdk \
#     -emit-library -o "${RELEASE_DIR}/libtutasdk.dylib" \
#     -emit-module -emit-module-path "${OUT_DIR}/" \
#     -parse-as-library \
#     -L "${RELEASE_DIR}/" \
#     -l tutasdk \
#     -Xcc -fmodule-map-file="${OUT_DIR}/tutasdkFFI.modulemap" \
#     -target "${SWIFTC_TARGET}" \
#     -sdk "${SWIFTC_SDK_PATH}" \
#     "${OUT_DIR}/tutasdk.swift"

  # And then consume one way or another.
  # Would be great to expose maven library for Android.
  # Ad-hoc:
  mkdir -p "../ios/lib/${target}"
  cp "target/${target}/release/libtutasdk.a" "../ios/lib/${target}/libtutasdk.a"
  cp "${OUT_DIR}/tutasdkFFI.h" "../ios/lib"
  cp "${OUT_DIR}/tutasdk.swift" "../ios/lib"

done
