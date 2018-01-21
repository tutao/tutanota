# Tutanota makes encryption easy

Tutanota is the end-to-end encrypted email client that enables you to communicate securely with anyone.

* Official website: https://tutanota.com
* Issue and feature tracker: https://tutanota.uservoice.com/forums/237921-general

## Building and running your own Tutanota client

The instructions below describe how to build and run the Tutanota open source clients, i.e. the Web client and the Android app.

Please note that in order to use or test any one of the open source clients in a meaningful way you need to contact the Tutanota servers: the reason is that the Tutanota server is not open source, no open source reimplementation of it is known to exist, no test stub or mock of it is known to exist, and the definition of its API ([1](src/api/entities/sys/Services.js), [2](src/api/entities/tutanota/Services.js), [3](src/api/entities/monitor/Services.js)) is not published.

### Building and running your own Tutanota Web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your own. If you prefer the auto-update feature, you can use https://app.tutanota.com directly and upon every update your browser will notify you that the updated app is being installed locally in your browser cache.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed

Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Checkout latest release (currently 3.25.10): `git checkout tutanota-release-3.25.10`
3. Install dependencies: `npm install`
4. [Build Tutanota](buildSrc/env.js): `node dist`
5. Switch into the build directory: `cd build/dist`
6. Open the `index.html` with your favorite browser (tested: Firefox and Chrome). Running Tutanota locally with Chrome requires starting Chrome with the argument `--allow-file-access-from-files`.

### Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically. If you prefer the auto-update feature, use the Google Play Store or the Amazon Store.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed
* An up-to-date version of the Android SDK (API 23) is installed

Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the tutanota directory: `cd tutanota`
3. Checkout latest android release (currently 2.15.0): `git checkout tutanota-android-release-2.15.0`
4. Install cordova globally: `npm install -g cordova`
5. Install gulp globally: `npm install -g gulp`
6. Install dependencies: `npm install`
7. Change into the cordova directory: `cd cordova`
8. Build the app: `gulp androidProdDistUnsigned`
9. Create a keystore: `keytool -genkey -v -keystore MyKeystore.keystore -alias TutanotaKey -keyalg RSA -keysize 2048 -validity 10000`
10. Sign the app: `jarsigner -verbose -keystore MyKeystore.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk TutanotaKey`
11. Align the app: `<path_to_android_sdk_>/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk platforms/android/build/outputs/apk/Tutanota-release.apk`
12. Install the app on your device: `adb install platforms/android/build/outputs/apk/Tutanota-release.apk`

