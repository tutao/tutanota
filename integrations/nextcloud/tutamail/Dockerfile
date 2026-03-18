#############################
# Stage 1: Builder
#############################
FROM golang:latest AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies using a cache mount.
#COPY requirements.txt /
#RUN --mount=type=cache,target=/root/.cache/pip \
#    python3 -m pip install --root-user-action=ignore -r requirements.txt && rm requirements.txt

# Download and install FRP client with checksum verification
# FRP version and checksums - update these when upgrading
ARG FRP_VERSION=0.61.1
ARG FRP_AMD64_SHA256=bff260b68ca7b1461182a46c4f34e9709ba32764eed30a15dd94ac97f50a2c40
ARG FRP_ARM64_SHA256=af6366f2b43920ebfe6235dba6060770399ed1fb18601e5818552bd46a7621f8

RUN set -ex; \
    ARCH=$(uname -m); \
    if [ "$ARCH" = "aarch64" ]; then \
        FRP_ARCH="arm64"; \
        FRP_SHA256="${FRP_ARM64_SHA256}"; \
    else \
        FRP_ARCH="amd64"; \
        FRP_SHA256="${FRP_AMD64_SHA256}"; \
    fi; \
    FRP_URL="https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/frp_${FRP_VERSION}_linux_${FRP_ARCH}.tar.gz"; \
    echo "Downloading FRP v${FRP_VERSION} for ${FRP_ARCH}..."; \
    curl -fsSL "${FRP_URL}" -o /tmp/frp.tar.gz; \
    ACTUAL_SHA256=$(sha256sum /tmp/frp.tar.gz | cut -d' ' -f1); \
    if [ "$ACTUAL_SHA256" != "$FRP_SHA256" ]; then \
        echo "Checksum verification failed for FRP v${FRP_VERSION} (${FRP_ARCH})"; \
        echo "Expected: ${FRP_SHA256}"; \
        echo "Got:      ${ACTUAL_SHA256}"; \
        exit 1; \
    fi; \
    tar -C /tmp -xzf /tmp/frp.tar.gz; \
    cp /tmp/frp_${FRP_VERSION}_linux_${FRP_ARCH}/frpc /usr/local/bin/frpc; \
    chmod +x /usr/local/bin/frpc; \
    rm -rf /tmp/frp_${FRP_VERSION}_linux_${FRP_ARCH} /tmp/frp.tar.gz; \
    echo "FRP client installed successfully"


FROM golang:latest

COPY --from=builder /usr/local/ /usr/local/

RUN mkdir -p $GOPATH/app

COPY ex_app/ ${GOPATH}/app/
COPY --chmod=775 healthcheck.sh /
COPY start.sh /usr/bin

WORKDIR ${GOPATH}/app

ENTRYPOINT ["/usr/bin/start.sh","go", "run", "main.go", "--targetHost", "https://app.tuta.com"]

HEALTHCHECK --interval=2s --timeout=2s --retries=300 CMD /healthcheck.sh