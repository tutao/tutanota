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
 
var self,
    ContactFindOptions = require("./ContactFindOptions"),
    ContactError = require("./ContactError"),
    ContactName = require("./ContactName"),
    ContactOrganization = require("./ContactOrganization"),
    ContactAddress = require("./ContactAddress"),
    ContactField = require("./ContactField"),
    contactConsts = require("./contactConsts"),
    ContactPhoto = require("./ContactPhoto"),
    ContactNews = require("./ContactNews"),
    ContactActivity = require("./ContactActivity");

function populateFieldArray(contactProps, field, ClassName) {
    if (contactProps[field]) {
        var list = [],
        obj;

        contactProps[field].forEach(function (args) {
            if (ClassName === ContactField) {
                list.push(new ClassName(args.type, args.value));
            } else if (ClassName === ContactPhoto) {
                obj = new ContactPhoto(args.originalFilePath, args.pref);
                obj.largeFilePath = args.largeFilePath;
                obj.smallFilePath = args.smallFilePath;
                list.push(obj);
            } else if (ClassName === ContactNews) {
                obj = new ContactNews(args);
                list.push(obj);
            } else if (ClassName === ContactActivity) {
                obj = new ContactActivity(args);
                list.push(obj);
            } else {
                list.push(new ClassName(args));
            }
        });
        contactProps[field] = list;
    }
}

function populateDate(contactProps, field) {
    if (contactProps[field]) {
        contactProps[field] = new Date(contactProps[field]);
    }
}

function validateFindArguments(findOptions) {
    var error = false;
    
    // findOptions is mandatory
    if (!findOptions) {
        error = true;
    } else {
        // findOptions.filter is optional
        if (findOptions.filter) {
            findOptions.filter.forEach(function (f) {
                switch (f.fieldName) {
                case ContactFindOptions.SEARCH_FIELD_GIVEN_NAME:
                case ContactFindOptions.SEARCH_FIELD_FAMILY_NAME:
                case ContactFindOptions.SEARCH_FIELD_ORGANIZATION_NAME:
                case ContactFindOptions.SEARCH_FIELD_PHONE:
                case ContactFindOptions.SEARCH_FIELD_EMAIL:
                case ContactFindOptions.SEARCH_FIELD_BBMPIN:
                case ContactFindOptions.SEARCH_FIELD_LINKEDIN:
                case ContactFindOptions.SEARCH_FIELD_TWITTER:
                case ContactFindOptions.SEARCH_FIELD_VIDEO_CHAT:
                    break;
                default:
                    error = true;
                }

                if (!f.fieldValue) {
                    error = true;
                }
            });
        } 

        //findOptions.limit is optional
        if (findOptions.limit) {
            if (typeof findOptions.limit !== "number") {
                error = true;
            } 
        } 

        //findOptions.favorite is optional
        if (findOptions.favorite) {
            if (typeof findOptions.favorite !== "boolean") {
                error = true;
            }
        }

        // findOptions.sort is optional
        if (!error && findOptions.sort && Array.isArray(findOptions.sort)) {
            findOptions.sort.forEach(function (s) {
                switch (s.fieldName) {
                case ContactFindOptions.SORT_FIELD_GIVEN_NAME:
                case ContactFindOptions.SORT_FIELD_FAMILY_NAME:
                case ContactFindOptions.SORT_FIELD_ORGANIZATION_NAME:
                    break;
                default:
                    error = true;
                }

                if (s.desc === undefined || typeof s.desc !== "boolean") {
                    error = true;
                }
            });
        }

        if (!error && findOptions.includeAccounts) {
            if (!Array.isArray(findOptions.includeAccounts)) {
                error = true;
            } else {
                findOptions.includeAccounts.forEach(function (acct) {
                    if (!error && (!acct.id || window.isNaN(window.parseInt(acct.id, 10)))) {
                        error = true;
                    }
                });
            }
        }

        if (!error && findOptions.excludeAccounts) {
            if (!Array.isArray(findOptions.excludeAccounts)) {
                error = true;
            } else {
                findOptions.excludeAccounts.forEach(function (acct) {
                    if (!error && (!acct.id || window.isNaN(window.parseInt(acct.id, 10)))) {
                        error = true;
                    }
                });
            }
        }
    }
    return !error;
}

function validateContactsPickerFilter(filter) {
    var isValid = true,
        availableFields = {};

    if (typeof(filter) === "undefined") {
        isValid = false;
    } else {
        if (filter && Array.isArray(filter)) {
            availableFields = contactConsts.getKindAttributeMap();
            filter.forEach(function (e) {
                isValid = isValid && Object.getOwnPropertyNames(availableFields).reduce(
                    function (found, key) {
                        return found || availableFields[key] === e;
                    }, false);
            });
        }
    }

    return isValid;
}

function validateContactsPickerOptions(options) {
    var isValid = false,
        mode = options.mode;

    if (typeof(options) === "undefined") {
        isValid = false;
    } else {
        isValid = mode === ContactPickerOptions.MODE_SINGLE || mode === ContactPickerOptions.MODE_MULTIPLE || mode === ContactPickerOptions.MODE_ATTRIBUTE;

        // if mode is attribute, fields must be defined
        if (mode === ContactPickerOptions.MODE_ATTRIBUTE && !validateContactsPickerFilter(options.fields)) {
            isValid = false;
        }
    }

    return isValid;
}

self = module.exports = {
    populateContact: function (contact) {
        if (contact.name) {
            contact.name = new ContactName(contact.name);
        }

        populateFieldArray(contact, "addresses", ContactAddress);
        populateFieldArray(contact, "organizations", ContactOrganization);
        populateFieldArray(contact, "emails", ContactField);
        populateFieldArray(contact, "phoneNumbers", ContactField);
        populateFieldArray(contact, "faxNumbers", ContactField);
        populateFieldArray(contact, "pagerNumbers", ContactField);
        populateFieldArray(contact, "ims", ContactField);
        populateFieldArray(contact, "socialNetworks", ContactField);
        populateFieldArray(contact, "urls", ContactField);
        populateFieldArray(contact, "photos", ContactPhoto);
        populateFieldArray(contact, "news", ContactNews);
        populateFieldArray(contact, "activities", ContactActivity);
        // TODO categories

        populateDate(contact, "birthday");
        populateDate(contact, "anniversary");
    },
    invokeErrorCallback: function (errorCallback, code) {
        if (errorCallback) {
            errorCallback(new ContactError(code));
        }
    },
    validateFindArguments: validateFindArguments,
    validateContactsPickerFilter: validateContactsPickerFilter,
    validateContactsPickerOptions: validateContactsPickerOptions
};

