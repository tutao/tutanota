## tuta-wasm-loader

A plugin to automatically generate WASM files during the build process and generate their respective fallbacks in
JavaScript together with a loader that verifies and automatically loads the WASM file or the fallback if the platform
doesn't support WebAssembly.