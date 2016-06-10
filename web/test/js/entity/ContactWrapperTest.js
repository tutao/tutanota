"use strict";

describe("ContactWrapperTest", function () {

    var assert = chai.assert;

    beforeEach(function () {
        var userControllerMock = {
            getUserGroupId: function () {
                return "";
            },
            getGroupId: function () {
                return "";
            },
            getGroupKey: function() {
                return tutao.locator.aesCrypter.generateRandomKey();
            }
        };
        tutao.locator.replace("userController", userControllerMock);
    });

    afterEach(function () {
        tutao.locator.reset();
    });

    it("GetContact", function () {
        var c = new tutao.entity.tutanota.Contact();
        var w = new tutao.entity.tutanota.ContactWrapper(c);
        assert.deepEqual(c.toJsonData(), w.getContact().toJsonData());
    });

    it("GetFullName", function () {
        var c = new tutao.entity.tutanota.Contact();
        var w = new tutao.entity.tutanota.ContactWrapper(c);
        c.setFirstName("");
        c.setLastName("");
        assert.equal("", w.getFullName());
        c.setFirstName("Ab");
        assert.equal("Ab", w.getFullName());
        c.setLastName("cd");
        assert.equal("Ab cd", w.getFullName());
        c.setFirstName("");
        assert.equal("cd", w.getFullName());
    });

    it("GetAge", function () {
        var c = new tutao.entity.tutanota.Contact();
        var w = new tutao.entity.tutanota.ContactWrapper(c);
        c.setBirthday(new Date());
        assert.equal(0, w.getAge());
        var date = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * (365 + 100));
        c.setBirthday(date);
        assert.equal(1, w.getAge());
    });

    it("GetMailAddressTypeName", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        var c = new tutao.entity.tutanota.Contact();
        var w = tutao.entity.tutanota.ContactWrapper;
        var m = new tutao.entity.tutanota.ContactMailAddress(c);
        c.getMailAddresses().push(m);
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_PRIVATE);
        assert.equal("Private", w.getMailAddressTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_WORK);
        assert.equal("Work", w.getMailAddressTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
        assert.equal("Other", w.getMailAddressTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_CUSTOM);
        m.setCustomTypeName("something");
        assert.equal("something", w.getMailAddressTypeName(m));

        // check that no type is missing
        assert.equal(4, tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_NAMES().length);
    });

    it("GetAddressTypeName", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        var c = new tutao.entity.tutanota.Contact();
        var w = tutao.entity.tutanota.ContactWrapper;
        var m = new tutao.entity.tutanota.ContactAddress(c);
        c.getAddresses().push(m);
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE);
        assert.equal("Private", w.getAddressTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_WORK);
        assert.equal("Work", w.getAddressTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_OTHER);
        assert.equal("Other", w.getAddressTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_CUSTOM);
        m.setCustomTypeName("something");
        assert.equal("something", w.getAddressTypeName(m));

        // check that no type is missing
        assert.equal(4, tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_NAMES().length);
    });

    it("GetPhoneNumberTypeName", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        var c = new tutao.entity.tutanota.Contact();
        var w = tutao.entity.tutanota.ContactWrapper;
        var m = new tutao.entity.tutanota.ContactPhoneNumber(c);
        c.getPhoneNumbers().push(m);
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE);
        assert.equal("Private", w.getPhoneNumberTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE);
        assert.equal("Mobile", w.getPhoneNumberTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_FAX);
        assert.equal("Fax", w.getPhoneNumberTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK);
        assert.equal("Work", w.getPhoneNumberTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_OTHER);
        assert.equal("Other", w.getPhoneNumberTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM);
        m.setCustomTypeName("something");
        assert.equal("something", w.getPhoneNumberTypeName(m));

        // check that no type is missing
        assert.equal(6, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_NAMES().length);
    });

    it("GetSocialIdTypeName", function () {
        tutao.locator.languageViewModel.setCurrentLanguage("en");
        var c = new tutao.entity.tutanota.Contact();
        var w = tutao.entity.tutanota.ContactWrapper;
        var m = new tutao.entity.tutanota.ContactSocialId(c);
        c.getSocialIds().push(m);
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_TWITTER);
        assert.equal("Twitter", w.getSocialIdTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_FACEBOOK);
        assert.equal("Facebook", w.getSocialIdTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_XING);
        assert.equal("XING", w.getSocialIdTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKED_IN);
        assert.equal("LinkedIn", w.getSocialIdTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_OTHER);
        assert.equal("Other", w.getSocialIdTypeName(m));
        m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_CUSTOM);
        m.setCustomTypeName("something");
        assert.equal("something", w.getSocialIdTypeName(m));

        // check that no type is missing
        assert.equal(6, tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_NAMES().length);
    });

    it("StartStopEditingContact", function () {
        tutao.entity.tutanota.ContactWrapper._editableContactsCache = [];
        var c1 = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();
        var c2 = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();
        var editor1 = "editor1";
        var editor2 = "editor2";
        var c1Editable = c1.startEditingContact(editor1);
        assert.isTrue(c1Editable == c1.startEditingContact(editor2));
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
        c1.stopEditingContact(editor1);
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
        c1.stopEditingContact(editor1); // the same editor
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
        c1.stopEditingContact(editor2);
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 0);

        var c1NewEditable = c1.startEditingContact(editor1);
        assert.isFalse(c1Editable == c1NewEditable);
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
        var c2Editable = c2.startEditingContact(editor1);
        assert.isFalse(c2Editable == c1NewEditable);
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 2);
        c1.stopEditingContact(editor1);
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
        c2.stopEditingContact(editor1);
        assert.isTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 0);
    });


});