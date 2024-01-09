# Building WebAssembly Dependencies

In this directory you will find our C library dependencies as submodules. The built objects are available as resources
on the main repo, but if you want to rebuild them anyway or build the mobile app, which needs header files, you will have
to clone them with

```
git submodule init # only the first time
git submodule update
```

To actually build the libraries, you will need the emscripten compiler.

For example, on Ubuntu:

```
sudo apt install emscripten
emcc --version
```

You can then choose which WASM library you want to build by calling the respective makefile like so:

```
make -f <makefile of target library>
```

The WASM binary will be output to `packages/tutanota-crypto/lib/.../<built library>`.