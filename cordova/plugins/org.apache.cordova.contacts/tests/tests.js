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

exports.defineAutoTests = function () {
  // global to store a contact so it doesn't have to be created or retrieved multiple times
  // all of the setup/teardown test methods can reference the following variables to make sure to do the right cleanup
  var gContactObj = null,
    gContactId = null,
    isWindowsPhone = cordova.platformId == 'windowsphone';

  var fail = function(done) {
    expect(true).toBe(false);
    done();
  };
  

  var removeContact = function(){
      if (gContactObj) {
          gContactObj.remove(function(){},function(){
              console.log("[CONTACTS ERROR]: removeContact cleanup method failed to clean up test artifacts.");
          });
          gContactObj = null;
      }
  };
  
  describe("Contacts (navigator.contacts)", function () {
      it("contacts.spec.1 should exist", function() {
          expect(navigator.contacts).toBeDefined();
      });
      it("contacts.spec.2 should contain a find function", function() {
          expect(navigator.contacts.find).toBeDefined();
          expect(typeof navigator.contacts.find).toBe('function');
      });
      describe("find method", function() {
          it("contacts.spec.3 success callback should be called with an array", function(done) {
              var win = function(result) {
                      expect(result).toBeDefined();
                      expect(result instanceof Array).toBe(true);
                      done();
                  },
                  obj = new ContactFindOptions();

              obj.filter="";
              obj.multiple=true;
              navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], win, fail.bind(null, done), obj);
          });
          it("success callback should be called with an array, even if partial ContactFindOptions specified", function (done) {
              var win = function (result) {
                  expect(result).toBeDefined();
                  expect(result instanceof Array).toBe(true);
                  done();
              };

              navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], win, fail.bind(null, done),
                  { multiple: true });
          });
          it("contacts.spec.4 should throw an exception if success callback is empty", function() {
              var obj = new ContactFindOptions();
              obj.filter="";
              obj.multiple=true;

              expect(function () {
                  navigator.contacts.find(["displayName", "name", "emails", "phoneNumbers"], null, fail.bind(null, done), obj);
              }).toThrow();
          });
          it("contacts.spec.5 error callback should be called when no fields are specified", function(done) {
              var win = fail, // we don't want this to be called
                  error = function(result) {
                      expect(result).toBeDefined();
                      expect(result.code).toBe(ContactError.INVALID_ARGUMENT_ERROR);
                      done();
                  },
                  obj = new ContactFindOptions();

              obj.filter="";
              obj.multiple=true;
              navigator.contacts.find([], win, error, obj);
          });
          describe("with newly-created contact", function () {

              afterEach(removeContact);

              it("contacts.spec.6 should be able to find a contact by name", function (done) {
                  if (isWindowsPhone) {
                      done();
                      return;
                  }
                  var foundName = function(result) {
                          var bFound = false;
                          try {
                              for (var i=0; i < result.length; i++) {
                                  if (result[i].name.familyName == "Delete") {
                                      bFound = true;
                                      break;
                                  }
                              }
                          } catch(e) {
                              return false;
                          }
                          return bFound;
                      },
                      test = function(savedContact) {
                          // update so contact will get removed
                          gContactObj = savedContact;
                          // ----
                          // Find asserts
                          // ---
                          var findWin = function(object) {
                                  console.log('in findwin');
                                  expect(object instanceof Array).toBe(true);
                                  expect(object.length >= 1).toBe(true);
                                  expect(foundName(object)).toBe(true);
                                  done();
                              },
                              findFail = fail,
                              obj = new ContactFindOptions();

                          obj.filter="Delete";
                          obj.multiple=true;

                          navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], findWin, findFail.bind(null, done), obj);
                      };

                  gContactObj = new Contact();
                  gContactObj.name = new ContactName();
                  gContactObj.name.familyName = "Delete";
                  gContactObj.save(test, fail.bind(null, done));
              });
          });

      });
      describe('create method', function() {
          it("contacts.spec.1 should exist", function() {
              expect(navigator.contacts.create).toBeDefined();
              expect(typeof navigator.contacts.create).toBe('function');
          });
          it("contacts.spec.8 should return a Contact object", function() {
              var bDay = new Date(1976, 7,4);
              var obj = navigator.contacts.create({"displayName": "test name", "gender": "male", "note": "my note", "name": {"formatted": "Mr. Test Name"}, "emails": [{"value": "here@there.com"}, {"value": "there@here.com"}], "birthday": bDay});

              expect(obj).toBeDefined();
              expect(obj.displayName).toBe('test name');
              expect(obj.note).toBe('my note');
              expect(obj.name.formatted).toBe('Mr. Test Name');
              expect(obj.emails.length).toBe(2);
              expect(obj.emails[0].value).toBe('here@there.com');
              expect(obj.emails[1].value).toBe('there@here.com');
              expect(obj.nickname).toBe(null);
              expect(obj.birthday).toBe(bDay);
          });
      });

      describe("Contact object", function () {
          it("contacts.spec.9 should be able to create instance", function() {
              var contact = new Contact("a", "b", new ContactName("a", "b", "c", "d", "e", "f"), "c", [], [], [], [], [], "f", "i",
                  [], [], []);
              expect(contact).toBeDefined();
              expect(contact.id).toBe("a");
              expect(contact.displayName).toBe("b");
              expect(contact.name.formatted).toBe("a");
              expect(contact.nickname).toBe("c");
              expect(contact.phoneNumbers).toBeDefined();
              expect(contact.emails).toBeDefined();
              expect(contact.addresses).toBeDefined();
              expect(contact.ims).toBeDefined();
              expect(contact.organizations).toBeDefined();
              expect(contact.birthday).toBe("f");
              expect(contact.note).toBe("i");
              expect(contact.photos).toBeDefined();
              expect(contact.categories).toBeDefined();
              expect(contact.urls).toBeDefined();
          });
          it("contacts.spec.10 should be able to define a ContactName object", function() {
              var contactName = new ContactName("Dr. First Last Jr.", "Last", "First", "Middle", "Dr.", "Jr.");
              expect(contactName).toBeDefined();
              expect(contactName.formatted).toBe("Dr. First Last Jr.");
              expect(contactName.familyName).toBe("Last");
              expect(contactName.givenName).toBe("First");
              expect(contactName.middleName).toBe("Middle");
              expect(contactName.honorificPrefix).toBe("Dr.");
              expect(contactName.honorificSuffix).toBe("Jr.");
          });
          it("contacts.spec.11 should be able to define a ContactField object", function() {
              var contactField = new ContactField("home", "8005551212", true);
              expect(contactField).toBeDefined();
              expect(contactField.type).toBe("home");
              expect(contactField.value).toBe("8005551212");
              expect(contactField.pref).toBe(true);
          });
          it("contacts.spec.12 ContactField object should coerce type and value properties to strings", function() {
              var contactField = new ContactField(12345678, 12345678, true);
              expect(contactField.type).toBe("12345678");
              expect(contactField.value).toBe("12345678");
          });
          it("contacts.spec.13 should be able to define a ContactAddress object", function() {
              var contactAddress = new ContactAddress(true, "home", "a","b","c","d","e","f");
              expect(contactAddress).toBeDefined();
              expect(contactAddress.pref).toBe(true);
              expect(contactAddress.type).toBe("home");
              expect(contactAddress.formatted).toBe("a");
              expect(contactAddress.streetAddress).toBe("b");
              expect(contactAddress.locality).toBe("c");
              expect(contactAddress.region).toBe("d");
              expect(contactAddress.postalCode).toBe("e");
              expect(contactAddress.country).toBe("f");
          });
          it("contacts.spec.14 should be able to define a ContactOrganization object", function() {
              var contactOrg = new ContactOrganization(true, "home", "a","b","c","d","e","f","g");
              expect(contactOrg).toBeDefined();
              expect(contactOrg.pref).toBe(true);
              expect(contactOrg.type).toBe("home");
              expect(contactOrg.name).toBe("a");
              expect(contactOrg.department).toBe("b");
              expect(contactOrg.title).toBe("c");
          });
          it("contacts.spec.15 should be able to define a ContactFindOptions object", function() {
              var contactFindOptions = new ContactFindOptions("a", true, "b");
              expect(contactFindOptions).toBeDefined();
              expect(contactFindOptions.filter).toBe("a");
              expect(contactFindOptions.multiple).toBe(true);
          });
          it("contacts.spec.16 should contain a clone function", function() {
              var contact = new Contact();
              expect(contact.clone).toBeDefined();
              expect(typeof contact.clone).toBe('function');
          });
          it("contacts.spec.17 clone function should make deep copy of Contact Object", function() {
              var contact = new Contact();
              contact.id=1;
              contact.displayName="Test Name";
              contact.nickname="Testy";
              contact.gender="male";
              contact.note="note to be cloned";
              contact.name = new ContactName("Mr. Test Name");

              var clonedContact = contact.clone();

              expect(contact.id).toBe(1);
              expect(clonedContact.id).toBe(null);
              expect(clonedContact.displayName).toBe(contact.displayName);
              expect(clonedContact.nickname).toBe(contact.nickname);
              expect(clonedContact.gender).toBe(contact.gender);
              expect(clonedContact.note).toBe(contact.note);
              expect(clonedContact.name.formatted).toBe(contact.name.formatted);
              expect(clonedContact.connected).toBe(contact.connected);
          });
          it("contacts.spec.18 should contain a save function", function() {
              var contact = new Contact();
              expect(contact.save).toBeDefined();
              expect(typeof contact.save).toBe('function');
          });
          it("contacts.spec.19 should contain a remove function", function() {
              var contact = new Contact();
              expect(contact.remove).toBeDefined();
              expect(typeof contact.remove).toBe('function');
          });
      });
      describe('save method', function () {
          it("contacts.spec.20 should be able to save a contact", function (done) {
              if (isWindowsPhone) {
                  done();
                  return;
              }
              var bDay = new Date(1976, 6,4);
              gContactObj = navigator.contacts.create({"gender": "male", "note": "my note", "name": {"familyName": "Delete", "givenName": "Test"}, "emails": [{"value": "here@there.com"}, {"value": "there@here.com"}], "birthday": bDay});

              var saveSuccess = function(obj) {
                      expect(obj).toBeDefined();
                      expect(obj.note).toBe('my note');
                      expect(obj.name.familyName).toBe('Delete');
                      expect(obj.name.givenName).toBe('Test');
                      expect(obj.emails.length).toBe(2);
                      expect(obj.emails[0].value).toBe('here@there.com');
                      expect(obj.emails[1].value).toBe('there@here.com');
                      expect(obj.birthday.toDateString()).toBe(bDay.toDateString());
                      expect(obj.addresses).toBe(null);
                      // must store returned object in order to have id for update test below
                      gContactObj = obj;
                      done();
                  },
                  saveFail = fail;

              gContactObj.save(saveSuccess, saveFail);
           });
          // HACK: there is a reliance between the previous and next test. This is bad form.
          it("contacts.spec.21 update a contact", function (done) {
              if (isWindowsPhone) {
                  done();
                  return;
              }
              expect(gContactObj).toBeDefined();

              var bDay = new Date(1975, 5,4);
              var noteText = "an UPDATED note";

              var win = function(obj) {
                      expect(obj).toBeDefined();
                      expect(obj.id).toBe(gContactObj.id);
                      expect(obj.note).toBe(noteText);
                      expect(obj.birthday.toDateString()).toBe(bDay.toDateString());
                      expect(obj.emails.length).toBe(1);
                      expect(obj.emails[0].value).toBe('here@there.com');
                      removeContact();         // Clean up contact object
                      done();
                  }, fail = function() { removeContact(); fail(done); };

              // remove an email
              gContactObj.emails[1].value = "";
              // change birthday
              gContactObj.birthday = bDay;
              // update note
              gContactObj.note = noteText;
              gContactObj.save(win, fail);
          });
      });
      describe('Contact.remove method', function (done) {
          afterEach(removeContact);

          it("contacts.spec.22 calling remove on a contact has an id of null should return ContactError.UNKNOWN_ERROR", function(done) {
              var win = function() {};
              var fail = function(result) {
                  expect(result.code).toBe(ContactError.UNKNOWN_ERROR);
                  done();
              };

              var rmContact = new Contact();
              rmContact.remove(win, fail);
          });
          it("contacts.spec.23 calling remove on a contact that does not exist should return ContactError.UNKNOWN_ERROR", function(done) {
              var rmWin = fail;
              var rmFail = function(result) {
                  expect(result.code).toBe(ContactError.UNKNOWN_ERROR);
                  done();
              };

              var rmContact = new Contact();
              // this is a bit risky as some devices may have contact ids that large
              var contact = new Contact("this string is supposed to be a unique identifier that will never show up on a device");
              contact.remove(rmWin, rmFail);
          });
      });
      describe("Round trip Contact tests (creating + save + delete + find).", function () {
          afterEach(removeContact);

          it("contacts.spec.24 Creating, saving, finding a contact should work, removing it should work, after which we should not be able to find it, and we should not be able to delete it again.", function (done) {
              if (isWindowsPhone) {
                  done();
                  return;
              }
              gContactObj = new Contact();
              gContactObj.name = new ContactName();
              gContactObj.name.familyName = "DeleteMe";
              gContactObj.save(function(c_obj) {
                  var findWin = function(cs) {
                      expect(cs.length).toBe(1);
                      // update to have proper saved id
                      gContactObj = cs[0];
                      gContactObj.remove(function() {
                          var findWinAgain = function(seas) {
                              expect(seas.length).toBe(0);
                              gContactObj.remove(function() {
                                  throw("success callback called after non-existent Contact object called remove(). Test failed.");
                              }, function(e) {
                                  expect(e.code).toBe(ContactError.UNKNOWN_ERROR);
                                  done();
                              });
                          };
                          var findFailAgain = function(e) {
                              throw("find error callback invoked after delete, test failed.");
                          };
                          var obj = new ContactFindOptions();
                          obj.filter="DeleteMe";
                          obj.multiple=true;
                          navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], findWinAgain, findFailAgain, obj);
                      }, function(e) {
                          throw("Newly created contact's remove function invoked error callback. Test failed.");
                      });
                  };
                  var findFail = fail;
                  var obj = new ContactFindOptions();
                  obj.filter="DeleteMe";
                  obj.multiple=true;
                  navigator.contacts.find(["displayName", "name", "phoneNumbers", "emails"], findWin, findFail, obj);
              }, fail);
          });
      });
      describe('ContactError interface', function () {
          it("contacts.spec.25 ContactError constants should be defined", function() {
              expect(ContactError.UNKNOWN_ERROR).toBe(0);
              expect(ContactError.INVALID_ARGUMENT_ERROR).toBe(1);
              expect(ContactError.TIMEOUT_ERROR).toBe(2);
              expect(ContactError.PENDING_OPERATION_ERROR).toBe(3);
              expect(ContactError.IO_ERROR).toBe(4);
              expect(ContactError.NOT_SUPPORTED_ERROR).toBe(5);
              expect(ContactError.PERMISSION_DENIED_ERROR).toBe(20);
          });
      });
  });
};

