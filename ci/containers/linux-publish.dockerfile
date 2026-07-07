FROM node:24.17-bullseye@sha256:33e8a4e2bde8dd8ac322c7c2310e524802e0f079c999bcea0a1695028c07354f
WORKDIR /
# this is only valid in dockerfiles, OCI compliant files don't support it.
# ie you have to run podman build --format docker
SHELL ["/bin/bash", "-c"]

# Install FPM to package desktop clients and deb packages. FPM needs ruby
RUN apt-get update && apt-get install -y ruby && gem install fpm:1.15.1
