"use strict";

goog.provide('AesTest');

var AesTest = TestCase("AesTest");

AesTest.prototype._getFacade = function() {
	return tutao.locator.aesCrypter;
};

AesTest.prototype.testgenerateRandomKeyAndHexConversion = function() {
	var facade = this._getFacade();
	var key1Hex = facade.keyToHex(facade.generateRandomKey());
	var key2Hex = facade.keyToHex(facade.generateRandomKey());
	var key3Hex = facade.keyToHex(facade.generateRandomKey());
	// make sure the keys are different
	assertTrue(key1Hex !== key2Hex);
	assertTrue(key1Hex !== key3Hex);
	// test the key length to be 128 bit
	assertEquals(32, key1Hex.length);
	assertEquals(32, key2Hex.length);
	assertEquals(32, key3Hex.length);
	// test conversion
	assertEquals(key1Hex, facade.keyToHex(facade.hexToKey(key1Hex)));
	assertEquals(key2Hex, facade.keyToHex(facade.hexToKey(key2Hex)));
	assertEquals(key3Hex, facade.keyToHex(facade.hexToKey(key3Hex)));
};

AesTest.prototype.testgenerateRandomKeyAndBase64Conversion = function() {
	var facade = this._getFacade();
	var key1Base64 = facade.keyToBase64(facade.generateRandomKey());
	var key2Base64 = facade.keyToBase64(facade.generateRandomKey());
	var key3Base64 = facade.keyToBase64(facade.generateRandomKey());
	// make sure the keys are different
	assertTrue(key1Base64 !== key2Base64);
	assertTrue(key1Base64 !== key3Base64);
	// test the key length to be 128 bit
	assertEquals(24, key1Base64.length);
	assertEquals(24, key2Base64.length);
	assertEquals(24, key3Base64.length);
	// test conversion
	assertEquals(key1Base64, facade.keyToBase64(facade.base64ToKey(key1Base64)));
	assertEquals(key2Base64, facade.keyToBase64(facade.base64ToKey(key2Base64)));
	assertEquals(key3Base64, facade.keyToBase64(facade.base64ToKey(key3Base64)));
};

AesTest.prototype.testEncryptDecryptUtf8 = function() {
	var facade = this._getFacade();
	var key = facade.generateRandomKey();
	var plaintexts = ["", "a", "t?", "ret", "helloworld", "what a nice plaintext!", "€ %^-µ", "long Test that convers many of these nice encryption blocks, so we can check that the block mode works nicely after all"];
	for (var i=0; i<plaintexts.length; i++) {
		this._checkRoundtripUtf8(facade, key, plaintexts[i]);
	}
};

AesTest.prototype.testEncryptDecryptBytes = function() {
	var facade = this._getFacade();
	var key = facade.generateRandomKey();
	var plaintexts = ["", "aa", "5555", "12341234", "123412341234123412341234123412", "12341234123412341234123412341234", "1234123412341234123412341234123412"];
	for (var i=0; i<plaintexts.length; i++) {
		this._checkRoundtripHex(facade, key, plaintexts[i]);
	}
};

AesTest.prototype.testEncryptWithInvalidKey = function() {
	var facade = this._getFacade();
	var key = facade.hexToKey("7878787878");
	assertException(function() {
		facade.encryptUtf8(key, "hello", true);
	}, "CryptoException");
};

AesTest.prototype.testDecryptInvalidData = function() {
	var facade = this._getFacade();
	var key = facade.generateRandomKey();
	assertException(function() {
		facade.decryptUtf8(key, "hello", true);
	}, "CryptoException");
};

AesTest.prototype.testEncryptDecryptAESKey = function() {
	var facade = this._getFacade();
	var key = facade.generateRandomKey();
	var keyToEncrypt = facade.generateRandomKey();
	var encrypted = facade.encryptKey(key, keyToEncrypt);
	// an encrypted key must be one block because no padding or random iv is used
	assertEquals(16, this._getNbrOfBytes(encrypted));
	var decrypted = facade.decryptKey(key, encrypted);
	assertEquals(facade.keyToHex(keyToEncrypt), facade.keyToHex(decrypted));
};

AesTest.prototype.testThatDifferentKeysResultInDifferentCiphertexts = function() {
	var facade = this._getFacade();
	var key1 = facade.generateRandomKey();
	var key2 = facade.generateRandomKey();
	var plain = "hello";
	assertTrue(facade.encryptUtf8(key1, plain, false) !== facade.encryptUtf8(key2, plain, false));
	assertTrue(facade.encryptUtf8(key1, plain, true) !== facade.encryptUtf8(key2, plain, true));
};

