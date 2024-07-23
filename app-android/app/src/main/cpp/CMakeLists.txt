cmake_minimum_required(VERSION 3.18.0)
project("tutanota"
        LANGUAGES C CXX
)

set(TUTAMAIL_PROJECT_DIR "${CMAKE_SOURCE_DIR}/../../../../../")
set(WEBASSEMBLY_LIBS_DIR "${TUTAMAIL_PROJECT_DIR}/libs/webassembly")
set(ARGON2_DIR "${WEBASSEMBLY_LIBS_DIR}/phc-winner-argon2")
set(C_LIBS_INCLUDE_DIR "${WEBASSEMBLY_LIBS_DIR}/include")


add_library(tutanota SHARED
        argon2.cpp
        helpers/byte_array_accessor.cpp
        "${ARGON2_DIR}/src/argon2.c"
        "${ARGON2_DIR}/src/core.c"
        "${ARGON2_DIR}/src/encoding.c"
        "${ARGON2_DIR}/src/ref.c"
        "${ARGON2_DIR}/src/thread.c"
        "${ARGON2_DIR}/src/blake2/blake2b.c"
)

target_include_directories(tutanota
        PRIVATE "${ARGON2_DIR}/include"
        PRIVATE "${C_LIBS_INCLUDE_DIR}"
)

target_compile_options(tutanota PRIVATE "-O3")

set_property(TARGET tutanota PROPERTY CXX_STANDARD 17)
set_property(TARGET tutanota PROPERTY C_STANDARD 11)