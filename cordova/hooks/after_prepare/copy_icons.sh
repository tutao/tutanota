#!/usr/bin/env bash
#
# copies the transparent/white icons for notifications to the correct folders
if [[ $CORDOVA_PLATFORMS == *android* ]]
then
	cp graphics/app/android/icon-transparent-36-ldpi.png platforms/android/res/drawable-ldpi/transparent.png
	cp graphics/app/android/icon-transparent-48-mdpi.png platforms/android/res/drawable-mdpi/transparent.png
	cp graphics/app/android/icon-transparent-72-hdpi.png platforms/android/res/drawable-hdpi/transparent.png
	cp graphics/app/android/icon-transparent-96-xhdpi.png platforms/android/res/drawable-xhdpi/transparent.png
fi