#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy settings for ios"
	cp files/ios/tutanota-Info.plist  platforms/ios/tutanota/
fi

