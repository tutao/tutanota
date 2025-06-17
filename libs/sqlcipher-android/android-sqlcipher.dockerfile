FROM quay.io/toolbx-images/debian-toolbox@sha256:4ebacb09e266143c6394bc6e130495082407cf4511043de7458a27267dccf083
WORKDIR /

ENV ANDROID_NDK_VERSION="25.2.9519653"
ENV ANDROID_SQLCIPHER_OUTPUT_DIR=/build-sqlcipher/

RUN apt update && apt install -y curl openjdk-21-jdk-headless gcc tclsh make

RUN curl https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -o sdk-tools.zip && \
    unzip sdk-tools -d /android_sdk &&  \
    mkdir /tmp/cmdlinetools-latest && \
    mv /android_sdk/cmdline-tools/* /tmp/cmdlinetools-latest && \
    mv /tmp/cmdlinetools-latest /android_sdk/cmdline-tools/latest && \
    yes | /android_sdk/cmdline-tools/latest/bin/sdkmanager --licenses && \
    /android_sdk/cmdline-tools/latest/bin/sdkmanager "ndk;$ANDROID_NDK_VERSION" && \
    chmod 777 -R /android_sdk # needs to be writeable when downloading sdk/ndk later

ENV ANDROID_HOME=/android_sdk

COPY build-sqlcipher-android.sh build-sqlcipher-android.sh
COPY build-openssl-libraries.sh build-openssl-libraries.sh

# Do not override entrypoint as Jenkins plugin expects to run commands inside of it
# Running the container without any arguments will just run the script, otherwishe th   e user can run another command if
# passsed in.
CMD "/build-sqlcipher-android.sh"