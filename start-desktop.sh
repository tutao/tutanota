#!/usr/bin/env bash
if [[ $OSTYPE = darwin* ]]; then
	ELECTRON_ENABLE_SECURITY_WARNINGS=TRUE ./node_modules/.bin/electron --inspect=5858 ./build/
else
	ELECTRON_ENABLE_SECURITY_WARNINGS=TRUE ./node_modules/.bin/electron --inspect=5858 ./build/
fi