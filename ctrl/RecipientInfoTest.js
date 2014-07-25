"use strict";

TestCase("RecipientInfoTest", {
	setUp: function() {
		
	},
	tearDown: function() {
		
	},
	"test create contact from recipient info": function() {
		var r1 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "B. Schneier", null, true);
		assertNotNull(r1.getEditableContact());
		assertEquals(1, r1.getEditableContact().mailAddresses().length);
		assertEquals("schneier@secure.com", r1.getEditableContact().mailAddresses()[0].address());
		assertEquals(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER, r1.getEditableContact().mailAddresses()[0].type());
		assertEquals("B.", r1.getEditableContact().firstName());
		assertEquals("Schneier", r1.getEditableContact().lastName());
		
		var r2 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "Bruce", null, true);
		assertEquals("Bruce", r2.getEditableContact().firstName());
		assertEquals("", r2.getEditableContact().lastName());
		
		var r3 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "B M A", null, true);
		assertEquals("B", r3.getEditableContact().firstName());
		assertEquals("M A", r3.getEditableContact().lastName());
		
		var r4 = new tutao.tutanota.ctrl.RecipientInfo("schneier@secure.com", "", null, true);
		assertEquals("Schneier", r4.getEditableContact().firstName());
		assertEquals("", r4.getEditableContact().lastName());
		
		var r5 = new tutao.tutanota.ctrl.RecipientInfo("bruce.schneier@secure.com", "", null, true);
		assertEquals("Bruce", r5.getEditableContact().firstName());
		assertEquals("Schneier", r5.getEditableContact().lastName());
		
		var r6 = new tutao.tutanota.ctrl.RecipientInfo("bruce_schneier_schneier@secure.com", "", null, true);
		assertEquals("Bruce", r6.getEditableContact().firstName());
		assertEquals("Schneier Schneier", r6.getEditableContact().lastName());
		
		var r7 = new tutao.tutanota.ctrl.RecipientInfo("bruce-schneier@secure.com", "", null, true);
		assertEquals("Bruce", r7.getEditableContact().firstName());
		assertEquals("Schneier", r7.getEditableContact().lastName());


        assertFalse( r7.hasPhoneNumberChanged());
        assertFalse( r7.hasPasswordChanged());
        r7.getEditableContact().update();
        assertFalse( r7.hasPhoneNumberChanged());
        assertFalse( r7.hasPasswordChanged());

        r7.getEditableContact().presharedPassword("abc");
        assertTrue( r7.hasPasswordChanged());
        assertEquals(null, r7.getContactWrapper().getContact().getPresharedPassword() );

        r7.getEditableContact().update();
        assertEquals("abc",  r7.getEditableContact().presharedPassword() );
        assertEquals("abc", r7.getContactWrapper().getContact().getPresharedPassword() );


        var contactPhoneNumber = new tutao.entity.tutanota.ContactPhoneNumber(r7.getContactWrapper().getContact());
        contactPhoneNumber.setNumber("015777777777");
        contactPhoneNumber.setType("0");
        contactPhoneNumber.setCustomTypeName("");

        r7.getEditableContact().phoneNumbers.push( new tutao.entity.tutanota.ContactPhoneNumberEditable(contactPhoneNumber));

        assertTrue( r7.hasPhoneNumberChanged());
        r7.getEditableContact().update();
        assertFalse( r7.hasPhoneNumberChanged());
        assertEquals("015777777777", r7.getContactWrapper().getContact().getPhoneNumbers()[0].getNumber());

	}
});
