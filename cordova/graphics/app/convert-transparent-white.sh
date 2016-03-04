#
# (OS X, Unix and Linux)
#
# What is this?
#
# It's a shell script that is using inkscape to create all the icon files from one source icon.
#
# Stick the script in your 'www/res/icons' folder with your source icon 'my-hires-icon.png' then trigger it from Terminal.
#

ICON=tutanota-path-transparent-white.svg

mkdir android
inkscape -z -e android/icon-transparent-36-ldpi.png -w 36 -h 36 $ICON
inkscape -z -e android/icon-transparent-48-mdpi.png -w 48 -h 48 $ICON
inkscape -z -e android/icon-transparent-72-hdpi.png -w 72 -h 72 $ICON
inkscape -z -e android/icon-transparent-96-xhdpi.png -w 96 -h 96 $ICON


