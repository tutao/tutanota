"use strict";

goog.provide('ShaTest');

var ShaTest = TestCase("ShaTest");

ShaTest.prototype._getFacade = function() {
	return tutao.locator.shaCrypter;
};

ShaTest.prototype.test = function() {
	var facade = this._getFacade();
	
	assertEquals(tutao.util.EncodingConverter.hexToBase64("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"), facade.hashHex(""));
	assertEquals(tutao.util.EncodingConverter.hexToBase64("ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c"), 
			facade.hashHex(tutao.util.EncodingConverter.utf8ToHex("The quick brown fox jumps over the lazy dog.")));
};
