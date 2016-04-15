"use strict";

describe("ShaTest", function () {

    var assert = chai.assert;

    var _getFacade = function () {
        return tutao.locator.shaCrypter;
    };

    it("test", function () {
        var facade = _getFacade();

        assert.deepEqual(tutao.util.EncodingConverter.hexToUint8Array("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"), facade.hash(new Uint8Array(0)));
        assert.deepEqual(tutao.util.EncodingConverter.hexToUint8Array("ef537f25c895bfa782526529a9b63d97aa631564d5d789c2b765448c8635fb6c"), facade.hash(tutao.util.EncodingConverter.stringToUtf8Uint8Array("The quick brown fox jumps over the lazy dog.")));
    });


});