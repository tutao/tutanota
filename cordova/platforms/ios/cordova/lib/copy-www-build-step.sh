#!/bin/sh
#
#    Licensed to the Apache Software Foundation (ASF) under one
#    or more contributor license agreements.  See the NOTICE file
#    distributed with this work for additional information
#    regarding copyright ownership.  The ASF licenses this file
#    to you under the Apache License, Version 2.0 (the
#    "License"); you may not use this file except in compliance
#    with the License.  You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
#    Unless required by applicable law or agreed to in writing,
#    software distributed under the License is distributed on an
#    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
#    KIND, either express or implied.  See the License for the
#    specific language governing permissions and limitations
#    under the License.
#
#
#   This script copies the www directory into the Xcode project.
#
#   This script should not be called directly.
#   It is called as a build step from Xcode.

SRC_DIR="www/"
DST_DIR="$BUILT_PRODUCTS_DIR/$FULL_PRODUCT_NAME/www"
COPY_HIDDEN=
ORIG_IFS=$IFS
IFS=$(echo -en "\n\b")

if [[ -z "$BUILT_PRODUCTS_DIR" ]]; then
  echo "The script is meant to be run as an Xcode build step and relies on env variables set by Xcode."
  exit 1
fi
if [[ ! -e "$SRC_DIR" ]]; then
  echo "Path does not exist: $SRC_DIR"
  exit 1
fi

# Use full path to find to avoid conflict with macports find (CB-6383).
if [[ -n $COPY_HIDDEN ]]; then
  alias do_find='/usr/bin/find "$SRC_DIR"'
else
  alias do_find='/usr/bin/find -L "$SRC_DIR" -name ".*" -prune -o'
fi

time (
# Code signing files must be removed or else there are
# resource signing errors.
rm -rf "$DST_DIR" \
       "$BUILT_PRODUCTS_DIR/$FULL_PRODUCT_NAME/_CodeSignature" \
       "$BUILT_PRODUCTS_DIR/$FULL_PRODUCT_NAME/PkgInfo" \
       "$BUILT_PRODUCTS_DIR/$FULL_PRODUCT_NAME/embedded.mobileprovision"

# Directories
for p in $(do_find -type d -print); do
  subpath="${p#$SRC_DIR}"
  mkdir "$DST_DIR$subpath" || exit 1
done

# Symlinks
for p in $(do_find -type l -print); do
  subpath="${p#$SRC_DIR}"
  source=$(readlink $SRC_DIR$subpath)
  sourcetype=$(stat -f "%HT%SY" $source)
  if [ "$sourcetype" = "Directory" ]; then
    mkdir "$DST_DIR$subpath" || exit 2
  else
    rsync -a "$source" "$DST_DIR$subpath" || exit 3
  fi
done

# Files
for p in $(do_find -type f -print); do
  subpath="${p#$SRC_DIR}"
  if ! ln "$SRC_DIR$subpath" "$DST_DIR$subpath" 2>/dev/null; then
    rsync -a "$SRC_DIR$subpath" "$DST_DIR$subpath" || exit 4
  fi
done

# Copy the config.xml file.
cp -f "${PROJECT_FILE_PATH%.xcodeproj}/config.xml" "$BUILT_PRODUCTS_DIR/$FULL_PRODUCT_NAME"

)
IFS=$ORIG_IFS

