"use strict";

goog.provide('FormatterTest');

TestCase("FormatterTest", {
	
	"test formatDate": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("de");
		assertEquals("7. Dez 2011", tutao.tutanota.util.Formatter.formatDate(new Date(2011, 11, 7, 4, 3, 2)));
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		assertEquals("7. Dec 2011", tutao.tutanota.util.Formatter.formatDate(new Date(2011, 11, 7, 4, 3, 2)));
		assertEquals("12. Dec 2011", tutao.tutanota.util.Formatter.formatDate(new Date(2011, 11, 12, 4, 3, 2)));
		assertTrue(tutao.tutanota.util.Formatter.formatDate(new Date()).length <= 7); // no year
	},
	
	"test formatFullDateTime": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("de");
		assertEquals("7. Dez 2011 04:03", tutao.tutanota.util.Formatter.formatFullDateTime(new Date(2011, 11, 7, 4, 3, 2)));
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		assertEquals("7. Dec 2011 04:03", tutao.tutanota.util.Formatter.formatFullDateTime(new Date(2011, 11, 7, 4, 3, 2)));
		assertTrue(tutao.tutanota.util.Formatter.formatFullDateTime(new Date()).length >= 17); // including year
	},
	
	"test formatDateTime": function() {
		tutao.locator.languageViewModel.setCurrentLanguage("de");
		assertEquals("Mi 7. Dez 2011 04:03", tutao.tutanota.util.Formatter.formatDateTime(new Date(2011, 11, 7, 4, 3, 2)));
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		assertEquals("We 7. Dec 2011 04:03", tutao.tutanota.util.Formatter.formatDateTime(new Date(2011, 11, 7, 4, 3, 2)));
		assertTrue(tutao.tutanota.util.Formatter.formatDateTime(new Date()).length <= 16); // no year
	},
	"test formatDateTimeFromYesterdayOn": function() {
		// the day before yesterday
		var today = new Date();
		today.setHours(5);
		today.setMinutes(30);
		
		var day = 1000*60*60*24;
		var yesterday = new Date(today.getTime() - day);
		var theDayBeforeYesterday = new Date(today.getTime() - day * 2);
		
		tutao.locator.languageViewModel.setCurrentLanguage("de");
		assertEquals(tutao.tutanota.util.Formatter.formatDateTime(theDayBeforeYesterday), tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(theDayBeforeYesterday));
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		assertEquals(tutao.tutanota.util.Formatter.formatDateTime(theDayBeforeYesterday), tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(theDayBeforeYesterday));
		
		// yesterday
		tutao.locator.languageViewModel.setCurrentLanguage("de");
		assertEquals("gestern 05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(yesterday));
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		assertEquals("yesterday 05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(yesterday));
		
		// today
		tutao.locator.languageViewModel.setCurrentLanguage("de");
		assertEquals("05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(today));
		tutao.locator.languageViewModel.setCurrentLanguage("en");
		assertEquals("05:30", tutao.tutanota.util.Formatter.formatDateTimeFromYesterdayOn(today));
	},
	
	"test dateToSimpleString": function() {
		assertEquals("12.02.1973", tutao.tutanota.util.Formatter.dateToSimpleString(new Date(1973, 1, 12, 0, 0, 0)));
		assertEquals("12.02.1968", tutao.tutanota.util.Formatter.dateToSimpleString(new Date(1968, 1, 12, 0, 0, 0)));
	},
	
	"test dateToDashString": function() {
		assertEquals("1973-02-12", tutao.tutanota.util.Formatter.dateToDashString(new Date(1973, 1, 12, 0, 0, 0)));
		assertEquals("1968-02-12", tutao.tutanota.util.Formatter.dateToDashString(new Date(1968, 1, 12, 0, 0, 0)));
	},

	"test simpleStringToDate": function() {
		assertEquals(new Date(1973, 1, 12, 0, 0, 0), tutao.tutanota.util.Formatter.simpleStringToDate("12.02.1973"));
		assertEquals(new Date(1968, 1, 12, 0, 0, 0), tutao.tutanota.util.Formatter.simpleStringToDate("12.02.1968"));
		assertEquals(new Date(1968, 1, 2, 0, 0, 0), tutao.tutanota.util.Formatter.simpleStringToDate("2.02.1968"));
		assertEquals(new Date(1968, 1, 12, 0, 0, 0), tutao.tutanota.util.Formatter.simpleStringToDate("12.2.1968"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("1a.02.123"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.a2.1968"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.02.1a68"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("00.02.1968"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.00.1968"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.00.0000"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("32.02.1968"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.13.1968"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.11.-239"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("11.11"));
		assertNull(tutao.tutanota.util.Formatter.simpleStringToDate("1111"));
	},
	
	"test isMailAddress": function() {
		// test valid adresses
		assertTrue(tutao.tutanota.util.Formatter.isMailAddress("a@b.de"));
		assertTrue(tutao.tutanota.util.Formatter.isMailAddress("a@hello.c"));
		assertTrue(tutao.tutanota.util.Formatter.isMailAddress("a.b@hello.de"));
		// test uppercase
		assertTrue(tutao.tutanota.util.Formatter.isMailAddress("A@b.hello.de"));
		// test missing parts
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("@b.hello.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("batello.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ba@tello"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("@hello.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("a@@hello.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("a@h@hello.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("aa@."));
		// test empty adresses
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress(""));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress(" "));
		// test space at any place
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress(" ab@cd.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("a b@cb.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab @cb.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@ cd.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@c b.de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd .de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd. de"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd.d e"));
		assertFalse(tutao.tutanota.util.Formatter.isMailAddress("ab@cd.de "));
	},
	
	"test isValidTutanotaLocalPart": function() {
		// test valid adresses
		assertTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("abcd"));
		assertTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a.cd"));
		assertTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a_cd"));
		assertTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a-cd"));
		assertTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("-_.a"));
		// test invalid characters
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab,c"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab@c"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab?c"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("ab c"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a..c"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("a...c"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(".abc"));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("abc."));
		// test that only non-empty strings are required
		assertTrue(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart("abc"));
		// test empty adresses
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(""));
		assertFalse(tutao.tutanota.util.Formatter.isValidTutanotaLocalPart(" "));
	},
	
	"test stringToNameAndMailAddress": function() {
		// test valid strings
		assertEquals({name: "", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" a@b.de "));
		assertEquals({name: "", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" <a@b.de > "));
		assertEquals({name: "Aas Bos", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos a@b.de"));
		assertEquals({name: "Aas Bos", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos  <a@b.de>"));
		assertEquals({name: "Aas Bos", mailAddress: "a@b.de"}, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos<a@b.de>"));
		// test invalid strings
		assertEquals(null, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos  <a@de>"));
		assertEquals(null, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos "));
		assertEquals(null, tutao.tutanota.util.Formatter.stringToNameAndMailAddress(" Aas Bos  a@de"));
	},
	
	"test formatFileSize": function() {
		assertEquals("0 B", tutao.tutanota.util.Formatter.formatFileSize(0));
		assertEquals("1 B", tutao.tutanota.util.Formatter.formatFileSize(1));
		assertEquals("999 B", tutao.tutanota.util.Formatter.formatFileSize(999));
		assertEquals("0.9 KB", tutao.tutanota.util.Formatter.formatFileSize(1000));
		assertEquals("1 KB", tutao.tutanota.util.Formatter.formatFileSize(1024));
		assertEquals("999 KB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 999));
		assertEquals("0.9 MB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024 - 1));
		assertEquals("1 MB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024));
		assertEquals("1 GB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024 * 1024));
		assertEquals("1 TB", tutao.tutanota.util.Formatter.formatFileSize(1024 * 1024 * 1024 * 1024));
	},
	
	"test getCleanedPhoneNumber": function() {
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+4951153335321"));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber(" +4951153335321 "));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0511 5333 532-1"));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0511/53335321"));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0511/533353/21"));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0511-533353-21"));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0049 51153335321"));
		assertEquals("+4951153335321", tutao.tutanota.util.Formatter.getCleanedPhoneNumber("(0511)53335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("4951153335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("0004951153335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("++4951153335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115_3335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115+3335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115a3335321"));
		assertEquals(null, tutao.tutanota.util.Formatter.getCleanedPhoneNumber("+495115/333/5321a"));
	},
	
	"test isGermanMobilePhoneNumber": function() {
		assertTrue(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4915753335321"));
		assertTrue(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4915113335321"));
		assertTrue(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4917953335321"));
		assertFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4919153335321"));
		assertFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+4815753335321"));
		assertFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber(null));
		assertFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+49179533")); // too short
		assertFalse(tutao.tutanota.util.Formatter.isGermanMobilePhoneNumber("+49179533353214444")); // too long
	}
});
