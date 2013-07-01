"use strict";

TestCase("RecipientInfoTest", {
	setUp: function() {
		
	},
	tearDown: function() {
		
	},
	"test create contact from recipient info": function() {
		var r1 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "B. Schneier");
		assertNotNull(r1.getEditableContact());
		assertEquals(1, r1.getEditableContact().mailAddresses().length);
		assertEquals("schneier@secure.com", r1.getEditableContact().mailAddresses()[0].address());
		assertEquals(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER, r1.getEditableContact().mailAddresses()[0].type());
		assertEquals("B.", r1.getEditableContact().firstName());
		assertEquals("Schneier", r1.getEditableContact().lastName());
		
		var r2 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "Bruce");
		assertEquals("Bruce", r2.getEditableContact().firstName());
		assertEquals("", r2.getEditableContact().lastName());
		
		var r3 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "B M A");
		assertEquals("B", r3.getEditableContact().firstName());
		assertEquals("M A", r3.getEditableContact().lastName());
		
		var r4 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "");
		assertEquals("Schneier", r4.getEditableContact().firstName());
		assertEquals("", r4.getEditableContact().lastName());
		
		var r5 = new tutao.tutanota.ctrl.RecipientInfo("bruce.schneier@secure.com", "");
		assertEquals("Bruce", r5.getEditableContact().firstName());
		assertEquals("Schneier", r5.getEditableContact().lastName());
		
		var r6 = new tutao.tutanota.ctrl.RecipientInfo("bruce_schneier_schneier@secure.com", "");
		assertEquals("Bruce", r6.getEditableContact().firstName());
		assertEquals("Schneier Schneier", r6.getEditableContact().lastName());
		
		var r7 = new tutao.tutanota.ctrl.RecipientInfo("bruce-schneier@secure.com", "");
		assertEquals("Bruce", r7.getEditableContact().firstName());
		assertEquals("Schneier", r7.getEditableContact().lastName());
	}
});
