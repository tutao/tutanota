#!/bin/bash

export FIREFOX_BIN=/opt/browsers/firefox-45.0/firefox-bin
export PATH=$PATH:/opt/node-v0.10.30-linux-x64/bin
npm prune
npm install

if [ "$RELEASE" == "true" ]; then
  echo "Starting the release build"
  xvfb-run -s "-screen 0 1024x768x24" ../node_modules/gulp/bin/gulp.js test release
else
  xvfb-run -s "-screen 0 1024x768x24" ../node_modules/gulp/bin/gulp.js test dist
fi