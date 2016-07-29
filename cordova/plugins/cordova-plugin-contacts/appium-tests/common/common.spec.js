/*jshint node: true, jasmine: true, browser: true */
/*global ContactFindOptions, ContactName, Q*/

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

// these tests are meant to be executed by Cordova Medic Appium runner
// you can find it here: https://github.com/apache/cordova-medic/
// it is not necessary to do a full CI setup to run these tests, just run:
// node cordova-medic/medic/medic.js appium --platform android --plugins cordova-plugin-contacts

'use strict';

var wdHelper = global.WD_HELPER;
var screenshotHelper = global.SCREENSHOT_HELPER;
var contactsHelper = require('../helpers/contactsHelper');

var MINUTE = 60 * 1000;
var PLATFORM = global.PLATFORM;
var UNORM = global.UNORM;

describe('Contacts Android', function () {
    var driver;
    var webviewContext;
    var promiseCount = 0;

    function getNextPromiseId() {
        return 'appium_promise_' + promiseCount++;
    }

    function saveScreenshotAndFail(error) {
        fail(error);
        return screenshotHelper
            .saveScreenshot(driver)
            .quit()
            .then(function () {
                return getDriver();
            });
    }

    function getDriver() {
        driver = wdHelper.getDriver(PLATFORM);
        return wdHelper.getWebviewContext(driver)
            .then(function(context) {
                webviewContext = context;
                return driver.context(webviewContext);
            })
            .then(function () {
                return wdHelper.waitForDeviceReady(driver);
            })
            .then(function () {
                return wdHelper.injectLibraries(driver);
            });
    }

    function addContact(firstName, lastName) {
        var contactName = contactsHelper.getContactName(firstName, lastName);
        return driver
            .context(webviewContext)
            .setAsyncScriptTimeout(MINUTE)
            .executeAsync(function(contactname, callback) {
                navigator.contacts.create({
                    'displayName': contactname.formatted,
                    'name': contactname,
                    'note': 'DeleteMe'
                }).save(callback, callback);
            }, [contactName])
            .then(function(result) {
                if (result && result.hasOwnProperty('code')) {
                    throw result;
                }
                return result;
            });
    }

    function pickContact(name) {
        var promiseId = getNextPromiseId();
        return driver
            .context(webviewContext)
            .execute(function (pID) {
                navigator._appiumPromises[pID] = Q.defer();
                navigator.contacts.pickContact(function (contact) {
                    navigator._appiumPromises[pID].resolve(contact);
                }, function (err) {
                    navigator._appiumPromises[pID].reject(err);
                });
            }, [promiseId])
            .context('NATIVE_APP')
            .then(function () {
                switch (PLATFORM) {
                    case 'ios':
                        return driver.waitForElementByXPath(UNORM.nfd('//UIAStaticText[@label="' + name + '"]'), MINUTE);
                    case 'android':
                        return driver.waitForElementByXPath('//android.widget.TextView[@text="' + name + '"]', MINUTE);
                }
            })
            .click()
            .context(webviewContext)
            .executeAsync(function (pID, cb) {
                navigator._appiumPromises[pID].promise
                .then(function (contact) {
                    cb(contact);
                }, function (err) {
                    cb('ERROR: ' + err);
                });
            }, [promiseId])
            .then(function (result) {
                if (typeof result === 'string' && result.indexOf('ERROR:') === 0) {
                    throw result;
                }
                return result;
            });
    }

    function renameContact(oldName, newGivenName, newFamilyName) {
        return driver
            .context(webviewContext)
            .setAsyncScriptTimeout(5 * MINUTE)
            .executeAsync(function (oldname, newgivenname, newfamilyname, callback) {
                var obj = new ContactFindOptions();
                obj.filter = oldname;
                obj.multiple = false;

                navigator.contacts.find(['displayName', 'name'], function(contacts) {
                    if (contacts.length === 0) {
                        callback({ 'code': -35142 });
                        return;
                    }
                    var contact = contacts[0];
                    contact.displayName = newgivenname + ' ' + newfamilyname;
                    var name = new ContactName();
                    name.givenName = newgivenname;
                    name.familyName = newfamilyname;
                    contact.name = name;
                    contact.save(callback, callback);
                }, callback, obj);
            }, [oldName, newGivenName, newFamilyName])
            .then(function(result) {
                if (result && result.hasOwnProperty('code')) {
                    if (result.code === -35142) {
                        throw 'Couldn\'t find the contact "' + oldName + '"';
                    }
                    throw result;
                }
                return result;
            });
    }

    function removeTestContacts() {
        return driver
            .context(webviewContext)
            .setAsyncScriptTimeout(MINUTE)
            .executeAsync(function (callback) {
                var obj = new ContactFindOptions();
                obj.filter = 'DeleteMe';
                obj.multiple = true;
                navigator.contacts.find(['note'], function(contacts) {
                    var removes = [];
                    contacts.forEach(function(contact) {
                        removes.push(contact);
                    });
                    if (removes.length === 0) {
                        return;
                    }

                   var nextToRemove;
                   if (removes.length > 0) {
                        nextToRemove = removes.shift();
                    }

                    function removeNext(item) {
                        if (typeof item === 'undefined') {
                            callback();
                            return;
                        }

                        if (removes.length > 0) {
                            nextToRemove = removes.shift();
                        } else {
                            nextToRemove = undefined;
                        }

                        item.remove(function removeSucceeded() {
                            removeNext(nextToRemove);
                        }, function removeFailed() {
                            removeNext(nextToRemove);
                        });
                    }
                    removeNext(nextToRemove);
                }, callback, obj);
            }, [])
            .then(function(result) {
                if (typeof result !== 'undefined') {
                    throw result;
                }
            });
    }

    it('contacts.ui.util configuring driver and starting a session', function (done) {
        getDriver()
            .fail(fail)
            .done(done);
    }, 5 * MINUTE);

    describe('Picking contacts', function () {
        afterEach(function (done) {
            removeTestContacts()
                .finally(done);
        }, MINUTE);

        it('contacts.ui.spec.1 Pick a contact', function (done) {
            driver
                .then(function () {
                    return addContact('Test', 'Contact');
                })
                .then(function () {
                    return pickContact('Test Contact');
                })
                .then(function (contact) {
                    expect(contact.name.givenName).toBe('Test');
                    expect(contact.name.familyName).toBe('Contact');
                })
                .fail(saveScreenshotAndFail)
                .done(done);
        }, 5 * MINUTE);

        it('contacts.ui.spec.2 Update an existing contact', function (done) {
            driver
                .then(function () {
                    return addContact('Dooney', 'Evans');
                })
                .then(function () {
                    return renameContact('Dooney Evans', 'Urist', 'McContact');
                })
                .then(function (contact) {
                    expect(contact.name.givenName).toBe('Urist');
                    expect(contact.name.familyName).toBe('McContact');
                })
                .then(function () {
                    return pickContact('Urist McContact');
                })
                .then(function (contact) {
                    expect(contact.name.givenName).toBe('Urist');
                    expect(contact.name.familyName).toBe('McContact');
                })
                .fail(saveScreenshotAndFail)
                .done(done);
        }, 5 * MINUTE);

        it('contacts.ui.spec.3 Create a contact with no name', function (done) {
            driver
                .then(function () {
                    return addContact();
                })
                .then(function () {
                    switch (PLATFORM) {
                        case 'android':
                            return pickContact('(No name)');
                        case 'ios':
                            return pickContact('No Name');
                    }
                })
                .then(function (contact) {
                    if (contact.name) {
                        expect(contact.name.givenName).toBeFalsy();
                        expect(contact.name.middleName).toBeFalsy();
                        expect(contact.name.familyName).toBeFalsy();
                        expect(contact.name.formatted).toBeFalsy();
                    } else {
                        expect(contact.name).toBeFalsy();
                    }
                })
                .fail(saveScreenshotAndFail)
                .done(done);
        }, 5 * MINUTE);

        it('contacts.ui.spec.4 Create a contact with Unicode characters in name', function (done) {
            driver
                .then(function () {
                    return addContact('Н€йромонах', 'ФеофаЊ');
                })
                .then(function () {
                    return pickContact('Н€йромонах ФеофаЊ');
                })
                .then(function (contact) {
                    expect(contact.name.givenName).toBe('Н€йромонах');
                    expect(contact.name.familyName).toBe('ФеофаЊ');
                })
                .fail(saveScreenshotAndFail)
                .done(done);
        }, 5 * MINUTE);
    });

    it('contacts.ui.util Destroy the session', function (done) {
        driver
            .quit()
            .done(done);
    }, MINUTE);
});
