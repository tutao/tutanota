#! /usr/bin/env bash
# Taken from https://github.com/sqlcipher/android-database-sqlcipher/blob/b3df67d8731bd0ebd987acb561a2c3fdd8e17082/android-database-sqlcipher/build-openssl-libraries.sh

MINIMUM_ANDROID_SDK_VERSION=$1
MINIMUM_ANDROID_64_BIT_SDK_VERSION=$2
OPENSSL_DIR=$3
ANDROID_LIB_ROOT=$4

(cd ${OPENSSL_DIR};

 if [[ ! ${MINIMUM_ANDROID_SDK_VERSION} ]]; then
     echo "MINIMUM_ANDROID_SDK_VERSION was not provided, include and rerun"
     exit 1
 fi

 if [[ ! ${MINIMUM_ANDROID_64_BIT_SDK_VERSION} ]]; then
     echo "MINIMUM_ANDROID_64_BIT_SDK_VERSION was not provided, include and rerun"
     exit 1
 fi

 if [[ ! ${ANDROID_NDK_HOME} ]]; then
     echo "ANDROID_NDK_HOME environment variable not set, set and rerun"
     exit 1
 fi

 HOST_INFO=`uname -a`
 case ${HOST_INFO} in
     Darwin*)
         TOOLCHAIN_SYSTEM=darwin-x86_64
         ;;
     Linux*)
         if [[ "${HOST_INFO}" == *i686* ]]
         then
             TOOLCHAIN_SYSTEM=linux-x86
         else
             TOOLCHAIN_SYSTEM=linux-x86_64
         fi
         ;;
     *)
         echo "Toolchain unknown for host system"
         exit 1
         ;;
 esac

 NDK_TOOLCHAIN_VERSION=4.9
 OPENSSL_CONFIGURE_OPTIONS="-fPIC -fstack-protector-all no-idea no-camellia \
 no-seed no-bf no-cast no-rc2 no-rc4 no-rc5 no-md2 \
 no-md4 no-ecdh no-sock no-ssl3 \
 no-dsa no-dh no-ec no-ecdsa no-tls1 \
 no-rfc3779 no-whirlpool no-srp \
 no-mdc2 no-ecdh no-engine \
 no-srtp"

 rm -rf ${ANDROID_LIB_ROOT}

 for SQLCIPHER_TARGET_PLATFORM in armeabi-v7a x86 x86_64 arm64-v8a
 do
     echo "Building libcrypto.a for ${SQLCIPHER_TARGET_PLATFORM}"
     case "${SQLCIPHER_TARGET_PLATFORM}" in
         armeabi-v7a)
             CONFIGURE_ARCH="android-arm -march=armv7-a"
             ANDROID_API_VERSION=${MINIMUM_ANDROID_SDK_VERSION}
             OFFSET_BITS=32
             ;;
         x86)
             CONFIGURE_ARCH=android-x86
             ANDROID_API_VERSION=${MINIMUM_ANDROID_SDK_VERSION}
             OFFSET_BITS=32
             ;;
         x86_64)
             CONFIGURE_ARCH=android64-x86_64
             ANDROID_API_VERSION=${MINIMUM_ANDROID_64_BIT_SDK_VERSION}
             OFFSET_BITS=64
             ;;
         arm64-v8a)
             CONFIGURE_ARCH=android-arm64
             ANDROID_API_VERSION=${MINIMUM_ANDROID_64_BIT_SDK_VERSION}
             OFFSET_BITS=64
             ;;
         *)
             echo "Unsupported build platform:${SQLCIPHER_TARGET_PLATFORM}"
             exit 1
     esac
     TOOLCHAIN_BIN_PATH=${ANDROID_NDK_HOME}/toolchains/llvm/prebuilt/${TOOLCHAIN_SYSTEM}/bin
     PATH=${TOOLCHAIN_BIN_PATH}:${PATH} \
     ./Configure ${CONFIGURE_ARCH} \
                 -D__ANDROID_API__=${ANDROID_API_VERSION} \
                 -D_FILE_OFFSET_BITS=${OFFSET_BITS} \
                 ${OPENSSL_CONFIGURE_OPTIONS}

     if [[ $? -ne 0 ]]; then
         echo "Error executing:./Configure ${CONFIGURE_ARCH} ${OPENSSL_CONFIGURE_OPTIONS}"
         exit 1
     fi

     make clean
     PATH=${TOOLCHAIN_BIN_PATH}:${PATH} \
         make build_libs

     if [[ $? -ne 0 ]]; then
         echo "Error executing make for platform:${SQLCIPHER_TARGET_PLATFORM}"
         exit 1
     fi
     mkdir -p ${ANDROID_LIB_ROOT}/${SQLCIPHER_TARGET_PLATFORM}
     mv libcrypto.a ${ANDROID_LIB_ROOT}/${SQLCIPHER_TARGET_PLATFORM}
 done
)