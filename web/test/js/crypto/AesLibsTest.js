"use strict";

describe("AesLibsTest", function () {

    var assert = chai.assert;

    var _getNbrOfBytes = function (base64) {
        return tutao.util.EncodingConverter.base64ToHex(base64).length / 2;
    };

    var _checkRoundtripUtf8 = function (facade, plain) {
        console.log(facade, plain);
        var key = facade.generateRandomKey();
        var encrypted1 = facade.encryptUtf8(key, plain);
        var encrypted2 = facade.encryptUtf8(key, plain);
        var decrypted1 = facade.decryptUtf8(key, encrypted1);
        var decrypted2 = facade.decryptUtf8(key, encrypted2);

        // check roundtrip results
        assert.equal(plain, decrypted1);
        assert.equal(plain, decrypted2);

        // check that the ciphertexts are different
        assert.isTrue(encrypted1 !== encrypted2);
        // check that the ciphertexts have the same length
        assert.isTrue(encrypted1.length === encrypted2.length);
    };

    var _checkRoundtripArrayBuffer = function (facade, key, plainHex) {
        var encryptedRandomIv = facade.encryptBytes(key, tutao.util.EncodingConverter.hexToBase64(plainHex));
        var encrypted2RandomIv = facade.encryptBytes(key, tutao.util.EncodingConverter.hexToBase64(plainHex));
        var plainAgainRandomIv = tutao.util.EncodingConverter.base64ToHex(facade.decryptBytes(key, encryptedRandomIv));
        var plainAgain2RandomIv = tutao.util.EncodingConverter.base64ToHex(facade.decryptBytes(key, encrypted2RandomIv));

        // check roundtrip results
        assert.equal(plainHex, plainAgainRandomIv);
        assert.equal(plainHex, plainAgain2RandomIv);

        // check that the ciphertexts are different with random ivs
        assert.isTrue(encryptedRandomIv !== encrypted2RandomIv);
        // check that the ciphertexts have the same length with random ivs
        assert.isTrue(encryptedRandomIv.length === encrypted2RandomIv.length);
    };

    it("encryptDecryptUtf8Aes256 ", function (done) {
        var facades = [ new tutao.crypto.SjclAes256Gcm(),
                        new tutao.crypto.SjclAesGcm(),
                        new tutao.crypto.SjclAesCbc(),
                        new tutao.crypto.AsmCryptoAesGcm(),
                        new tutao.crypto.AsmCryptoAesCbc(),
                        new tutao.crypto.ForgeCryptoAesGcm(),
                        new tutao.crypto.ForgeCryptoAesCbc()
        ];
        var plainTexts = [ "", "0", "1", "ab", "1234567890", "€f3020a0990u)=U890437987zf403ÄÄv#w4#4)P(=()=ZE()Zr98p73428f94zgfoiurzetoie"];

        Promise.each(plainTexts, function(plainText) {
            var cipherTexts = []; // collect cipherTexts from all facades and let all decrypt all cipherTexts to test the interoperability
            return Promise.each(facades, function(facade) {
                _checkRoundtripUtf8(facade, plainText);
            });
        }).then(function() {
            done();
        });
    });

    it("encryptDecryptUtf8Aes256GcmCompatibility ", function (done) {
        var facades = [ new tutao.crypto.SjclAes256Gcm(),
                        new tutao.crypto.AsmCryptoAesGcm()
            //new tutao.crypto.ForgeCryptoAesGcm() does not contain padding
                        ];
        var plainTexts = [ "", "0", "1", "ab", "1234567890", "€f3020a0990u)=U890437987zf403ÄÄv#w4#4)P(=()=ZE()Zr98p73428f94zgfoiurzetoie"];
        var commonKeyHex = facades[0].keyToHex(facades[0].generateRandomKey());

        Promise.each(plainTexts, function(plainText) {
            var cipherTexts = []; // collect cipherTexts from all facades and let all decrypt all cipherTexts to test the interoperability
            return Promise.each(facades, function(facade) {
                var commonKey = facade.hexToKey(commonKeyHex);
                cipherTexts.push(facade.encryptUtf8(commonKey, plainText));
            }).then(function() {
                return Promise.each(facades, function (facadeForDecryption) {
                    var commonKey = facadeForDecryption.hexToKey(commonKeyHex);
                    return Promise.each(cipherTexts, function (cipherText) {
                        assert.equal(plainText, facadeForDecryption.decryptUtf8(commonKey, cipherText));
                    });
                });
            });
        }).then(function() {
            done();
        });
    });

    it("encryptDecryptBytesAes256BigAmount ", function (done) {
        var facades = [ new tutao.crypto.SjclAesGcm(),
                        new tutao.crypto.SjclAesCbc(),
                        new tutao.crypto.AsmCryptoAesGcm(),
                        new tutao.crypto.AsmCryptoAesCbc(),
                        new tutao.crypto.WebCryptoAesGcm(),
                        new tutao.crypto.WebCryptoAesCbc(),
                        new tutao.crypto.ForgeCryptoAesGcm(),
                        new tutao.crypto.ForgeCryptoAesCbc()
                        ];
        var plainText = _createArray(1024 * 10);
        var cipherText = null;

        return Promise.each(facades, function(facade) {
            console.log(facade);
            var key = facade.generateRandomKey();
            return facade.aesEncrypt(key, plainText).then(function(encrypted) {
                return facade.aesDecrypt(key, encrypted, plainText.length).then(function(decrypted) {
                    assert.equal(plainText.length, decrypted.length);
                    for (var i = 0; i < plainText.length; i++) {
                        assert.equal(plainText[i], decrypted[i]);
                    }
                });
            });
        }).then(function() {
            done();
        });
    });

    it("encryptDecryptBytesAes256Async", function (done) {
        var syncFacade = new tutao.crypto.SjclAes256Gcm();
        var facades = [ new tutao.crypto.SjclAes256GcmAsync(),
            new tutao.crypto.WebCryptoAes256GcmAsync()
        ];
        var plainText = _createArray(1024 * 10);
        var cipherText = null;

        return Promise.each(facades, function(facade) {
            console.log(facade);
            var key = syncFacade.generateRandomKey();
            var random = tutao.locator.randomizer.generateRandomData(tutao.crypto.AesInterface.IV_BYTE_LENGTH);
            return new Promise(function(resolve, reject){
                facade.encryptBytes(key, plainText, random, function(encrypted) {
                    assert.equal('result', encrypted.type);
                    facade.decryptBytes(key, encrypted.result, plainText.length, function(decrypted) {
                        assert.equal('result', decrypted.type);
                        assert.equal(plainText.length, decrypted.result.length);
                        for (var i = 0; i < plainText.length; i++) {
                            assert.equal(plainText[i], decrypted.result[i]);
                        }
                        resolve();
                    });
                });
            });
        }).then(function() {
            done();
        });
    });


    var _createArray = function (len) {
        var view = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            view[i] = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(1));
        }
        return view;
    };
});