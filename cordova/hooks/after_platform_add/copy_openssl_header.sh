#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]


then
	echo "copy openssl header files for ios"
	cp -r plugins/de.tutanota.native/include/ios  platforms/ios/Tutanota/include
fi

