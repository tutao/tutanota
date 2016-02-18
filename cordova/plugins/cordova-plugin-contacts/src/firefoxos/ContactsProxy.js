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

// Cordova contact definition: 
// http://cordova.apache.org/docs/en/2.5.0/cordova_contacts_contacts.md.html#Contact
// FxOS contact definition:
// https://developer.mozilla.org/en-US/docs/Web/API/mozContact


var Contact = require('./Contact');
var ContactField = require('./ContactField');
var ContactAddress = require('./ContactAddress');
var ContactName = require('./ContactName');

// XXX: a hack to check if id is "empty". Cordova inserts a
// string "this string is supposed to be a unique identifier that will 
// never show up on a device" if id is empty
function _hasId(id) {
    if (!id || id.indexOf(' ') >= 0) {
        return false;
    }
    return true;
}

// Extend mozContact prototype to provide update from Cordova
function updateFromCordova(contact, fromContact) {

    function exportContactFieldArray(contactFieldArray, key) {
        if (!key) {
            key = 'value';
        }                 
        var arr = [];
        for (var i=0; i < contactFieldArray.length; i++) {
            arr.push(contactFieldArray[i][key]);
        };                                       
        return arr;
    }              

    function exportAddress(addresses) {
        // TODO: check moz address format
        var arr = [];
        
        for (var i=0; i < addresses.length; i++) {
            var addr = {};
            for (var key in addresses[i]) {
                if (key == 'formatted' || key == 'id') {
                    continue;
                } else if (key == 'type') {
                    addr[key] = [addresses[i][key]];
                } else if (key == 'country') {
                    addr['countryName'] = addresses[i][key];
                } else {
                    addr[key] = addresses[i][key];    
                }
            } 
            arr.push(addr);
        }                                 
        return arr;
    } 

    function exportContactField(data) {
        var contactFields = [];
        for (var i=0; i < data.length; i++) {
            var item = data[i];
            if (item.value) {
                var itemData = {value: item.value};
                if (item.type) {
                    itemData.type = [item.type];
                }
                if (item.pref) {
                    itemData.pref = item.pref;
                }
                contactFields.push(itemData);
            }
        }
        return contactFields;
    }
    // adding simple fields [contactField, eventualMozContactField]
    var nameFields = [['givenName'], ['familyName'],  
                      ['honorificPrefix'], ['honorificSuffix'],
                      ['middleName', 'additionalName']];
    var baseArrayFields = [['displayName', 'name'], ['nickname']];
    var baseStringFields = [];
    var j = 0; while(field = nameFields[j++]) {
      if (fromContact.name[field[0]]) {
        contact[field[1] || field[0]] = fromContact.name[field[0]].split(' ');
      }
    }
    j = 0; while(field = baseArrayFields[j++]) {
      if (fromContact[field[0]]) {
        contact[field[1] || field[0]] = fromContact[field[0]].split(' ');
      }
    }
    j = 0; while(field = baseStringFields[j++]) {
      if (fromContact[field[0]]) {
        contact[field[1] || field[0]] = fromContact[field[0]];
      }
    }
    if (fromContact.birthday) {
      contact.bday = new Date(fromContact.birthday);
    }
    if (fromContact.emails) {
        var emails = exportContactField(fromContact.emails)
        contact.email = emails;
    }
    if (fromContact.categories) {
        contact.category = exportContactFieldArray(fromContact.categories);
    }
    if (fromContact.addresses) {
        contact.adr = exportAddress(fromContact.addresses);
    }
    if (fromContact.phoneNumbers) {
        contact.tel = exportContactField(fromContact.phoneNumbers);
    }
    if (fromContact.organizations) {
        // XXX: organizations are saved in 2 arrays - org and jobTitle
        //      depending on the usecase it might generate issues
        //      where wrong title will be added to an organization
        contact.org = exportContactFieldArray(fromContact.organizations, 'name');
        contact.jobTitle = exportContactFieldArray(fromContact.organizations, 'title');
    }
    if (fromContact.note) {
        contact.note = [fromContact.note];
    }
}


