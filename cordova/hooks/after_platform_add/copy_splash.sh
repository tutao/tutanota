#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *android* ]]
then
	echo "copy splash screen images for android"
	cp www/graphics/app/android/xlarge_land_xhdpi.png platforms/android/res/drawable-land-xhdpi/screen.png
	cp www/graphics/app/android/large_land_hdpi.png  platforms/android/res/drawable-land-hdpi/screen.png
	cp www/graphics/app/android/medium_land_mdpi.png  platforms/android/res/drawable-land-mdpi/screen.png
	cp www/graphics/app/android/small_land_ldpi.png  platforms/android/res/drawable-land-ldpi/screen.png

	cp www/graphics/app/android/xlarge_port_xhdpi.png platforms/android/res/drawable-port-xhdpi/screen.png
	cp www/graphics/app/android/large_port_hdpi.png  platforms/android/res/drawable-port-hdpi/screen.png
	cp www/graphics/app/android/medium_port_mdpi.png  platforms/android/res/drawable-port-mdpi/screen.png
	cp www/graphics/app/android/small_port_ldpi.png  platforms/android/res/drawable-port-ldpi/screen.png
fi

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy splash screen images and app icons for ios"
	mkdir platforms/ios/Tutanota/images.xcassets
	LAUNCHIMAGE_DIR="platforms/ios/Tutanota/images.xcassets/LaunchImage.launchimage"
	APPICON_DIR="platforms/ios/Tutanota/images.xcassets/AppIcon.appiconset"

	mkdir $LAUNCHIMAGE_DIR
	mkdir $APPICON_DIR

	cp files/ios/LaunchImage.launchimage/Contents.json $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-568h@2x~iphone.png $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-Landscape@2x~ipad.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-Landscape~ipad.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-Portrait@2x~ipad.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-Portrait~ipad.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default@2x~iphone.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-667h.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-736h.png  $LAUNCHIMAGE_DIR
	cp www/graphics/app/ios/Default-Landscape-736h.png  $LAUNCHIMAGE_DIR

	cp files/ios/AppIcon.appiconset/Contents.json $APPICON_DIR
	cp www/graphics/app/ios/icon-40.png $APPICON_DIR
	cp www/graphics/app/ios/icon-40-2x.png $APPICON_DIR
	cp www/graphics/app/ios/icon-60-2x.png $APPICON_DIR
	cp www/graphics/app/ios/icon-60-3x.png $APPICON_DIR
	cp www/graphics/app/ios/icon-76.png $APPICON_DIR
	cp www/graphics/app/ios/icon-76-2x.png $APPICON_DIR
	cp www/graphics/app/ios/icon-29.png $APPICON_DIR
	cp www/graphics/app/ios/icon-29-2x.png $APPICON_DIR
fi

