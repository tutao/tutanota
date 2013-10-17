"use strict";

TestCase("MailViewModelTest", {
	vm: new tutao.tutanota.ctrl.MailViewModel(),
	tearDown: function() {
		tutao.locator.reset();
		tutao.locator.randomizer.addEntropy(1, 256, tutao.crypto.RandomizerInterface.ENTROPY_SRC_MOUSE);
	},
//	"test setting a conversation": function() {
//		tutao.locator.mailView = {};
//		var refresh = mockFunction();
//		tutao.locator.mailView.getMailsScroller = function() {
//			return { refresh: refresh, scrollTo: mockFunction()};
//		};
//		
//		// only the body is loaded by the view model
//		var body = new tutao.entity.tutanota.MailBody();
//		body.setText("");
//		var mail = new tutao.entity.tutanota.Mail();
//		mail.setBody(body.getId());
//		mail.setSubject("test");
//		
//		var mailBodyLoad = function(id, callback) {
//			callback(body);
//		};
//		tutao.locator.replaceStatic(tutao.entity.tutanota.MailBody, tutao.entity.tutanota.MailBody.load, mailBodyLoad);
//		
//		this.vm.showMail(mail);
//
//		assertEquals(mail, this.vm.conversation()[0].mail());
//		assertEquals(body, this.vm.conversation()[0]._body);
//		verify(refresh)();
//	}
	
});
