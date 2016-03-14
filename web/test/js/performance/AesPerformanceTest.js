"use strict";


var numberOfSmallAmountTests = 100000;


var runTest = function (resultLines) {
    var testFunctions = [
        //testSjclAES256CbcSmallAmount,
        //testSjclAES128CbcSBigAmount,
        //testSjclAES256GcmSmallAmount,
        testWebCryptoAES256GcmSmallAmount
        ];

    return Promise.each(testFunctions, function(testFunction) {
       return testFunction(resultLines);
    });
};




var testWebCryptoAES256GcmSmallAmount = function (resultLines) {
    var facade = new tutao.crypto.WebCryptoAesGcm();
    var key = facade.generateRandomKey();
    var plainText = "1234567890";
    var array = new Array(numberOfSmallAmountTests);
    for (var i=0; i<array.length; i++) {
        array[i] = "1234567890";
    }


    var localCipherText = null;
    var localWebCryptoKey = null;
    var decryptedPlainText = null;
    return facade._importKey(key).then(function(webCryptoKey){
        var startEncrypt = Date.now();
        localWebCryptoKey = webCryptoKey;
        return Promise.each(array, function (element, index, length) {
            return facade.encryptUtf8(localWebCryptoKey, plainText).then(function(cipherText) {
                localCipherText = cipherText;
            });
        }).then(function() {
            resultLines.push("test256BitWebCryptoGcmSmallAmount - encrypt: " + (Date.now() - startEncrypt));
        })
    }).then(function() {
        var startDecrypt = Date.now();
        return Promise.each(array, function (element, index, length) {
            return facade.decryptUtf8(localWebCryptoKey, localCipherText).then(function(decryptedText) {
                decryptedPlainText = decryptedText;
            });
        }).then(function() {
            resultLines.push("test256BitWebCryptoGcmSmallAmount - decrypt: " + (Date.now() - startDecrypt));
        });
    });
};


var testSjclAES256GcmSmallAmount = function (resultLines) {
    var facade = new tutao.crypto.SjclAesGcm();
    var key = facade.generateRandomKey();
    var plainText = "1234567890";
    var cipherText = null;

    return new Promise(function(resolve, reject) {
        try {
            var start = Date.now();
            for (var i=0; i<numberOfSmallAmountTests; i++) {
                cipherText = facade.encryptUtf8(key, plainText);
            }
            resultLines.push("testSjclAES256GcmSmallAmount - encrypt: " + (Date.now() - start));

            start = Date.now();
            var decryptedText = null;
            for (i=0; i<numberOfSmallAmountTests; i++) {
                decryptedText = facade.decryptUtf8(key, cipherText);
            }
            resultLines.push("testSjclAES256GcmSmallAmount - decrypt: " + (Date.now() - start));
            resolve();
        } catch(e){
            reject(e);
        }
    });
};



var testSjclAES128CbcSmallAmount = function (resultLines) {
    var facade = new tutao.crypto.SjclAes();
    var key = facade.generateRandomKey();
    var plainText = "1234567890";
    var cipherText = null;

    var start = Date.now();
    for (var i=0; i<numberOfSmallAmountTests; i++) {
        cipherText = facade.encryptUtf8(key, plainText);
    }
    resultLines.push("testSjclAES128CbcSmallAmount - encrypt: " + (Date.now() - start));

    start = Date.now();
    var decryptedText = null;
    for (i=0; i<numberOfSmallAmountTests; i++) {
        decryptedText = facade.decryptUtf8(key, cipherText);
    }
    resultLines.push("testSjclAES128CbcSmallAmount - decrypt: " + (Date.now() - start));
    return Promise.resolve();
};

var testSjclAES128CbcSBigAmount = function (resultLines) {
    var facade = tutao.locator.crypto;
    var key = _createArray(16); //facade.generateAesKey();
    var plainText = _createArray(1024 * 1024 * 10); // from AesArrayBufferTest
    var cipherText = null;

    var start = Date.now();
    return facade.aesEncrypt(key, plainText).then(function(encrypted) {
        resultLines.push("testSjclAES128CbcSBigAmount - encrypt: " + (Date.now() - start));
        start = Date.now();
        return facade.aesDecrypt(key, encrypted, plainText.length).then(function(decrypted) {
            resultLines.push("testSjclAES128CbcSBigAmount - decrypt: " + (Date.now() - start));
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
