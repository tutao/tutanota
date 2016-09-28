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

/* global PluginResult */

function getModelName () {
    var modelName = window.qnx.webplatform.device.modelName;
    //Pre 10.2 (meaning Z10 or Q10)
    if (typeof modelName === "undefined") {
        if (window.screen.height === 720 && window.screen.width === 720) {
            if ( window.matchMedia("(-blackberry-display-technology: -blackberry-display-oled)").matches) {
                modelName = "Q10";
            } else {
                modelName = "Q5";
            }
        } else if ((window.screen.height === 1280 && window.screen.width === 768) ||
                   (window.screen.height === 768 && window.screen.width === 1280)) {
            modelName = "Z10";
        } else {
            modelName = window.qnx.webplatform.deviceName;
        }
    }

    return modelName;
}

function getUUID () {
    var uuid = "";
    try {
        //Must surround by try catch because this will throw if the app is missing permissions
        uuid = window.qnx.webplatform.device.devicePin;
    } catch (e) {
        //DO Nothing
    }
    return uuid;
}

module.exports = {
    getDeviceInfo: function (success, fail, args, env) {
        var result = new PluginResult(args, env),
            modelName = getModelName(),
            uuid = getUUID(),
            info = {
                manufacturer: 'BlackBerry',
                platform: "blackberry10",
                version: window.qnx.webplatform.device.scmBundle,
                model: modelName,
                uuid: uuid
            };

        result.ok(info);
    }
};
