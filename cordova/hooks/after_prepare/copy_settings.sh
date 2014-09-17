#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy settings for ios"
	cp tutanota-Info.plist  platforms/ios/tutanota/
fi

