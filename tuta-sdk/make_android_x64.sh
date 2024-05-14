set -euxo pipefail

cargo build --lib --target x86_64-linux-android --release --config target.x86_64-linux-android.linker=\"/opt/android-sdk-linux/ndk/26.1.10909125/toolchains/llvm/prebuilt/linux-x86_64/bin/x86_64-linux-android30-clang\"

# generate bindings for our target
cargo run --bin uniffi-bindgen generate --library target/x86_64-linux-android/release/libtutasdk.so --language kotlin --out-dir out

# And then consume one way or another.
# Would be great to expose maven library for Android.
# Ad-hoc:
cp target/x86_64-linux-android/release/libtutasdk.so ../app-android/app/src/main/jniLibs/x86_64
cp out/de/tutao/tutasdk/tutasdk.kt ../app-android/app/src/main/java/de/tutao/tutasdk/tutasdk.kt