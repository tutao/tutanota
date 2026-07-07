FROM node:24.17-bullseye@sha256:33e8a4e2bde8dd8ac322c7c2310e524802e0f079c999bcea0a1695028c07354f
WORKDIR /
# this is only valid in dockerfiles, OCI compliant files don't support it.
# ie you have to run podman build --format docker
SHELL ["/bin/bash", "-c"]

# Install pkcs11-tool from OpenSC to sign desktop clients and deb packages
# Note: `osslsigncode` is used on Windows as well
RUN apt-get update && apt-get install -y opensc usbutils pcsc-tools osslsigncode libengine-pkcs11-openssl

# Install graphiz to make the bundles graph
RUN apt-get install -y graphviz

# install WASM tools
COPY "./tuta-wasm-tools.deb" "tuta-wasm-tools.deb"
RUN dpkg -i tuta-wasm-tools.deb

# Install Rust to build the Tuta SDK
COPY download-rust.sh download-rust.sh
RUN ./download-rust.sh
