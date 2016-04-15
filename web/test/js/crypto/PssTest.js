"use strict";

describe("PssTest", function () {

    var assert = chai.assert;

    it("encode ", function () {
        var pss = new tutao.crypto.Pss();
        // all values are from PssTest.java for verifying an identical implementation
        var message = _uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array("b25371601025fcc214c4a6ac877d8db9"));
        var seed = _uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array("0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"));

        var padded = pss.encode(message, 2048 - 1, seed);

        var result = _uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array("1133b67d48f8c52349f4aa9f72de0625cbc7b2eeffb23f0ad179683a491eb5f68465a61d0b271f9d26a1bb72553a37295f76624dba6dffd809a3a712e31de45c5b4d608e62f9dd58e3c44ec467b8ae570edd14030b79248d9f52271163c488d9ae57e660e473b904c96452508db14711d47d88b5d08be563727b22bc9860ca0c6b5bab789a4056d37f47f457db224de2516a41f7650784ae1033e579e840cf6138e577f9ba2b87fc31697db183178e38e5a2ff03d20f68c4bbc82f8f13fbd7a6a93fe9503701ee985dd53df4c36096b00d06d787001b4887f6134930b4782480de9a9097660193d69d34f1a94ca3df2c3dd3a479c562aea0f496ee6ddf2eefbc"));
        assert.deepEqual(result, padded);
    });

    it("verify ", function () {
        var result = _uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array("1133b67d48f8c52349f4aa9f72de0625cbc7b2eeffb23f0ad179683a491eb5f68465a61d0b271f9d26a1bb72553a37295f76624dba6dffd809a3a712e31de45c5b4d608e62f9dd58e3c44ec467b8ae570edd14030b79248d9f52271163c488d9ae57e660e473b904c96452508db14711d47d88b5d08be563727b22bc9860ca0c6b5bab789a4056d37f47f457db224de2516a41f7650784ae1033e579e840cf6138e577f9ba2b87fc31697db183178e38e5a2ff03d20f68c4bbc82f8f13fbd7a6a93fe9503701ee985dd53df4c36096b00d06d787001b4887f6134930b4782480de9a9097660193d69d34f1a94ca3df2c3dd3a479c562aea0f496ee6ddf2eefbc"));

        var pss = new tutao.crypto.Pss();

        var message = _uint8ArrayToByteArray(tutao.util.EncodingConverter.hexToUint8Array("b25371601025fcc214c4a6ac877d8db9"));
        pss.verify(message, result, 2048 -1 );
    });

    var _uint8ArrayToByteArray = function (uint8Array) {
        return [].slice.call(uint8Array);
    };
});