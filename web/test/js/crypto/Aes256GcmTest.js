"use strict";

describe("Aes256GcmTest", function () {

    var assert = chai.assert;

    var _getFacade = function () {
        return new tutao.crypto.SjclAes256Gcm();
    };

    it("encryptionDecryptionSyncRoundtrip ", function () {
        var facade = _getFacade();
        for (var i = 0; i < compatibilityTestData.aes256GcmTests.length; i++) {
            var td = compatibilityTestData.aes256GcmTests[i];
            var key = facade.hexToKey(td.hexKey);
            if (td.type == "UTF8") {
                var encryptedUtf8 = facade.encryptUtf8(key, td.plainText);
                var decryptedUtf8 = facade.decryptUtf8(key, encryptedUtf8);
                assert.equal(decryptedUtf8, td.plainText);
            } else if (td.type == "BYTES") {
                var encryptedBytes = facade.encryptBytes(key, td.plainText);
                var decryptedBytes = facade.decryptBytes(key, encryptedBytes);
                assert.equal(decryptedBytes, td.plainText);
            } else if (td.type == "AES_KEY") {
                var encryptedKey = facade.encryptKey(key, facade.hexToKey(td.plainText));
                var decryptedKey = facade.decryptKey(key, encryptedKey);
                assert.equal(facade.keyToHex(decryptedKey), td.plainText);
            } else if (td.type == "RSA_KEY") {
                var encryptedRsaKey = facade.encryptPrivateRsaKey(key, td.plainText);
                var decryptedRsaKey = facade.decryptPrivateRsaKey(key, encryptedRsaKey);
                assert.equal(decryptedRsaKey, td.plainText);
            } else {
                throw new Error("invalid type: " + td.type);
            }
        }
    });

    it("encryptionDecryptionAsyncRoundtrip ", function (finished) {
        var facades = [ new tutao.crypto.SjclAes256GcmAsync(), new tutao.crypto.WebCryptoAes256GcmAsync() ];
        Promise.each(facades, function(facade) {
            return Promise.each(compatibilityTestData.aes256GcmTests, function(td) {
                var key = _getFacade().hexToKey(td.hexKey);
                if (td.type == "BYTES") {
                    return new Promise(function(resolve, reject) {
                        var plainText = tutao.util.EncodingConverter.base64ToUint8Array(td.plainText);
                        var random = tutao.locator.randomizer.generateRandomData(tutao.crypto.AesInterface.IV_BYTE_LENGTH);
                        facade.encryptBytes(key, plainText, random, function(result) {
                            facade.decryptBytes(key, result.result, plainText.byteLength, function(result) {
                                assert.equal(plainText.length, result.result.length);
                                for (var i = 0; i < plainText.length; i++) {
                                    assert.equal(plainText[i], result.result[i]);
                                }
                                resolve();
                            });
                        });
                    });
                }
            });
        }).then(function() {
            finished();
        });
    });

    it("generateRandomKeyAndHexConversion ", function () {
        var facade = _getFacade();
        var key1Hex = facade.keyToHex(facade.generateRandomKey());
        var key2Hex = facade.keyToHex(facade.generateRandomKey());
        var key3Hex = facade.keyToHex(facade.generateRandomKey());
        // make sure the keys are different
        assert.isTrue(key1Hex !== key2Hex);
        assert.isTrue(key1Hex !== key3Hex);
        // test the key length to be 128 bit
        assert.equal(64, key1Hex.length);
        assert.equal(64, key2Hex.length);
        assert.equal(64, key3Hex.length);
        // test conversion
        assert.equal(key1Hex, facade.keyToHex(facade.hexToKey(key1Hex)));
        assert.equal(key2Hex, facade.keyToHex(facade.hexToKey(key2Hex)));
        assert.equal(key3Hex, facade.keyToHex(facade.hexToKey(key3Hex)));
    });

    it("generateRandomKeyAndBase64Conversion ", function () {
        var facade = _getFacade();
        var key1Base64 = facade.keyToBase64(facade.generateRandomKey());
        var key2Base64 = facade.keyToBase64(facade.generateRandomKey());
        var key3Base64 = facade.keyToBase64(facade.generateRandomKey());
        // make sure the keys are different
        assert.isTrue(key1Base64 !== key2Base64);
        assert.isTrue(key1Base64 !== key3Base64);
        // test the key length to be 128 bit
        assert.equal(44, key1Base64.length);
        assert.equal(44, key2Base64.length);
        assert.equal(44, key3Base64.length);
        // test conversion
        assert.equal(key1Base64, facade.keyToBase64(facade.base64ToKey(key1Base64)));
        assert.equal(key2Base64, facade.keyToBase64(facade.base64ToKey(key2Base64)));
        assert.equal(key3Base64, facade.keyToBase64(facade.base64ToKey(key3Base64)));
    });

    it("EncryptWithInvalidKey ", function () {
        var facade = _getFacade();
        var key = facade.hexToKey("7878787878");
        try {
            facade.encryptUtf8(key, "hello");
            assert.fail("no error");
        } catch(e) {
            assert.instanceOf(e, tutao.crypto.CryptoError);
        }
    });

    it("DecryptInvalidData ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        try {
            facade.decryptUtf8(key, "hello");
            assert.fail("no error");
        } catch(e) {
            assert.instanceOf(e, tutao.crypto.CryptoError);
        }
    });

    it("DecryptManipulatedData ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        try {
            var encrypted = facade.encryptUtf8(key, "hello");
            if (encrypted[0] == "a") {
                encrypted = "b" + encrypted.substring(1);
            } else {
                encrypted = "a" + encrypted.substring(1);
            }
            facade.decryptUtf8(key, encrypted);
            assert.fail("no error");
        } catch(e) {
            assert.instanceOf(e, tutao.crypto.CryptoError);
        }
    });

    it("DecryptWithWrongKey ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        var key2 = facade.generateRandomKey();
        try {
            var encrypted = facade.encryptUtf8(key, "hello");
            facade.decryptUtf8(key2, encrypted);
            assert.fail("no error");
        } catch(e) {
            assert.instanceOf(e, tutao.crypto.CryptoError);
        }
    });

    it("CiphertextLengths ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        // check that 15 bytes fit into one block
        assert.equal(48, _getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcde")));
        // check that 16 bytes need two blocks (because of one byte padding length info)
        assert.equal(64, _getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcdef")));
    });

    var _getNbrOfBytes = function (base64) {
        return tutao.util.EncodingConverter.base64ToHex(base64).length / 2;
    };
});
