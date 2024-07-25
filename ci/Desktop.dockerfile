FROM node:lts-bullseye
WORKDIR /
SHELL ["/bin/bash", "-c"]

# Install emscripten
RUN git clone https://github.com/emscripten-core/emsdk.git \
    && emsdk/emsdk install 3.1.59 \
    && emsdk/emsdk activate 3.1.59 \
    && source emsdk/emsdk_env.sh

# Install Rust
COPY download-rust.sh download-rust.sh
RUN ./download-rust.sh
