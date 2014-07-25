// to do sequentielles Ausführen, Code Coverage, Gradle beendet sich nicht, Lösung für Requires (nur Node-Unit-Tests)

//"use strict";
//
//if (typeof module == "object" && typeof require == "function") {
//    var buster = require("buster");
//    require("main/js/crypto/JsbnRSA.js");
//    require("main/js/Locator.js");
//}
//
//
//buster.testCase("RsaTest", {
//	
//	"setUp": function() {
//		this.facade = new tutao.crypto.JsbnRSA();
//	},
//
//	"test rsa key roundtrip": function() {
//		if (tutao.supportsRsaKeyGeneration()) {
//			var keyPair = this.facade.generateKeyPair();
//			var hexPrivateKey = this.facade.keyToHex(keyPair.privateKey);
//			assert.equals(hexPrivateKey, this.facade.keyToHex(this.facade.hexToKey(hexPrivateKey)));
//
//			var hexPublicKey = this.facade.keyToHex(keyPair.publicKey);
//			assert.equals(hexPublicKey, this.facade.keyToHex(this.facade.hexToKey(hexPublicKey)));
//			
//			var plain = "88888888888888888888888888888888"; // = 16 byte sym key
//			var encrypted = this.facade.encryptRSAHex(keyPair.publicKey, plain);
//			var plainAgain = this.facade.decryptRSAHex(keyPair.privateKey, encrypted);
//			assert.equals(plain, plainAgain);
//		}
//	},
//	
//	"test loading keys in clean environment": function() {
//		// in JsbnRSA a new internal object is created which caches the key data, e.g. when a key pair is created.
//		// this test shall make sure that encryption/decryption in a clean environment works.
//		var hexPrivateKey = "8cecca4bc4774cc56932117491260859002a6adc381c73913d8045d2b8ef07e7a185ee73ab90eafc10078cb6f715b50d1a8c737939a6a39898fd1c8efa6ab57083c21c56579e58da947724c4b333c61bcab4b871d88efbd972c99baa48a568efe6398a60d4a9fd03cf20ffc08c67576bf9bed86ea108f3c5212025decc604219f002da5e0eb01d2afde704979c080256102654a201439401dded3568647f2d56c3b79192c55c7c15db67d54b8a0ebbe3a5a1d86a75410b63713c9d3cbb70a6d8f82dd493f3cc32c408e71446f631254a9dd73ce1bc0aae0c7fd2ef3adff45ed8c7e685836b54ff1a79fb4829d2995277e4f5560002812fe4226cca745d027db5215d3e57c9dfe4d12822ae774696168bdbba2f2a8c2e503e26ad63da8be62b9cef64e21b8896facb4a903f046263454620eef7b7cfaa6039149f784f71822a0ac56703867da003b15c4d08eb78f1dd095f6881f2922ee7f9876fabe718e3f0803ba58bd978fff5e31cfad712232ba44af009fafbd62c646a5b795cfdeead2b78d678507d5e083e14adcf2d94c7142c0773737b13901c221e4beb4f530871b70fe910afc27909b8c64ac83b9e2f6063b45a6bce2b54e942c91dc66bf4bf71f566749d33548b469782e673dceeab38e88aeede6f2bb3a74f37134bfd467c6ffec5667e7f3aa27a873d06231a472b03461914de5635f0a3647b6cad76d7378b2201";
//		var hexPublicKey = "8cecca4bc4774cc56932117491260859002a6adc381c73913d8045d2b8ef07e7a185ee73ab90eafc10078cb6f715b50d1a8c737939a6a39898fd1c8efa6ab57083c21c56579e58da947724c4b333c61bcab4b871d88efbd972c99baa48a568efe6398a60d4a9fd03cf20ffc08c67576bf9bed86ea108f3c5212025decc604219f002da5e0eb01d2afde704979c080256102654a201439401dded3568647f2d56c3b79192c55c7c15db67d54b8a0ebbe3a5a1d86a75410b63713c9d3cbb70a6d8f82dd493f3cc32c408e71446f631254a9dd73ce1bc0aae0c7fd2ef3adff45ed8c7e685836b54ff1a79fb4829d2995277e4f5560002812fe4226cca745d027db5";
//		var privateKey = this.facade.hexToKey(hexPrivateKey);
//		var publicKey = this.facade.hexToKey(hexPublicKey);
//		var plain = "88888888888888888888888888888888"; // = 16 byte sym key
//		var encrypted = this.facade.encryptRSAHex(publicKey, plain);
//		var plainAgain = this.facade.decryptRSAHex(privateKey, encrypted);
//		assert.equals(plain, plainAgain);
//	},
//	
//	"test randomizer adapter": function() {
//		var a = new Array();
//		a.length = 100;
//		new SecureRandom().nextBytes(a);
//		for (var i=0; i<a.length; i++) {
//			assert(a[i] >= 0);
//			assert(a[i] <= 255);
//		}
//	}
//});
