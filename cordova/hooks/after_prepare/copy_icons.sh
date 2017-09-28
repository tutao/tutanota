#!/usr/bin/env bash
#
# copies the transparent/white icons for notifications to the correct folders
if [[ $CORDOVA_PLATFORMS == *android* ]]
then
	echo "copy icons for android"
	cp graphics/app/android/icon-transparent-36-ldpi.png platforms/android/res/drawable-ldpi/transparent.png
	cp graphics/app/android/icon-transparent-48-mdpi.png platforms/android/res/drawable-mdpi/transparent.png
	cp graphics/app/android/icon-transparent-72-hdpi.png platforms/android/res/drawable-hdpi/transparent.png
	cp graphics/app/android/icon-transparent-96-xhdpi.png platforms/android/res/drawable-xhdpi/transparent.png
fi

if [[ $CORDOVA_PLATFORMS == *ios* ]]
then
	echo "copy icons for ios"
	cp graphics/app/ios/icon-1024.png platforms/ios/Tutanota/Images.xcassets/Appicon.appiconset
	cp graphics/app/ios/icon-20.png platforms/ios/Tutanota/Images.xcassets/Appicon.appiconset
	cp graphics/app/ios/icon-20@2x.png platforms/ios/Tutanota/Images.xcassets/Appicon.appiconset
	cp graphics/app/ios/icon-20@3x.png platforms/ios/Tutanota/Images.xcassets/Appicon.appiconset
	cp files/ios/Contents.json platforms/ios/Tutanota/Images.xcassets/Appicon.appiconset
fi
