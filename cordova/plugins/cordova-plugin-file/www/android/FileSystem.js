/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

FILESYSTEM_PROTOCOL = "cdvfile";

module.exports = {
    __format__: function(fullPath, nativeUrl) {
        var path;
        var contentUrlMatch = /^content:\/\//.exec(nativeUrl);
        if (contentUrlMatch) {
            // When available, use the path from a native content URL, which was already encoded by Android.
            // This is necessary because JavaScript's encodeURI() does not encode as many characters as
            // Android, which can result in permission exceptions when the encoding of a content URI
            // doesn't match the string for which permission was originally granted.
            path = nativeUrl.substring(contentUrlMatch[0].length - 1);
        } else {
            path = FileSystem.encodeURIPath(fullPath);
            if (!/^\//.test(path)) {
                path = '/' + path;
            }
            
            var m = /\?.*/.exec(nativeUrl);
            if (m) {
                path += m[0];
            }
        }

        return FILESYSTEM_PROTOCOL + '://localhost/' + this.name + path;
    }
};

