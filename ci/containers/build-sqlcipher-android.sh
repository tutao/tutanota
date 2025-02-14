#!/usr/bin/env bash

# Can be run from the project root as
# mkdir build-sqlcipher
# podman build -t android-sqlcipher --network=host -f ci/containers/android-sqlcipher.dockerfile
# podman run --rm -e SQLCIPHER_ANDROID_VERSION=4.6.0 -v $(pwd):/workspace:ro -v build-sqlcipher:/build-sqlcipher -it android-sqlcipher
# This will produce the artifact at build-sqlcipher/sqlcipher-android-4.6.0-release.aar

set -exu

##export SQLCIPHER_ANDROID_VERSION="4.6.0"
#export ANDROID_NDK_VERSION="25.2.9519653"
#apt update
#apt install -y curl openjdk-17-jdk-headless gcc tclsh make
#
## Download SDK manager
#curl https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o sdk-tools.zip
#unzip sdk-tools -d /android_sdk
#
## Rearrange SDk manager so that it is usable.
## /android_sdk will be our sdk home. sdkmanager expects to be in
## android_sdk/cmdline-tools/latest
#mkdir /tmp/cmdlinetools-latest
#mv /android_sdk/cmdline-tools/* /tmp/cmdlinetools-latest
#mv /tmp/cmdlinetools-latest /android_sdk/cmdline-tools/latest
#yes | /android_sdk/cmdline-tools/latest/bin/sdkmanager --licenses
#/android_sdk/cmdline-tools/latest/bin/sdkmanager "ndk;$ANDROID_NDK_VERSION"
#
#export ANDROID_HOME=/android_sdk

# clone the old android sqlcipher repo to produce native artifacts
git clone https://github.com/sqlcipher/android-database-sqlcipher.git

# clone OpenSSL, needed as part of the build of both old and new sqlcipher
git clone https://github.com/openssl/openssl
pushd openssl
git checkout OpenSSL_1_1_1-stable
popd

# Clone the main SQLCipher repo
git clone https://github.com/sqlcipher/sqlcipher
pushd sqlcipher
git checkout v$SQLCIPHER_ANDROID_VERSION
popd

# Clone the new android-sqlcipher repo
git clone https://github.com/sqlcipher/sqlcipher-android/
pushd sqlcipher-android
git checkout v$SQLCIPHER_ANDROID_VERSION
popd

# build the old library to produce the artifacts we need for the new one
pushd android-database-sqlcipher
# NDK_HOME is explicitly checked here: https://github.com/sqlcipher/android-database-sqlcipher/blob/b3df67d8731bd0ebd987acb561a2c3fdd8e17082/android-database-sqlcipher/build-openssl-libraries.sh#L20C12-L20C28
# ndk-build is invoked here so we need to add it to PATH https://github.com/sqlcipher/android-database-sqlcipher/blob/b3df67d8731bd0ebd987acb561a2c3fdd8e17082/android-database-sqlcipher/native.gradle#L166
ANDROID_NDK_HOME=$ANDROID_HOME/ndk/$ANDROID_NDK_VERSION \
ANDROID_NDK_ROOT=$ANDROID_HOME/ndk/$ANDROID_NDK_VERSION \
PATH=$ANDROID_NDK_HOME:$PATH \
OPENSSL_ROOT=$PWD/../openssl \
SQLCIPHER_ROOT=$PWD/../sqlcipher \
SQLCIPHER_CFLAGS="-DSQLITE_HAS_CODEC -DSQLITE_SOUNDEX -DHAVE_USLEEP=1 -DSQLITE_MAX_VARIABLE_NUMBER=99999 -DSQLITE_TEMP_STORE=3 -DSQLITE_THREADSAFE=1 -DSQLITE_DEFAULT_JOURNAL_SIZE_LIMIT=1048576 -DNDEBUG=1 -DSQLITE_ENABLE_MEMORY_MANAGEMENT=1 -DSQLITE_ENABLE_LOAD_EXTENSION -DSQLITE_ENABLE_COLUMN_METADATA -DSQLITE_ENABLE_UNLOCK_NOTIFY -DSQLITE_ENABLE_RTREE -DSQLITE_ENABLE_STAT3 -DSQLITE_ENABLE_STAT4 -DSQLITE_ENABLE_JSON1 -DSQLITE_ENABLE_FTS3_PARENTHESIS -DSQLITE_ENABLE_FTS4 -DSQLITE_ENABLE_FTS5 -DSQLCIPHER_CRYPTO_OPENSSL -DSQLITE_ENABLE_DBSTAT_VTAB" \
make build-release
popd

# copy the artifacts to the new library
# https://github.com/signalapp/sqlcipher-android/blob/a3b6c0b46adf7520fbbb110cd12ac27a1101984d/build.sh#L10
# https://github.com/signalapp/sqlcipher-android/blob/a3b6c0b46adf7520fbbb110cd12ac27a1101984d/external-dependencies/README.md
cp android-database-sqlcipher/android-database-sqlcipher/src/main/cpp/sqlite3.c sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/
cp android-database-sqlcipher/android-database-sqlcipher/src/main/cpp/sqlite3.h sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/
cp -R android-database-sqlcipher/android-database-sqlcipher/src/main/external/android-libs/ sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/
cp -R openssl/include/ sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/android-libs/

# build the new library
pushd sqlcipher-android
./gradlew assembleRelease
popd

mv sqlcipher-android/sqlcipher/build/outputs/aar/sqlcipher-android-$SQLCIPHER_ANDROID_VERSION-release.aar /build-sqlcipher/