// Extend Cordova Contact prototype to provide update from FFOS contact
Contact.prototype.updateFromMozilla = function(moz) {
    function exportContactField(data) {
        var contactFields = [];
        for (var i=0; i < data.length; i++) {
            var item = data[i];
            var itemData = new ContactField(item.type, item.value, item.pref);
            contactFields.push(itemData);
        }
        return contactFields;
    }

    function makeContactFieldFromArray(data) {
        var contactFields = [];
        for (var i=0; i < data.length; i++) {
            var itemData = new ContactField(null, data[i]);
            contactFields.push(itemData);
        }
        return contactFields;
    }

    function exportAddresses(addresses) {
        // TODO: check moz address format
        var arr = [];
        
        for (var i=0; i < addresses.length; i++) {
            var addr = {};
            for (var key in addresses[i]) {
                if (key == 'countryName') {
                    addr['country'] = addresses[i][key];
                } else if (key == 'type') {
                    addr[key] = addresses[i][key].join(' ');
                } else {
                    addr[key] = addresses[i][key];    
                }
            } 
            arr.push(addr);
        }
        return arr;
    } 

    function createOrganizations(orgs, jobs) {
        orgs = (orgs) ? orgs : [];
        jobs = (jobs) ? jobs : [];
        var max_length = Math.max(orgs.length, jobs.length);
        var organizations = [];
        for (var i=0; i < max_length; i++) {
            organizations.push(new ContactOrganization(
                  null, null, orgs[i] || null, null, jobs[i] || null));
        }
        return organizations;
    }

    function createFormatted(name) {
        var fields = ['honorificPrefix', 'givenName', 'middleName', 
                      'familyName', 'honorificSuffix'];
        var f = '';
        for (var i = 0; i < fields.length; i++) {
            if (name[fields[i]]) {
                if (f) {
                    f += ' ';
                }
                f += name[fields[i]];
            }
        }
        return f;
    }


    if (moz.id) {
        this.id = moz.id;
    }
    var nameFields = [['givenName'], ['familyName'], 
                       ['honorificPrefix'], ['honorificSuffix'],
                       ['additionalName', 'middleName']];
    var baseArrayFields = [['name', 'displayName'], 'nickname', ['note']];
    var baseStringFields = [];
    var name = new ContactName();
    var j = 0; while(field = nameFields[j++]) {
        if (moz[field[0]]) {
            name[field[1] || field[0]] = moz[field[0]].join(' ');
        }
    }
    this.name = name;
    j = 0; while(field = baseArrayFields[j++]) {
        if (moz[field[0]]) {
            this[field[1] || field[0]] = moz[field[0]].join(' ');
        }
    }
    j = 0; while(field = baseStringFields[j++]) {
        if (moz[field[0]]) {
            this[field[1] || field[0]] = moz[field[0]];
        }
    }
    // emails
    if (moz.email) {
        this.emails = exportContactField(moz.email);
    }
    // categories
    if (moz.category) {
        this.categories = makeContactFieldFromArray(moz.category);
    }

    // addresses
    if (moz.adr) {
        this.addresses = exportAddresses(moz.adr);
    }

    // phoneNumbers
    if (moz.tel) {
        this.phoneNumbers = exportContactField(moz.tel);
    }
    // birthday
    if (moz.bday) {
      this.birthday = Date.parse(moz.bday);
    }
    // organizations
    if (moz.org || moz.jobTitle) {
        // XXX: organizations array is created from org and jobTitle
        this.organizations = createOrganizations(moz.org, moz.jobTitle);
    }
    // construct a read-only formatted value
    this.name.formatted = createFormatted(this.name);

    /*  Find out how to translate these parameters
        // photo: Blob
        // url: Array with metadata (?)
        // impp: exportIM(contact.ims), TODO: find the moz impp definition
        // anniversary
        // sex
        // genderIdentity
        // key
    */
}


function createMozillaFromCordova(successCB, errorCB, contact) {
    var moz;
    // get contact if exists
    if (_hasId(contact.id)) {
      var search = navigator.mozContacts.find({
        filterBy: ['id'], filterValue: contact.id, filterOp: 'equals'});
      search.onsuccess = function() {
        moz = search.result[0];
        updateFromCordova(moz, contact);
        successCB(moz);
      };
      search.onerror = errorCB;
      return;
    }

    // create empty contact
    moz = new mozContact();
    // if ('init' in moz) {
      // 1.2 and below compatibility
      // moz.init();
    // }
    updateFromCordova(moz, contact);
    successCB(moz);
}


function createCordovaFromMozilla(moz) {
    var contact = new Contact();
    contact.updateFromMozilla(moz);
    return contact;
}


