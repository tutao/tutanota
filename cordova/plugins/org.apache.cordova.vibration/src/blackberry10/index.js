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

var vibration;

module.exports = {
    vibrate: function (success, fail, args, env) {
        var result = new PluginResult(args, env),
            duration = args[0],
            response = vibration.getInstance().vibrate(duration);
        result.ok(response, false);
    }
};

///////////////////////////////////////////////////////////////////
// JavaScript wrapper for JNEXT plugin
///////////////////////////////////////////////////////////////////

JNEXT.Vibration = function () {
    var self = this,
        hasInstance = false;

    self.vibrate = function (duration) {
        //This is how Javascript calls into native
        return JNEXT.invoke(self.m_id, "vibrate " + duration);
    };

    self.init = function () {
        //Checks that the jnext library is present and loads it
        if (!JNEXT.require("libVibration")) {
            return false;
        }

        //Creates the native object that this interface will call
        self.m_id = JNEXT.createObject("libVibration.Vibration");

        if (self.m_id === "") {
            return false;
        }

        //Registers for the JNEXT event loop
        JNEXT.registerEvents(self);
    };

    self.m_id = "";

    //Used by JNEXT library to get the ID
    self.getId = function () {
        return self.m_id;
    };

    //Not truly required but useful for instance management
    self.getInstance = function () {
        if (!hasInstance) {
            self.init();
            hasInstance = true;
        }
        return self;
    };
};

vibration = new JNEXT.Vibration();
