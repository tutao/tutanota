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


var cordova = require('cordova');
var utils = require('cordova/utils');

module.exports = {

    getDeviceInfo:function(win,fail,args) {

        // deviceId aka uuid, stored in Windows.Storage.ApplicationData.current.localSettings.values.deviceId
        var deviceId;

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
    	
    	var versionString = window.clientInformation.userAgent.match(/Windows NT ([0-9.]+)/)[1];
    	
    	(function(self){
    		var ROOT_CONTAINER = "{00000000-0000-0000-FFFF-FFFFFFFFFFFF}";
    		var DEVICE_CLASS_KEY = "{A45C254E-DF1C-4EFD-8020-67D146A850E0},10";
    		var DEVICE_CLASS_KEY_NO_SEMICOLON = '{A45C254E-DF1C-4EFD-8020-67D146A850E0}10';
    		var ROOT_CONTAINER_QUERY = "System.Devices.ContainerId:=\"" + ROOT_CONTAINER + "\"";
    		var HAL_DEVICE_CLASS = "4d36e966-e325-11ce-bfc1-08002be10318";
    		var DEVICE_DRIVER_VERSION_KEY = "{A8B865DD-2E3D-4094-AD97-E593A70C75D6},3";
    		var pnpObject = Windows.Devices.Enumeration.Pnp.PnpObject;
    		pnpObject.findAllAsync(Windows.Devices.Enumeration.Pnp.PnpObjectType.device, [DEVICE_DRIVER_VERSION_KEY, DEVICE_CLASS_KEY], ROOT_CONTAINER_QUERY).then(function(rootDevices) {
    
    			for (var i = 0; i < rootDevices.length; i++) {
    				var rootDevice = rootDevices[i];
    				if (!rootDevice.properties) continue;
    				if (rootDevice.properties[DEVICE_CLASS_KEY_NO_SEMICOLON] == HAL_DEVICE_CLASS) {
    					versionString = rootDevice.properties[DEVICE_DRIVER_VERSION_KEY];
    					break;
    				}
    			}

                setTimeout(function () {
                    win({ platform: "windows8", version: versionString, uuid: deviceId, model: window.clientInformation.platform });
                }, 0);
    		});
    	})(this);
    }

};

require("cordova/exec/proxy").add("Device", module.exports);

