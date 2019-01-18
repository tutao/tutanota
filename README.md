<h1 align="center">
<br>
  <img src="resources/images/logo-red.svg" alt="Tutanota logo" width="300">
  <br>
    <br>
  Tutanota makes encryption easy
  <br>
</h1>

Tutanota is the [secure email](https://tutanota.com) service with built-in end-to-end encryption that enables you to communicate securely with anyone on all your devices.

* Forum for bug reports/feature requests: https://www.reddit.com/r/tutanota
* Roadmap: http://tutanota.com/roadmap/
* Issue and feature tracker: https://github.com/tutao/tutanota/issues. Please submit your feature requests via Reddit or via support mail.
* Legacy tracker: https://tutanota.uservoice.com/forums/237921-general

<a href="https://play.google.com/store/apps/details?id=de.tutao.tutanota"><img src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png" height="75"></a><a href="https://f-droid.org/packages/de.tutao.tutanota/"><img src="https://f-droid.org/badge/get-it-on.png" height="75"></a>

<a href="https://mail.tutanota.com">Web client</a>
•
<a href="https://itunes.apple.com/us/app/tutanota/id922429609">iOS App Store</a>
•
<a href="https://tutanota.com/blog/posts/desktop-clients">Desktop Client (Beta)</a>

## Building and running your own Tutanota web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on 
your own. If you prefer the auto-update feature, you can use the official [mail](https://mail.tutanota.com) client.

#### Pre-requisites:
* An up-to-date version of Git is installed
* An up-to-date version of Node.js is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the repository directory: `cd tutanota`
3. Do `npm install`
4. Build the web part: `node dist prod`
5. Switch into the build directory: `cd build/dist`
6. Run local server. Either use `node server` or `python -m SimpleHTTPServer 9000`.
7. Open the `` with your favorite browser (tested: Firefox, Chrome/Chromium, Safari).

## Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically.
If you prefer the auto-update feature, use the Google Play Store or F-Droid in the future.

#### Pre-requisites:
* An up-to-date version of Git is installed
* An up-to-date version of Node.js is installed
* An up-to-date version of the Android SDK is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the Tutanota directory: `cd tutanota`
3. Install dependencies: `npm install`
4. Create a keystore if you don't have one: `keytool -genkey -noprompt -keystore MyKeystore.jks -alias tutaKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=com.example"`
5. run `APK_SIGN_ALIAS="tutaKey" APK_SIGN_STORE='MyKeystore.jks' APK_SIGN_STORE_PASS="CHANGEME" APK_SIGN_KEY_PASS="CHANGEME" node android`
6. Install the app on your device: `adb install -r <path-to-apk>` (path as printed by the build script)
