#!/usr/bin/env bash
if [[ $OSTYPE = darwin* ]]; then
	ELECTRON_ENABLE_SECURITY_WARNINGS=TRUE ./node_modules/.bin/electron --inspect-brk=5858 ./build/ $1
else
	ELECTRON_ENABLE_SECURITY_WARNINGS=TRUE ./node_modules/.bin/electron --inspect-brk=5858 ./build/ $1
fi
