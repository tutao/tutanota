# Tutanota makes encryption easy

Tutanota is the end-to-end encrypted email client that enables you to communicate securely with anyone.

* Official website: https://tutanota.com
* Issue and feature tracker: https://tutanota.uservoice.com/forums/237921-general

## WebStorm
Tutanota is built with [WebStorm](https://www.jetbrains.com/webstorm/) from [JetBrains](https://www.jetbrains.com/)

[![WebStorm Logo](logo_WebStorm.png)](https://www.jetbrains.com/webstorm/)

## Building and running your own Tutanota web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your own. If you prefer the auto-update feature, you can use https://app.tutanota.de directly and upon every update your browser will notify you that the updated app is being installed locally in your browser cache.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed

Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the web directory: `cd tutanota/web`
3. Checkout latest release (currently 2.14.4): `git checkout tutanota-release-2.14.4`
4. Install gulp globally: `npm install -g gulp`
5. Install dependencies: `npm install`
6. Build Tutanota: `gulp dist`
7. Switch into the build directory: `cd build`
8. Open the index.html with your favorite browser (tested: Firefox and Chrome). Running Tutanota locally with Chrome requires starting Chrome with the argument `--allow-file-access-from-files`.

## Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically. If you prefer the auto-update feature, use the Google Play Store or the Amazon Store.

Pre-requisites:
* An up-to-date version of git is installed
* An up-to-date version of node js is installed
* An up-to-date version of the Android SDK (API 23) is installed

Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the tutanota directory: `cd tutanota`
3. Checkout latest android release (currently 2.14.0): `git checkout tutanota-android-release-2.14.0`
4. Install cordova globally: `npm install -g cordova`
5. Install gulp globally: `npm install -g gulp`
6. Install dependencies: `npm install`
7. Change into the cordova directory: `cd cordova`
8. Build the app: `gulp androidProdDistUnsigned`
9. Create a keystore: `keytool -genkey -v -keystore MyKeystore.keystore -alias TutanotaKey -keyalg RSA -keysize 2048 -validity 10000`
10. Sign the app: `jarsigner -verbose -keystore MyKeystore.keystore platforms/android/build/outputs/apk/android-release-unsigned.apk TutanotaKey`
11. Align the app: `<path_to_android_sdk_>/build-tools/22.0.1/zipalign -v 4 platforms/android/build/outputs/apk/android-release-unsigned.apk platforms/android/build/outputs/apk/Tutanota-release.apk`
12. Install the app on your device: `adb install platforms/android/build/outputs/apk/Tutanota-release.apk`

## Server templates

Server templates contains working installation instructions. Allows to create a temporary server to test, deploy production servers and fork configurations for customization.

Distribution  | Status
------------- | -------------
[Debian Wheezy](https://manageacloud.com/configuration/tutanota_email_client_debian_wheezy_70) | [![Debian Wheezy](https://manageacloud.com/configuration/tutanota_email_client_debian_wheezy_70/build/1/image)](https://manageacloud.com/configuration/tutanota_email_client_debian_wheezy_70/builds)
[Debian Jessie](https://manageacloud.com/configuration/tutanota_debian_jessie) | [![Debian Jessie](https://manageacloud.com/configuration/tutanota_debian_jessie/build/7/image)](https://manageacloud.com/configuration/tutanota_debian_jessie/builds)
[Ubuntu 14.04](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_trusty_tahr_1404)  | [![Ubuntu 14.04](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_trusty_tahr_1404/build/2/image)](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_trusty_tahr_1404/builds)
[Ubuntu 14.10](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_utopic_unicorn_1410) | [![Ubuntu 14.10](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_utopic_unicorn_1410/build/6/image)](https://manageacloud.com/configuration/tutanota_email_client_ubuntu_utopic_unicorn_1410/builds)
[Ubuntu 15.04](https://manageacloud.com/configuration/tutanota_ubuntu_vivid_15_04) | [![Ubuntu 15.04](https://manageacloud.com/configuration/tutanota_ubuntu_vivid_15_04/build/8/image)](https://manageacloud.com/configuration/tutanota_ubuntu_vivid_15_04/builds)
[CentOS 6.5](https://manageacloud.com/configuration/tutanota_email_client) | [![CentOS 6.5](https://manageacloud.com/configuration/tutanota_email_client/build/3/image)](https://manageacloud.com/configuration/tutanota_email_client/builds)
[CentOS 7](https://manageacloud.com/configuration/tutanota_email_client_centos_7) | [![CentOS 7](https://manageacloud.com/configuration/tutanota_email_client_centos_7/build/5/image)](https://manageacloud.com/configuration/tutanota_email_client_centos_7/builds)



## Tests

We use the following tools for testing:
* Test runner: [Karma](http://karma-runner.github.io/)
* Test framework: [Mocha doc](http://mochajs.org/)
* Assertion framework: [chai.js API doc](http://chaijs.com/api/assert/)
