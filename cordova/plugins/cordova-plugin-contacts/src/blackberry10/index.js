/*
 * Copyright 2013 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var pimContacts,
    contactUtils = require("./contactUtils"),
    contactConsts = require("./contactConsts"),
    ContactError = require("./ContactError"),
    ContactName = require("./ContactName"),
    ContactFindOptions = require("./ContactFindOptions"),
    noop = function () {};

function getAccountFilters(options) {
    if (options.includeAccounts) {
        options.includeAccounts = options.includeAccounts.map(function (acct) {
            return acct.id.toString();
        });
    }

    if (options.excludeAccounts) {
        options.excludeAccounts = options.excludeAccounts.map(function (acct) {
            return acct.id.toString();
        });
    }
}

function populateSearchFields(fields) {
    var i,
        l,
        key,
        searchFieldsObject = {},
        searchFields = [];

    for (i = 0, l = fields.length; i < l; i++) {
        if (fields[i] === "*") {
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_GIVEN_NAME] = true;
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_FAMILY_NAME] = true;
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_PHONE] = true;
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_EMAIL] = true;
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_ORGANIZATION_NAME] = true;
        } else if (fields[i] === "displayName" || fields[i] === "name") {
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_GIVEN_NAME] = true;
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_FAMILY_NAME] = true;
        } else if (fields[i] === "nickname") {
            // not supported by Cascades
        } else if (fields[i] === "phoneNumbers") {
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_PHONE] = true;
        } else if (fields[i] === "emails") {
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_EMAIL] = true;
        } else if (field === "addresses") {
            // not supported by Cascades
        } else if (field === "ims") {
            // not supported by Cascades
        } else if (field === "organizations") {
            searchFieldsObject[ContactFindOptions.SEARCH_FIELD_ORGANIZATION_NAME] = true;
        } else if (field === "birthday") {
            // not supported by Cascades
        } else if (field === "note") {
            // not supported by Cascades
        } else if (field === "photos") {
            // not supported by Cascades
        } else if (field === "categories") {
            // not supported by Cascades
        } else if (field === "urls") {
            // not supported by Cascades
        }
    }

    for (key in searchFieldsObject) {
        if (searchFieldsObject.hasOwnProperty(key)) {
            searchFields.push(window.parseInt(key));
        }
    }

    return searchFields;
}

function convertBirthday(birthday) {
    //Convert date string from native to milliseconds since epoch for cordova-js
    var birthdayInfo;
    if (birthday) {
        birthdayInfo = birthday.split("-");
        return new Date(birthdayInfo[0], birthdayInfo[1] - 1, birthdayInfo[2]).getTime();
    } else {
        return null;
    }
}

function processJnextSaveData(result, JnextData) {
    var data = JnextData,
        birthdayInfo;

    if (data._success === true) {
        data.birthday = convertBirthday(data.birthday);
        result.callbackOk(data, false);
    } else {
        result.callbackError(data.code, false);
    }
}

function processJnextRemoveData(result, JnextData) {
    var data = JnextData;

    if (data._success === true) {
        result.callbackOk(data);
    } else {
        result.callbackError(ContactError.UNKNOWN_ERROR, false);
    }
}

function processJnextFindData(eventId, eventHandler, JnextData) {
    var data = JnextData,
        i,
        l,
        more = false,
        resultsObject = {},
        birthdayInfo;

    if (data.contacts) {
        for (i = 0, l = data.contacts.length; i < l; i++) {
            data.contacts[i].birthday = convertBirthday(data.contacts[i].birthday);
            data.contacts[i].name = new ContactName(data.contacts[i].name);
        }
    } else {
        data.contacts = []; // if JnextData.contacts return null, return an empty array
    }

    if (data._success === true) {
        eventHandler.error = false;
    }

    if (eventHandler.multiple) {
        // Concatenate results; do not add the same contacts
        for (i = 0, l = eventHandler.searchResult.length; i < l; i++) {
            resultsObject[eventHandler.searchResult[i].id] = true;
        }

        for (i = 0, l = data.contacts.length; i < l; i++) {
            if (resultsObject[data.contacts[i].id]) {
                // Already existing
            } else {
                eventHandler.searchResult.push(data.contacts[i]);
            }
        }

        // check if more search is required
        eventHandler.searchFieldIndex++;
        if (eventHandler.searchFieldIndex < eventHandler.searchFields.length) {
            more = true;
        }
    } else {
        eventHandler.searchResult = data.contacts;
    }

    if (more) {
        pimContacts.getInstance().invokeJnextSearch(eventId);
    } else {
        if (eventHandler.error) {
            eventHandler.result.callbackError(data.code, false);
        } else {
            eventHandler.result.callbackOk(eventHandler.searchResult, false);
        }
    }
}

module.exports = {
    search: function (successCb, failCb, args, env) {
        var cordovaFindOptions = {},
            result = new PluginResult(args, env),
            key;

        for (key in args) {
            if (args.hasOwnProperty(key)) {
                cordovaFindOptions[key] = JSON.parse(decodeURIComponent(args[key]));
            }
        }

        pimContacts.getInstance().find(cordovaFindOptions, result, processJnextFindData);
        result.noResult(true);
    },
    save: function (successCb, failCb, args, env) {
        var attributes = {},
            result = new PluginResult(args, env),
            key,
            nativeEmails = [];

        attributes = JSON.parse(decodeURIComponent(args[0]));

        //convert birthday format for our native .so file
        if (attributes.birthday) {
            attributes.birthday = new Date(attributes.birthday).toDateString();
        }

        if (attributes.emails) {
            attributes.emails.forEach(function (email) {
                if (email.value) {
                    if (email.type) {
                        nativeEmails.push({ "type" : email.type, "value" : email.value });
                    } else {
                        nativeEmails.push({ "type" : "home", "value" : email.value });
                    }
                }
            });
            attributes.emails = nativeEmails;
        }

        if (attributes.id !== null) {
            attributes.id = window.parseInt(attributes.id);
        }

        attributes._eventId = result.callbackId;
        pimContacts.getInstance().save(attributes, result, processJnextSaveData);
        result.noResult(true);
    },
    remove: function (successCb, failCb, args, env) {
        var result = new PluginResult(args, env),
            attributes = {
                "contactId": window.parseInt(JSON.parse(decodeURIComponent(args[0]))),
                "_eventId": result.callbackId
            };

        if (!window.isNaN(attributes.contactId)) {
            pimContacts.getInstance().remove(attributes, result, processJnextRemoveData);
            result.noResult(true);
        } else {
            result.error(ContactError.UNKNOWN_ERROR);
            result.noResult(false);
        }
    }
};

///////////////////////////////////////////////////////////////////
// JavaScript wrapper for JNEXT plugin
///////////////////////////////////////////////////////////////////

JNEXT.PimContacts = function ()
{
    var self = this,
        hasInstance = false;

    self.find = function (cordovaFindOptions, pluginResult, handler) {
        //register find eventHandler for when JNEXT onEvent fires
        self.eventHandlers[cordovaFindOptions.callbackId] = {
            "result" : pluginResult,
            "action" : "find",
            "multiple" : cordovaFindOptions[1].filter ? true : false,
            "fields" : cordovaFindOptions[0],
            "searchFilter" : cordovaFindOptions[1].filter,
            "searchFields" : cordovaFindOptions[1].filter ? populateSearchFields(cordovaFindOptions[0]) : null,
            "searchFieldIndex" : 0,
            "searchResult" : [],
            "handler" : handler,
            "error" : true
        };

        self.invokeJnextSearch(cordovaFindOptions.callbackId);
        return "";
    };

    self.invokeJnextSearch = function(eventId) {
        var jnextArgs = {},
            findHandler = self.eventHandlers[eventId];

        jnextArgs._eventId = eventId;
        jnextArgs.fields = findHandler.fields;
        jnextArgs.options = {};
        jnextArgs.options.filter = [];

        if (findHandler.multiple) {
            jnextArgs.options.filter.push({
                "fieldName" : findHandler.searchFields[findHandler.searchFieldIndex],
                "fieldValue" : findHandler.searchFilter
            });
            //findHandler.searchFieldIndex++;
        }

        JNEXT.invoke(self.m_id, "find " + JSON.stringify(jnextArgs));
    }

    self.getContact = function (args) {
        return JSON.parse(JNEXT.invoke(self.m_id, "getContact " + JSON.stringify(args)));
    };

    self.save = function (args, pluginResult, handler) {
        //register save eventHandler for when JNEXT onEvent fires
        self.eventHandlers[args._eventId] = {
            "result" : pluginResult,
            "action" : "save",
            "handler" : handler
        };
        JNEXT.invoke(self.m_id, "save " + JSON.stringify(args));
        return "";
    };

    self.remove = function (args, pluginResult, handler) {
        //register remove eventHandler for when JNEXT onEvent fires
        self.eventHandlers[args._eventId] = {
            "result" : pluginResult,
            "action" : "remove",
            "handler" : handler
        };
        JNEXT.invoke(self.m_id, "remove " + JSON.stringify(args));
        return "";
    };

    self.getId = function () {
        return self.m_id;
    };

    self.getContactAccounts = function () {
        var value = JNEXT.invoke(self.m_id, "getContactAccounts");
        return JSON.parse(value);
    };

    self.init = function () {
        if (!JNEXT.require("libpimcontacts")) {
            return false;
        }

        self.m_id = JNEXT.createObject("libpimcontacts.PimContacts");

        if (self.m_id === "") {
            return false;
        }

        JNEXT.registerEvents(self);
    };

    // Handle data coming back from JNEXT native layer. Each async function registers a handler and a PluginResult object.
    // When JNEXT fires onEvent we parse the result string  back into JSON and trigger the appropriate handler (eventHandlers map
    // uses callbackId as key), along with the actual data coming back from the native layer. Each function may have its own way of
    // processing native data so we do not do any processing here.

    self.onEvent = function (strData) {
        var arData = strData.split(" "),
            strEventDesc = arData[0],
            eventHandler,
            args = {};

        if (strEventDesc === "result") {
            args.result = escape(strData.split(" ").slice(2).join(" "));
            eventHandler = self.eventHandlers[arData[1]];
            if (eventHandler.action === "save" || eventHandler.action === "remove") {
                eventHandler.handler(eventHandler.result, JSON.parse(decodeURIComponent(args.result)));
            } else if (eventHandler.action === "find") {
                eventHandler.handler(arData[1], eventHandler, JSON.parse(decodeURIComponent(args.result)));
            }
        }
    };

    self.m_id = "";
    self.eventHandlers = {};

    self.getInstance = function () {
        if (!hasInstance) {
            self.init();
            hasInstance = true;
        }
        return self;
    };
};

pimContacts = new JNEXT.PimContacts();
