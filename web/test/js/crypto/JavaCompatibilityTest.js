"use strict";

/**
 * Tests that the key and encrypted data from the CompatibilityTest creates the same results in JavaScript.
 * TODO (before beta) add verification test for full coverage of the padding (one test for each possible clear text length in the last block; AES: tests for 0-255 bytes of cleartext data)
 */
describe("JavaCompatibilityTest", function () {

    var assert = chai.assert;

    it("testRsaJavaCompatibility", function () {
        this.timeout(20000);
        var aesFacade = tutao.locator.aesCrypter;
        var rsaAdapter = new tutao.native.RsaUtils();

        // this data is copied from the CompatibilityTest where it is generated
        var aesHexKey = "73f626436ac9a3d96a1e579aa340521d";
        var utf8Data = "what a wonderful encryption!";
        var encryptedUtf8DataRandomIv = "IgIvX4ffXEDtv11wqrUXI6BfxGlQ1q3L45oj2u1R3GPvsBwTw5dV6mz9jiHO0Rmx";
        var encryptedUtf8DataStaticIv = "7hhpVow1qWNstHuELu9qArZKUz4CbcGmP22aSz/Is14=";
        var aesKeyData = "719ccdcc6486da2af89130123ebdc363";
        var encryptedKeyData = "rXsBCm4c4OBIFviTY6HgfA==";
        var rsaPrivateHexKey = "0200d8b6b46264ec4614f6263c22a1efeac633c4e33f993e54742064b3d513339128b4e1e97179b3d1c234d1942f4335a50c3c978e0ce578299bcd668b1d01f53fd960323db08da2aa3f5df47df9d7c125ca7e20b813a166939563d176583472989c1b8cb23e361aacfb9362ec9f22a2e15f902f60fd659e47f5c099c1d9e50f99f59a8d353b0ef7a23f69583087b67ec407a1945b3086e0aa35a296e74784bccce3054babf56319e9a11eb6b1947dbcce8ffc03d9801cb2f5c7ceb736b377070c8b1807d18c790118cd62252f0a91e07866a44df04f3d9c72b7b5167106238151a472b856e185d25423704596473602772f2c8bed4d19ed5b7d6d6ced4be624d40f02008a573797882d7c1f6d72c2f8a8bf6af3d3a06020fd4658cb38d29029f8f3f63a321df4d3c7890ee216ada316f8a48a13e1aa2db7f5d45b5b66278bae9ccd5e50f9a398d5d7d47b31b05c9efe9ac865c379f891099702d03b9158e95f2d3bea47dd1e57ba76f7586dd08c59d8cc5785df673f977eab1bfb7bd9d34d78374d5a4dcdd6cfa0f12b26152ca8dc11f355ab7ce4bb3dbd7dfac31ab448f8e3f93f5f231c891528d4ec1095cee39752d104395e963b9fac165c6f7021e687d5345a10d4c578bac247db918c00d31135c335eba9e25781802b46a4275d954c6ff67b45808267d8cc0250c6ba83e5747ca2fe7f2cf46a0befff3acafbb97aae6fd8c2d9a102000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f341149a19e597220540f935970eb9b750e97784ce6be460998d107eb15d8c727f9e1a3735065c8e8bb64674f2ace5f036d57265aabc9ea489a9ac88f019093711d6849d980bd8861182e020c7c745662acedf99f9147328de367b338c03f76855d7485b3967baf4ce9f79702bdebe4f972cdda310ffb91df0c67133fd467ded02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000e4119e9c6658e854e95415b283d7bae56cbdc524e18cf9330daa9e3ce79e407f6e2de9f1d00e79a6b59a56798a94178101741365356131a2e1d54e7830a14597e22dad349266ca02b79cc9e0d416385080253cc48f8f1fdacdca3cb93115a541b7ef8d3d8f480e3bb5d79a12d6c4c3b202bd12c8e161b03c5c3a8b3454f0ba6b02000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000317c07c8e183c71ef09aab17afc71b18a3a91adb3572d55ea15e050100ebdaea5ff3b5b98d5be1f04d93a2f99f7474c24d2556c43fdb671a69b6ce967ce15af28cfa6ab7f47a546dd19a222608fe0cac20013d93810c1bf130633ce4db92e2fda298cceb61de2c3628e2603de56ec6a0424caa39c5f77f9d0ba212dd54a4c6710200000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000016b4fe62b9f9ee1fce1f560db0fcc099e90ab7df2529c101e9416c81c9d9c2b82d431b00bd63438f6a93543ac3a65cf4b62d5565053c89119b847e4c8f22ef67e0d8055faf97d65310eee656a1271932429ff27deb81277dc471773c44fbcfb94c53e86f119dedf4d9f4fe5d13cf0160eecede58ebbfab29475178dc9bfc5fc302000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ceb06445a1ba87580b8fbfe0e90e363eba58dbff8dcf209094fb1bb3fa664778625c5d774ce1e41e1e293c9bb4741b1c0bce6a7da396af3570191d03f4da9201b967862ac906bbba458087f0dca1f33385b56a11456832425e37e285dbadc4db2bb36fdcc27e2c092bb8032fc5fe147676c15f0134a18cf0d08bdefcff502db3";
        var rsaPublicHexKey = "0200d8b6b46264ec4614f6263c22a1efeac633c4e33f993e54742064b3d513339128b4e1e97179b3d1c234d1942f4335a50c3c978e0ce578299bcd668b1d01f53fd960323db08da2aa3f5df47df9d7c125ca7e20b813a166939563d176583472989c1b8cb23e361aacfb9362ec9f22a2e15f902f60fd659e47f5c099c1d9e50f99f59a8d353b0ef7a23f69583087b67ec407a1945b3086e0aa35a296e74784bccce3054babf56319e9a11eb6b1947dbcce8ffc03d9801cb2f5c7ceb736b377070c8b1807d18c790118cd62252f0a91e07866a44df04f3d9c72b7b5167106238151a472b856e185d25423704596473602772f2c8bed4d19ed5b7d6d6ced4be624d40f";
        var encryptedAesKey = "YmHtYcF9yyhLvbkkbXXT5xKoYDirtAmj1HU6oE9+18whx1z/iixeDk1HibjsSMM/CIn4zkSDOzDhHqQFw88YKWHzh9UEw++2HcDT9GUt9QftYtOJtfl9MfYNgBbxzxEJDKOU34UjIDBUMJVWkEf8mcUZDAHEDCOm2ZNtrZz00ALAznQpFBOjabHmP7+t4sZldayTNiXogaDiK0IDG0IWp0VuHt9jPybYZ1wPojHeRVRJUO08ZGbFDpi+hBaLKvrM+LMFueMjnbXrsaD8Ru11/0oKEH5MBfBk+1eVBsN9Bjnyirteube5SbFIk2X1qcV77lX9HVtWftrYQs4w7whfcA==";
        var encryptedPrivateRsaKey = "YUuqjo8K7HCwwQ/R9K9oob/XaNKX+5SR9XiZlddc7NIdz9uul/C00JWOHN7NvG9W2vzoeO7PawclYCpRiMNbqEagL/1l632Ew/e0nwBLyvVe4KRWdn7MRxX9yL1FHdGMBG2WXj7HczL45i91qMGu9HlhOVtyBfogSug3i34l/Fh577hK/MNRZxz/oNw0juZhFsRmKTo8tOHenwjCa3xO7PGoVm0OMLyFywQBmN2HFl+5akes5S6h/sWCnl+99h11BZNFDxJa1aw2lmBpC7mDGA+CVte0n/67U1WgRNc12ktf/0R8PcbgHPXLELEiEzzNmAIAnhV1YKKySbVycO1TxxJfYgf2dwcOsoe/8mgOrHk9ATFbvY6VMkF77WetKjAicZsHtNOwU0nSiiuYaThKWJE6GQBr3cUmE25ofDGAmrbk+TG1pAvZ2KEAiEVP3ct9Zy3rLJwFf/FdhYGONWcnTdJazGDO1xnw7t/8mcZoPc/DkyyqS9I6r0ReXoxT13BVWOco9yIC3wUOlw5u4zFnzYhMfxmi5r97ER/qAZLXwC9xlrxLrx7dAmj5WkX4pQFNsn7uT2qPU7VSBab6Bb6GyGB11alKnEIJJB67EoHA61GEO9Ug275XOyzNXm5p+QG0ojcGvA6aK8y1crgw17QpTnUz+5VeMQU3ZTZdqsBXxj0N3anPD1CpkfZXbG7hwNdb+rmrOraFzQ97Nw950QYGTnv+A8F6qNYaXhmHMdPXuZYrzOPxmlu05A2TPwJvwnNLwWvpS4ZPPpXf33tBICSUOthyyke0wC8Zh0MX9DWV62jkqct1CTZqKGo7xDxmq+du7b5jY4g0NDLSA5UYATnSiRajQfP8RSmeEw6a8zGJj+tIhORQczEIios1Z/oI7ZfF2Y5ge0UiBc9PwZiI92SQsVnXjVQvt8/v/MDXeMJoX/gCfiYDYgWaA7JB+TBs70HiH6yxCGlVOW1wDQTn90JcMyo+1CKUGfC8ikt6kNS/RQIucN+5epAE8mQ8L3X0UQvXdXv9tGIIZVULytINYR2PrEc6uOB39pRhiyvaZb2eksgDWK4xHOh0aiWF59sjFx6ZY2AQqNlS/F8e4Dz4zxEjGyyy9oUvt7O+Qclffzj5lqf/pCpBHkFX3THbFTs0wLgEkJ5rArbEKdFQ6eieYMt3NYX6LdgvY4MGdc3z0VVlInU9s1rJC6SakYaS1ZY59SQicqiGASm+V1oe4acv9ySFgML61gQzMBnPHFbIMMdBKmEfwQ27Ksa1Xk1VVU7Y2NDVf2rdxPSwCrbUsLAsMp+RrdDkmhe89KUJevVLmOyrKdGnKovsy/An7JYLLkT9NrE99apr9EuQzRTJUbNjuN0inT5Vg1LXNvTFBkW/e1sGasm2RUF8DS6ML797IRPjIG+RAtaqfNAIVru6c+YqXxqE2/x2E3kA9AbHkzJtoiyEcCp47/V/xEgigWezKnb+NVXzwGs1U8Se5EVsq+Macww584hyIOf3eXQlU7LnFNZ1uRCwvC4Mzj4RfRyrUxy6P1kkf67mI+4KJEIw3S90cuqM9CQTbL8d28qf7tVz9imlbLLpQn7/unteTnQMCktCcji/44V5sHgMHR2fPPJMZl2buXyQ14sg8YWvzXxbWRmuVQZME7QdgjwGIyFWxo1d3VcWCTZui9MVWxqEuHZZqK5kpuPdDQxPywUYgT7oGpN7ll0/wseSkaapUoIFlgCKzVxIwWUPLwMBm28+DYsEVQTSg8bRO5TZW7e0HSxCNyqQaGvslLMzAWROWf21yWWBqLG6ROoUR94RKp+Fz5Mm/xupgXoYE099iMw/IE3XDO6ZR2ddiiPtnnLgA9Ade0j64C3w19o4rRwl6J9SUyJJoJ8Q8W48OKEwizm2ztfiw4Vzm0t0gmDU9zpVrpgl67aQ7fGJtC9+VGYEk0psGez22PHoA4QxFX8uWpH8AjMXr9YAUJMypFyDvGBkdEe5wRcmJx5u9HngwcLCRwAt7hh7J0+XaV9Z3z9fT2mtlgqw4hcvSaK8sWjZB0BdkfRJJt5QzHsLaQg3sYMFe5zyGuhKVqR6SbSltCF3r3JJpkk1x6ziegVhc/BNdigbTC5NpkTt9Ccc7BeI+ReAaMhPYUnY0W8XV+u6UMdPrIzwDCUhaKBHRdNYfS+HjQCeazADEhzUntFyj5MeXwE9czcCe3bA1wiNsfB75GoKWYwpH7+3Se7VRMUOamEnC3CbhaAkE3s13staWX06ONS6rzE2Xcs2E8dZULAOOQTk8N0sciD9686yn7rGHlN4dOi5+WpWAjTe/z+Ey7AXVVDWyp+WjF3qIRmN7SvvejKcFXWymK/Jxyqa6tLj/Rhbp4JYg3Y7QLB33g+LvBc6jxgrtGjcqYNb3smgpb9gDqu/yRQjOpa6TVWmEs3AahvXcDhhUbMLfUw2KxNF";

        // test the JavaScript encryption with above data
        var aesKey = aesFacade.hexToKey(aesHexKey);
        // run the encryption with static iv. for the random iv we can just check the decryption.
        var jsEncryptedUtf8DataStaticIv = aesFacade.encryptUtf8Index(aesKey, utf8Data);
        assert.equal(encryptedUtf8DataStaticIv, jsEncryptedUtf8DataStaticIv);
        // check that the Java encrypted utf8 data can be decrypted
        var jsDecryptedUtf8RandomIv = aesFacade.decryptUtf8(aesKey, encryptedUtf8DataRandomIv);
        var jsDecryptedUtf8StaticIv = aesFacade.decryptUtf8Index(aesKey, encryptedUtf8DataStaticIv);
        assert.equal(utf8Data, jsDecryptedUtf8RandomIv);
        assert.equal(utf8Data, jsDecryptedUtf8StaticIv);

        // check that the aes key encryption/decryption works like in Java
        var aesKeyForEncryption = aesFacade.hexToKey(aesKeyData);
        var jsEncryptedKeyData = aesFacade.encryptKey(aesKey, aesKeyForEncryption);
        assert.equal(encryptedKeyData, jsEncryptedKeyData);

        // check rsa private key decryption with aes (check decryption, because encryption is done with random iv)
        var jsDecryptedPrivateRsaKey = aesFacade.decryptPrivateRsaKey(aesKey, encryptedPrivateRsaKey);
        assert.equal(rsaPrivateHexKey, jsDecryptedPrivateRsaKey);

        // check that the java generated rsa keys work with js encryption/decryption
        var rsaPrivateKey = rsaAdapter.hexToPrivateKey(rsaPrivateHexKey);
        var rsaPublicKey = rsaAdapter.hexToPublicKey(rsaPublicHexKey);
        return tutao.locator.crypto.rsaEncrypt(rsaPublicKey, new Uint8Array(tutao.util.EncodingConverter.hexToBytes(aesKeyData))).then(function (jsEncryptedDummyKey) {
            return tutao.locator.crypto.rsaDecrypt(rsaPrivateKey, jsEncryptedDummyKey).then(function (jsDecryptedDummyKey) {
                assert.equal(aesKeyData, tutao.util.EncodingConverter.bytesToHex(jsDecryptedDummyKey));

                // check aes key decryption with rsa (check decryption, because encryption is done with random iv)
                return tutao.locator.crypto.rsaDecrypt(rsaPrivateKey, tutao.util.EncodingConverter.base64ToUint8Array(encryptedAesKey)).then(function (jsDecryptedAesKey) {
                    assert.equal(aesHexKey, tutao.util.EncodingConverter.bytesToHex(jsDecryptedAesKey));
                });
            });
        });
    });

    for (var i = 0; i < compatibilityTestData.encryptionTests.length; i++) {
        var td = compatibilityTestData.encryptionTests[i];

        it("verify rsa implementation and padding: " + i, function () {
            var crypto = new tutao.native.CryptoBrowser();
            crypto._random = function(byteLength) {
                if (byteLength != 32) {
                    throw new Error(byteLength + "!");
                } else {
                    return tutao.util.EncodingConverter.hexToBytes(td.seed);
                }
            };

            var rsaUtils = new tutao.native.RsaUtils();
            var publicKey = rsaUtils.hexToPublicKey(td.publicKey);


            return crypto.rsaEncrypt(publicKey, tutao.util.EncodingConverter.hexToBytes(td.input)).then(function (encryptedData) {
                assert.equal(td.result, tutao.util.EncodingConverter.bytesToHex(encryptedData));

                var privateKey = rsaUtils.hexToPrivateKey(td.privateKey);
                return crypto.rsaDecrypt(privateKey, encryptedData).then(function (data) {
                    assert.equal(td.input, tutao.util.EncodingConverter.bytesToHex(data));
                });
            });
        });
    }

    it("testAes256GcmJavaCompatibility", function () {
        var facade = new tutao.crypto.SjclAes256Gcm();
        for (var i = 0; i < compatibilityTestData.aes256GcmTests.length; i++) {
            var td = compatibilityTestData.aes256GcmTests[i];
            var key = facade.hexToKey(td.hexKey);
            if (td.type == "UTF8") {
                var decryptedUtf8 = facade.decryptUtf8(key, td.cipherTextBase64);
                assert.equal(decryptedUtf8, td.plainText);
            } else  if (td.type == "BYTES") {
                var decryptedBytes = facade.decryptBytes(key, td.cipherTextBase64);
                assert.equal(decryptedBytes, td.plainText);
            } else if (td.type == "AES_KEY") {
                var decryptedKey = facade.decryptKey(key, td.cipherTextBase64);
                assert.equal(facade.keyToHex(decryptedKey), td.plainText);
            } else if (td.type == "RSA_KEY") {
                var decryptedRsaKey = facade.decryptPrivateRsaKey(key, td.cipherTextBase64);
                assert.equal(decryptedRsaKey, td.plainText);
            } else {
                throw new Error("invalid type: " + td.type);
            }
        }
    });
});
