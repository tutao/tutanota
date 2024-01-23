## Building

### Android
You need at least NDK 23
```
# install the android targets for rust
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android i686-linux-android

# add ANDROID_NDK_HOME to your shell profile (.bashrc)
export ANDROID_NDK_HOME=/opt/android-sdk-linux/ndk/26.1.10909125

# build the sdk for android
./make_android.sh

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
