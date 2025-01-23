## Building

### Android

You need at least NDK 23

```
# install the Android NDK
Android Studio -> Android SDK Manager -> SDK Tools -> NDK (Side by Side) -> Install

# install the Android targets for rust (part of rust-tuta pkg on dev machines)
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

# add ANDROID_NDK_HOME to your shell profile (.bashrc).
- the version depends on your locally installed NDK version. Check your installed NDK version in /opt/android-sdk-linux/ndk
export ANDROID_NDK_HOME=/opt/android-sdk-linux/ndk/<<your-ndk-version>>

# add NDK toolchain to path
export PATH=${PATH}:${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/

# build the sdk for Android
./make_android.sh

# setup the tuta-sdk project
- open tutanota-3/tuta-sdk/android in Android Studio
- Ctrl + A -> Project Structure -> Modules -> SDK -> select the NDK
- do a gradle sync in Android Studio

# setup the app-android project
- open tutanota-3/app-android in Android Studio
- do a gradle sync in Android Studio
```

## iOS

Have the iOS 17.2 SDK installed before running these.

```
# install the iOS targets for rust
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# build the sdk for iOS
./make_ios.sh
```
