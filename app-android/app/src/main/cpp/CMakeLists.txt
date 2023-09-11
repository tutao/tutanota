cmake_minimum_required(VERSION 3.22.1)
project("tutanota"
        LANGUAGES C CXX
        )

set(ARGON2_DIR "../../../../../libs/phc-winner-argon2")

add_library(tutanota SHARED
        tutanota.cpp
        "${ARGON2_DIR}/src/argon2.c"
        "${ARGON2_DIR}/src/core.c"
        "${ARGON2_DIR}/src/encoding.c"
        "${ARGON2_DIR}/src/ref.c"
        "${ARGON2_DIR}/src/thread.c"
        "${ARGON2_DIR}/src/blake2/blake2b.c"
        )

target_include_directories(tutanota PRIVATE "${ARGON2_DIR}/include")
target_compile_options(tutanota PRIVATE "-O3")

set_property(TARGET tutanota PROPERTY CXX_STANDARD 17)
set_property(TARGET tutanota PROPERTY C_STANDARD 11)