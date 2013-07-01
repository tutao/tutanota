"use strict";

goog.provide('SendMailFacadeMaskNumberTest');

var SendMailFacadeMaskNumberTest = TestCase("SendMailFacadeMaskNumberTest");

SendMailFacadeMaskNumberTest.prototype.test = function() {
	assertEquals("+49123XXXX890", tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber("+491234567890"));
	assertEquals("+491XXX567", tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber("+491234567"));
	assertEquals("XXX123", tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber("+49123"));
	assertEquals("XXX12", tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber("+4912"));
	assertEquals("XX91", tutao.tutanota.ctrl.SendMailFacade._getMaskedNumber("+491"));
};
