cmake_minimum_required(VERSION 3.18.0)
project("tutashared"
        LANGUAGES C CXX
)

set(TUTAMAIL_PROJECT_DIR "${CMAKE_SOURCE_DIR}/../../../../../")
set(WEBASSEMBLY_LIBS_DIR "${TUTAMAIL_PROJECT_DIR}/libs/webassembly")
set(ARGON2_DIR "${WEBASSEMBLY_LIBS_DIR}/phc-winner-argon2")
set(LIBOQS_DIR "${WEBASSEMBLY_LIBS_DIR}/liboqs")
set(C_LIBS_INCLUDE_DIR "${WEBASSEMBLY_LIBS_DIR}/include")

add_custom_target(liboqs_include make -f Makefile_liboqs include
        WORKING_DIRECTORY "${WEBASSEMBLY_LIBS_DIR}"
)

add_library(tutashared SHARED
        argon2.cpp
        liboqs.cpp
        helpers/byte_array_accessor.cpp
        "${ARGON2_DIR}/src/argon2.c"
        "${ARGON2_DIR}/src/core.c"
        "${ARGON2_DIR}/src/encoding.c"
        "${ARGON2_DIR}/src/ref.c"
        "${ARGON2_DIR}/src/thread.c"
        "${ARGON2_DIR}/src/blake2/blake2b.c"
        "${LIBOQS_DIR}/src/kem/kem.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/kem.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/verify.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/indcpa.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/symmetric-shake.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/poly.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/polyvec.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/cbd.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/ntt.c"
        "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref/reduce.c"
        "${LIBOQS_DIR}/src/kem/kyber/kem_kyber_1024.c"
        "${LIBOQS_DIR}/src/common/pqclean_shims/fips202.c"
        "${LIBOQS_DIR}/src/common/sha3/xkcp_sha3.c"
        "${LIBOQS_DIR}/src/common/sha3/xkcp_low/KeccakP-1600/plain-64bits/KeccakP-1600-opt64.c"
        "${LIBOQS_DIR}/src/common/common.c"
        "${TUTAMAIL_PROJECT_DIR}/packages/tutanota-crypto/lib/encryption/Liboqs/rand.c"
)

add_dependencies(tutashared liboqs_include)

target_compile_definitions(tutashared
        PRIVATE OQS_ENABLE_KEM_kyber_1024=1
        PRIVATE OQS_VERSION_TEXT=\"tutakyber\"
        PRIVATE OQS_ENABLE_KEM_kyber_1024=1
        PRIVATE OQS_ENABLE_KEM_KYBER=1
        PRIVATE OQS_DIST_BUILD=1
        PRIVATE KYBER_K=4
)

target_include_directories(tutashared
        PRIVATE "${ARGON2_DIR}/include"
        PRIVATE "${LIBOQS_DIR}/src/kem/kyber/pqcrystals-kyber_kyber1024_ref"
        PRIVATE "${LIBOQS_DIR}/src/common/pqclean_shims"
        PRIVATE "${C_LIBS_INCLUDE_DIR}"
)

target_compile_options(tutashared PRIVATE "-O3")

set_property(TARGET tutashared PROPERTY CXX_STANDARD 17)
set_property(TARGET tutashared PROPERTY C_STANDARD 11)