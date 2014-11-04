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

describe('Plugin object (window.plugins)', function () {
	it("should exist", function() {
        expect(window.plugins).toBeDefined();
	});

	it("should contain a pushNotification object", function() {
        expect(window.plugins.pushNotification).toBeDefined();
		expect(typeof window.plugins.pushNotification == 'object').toBe(true);
	});

    it("should contain a register function", function() {
        expect(window.plugins.pushNotification.register).toBeDefined();
        expect(typeof window.plugins.pushNotification.register == 'function').toBe(true);
    });
    
    it("should contain an unregister function", function() {
        expect(window.plugins.pushNotification.unregister).toBeDefined();
        expect(typeof window.plugins.pushNotification.unregister == 'function').toBe(true);
    });
    
    it("should contain a setApplicationIconBadgeNumber function", function() {
        expect(window.plugins.pushNotification.setApplicationIconBadgeNumber).toBeDefined();
        expect(typeof window.plugins.pushNotification.setApplicationIconBadgeNumber == 'function').toBe(true);
    });
});
