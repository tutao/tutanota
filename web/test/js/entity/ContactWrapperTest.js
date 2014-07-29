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
		var date = new Date(new Date().getTime() - 1000 * 60 * 60 * 24 * (365 + 100));
		c.setBirthday(date);
		assertEquals(1, w.getAge());
	},

	"testGetMailAddressTypeName": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactMailAddress(c);
		c.getMailAddresses().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_PRIVATE);
		assertEquals("Private", w.getMailAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_WORK);
		assertEquals("Work", w.getMailAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_OTHER);
		assertEquals("Other", w.getMailAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getMailAddressTypeName(m));
		
		// check that no type is missing
		assertEquals(4, tutao.entity.tutanota.TutanotaConstants.CONTACT_MAIL_ADDRESS_TYPE_NAMES().length);
	},
	
	"testGetAddressTypeName": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactAddress(c);
		c.getAddresses().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_PRIVATE);
		assertEquals("Private", w.getAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_WORK);
		assertEquals("Work", w.getAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_OTHER);
		assertEquals("Other", w.getAddressTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getAddressTypeName(m));
		
		// check that no type is missing
		assertEquals(4, tutao.entity.tutanota.TutanotaConstants.CONTACT_ADDRESS_TYPE_NAMES().length);
	},
	
	"testGetPhoneNumberTypeName": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactPhoneNumber(c);
		c.getPhoneNumbers().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_PRIVATE);
		assertEquals("Private", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_MOBILE);
		assertEquals("Mobile", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_FAX);
		assertEquals("Fax", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_WORK);
		assertEquals("Work", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_OTHER);
		assertEquals("Other", w.getPhoneNumberTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_CUSTOM);
		m.setCustomTypeName("something");
		assertEquals("something", w.getPhoneNumberTypeName(m));
		
		// check that no type is missing
		assertEquals(6, tutao.entity.tutanota.TutanotaConstants.CONTACT_PHONE_NUMBER_TYPE_NAMES().length);
	},
	
	"testGetSocialIdTypeName": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		var c = new tutao.entity.tutanota.Contact();
		var w = tutao.entity.tutanota.ContactWrapper;
		var m = new tutao.entity.tutanota.ContactSocialId(c);
		c.getSocialIds().push(m);
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_TWITTER);
		assertEquals("Twitter", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_FACEBOOK);
		assertEquals("Facebook", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_XING);
		assertEquals("Xing", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_LINKED_IN);
		assertEquals("Linked in", w.getSocialIdTypeName(m));
		m.setType(tutao.entity.tutanota.TutanotaConstants.CONTACT_SOCIAL_ID_TYPE_OTHER);
		assertEquals("Other", w.getSocialIdTypeName(m));
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
