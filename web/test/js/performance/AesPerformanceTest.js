"use strict";


var numberOfSmallAmountTests = 10000;
var smallAmountPlainText = "1234567890";
var bigAmountPlainTextSizeBytes = 1024 * 1024 * 10;


var runTest = function (resultLines) {
    var testFunctions = [
        Sjcl_AES_128_CBC_BigAmount,
        AsmCrypto_AES_256_GCM_BigAmount,
        WebCrypto_AES_256_GCM_BigAmount,

        Sjcl_AES_128_CBC_SmallAmount,
        Sjcl_AES_256_GCM_SmallAmount,
        AsmCrypto_AES_256_GCM_SmallAmount,
        WebCrypto_AES_256_GCM_SmallAmount
        ];

    return Promise.each(testFunctions, function(testFunction) {
       return testFunction(resultLines);
    });
};

var Sjcl_AES_128_CBC_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "Sjcl_AES_128_CBC_BigAmount", new tutao.native.CryptoBrowser());
};

var Sjcl_AES_128_CBC_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "Sjcl_AES_128_CBC_SmallAmount", new tutao.crypto.SjclAes());
};

var Sjcl_AES_256_GCM_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "Sjcl_AES_256_GCM_SmallAmount", new tutao.crypto.SjclAesGcm());
};

var AsmCrypto_AES_256_GCM_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "AsmCrypto_AES_256_GCM_BigAmount", new tutao.crypto.AsmCryptoAesGcm());
};

var AsmCrypto_AES_256_GCM_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "AsmCrypto_AES_256_GCM_SmallAmount", new tutao.crypto.AsmCryptoAesGcm());
};

var WebCrypto_AES_256_GCM_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "WebCrypto_AES_256_GCM_BigAmount", new tutao.crypto.WebCryptoAesGcm());
};

/**
 * Special case as the web crypto API does not allow synchronous calls.
 */
var WebCrypto_AES_256_GCM_SmallAmount = function (resultLines) {
    var facade = new tutao.crypto.WebCryptoAesGcm();
    var key = facade.generateRandomKey();
    var plainText = "1234567890";

    var localCipherText = null;
    var localWebCryptoKey = null;
    var decryptedPlainText = null;
    return facade._getWebCryptoKey(key).then(function(webCryptoKey) {
        var startEncrypt = Date.now();
        localWebCryptoKey = webCryptoKey;
        var i = 0;
        return tutao.util.FunctionUtils.promiseWhile(function() { return i < numberOfSmallAmountTests; }, function() {
            i++;
            return facade.encryptUtf8(localWebCryptoKey, plainText).then(function(cipherText) {
                localCipherText = cipherText;
            });
        }).then(function() {
            resultLines.push("WebCrypto_AES_256_GCM_SmallAmount - encrypt: " + (Date.now() - startEncrypt));
        });
    }).then(function() {
        var startDecrypt = Date.now();
        var i = 0;
        return tutao.util.FunctionUtils.promiseWhile(function() { return i < numberOfSmallAmountTests; }, function() {
            i++;
            return facade.decryptUtf8(localWebCryptoKey, localCipherText).then(function(decryptedText) {
                decryptedPlainText = decryptedText;
            });
        }).then(function() {
            resultLines.push("WebCrypto_AES_256_GCM_SmallAmount - decrypt: " + (Date.now() - startDecrypt));
        });
    });
};

var _testSmallAmount = function(resultLines, testName, facade) {
    var key = facade.generateRandomKey();
    var cipherText = null;

    var start = Date.now();
    for (var i=0; i<numberOfSmallAmountTests; i++) {
        cipherText = facade.encryptUtf8(key, smallAmountPlainText);
    }
    resultLines.push(testName + " - encrypt: " + (Date.now() - start));

    start = Date.now();
    var decryptedText = null;
    for (i=0; i<numberOfSmallAmountTests; i++) {
        decryptedText = facade.decryptUtf8(key, cipherText);
    }
    resultLines.push(testName + " - decrypt: " + (Date.now() - start));
    return Promise.resolve();
};

var _testBigAmount = function(resultLines, testName, facade) {
    var key = facade.generateRandomKey();
    var plainText = _createArray(bigAmountPlainTextSizeBytes);
    var cipherText = null;

    var start = Date.now();
    return facade.aesEncrypt(key, plainText).then(function(encrypted) {
        resultLines.push(testName + " - encrypt: " + (Date.now() - start));
        start = Date.now();
        return facade.aesDecrypt(key, encrypted, plainText.length).then(function(decrypted) {
            resultLines.push(testName + " - decrypt: " + (Date.now() - start));
        });
    });
};

var _createArray = function (len) {
    var view = new Uint8Array(len);
    //for (var i = 0; i < len; i++) {
      //  view[i] = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(1));
    //}
    return view;
};
