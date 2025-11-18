FROM node:22.16-bullseye@sha256:f16d8e8af67bb6361231e932b8b3e7afa040cbfed181719a450b02c3821b26c1
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
