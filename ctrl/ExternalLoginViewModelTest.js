"use strict";

JsHamcrest.Integration.JsTestDriver();
JsMockito.Integration.JsTestDriver();

TestCase("ExternalLoginViewModel", {

	setUp: function() {
		tutao.locator.replaceStatic(tutao.entity.tutanota.PasswordChannelService, tutao.entity.tutanota.PasswordChannelService.load, mockFunction());
		this.vm = new tutao.tutanota.ctrl.ExternalLoginViewModel();
		this.vm.storePassword(false);
	},
	tearDown: function() {
		tutao.locator.reset();
		tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	},
	"test that setup loads phone numbers": function() {
		var mailRef = "abcde";
		
		var refLoader = spy(function(parameters, headers, callback) {
			assertEquals({"id": mailRef}, parameters);
			assertNull(headers);
			var ref = new tutao.entity.tutanota.ExternalMailReferenceService();
			ref.setUserId("u");
			ref.setAuthToken("a");
			ref.setSalt("s");
			ref.setMail(["mL", "m"]);
			callback(ref, null);
		});
		tutao.locator.replaceStatic(tutao.entity.tutanota.ExternalMailReferenceService, tutao.entity.tutanota.ExternalMailReferenceService.load, refLoader);
		
		var phoneNumber = new tutao.entity.tutanota.PasswordChannelPhoneNumber();
		var loader = spy(function(parameters, headers, callback) {
			assertEquals({}, parameters);
			// check only the headers that are send to the service
			var p = {authToken: "a", mailList: "mL", mail: "m"};
			assertEquals(p, headers);
			var ret = new tutao.entity.tutanota.PasswordChannelService();
			ret.getPhoneNumberChannels().push(phoneNumber);
			callback(ret, null);
		});
		tutao.locator.replaceStatic(tutao.entity.tutanota.PasswordChannelService, tutao.entity.tutanota.PasswordChannelService.load, loader);
		
		this.vm.setup(mailRef, function() {});
		assertEquals([phoneNumber], this.vm.phoneNumbers());
		assertNull(this.vm.errorMessageId());
		
	},

	"test setup that fails during mail ref load": function() {
		var mailRef = "abcde";
		
		var refLoader = spy(function(parameters, headers, callback) {
			callback(null, "exception");
		});
		tutao.locator.replaceStatic(tutao.entity.tutanota.ExternalMailReferenceService, tutao.entity.tutanota.ExternalMailReferenceService.load, refLoader);

		this.vm.setup(mailRef, function() {});
		assertEquals([], this.vm.phoneNumbers());
		assertNotNull(this.vm.errorMessageId());
	},

	"test setup that fails during phone number load": function() {
		var mailRef = "abcde";
		
		var refLoader = spy(function(parameters, headers, callback) {
			assertEquals({"id": mailRef}, parameters);
			assertNull(headers);
			var ref = new tutao.entity.tutanota.ExternalMailReferenceService();
			ref.setUserId("u");
			ref.setAuthToken("a");
			ref.setSalt("s");
			ref.setMail(["mL", "m"]);
			callback(ref, null);
		});
		tutao.locator.replaceStatic(tutao.entity.tutanota.ExternalMailReferenceService, tutao.entity.tutanota.ExternalMailReferenceService.load, refLoader);

		var loader = function(parameters, headers, callback) {
			callback(null, "exception");
		};
		tutao.locator.replaceStatic(tutao.entity.tutanota.PasswordChannelService, tutao.entity.tutanota.PasswordChannelService.load, loader);
		
		this.vm.setup(mailRef, function() {});
		assertEquals([], this.vm.phoneNumbers());
		assertNotNull(this.vm.errorMessageId());
	},
	
	"test sending of sms" : function() {
		// TODO currently not testable as we create a new instance of PasswordMessagingService. Maybe a single generic DAO would fit better? 
	},
	
	"test displaying the mail": function() {
		var mailRef = "abcde";
		
		var refLoader = spy(function(parameters, headers, callback) {
			assertEquals({"id": mailRef}, parameters);
			assertNull(headers);
			var ref = new tutao.entity.tutanota.ExternalMailReferenceService();
			ref.setUserId("u");
			ref.setAuthToken("a");
			ref.setSalt("s");
			ref.setMail(["mL", "m"]);
			callback(ref, null);
		});
		tutao.locator.replaceStatic(tutao.entity.tutanota.ExternalMailReferenceService, tutao.entity.tutanota.ExternalMailReferenceService.load, refLoader);
		this.vm.setup(mailRef, function() {});
		this.vm.password("12345678");
		tutao.locator.replace("mailViewModel", mock(tutao.tutanota.ctrl.MailViewModel));
		
		tutao.locator.userController.loginExternalUser = function(userGroupId, password, saltHex, authToken, callback) {
			callback();
		};

		var mail = {loadBody: function(callback) {
			callback({getText: function() {
				return "body";
			}});
		}, getState: function() {
			return tutao.entity.tutanota.TutanotaConstants.MAIL_STATE_SENT;
		}, loadAttachments: function() {
			// nothing to do
		}};

		var mailLoader = function(parameters, callback) {
			assertEquals(["mL", "m"], parameters);
			callback(mail, null);
		};
		tutao.locator.replaceStatic(tutao.entity.tutanota.Mail, tutao.entity.tutanota.Mail.load, mailLoader);
		var viewManager = mock(tutao.tutanota.ctrl.ViewManager);
		tutao.locator.replace("viewManager", viewManager);
		var mailView = { isForInternalUserOnly: function() { return false; }, getMailsScroller: function() { return false; }};
		tutao.locator.replace("mailView", mailView);

		this.vm.showMail(mail);

		verify(tutao.locator.mailViewModel.showMail)(mail); // invoked indirectly by the navigator
	}
});
