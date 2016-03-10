"use strict";

var test128bitSmallAmount = function () {
    var facade = new tutao.crypto.SjclAes();
    var key = facade.generateRandomKey();
    var plainText = "1234567890";
    var cipherText = null;
    var resultLines = [];

    var start = Date.now();
    for (var i=0; i<100000; i++) {
        cipherText = facade.encryptUtf8(key, plainText);
    }
    resultLines.push("test128bitSmallAmount - encrypt: " + (Date.now() - start));

    start = Date.now();
    var decryptedText = null;
    for (i=0; i<100000; i++) {
        decryptedText = facade.decryptUtf8(key, cipherText);
    }
    resultLines.push("test128bitSmallAmount - decrypt: " + (Date.now() - start));
    return Promise.resolve(resultLines);
};

var test128bitBigAmount = function () {
    var facade = tutao.locator.crypto;
    var key = _createArray(16); //facade.generateAesKey();
    var plainText = _createArray(1024 * 1024 * 10); // from AesArrayBufferTest
    var cipherText = null;
    var resultLines = [];

    var start = Date.now();
    return facade.aesEncrypt(key, plainText).then(function(encrypted) {
        resultLines.push("test128bitBigAmount - encrypt: " + (Date.now() - start));
        start = Date.now();
        return facade.aesDecrypt(key, encrypted, plainText.length).then(function(decrypted) {
            resultLines.push("test128bitBigAmount - decrypt: " + (Date.now() - start));
            return resultLines;
        });
    });
};

var _createArray = function (len) {
    var view = new Uint8Array(len);
    //for (var i = 0; i < len; i++) {
    //    view[i] = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(1));
    //}
    return view;
};
