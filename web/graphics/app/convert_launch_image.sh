#
# (OS X, Unix and Linux)
#
# What is this?
#
# It's a shell script that is using inkscape to create all the launch image files from one source file.
#
# Run the script from terminal and copy the files in the appropriate folder for your platfom.
#
# platforms/android/res/drawable-*
# platforms/ios/tutanota/Resources/splash
#

SPLASH=tutanota-logo.svg

mkdir android
inkscape -z -e android/xlarge_xhdpi -w 960 -h 720 $SPLASH
inkscape -z -e android/large_hdpi -w 640 -h 480 $SPLASH
inkscape -z -e android/medium_mdpi -w 470 -h 320 $SPLASH
inkscape -z -e android/small_ldpi -w 426 -h 320 $SPLASH 



mkdir ios
inkscape -z -e ios/Default-568h@2x~iphone.png  -w 640 -h 1136 $SPLASH
inkscape -z -e ios/Default-Landscape@2x~ipad.png  -w 2048 -h 1496 $SPLASH
inkscape -z -e ios/Default-Landscape~ipad.png  -w 1024 -h 748 $SPLASH
inkscape -z -e ios/Default-Portrait@2x~ipad.png  -w 1536 -h 2008 $SPLASH
inkscape -z -e ios/Default-Portrait~ipad.png  -w 768 -h 1004 $SPLASH
inkscape -z -e ios/Default@2x~iphone.png  -w 640 -h 960 $SPLASH
inkscape -z -e ios/Default~iphone.png  -w 320 -h 480 $SPLASH
