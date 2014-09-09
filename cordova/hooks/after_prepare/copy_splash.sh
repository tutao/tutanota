#!/bin/bash

echo "copy splash screen images"
pwd
cp www/graphics/app/android/xlarge_xhdpi.png platforms/android/res/drawable-land-xhdpi/sreen.png
cp www/graphics/app/android/large_hdpi.png  platforms/android/res/drawable-land-hdpi/sreen.png
cp www/graphics/app/android/medium_mdpi.png  platforms/android/res/drawable-land-mdpi/sreen.png
cp www/graphics/app/android/small_ldpi.png  platforms/android/res/drawable-land-ldpi/sreen.png


cp www/graphics/app/ios/Default-568h@2x~iphone.png  platforms/ios/tutanota/Resources/splash/
cp www/graphics/app/ios/Default-Landscape@2x~ipad.png  platforms/ios/tutanota/Resources/splash/
cp www/graphics/app/ios/Default-Landscape~ipad.png  platforms/ios/tutanota/Resources/splash/
cp www/graphics/app/ios/Default-Portrait@2x~ipad.png  platforms/ios/tutanota/Resources/splash/
cp www/graphics/app/ios/Default-Portrait~ipad.png  platforms/ios/tutanota/Resources/splash/
cp www/graphics/app/ios/Default@2x~iphone.png  platforms/ios/tutanota/Resources/splash/
cp www/graphics/app/ios/Default~iphone.png  platforms/ios/tutanota/Resources/splash/