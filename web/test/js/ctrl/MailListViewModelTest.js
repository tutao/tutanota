"use strict";

describe("MailListViewModelTest", function () {

    var assert = chai.assert;
    JsMockito.Integration.importTo(window);

    beforeEach(function () {
        var stub = new tutao.rest.EntityRestCache();
        stub.setTarget(new tutao.rest.EntityRestDummy());
        tutao.locator.replace('entityRestClient', stub);
        tutao.locator.userController.getLoggedInUser = mockFunction();
        tutao.locator.userController.getUserGroupKey = mockFunction();
        tutao.locator.userController.getUserClientKey = mockFunction();
        tutao.locator.userController.getUserId = mockFunction();
        var user = new tutao.entity.sys.User();
        user.__id = "10";
        var gm = new tutao.entity.sys.GroupMembership(user);
        gm.setGroup("500"); // only the user group id is accessed in the test cases, so we do not need to set other attributes
        user.setUserGroup(gm);

        when(tutao.locator.userController.getLoggedInUser)().thenReturn(user);
        var userGroupKey = tutao.locator.aesCrypter.generateRandomKey();
        when(tutao.locator.userController.getUserGroupKey)().thenReturn(userGroupKey);
        when(tutao.locator.userController.getUserId)().thenReturn(user.getId());
        // we have to set the user client key, because the indexer is used in test
        var userClientKey = tutao.locator.aesCrypter.generateRandomKey();
        when(tutao.locator.userController.getUserClientKey)().thenReturn(userClientKey);

        tutao.locator.mailBoxController.getUserMailBox = mockFunction();
        when(tutao.locator.mailBoxController.getUserMailBox)().thenReturn({getMails: function () {
            return "100"
        }});

        tutao.tutanota.gui.setSearchStatus = mockFunction();
        tutao.tutanota.gui.unselect = mockFunction();

        // mock view functions
        tutao.locator.mailView = {};
        tutao.locator.mailView.showDefaultColumns = mockFunction();
        tutao.locator.mailView.showConversationColumn = mockFunction();
        tutao.locator.mailView.getMailListDomElement = mockFunction();
        tutao.locator.mailView.hideConversation = mockFunction();

        this.vm = new tutao.tutanota.ctrl.MailListViewModel();
    });

    afterEach(function () {
        tutao.locator.reset();
        tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
    });

    it(" on select, dom elements are (un)marked as selected, the conversation gets set and the mails are marked as read", function () {

        tutao.tutanota.gui.unselect = mockFunction();
        tutao.tutanota.gui.select = mockFunction();
        tutao.locator.replace('mailViewModel', {});
        tutao.locator.mailViewModel.showMail = mockFunction();
        tutao.locator.mailViewModel.hideMail = mockFunction();
        tutao.locator.mailViewModel.tryCancelAllComposingMails = function () {
            return true;
        };
        tutao.locator.mailViewModel.isComposingState = function () {
            return false;
        };
        tutao.locator.indexer.removeIndexEntries = function (a, b, c, f) {
            f();
        };
        tutao.locator.indexer.addIndexEntries = mockFunction();
        tutao.locator.indexer.getElementsByValues = function (a, b, c, f) {
            f([]);
        };
        tutao.locator.indexer.getLastIndexedId = function (a, f) {
            f(tutao.rest.EntityRestInterface.GENERATED_MIN_ID);
        };

        var self = this;
        return this.vm.init().then(function () {
            var mail = new tutao.entity.tutanota.Mail();
            mail.__id = ["100", "200"];
            mail.setSubject("test");
            mail.setUnread(true);
            self.vm.mails.push(mail);

            self.vm._selectMail(mail, "test", false);
            assert.isFalse(mail.getUnread());

            verify(tutao.tutanota.gui.unselect, never());
            verify(tutao.tutanota.gui.select)(["test"]);
        });
    });

    it(" complete search/filter chain: elements pre-exist, elements are added, search is done, filter is done", function () {
        var self = this;
        if (!tutao.locator.dao.isSupported()) {
            return;
        }
        tutao.tutanota.gui.registerMailLongPress = mockFunction();

        var mail1 = undefined;
        var mail2 = undefined;
        var mail3 = undefined;

        return new Promise(function (resolve, reject) {
            // init database
            tutao.locator.dao.init("test_search_db", function () {
                tutao.locator.dao.clear(function () {
                    resolve();
                });
            });
        }).then(function () {
                // preload and index a mail
                var body1 = new tutao.entity.tutanota.MailBody();
                body1.setText("hello all");
                // call the entity rest client directly because MailBody does not have the setup function
                return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, body1, null, null, null).then(function (returnEntity) {
                    mail1 = new tutao.entity.tutanota.Mail();
                    mail1.setBody(body1.getId());
                    mail1.setSubject("test where");
                    var sender1 = new tutao.entity.tutanota.MailAddress(mail1);
                    sender1.setName("arm");
                    sender1.setAddress("bein@tutanota.de");
                    mail1.setSender(sender1);
                    mail1.setState(tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED);
                    mail1.setUnread(true);
                    mail1.setTrashed(false);
                    return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, mail1, tutao.locator.mailBoxController.getUserMailBox().getMails(), null, null).then(function (returnEntity) {
                        return new Promise(function (resolve, reject) {
                            tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.Mail.prototype.TYPE_ID, [mail1.getId()], function (mailIndexedId) {
                                assert.equal(mail1.getId(), mailIndexedId);
                                tutao.locator.indexer.tryIndexElements(tutao.entity.tutanota.MailBody.prototype.TYPE_ID, [body1.getId()], function (bodyIndexedId) {
                                    assert.equal(body1.getId(), bodyIndexedId);
                                    resolve(self.vm.init().then(function () {
                                        assert.deepEqual([mail1], self.vm.mails());
                                    }));
                                });
                            });
                        });
                    });
                }).then(function () {
                    // check add mails
                    var body2 = new tutao.entity.tutanota.MailBody();
                    body2.setText("all the birds");
                    return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, body2, null, null, null).then(function (returnEntity) {
                        mail2 = new tutao.entity.tutanota.Mail();
                        mail2.setBody(body2.getId());
                        mail2.setSubject("hello test where");
                        var sender2 = new tutao.entity.tutanota.MailAddress(mail2);
                        sender2.setName("arm");
                        sender2.setAddress("bein@tutanota.de");
                        mail2.setSender(sender2);
                        mail2.setState(tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED);
                        mail2.setUnread(true);
                        mail2.setTrashed(false);
                        return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, mail2, tutao.locator.mailBoxController.getUserMailBox().getMails(), null, null).then(function (returnEntity) {
                            var body3 = new tutao.entity.tutanota.MailBody();
                            body3.setText("hello all");
                            return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.MailBody.PATH, body3, null, null, null).then(function (returnEntity) {
                                mail3 = new tutao.entity.tutanota.Mail();
                                mail3.setBody(body3.getId());
                                mail3.setSubject("testing where");
                                var sender3 = new tutao.entity.tutanota.MailAddress(mail3);
                                sender3.setName("arm");
                                sender3.setAddress("bein@tutanota.de");
                                mail3.setSender(sender3);
                                mail3.setState(tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_RECEIVED);
                                mail3.setUnread(true);
                                mail3.setTrashed(false);
                                return tutao.locator.entityRestClient.postElement(tutao.entity.tutanota.Mail.PATH, mail3, tutao.locator.mailBoxController.getUserMailBox().getMails(), null, null).then(function (returnEntity) {
                                    self.vm.updateOnNewMails([mail2, mail3]);
                                    assert.deepEqual([mail3, mail2, mail1], self.vm.mails());
                                });
                            });
                        });
                    }).then(function () {
                        //check tag status change
                        // return the changed tag status
                        tutao.locator.tagListViewModel.getTagStatus = function () {
                            return 1;
                        };
                        return self.vm.systemTagActivated(tutao.tutanota.ctrl.TagListViewModel.SENT_TAG_ID).then(function () {
                            assert.deepEqual([], self.vm.mails());
                        });
                    });
                });
            });

    });

});