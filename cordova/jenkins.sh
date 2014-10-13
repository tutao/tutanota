#!/bin/bash
export PATH=$PATH:/opt/node-v0.10.30-linux-x64/bin
npm prune
npm install

ln -sf /opt/next-config/android-keystore/ant.properties ./platforms/android/

../node_modules/gulp/bin/gulp.js releaseAndroid