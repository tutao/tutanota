"use strict";

goog.provide('ContactWrapperTest');

TestCase("ContactWrapperTest", {
	
	"testGetContact": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = new tutao.entity.tutanota.ContactWrapper(c);
		assertEquals(c.toJsonData(), w.getContact().toJsonData());
	},
	
	"testGetFullName": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = new tutao.entity.tutanota.ContactWrapper(c);
		c.setFirstName("");
		c.setLastName("");
		assertEquals("", w.getFullName());
		c.setFirstName("Ab");
		assertEquals("Ab", w.getFullName());
		c.setLastName("cd");
		assertEquals("Ab cd", w.getFullName());
		c.setFirstName("");
		assertEquals("cd", w.getFullName());
	},
	
	"testGetAge": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = new tutao.entity.tutanota.ContactWrapper(c);
		c.setBirthday(new Date());
		assertEquals(0, w.getAge());
		var date = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * 365 * 5 - 1);
		c.setBirthday(date);
		assertEquals(5, w.getAge());
	},

	"testGetMailAddressTypeName": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactMailAddress(c);
		c.getMailAddresses().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_PRIVATE);
		assertEquals("private", w.getMailAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_WORK);
		assertEquals("work", w.getMailAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
		assertEquals("other", w.getMailAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getMailAddressTypeName(m));
		
		// check that no type is missing
		assertEquals(4, tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_NAMES().length);
	},
	
	"testGetAddressTypeName": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactAddress(c);
		c.getAddresses().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE);
		assertEquals("private", w.getAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_WORK);
		assertEquals("work", w.getAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_OTHER);
		assertEquals("other", w.getAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getAddressTypeName(m));
		
		// check that no type is missing
		assertEquals(4, tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_NAMES().length);
	},
	
	"testGetPhoneNumberTypeName": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactPhoneNumber(c);
		c.getPhoneNumbers().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE);
		assertEquals("private", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE);
		assertEquals("mobile", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_FAX);
		assertEquals("fax", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK);
		assertEquals("work", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_OTHER);
		assertEquals("other", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getPhoneNumberTypeName(m));
		
		// check that no type is missing
		assertEquals(6, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_NAMES().length);
	},
	
	"testGetSocialIdTypeName": function() {
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactSocialId(c);
		c.getSocialIds().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_TWITTER);
		assertEquals("twitter", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_FACEBOOK);
		assertEquals("facebook", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_XING);
		assertEquals("xing", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKED_IN);
		assertEquals("linked in", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_OTHER);
		assertEquals("other", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getSocialIdTypeName(m));
		
		// check that no type is missing
		assertEquals(6, tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_NAMES().length);
	},
	
	"testStartStopEditingContact": function() {
		tutao.entity.tutanota.ContactWrapper._editableContactsCache = [];
		var c1 = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();
		var c2 = tutao.entity.tutanota.ContactWrapper.createEmptyContactWrapper();
		var editor1 = "editor1";
		var editor2 = "editor2";
		var c1Editable = c1.startEditingContact(editor1);
		assertTrue(c1Editable == c1.startEditingContact(editor2));
		c1.stopEditingContact(editor1);
		c1.stopEditingContact(editor1);
		assertTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 0);
		
		var c1NewEditable = c1.startEditingContact(editor1);
		assertFalse(c1Editable == c1NewEditable);
		assertTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
		var c2Editable = c2.startEditingContact(editor1);
		assertFalse(c2Editable == c1NewEditable);
		assertTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 2);
		c1.stopEditingContact(editor1);
		assertTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 1);
		c2.stopEditingContact(editor1);
		assertTrue(tutao.entity.tutanota.ContactWrapper._editableContactsCache.length == 0);
	}
});
