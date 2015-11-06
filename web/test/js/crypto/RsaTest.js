"use strict";

describe("RsaTest", function () {

    var assert = chai.assert;
    var rsaUtils = new tutao.native.RsaUtils();

    this.timeout(1000 * 60 *3); // 3 min

    var _rsa;
    var getFacade = function () {
        if (!_rsa) {
            //_rsa = new tutao.crypto.RsaWorkerProxy();
            _rsa = new tutao.native.CryptoBrowser();
        }
        return _rsa;
    }

    var hexToUInt8Array = function(hex){
        return tutao.util.EncodingConverter.base64ToArray(tutao.util.EncodingConverter.hexToBase64(hex));
    }


    /**
     * Reuse the key pair to save time
     */
    var _keyPair;
    var _getKeyPair = function() {
        if (!_keyPair) {
            return getFacade().generateRsaKey().then(function(keyPair) {
                _keyPair = keyPair;
                return _keyPair;
            });
        } else {
            return Promise.resolve(_keyPair);
        }
    }

    it("hex key conversion", function(done) {
        if (tutao.supportsRsaKeyGeneration()) {
            var facade = getFacade();

            _getKeyPair().then(function(keyPair) {
                var hexPrivateKey = rsaUtils.privateKeyToHex(keyPair.privateKey);
                var hexPublicKey = rsaUtils.publicKeyToHex(keyPair.publicKey);
                assert.equal(hexPrivateKey, rsaUtils.privateKeyToHex(rsaUtils.hexToPrivateKey(hexPrivateKey)));
                assert.equal(hexPublicKey, rsaUtils.publicKeyToHex(rsaUtils.hexToPublicKey(hexPublicKey)));
                done();
            });
        }
    });

    it("invalid hex key conversion", function() {
        var hexPublicKey = "hello";
        var facade = getFacade();
        assert.throws(function () {
            var publicKey = rsaUtils.hexToPublicKey(hexPublicKey);
        }, tutao.crypto.CryptoError);
    });

    it("that hex keys have an even number of characters", function() {
        var privateKey = [];
        privateKey.push(parseBigInt("780377be21c903ecb8bf042e24b7d2860fd0da2c8d79aded94d2fe3bd89892ee161317529a7a011bb985899277bff28ba6b9a2ac7d63caccb5fa37a24e6faa2d69ed0b7ba10279a84172d3e00561d1efe234108dd4a3335da88483c282bb178af0168245c50330fcd988018e14962efbe8bca87bbc620945453c3b559f666472bb23447c6dea5591e89ec34f73e90702dca8837ba709e5065c6aaa12628a388e941174f0cd573935e5a80ec498031a4859101735e31b45765b9d071eac4b79b7a0cc859c5e035af853fce48fd848613ba4b3c09eb6b71a09f9dfc7ac1aaa50685f60e84f75afc3c0a13123136798aa328fe17397df2687d9d82f39121bb1ed01", 16));
        privateKey.push(parseBigInt("122c5441925422280281ca5c426b2391f16b2ade7c3de4bc8940ba06cdf1acae28e193328af9d699202abc7e556bd78a96209e25888747fa5fc4181097d808e8ff95499bdaf1c9025586d1d6a679fd9459a890a9297ddd155da353606cf36fc93639f25826512965e07adbe16bf4a200bb697609e6a8e1c67f897362afd48d792cbcadeaab3e9dda29f9abc49f4b5541a04233c522ab756d7b395f513788f645c1772d5f394a53d32b67e46b38f8af4b3dddc35c42b1272383965537ca62595a12f1438687aa136bc07fbe591bd91502046bf56535a6ebf69a177be25ca060cb01b3ba3c5f9a63ef0c4b31b68086e13c9ad2014c8c1487a28d06c90c9a03a0c1", 16));
        privateKey.push(parseBigInt("c3bd68ca645f97614cfbe768dc3a8930d6878de4132b09703c6c8b9a1215b337956a52d7cac9b7e28257eb64012be69d93b1c865bbdb68913d61469bf22d22061ac74c4b0c8be6a0abf40e788d71b63347f455dbeacb3b00f4ce697c55c4fe761d4cc5f2c6c7a614a34b10b8bd9e04d0ae6d2165e7c7f61e36afe554f57cae05", 16));
        privateKey.push(parseBigInt("9cf5f0248ab2071ef7c8aec0069b1422925c4a1df6b4a72504adac480dbdf0fe782e0661e47c7375df0e1ad5fa1b318089e88b053d8033dcb09aa922e111244bfb90757ab74b364813e0014d9d1f7e7af68b5d85f1454a4eb8244d86bd7fc00f4aacf39df38e5b8b96099e54d3f07d0cf567a057cc9f952966dab1dbd1b1b7cd", 16));
        privateKey.push(parseBigInt("1ed42c37044c11f99f3865a01c5f93cfff59e63d2fcfad72e1f16ea35b89d36a43bc35440b8a6dcddd1d9fd36663d5b4a7d86e69a786cd176305792b829f1d26bcfcfac52f3ab19e48b6edb88afe87e5d7c561e87b387b18917619231e1722c4d3a48de0c8f214f4572bb17c8750e60d400bac20f2ba89c70471fbbabfd75d49", 16));
        privateKey.push(parseBigInt("d03af67b8404eaad8acc12096eba0ddc4f8f6044a026ca17b23d3571e1c93b0e5d21b215eca9ae03920784529b9bb7f06f04b26a214d1380944a9a584b7e12493b544a86a2e484feda5f335b643783f45d6046928ba30111adf97b6065c63566140b9ea6cd96ee9c2050625ce74f04974c7a4d9e2d39090a0409de2b61e6039", 16));
        privateKey.push(parseBigInt("59b796421c14e90568543a263f10ca4a7c0873d8a9615f969fc328900e07f7106b30b3410e94ee40069052bcc15ec419c0937a71ab855242b746129bedc947a48deffb51ed99ea3255b3bf59bc1a4d3cea9163ef5d076c5e355b07134725903e49e4cdc48c5bd096b16d54aa0d0087bd939213134ffacf9a084fb04399d03a7e", 16));
        assert.equal(0, rsaUtils._keyToHex(privateKey).length % 2);
    });

    it("rsa key roundtrip", function(done) {
        //this.timeout(300000); // 5 min
        if (tutao.supportsRsaKeyGeneration()) {

            var facade = getFacade();
            return _getKeyPair().then(function(keyPair) {

                var hexPrivateKey = rsaUtils.privateKeyToHex(keyPair.privateKey);
                assert.equal(hexPrivateKey, rsaUtils.privateKeyToHex(rsaUtils.hexToPrivateKey(hexPrivateKey)));

                var hexPublicKey = rsaUtils.publicKeyToHex(keyPair.publicKey);
                assert.equal(hexPublicKey, rsaUtils.publicKeyToHex(rsaUtils.hexToPublicKey(hexPublicKey)));

                var plain = hexToUInt8Array("88888888888888888888888888888888"); // = 16 byte sym key

                return facade.rsaEncrypt(keyPair.publicKey, plain).then(function(encrypted) {
                    return facade.rsaDecrypt(keyPair.privateKey, encrypted).then(function(plainAgain) {
                        assert.deepEqual(plain, plainAgain);
                        done();
                    });
                });
            });
        }
    });

    it("test randomizer adapter", function() {
        var a = new Array();
        a.length = 100;

        var seed = new Uint8Array(a.length);
        window.crypto.getRandomValues(seed);

        var random = [];
        for (var i = 0; i < seed.length; i++) {
            random.push(seed[i]);
        }
        SecureRandom.setNextRandomBytes(random);
        new SecureRandom().nextBytes(a);
        for (var i=0; i<a.length; i++) {
            assert.isTrue(a[i] >= 0);
            assert.isTrue(a[i] <= 255);
        }
        assert.throw(function() {
            new SecureRandom().nextBytes([0]);
        }, "SecureRandom does not have random numbers.")
    });


    it("test decrypt with invalid key", function(done) {
        var facade = getFacade();
        var rsaPrivateHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c";
        // use an invalid key. value is changed: ---------||
        var rsaPublicHexKey = "02008e8bf43e2990a46042da8168aebed699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f";
        var privateKey = rsaUtils.hexToPrivateKey(rsaPrivateHexKey);
        var publicKey = rsaUtils.hexToPublicKey(rsaPublicHexKey);
        var plain = hexToUInt8Array("88888888888888888888888888888888"); // = 16 byte sym key
        facade.rsaEncrypt(publicKey, plain).then(function(encrypted) {
            facade.rsaDecrypt(privateKey, encrypted).caught(function(exception) {
                assert.instanceOf(exception, tutao.crypto.CryptoError);
                done();
            });
        });
    });

    it("test decrypt invalid data", function(done) {
        var facade = getFacade();
        var rsaPrivateHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c";
        var rsaPublicHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f";
        var privateKey = rsaUtils.hexToPrivateKey(rsaPrivateHexKey);
        var publicKey = rsaUtils.hexToPublicKey(rsaPublicHexKey);
        var plain = hexToUInt8Array("88888888888888888888888888888888"); // = 16 byte sym key
        facade.rsaEncrypt(publicKey, plain).then(function(encrypted) {
            facade.rsaDecrypt(privateKey, encrypted + "hello").caught(function(exception) {
                assert.instanceOf(exception, tutao.crypto.CryptoError);
                done();
            });
        });
    });

    it("test rsa worker queue", function(done) {
        var facade = getFacade();
        var rsaPrivateHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f02002a7622214a3c5dda96cf83f0ececc3381c06ccce69446c54a299fccef49d929c1893ae1326a9fe6cc9727f00048b4ff7833d26806d40a31bbf1bf3e063c779c61c41b765a854fd1338456e691bd1d48571343413479cf72fa920b34b9002fbbbff4ea86a3042fece17683686a055411357a824a01f8e3b277dd54c690d59fd4c8258009707d917ce43d4a337dc58bb55394c4f87b902e7f78fa0abe35e35444bda46bfbc38cf87c60fbe5c4beff49f8e6ddbf50d6caafeb92a6ccef75474879bdb82c9c9c5c35611207dbdb7601c87b254927f4d9fd25ba7694987b5ca70c8184058a91e86cb974a2b7694d6bb08a349b953e4c9a017d9eecada49eb2981dfe10100c7905e44c348447551bea10787da3aa869bbe45f10cff87688e2696474bd18405432f4846dcee886d2a967a61c1adb9a9bc08d75cee678053bf41262f0d9882c230bd5289518569714b961cec3072ed2900f52c9cdc802ee4e63781a3c4acaee4347bd9ab701399a0b96cdf22a75501f7f232069e7f00f5649be5ac3d73edd970100b6dbc3e909e1b69ab3f5dd6a55d7cc68d2b803d3da16941410ab7a5b963e5c50316a52380d4b571633d870ca746b4d6f36e0a9d90cf96a2ddb9c61d5bc9dbe74473f0be99f3642100c1b8ad9d592c6a28fa6570ccbb3f7bb86be8056f76473b978a55d458343dba3d0dcaf152d225f20ccd384706dda9dd2fb0f5f6976e603e901002fd80cc1af8fc3d9dc9f373bf6f5fada257f46610446d7ea9326b4ddc09f1511571e6040df929b6cb754a5e4cd18234e0dc93c20e2599eaca29301557728afdce50a1130898e2c344c63a56f4c928c472f027d76a43f2f74b2966654e3df8a8754d9fe3af964f1ca5cbceae3040adc0ab1105ad5092624872b66d79bdc1ed6410100295bc590e4ea4769f04030e747293b138e6d8e781140c01755b9e33fe9d88afa9c62a6dc04adc0b1c5e23388a71249fe589431f664c7d8eb2c5bcf890f53426b7c5dd72ced14d1965d96b12e19ef4bbc22ef858ae05c01314a05b673751b244d93eb1b1088e3053fa512f50abe1da314811f6a3a1faeadb9b58d419052132e59010032611a3359d91ce3567675726e48aca0601def22111f73a9fea5faeb9a95ec37754d2e52d7ae9444765c39c66264c02b38d096df1cebe6ea9951676663301e577fa5e3aec29a660e0fff36389671f47573d2259396874c33069ddb25dd5b03dcbf803272e68713c320ef7db05765f1088473c9788642e4b80a8eb40968fc0d7c";
        var rsaPublicHexKey = "02008e8bf43e2990a46042da8168aebec699d62e1e1fd068c5582fd1d5433cee8c8b918799e8ee1a22dd9d6e21dd959d7faed8034663225848c21b88c2733c73788875639425a87d54882285e598bf7e8c83861e8b77ab3cf62c53d35e143cee9bb8b3f36850aebd1548c1881dc7485bb51aa13c5a0391b88a8d7afce88ecd4a7e231ca7cfd063216d1d573ad769a6bb557c251ad34beb393a8fff4a886715315ba9eac0bc31541999b92fcb33d15efd2bd50bf77637d3fc5ba1c21082f67281957832ac832fbad6c383779341555993bd945659d7797b9c993396915e6decee9da2d5e060c27c3b5a9bc355ef4a38088af53e5f795ccc837f45d0583052547a736f";
        var privateKey = rsaUtils.hexToPrivateKey(rsaPrivateHexKey);
        var publicKey = rsaUtils.hexToPublicKey(rsaPublicHexKey);
        var plain1 = hexToUInt8Array("88888888888888888888888888888888"); // = 16 byte sym key
        var plain2 = hexToUInt8Array("55555555555555555555555555555555"); // = 16 byte sym key
        // call the rsa facade twice to make sure the operations are queued for the rsa worker
        facade.rsaEncrypt(publicKey, plain1).then(function(encrypted) {
            return facade.rsaDecrypt(privateKey, encrypted).then(function(decrypted) {
                assert.deepEqual(plain1, decrypted);
            });
        });
        facade.rsaEncrypt(publicKey, plain2).then(function(encrypted) {
            return facade.rsaDecrypt(privateKey, encrypted).then(function(decrypted) {
                assert.deepEqual(plain2, decrypted);
                done();
            });
        });
    });
});