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
inkscape -b ffffff00 -z -e android/xlarge_xhdpi --export-area=0:660:1280:1620 -w 960 -h 720 $SPLASH # 1:0,75
inkscape -b ffffff00 -z -e android/large_hdpi --export-area=0:660:1280:1620 -w 640 -h 480 $SPLASH # 1:0,75
inkscape -b ffffff00 -z -e android/medium_mdpi --export-area=0:704:1280:1575 -w 470 -h 320 $SPLASH # 1:0,68
inkscape -b ffffff00 -z -e android/small_ldpi --export-area=0:660:1280:1620 -w 426 -h 320 $SPLASH # 1:0,75



mkdir ios
inkscape -b ffffff00 -z -e ios/Default-568h@2x~iphone.png  --export-area=0:4:1280:2276 -w 640 -h 1136 $SPLASH # 1:1.775
inkscape -b ffffff00 -z -e ios/Default-Landscape@2x~ipad.png  --export-area=0:672:1280:1607 -w 2048 -h 1496 $SPLASH # 1:0,73
inkscape -b ffffff00 -z -e ios/Default-Landscape~ipad.png  --export-area=0:672:1280:1607 -w 1024 -h 748 $SPLASH # 1:0,73
inkscape -b ffffff00 -z -e ios/Default-Portrait@2x~ipad.png  --export-area=0:301:1280:1978 -w 1536 -h 2008 $SPLASH # 1,31
inkscape -b ffffff00 -z -e ios/Default-Portrait~ipad.png  --export-area=0:301:1280:1978 -w 768 -h 1004 $SPLASH # 1,31
inkscape -b ffffff00 -z -e ios/Default@2x~iphone.png  --export-area=0:180:1280:2100 -w 640 -h 960 $SPLASH # 1:1,5
inkscape -b ffffff00 -z -e ios/Default~iphone.png  --export-area=0:180:1280:2100 -w 320 -h 480 $SPLASH # 1:1,5
