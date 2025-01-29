set -euxo pipefail

TARGETS=(
  x86_64
  aarch64
)

for arch in "${TARGETS[@]}"; do
  JNILIBS_DIR=""
  case "${arch}" in
    aarch64)
      JNILIBS_DIR="arm64-v8a"
      ;;
    *)
      JNILIBS_DIR="${arch}"
  esac

  cargo build --package tuta-sdk --lib --target "${arch}-linux-android" --release --config "target.${arch}-linux-android.linker=\"${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/${arch}-linux-android30-clang\""

  # generate bindings for our target
  cargo run --package uniffi-bindgen generate --library "../../target/${arch}-linux-android/release/libtutasdk.so" --language kotlin --out-dir out

  # And then consume one way or another.
  # Would be great to expose maven library for Android.
  # Ad-hoc:
  mkdir -p "../android/app/src/main/jniLibs/${JNILIBS_DIR}"
  mkdir -p "../android/app/src/main/java/de/tutao/tutasdk"
  cp "../../target/${arch}-linux-android/release/libtutasdk.so" "../android/app/src/main/jniLibs/${JNILIBS_DIR}/libtutasdk.so"
  cp "out/de/tutao/tutasdk/tutasdk.kt" "../android/app/src/main/java/de/tutao/tutasdk/tutasdk.kt"
done
