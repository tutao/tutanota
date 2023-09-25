## Building and running your own Tutanota web client

You can build your own Tutanota client and run it locally. Remember that you have to update your Tutanota client on your
own. If you prefer the auto-update feature, you can use the official [mail](https://app.tuta.com) client.

#### Pre-requisites:

* An up-to-date version of Git is installed
* Node.js (check package.json `engines` field for the version)

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the repository directory: `cd tutanota`
3. Checkout the latest web release tag: `git checkout tutanota-release-xxx`
4. run `npm ci` to install dependencies.
5. Build packages: `npm run build-packages`
6. Build the web part: `node webapp prod`
7. Switch into the build directory: `cd build/dist`
8. Run the local server. Either use `node server` or `python -m SimpleHTTPServer 9000`.
9. Open `localhost:9000` with your favorite browser (tested: Firefox, Chrome/Chromium, Safari).

## Building and running your own Tutanota Android app

If you build and install the Tutanota Android app by yourself, keep in mind that you will not get updates automatically.
If you prefer the auto-update feature, download the app from the Google Play Store or F-Droid.
The APK is also published on the GitHub releases page https://github.com/tutao/tutanota/releases.
You can add https://github.com/tutao/tutanota/releases.atom to your feed reader to get notified about available updates.

#### Pre-requisites:

* An up-to-date version of Git is installed
* Node.js (check package.json `engines` field for the version)
* An up-to-date version of the Android SDK is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`
2. Switch into the Tutanota directory: `cd tutanota`
3. Checkout the latest android release tag: `git checkout tutanota-android-release-xxx`
4. Install dependencies: `npm ci`
5. Build packages: `npm run build-packages`
6. Create a keystore if you don't have
   one: `keytool -genkey -noprompt -keystore MyKeystore.jks -alias tutaKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=com.example"`
7.

run `APK_SIGN_ALIAS="tutaKey" APK_SIGN_STORE='MyKeystore.jks' APK_SIGN_STORE_PASS="CHANGEME" APK_SIGN_KEY_PASS="CHANGEME" node android`

7. Install the app on your device: `adb install -r <path-to-apk>` (path as printed by the build script)

## Building and running your own Tutanota Desktop client

Keep in mind that your own build of Tutanota Desktop will not update automatically.

### Pre-requisites:

* An up-to-date version of Git is installed.
* Node.js (check package.json `engines` field for the version)

### Preparations:

0. Open a terminal.
1. Clone the repository: `git clone https://github.com/tutao/tutanota.git`.
2. Switch into the Tutanota directory: `cd tutanota`
3. Checkout the latest web release tag: `git checkout tutanota-release-xxx`
4. Run `npm ci` to install dependencies.

### Build:

1. Build packages: `npm run build-packages`
2. Run `node desktop --custom-desktop-release`.

The client for your platform will be in `build/desktop/`. Note that you can add `--unpacked` to the build command to
skip the packaging of the installer. This will yield a directory containing the client that can be run without
installation.

### Extra Notes:

The **windows** client uses a native dependency to enable MAPI Support. The source can be found
at https://github.com/tutao/mapirs. You can build it yourself before building the client and the build process will pick
the artifact up automatically if you structure the projects a such:

```
parent dir
├── mapirs
└── tutanota-3
```

Otherwise, the builder will load the current release from https://github.com/tutao/mapirs/releases/latest .
