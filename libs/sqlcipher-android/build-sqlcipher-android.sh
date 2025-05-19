#!/usr/bin/env bash

set -exu

# clone OpenSSL, needed as part of the build of both old and new sqlcipher
git clone https://github.com/openssl/openssl
pushd openssl
git checkout openssl-3.5.0
popd

# Clone the main SQLCipher repo
git clone https://github.com/sqlcipher/sqlcipher
pushd sqlcipher
git checkout v$SQLCIPHER_VERSION
popd

export ANDROID_NDK_HOME=$ANDROID_HOME/ndk/$ANDROID_NDK_VERSION
export ANDROID_NDK_ROOT=$ANDROID_HOME/ndk/$ANDROID_NDK_VERSION
export SQLCIPHER_CFLAGS="-DSQLITE_HAS_CODEC -DSQLITE_SOUNDEX -DHAVE_USLEEP=1 -DSQLITE_MAX_VARIABLE_NUMBER=99999 -DSQLITE_TEMP_STORE=3 -DSQLITE_THREADSAFE=1 -DSQLITE_DEFAULT_JOURNAL_SIZE_LIMIT=1048576 -DNDEBUG=1 -DSQLITE_ENABLE_MEMORY_MANAGEMENT=1 -DSQLITE_ENABLE_LOAD_EXTENSION -DSQLITE_ENABLE_COLUMN_METADATA -DSQLITE_ENABLE_UNLOCK_NOTIFY -DSQLITE_ENABLE_RTREE -DSQLITE_ENABLE_STAT3 -DSQLITE_ENABLE_STAT4 -DSQLITE_ENABLE_FTS5 -DSQLCIPHER_CRYPTO_OPENSSL -DSQLITE_ENABLE_DBSTAT_VTAB -DSQLITE_EXTRA_INIT=sqlcipher_extra_init -DSQLITE_EXTRA_SHUTDOWN=sqlcipher_extra_shutdown"

# Build OpenSSL
# This produces libcrypto.a
export SQLCIPHER_ROOT="$PWD/sqlcipher"
export OPENSSL_ROOT="$PWD/openssl"
export nativeRootOutputDir="$PWD/android-database-sqlcipher/android-database-sqlcipher/src/main"
export androidNativeRootDir="$PWD/${nativeRootOutputDir}/external/android-libs"
export minimumAndroidSdkVersion=21
export minimumAndroid64BitSdkVersion=21
bash ./build-openssl-libraries.sh "${minimumAndroidSdkVersion}" "${minimumAndroid64BitSdkVersion}" "${OPENSSL_ROOT}" "${androidNativeRootDir}"

# Build Amalgamation
# This produces sqlite.h and sqlite.c
pushd $SQLCIPHER_ROOT
CFLAGS=$SQLCIPHER_CFLAGS ./configure --with-tempstore=yes
CFLAGS=$SQLCIPHER_CFLAGS make sqlite3.c
mkdir -p $nativeRootOutputDir/cpp/
cp sqlite3.c sqlite3.h $nativeRootOutputDir/cpp/
popd

# Clone the new android-sqlcipher repo
git clone https://github.com/tutao/sqlcipher-android/
pushd sqlcipher-android
git checkout "v${SQLCIPHER_ANDROID_VERSION}-tutao"
popd

# opy the artifacts to the library
# https://github.com/signalapp/sqlcipher-android/blob/a3b6c0b46adf7520fbbb110cd12ac27a1101984d/build.sh#L10
# https://github.com/signalapp/sqlcipher-android/blob/a3b6c0b46adf7520fbbb110cd12ac27a1101984d/external-dependencies/README.md
cp $nativeRootOutputDir/cpp/sqlite3.c $nativeRootOutputDir/cpp/sqlite3.h sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/
cp -R $androidNativeRootDir sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/
cp -R $OPENSSL_ROOT/include/ sqlcipher-android/sqlcipher/src/main/jni/sqlcipher/android-libs/

# Build the library
pushd sqlcipher-android
make build-release
popd

# Move the output out of the container
mv sqlcipher-android/sqlcipher/build/outputs/aar/sqlcipher-android-$SQLCIPHER_ANDROID_VERSION-release.aar /build-sqlcipher/