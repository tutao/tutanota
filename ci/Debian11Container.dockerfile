FROM node:lts-bullseye
WORKDIR /
SHELL ["/bin/bash", "-c"]

# Install emscripten
RUN git clone https://github.com/emscripten-core/emsdk.git \
    && emsdk/emsdk install 3.1.59 \
    && emsdk/emsdk activate 3.1.59 \
    && source emsdk/emsdk_env.sh
ENV PATH="$PATH:/emsdk/upstream/bin:/emsdk/upstream/emscripten"

# Install FPM
RUN apt-get update && apt-get install -y ruby && gem install fpm:1.15.1

# Install pkcs11-tool from OpenSC
RUN apt-get install -y opensc


# Install Rust
COPY download-rust.sh download-rust.sh
RUN ./download-rust.sh
