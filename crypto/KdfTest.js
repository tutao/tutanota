"use strict";

goog.provide('KdfTest');

var KdfTest = AsyncTestCase("KdfTest");

KdfTest.prototype._getFacade = function() {
	return tutao.locator.kdfCrypter;
};

KdfTest.prototype.testGenerateRandomSalt = function(queue) {
	var facade = this._getFacade();
	var salt1 = facade.generateRandomSalt();
	var salt2 = facade.generateRandomSalt();
	assertTrue(salt1 !== salt2);
	assertEquals(32, salt1.length); // 16 bytes in hex
	assertEquals(32, salt2.length);
};

KdfTest.prototype.testCreateKeyFromPassphrase = function(queue) {
	queue.call('test', function(callbacks) {
		var facade = this._getFacade();
		var salt1 = facade.generateRandomSalt();
		var salt2 = facade.generateRandomSalt();
		facade.generateKeyFromPassphrase("hello", salt1, callbacks.add(function(key1Hex) {
			facade.generateKeyFromPassphrase("hello", salt1, callbacks.add(function(key2Hex) {
				facade.generateKeyFromPassphrase("hello", salt2, callbacks.add(function(key3Hex) {
					facade.generateKeyFromPassphrase("hellohello", salt1, callbacks.add(function(key4Hex) {
						// make sure the same password and salt result in the same key
						assertEquals(key1Hex, key2Hex);
						// make sure a different password or different key result in different keys
						assertFalse(key1Hex === key3Hex);
						assertFalse(key1Hex === key4Hex);
						// test the key length to be 128 bit
						assertEquals(32, key1Hex.length); // same as key2Hex
						assertEquals(32, key3Hex.length);
						assertEquals(32, key4Hex.length);
					}));
				}));
			}));
		}));
	});
};

KdfTest.prototype.testPassphrases = function(queue) {
	queue.call('test', function(callbacks) {
		var facade = this._getFacade();
		var salt = "01020304050607080900010203040506";
		// this test data comes from BcryptTest.java
		var pairs = [{pw: "?", hash: "1e7447ccd47774a9b9bfa13d307b5355"},
		{pw: "%", hash: "abbf0e47605555ab71808822b251fa69"},
//		{pw: "€uropa", hash: "41bda43b1f703db427e5f55db608fb89"}, // TODO enable as soon as the test framework supports utf8
		{pw: "?uropa", hash: "9322559c5ac2f7ae3981eb82fd86e25d"},
		for ( var i = 0; i < pairs.length; i++) {
			(function() {
				var position = i;
				facade.generateKeyFromPassphrase(pairs[position].pw, salt, callbacks.add(function(hexKey) {
					assertEquals(pairs[position].hash, hexKey);
				}));
			})();
		}
	});
};


