"use strict";

describe("ShaTest", function () {

    var assert = chai.assert;

    var _getFacade = function () {
        return tutao.locator.shaCrypter;
    };

    it("test", function () {
        var facade = _getFacade();

        assert.equal(tutao.util.EncodingConverter.hexToBase64("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"), facade.hashHex(""));
        assert.equal(tutao.util.EncodingConverter.hexToBase64("ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c"), facade.hashHex(tutao.util.EncodingConverter.utf8ToHex("The quick brown fox jumps over the lazy dog.")));
    });


});