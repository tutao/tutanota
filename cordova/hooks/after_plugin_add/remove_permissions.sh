#!/usr/bin/env bash
#
# Remove unused android permissions:
# android.permission.WRITE_EXTERNAL_STORAGE
# android.permission.WRITE_CONTACTS
# android.permission.GET_ACCOUNTS
#
# sed -i is not working on iOS
cat platforms/android/AndroidManifest.xml | sed 's/^.*WRITE_EXTERNAL_STORAGE.*$//g' | sed 's/^.*WRITE_CONTACTS.*$//g' | sed 's/^.*GET_ACCOUNTS.*$//g' > platforms/android/AndroidManifestNew.xml
mv platforms/android/AndroidManifestNew.xml platforms/android/AndroidManifest.xml
