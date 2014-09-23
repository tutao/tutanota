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

module.exports = function (quantity) {
    var count = 0,
        beepObj,
        play = function () { 
            //create new object every time due to strage playback behaviour
            beepObj = new Audio('local:///chrome/plugin/org.apache.cordova.dialogs/notification-beep.wav');
            beepObj.addEventListener("ended", callback);
            beepObj.play();
        },
        callback = function () {
            if (--count > 0) {
                play();
            } else {
                delete beepObj;
            }
        };
    count += quantity || 1;
    if (count > 0) {
        play();
    }
};
