"use strict";

describe("PasswordChannelViewModelTest", function () {

    var assert = chai.assert;

    beforeEach(function () {
        var self = this;
        this.composingSecureMail = true;
        this.composerRecipients = [];
        var composingMail = {getAllComposerRecipients: function () {
            return self.composerRecipients;
        }};
        var mailViewModel = {
            getComposingMail: function () {
                return composingMail;
            },
            isComposingMailToSecureExternals: function () {
                return self.composingSecureMail;
            }
        };
        tutao.locator.replace("mailViewModel", mailViewModel);

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

        this.vm = new tutao.tutanota.ctrl.PasswordChannelViewModel();
    });

    afterEach(function () {
        tutao.locator.reset();
        tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
    });


    it(" that secureExternalRecipients is empty when there is no recipient", function () {
        assert.deepEqual([], this.vm.getSecureExternalRecipients());
    });

    it(" that secureExternalRecipients is always empty when sending an unsecure message", function () {
        this.composingSecureMail = false;
        var r1 = new tutao.tutanota.ctrl.RecipientInfo("a@b.de", "a b", null, true);
        assert.isTrue(r1.isExternal());
        assert.isFalse(r1.isSecure());
        this.composerRecipients.push(r1);
        assert.deepEqual([], this.vm.getSecureExternalRecipients());
    });

    it(" that secureExternalRecipients is correctly sorted when sending a secure mail", function () {
        var r1 = new tutao.tutanota.ctrl.RecipientInfo("a@b.de", "a b", null, true);
        assert.isTrue(r1.isExternal());
        assert.isFalse(r1.isSecure());
        var r2 = new tutao.tutanota.ctrl.RecipientInfo("c@d.de", "c d", null, true);
        var contact = new tutao.entity.tutanota.Contact();
        var contactPhoneNumber = new tutao.entity.tutanota.ContactPhoneNumber(contact);
        contactPhoneNumber.setNumber("+4915777777777");
        contactPhoneNumber.setType("0");
        contactPhoneNumber.setCustomTypeName("");
        r2.getEditableContact().phoneNumbers.push(new tutao.entity.tutanota.ContactPhoneNumberEditable(contactPhoneNumber));
        assert.isTrue(r2.isExternal());
        assert.isTrue(r2.isSecure());
        this.composerRecipients = [r2, r1];
        var result = this.vm.getSecureExternalRecipients();
        assert.deepEqual([r2, r1], result);
    });

    it(" that secureExternalRecipients does not include internal recipients", function () {
        var r1 = new tutao.tutanota.ctrl.RecipientInfo("a@tutanota.de", "a b", null);
        assert.isFalse(r1.isExternal());
        assert.isTrue(r1.isSecure());
        this.composerRecipients = [r1];
        assert.deepEqual([], this.vm.getSecureExternalRecipients());
    });


});