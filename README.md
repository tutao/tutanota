# Tutanota makes encryption easy

Tutanota is the end-to-end encrypted email client that enables you to communicate securely with anyone.

* Official website: https://tutanota.com
* Issue and feature tracker: https://tutanota.uservoice.com/forums/237921-general

## Building and running your own Tutanota web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your own. If you prefer the auto-update feature, you can use https://app.tutanota.com directly and upon every update your browser will notify you that the updated app is being installed locally in your browser cache.

#### Pre-requisites:
* An up-to-date version of Git is installed
* An up-to-date version of Node.js is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the web directory: `cd tutanota/web`
3. Checkout latest release (currently 2.15.0): `git checkout tutanota-release-2.15.0`
4. Install gulp globally: `npm install -g gulp`
5. Install dependencies: `npm install`
6. Build Tutanota: `gulp dist`
7. Switch into the build directory: `cd build`
8. Open the `index.html` with your favorite browser (tested: Firefox and Chrome). Running Tutanota locally with Chrome requires starting Chrome with the argument `--allow-file-access-from-files`.

## Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically. If you prefer the auto-update feature, use the Google Play Store or the Amazon Store.

#### Pre-requisites:
* An up-to-date version of Git is installed
* An up-to-date version of Node.js is installed
* An up-to-date version of the Android SDK (API 23) is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the Tutanota directory: `cd tutanota`
3. Checkout latest Android release (currently 2.15.0): `git checkout tutanota-android-release-2.15.0`
4. Install Cordova globally: `npm install -g cordova`
5. Install gulp.js globally: `npm install -g gulp`
6. Install dependencies: `npm install`
7. Change into the Cordova directory: `cd cordova`
8. Build the app: `gulp androidProdDistUnsigned`
9. Create a keystore: `keytool -genkey -v -keystore MyKeystore.keystore -alias TutanotaKey -keyalg RSA -keysize 2048 -validity 10000`
10. Sign the app: `jarsigner -verbose -keystore MyKeystore.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk TutanotaKey`
11. Align the app: `<path_to_android_sdk_>/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk platforms/android/build/outputs/apk/Tutanota-release.apk`
12. Install the app on your device: `adb install platforms/android/build/outputs/apk/Tutanota-release.apk`
