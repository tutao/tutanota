#!/bin/bash
export PATH=$PATH:/opt/node-v0.10.30-linux-x64/bin:../node_modules/cordova/bin/

# package.json is in parent folder, so move up
cd ..
npm prune
npm install
npm install cordova

cd cordova
# TODO install android sdk on server
cordova platform add android
ln -sf /opt/next-config/android-keystore/ant.properties ./platforms/android/

../node_modules/gulp/bin/gulp.js releaseAndroid
