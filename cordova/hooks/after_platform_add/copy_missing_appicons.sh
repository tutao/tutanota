#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]


then
	echo "copy missing app icon files for ios"
	cp  files/ios/Contents.json  platforms/ios/Tutanota/Images.xcassets/AppIcon.appiconset/
	cp  graphics/app/ios/icon-83.5@2x.png  platforms/ios/Tutanota/Images.xcassets/AppIcon.appiconset/
fi

