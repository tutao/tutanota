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
	echo "copy splash screen images for ios"
	cp www/graphics/app/ios/Default-568h@2x~iphone.png  platforms/ios/tutanota/Resources/splash/
	cp www/graphics/app/ios/Default-Landscape@2x~ipad.png  platforms/ios/tutanota/Resources/splash/
	cp www/graphics/app/ios/Default-Landscape~ipad.png  platforms/ios/tutanota/Resources/splash/
	cp www/graphics/app/ios/Default-Portrait@2x~ipad.png  platforms/ios/tutanota/Resources/splash/
	cp www/graphics/app/ios/Default-Portrait~ipad.png  platforms/ios/tutanota/Resources/splash/
	cp www/graphics/app/ios/Default@2x~iphone.png  platforms/ios/tutanota/Resources/splash/
	cp www/graphics/app/ios/Default~iphone.png  platforms/ios/tutanota/Resources/splash/
fi

