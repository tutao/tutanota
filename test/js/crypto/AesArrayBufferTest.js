"use strict";

goog.provide('AesArrayBufferTest');

var AesArrayBufferTest = AsyncTestCase("AesArrayBufferTest");

AesArrayBufferTest.prototype._getFacade = function() {
	return tutao.locator.aesCrypter;
};

AesArrayBufferTest.prototype.testArrayBufferRoundtrip = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = this._getFacade();
		var key = facade.generateRandomKey();
		self._arrayBufferRoundtrip(key, self._createArrayBuffer(0), callbacks.add(function() {
		self._arrayBufferRoundtrip(key, self._createArrayBuffer(1), callbacks.add(function() {
		self._arrayBufferRoundtrip(key, self._createArrayBuffer(15), callbacks.add(function() {
		self._arrayBufferRoundtrip(key, self._createArrayBuffer(16), callbacks.add(function() {
		self._arrayBufferRoundtrip(key, self._createArrayBuffer(17), callbacks.add(function() {
		self._arrayBufferRoundtrip(key, self._createArrayBuffer(12345), callbacks.add(function() {		
		}));}));}));}));}));}));
	});
};

AesArrayBufferTest.prototype._arrayBufferRoundtrip = function(key, arrayBuffer, callback) {
	var facade = this._getFacade();
	facade.encryptArrayBuffer(key, arrayBuffer, function(encrypted, exception) {
		assertUndefined(exception);
		facade.decryptArrayBuffer(key, encrypted, arrayBuffer.byteLength, function(decrypted, exception) {
			assertUndefined(exception);
			assertEquals(arrayBuffer.byteLength, decrypted.byteLength);
			var view = new Uint8Array(arrayBuffer);
			var view2 = new Uint8Array(decrypted);
			for (var i=0; i<arrayBuffer.byteLength; i++) {
				assertEquals(view[i], view2[i]);
			}
			callback();
		});
	});
};

/**
 * This test only runs if SjclAes is available. It uses the private function _encryptArrayBuffer in SjclAes to allow providing the
 * iv from outside
 */
AesArrayBufferTest.prototype.testArrayBufferImplementationCompatibility = function(queue) {
	queue.call('test', function(callbacks) {
		var facade = this._getFacade();
		var key = facade.generateRandomKey();
		var iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(16));
		this._encryptArrayBuffer(key, iv, this._createArrayBuffer(0), callbacks.add(function() {
		this._encryptArrayBuffer(key, iv, this._createArrayBuffer(1), callbacks.add(function() {
		this._encryptArrayBuffer(key, iv, this._createArrayBuffer(15), callbacks.add(function() {
		this._encryptArrayBuffer(key, iv, this._createArrayBuffer(16), callbacks.add(function() {
		this._encryptArrayBuffer(key, iv, this._createArrayBuffer(17), callbacks.add(function() {
		this._encryptArrayBuffer(key, iv, this._createArrayBuffer(12345), callbacks.add(function() {
		}));}));}));}));}));}));
	});
};

AesArrayBufferTest.prototype._encryptArrayBuffer = function(key, iv, arrayBuffer, callback) {
	var self = this;
	var facade = new tutao.crypto.SjclAes();

	// encrypt array buffer
	facade._encryptArrayBuffer(key, arrayBuffer, iv, function(encrypted, exception) {
		assertUndefined(exception);
		var encryptedConvertedBits = self._arrayBufferToBitArray(encrypted);		
		// encrypt as bitArray
		var words = self._arrayBufferToBitArray(arrayBuffer);
		var encryptedBits = sjcl.bitArray.concat(iv, sjcl.mode.cbc.encrypt(new sjcl.cipher.aes(key), words, iv, [], true));

		// check equality of enrypted array buffer and bitArray
		assertEquals(encryptedBits, encryptedConvertedBits);
		callback();
	});
};

AesArrayBufferTest.prototype._bitArrayToArrayBuffer = function(arr) {
	var bl = sjcl.bitArray.bitLength(arr) / 8;
	var arrayBuffer = new ArrayBuffer(bl);
	var out = new Uint8Array(arrayBuffer);
	var tmp;
	for (var i=0; i<bl; i++) {
		if ((i&3) === 0) {
			tmp = arr[i/4];
		}
		out[i] = (tmp >>> 24);
		tmp <<= 8;
	}
	return arrayBuffer;
};

