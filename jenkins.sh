#!/bin/bash

export PATH=$PATH:/opt/node-v10.11.0-linux-x64/bin/
npm prune
npm install

if [ "$RELEASE" == "true" ]; then
  echo "Starting the release build"
  node dist deb release
else
  node dist prod
fi