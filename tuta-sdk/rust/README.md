## Building

### Android

You need at least NDK 23

```
# install the android NDK
Android Studio -> Android SDK Manager -> SDK Tools -> NDK (Side by Side) -> Install

# install the android targets for rust (part of rust-tuta pkg on dev machines)
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

# add ANDROID_NDK_HOME to your shell profile (.bashrc). the version depends on your NDK version.
export ANDROID_NDK_HOME=/opt/android-sdk-linux/ndk/28.0.12674087

# add NDK toolchain to path
export PATH=${PATH}:${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/linux-x86_64/bin/

# build the sdk for android
./make_android.sh

# setup the sdk project
- open tutanota-3/tutasdk/android in Android Studio
- Ctrl + A -> Project Structure -> Modules -> SDK -> select the NDK
- gradle sync

# add sdk/android to the app-android project as a library
# sync gradle in Android Studio
```

## iOS

Have the iOS 17.2 SDK installed before running these.

```
# install the iOS targets for rust
rustup target add aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim

# build the sdk for iOS
./make_ios.sh
```