AesArrayBufferTest.prototype._arrayBufferToBitArray = function(arrayBuffer) {
	var bytes = new Uint8Array(arrayBuffer);
	var out = [];
	var i;
	var tmp = 0;
	for (i=0; i<bytes.length; i++) {
		tmp = tmp << 8 | bytes[i];
		if ((i&3) === 3) {
			out.push(tmp);
			tmp = 0;
		}
	}
	if (i&3) {
		out.push(sjcl.bitArray.partial(8*(i&3), tmp));
	}
	return out;
};

AesArrayBufferTest.prototype._createArrayBuffer = function(len) {
	var arrayBuffer = new ArrayBuffer(len);
	var view = new Uint8Array(arrayBuffer);
	for (var i=0; i<len; i++) {
		view[i] = tutao.util.EncodingConverter.hexToBytes(tutao.locator.randomizer.generateRandomData(1));
	}
	return arrayBuffer;
};

AesArrayBufferTest.prototype.testEncryptInvalidIvLength = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		var iv = sjcl.codec.hex.toBits(tutao.locator.randomizer.generateRandomData(15));
		var arrayBuffer = self._createArrayBuffer(10);
		facade._encryptArrayBuffer(key, arrayBuffer, iv, callbacks.add(function(encrypted, exception) {
			assertNull(encrypted);
			assertNotNull(exception);
			assertInstanceOf(tutao.crypto.CryptoError, exception);
		}));
	});
};

AesArrayBufferTest.prototype.testEncryptInvalidKey = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = tutao.locator.aesCrypter;
		var key = facade.generateRandomKey().slice(0,3);
		var arrayBuffer = self._createArrayBuffer(10);
		facade.encryptArrayBuffer(key, arrayBuffer, callbacks.add(function(encrypted, exception) {
			assertNull(encrypted);
			assertNotNull(exception);
			assertInstanceOf(tutao.crypto.CryptoError, exception);
		}));
	});
};

AesArrayBufferTest.prototype._getEncryptedArrayBuffer = function(key, bufferLen, callback) {
	var facade = tutao.locator.aesCrypter;
	var arrayBuffer = this._createArrayBuffer(bufferLen);
	facade.encryptArrayBuffer(key, arrayBuffer, function(encrypted, exception) {
		assertUndefined(exception);
		callback(encrypted);
	});
};

