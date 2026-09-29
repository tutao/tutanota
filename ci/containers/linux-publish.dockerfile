FROM node:24.21-bookworm@sha256:64af3819f9275802414d7cdc38c27e9d82bd564dec4d4da87d008255d36c63b4
WORKDIR /
# this is only valid in dockerfiles, OCI compliant files don't support it.
# ie you have to run podman build --format docker
SHELL ["/bin/bash", "-c"]

# Install FPM to package desktop clients and deb packages. FPM needs ruby
RUN apt-get update && apt-get install -y ruby && gem install fpm:1.15.1
