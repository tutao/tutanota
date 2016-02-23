#
# (OS X, Unix and Linux)
#
# What is this?
#
# It's a shell script that is using inkscape to create all the icon files from one source icon.
#
# Stick the script in your 'www/res/icons' folder with your source icon 'my-hires-icon.png' then trigger it from Terminal.
#

ICON=tutanota-path.svg

mkdir android
inkscape -z -e android/icon-36-ldpi.png -w 36 -h 36 $ICON
inkscape -z -e android/icon-48-mdpi.png -w 48 -h 48 $ICON
inkscape -z -e android/icon-72-hdpi.png -w 72 -h 72 $ICON
inkscape -z -e android/icon-96-xhdpi.png -w 96 -h 96 $ICON

mkdir ios
inkscape -z -e ios/icon.png -w 57 -h 57 $ICON
inkscape -z -e ios/icon@2x.png -w 114 -h 114 $ICON
inkscape -z -e ios/icon-small.png -w 29 -h 29 $ICON
inkscape -z -e ios/icon-small@2x.png -w 58 -h 58 $ICON
inkscape -z -e ios/icon-small@3x.png -w 87 -h 87 $ICON
#inkscape -z -e ios/icon-29.png -w 29 -h 29 $ICON
inkscape -z -e ios/icon-40.png -w 40 -h 40 $ICON
inkscape -z -e ios/icon-40@2x.png -w 80 -h 80 $ICON
inkscape -z -e ios/icon-40@3x.png -w 120 -h 120 $ICON

inkscape -z -e ios/icon-50.png -w 50 -h 50 $ICON
inkscape -z -e ios/icon-50@2x.png -w 100 -h 100 $ICON
#inkscape -z -e ios/icon-57.png -w 57 -h 57 $ICON
#inkscape -z -e ios/icon-29-2x.png -w 58 -h 58 $ICON

inkscape -z -e ios/icon-60.png -w 60 -h 60 $ICON
inkscape -z -e ios/icon-60@2x.png -w 120 -h 120 $ICON
inkscape -z -e ios/icon-60@3x.png -w 180 -h 180 $ICON

inkscape -z -e ios/icon-72.png -w 72 -h 72 $ICON
inkscape -z -e ios/icon-72@2x.png -w 144 -h 144 $ICON
inkscape -z -e ios/icon-76.png -w 76 -h 76 $ICON
inkscape -z -e ios/icon-76@2x.png -w 152 -h 152 $ICON
inkscape -z -e ios/icon-83.5@2x.png -w 167 -h 167 $ICON

#inkscape -z -e ios/icon-57-2x.png -w 114 -h 114 $ICON

mkdir amazon
inkscape -z -e amazon/icon-114-114.png -w 114 -h 114 $ICON
inkscape -z -e amazon/icon-512-512.png -w 512 -h 512 $ICON

# Removing transparent background for itunesconnect image
#inkscape -b ffffff00 -z -e ios/icon-1024.png -w 1024 -h 1024 $ICON


