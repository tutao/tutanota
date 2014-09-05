#!/bin/bash

#
# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
# 
# http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#  KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
#

#
# Returns the VERSION of CordovaLib used. 
# Note: it does not work if the --shared option was used to create the project.
#

set -e

CORDOVA_PATH=$( cd "$( dirname "$0" )" && pwd -P)
PROJECT_PATH="$(dirname "$CORDOVA_PATH")"

VERSION_FILE_PATH="$PROJECT_PATH/CordovaLib/VERSION"
VERSION=$(<"$VERSION_FILE_PATH")

if [ -f "$VERSION_FILE_PATH" ]; then
  echo $VERSION 
else
  echo "The file \"$VERSION_FILE_PATH\" does not exist."
  exit 1
fi