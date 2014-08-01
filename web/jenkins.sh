#! /bin/sh


export FIREFOX_BIN=/opt/browsers/firefox-31.0/firefox-bin
export PATH=$PATH:/var/data/node-v0.10.30-linux-x64/bin
npm prune
npm install
xvfb-run -s "-screen 0 1024x768x24" node_modules/gulp/bin/gulp.js test