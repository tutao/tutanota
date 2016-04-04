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
        assert.isTrue(salt1 !== salt2);
        assert.equal(32, salt1.length); // 16 bytes in hex
        assert.equal(32, salt2.length);
    });

    it("CreateKeyFromPassphrase ", function () {
        this.timeout(5000);
        var facade = _getFacade();
        var salt1 = facade.generateRandomSalt();
        var salt2 = facade.generateRandomSalt();
        return facade.generateKeyFromPassphrase("hello", salt1).then(function (key1Hex) {
            return facade.generateKeyFromPassphrase("hello", salt1).then(function (key2Hex) {
                return facade.generateKeyFromPassphrase("hello", salt2).then(function (key3Hex) {
                    return facade.generateKeyFromPassphrase("hellohello", salt1).then(function (key4Hex) {
                        // make sure the same password and salt result in the same key
                        assert.equal(key1Hex, key2Hex);
                        // make sure a different password or different key result in different keys
                        assert.isFalse(key1Hex === key3Hex);
                        assert.isFalse(key1Hex === key4Hex);
                        // test the key length to be 128 bit
                        assert.equal(32, key1Hex.length); // same as key2Hex
                        assert.equal(32, key3Hex.length);
                        assert.equal(32, key4Hex.length);
                    });
                });
            });
        });
    });

    it("Passphrases ", function () {
        var facade = _getFacade();
        var salt = "01020304050607080900010203040506";
        // test data comes from BcryptTest.java
        var pairs = [
            {pw: "?", hash: "01d90c0c9e84adb4f0bda2e9c53b7701"},
            {pw: "%", hash: "4b8f17228d100392676c09391ee9693c"},
//		{pw: "€uropa", hash: "dccbc232baef846b05da3a2c63219540}, // TODO (jstestdriver utf8) enable as soon as the test framework supports utf8
            {pw: "?uropa", hash: "2b920848fd7db6a84893761e75025c02"}
        ];

        return Promise.each(pairs, function(pair) {
            return facade.generateKeyFromPassphrase(pair.pw, salt).then(function (hexKey) {
                assert.equal(pair.hash, hexKey);
            })
        });

    });


});