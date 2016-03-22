#!/usr/bin/env bash
#
# Deactivates the automatic Android 6 backup for Tutanota app data.
# Adds 'android:allowBackup="false"' to the "application" tag in AndroidManifest.xml if it is not yet existing.

grep -q "<application android:allowBackup" platforms/android/AndroidManifest.xml
if [[ $? -ne 0 ]]; then
cat platforms/android/AndroidManifest.xml | sed 's/<application/<application android:allowBackup="false"/g' > platforms/android/AndroidManifestNew.xml
mv platforms/android/AndroidManifestNew.xml platforms/android/AndroidManifest.xml
fi
