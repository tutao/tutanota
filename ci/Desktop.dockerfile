FROM node:lts-bookworm
WORKDIR /
SHELL ["/bin/bash", "-c"]

# Install emscripten
RUN git clone https://github.com/emscripten-core/emsdk.git \
    && emsdk/emsdk install 3.1.59 \
    && emsdk/emsdk activate 3.1.59 \
    && source emsdk/emsdk_env.sh \
    && echo "PATH=\"$PATH:/emsdk/upstream/bin:/emsdk/upstream/emscripten\"" >> /etc/environment

# Install Rust
COPY download-rust.sh download-rust.sh
RUN ./download-rust.sh
