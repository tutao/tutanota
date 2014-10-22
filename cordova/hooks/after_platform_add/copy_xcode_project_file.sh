#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy xcode project file for ios"
	cp -r files/ios/Tutanota.xcodeproj  platforms/ios
fi

