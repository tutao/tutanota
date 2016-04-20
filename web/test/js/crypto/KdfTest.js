"use strict";

describe("KdfTest", function () {

    var assert = chai.assert;

    var _getFacade = function () {
        return tutao.locator.kdfCrypter;
    };


    it("GenerateRandomSalt ", function () {
        var facade = _getFacade();
        var salt1 = facade.generateRandomSalt();
        var salt2 = facade.generateRandomSalt();
        assert.notDeepEqual(salt1, salt2);
        assert.equal(16, salt1.length);
        assert.equal(16, salt2.length);
    });

    it("CreateKeyFromPassphrase128 ", function () {
        this.timeout(5000);
        var facade = _getFacade();
        var salt1 = facade.generateRandomSalt();
        var salt2 = facade.generateRandomSalt();
        return facade.generateKeyFromPassphrase("hello", salt1, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function (key1) {
            return facade.generateKeyFromPassphrase("hello", salt1, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function (key2) {
                return facade.generateKeyFromPassphrase("hello", salt2, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function (key3) {
                    return facade.generateKeyFromPassphrase("hellohello", salt1, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function (key4) {
                        // make sure the same password and salt result in the same key
                        assert.deepEqual(key1, key2);
                        // make sure a different password or different key result in different keys
                        assert.notDeepEqual(key1, key3);
                        assert.notDeepEqual(key1, key4);
                        // test the key length to be 128 bit
                        assert.equal(16, tutao.util.EncodingConverter.keyToUint8Array(key1).length); // same as key2Hex
                        assert.equal(16, tutao.util.EncodingConverter.keyToUint8Array(key3).length);
                        assert.equal(16, tutao.util.EncodingConverter.keyToUint8Array(key4).length);
                    });
                });
            });
        });
    });

    it("CreateKeyFromPassphrase256 ", function () {
        this.timeout(5000);
        var facade = _getFacade();
        var salt1 = facade.generateRandomSalt();
        var salt2 = facade.generateRandomSalt();
        return facade.generateKeyFromPassphrase("hello", salt1, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT).then(function (key1) {
            return facade.generateKeyFromPassphrase("hello", salt1, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT).then(function (key2) {
                return facade.generateKeyFromPassphrase("hello", salt2, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT).then(function (key3) {
                    return facade.generateKeyFromPassphrase("hellohello", salt1, tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT).then(function (key4) {
                        // make sure the same password and salt result in the same key
                        assert.deepEqual(key1, key2);
                        // make sure a different password or different key result in different keys
                        assert.notDeepEqual(key1, key3);
                        assert.notDeepEqual(key1, key4);
                        // test the key length to be 128 bit
                        assert.equal(32, tutao.util.EncodingConverter.keyToUint8Array(key1).length); // same as key2Hex
                        assert.equal(32, tutao.util.EncodingConverter.keyToUint8Array(key3).length);
                        assert.equal(32, tutao.util.EncodingConverter.keyToUint8Array(key4).length);
                    });
                });
            });
        });
    });

    it("Passphrases128 ", function () {
        var facade = _getFacade();
        var salt = "01020304050607080900010203040506";
        // test data comes from BcryptTest.java
        var pairs = [
            {pw: "?", hash: "01d90c0c9e84adb4f0bda2e9c53b7701"},
            {pw: "%", hash: "4b8f17228d100392676c09391ee9693c"},
		    {pw: "€uropa", hash: "dccbc232baef846b05da3a2c63219540"},
            {pw: "?uropa", hash: "2b920848fd7db6a84893761e75025c02"}
        ];

        return Promise.each(pairs, function(pair) {
            return facade.generateKeyFromPassphrase(pair.pw, tutao.util.EncodingConverter.hexToUint8Array(salt), tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_128_BIT).then(function (key) {
                assert.equal(pair.hash, tutao.util.EncodingConverter.uint8ArrayToHex(tutao.util.EncodingConverter.keyToUint8Array(key)));
            })
        });

    });

    it("Passphrases256 ", function () {
        var facade = _getFacade();
        var salt = "01020304050607080900010203040506";
        // TODO test data comes from BcryptTest.java
        var pairs = [
            {pw: "?", hash: "01d90c0c9e84adb4f0bda2e9c53b7701310947da88bad10cc9e4aea58ec1ff0b"},
            {pw: "%", hash: "4b8f17228d100392676c09391ee9693c037b8ebbc542a5c08fae20563904d555"},
    		{pw: "€uropa", hash: "dccbc232baef846b05da3a2c632195403b2840fd1f95579d1ecf479b3c6adc8f"},
            {pw: "?uropa", hash: "2b920848fd7db6a84893761e75025c02dc7b48b69caa4ba5547e09a35715f7ca"}
        ];

        return Promise.each(pairs, function(pair) {
            return facade.generateKeyFromPassphrase(pair.pw, tutao.util.EncodingConverter.hexToUint8Array(salt), tutao.entity.tutanota.TutanotaConstants.KEY_LENGTH_TYPE_256_BIT).then(function (key) {
                assert.equal(pair.hash, tutao.util.EncodingConverter.uint8ArrayToHex(tutao.util.EncodingConverter.keyToUint8Array(key)));
            })
        });

    });

    it("InvalidKeyLengthType ", function () {
        var facade = _getFacade();
        var salt = "01020304050607080900010203040506";

        return facade.generateKeyFromPassphrase("hello", tutao.util.EncodingConverter.hexToUint8Array(salt), 2).then(function (key) {
            assert.fail("invalid key lenght type accepted");
        }).catch(function(e) {
            // fine
        });
    });
});