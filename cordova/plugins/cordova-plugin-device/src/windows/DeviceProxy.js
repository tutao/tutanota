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

/* global Windows, createUUID */

var ROOT_CONTAINER = "{00000000-0000-0000-FFFF-FFFFFFFFFFFF}";
var DEVICE_CLASS_KEY = "{A45C254E-DF1C-4EFD-8020-67D146A850E0},10";
var DEVICE_CLASS_KEY_NO_SEMICOLON = "{A45C254E-DF1C-4EFD-8020-67D146A850E0}10";
var ROOT_CONTAINER_QUERY = "System.Devices.ContainerId:=\"" + ROOT_CONTAINER + "\"";
var HAL_DEVICE_CLASS = "4d36e966-e325-11ce-bfc1-08002be10318";
var DEVICE_DRIVER_VERSION_KEY = "{A8B865DD-2E3D-4094-AD97-E593A70C75D6},3";

module.exports = {

    getDeviceInfo:function(win, fail, args) {

        // deviceId aka uuid, stored in Windows.Storage.ApplicationData.current.localSettings.values.deviceId
        var deviceId;
        // get deviceId, or create and store one
        var localSettings = Windows.Storage.ApplicationData.current.localSettings;
        if (localSettings.values.deviceId) {
            deviceId = localSettings.values.deviceId;
        }
        else {
            // App-specific hardware id could be used as uuid, but it changes if the hardware changes...
            try {
                var ASHWID = Windows.System.Profile.HardwareIdentification.getPackageSpecificToken(null).id;
                deviceId = Windows.Storage.Streams.DataReader.fromBuffer(ASHWID).readGuid();
            } catch (e) {
                // Couldn't get the hardware UUID
                deviceId = createUUID();
            }
            //...so cache it per-install
            localSettings.values.deviceId = deviceId;
        }


        var userAgent = window.clientInformation.userAgent;
        // this will report "windows" in windows8.1 and windows phone 8.1 apps
        // and "windows8" in windows 8.0 apps similar to cordova.js
        // See https://github.com/apache/cordova-js/blob/master/src/windows/platform.js#L25
        var devicePlatform = userAgent.indexOf("MSAppHost/1.0") == -1 ? "windows" : "windows8";
        var versionString = userAgent.match(/Windows (?:Phone |NT )?([0-9.]+)/)[1];

        var deviceInfo = new Windows.Security.ExchangeActiveSyncProvisioning.EasClientDeviceInformation();
        // Running in the Windows Simulator is a remote session.
        // Running in the Windows Phone Emulator has the systemProductName set to "Virtual"
        var isVirtual = Windows.System.RemoteDesktop.InteractiveSession.isRemote || deviceInfo.systemProductName == "Virtual";
        var manufacturer = deviceInfo.systemManufacturer;
        var model = deviceInfo.systemProductName;

        var Pnp = Windows.Devices.Enumeration.Pnp;

        Pnp.PnpObject.findAllAsync(Pnp.PnpObjectType.device,
                                [DEVICE_DRIVER_VERSION_KEY, DEVICE_CLASS_KEY],
                                ROOT_CONTAINER_QUERY)
        .then(function (rootDevices) {
                for (var i = 0; i < rootDevices.length; i++) {
                    var rootDevice = rootDevices[i];
                    if (!rootDevice.properties) continue;
                    if (rootDevice.properties[DEVICE_CLASS_KEY_NO_SEMICOLON] == HAL_DEVICE_CLASS) {
                        versionString = rootDevice.properties[DEVICE_DRIVER_VERSION_KEY];
                        break;
                    }
                }

                setTimeout(function () {
                    win({ platform: devicePlatform,
                          version: versionString,
                          uuid: deviceId,
                          isVirtual: isVirtual,
                          model: model,
                          manufacturer:manufacturer});
                }, 0);
        });
    }

}; // exports

require("cordova/exec/proxy").add("Device", module.exports);
