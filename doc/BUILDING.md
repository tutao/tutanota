## Building and running your own Tuta Mail web client

You can build your own Tuta Mail client and run it locally. Remember that you have to update your Tuta Mail client on your
own. If you prefer the auto-update feature, you can use the official [mail](https://app.tuta.com) client.

Instructions here will produce a *release* version of the client. For *debug* version see [HACKING.md](./HACKING.md).

#### Pre-requisites:

* An up-to-date version of Git is installed
* Node.js (check package.json `engines` field for the version)
* Emscripten 3.1.59
* WASM2JS (included in binaryen, sometimes includes with emscripten)
* Cargo & Rust (1.80 up)

#### Build steps:

1. Clone the repository: `git clone https://github.com/sdpteam30/sdptutanota.git`
2. Switch into the repository directory: `cd sdptutanota`
3. Add the upstream Tutanota branch with `git remote add upstream https://github.com/tutao/tutanota.git`
4. Fetch the official Tuta Mail release branches with `git fetch upstream`
5. Checkout the latest web release tag: `git checkout tutanota-release-xxx`
6. Initialize liboqs and argon2 submodules: `git submodule init`
7. Synchronize submodules: `git submodule sync --recursive`
8. Update submodules: `git submodule update`
9. run `npm ci` to install dependencies.
10. Build packages: `npm run build-packages`
11. Switch to the branch of your choosing (ex. `git switch logging`)
12. Pull the most recent changes to that branch with `git pull`
12. Build the web part: `node make prod`

#### MobyPhish Button Specific Steps: 
12. Navigate to the backend directory with from `sdptutanota` with `cd trusted-senders-backend`. 
13. Run `npm ci` to install dependencies and then `node index.js`. This will start the backend server on port 3000. 
14. Now open a new terminal window in `sdptutanota` and navigate to the CORS Anywhere proxy directory with `cd cors-anywhere`
15. Run `npm ci` once again for dependencies and then `node server.js` to start the CORS proxy on localhost:8080. 
16. Finally in a third terminal window, switch into the build directory: `cd build`
17. Run the local frontend server e.g. `npx serve build -s -p 9000` or `python3 -m HTTP.Server 9000`.
18. Open `localhost:9000` with your favorite browser (tested: Firefox, Chrome/Chromium, Safari).

> If you try building without initializing the submodules, you might end up with
> the following error:
>
> ```
> Build error: Error: Could not load wasm-loader:liboqs.wasm (imported by src/common/api/worker/facades/KyberFacade.ts): Command failed: make -f Makefile_liboqs build
> liboqs/src/kem/kem.c:12:10: fatal error: 'oqs/oqs.h' file not found
> ```
>
> Just delete the `libs/webassembly/include` directory and re-build.

## Building and running your own Tuta Mail Android app

If you build and install the Tuta Mail Android app by yourself, keep in mind that you will not get updates automatically.
If you prefer the auto-update feature, download the app from the Google Play Store or F-Droid.
The APK is also published on the GitHub releases page https://github.com/tutao/tutanota/releases.
You can add https://github.com/tutao/tutanota/releases.atom to your feed reader to get notified about available updates.

#### Pre-requisites:

* An up-to-date version of Git is installed
* Node.js (check package.json `engines` field for the version)
* An up-to-date version of the Android SDK is installed

#### Build steps:

1. Clone the repository: `git clone https://github.com/sdpteam30/sdptutanota.git`
2. Switch into the Tutanota directory: `cd sdptutanota`
3. Checkout the latest android release tag: `git checkout tutanota-android-release-xxx`
4. Initialize liboqs and argon2 submodules: `git submodule init`
5. Synchronize submodules: `git submodule sync --recursive`
6. Update submodules: `git submodule update`
7. Install dependencies: `npm ci`
8. Build packages: `npm run build-packages`
9. Create a keystore if you don't have
   one: `keytool -genkey -noprompt -keystore MyKeystore.jks -alias tutaKey -keyalg RSA -keysize 2048 -validity 10000 -deststoretype pkcs12 -storepass CHANGEME -keypass CHANGEME -dname "CN=com.example"`
10.

run `APK_SIGN_ALIAS="tutaKey" APK_SIGN_STORE='MyKeystore.jks' APK_SIGN_STORE_PASS="CHANGEME" APK_SIGN_KEY_PASS="CHANGEME" node android`

11. Install the app on your device: `adb install -r <path-to-apk>` (path as printed by the build script)

## Building and running your own Tuta Mail Desktop client

Keep in mind that your own build of Tuta Mail Desktop will not update automatically.

### Pre-requisites:

* An up-to-date version of Git is installed.
* Node.js (check package.json `engines` field for the version)

### Preparations:

0. Open a terminal.
1. Clone the repository: `git clone https://github.com/sdpteam30/sdptutanota.git`.
2. Switch into the Tutanota directory: `cd tutanota`
3. Checkout the latest web release tag: `git checkout tutanota-release-xxx`
4. Initialize liboqs and argon2 submodules: `git submodule init`
5. Synchronize submodules: `git submodule sync --recursive`
6. Update submodules: `git submodule update`
7. Run `npm ci` to install dependencies.

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