// However API requires the ability to save multiple contacts, it is 
// used to save only one element array
function saveContacts(successCB, errorCB, contacts) {
    // a closure which is holding the right moz contact
    function makeSaveSuccessCB(moz) {
        return function(result) {
            // create contact from FXOS contact (might be different than
            // the original one due to differences in API)
            var contact = createCordovaFromMozilla(moz);
            // call callback
            successCB(contact);
        }
    }
    var i=0;
    var contact;
    while(contact = contacts[i++]){
        var moz = createMozillaFromCordova(function(moz) {
          var request = navigator.mozContacts.save(moz);
          // success and/or fail will be called every time a contact is saved
          request.onsuccess = makeSaveSuccessCB(moz);
          request.onerror = errorCB;                
        }, function() {}, contact);
    }
}   


// API provides a list of ids to be removed
function remove(successCB, errorCB, ids) {
    var i=0;
    var id;
    for (var i=0; i < ids.length; i++){
        // throw an error if no id provided
        if (!_hasId(ids[i])) {
            console.error('FFOS: Attempt to remove unsaved contact');
            errorCB(0);
            return;
        }
        // check if provided id actually exists 
        var search = navigator.mozContacts.find({
            filterBy: ['id'], filterValue: ids[i], filterOp: 'equals'});
        search.onsuccess = function() {
            if (search.result.length === 0) {
                console.error('FFOS: Attempt to remove a non existing contact');
                errorCB(0);
                return;
            }
            var moz = search.result[0];
            var request = navigator.mozContacts.remove(moz);
            request.onsuccess = successCB;
            request.onerror = errorCB;
        };
        search.onerror = errorCB;
    }
}


var mozContactSearchFields = [['name', 'displayName'], ['givenName'], 
    ['familyName'], ['email'], ['tel'], ['jobTitle'], ['note'], 
    ['tel', 'phoneNumbers'], ['email', 'emails']]; 
// Searching by nickname and additionalName is forbidden in  1.3 and below
// Searching by name is forbidden in 1.2 and below

// finds if a key is allowed and returns FFOS name if different
function getMozSearchField(key) {
    if (mozContactSearchFields.indexOf([key]) >= 0) {
        return key;
    }
    for (var i=0; i < mozContactSearchFields.length; i++) {
        if (mozContactSearchFields[i].length > 1) {
            if (mozContactSearchFields[i][1] === key) {
                return mozContactSearchFields[i][0];
            }
        }
    }
    return false;
}


function _getAll(successCB, errorCB, params) {
    // [contactField, eventualMozContactField]
    var getall = navigator.mozContacts.getAll({});
    var contacts = [];

    getall.onsuccess = function() {
        if (getall.result) {
            contacts.push(createCordovaFromMozilla(getall.result));
            getall.continue();
        } else {
            successCB(contacts);
        }
    };
    getall.onerror = errorCB;
}


function search(successCB, errorCB, params) {
    var options = params[1] || {}; 
    if (!options.filter) {
        return _getAll(successCB, errorCB, params);
    }
    var filterBy = [];
    // filter and translate fields
    for (var i=0; i < params[0].length; i++) {
        var searchField = params[0][i];
        var mozField = getMozSearchField(searchField);
        if (searchField === 'name') {
            // Cordova uses name for search by all name fields.
            filterBy.push('givenName');
            filterBy.push('familyName');
            continue;
        } 
        if (searchField === 'displayName' && 'init' in new mozContact()) {
            // ``init`` in ``mozContact`` indicates FFOS version 1.2 or below
            // Searching by name (in moz) is then forbidden
            console.log('FFOS ContactProxy: Unable to search by displayName on FFOS 1.2');
            continue;
        } 
        if (mozField) {
            filterBy.push(mozField);
        } else {
            console.log('FXOS ContactProxy: inallowed field passed to search filtered out: ' + searchField);
        }
    }

    var mozOptions = {filterBy: filterBy, filterOp: 'startsWith'};
    if (!options.multiple) {
        mozOptions.filterLimit = 1;
    }
    mozOptions.filterValue = options.filter;
    var request = navigator.mozContacts.find(mozOptions);
    request.onsuccess = function() {
        var contacts = [];
        var mozContacts = request.result;
        var moz = mozContacts[0];
        for (var i=0; i < mozContacts.length; i++) {
            contacts.push(createCordovaFromMozilla(mozContacts[i]));
        }
        successCB(contacts);
    };
    request.onerror = errorCB;
}


module.exports = {
    save: saveContacts,
    remove: remove,
    search: search
};    
    
require("cordova/exec/proxy").add("Contacts", module.exports);