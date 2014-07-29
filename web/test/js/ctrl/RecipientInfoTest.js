"use strict";

describe("RecipientInfoTest", function () {

    var assert = chai.assert;

    beforeEach(function () {
    });


    afterEach(function () {
    });

    it(" create contact from recipient info", function () {
        var r1 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "B. Schneier", null, true);
        assert.isNotNull(r1.getEditableContact());
        assert.equal(1, r1.getEditableContact().mailAddresses().length);
        assert.equal("schneier@secure.com", r1.getEditableContact().mailAddresses()[0].address());
        assert.equal(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER, r1.getEditableContact().mailAddresses()[0].type());
        assert.equal("B.", r1.getEditableContact().firstName());
        assert.equal("Schneier", r1.getEditableContact().lastName());

        var r2 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "Bruce", null, true);
        assert.equal("Bruce", r2.getEditableContact().firstName());
        assert.equal("", r2.getEditableContact().lastName());

        var r3 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "B M A", null, true);
        assert.equal("B", r3.getEditableContact().firstName());
        assert.equal("M A", r3.getEditableContact().lastName());

        var r4 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "", null, true);
        assert.equal("Schneier", r4.getEditableContact().firstName());
        assert.equal("", r4.getEditableContact().lastName());

        var r5 = new tutao.tutanota.ctrl.RecipientInfo("bruce.schneier@secure.com", "", null, true);
        assert.equal("Bruce", r5.getEditableContact().firstName());
        assert.equal("Schneier", r5.getEditableContact().lastName());

        var r6 = new tutao.tutanota.ctrl.RecipientInfo("bruce_schneier_schneier@secure.com", "", null, true);
        assert.equal("Bruce", r6.getEditableContact().firstName());
        assert.equal("Schneier Schneier", r6.getEditableContact().lastName());

        var r7 = new tutao.tutanota.ctrl.RecipientInfo("bruce-schneier@secure.com", "", null, true);
        assert.equal("Bruce", r7.getEditableContact().firstName());
        assert.equal("Schneier", r7.getEditableContact().lastName());


        assert.isFalse(r7.hasPhoneNumberChanged());
        assert.isFalse(r7.hasPasswordChanged());
        r7.getEditableContact().update();
        assert.isFalse(r7.hasPhoneNumberChanged());
        assert.isFalse(r7.hasPasswordChanged());

        r7.getEditableContact().presharedPassword("abc");
        assert.isTrue(r7.hasPasswordChanged());
        assert.equal(null, r7.getContactWrapper().getContact().getPresharedPassword());

        r7.getEditableContact().update();
        assert.equal("abc", r7.getEditableContact().presharedPassword());
        assert.equal("abc", r7.getContactWrapper().getContact().getPresharedPassword());


        var contactPhoneNumber = new tutao.entity.tutanota.ContactPhoneNumber(r7.getContactWrapper().getContact());
        contactPhoneNumber.setNumber("015777777777");
        contactPhoneNumber.setType("0");
        contactPhoneNumber.setCustomTypeName("");

        r7.getEditableContact().phoneNumbers.push(new tutao.entity.tutanota.ContactPhoneNumberEditable(contactPhoneNumber));

        assert.isTrue(r7.hasPhoneNumberChanged());
        r7.getEditableContact().update();
        assert.isFalse(r7.hasPhoneNumberChanged());
        assert.equal("015777777777", r7.getContactWrapper().getContact().getPhoneNumbers()[0].getNumber());

    });


});