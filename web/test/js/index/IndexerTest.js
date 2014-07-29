"use strict";

describe("IndexerTest", function () {

    var assert = chai.assert;
    JsMockito.Integration.importTo(window);

    beforeEach(function () {
        // we have to mock getUserClientKey because the indexer calls it
        var userClientKey = tutao.locator.aesCrypter.generateRandomKey();
        tutao.locator.userController.getUserClientKey = function () {
            return userClientKey;
        };
    });


    afterEach(function () {
        tutao.locator.reset();
        tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
    });


    it(" removes special characters from string", function () {
        // jstestdriver does not support utf8, so we can not test characters like ß, umlaute, etc.
        assert.equal("hEl lo  W4 ss", tutao.locator.indexer.removeSpecialCharactersFromText("hEl%lo. W4=ss"));
    });

    it(" getSearchIndexWordsFromText", function () {
        assert.deepEqual(["hel", "lo", "w4", "ss"], tutao.locator.indexer.getSearchIndexWordsFromText("hEl%lo. W4=ss"));
    });

    it(" that mails are correctly indexed", function () {
        // mock dao
        var callCount = 0;
        tutao.locator.dao.getLastIndexed = function (typeId, callback) {
            // function is called twice at the beginning
            if (callCount <= 1) {
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS, "200");
            } else {
                assert.fail();
            }
        };
        tutao.locator.dao.addIndexEntries = function (typeId, attributeIds, elementId, values, callback) {
            // should be called once
            if (callCount == 2) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.SUBJECT_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["these", "5", "words", "are", "great", "love", "them"].sort(), values.sort());
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else if (callCount == 3) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.SENDER_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["bob"], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else if (callCount == 4) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.TORECIPIENTS_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["alice", "carol"], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else if (callCount == 5) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.STATE_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual([2], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else if (callCount == 6) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.UNREAD_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["1"], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else if (callCount == 7) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.TRASHED_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["1"], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else if (callCount == 8) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.Mail.prototype.BODY_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["12345"], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else {
                assert.fail();
            }
        };
        tutao.locator.dao.setIndexed = function (typeId, elementId, callback) {
            if (callCount == 9) {
                assert.equal(tutao.entity.tutanota.Mail.prototype.TYPE_ID, typeId);
                assert.equal("1300", elementId);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else {
                assert.fail();
            }
        };

        // mock crypter
        tutao.locator.aesCrypter.encryptUtf8Index = function (key, text) {
            return text;
        };
        tutao.locator.aesCrypter.decryptUtf8Index = function (key, text) {
            return text;
        };

        // create a mail that shall be tried to be indexed and let it be returned when loadMail() is called
        var mail = new tutao.entity.tutanota.Mail();
        mail.setSubject("These 5 words ARE great words! love them.");
        var sender = new tutao.entity.tutanota.MailAddress(mail);
        sender.setName("Bob");
        sender.setAddress("bob@tutanota.de");
        mail.setSender(sender);
        var mailAddress1 = new tutao.entity.tutanota.MailAddress(mail);
        mailAddress1.setName("Alice");
        mailAddress1.setAddress("alice@tutanota.de");
        mail.getToRecipients().push(mailAddress1);
        var mailAddress2 = new tutao.entity.tutanota.MailAddress(mail);
        mailAddress2.setName("Carol");
        mailAddress2.setAddress("carol@tutanota.de");
        mail.getCcRecipients().push(mailAddress2);
        mail.setBody("12345");
        mail.setState(tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED);
        mail.setUnread(true);
        mail.setTrashed(true);
        mail.__id = ["1", "100"]; // set a fake id

        // mock loadMail
        var mailLoader = function (id) {
            return Promise.resolve(mail);
        };
        tutao.locator.replaceStatic(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.load, mailLoader);

        // the mail should not be indexed because the id is smaller than "200)
        var callback = mockFunction();
        tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.Mail.prototype.TYPE_ID, [mail.getId()], callback);
        verify(callback)(null);

        mail.__id = ["1", "1300"]; // set a fake id
        // now it should be indexed
        tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.Mail.prototype.TYPE_ID, [mail.getId()], function (id) {
            assert.deepEqual(["1", "1300"], id);
            assert.equal(10, callCount);
            done();
        });
    });

    it(" that mail bodys are correctly indexed", function () {
        // mock dao
        var callCount = 0;
        tutao.locator.dao.getLastIndexed = function (typeId, callback) {
            // function is called twice at the beginning
            if (callCount == 0) {
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS, null);
            } else {
                assert.fail();
            }
        };
        tutao.locator.dao.addIndexEntries = function (typeId, attributeIds, elementId, values, callback) {
            // should be called once
            if (callCount == 1) {
                assert.equal(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, typeId);
                assert.deepEqual([tutao.entity.tutanota.MailBody.prototype.TEXT_ATTRIBUTE_ID], attributeIds);
                assert.deepEqual(["only", "three", "words"], values);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else {
                assert.fail();
            }
        };
        tutao.locator.dao.setIndexed = function (typeId, elementId, callback) {
            if (callCount == 2) {
                assert.equal(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, typeId);
                assert.equal("400", elementId);
                callCount++;
                callback(tutao.db.DbInterface.STATUS_SUCCESS);
            } else {
                assert.fail();
            }
        };

        // mock crypter
        tutao.locator.aesCrypter.encryptUtf8Index = function (key, text) {
            return text;
        };
        tutao.locator.aesCrypter.decryptUtf8Index = function (key, text) {
            return text;
        };

        var mailBody = new tutao.entity.tutanota.MailBody();
        mailBody.setText("Only three.WoRdS!");
        mailBody.__id = "400"; // set a fake id

        var mailBodyLoader = function (id) {
            return Promise.resolve(mailBody);
        };
        tutao.locator.replaceStatic(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.load, mailBodyLoader);

        // now it should be indexed
        tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, [mailBody.getId()], function (id) {
            assert.equal(mailBody.getId(), id);

            assert.equal(3, callCount);
            done();
        });

    });

    it(" getElementsByValues", function () {
        // mock dao
        tutao.locator.dao.getElementsByValue = function (typeId, attributeIds, value, callback) {
            if (value == "1") {
                callback(tutao.db.DbInterface.STATUS_SUCCESS, ["100", "200", "500"]);
            } else if (value == "2") {
                callback(tutao.db.DbInterface.STATUS_SUCCESS, ["400", "200"]);
            }
        };

        // mock crypter
        tutao.locator.aesCrypter.encryptUtf8Index = function (key, text) {
            return text;
        };

        var callbackCalled = false;
        tutao.locator.indexer.getElementsByValues(0, [1], ["1", "2"], function (ids) {
            assert.deepEqual(["100", "200", "400", "500"], ids.sort());
            callbackCalled = true;
        });
        assert.isTrue(callbackCalled);
    });

});