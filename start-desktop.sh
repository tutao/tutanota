#!/usr/bin/env bash
if [[ $OSTYPE = darwin* ]]; then
	./node_modules/electron/dist/Electron.app/Contents/MacOS/Electron --inspect=5858 ./build/
else
	./node_modules/electron/dist/electron --inspect=5858 ./build/
fi