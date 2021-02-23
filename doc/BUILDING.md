## Building and running your own Tutanota web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on 
your own. If you prefer the auto-update feature, you can use the official [mail](https://mail.tutanota.com) client.

#### Pre-requisites:
* An up-to-date version of Git is installed
* A version of Node.js LTS 14.x is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the repository directory: `cd tutanota`
3. Checkout the latest web release tag: `git checkout tutanota-release-xxx`
4. run `npm install` to install dependencies.
5. Build the web part: `node dist prod`
6. Switch into the build directory: `cd build/dist`
7. Run the local server. Either use `node server` or `python -m SimpleHTTPServer 9000`.
8. Open `localhost:9000` with your favorite browser (tested: Firefox, Chrome/Chromium, Safari).

## Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically.
If you prefer the auto-update feature, download the app from the Google Play Store or F-Droid.

#### Pre-requisites:
* An up-to-date version of Git is installed
* A version of Node.js LTS 10.x is installed
* An up-to-date version of the Android SDK is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the Tutanota directory: `cd tutanota`
3. Checkout the latest android release tag: `git checkout tutanota-android-release-xxx`
4. Install dependencies: `npm install`
5. Create a keystore if you don't have one: `keytool -genkey -noprompt -keystore MyKeystore.jks -alias tutaKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=com.example"`
6. run `APK_SIGN_ALIAS="tutaKey" APK_SIGN_STORE='MyKeystore.jks' APK_SIGN_STORE_PASS="CHANGEME" APK_SIGN_KEY_PASS="CHANGEME" node android`
7. Install the app on your device: `adb install -r <path-to-apk>` (path as printed by the build script)

## Building and running your own Tutanota Desktop client

Keep in mind that your own build of Tutanota Desktop will not update automatically.

### Pre-requisites:
* An up-to-date version of Git is installed.
* A version of Node.js LTS 10.x is installed

### Preparations:
0. Open a terminal.
1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`.
2. Switch into the Tutanota directory: `cd tutanota`
3. Checkout the latest web release tag: `git checkout tutanota-release-xxx`
4. Run `npm install` to install dependencies.

### Build:  
Run `node dist --custom-desktop-release`.

The client for your platform will be in `build/desktop/`.
Note that you can add `--unpacked` to the build command to skip the packaging of the installer.
This will yield a directory containing the client that can be run without installation.
