"use strict";

describe("AesTest", function () {

    var assert = chai.assert;

    var _getFacade = function () {
        return tutao.locator.aesCrypter;
    };

    var _getNbrOfBytes = function (base64) {
        return tutao.util.EncodingConverter.base64ToHex(base64).length / 2;
    };

    var _checkRoundtripUtf8 = function (facade, key, plain) {
        // with static iv
        var encrypted = facade.encryptUtf8Index(key, plain);
        var encrypted2 = facade.encryptUtf8Index(key, plain);
        var plainAgain = facade.decryptUtf8Index(key, encrypted);
        var plainAgain2 = facade.decryptUtf8Index(key, encrypted2);
        // with random iv
        var encryptedRandomIv = facade.encryptUtf8(key, plain);
        var encrypted2RandomIv = facade.encryptUtf8(key, plain);
        var plainAgainRandomIv = facade.decryptUtf8(key, encryptedRandomIv);
        var plainAgain2RandomIv = facade.decryptUtf8(key, encrypted2RandomIv);

        // check roundtrip results
        assert.equal(plain, plainAgain);
        assert.equal(plain, plainAgain2);
        assert.equal(plain, plainAgainRandomIv);
        assert.equal(plain, plainAgain2RandomIv);

        // check that the ciphertexts are the same with static ivs
        assert.isTrue(encrypted === encrypted2);
        // check that the ciphertexts are different with random ivs
        assert.isTrue(encryptedRandomIv !== encrypted2RandomIv);
        // check that the ciphertexts have the same length with random ivs
        assert.isTrue(encryptedRandomIv.length === encrypted2RandomIv.length);
        // check that the ciphertext is longer with random ivs
        assert.isTrue(encryptedRandomIv.length > encrypted.length);
    };

    var _checkRoundtripHex = function (facade, key, plainHex) {
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

    it("generateRandomKeyAndBase64Conversion ", function () {
        var facade = _getFacade();
        var key1Base64 = tutao.util.EncodingConverter.keyToBase64(facade.generateRandomKey());
        var key2Base64 = tutao.util.EncodingConverter.keyToBase64(facade.generateRandomKey());
        var key3Base64 = tutao.util.EncodingConverter.keyToBase64(facade.generateRandomKey());
        // make sure the keys are different
        assert.isTrue(key1Base64 !== key2Base64);
        assert.isTrue(key1Base64 !== key3Base64);
        // test the key length to be 128 bit
        assert.equal(24, key1Base64.length);
        assert.equal(24, key2Base64.length);
        assert.equal(24, key3Base64.length);
        // test conversion
        assert.equal(key1Base64, tutao.util.EncodingConverter.keyToBase64(tutao.util.EncodingConverter.base64ToKey(key1Base64)));
        assert.equal(key2Base64, tutao.util.EncodingConverter.keyToBase64(tutao.util.EncodingConverter.base64ToKey(key2Base64)));
        assert.equal(key3Base64, tutao.util.EncodingConverter.keyToBase64(tutao.util.EncodingConverter.base64ToKey(key3Base64)));
    });

    it("EncryptDecryptUtf8 ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        var plaintexts = ["", "a", "t?", "ret", "helloworld", "what a nice plaintext!", "€ %^-µ", "long Test that convers many of these nice encryption blocks, so we can check that the block mode works nicely after all"];
        for (var i = 0; i < plaintexts.length; i++) {
            _checkRoundtripUtf8(facade, key, plaintexts[i]);
        }
    });

    it("EncryptDecryptBytes ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        var plaintexts = ["", "aa", "5555", "12341234", "123412341234123412341234123412", "12341234123412341234123412341234", "1234123412341234123412341234123412"];
        for (var i = 0; i < plaintexts.length; i++) {
            _checkRoundtripHex(facade, key, plaintexts[i]);
        }
    });

    it("EncryptWithInvalidKey ", function () {
        var facade = _getFacade();
        var key = tutao.util.EncodingConverter.uint8ArrayToKey(tutao.util.EncodingConverter.hexToUint8Array("7878787878"));
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

    it("EncryptDecryptAESKey ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        var keyToEncrypt = facade.generateRandomKey();
        var encrypted = facade.encryptKey(key, keyToEncrypt);
        // an encrypted key must be one block because no padding or random iv is used
        assert.equal(16, _getNbrOfBytes(encrypted));
        var decrypted = facade.decryptKey(key, encrypted);
        assert.equal(tutao.util.EncodingConverter.keyToBase64(keyToEncrypt), tutao.util.EncodingConverter.keyToBase64(decrypted));
    });

    it("ThatDifferentKeysResultInDifferentCiphertexts ", function () {
        var facade = _getFacade();
        var key1 = facade.generateRandomKey();
        var key2 = facade.generateRandomKey();
        var plain = "hello";
        assert.isTrue(facade.encryptUtf8Index(key1, plain) !== facade.encryptUtf8Index(key2, plain));
        assert.isTrue(facade.encryptUtf8(key1, plain) !== facade.encryptUtf8(key2, plain));
    });

    it("CiphertextLengths ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        // check that 15 bytes fit into one block
        assert.equal(16, _getNbrOfBytes(facade.encryptUtf8Index(key, "1234567890abcde")));
        assert.equal(32, _getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcde")));
        // check that 16 bytes need two blocks (because of one byte padding length info)
        assert.equal(32, _getNbrOfBytes(facade.encryptUtf8Index(key, "1234567890abcdef")));
        assert.equal(48, _getNbrOfBytes(facade.encryptUtf8(key, "1234567890abcdef")));

        // check that that a non-ascii-character needs two bytes
        // TODO (jstestdriver utf8) enable as soon as jstestdriver supports utf8. currently the 'ä' consumes 4 characters which is not utf8 compatible.
        // http://code.google.com/p/js-test-driver/issues/detail?id=85
        // assert.equal(16, _getNbrOfBytes(facade.encryptUtf8Index(key, "1234567890abcä")));
        // assert.equal(32, _getNbrOfBytes(facade.encryptUtf8Index(key, "1234567890abcdä")));
    });

    it("EncryptDecryptRsaPrivateKey ", function () {
        var facade = _getFacade();
        var key = facade.generateRandomKey();
        var rsaPrivateKeyHex = "9bb7c919bca728244a4a8c484353a9bc5c752b458c6ea6b5451fab3ccd57c8124ec72654b7477c2a580dd638b45376933c76e6f52f3d770e8ecef7f0fa3d469a5e4e59572ec27ae2b0929943393e4dfa436c62264935bb8bc01769a820babaf30423a915641aa2d847d2f02d118620217e1440fb7a28de34e0ce8ee314333c4065a361baa73fb6eb1caef0dd8fcee0547711fd0d33a9c9e0f84fe689b4f24af0cf78a88cfea596ce217a78d202c908097b125fddb95946658aba2a2ce5ac39d7a7b03346667a14cca80d2775009a1bed9f8c48f8b2e981c4fd94110b4822a58f85ffc16172ae518adfa44e8b02c21b1f7b20f2265cc9bd37b06a4671ea85d9414677e35fec49d116ab30154fd678140613e94a4dcd017e1be64e3095f16f5a313ec94d056573ca32f76a3b99a9b163a5b9e52d1ba3e732ebb9a0dbff879f1746608b204f1df010e0697bce33e7c1d453ff131b4fac2dced3ad786aee14f1ac0cb1c0d991be9d77385d388e4c36f3f5b2727603fa4a0c1892e17158a456cde0e3a5192a1cdb7856c79c8a8502aa3b55f8ffce5b6d7d1f1cb78c9c5363af1b939ca6c1998d0878269b8876be8896fcfb0d92b8d694d218e4878f3a3b11f2089271e755cb7813746e3b04171db4da8159dad7d4079d58f22bf4a84a03f690e0652db6b59743a38ac556351cabdf3979fe74dfbf92553a3b651227bc21d96c5b9069";
        var encrypted = facade.encryptPrivateRsaKey(key, rsaPrivateKeyHex);
        var decrypted = facade.decryptPrivateRsaKey(key, encrypted);
        assert.equal(rsaPrivateKeyHex, decrypted);
    });


});