/******************************************************************************/
/******************************************************************************/
/******************************************************************************/

exports.defineManualTests = function (contentEl, createActionButton) {
    function getContacts() {
        var results = document.getElementById('contact_results');
        obj = new ContactFindOptions();
        // show all contacts, so don't filter
        obj.multiple = true;
        navigator.contacts.find(
            ["displayName", "name", "phoneNumbers", "emails", "urls", "note"],
            function (contacts) {
                var s = "";
                if (contacts.length == 0) {
                    s = "No contacts found";
                }
                else {
                    s = "Number of contacts: " + contacts.length + "<br><table width='100%'><tr><th>Name</th><td>Phone</td><td>Email</td></tr>";
                    for (var i = 0; i < contacts.length; i++) {
                        var contact = contacts[i];
                        s = s + "<tr><td>" + contact.name.formatted + "</td><td>";
                        if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
                            s = s + contact.phoneNumbers[0].value;
                        }
                        s = s + "</td><td>"
                        if (contact.emails && contact.emails.length > 0) {
                            s = s + contact.emails[0].value;
                        }
                        s = s + "</td></tr>";
                    }
                    s = s + "</table>";
                }

                results.innerHTML = s;
            },
            function (e) {
                results.innerHTML = "Error: " + e.code;
            },
            obj);
    };

    function addContact() {
        try {
            var contact = navigator.contacts.create({ "displayName": "Dooney Evans" });
            var contactName = {
                formatted: "Dooney Evans",
                familyName: "Evans",
                givenName: "Dooney",
                middleName: ""
            };

            contact.name = contactName;

            var phoneNumbers = [1];
            phoneNumbers[0] = new ContactField('work', '512-555-1234', true);
            contact.phoneNumbers = phoneNumbers;

            contact.save(
                function () { console.log("Contact saved."); },
                function (e) { console.log("Contact save failed: " + e.code); }
            );
        }
        catch (e) {
            alert(e);
        }
    };

    /******************************************************************************/

    contentEl.innerHTML = '<div id="info">' +
        '<b>Results:</b><br>' +
        '<div id="contact_results"></div>' +
        '</div>' +
        '<div id="get_contacts"></div>' +
        'Expected result: Status box will show number of contacts and list them. May be empty on a fresh device until you click Add.' +
        '</p> <div id="add_contact"></div>' +
        'Expected result: Will add a new contact. Log will say "Contact saved." Verify by running Get phone contacts again';

    createActionButton("Get phone's contacts", function () {
        getContacts();
    }, 'get_contacts');

    createActionButton("Add a new contact 'Dooney Evans'", function () {
        addContact();
    }, 'add_contact');
};
