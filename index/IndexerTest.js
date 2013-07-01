"use strict";

goog.provide('IndexerTest');

JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();

TestCase("IndexerTest", {
	
	setUp: function() {
		// we have to mock getUserClientKey because the indexer calls it
		tutao.locator.userController.getUserClientKey = mockFunction();
		var userClientKey = tutao.locator.aesCrypter.generateRandomKey();
		when(tutao.locator.userController.getUserClientKey)().thenReturn(userClientKey);
	},
	
	tearDown: function() {
		tutao.locator.reset();
		tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	},
	
	"test removes special characters from string": function() {
		// jstestdriver does not support utf8, so we can not test characters like ß, umlaute, etc.
		assertEquals("hEl lo  W4 ss", tutao.locator.indexer.removeSpecialCharactersFromText("hEl%lo. W4=ss"));
	},
	
	"test getSearchIndexWordsFromText": function() {
		assertEquals(["hel", "lo", "w4", "ss"], tutao.locator.indexer.getSearchIndexWordsFromText("hEl%lo. W4=ss"));
	},

	"test that mails are correctly indexed": function() {
		// mock dao
		var callCount = 0;
		tutao.locator.dao.getLastIndexed = function(typeId, callback) {
			// this function is called twice at the beginning
			if (callCount <= 1) {
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS, "200");
			} else {
				fail();
			}
		};
		tutao.locator.dao.addIndexEntries = function(typeId, attributeIds, elementId, values, callback) {
			// this should be called once
			if (callCount == 2) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.SUBJECT_ATTRIBUTE_ID], attributeIds);
				assertEquals(["these", "5", "words", "are", "great", "love", "them"].sort(), values.sort());
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else if (callCount == 3) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.SENDER_ATTRIBUTE_ID], attributeIds);
				assertEquals(["bob"], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else if (callCount == 4) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.TORECIPIENTS_ATTRIBUTE_ID], attributeIds);
				assertEquals(["alice", "carol"], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else if (callCount == 5) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.STATE_ATTRIBUTE_ID], attributeIds);
				assertEquals([2], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else if (callCount == 6) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.UNREAD_ATTRIBUTE_ID], attributeIds);
				assertEquals(["1"], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else if (callCount == 7) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.TRASHED_ATTRIBUTE_ID], attributeIds);
				assertEquals(["1"], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else if (callCount == 8) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.Mail.prototype.BODY_ATTRIBUTE_ID], attributeIds);
				assertEquals(["12345"], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else {
				fail();
			}
		};
		tutao.locator.dao.setIndexed = function(typeId, elementId, callback) {
			if (callCount == 9) {
				assertEquals(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
				assertEquals("1300", elementId);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else {
				fail();
			}
		};

		// mock crypter
		tutao.locator.aesCrypter.encryptUtf8 = function(key, text, randomIv) {
			return text;
		};
		tutao.locator.aesCrypter.decryptUtf8 = function(key, text, randomIv) {
			return text;
		};
		
		// create a mail that shall be tried to be indexed and let it be returned when loadMail() is called
		var mail = new tutao.entity.tutanota.Mail();
		mail.setSubject("These 5 words ARE great words! love them.");
		var sender = new tutao.entity.tutanota.MailAddress(mail);
		sender.setName("Bob");
		sender.setAddress("bob@tutanota.com");
		mail.setSender(sender);
		var mailAddress1 = new tutao.entity.tutanota.MailAddress(mail);
		mailAddress1.setName("Alice");
		mailAddress1.setAddress("alice@tutanota.com");
		mail.getToRecipients().push(mailAddress1);
		var mailAddress2 = new tutao.entity.tutanota.MailAddress(mail);
		mailAddress2.setName("Carol");
		mailAddress2.setAddress("carol@tutanota.com");
		mail.getCcRecipients().push(mailAddress2);
		mail.setBody("12345");
		mail.setState(tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED);
		mail.setUnread(true);
		mail.setTrashed(true);
		mail.__id = ["1", "100"]; // set a fake id
		
		// mock loadMail
		var mailLoader = function(id, callback) {
			callback(mail);
		};
		tutao.locator.replaceStatic(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.load, mailLoader);

		// the mail should not be indexed because the id is smaller than "200)
		var callback = mockFunction();
		tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.Mail.prototype.TYPE_ID, [mail.getId()], callback);
		verify(callback)(null);
		
		mail.__id = ["1", "1300"]; // set a fake id
		// now it should be indexed
		callback = mockFunction();
		tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.Mail.prototype.TYPE_ID, [mail.getId()], callback);
		verify(callback)(["1", "1300"]);
		
		assertEquals(10, callCount);
	},
	
	"test that mail bodys are correctly indexed": function() {
		// mock dao
		var callCount = 0;
		tutao.locator.dao.getLastIndexed = function(typeId, callback) {
			// this function is called twice at the beginning
			if (callCount == 0) {
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS, null);
			} else {
				fail();
			}
		};
		tutao.locator.dao.addIndexEntries = function(typeId, attributeIds, elementId, values, callback) {
			// this should be called once
			if (callCount == 1) {
				assertEquals(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, typeId);
				assertEquals([tutao.entity.tutanota.MailBody.prototype.TEXT_ATTRIBUTE_ID], attributeIds);
				assertEquals(["only", "three", "words"], values);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else {
				fail();
			}
		};
		tutao.locator.dao.setIndexed = function(typeId, elementId, callback) {
			if (callCount == 2) {
				assertEquals(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, typeId);
				assertEquals("400", elementId);
				callCount++;
				callback(tutao.db.DbInterface.STATUS_SUCCESS);
			} else {
				fail();
			}
		};
		
		// mock crypter
		tutao.locator.aesCrypter.encryptUtf8 = function(key, text, randomIv) {
			return text;
		};
		tutao.locator.aesCrypter.decryptUtf8 = function(key, text, randomIv) {
			return text;
		};

		var mailBody = new tutao.entity.tutanota.MailBody();
		mailBody.setText("Only three.WoRdS!");
		mailBody.__id = "400"; // set a fake id

		var mailBodyLoader = function(id, callback) {
			callback(mailBody);
		};
		tutao.locator.replaceStatic(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.load, mailBodyLoader);

		// now it should be indexed
		var callback = mockFunction();
		tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, [mailBody.getId()], callback);
		verify(callback)(mailBody.getId());
		
		assertEquals(3, callCount);
	},
	
	"test getElementsByValues": function() {
		// mock dao
		tutao.locator.dao.getElementsByValue = function(typeId, attributeIds, value, callback) {
			if (value == "1") {
				callback(tutao.db.DbInterface.STATUS_SUCCESS, ["100", "200", "500"]);
			} else if (value == "2") {
				callback(tutao.db.DbInterface.STATUS_SUCCESS, ["400", "200"]);
			}
		};
		
		// mock crypter
		tutao.locator.aesCrypter.encryptUtf8 = function(key, text, randomIv) {
			return text;
		};
		
		var callbackCalled = false;
		tutao.locator.indexer.getElementsByValues(0, [1], ["1", "2"], function(ids) {
			assertEquals(["100", "200", "400", "500"], ids.sort());
			callbackCalled = true;
		});
		assertTrue(callbackCalled);
	}
});
