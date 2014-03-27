"use strict";

JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();

TestCase("PasswordChannelViewModelTest", {

	setUp: function() {
		var self = this;
		this.composingSecureMail = true;
		this.composerRecipients = [];
		var composingMail = {getAllComposerRecipients : function() { return self.composerRecipients; }};
		var mailViewModel = {getComposingMail: function() { return composingMail; },
				             isComposingMailToSecureExternals : function() { return self.composingSecureMail; } };
		tutao.locator.replace("mailViewModel", mailViewModel);
		this.vm = new tutao.tutanota.ctrl.PasswordChannelViewModel();
	},
	tearDown: function() {
		tutao.locator.reset();
		tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	},
	"test that secureExternalRecipients is empty when there is no recipient": function() {
		assertEquals([], this.vm.getSecureExternalRecipients());
	},
	"test that secureExternalRecipients is always empty when sending an unsecure message": function() {
		this.composingSecureMail = false;
		var r1 = new tutao.tutanota.ctrl.RecipientInfo("a@b.de", "a b", null, true);
		assertTrue(r1.isExternal());
		assertFalse(r1.isSecure());
		this.composerRecipients.push(r1);
		assertEquals([], this.vm.getSecureExternalRecipients());
	},
	"test that secureExternalRecipients is correctly sorted when sending a secure mail": function() {
		var r1 = new tutao.tutanota.ctrl.RecipientInfo("a@b.de", "a b", null, true);
		assertTrue(r1.isExternal());
		assertFalse(r1.isSecure());
		var r2 = new tutao.tutanota.ctrl.RecipientInfo("c@d.de", "c d", null, true);
		var contact = new tutao.entity.tutanota.Contact();
		var contactPhoneNumber = new tutao.entity.tutanota.ContactPhoneNumber(contact);
		contactPhoneNumber.setNumber("015777777777");
		contactPhoneNumber.setType("0");
		contactPhoneNumber.setCustomTypeName("");
		r2.getEditableContact().phoneNumbers.push(new tutao.entity.tutanota.ContactPhoneNumberEditable(contactPhoneNumber));
		assertTrue(r2.isExternal());
		assertTrue(r2.isSecure());
		this.composerRecipients = [r2, r1];
		var result = this.vm.getSecureExternalRecipients();
		assertEquals([r2, r1], result);
	},
	"test that secureExternalRecipients does not include internal recipients": function() {
		var r1 = new tutao.tutanota.ctrl.RecipientInfo("a@tutanota.de", "a b", null);
		assertFalse(r1.isExternal());
		assertTrue(r1.isSecure());
		this.composerRecipients = [r1];
		assertEquals([], this.vm.getSecureExternalRecipients());
	}
});
