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

# This is a list of all the features from Configure script.
# There are some that are disabled by default and some that are cascading from other things
#     "acvp-tests", casc fips
#    "afalgeng", maybe needed?
#    "apps", maybe needed?
#    "argon2", new
#    "aria", new
#    "asan", def
#    "asm", needed
#    "async", maybe needed?
#    "atexit", maybe needed?
#    "autoalginit", maybe needed?
#    "autoerrinit", maybe needed?
#    "autoload-config", maybe needed?
#    "bf", old
#    "blake2", new
#    "brotli", def
#    "brotli-dynamic", def
#    "buildtest-c++", def
#    "bulk", big switch
#    "cached-fetch", needed
#    "camellia", old
#    "capieng", def for non-win
#    "winstore", new
#    "cast", old
#    "chacha", new
#    "cmac", new
#    "cmp", new
#    "cms", new, some s/mime stuff
#    "comp", new
#    "crypto-mdebug", def
#    "ct", new, cert transparency
#    "default-thread-pool", maybe needed?
#    "demos", def
#    "h3demo", def
#    "hqinterop", def
#    "deprecated", new
#    "des", new
#    "devcryptoeng", def
#    "dgram", new, casc sock
#    "dh", old
#    "docs", new
#    "dsa", old
#    "dso", new
#    "dtls", casc dgram
#    "dynamic-engine",
#    "ec", old
#"ec2m", casc ec
#    "ec_nistp_64_gcc_128", def
#    "ecdh", old, cash ec
#    "ecdsa", old, casc ec
#    "ecx", casc ec
#    "egd", def
#    "engine", old, casc deprecated-3.0
#    "err", needed
#    "external-tests", def
#    "filenames", needed
#    "fips", def
#    "fips-securitychecks", casc fips
#    "fips-post", csc fips
#    "fips-jitter", def
#    "fuzz-afl", def
#    "fuzz-libfuzzer", def
#    "gost", casc ec
#    "http", new
#    "idea", old
#    "integrity-only-ciphers", new, tls
#    "jitter", def
#    "ktls", def
#    "legacy", new
#    "loadereng", maybe needed?
#    "makedepend", maybe needed?
#    "md2", def
#    "md4", old
#    "mdc2", old
#    "ml-dsa", new
#    "ml-kem", new
#    "module", maybe needed?
#    "msan", def
#    "multiblock", maybe needed?
#    "nextprotoneg", new, tls
#    "ocb", new
#    "ocsp", new
#    "padlockeng", maybe needed?
#    "pic", needed
#    "pie", def
#    "pinshared", maybe needed?
#    "poly1305", new
#    "posix-io", maybe needed?
#    "psk", new
#    "quic", casc dgram
#    "unstable-qlog",
#    "rc2", old
#    "rc4", old
#    "rc5", def
#    "rdrand", maybe needed
#    "rfc3779", old
#    "rmd160", new
#    "scrypt",
#    "sctp", def, casc dgram
#"secure-memory", maybe needed?
#    "seed", old
#    "shared", maybe needed?
#    "siphash", new,
#    "siv", casc cmac
#    "slh-dsa", new
#    "sm2", casc sm3, casc ec
#    "sm2-precomp", new
#    "sm3", new
#    "sm4", new
#    "sock", old
#    "srp", old
#    "srtp", new
#    "sse2", needed,
#    "ssl", new
#    "ssl-trace", new
#    "static-engine", maybe needed
#    "stdio", maybe needed
#    "sslkeylog", def
#    "tests", new
#    "tfo", def, casc sock
#    "thread-pool", maybe needed?
#    "threads", maybe needed?
#    "tls", new
#    "tls-deprecated-ec", casc ec
#    "trace", def
#    "ts", new
#    "ubsan", def
#    "ui-console", new
#    "unit-test", def
#    "uplink", new
#    "weak-ssl-ciphers", def
#    "whirlpool", old
#    "zlib", def
#    "zlib-dynamic", def
#    "zstd", def
#    "zstd-dynamic", def

 OPENSSL_CONFIGURE_OPTIONS="-fPIC -fstack-protector-all no-idea no-camellia \
 no-seed no-bf no-cast no-rc2 no-rc4 no-rc5 no-md2 \
 no-md4 no-ecdh no-sock no-ssl3 \
 no-dsa no-dh no-ec no-ecdsa no-tls1 \
 no-rfc3779 no-whirlpool no-srp \
 no-mdc2 no-engine \
 no-srtp no-des no-comp no-sm3 no-cmac no-legacy \
 no-argon2 no-blake2 no-http no-zlib no-zstd no-deprecated no-ec \
 no-dgram no-sock no-tls no-cmp no-aria no-winstore \
 no-chacha no-cms no-ct no-docs no-dso no-http no-integrity-only-ciphers \
 no-ml-dsa no-ml-kem no-nextprotoneg no-ocb no-ocsp no-poly1305 no-psk \
 no-rmd160 no-scrypt no-siphash no-slh-dsa no-sm2-precomp no-sm4 no-ssl \
 no-ssl-trace no-tests no-ts no-ui-console no-uplink \
 -Wno-macro-redefined"

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
     # avoid building libssl
     # see https://github.com/openssl/openssl/issues/4597
     PATH=${TOOLCHAIN_BIN_PATH}:${PATH} \
         make build_generated libcrypto.a

     if [[ $? -ne 0 ]]; then
         echo "Error executing make for platform:${SQLCIPHER_TARGET_PLATFORM}"
         exit 1
     fi
     mkdir -p ${ANDROID_LIB_ROOT}/${SQLCIPHER_TARGET_PLATFORM}
     mv libcrypto.a ${ANDROID_LIB_ROOT}/${SQLCIPHER_TARGET_PLATFORM}
 done
)