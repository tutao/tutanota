"use strict";

AsyncTestCase("ComposingMailTest", {
	setUp: function() {
	},
	tearDown: function() {
		tutao.locator.reset();
		tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	},
	"test send unsecure mail preconditions": function(queue) {
		queue.call('test', function(callbacks) {
			tutao.locator.replaceStatic(tutao.tutanota.ctrl.ComposingMail, tutao.tutanota.ctrl.ComposingMail._getContacts, function() { return []; });
			tutao.locator.languageViewModel.setCurrentLanguage("en");
			// stub the MailView
			tutao.locator.mailView = {};
			tutao.locator.mailView.isMailListColumnVisible = function() {return true;};
			tutao.locator.mailBoxController._properties = new tutao.entity.tutanota.TutanotaProperties();
			var cm = new tutao.tutanota.ctrl.ComposingMail(tutao.entity.tutanota.TutanotaConstants.CONVERSATION_TYPE_NEW , null);
			cm.secure(false);
			tutao.tutanota.gui.alert = callbacks.add(function(text) {
				assertEquals("Please enter the email address of your recipient.", text);
				cm.addToRecipient(new tutao.tutanota.ctrl.RecipientInfo("a@tutanota.de", "Name", null));
				tutao.tutanota.gui.alert = callbacks.add(function(text) {
					assertEquals("Please enter a subject.", text);
					cm.composerSubject("TestSubject");
					var file1 = new tutao.entity.tutanota.File();
					file1.setName("n1");
					file1.setSize(15000000 +"");
					file1.setMimeType("text/plain");
					var data1 = new ArrayBuffer(15000000);
					var dataFile1 = new tutao.tutanota.util.DataFile(data1, file1);
					cm._attachments.push(dataFile1);
					var file2 = new tutao.entity.tutanota.File();
					file2.setName("n2");
					file2.setSize(15000000 +"");
					file2.setMimeType("text/plain");
					var data2 = new ArrayBuffer(15000000);
					var dataFile2 = new tutao.tutanota.util.DataFile(data2, file2);
					cm._attachments.push(dataFile2);
					tutao.tutanota.gui.alert = callbacks.add(function(text) {
						assertEquals("The maximum message size of 25 MB to insecure external recipients is exceeded.", text);
					});
					cm.sendMail(null);
				});
				cm.sendMail(null);
			});
			cm.sendMail(null);
		});
	}
});
