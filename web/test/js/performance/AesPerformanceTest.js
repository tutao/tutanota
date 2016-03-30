"use strict";


var numberOfSmallAmountTests = 10000;
var smallAmountPlainText = "1234567890";
var bigAmountPlainTextSizeBytes = 1024 * 1024 * 5;


var runTest = function (resultLines) {
    var testFunctions = [

        Sjcl_AES_128_CBC_BigAmount,

        Sjcl_AES_256_GCM_BigAmount,
        WebCrypto_AES_256_GCM_BigAmount,
        AsmCrypto_AES_256_GCM_BigAmount,
        ForgeCrypto_AES_256_GCM_BigAmount,

        // too bad performance: Sjcl_AES_256_CBC_BigAmount,
        WebCrypto_AES_256_CBC_BigAmount,
        AsmCrypto_AES_256_CBC_BigAmount,
        ForgeCrypto_AES_256_CBC_BigAmount,

        Sjcl_AES_128_CBC_SmallAmount,

        Sjcl_AES_256_GCM_SmallAmount,
        WebCrypto_AES_256_GCM_SmallAmount,
        AsmCrypto_AES_256_GCM_SmallAmount,
        ForgeCrypto_AES_256_GCM_SmallAmount,

        Sjcl_AES_256_CBC_SmallAmount,
        WebCrypto_AES_256_CBC_SmallAmount,
        AsmCrypto_AES_256_CBC_SmallAmount,
        ForgeCrypto_AES_256_CBC_SmallAmount
        ];

    return Promise.each(testFunctions, function(testFunction) {
       return testFunction(resultLines);
    });
};

var Sjcl_AES_128_CBC_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "Sjcl_AES_128_CBC", new tutao.native.CryptoBrowser());
};

var Sjcl_AES_128_CBC_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "Sjcl_AES_128_CBC", new tutao.crypto.SjclAes());
};

var Sjcl_AES_256_GCM_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "Sjcl_AES_256_GCM_PAD", new tutao.crypto.SjclAesGcm());
};

var Sjcl_AES_256_GCM_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "Sjcl_AES_256_GCM_PAD", new tutao.crypto.SjclAesGcm());
};

var Sjcl_AES_256_CBC_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "Sjcl_AES_256_CBC_HMAC", new tutao.crypto.SjclAesCbc());
};

var Sjcl_AES_256_CBC_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "Sjcl_AES_256_CBC_HMAC", new tutao.crypto.SjclAesCbc());
};

var AsmCrypto_AES_256_GCM_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "AsmCrypto_AES_256_GCM_PAD", new tutao.crypto.AsmCryptoAesGcm());
};

var AsmCrypto_AES_256_GCM_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "AsmCrypto_AES_256_GCM_PAD", new tutao.crypto.AsmCryptoAesGcm());
};

var AsmCrypto_AES_256_CBC_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "AsmCrypto_AES_256_CBC", new tutao.crypto.AsmCryptoAesCbc());
};

var AsmCrypto_AES_256_CBC_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "AsmCrypto_AES_256_CBC", new tutao.crypto.AsmCryptoAesCbc());
};

var ForgeCrypto_AES_256_GCM_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "ForgeCrypto_AES_256_GCM", new tutao.crypto.ForgeCryptoAesGcm());
};

var ForgeCrypto_AES_256_GCM_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "ForgeCrypto_AES_256_GCM", new tutao.crypto.ForgeCryptoAesGcm());
};

var ForgeCrypto_AES_256_CBC_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "ForgeCrypto_AES_256_CBC", new tutao.crypto.ForgeCryptoAesCbc());
};

var ForgeCrypto_AES_256_CBC_SmallAmount = function (resultLines) {
    return _testSmallAmount(resultLines, "ForgeCrypto_AES_256_CBC", new tutao.crypto.ForgeCryptoAesCbc());
};

var WebCrypto_AES_256_GCM_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "WebCrypto_AES_256_GCM_PAD", new tutao.crypto.WebCryptoAesGcm());
};

var WebCrypto_AES_256_CBC_BigAmount = function (resultLines) {
    return _testBigAmount(resultLines, "WebCrypto_AES_256_CBC_HMAC", new tutao.crypto.WebCryptoAesCbc());
};

/**
 * Special case as the web crypto API does not allow synchronous calls.
 */
var WebCrypto_AES_256_GCM_SmallAmount = function (resultLines) {
    var facade = new tutao.crypto.WebCryptoAesGcm();
    var testName = "WebCrypto_AES_256_GCM";
    return _runWebCryptoSmallAmountAsync(resultLines, facade, testName);
};

