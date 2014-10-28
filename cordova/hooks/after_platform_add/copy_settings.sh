#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy project settings for ios"
	cp files/ios/Tutanota-Info.plist  platforms/ios/Tutanota/
	cp -r files/ios/Tutanota.xcodeproj  platforms/ios/
fi

