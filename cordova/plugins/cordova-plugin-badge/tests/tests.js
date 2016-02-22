/*
 * Copyright (c) 2013-2016 by appPlant UG. All rights reserved.
 *
 * @APPPLANT_LICENSE_HEADER_START@
 *
 * This file contains Original Code and/or Modifications of Original Code
 * as defined in and that are subject to the Apache License
 * Version 2.0 (the 'License'). You may not use this file except in
 * compliance with the License. Please obtain a copy of the License at
 * http://opensource.org/licenses/Apache-2.0/ and read it before using this
 * file.
 *
 * The Original Code and all software distributed under the License are
 * distributed on an 'AS IS' basis, WITHOUT WARRANTY OF ANY KIND, EITHER
 * EXPRESS OR IMPLIED, AND APPLE HEREBY DISCLAIMS ALL SUCH WARRANTIES,
 * INCLUDING WITHOUT LIMITATION, ANY WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE, QUIET ENJOYMENT OR NON-INFRINGEMENT.
 * Please see the License for the specific language governing rights and
 * limitations under the License.
 *
 * @APPPLANT_LICENSE_HEADER_END@
 */


exports.defineAutoTests = function() {

    describe('Badge Plugin (cordova.plugins.notification.badge)', function () {

        describe('Plugin availability', function () {

            it("should exist", function() {
                expect(cordova.plugins.notification.badge).toBeDefined();
            });

            it("should define clear", function() {
                expect(cordova.plugins.notification.badge.clear).toBeDefined();
            });

            it("should define get", function() {
                expect(cordova.plugins.notification.badge.get).toBeDefined();
            });

            it("should define set", function() {
                expect(cordova.plugins.notification.badge.set).toBeDefined();
            });

            it("should define increase", function() {
                expect(cordova.plugins.notification.badge.increase).toBeDefined();
            });

            it("should define decrease", function() {
                expect(cordova.plugins.notification.badge.decrease).toBeDefined();
            });

            it("should define hasPermission", function() {
                expect(cordova.plugins.notification.badge.hasPermission).toBeDefined();
            });

            it("should define registerPermission", function() {
                expect(cordova.plugins.notification.badge.registerPermission).toBeDefined();
            });

            it("should define configure", function() {
                expect(cordova.plugins.notification.badge.configure).toBeDefined();
            });

        });

        describe('API callbacks', function () {

            it("clear should invoke callback", function(done) {
                cordova.plugins.notification.badge.clear(done);
            });

            it("get should invoke callback", function(done) {
                cordova.plugins.notification.badge.get(done);
            });

            it("set should invoke callback", function(done) {
                cordova.plugins.notification.badge.set(done);
            });

            it("increase should invoke callback", function(done) {
                cordova.plugins.notification.badge.increase(done);
            });

            it("decrease should invoke callback", function(done) {
                cordova.plugins.notification.badge.decrease(done);
            });

            it("hasPermission should invoke callback", function(done) {
                cordova.plugins.notification.badge.hasPermission(done);
            });

            it("registerPermission should invoke callback", function(done) {
                cordova.plugins.notification.badge.registerPermission(done);
            });

        });

        describe('API functions', function () {

            it("clear should set badge to 0", function(done) {
                cordova.plugins.notification.badge.clear(function (badge) {
                    expect(badge).toBe(0);
                    done();
                });
            });

            it("should return badge", function(done) {
                cordova.plugins.notification.badge.set(10, function (badge) {
                    expect(badge).toBe(10);

                    cordova.plugins.notification.badge.get(function (badge2) {
                        expect(badge).toBe(badge2);
                        done();
                    });
                });
            });

            it("should increase badge", function(done) {
                cordova.plugins.notification.badge.set(10, function () {
                    cordova.plugins.notification.badge.increase(1, function (badge) {
                        expect(badge).toBe(11);
                        done();
                    });
                });
            });

            it("should decrease badge", function(done) {
                cordova.plugins.notification.badge.set(10, function () {
                    cordova.plugins.notification.badge.decrease(1, function (badge) {
                        expect(badge).toBe(9);
                        done();
                    });
                });
            });

            it("hasPermission should return boolean", function(done) {
                cordova.plugins.notification.badge.hasPermission(function (has) {
                    expect(has === true || has === false).toBe(true);
                    done();
                });
            });

            it("registerPermission should return boolean", function(done) {
                cordova.plugins.notification.badge.registerPermission(function (has) {
                    expect(has === true || has === false).toBe(true);
                    done();
                });
            });

        });

    });
};
