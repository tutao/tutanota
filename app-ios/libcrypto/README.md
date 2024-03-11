# Libcrypto setup for Tuta

This directory contains everything needed to compile libcrypto for Tuta.

We use a free toolset for this: https://github.com/x2on/OpenSSL-for-iPhone.git

You will need to make sure OpenSSL-for-iPhone is cloned. A submodule is set up in Git for a known working commit, so you need only initialize it with `git submodule init`.

Then, to compile libcrypto, simply build the iOS app (there is a build target already set up). You can also manually invoke the build script with `./build_libcrypto.sh` to build and `./build_libcrypto.sh clean` to clean (required for rebuilding).

Upon being built, the `lib` folder will then be created and populated with `libcrypto.a` (iOS, arm64 only) and `libcrypto-sim.a` (iOS simulator, arm64 for Apple Silicon Mac and x86_64 for older Macs that are still using x86-based CPUs).
