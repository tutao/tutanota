#!/usr/bin/env bash
#
# Remove unused android permissions:
# android.permission.WRITE_EXTERNAL_STORAGE
# android.permission.WRITE_CONTACTS
# android.permission.GET_ACCOUNTS
#
# sed -i is not working on iOS
cp graphics/app/android/icon-transparent-36-ldpi.png platforms/android/res/drawable-ldpi/transparent.png
cp graphics/app/android/icon-transparent-48-mdpi.png platforms/android/res/drawable-mdpi/transparent.png
cp graphics/app/android/icon-transparent-72-hdpi.png platforms/android/res/drawable-hdpi/transparent.png
cp graphics/app/android/icon-transparent-96-xhdpi.png platforms/android/res/drawable-xhdpi/transparent.png