var WebCrypto_AES_256_CBC_SmallAmount = function (resultLines) {
    var facade = new tutao.crypto.WebCryptoAesCbc();
    var testName = "WebCrypto_AES_256_CBC";
    return _runWebCryptoSmallAmountAsync(resultLines, facade, testName);
};


var _runWebCryptoSmallAmountAsync = function(resultLines, facade, testName) {
    var key = facade.generateRandomKey();
    var plainText = "1234567890";

    var localCipherText = null;
    var localWebCryptoKey = null;
    var decryptedPlainText = null;
    resultLines["small"][testName] = resultLines["small"][testName] || {};

    console.log(testName + "_small");
    progressInfo(testName + "_small"); // add delay for gui to update
    return Promise.delay(50).then(function() {
        return facade.getWebCryptoKey(key).then(function(webCryptoKey) {
            var startEncrypt = Date.now();
            localWebCryptoKey = webCryptoKey;
            var i = 0;
            return tutao.util.FunctionUtils.promiseWhile(function() { return i < numberOfSmallAmountTests; }, function() {
                i++;
                return facade.encryptUtf8(localWebCryptoKey, plainText).then(function(cipherText) {
                    localCipherText = cipherText;
                });
            }).then(function() {
                resultLines["small"][testName]["encrypt"] = resultLines["small"][testName]["encrypt"] || [];
                resultLines["small"][testName]["encrypt"].push((Date.now() - startEncrypt));
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
                resultLines["small"][testName]["decrypt"] = resultLines["small"][testName]["decrypt"] || [];
                resultLines["small"][testName]["decrypt"].push((Date.now() - startDecrypt));
            });
        }).catch(function(error) {
            console.log(error);
            resultLines["small"][testName]["encrypt"] = resultLines["small"][testName]["encrypt"] || [];
            resultLines["small"][testName]["encrypt"].push("Error");
            resultLines["small"][testName]["decrypt"] = resultLines["small"][testName]["decrypt"] || [];
            resultLines["small"][testName]["decrypt"].push("Error");
        });
    });
};

var _testSmallAmount = function(resultLines, testName, facade) {
    console.log(testName + "_small");
    progressInfo(testName + "_small"); // add delay for gui to update
    return Promise.delay(50).then(function() {
        var key = facade.generateRandomKey();
        var cipherText = null;

        resultLines["small"][testName] = resultLines["small"][testName] || {};

        var start = Date.now();
        for (var i = 0; i < numberOfSmallAmountTests; i++) {
            cipherText = facade.encryptUtf8(key, smallAmountPlainText);
        }
        resultLines["small"][testName]["encrypt"] = resultLines["small"][testName]["encrypt"] || [];
        resultLines["small"][testName]["encrypt"].push((Date.now() - start));

        start = Date.now();
        var decryptedText = null;
        for (i = 0; i < numberOfSmallAmountTests; i++) {
            decryptedText = facade.decryptUtf8(key, cipherText);
        }
        resultLines["small"][testName]["decrypt"] = resultLines["small"][testName]["decrypt"] || [];
        resultLines["small"][testName]["decrypt"].push((Date.now() - start));
    });
};

var _testBigAmount = function(resultLines, testName, facade) {
    console.log(testName + "_big");
    progressInfo(testName + "_big"); // add delay for gui to update
    return Promise.delay(50).then(function() {
        var key = facade.generateRandomKey();
        var plainText = _createArray(bigAmountPlainTextSizeBytes);
        var cipherText = null;
        resultLines["big"][testName] = resultLines["big"][testName] || {};

        var start = Date.now();
        return facade.aesEncrypt(key, plainText).then(function (encrypted) {
            resultLines["big"][testName]["encrypt"] = resultLines["big"][testName]["encrypt"] || [];
            resultLines["big"][testName]["encrypt"].push((Date.now() - start));
            start = Date.now();
            return facade.aesDecrypt(key, encrypted, plainText.length).then(function (decrypted) {
                resultLines["big"][testName]["decrypt"] = resultLines["big"][testName]["decrypt"] || [];
                resultLines["big"][testName]["decrypt"].push((Date.now() - start));
            });
        }).catch(function (error) {
            console.log(error);
            resultLines["big"][testName]["encrypt"] = resultLines["big"][testName]["encrypt"] || [];
            resultLines["big"][testName]["encrypt"].push("Error");
            resultLines["big"][testName]["decrypt"] = resultLines["big"][testName]["decrypt"] || [];
            resultLines["big"][testName]["decrypt"].push("Error");
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
