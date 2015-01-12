# Tutanota makes encryption easy

Tutanota is the end-to-end encrypted email client that enables you to communicate securely with anyone.

* Official website: https://tutanota.de
* Issue and feature tracker: https://tutanota.uservoice.com/forums/237921-general

## Building and running your own Tutanota web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your own. If you prefer the auto-update feature, you can use https://app.tutanota.de directly and upon every update your browser will notify you that the updated app is being installed locally in your browser cache.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed

Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the web directory: `cd tutanota/web`
3. Checkout latest release (currently 1.6.1): `git checkout tutanota-release-1.6.1`
4. Install dependencies: `npm install`
5. Build Tutanota: `gulp dist`
6. Switch into the build directory: `cd build`
7. Open the index.html with your favorite browser (tested: Firefox and Chrome). Running Tutanota locally with Chrome requires starting Chrome with the argument `--allow-file-access-from-files`.

## Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically. If you prefer the auto-update feature, use the Google Play Store or the F-Droid store.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of ant is installed
* An up-to-date version of node js is installed
* An up-to-date version of the Android SDK (API 19 and API 21) is installed

Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the tutanota directory: `cd tutanota`
3. Checkout latest android release (currently 1.6.2): `git checkout tutanota-android-release-1.6.2`
4. Install cordova globally: `sudo npm install -g cordova`
5. Install dependencies: `npm install`
6. Change into the cordova directory: `cd cordova`
7. Build the app: `gulp androidProdDistUnsigned`
8. Create a keystore: `keytool -genkey -v -keystore MyKeystore.keystore -alias TutanotaKey -keyalg RSA -keysize 2048 -validity 10000`
9. Sign the app: `jarsigner -verbose -keystore MyKeystore.keystore platforms/android/ant-build/Tutanota-release-unsigned.apk TutanotaKey`
10. Align the app: `<path_to_android_sdk_>/build-tools/21.0.2/zipalign -v 4 platforms/android/ant-build/Tutanota-release-unsigned.apk platforms/android/ant-build/Tutanota-release.apk`
11. Install the app on your device: `adb install ./platforms/android/ant-build/Tutanota-release.apk`

## Server templates

Server templates contains working installation instructions. Allows to create a temporary server to test, deploy production servers and fork configurations for customization.
* [Debian Wheezy] (https://manageacloud.com/cookbook/tutanota_email_client_debian_wheezy_70)
* [Ubuntu 14.04] (https://manageacloud.com/cookbook/tutanota_email_client_ubuntu_trusty_tahr_1404)
* [Ubuntu 14.10] (https://manageacloud.com/cookbook/tutanota_email_client_ubuntu_utopic_unicorn_1410)
* [Amazon Linux] (https://manageacloud.com/cookbook/tutanota_email_client_amazon_2014032)
* [CentOS 6.5] (https://manageacloud.com/cookbook/tutanota_email_client)
* [CentOS 7] (https://manageacloud.com/cookbook/tutanota_email_client_centos_7)

## Tests

We use the following tools for testing:
* Test runner: [Karma](http://karma-runner.github.io/)
* Test framework: [Mocha doc](http://chaijs.com/api/assert/)
* Assertion framework: [chai.js API doc](http://chaijs.com/api/assert/)
