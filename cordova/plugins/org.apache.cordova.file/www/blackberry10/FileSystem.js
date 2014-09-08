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

/*
 * FileSystem
 * 
 * Translate temporary / persistent / root file paths
 */

var info = require("org.apache.cordova.file.bb10FileSystemInfo");

module.exports = {
    __format__: function(fullPath) {
        switch (this.name) {
            case 'temporary':
                path = info.temporaryPath + fullPath;
                break;
            case 'persistent':
                path = info.persistentPath + fullPath;
                break;
            case 'root':
                path = 'file://' + fullPath;
                break;
        }
        return window.encodeURI(path);
    }
};

