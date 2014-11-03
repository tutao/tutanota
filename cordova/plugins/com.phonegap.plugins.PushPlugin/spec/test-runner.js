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

if (window.sessionStorage != null) {
    window.sessionStorage.clear();
}

// Timeout is 2 seconds to allow physical devices enough
// time to query the response. This is important for some
// Android devices.
var Tests = function() {};
Tests.TEST_TIMEOUT = 7500;

// Creates a spy that will fail if called.
function createDoNotCallSpy(name, opt_extraMessage) {
    return jasmine.createSpy().andCallFake(function() {
        var errorMessage = name + ' should not have been called.';
        if (arguments.length) {
            errorMessage += ' Got args: ' + JSON.stringify(arguments);
        }
        if (opt_extraMessage) {
            errorMessage += '\n' + opt_extraMessage;
        }
        expect(false).toBe(true, errorMessage);
    });
}

// Waits for any of the given spys to be called.
// Last param may be a custom timeout duration.
function waitsForAny() {
    var spys = [].slice.call(arguments);
    var timeout = Tests.TEST_TIMEOUT;
    if (typeof spys[spys.length - 1] == 'number') {
        timeout = spys.pop();
    }
    waitsFor(function() {
        for (var i = 0; i < spys.length; ++i) {
            if (spys[i].wasCalled) {
                return true;
            }
        }
        return false;
    }, "Expecting callbacks to be called.", timeout);
}