AesTest.prototype.testCiphertextLengths = function() {
	var facade = this._getFacade();
	var key = facade.generateRandomKey();
	// check that 15 bytes fit into one block
	assertEquals(16, this._getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcde", false)));
	assertEquals(32, this._getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcde", true)));
	// check that 16 bytes need two blocks (because of one byte padding length info)
	assertEquals(32, this._getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcdef", false)));
	assertEquals(48, this._getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcdef", true)));

	// check that that a non-ascii-character needs two bytes
	// TODO (jstestdriver utf8) enable as soon as jstestdriver supports utf8. currently the 'ä' consumes 4 characters which is not utf8 compatible.
	// http://code.google.com/p/js-test-driver/issues/detail?id=85
	// assertEquals(16, this._getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcä", false)));
	// assertEquals(32, this._getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcdä", false)));
};

AesTest.prototype._getNbrOfBytes = function(base64) {
	return tutao.util.EncodingConverter.base64ToHex(base64).length / 2;
};

AesTest.prototype._checkRoundtripUtf8 = function(facade, key, plain) {
	// with static iv
	var encrypted = facade.encryptUtf8(key, plain, false);
	var encrypted2 = facade.encryptUtf8(key, plain, false);
	var plainAgain = facade.decryptUtf8(key, encrypted, false);
	var plainAgain2 = facade.decryptUtf8(key, encrypted2, false);
	// with random iv
	var encryptedRandomIv = facade.encryptUtf8(key, plain, true);
	var encrypted2RandomIv = facade.encryptUtf8(key, plain, true);
	var plainAgainRandomIv = facade.decryptUtf8(key, encryptedRandomIv, true);
	var plainAgain2RandomIv = facade.decryptUtf8(key, encrypted2RandomIv, true);
	
	// check roundtrip results
	assertEquals(plain, plainAgain);
	assertEquals(plain, plainAgain2);
	assertEquals(plain, plainAgainRandomIv);
	assertEquals(plain, plainAgain2RandomIv);
	
	// check that the ciphertexts are the same with static ivs
	assertTrue(encrypted === encrypted2);
	// check that the ciphertexts are different with random ivs
	assertTrue(encryptedRandomIv !== encrypted2RandomIv);
	// check that the ciphertexts have the same length with random ivs
	assertTrue(encryptedRandomIv.length === encrypted2RandomIv.length);
	// check that the ciphertext is longer with random ivs
	assertTrue(encryptedRandomIv.length > encrypted.length);
};

AesTest.prototype._checkRoundtripHex = function(facade, key, plainHex) {
	// with static iv
	var encrypted = facade.encryptBytes(key, tutao.util.EncodingConverter.hexToBase64(plainHex), false);
	var encrypted2 = facade.encryptBytes(key, tutao.util.EncodingConverter.hexToBase64(plainHex), false);
	var plainAgain = tutao.util.EncodingConverter.base64ToHex(facade.decryptBytes(key, encrypted, false));
	var plainAgain2 = tutao.util.EncodingConverter.base64ToHex(facade.decryptBytes(key, encrypted2, false));
	// with random iv
	var encryptedRandomIv = facade.encryptBytes(key, tutao.util.EncodingConverter.hexToBase64(plainHex), true);
	var encrypted2RandomIv = facade.encryptBytes(key, tutao.util.EncodingConverter.hexToBase64(plainHex), true);
	var plainAgainRandomIv = tutao.util.EncodingConverter.base64ToHex(facade.decryptBytes(key, encryptedRandomIv, true));
	var plainAgain2RandomIv = tutao.util.EncodingConverter.base64ToHex(facade.decryptBytes(key, encrypted2RandomIv, true));
	
	// check roundtrip results
	assertEquals(plainHex, plainAgain);
	assertEquals(plainHex, plainAgain2);
	assertEquals(plainHex, plainAgainRandomIv);
	assertEquals(plainHex, plainAgain2RandomIv);
	
	// check that the ciphertexts are the same with static ivs
	assertTrue(encrypted === encrypted2);
	// check that the ciphertexts are different with random ivs
	assertTrue(encryptedRandomIv !== encrypted2RandomIv);
	// check that the ciphertexts have the same length with random ivs
	assertTrue(encryptedRandomIv.length === encrypted2RandomIv.length);
	// check that the ciphertext is longer with random ivs
	assertTrue(encryptedRandomIv.length > encrypted.length);
};

AesTest.prototype.testEncryptDecryptRsaPrivateKey = function() {
	var facade = this._getFacade();
	var key = facade.generateRandomKey();
	var rsaPrivateKeyHex = "9bb7c919bca728244a4a8c484353a9bc5c752b458c6ea6b5451fab3ccd57c8124ec72654b7477c2a580dd638b45376933c76e6f52f3d770e8ecef7f0fa3d469a5e4e59572ec27ae2b0929943393e4dfa436c62264935bb8bc01769a820babaf30423a915641aa2d847d2f02d118620217e1440fb7a28de34e0ce8ee314333c4065a361baa73fb6eb1caef0dd8fcee0547711fd0d33a9c9e0f84fe689b4f24af0cf78a88cfea596ce217a78d202c908097b125fddb95946658aba2a2ce5ac39d7a7b03346667a14cca80d2775009a1bed9f8c48f8b2e981c4fd94110b4822a58f85ffc16172ae518adfa44e8b02c21b1f7b20f2265cc9bd37b06a4671ea85d9414677e35fec49d116ab30154fd678140613e94a4dcd017e1be64e3095f16f5a313ec94d056573ca32f76a3b99a9b163a5b9e52d1ba3e732ebb9a0dbff879f1746608b204f1df010e0697bce33e7c1d453ff131b4fac2dced3ad786aee14f1ac0cb1c0d991be9d77385d388e4c36f3f5b2727603fa4a0c1892e17158a456cde0e3a5192a1cdb7856c79c8a8502aa3b55f8ffce5b6d7d1f1cb78c9c5363af1b939ca6c1998d0878269b8876be8896fcfb0d92b8d694d218e4878f3a3b11f2089271e755cb7813746e3b04171db4da8159dad7d4079d58f22bf4a84a03f690e0652db6b59743a38ac556351cabdf3979fe74dfbf92553a3b651227bc21d96c5b9069";
	var encrypted = facade.encryptPrivateRsaKey(key, rsaPrivateKeyHex);
	var decrypted = facade.decryptPrivateRsaKey(key, encrypted);
	assertEquals(rsaPrivateKeyHex, decrypted);
};