AesArrayBufferTest.prototype.testDecryptInvalidKey = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = tutao.locator.aesCrypter;
		var key = facade.generateRandomKey().slice(0,3);
		var arrayBuffer = self._createArrayBuffer(10);
		facade.decryptArrayBuffer(key, arrayBuffer, 10, callbacks.add(function(encrypted, exception) {
			assertNull(encrypted);
			assertNotNull(exception);
			assertInstanceOf(tutao.crypto.CryptoError, exception);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptInvalidSrcBufferLen = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = tutao.locator.aesCrypter;
		var key = facade.generateRandomKey();
		var encrypted = self._createArrayBuffer(33); // 33 is no valid encrypted size
		facade.decryptArrayBuffer(key, encrypted, 2, callbacks.add(function(decrypted, exception) {
			assertNull(decrypted);
			assertNotNull(exception);
			assertInstanceOf(tutao.crypto.CryptoError, exception);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptInvalidDstBufferLen = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = tutao.locator.aesCrypter;
		var key = facade.generateRandomKey();
		var encrypted = self._createArrayBuffer(48); // encrypted 48 bytes it too big for 4 plain text bytes
		facade.decryptArrayBuffer(key, encrypted, 4, callbacks.add(function(decrypted, exception) {
			assertNull(decrypted);
			assertNotNull(exception);
			assertInstanceOf(tutao.crypto.CryptoError, exception);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptInvalidEncrypted = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		self._getEncryptedArrayBuffer(key, 10, callbacks.add(function(encrypted) {
			var view = new Uint8Array(encrypted);
			// change the last byte
			view[encrypted.byteLength - 1] = view[encrypted.byteLength - 1] + 1;
			facade.decryptArrayBuffer(key, encrypted, 10, callbacks.add(function(decrypted, exception) {
				assertNull(decrypted);
				assertNotNull(exception);
				assertInstanceOf(tutao.crypto.CryptoError, exception);
			}));
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptInvalidDecryptedSize = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		self._getEncryptedArrayBuffer(key, 10, callbacks.add(function(encrypted) {
			// use 11 instead of 10
			facade.decryptArrayBuffer(key, encrypted, 11, callbacks.add(function(decrypted, exception) {
				assertNull(decrypted);
				assertNotNull(exception);
				assertInstanceOf(tutao.crypto.CryptoError, exception);
			}));
		}));
	});
};

// the padding exceptions can not be tested easily because the encryption must be modified for that  


//tests sjcl conversion from 4 bytes to 32 bit signed integer (big endian)
AesArrayBufferTest.prototype.testByteTo32BitRoundtrip = function() {
	var facade = this._getFacade();
	assertEquals([0], sjcl.codec.bytes.toBits([0,0,0,0]));
	assertEquals([255], sjcl.codec.bytes.toBits([0,0,0,255]));
	assertEquals([256], sjcl.codec.bytes.toBits([0,0,1,0]));
	assertEquals([256 * 256], sjcl.codec.bytes.toBits([0,1,0,0]));
	assertEquals([256 * 256 * 256], sjcl.codec.bytes.toBits([1,0,0,0]));
	assertEquals([(256 * 256 * 256 * 128) - 1], sjcl.codec.bytes.toBits([127,255,255,255]));
	assertEquals([-(256 * 256 * 256 * 128)], sjcl.codec.bytes.toBits([128,0,0,0]));
	assertEquals([-1], sjcl.codec.bytes.toBits([255,255,255,255]));
	
	assertEquals([0,0,0,0], sjcl.codec.bytes.fromBits([0]));
	assertEquals([0,0,0,255], sjcl.codec.bytes.fromBits([255]));
	assertEquals([0,0,1,0], sjcl.codec.bytes.fromBits([256]));
	assertEquals([0,1,0,0], sjcl.codec.bytes.fromBits([256 * 256]));
	assertEquals([1,0,0,0], sjcl.codec.bytes.fromBits([256 * 256 * 256]));
	assertEquals([127,255,255,255], sjcl.codec.bytes.fromBits([(256 * 256 * 256 * 128) - 1]));
	assertEquals([128,0,0,0], sjcl.codec.bytes.fromBits([-(256 * 256 * 256 * 128)]));
	assertEquals([255,255,255,255], sjcl.codec.bytes.fromBits([-1]));
	
};

AesArrayBufferTest.prototype.testDecryptBase64InvalidBase64 = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		facade.decryptBase64(key, "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh&=", 6, callbacks.add(function(decryptedBase64, exception) {
			assertNotNull(exception);
			assertEquals("error during base64 decryption, original message: this isn't base64!", exception.message);
			assertNull(decryptedBase64);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64InvalidKey = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		facade.decryptBase64([1, 2], "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=", 6, callbacks.add(function(decryptedBase64, exception) {
			assertNotNull(exception);
			assertEquals("invalid key length: 64", exception.message);
			assertNull(decryptedBase64);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64InvalidSrcBuffer = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		facade.decryptBase64(key, "AAECA", 6, callbacks.add(function(decryptedBase64, exception) {
			assertNotNull(exception);
			assertEquals("invalid src buffer len: 3.75", exception.message);
			assertNull(decryptedBase64);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64TooSmallSrcBuffer = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		facade.decryptBase64(key, "AAECAwQFBgcICQoLDA0ODA==", 6, callbacks.add(function(decryptedBase64, exception) {
			assertNotNull(exception);
			assertEquals("invalid src buffer len: 16", exception.message);
			assertNull(decryptedBase64);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64InvalidPadding = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.hexToKey("a8db9ef70c44dc8acce26e9f44ca2f37"); // use a fixed key here to avoid that the padding value might accidentally be correct
		facade.decryptBase64(key, "AAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8=", 17, callbacks.add(function(decryptedBase64, exception) {
			assertNotNull(exception);
			assertEquals("invalid padding value: 243", exception.message);
			assertNull(decryptedBase64);
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64InvalidDecryptedSize = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		facade.encryptArrayBuffer(key, self._createArrayBuffer(64), callbacks.add(function(encrypted, exception) {
			var encryptedBase64 = sjcl.codec.base64.fromBits(self._arrayBufferToBitArray(encrypted));
			facade.decryptBase64(key, encryptedBase64, 65, callbacks.add(function(decryptedBase64, exception) {
				assertNotNull(exception);
				assertEquals("invalid decrypted size: 65, expected: 64", exception.message);
				assertNull(decryptedBase64);
			}));
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64InvalidDstLen = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		facade.encryptArrayBuffer(key, self._createArrayBuffer(64), callbacks.add(function(encrypted, exception) {
			var encryptedBase64 = sjcl.codec.base64.fromBits(self._arrayBufferToBitArray(encrypted));
			facade.decryptBase64(key, encryptedBase64, 63, callbacks.add(function(decryptedBase64, exception) {
				assertNotNull(exception);
				assertEquals("invalid dst buffer len: 63, src buffer len: 96", exception.message);
				assertNull(decryptedBase64);
			}));
		}));
	});
};

AesArrayBufferTest.prototype.testDecryptBase64Roundtrip = function(queue) {
	var self = this;
	queue.call('test', function(callbacks) {
		var facade = new tutao.crypto.SjclAes();
		var key = facade.generateRandomKey();
		self._base64Roundtrip(facade, key, self._createArrayBuffer(0), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(1), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(15), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(16), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(17), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(31), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(32), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(33), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(63), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(64), callbacks);
		self._base64Roundtrip(facade, key, self._createArrayBuffer(12345), callbacks);		
		self._base64Roundtrip(facade, key, self._createArrayBuffer(120 * 1024), callbacks); // more than 100 KB to test the stTimeout
	});
};

AesArrayBufferTest.prototype._base64Roundtrip = function(facade, key, arrayBuffer, callbacks) {
	var self = this;
	var unencryptedBits = self._arrayBufferToBitArray(arrayBuffer);
	var unencryptedBytes = sjcl.codec.bytes.fromBits(unencryptedBits);
	var unencryptedBase64 = sjcl.codec.base64.fromBits(unencryptedBits);
	facade.encryptArrayBuffer(key, arrayBuffer, callbacks.add(function(encrypted, exception) {
		var encryptedBase64 = sjcl.codec.base64.fromBits(self._arrayBufferToBitArray(encrypted));
		facade.decryptBase64(key, encryptedBase64, arrayBuffer.byteLength, callbacks.add(function(decryptedBase64, exception) {
			assertUndefined(exception);
			assertEquals(unencryptedBase64, decryptedBase64);
		}));
	}));
};

// implementation not used currently
//AesArrayBufferTest.prototype.testArrayExceptionOnWorkerProxy = function(queue) {
//	var self = this;
//	queue.call('test', function(callbacks) {
//		var facade = self._getFacade();
//		assertException(function() {
//			facade.decryptArray();
//		}, tutao.crypto.CryptoError);
//	});
//};
//
//AesArrayBufferTest.prototype.testArrayRoundtrip = function(queue) {
//	var self = this;
//	queue.call('test', function(callbacks) {
//		var facade = new tutao.crypto.SjclAes();
//		var key = facade.generateRandomKey();
//		self._arrayRoundtrip(facade, key, self._createArrayBuffer(0), callbacks);
//		self._arrayRoundtrip(facade, key, self._createArrayBuffer(1), callbacks);
//		self._arrayRoundtrip(facade, key, self._createArrayBuffer(15), callbacks);
//		self._arrayRoundtrip(facade, key, self._createArrayBuffer(16), callbacks);
//		self._arrayRoundtrip(facade, key, self._createArrayBuffer(17), callbacks);
//		self._arrayRoundtrip(facade, key, self._createArrayBuffer(12345), callbacks);		
//	});
//};
//
//AesArrayBufferTest.prototype._arrayRoundtrip = function(facade, key, arrayBuffer, callbacks) {
//	var self = this;
//	var unencryptedBytes = sjcl.codec.bytes.fromBits(self._arrayBufferToBitArray(arrayBuffer));
//	facade.encryptArrayBuffer(key, arrayBuffer, callbacks.add(function(encrypted, exception) {
//		facade.decryptArray(key, sjcl.codec.bytes.fromBits(self._arrayBufferToBitArray(encrypted)), arrayBuffer.byteLength, callbacks.add(function(decrypted, exception) {
//			assertUndefined(exception);
//			assertEquals(arrayBuffer.byteLength, decrypted.length);
//			assertEquals(unencryptedBytes, decrypted);
//		}));
//	}));
//};
