#!/bin/bash
# SPDX-FileCopyrightText: 2025 Nextcloud GmbH and Nextcloud contributors
# SPDX-License-Identifier: AGPL-3.0-or-later

set -e

# Only create a config file if HP_SHARED_KEY is set.
if [ -n "$HP_SHARED_KEY" ]; then
    echo "HP_SHARED_KEY is set, creating /frpc.toml configuration file..."
    if [ -d "/certs/frp" ]; then
        echo "Found /certs/frp directory. Creating configuration with TLS certificates."
        cat <<EOF > /frpc.toml
serverAddr = "$HP_FRP_ADDRESS"
serverPort = $HP_FRP_PORT
loginFailExit = false

transport.tls.enable = true
transport.tls.certFile = "/certs/frp/client.crt"
transport.tls.keyFile = "/certs/frp/client.key"
transport.tls.trustedCaFile = "/certs/frp/ca.crt"
transport.tls.serverName = "harp.nc"

metadatas.token = "$HP_SHARED_KEY"

[[proxies]]
remotePort = $APP_PORT
type = "tcp"
name = "$APP_ID"
[proxies.plugin]
type = "unix_domain_socket"
unixPath = "/tmp/exapp.sock"
EOF
    else
        echo "Directory /certs/frp not found. Creating configuration without TLS certificates."
        cat <<EOF > /frpc.toml
serverAddr = "$HP_FRP_ADDRESS"
serverPort = $HP_FRP_PORT
loginFailExit = false

transport.tls.enable = false

metadatas.token = "$HP_SHARED_KEY"

[[proxies]]
remotePort = $APP_PORT
type = "tcp"
name = "$APP_ID"
[proxies.plugin]
type = "unix_domain_socket"
unixPath = "/tmp/exapp.sock"
EOF
    fi
else
    echo "HP_SHARED_KEY is not set. Skipping FRP configuration."
fi

# If we have a configuration file and the shared key is present, start the FRP client
if [ -f /frpc.toml ] && [ -n "$HP_SHARED_KEY" ]; then
    echo "Starting frpc in the background..."
    frpc -c /frpc.toml &
fi

# Start the main application (launch cmd for ExApp is an argument for this script)
echo "Starting application: $@"
exec "$@"
