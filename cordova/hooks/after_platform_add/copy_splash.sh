#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy splash screen images and app icons for ios"
	mkdir platforms/ios/Tutanota/images.xcassets
	LAUNCHIMAGE_DIR="platforms/ios/Tutanota/images.xcassets/LaunchImage.launchimage"
	APPICON_DIR="platforms/ios/Tutanota/images.xcassets/AppIcon.appiconset"

	mkdir $LAUNCHIMAGE_DIR
	mkdir $APPICON_DIR

	cp files/ios/LaunchImage.launchimage/Contents.json $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-568h@2x~iphone.png $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-Landscape@2x~ipad.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-Landscape~ipad.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-Portrait@2x~ipad.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-Portrait~ipad.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default@2x~iphone.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-667h.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-736h.png  $LAUNCHIMAGE_DIR
	cp graphics/app/ios/Default-Landscape-736h.png  $LAUNCHIMAGE_DIR

	cp files/ios/AppIcon.appiconset/Contents.json $APPICON_DIR
	cp graphics/app/ios/icon-40.png $APPICON_DIR
	cp graphics/app/ios/icon-40-2x.png $APPICON_DIR
	cp graphics/app/ios/icon-60-2x.png $APPICON_DIR
	cp graphics/app/ios/icon-60-3x.png $APPICON_DIR
	cp graphics/app/ios/icon-76.png $APPICON_DIR
	cp graphics/app/ios/icon-76-2x.png $APPICON_DIR
	cp graphics/app/ios/icon-29.png $APPICON_DIR
	cp graphics/app/ios/icon-29-2x.png $APPICON_DIR
fi

