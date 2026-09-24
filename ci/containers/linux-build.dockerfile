FROM node:24.21-bookworm@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4
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
