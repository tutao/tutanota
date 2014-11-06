#!/bin/bash

if [[ $CORDOVA_PLATFORMS == *android* ]]
then
	echo "Rename CordovaApp to Tutanota"	
    sed -i "s/CordovaApp/Tutanota/g" ./platforms/android/CordovaLib/src/org/apache/cordova/App.java
    sed -i "s/CordovaApp/Tutanota/g" ./platforms/android/CordovaLib/.project
    sed -i "s/CordovaApp/Tutanota/g" ./platforms/android/AndroidManifest.xml
  #  sed -i "s/CordovaApp/Tutanota/g" ./platforms/android/bin/AndroidManifest.xml
    sed -i "s/CordovaApp/Tutanota/g" ./platforms/android/src/de/tutao/tutanota/CordovaApp.java
	mv ./platforms/android/src/de/tutao/tutanota/CordovaApp.java ./platforms/android/src/de/tutao/tutanota/Tutanota.java
fi
