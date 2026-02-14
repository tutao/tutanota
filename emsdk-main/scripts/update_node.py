#!/usr/bin/env python3
# Copyright 2020 The Emscripten Authors.  All rights reserved.
# Emscripten is available under two separate licenses, the MIT license and the
# University of Illinois/NCSA Open Source License.  Both these licenses can be
# found in the LICENSE file.

"""Updates the node binaries that we cache store at
http://storage.google.com/webassembly.

For the windows version we also alter the directory layout to add the 'bin'
directory.
"""

import os
import shutil
import subprocess
import sys
import urllib.request

from zip import unzip_cmd, zip_cmd

# When adjusting this version, visit
# https://github.com/nodejs/node/blob/v24.x/BUILDING.md#platform-list
# to verify minimum supported OS versions. Replace "v24.x" in the URL
# with the version field.
version = '24.7.0'
base = f'https://nodejs.org/dist/v{version}/'
upload_base = 'gs://webassembly/emscripten-releases-builds/deps/'

suffixes = [
    '-win-x64.zip',
    '-win-arm64.zip',
    '-darwin-x64.tar.gz',
    '-darwin-arm64.tar.gz',
    '-linux-x64.tar.xz',
    '-linux-arm64.tar.xz',
    '-linux-s390x.tar.gz',
]

for suffix in suffixes:
    filename = 'node-v%s%s' % (version, suffix)
    download_url = base + filename
    print('Downloading: ' + download_url)
    urllib.request.urlretrieve(download_url, filename)

    if '-win-' in suffix:
      subprocess.check_call(unzip_cmd() + [filename])
      dirname = os.path.splitext(os.path.basename(filename))[0]
      shutil.move(dirname, 'bin')
      os.mkdir(dirname)
      shutil.move('bin', dirname)
      os.remove(filename)
      subprocess.check_call(zip_cmd() + [filename, dirname])
      shutil.rmtree(dirname)

    if '--upload' in sys.argv:
      upload_url = upload_base + filename
      print('Uploading: ' + upload_url)
      cmd = ['gsutil', 'cp', '-n', filename, upload_url]
      print(' '.join(cmd))
      subprocess.check_call(cmd)
      os.remove(filename)
