#!/usr/bin/env bash
#
# Remove unused android permission android.permission.ACCESS_WIFI_STATE
# 
# sed -i is not working on iOS
cat platforms/android/AndroidManifest.xml | sed 's/^.*ACCESS_WIFI_STATE.*$//g' > platforms/android/AndroidManifestNew.xml
mv platforms/android/AndroidManifestNew.xml platforms/android/AndroidManifest.xml
