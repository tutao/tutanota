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
//example UA String for Firefox OS 
//Mozilla/5.0 (Mobile; rv:26.0) Gecko/26.0 Firefox/26.0

//UA parsing not recommended but currently this is the only way to get the Firefox OS version
//https://developer.mozilla.org/en-US/docs/Gecko_user_agent_string_reference

//Should be replaced when better conversion to Firefox OS Version is available
function convertVersionNumber(ver) {
    var hashVersion = {
        '18.0': '1.0.1',
        '18.1': '1.1',
        '26.0': '1.2',
        '28.0': '1.3',
        '30.0': '1.4',
        '32.0': '2.0'
    };
    var rver = ver;
    var sStr = ver.substring(0, 4);
    if (hashVersion[sStr]) {
        rver = hashVersion[sStr];
    }
    return (rver);

}
function getVersion() {
    if (navigator.userAgent.match(/(mobile|tablet)/i)) {
        var ffVersionArray = (navigator.userAgent.match(/Firefox\/([\d]+\.[\w]?\.?[\w]+)/));
        if (ffVersionArray.length === 2) {
            return (convertVersionNumber(ffVersionArray[1]));
        }
    }
    return (null);
}

function getModel() {
    var uaArray = navigator.userAgent.split(/\s*[;)(]\s*/);
    if (navigator.userAgent.match(/(mobile|tablet)/i)) {
        if (uaArray.length === 5) {
            return (uaArray[2]);
        }
    }
    return (null);
}
module.exports = {
    getDeviceInfo: function (success, error) {
        setTimeout(function () {
            success({
                platform: 'firefoxos',
                model: getModel(),
                version: getVersion(),
                uuid: null
            });
        }, 0);
    }
};

require("cordova/exec/proxy").add("Device", module.exports);
