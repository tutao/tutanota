import { arrayEquals, assertNotNull, base64ToBase64Url, base64ToUint8Array, byteArraysToBytes, bytesToByteArrays, callWebAssemblyFunctionWithArguments, concat, hexToUint8Array, int8ArrayToBase64, mutableSecureFree, secureFree, stringToUtf8Uint8Array, uint8ArrayToArrayBuffer, uint8ArrayToBase64, uint8ArrayToHex } from "./dist2-chunk.js";
import { CryptoError } from "./CryptoError-chunk.js";

//#region packages/tutanota-crypto/dist/internal/sjcl.js
/** @fileOverview Javascript cryptography implementation.
*
* Crush to remove comments, shorten variable names and
* generally reduce transmission size.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* The Stanford Javascript Crypto Library, top-level namespace.
* @namespace
* @type any
*/
var sjcl = {
	cipher: {},
	hash: {},
	keyexchange: {},
	mode: {},
	misc: {},
	codec: {},
	exception: {
		corrupt: function(message) {
			this.toString = function() {
				return "CORRUPT: " + this.message;
			};
			this.message = message;
		},
		invalid: function(message) {
			this.toString = function() {
				return "INVALID: " + this.message;
			};
			this.message = message;
		},
		bug: function(message) {
			this.toString = function() {
				return "BUG: " + this.message;
			};
			this.message = message;
		},
		notReady: function(message) {
			this.toString = function() {
				return "NOT READY: " + this.message;
			};
			this.message = message;
		}
	}
};
/** @fileOverview Low-level AES implementation.
*
* This file contains a low-level implementation of AES, optimized for
* size and for efficiency on several browsers.  It is based on
* OpenSSL's aes_core.c, a public-domain implementation by Vincent
* Rijmen, Antoon Bosselaers and Paulo Barreto.
*
* An older version of this implementation is available in the public
* domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
* Stanford University 2008-2010 and BSD-licensed for liability
* reasons.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Schedule out an AES key for both encryption and decryption.  This
* is a low-level class.  Use a cipher mode to do bulk encryption.
*
* @constructor
* @param {Array} key The key as an array of 4, 6 or 8 words.
*/
sjcl.cipher.aes = function(key) {
	if (!this._tables[0][0][0]) this._precompute();
	var i, j, tmp, encKey, decKey, sbox = this._tables[0][4], decTable = this._tables[1], keyLen = key.length, rcon = 1;
	if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) throw new sjcl.exception.invalid("invalid aes key size");
	this._key = [encKey = key.slice(0), decKey = []];
	for (i = keyLen; i < 4 * keyLen + 28; i++) {
		tmp = encKey[i - 1];
		if (i % keyLen === 0 || keyLen === 8 && i % keyLen === 4) {
			tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];
			if (i % keyLen === 0) {
				tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
				rcon = rcon << 1 ^ (rcon >> 7) * 283;
			}
		}
		encKey[i] = encKey[i - keyLen] ^ tmp;
	}
	for (j = 0; i; j++, i--) {
		tmp = encKey[j & 3 ? i : i - 4];
		if (i <= 4 || j < 4) decKey[j] = tmp;
else decKey[j] = decTable[0][sbox[tmp >>> 24]] ^ decTable[1][sbox[tmp >> 16 & 255]] ^ decTable[2][sbox[tmp >> 8 & 255]] ^ decTable[3][sbox[tmp & 255]];
	}
};
sjcl.cipher.aes.prototype = {
	encrypt: function(data) {
		return this._crypt(data, 0);
	},
	decrypt: function(data) {
		return this._crypt(data, 1);
	},
	_tables: [[
		[],
		[],
		[],
		[],
		[]
	], [
		[],
		[],
		[],
		[],
		[]
	]],
	_precompute: function() {
		var encTable = this._tables[0], decTable = this._tables[1], sbox = encTable[4], sboxInv = decTable[4], i, x, xInv, d = [], th = [], x2, x4, x8, s, tEnc, tDec;
		for (i = 0; i < 256; i++) th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
		for (x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
			s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
			s = s >> 8 ^ s & 255 ^ 99;
			sbox[x] = s;
			sboxInv[s] = x;
			x8 = d[x4 = d[x2 = d[x]]];
			tDec = x8 * 16843009 ^ x4 * 65537 ^ x2 * 257 ^ x * 16843008;
			tEnc = d[s] * 257 ^ s * 16843008;
			for (i = 0; i < 4; i++) {
				encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
				decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
			}
		}
		for (i = 0; i < 5; i++) {
			encTable[i] = encTable[i].slice(0);
			decTable[i] = decTable[i].slice(0);
		}
	},
	_crypt: function(input, dir) {
		if (input.length !== 4) throw new sjcl.exception.invalid("invalid aes block size");
		var key = this._key[dir], a = input[0] ^ key[0], b = input[dir ? 3 : 1] ^ key[1], c = input[2] ^ key[2], d = input[dir ? 1 : 3] ^ key[3], a2, b2, c2, nInnerRounds = key.length / 4 - 2, i, kIndex = 4, out = [
			0,
			0,
			0,
			0
		], table = this._tables[dir], t0 = table[0], t1 = table[1], t2 = table[2], t3 = table[3], sbox = table[4];
		for (i = 0; i < nInnerRounds; i++) {
			a2 = t0[a >>> 24] ^ t1[b >> 16 & 255] ^ t2[c >> 8 & 255] ^ t3[d & 255] ^ key[kIndex];
			b2 = t0[b >>> 24] ^ t1[c >> 16 & 255] ^ t2[d >> 8 & 255] ^ t3[a & 255] ^ key[kIndex + 1];
			c2 = t0[c >>> 24] ^ t1[d >> 16 & 255] ^ t2[a >> 8 & 255] ^ t3[b & 255] ^ key[kIndex + 2];
			d = t0[d >>> 24] ^ t1[a >> 16 & 255] ^ t2[b >> 8 & 255] ^ t3[c & 255] ^ key[kIndex + 3];
			kIndex += 4;
			a = a2;
			b = b2;
			c = c2;
		}
		for (i = 0; i < 4; i++) {
			out[dir ? 3 & -i : i] = sbox[a >>> 24] << 24 ^ sbox[b >> 16 & 255] << 16 ^ sbox[c >> 8 & 255] << 8 ^ sbox[d & 255] ^ key[kIndex++];
			a2 = a;
			a = b;
			b = c;
			c = d;
			d = a2;
		}
		return out;
	}
};
/** @fileOverview Arrays of bits, encoded as arrays of Numbers.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Arrays of bits, encoded as arrays of Numbers.
* @namespace
* @description
* <p>
* These objects are the currency accepted by SJCL's crypto functions.
* </p>
*
* <p>
* Most of our crypto primitives operate on arrays of 4-byte words internally,
* but many of them can take arguments that are not a multiple of 4 bytes.
* This library encodes arrays of bits (whose size need not be a multiple of 8
* bits) as arrays of 32-bit words.  The bits are packed, big-endian, into an
* array of words, 32 bits at a time.  Since the words are double-precision
* floating point numbers, they fit some extra data.  We use this (in a private,
* possibly-changing manner) to encode the number of bits actually  present
* in the last word of the array.
* </p>
*
* <p>
* Because bitwise ops clear this out-of-band data, these arrays can be passed
* to ciphers like AES which want arrays of words.
* </p>
*/
sjcl.bitArray = {
	bitSlice: function(a, bstart, bend) {
		a = sjcl.bitArray._shiftRight(a.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
		return bend === undefined ? a : sjcl.bitArray.clamp(a, bend - bstart);
	},
	extract: function(a, bstart, blength) {
		var x, sh = Math.floor(-bstart - blength & 31);
		if ((bstart + blength - 1 ^ bstart) & -32) x = a[bstart / 32 | 0] << 32 - sh ^ a[bstart / 32 + 1 | 0] >>> sh;
else x = a[bstart / 32 | 0] >>> sh;
		return x & (1 << blength) - 1;
	},
	concat: function(a1, a2) {
		if (a1.length === 0 || a2.length === 0) return a1.concat(a2);
		var last = a1[a1.length - 1], shift = sjcl.bitArray.getPartial(last);
		if (shift === 32) return a1.concat(a2);
else return sjcl.bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
	},
	bitLength: function(a) {
		var l = a.length, x;
		if (l === 0) return 0;
		x = a[l - 1];
		return (l - 1) * 32 + sjcl.bitArray.getPartial(x);
	},
	clamp: function(a, len) {
		if (a.length * 32 < len) return a;
		a = a.slice(0, Math.ceil(len / 32));
		var l = a.length;
		len = len & 31;
		if (l > 0 && len) a[l - 1] = sjcl.bitArray.partial(len, a[l - 1] & 2147483648 >> len - 1, 1);
		return a;
	},
	partial: function(len, x, _end) {
		if (len === 32) return x;
		return (_end ? x | 0 : x << 32 - len) + len * 1099511627776;
	},
	getPartial: function(x) {
		return Math.round(x / 1099511627776) || 32;
	},
	equal: function(a, b) {
		if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) return false;
		var x = 0, i;
		for (i = 0; i < a.length; i++) x |= a[i] ^ b[i];
		return x === 0;
	},
	_shiftRight: function(a, shift, carry, out) {
		var i, last2 = 0, shift2;
		if (out === undefined) out = [];
		for (; shift >= 32; shift -= 32) {
			out.push(carry);
			carry = 0;
		}
		if (shift === 0) return out.concat(a);
		for (i = 0; i < a.length; i++) {
			out.push(carry | a[i] >>> shift);
			carry = a[i] << 32 - shift;
		}
		last2 = a.length ? a[a.length - 1] : 0;
		shift2 = sjcl.bitArray.getPartial(last2);
		out.push(sjcl.bitArray.partial(shift + shift2 & 31, shift + shift2 > 32 ? carry : out.pop(), 1));
		return out;
	},
	_xor4: function(x, y) {
		return [
			x[0] ^ y[0],
			x[1] ^ y[1],
			x[2] ^ y[2],
			x[3] ^ y[3]
		];
	},
	byteswapM: function(a) {
		var i, v, m = 65280;
		for (i = 0; i < a.length; ++i) {
			v = a[i];
			a[i] = v >>> 24 | v >>> 8 & m | (v & m) << 8 | v << 24;
		}
		return a;
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* UTF-8 strings
* @namespace
*/
sjcl.codec.utf8String = {
	fromBits: function(arr) {
		var out = "", bl = sjcl.bitArray.bitLength(arr), i, tmp;
		for (i = 0; i < bl / 8; i++) {
			if ((i & 3) === 0) tmp = arr[i / 4];
			out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
			tmp <<= 8;
		}
		return decodeURIComponent(escape(out));
	},
	toBits: function(str) {
		str = unescape(encodeURIComponent(str));
		var out = [], i, tmp = 0;
		for (i = 0; i < str.length; i++) {
			tmp = tmp << 8 | str.charCodeAt(i);
			if ((i & 3) === 3) {
				out.push(tmp);
				tmp = 0;
			}
		}
		if (i & 3) out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
		return out;
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/** @fileOverview Bit array codec implementations.
*
* @author Nils Kenneweg
*/
/**
* Base32 encoding/decoding
* @namespace
*/
sjcl.codec.base32 = {
	_chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
	_hexChars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
	BITS: 32,
	BASE: 5,
	REMAINING: 27,
	fromBits: function(arr, _noEquals, _hex) {
		var BITS = sjcl.codec.base32.BITS, BASE = sjcl.codec.base32.BASE, REMAINING = sjcl.codec.base32.REMAINING;
		var out = "", i, bits = 0, c = sjcl.codec.base32._chars, ta = 0, bl = sjcl.bitArray.bitLength(arr);
		if (_hex) c = sjcl.codec.base32._hexChars;
		for (i = 0; out.length * BASE < bl;) {
			out += c.charAt((ta ^ arr[i] >>> bits) >>> REMAINING);
			if (bits < BASE) {
				ta = arr[i] << BASE - bits;
				bits += REMAINING;
				i++;
			} else {
				ta <<= BASE;
				bits -= BASE;
			}
		}
		while (out.length & 7 && !_noEquals) out += "=";
		return out;
	},
	toBits: function(str, _hex) {
		str = str.replace(/\s|=/g, "").toUpperCase();
		var BITS = sjcl.codec.base32.BITS, BASE = sjcl.codec.base32.BASE, REMAINING = sjcl.codec.base32.REMAINING;
		var out = [], i, bits = 0, c = sjcl.codec.base32._chars, ta = 0, x, format = "base32";
		if (_hex) {
			c = sjcl.codec.base32._hexChars;
			format = "base32hex";
		}
		for (i = 0; i < str.length; i++) {
			x = c.indexOf(str.charAt(i));
			if (x < 0) {
				if (!_hex) try {
					return sjcl.codec.base32hex.toBits(str);
				} catch (e) {}
				throw new sjcl.exception.invalid("this isn't " + format + "!");
			}
			if (bits > REMAINING) {
				bits -= REMAINING;
				out.push(ta ^ x >>> bits);
				ta = x << BITS - bits;
			} else {
				bits += BASE;
				ta ^= x << BITS - bits;
			}
		}
		if (bits & 56) out.push(sjcl.bitArray.partial(bits & 56, ta, 1));
		return out;
	}
};
sjcl.codec.base32hex = {
	fromBits: function(arr, _noEquals) {
		return sjcl.codec.base32.fromBits(arr, _noEquals, 1);
	},
	toBits: function(str) {
		return sjcl.codec.base32.toBits(str, 1);
	}
};
/** @fileOverview Bit array codec implementations.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Base64 encoding/decoding
* @namespace
*/
sjcl.codec.base64 = {
	_chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
	fromBits: function(arr, _noEquals, _url) {
		var out = "", i, bits = 0, c = sjcl.codec.base64._chars, ta = 0, bl = sjcl.bitArray.bitLength(arr);
		if (_url) c = c.substring(0, 62) + "-_";
		for (i = 0; out.length * 6 < bl;) {
			out += c.charAt((ta ^ arr[i] >>> bits) >>> 26);
			if (bits < 6) {
				ta = arr[i] << 6 - bits;
				bits += 26;
				i++;
			} else {
				ta <<= 6;
				bits -= 6;
			}
		}
		while (out.length & 3 && !_noEquals) out += "=";
		return out;
	},
	toBits: function(str, _url) {
		str = str.replace(/\s|=/g, "");
		var out = [], i, bits = 0, c = sjcl.codec.base64._chars, ta = 0, x;
		if (_url) c = c.substring(0, 62) + "-_";
		for (i = 0; i < str.length; i++) {
			x = c.indexOf(str.charAt(i));
			if (x < 0) throw new sjcl.exception.invalid("this isn't base64!");
			if (bits > 26) {
				bits -= 26;
				out.push(ta ^ x >>> bits);
				ta = x << 32 - bits;
			} else {
				bits += 6;
				ta ^= x << 32 - bits;
			}
		}
		if (bits & 56) out.push(sjcl.bitArray.partial(bits & 56, ta, 1));
		return out;
	}
};
/** @fileOverview Javascript SHA-256 implementation.
*
* An older version of this implementation is available in the public
* domain, but this one is (c) Emily Stark, Mike Hamburg, Dan Boneh,
* Stanford University 2008-2010 and BSD-licensed for liability
* reasons.
*
* Special thanks to Aldo Cortesi for pointing out several bugs in
* this code.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Context for a SHA-256 operation in progress.
* @constructor
*/
sjcl.hash.sha256 = function(hash) {
	if (!this._key[0]) this._precompute();
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else this.reset();
};
/**
* Hash a string or an array of words.
* @static
* @param {bitArray|String} data the data to hash.
* @return {bitArray} The hash value, an array of 16 big-endian words.
*/
sjcl.hash.sha256.hash = function(data) {
	return new sjcl.hash.sha256().update(data).finalize();
};
sjcl.hash.sha256.prototype = {
	blockSize: 512,
	reset: function() {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},
	update: function(data) {
		if (typeof data === "string") data = sjcl.codec.utf8String.toBits(data);
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		if (typeof Uint32Array !== "undefined") {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) {
				this._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
		} else for (i = 512 + ol - (512 + ol & 511); i <= nl; i += 512) this._block(b.splice(0, 16));
		return this;
	},
	finalize: function() {
		var i, b = this._buffer, h = this._h;
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
		for (i = b.length + 2; i & 15; i++) b.push(0);
		b.push(Math.floor(this._length / 4294967296));
		b.push(this._length | 0);
		while (b.length) this._block(b.splice(0, 16));
		this.reset();
		return h;
	},
	_init: [],
	_key: [],
	_precompute: function() {
		var i = 0, prime = 2, factor, isPrime;
		function frac(x) {
			return (x - Math.floor(x)) * 4294967296 | 0;
		}
		for (; i < 64; prime++) {
			isPrime = true;
			for (factor = 2; factor * factor <= prime; factor++) if (prime % factor === 0) {
				isPrime = false;
				break;
			}
			if (isPrime) {
				if (i < 8) this._init[i] = frac(Math.pow(prime, .5));
				this._key[i] = frac(Math.pow(prime, .3333333333333333));
				i++;
			}
		}
	},
	_block: function(w) {
		var i, tmp, a, b, h = this._h, k = this._key, h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3], h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];
		for (i = 0; i < 64; i++) {
			if (i < 16) tmp = w[i];
else {
				a = w[i + 1 & 15];
				b = w[i + 14 & 15];
				tmp = w[i & 15] = (a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) + (b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) + w[i & 15] + w[i + 9 & 15] | 0;
			}
			tmp = tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6)) + k[i];
			h7 = h6;
			h6 = h5;
			h5 = h4;
			h4 = h3 + tmp | 0;
			h3 = h2;
			h2 = h1;
			h1 = h0;
			h0 = tmp + (h1 & h2 ^ h3 & (h1 ^ h2)) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1 << 10) | 0;
		}
		h[0] = h[0] + h0 | 0;
		h[1] = h[1] + h1 | 0;
		h[2] = h[2] + h2 | 0;
		h[3] = h[3] + h3 | 0;
		h[4] = h[4] + h4 | 0;
		h[5] = h[5] + h5 | 0;
		h[6] = h[6] + h6 | 0;
		h[7] = h[7] + h7 | 0;
	}
};
/** @fileOverview Javascript SHA-512 implementation.
*
* This implementation was written for CryptoJS by Jeff Mott and adapted for
* SJCL by Stefan Thomas.
*
* CryptoJS (c) 2009–2012 by Jeff Mott. All rights reserved.
* Released with New BSD License
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
* @author Jeff Mott
* @author Stefan Thomas
*/
/**
* Context for a SHA-512 operation in progress.
* @constructor
*/
sjcl.hash.sha512 = function(hash) {
	if (!this._key[0]) this._precompute();
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else this.reset();
};
/**
* Hash a string or an array of words.
* @static
* @param {bitArray|String} data the data to hash.
* @return {bitArray} The hash value, an array of 16 big-endian words.
*/
sjcl.hash.sha512.hash = function(data) {
	return new sjcl.hash.sha512().update(data).finalize();
};
sjcl.hash.sha512.prototype = {
	blockSize: 1024,
	reset: function() {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},
	update: function(data) {
		if (typeof data === "string") data = sjcl.codec.utf8String.toBits(data);
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		if (typeof Uint32Array !== "undefined") {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = 1024 + ol - (1024 + ol & 1023); i <= nl; i += 1024) {
				this._block(c.subarray(32 * j, 32 * (j + 1)));
				j += 1;
			}
			b.splice(0, 32 * j);
		} else for (i = 1024 + ol - (1024 + ol & 1023); i <= nl; i += 1024) this._block(b.splice(0, 32));
		return this;
	},
	finalize: function() {
		var i, b = this._buffer, h = this._h;
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
		for (i = b.length + 4; i & 31; i++) b.push(0);
		b.push(0);
		b.push(0);
		b.push(Math.floor(this._length / 4294967296));
		b.push(this._length | 0);
		while (b.length) this._block(b.splice(0, 32));
		this.reset();
		return h;
	},
	_init: [],
	_initr: [
		12372232,
		13281083,
		9762859,
		1914609,
		15106769,
		4090911,
		4308331,
		8266105
	],
	_key: [],
	_keyr: [
		2666018,
		15689165,
		5061423,
		9034684,
		4764984,
		380953,
		1658779,
		7176472,
		197186,
		7368638,
		14987916,
		16757986,
		8096111,
		1480369,
		13046325,
		6891156,
		15813330,
		5187043,
		9229749,
		11312229,
		2818677,
		10937475,
		4324308,
		1135541,
		6741931,
		11809296,
		16458047,
		15666916,
		11046850,
		698149,
		229999,
		945776,
		13774844,
		2541862,
		12856045,
		9810911,
		11494366,
		7844520,
		15576806,
		8533307,
		15795044,
		4337665,
		16291729,
		5553712,
		15684120,
		6662416,
		7413802,
		12308920,
		13816008,
		4303699,
		9366425,
		10176680,
		13195875,
		4295371,
		6546291,
		11712675,
		15708924,
		1519456,
		15772530,
		6568428,
		6495784,
		8568297,
		13007125,
		7492395,
		2515356,
		12632583,
		14740254,
		7262584,
		1535930,
		13146278,
		16321966,
		1853211,
		294276,
		13051027,
		13221564,
		1051980,
		4080310,
		6651434,
		14088940,
		4675607
	],
	_precompute: function() {
		var i = 0, prime = 2, factor, isPrime;
		function frac(x) {
			return (x - Math.floor(x)) * 4294967296 | 0;
		}
		function frac2(x) {
			return (x - Math.floor(x)) * 1099511627776 & 255;
		}
		for (; i < 80; prime++) {
			isPrime = true;
			for (factor = 2; factor * factor <= prime; factor++) if (prime % factor === 0) {
				isPrime = false;
				break;
			}
			if (isPrime) {
				if (i < 8) {
					this._init[i * 2] = frac(Math.pow(prime, .5));
					this._init[i * 2 + 1] = frac2(Math.pow(prime, .5)) << 24 | this._initr[i];
				}
				this._key[i * 2] = frac(Math.pow(prime, .3333333333333333));
				this._key[i * 2 + 1] = frac2(Math.pow(prime, .3333333333333333)) << 24 | this._keyr[i];
				i++;
			}
		}
	},
	_block: function(words) {
		var i, wrh, wrl, h = this._h, k = this._key, h0h = h[0], h0l = h[1], h1h = h[2], h1l = h[3], h2h = h[4], h2l = h[5], h3h = h[6], h3l = h[7], h4h = h[8], h4l = h[9], h5h = h[10], h5l = h[11], h6h = h[12], h6l = h[13], h7h = h[14], h7l = h[15];
		var w;
		if (typeof Uint32Array !== "undefined") {
			w = Array(160);
			for (var j = 0; j < 32; j++) w[j] = words[j];
		} else w = words;
		var ah = h0h, al = h0l, bh = h1h, bl = h1l, ch = h2h, cl = h2l, dh = h3h, dl = h3l, eh = h4h, el = h4l, fh = h5h, fl = h5l, gh = h6h, gl = h6l, hh = h7h, hl = h7l;
		for (i = 0; i < 80; i++) {
			if (i < 16) {
				wrh = w[i * 2];
				wrl = w[i * 2 + 1];
			} else {
				var gamma0xh = w[(i - 15) * 2];
				var gamma0xl = w[(i - 15) * 2 + 1];
				var gamma0h = (gamma0xl << 31 | gamma0xh >>> 1) ^ (gamma0xl << 24 | gamma0xh >>> 8) ^ gamma0xh >>> 7;
				var gamma0l = (gamma0xh << 31 | gamma0xl >>> 1) ^ (gamma0xh << 24 | gamma0xl >>> 8) ^ (gamma0xh << 25 | gamma0xl >>> 7);
				var gamma1xh = w[(i - 2) * 2];
				var gamma1xl = w[(i - 2) * 2 + 1];
				var gamma1h = (gamma1xl << 13 | gamma1xh >>> 19) ^ (gamma1xh << 3 | gamma1xl >>> 29) ^ gamma1xh >>> 6;
				var gamma1l = (gamma1xh << 13 | gamma1xl >>> 19) ^ (gamma1xl << 3 | gamma1xh >>> 29) ^ (gamma1xh << 26 | gamma1xl >>> 6);
				var wr7h = w[(i - 7) * 2];
				var wr7l = w[(i - 7) * 2 + 1];
				var wr16h = w[(i - 16) * 2];
				var wr16l = w[(i - 16) * 2 + 1];
				wrl = gamma0l + wr7l;
				wrh = gamma0h + wr7h + (wrl >>> 0 < gamma0l >>> 0 ? 1 : 0);
				wrl += gamma1l;
				wrh += gamma1h + (wrl >>> 0 < gamma1l >>> 0 ? 1 : 0);
				wrl += wr16l;
				wrh += wr16h + (wrl >>> 0 < wr16l >>> 0 ? 1 : 0);
			}
			w[i * 2] = wrh |= 0;
			w[i * 2 + 1] = wrl |= 0;
			var chh = eh & fh ^ ~eh & gh;
			var chl = el & fl ^ ~el & gl;
			var majh = ah & bh ^ ah & ch ^ bh & ch;
			var majl = al & bl ^ al & cl ^ bl & cl;
			var sigma0h = (al << 4 | ah >>> 28) ^ (ah << 30 | al >>> 2) ^ (ah << 25 | al >>> 7);
			var sigma0l = (ah << 4 | al >>> 28) ^ (al << 30 | ah >>> 2) ^ (al << 25 | ah >>> 7);
			var sigma1h = (el << 18 | eh >>> 14) ^ (el << 14 | eh >>> 18) ^ (eh << 23 | el >>> 9);
			var sigma1l = (eh << 18 | el >>> 14) ^ (eh << 14 | el >>> 18) ^ (el << 23 | eh >>> 9);
			var krh = k[i * 2];
			var krl = k[i * 2 + 1];
			var t1l = hl + sigma1l;
			var t1h = hh + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
			t1l += chl;
			t1h += chh + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
			t1l += krl;
			t1h += krh + (t1l >>> 0 < krl >>> 0 ? 1 : 0);
			t1l = t1l + wrl | 0;
			t1h += wrh + (t1l >>> 0 < wrl >>> 0 ? 1 : 0);
			var t2l = sigma0l + majl;
			var t2h = sigma0h + majh + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
			hh = gh;
			hl = gl;
			gh = fh;
			gl = fl;
			fh = eh;
			fl = el;
			el = dl + t1l | 0;
			eh = dh + t1h + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
			dh = ch;
			dl = cl;
			ch = bh;
			cl = bl;
			bh = ah;
			bl = al;
			al = t1l + t2l | 0;
			ah = t1h + t2h + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
		}
		h0l = h[1] = h0l + al | 0;
		h[0] = h0h + ah + (h0l >>> 0 < al >>> 0 ? 1 : 0) | 0;
		h1l = h[3] = h1l + bl | 0;
		h[2] = h1h + bh + (h1l >>> 0 < bl >>> 0 ? 1 : 0) | 0;
		h2l = h[5] = h2l + cl | 0;
		h[4] = h2h + ch + (h2l >>> 0 < cl >>> 0 ? 1 : 0) | 0;
		h3l = h[7] = h3l + dl | 0;
		h[6] = h3h + dh + (h3l >>> 0 < dl >>> 0 ? 1 : 0) | 0;
		h4l = h[9] = h4l + el | 0;
		h[8] = h4h + eh + (h4l >>> 0 < el >>> 0 ? 1 : 0) | 0;
		h5l = h[11] = h5l + fl | 0;
		h[10] = h5h + fh + (h5l >>> 0 < fl >>> 0 ? 1 : 0) | 0;
		h6l = h[13] = h6l + gl | 0;
		h[12] = h6h + gh + (h6l >>> 0 < gl >>> 0 ? 1 : 0) | 0;
		h7l = h[15] = h7l + hl | 0;
		h[14] = h7h + hh + (h7l >>> 0 < hl >>> 0 ? 1 : 0) | 0;
	}
};
/** @fileOverview Javascript SHA-1 implementation.
*
* Based on the implementation in RFC 3174, method 1, and on the SJCL
* SHA-256 implementation.
*
* @author Quinn Slack
*/
/**
* Context for a SHA-1 operation in progress.
* @constructor
*/
sjcl.hash.sha1 = function(hash) {
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else this.reset();
};
/**
* Hash a string or an array of words.
* @static
* @param {bitArray|String} data the data to hash.
* @return {bitArray} The hash value, an array of 5 big-endian words.
*/
sjcl.hash.sha1.hash = function(data) {
	return new sjcl.hash.sha1().update(data).finalize();
};
sjcl.hash.sha1.prototype = {
	blockSize: 512,
	reset: function() {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},
	update: function(data) {
		if (typeof data === "string") data = sjcl.codec.utf8String.toBits(data);
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data), ol = this._length, nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		if (typeof Uint32Array !== "undefined") {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = this.blockSize + ol - (this.blockSize + ol & this.blockSize - 1); i <= nl; i += this.blockSize) {
				this._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
		} else for (i = this.blockSize + ol - (this.blockSize + ol & this.blockSize - 1); i <= nl; i += this.blockSize) this._block(b.splice(0, 16));
		return this;
	},
	finalize: function() {
		var i, b = this._buffer, h = this._h;
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
		for (i = b.length + 2; i & 15; i++) b.push(0);
		b.push(Math.floor(this._length / 4294967296));
		b.push(this._length | 0);
		while (b.length) this._block(b.splice(0, 16));
		this.reset();
		return h;
	},
	_init: [
		1732584193,
		4023233417,
		2562383102,
		271733878,
		3285377520
	],
	_key: [
		1518500249,
		1859775393,
		2400959708,
		3395469782
	],
	_f: function(t$1, b, c, d) {
		if (t$1 <= 19) return b & c | ~b & d;
else if (t$1 <= 39) return b ^ c ^ d;
else if (t$1 <= 59) return b & c | b & d | c & d;
else if (t$1 <= 79) return b ^ c ^ d;
	},
	_S: function(n, x) {
		return x << n | x >>> 32 - n;
	},
	_block: function(words) {
		var t$1, tmp, a, b, c, d, e, h = this._h;
		var w;
		if (typeof Uint32Array !== "undefined") {
			w = Array(80);
			for (var j = 0; j < 16; j++) w[j] = words[j];
		} else w = words;
		a = h[0];
		b = h[1];
		c = h[2];
		d = h[3];
		e = h[4];
		for (t$1 = 0; t$1 <= 79; t$1++) {
			if (t$1 >= 16) w[t$1] = this._S(1, w[t$1 - 3] ^ w[t$1 - 8] ^ w[t$1 - 14] ^ w[t$1 - 16]);
			tmp = this._S(5, a) + this._f(t$1, b, c, d) + e + w[t$1] + this._key[Math.floor(t$1 / 20)] | 0;
			e = d;
			d = c;
			c = this._S(30, b);
			b = a;
			a = tmp;
		}
		h[0] = h[0] + a | 0;
		h[1] = h[1] + b | 0;
		h[2] = h[2] + c | 0;
		h[3] = h[3] + d | 0;
		h[4] = h[4] + e | 0;
	}
};
/** @fileOverview CBC mode implementation
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/**
* Dangerous: CBC mode with PKCS#5 padding.
* @namespace
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
sjcl.mode.cbc = {
	name: "cbc",
	encrypt: function(prp, plaintext, iv, adata, usePadding) {
		if (adata && adata.length) throw new sjcl.exception.invalid("cbc can't authenticate data");
		if (sjcl.bitArray.bitLength(iv) !== 128) throw new sjcl.exception.invalid("cbc iv must be 128 bits");
		var i, w = sjcl.bitArray, xor = w._xor4, bl = w.bitLength(plaintext), bp = 0, output = [];
		if (bl & 7) throw new sjcl.exception.invalid("pkcs#5 padding only works for multiples of a byte");
		for (i = 0; bp + 128 <= bl; i += 4, bp += 128) {
			iv = prp.encrypt(xor(iv, plaintext.slice(i, i + 4)));
			output.push(iv[0], iv[1], iv[2], iv[3]);
		}
		if (usePadding) {
			bl = (16 - (bl >> 3 & 15)) * 16843009;
			iv = prp.encrypt(xor(iv, w.concat(plaintext, [
				bl,
				bl,
				bl,
				bl
			]).slice(i, i + 4)));
			output.push(iv[0], iv[1], iv[2], iv[3]);
		}
		return output;
	},
	decrypt: function(prp, ciphertext, iv, adata, usePadding) {
		if (adata && adata.length) throw new sjcl.exception.invalid("cbc can't authenticate data");
		if (sjcl.bitArray.bitLength(iv) !== 128) throw new sjcl.exception.invalid("cbc iv must be 128 bits");
		if (sjcl.bitArray.bitLength(ciphertext) & 127 || !ciphertext.length) throw new sjcl.exception.corrupt("cbc ciphertext must be a positive multiple of the block size");
		var i, w = sjcl.bitArray, xor = w._xor4, bi, bo, output = [];
		adata = adata || [];
		for (i = 0; i < ciphertext.length; i += 4) {
			bi = ciphertext.slice(i, i + 4);
			bo = xor(iv, prp.decrypt(bi));
			output.push(bo[0], bo[1], bo[2], bo[3]);
			iv = bi;
		}
		if (usePadding) {
			bi = output[i - 1] & 255;
			if (bi === 0 || bi > 16) throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
			bo = bi * 16843009;
			if (!w.equal(w.bitSlice([
				bo,
				bo,
				bo,
				bo
			], 0, bi * 8), w.bitSlice(output, output.length * 32 - bi * 8, output.length * 32))) throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
			return w.bitSlice(output, 0, output.length * 32 - bi * 8);
		} else return output;
	}
};
/** @fileOverview GCM mode implementation.
*
* @author Juho Vähä-Herttua
*/
/**
* Galois/Counter mode.
* @namespace
*/
sjcl.mode.gcm = {
	name: "gcm",
	encrypt: function(prf, plaintext, iv, adata, tlen) {
		var out, data = plaintext.slice(0), w = sjcl.bitArray;
		tlen = tlen || 128;
		adata = adata || [];
		out = sjcl.mode.gcm._ctrMode(true, prf, data, adata, iv, tlen);
		return w.concat(out.data, out.tag);
	},
	decrypt: function(prf, ciphertext, iv, adata, tlen) {
		var out, data = ciphertext.slice(0), tag, w = sjcl.bitArray, l = w.bitLength(data);
		tlen = tlen || 128;
		adata = adata || [];
		if (tlen <= l) {
			tag = w.bitSlice(data, l - tlen);
			data = w.bitSlice(data, 0, l - tlen);
		} else {
			tag = data;
			data = [];
		}
		out = sjcl.mode.gcm._ctrMode(false, prf, data, adata, iv, tlen);
		if (!w.equal(out.tag, tag)) throw new sjcl.exception.corrupt("gcm: tag doesn't match");
		return out.data;
	},
	_galoisMultiply: function(x, y) {
		var i, j, xi, Zi, Vi, lsb_Vi, w = sjcl.bitArray, xor = w._xor4;
		Zi = [
			0,
			0,
			0,
			0
		];
		Vi = y.slice(0);
		for (i = 0; i < 128; i++) {
			xi = (x[Math.floor(i / 32)] & 1 << 31 - i % 32) !== 0;
			if (xi) Zi = xor(Zi, Vi);
			lsb_Vi = (Vi[3] & 1) !== 0;
			for (j = 3; j > 0; j--) Vi[j] = Vi[j] >>> 1 | (Vi[j - 1] & 1) << 31;
			Vi[0] = Vi[0] >>> 1;
			if (lsb_Vi) Vi[0] = Vi[0] ^ -520093696;
		}
		return Zi;
	},
	_ghash: function(H, Y0, data) {
		var Yi, i, l = data.length;
		Yi = Y0.slice(0);
		for (i = 0; i < l; i += 4) {
			Yi[0] ^= 4294967295 & data[i];
			Yi[1] ^= 4294967295 & data[i + 1];
			Yi[2] ^= 4294967295 & data[i + 2];
			Yi[3] ^= 4294967295 & data[i + 3];
			Yi = sjcl.mode.gcm._galoisMultiply(Yi, H);
		}
		return Yi;
	},
	_ctrMode: function(encrypt, prf, data, adata, iv, tlen) {
		var H, J0, S0, enc, i, ctr, tag, last, l, bl, abl, ivbl, w = sjcl.bitArray;
		l = data.length;
		bl = w.bitLength(data);
		abl = w.bitLength(adata);
		ivbl = w.bitLength(iv);
		H = prf.encrypt([
			0,
			0,
			0,
			0
		]);
		if (ivbl === 96) {
			J0 = iv.slice(0);
			J0 = w.concat(J0, [1]);
		} else {
			J0 = sjcl.mode.gcm._ghash(H, [
				0,
				0,
				0,
				0
			], iv);
			J0 = sjcl.mode.gcm._ghash(H, J0, [
				0,
				0,
				Math.floor(ivbl / 4294967296),
				ivbl & 4294967295
			]);
		}
		S0 = sjcl.mode.gcm._ghash(H, [
			0,
			0,
			0,
			0
		], adata);
		ctr = J0.slice(0);
		tag = S0.slice(0);
		if (!encrypt) tag = sjcl.mode.gcm._ghash(H, S0, data);
		for (i = 0; i < l; i += 4) {
			ctr[3]++;
			enc = prf.encrypt(ctr);
			data[i] ^= enc[0];
			data[i + 1] ^= enc[1];
			data[i + 2] ^= enc[2];
			data[i + 3] ^= enc[3];
		}
		data = w.clamp(data, bl);
		if (encrypt) tag = sjcl.mode.gcm._ghash(H, S0, data);
		last = [
			Math.floor(abl / 4294967296),
			abl & 4294967295,
			Math.floor(bl / 4294967296),
			bl & 4294967295
		];
		tag = sjcl.mode.gcm._ghash(H, tag, last);
		enc = prf.encrypt(J0);
		tag[0] ^= enc[0];
		tag[1] ^= enc[1];
		tag[2] ^= enc[2];
		tag[3] ^= enc[3];
		return {
			tag: w.bitSlice(tag, 0, tlen),
			data
		};
	}
};
/** @fileOverview HMAC implementation.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
*/
/** HMAC with the specified hash function.
* @constructor
* @param {bitArray} key the key for HMAC.
* @param {Object} [Hash=sjcl.hash.sha256] The hash function to use.
*/
sjcl.misc.hmac = function(key, Hash) {
	this._hash = Hash = Hash || sjcl.hash.sha256;
	var exKey = [[], []], i, bs = Hash.prototype.blockSize / 32;
	this._baseHash = [new Hash(), new Hash()];
	if (key.length > bs) key = Hash.hash(key);
	for (i = 0; i < bs; i++) {
		exKey[0][i] = key[i] ^ 909522486;
		exKey[1][i] = key[i] ^ 1549556828;
	}
	this._baseHash[0].update(exKey[0]);
	this._baseHash[1].update(exKey[1]);
	this._resultHash = new Hash(this._baseHash[0]);
};
/** HMAC with the specified hash function.  Also called encrypt since it's a prf.
* @param {bitArray|String} data The data to mac.
*/
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function(data) {
	if (!this._updated) {
		this.update(data);
		return this.digest(data);
	} else throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
};
sjcl.misc.hmac.prototype.reset = function() {
	this._resultHash = new this._hash(this._baseHash[0]);
	this._updated = false;
};
sjcl.misc.hmac.prototype.update = function(data) {
	this._updated = true;
	this._resultHash.update(data);
};
sjcl.misc.hmac.prototype.digest = function() {
	var w = this._resultHash.finalize(), result = new this._hash(this._baseHash[1]).update(w).finalize();
	this.reset();
	return result;
};
/** @fileOverview Random number generator.
*
* @author Emily Stark
* @author Mike Hamburg
* @author Dan Boneh
* @author Michael Brooks
* @author Steve Thomas
*/
/**
* @class Random number generator
* @description
* <b>Use sjcl.random as a singleton for this class!</b>
* <p>
* This random number generator is a derivative of Ferguson and Schneier's
* generator Fortuna.  It collects entropy from various events into several
* pools, implemented by streaming SHA-256 instances.  It differs from
* ordinary Fortuna in a few ways, though.
* </p>
*
* <p>
* Most importantly, it has an entropy estimator.  This is present because
* there is a strong conflict here between making the generator available
* as soon as possible, and making sure that it doesn't "run on empty".
* In Fortuna, there is a saved state file, and the system is likely to have
* time to warm up.
* </p>
*
* <p>
* Second, because users are unlikely to stay on the page for very long,
* and to speed startup time, the number of pools increases logarithmically:
* a new pool is created when the previous one is actually used for a reseed.
* This gives the same asymptotic guarantees as Fortuna, but gives more
* entropy to early reseeds.
* </p>
*
* <p>
* The entire mechanism here feels pretty klunky.  Furthermore, there are
* several improvements that should be made, including support for
* dedicated cryptographic functions that may be present in some browsers;
* state files in local storage; cookies containing randomness; etc.  So
* look for improvements in future versions.
* </p>
* @constructor
*/
sjcl.prng = function(defaultParanoia) {
	this._pools = [new sjcl.hash.sha256()];
	this._poolEntropy = [0];
	this._reseedCount = 0;
	this._robins = {};
	this._eventId = 0;
	this._collectorIds = {};
	this._collectorIdNext = 0;
	this._strength = 0;
	this._poolStrength = 0;
	this._nextReseed = 0;
	this._key = [
		0,
		0,
		0,
		0,
		0,
		0,
		0,
		0
	];
	this._counter = [
		0,
		0,
		0,
		0
	];
	this._defaultParanoia = defaultParanoia;
	this._NOT_READY = 0;
	this._READY = 1;
	this._REQUIRES_RESEED = 2;
	this._MAX_WORDS_PER_BURST = 65536;
	this._PARANOIA_LEVELS = [
		0,
		48,
		64,
		96,
		128,
		192,
		256,
		384,
		512,
		768,
		1024
	];
	this._MILLISECONDS_PER_RESEED = 3e4;
	this._BITS_PER_RESEED = 80;
};
sjcl.prng.prototype = {
	randomWords: function(nwords, paranoia) {
		var out = [], i, readiness = this.isReady(paranoia), g;
		if (readiness === this._NOT_READY) throw new sjcl.exception.notReady("generator isn't seeded");
else if (readiness & this._REQUIRES_RESEED) this._reseedFromPools(!(readiness & this._READY));
		for (i = 0; i < nwords; i += 4) {
			if ((i + 1) % this._MAX_WORDS_PER_BURST === 0) this._gate();
			g = this._gen4words();
			out.push(g[0], g[1], g[2], g[3]);
		}
		this._gate();
		return out.slice(0, nwords);
	},
	addEntropy: function(data, estimatedEntropy, source) {
		source = source || "user";
		var id, i, tmp, t$1 = new Date().valueOf(), robin = this._robins[source], oldReady = this.isReady(), err = 0, objName;
		id = this._collectorIds[source];
		if (id === undefined) id = this._collectorIds[source] = this._collectorIdNext++;
		if (robin === undefined) robin = this._robins[source] = 0;
		this._robins[source] = (this._robins[source] + 1) % this._pools.length;
		switch (typeof data) {
			case "number":
				if (estimatedEntropy === undefined) estimatedEntropy = 1;
				this._pools[robin].update([
					id,
					this._eventId++,
					1,
					estimatedEntropy,
					t$1,
					1,
					data | 0
				]);
				break;
			case "object":
				objName = Object.prototype.toString.call(data);
				if (objName === "[object Uint32Array]") {
					tmp = [];
					for (i = 0; i < data.length; i++) tmp.push(data[i]);
					data = tmp;
				} else {
					if (objName !== "[object Array]") err = 1;
					for (i = 0; i < data.length && !err; i++) if (typeof data[i] !== "number") err = 1;
				}
				if (!err) {
					if (estimatedEntropy === undefined) {
						estimatedEntropy = 0;
						for (i = 0; i < data.length; i++) {
							tmp = data[i];
							while (tmp > 0) {
								estimatedEntropy++;
								tmp = tmp >>> 1;
							}
						}
					}
					this._pools[robin].update([
						id,
						this._eventId++,
						2,
						estimatedEntropy,
						t$1,
						data.length
					].concat(data));
				}
				break;
			case "string":
				if (estimatedEntropy === undefined) estimatedEntropy = data.length;
				this._pools[robin].update([
					id,
					this._eventId++,
					3,
					estimatedEntropy,
					t$1,
					data.length
				]);
				this._pools[robin].update(data);
				break;
			default: err = 1;
		}
		if (err) throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string");
		this._poolEntropy[robin] += estimatedEntropy;
		this._poolStrength += estimatedEntropy;
	},
	isReady: function(paranoia) {
		var entropyRequired = this._PARANOIA_LEVELS[paranoia !== undefined ? paranoia : this._defaultParanoia];
		if (this._strength && this._strength >= entropyRequired) return this._poolEntropy[0] > this._BITS_PER_RESEED && new Date().valueOf() > this._nextReseed ? this._REQUIRES_RESEED | this._READY : this._READY;
else return this._poolStrength >= entropyRequired ? this._REQUIRES_RESEED | this._NOT_READY : this._NOT_READY;
	},
	_gen4words: function() {
		for (var i = 0; i < 4; i++) {
			this._counter[i] = this._counter[i] + 1 | 0;
			if (this._counter[i]) break;
		}
		return this._cipher.encrypt(this._counter);
	},
	_gate: function() {
		this._key = this._gen4words().concat(this._gen4words());
		this._cipher = new sjcl.cipher.aes(this._key);
	},
	_reseed: function(seedWords) {
		this._key = sjcl.hash.sha256.hash(this._key.concat(seedWords));
		this._cipher = new sjcl.cipher.aes(this._key);
		for (var i = 0; i < 4; i++) {
			this._counter[i] = this._counter[i] + 1 | 0;
			if (this._counter[i]) break;
		}
	},
	_reseedFromPools: function(full) {
		var reseedData = [], strength = 0, i;
		this._nextReseed = reseedData[0] = new Date().valueOf() + this._MILLISECONDS_PER_RESEED;
		for (i = 0; i < 16; i++) reseedData.push(Math.random() * 4294967296 | 0);
		for (i = 0; i < this._pools.length; i++) {
			reseedData = reseedData.concat(this._pools[i].finalize());
			strength += this._poolEntropy[i];
			this._poolEntropy[i] = 0;
			if (!full && this._reseedCount & 1 << i) break;
		}
		if (this._reseedCount >= 1 << this._pools.length) {
			this._pools.push(new sjcl.hash.sha256());
			this._poolEntropy.push(0);
		}
		this._poolStrength -= strength;
		if (strength > this._strength) this._strength = strength;
		this._reseedCount++;
		this._reseed(reseedData);
	}
};
/** an instance for the prng.
* @see sjcl.prng
*/
/**
* ArrayBuffer
* @namespace
*/
sjcl.codec.arrayBuffer = {
	fromBits: function(arr, padding, padding_count) {
		var out, i, ol, tmp, smallest;
		padding = padding == undefined ? true : padding;
		padding_count = padding_count || 8;
		if (arr.length === 0) return new ArrayBuffer(0);
		ol = sjcl.bitArray.bitLength(arr) / 8;
		if (sjcl.bitArray.bitLength(arr) % 8 !== 0) throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly");
		if (padding && ol % padding_count !== 0) ol += padding_count - ol % padding_count;
		tmp = new DataView(new ArrayBuffer(arr.length * 4));
		for (i = 0; i < arr.length; i++) tmp.setUint32(i * 4, arr[i] << 32);
		out = new DataView(new ArrayBuffer(ol));
		if (out.byteLength === tmp.byteLength) return tmp.buffer;
		smallest = tmp.byteLength < out.byteLength ? tmp.byteLength : out.byteLength;
		for (i = 0; i < smallest; i++) out.setUint8(i, tmp.getUint8(i));
		return out.buffer;
	},
	toBits: function(buffer, byteOffset, byteLength) {
		var i, out = [], len, inView, tmp;
		if (buffer.byteLength === 0) return [];
		inView = new DataView(buffer, byteOffset, byteLength);
		len = inView.byteLength - inView.byteLength % 4;
		for (var i = 0; i < len; i += 4) out.push(inView.getUint32(i));
		if (inView.byteLength % 4 != 0) {
			tmp = new DataView(new ArrayBuffer(4));
			for (var i = 0, l = inView.byteLength % 4; i < l; i++) tmp.setUint8(i + 4 - l, inView.getUint8(len + i));
			out.push(sjcl.bitArray.partial(inView.byteLength % 4 * 8, tmp.getUint32(0)));
		}
		return out;
	}
};
var sjcl_default = sjcl;

//#endregion
//#region packages/tutanota-crypto/dist/random/Randomizer.js
var Randomizer = class {
	random;
	constructor() {
		this.random = new sjcl_default.prng(6);
	}
	/**
	* Adds entropy to the random number generator algorithm
	* @param entropyCache with: number Any number value, entropy The amount of entropy in the number in bit,
	* source The source of the number.
	*/
	addEntropy(entropyCache) {
		for (const entry of entropyCache) this.random.addEntropy(entry.data, entry.entropy, entry.source);
		return Promise.resolve();
	}
	addStaticEntropy(bytes) {
		for (const byte of bytes) this.random.addEntropy(byte, 8, "static");
	}
	/**
	* Not used currently because we always have enough entropy using getRandomValues()
	*/
	isReady() {
		return this.random.isReady() !== 0;
	}
	/**
	* Generates random data. The function initRandomDataGenerator must have been called prior to the first call to this function.
	* @param nbrOfBytes The number of bytes the random data shall have.
	* @return A hex coded string of random data.
	* @throws {CryptoError} if the randomizer is not seeded (isReady == false)
	*/
	generateRandomData(nbrOfBytes) {
		try {
			let nbrOfWords = Math.floor((nbrOfBytes + 3) / 4);
			let words = this.random.randomWords(nbrOfWords);
			let arrayBuffer = sjcl_default.codec.arrayBuffer.fromBits(words, false);
			return new Uint8Array(arrayBuffer, 0, nbrOfBytes);
		} catch (e) {
			throw new CryptoError("error during random number generation", e);
		}
	}
	/**
	* Generate a number that fits in the range of an n-byte integer
	*/
	generateRandomNumber(nbrOfBytes) {
		const bytes = this.generateRandomData(nbrOfBytes);
		let result = 0;
		for (let i = 0; i < bytes.length; ++i) result += bytes[i] << i * 8;
		return result;
	}
};
const random = new Randomizer();

//#endregion
//#region packages/tutanota-crypto/dist/hashes/Sha256.js
const sha256 = new sjcl_default.hash.sha256();
function sha256Hash(uint8Array) {
	try {
		sha256.update(sjcl_default.codec.arrayBuffer.toBits(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength));
		return new Uint8Array(sjcl_default.codec.arrayBuffer.fromBits(sha256.finalize(), false));
	} finally {
		sha256.reset();
	}
}

//#endregion
//#region packages/tutanota-crypto/dist/misc/Utils.js
function createAuthVerifier(passwordKey) {
	return sha256Hash(bitArrayToUint8Array(passwordKey));
}
function createAuthVerifierAsBase64Url(passwordKey) {
	return base64ToBase64Url(uint8ArrayToBase64(createAuthVerifier(passwordKey)));
}
function bitArrayToUint8Array(bits) {
	return new Uint8Array(sjcl_default.codec.arrayBuffer.fromBits(bits, false));
}
function uint8ArrayToBitArray(uint8Array) {
	return sjcl_default.codec.arrayBuffer.toBits(uint8ArrayToArrayBuffer(uint8Array));
}
function keyToBase64(key) {
	return sjcl_default.codec.base64.fromBits(key);
}
function base64ToKey(base64) {
	try {
		return sjcl_default.codec.base64.toBits(base64);
	} catch (e) {
		throw new CryptoError("hex to aes key failed", e);
	}
}
function uint8ArrayToKey(array) {
	return base64ToKey(uint8ArrayToBase64(array));
}
function keyToUint8Array(key) {
	return base64ToUint8Array(keyToBase64(key));
}
const fixedIv = hexToUint8Array("88888888888888888888888888888888");

//#endregion
//#region packages/tutanota-crypto/dist/hashes/Sha512.js
const sha512 = new sjcl_default.hash.sha512();
function sha512Hash(uint8Array) {
	try {
		sha512.update(sjcl_default.codec.arrayBuffer.toBits(uint8Array.buffer, uint8Array.byteOffset, uint8Array.byteLength));
		return new Uint8Array(sjcl_default.codec.arrayBuffer.fromBits(sha512.finalize(), false));
	} finally {
		sha512.reset();
	}
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/Aes.js
const ENABLE_MAC = true;
const IV_BYTE_LENGTH = 16;
const KEY_LENGTH_BYTES_AES_256 = 32;
const KEY_LENGTH_BITS_AES_256 = KEY_LENGTH_BYTES_AES_256 * 8;
const KEY_LENGTH_BYTES_AES_128 = 16;
const KEY_LENGTH_BITS_AES_128 = KEY_LENGTH_BYTES_AES_128 * 8;
const MAC_ENABLED_PREFIX = 1;
const MAC_LENGTH_BYTES = 32;
function getKeyLengthBytes(key) {
	return key.length * 4;
}
function aes256RandomKey() {
	return uint8ArrayToBitArray(random.generateRandomData(KEY_LENGTH_BYTES_AES_256));
}
function generateIV() {
	return random.generateRandomData(IV_BYTE_LENGTH);
}
function aesEncrypt(key, bytes, iv = generateIV(), usePadding = true, useMac = true) {
	verifyKeySize(key, [KEY_LENGTH_BITS_AES_128, KEY_LENGTH_BITS_AES_256]);
	if (iv.length !== IV_BYTE_LENGTH) throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `);
	if (!useMac && getKeyLengthBytes(key) === KEY_LENGTH_BYTES_AES_256) throw new CryptoError(`Can't use AES-256 without MAC`);
	let subKeys = getAesSubKeys(key, useMac);
	let encryptedBits = sjcl_default.mode.cbc.encrypt(new sjcl_default.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], usePadding);
	let data = concat(iv, bitArrayToUint8Array(encryptedBits));
	if (useMac) {
		let hmac = new sjcl_default.misc.hmac(subKeys.mKey, sjcl_default.hash.sha256);
		let macBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(data)));
		data = concat(new Uint8Array([MAC_ENABLED_PREFIX]), data, macBytes);
	}
	return data;
}
function aes256EncryptSearchIndexEntry(key, bytes, iv = generateIV(), usePadding = true) {
	verifyKeySize(key, [KEY_LENGTH_BITS_AES_256]);
	if (iv.length !== IV_BYTE_LENGTH) throw new CryptoError(`Illegal IV length: ${iv.length} (expected: ${IV_BYTE_LENGTH}): ${uint8ArrayToBase64(iv)} `);
	let subKeys = getAesSubKeys(key, false);
	let encryptedBits = sjcl_default.mode.cbc.encrypt(new sjcl_default.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(bytes), uint8ArrayToBitArray(iv), [], usePadding);
	let data = concat(iv, bitArrayToUint8Array(encryptedBits));
	return data;
}
function aesDecrypt(key, encryptedBytes, usePadding = true) {
	const keyLength = getKeyLengthBytes(key);
	if (keyLength === KEY_LENGTH_BYTES_AES_128) return aesDecryptImpl(key, encryptedBytes, usePadding, false);
else return aesDecryptImpl(key, encryptedBytes, usePadding, true);
}
function authenticatedAesDecrypt(key, encryptedBytes, usePadding = true) {
	return aesDecryptImpl(key, encryptedBytes, usePadding, true);
}
function unauthenticatedAesDecrypt(key, encryptedBytes, usePadding = true) {
	return aesDecryptImpl(key, encryptedBytes, usePadding, false);
}
/**
* Decrypts the given words with AES-128/256 in CBC mode.
* @param key The key to use for the decryption.
* @param encryptedBytes The ciphertext encoded as bytes.
* @param usePadding If true, padding is used, otherwise no padding is used and the encrypted data must have the key size.
* @param enforceMac if true decryption will fail if there is no valid mac. we only support false for backward compatibility.
* 				 it must not be used with new cryto anymore.
* @return The decrypted bytes.
*/
function aesDecryptImpl(key, encryptedBytes, usePadding, enforceMac) {
	verifyKeySize(key, [KEY_LENGTH_BITS_AES_128, KEY_LENGTH_BITS_AES_256]);
	const hasMac = encryptedBytes.length % 2 === 1;
	if (enforceMac && !hasMac) throw new CryptoError("mac expected but not present");
	const subKeys = getAesSubKeys(key, hasMac);
	let cipherTextWithoutMac;
	if (hasMac) {
		cipherTextWithoutMac = encryptedBytes.subarray(1, encryptedBytes.length - MAC_LENGTH_BYTES);
		const providedMacBytes = encryptedBytes.subarray(encryptedBytes.length - MAC_LENGTH_BYTES);
		const hmac = new sjcl_default.misc.hmac(subKeys.mKey, sjcl_default.hash.sha256);
		const computedMacBytes = bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(cipherTextWithoutMac)));
		if (!arrayEquals(providedMacBytes, computedMacBytes)) throw new CryptoError("invalid mac");
	} else cipherTextWithoutMac = encryptedBytes;
	const iv = cipherTextWithoutMac.slice(0, IV_BYTE_LENGTH);
	if (iv.length !== IV_BYTE_LENGTH) throw new CryptoError(`Invalid IV length in aesDecrypt: ${iv.length} bytes, must be 16 bytes (128 bits)`);
	const ciphertext = cipherTextWithoutMac.slice(IV_BYTE_LENGTH);
	try {
		const decrypted = sjcl_default.mode.cbc.decrypt(new sjcl_default.cipher.aes(subKeys.cKey), uint8ArrayToBitArray(ciphertext), uint8ArrayToBitArray(iv), [], usePadding);
		return new Uint8Array(bitArrayToUint8Array(decrypted));
	} catch (e) {
		throw new CryptoError("aes decryption failed", e);
	}
}
function verifyKeySize(key, bitLength) {
	if (!bitLength.includes(sjcl_default.bitArray.bitLength(key))) throw new CryptoError(`Illegal key length: ${sjcl_default.bitArray.bitLength(key)} (expected: ${bitLength})`);
}
function getAesSubKeys(key, mac) {
	if (mac) {
		let hashedKey;
		switch (getKeyLengthBytes(key)) {
			case KEY_LENGTH_BYTES_AES_128:
				hashedKey = sha256Hash(bitArrayToUint8Array(key));
				break;
			case KEY_LENGTH_BYTES_AES_256:
				hashedKey = sha512Hash(bitArrayToUint8Array(key));
				break;
			default: throw new Error(`unexpected key length ${getKeyLengthBytes(key)}`);
		}
		return {
			cKey: uint8ArrayToBitArray(hashedKey.subarray(0, hashedKey.length / 2)),
			mKey: uint8ArrayToBitArray(hashedKey.subarray(hashedKey.length / 2, hashedKey.length))
		};
	} else return {
		cKey: key,
		mKey: null
	};
}

//#endregion
//#region packages/tutanota-crypto/dist/internal/noble-curves-1.3.0.js
var nobleCurves = (() => {
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __export = (target, all) => {
		for (var name in all) __defProp(target, name, {
			get: all[name],
			enumerable: true
		});
	};
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") {
			for (let key of __getOwnPropNames(from)) if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: () => from[key],
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toCommonJS = (mod2) => __copyProps(__defProp({}, "__esModule", { value: true }), mod2);
	var input_exports = {};
	__export(input_exports, { x25519: () => x25519$1 });
	function isBytes(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	function bytes(b, ...lengths) {
		if (!isBytes(b)) throw new Error("Expected Uint8Array");
		if (lengths.length > 0 && !lengths.includes(b.length)) throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
	}
	function exists(instance, checkFinished = true) {
		if (instance.destroyed) throw new Error("Hash instance has been destroyed");
		if (checkFinished && instance.finished) throw new Error("Hash#digest() has already been called");
	}
	function output(out, instance) {
		bytes(out);
		const min = instance.outputLen;
		if (out.length < min) throw new Error(`digestInto() expects output buffer of length at least ${min}`);
	}
	var crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
	function isBytes2(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	var createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
	var isLE = new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68;
	if (!isLE) throw new Error("Non little-endian hardware is not supported");
	function utf8ToBytes(str) {
		if (typeof str !== "string") throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
		return new Uint8Array(new TextEncoder().encode(str));
	}
	function toBytes(data) {
		if (typeof data === "string") data = utf8ToBytes(data);
		if (!isBytes2(data)) throw new Error(`expected Uint8Array, got ${typeof data}`);
		return data;
	}
	function concatBytes(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			if (!isBytes2(a)) throw new Error("Uint8Array expected");
			sum += a.length;
		}
		const res = new Uint8Array(sum);
		for (let i = 0, pad = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	var Hash = class {
		clone() {
			return this._cloneInto();
		}
	};
	var toStr = {}.toString;
	function wrapConstructor(hashCons) {
		const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
		const tmp = hashCons();
		hashC.outputLen = tmp.outputLen;
		hashC.blockLen = tmp.blockLen;
		hashC.create = () => hashCons();
		return hashC;
	}
	function randomBytes(bytesLength = 32) {
		if (crypto && typeof crypto.getRandomValues === "function") return crypto.getRandomValues(new Uint8Array(bytesLength));
		throw new Error("crypto.getRandomValues must be defined");
	}
	function setBigUint64(view, byteOffset, value, isLE2) {
		if (typeof view.setBigUint64 === "function") return view.setBigUint64(byteOffset, value, isLE2);
		const _32n2 = BigInt(32);
		const _u32_max = BigInt(4294967295);
		const wh = Number(value >> _32n2 & _u32_max);
		const wl = Number(value & _u32_max);
		const h = isLE2 ? 4 : 0;
		const l = isLE2 ? 0 : 4;
		view.setUint32(byteOffset + h, wh, isLE2);
		view.setUint32(byteOffset + l, wl, isLE2);
	}
	var SHA2 = class extends Hash {
		constructor(blockLen, outputLen, padOffset, isLE2) {
			super();
			this.blockLen = blockLen;
			this.outputLen = outputLen;
			this.padOffset = padOffset;
			this.isLE = isLE2;
			this.finished = false;
			this.length = 0;
			this.pos = 0;
			this.destroyed = false;
			this.buffer = new Uint8Array(blockLen);
			this.view = createView(this.buffer);
		}
		update(data) {
			exists(this);
			const { view, buffer, blockLen } = this;
			data = toBytes(data);
			const len = data.length;
			for (let pos = 0; pos < len;) {
				const take = Math.min(blockLen - this.pos, len - pos);
				if (take === blockLen) {
					const dataView = createView(data);
					for (; blockLen <= len - pos; pos += blockLen) this.process(dataView, pos);
					continue;
				}
				buffer.set(data.subarray(pos, pos + take), this.pos);
				this.pos += take;
				pos += take;
				if (this.pos === blockLen) {
					this.process(view, 0);
					this.pos = 0;
				}
			}
			this.length += data.length;
			this.roundClean();
			return this;
		}
		digestInto(out) {
			exists(this);
			output(out, this);
			this.finished = true;
			const { buffer, view, blockLen, isLE: isLE2 } = this;
			let { pos } = this;
			buffer[pos++] = 128;
			this.buffer.subarray(pos).fill(0);
			if (this.padOffset > blockLen - pos) {
				this.process(view, 0);
				pos = 0;
			}
			for (let i = pos; i < blockLen; i++) buffer[i] = 0;
			setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE2);
			this.process(view, 0);
			const oview = createView(out);
			const len = this.outputLen;
			if (len % 4) throw new Error("_sha2: outputLen should be aligned to 32bit");
			const outLen = len / 4;
			const state = this.get();
			if (outLen > state.length) throw new Error("_sha2: outputLen bigger than state");
			for (let i = 0; i < outLen; i++) oview.setUint32(4 * i, state[i], isLE2);
		}
		digest() {
			const { buffer, outputLen } = this;
			this.digestInto(buffer);
			const res = buffer.slice(0, outputLen);
			this.destroy();
			return res;
		}
		_cloneInto(to) {
			to || (to = new this.constructor());
			to.set(...this.get());
			const { blockLen, buffer, length, finished, destroyed, pos } = this;
			to.length = length;
			to.pos = pos;
			to.finished = finished;
			to.destroyed = destroyed;
			if (length % blockLen) to.buffer.set(buffer);
			return to;
		}
	};
	var U32_MASK64 = /* @__PURE__ */ BigInt(4294967295);
	var _32n = /* @__PURE__ */ BigInt(32);
	function fromBig(n, le = false) {
		if (le) return {
			h: Number(n & U32_MASK64),
			l: Number(n >> _32n & U32_MASK64)
		};
		return {
			h: Number(n >> _32n & U32_MASK64) | 0,
			l: Number(n & U32_MASK64) | 0
		};
	}
	function split(lst, le = false) {
		let Ah = new Uint32Array(lst.length);
		let Al = new Uint32Array(lst.length);
		for (let i = 0; i < lst.length; i++) {
			const { h, l } = fromBig(lst[i], le);
			[Ah[i], Al[i]] = [h, l];
		}
		return [Ah, Al];
	}
	var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
	var shrSH = (h, _l, s) => h >>> s;
	var shrSL = (h, l, s) => h << 32 - s | l >>> s;
	var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
	var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
	var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
	var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
	var rotr32H = (_h, l) => l;
	var rotr32L = (h, _l) => h;
	var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
	var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
	var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
	var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
	function add(Ah, Al, Bh, Bl) {
		const l = (Al >>> 0) + (Bl >>> 0);
		return {
			h: Ah + Bh + (l / 4294967296 | 0) | 0,
			l: l | 0
		};
	}
	var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
	var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 4294967296 | 0) | 0;
	var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
	var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 4294967296 | 0) | 0;
	var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
	var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 4294967296 | 0) | 0;
	var u64 = {
		fromBig,
		split,
		toBig,
		shrSH,
		shrSL,
		rotrSH,
		rotrSL,
		rotrBH,
		rotrBL,
		rotr32H,
		rotr32L,
		rotlSH,
		rotlSL,
		rotlBH,
		rotlBL,
		add,
		add3L,
		add3H,
		add4L,
		add4H,
		add5H,
		add5L
	};
	var u64_default = u64;
	var [SHA512_Kh, SHA512_Kl] = /* @__PURE__ */ (() => u64_default.split([
		"0x428a2f98d728ae22",
		"0x7137449123ef65cd",
		"0xb5c0fbcfec4d3b2f",
		"0xe9b5dba58189dbbc",
		"0x3956c25bf348b538",
		"0x59f111f1b605d019",
		"0x923f82a4af194f9b",
		"0xab1c5ed5da6d8118",
		"0xd807aa98a3030242",
		"0x12835b0145706fbe",
		"0x243185be4ee4b28c",
		"0x550c7dc3d5ffb4e2",
		"0x72be5d74f27b896f",
		"0x80deb1fe3b1696b1",
		"0x9bdc06a725c71235",
		"0xc19bf174cf692694",
		"0xe49b69c19ef14ad2",
		"0xefbe4786384f25e3",
		"0x0fc19dc68b8cd5b5",
		"0x240ca1cc77ac9c65",
		"0x2de92c6f592b0275",
		"0x4a7484aa6ea6e483",
		"0x5cb0a9dcbd41fbd4",
		"0x76f988da831153b5",
		"0x983e5152ee66dfab",
		"0xa831c66d2db43210",
		"0xb00327c898fb213f",
		"0xbf597fc7beef0ee4",
		"0xc6e00bf33da88fc2",
		"0xd5a79147930aa725",
		"0x06ca6351e003826f",
		"0x142929670a0e6e70",
		"0x27b70a8546d22ffc",
		"0x2e1b21385c26c926",
		"0x4d2c6dfc5ac42aed",
		"0x53380d139d95b3df",
		"0x650a73548baf63de",
		"0x766a0abb3c77b2a8",
		"0x81c2c92e47edaee6",
		"0x92722c851482353b",
		"0xa2bfe8a14cf10364",
		"0xa81a664bbc423001",
		"0xc24b8b70d0f89791",
		"0xc76c51a30654be30",
		"0xd192e819d6ef5218",
		"0xd69906245565a910",
		"0xf40e35855771202a",
		"0x106aa07032bbd1b8",
		"0x19a4c116b8d2d0c8",
		"0x1e376c085141ab53",
		"0x2748774cdf8eeb99",
		"0x34b0bcb5e19b48a8",
		"0x391c0cb3c5c95a63",
		"0x4ed8aa4ae3418acb",
		"0x5b9cca4f7763e373",
		"0x682e6ff3d6b2b8a3",
		"0x748f82ee5defb2fc",
		"0x78a5636f43172f60",
		"0x84c87814a1f0ab72",
		"0x8cc702081a6439ec",
		"0x90befffa23631e28",
		"0xa4506cebde82bde9",
		"0xbef9a3f7b2c67915",
		"0xc67178f2e372532b",
		"0xca273eceea26619c",
		"0xd186b8c721c0c207",
		"0xeada7dd6cde0eb1e",
		"0xf57d4f7fee6ed178",
		"0x06f067aa72176fba",
		"0x0a637dc5a2c898a6",
		"0x113f9804bef90dae",
		"0x1b710b35131c471b",
		"0x28db77f523047d84",
		"0x32caab7b40c72493",
		"0x3c9ebe0a15c9bebc",
		"0x431d67c49c100d4c",
		"0x4cc5d4becb3e42b6",
		"0x597f299cfc657e2a",
		"0x5fcb6fab3ad6faec",
		"0x6c44198c4a475817"
	].map((n) => BigInt(n))))();
	var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
	var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
	var SHA512 = class extends SHA2 {
		constructor() {
			super(128, 64, 16, false);
			this.Ah = 1779033703;
			this.Al = -205731576;
			this.Bh = -1150833019;
			this.Bl = -2067093701;
			this.Ch = 1013904242;
			this.Cl = -23791573;
			this.Dh = -1521486534;
			this.Dl = 1595750129;
			this.Eh = 1359893119;
			this.El = -1377402159;
			this.Fh = -1694144372;
			this.Fl = 725511199;
			this.Gh = 528734635;
			this.Gl = -79577749;
			this.Hh = 1541459225;
			this.Hl = 327033209;
		}
		get() {
			const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
			return [
				Ah,
				Al,
				Bh,
				Bl,
				Ch,
				Cl,
				Dh,
				Dl,
				Eh,
				El,
				Fh,
				Fl,
				Gh,
				Gl,
				Hh,
				Hl
			];
		}
		set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
			this.Ah = Ah | 0;
			this.Al = Al | 0;
			this.Bh = Bh | 0;
			this.Bl = Bl | 0;
			this.Ch = Ch | 0;
			this.Cl = Cl | 0;
			this.Dh = Dh | 0;
			this.Dl = Dl | 0;
			this.Eh = Eh | 0;
			this.El = El | 0;
			this.Fh = Fh | 0;
			this.Fl = Fl | 0;
			this.Gh = Gh | 0;
			this.Gl = Gl | 0;
			this.Hh = Hh | 0;
			this.Hl = Hl | 0;
		}
		process(view, offset) {
			for (let i = 0; i < 16; i++, offset += 4) {
				SHA512_W_H[i] = view.getUint32(offset);
				SHA512_W_L[i] = view.getUint32(offset += 4);
			}
			for (let i = 16; i < 80; i++) {
				const W15h = SHA512_W_H[i - 15] | 0;
				const W15l = SHA512_W_L[i - 15] | 0;
				const s0h = u64_default.rotrSH(W15h, W15l, 1) ^ u64_default.rotrSH(W15h, W15l, 8) ^ u64_default.shrSH(W15h, W15l, 7);
				const s0l = u64_default.rotrSL(W15h, W15l, 1) ^ u64_default.rotrSL(W15h, W15l, 8) ^ u64_default.shrSL(W15h, W15l, 7);
				const W2h = SHA512_W_H[i - 2] | 0;
				const W2l = SHA512_W_L[i - 2] | 0;
				const s1h = u64_default.rotrSH(W2h, W2l, 19) ^ u64_default.rotrBH(W2h, W2l, 61) ^ u64_default.shrSH(W2h, W2l, 6);
				const s1l = u64_default.rotrSL(W2h, W2l, 19) ^ u64_default.rotrBL(W2h, W2l, 61) ^ u64_default.shrSL(W2h, W2l, 6);
				const SUMl = u64_default.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
				const SUMh = u64_default.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
				SHA512_W_H[i] = SUMh | 0;
				SHA512_W_L[i] = SUMl | 0;
			}
			let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
			for (let i = 0; i < 80; i++) {
				const sigma1h = u64_default.rotrSH(Eh, El, 14) ^ u64_default.rotrSH(Eh, El, 18) ^ u64_default.rotrBH(Eh, El, 41);
				const sigma1l = u64_default.rotrSL(Eh, El, 14) ^ u64_default.rotrSL(Eh, El, 18) ^ u64_default.rotrBL(Eh, El, 41);
				const CHIh = Eh & Fh ^ ~Eh & Gh;
				const CHIl = El & Fl ^ ~El & Gl;
				const T1ll = u64_default.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
				const T1h = u64_default.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
				const T1l = T1ll | 0;
				const sigma0h = u64_default.rotrSH(Ah, Al, 28) ^ u64_default.rotrBH(Ah, Al, 34) ^ u64_default.rotrBH(Ah, Al, 39);
				const sigma0l = u64_default.rotrSL(Ah, Al, 28) ^ u64_default.rotrBL(Ah, Al, 34) ^ u64_default.rotrBL(Ah, Al, 39);
				const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
				const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
				Hh = Gh | 0;
				Hl = Gl | 0;
				Gh = Fh | 0;
				Gl = Fl | 0;
				Fh = Eh | 0;
				Fl = El | 0;
				({h: Eh, l: El} = u64_default.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
				Dh = Ch | 0;
				Dl = Cl | 0;
				Ch = Bh | 0;
				Cl = Bl | 0;
				Bh = Ah | 0;
				Bl = Al | 0;
				const All = u64_default.add3L(T1l, sigma0l, MAJl);
				Ah = u64_default.add3H(All, T1h, sigma0h, MAJh);
				Al = All | 0;
			}
			({h: Ah, l: Al} = u64_default.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
			({h: Bh, l: Bl} = u64_default.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
			({h: Ch, l: Cl} = u64_default.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
			({h: Dh, l: Dl} = u64_default.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
			({h: Eh, l: El} = u64_default.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
			({h: Fh, l: Fl} = u64_default.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
			({h: Gh, l: Gl} = u64_default.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
			({h: Hh, l: Hl} = u64_default.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
			this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
		}
		roundClean() {
			SHA512_W_H.fill(0);
			SHA512_W_L.fill(0);
		}
		destroy() {
			this.buffer.fill(0);
			this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
		}
	};
	var sha512$1 = /* @__PURE__ */ wrapConstructor(() => new SHA512());
	var _0n = BigInt(0);
	var _1n = BigInt(1);
	var _2n = BigInt(2);
	function isBytes3(a) {
		return a instanceof Uint8Array || a != null && typeof a === "object" && a.constructor.name === "Uint8Array";
	}
	var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
	function bytesToHex(bytes2) {
		if (!isBytes3(bytes2)) throw new Error("Uint8Array expected");
		let hex = "";
		for (let i = 0; i < bytes2.length; i++) hex += hexes[bytes2[i]];
		return hex;
	}
	function hexToNumber(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		return BigInt(hex === "" ? "0" : `0x${hex}`);
	}
	var asciis = {
		_0: 48,
		_9: 57,
		_A: 65,
		_F: 70,
		_a: 97,
		_f: 102
	};
	function asciiToBase16(char) {
		if (char >= asciis._0 && char <= asciis._9) return char - asciis._0;
		if (char >= asciis._A && char <= asciis._F) return char - (asciis._A - 10);
		if (char >= asciis._a && char <= asciis._f) return char - (asciis._a - 10);
		return;
	}
	function hexToBytes(hex) {
		if (typeof hex !== "string") throw new Error("hex string expected, got " + typeof hex);
		const hl = hex.length;
		const al = hl / 2;
		if (hl % 2) throw new Error("padded hex string expected, got unpadded hex of length " + hl);
		const array = new Uint8Array(al);
		for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
			const n1 = asciiToBase16(hex.charCodeAt(hi));
			const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
			if (n1 === void 0 || n2 === void 0) {
				const char = hex[hi] + hex[hi + 1];
				throw new Error("hex string expected, got non-hex character \"" + char + "\" at index " + hi);
			}
			array[ai] = n1 * 16 + n2;
		}
		return array;
	}
	function bytesToNumberBE(bytes2) {
		return hexToNumber(bytesToHex(bytes2));
	}
	function bytesToNumberLE(bytes2) {
		if (!isBytes3(bytes2)) throw new Error("Uint8Array expected");
		return hexToNumber(bytesToHex(Uint8Array.from(bytes2).reverse()));
	}
	function numberToBytesBE(n, len) {
		return hexToBytes(n.toString(16).padStart(len * 2, "0"));
	}
	function numberToBytesLE(n, len) {
		return numberToBytesBE(n, len).reverse();
	}
	function ensureBytes(title, hex, expectedLength) {
		let res;
		if (typeof hex === "string") try {
			res = hexToBytes(hex);
		} catch (e) {
			throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
		}
else if (isBytes3(hex)) res = Uint8Array.from(hex);
else throw new Error(`${title} must be hex string or Uint8Array`);
		const len = res.length;
		if (typeof expectedLength === "number" && len !== expectedLength) throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
		return res;
	}
	function concatBytes2(...arrays) {
		let sum = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			if (!isBytes3(a)) throw new Error("Uint8Array expected");
			sum += a.length;
		}
		let res = new Uint8Array(sum);
		let pad = 0;
		for (let i = 0; i < arrays.length; i++) {
			const a = arrays[i];
			res.set(a, pad);
			pad += a.length;
		}
		return res;
	}
	var bitMask = (n) => (_2n << BigInt(n - 1)) - _1n;
	var validatorFns = {
		bigint: (val) => typeof val === "bigint",
		function: (val) => typeof val === "function",
		boolean: (val) => typeof val === "boolean",
		string: (val) => typeof val === "string",
		stringOrUint8Array: (val) => typeof val === "string" || isBytes3(val),
		isSafeInteger: (val) => Number.isSafeInteger(val),
		array: (val) => Array.isArray(val),
		field: (val, object) => object.Fp.isValid(val),
		hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
	};
	function validateObject(object, validators, optValidators = {}) {
		const checkField = (fieldName, type, isOptional) => {
			const checkVal = validatorFns[type];
			if (typeof checkVal !== "function") throw new Error(`Invalid validator "${type}", expected function`);
			const val = object[fieldName];
			if (isOptional && val === void 0) return;
			if (!checkVal(val, object)) throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
		};
		for (const [fieldName, type] of Object.entries(validators)) checkField(fieldName, type, false);
		for (const [fieldName, type] of Object.entries(optValidators)) checkField(fieldName, type, true);
		return object;
	}
	var _0n2 = BigInt(0);
	var _1n2 = BigInt(1);
	var _2n2 = BigInt(2);
	var _3n = BigInt(3);
	var _4n = BigInt(4);
	var _5n = BigInt(5);
	var _8n = BigInt(8);
	var _9n = BigInt(9);
	var _16n = BigInt(16);
	function mod(a, b) {
		const result = a % b;
		return result >= _0n2 ? result : b + result;
	}
	function pow(num, power, modulo) {
		if (modulo <= _0n2 || power < _0n2) throw new Error("Expected power/modulo > 0");
		if (modulo === _1n2) return _0n2;
		let res = _1n2;
		while (power > _0n2) {
			if (power & _1n2) res = res * num % modulo;
			num = num * num % modulo;
			power >>= _1n2;
		}
		return res;
	}
	function pow2(x, power, modulo) {
		let res = x;
		while (power-- > _0n2) {
			res *= res;
			res %= modulo;
		}
		return res;
	}
	function invert(number, modulo) {
		if (number === _0n2 || modulo <= _0n2) throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
		let a = mod(number, modulo);
		let b = modulo;
		let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
		while (a !== _0n2) {
			const q = b / a;
			const r = b % a;
			const m = x - u * q;
			const n = y - v * q;
			b = a, a = r, x = u, y = v, u = m, v = n;
		}
		const gcd = b;
		if (gcd !== _1n2) throw new Error("invert: does not exist");
		return mod(x, modulo);
	}
	function tonelliShanks(P) {
		const legendreC = (P - _1n2) / _2n2;
		let Q, S, Z;
		for (Q = P - _1n2, S = 0; Q % _2n2 === _0n2; Q /= _2n2, S++);
		for (Z = _2n2; Z < P && pow(Z, legendreC, P) !== P - _1n2; Z++);
		if (S === 1) {
			const p1div4 = (P + _1n2) / _4n;
			return function tonelliFast(Fp2, n) {
				const root = Fp2.pow(n, p1div4);
				if (!Fp2.eql(Fp2.sqr(root), n)) throw new Error("Cannot find square root");
				return root;
			};
		}
		const Q1div2 = (Q + _1n2) / _2n2;
		return function tonelliSlow(Fp2, n) {
			if (Fp2.pow(n, legendreC) === Fp2.neg(Fp2.ONE)) throw new Error("Cannot find square root");
			let r = S;
			let g = Fp2.pow(Fp2.mul(Fp2.ONE, Z), Q);
			let x = Fp2.pow(n, Q1div2);
			let b = Fp2.pow(n, Q);
			while (!Fp2.eql(b, Fp2.ONE)) {
				if (Fp2.eql(b, Fp2.ZERO)) return Fp2.ZERO;
				let m = 1;
				for (let t2 = Fp2.sqr(b); m < r; m++) {
					if (Fp2.eql(t2, Fp2.ONE)) break;
					t2 = Fp2.sqr(t2);
				}
				const ge = Fp2.pow(g, _1n2 << BigInt(r - m - 1));
				g = Fp2.sqr(ge);
				x = Fp2.mul(x, ge);
				b = Fp2.mul(b, g);
				r = m;
			}
			return x;
		};
	}
	function FpSqrt(P) {
		if (P % _4n === _3n) {
			const p1div4 = (P + _1n2) / _4n;
			return function sqrt3mod4(Fp2, n) {
				const root = Fp2.pow(n, p1div4);
				if (!Fp2.eql(Fp2.sqr(root), n)) throw new Error("Cannot find square root");
				return root;
			};
		}
		if (P % _8n === _5n) {
			const c1 = (P - _5n) / _8n;
			return function sqrt5mod8(Fp2, n) {
				const n2 = Fp2.mul(n, _2n2);
				const v = Fp2.pow(n2, c1);
				const nv = Fp2.mul(n, v);
				const i = Fp2.mul(Fp2.mul(nv, _2n2), v);
				const root = Fp2.mul(nv, Fp2.sub(i, Fp2.ONE));
				if (!Fp2.eql(Fp2.sqr(root), n)) throw new Error("Cannot find square root");
				return root;
			};
		}
		if (P % _16n === _9n) {}
		return tonelliShanks(P);
	}
	var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
	var FIELD_FIELDS = [
		"create",
		"isValid",
		"is0",
		"neg",
		"inv",
		"sqrt",
		"sqr",
		"eql",
		"add",
		"sub",
		"mul",
		"pow",
		"div",
		"addN",
		"subN",
		"mulN",
		"sqrN"
	];
	function validateField(field) {
		const initial = {
			ORDER: "bigint",
			MASK: "bigint",
			BYTES: "isSafeInteger",
			BITS: "isSafeInteger"
		};
		const opts = FIELD_FIELDS.reduce((map, val) => {
			map[val] = "function";
			return map;
		}, initial);
		return validateObject(field, opts);
	}
	function FpPow(f, num, power) {
		if (power < _0n2) throw new Error("Expected power > 0");
		if (power === _0n2) return f.ONE;
		if (power === _1n2) return num;
		let p = f.ONE;
		let d = num;
		while (power > _0n2) {
			if (power & _1n2) p = f.mul(p, d);
			d = f.sqr(d);
			power >>= _1n2;
		}
		return p;
	}
	function FpInvertBatch(f, nums) {
		const tmp = new Array(nums.length);
		const lastMultiplied = nums.reduce((acc, num, i) => {
			if (f.is0(num)) return acc;
			tmp[i] = acc;
			return f.mul(acc, num);
		}, f.ONE);
		const inverted = f.inv(lastMultiplied);
		nums.reduceRight((acc, num, i) => {
			if (f.is0(num)) return acc;
			tmp[i] = f.mul(acc, tmp[i]);
			return f.mul(acc, num);
		}, inverted);
		return tmp;
	}
	function nLength(n, nBitLength) {
		const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
		const nByteLength = Math.ceil(_nBitLength / 8);
		return {
			nBitLength: _nBitLength,
			nByteLength
		};
	}
	function Field(ORDER, bitLen, isLE2 = false, redef = {}) {
		if (ORDER <= _0n2) throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
		const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
		if (BYTES > 2048) throw new Error("Field lengths over 2048 bytes are not supported");
		const sqrtP = FpSqrt(ORDER);
		const f = Object.freeze({
			ORDER,
			BITS,
			BYTES,
			MASK: bitMask(BITS),
			ZERO: _0n2,
			ONE: _1n2,
			create: (num) => mod(num, ORDER),
			isValid: (num) => {
				if (typeof num !== "bigint") throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
				return _0n2 <= num && num < ORDER;
			},
			is0: (num) => num === _0n2,
			isOdd: (num) => (num & _1n2) === _1n2,
			neg: (num) => mod(-num, ORDER),
			eql: (lhs, rhs) => lhs === rhs,
			sqr: (num) => mod(num * num, ORDER),
			add: (lhs, rhs) => mod(lhs + rhs, ORDER),
			sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
			mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
			pow: (num, power) => FpPow(f, num, power),
			div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
			sqrN: (num) => num * num,
			addN: (lhs, rhs) => lhs + rhs,
			subN: (lhs, rhs) => lhs - rhs,
			mulN: (lhs, rhs) => lhs * rhs,
			inv: (num) => invert(num, ORDER),
			sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
			invertBatch: (lst) => FpInvertBatch(f, lst),
			cmov: (a, b, c) => c ? b : a,
			toBytes: (num) => isLE2 ? numberToBytesLE(num, BYTES) : numberToBytesBE(num, BYTES),
			fromBytes: (bytes2) => {
				if (bytes2.length !== BYTES) throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes2.length}`);
				return isLE2 ? bytesToNumberLE(bytes2) : bytesToNumberBE(bytes2);
			}
		});
		return Object.freeze(f);
	}
	function FpSqrtEven(Fp2, elm) {
		if (!Fp2.isOdd) throw new Error(`Field doesn't have isOdd`);
		const root = Fp2.sqrt(elm);
		return Fp2.isOdd(root) ? Fp2.neg(root) : root;
	}
	var _0n3 = BigInt(0);
	var _1n3 = BigInt(1);
	function wNAF(c, bits) {
		const constTimeNegate = (condition, item) => {
			const neg = item.negate();
			return condition ? neg : item;
		};
		const opts = (W) => {
			const windows = Math.ceil(bits / W) + 1;
			const windowSize = 2 ** (W - 1);
			return {
				windows,
				windowSize
			};
		};
		return {
			constTimeNegate,
			unsafeLadder(elm, n) {
				let p = c.ZERO;
				let d = elm;
				while (n > _0n3) {
					if (n & _1n3) p = p.add(d);
					d = d.double();
					n >>= _1n3;
				}
				return p;
			},
			precomputeWindow(elm, W) {
				const { windows, windowSize } = opts(W);
				const points = [];
				let p = elm;
				let base = p;
				for (let window = 0; window < windows; window++) {
					base = p;
					points.push(base);
					for (let i = 1; i < windowSize; i++) {
						base = base.add(p);
						points.push(base);
					}
					p = base.double();
				}
				return points;
			},
			wNAF(W, precomputes, n) {
				const { windows, windowSize } = opts(W);
				let p = c.ZERO;
				let f = c.BASE;
				const mask$1 = BigInt(2 ** W - 1);
				const maxNumber = 2 ** W;
				const shiftBy = BigInt(W);
				for (let window = 0; window < windows; window++) {
					const offset = window * windowSize;
					let wbits = Number(n & mask$1);
					n >>= shiftBy;
					if (wbits > windowSize) {
						wbits -= maxNumber;
						n += _1n3;
					}
					const offset1 = offset;
					const offset2 = offset + Math.abs(wbits) - 1;
					const cond1 = window % 2 !== 0;
					const cond2 = wbits < 0;
					if (wbits === 0) f = f.add(constTimeNegate(cond1, precomputes[offset1]));
else p = p.add(constTimeNegate(cond2, precomputes[offset2]));
				}
				return {
					p,
					f
				};
			},
			wNAFCached(P, precomputesMap, n, transform) {
				const W = P._WINDOW_SIZE || 1;
				let comp = precomputesMap.get(P);
				if (!comp) {
					comp = this.precomputeWindow(P, W);
					if (W !== 1) precomputesMap.set(P, transform(comp));
				}
				return this.wNAF(W, comp, n);
			}
		};
	}
	function validateBasic(curve) {
		validateField(curve.Fp);
		validateObject(curve, {
			n: "bigint",
			h: "bigint",
			Gx: "field",
			Gy: "field"
		}, {
			nBitLength: "isSafeInteger",
			nByteLength: "isSafeInteger"
		});
		return Object.freeze({
			...nLength(curve.n, curve.nBitLength),
			...curve,
			...{ p: curve.Fp.ORDER }
		});
	}
	var _0n4 = BigInt(0);
	var _1n4 = BigInt(1);
	var _2n3 = BigInt(2);
	var _8n2 = BigInt(8);
	var VERIFY_DEFAULT = { zip215: true };
	function validateOpts(curve) {
		const opts = validateBasic(curve);
		validateObject(curve, {
			hash: "function",
			a: "bigint",
			d: "bigint",
			randomBytes: "function"
		}, {
			adjustScalarBytes: "function",
			domain: "function",
			uvRatio: "function",
			mapToCurve: "function"
		});
		return Object.freeze({ ...opts });
	}
	function twistedEdwards(curveDef) {
		const CURVE = validateOpts(curveDef);
		const { Fp: Fp2, n: CURVE_ORDER, prehash, hash: cHash, randomBytes: randomBytes2, nByteLength, h: cofactor } = CURVE;
		const MASK = _2n3 << BigInt(nByteLength * 8) - _1n4;
		const modP = Fp2.create;
		const uvRatio2 = CURVE.uvRatio || ((u, v) => {
			try {
				return {
					isValid: true,
					value: Fp2.sqrt(u * Fp2.inv(v))
				};
			} catch (e) {
				return {
					isValid: false,
					value: _0n4
				};
			}
		});
		const adjustScalarBytes2 = CURVE.adjustScalarBytes || ((bytes2) => bytes2);
		const domain = CURVE.domain || ((data, ctx, phflag) => {
			if (ctx.length || phflag) throw new Error("Contexts/pre-hash are not supported");
			return data;
		});
		const inBig = (n) => typeof n === "bigint" && _0n4 < n;
		const inRange = (n, max) => inBig(n) && inBig(max) && n < max;
		const in0MaskRange = (n) => n === _0n4 || inRange(n, MASK);
		function assertInRange(n, max) {
			if (inRange(n, max)) return n;
			throw new Error(`Expected valid scalar < ${max}, got ${typeof n} ${n}`);
		}
		function assertGE0(n) {
			return n === _0n4 ? n : assertInRange(n, CURVE_ORDER);
		}
		const pointPrecomputes = /* @__PURE__ */ new Map();
		function isPoint(other) {
			if (!(other instanceof Point)) throw new Error("ExtendedPoint expected");
		}
		class Point {
			constructor(ex, ey, ez, et) {
				this.ex = ex;
				this.ey = ey;
				this.ez = ez;
				this.et = et;
				if (!in0MaskRange(ex)) throw new Error("x required");
				if (!in0MaskRange(ey)) throw new Error("y required");
				if (!in0MaskRange(ez)) throw new Error("z required");
				if (!in0MaskRange(et)) throw new Error("t required");
			}
			get x() {
				return this.toAffine().x;
			}
			get y() {
				return this.toAffine().y;
			}
			static fromAffine(p) {
				if (p instanceof Point) throw new Error("extended point not allowed");
				const { x, y } = p || {};
				if (!in0MaskRange(x) || !in0MaskRange(y)) throw new Error("invalid affine point");
				return new Point(x, y, _1n4, modP(x * y));
			}
			static normalizeZ(points) {
				const toInv = Fp2.invertBatch(points.map((p) => p.ez));
				return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
			}
			_setWindowSize(windowSize) {
				this._WINDOW_SIZE = windowSize;
				pointPrecomputes.delete(this);
			}
			assertValidity() {
				const { a, d } = CURVE;
				if (this.is0()) throw new Error("bad point: ZERO");
				const { ex: X, ey: Y, ez: Z, et: T } = this;
				const X2 = modP(X * X);
				const Y2 = modP(Y * Y);
				const Z2 = modP(Z * Z);
				const Z4 = modP(Z2 * Z2);
				const aX2 = modP(X2 * a);
				const left = modP(Z2 * modP(aX2 + Y2));
				const right = modP(Z4 + modP(d * modP(X2 * Y2)));
				if (left !== right) throw new Error("bad point: equation left != right (1)");
				const XY = modP(X * Y);
				const ZT = modP(Z * T);
				if (XY !== ZT) throw new Error("bad point: equation left != right (2)");
			}
			equals(other) {
				isPoint(other);
				const { ex: X1, ey: Y1, ez: Z1 } = this;
				const { ex: X2, ey: Y2, ez: Z2 } = other;
				const X1Z2 = modP(X1 * Z2);
				const X2Z1 = modP(X2 * Z1);
				const Y1Z2 = modP(Y1 * Z2);
				const Y2Z1 = modP(Y2 * Z1);
				return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
			}
			is0() {
				return this.equals(Point.ZERO);
			}
			negate() {
				return new Point(modP(-this.ex), this.ey, this.ez, modP(-this.et));
			}
			double() {
				const { a } = CURVE;
				const { ex: X1, ey: Y1, ez: Z1 } = this;
				const A = modP(X1 * X1);
				const B = modP(Y1 * Y1);
				const C = modP(_2n3 * modP(Z1 * Z1));
				const D = modP(a * A);
				const x1y1 = X1 + Y1;
				const E = modP(modP(x1y1 * x1y1) - A - B);
				const G2 = D + B;
				const F = G2 - C;
				const H = D - B;
				const X3 = modP(E * F);
				const Y3 = modP(G2 * H);
				const T3 = modP(E * H);
				const Z3 = modP(F * G2);
				return new Point(X3, Y3, Z3, T3);
			}
			add(other) {
				isPoint(other);
				const { a, d } = CURVE;
				const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
				const { ex: X2, ey: Y2, ez: Z2, et: T2 } = other;
				if (a === BigInt(-1)) {
					const A2 = modP((Y1 - X1) * (Y2 + X2));
					const B2 = modP((Y1 + X1) * (Y2 - X2));
					const F2 = modP(B2 - A2);
					if (F2 === _0n4) return this.double();
					const C2 = modP(Z1 * _2n3 * T2);
					const D2 = modP(T1 * _2n3 * Z2);
					const E2 = D2 + C2;
					const G3 = B2 + A2;
					const H2 = D2 - C2;
					const X32 = modP(E2 * F2);
					const Y32 = modP(G3 * H2);
					const T32 = modP(E2 * H2);
					const Z32 = modP(F2 * G3);
					return new Point(X32, Y32, Z32, T32);
				}
				const A = modP(X1 * X2);
				const B = modP(Y1 * Y2);
				const C = modP(T1 * d * T2);
				const D = modP(Z1 * Z2);
				const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
				const F = D - C;
				const G2 = D + C;
				const H = modP(B - a * A);
				const X3 = modP(E * F);
				const Y3 = modP(G2 * H);
				const T3 = modP(E * H);
				const Z3 = modP(F * G2);
				return new Point(X3, Y3, Z3, T3);
			}
			subtract(other) {
				return this.add(other.negate());
			}
			wNAF(n) {
				return wnaf.wNAFCached(this, pointPrecomputes, n, Point.normalizeZ);
			}
			multiply(scalar) {
				const { p, f } = this.wNAF(assertInRange(scalar, CURVE_ORDER));
				return Point.normalizeZ([p, f])[0];
			}
			multiplyUnsafe(scalar) {
				let n = assertGE0(scalar);
				if (n === _0n4) return I;
				if (this.equals(I) || n === _1n4) return this;
				if (this.equals(G)) return this.wNAF(n).p;
				return wnaf.unsafeLadder(this, n);
			}
			isSmallOrder() {
				return this.multiplyUnsafe(cofactor).is0();
			}
			isTorsionFree() {
				return wnaf.unsafeLadder(this, CURVE_ORDER).is0();
			}
			toAffine(iz) {
				const { ex: x, ey: y, ez: z } = this;
				const is0 = this.is0();
				if (iz == null) iz = is0 ? _8n2 : Fp2.inv(z);
				const ax = modP(x * iz);
				const ay = modP(y * iz);
				const zz = modP(z * iz);
				if (is0) return {
					x: _0n4,
					y: _1n4
				};
				if (zz !== _1n4) throw new Error("invZ was invalid");
				return {
					x: ax,
					y: ay
				};
			}
			clearCofactor() {
				const { h: cofactor2 } = CURVE;
				if (cofactor2 === _1n4) return this;
				return this.multiplyUnsafe(cofactor2);
			}
			static fromHex(hex, zip215 = false) {
				const { d, a } = CURVE;
				const len = Fp2.BYTES;
				hex = ensureBytes("pointHex", hex, len);
				const normed = hex.slice();
				const lastByte = hex[len - 1];
				normed[len - 1] = lastByte & -129;
				const y = bytesToNumberLE(normed);
				if (y === _0n4) {} else if (zip215) assertInRange(y, MASK);
else assertInRange(y, Fp2.ORDER);
				const y2 = modP(y * y);
				const u = modP(y2 - _1n4);
				const v = modP(d * y2 - a);
				let { isValid, value: x } = uvRatio2(u, v);
				if (!isValid) throw new Error("Point.fromHex: invalid y coordinate");
				const isXOdd = (x & _1n4) === _1n4;
				const isLastByteOdd = (lastByte & 128) !== 0;
				if (!zip215 && x === _0n4 && isLastByteOdd) throw new Error("Point.fromHex: x=0 and x_0=1");
				if (isLastByteOdd !== isXOdd) x = modP(-x);
				return Point.fromAffine({
					x,
					y
				});
			}
			static fromPrivateKey(privKey) {
				return getExtendedPublicKey(privKey).point;
			}
			toRawBytes() {
				const { x, y } = this.toAffine();
				const bytes2 = numberToBytesLE(y, Fp2.BYTES);
				bytes2[bytes2.length - 1] |= x & _1n4 ? 128 : 0;
				return bytes2;
			}
			toHex() {
				return bytesToHex(this.toRawBytes());
			}
		}
		Point.BASE = new Point(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy));
		Point.ZERO = new Point(_0n4, _1n4, _1n4, _0n4);
		const { BASE: G, ZERO: I } = Point;
		const wnaf = wNAF(Point, nByteLength * 8);
		function modN(a) {
			return mod(a, CURVE_ORDER);
		}
		function modN_LE(hash) {
			return modN(bytesToNumberLE(hash));
		}
		function getExtendedPublicKey(key) {
			const len = nByteLength;
			key = ensureBytes("private key", key, len);
			const hashed = ensureBytes("hashed private key", cHash(key), 2 * len);
			const head = adjustScalarBytes2(hashed.slice(0, len));
			const prefix = hashed.slice(len, 2 * len);
			const scalar = modN_LE(head);
			const point = G.multiply(scalar);
			const pointBytes = point.toRawBytes();
			return {
				head,
				prefix,
				scalar,
				point,
				pointBytes
			};
		}
		function getPublicKey(privKey) {
			return getExtendedPublicKey(privKey).pointBytes;
		}
		function hashDomainToScalar(context = new Uint8Array(), ...msgs) {
			const msg = concatBytes2(...msgs);
			return modN_LE(cHash(domain(msg, ensureBytes("context", context), !!prehash)));
		}
		function sign(msg, privKey, options = {}) {
			msg = ensureBytes("message", msg);
			if (prehash) msg = prehash(msg);
			const { prefix, scalar, pointBytes } = getExtendedPublicKey(privKey);
			const r = hashDomainToScalar(options.context, prefix, msg);
			const R = G.multiply(r).toRawBytes();
			const k = hashDomainToScalar(options.context, R, pointBytes, msg);
			const s = modN(r + k * scalar);
			assertGE0(s);
			const res = concatBytes2(R, numberToBytesLE(s, Fp2.BYTES));
			return ensureBytes("result", res, nByteLength * 2);
		}
		const verifyOpts = VERIFY_DEFAULT;
		function verify(sig, msg, publicKey, options = verifyOpts) {
			const { context, zip215 } = options;
			const len = Fp2.BYTES;
			sig = ensureBytes("signature", sig, 2 * len);
			msg = ensureBytes("message", msg);
			if (prehash) msg = prehash(msg);
			const s = bytesToNumberLE(sig.slice(len, 2 * len));
			let A, R, SB;
			try {
				A = Point.fromHex(publicKey, zip215);
				R = Point.fromHex(sig.slice(0, len), zip215);
				SB = G.multiplyUnsafe(s);
			} catch (error) {
				return false;
			}
			if (!zip215 && A.isSmallOrder()) return false;
			const k = hashDomainToScalar(context, R.toRawBytes(), A.toRawBytes(), msg);
			const RkA = R.add(A.multiplyUnsafe(k));
			return RkA.subtract(SB).clearCofactor().equals(Point.ZERO);
		}
		G._setWindowSize(8);
		const utils = {
			getExtendedPublicKey,
			randomPrivateKey: () => randomBytes2(Fp2.BYTES),
			precompute(windowSize = 8, point = Point.BASE) {
				point._setWindowSize(windowSize);
				point.multiply(BigInt(3));
				return point;
			}
		};
		return {
			CURVE,
			getPublicKey,
			sign,
			verify,
			ExtendedPoint: Point,
			utils
		};
	}
	var _0n5 = BigInt(0);
	var _1n5 = BigInt(1);
	function validateOpts2(curve) {
		validateObject(curve, { a: "bigint" }, {
			montgomeryBits: "isSafeInteger",
			nByteLength: "isSafeInteger",
			adjustScalarBytes: "function",
			domain: "function",
			powPminus2: "function",
			Gu: "bigint"
		});
		return Object.freeze({ ...curve });
	}
	function montgomery(curveDef) {
		const CURVE = validateOpts2(curveDef);
		const { P } = CURVE;
		const modP = (n) => mod(n, P);
		const montgomeryBits = CURVE.montgomeryBits;
		const montgomeryBytes = Math.ceil(montgomeryBits / 8);
		const fieldLen = CURVE.nByteLength;
		const adjustScalarBytes2 = CURVE.adjustScalarBytes || ((bytes2) => bytes2);
		const powPminus2 = CURVE.powPminus2 || ((x) => pow(x, P - BigInt(2), P));
		function cswap(swap, x_2, x_3) {
			const dummy = modP(swap * (x_2 - x_3));
			x_2 = modP(x_2 - dummy);
			x_3 = modP(x_3 + dummy);
			return [x_2, x_3];
		}
		function assertFieldElement(n) {
			if (typeof n === "bigint" && _0n5 <= n && n < P) return n;
			throw new Error("Expected valid scalar 0 < scalar < CURVE.P");
		}
		const a24 = (CURVE.a - BigInt(2)) / BigInt(4);
		function montgomeryLadder(pointU, scalar) {
			const u = assertFieldElement(pointU);
			const k = assertFieldElement(scalar);
			const x_1 = u;
			let x_2 = _1n5;
			let z_2 = _0n5;
			let x_3 = u;
			let z_3 = _1n5;
			let swap = _0n5;
			let sw;
			for (let t$1 = BigInt(montgomeryBits - 1); t$1 >= _0n5; t$1--) {
				const k_t = k >> t$1 & _1n5;
				swap ^= k_t;
				sw = cswap(swap, x_2, x_3);
				x_2 = sw[0];
				x_3 = sw[1];
				sw = cswap(swap, z_2, z_3);
				z_2 = sw[0];
				z_3 = sw[1];
				swap = k_t;
				const A = x_2 + z_2;
				const AA = modP(A * A);
				const B = x_2 - z_2;
				const BB = modP(B * B);
				const E = AA - BB;
				const C = x_3 + z_3;
				const D = x_3 - z_3;
				const DA = modP(D * A);
				const CB = modP(C * B);
				const dacb = DA + CB;
				const da_cb = DA - CB;
				x_3 = modP(dacb * dacb);
				z_3 = modP(x_1 * modP(da_cb * da_cb));
				x_2 = modP(AA * BB);
				z_2 = modP(E * (AA + modP(a24 * E)));
			}
			sw = cswap(swap, x_2, x_3);
			x_2 = sw[0];
			x_3 = sw[1];
			sw = cswap(swap, z_2, z_3);
			z_2 = sw[0];
			z_3 = sw[1];
			const z2 = powPminus2(z_2);
			return modP(x_2 * z2);
		}
		function encodeUCoordinate(u) {
			return numberToBytesLE(modP(u), montgomeryBytes);
		}
		function decodeUCoordinate(uEnc) {
			const u = ensureBytes("u coordinate", uEnc, montgomeryBytes);
			if (fieldLen === 32) u[31] &= 127;
			return bytesToNumberLE(u);
		}
		function decodeScalar(n) {
			const bytes2 = ensureBytes("scalar", n);
			const len = bytes2.length;
			if (len !== montgomeryBytes && len !== fieldLen) throw new Error(`Expected ${montgomeryBytes} or ${fieldLen} bytes, got ${len}`);
			return bytesToNumberLE(adjustScalarBytes2(bytes2));
		}
		function scalarMult(scalar, u) {
			const pointU = decodeUCoordinate(u);
			const _scalar = decodeScalar(scalar);
			const pu = montgomeryLadder(pointU, _scalar);
			if (pu === _0n5) throw new Error("Invalid private or public key received");
			return encodeUCoordinate(pu);
		}
		const GuBytes = encodeUCoordinate(CURVE.Gu);
		function scalarMultBase(scalar) {
			return scalarMult(scalar, GuBytes);
		}
		return {
			scalarMult,
			scalarMultBase,
			getSharedSecret: (privateKey, publicKey) => scalarMult(privateKey, publicKey),
			getPublicKey: (privateKey) => scalarMultBase(privateKey),
			utils: { randomPrivateKey: () => CURVE.randomBytes(CURVE.nByteLength) },
			GuBytes
		};
	}
	var ED25519_P = BigInt("57896044618658097711785492504343953926634992332820282019728792003956564819949");
	var ED25519_SQRT_M1 = BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
	var _0n6 = BigInt(0);
	var _1n6 = BigInt(1);
	var _2n4 = BigInt(2);
	var _5n2 = BigInt(5);
	var _10n = BigInt(10);
	var _20n = BigInt(20);
	var _40n = BigInt(40);
	var _80n = BigInt(80);
	function ed25519_pow_2_252_3(x) {
		const P = ED25519_P;
		const x2 = x * x % P;
		const b2 = x2 * x % P;
		const b4 = pow2(b2, _2n4, P) * b2 % P;
		const b5 = pow2(b4, _1n6, P) * x % P;
		const b10 = pow2(b5, _5n2, P) * b5 % P;
		const b20 = pow2(b10, _10n, P) * b10 % P;
		const b40 = pow2(b20, _20n, P) * b20 % P;
		const b80 = pow2(b40, _40n, P) * b40 % P;
		const b160 = pow2(b80, _80n, P) * b80 % P;
		const b240 = pow2(b160, _80n, P) * b80 % P;
		const b250 = pow2(b240, _10n, P) * b10 % P;
		const pow_p_5_8 = pow2(b250, _2n4, P) * x % P;
		return {
			pow_p_5_8,
			b2
		};
	}
	function adjustScalarBytes(bytes2) {
		bytes2[0] &= 248;
		bytes2[31] &= 127;
		bytes2[31] |= 64;
		return bytes2;
	}
	function uvRatio(u, v) {
		const P = ED25519_P;
		const v3 = mod(v * v * v, P);
		const v7 = mod(v3 * v3 * v, P);
		const pow3 = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
		let x = mod(u * v3 * pow3, P);
		const vx2 = mod(v * x * x, P);
		const root1 = x;
		const root2 = mod(x * ED25519_SQRT_M1, P);
		const useRoot1 = vx2 === u;
		const useRoot2 = vx2 === mod(-u, P);
		const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
		if (useRoot1) x = root1;
		if (useRoot2 || noRoot) x = root2;
		if (isNegativeLE(x, P)) x = mod(-x, P);
		return {
			isValid: useRoot1 || useRoot2,
			value: x
		};
	}
	var Fp = Field(ED25519_P, void 0, true);
	var ed25519Defaults = {
		a: BigInt(-1),
		d: BigInt("37095705934669439343138083508754565189542113879843219016388785533085940283555"),
		Fp,
		n: BigInt("7237005577332262213973186563042994240857116359379907606001950938285454250989"),
		h: BigInt(8),
		Gx: BigInt("15112221349535400772501151409588531511454012693041857206046113283949847762202"),
		Gy: BigInt("46316835694926478169428394003475163141307993866256225615783033603165251855960"),
		hash: sha512$1,
		randomBytes,
		adjustScalarBytes,
		uvRatio
	};
	function ed25519_domain(data, ctx, phflag) {
		if (ctx.length > 255) throw new Error("Context is too big");
		return concatBytes(utf8ToBytes("SigEd25519 no Ed25519 collisions"), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
	}
	var ed25519ctx = /* @__PURE__ */ twistedEdwards({
		...ed25519Defaults,
		domain: ed25519_domain
	});
	var ed25519ph = /* @__PURE__ */ twistedEdwards({
		...ed25519Defaults,
		domain: ed25519_domain,
		prehash: sha512$1
	});
	var x25519$1 = /* @__PURE__ */ (() => montgomery({
		P: ED25519_P,
		a: BigInt(486662),
		montgomeryBits: 255,
		nByteLength: 32,
		Gu: BigInt(9),
		powPminus2: (x) => {
			const P = ED25519_P;
			const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
			return mod(pow2(pow_p_5_8, BigInt(3), P) * b2, P);
		},
		adjustScalarBytes,
		randomBytes
	}))();
	var ELL2_C1 = (Fp.ORDER + BigInt(3)) / BigInt(8);
	var ELL2_C2 = Fp.pow(_2n4, ELL2_C1);
	var ELL2_C3 = Fp.sqrt(Fp.neg(Fp.ONE));
	var ELL2_C4 = (Fp.ORDER - BigInt(5)) / BigInt(8);
	var ELL2_J = BigInt(486662);
	var ELL2_C1_EDWARDS = FpSqrtEven(Fp, Fp.neg(BigInt(486664)));
	var SQRT_AD_MINUS_ONE = BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235");
	var INVSQRT_A_MINUS_D = BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578");
	var ONE_MINUS_D_SQ = BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838");
	var D_MINUS_ONE_SQ = BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");
	var MAX_255B = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
	return __toCommonJS(input_exports);
})();
const x25519 = nobleCurves.x25519;

//#endregion
//#region packages/tutanota-crypto/dist/encryption/Ecc.js
const X25519_N_BYTE_LENGTH = 32;
function generateEccKeyPair() {
	const privateKey = clampPrivateKey(random.generateRandomData(X25519_N_BYTE_LENGTH));
	const publicKey = derivePublicKey(privateKey);
	return {
		privateKey,
		publicKey
	};
}
function eccEncapsulate(senderIdentityPrivateKey, ephemeralPrivateKey, recipientIdentityPublicKey) {
	const ephemeralSharedSecret = generateSharedSecret(ephemeralPrivateKey, recipientIdentityPublicKey);
	const authSharedSecret = generateSharedSecret(senderIdentityPrivateKey, recipientIdentityPublicKey);
	return {
		ephemeralSharedSecret,
		authSharedSecret
	};
}
function eccDecapsulate(senderIdentityPublicKey, ephemeralPublicKey, recipientIdentityPrivateKey) {
	const ephemeralSharedSecret = generateSharedSecret(recipientIdentityPrivateKey, ephemeralPublicKey);
	const authSharedSecret = generateSharedSecret(recipientIdentityPrivateKey, senderIdentityPublicKey);
	return {
		ephemeralSharedSecret,
		authSharedSecret
	};
}
/**
* Diffie-Hellman key exchange; works by combining one party's private key and the other party's public key to form a shared secret between both parties
*/
function generateSharedSecret(localPrivateKey, remotePublicKey) {
	const sharedSecret = x25519.getSharedSecret(localPrivateKey, remotePublicKey);
	if (sharedSecret.every((val) => val === 0)) throw new Error("can't get shared secret: bad key inputs");
	return sharedSecret;
}
function clampPrivateKey(privateKey) {
	privateKey[privateKey.length - 1] = privateKey[privateKey.length - 1] & 127 | 64;
	privateKey[0] &= 248;
	return privateKey;
}
function derivePublicKey(privateKey) {
	return x25519.getPublicKey(privateKey);
}

//#endregion
//#region packages/tutanota-crypto/dist/internal/bCrypt.js
function bCrypt() {
	this.GENSALT_DEFAULT_LOG2_ROUNDS = 10;
	this.BCRYPT_SALT_LEN = 16;
	this.BLOWFISH_NUM_ROUNDS = 16;
	this.MAX_EXECUTION_TIME = 100;
	this.P_orig = [
		608135816,
		2242054355,
		320440878,
		57701188,
		2752067618,
		698298832,
		137296536,
		3964562569,
		1160258022,
		953160567,
		3193202383,
		887688300,
		3232508343,
		3380367581,
		1065670069,
		3041331479,
		2450970073,
		2306472731
	];
	this.S_orig = [
		3509652390,
		2564797868,
		805139163,
		3491422135,
		3101798381,
		1780907670,
		3128725573,
		4046225305,
		614570311,
		3012652279,
		134345442,
		2240740374,
		1667834072,
		1901547113,
		2757295779,
		4103290238,
		227898511,
		1921955416,
		1904987480,
		2182433518,
		2069144605,
		3260701109,
		2620446009,
		720527379,
		3318853667,
		677414384,
		3393288472,
		3101374703,
		2390351024,
		1614419982,
		1822297739,
		2954791486,
		3608508353,
		3174124327,
		2024746970,
		1432378464,
		3864339955,
		2857741204,
		1464375394,
		1676153920,
		1439316330,
		715854006,
		3033291828,
		289532110,
		2706671279,
		2087905683,
		3018724369,
		1668267050,
		732546397,
		1947742710,
		3462151702,
		2609353502,
		2950085171,
		1814351708,
		2050118529,
		680887927,
		999245976,
		1800124847,
		3300911131,
		1713906067,
		1641548236,
		4213287313,
		1216130144,
		1575780402,
		4018429277,
		3917837745,
		3693486850,
		3949271944,
		596196993,
		3549867205,
		258830323,
		2213823033,
		772490370,
		2760122372,
		1774776394,
		2652871518,
		566650946,
		4142492826,
		1728879713,
		2882767088,
		1783734482,
		3629395816,
		2517608232,
		2874225571,
		1861159788,
		326777828,
		3124490320,
		2130389656,
		2716951837,
		967770486,
		1724537150,
		2185432712,
		2364442137,
		1164943284,
		2105845187,
		998989502,
		3765401048,
		2244026483,
		1075463327,
		1455516326,
		1322494562,
		910128902,
		469688178,
		1117454909,
		936433444,
		3490320968,
		3675253459,
		1240580251,
		122909385,
		2157517691,
		634681816,
		4142456567,
		3825094682,
		3061402683,
		2540495037,
		79693498,
		3249098678,
		1084186820,
		1583128258,
		426386531,
		1761308591,
		1047286709,
		322548459,
		995290223,
		1845252383,
		2603652396,
		3431023940,
		2942221577,
		3202600964,
		3727903485,
		1712269319,
		422464435,
		3234572375,
		1170764815,
		3523960633,
		3117677531,
		1434042557,
		442511882,
		3600875718,
		1076654713,
		1738483198,
		4213154764,
		2393238008,
		3677496056,
		1014306527,
		4251020053,
		793779912,
		2902807211,
		842905082,
		4246964064,
		1395751752,
		1040244610,
		2656851899,
		3396308128,
		445077038,
		3742853595,
		3577915638,
		679411651,
		2892444358,
		2354009459,
		1767581616,
		3150600392,
		3791627101,
		3102740896,
		284835224,
		4246832056,
		1258075500,
		768725851,
		2589189241,
		3069724005,
		3532540348,
		1274779536,
		3789419226,
		2764799539,
		1660621633,
		3471099624,
		4011903706,
		913787905,
		3497959166,
		737222580,
		2514213453,
		2928710040,
		3937242737,
		1804850592,
		3499020752,
		2949064160,
		2386320175,
		2390070455,
		2415321851,
		4061277028,
		2290661394,
		2416832540,
		1336762016,
		1754252060,
		3520065937,
		3014181293,
		791618072,
		3188594551,
		3933548030,
		2332172193,
		3852520463,
		3043980520,
		413987798,
		3465142937,
		3030929376,
		4245938359,
		2093235073,
		3534596313,
		375366246,
		2157278981,
		2479649556,
		555357303,
		3870105701,
		2008414854,
		3344188149,
		4221384143,
		3956125452,
		2067696032,
		3594591187,
		2921233993,
		2428461,
		544322398,
		577241275,
		1471733935,
		610547355,
		4027169054,
		1432588573,
		1507829418,
		2025931657,
		3646575487,
		545086370,
		48609733,
		2200306550,
		1653985193,
		298326376,
		1316178497,
		3007786442,
		2064951626,
		458293330,
		2589141269,
		3591329599,
		3164325604,
		727753846,
		2179363840,
		146436021,
		1461446943,
		4069977195,
		705550613,
		3059967265,
		3887724982,
		4281599278,
		3313849956,
		1404054877,
		2845806497,
		146425753,
		1854211946,
		1266315497,
		3048417604,
		3681880366,
		3289982499,
		290971e4,
		1235738493,
		2632868024,
		2414719590,
		3970600049,
		1771706367,
		1449415276,
		3266420449,
		422970021,
		1963543593,
		2690192192,
		3826793022,
		1062508698,
		1531092325,
		1804592342,
		2583117782,
		2714934279,
		4024971509,
		1294809318,
		4028980673,
		1289560198,
		2221992742,
		1669523910,
		35572830,
		157838143,
		1052438473,
		1016535060,
		1802137761,
		1753167236,
		1386275462,
		3080475397,
		2857371447,
		1040679964,
		2145300060,
		2390574316,
		1461121720,
		2956646967,
		4031777805,
		4028374788,
		33600511,
		2920084762,
		1018524850,
		629373528,
		3691585981,
		3515945977,
		2091462646,
		2486323059,
		586499841,
		988145025,
		935516892,
		3367335476,
		2599673255,
		2839830854,
		265290510,
		3972581182,
		2759138881,
		3795373465,
		1005194799,
		847297441,
		406762289,
		1314163512,
		1332590856,
		1866599683,
		4127851711,
		750260880,
		613907577,
		1450815602,
		3165620655,
		3734664991,
		3650291728,
		3012275730,
		3704569646,
		1427272223,
		778793252,
		1343938022,
		2676280711,
		2052605720,
		1946737175,
		3164576444,
		3914038668,
		3967478842,
		3682934266,
		1661551462,
		3294938066,
		4011595847,
		840292616,
		3712170807,
		616741398,
		312560963,
		711312465,
		1351876610,
		322626781,
		1910503582,
		271666773,
		2175563734,
		1594956187,
		70604529,
		3617834859,
		1007753275,
		1495573769,
		4069517037,
		2549218298,
		2663038764,
		504708206,
		2263041392,
		3941167025,
		2249088522,
		1514023603,
		1998579484,
		1312622330,
		694541497,
		2582060303,
		2151582166,
		1382467621,
		776784248,
		2618340202,
		3323268794,
		2497899128,
		2784771155,
		503983604,
		4076293799,
		907881277,
		423175695,
		432175456,
		1378068232,
		4145222326,
		3954048622,
		3938656102,
		3820766613,
		2793130115,
		2977904593,
		26017576,
		3274890735,
		3194772133,
		1700274565,
		1756076034,
		4006520079,
		3677328699,
		720338349,
		1533947780,
		354530856,
		688349552,
		3973924725,
		1637815568,
		332179504,
		3949051286,
		53804574,
		2852348879,
		3044236432,
		1282449977,
		3583942155,
		3416972820,
		4006381244,
		1617046695,
		2628476075,
		3002303598,
		1686838959,
		431878346,
		2686675385,
		1700445008,
		1080580658,
		1009431731,
		832498133,
		3223435511,
		2605976345,
		2271191193,
		2516031870,
		1648197032,
		4164389018,
		2548247927,
		300782431,
		375919233,
		238389289,
		3353747414,
		2531188641,
		2019080857,
		1475708069,
		455242339,
		2609103871,
		448939670,
		3451063019,
		1395535956,
		2413381860,
		1841049896,
		1491858159,
		885456874,
		4264095073,
		4001119347,
		1565136089,
		3898914787,
		1108368660,
		540939232,
		1173283510,
		2745871338,
		3681308437,
		4207628240,
		3343053890,
		4016749493,
		1699691293,
		1103962373,
		3625875870,
		2256883143,
		3830138730,
		1031889488,
		3479347698,
		1535977030,
		4236805024,
		3251091107,
		2132092099,
		1774941330,
		1199868427,
		1452454533,
		157007616,
		2904115357,
		342012276,
		595725824,
		1480756522,
		206960106,
		497939518,
		591360097,
		863170706,
		2375253569,
		3596610801,
		1814182875,
		2094937945,
		3421402208,
		1082520231,
		3463918190,
		2785509508,
		435703966,
		3908032597,
		1641649973,
		2842273706,
		3305899714,
		1510255612,
		2148256476,
		2655287854,
		3276092548,
		4258621189,
		236887753,
		3681803219,
		274041037,
		1734335097,
		3815195456,
		3317970021,
		1899903192,
		1026095262,
		4050517792,
		356393447,
		2410691914,
		3873677099,
		3682840055,
		3913112168,
		2491498743,
		4132185628,
		2489919796,
		1091903735,
		1979897079,
		3170134830,
		3567386728,
		3557303409,
		857797738,
		1136121015,
		1342202287,
		507115054,
		2535736646,
		337727348,
		3213592640,
		1301675037,
		2528481711,
		1895095763,
		1721773893,
		3216771564,
		62756741,
		2142006736,
		835421444,
		2531993523,
		1442658625,
		3659876326,
		2882144922,
		676362277,
		1392781812,
		170690266,
		3921047035,
		1759253602,
		3611846912,
		1745797284,
		664899054,
		1329594018,
		3901205900,
		3045908486,
		2062866102,
		2865634940,
		3543621612,
		3464012697,
		1080764994,
		553557557,
		3656615353,
		3996768171,
		991055499,
		499776247,
		1265440854,
		648242737,
		3940784050,
		980351604,
		3713745714,
		1749149687,
		3396870395,
		4211799374,
		3640570775,
		1161844396,
		3125318951,
		1431517754,
		545492359,
		4268468663,
		3499529547,
		1437099964,
		2702547544,
		3433638243,
		2581715763,
		2787789398,
		1060185593,
		1593081372,
		2418618748,
		4260947970,
		69676912,
		2159744348,
		86519011,
		2512459080,
		3838209314,
		1220612927,
		3339683548,
		133810670,
		1090789135,
		1078426020,
		1569222167,
		845107691,
		3583754449,
		4072456591,
		1091646820,
		628848692,
		1613405280,
		3757631651,
		526609435,
		236106946,
		48312990,
		2942717905,
		3402727701,
		1797494240,
		859738849,
		992217954,
		4005476642,
		2243076622,
		3870952857,
		3732016268,
		765654824,
		3490871365,
		2511836413,
		1685915746,
		3888969200,
		1414112111,
		2273134842,
		3281911079,
		4080962846,
		172450625,
		2569994100,
		980381355,
		4109958455,
		2819808352,
		2716589560,
		2568741196,
		3681446669,
		3329971472,
		1835478071,
		660984891,
		3704678404,
		4045999559,
		3422617507,
		3040415634,
		1762651403,
		1719377915,
		3470491036,
		2693910283,
		3642056355,
		3138596744,
		1364962596,
		2073328063,
		1983633131,
		926494387,
		3423689081,
		2150032023,
		4096667949,
		1749200295,
		3328846651,
		309677260,
		2016342300,
		1779581495,
		3079819751,
		111262694,
		1274766160,
		443224088,
		298511866,
		1025883608,
		3806446537,
		1145181785,
		168956806,
		3641502830,
		3584813610,
		1689216846,
		3666258015,
		3200248200,
		1692713982,
		2646376535,
		4042768518,
		1618508792,
		1610833997,
		3523052358,
		4130873264,
		2001055236,
		3610705100,
		2202168115,
		4028541809,
		2961195399,
		1006657119,
		2006996926,
		3186142756,
		1430667929,
		3210227297,
		1314452623,
		4074634658,
		4101304120,
		2273951170,
		1399257539,
		3367210612,
		3027628629,
		1190975929,
		2062231137,
		2333990788,
		2221543033,
		2438960610,
		1181637006,
		548689776,
		2362791313,
		3372408396,
		3104550113,
		3145860560,
		296247880,
		1970579870,
		3078560182,
		3769228297,
		1714227617,
		3291629107,
		3898220290,
		166772364,
		1251581989,
		493813264,
		448347421,
		195405023,
		2709975567,
		677966185,
		3703036547,
		1463355134,
		2715995803,
		1338867538,
		1343315457,
		2802222074,
		2684532164,
		233230375,
		2599980071,
		2000651841,
		3277868038,
		1638401717,
		4028070440,
		3237316320,
		6314154,
		819756386,
		300326615,
		590932579,
		1405279636,
		3267499572,
		3150704214,
		2428286686,
		3959192993,
		3461946742,
		1862657033,
		1266418056,
		963775037,
		2089974820,
		2263052895,
		1917689273,
		448879540,
		3550394620,
		3981727096,
		150775221,
		3627908307,
		1303187396,
		508620638,
		2975983352,
		2726630617,
		1817252668,
		1876281319,
		1457606340,
		908771278,
		3720792119,
		3617206836,
		2455994898,
		1729034894,
		1080033504,
		976866871,
		3556439503,
		2881648439,
		1522871579,
		1555064734,
		1336096578,
		3548522304,
		2579274686,
		3574697629,
		3205460757,
		3593280638,
		3338716283,
		3079412587,
		564236357,
		2993598910,
		1781952180,
		1464380207,
		3163844217,
		3332601554,
		1699332808,
		1393555694,
		1183702653,
		3581086237,
		1288719814,
		691649499,
		2847557200,
		2895455976,
		3193889540,
		2717570544,
		1781354906,
		1676643554,
		2592534050,
		3230253752,
		1126444790,
		2770207658,
		2633158820,
		2210423226,
		2615765581,
		2414155088,
		3127139286,
		673620729,
		2805611233,
		1269405062,
		4015350505,
		3341807571,
		4149409754,
		1057255273,
		2012875353,
		2162469141,
		2276492801,
		2601117357,
		993977747,
		3918593370,
		2654263191,
		753973209,
		36408145,
		2530585658,
		25011837,
		3520020182,
		2088578344,
		530523599,
		2918365339,
		1524020338,
		1518925132,
		3760827505,
		3759777254,
		1202760957,
		3985898139,
		3906192525,
		674977740,
		4174734889,
		2031300136,
		2019492241,
		3983892565,
		4153806404,
		3822280332,
		352677332,
		2297720250,
		60907813,
		90501309,
		3286998549,
		1016092578,
		2535922412,
		2839152426,
		457141659,
		509813237,
		4120667899,
		652014361,
		1966332200,
		2975202805,
		55981186,
		2327461051,
		676427537,
		3255491064,
		2882294119,
		3433927263,
		1307055953,
		942726286,
		933058658,
		2468411793,
		3933900994,
		4215176142,
		1361170020,
		2001714738,
		2830558078,
		3274259782,
		1222529897,
		1679025792,
		2729314320,
		3714953764,
		1770335741,
		151462246,
		3013232138,
		1682292957,
		1483529935,
		471910574,
		1539241949,
		458788160,
		3436315007,
		1807016891,
		3718408830,
		978976581,
		1043663428,
		3165965781,
		1927990952,
		4200891579,
		2372276910,
		3208408903,
		3533431907,
		1412390302,
		2931980059,
		4132332400,
		1947078029,
		3881505623,
		4168226417,
		2941484381,
		1077988104,
		1320477388,
		886195818,
		18198404,
		3786409e3,
		2509781533,
		112762804,
		3463356488,
		1866414978,
		891333506,
		18488651,
		661792760,
		1628790961,
		3885187036,
		3141171499,
		876946877,
		2693282273,
		1372485963,
		791857591,
		2686433993,
		3759982718,
		3167212022,
		3472953795,
		2716379847,
		445679433,
		3561995674,
		3504004811,
		3574258232,
		54117162,
		3331405415,
		2381918588,
		3769707343,
		4154350007,
		1140177722,
		4074052095,
		668550556,
		3214352940,
		367459370,
		261225585,
		2610173221,
		4209349473,
		3468074219,
		3265815641,
		314222801,
		3066103646,
		3808782860,
		282218597,
		3406013506,
		3773591054,
		379116347,
		1285071038,
		846784868,
		2669647154,
		3771962079,
		3550491691,
		2305946142,
		453669953,
		1268987020,
		3317592352,
		3279303384,
		3744833421,
		2610507566,
		3859509063,
		266596637,
		3847019092,
		517658769,
		3462560207,
		3443424879,
		370717030,
		4247526661,
		2224018117,
		4143653529,
		4112773975,
		2788324899,
		2477274417,
		1456262402,
		2901442914,
		1517677493,
		1846949527,
		2295493580,
		3734397586,
		2176403920,
		1280348187,
		1908823572,
		3871786941,
		846861322,
		1172426758,
		3287448474,
		3383383037,
		1655181056,
		3139813346,
		901632758,
		1897031941,
		2986607138,
		3066810236,
		3447102507,
		1393639104,
		373351379,
		950779232,
		625454576,
		3124240540,
		4148612726,
		2007998917,
		544563296,
		2244738638,
		2330496472,
		2058025392,
		1291430526,
		424198748,
		50039436,
		29584100,
		3605783033,
		2429876329,
		2791104160,
		1057563949,
		3255363231,
		3075367218,
		3463963227,
		1469046755,
		985887462
	];
	this.bf_crypt_ciphertext = [
		1332899944,
		1700884034,
		1701343084,
		1684370003,
		1668446532,
		1869963892
	];
	this.base64_code = [
		".",
		"/",
		"A",
		"B",
		"C",
		"D",
		"E",
		"F",
		"G",
		"H",
		"I",
		"J",
		"K",
		"L",
		"M",
		"N",
		"O",
		"P",
		"Q",
		"R",
		"S",
		"T",
		"U",
		"V",
		"W",
		"X",
		"Y",
		"Z",
		"a",
		"b",
		"c",
		"d",
		"e",
		"f",
		"g",
		"h",
		"i",
		"j",
		"k",
		"l",
		"m",
		"n",
		"o",
		"p",
		"q",
		"r",
		"s",
		"t",
		"u",
		"v",
		"w",
		"x",
		"y",
		"z",
		"0",
		"1",
		"2",
		"3",
		"4",
		"5",
		"6",
		"7",
		"8",
		"9"
	];
	this.index_64 = [
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		0,
		1,
		54,
		55,
		56,
		57,
		58,
		59,
		60,
		61,
		62,
		63,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		2,
		3,
		4,
		5,
		6,
		7,
		8,
		9,
		10,
		11,
		12,
		13,
		14,
		15,
		16,
		17,
		18,
		19,
		20,
		21,
		22,
		23,
		24,
		25,
		26,
		27,
		-1,
		-1,
		-1,
		-1,
		-1,
		-1,
		28,
		29,
		30,
		31,
		32,
		33,
		34,
		35,
		36,
		37,
		38,
		39,
		40,
		41,
		42,
		43,
		44,
		45,
		46,
		47,
		48,
		49,
		50,
		51,
		52,
		53,
		-1,
		-1,
		-1,
		-1,
		-1
	];
	this.P;
	this.S;
	this.lr;
	this.offp;
}
bCrypt.prototype.getByte = function(c) {
	var ret = 0;
	try {
		var b = c.charCodeAt(0);
	} catch (err) {
		b = c;
	}
	if (b > 127) return -128 + b % 128;
else return b;
};
bCrypt.prototype.encode_base64 = function(d, len) {
	var off = 0;
	var rs = [];
	var c1;
	var c2;
	if (len <= 0 || len > d.length) throw "Invalid len";
	while (off < len) {
		c1 = d[off++] & 255;
		rs.push(this.base64_code[c1 >> 2 & 63]);
		c1 = (c1 & 3) << 4;
		if (off >= len) {
			rs.push(this.base64_code[c1 & 63]);
			break;
		}
		c2 = d[off++] & 255;
		c1 |= c2 >> 4 & 15;
		rs.push(this.base64_code[c1 & 63]);
		c1 = (c2 & 15) << 2;
		if (off >= len) {
			rs.push(this.base64_code[c1 & 63]);
			break;
		}
		c2 = d[off++] & 255;
		c1 |= c2 >> 6 & 3;
		rs.push(this.base64_code[c1 & 63]);
		rs.push(this.base64_code[c2 & 63]);
	}
	return rs.join("");
};
bCrypt.prototype.char64 = function(x) {
	var code = x.charCodeAt(0);
	if (code < 0 || code > this.index_64.length) return -1;
	return this.index_64[code];
};
bCrypt.prototype.decode_base64 = function(s, maxolen) {
	var off = 0;
	var slen = s.length;
	var olen = 0;
	var rs = [];
	var c1, c2, c3, c4, o;
	if (maxolen <= 0) throw "Invalid maxolen";
	while (off < slen - 1 && olen < maxolen) {
		c1 = this.char64(s.charAt(off++));
		c2 = this.char64(s.charAt(off++));
		if (c1 == -1 || c2 == -1) break;
		o = this.getByte(c1 << 2);
		o |= (c2 & 48) >> 4;
		rs.push(String.fromCharCode(o));
		if (++olen >= maxolen || off >= slen) break;
		c3 = this.char64(s.charAt(off++));
		if (c3 == -1) break;
		o = this.getByte((c2 & 15) << 4);
		o |= (c3 & 60) >> 2;
		rs.push(String.fromCharCode(o));
		if (++olen >= maxolen || off >= slen) break;
		c4 = this.char64(s.charAt(off++));
		o = this.getByte((c3 & 3) << 6);
		o |= c4;
		rs.push(String.fromCharCode(o));
		++olen;
	}
	var ret = [];
	for (off = 0; off < olen; off++) ret.push(this.getByte(rs[off]));
	return ret;
};
bCrypt.prototype.encipher = function(lr, off) {
	var i;
	var n;
	var l = lr[off];
	var r = lr[off + 1];
	l ^= this.P[0];
	for (i = 0; i <= this.BLOWFISH_NUM_ROUNDS - 2;) {
		n = this.S[l >> 24 & 255];
		n += this.S[256 | l >> 16 & 255];
		n ^= this.S[512 | l >> 8 & 255];
		n += this.S[768 | l & 255];
		r ^= n ^ this.P[++i];
		n = this.S[r >> 24 & 255];
		n += this.S[256 | r >> 16 & 255];
		n ^= this.S[512 | r >> 8 & 255];
		n += this.S[768 | r & 255];
		l ^= n ^ this.P[++i];
	}
	lr[off] = r ^ this.P[this.BLOWFISH_NUM_ROUNDS + 1];
	lr[off + 1] = l;
};
bCrypt.prototype.streamtoword = function(data, offp) {
	var i;
	var word = 0;
	var off = offp;
	for (i = 0; i < 4; i++) {
		word = word << 8 | data[off] & 255;
		off = (off + 1) % data.length;
	}
	this.offp = off;
	return word;
};
bCrypt.prototype.init_key = function() {
	this.P = this.P_orig.slice();
	this.S = this.S_orig.slice();
};
bCrypt.prototype.key = function(key) {
	var i;
	this.offp = 0;
	var lr = new Array(0, 0);
	var plen = this.P.length;
	var slen = this.S.length;
	for (i = 0; i < plen; i++) this.P[i] = this.P[i] ^ this.streamtoword(key, this.offp);
	for (i = 0; i < plen; i += 2) {
		this.encipher(lr, 0);
		this.P[i] = lr[0];
		this.P[i + 1] = lr[1];
	}
	for (i = 0; i < slen; i += 2) {
		this.encipher(lr, 0);
		this.S[i] = lr[0];
		this.S[i + 1] = lr[1];
	}
};
bCrypt.prototype.ekskey = function(data, key) {
	var i;
	this.offp = 0;
	var lr = new Array(0, 0);
	var plen = this.P.length;
	var slen = this.S.length;
	for (i = 0; i < plen; i++) this.P[i] = this.P[i] ^ this.streamtoword(key, this.offp);
	this.offp = 0;
	for (i = 0; i < plen; i += 2) {
		lr[0] ^= this.streamtoword(data, this.offp);
		lr[1] ^= this.streamtoword(data, this.offp);
		this.encipher(lr, 0);
		this.P[i] = lr[0];
		this.P[i + 1] = lr[1];
	}
	for (i = 0; i < slen; i += 2) {
		lr[0] ^= this.streamtoword(data, this.offp);
		lr[1] ^= this.streamtoword(data, this.offp);
		this.encipher(lr, 0);
		this.S[i] = lr[0];
		this.S[i + 1] = lr[1];
	}
};
bCrypt.prototype.crypt_raw = function(password, salt, log_rounds) {
	var rounds;
	var j;
	var cdata = this.bf_crypt_ciphertext.slice();
	var clen = cdata.length;
	var one_percent;
	if (log_rounds < 4 || log_rounds > 31) throw "Bad number of rounds";
	if (salt.length != this.BCRYPT_SALT_LEN) throw "Bad _salt length";
	rounds = 1 << log_rounds;
	one_percent = Math.floor(rounds / 100) + 1;
	this.init_key();
	this.ekskey(salt, password);
	var obj = this;
	var i = 0;
	var roundFunction = null;
	roundFunction = function() {
		if (i < rounds) {
			var start = new Date();
			for (; i < rounds;) {
				i = i + 1;
				obj.key(password);
				obj.key(salt);
			}
			return roundFunction();
		} else {
			for (i = 0; i < 64; i++) for (j = 0; j < clen >> 1; j++) obj.encipher(cdata, j << 1);
			var ret = [];
			for (i = 0; i < clen; i++) {
				ret.push(obj.getByte(cdata[i] >> 24 & 255));
				ret.push(obj.getByte(cdata[i] >> 16 & 255));
				ret.push(obj.getByte(cdata[i] >> 8 & 255));
				ret.push(obj.getByte(cdata[i] & 255));
			}
			return ret;
		}
	};
	return roundFunction();
};
var bCrypt_default = bCrypt;

//#endregion
//#region packages/tutanota-crypto/dist/misc/Constants.js
var KeyLength;
(function(KeyLength$1) {
	KeyLength$1["b128"] = "128";
	KeyLength$1["b256"] = "256";
})(KeyLength || (KeyLength = {}));

//#endregion
//#region packages/tutanota-crypto/dist/hashes/Bcrypt.js
const logRounds = 8;
function generateRandomSalt() {
	return random.generateRandomData(16);
}
function generateKeyFromPassphrase(passphrase, salt, keyLengthType) {
	let passphraseBytes = sha256Hash(stringToUtf8Uint8Array(passphrase));
	let bytes = crypt_raw(passphraseBytes, salt, logRounds);
	if (keyLengthType === KeyLength.b128) return uint8ArrayToBitArray(bytes.slice(0, 16));
else return uint8ArrayToBitArray(sha256Hash(bytes));
}
function crypt_raw(passphraseBytes, saltBytes, logRounds$1) {
	try {
		return _signedBytesToUint8Array(new bCrypt_default().crypt_raw(_uint8ArrayToSignedBytes(passphraseBytes), _uint8ArrayToSignedBytes(saltBytes), logRounds$1));
	} catch (e) {
		const error = e;
		throw new CryptoError(error.message, error);
	}
}
/**
* Converts an array of signed byte values (-128 to 127) to an Uint8Array (values 0 to 255).
* @param signedBytes The signed byte values.
* @return The unsigned byte values.
*/
function _signedBytesToUint8Array(signedBytes) {
	return new Uint8Array(new Int8Array(signedBytes));
}
/**
* Converts an uint8Array (value 0 to 255) to an Array with unsigned bytes (-128 to 127).
* @param unsignedBytes The unsigned byte values.
* @return The signed byte values.
*/
function _uint8ArrayToSignedBytes(unsignedBytes) {
	return Array.from(new Uint8Array(new Int8Array(unsignedBytes)));
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/Liboqs/Kyber.js
const KYBER_RAND_AMOUNT_OF_ENTROPY = 64;
const KYBER_ALGORITHM = "Kyber1024";
const KYBER_K = 4;
const KYBER_POLYBYTES = 384;
const KYBER_POLYVECBYTES = KYBER_K * KYBER_POLYBYTES;
const KYBER_SYMBYTES = 32;
const OQS_KEM_kyber_1024_length_public_key = 1568;
const OQS_KEM_kyber_1024_length_secret_key = 3168;
const OQS_KEM_kyber_1024_length_ciphertext = 1568;
const OQS_KEM_kyber_1024_length_shared_secret = 32;
function generateKeyPair(kyberWasm, randomizer) {
	const OQS_KEM = createKem(kyberWasm);
	try {
		fillEntropyPool(kyberWasm, randomizer);
		const publicKey = new Uint8Array(OQS_KEM_kyber_1024_length_public_key);
		const privateKey = new Uint8Array(OQS_KEM_kyber_1024_length_secret_key);
		const result = callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_keypair, kyberWasm, OQS_KEM, mutableSecureFree(publicKey), mutableSecureFree(privateKey));
		if (result != 0) throw new Error(`OQS_KEM_keypair returned ${result}`);
		return {
			publicKey: { raw: publicKey },
			privateKey: { raw: privateKey }
		};
	} finally {
		freeKem(kyberWasm, OQS_KEM);
	}
}
function encapsulate(kyberWasm, publicKey, randomizer) {
	if (publicKey.raw.length != OQS_KEM_kyber_1024_length_public_key) throw new CryptoError(`Invalid public key length; expected ${OQS_KEM_kyber_1024_length_public_key}, got ${publicKey.raw.length}`);
	const OQS_KEM = createKem(kyberWasm);
	try {
		fillEntropyPool(kyberWasm, randomizer);
		const ciphertext = new Uint8Array(OQS_KEM_kyber_1024_length_ciphertext);
		const sharedSecret = new Uint8Array(OQS_KEM_kyber_1024_length_shared_secret);
		const result = callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_encaps, kyberWasm, OQS_KEM, mutableSecureFree(ciphertext), mutableSecureFree(sharedSecret), mutableSecureFree(publicKey.raw));
		if (result != 0) throw new Error(`OQS_KEM_encaps returned ${result}`);
		return {
			ciphertext,
			sharedSecret
		};
	} finally {
		freeKem(kyberWasm, OQS_KEM);
	}
}
function decapsulate(kyberWasm, privateKey, ciphertext) {
	if (privateKey.raw.length != OQS_KEM_kyber_1024_length_secret_key) throw new CryptoError(`Invalid private key length; expected ${OQS_KEM_kyber_1024_length_secret_key}, got ${privateKey.raw.length}`);
	if (ciphertext.length != OQS_KEM_kyber_1024_length_ciphertext) throw new CryptoError(`Invalid ciphertext length; expected ${OQS_KEM_kyber_1024_length_ciphertext}, got ${ciphertext.length}`);
	const OQS_KEM = createKem(kyberWasm);
	try {
		const sharedSecret = new Uint8Array(OQS_KEM_kyber_1024_length_shared_secret);
		const result = callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_decaps, kyberWasm, OQS_KEM, mutableSecureFree(sharedSecret), secureFree(ciphertext), secureFree(privateKey.raw));
		if (result != 0) throw new Error(`OQS_KEM_decaps returned ${result}`);
		return sharedSecret;
	} finally {
		freeKem(kyberWasm, OQS_KEM);
	}
}
function freeKem(kyberWasm, OQS_KEM) {
	callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_free, kyberWasm, OQS_KEM);
}
function createKem(kyberWasm) {
	return callWebAssemblyFunctionWithArguments(kyberWasm.OQS_KEM_new, kyberWasm, KYBER_ALGORITHM);
}
function fillEntropyPool(exports, randomizer) {
	const entropyAmount = randomizer.generateRandomData(KYBER_RAND_AMOUNT_OF_ENTROPY);
	const remaining = callWebAssemblyFunctionWithArguments(exports.TUTA_inject_entropy, exports, entropyAmount, entropyAmount.length);
	if (remaining < 0) console.warn(`tried to copy too much entropy: overflowed with ${-remaining} bytes; fix RAND_AMOUNT_OF_ENTROPY/generateRandomData to silence this`);
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/Liboqs/KyberKeyPair.js
function kyberPrivateKeyToBytes(key) {
	const keyBytes = key.raw;
	const s = keyBytes.slice(0, KYBER_POLYVECBYTES);
	const t$1 = keyBytes.slice(KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES);
	const rho = keyBytes.slice(2 * KYBER_POLYVECBYTES, 2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES);
	const hpk = keyBytes.slice(2 * KYBER_POLYVECBYTES + KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES);
	const nonce = keyBytes.slice(2 * KYBER_POLYVECBYTES + 2 * KYBER_SYMBYTES, 2 * KYBER_POLYVECBYTES + 3 * KYBER_SYMBYTES);
	return byteArraysToBytes([
		s,
		hpk,
		nonce,
		t$1,
		rho
	]);
}
function kyberPublicKeyToBytes(key) {
	const keyBytes = key.raw;
	const t$1 = keyBytes.slice(0, KYBER_POLYVECBYTES);
	const rho = keyBytes.slice(KYBER_POLYVECBYTES, KYBER_POLYVECBYTES + KYBER_SYMBYTES);
	return byteArraysToBytes([t$1, rho]);
}
function bytesToKyberPublicKey(encodedPublicKey) {
	const keyComponents = bytesToByteArrays(encodedPublicKey, 2);
	return { raw: concat(...keyComponents) };
}
function bytesToKyberPrivateKey(encodedPrivateKey) {
	const keyComponents = bytesToByteArrays(encodedPrivateKey, 5);
	const s = keyComponents[0];
	const hpk = keyComponents[1];
	const nonce = keyComponents[2];
	const t$1 = keyComponents[3];
	const rho = keyComponents[4];
	return { raw: concat(s, t$1, rho, hpk, nonce) };
}

//#endregion
//#region packages/tutanota-crypto/dist/hashes/Argon2id/Argon2id.js
const ARGON2ID_ITERATIONS = 4;
const ARGON2ID_MEMORY_IN_KiB = 32768;
const ARGON2ID_PARALLELISM = 1;
const ARGON2ID_KEY_LENGTH = 32;
async function generateKeyFromPassphrase$1(argon2, pass, salt) {
	const hash = await argon2idHashRaw(argon2, ARGON2ID_ITERATIONS, ARGON2ID_MEMORY_IN_KiB, ARGON2ID_PARALLELISM, stringToUtf8Uint8Array(pass), salt, ARGON2ID_KEY_LENGTH);
	return uint8ArrayToBitArray(hash);
}
async function argon2idHashRaw(argon2, timeCost, memoryCost, parallelism, password, salt, hashLength) {
	const hash = new Uint8Array(hashLength);
	const result = callWebAssemblyFunctionWithArguments(argon2.argon2id_hash_raw, argon2, timeCost, memoryCost, parallelism, secureFree(password), password.length, salt, salt.length, mutableSecureFree(hash), hash.length);
	if (result !== 0) throw new Error(`argon2id_hash_raw returned ${result}`);
	return hash;
}

//#endregion
//#region packages/tutanota-crypto/dist/random/SecureRandom.js
var SecureRandom = class {
	/**
	* Only this function is used by jsbn for getting random bytes. Each byte is a value between 0 and 255.
	* @param array An array to fill with random bytes. The length of the array defines the number of bytes to create.
	*/
	nextBytes(array) {
		let bytes = random.generateRandomData(array.length);
		for (let i = 0; i < array.length; i++) array[i] = bytes[i];
	}
};

//#endregion
//#region packages/tutanota-crypto/dist/internal/crypto-jsbn-2012-08-09_1.js
var dbits;
var canary = 0xdeadbeefcafe;
var j_lm = (canary & 16777215) == 15715070;
function BigInteger(a, b, c) {
	if (a != null) if ("number" == typeof a) this.fromNumber(a, b, c);
else if (b == null && "string" != typeof a) this.fromString(a, 256);
else this.fromString(a, b);
}
function nbi() {
	return new BigInteger(null);
}
function am1(i, x, w, j, c, n) {
	while (--n >= 0) {
		var v = x * this[i++] + w[j] + c;
		c = Math.floor(v / 67108864);
		w[j++] = v & 67108863;
	}
	return c;
}
function am2(i, x, w, j, c, n) {
	var xl = x & 32767, xh = x >> 15;
	while (--n >= 0) {
		var l = this[i] & 32767;
		var h = this[i++] >> 15;
		var m = xh * l + h * xl;
		l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
		c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
		w[j++] = l & 1073741823;
	}
	return c;
}
function am3(i, x, w, j, c, n) {
	var xl = x & 16383, xh = x >> 14;
	while (--n >= 0) {
		var l = this[i] & 16383;
		var h = this[i++] >> 14;
		var m = xh * l + h * xl;
		l = xl * l + ((m & 16383) << 14) + w[j] + c;
		c = (l >> 28) + (m >> 14) + xh * h;
		w[j++] = l & 268435455;
	}
	return c;
}
if (j_lm && typeof navigator === "object" && navigator.appName == "Microsoft Internet Explorer") {
	BigInteger.prototype.am = am2;
	dbits = 30;
} else if (j_lm && typeof navigator === "object" && navigator.appName != "Netscape") {
	BigInteger.prototype.am = am1;
	dbits = 26;
} else {
	BigInteger.prototype.am = am3;
	dbits = 28;
}
BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = (1 << dbits) - 1;
BigInteger.prototype.DV = 1 << dbits;
var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2, BI_FP);
BigInteger.prototype.F1 = BI_FP - dbits;
BigInteger.prototype.F2 = 2 * dbits - BI_FP;
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr, vv;
rr = "0".charCodeAt(0);
for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
function int2char(n) {
	return BI_RM.charAt(n);
}
function intAt(s, i) {
	var c = BI_RC[s.charCodeAt(i)];
	return c == null ? -1 : c;
}
function bnpCopyTo(r) {
	for (var i = this.t - 1; i >= 0; --i) r[i] = this[i];
	r.t = this.t;
	r.s = this.s;
}
function bnpFromInt(x) {
	this.t = 1;
	this.s = x < 0 ? -1 : 0;
	if (x > 0) this[0] = x;
else if (x < -1) this[0] = x + DV;
else this.t = 0;
}
function nbv(i) {
	var r = nbi();
	r.fromInt(i);
	return r;
}
function bnpFromString(s, b) {
	var k;
	if (b == 16) k = 4;
else if (b == 8) k = 3;
else if (b == 256) k = 8;
else if (b == 2) k = 1;
else if (b == 32) k = 5;
else if (b == 4) k = 2;
else {
		this.fromRadix(s, b);
		return;
	}
	this.t = 0;
	this.s = 0;
	var i = s.length, mi = false, sh = 0;
	while (--i >= 0) {
		var x = k == 8 ? s[i] & 255 : intAt(s, i);
		if (x < 0) {
			if (s.charAt(i) == "-") mi = true;
			continue;
		}
		mi = false;
		if (sh == 0) this[this.t++] = x;
else if (sh + k > this.DB) {
			this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
			this[this.t++] = x >> this.DB - sh;
		} else this[this.t - 1] |= x << sh;
		sh += k;
		if (sh >= this.DB) sh -= this.DB;
	}
	if (k == 8 && (s[0] & 128) != 0) {
		this.s = -1;
		if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
	}
	this.clamp();
	if (mi) BigInteger.ZERO.subTo(this, this);
}
function bnpClamp() {
	var c = this.s & this.DM;
	while (this.t > 0 && this[this.t - 1] == c) --this.t;
}
function bnToString(b) {
	if (this.s < 0) return "-" + this.negate().toString(b);
	var k;
	if (b == 16) k = 4;
else if (b == 8) k = 3;
else if (b == 2) k = 1;
else if (b == 32) k = 5;
else if (b == 4) k = 2;
else return this.toRadix(b);
	var km = (1 << k) - 1, d, m = false, r = "", i = this.t;
	var p = this.DB - i * this.DB % k;
	if (i-- > 0) {
		if (p < this.DB && (d = this[i] >> p) > 0) {
			m = true;
			r = int2char(d);
		}
		while (i >= 0) {
			if (p < k) {
				d = (this[i] & (1 << p) - 1) << k - p;
				d |= this[--i] >> (p += this.DB - k);
			} else {
				d = this[i] >> (p -= k) & km;
				if (p <= 0) {
					p += this.DB;
					--i;
				}
			}
			if (d > 0) m = true;
			if (m) r += int2char(d);
		}
	}
	return m ? r : "0";
}
function bnNegate() {
	var r = nbi();
	BigInteger.ZERO.subTo(this, r);
	return r;
}
function bnAbs() {
	return this.s < 0 ? this.negate() : this;
}
function bnCompareTo(a) {
	var r = this.s - a.s;
	if (r != 0) return r;
	var i = this.t;
	r = i - a.t;
	if (r != 0) return this.s < 0 ? -r : r;
	while (--i >= 0) if ((r = this[i] - a[i]) != 0) return r;
	return 0;
}
function nbits(x) {
	var r = 1, t$1;
	if ((t$1 = x >>> 16) != 0) {
		x = t$1;
		r += 16;
	}
	if ((t$1 = x >> 8) != 0) {
		x = t$1;
		r += 8;
	}
	if ((t$1 = x >> 4) != 0) {
		x = t$1;
		r += 4;
	}
	if ((t$1 = x >> 2) != 0) {
		x = t$1;
		r += 2;
	}
	if ((t$1 = x >> 1) != 0) {
		x = t$1;
		r += 1;
	}
	return r;
}
function bnBitLength() {
	if (this.t <= 0) return 0;
	return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
}
function bnpDLShiftTo(n, r) {
	var i;
	for (i = this.t - 1; i >= 0; --i) r[i + n] = this[i];
	for (i = n - 1; i >= 0; --i) r[i] = 0;
	r.t = this.t + n;
	r.s = this.s;
}
function bnpDRShiftTo(n, r) {
	for (var i = n; i < this.t; ++i) r[i - n] = this[i];
	r.t = Math.max(this.t - n, 0);
	r.s = this.s;
}
function bnpLShiftTo(n, r) {
	var bs = n % this.DB;
	var cbs = this.DB - bs;
	var bm = (1 << cbs) - 1;
	var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
	for (i = this.t - 1; i >= 0; --i) {
		r[i + ds + 1] = this[i] >> cbs | c;
		c = (this[i] & bm) << bs;
	}
	for (i = ds - 1; i >= 0; --i) r[i] = 0;
	r[ds] = c;
	r.t = this.t + ds + 1;
	r.s = this.s;
	r.clamp();
}
function bnpRShiftTo(n, r) {
	r.s = this.s;
	var ds = Math.floor(n / this.DB);
	if (ds >= this.t) {
		r.t = 0;
		return;
	}
	var bs = n % this.DB;
	var cbs = this.DB - bs;
	var bm = (1 << bs) - 1;
	r[0] = this[ds] >> bs;
	for (var i = ds + 1; i < this.t; ++i) {
		r[i - ds - 1] |= (this[i] & bm) << cbs;
		r[i - ds] = this[i] >> bs;
	}
	if (bs > 0) r[this.t - ds - 1] |= (this.s & bm) << cbs;
	r.t = this.t - ds;
	r.clamp();
}
function bnpSubTo(a, r) {
	var i = 0, c = 0, m = Math.min(a.t, this.t);
	while (i < m) {
		c += this[i] - a[i];
		r[i++] = c & this.DM;
		c >>= this.DB;
	}
	if (a.t < this.t) {
		c -= a.s;
		while (i < this.t) {
			c += this[i];
			r[i++] = c & this.DM;
			c >>= this.DB;
		}
		c += this.s;
	} else {
		c += this.s;
		while (i < a.t) {
			c -= a[i];
			r[i++] = c & this.DM;
			c >>= this.DB;
		}
		c -= a.s;
	}
	r.s = c < 0 ? -1 : 0;
	if (c < -1) r[i++] = this.DV + c;
else if (c > 0) r[i++] = c;
	r.t = i;
	r.clamp();
}
function bnpMultiplyTo(a, r) {
	var x = this.abs(), y = a.abs();
	var i = x.t;
	r.t = i + y.t;
	while (--i >= 0) r[i] = 0;
	for (i = 0; i < y.t; ++i) r[i + x.t] = x.am(0, y[i], r, i, 0, x.t);
	r.s = 0;
	r.clamp();
	if (this.s != a.s) BigInteger.ZERO.subTo(r, r);
}
function bnpSquareTo(r) {
	var x = this.abs();
	var i = r.t = 2 * x.t;
	while (--i >= 0) r[i] = 0;
	for (i = 0; i < x.t - 1; ++i) {
		var c = x.am(i, x[i], r, 2 * i, 0, 1);
		if ((r[i + x.t] += x.am(i + 1, 2 * x[i], r, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
			r[i + x.t] -= x.DV;
			r[i + x.t + 1] = 1;
		}
	}
	if (r.t > 0) r[r.t - 1] += x.am(i, x[i], r, 2 * i, 0, 1);
	r.s = 0;
	r.clamp();
}
function bnpDivRemTo(m, q, r) {
	var pm = m.abs();
	if (pm.t <= 0) return;
	var pt = this.abs();
	if (pt.t < pm.t) {
		if (q != null) q.fromInt(0);
		if (r != null) this.copyTo(r);
		return;
	}
	if (r == null) r = nbi();
	var y = nbi(), ts = this.s, ms = m.s;
	var nsh = this.DB - nbits(pm[pm.t - 1]);
	if (nsh > 0) {
		pm.lShiftTo(nsh, y);
		pt.lShiftTo(nsh, r);
	} else {
		pm.copyTo(y);
		pt.copyTo(r);
	}
	var ys = y.t;
	var y0 = y[ys - 1];
	if (y0 == 0) return;
	var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
	var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
	var i = r.t, j = i - ys, t$1 = q == null ? nbi() : q;
	y.dlShiftTo(j, t$1);
	if (r.compareTo(t$1) >= 0) {
		r[r.t++] = 1;
		r.subTo(t$1, r);
	}
	BigInteger.ONE.dlShiftTo(ys, t$1);
	t$1.subTo(y, y);
	while (y.t < ys) y[y.t++] = 0;
	while (--j >= 0) {
		var qd = r[--i] == y0 ? this.DM : Math.floor(r[i] * d1 + (r[i - 1] + e) * d2);
		if ((r[i] += y.am(0, qd, r, j, 0, ys)) < qd) {
			y.dlShiftTo(j, t$1);
			r.subTo(t$1, r);
			while (r[i] < --qd) r.subTo(t$1, r);
		}
	}
	if (q != null) {
		r.drShiftTo(ys, q);
		if (ts != ms) BigInteger.ZERO.subTo(q, q);
	}
	r.t = ys;
	r.clamp();
	if (nsh > 0) r.rShiftTo(nsh, r);
	if (ts < 0) BigInteger.ZERO.subTo(r, r);
}
function bnMod(a) {
	var r = nbi();
	this.abs().divRemTo(a, null, r);
	if (this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r, r);
	return r;
}
function Classic(m) {
	this.m = m;
}
function cConvert(x) {
	if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
else return x;
}
function cRevert(x) {
	return x;
}
function cReduce(x) {
	x.divRemTo(this.m, null, x);
}
function cMulTo(x, y, r) {
	x.multiplyTo(y, r);
	this.reduce(r);
}
function cSqrTo(x, r) {
	x.squareTo(r);
	this.reduce(r);
}
Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;
function bnpInvDigit() {
	if (this.t < 1) return 0;
	var x = this[0];
	if ((x & 1) == 0) return 0;
	var y = x & 3;
	y = y * (2 - (x & 15) * y) & 15;
	y = y * (2 - (x & 255) * y) & 255;
	y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
	y = y * (2 - x * y % this.DV) % this.DV;
	return y > 0 ? this.DV - y : -y;
}
function Montgomery(m) {
	this.m = m;
	this.mp = m.invDigit();
	this.mpl = this.mp & 32767;
	this.mph = this.mp >> 15;
	this.um = (1 << m.DB - 15) - 1;
	this.mt2 = 2 * m.t;
}
function montConvert(x) {
	var r = nbi();
	x.abs().dlShiftTo(this.m.t, r);
	r.divRemTo(this.m, null, r);
	if (x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r, r);
	return r;
}
function montRevert(x) {
	var r = nbi();
	x.copyTo(r);
	this.reduce(r);
	return r;
}
function montReduce(x) {
	while (x.t <= this.mt2) x[x.t++] = 0;
	for (var i = 0; i < this.m.t; ++i) {
		var j = x[i] & 32767;
		var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
		j = i + this.m.t;
		x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
		while (x[j] >= x.DV) {
			x[j] -= x.DV;
			x[++j]++;
		}
	}
	x.clamp();
	x.drShiftTo(this.m.t, x);
	if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
}
function montSqrTo(x, r) {
	x.squareTo(r);
	this.reduce(r);
}
function montMulTo(x, y, r) {
	x.multiplyTo(y, r);
	this.reduce(r);
}
Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;
function bnpIsEven() {
	return (this.t > 0 ? this[0] & 1 : this.s) == 0;
}
function bnpExp(e, z) {
	if (e > 4294967295 || e < 1) return BigInteger.ONE;
	var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e) - 1;
	g.copyTo(r);
	while (--i >= 0) {
		z.sqrTo(r, r2);
		if ((e & 1 << i) > 0) z.mulTo(r2, g, r);
else {
			var t$1 = r;
			r = r2;
			r2 = t$1;
		}
	}
	return z.revert(r);
}
function bnModPowInt(e, m) {
	var z;
	if (e < 256 || m.isEven()) z = new Classic(m);
else z = new Montgomery(m);
	return this.exp(e, z);
}
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);
function bnClone() {
	var r = nbi();
	this.copyTo(r);
	return r;
}
function bnIntValue() {
	if (this.s < 0) {
		if (this.t == 1) return this[0] - this.DV;
else if (this.t == 0) return -1;
	} else if (this.t == 1) return this[0];
else if (this.t == 0) return 0;
	return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
}
function bnByteValue() {
	return this.t == 0 ? this.s : this[0] << 24 >> 24;
}
function bnShortValue() {
	return this.t == 0 ? this.s : this[0] << 16 >> 16;
}
function bnpChunkSize(r) {
	return Math.floor(Math.LN2 * this.DB / Math.log(r));
}
function bnSigNum() {
	if (this.s < 0) return -1;
else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0;
else return 1;
}
function bnpToRadix(b) {
	if (b == null) b = 10;
	if (this.signum() == 0 || b < 2 || b > 36) return "0";
	var cs = this.chunkSize(b);
	var a = Math.pow(b, cs);
	var d = nbv(a), y = nbi(), z = nbi(), r = "";
	this.divRemTo(d, y, z);
	while (y.signum() > 0) {
		r = (a + z.intValue()).toString(b).substring(1) + r;
		y.divRemTo(d, y, z);
	}
	return z.intValue().toString(b) + r;
}
function bnpFromRadix(s, b) {
	this.fromInt(0);
	if (b == null) b = 10;
	var cs = this.chunkSize(b);
	var d = Math.pow(b, cs), mi = false, j = 0, w = 0;
	for (var i = 0; i < s.length; ++i) {
		var x = intAt(s, i);
		if (x < 0) {
			if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
			continue;
		}
		w = b * w + x;
		if (++j >= cs) {
			this.dMultiply(d);
			this.dAddOffset(w, 0);
			j = 0;
			w = 0;
		}
	}
	if (j > 0) {
		this.dMultiply(Math.pow(b, j));
		this.dAddOffset(w, 0);
	}
	if (mi) BigInteger.ZERO.subTo(this, this);
}
function bnpFromNumber(a, b, c) {
	if ("number" == typeof b) if (a < 2) this.fromInt(1);
else {
		this.fromNumber(a, c);
		if (!this.testBit(a - 1)) this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
		if (this.isEven()) this.dAddOffset(1, 0);
		while (!this.isProbablePrime(b)) {
			this.dAddOffset(2, 0);
			if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
		}
	}
else {
		var x = new Array(), t$1 = a & 7;
		x.length = (a >> 3) + 1;
		b.nextBytes(x);
		if (t$1 > 0) x[0] &= (1 << t$1) - 1;
else x[0] = 0;
		this.fromString(x, 256);
	}
}
function bnToByteArray() {
	var i = this.t, r = new Array();
	r[0] = this.s;
	var p = this.DB - i * this.DB % 8, d, k = 0;
	if (i-- > 0) {
		if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p) r[k++] = d | this.s << this.DB - p;
		while (i >= 0) {
			if (p < 8) {
				d = (this[i] & (1 << p) - 1) << 8 - p;
				d |= this[--i] >> (p += this.DB - 8);
			} else {
				d = this[i] >> (p -= 8) & 255;
				if (p <= 0) {
					p += this.DB;
					--i;
				}
			}
			if ((d & 128) != 0) d |= -256;
			if (k == 0 && (this.s & 128) != (d & 128)) ++k;
			if (k > 0 || d != this.s) r[k++] = d;
		}
	}
	return r;
}
function bnEquals(a) {
	return this.compareTo(a) == 0;
}
function bnMin(a) {
	return this.compareTo(a) < 0 ? this : a;
}
function bnMax(a) {
	return this.compareTo(a) > 0 ? this : a;
}
function bnpBitwiseTo(a, op, r) {
	var i, f, m = Math.min(a.t, this.t);
	for (i = 0; i < m; ++i) r[i] = op(this[i], a[i]);
	if (a.t < this.t) {
		f = a.s & this.DM;
		for (i = m; i < this.t; ++i) r[i] = op(this[i], f);
		r.t = this.t;
	} else {
		f = this.s & this.DM;
		for (i = m; i < a.t; ++i) r[i] = op(f, a[i]);
		r.t = a.t;
	}
	r.s = op(this.s, a.s);
	r.clamp();
}
function op_and(x, y) {
	return x & y;
}
function bnAnd(a) {
	var r = nbi();
	this.bitwiseTo(a, op_and, r);
	return r;
}
function op_or(x, y) {
	return x | y;
}
function bnOr(a) {
	var r = nbi();
	this.bitwiseTo(a, op_or, r);
	return r;
}
function op_xor(x, y) {
	return x ^ y;
}
function bnXor(a) {
	var r = nbi();
	this.bitwiseTo(a, op_xor, r);
	return r;
}
function op_andnot(x, y) {
	return x & ~y;
}
function bnAndNot(a) {
	var r = nbi();
	this.bitwiseTo(a, op_andnot, r);
	return r;
}
function bnNot() {
	var r = nbi();
	for (var i = 0; i < this.t; ++i) r[i] = this.DM & ~this[i];
	r.t = this.t;
	r.s = ~this.s;
	return r;
}
function bnShiftLeft(n) {
	var r = nbi();
	if (n < 0) this.rShiftTo(-n, r);
else this.lShiftTo(n, r);
	return r;
}
function bnShiftRight(n) {
	var r = nbi();
	if (n < 0) this.lShiftTo(-n, r);
else this.rShiftTo(n, r);
	return r;
}
function lbit(x) {
	if (x == 0) return -1;
	var r = 0;
	if ((x & 65535) == 0) {
		x >>= 16;
		r += 16;
	}
	if ((x & 255) == 0) {
		x >>= 8;
		r += 8;
	}
	if ((x & 15) == 0) {
		x >>= 4;
		r += 4;
	}
	if ((x & 3) == 0) {
		x >>= 2;
		r += 2;
	}
	if ((x & 1) == 0) ++r;
	return r;
}
function bnGetLowestSetBit() {
	for (var i = 0; i < this.t; ++i) if (this[i] != 0) return i * this.DB + lbit(this[i]);
	if (this.s < 0) return this.t * this.DB;
	return -1;
}
function cbit(x) {
	var r = 0;
	while (x != 0) {
		x &= x - 1;
		++r;
	}
	return r;
}
function bnBitCount() {
	var r = 0, x = this.s & this.DM;
	for (var i = 0; i < this.t; ++i) r += cbit(this[i] ^ x);
	return r;
}
function bnTestBit(n) {
	var j = Math.floor(n / this.DB);
	if (j >= this.t) return this.s != 0;
	return (this[j] & 1 << n % this.DB) != 0;
}
function bnpChangeBit(n, op) {
	var r = BigInteger.ONE.shiftLeft(n);
	this.bitwiseTo(r, op, r);
	return r;
}
function bnSetBit(n) {
	return this.changeBit(n, op_or);
}
function bnClearBit(n) {
	return this.changeBit(n, op_andnot);
}
function bnFlipBit(n) {
	return this.changeBit(n, op_xor);
}
function bnpAddTo(a, r) {
	var i = 0, c = 0, m = Math.min(a.t, this.t);
	while (i < m) {
		c += this[i] + a[i];
		r[i++] = c & this.DM;
		c >>= this.DB;
	}
	if (a.t < this.t) {
		c += a.s;
		while (i < this.t) {
			c += this[i];
			r[i++] = c & this.DM;
			c >>= this.DB;
		}
		c += this.s;
	} else {
		c += this.s;
		while (i < a.t) {
			c += a[i];
			r[i++] = c & this.DM;
			c >>= this.DB;
		}
		c += a.s;
	}
	r.s = c < 0 ? -1 : 0;
	if (c > 0) r[i++] = c;
else if (c < -1) r[i++] = this.DV + c;
	r.t = i;
	r.clamp();
}
function bnAdd(a) {
	var r = nbi();
	this.addTo(a, r);
	return r;
}
function bnSubtract(a) {
	var r = nbi();
	this.subTo(a, r);
	return r;
}
function bnMultiply(a) {
	var r = nbi();
	this.multiplyTo(a, r);
	return r;
}
function bnSquare() {
	var r = nbi();
	this.squareTo(r);
	return r;
}
function bnDivide(a) {
	var r = nbi();
	this.divRemTo(a, r, null);
	return r;
}
function bnRemainder(a) {
	var r = nbi();
	this.divRemTo(a, null, r);
	return r;
}
function bnDivideAndRemainder(a) {
	var q = nbi(), r = nbi();
	this.divRemTo(a, q, r);
	return new Array(q, r);
}
function bnpDMultiply(n) {
	this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
	++this.t;
	this.clamp();
}
function bnpDAddOffset(n, w) {
	if (n == 0) return;
	while (this.t <= w) this[this.t++] = 0;
	this[w] += n;
	while (this[w] >= this.DV) {
		this[w] -= this.DV;
		if (++w >= this.t) this[this.t++] = 0;
		++this[w];
	}
}
function NullExp() {}
function nNop(x) {
	return x;
}
function nMulTo(x, y, r) {
	x.multiplyTo(y, r);
}
function nSqrTo(x, r) {
	x.squareTo(r);
}
NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;
function bnPow(e) {
	return this.exp(e, new NullExp());
}
function bnpMultiplyLowerTo(a, n, r) {
	var i = Math.min(this.t + a.t, n);
	r.s = 0;
	r.t = i;
	while (i > 0) r[--i] = 0;
	var j;
	for (j = r.t - this.t; i < j; ++i) r[i + this.t] = this.am(0, a[i], r, i, 0, this.t);
	for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r, i, 0, n - i);
	r.clamp();
}
function bnpMultiplyUpperTo(a, n, r) {
	--n;
	var i = r.t = this.t + a.t - n;
	r.s = 0;
	while (--i >= 0) r[i] = 0;
	for (i = Math.max(n - this.t, 0); i < a.t; ++i) r[this.t + i - n] = this.am(n - i, a[i], r, 0, 0, this.t + i - n);
	r.clamp();
	r.drShiftTo(1, r);
}
function Barrett(m) {
	this.r2 = nbi();
	this.q3 = nbi();
	BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
	this.mu = this.r2.divide(m);
	this.m = m;
}
function barrettConvert(x) {
	if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
else if (x.compareTo(this.m) < 0) return x;
else {
		var r = nbi();
		x.copyTo(r);
		this.reduce(r);
		return r;
	}
}
function barrettRevert(x) {
	return x;
}
function barrettReduce(x) {
	x.drShiftTo(this.m.t - 1, this.r2);
	if (x.t > this.m.t + 1) {
		x.t = this.m.t + 1;
		x.clamp();
	}
	this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
	this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
	while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
	x.subTo(this.r2, x);
	while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
}
function barrettSqrTo(x, r) {
	x.squareTo(r);
	this.reduce(r);
}
function barrettMulTo(x, y, r) {
	x.multiplyTo(y, r);
	this.reduce(r);
}
Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;
function bnModPow(e, m) {
	var xHex = this.toString(16);
	var eHex = e.toString(16);
	var mHex = m.toString(16);
	var result = powMod(str2bigInt(xHex, 16), str2bigInt(eHex, 16), str2bigInt(mHex, 16));
	return new BigInteger(bigInt2str(result, 16), 16);
}
function bnGCD(a) {
	var x = this.s < 0 ? this.negate() : this.clone();
	var y = a.s < 0 ? a.negate() : a.clone();
	if (x.compareTo(y) < 0) {
		var t$1 = x;
		x = y;
		y = t$1;
	}
	var i = x.getLowestSetBit(), g = y.getLowestSetBit();
	if (g < 0) return x;
	if (i < g) g = i;
	if (g > 0) {
		x.rShiftTo(g, x);
		y.rShiftTo(g, y);
	}
	while (x.signum() > 0) {
		if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
		if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
		if (x.compareTo(y) >= 0) {
			x.subTo(y, x);
			x.rShiftTo(1, x);
		} else {
			y.subTo(x, y);
			y.rShiftTo(1, y);
		}
	}
	if (g > 0) y.lShiftTo(g, y);
	return y;
}
function bnpModInt(n) {
	if (n <= 0) return 0;
	var d = this.DV % n, r = this.s < 0 ? n - 1 : 0;
	if (this.t > 0) if (d == 0) r = this[0] % n;
else for (var i = this.t - 1; i >= 0; --i) r = (d * r + this[i]) % n;
	return r;
}
function bnModInverse(m) {
	var ac = m.isEven();
	if (this.isEven() && ac || m.signum() == 0) return BigInteger.ZERO;
	var u = m.clone(), v = this.clone();
	var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
	while (u.signum() != 0) {
		while (u.isEven()) {
			u.rShiftTo(1, u);
			if (ac) {
				if (!a.isEven() || !b.isEven()) {
					a.addTo(this, a);
					b.subTo(m, b);
				}
				a.rShiftTo(1, a);
			} else if (!b.isEven()) b.subTo(m, b);
			b.rShiftTo(1, b);
		}
		while (v.isEven()) {
			v.rShiftTo(1, v);
			if (ac) {
				if (!c.isEven() || !d.isEven()) {
					c.addTo(this, c);
					d.subTo(m, d);
				}
				c.rShiftTo(1, c);
			} else if (!d.isEven()) d.subTo(m, d);
			d.rShiftTo(1, d);
		}
		if (u.compareTo(v) >= 0) {
			u.subTo(v, u);
			if (ac) a.subTo(c, a);
			b.subTo(d, b);
		} else {
			v.subTo(u, v);
			if (ac) c.subTo(a, c);
			d.subTo(b, d);
		}
	}
	if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
	if (d.compareTo(m) >= 0) return d.subtract(m);
	if (d.signum() < 0) d.addTo(m, d);
else return d;
	if (d.signum() < 0) return d.add(m);
else return d;
}
var lowprimes = [
	2,
	3,
	5,
	7,
	11,
	13,
	17,
	19,
	23,
	29,
	31,
	37,
	41,
	43,
	47,
	53,
	59,
	61,
	67,
	71,
	73,
	79,
	83,
	89,
	97,
	101,
	103,
	107,
	109,
	113,
	127,
	131,
	137,
	139,
	149,
	151,
	157,
	163,
	167,
	173,
	179,
	181,
	191,
	193,
	197,
	199,
	211,
	223,
	227,
	229,
	233,
	239,
	241,
	251,
	257,
	263,
	269,
	271,
	277,
	281,
	283,
	293,
	307,
	311,
	313,
	317,
	331,
	337,
	347,
	349,
	353,
	359,
	367,
	373,
	379,
	383,
	389,
	397,
	401,
	409,
	419,
	421,
	431,
	433,
	439,
	443,
	449,
	457,
	461,
	463,
	467,
	479,
	487,
	491,
	499,
	503,
	509,
	521,
	523,
	541,
	547,
	557,
	563,
	569,
	571,
	577,
	587,
	593,
	599,
	601,
	607,
	613,
	617,
	619,
	631,
	641,
	643,
	647,
	653,
	659,
	661,
	673,
	677,
	683,
	691,
	701,
	709,
	719,
	727,
	733,
	739,
	743,
	751,
	757,
	761,
	769,
	773,
	787,
	797,
	809,
	811,
	821,
	823,
	827,
	829,
	839,
	853,
	857,
	859,
	863,
	877,
	881,
	883,
	887,
	907,
	911,
	919,
	929,
	937,
	941,
	947,
	953,
	967,
	971,
	977,
	983,
	991,
	997
];
var lplim = 67108864 / lowprimes[lowprimes.length - 1];
function bnIsProbablePrime(t$1) {
	var i, x = this.abs();
	if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
		for (i = 0; i < lowprimes.length; ++i) if (x[0] == lowprimes[i]) return true;
		return false;
	}
	if (x.isEven()) return false;
	i = 1;
	while (i < lowprimes.length) {
		var m = lowprimes[i], j = i + 1;
		while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
		m = x.modInt(m);
		while (i < j) if (m % lowprimes[i++] == 0) return false;
	}
	return x.millerRabin(t$1);
}
function bnpMillerRabin(t$1) {
	var n1 = this.subtract(BigInteger.ONE);
	var k = n1.getLowestSetBit();
	if (k <= 0) return false;
	var r = n1.shiftRight(k);
	t$1 = t$1 + 1 >> 1;
	if (t$1 > lowprimes.length) t$1 = lowprimes.length;
	var a = nbi();
	for (var i = 0; i < t$1; ++i) {
		a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
		var y = a.modPow(r, this);
		if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
			var j = 1;
			while (j++ < k && y.compareTo(n1) != 0) {
				y = y.modPowInt(2, this);
				if (y.compareTo(BigInteger.ONE) == 0) return false;
			}
			if (y.compareTo(n1) != 0) return false;
		}
	}
	return true;
}
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
BigInteger.prototype.square = bnSquare;
function parseBigInt(str, r) {
	return new BigInteger(str, r);
}
function pkcs1pad2(s, n) {
	if (n < s.length + 11) {
		alert("Message too long for RSA");
		return null;
	}
	var ba = new Array();
	var i = s.length - 1;
	while (i >= 0 && n > 0) {
		var c = s.charCodeAt(i--);
		if (c < 128) ba[--n] = c;
else if (c > 127 && c < 2048) {
			ba[--n] = c & 63 | 128;
			ba[--n] = c >> 6 | 192;
		} else {
			ba[--n] = c & 63 | 128;
			ba[--n] = c >> 6 & 63 | 128;
			ba[--n] = c >> 12 | 224;
		}
	}
	ba[--n] = 0;
	var rng = new SecureRandom();
	var x = new Array();
	while (n > 2) {
		x[0] = 0;
		while (x[0] == 0) rng.nextBytes(x);
		ba[--n] = x[0];
	}
	ba[--n] = 2;
	ba[--n] = 0;
	return new BigInteger(ba);
}
function RSAKey() {
	this.n = null;
	this.e = 0;
	this.d = null;
	this.p = null;
	this.q = null;
	this.dmp1 = null;
	this.dmq1 = null;
	this.coeff = null;
}
function RSASetPublic(N, E) {
	if (N != null && E != null && N.length > 0 && E.length > 0) {
		this.n = parseBigInt(N, 16);
		this.e = parseInt(E, 16);
	} else alert("Invalid RSA public key");
}
function RSADoPublic(x) {
	return x.modPowInt(this.e, this.n);
}
function RSAEncrypt(text) {
	var m = pkcs1pad2(text, this.n.bitLength() + 7 >> 3);
	if (m == null) return null;
	var c = this.doPublic(m);
	if (c == null) return null;
	var h = c.toString(16);
	if ((h.length & 1) == 0) return h;
else return "0" + h;
}
RSAKey.prototype.doPublic = RSADoPublic;
RSAKey.prototype.setPublic = RSASetPublic;
RSAKey.prototype.encrypt = RSAEncrypt;
function pkcs1unpad2(d, n) {
	var b = d.toByteArray();
	var i = 0;
	while (i < b.length && b[i] == 0) ++i;
	if (b.length - i != n - 1 || b[i] != 2) return null;
	++i;
	while (b[i] != 0) if (++i >= b.length) return null;
	var ret = "";
	while (++i < b.length) {
		var c = b[i] & 255;
		if (c < 128) ret += String.fromCharCode(c);
else if (c > 191 && c < 224) {
			ret += String.fromCharCode((c & 31) << 6 | b[i + 1] & 63);
			++i;
		} else {
			ret += String.fromCharCode((c & 15) << 12 | (b[i + 1] & 63) << 6 | b[i + 2] & 63);
			i += 2;
		}
	}
	return ret;
}
function RSASetPrivate(N, E, D) {
	if (N != null && E != null && N.length > 0 && E.length > 0) {
		this.n = parseBigInt(N, 16);
		this.e = parseInt(E, 16);
		this.d = parseBigInt(D, 16);
	} else alert("Invalid RSA private key");
}
function RSASetPrivateEx(N, E, D, P, Q, DP, DQ, C) {
	if (N != null && E != null && N.length > 0 && E.length > 0) {
		this.n = parseBigInt(N, 16);
		this.e = parseInt(E, 16);
		this.d = parseBigInt(D, 16);
		this.p = parseBigInt(P, 16);
		this.q = parseBigInt(Q, 16);
		this.dmp1 = parseBigInt(DP, 16);
		this.dmq1 = parseBigInt(DQ, 16);
		this.coeff = parseBigInt(C, 16);
	} else alert("Invalid RSA private key");
}
function RSAGenerate(B, E) {
	var rng = new SecureRandom();
	var qs = B >> 1;
	this.e = parseInt(E, 16);
	var ee = new BigInteger(E, 16);
	for (;;) {
		for (;;) {
			this.p = new BigInteger(B - qs, 10, rng);
			if (this.p.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0) break;
		}
		for (;;) {
			this.q = new BigInteger(qs, 10, rng);
			if (this.q.subtract(BigInteger.ONE).gcd(ee).compareTo(BigInteger.ONE) == 0) break;
		}
		if (this.p.compareTo(this.q) <= 0) {
			var t$1 = this.p;
			this.p = this.q;
			this.q = t$1;
		}
		var p1 = this.p.subtract(BigInteger.ONE);
		var q1 = this.q.subtract(BigInteger.ONE);
		var phi = p1.multiply(q1);
		if (phi.gcd(ee).compareTo(BigInteger.ONE) == 0) {
			this.n = this.p.multiply(this.q);
			this.d = ee.modInverse(phi);
			this.dmp1 = this.d.mod(p1);
			this.dmq1 = this.d.mod(q1);
			this.coeff = this.q.modInverse(this.p);
			break;
		}
	}
}
function RSADoPrivate(x) {
	if (this.p == null || this.q == null) return x.modPow(this.d, this.n);
	var xp = x.mod(this.p).modPow(this.dmp1, this.p);
	var xq = x.mod(this.q).modPow(this.dmq1, this.q);
	while (xp.compareTo(xq) < 0) xp = xp.add(this.p);
	return xp.subtract(xq).multiply(this.coeff).mod(this.p).multiply(this.q).add(xq);
}
function RSADecrypt(ctext) {
	var c = parseBigInt(ctext, 16);
	var m = this.doPrivate(c);
	if (m == null) return null;
	return pkcs1unpad2(m, this.n.bitLength() + 7 >> 3);
}
RSAKey.prototype.doPrivate = RSADoPrivate;
RSAKey.prototype.setPrivate = RSASetPrivate;
RSAKey.prototype.setPrivateEx = RSASetPrivateEx;
RSAKey.prototype.generate = RSAGenerate;
RSAKey.prototype.decrypt = RSADecrypt;
var bpe = 0;
var mask = 0;
var radix = mask + 1;
const digitsStr = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_=!@#$%^&*()[]{}|;:,.<>/?`~ \\'\"+-";
for (bpe = 0; 1 << bpe + 1 > 1 << bpe; bpe++);
bpe >>= 1;
mask = (1 << bpe) - 1;
radix = mask + 1;
const one = int2bigInt(1, 1, 1);
var t = new Array(0);
var s0 = t;
var s3 = t;
var s4 = t;
var s5 = t;
var s6 = t;
var s7 = t;
var sa = t;
function expand(x, n) {
	var ans = int2bigInt(0, (x.length > n ? x.length : n) * bpe, 0);
	copy_(ans, x);
	return ans;
}
function powMod(x, y, n) {
	var ans = expand(x, n.length);
	powMod_(ans, trim(y, 2), trim(n, 2), 0);
	return trim(ans, 1);
}
function inverseModInt(x, n) {
	var a = 1, b = 0, t$1;
	for (;;) {
		if (x == 1) return a;
		if (x == 0) return 0;
		b -= a * Math.floor(n / x);
		n %= x;
		if (n == 1) return b;
		if (n == 0) return 0;
		a -= b * Math.floor(x / n);
		x %= n;
	}
}
function negative(x) {
	return x[x.length - 1] >> bpe - 1 & 1;
}
function greaterShift(x, y, shift) {
	var i, kx = x.length, ky = y.length, k = kx + shift < ky ? kx + shift : ky;
	for (i = ky - 1 - shift; i < kx && i >= 0; i++) if (x[i] > 0) return 1;
	for (i = kx - 1 + shift; i < ky; i++) if (y[i] > 0) return 0;
	for (i = k - 1; i >= shift; i--) if (x[i - shift] > y[i]) return 1;
else if (x[i - shift] < y[i]) return 0;
	return 0;
}
function greater(x, y) {
	var i;
	var k = x.length < y.length ? x.length : y.length;
	for (i = x.length; i < y.length; i++) if (y[i]) return 0;
	for (i = y.length; i < x.length; i++) if (x[i]) return 1;
	for (i = k - 1; i >= 0; i--) if (x[i] > y[i]) return 1;
else if (x[i] < y[i]) return 0;
	return 0;
}
function divide_(x, y, q, r) {
	var kx, ky;
	var i, j, y1, y2, c, a, b;
	copy_(r, x);
	for (ky = y.length; y[ky - 1] == 0; ky--);
	b = y[ky - 1];
	for (a = 0; b; a++) b >>= 1;
	a = bpe - a;
	leftShift_(y, a);
	leftShift_(r, a);
	for (kx = r.length; r[kx - 1] == 0 && kx > ky; kx--);
	copyInt_(q, 0);
	while (!greaterShift(y, r, kx - ky)) {
		subShift_(r, y, kx - ky);
		q[kx - ky]++;
	}
	for (i = kx - 1; i >= ky; i--) {
		if (r[i] == y[ky - 1]) q[i - ky] = mask;
else q[i - ky] = Math.floor((r[i] * radix + r[i - 1]) / y[ky - 1]);
		for (;;) {
			y2 = (ky > 1 ? y[ky - 2] : 0) * q[i - ky];
			c = y2 >> bpe;
			y2 = y2 & mask;
			y1 = c + q[i - ky] * y[ky - 1];
			c = y1 >> bpe;
			y1 = y1 & mask;
			if (c == r[i] ? y1 == r[i - 1] ? y2 > (i > 1 ? r[i - 2] : 0) : y1 > r[i - 1] : c > r[i]) q[i - ky]--;
else break;
		}
		linCombShift_(r, y, -q[i - ky], i - ky);
		if (negative(r)) {
			addShift_(r, y, i - ky);
			q[i - ky]--;
		}
	}
	rightShift_(y, a);
	rightShift_(r, a);
}
function modInt(x, n) {
	var i, c = 0;
	for (i = x.length - 1; i >= 0; i--) c = (c * radix + x[i]) % n;
	return c;
}
function int2bigInt(t$1, bits, minSize) {
	var i, k, buff;
	k = Math.ceil(bits / bpe) + 1;
	k = minSize > k ? minSize : k;
	buff = new Array(k);
	copyInt_(buff, t$1);
	return buff;
}
function str2bigInt(s, base, minSize) {
	var d, i, j, x, y, kk;
	var k = s.length;
	if (base == -1) {
		x = new Array(0);
		for (;;) {
			y = new Array(x.length + 1);
			for (i = 0; i < x.length; i++) y[i + 1] = x[i];
			y[0] = parseInt(s, 10);
			x = y;
			d = s.indexOf(",", 0);
			if (d < 1) break;
			s = s.substring(d + 1);
			if (s.length == 0) break;
		}
		if (x.length < minSize) {
			y = new Array(minSize);
			copy_(y, x);
			return y;
		}
		return x;
	}
	x = int2bigInt(0, base * k, 0);
	for (i = 0; i < k; i++) {
		d = digitsStr.indexOf(s.substring(i, i + 1), 0);
		if (base <= 36 && d >= 36) d -= 26;
		if (d >= base || d < 0) break;
		multInt_(x, base);
		addInt_(x, d);
	}
	for (k = x.length; k > 0 && !x[k - 1]; k--);
	k = minSize > k + 1 ? minSize : k + 1;
	y = new Array(k);
	kk = k < x.length ? k : x.length;
	for (i = 0; i < kk; i++) y[i] = x[i];
	for (; i < k; i++) y[i] = 0;
	return y;
}
function equalsInt(x, y) {
	var i;
	if (x[0] != y) return 0;
	for (i = 1; i < x.length; i++) if (x[i]) return 0;
	return 1;
}
function isZero(x) {
	var i;
	for (i = 0; i < x.length; i++) if (x[i]) return 0;
	return 1;
}
function bigInt2str(x, base) {
	var i, t$1, s = "";
	if (s6.length != x.length) s6 = dup(x);
else copy_(s6, x);
	if (base == -1) {
		for (i = x.length - 1; i > 0; i--) s += x[i] + ",";
		s += x[0];
	} else while (!isZero(s6)) {
		t$1 = divInt_(s6, base);
		s = digitsStr.substring(t$1, t$1 + 1) + s;
	}
	if (s.length == 0) s = "0";
	return s;
}
function dup(x) {
	var i, buff;
	buff = new Array(x.length);
	copy_(buff, x);
	return buff;
}
function copy_(x, y) {
	var i;
	var k = x.length < y.length ? x.length : y.length;
	for (i = 0; i < k; i++) x[i] = y[i];
	for (i = k; i < x.length; i++) x[i] = 0;
}
function copyInt_(x, n) {
	var i, c;
	for (c = n, i = 0; i < x.length; i++) {
		x[i] = c & mask;
		c >>= bpe;
	}
}
function addInt_(x, n) {
	var i, k, c, b;
	x[0] += n;
	k = x.length;
	c = 0;
	for (i = 0; i < k; i++) {
		c += x[i];
		b = 0;
		if (c < 0) {
			b = -(c >> bpe);
			c += b * radix;
		}
		x[i] = c & mask;
		c = (c >> bpe) - b;
		if (!c) return;
	}
}
function rightShift_(x, n) {
	var i;
	var k = Math.floor(n / bpe);
	if (k) {
		for (i = 0; i < x.length - k; i++) x[i] = x[i + k];
		for (; i < x.length; i++) x[i] = 0;
		n %= bpe;
	}
	for (i = 0; i < x.length - 1; i++) x[i] = mask & (x[i + 1] << bpe - n | x[i] >> n);
	x[i] >>= n;
}
function leftShift_(x, n) {
	var i;
	var k = Math.floor(n / bpe);
	if (k) {
		for (i = x.length; i >= k; i--) x[i] = x[i - k];
		for (; i >= 0; i--) x[i] = 0;
		n %= bpe;
	}
	if (!n) return;
	for (i = x.length - 1; i > 0; i--) x[i] = mask & (x[i] << n | x[i - 1] >> bpe - n);
	x[i] = mask & x[i] << n;
}
function multInt_(x, n) {
	var i, k, c, b;
	if (!n) return;
	k = x.length;
	c = 0;
	for (i = 0; i < k; i++) {
		c += x[i] * n;
		b = 0;
		if (c < 0) {
			b = -(c >> bpe);
			c += b * radix;
		}
		x[i] = c & mask;
		c = (c >> bpe) - b;
	}
}
function divInt_(x, n) {
	var i, r = 0, s;
	for (i = x.length - 1; i >= 0; i--) {
		s = r * radix + x[i];
		x[i] = Math.floor(s / n);
		r = s % n;
	}
	return r;
}
function linCombShift_(x, y, b, ys) {
	var i, c, k, kk;
	k = x.length < ys + y.length ? x.length : ys + y.length;
	kk = x.length;
	for (c = 0, i = ys; i < k; i++) {
		c += x[i] + b * y[i - ys];
		x[i] = c & mask;
		c >>= bpe;
	}
	for (i = k; c && i < kk; i++) {
		c += x[i];
		x[i] = c & mask;
		c >>= bpe;
	}
}
function addShift_(x, y, ys) {
	var i, c, k, kk;
	k = x.length < ys + y.length ? x.length : ys + y.length;
	kk = x.length;
	for (c = 0, i = ys; i < k; i++) {
		c += x[i] + y[i - ys];
		x[i] = c & mask;
		c >>= bpe;
	}
	for (i = k; c && i < kk; i++) {
		c += x[i];
		x[i] = c & mask;
		c >>= bpe;
	}
}
function subShift_(x, y, ys) {
	var i, c, k, kk;
	k = x.length < ys + y.length ? x.length : ys + y.length;
	kk = x.length;
	for (c = 0, i = ys; i < k; i++) {
		c += x[i] - y[i - ys];
		x[i] = c & mask;
		c >>= bpe;
	}
	for (i = k; c && i < kk; i++) {
		c += x[i];
		x[i] = c & mask;
		c >>= bpe;
	}
}
function sub_(x, y) {
	var i, c, k, kk;
	k = x.length < y.length ? x.length : y.length;
	for (c = 0, i = 0; i < k; i++) {
		c += x[i] - y[i];
		x[i] = c & mask;
		c >>= bpe;
	}
	for (i = k; c && i < x.length; i++) {
		c += x[i];
		x[i] = c & mask;
		c >>= bpe;
	}
}
function mod_(x, n) {
	if (s4.length != x.length) s4 = dup(x);
else copy_(s4, x);
	if (s5.length != x.length) s5 = dup(x);
	divide_(s4, n, s5, x);
}
function multMod_(x, y, n) {
	var i;
	if (s0.length != 2 * x.length) s0 = new Array(2 * x.length);
	copyInt_(s0, 0);
	for (i = 0; i < y.length; i++) if (y[i]) linCombShift_(s0, x, y[i], i);
	mod_(s0, n);
	copy_(x, s0);
}
function squareMod_(x, n) {
	var i, j, d, c, kx, kn, k;
	for (kx = x.length; kx > 0 && !x[kx - 1]; kx--);
	k = kx > n.length ? 2 * kx : 2 * n.length;
	if (s0.length != k) s0 = new Array(k);
	copyInt_(s0, 0);
	for (i = 0; i < kx; i++) {
		c = s0[2 * i] + x[i] * x[i];
		s0[2 * i] = c & mask;
		c >>= bpe;
		for (j = i + 1; j < kx; j++) {
			c = s0[i + j] + 2 * x[i] * x[j] + c;
			s0[i + j] = c & mask;
			c >>= bpe;
		}
		s0[i + kx] = c;
	}
	mod_(s0, n);
	copy_(x, s0);
}
function trim(x, k) {
	var i, y;
	for (i = x.length; i > 0 && !x[i - 1]; i--);
	y = new Array(i + k);
	copy_(y, x);
	return y;
}
function powMod_(x, y, n) {
	var k1, k2, kn, np;
	if (s7.length != n.length) s7 = dup(n);
	if ((n[0] & 1) == 0) {
		copy_(s7, x);
		copyInt_(x, 1);
		while (!equalsInt(y, 0)) {
			if (y[0] & 1) multMod_(x, s7, n);
			divInt_(y, 2);
			squareMod_(s7, n);
		}
		return;
	}
	copyInt_(s7, 0);
	for (kn = n.length; kn > 0 && !n[kn - 1]; kn--);
	np = radix - inverseModInt(modInt(n, radix), radix);
	s7[kn] = 1;
	multMod_(x, s7, n);
	if (s3.length != x.length) s3 = dup(x);
else copy_(s3, x);
	for (k1 = y.length - 1; k1 > 0 & !y[k1]; k1--);
	if (y[k1] == 0) {
		copyInt_(x, 1);
		return;
	}
	for (k2 = 1 << bpe - 1; k2 && !(y[k1] & k2); k2 >>= 1);
	for (;;) {
		k2 >>= 1;
		if (!k2) {
			k1--;
			if (k1 < 0) {
				mont_(x, one, n, np);
				return;
			}
			k2 = 1 << bpe - 1;
		}
		mont_(x, x, n, np);
		if (k2 & y[k1]) mont_(x, s3, n, np);
	}
}
function mont_(x, y, n, np) {
	var i, j, c, ui, t$1, ks;
	var kn = n.length;
	var ky = y.length;
	if (sa.length != kn) sa = new Array(kn);
	copyInt_(sa, 0);
	for (; kn > 0 && n[kn - 1] == 0; kn--);
	for (; ky > 0 && y[ky - 1] == 0; ky--);
	ks = sa.length - 1;
	for (i = 0; i < kn; i++) {
		t$1 = sa[0] + x[i] * y[0];
		ui = (t$1 & mask) * np & mask;
		c = t$1 + ui * n[0] >> bpe;
		t$1 = x[i];
		j = 1;
		for (; j < ky - 4;) {
			c += sa[j] + ui * n[j] + t$1 * y[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j] + t$1 * y[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j] + t$1 * y[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j] + t$1 * y[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j] + t$1 * y[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
		}
		for (; j < ky;) {
			c += sa[j] + ui * n[j] + t$1 * y[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
		}
		for (; j < kn - 4;) {
			c += sa[j] + ui * n[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
			c += sa[j] + ui * n[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
		}
		for (; j < kn;) {
			c += sa[j] + ui * n[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
		}
		for (; j < ks;) {
			c += sa[j];
			sa[j - 1] = c & mask;
			c >>= bpe;
			j++;
		}
		sa[j - 1] = c & mask;
	}
	if (!greater(n, sa)) sub_(sa, n);
	copy_(x, sa);
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/AsymmetricKeyPair.js
var KeyPairType;
(function(KeyPairType$1) {
	KeyPairType$1[KeyPairType$1["RSA"] = 0] = "RSA";
	KeyPairType$1[KeyPairType$1["RSA_AND_ECC"] = 1] = "RSA_AND_ECC";
	KeyPairType$1[KeyPairType$1["TUTA_CRYPT"] = 2] = "TUTA_CRYPT";
})(KeyPairType || (KeyPairType = {}));
function isPqKeyPairs(keyPair) {
	return keyPair.keyPairType === KeyPairType.TUTA_CRYPT;
}
function isRsaOrRsaEccKeyPair(keyPair) {
	return keyPair.keyPairType === KeyPairType.RSA || keyPair.keyPairType === KeyPairType.RSA_AND_ECC;
}
function isRsaEccKeyPair(keyPair) {
	return keyPair.keyPairType === KeyPairType.RSA_AND_ECC;
}
function isPqPublicKey(publicKey) {
	return publicKey.keyPairType === KeyPairType.TUTA_CRYPT;
}
function isRsaPublicKey(publicKey) {
	return publicKey.keyPairType === KeyPairType.RSA;
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/Rsa.js
const RSA_KEY_LENGTH_BITS = 2048;
const RSA_PUBLIC_EXPONENT = 65537;
function rsaEncrypt(publicKey, bytes, seed) {
	const rsa = new RSAKey();
	rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(publicKey.modulus)));
	rsa.e = publicKey.publicExponent;
	const paddedBytes = oaepPad(bytes, publicKey.keyLength, seed);
	const paddedHex = uint8ArrayToHex(paddedBytes);
	const bigInt = parseBigInt(paddedHex, 16);
	let encrypted;
	try {
		encrypted = new Uint8Array(rsa.doPublic(bigInt).toByteArray());
	} catch (e) {
		throw new CryptoError("failed RSA encryption", e);
	}
	return _padAndUnpadLeadingZeros(publicKey.keyLength / 8, encrypted);
}
function rsaDecrypt(privateKey, bytes) {
	try {
		const rsa = new RSAKey();
		rsa.n = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.modulus)));
		rsa.d = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.privateExponent)));
		rsa.p = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeP)));
		rsa.q = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeQ)));
		rsa.dmp1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentP)));
		rsa.dmq1 = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.primeExponentQ)));
		rsa.coeff = new BigInteger(new Int8Array(base64ToUint8Array(privateKey.crtCoefficient)));
		const hex = uint8ArrayToHex(bytes);
		const bigInt = parseBigInt(hex, 16);
		const decrypted = new Uint8Array(rsa.doPrivate(bigInt).toByteArray());
		const paddedDecrypted = _padAndUnpadLeadingZeros(privateKey.keyLength / 8 - 1, decrypted);
		return oaepUnpad(paddedDecrypted, privateKey.keyLength);
	} catch (e) {
		throw new CryptoError("failed RSA decryption", e);
	}
}
function _padAndUnpadLeadingZeros(targetByteLength, byteArray) {
	const result = new Uint8Array(targetByteLength);
	if (byteArray.length > result.length) {
		const lastExtraByte = byteArray[byteArray.length - result.length - 1];
		if (lastExtraByte !== 0) throw new CryptoError(`leading byte is not 0 but ${lastExtraByte}, encrypted length: ${byteArray.length}`);
		byteArray = byteArray.slice(byteArray.length - result.length);
	}
	result.set(byteArray, result.length - byteArray.length);
	return result;
}
function oaepPad(value, keyLength, seed) {
	let hashLength = 32;
	if (seed.length !== hashLength) throw new CryptoError("invalid seed length: " + seed.length + ". expected: " + hashLength + " bytes!");
	if (value.length > keyLength / 8 - hashLength - 1) throw new CryptoError("invalid value length: " + value.length + ". expected: max. " + (keyLength / 8 - hashLength - 1));
	let block = _getPSBlock(value, keyLength);
	let dbMask = mgf1(seed, block.length - hashLength);
	for (let i = hashLength; i < block.length; i++) block[i] ^= dbMask[i - hashLength];
	let seedMask = mgf1(block.slice(hashLength, block.length), hashLength);
	for (let i = 0; i < seedMask.length; i++) block[i] = seed[i] ^ seedMask[i];
	return block;
}
function oaepUnpad(value, keyLength) {
	let hashLength = 32;
	if (value.length !== keyLength / 8 - 1) throw new CryptoError("invalid value length: " + value.length + ". expected: " + (keyLength / 8 - 1) + " bytes!");
	let seedMask = mgf1(value.slice(hashLength, value.length), hashLength);
	let seed = new Uint8Array(hashLength);
	for (let i = 0; i < seedMask.length; i++) seed[i] = value[i] ^ seedMask[i];
	let dbMask = mgf1(seed, value.length - hashLength);
	for (let i = hashLength; i < value.length; i++) value[i] ^= dbMask[i - hashLength];
	let index;
	for (index = 2 * hashLength; index < value.length; index++) if (value[index] === 1) break;
else if (value[index] !== 0 || index === value.length) throw new CryptoError("invalid padding");
	return value.slice(index + 1, value.length);
}
function _getPSBlock(value, keyLength) {
	let hashLength = 32;
	let blockLength = keyLength / 8 - 1;
	let block = new Uint8Array(blockLength);
	let defHash = sha256Hash(new Uint8Array([]));
	let nbrOfZeros = block.length - (1 + value.length);
	for (let i = 0; i < block.length; i++) if (i >= hashLength && i < 2 * hashLength) block[i] = defHash[i - hashLength];
else if (i < nbrOfZeros) block[i] = 0;
else if (i === nbrOfZeros) block[i] = 1;
else block[i] = value[i - nbrOfZeros - 1];
	return block;
}
function mgf1(seed, length) {
	let C = null;
	let counter = 0;
	let T = new Uint8Array(0);
	do {
		C = i2osp(counter);
		T = concat(T, sha256Hash(concat(seed, C)));
	} while (++counter < Math.ceil(length / 32));
	return T.slice(0, length);
}
function i2osp(i) {
	return new Uint8Array([
		i >> 24 & 255,
		i >> 16 & 255,
		i >> 8 & 255,
		i >> 0 & 255
	]);
}
function _arrayToPublicKey(publicKey) {
	return {
		keyPairType: KeyPairType.RSA,
		version: 0,
		keyLength: RSA_KEY_LENGTH_BITS,
		modulus: int8ArrayToBase64(new Int8Array(publicKey[0].toByteArray())),
		publicExponent: RSA_PUBLIC_EXPONENT
	};
}
function _arrayToPrivateKey(privateKey) {
	return {
		version: 0,
		keyLength: RSA_KEY_LENGTH_BITS,
		modulus: int8ArrayToBase64(new Int8Array(privateKey[0].toByteArray())),
		privateExponent: int8ArrayToBase64(new Int8Array(privateKey[1].toByteArray())),
		primeP: int8ArrayToBase64(new Int8Array(privateKey[2].toByteArray())),
		primeQ: int8ArrayToBase64(new Int8Array(privateKey[3].toByteArray())),
		primeExponentP: int8ArrayToBase64(new Int8Array(privateKey[4].toByteArray())),
		primeExponentQ: int8ArrayToBase64(new Int8Array(privateKey[5].toByteArray())),
		crtCoefficient: int8ArrayToBase64(new Int8Array(privateKey[6].toByteArray()))
	};
}
function _hexToKeyArray(hex) {
	try {
		let key = [];
		let pos = 0;
		while (pos < hex.length) {
			let nextParamLen = parseInt(hex.substring(pos, pos + 4), 16);
			pos += 4;
			key.push(parseBigInt(hex.substring(pos, pos + nextParamLen), 16));
			pos += nextParamLen;
		}
		_validateKeyLength(key);
		return key;
	} catch (e) {
		throw new CryptoError("hex to rsa key failed", e);
	}
}
function _validateKeyLength(key) {
	if (key.length !== 1 && key.length !== 7) throw new Error("invalid key params");
	if (key[0].bitLength() < RSA_KEY_LENGTH_BITS - 1 || key[0].bitLength() > RSA_KEY_LENGTH_BITS) throw new Error("invalid key length, expected: around " + RSA_KEY_LENGTH_BITS + ", but was: " + key[0].bitLength());
}
function hexToRsaPrivateKey(privateKeyHex) {
	return _arrayToPrivateKey(_hexToKeyArray(privateKeyHex));
}
function hexToRsaPublicKey(publicKeyHex) {
	return _arrayToPublicKey(_hexToKeyArray(publicKeyHex));
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/KeyEncryption.js
function encryptKey(encryptionKey, keyToBeEncrypted) {
	const keyLength = getKeyLengthBytes(encryptionKey);
	if (keyLength === KEY_LENGTH_BYTES_AES_128) return aesEncrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), fixedIv, false, false).slice(fixedIv.length);
else if (keyLength === KEY_LENGTH_BYTES_AES_256) return aesEncrypt(encryptionKey, bitArrayToUint8Array(keyToBeEncrypted), undefined, false, true);
else throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`);
}
function decryptKey(encryptionKey, keyToBeDecrypted) {
	const keyLength = getKeyLengthBytes(encryptionKey);
	if (keyLength === KEY_LENGTH_BYTES_AES_128) return uint8ArrayToBitArray(aesDecrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false));
else if (keyLength === KEY_LENGTH_BYTES_AES_256) return uint8ArrayToBitArray(aesDecrypt(encryptionKey, keyToBeDecrypted, false));
else throw new Error(`invalid AES key length (must be 128-bit or 256-bit, got ${keyLength} bytes instead)`);
}
function aes256DecryptWithRecoveryKey(encryptionKey, keyToBeDecrypted) {
	if (keyToBeDecrypted.length === KEY_LENGTH_BYTES_AES_128) return uint8ArrayToBitArray(unauthenticatedAesDecrypt(encryptionKey, concat(fixedIv, keyToBeDecrypted), false));
else return decryptKey(encryptionKey, keyToBeDecrypted);
}
function encryptEccKey(encryptionKey, privateKey) {
	return aesEncrypt(encryptionKey, privateKey, undefined, true, true);
}
function encryptKyberKey(encryptionKey, privateKey) {
	return aesEncrypt(encryptionKey, kyberPrivateKeyToBytes(privateKey));
}
function decryptKeyPair(encryptionKey, keyPair) {
	if (keyPair.symEncPrivRsaKey) return decryptRsaOrRsaEccKeyPair(encryptionKey, keyPair);
else return decryptPQKeyPair(encryptionKey, keyPair);
}
function decryptRsaOrRsaEccKeyPair(encryptionKey, keyPair) {
	const publicKey = hexToRsaPublicKey(uint8ArrayToHex(assertNotNull(keyPair.pubRsaKey)));
	const privateKey = hexToRsaPrivateKey(uint8ArrayToHex(aesDecrypt(encryptionKey, keyPair.symEncPrivRsaKey, true)));
	if (keyPair.symEncPrivEccKey) {
		const publicEccKey = assertNotNull(keyPair.pubEccKey);
		const privateEccKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey));
		return {
			keyPairType: KeyPairType.RSA_AND_ECC,
			publicKey,
			privateKey,
			publicEccKey,
			privateEccKey
		};
	} else return {
		keyPairType: KeyPairType.RSA,
		publicKey,
		privateKey
	};
}
function decryptPQKeyPair(encryptionKey, keyPair) {
	const eccPublicKey = assertNotNull(keyPair.pubEccKey, "expected pub ecc key for PQ keypair");
	const eccPrivateKey = aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivEccKey, "expected priv ecc key for PQ keypair"));
	const kyberPublicKey = bytesToKyberPublicKey(assertNotNull(keyPair.pubKyberKey, "expected pub kyber key for PQ keypair"));
	const kyberPrivateKey = bytesToKyberPrivateKey(aesDecrypt(encryptionKey, assertNotNull(keyPair.symEncPrivKyberKey, "expected enc priv kyber key for PQ keypair")));
	return {
		keyPairType: KeyPairType.TUTA_CRYPT,
		eccKeyPair: {
			publicKey: eccPublicKey,
			privateKey: eccPrivateKey
		},
		kyberKeyPair: {
			publicKey: kyberPublicKey,
			privateKey: kyberPrivateKey
		}
	};
}

//#endregion
//#region packages/tutanota-crypto/dist/encryption/PQKeyPairs.js
function pqKeyPairsToPublicKeys(keyPairs) {
	return {
		keyPairType: keyPairs.keyPairType,
		eccPublicKey: keyPairs.eccKeyPair.publicKey,
		kyberPublicKey: keyPairs.kyberKeyPair.publicKey
	};
}

//#endregion
//#region packages/tutanota-crypto/dist/hashes/Sha1.js
const sha1 = new sjcl_default.hash.sha1();

//#endregion
//#region packages/tutanota-crypto/dist/misc/TotpVerifier.js
let DIGITS = 6;
const DIGITS_POWER = [
	1,
	10,
	100,
	1e3,
	1e4,
	1e5,
	1e6,
	1e7,
	1e8
];
const base32 = sjcl_default.codec.base32;
var TotpVerifier = class TotpVerifier {
	_digits;
	constructor(digits = DIGITS) {
		this._digits = digits;
	}
	generateSecret() {
		let key = random.generateRandomData(16);
		let readableKey = TotpVerifier.readableKey(key);
		return {
			key,
			readableKey
		};
	}
	/**
	* This method generates a TOTP value for the given
	* set of parameters.
	*
	* @param time : a value that reflects a time
	* @param key  :  the shared secret. It is generated if it does not exist
	* @return: the key and a numeric String in base 10 that includes truncationDigits digits
	*/
	generateTotp(time, key) {
		let timeHex = time.toString(16);
		while (timeHex.length < 16) timeHex = "0" + timeHex;
		let msg = hexToUint8Array(timeHex);
		let hash = this.hmac_sha(key, msg);
		let offset = hash[hash.length - 1] & 15;
		let binary = (hash[offset] & 127) << 24 | (hash[offset + 1] & 255) << 16 | (hash[offset + 2] & 255) << 8 | hash[offset + 3] & 255;
		let code = binary % DIGITS_POWER[this._digits];
		return code;
	}
	hmac_sha(key, text) {
		let hmac = new sjcl_default.misc.hmac(uint8ArrayToBitArray(key), sjcl_default.hash.sha1);
		return bitArrayToUint8Array(hmac.encrypt(uint8ArrayToBitArray(text)));
	}
	static readableKey(key) {
		return base32.fromBits(uint8ArrayToBitArray(key)).toLowerCase().replace(/(.{4})/g, "$1 ").replace(/=/g, "").trim();
	}
};

//#endregion
//#region packages/tutanota-crypto/dist/hashes/MurmurHash.js
function x86fmix32(h) {
	h ^= h >>> 16;
	h = mul32(h, 2246822507);
	h ^= h >>> 13;
	h = mul32(h, 3266489909);
	h ^= h >>> 16;
	return h;
}
const x86hash32c1 = 3432918353;
const x86hash32c2 = 461845907;
function x86mix32(h, k) {
	k = mul32(k, x86hash32c1);
	k = rol32(k, 15);
	k = mul32(k, x86hash32c2);
	h ^= k;
	h = rol32(h, 13);
	h = mul32(h, 5) + 3864292196;
	return h;
}
function mul32(m, n) {
	return (m & 65535) * n + (((m >>> 16) * n & 65535) << 16);
}
function rol32(n, r) {
	return n << r | n >>> 32 - r;
}
function murmurHash(value) {
	let state = 0;
	const buf = stringToUtf8Uint8Array(value);
	let h1;
	let i;
	let len;
	h1 = state;
	i = 0;
	len = 0;
	const dtv = new DataView(buf.buffer, buf.byteOffset);
	const remainder = (buf.byteLength - i) % 4;
	const bytes = buf.byteLength - i - remainder;
	len += bytes;
	for (; i < bytes; i += 4) h1 = x86mix32(h1, dtv.getUint32(i, true));
	len += remainder;
	let k1 = 0;
	switch (remainder) {
		case 3: k1 ^= buf[i + 2] << 16;
		case 2: k1 ^= buf[i + 1] << 8;
		case 1:
			k1 ^= buf[i];
			k1 = mul32(k1, x86hash32c1);
			k1 = rol32(k1, 15);
			k1 = mul32(k1, x86hash32c2);
			h1 ^= k1;
	}
	h1 ^= len & 4294967295;
	h1 = x86fmix32(h1);
	return h1 >>> 0;
}

//#endregion
//#region packages/tutanota-crypto/dist/hashes/HKDF.js
function hkdf(salt, inputKeyMaterial, info, lengthInBytes) {
	const saltHmac = new sjcl_default.misc.hmac(uint8ArrayToBitArray(salt), sjcl_default.hash.sha256);
	const key = saltHmac.mac(uint8ArrayToBitArray(inputKeyMaterial));
	const hashLen = sjcl_default.bitArray.bitLength(key);
	const loops = Math.ceil(lengthInBytes * 8 / hashLen);
	if (loops > 255) throw new sjcl_default.exception.invalid("key bit length is too large for hkdf");
	const inputKeyMaterialHmac = new sjcl_default.misc.hmac(key, sjcl_default.hash.sha256);
	let curOut = [];
	let ret = [];
	for (let i = 1; i <= loops; i++) {
		inputKeyMaterialHmac.update(curOut);
		inputKeyMaterialHmac.update(uint8ArrayToBitArray(info));
		inputKeyMaterialHmac.update([sjcl_default.bitArray.partial(8, i)]);
		curOut = inputKeyMaterialHmac.digest();
		ret = sjcl_default.bitArray.concat(ret, curOut);
	}
	return bitArrayToUint8Array(sjcl_default.bitArray.clamp(ret, lengthInBytes * 8));
}

//#endregion
export { ENABLE_MAC, IV_BYTE_LENGTH, KEY_LENGTH_BYTES_AES_256, KYBER_RAND_AMOUNT_OF_ENTROPY, KeyLength, KeyPairType, TotpVerifier, aes256DecryptWithRecoveryKey, aes256EncryptSearchIndexEntry, aes256RandomKey, aesDecrypt, aesEncrypt, authenticatedAesDecrypt, base64ToKey, bitArrayToUint8Array, bytesToKyberPublicKey, createAuthVerifier, createAuthVerifierAsBase64Url, decapsulate, decryptKey, decryptKeyPair, eccDecapsulate, eccEncapsulate, encapsulate, encryptEccKey, encryptKey, encryptKyberKey, generateEccKeyPair, generateKeyFromPassphrase$1 as generateKeyFromPassphrase, generateKeyFromPassphrase as generateKeyFromPassphrase$1, generateKeyPair, generateRandomSalt, getKeyLengthBytes, hexToRsaPublicKey, hkdf, isPqKeyPairs, isPqPublicKey, isRsaEccKeyPair, isRsaOrRsaEccKeyPair, isRsaPublicKey, keyToBase64, keyToUint8Array, kyberPublicKeyToBytes, murmurHash, pqKeyPairsToPublicKeys, random, rsaDecrypt, rsaEncrypt, sha256Hash, uint8ArrayToBitArray, uint8ArrayToKey, unauthenticatedAesDecrypt };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGlzdDMtY2h1bmsuanMiLCJuYW1lcyI6WyJ0Iiwic2pjbCIsInNqY2wiLCJzamNsIiwic2pjbCIsIngyNTUxOSIsInNoYTUxMiIsIm1hc2siLCJ0IiwiS2V5TGVuZ3RoIiwibG9nUm91bmRzIiwiYkNyeXB0IiwidCIsImdlbmVyYXRlS2V5RnJvbVBhc3NwaHJhc2UiLCJ0IiwiS2V5UGFpclR5cGUiLCJzamNsIiwic2pjbCIsInNqY2wiXSwic291cmNlcyI6WyIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9pbnRlcm5hbC9zamNsLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvcmFuZG9tL1JhbmRvbWl6ZXIuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9oYXNoZXMvU2hhMjU2LmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvbWlzYy9VdGlscy5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLWNyeXB0by9kaXN0L2hhc2hlcy9TaGE1MTIuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9lbmNyeXB0aW9uL0Flcy5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLWNyeXB0by9kaXN0L2ludGVybmFsL25vYmxlLWN1cnZlcy0xLjMuMC5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLWNyeXB0by9kaXN0L2VuY3J5cHRpb24vRWNjLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvaW50ZXJuYWwvYkNyeXB0LmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvbWlzYy9Db25zdGFudHMuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9oYXNoZXMvQmNyeXB0LmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvZW5jcnlwdGlvbi9MaWJvcXMvS3liZXIuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9lbmNyeXB0aW9uL0xpYm9xcy9LeWJlcktleVBhaXIuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9oYXNoZXMvQXJnb24yaWQvQXJnb24yaWQuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9yYW5kb20vU2VjdXJlUmFuZG9tLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvaW50ZXJuYWwvY3J5cHRvLWpzYm4tMjAxMi0wOC0wOV8xLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvZW5jcnlwdGlvbi9Bc3ltbWV0cmljS2V5UGFpci5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLWNyeXB0by9kaXN0L2VuY3J5cHRpb24vUnNhLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvZW5jcnlwdGlvbi9LZXlFbmNyeXB0aW9uLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvZW5jcnlwdGlvbi9QUUtleVBhaXJzLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvaGFzaGVzL1NoYTEuanMiLCIuLi9wYWNrYWdlcy90dXRhbm90YS1jcnlwdG8vZGlzdC9taXNjL1RvdHBWZXJpZmllci5qcyIsIi4uL3BhY2thZ2VzL3R1dGFub3RhLWNyeXB0by9kaXN0L2hhc2hlcy9NdXJtdXJIYXNoLmpzIiwiLi4vcGFja2FnZXMvdHV0YW5vdGEtY3J5cHRvL2Rpc3QvaGFzaGVzL0hLREYuanMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqIEBmaWxlT3ZlcnZpZXcgSmF2YXNjcmlwdCBjcnlwdG9ncmFwaHkgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQ3J1c2ggdG8gcmVtb3ZlIGNvbW1lbnRzLCBzaG9ydGVuIHZhcmlhYmxlIG5hbWVzIGFuZFxuICogZ2VuZXJhbGx5IHJlZHVjZSB0cmFuc21pc3Npb24gc2l6ZS5cbiAqXG4gKiBAYXV0aG9yIEVtaWx5IFN0YXJrXG4gKiBAYXV0aG9yIE1pa2UgSGFtYnVyZ1xuICogQGF1dGhvciBEYW4gQm9uZWhcbiAqL1xuLy8gRk9SS0VEIGZyb20gU0pDTCAxLjAuN1xuLy8gQ0hBTkdFRCAodHV0YW8uYXJtKVxuLy8gLSBhZGRlZCBvcHRpb24gdG8gbm90IHVzZSBwYWRkaW5nIGluIGVuY3J5cHQvZGVjcnlwdCBpbiBjYmMgbW9kZVxuLy8gQ0hBTkdFRCAodHV0YW8uaXZrKVxuLy8gLSBhZGRlZCBieXRlT2Zmc2V0IGFuZCBieXRlTGVuZ3RoIHRvIGNvZGVjLmFycmF5QnVmZmVyLnRvQml0c1xuLy8gQ29uZmlndXJlZCB3aXRoOiAuL2NvbmZpZ3VyZSAtLXdpdGgtY29kZWNBcnJheUJ1ZmZlciAtLXdpdGgtY2JjIC0td2l0aC1zaGExIC0td2l0aC1zaGE1MTIgLS13aXRoLWNvZGVjQnl0ZXMgLS13aXRob3V0LWNjbSAtLXdpdGhvdXQtb2NiMiAtLXdpdGhvdXQtcGJrZGYyIC0td2l0aG91dC1jb252ZW5pZW5jZSAtLWNvbXByZXNzPW5vbmVcbi8qanNsaW50IGluZGVudDogMiwgYml0d2lzZTogZmFsc2UsIG5vbWVuOiBmYWxzZSwgcGx1c3BsdXM6IGZhbHNlLCB3aGl0ZTogZmFsc2UsIHJlZ2V4cDogZmFsc2UgKi9cbi8qZ2xvYmFsIGRvY3VtZW50LCB3aW5kb3csIGVzY2FwZSwgdW5lc2NhcGUsIG1vZHVsZSwgcmVxdWlyZSwgVWludDMyQXJyYXkgKi9cbi8qKlxuICogVGhlIFN0YW5mb3JkIEphdmFzY3JpcHQgQ3J5cHRvIExpYnJhcnksIHRvcC1sZXZlbCBuYW1lc3BhY2UuXG4gKiBAbmFtZXNwYWNlXG4gKiBAdHlwZSBhbnlcbiAqL1xudmFyIHNqY2wgPSB7XG4gICAgLyoqXG4gICAgICogU3ltbWV0cmljIGNpcGhlcnMuXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGNpcGhlcjoge30sXG4gICAgLyoqXG4gICAgICogSGFzaCBmdW5jdGlvbnMuICBSaWdodCBub3cgb25seSBTSEEyNTYgaXMgaW1wbGVtZW50ZWQuXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGhhc2g6IHt9LFxuICAgIC8qKlxuICAgICAqIEtleSBleGNoYW5nZSBmdW5jdGlvbnMuICBSaWdodCBub3cgb25seSBTUlAgaXMgaW1wbGVtZW50ZWQuXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqL1xuICAgIGtleWV4Y2hhbmdlOiB7fSxcbiAgICAvKipcbiAgICAgKiBDaXBoZXIgbW9kZXMgb2Ygb3BlcmF0aW9uLlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKi9cbiAgICBtb2RlOiB7fSxcbiAgICAvKipcbiAgICAgKiBNaXNjZWxsYW5lb3VzLiAgSE1BQyBhbmQgUEJLREYyLlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKi9cbiAgICBtaXNjOiB7fSxcbiAgICAvKipcbiAgICAgKiBCaXQgYXJyYXkgZW5jb2RlcnMgYW5kIGRlY29kZXJzLlxuICAgICAqIEBuYW1lc3BhY2VcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIFRoZSBtZW1iZXJzIG9mIHRoaXMgbmFtZXNwYWNlIGFyZSBmdW5jdGlvbnMgd2hpY2ggdHJhbnNsYXRlIGJldHdlZW5cbiAgICAgKiBTSkNMJ3MgYml0QXJyYXlzIGFuZCBvdGhlciBvYmplY3RzICh1c3VhbGx5IHN0cmluZ3MpLiAgQmVjYXVzZSBpdFxuICAgICAqIGlzbid0IGFsd2F5cyBjbGVhciB3aGljaCBkaXJlY3Rpb24gaXMgZW5jb2RpbmcgYW5kIHdoaWNoIGlzIGRlY29kaW5nLFxuICAgICAqIHRoZSBtZXRob2QgbmFtZXMgYXJlIFwiZnJvbUJpdHNcIiBhbmQgXCJ0b0JpdHNcIi5cbiAgICAgKi9cbiAgICBjb2RlYzoge30sXG4gICAgLyoqXG4gICAgICogRXhjZXB0aW9ucy5cbiAgICAgKiBAbmFtZXNwYWNlXG4gICAgICovXG4gICAgZXhjZXB0aW9uOiB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaXBoZXJ0ZXh0IGlzIGNvcnJ1cHQuXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKi9cbiAgICAgICAgY29ycnVwdDogZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgICAgIHRoaXMudG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFwiQ09SUlVQVDogXCIgKyB0aGlzLm1lc3NhZ2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgfSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEludmFsaWQgcGFyYW1ldGVyLlxuICAgICAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgICAgICovXG4gICAgICAgIGludmFsaWQ6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIklOVkFMSUQ6IFwiICsgdGhpcy5tZXNzYWdlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBCdWcgb3IgbWlzc2luZyBmZWF0dXJlIGluIFNKQ0wuXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKi9cbiAgICAgICAgYnVnOiBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICAgICAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gXCJCVUc6IFwiICsgdGhpcy5tZXNzYWdlO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgIH0sXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTb21ldGhpbmcgaXNuJ3QgcmVhZHkuXG4gICAgICAgICAqIEBjb25zdHJ1Y3RvclxuICAgICAgICAgKi9cbiAgICAgICAgbm90UmVhZHk6IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICAgICB0aGlzLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBcIk5PVCBSRUFEWTogXCIgKyB0aGlzLm1lc3NhZ2U7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgfSxcbiAgICB9LFxufTtcbi8qKiBAZmlsZU92ZXJ2aWV3IExvdy1sZXZlbCBBRVMgaW1wbGVtZW50YXRpb24uXG4gKlxuICogVGhpcyBmaWxlIGNvbnRhaW5zIGEgbG93LWxldmVsIGltcGxlbWVudGF0aW9uIG9mIEFFUywgb3B0aW1pemVkIGZvclxuICogc2l6ZSBhbmQgZm9yIGVmZmljaWVuY3kgb24gc2V2ZXJhbCBicm93c2Vycy4gIEl0IGlzIGJhc2VkIG9uXG4gKiBPcGVuU1NMJ3MgYWVzX2NvcmUuYywgYSBwdWJsaWMtZG9tYWluIGltcGxlbWVudGF0aW9uIGJ5IFZpbmNlbnRcbiAqIFJpam1lbiwgQW50b29uIEJvc3NlbGFlcnMgYW5kIFBhdWxvIEJhcnJldG8uXG4gKlxuICogQW4gb2xkZXIgdmVyc2lvbiBvZiB0aGlzIGltcGxlbWVudGF0aW9uIGlzIGF2YWlsYWJsZSBpbiB0aGUgcHVibGljXG4gKiBkb21haW4sIGJ1dCB0aGlzIG9uZSBpcyAoYykgRW1pbHkgU3RhcmssIE1pa2UgSGFtYnVyZywgRGFuIEJvbmVoLFxuICogU3RhbmZvcmQgVW5pdmVyc2l0eSAyMDA4LTIwMTAgYW5kIEJTRC1saWNlbnNlZCBmb3IgbGlhYmlsaXR5XG4gKiByZWFzb25zLlxuICpcbiAqIEBhdXRob3IgRW1pbHkgU3RhcmtcbiAqIEBhdXRob3IgTWlrZSBIYW1idXJnXG4gKiBAYXV0aG9yIERhbiBCb25laFxuICovXG4vKipcbiAqIFNjaGVkdWxlIG91dCBhbiBBRVMga2V5IGZvciBib3RoIGVuY3J5cHRpb24gYW5kIGRlY3J5cHRpb24uICBUaGlzXG4gKiBpcyBhIGxvdy1sZXZlbCBjbGFzcy4gIFVzZSBhIGNpcGhlciBtb2RlIHRvIGRvIGJ1bGsgZW5jcnlwdGlvbi5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IGtleSBUaGUga2V5IGFzIGFuIGFycmF5IG9mIDQsIDYgb3IgOCB3b3Jkcy5cbiAqL1xuc2pjbC5jaXBoZXIuYWVzID0gZnVuY3Rpb24gKGtleSkge1xuICAgIGlmICghdGhpcy5fdGFibGVzWzBdWzBdWzBdKSB7XG4gICAgICAgIHRoaXMuX3ByZWNvbXB1dGUoKTtcbiAgICB9XG4gICAgdmFyIGksIGosIHRtcCwgZW5jS2V5LCBkZWNLZXksIHNib3ggPSB0aGlzLl90YWJsZXNbMF1bNF0sIGRlY1RhYmxlID0gdGhpcy5fdGFibGVzWzFdLCBrZXlMZW4gPSBrZXkubGVuZ3RoLCByY29uID0gMTtcbiAgICBpZiAoa2V5TGVuICE9PSA0ICYmIGtleUxlbiAhPT0gNiAmJiBrZXlMZW4gIT09IDgpIHtcbiAgICAgICAgdGhyb3cgbmV3IHNqY2wuZXhjZXB0aW9uLmludmFsaWQoXCJpbnZhbGlkIGFlcyBrZXkgc2l6ZVwiKTtcbiAgICB9XG4gICAgdGhpcy5fa2V5ID0gWyhlbmNLZXkgPSBrZXkuc2xpY2UoMCkpLCAoZGVjS2V5ID0gW10pXTtcbiAgICAvLyBzY2hlZHVsZSBlbmNyeXB0aW9uIGtleXNcbiAgICBmb3IgKGkgPSBrZXlMZW47IGkgPCA0ICoga2V5TGVuICsgMjg7IGkrKykge1xuICAgICAgICB0bXAgPSBlbmNLZXlbaSAtIDFdO1xuICAgICAgICAvLyBhcHBseSBzYm94XG4gICAgICAgIGlmIChpICUga2V5TGVuID09PSAwIHx8IChrZXlMZW4gPT09IDggJiYgaSAlIGtleUxlbiA9PT0gNCkpIHtcbiAgICAgICAgICAgIHRtcCA9IChzYm94W3RtcCA+Pj4gMjRdIDw8IDI0KSBeIChzYm94Wyh0bXAgPj4gMTYpICYgMjU1XSA8PCAxNikgXiAoc2JveFsodG1wID4+IDgpICYgMjU1XSA8PCA4KSBeIHNib3hbdG1wICYgMjU1XTtcbiAgICAgICAgICAgIC8vIHNoaWZ0IHJvd3MgYW5kIGFkZCByY29uXG4gICAgICAgICAgICBpZiAoaSAlIGtleUxlbiA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRtcCA9ICh0bXAgPDwgOCkgXiAodG1wID4+PiAyNCkgXiAocmNvbiA8PCAyNCk7XG4gICAgICAgICAgICAgICAgcmNvbiA9IChyY29uIDw8IDEpIF4gKChyY29uID4+IDcpICogMjgzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbmNLZXlbaV0gPSBlbmNLZXlbaSAtIGtleUxlbl0gXiB0bXA7XG4gICAgfVxuICAgIC8vIHNjaGVkdWxlIGRlY3J5cHRpb24ga2V5c1xuICAgIGZvciAoaiA9IDA7IGk7IGorKywgaS0tKSB7XG4gICAgICAgIHRtcCA9IGVuY0tleVtqICYgMyA/IGkgOiBpIC0gNF07XG4gICAgICAgIGlmIChpIDw9IDQgfHwgaiA8IDQpIHtcbiAgICAgICAgICAgIGRlY0tleVtqXSA9IHRtcDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRlY0tleVtqXSA9XG4gICAgICAgICAgICAgICAgZGVjVGFibGVbMF1bc2JveFt0bXAgPj4+IDI0XV0gXiBkZWNUYWJsZVsxXVtzYm94Wyh0bXAgPj4gMTYpICYgMjU1XV0gXiBkZWNUYWJsZVsyXVtzYm94Wyh0bXAgPj4gOCkgJiAyNTVdXSBeIGRlY1RhYmxlWzNdW3Nib3hbdG1wICYgMjU1XV07XG4gICAgICAgIH1cbiAgICB9XG59O1xuc2pjbC5jaXBoZXIuYWVzLnByb3RvdHlwZSA9IHtcbiAgICAvLyBwdWJsaWNcbiAgICAvKiBTb21ldGhpbmcgbGlrZSB0aGlzIG1pZ2h0IGFwcGVhciBoZXJlIGV2ZW50dWFsbHlcbiAgICAgbmFtZTogXCJBRVNcIixcbiAgICAgYmxvY2tTaXplOiA0LFxuICAgICBrZXlTaXplczogWzQsNiw4XSxcbiAgICAgKi9cbiAgICAvKipcbiAgICAgKiBFbmNyeXB0IGFuIGFycmF5IG9mIDQgYmlnLWVuZGlhbiB3b3Jkcy5cbiAgICAgKiBAcGFyYW0ge0FycmF5fSBkYXRhIFRoZSBwbGFpbnRleHQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBjaXBoZXJ0ZXh0LlxuICAgICAqL1xuICAgIGVuY3J5cHQ6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jcnlwdChkYXRhLCAwKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIERlY3J5cHQgYW4gYXJyYXkgb2YgNCBiaWctZW5kaWFuIHdvcmRzLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgVGhlIGNpcGhlcnRleHQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBwbGFpbnRleHQuXG4gICAgICovXG4gICAgZGVjcnlwdDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2NyeXB0KGRhdGEsIDEpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogVGhlIGV4cGFuZGVkIFMtYm94IGFuZCBpbnZlcnNlIFMtYm94IHRhYmxlcy4gIFRoZXNlIHdpbGwgYmUgY29tcHV0ZWRcbiAgICAgKiBvbiB0aGUgY2xpZW50IHNvIHRoYXQgd2UgZG9uJ3QgaGF2ZSB0byBzZW5kIHRoZW0gZG93biB0aGUgd2lyZS5cbiAgICAgKlxuICAgICAqIFRoZXJlIGFyZSB0d28gdGFibGVzLCBfdGFibGVzWzBdIGlzIGZvciBlbmNyeXB0aW9uIGFuZFxuICAgICAqIF90YWJsZXNbMV0gaXMgZm9yIGRlY3J5cHRpb24uXG4gICAgICpcbiAgICAgKiBUaGUgZmlyc3QgNCBzdWItdGFibGVzIGFyZSB0aGUgZXhwYW5kZWQgUy1ib3ggd2l0aCBNaXhDb2x1bW5zLiAgVGhlXG4gICAgICogbGFzdCAoX3RhYmxlc1swMV1bNF0pIGlzIHRoZSBTLWJveCBpdHNlbGYuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF90YWJsZXM6IFtcbiAgICAgICAgW1tdLCBbXSwgW10sIFtdLCBbXV0sXG4gICAgICAgIFtbXSwgW10sIFtdLCBbXSwgW11dLFxuICAgIF0sXG4gICAgLyoqXG4gICAgICogRXhwYW5kIHRoZSBTLWJveCB0YWJsZXMuXG4gICAgICpcbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9wcmVjb21wdXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBlbmNUYWJsZSA9IHRoaXMuX3RhYmxlc1swXSwgZGVjVGFibGUgPSB0aGlzLl90YWJsZXNbMV0sIHNib3ggPSBlbmNUYWJsZVs0XSwgc2JveEludiA9IGRlY1RhYmxlWzRdLCBpLCB4LCB4SW52LCBkID0gW10sIHRoID0gW10sIHgyLCB4NCwgeDgsIHMsIHRFbmMsIHREZWM7XG4gICAgICAgIC8vIENvbXB1dGUgZG91YmxlIGFuZCB0aGlyZCB0YWJsZXNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gICAgICAgICAgICB0aFsoZFtpXSA9IChpIDw8IDEpIF4gKChpID4+IDcpICogMjgzKSkgXiBpXSA9IGk7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICh4ID0geEludiA9IDA7ICFzYm94W3hdOyB4IF49IHgyIHx8IDEsIHhJbnYgPSB0aFt4SW52XSB8fCAxKSB7XG4gICAgICAgICAgICAvLyBDb21wdXRlIHNib3hcbiAgICAgICAgICAgIHMgPSB4SW52IF4gKHhJbnYgPDwgMSkgXiAoeEludiA8PCAyKSBeICh4SW52IDw8IDMpIF4gKHhJbnYgPDwgNCk7XG4gICAgICAgICAgICBzID0gKHMgPj4gOCkgXiAocyAmIDI1NSkgXiA5OTtcbiAgICAgICAgICAgIHNib3hbeF0gPSBzO1xuICAgICAgICAgICAgc2JveEludltzXSA9IHg7XG4gICAgICAgICAgICAvLyBDb21wdXRlIE1peENvbHVtbnNcbiAgICAgICAgICAgIHg4ID0gZFsoeDQgPSBkWyh4MiA9IGRbeF0pXSldO1xuICAgICAgICAgICAgdERlYyA9ICh4OCAqIDB4MTAxMDEwMSkgXiAoeDQgKiAweDEwMDAxKSBeICh4MiAqIDB4MTAxKSBeICh4ICogMHgxMDEwMTAwKTtcbiAgICAgICAgICAgIHRFbmMgPSAoZFtzXSAqIDB4MTAxKSBeIChzICogMHgxMDEwMTAwKTtcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgICAgICBlbmNUYWJsZVtpXVt4XSA9IHRFbmMgPSAodEVuYyA8PCAyNCkgXiAodEVuYyA+Pj4gOCk7XG4gICAgICAgICAgICAgICAgZGVjVGFibGVbaV1bc10gPSB0RGVjID0gKHREZWMgPDwgMjQpIF4gKHREZWMgPj4+IDgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIENvbXBhY3RpZnkuICBDb25zaWRlcmFibGUgc3BlZWR1cCBvbiBGaXJlZm94LlxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNTsgaSsrKSB7XG4gICAgICAgICAgICBlbmNUYWJsZVtpXSA9IGVuY1RhYmxlW2ldLnNsaWNlKDApO1xuICAgICAgICAgICAgZGVjVGFibGVbaV0gPSBkZWNUYWJsZVtpXS5zbGljZSgwKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogRW5jcnlwdGlvbiBhbmQgZGVjcnlwdGlvbiBjb3JlLlxuICAgICAqIEBwYXJhbSB7QXJyYXl9IGlucHV0IEZvdXIgd29yZHMgdG8gYmUgZW5jcnlwdGVkIG9yIGRlY3J5cHRlZC5cbiAgICAgKiBAcGFyYW0gZGlyIFRoZSBkaXJlY3Rpb24sIDAgZm9yIGVuY3J5cHQgYW5kIDEgZm9yIGRlY3J5cHQuXG4gICAgICogQHJldHVybiB7QXJyYXl9IFRoZSBmb3VyIGVuY3J5cHRlZCBvciBkZWNyeXB0ZWQgd29yZHMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfY3J5cHQ6IGZ1bmN0aW9uIChpbnB1dCwgZGlyKSB7XG4gICAgICAgIGlmIChpbnB1dC5sZW5ndGggIT09IDQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5pbnZhbGlkKFwiaW52YWxpZCBhZXMgYmxvY2sgc2l6ZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIga2V5ID0gdGhpcy5fa2V5W2Rpcl0sIFxuICAgICAgICAvLyBzdGF0ZSB2YXJpYWJsZXMgYSxiLGMsZCBhcmUgbG9hZGVkIHdpdGggcHJlLXdoaXRlbmVkIGRhdGFcbiAgICAgICAgYSA9IGlucHV0WzBdIF4ga2V5WzBdLCBiID0gaW5wdXRbZGlyID8gMyA6IDFdIF4ga2V5WzFdLCBjID0gaW5wdXRbMl0gXiBrZXlbMl0sIGQgPSBpbnB1dFtkaXIgPyAxIDogM10gXiBrZXlbM10sIGEyLCBiMiwgYzIsIG5Jbm5lclJvdW5kcyA9IGtleS5sZW5ndGggLyA0IC0gMiwgaSwga0luZGV4ID0gNCwgb3V0ID0gWzAsIDAsIDAsIDBdLCB0YWJsZSA9IHRoaXMuX3RhYmxlc1tkaXJdLCBcbiAgICAgICAgLy8gbG9hZCB1cCB0aGUgdGFibGVzXG4gICAgICAgIHQwID0gdGFibGVbMF0sIHQxID0gdGFibGVbMV0sIHQyID0gdGFibGVbMl0sIHQzID0gdGFibGVbM10sIHNib3ggPSB0YWJsZVs0XTtcbiAgICAgICAgLy8gSW5uZXIgcm91bmRzLiAgQ3JpYmJlZCBmcm9tIE9wZW5TU0wuXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuSW5uZXJSb3VuZHM7IGkrKykge1xuICAgICAgICAgICAgYTIgPSB0MFthID4+PiAyNF0gXiB0MVsoYiA+PiAxNikgJiAyNTVdIF4gdDJbKGMgPj4gOCkgJiAyNTVdIF4gdDNbZCAmIDI1NV0gXiBrZXlba0luZGV4XTtcbiAgICAgICAgICAgIGIyID0gdDBbYiA+Pj4gMjRdIF4gdDFbKGMgPj4gMTYpICYgMjU1XSBeIHQyWyhkID4+IDgpICYgMjU1XSBeIHQzW2EgJiAyNTVdIF4ga2V5W2tJbmRleCArIDFdO1xuICAgICAgICAgICAgYzIgPSB0MFtjID4+PiAyNF0gXiB0MVsoZCA+PiAxNikgJiAyNTVdIF4gdDJbKGEgPj4gOCkgJiAyNTVdIF4gdDNbYiAmIDI1NV0gXiBrZXlba0luZGV4ICsgMl07XG4gICAgICAgICAgICBkID0gdDBbZCA+Pj4gMjRdIF4gdDFbKGEgPj4gMTYpICYgMjU1XSBeIHQyWyhiID4+IDgpICYgMjU1XSBeIHQzW2MgJiAyNTVdIF4ga2V5W2tJbmRleCArIDNdO1xuICAgICAgICAgICAga0luZGV4ICs9IDQ7XG4gICAgICAgICAgICBhID0gYTI7XG4gICAgICAgICAgICBiID0gYjI7XG4gICAgICAgICAgICBjID0gYzI7XG4gICAgICAgIH1cbiAgICAgICAgLy8gTGFzdCByb3VuZC5cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICAgICAgb3V0W2RpciA/IDMgJiAtaSA6IGldID0gKHNib3hbYSA+Pj4gMjRdIDw8IDI0KSBeIChzYm94WyhiID4+IDE2KSAmIDI1NV0gPDwgMTYpIF4gKHNib3hbKGMgPj4gOCkgJiAyNTVdIDw8IDgpIF4gc2JveFtkICYgMjU1XSBeIGtleVtrSW5kZXgrK107XG4gICAgICAgICAgICBhMiA9IGE7XG4gICAgICAgICAgICBhID0gYjtcbiAgICAgICAgICAgIGIgPSBjO1xuICAgICAgICAgICAgYyA9IGQ7XG4gICAgICAgICAgICBkID0gYTI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9LFxufTtcbi8qKiBAZmlsZU92ZXJ2aWV3IEFycmF5cyBvZiBiaXRzLCBlbmNvZGVkIGFzIGFycmF5cyBvZiBOdW1iZXJzLlxuICpcbiAqIEBhdXRob3IgRW1pbHkgU3RhcmtcbiAqIEBhdXRob3IgTWlrZSBIYW1idXJnXG4gKiBAYXV0aG9yIERhbiBCb25laFxuICovXG4vKipcbiAqIEFycmF5cyBvZiBiaXRzLCBlbmNvZGVkIGFzIGFycmF5cyBvZiBOdW1iZXJzLlxuICogQG5hbWVzcGFjZVxuICogQGRlc2NyaXB0aW9uXG4gKiA8cD5cbiAqIFRoZXNlIG9iamVjdHMgYXJlIHRoZSBjdXJyZW5jeSBhY2NlcHRlZCBieSBTSkNMJ3MgY3J5cHRvIGZ1bmN0aW9ucy5cbiAqIDwvcD5cbiAqXG4gKiA8cD5cbiAqIE1vc3Qgb2Ygb3VyIGNyeXB0byBwcmltaXRpdmVzIG9wZXJhdGUgb24gYXJyYXlzIG9mIDQtYnl0ZSB3b3JkcyBpbnRlcm5hbGx5LFxuICogYnV0IG1hbnkgb2YgdGhlbSBjYW4gdGFrZSBhcmd1bWVudHMgdGhhdCBhcmUgbm90IGEgbXVsdGlwbGUgb2YgNCBieXRlcy5cbiAqIFRoaXMgbGlicmFyeSBlbmNvZGVzIGFycmF5cyBvZiBiaXRzICh3aG9zZSBzaXplIG5lZWQgbm90IGJlIGEgbXVsdGlwbGUgb2YgOFxuICogYml0cykgYXMgYXJyYXlzIG9mIDMyLWJpdCB3b3Jkcy4gIFRoZSBiaXRzIGFyZSBwYWNrZWQsIGJpZy1lbmRpYW4sIGludG8gYW5cbiAqIGFycmF5IG9mIHdvcmRzLCAzMiBiaXRzIGF0IGEgdGltZS4gIFNpbmNlIHRoZSB3b3JkcyBhcmUgZG91YmxlLXByZWNpc2lvblxuICogZmxvYXRpbmcgcG9pbnQgbnVtYmVycywgdGhleSBmaXQgc29tZSBleHRyYSBkYXRhLiAgV2UgdXNlIHRoaXMgKGluIGEgcHJpdmF0ZSxcbiAqIHBvc3NpYmx5LWNoYW5naW5nIG1hbm5lcikgdG8gZW5jb2RlIHRoZSBudW1iZXIgb2YgYml0cyBhY3R1YWxseSAgcHJlc2VudFxuICogaW4gdGhlIGxhc3Qgd29yZCBvZiB0aGUgYXJyYXkuXG4gKiA8L3A+XG4gKlxuICogPHA+XG4gKiBCZWNhdXNlIGJpdHdpc2Ugb3BzIGNsZWFyIHRoaXMgb3V0LW9mLWJhbmQgZGF0YSwgdGhlc2UgYXJyYXlzIGNhbiBiZSBwYXNzZWRcbiAqIHRvIGNpcGhlcnMgbGlrZSBBRVMgd2hpY2ggd2FudCBhcnJheXMgb2Ygd29yZHMuXG4gKiA8L3A+XG4gKi9cbnNqY2wuYml0QXJyYXkgPSB7XG4gICAgLyoqXG4gICAgICogQXJyYXkgc2xpY2VzIGluIHVuaXRzIG9mIGJpdHMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYSBUaGUgYXJyYXkgdG8gc2xpY2UuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGJzdGFydCBUaGUgb2Zmc2V0IHRvIHRoZSBzdGFydCBvZiB0aGUgc2xpY2UsIGluIGJpdHMuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGJlbmQgVGhlIG9mZnNldCB0byB0aGUgZW5kIG9mIHRoZSBzbGljZSwgaW4gYml0cy4gIElmIHRoaXMgaXMgdW5kZWZpbmVkLFxuICAgICAqIHNsaWNlIHVudGlsIHRoZSBlbmQgb2YgdGhlIGFycmF5LlxuICAgICAqIEByZXR1cm4ge2JpdEFycmF5fSBUaGUgcmVxdWVzdGVkIHNsaWNlLlxuICAgICAqL1xuICAgIGJpdFNsaWNlOiBmdW5jdGlvbiAoYSwgYnN0YXJ0LCBiZW5kKSB7XG4gICAgICAgIGEgPSBzamNsLmJpdEFycmF5Ll9zaGlmdFJpZ2h0KGEuc2xpY2UoYnN0YXJ0IC8gMzIpLCAzMiAtIChic3RhcnQgJiAzMSkpLnNsaWNlKDEpO1xuICAgICAgICByZXR1cm4gYmVuZCA9PT0gdW5kZWZpbmVkID8gYSA6IHNqY2wuYml0QXJyYXkuY2xhbXAoYSwgYmVuZCAtIGJzdGFydCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBFeHRyYWN0IGEgbnVtYmVyIHBhY2tlZCBpbnRvIGEgYml0IGFycmF5LlxuICAgICAqIEBwYXJhbSB7Yml0QXJyYXl9IGEgVGhlIGFycmF5IHRvIHNsaWNlLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBic3RhcnQgVGhlIG9mZnNldCB0byB0aGUgc3RhcnQgb2YgdGhlIHNsaWNlLCBpbiBiaXRzLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBibGVuZ3RoIFRoZSBsZW5ndGggb2YgdGhlIG51bWJlciB0byBleHRyYWN0LlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIHJlcXVlc3RlZCBzbGljZS5cbiAgICAgKi9cbiAgICBleHRyYWN0OiBmdW5jdGlvbiAoYSwgYnN0YXJ0LCBibGVuZ3RoKSB7XG4gICAgICAgIC8vIFRPRE86IHRoaXMgTWF0aC5mbG9vciBpcyBub3QgbmVjZXNzYXJ5IGF0IGFsbCwgYnV0IGZvciBzb21lIHJlYXNvblxuICAgICAgICAvLyAgIHNlZW1zIHRvIHN1cHByZXNzIGEgYnVnIGluIHRoZSBDaHJvbWl1bSBKSVQuXG4gICAgICAgIHZhciB4LCBzaCA9IE1hdGguZmxvb3IoKC1ic3RhcnQgLSBibGVuZ3RoKSAmIDMxKTtcbiAgICAgICAgaWYgKCgoYnN0YXJ0ICsgYmxlbmd0aCAtIDEpIF4gYnN0YXJ0KSAmIC0zMikge1xuICAgICAgICAgICAgLy8gaXQgY3Jvc3NlcyBhIGJvdW5kYXJ5XG4gICAgICAgICAgICB4ID0gKGFbKGJzdGFydCAvIDMyKSB8IDBdIDw8ICgzMiAtIHNoKSkgXiAoYVsoYnN0YXJ0IC8gMzIgKyAxKSB8IDBdID4+PiBzaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyB3aXRoaW4gYSBzaW5nbGUgd29yZFxuICAgICAgICAgICAgeCA9IGFbKGJzdGFydCAvIDMyKSB8IDBdID4+PiBzaDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geCAmICgoMSA8PCBibGVuZ3RoKSAtIDEpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ29uY2F0ZW5hdGUgdHdvIGJpdCBhcnJheXMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYTEgVGhlIGZpcnN0IGFycmF5LlxuICAgICAqIEBwYXJhbSB7Yml0QXJyYXl9IGEyIFRoZSBzZWNvbmQgYXJyYXkuXG4gICAgICogQHJldHVybiB7Yml0QXJyYXl9IFRoZSBjb25jYXRlbmF0aW9uIG9mIGExIGFuZCBhMi5cbiAgICAgKi9cbiAgICBjb25jYXQ6IGZ1bmN0aW9uIChhMSwgYTIpIHtcbiAgICAgICAgaWYgKGExLmxlbmd0aCA9PT0gMCB8fCBhMi5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBhMS5jb25jYXQoYTIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBsYXN0ID0gYTFbYTEubGVuZ3RoIC0gMV0sIHNoaWZ0ID0gc2pjbC5iaXRBcnJheS5nZXRQYXJ0aWFsKGxhc3QpO1xuICAgICAgICBpZiAoc2hpZnQgPT09IDMyKSB7XG4gICAgICAgICAgICByZXR1cm4gYTEuY29uY2F0KGEyKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBzamNsLmJpdEFycmF5Ll9zaGlmdFJpZ2h0KGEyLCBzaGlmdCwgbGFzdCB8IDAsIGExLnNsaWNlKDAsIGExLmxlbmd0aCAtIDEpKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogRmluZCB0aGUgbGVuZ3RoIG9mIGFuIGFycmF5IG9mIGJpdHMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYSBUaGUgYXJyYXkuXG4gICAgICogQHJldHVybiB7TnVtYmVyfSBUaGUgbGVuZ3RoIG9mIGEsIGluIGJpdHMuXG4gICAgICovXG4gICAgYml0TGVuZ3RoOiBmdW5jdGlvbiAoYSkge1xuICAgICAgICB2YXIgbCA9IGEubGVuZ3RoLCB4O1xuICAgICAgICBpZiAobCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgeCA9IGFbbCAtIDFdO1xuICAgICAgICByZXR1cm4gKGwgLSAxKSAqIDMyICsgc2pjbC5iaXRBcnJheS5nZXRQYXJ0aWFsKHgpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogVHJ1bmNhdGUgYW4gYXJyYXkuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYSBUaGUgYXJyYXkuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGxlbiBUaGUgbGVuZ3RoIHRvIHRydW5jYXRlIHRvLCBpbiBiaXRzLlxuICAgICAqIEByZXR1cm4ge2JpdEFycmF5fSBBIG5ldyBhcnJheSwgdHJ1bmNhdGVkIHRvIGxlbiBiaXRzLlxuICAgICAqL1xuICAgIGNsYW1wOiBmdW5jdGlvbiAoYSwgbGVuKSB7XG4gICAgICAgIGlmIChhLmxlbmd0aCAqIDMyIDwgbGVuKSB7XG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgfVxuICAgICAgICBhID0gYS5zbGljZSgwLCBNYXRoLmNlaWwobGVuIC8gMzIpKTtcbiAgICAgICAgdmFyIGwgPSBhLmxlbmd0aDtcbiAgICAgICAgbGVuID0gbGVuICYgMzE7XG4gICAgICAgIGlmIChsID4gMCAmJiBsZW4pIHtcbiAgICAgICAgICAgIGFbbCAtIDFdID0gc2pjbC5iaXRBcnJheS5wYXJ0aWFsKGxlbiwgYVtsIC0gMV0gJiAoMHg4MDAwMDAwMCA+PiAobGVuIC0gMSkpLCAxKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIE1ha2UgYSBwYXJ0aWFsIHdvcmQgZm9yIGEgYml0IGFycmF5LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBsZW4gVGhlIG51bWJlciBvZiBiaXRzIGluIHRoZSB3b3JkLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSB4IFRoZSBiaXRzLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbX2VuZD0wXSBQYXNzIDEgaWYgeCBoYXMgYWxyZWFkeSBiZWVuIHNoaWZ0ZWQgdG8gdGhlIGhpZ2ggc2lkZS5cbiAgICAgKiBAcmV0dXJuIHtOdW1iZXJ9IFRoZSBwYXJ0aWFsIHdvcmQuXG4gICAgICovXG4gICAgcGFydGlhbDogZnVuY3Rpb24gKGxlbiwgeCwgX2VuZCkge1xuICAgICAgICBpZiAobGVuID09PSAzMikge1xuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIChfZW5kID8geCB8IDAgOiB4IDw8ICgzMiAtIGxlbikpICsgbGVuICogMHgxMDAwMDAwMDAwMDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIEdldCB0aGUgbnVtYmVyIG9mIGJpdHMgdXNlZCBieSBhIHBhcnRpYWwgd29yZC5cbiAgICAgKiBAcGFyYW0ge051bWJlcn0geCBUaGUgcGFydGlhbCB3b3JkLlxuICAgICAqIEByZXR1cm4ge051bWJlcn0gVGhlIG51bWJlciBvZiBiaXRzIHVzZWQgYnkgdGhlIHBhcnRpYWwgd29yZC5cbiAgICAgKi9cbiAgICBnZXRQYXJ0aWFsOiBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gTWF0aC5yb3VuZCh4IC8gMHgxMDAwMDAwMDAwMCkgfHwgMzI7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDb21wYXJlIHR3byBhcnJheXMgZm9yIGVxdWFsaXR5IGluIGEgcHJlZGljdGFibGUgYW1vdW50IG9mIHRpbWUuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYSBUaGUgZmlyc3QgYXJyYXkuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYiBUaGUgc2Vjb25kIGFycmF5LlxuICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IHRydWUgaWYgYSA9PSBiOyBmYWxzZSBvdGhlcndpc2UuXG4gICAgICovXG4gICAgZXF1YWw6IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIGlmIChzamNsLmJpdEFycmF5LmJpdExlbmd0aChhKSAhPT0gc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoYikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgeCA9IDAsIGk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB4IHw9IGFbaV0gXiBiW2ldO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB4ID09PSAwO1xuICAgIH0sXG4gICAgLyoqIFNoaWZ0IGFuIGFycmF5IHJpZ2h0LlxuICAgICAqIEBwYXJhbSB7Yml0QXJyYXl9IGEgVGhlIGFycmF5IHRvIHNoaWZ0LlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBzaGlmdCBUaGUgbnVtYmVyIG9mIGJpdHMgdG8gc2hpZnQuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFtjYXJyeT0wXSBBIGJ5dGUgdG8gY2FycnkgaW5cbiAgICAgKiBAcGFyYW0ge2JpdEFycmF5fSBbb3V0PVtdXSBBbiBhcnJheSB0byBwcmVwZW5kIHRvIHRoZSBvdXRwdXQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfc2hpZnRSaWdodDogZnVuY3Rpb24gKGEsIHNoaWZ0LCBjYXJyeSwgb3V0KSB7XG4gICAgICAgIHZhciBpLCBsYXN0MiA9IDAsIHNoaWZ0MjtcbiAgICAgICAgaWYgKG91dCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvdXQgPSBbXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKDsgc2hpZnQgPj0gMzI7IHNoaWZ0IC09IDMyKSB7XG4gICAgICAgICAgICBvdXQucHVzaChjYXJyeSk7XG4gICAgICAgICAgICBjYXJyeSA9IDA7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNoaWZ0ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gb3V0LmNvbmNhdChhKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgb3V0LnB1c2goY2FycnkgfCAoYVtpXSA+Pj4gc2hpZnQpKTtcbiAgICAgICAgICAgIGNhcnJ5ID0gYVtpXSA8PCAoMzIgLSBzaGlmdCk7XG4gICAgICAgIH1cbiAgICAgICAgbGFzdDIgPSBhLmxlbmd0aCA/IGFbYS5sZW5ndGggLSAxXSA6IDA7XG4gICAgICAgIHNoaWZ0MiA9IHNqY2wuYml0QXJyYXkuZ2V0UGFydGlhbChsYXN0Mik7XG4gICAgICAgIG91dC5wdXNoKHNqY2wuYml0QXJyYXkucGFydGlhbCgoc2hpZnQgKyBzaGlmdDIpICYgMzEsIHNoaWZ0ICsgc2hpZnQyID4gMzIgPyBjYXJyeSA6IG91dC5wb3AoKSwgMSkpO1xuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0sXG4gICAgLyoqIHhvciBhIGJsb2NrIG9mIDQgd29yZHMgdG9nZXRoZXIuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfeG9yNDogZnVuY3Rpb24gKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIFt4WzBdIF4geVswXSwgeFsxXSBeIHlbMV0sIHhbMl0gXiB5WzJdLCB4WzNdIF4geVszXV07XG4gICAgfSxcbiAgICAvKiogYnl0ZXN3YXAgYSB3b3JkIGFycmF5IGlucGxhY2UuXG4gICAgICogKGRvZXMgbm90IGhhbmRsZSBwYXJ0aWFsIHdvcmRzKVxuICAgICAqIEBwYXJhbSB7c2pjbC5iaXRBcnJheX0gYSB3b3JkIGFycmF5XG4gICAgICogQHJldHVybiB7c2pjbC5iaXRBcnJheX0gYnl0ZXN3YXBwZWQgYXJyYXlcbiAgICAgKi9cbiAgICBieXRlc3dhcE06IGZ1bmN0aW9uIChhKSB7XG4gICAgICAgIHZhciBpLCB2LCBtID0gMHhmZjAwO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYS5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgdiA9IGFbaV07XG4gICAgICAgICAgICBhW2ldID0gKHYgPj4+IDI0KSB8ICgodiA+Pj4gOCkgJiBtKSB8ICgodiAmIG0pIDw8IDgpIHwgKHYgPDwgMjQpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBhO1xuICAgIH0sXG59O1xuLyoqIEBmaWxlT3ZlcnZpZXcgQml0IGFycmF5IGNvZGVjIGltcGxlbWVudGF0aW9ucy5cbiAqXG4gKiBAYXV0aG9yIEVtaWx5IFN0YXJrXG4gKiBAYXV0aG9yIE1pa2UgSGFtYnVyZ1xuICogQGF1dGhvciBEYW4gQm9uZWhcbiAqL1xuLyoqXG4gKiBVVEYtOCBzdHJpbmdzXG4gKiBAbmFtZXNwYWNlXG4gKi9cbnNqY2wuY29kZWMudXRmOFN0cmluZyA9IHtcbiAgICAvKiogQ29udmVydCBmcm9tIGEgYml0QXJyYXkgdG8gYSBVVEYtOCBzdHJpbmcuICovXG4gICAgZnJvbUJpdHM6IGZ1bmN0aW9uIChhcnIpIHtcbiAgICAgICAgdmFyIG91dCA9IFwiXCIsIGJsID0gc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoYXJyKSwgaSwgdG1wO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgYmwgLyA4OyBpKyspIHtcbiAgICAgICAgICAgIGlmICgoaSAmIDMpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgdG1wID0gYXJyW2kgLyA0XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgodG1wID4+PiA4KSA+Pj4gOCkgPj4+IDgpO1xuICAgICAgICAgICAgdG1wIDw8PSA4O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKG91dCkpO1xuICAgIH0sXG4gICAgLyoqIENvbnZlcnQgZnJvbSBhIFVURi04IHN0cmluZyB0byBhIGJpdEFycmF5LiAqL1xuICAgIHRvQml0czogZnVuY3Rpb24gKHN0cikge1xuICAgICAgICBzdHIgPSB1bmVzY2FwZShlbmNvZGVVUklDb21wb25lbnQoc3RyKSk7XG4gICAgICAgIHZhciBvdXQgPSBbXSwgaSwgdG1wID0gMDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdG1wID0gKHRtcCA8PCA4KSB8IHN0ci5jaGFyQ29kZUF0KGkpO1xuICAgICAgICAgICAgaWYgKChpICYgMykgPT09IDMpIHtcbiAgICAgICAgICAgICAgICBvdXQucHVzaCh0bXApO1xuICAgICAgICAgICAgICAgIHRtcCA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGkgJiAzKSB7XG4gICAgICAgICAgICBvdXQucHVzaChzamNsLmJpdEFycmF5LnBhcnRpYWwoOCAqIChpICYgMyksIHRtcCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfSxcbn07XG4vKiogQGZpbGVPdmVydmlldyBCaXQgYXJyYXkgY29kZWMgaW1wbGVtZW50YXRpb25zLlxuICpcbiAqIEBhdXRob3IgRW1pbHkgU3RhcmtcbiAqIEBhdXRob3IgTWlrZSBIYW1idXJnXG4gKiBAYXV0aG9yIERhbiBCb25laFxuICovXG4vKiogQGZpbGVPdmVydmlldyBCaXQgYXJyYXkgY29kZWMgaW1wbGVtZW50YXRpb25zLlxuICpcbiAqIEBhdXRob3IgTmlscyBLZW5uZXdlZ1xuICovXG4vKipcbiAqIEJhc2UzMiBlbmNvZGluZy9kZWNvZGluZ1xuICogQG5hbWVzcGFjZVxuICovXG5zamNsLmNvZGVjLmJhc2UzMiA9IHtcbiAgICAvKiogVGhlIGJhc2UzMiBhbHBoYWJldC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9jaGFyczogXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWjIzNDU2N1wiLFxuICAgIF9oZXhDaGFyczogXCIwMTIzNDU2Nzg5QUJDREVGR0hJSktMTU5PUFFSU1RVVlwiLFxuICAgIC8qIGJpdHMgaW4gYW4gYXJyYXkgKi9cbiAgICBCSVRTOiAzMixcbiAgICAvKiBiYXNlIHRvIGVuY29kZSBhdCAoMl54KSAqL1xuICAgIEJBU0U6IDUsXG4gICAgLyogYml0cyAtIGJhc2UgKi9cbiAgICBSRU1BSU5JTkc6IDI3LFxuICAgIC8qKiBDb252ZXJ0IGZyb20gYSBiaXRBcnJheSB0byBhIGJhc2UzMiBzdHJpbmcuICovXG4gICAgZnJvbUJpdHM6IGZ1bmN0aW9uIChhcnIsIF9ub0VxdWFscywgX2hleCkge1xuICAgICAgICB2YXIgQklUUyA9IHNqY2wuY29kZWMuYmFzZTMyLkJJVFMsIEJBU0UgPSBzamNsLmNvZGVjLmJhc2UzMi5CQVNFLCBSRU1BSU5JTkcgPSBzamNsLmNvZGVjLmJhc2UzMi5SRU1BSU5JTkc7XG4gICAgICAgIHZhciBvdXQgPSBcIlwiLCBpLCBiaXRzID0gMCwgYyA9IHNqY2wuY29kZWMuYmFzZTMyLl9jaGFycywgdGEgPSAwLCBibCA9IHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGFycik7XG4gICAgICAgIGlmIChfaGV4KSB7XG4gICAgICAgICAgICBjID0gc2pjbC5jb2RlYy5iYXNlMzIuX2hleENoYXJzO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IG91dC5sZW5ndGggKiBCQVNFIDwgYmw7KSB7XG4gICAgICAgICAgICBvdXQgKz0gYy5jaGFyQXQoKHRhIF4gKGFycltpXSA+Pj4gYml0cykpID4+PiBSRU1BSU5JTkcpO1xuICAgICAgICAgICAgaWYgKGJpdHMgPCBCQVNFKSB7XG4gICAgICAgICAgICAgICAgdGEgPSBhcnJbaV0gPDwgKEJBU0UgLSBiaXRzKTtcbiAgICAgICAgICAgICAgICBiaXRzICs9IFJFTUFJTklORztcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YSA8PD0gQkFTRTtcbiAgICAgICAgICAgICAgICBiaXRzIC09IEJBU0U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKG91dC5sZW5ndGggJiA3ICYmICFfbm9FcXVhbHMpIHtcbiAgICAgICAgICAgIG91dCArPSBcIj1cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0sXG4gICAgLyoqIENvbnZlcnQgZnJvbSBhIGJhc2UzMiBzdHJpbmcgdG8gYSBiaXRBcnJheSAqL1xuICAgIHRvQml0czogZnVuY3Rpb24gKHN0ciwgX2hleCkge1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFxzfD0vZywgXCJcIikudG9VcHBlckNhc2UoKTtcbiAgICAgICAgdmFyIEJJVFMgPSBzamNsLmNvZGVjLmJhc2UzMi5CSVRTLCBCQVNFID0gc2pjbC5jb2RlYy5iYXNlMzIuQkFTRSwgUkVNQUlOSU5HID0gc2pjbC5jb2RlYy5iYXNlMzIuUkVNQUlOSU5HO1xuICAgICAgICB2YXIgb3V0ID0gW10sIGksIGJpdHMgPSAwLCBjID0gc2pjbC5jb2RlYy5iYXNlMzIuX2NoYXJzLCB0YSA9IDAsIHgsIGZvcm1hdCA9IFwiYmFzZTMyXCI7XG4gICAgICAgIGlmIChfaGV4KSB7XG4gICAgICAgICAgICBjID0gc2pjbC5jb2RlYy5iYXNlMzIuX2hleENoYXJzO1xuICAgICAgICAgICAgZm9ybWF0ID0gXCJiYXNlMzJoZXhcIjtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc3RyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB4ID0gYy5pbmRleE9mKHN0ci5jaGFyQXQoaSkpO1xuICAgICAgICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgICAgICAgICAgLy8gSW52YWxpZCBjaGFyYWN0ZXIsIHRyeSBoZXggZm9ybWF0XG4gICAgICAgICAgICAgICAgaWYgKCFfaGV4KSB7XG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc2pjbC5jb2RlYy5iYXNlMzJoZXgudG9CaXRzKHN0cik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY2F0Y2ggKGUpIHsgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uaW52YWxpZChcInRoaXMgaXNuJ3QgXCIgKyBmb3JtYXQgKyBcIiFcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYml0cyA+IFJFTUFJTklORykge1xuICAgICAgICAgICAgICAgIGJpdHMgLT0gUkVNQUlOSU5HO1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKHRhIF4gKHggPj4+IGJpdHMpKTtcbiAgICAgICAgICAgICAgICB0YSA9IHggPDwgKEJJVFMgLSBiaXRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJpdHMgKz0gQkFTRTtcbiAgICAgICAgICAgICAgICB0YSBePSB4IDw8IChCSVRTIC0gYml0cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGJpdHMgJiA1Nikge1xuICAgICAgICAgICAgb3V0LnB1c2goc2pjbC5iaXRBcnJheS5wYXJ0aWFsKGJpdHMgJiA1NiwgdGEsIDEpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0sXG59O1xuc2pjbC5jb2RlYy5iYXNlMzJoZXggPSB7XG4gICAgZnJvbUJpdHM6IGZ1bmN0aW9uIChhcnIsIF9ub0VxdWFscykge1xuICAgICAgICByZXR1cm4gc2pjbC5jb2RlYy5iYXNlMzIuZnJvbUJpdHMoYXJyLCBfbm9FcXVhbHMsIDEpO1xuICAgIH0sXG4gICAgdG9CaXRzOiBmdW5jdGlvbiAoc3RyKSB7XG4gICAgICAgIHJldHVybiBzamNsLmNvZGVjLmJhc2UzMi50b0JpdHMoc3RyLCAxKTtcbiAgICB9LFxufTtcbi8qKiBAZmlsZU92ZXJ2aWV3IEJpdCBhcnJheSBjb2RlYyBpbXBsZW1lbnRhdGlvbnMuXG4gKlxuICogQGF1dGhvciBFbWlseSBTdGFya1xuICogQGF1dGhvciBNaWtlIEhhbWJ1cmdcbiAqIEBhdXRob3IgRGFuIEJvbmVoXG4gKi9cbi8qKlxuICogQmFzZTY0IGVuY29kaW5nL2RlY29kaW5nXG4gKiBAbmFtZXNwYWNlXG4gKi9cbnNqY2wuY29kZWMuYmFzZTY0ID0ge1xuICAgIC8qKiBUaGUgYmFzZTY0IGFscGhhYmV0LlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2NoYXJzOiBcIkFCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky9cIixcbiAgICAvKiogQ29udmVydCBmcm9tIGEgYml0QXJyYXkgdG8gYSBiYXNlNjQgc3RyaW5nLiAqL1xuICAgIGZyb21CaXRzOiBmdW5jdGlvbiAoYXJyLCBfbm9FcXVhbHMsIF91cmwpIHtcbiAgICAgICAgdmFyIG91dCA9IFwiXCIsIGksIGJpdHMgPSAwLCBjID0gc2pjbC5jb2RlYy5iYXNlNjQuX2NoYXJzLCB0YSA9IDAsIGJsID0gc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoYXJyKTtcbiAgICAgICAgaWYgKF91cmwpIHtcbiAgICAgICAgICAgIGMgPSBjLnN1YnN0cmluZygwLCA2MikgKyBcIi1fXCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgb3V0Lmxlbmd0aCAqIDYgPCBibDspIHtcbiAgICAgICAgICAgIG91dCArPSBjLmNoYXJBdCgodGEgXiAoYXJyW2ldID4+PiBiaXRzKSkgPj4+IDI2KTtcbiAgICAgICAgICAgIGlmIChiaXRzIDwgNikge1xuICAgICAgICAgICAgICAgIHRhID0gYXJyW2ldIDw8ICg2IC0gYml0cyk7XG4gICAgICAgICAgICAgICAgYml0cyArPSAyNjtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB0YSA8PD0gNjtcbiAgICAgICAgICAgICAgICBiaXRzIC09IDY7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKG91dC5sZW5ndGggJiAzICYmICFfbm9FcXVhbHMpIHtcbiAgICAgICAgICAgIG91dCArPSBcIj1cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0O1xuICAgIH0sXG4gICAgLyoqIENvbnZlcnQgZnJvbSBhIGJhc2U2NCBzdHJpbmcgdG8gYSBiaXRBcnJheSAqL1xuICAgIHRvQml0czogZnVuY3Rpb24gKHN0ciwgX3VybCkge1xuICAgICAgICBzdHIgPSBzdHIucmVwbGFjZSgvXFxzfD0vZywgXCJcIik7XG4gICAgICAgIHZhciBvdXQgPSBbXSwgaSwgYml0cyA9IDAsIGMgPSBzamNsLmNvZGVjLmJhc2U2NC5fY2hhcnMsIHRhID0gMCwgeDtcbiAgICAgICAgaWYgKF91cmwpIHtcbiAgICAgICAgICAgIGMgPSBjLnN1YnN0cmluZygwLCA2MikgKyBcIi1fXCI7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgeCA9IGMuaW5kZXhPZihzdHIuY2hhckF0KGkpKTtcbiAgICAgICAgICAgIGlmICh4IDwgMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5pbnZhbGlkKFwidGhpcyBpc24ndCBiYXNlNjQhXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGJpdHMgPiAyNikge1xuICAgICAgICAgICAgICAgIGJpdHMgLT0gMjY7XG4gICAgICAgICAgICAgICAgb3V0LnB1c2godGEgXiAoeCA+Pj4gYml0cykpO1xuICAgICAgICAgICAgICAgIHRhID0geCA8PCAoMzIgLSBiaXRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGJpdHMgKz0gNjtcbiAgICAgICAgICAgICAgICB0YSBePSB4IDw8ICgzMiAtIGJpdHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChiaXRzICYgNTYpIHtcbiAgICAgICAgICAgIG91dC5wdXNoKHNqY2wuYml0QXJyYXkucGFydGlhbChiaXRzICYgNTYsIHRhLCAxKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dDtcbiAgICB9LFxufTtcbi8qKiBAZmlsZU92ZXJ2aWV3IEphdmFzY3JpcHQgU0hBLTI1NiBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBBbiBvbGRlciB2ZXJzaW9uIG9mIHRoaXMgaW1wbGVtZW50YXRpb24gaXMgYXZhaWxhYmxlIGluIHRoZSBwdWJsaWNcbiAqIGRvbWFpbiwgYnV0IHRoaXMgb25lIGlzIChjKSBFbWlseSBTdGFyaywgTWlrZSBIYW1idXJnLCBEYW4gQm9uZWgsXG4gKiBTdGFuZm9yZCBVbml2ZXJzaXR5IDIwMDgtMjAxMCBhbmQgQlNELWxpY2Vuc2VkIGZvciBsaWFiaWxpdHlcbiAqIHJlYXNvbnMuXG4gKlxuICogU3BlY2lhbCB0aGFua3MgdG8gQWxkbyBDb3J0ZXNpIGZvciBwb2ludGluZyBvdXQgc2V2ZXJhbCBidWdzIGluXG4gKiB0aGlzIGNvZGUuXG4gKlxuICogQGF1dGhvciBFbWlseSBTdGFya1xuICogQGF1dGhvciBNaWtlIEhhbWJ1cmdcbiAqIEBhdXRob3IgRGFuIEJvbmVoXG4gKi9cbi8qKlxuICogQ29udGV4dCBmb3IgYSBTSEEtMjU2IG9wZXJhdGlvbiBpbiBwcm9ncmVzcy5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5zamNsLmhhc2guc2hhMjU2ID0gZnVuY3Rpb24gKGhhc2gpIHtcbiAgICBpZiAoIXRoaXMuX2tleVswXSkge1xuICAgICAgICB0aGlzLl9wcmVjb21wdXRlKCk7XG4gICAgfVxuICAgIGlmIChoYXNoKSB7XG4gICAgICAgIHRoaXMuX2ggPSBoYXNoLl9oLnNsaWNlKDApO1xuICAgICAgICB0aGlzLl9idWZmZXIgPSBoYXNoLl9idWZmZXIuc2xpY2UoMCk7XG4gICAgICAgIHRoaXMuX2xlbmd0aCA9IGhhc2guX2xlbmd0aDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG59O1xuLyoqXG4gKiBIYXNoIGEgc3RyaW5nIG9yIGFuIGFycmF5IG9mIHdvcmRzLlxuICogQHN0YXRpY1xuICogQHBhcmFtIHtiaXRBcnJheXxTdHJpbmd9IGRhdGEgdGhlIGRhdGEgdG8gaGFzaC5cbiAqIEByZXR1cm4ge2JpdEFycmF5fSBUaGUgaGFzaCB2YWx1ZSwgYW4gYXJyYXkgb2YgMTYgYmlnLWVuZGlhbiB3b3Jkcy5cbiAqL1xuc2pjbC5oYXNoLnNoYTI1Ni5oYXNoID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICByZXR1cm4gbmV3IHNqY2wuaGFzaC5zaGEyNTYoKS51cGRhdGUoZGF0YSkuZmluYWxpemUoKTtcbn07XG5zamNsLmhhc2guc2hhMjU2LnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgaGFzaCdzIGJsb2NrIHNpemUsIGluIGJpdHMuXG4gICAgICogQGNvbnN0YW50XG4gICAgICovXG4gICAgYmxvY2tTaXplOiA1MTIsXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIGhhc2ggc3RhdGUuXG4gICAgICogQHJldHVybiB0aGlzXG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faCA9IHRoaXMuX2luaXQuc2xpY2UoMCk7XG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIElucHV0IHNldmVyYWwgd29yZHMgdG8gdGhlIGhhc2guXG4gICAgICogQHBhcmFtIHtiaXRBcnJheXxTdHJpbmd9IGRhdGEgdGhlIGRhdGEgdG8gaGFzaC5cbiAgICAgKiBAcmV0dXJuIHRoaXNcbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZGF0YSA9IHNqY2wuY29kZWMudXRmOFN0cmluZy50b0JpdHMoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGksIGIgPSAodGhpcy5fYnVmZmVyID0gc2pjbC5iaXRBcnJheS5jb25jYXQodGhpcy5fYnVmZmVyLCBkYXRhKSksIG9sID0gdGhpcy5fbGVuZ3RoLCBubCA9ICh0aGlzLl9sZW5ndGggPSBvbCArIHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGRhdGEpKTtcbiAgICAgICAgaWYgKG5sID4gOTAwNzE5OTI1NDc0MDk5MSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IHNqY2wuZXhjZXB0aW9uLmludmFsaWQoXCJDYW5ub3QgaGFzaCBtb3JlIHRoYW4gMl41MyAtIDEgYml0c1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIFVpbnQzMkFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB2YXIgYyA9IG5ldyBVaW50MzJBcnJheShiKTtcbiAgICAgICAgICAgIHZhciBqID0gMDtcbiAgICAgICAgICAgIGZvciAoaSA9IDUxMiArIG9sIC0gKCg1MTIgKyBvbCkgJiA1MTEpOyBpIDw9IG5sOyBpICs9IDUxMikge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGMuc3ViYXJyYXkoMTYgKiBqLCAxNiAqIChqICsgMSkpKTtcbiAgICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiLnNwbGljZSgwLCAxNiAqIGopO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChpID0gNTEyICsgb2wgLSAoKDUxMiArIG9sKSAmIDUxMSk7IGkgPD0gbmw7IGkgKz0gNTEyKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmxvY2soYi5zcGxpY2UoMCwgMTYpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIENvbXBsZXRlIGhhc2hpbmcgYW5kIG91dHB1dCB0aGUgaGFzaCB2YWx1ZS5cbiAgICAgKiBAcmV0dXJuIHtiaXRBcnJheX0gVGhlIGhhc2ggdmFsdWUsIGFuIGFycmF5IG9mIDggYmlnLWVuZGlhbiB3b3Jkcy5cbiAgICAgKi9cbiAgICBmaW5hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaSwgYiA9IHRoaXMuX2J1ZmZlciwgaCA9IHRoaXMuX2g7XG4gICAgICAgIC8vIFJvdW5kIG91dCBhbmQgcHVzaCB0aGUgYnVmZmVyXG4gICAgICAgIGIgPSBzamNsLmJpdEFycmF5LmNvbmNhdChiLCBbc2pjbC5iaXRBcnJheS5wYXJ0aWFsKDEsIDEpXSk7XG4gICAgICAgIC8vIFJvdW5kIG91dCB0aGUgYnVmZmVyIHRvIGEgbXVsdGlwbGUgb2YgMTYgd29yZHMsIGxlc3MgdGhlIDIgbGVuZ3RoIHdvcmRzLlxuICAgICAgICBmb3IgKGkgPSBiLmxlbmd0aCArIDI7IGkgJiAxNTsgaSsrKSB7XG4gICAgICAgICAgICBiLnB1c2goMCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXBwZW5kIHRoZSBsZW5ndGhcbiAgICAgICAgYi5wdXNoKE1hdGguZmxvb3IodGhpcy5fbGVuZ3RoIC8gMHgxMDAwMDAwMDApKTtcbiAgICAgICAgYi5wdXNoKHRoaXMuX2xlbmd0aCB8IDApO1xuICAgICAgICB3aGlsZSAoYi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGIuc3BsaWNlKDAsIDE2KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICByZXR1cm4gaDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFRoZSBTSEEtMjU2IGluaXRpYWxpemF0aW9uIHZlY3RvciwgdG8gYmUgcHJlY29tcHV0ZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW5pdDogW10sXG4gICAgLypcbiAgICAgX2luaXQ6WzB4NmEwOWU2NjcsMHhiYjY3YWU4NSwweDNjNmVmMzcyLDB4YTU0ZmY1M2EsMHg1MTBlNTI3ZiwweDliMDU2ODhjLDB4MWY4M2Q5YWIsMHg1YmUwY2QxOV0sXG4gICAgICovXG4gICAgLyoqXG4gICAgICogVGhlIFNIQS0yNTYgaGFzaCBrZXksIHRvIGJlIHByZWNvbXB1dGVkLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2tleTogW10sXG4gICAgLypcbiAgICAgX2tleTpcbiAgICAgWzB4NDI4YTJmOTgsIDB4NzEzNzQ0OTEsIDB4YjVjMGZiY2YsIDB4ZTliNWRiYTUsIDB4Mzk1NmMyNWIsIDB4NTlmMTExZjEsIDB4OTIzZjgyYTQsIDB4YWIxYzVlZDUsXG4gICAgIDB4ZDgwN2FhOTgsIDB4MTI4MzViMDEsIDB4MjQzMTg1YmUsIDB4NTUwYzdkYzMsIDB4NzJiZTVkNzQsIDB4ODBkZWIxZmUsIDB4OWJkYzA2YTcsIDB4YzE5YmYxNzQsXG4gICAgIDB4ZTQ5YjY5YzEsIDB4ZWZiZTQ3ODYsIDB4MGZjMTlkYzYsIDB4MjQwY2ExY2MsIDB4MmRlOTJjNmYsIDB4NGE3NDg0YWEsIDB4NWNiMGE5ZGMsIDB4NzZmOTg4ZGEsXG4gICAgIDB4OTgzZTUxNTIsIDB4YTgzMWM2NmQsIDB4YjAwMzI3YzgsIDB4YmY1OTdmYzcsIDB4YzZlMDBiZjMsIDB4ZDVhNzkxNDcsIDB4MDZjYTYzNTEsIDB4MTQyOTI5NjcsXG4gICAgIDB4MjdiNzBhODUsIDB4MmUxYjIxMzgsIDB4NGQyYzZkZmMsIDB4NTMzODBkMTMsIDB4NjUwYTczNTQsIDB4NzY2YTBhYmIsIDB4ODFjMmM5MmUsIDB4OTI3MjJjODUsXG4gICAgIDB4YTJiZmU4YTEsIDB4YTgxYTY2NGIsIDB4YzI0YjhiNzAsIDB4Yzc2YzUxYTMsIDB4ZDE5MmU4MTksIDB4ZDY5OTA2MjQsIDB4ZjQwZTM1ODUsIDB4MTA2YWEwNzAsXG4gICAgIDB4MTlhNGMxMTYsIDB4MWUzNzZjMDgsIDB4Mjc0ODc3NGMsIDB4MzRiMGJjYjUsIDB4MzkxYzBjYjMsIDB4NGVkOGFhNGEsIDB4NWI5Y2NhNGYsIDB4NjgyZTZmZjMsXG4gICAgIDB4NzQ4ZjgyZWUsIDB4NzhhNTYzNmYsIDB4ODRjODc4MTQsIDB4OGNjNzAyMDgsIDB4OTBiZWZmZmEsIDB4YTQ1MDZjZWIsIDB4YmVmOWEzZjcsIDB4YzY3MTc4ZjJdLFxuICAgICAqL1xuICAgIC8qKlxuICAgICAqIEZ1bmN0aW9uIHRvIHByZWNvbXB1dGUgX2luaXQgYW5kIF9rZXkuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcHJlY29tcHV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaSA9IDAsIHByaW1lID0gMiwgZmFjdG9yLCBpc1ByaW1lO1xuICAgICAgICBmdW5jdGlvbiBmcmFjKHgpIHtcbiAgICAgICAgICAgIHJldHVybiAoKHggLSBNYXRoLmZsb29yKHgpKSAqIDB4MTAwMDAwMDAwKSB8IDA7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGkgPCA2NDsgcHJpbWUrKykge1xuICAgICAgICAgICAgaXNQcmltZSA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKGZhY3RvciA9IDI7IGZhY3RvciAqIGZhY3RvciA8PSBwcmltZTsgZmFjdG9yKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocHJpbWUgJSBmYWN0b3IgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaXNQcmltZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNQcmltZSkge1xuICAgICAgICAgICAgICAgIGlmIChpIDwgOCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0W2ldID0gZnJhYyhNYXRoLnBvdyhwcmltZSwgMSAvIDIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5W2ldID0gZnJhYyhNYXRoLnBvdyhwcmltZSwgMSAvIDMpKTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gb25lIGN5Y2xlIG9mIFNIQS0yNTYuXG4gICAgICogQHBhcmFtIHtVaW50MzJBcnJheXxiaXRBcnJheX0gdyBvbmUgYmxvY2sgb2Ygd29yZHMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfYmxvY2s6IGZ1bmN0aW9uICh3KSB7XG4gICAgICAgIHZhciBpLCB0bXAsIGEsIGIsIGggPSB0aGlzLl9oLCBrID0gdGhpcy5fa2V5LCBoMCA9IGhbMF0sIGgxID0gaFsxXSwgaDIgPSBoWzJdLCBoMyA9IGhbM10sIGg0ID0gaFs0XSwgaDUgPSBoWzVdLCBoNiA9IGhbNl0sIGg3ID0gaFs3XTtcbiAgICAgICAgLyogUmF0aW9uYWxlIGZvciBwbGFjZW1lbnQgb2YgfDAgOlxuICAgICAgICAgKiBJZiBhIHZhbHVlIGNhbiBvdmVyZmxvdyBpcyBvcmlnaW5hbCAzMiBiaXRzIGJ5IGEgZmFjdG9yIG9mIG1vcmUgdGhhbiBhIGZld1xuICAgICAgICAgKiBtaWxsaW9uICgyXjIzIGlzaCksIHRoZXJlIGlzIGEgcG9zc2liaWxpdHkgdGhhdCBpdCBtaWdodCBvdmVyZmxvdyB0aGVcbiAgICAgICAgICogNTMtYml0IG1hbnRpc3NhIGFuZCBsb3NlIHByZWNpc2lvbi5cbiAgICAgICAgICpcbiAgICAgICAgICogVG8gYXZvaWQgdGhpcywgd2UgY2xhbXAgYmFjayB0byAzMiBiaXRzIGJ5IHwnaW5nIHdpdGggMCBvbiBhbnkgdmFsdWUgdGhhdFxuICAgICAgICAgKiBwcm9wYWdhdGVzIGFyb3VuZCB0aGUgbG9vcCwgYW5kIG9uIHRoZSBoYXNoIHN0YXRlIGhbXS4gIEkgZG9uJ3QgYmVsaWV2ZVxuICAgICAgICAgKiB0aGF0IHRoZSBjbGFtcHMgb24gaDQgYW5kIG9uIGgwIGFyZSBzdHJpY3RseSBuZWNlc3NhcnksIGJ1dCBpdCdzIGNsb3NlXG4gICAgICAgICAqIChmb3IgaDQgYW55d2F5KSwgYW5kIGJldHRlciBzYWZlIHRoYW4gc29ycnkuXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBjbGFtcHMgb24gaFtdIGFyZSBuZWNlc3NhcnkgZm9yIHRoZSBvdXRwdXQgdG8gYmUgY29ycmVjdCBldmVuIGluIHRoZVxuICAgICAgICAgKiBjb21tb24gY2FzZSBhbmQgZm9yIHNob3J0IGlucHV0cy5cbiAgICAgICAgICovXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCA2NDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBsb2FkIHVwIHRoZSBpbnB1dCB3b3JkIGZvciB0aGlzIHJvdW5kXG4gICAgICAgICAgICBpZiAoaSA8IDE2KSB7XG4gICAgICAgICAgICAgICAgdG1wID0gd1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGEgPSB3WyhpICsgMSkgJiAxNV07XG4gICAgICAgICAgICAgICAgYiA9IHdbKGkgKyAxNCkgJiAxNV07XG4gICAgICAgICAgICAgICAgdG1wID0gd1tpICYgMTVdID1cbiAgICAgICAgICAgICAgICAgICAgKCgoYSA+Pj4gNykgXiAoYSA+Pj4gMTgpIF4gKGEgPj4+IDMpIF4gKGEgPDwgMjUpIF4gKGEgPDwgMTQpKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAoKGIgPj4+IDE3KSBeIChiID4+PiAxOSkgXiAoYiA+Pj4gMTApIF4gKGIgPDwgMTUpIF4gKGIgPDwgMTMpKSArXG4gICAgICAgICAgICAgICAgICAgICAgICB3W2kgJiAxNV0gK1xuICAgICAgICAgICAgICAgICAgICAgICAgd1soaSArIDkpICYgMTVdKSB8XG4gICAgICAgICAgICAgICAgICAgICAgICAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdG1wID0gdG1wICsgaDcgKyAoKGg0ID4+PiA2KSBeIChoNCA+Pj4gMTEpIF4gKGg0ID4+PiAyNSkgXiAoaDQgPDwgMjYpIF4gKGg0IDw8IDIxKSBeIChoNCA8PCA3KSkgKyAoaDYgXiAoaDQgJiAoaDUgXiBoNikpKSArIGtbaV07IC8vIHwgMDtcbiAgICAgICAgICAgIC8vIHNoaWZ0IHJlZ2lzdGVyXG4gICAgICAgICAgICBoNyA9IGg2O1xuICAgICAgICAgICAgaDYgPSBoNTtcbiAgICAgICAgICAgIGg1ID0gaDQ7XG4gICAgICAgICAgICBoNCA9IChoMyArIHRtcCkgfCAwO1xuICAgICAgICAgICAgaDMgPSBoMjtcbiAgICAgICAgICAgIGgyID0gaDE7XG4gICAgICAgICAgICBoMSA9IGgwO1xuICAgICAgICAgICAgaDAgPSAodG1wICsgKChoMSAmIGgyKSBeIChoMyAmIChoMSBeIGgyKSkpICsgKChoMSA+Pj4gMikgXiAoaDEgPj4+IDEzKSBeIChoMSA+Pj4gMjIpIF4gKGgxIDw8IDMwKSBeIChoMSA8PCAxOSkgXiAoaDEgPDwgMTApKSkgfCAwO1xuICAgICAgICB9XG4gICAgICAgIGhbMF0gPSAoaFswXSArIGgwKSB8IDA7XG4gICAgICAgIGhbMV0gPSAoaFsxXSArIGgxKSB8IDA7XG4gICAgICAgIGhbMl0gPSAoaFsyXSArIGgyKSB8IDA7XG4gICAgICAgIGhbM10gPSAoaFszXSArIGgzKSB8IDA7XG4gICAgICAgIGhbNF0gPSAoaFs0XSArIGg0KSB8IDA7XG4gICAgICAgIGhbNV0gPSAoaFs1XSArIGg1KSB8IDA7XG4gICAgICAgIGhbNl0gPSAoaFs2XSArIGg2KSB8IDA7XG4gICAgICAgIGhbN10gPSAoaFs3XSArIGg3KSB8IDA7XG4gICAgfSxcbn07XG4vKiogQGZpbGVPdmVydmlldyBKYXZhc2NyaXB0IFNIQS01MTIgaW1wbGVtZW50YXRpb24uXG4gKlxuICogVGhpcyBpbXBsZW1lbnRhdGlvbiB3YXMgd3JpdHRlbiBmb3IgQ3J5cHRvSlMgYnkgSmVmZiBNb3R0IGFuZCBhZGFwdGVkIGZvclxuICogU0pDTCBieSBTdGVmYW4gVGhvbWFzLlxuICpcbiAqIENyeXB0b0pTIChjKSAyMDA54oCTMjAxMiBieSBKZWZmIE1vdHQuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKiBSZWxlYXNlZCB3aXRoIE5ldyBCU0QgTGljZW5zZVxuICpcbiAqIEBhdXRob3IgRW1pbHkgU3RhcmtcbiAqIEBhdXRob3IgTWlrZSBIYW1idXJnXG4gKiBAYXV0aG9yIERhbiBCb25laFxuICogQGF1dGhvciBKZWZmIE1vdHRcbiAqIEBhdXRob3IgU3RlZmFuIFRob21hc1xuICovXG4vKipcbiAqIENvbnRleHQgZm9yIGEgU0hBLTUxMiBvcGVyYXRpb24gaW4gcHJvZ3Jlc3MuXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuc2pjbC5oYXNoLnNoYTUxMiA9IGZ1bmN0aW9uIChoYXNoKSB7XG4gICAgaWYgKCF0aGlzLl9rZXlbMF0pIHtcbiAgICAgICAgdGhpcy5fcHJlY29tcHV0ZSgpO1xuICAgIH1cbiAgICBpZiAoaGFzaCkge1xuICAgICAgICB0aGlzLl9oID0gaGFzaC5faC5zbGljZSgwKTtcbiAgICAgICAgdGhpcy5fYnVmZmVyID0gaGFzaC5fYnVmZmVyLnNsaWNlKDApO1xuICAgICAgICB0aGlzLl9sZW5ndGggPSBoYXNoLl9sZW5ndGg7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgfVxufTtcbi8qKlxuICogSGFzaCBhIHN0cmluZyBvciBhbiBhcnJheSBvZiB3b3Jkcy5cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7Yml0QXJyYXl8U3RyaW5nfSBkYXRhIHRoZSBkYXRhIHRvIGhhc2guXG4gKiBAcmV0dXJuIHtiaXRBcnJheX0gVGhlIGhhc2ggdmFsdWUsIGFuIGFycmF5IG9mIDE2IGJpZy1lbmRpYW4gd29yZHMuXG4gKi9cbnNqY2wuaGFzaC5zaGE1MTIuaGFzaCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgcmV0dXJuIG5ldyBzamNsLmhhc2guc2hhNTEyKCkudXBkYXRlKGRhdGEpLmZpbmFsaXplKCk7XG59O1xuc2pjbC5oYXNoLnNoYTUxMi5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogVGhlIGhhc2gncyBibG9jayBzaXplLCBpbiBiaXRzLlxuICAgICAqIEBjb25zdGFudFxuICAgICAqL1xuICAgIGJsb2NrU2l6ZTogMTAyNCxcbiAgICAvKipcbiAgICAgKiBSZXNldCB0aGUgaGFzaCBzdGF0ZS5cbiAgICAgKiBAcmV0dXJuIHRoaXNcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9oID0gdGhpcy5faW5pdC5zbGljZSgwKTtcbiAgICAgICAgdGhpcy5fYnVmZmVyID0gW107XG4gICAgICAgIHRoaXMuX2xlbmd0aCA9IDA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogSW5wdXQgc2V2ZXJhbCB3b3JkcyB0byB0aGUgaGFzaC5cbiAgICAgKiBAcGFyYW0ge2JpdEFycmF5fFN0cmluZ30gZGF0YSB0aGUgZGF0YSB0byBoYXNoLlxuICAgICAqIEByZXR1cm4gdGhpc1xuICAgICAqL1xuICAgIHVwZGF0ZTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICBkYXRhID0gc2pjbC5jb2RlYy51dGY4U3RyaW5nLnRvQml0cyhkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgaSwgYiA9ICh0aGlzLl9idWZmZXIgPSBzamNsLmJpdEFycmF5LmNvbmNhdCh0aGlzLl9idWZmZXIsIGRhdGEpKSwgb2wgPSB0aGlzLl9sZW5ndGgsIG5sID0gKHRoaXMuX2xlbmd0aCA9IG9sICsgc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoZGF0YSkpO1xuICAgICAgICBpZiAobmwgPiA5MDA3MTk5MjU0NzQwOTkxKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uaW52YWxpZChcIkNhbm5vdCBoYXNoIG1vcmUgdGhhbiAyXjUzIC0gMSBiaXRzXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0eXBlb2YgVWludDMyQXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHZhciBjID0gbmV3IFVpbnQzMkFycmF5KGIpO1xuICAgICAgICAgICAgdmFyIGogPSAwO1xuICAgICAgICAgICAgZm9yIChpID0gMTAyNCArIG9sIC0gKCgxMDI0ICsgb2wpICYgMTAyMyk7IGkgPD0gbmw7IGkgKz0gMTAyNCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGMuc3ViYXJyYXkoMzIgKiBqLCAzMiAqIChqICsgMSkpKTtcbiAgICAgICAgICAgICAgICBqICs9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBiLnNwbGljZSgwLCAzMiAqIGopO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yIChpID0gMTAyNCArIG9sIC0gKCgxMDI0ICsgb2wpICYgMTAyMyk7IGkgPD0gbmw7IGkgKz0gMTAyNCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGIuc3BsaWNlKDAsIDMyKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDb21wbGV0ZSBoYXNoaW5nIGFuZCBvdXRwdXQgdGhlIGhhc2ggdmFsdWUuXG4gICAgICogQHJldHVybiB7Yml0QXJyYXl9IFRoZSBoYXNoIHZhbHVlLCBhbiBhcnJheSBvZiAxNiBiaWctZW5kaWFuIHdvcmRzLlxuICAgICAqL1xuICAgIGZpbmFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpLCBiID0gdGhpcy5fYnVmZmVyLCBoID0gdGhpcy5faDtcbiAgICAgICAgLy8gUm91bmQgb3V0IGFuZCBwdXNoIHRoZSBidWZmZXJcbiAgICAgICAgYiA9IHNqY2wuYml0QXJyYXkuY29uY2F0KGIsIFtzamNsLmJpdEFycmF5LnBhcnRpYWwoMSwgMSldKTtcbiAgICAgICAgLy8gUm91bmQgb3V0IHRoZSBidWZmZXIgdG8gYSBtdWx0aXBsZSBvZiAzMiB3b3JkcywgbGVzcyB0aGUgNCBsZW5ndGggd29yZHMuXG4gICAgICAgIGZvciAoaSA9IGIubGVuZ3RoICsgNDsgaSAmIDMxOyBpKyspIHtcbiAgICAgICAgICAgIGIucHVzaCgwKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBhcHBlbmQgdGhlIGxlbmd0aFxuICAgICAgICBiLnB1c2goMCk7XG4gICAgICAgIGIucHVzaCgwKTtcbiAgICAgICAgYi5wdXNoKE1hdGguZmxvb3IodGhpcy5fbGVuZ3RoIC8gMHgxMDAwMDAwMDApKTtcbiAgICAgICAgYi5wdXNoKHRoaXMuX2xlbmd0aCB8IDApO1xuICAgICAgICB3aGlsZSAoYi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGIuc3BsaWNlKDAsIDMyKSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICByZXR1cm4gaDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFRoZSBTSEEtNTEyIGluaXRpYWxpemF0aW9uIHZlY3RvciwgdG8gYmUgcHJlY29tcHV0ZWQuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW5pdDogW10sXG4gICAgLyoqXG4gICAgICogTGVhc3Qgc2lnbmlmaWNhbnQgMjQgYml0cyBvZiBTSEE1MTIgaW5pdGlhbGl6YXRpb24gdmFsdWVzLlxuICAgICAqXG4gICAgICogSmF2YXNjcmlwdCBvbmx5IGhhcyA1MyBiaXRzIG9mIHByZWNpc2lvbiwgc28gd2UgY29tcHV0ZSB0aGUgNDAgbW9zdFxuICAgICAqIHNpZ25pZmljYW50IGJpdHMgYW5kIGFkZCB0aGUgcmVtYWluaW5nIDI0IGJpdHMgYXMgY29uc3RhbnRzLlxuICAgICAqXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW5pdHI6IFsweGJjYzkwOCwgMHhjYWE3M2IsIDB4OTRmODJiLCAweDFkMzZmMSwgMHhlNjgyZDEsIDB4M2U2YzFmLCAweDQxYmQ2YiwgMHg3ZTIxNzldLFxuICAgIC8qXG4gIF9pbml0OlxuICBbMHg2YTA5ZTY2NywgMHhmM2JjYzkwOCwgMHhiYjY3YWU4NSwgMHg4NGNhYTczYiwgMHgzYzZlZjM3MiwgMHhmZTk0ZjgyYiwgMHhhNTRmZjUzYSwgMHg1ZjFkMzZmMSxcbiAgIDB4NTEwZTUyN2YsIDB4YWRlNjgyZDEsIDB4OWIwNTY4OGMsIDB4MmIzZTZjMWYsIDB4MWY4M2Q5YWIsIDB4ZmI0MWJkNmIsIDB4NWJlMGNkMTksIDB4MTM3ZTIxNzldLFxuICAqL1xuICAgIC8qKlxuICAgICAqIFRoZSBTSEEtNTEyIGhhc2gga2V5LCB0byBiZSBwcmVjb21wdXRlZC5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9rZXk6IFtdLFxuICAgIC8qKlxuICAgICAqIExlYXN0IHNpZ25pZmljYW50IDI0IGJpdHMgb2YgU0hBNTEyIGtleSB2YWx1ZXMuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfa2V5cjogW1xuICAgICAgICAweDI4YWUyMiwgMHhlZjY1Y2QsIDB4NGQzYjJmLCAweDg5ZGJiYywgMHg0OGI1MzgsIDB4MDVkMDE5LCAweDE5NGY5YiwgMHg2ZDgxMTgsIDB4MDMwMjQyLCAweDcwNmZiZSwgMHhlNGIyOGMsIDB4ZmZiNGUyLCAweDdiODk2ZiwgMHgxNjk2YjEsIDB4YzcxMjM1LFxuICAgICAgICAweDY5MjY5NCwgMHhmMTRhZDIsIDB4NGYyNWUzLCAweDhjZDViNSwgMHhhYzljNjUsIDB4MmIwMjc1LCAweGE2ZTQ4MywgMHg0MWZiZDQsIDB4MTE1M2I1LCAweDY2ZGZhYiwgMHhiNDMyMTAsIDB4ZmIyMTNmLCAweGVmMGVlNCwgMHhhODhmYzIsIDB4MGFhNzI1LFxuICAgICAgICAweDAzODI2ZiwgMHgwZTZlNzAsIDB4ZDIyZmZjLCAweDI2YzkyNiwgMHhjNDJhZWQsIDB4OTViM2RmLCAweGFmNjNkZSwgMHg3N2IyYTgsIDB4ZWRhZWU2LCAweDgyMzUzYiwgMHhmMTAzNjQsIDB4NDIzMDAxLCAweGY4OTc5MSwgMHg1NGJlMzAsIDB4ZWY1MjE4LFxuICAgICAgICAweDY1YTkxMCwgMHg3MTIwMmEsIDB4YmJkMWI4LCAweGQyZDBjOCwgMHg0MWFiNTMsIDB4OGVlYjk5LCAweDliNDhhOCwgMHhjOTVhNjMsIDB4NDE4YWNiLCAweDYzZTM3MywgMHhiMmI4YTMsIDB4ZWZiMmZjLCAweDE3MmY2MCwgMHhmMGFiNzIsIDB4NjQzOWVjLFxuICAgICAgICAweDYzMWUyOCwgMHg4MmJkZTksIDB4YzY3OTE1LCAweDcyNTMyYiwgMHgyNjYxOWMsIDB4YzBjMjA3LCAweGUwZWIxZSwgMHg2ZWQxNzgsIDB4MTc2ZmJhLCAweGM4OThhNiwgMHhmOTBkYWUsIDB4MWM0NzFiLCAweDA0N2Q4NCwgMHhjNzI0OTMsIDB4YzliZWJjLFxuICAgICAgICAweDEwMGQ0YywgMHgzZTQyYjYsIDB4NjU3ZTJhLCAweGQ2ZmFlYywgMHg0NzU4MTcsXG4gICAgXSxcbiAgICAvKlxuICBfa2V5OlxuICBbMHg0MjhhMmY5OCwgMHhkNzI4YWUyMiwgMHg3MTM3NDQ5MSwgMHgyM2VmNjVjZCwgMHhiNWMwZmJjZiwgMHhlYzRkM2IyZiwgMHhlOWI1ZGJhNSwgMHg4MTg5ZGJiYyxcbiAgIDB4Mzk1NmMyNWIsIDB4ZjM0OGI1MzgsIDB4NTlmMTExZjEsIDB4YjYwNWQwMTksIDB4OTIzZjgyYTQsIDB4YWYxOTRmOWIsIDB4YWIxYzVlZDUsIDB4ZGE2ZDgxMTgsXG4gICAweGQ4MDdhYTk4LCAweGEzMDMwMjQyLCAweDEyODM1YjAxLCAweDQ1NzA2ZmJlLCAweDI0MzE4NWJlLCAweDRlZTRiMjhjLCAweDU1MGM3ZGMzLCAweGQ1ZmZiNGUyLFxuICAgMHg3MmJlNWQ3NCwgMHhmMjdiODk2ZiwgMHg4MGRlYjFmZSwgMHgzYjE2OTZiMSwgMHg5YmRjMDZhNywgMHgyNWM3MTIzNSwgMHhjMTliZjE3NCwgMHhjZjY5MjY5NCxcbiAgIDB4ZTQ5YjY5YzEsIDB4OWVmMTRhZDIsIDB4ZWZiZTQ3ODYsIDB4Mzg0ZjI1ZTMsIDB4MGZjMTlkYzYsIDB4OGI4Y2Q1YjUsIDB4MjQwY2ExY2MsIDB4NzdhYzljNjUsXG4gICAweDJkZTkyYzZmLCAweDU5MmIwMjc1LCAweDRhNzQ4NGFhLCAweDZlYTZlNDgzLCAweDVjYjBhOWRjLCAweGJkNDFmYmQ0LCAweDc2Zjk4OGRhLCAweDgzMTE1M2I1LFxuICAgMHg5ODNlNTE1MiwgMHhlZTY2ZGZhYiwgMHhhODMxYzY2ZCwgMHgyZGI0MzIxMCwgMHhiMDAzMjdjOCwgMHg5OGZiMjEzZiwgMHhiZjU5N2ZjNywgMHhiZWVmMGVlNCxcbiAgIDB4YzZlMDBiZjMsIDB4M2RhODhmYzIsIDB4ZDVhNzkxNDcsIDB4OTMwYWE3MjUsIDB4MDZjYTYzNTEsIDB4ZTAwMzgyNmYsIDB4MTQyOTI5NjcsIDB4MGEwZTZlNzAsXG4gICAweDI3YjcwYTg1LCAweDQ2ZDIyZmZjLCAweDJlMWIyMTM4LCAweDVjMjZjOTI2LCAweDRkMmM2ZGZjLCAweDVhYzQyYWVkLCAweDUzMzgwZDEzLCAweDlkOTViM2RmLFxuICAgMHg2NTBhNzM1NCwgMHg4YmFmNjNkZSwgMHg3NjZhMGFiYiwgMHgzYzc3YjJhOCwgMHg4MWMyYzkyZSwgMHg0N2VkYWVlNiwgMHg5MjcyMmM4NSwgMHgxNDgyMzUzYixcbiAgIDB4YTJiZmU4YTEsIDB4NGNmMTAzNjQsIDB4YTgxYTY2NGIsIDB4YmM0MjMwMDEsIDB4YzI0YjhiNzAsIDB4ZDBmODk3OTEsIDB4Yzc2YzUxYTMsIDB4MDY1NGJlMzAsXG4gICAweGQxOTJlODE5LCAweGQ2ZWY1MjE4LCAweGQ2OTkwNjI0LCAweDU1NjVhOTEwLCAweGY0MGUzNTg1LCAweDU3NzEyMDJhLCAweDEwNmFhMDcwLCAweDMyYmJkMWI4LFxuICAgMHgxOWE0YzExNiwgMHhiOGQyZDBjOCwgMHgxZTM3NmMwOCwgMHg1MTQxYWI1MywgMHgyNzQ4Nzc0YywgMHhkZjhlZWI5OSwgMHgzNGIwYmNiNSwgMHhlMTliNDhhOCxcbiAgIDB4MzkxYzBjYjMsIDB4YzVjOTVhNjMsIDB4NGVkOGFhNGEsIDB4ZTM0MThhY2IsIDB4NWI5Y2NhNGYsIDB4Nzc2M2UzNzMsIDB4NjgyZTZmZjMsIDB4ZDZiMmI4YTMsXG4gICAweDc0OGY4MmVlLCAweDVkZWZiMmZjLCAweDc4YTU2MzZmLCAweDQzMTcyZjYwLCAweDg0Yzg3ODE0LCAweGExZjBhYjcyLCAweDhjYzcwMjA4LCAweDFhNjQzOWVjLFxuICAgMHg5MGJlZmZmYSwgMHgyMzYzMWUyOCwgMHhhNDUwNmNlYiwgMHhkZTgyYmRlOSwgMHhiZWY5YTNmNywgMHhiMmM2NzkxNSwgMHhjNjcxNzhmMiwgMHhlMzcyNTMyYixcbiAgIDB4Y2EyNzNlY2UsIDB4ZWEyNjYxOWMsIDB4ZDE4NmI4YzcsIDB4MjFjMGMyMDcsIDB4ZWFkYTdkZDYsIDB4Y2RlMGViMWUsIDB4ZjU3ZDRmN2YsIDB4ZWU2ZWQxNzgsXG4gICAweDA2ZjA2N2FhLCAweDcyMTc2ZmJhLCAweDBhNjM3ZGM1LCAweGEyYzg5OGE2LCAweDExM2Y5ODA0LCAweGJlZjkwZGFlLCAweDFiNzEwYjM1LCAweDEzMWM0NzFiLFxuICAgMHgyOGRiNzdmNSwgMHgyMzA0N2Q4NCwgMHgzMmNhYWI3YiwgMHg0MGM3MjQ5MywgMHgzYzllYmUwYSwgMHgxNWM5YmViYywgMHg0MzFkNjdjNCwgMHg5YzEwMGQ0YyxcbiAgIDB4NGNjNWQ0YmUsIDB4Y2IzZTQyYjYsIDB4NTk3ZjI5OWMsIDB4ZmM2NTdlMmEsIDB4NWZjYjZmYWIsIDB4M2FkNmZhZWMsIDB4NmM0NDE5OGMsIDB4NGE0NzU4MTddLFxuICAqL1xuICAgIC8qKlxuICAgICAqIEZ1bmN0aW9uIHRvIHByZWNvbXB1dGUgX2luaXQgYW5kIF9rZXkuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcHJlY29tcHV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyBYWFg6IFRoaXMgY29kZSBpcyBmb3IgcHJlY29tcHV0aW5nIHRoZSBTSEEyNTYgY29uc3RhbnRzLCBjaGFuZ2UgZm9yXG4gICAgICAgIC8vICAgICAgU0hBNTEyIGFuZCByZS1lbmFibGUuXG4gICAgICAgIHZhciBpID0gMCwgcHJpbWUgPSAyLCBmYWN0b3IsIGlzUHJpbWU7XG4gICAgICAgIGZ1bmN0aW9uIGZyYWMoeCkge1xuICAgICAgICAgICAgcmV0dXJuICgoeCAtIE1hdGguZmxvb3IoeCkpICogMHgxMDAwMDAwMDApIHwgMDtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBmcmFjMih4KSB7XG4gICAgICAgICAgICByZXR1cm4gKCh4IC0gTWF0aC5mbG9vcih4KSkgKiAweDEwMDAwMDAwMDAwKSAmIDB4ZmY7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGkgPCA4MDsgcHJpbWUrKykge1xuICAgICAgICAgICAgaXNQcmltZSA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKGZhY3RvciA9IDI7IGZhY3RvciAqIGZhY3RvciA8PSBwcmltZTsgZmFjdG9yKyspIHtcbiAgICAgICAgICAgICAgICBpZiAocHJpbWUgJSBmYWN0b3IgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaXNQcmltZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNQcmltZSkge1xuICAgICAgICAgICAgICAgIGlmIChpIDwgOCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbml0W2kgKiAyXSA9IGZyYWMoTWF0aC5wb3cocHJpbWUsIDEgLyAyKSk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2luaXRbaSAqIDIgKyAxXSA9IChmcmFjMihNYXRoLnBvdyhwcmltZSwgMSAvIDIpKSA8PCAyNCkgfCB0aGlzLl9pbml0cltpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5W2kgKiAyXSA9IGZyYWMoTWF0aC5wb3cocHJpbWUsIDEgLyAzKSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fa2V5W2kgKiAyICsgMV0gPSAoZnJhYzIoTWF0aC5wb3cocHJpbWUsIDEgLyAzKSkgPDwgMjQpIHwgdGhpcy5fa2V5cltpXTtcbiAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFBlcmZvcm0gb25lIGN5Y2xlIG9mIFNIQS01MTIuXG4gICAgICogQHBhcmFtIHtVaW50MzJBcnJheXxiaXRBcnJheX0gd29yZHMgb25lIGJsb2NrIG9mIHdvcmRzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Jsb2NrOiBmdW5jdGlvbiAod29yZHMpIHtcbiAgICAgICAgdmFyIGksIHdyaCwgd3JsLCBoID0gdGhpcy5faCwgayA9IHRoaXMuX2tleSwgaDBoID0gaFswXSwgaDBsID0gaFsxXSwgaDFoID0gaFsyXSwgaDFsID0gaFszXSwgaDJoID0gaFs0XSwgaDJsID0gaFs1XSwgaDNoID0gaFs2XSwgaDNsID0gaFs3XSwgaDRoID0gaFs4XSwgaDRsID0gaFs5XSwgaDVoID0gaFsxMF0sIGg1bCA9IGhbMTFdLCBoNmggPSBoWzEyXSwgaDZsID0gaFsxM10sIGg3aCA9IGhbMTRdLCBoN2wgPSBoWzE1XTtcbiAgICAgICAgdmFyIHc7XG4gICAgICAgIGlmICh0eXBlb2YgVWludDMyQXJyYXkgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIC8vIFdoZW4gd29yZHMgaXMgcGFzc2VkIHRvIF9ibG9jaywgaXQgaGFzIDMyIGVsZW1lbnRzLiBTSEE1MTIgX2Jsb2NrXG4gICAgICAgICAgICAvLyBmdW5jdGlvbiBleHRlbmRzIHdvcmRzIHdpdGggbmV3IGVsZW1lbnRzIChhdCB0aGUgZW5kIHRoZXJlIGFyZSAxNjAgZWxlbWVudHMpLlxuICAgICAgICAgICAgLy8gVGhlIHByb2JsZW0gaXMgdGhhdCBpZiB3ZSB1c2UgVWludDMyQXJyYXkgaW5zdGVhZCBvZiBBcnJheSxcbiAgICAgICAgICAgIC8vIHRoZSBsZW5ndGggb2YgVWludDMyQXJyYXkgY2Fubm90IGJlIGNoYW5nZWQuIFRodXMsIHdlIHJlcGxhY2Ugd29yZHMgd2l0aCBhXG4gICAgICAgICAgICAvLyBub3JtYWwgQXJyYXkgaGVyZS5cbiAgICAgICAgICAgIHcgPSBBcnJheSgxNjApOyAvLyBkbyBub3QgdXNlIFVpbnQzMkFycmF5IGhlcmUgYXMgdGhlIGluc3RhbnRpYXRpb24gaXMgc2xvd2VyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDMyOyBqKyspIHtcbiAgICAgICAgICAgICAgICB3W2pdID0gd29yZHNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3ID0gd29yZHM7XG4gICAgICAgIH1cbiAgICAgICAgLy8gV29ya2luZyB2YXJpYWJsZXNcbiAgICAgICAgdmFyIGFoID0gaDBoLCBhbCA9IGgwbCwgYmggPSBoMWgsIGJsID0gaDFsLCBjaCA9IGgyaCwgY2wgPSBoMmwsIGRoID0gaDNoLCBkbCA9IGgzbCwgZWggPSBoNGgsIGVsID0gaDRsLCBmaCA9IGg1aCwgZmwgPSBoNWwsIGdoID0gaDZoLCBnbCA9IGg2bCwgaGggPSBoN2gsIGhsID0gaDdsO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgODA7IGkrKykge1xuICAgICAgICAgICAgLy8gbG9hZCB1cCB0aGUgaW5wdXQgd29yZCBmb3IgdGhpcyByb3VuZFxuICAgICAgICAgICAgaWYgKGkgPCAxNikge1xuICAgICAgICAgICAgICAgIHdyaCA9IHdbaSAqIDJdO1xuICAgICAgICAgICAgICAgIHdybCA9IHdbaSAqIDIgKyAxXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEdhbW1hMFxuICAgICAgICAgICAgICAgIHZhciBnYW1tYTB4aCA9IHdbKGkgLSAxNSkgKiAyXTtcbiAgICAgICAgICAgICAgICB2YXIgZ2FtbWEweGwgPSB3WyhpIC0gMTUpICogMiArIDFdO1xuICAgICAgICAgICAgICAgIHZhciBnYW1tYTBoID0gKChnYW1tYTB4bCA8PCAzMSkgfCAoZ2FtbWEweGggPj4+IDEpKSBeICgoZ2FtbWEweGwgPDwgMjQpIHwgKGdhbW1hMHhoID4+PiA4KSkgXiAoZ2FtbWEweGggPj4+IDcpO1xuICAgICAgICAgICAgICAgIHZhciBnYW1tYTBsID0gKChnYW1tYTB4aCA8PCAzMSkgfCAoZ2FtbWEweGwgPj4+IDEpKSBeICgoZ2FtbWEweGggPDwgMjQpIHwgKGdhbW1hMHhsID4+PiA4KSkgXiAoKGdhbW1hMHhoIDw8IDI1KSB8IChnYW1tYTB4bCA+Pj4gNykpO1xuICAgICAgICAgICAgICAgIC8vIEdhbW1hMVxuICAgICAgICAgICAgICAgIHZhciBnYW1tYTF4aCA9IHdbKGkgLSAyKSAqIDJdO1xuICAgICAgICAgICAgICAgIHZhciBnYW1tYTF4bCA9IHdbKGkgLSAyKSAqIDIgKyAxXTtcbiAgICAgICAgICAgICAgICB2YXIgZ2FtbWExaCA9ICgoZ2FtbWExeGwgPDwgMTMpIHwgKGdhbW1hMXhoID4+PiAxOSkpIF4gKChnYW1tYTF4aCA8PCAzKSB8IChnYW1tYTF4bCA+Pj4gMjkpKSBeIChnYW1tYTF4aCA+Pj4gNik7XG4gICAgICAgICAgICAgICAgdmFyIGdhbW1hMWwgPSAoKGdhbW1hMXhoIDw8IDEzKSB8IChnYW1tYTF4bCA+Pj4gMTkpKSBeICgoZ2FtbWExeGwgPDwgMykgfCAoZ2FtbWExeGggPj4+IDI5KSkgXiAoKGdhbW1hMXhoIDw8IDI2KSB8IChnYW1tYTF4bCA+Pj4gNikpO1xuICAgICAgICAgICAgICAgIC8vIFNob3J0Y3V0c1xuICAgICAgICAgICAgICAgIHZhciB3cjdoID0gd1soaSAtIDcpICogMl07XG4gICAgICAgICAgICAgICAgdmFyIHdyN2wgPSB3WyhpIC0gNykgKiAyICsgMV07XG4gICAgICAgICAgICAgICAgdmFyIHdyMTZoID0gd1soaSAtIDE2KSAqIDJdO1xuICAgICAgICAgICAgICAgIHZhciB3cjE2bCA9IHdbKGkgLSAxNikgKiAyICsgMV07XG4gICAgICAgICAgICAgICAgLy8gVyhyb3VuZCkgPSBnYW1tYTAgKyBXKHJvdW5kIC0gNykgKyBnYW1tYTEgKyBXKHJvdW5kIC0gMTYpXG4gICAgICAgICAgICAgICAgd3JsID0gZ2FtbWEwbCArIHdyN2w7XG4gICAgICAgICAgICAgICAgd3JoID0gZ2FtbWEwaCArIHdyN2ggKyAod3JsID4+PiAwIDwgZ2FtbWEwbCA+Pj4gMCA/IDEgOiAwKTtcbiAgICAgICAgICAgICAgICB3cmwgKz0gZ2FtbWExbDtcbiAgICAgICAgICAgICAgICB3cmggKz0gZ2FtbWExaCArICh3cmwgPj4+IDAgPCBnYW1tYTFsID4+PiAwID8gMSA6IDApO1xuICAgICAgICAgICAgICAgIHdybCArPSB3cjE2bDtcbiAgICAgICAgICAgICAgICB3cmggKz0gd3IxNmggKyAod3JsID4+PiAwIDwgd3IxNmwgPj4+IDAgPyAxIDogMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB3W2kgKiAyXSA9IHdyaCB8PSAwO1xuICAgICAgICAgICAgd1tpICogMiArIDFdID0gd3JsIHw9IDA7XG4gICAgICAgICAgICAvLyBDaFxuICAgICAgICAgICAgdmFyIGNoaCA9IChlaCAmIGZoKSBeICh+ZWggJiBnaCk7XG4gICAgICAgICAgICB2YXIgY2hsID0gKGVsICYgZmwpIF4gKH5lbCAmIGdsKTtcbiAgICAgICAgICAgIC8vIE1halxuICAgICAgICAgICAgdmFyIG1hamggPSAoYWggJiBiaCkgXiAoYWggJiBjaCkgXiAoYmggJiBjaCk7XG4gICAgICAgICAgICB2YXIgbWFqbCA9IChhbCAmIGJsKSBeIChhbCAmIGNsKSBeIChibCAmIGNsKTtcbiAgICAgICAgICAgIC8vIFNpZ21hMFxuICAgICAgICAgICAgdmFyIHNpZ21hMGggPSAoKGFsIDw8IDQpIHwgKGFoID4+PiAyOCkpIF4gKChhaCA8PCAzMCkgfCAoYWwgPj4+IDIpKSBeICgoYWggPDwgMjUpIHwgKGFsID4+PiA3KSk7XG4gICAgICAgICAgICB2YXIgc2lnbWEwbCA9ICgoYWggPDwgNCkgfCAoYWwgPj4+IDI4KSkgXiAoKGFsIDw8IDMwKSB8IChhaCA+Pj4gMikpIF4gKChhbCA8PCAyNSkgfCAoYWggPj4+IDcpKTtcbiAgICAgICAgICAgIC8vIFNpZ21hMVxuICAgICAgICAgICAgdmFyIHNpZ21hMWggPSAoKGVsIDw8IDE4KSB8IChlaCA+Pj4gMTQpKSBeICgoZWwgPDwgMTQpIHwgKGVoID4+PiAxOCkpIF4gKChlaCA8PCAyMykgfCAoZWwgPj4+IDkpKTtcbiAgICAgICAgICAgIHZhciBzaWdtYTFsID0gKChlaCA8PCAxOCkgfCAoZWwgPj4+IDE0KSkgXiAoKGVoIDw8IDE0KSB8IChlbCA+Pj4gMTgpKSBeICgoZWwgPDwgMjMpIHwgKGVoID4+PiA5KSk7XG4gICAgICAgICAgICAvLyBLKHJvdW5kKVxuICAgICAgICAgICAgdmFyIGtyaCA9IGtbaSAqIDJdO1xuICAgICAgICAgICAgdmFyIGtybCA9IGtbaSAqIDIgKyAxXTtcbiAgICAgICAgICAgIC8vIHQxID0gaCArIHNpZ21hMSArIGNoICsgSyhyb3VuZCkgKyBXKHJvdW5kKVxuICAgICAgICAgICAgdmFyIHQxbCA9IGhsICsgc2lnbWExbDtcbiAgICAgICAgICAgIHZhciB0MWggPSBoaCArIHNpZ21hMWggKyAodDFsID4+PiAwIDwgaGwgPj4+IDAgPyAxIDogMCk7XG4gICAgICAgICAgICB0MWwgKz0gY2hsO1xuICAgICAgICAgICAgdDFoICs9IGNoaCArICh0MWwgPj4+IDAgPCBjaGwgPj4+IDAgPyAxIDogMCk7XG4gICAgICAgICAgICB0MWwgKz0ga3JsO1xuICAgICAgICAgICAgdDFoICs9IGtyaCArICh0MWwgPj4+IDAgPCBrcmwgPj4+IDAgPyAxIDogMCk7XG4gICAgICAgICAgICB0MWwgPSAodDFsICsgd3JsKSB8IDA7IC8vIEZGMzIuLkZGMzQgcGVyZiBpc3N1ZSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD0xMDU0OTcyXG4gICAgICAgICAgICB0MWggKz0gd3JoICsgKHQxbCA+Pj4gMCA8IHdybCA+Pj4gMCA/IDEgOiAwKTtcbiAgICAgICAgICAgIC8vIHQyID0gc2lnbWEwICsgbWFqXG4gICAgICAgICAgICB2YXIgdDJsID0gc2lnbWEwbCArIG1hamw7XG4gICAgICAgICAgICB2YXIgdDJoID0gc2lnbWEwaCArIG1hamggKyAodDJsID4+PiAwIDwgc2lnbWEwbCA+Pj4gMCA/IDEgOiAwKTtcbiAgICAgICAgICAgIC8vIFVwZGF0ZSB3b3JraW5nIHZhcmlhYmxlc1xuICAgICAgICAgICAgaGggPSBnaDtcbiAgICAgICAgICAgIGhsID0gZ2w7XG4gICAgICAgICAgICBnaCA9IGZoO1xuICAgICAgICAgICAgZ2wgPSBmbDtcbiAgICAgICAgICAgIGZoID0gZWg7XG4gICAgICAgICAgICBmbCA9IGVsO1xuICAgICAgICAgICAgZWwgPSAoZGwgKyB0MWwpIHwgMDtcbiAgICAgICAgICAgIGVoID0gKGRoICsgdDFoICsgKGVsID4+PiAwIDwgZGwgPj4+IDAgPyAxIDogMCkpIHwgMDtcbiAgICAgICAgICAgIGRoID0gY2g7XG4gICAgICAgICAgICBkbCA9IGNsO1xuICAgICAgICAgICAgY2ggPSBiaDtcbiAgICAgICAgICAgIGNsID0gYmw7XG4gICAgICAgICAgICBiaCA9IGFoO1xuICAgICAgICAgICAgYmwgPSBhbDtcbiAgICAgICAgICAgIGFsID0gKHQxbCArIHQybCkgfCAwO1xuICAgICAgICAgICAgYWggPSAodDFoICsgdDJoICsgKGFsID4+PiAwIDwgdDFsID4+PiAwID8gMSA6IDApKSB8IDA7XG4gICAgICAgIH1cbiAgICAgICAgLy8gSW50ZXJtZWRpYXRlIGhhc2hcbiAgICAgICAgaDBsID0gaFsxXSA9IChoMGwgKyBhbCkgfCAwO1xuICAgICAgICBoWzBdID0gKGgwaCArIGFoICsgKGgwbCA+Pj4gMCA8IGFsID4+PiAwID8gMSA6IDApKSB8IDA7XG4gICAgICAgIGgxbCA9IGhbM10gPSAoaDFsICsgYmwpIHwgMDtcbiAgICAgICAgaFsyXSA9IChoMWggKyBiaCArIChoMWwgPj4+IDAgPCBibCA+Pj4gMCA/IDEgOiAwKSkgfCAwO1xuICAgICAgICBoMmwgPSBoWzVdID0gKGgybCArIGNsKSB8IDA7XG4gICAgICAgIGhbNF0gPSAoaDJoICsgY2ggKyAoaDJsID4+PiAwIDwgY2wgPj4+IDAgPyAxIDogMCkpIHwgMDtcbiAgICAgICAgaDNsID0gaFs3XSA9IChoM2wgKyBkbCkgfCAwO1xuICAgICAgICBoWzZdID0gKGgzaCArIGRoICsgKGgzbCA+Pj4gMCA8IGRsID4+PiAwID8gMSA6IDApKSB8IDA7XG4gICAgICAgIGg0bCA9IGhbOV0gPSAoaDRsICsgZWwpIHwgMDtcbiAgICAgICAgaFs4XSA9IChoNGggKyBlaCArIChoNGwgPj4+IDAgPCBlbCA+Pj4gMCA/IDEgOiAwKSkgfCAwO1xuICAgICAgICBoNWwgPSBoWzExXSA9IChoNWwgKyBmbCkgfCAwO1xuICAgICAgICBoWzEwXSA9IChoNWggKyBmaCArIChoNWwgPj4+IDAgPCBmbCA+Pj4gMCA/IDEgOiAwKSkgfCAwO1xuICAgICAgICBoNmwgPSBoWzEzXSA9IChoNmwgKyBnbCkgfCAwO1xuICAgICAgICBoWzEyXSA9IChoNmggKyBnaCArIChoNmwgPj4+IDAgPCBnbCA+Pj4gMCA/IDEgOiAwKSkgfCAwO1xuICAgICAgICBoN2wgPSBoWzE1XSA9IChoN2wgKyBobCkgfCAwO1xuICAgICAgICBoWzE0XSA9IChoN2ggKyBoaCArIChoN2wgPj4+IDAgPCBobCA+Pj4gMCA/IDEgOiAwKSkgfCAwO1xuICAgIH0sXG59O1xuLyoqIEBmaWxlT3ZlcnZpZXcgSmF2YXNjcmlwdCBTSEEtMSBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBCYXNlZCBvbiB0aGUgaW1wbGVtZW50YXRpb24gaW4gUkZDIDMxNzQsIG1ldGhvZCAxLCBhbmQgb24gdGhlIFNKQ0xcbiAqIFNIQS0yNTYgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQGF1dGhvciBRdWlubiBTbGFja1xuICovXG4vKipcbiAqIENvbnRleHQgZm9yIGEgU0hBLTEgb3BlcmF0aW9uIGluIHByb2dyZXNzLlxuICogQGNvbnN0cnVjdG9yXG4gKi9cbnNqY2wuaGFzaC5zaGExID0gZnVuY3Rpb24gKGhhc2gpIHtcbiAgICBpZiAoaGFzaCkge1xuICAgICAgICB0aGlzLl9oID0gaGFzaC5faC5zbGljZSgwKTtcbiAgICAgICAgdGhpcy5fYnVmZmVyID0gaGFzaC5fYnVmZmVyLnNsaWNlKDApO1xuICAgICAgICB0aGlzLl9sZW5ndGggPSBoYXNoLl9sZW5ndGg7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLnJlc2V0KCk7XG4gICAgfVxufTtcbi8qKlxuICogSGFzaCBhIHN0cmluZyBvciBhbiBhcnJheSBvZiB3b3Jkcy5cbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSB7Yml0QXJyYXl8U3RyaW5nfSBkYXRhIHRoZSBkYXRhIHRvIGhhc2guXG4gKiBAcmV0dXJuIHtiaXRBcnJheX0gVGhlIGhhc2ggdmFsdWUsIGFuIGFycmF5IG9mIDUgYmlnLWVuZGlhbiB3b3Jkcy5cbiAqL1xuc2pjbC5oYXNoLnNoYTEuaGFzaCA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgcmV0dXJuIG5ldyBzamNsLmhhc2guc2hhMSgpLnVwZGF0ZShkYXRhKS5maW5hbGl6ZSgpO1xufTtcbnNqY2wuaGFzaC5zaGExLnByb3RvdHlwZSA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgaGFzaCdzIGJsb2NrIHNpemUsIGluIGJpdHMuXG4gICAgICogQGNvbnN0YW50XG4gICAgICovXG4gICAgYmxvY2tTaXplOiA1MTIsXG4gICAgLyoqXG4gICAgICogUmVzZXQgdGhlIGhhc2ggc3RhdGUuXG4gICAgICogQHJldHVybiB0aGlzXG4gICAgICovXG4gICAgcmVzZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5faCA9IHRoaXMuX2luaXQuc2xpY2UoMCk7XG4gICAgICAgIHRoaXMuX2J1ZmZlciA9IFtdO1xuICAgICAgICB0aGlzLl9sZW5ndGggPSAwO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIElucHV0IHNldmVyYWwgd29yZHMgdG8gdGhlIGhhc2guXG4gICAgICogQHBhcmFtIHtiaXRBcnJheXxTdHJpbmd9IGRhdGEgdGhlIGRhdGEgdG8gaGFzaC5cbiAgICAgKiBAcmV0dXJuIHRoaXNcbiAgICAgKi9cbiAgICB1cGRhdGU6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgZGF0YSA9IHNqY2wuY29kZWMudXRmOFN0cmluZy50b0JpdHMoZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGksIGIgPSAodGhpcy5fYnVmZmVyID0gc2pjbC5iaXRBcnJheS5jb25jYXQodGhpcy5fYnVmZmVyLCBkYXRhKSksIG9sID0gdGhpcy5fbGVuZ3RoLCBubCA9ICh0aGlzLl9sZW5ndGggPSBvbCArIHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGRhdGEpKTtcbiAgICAgICAgaWYgKG5sID4gOTAwNzE5OTI1NDc0MDk5MSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IHNqY2wuZXhjZXB0aW9uLmludmFsaWQoXCJDYW5ub3QgaGFzaCBtb3JlIHRoYW4gMl41MyAtIDEgYml0c1wiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIFVpbnQzMkFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB2YXIgYyA9IG5ldyBVaW50MzJBcnJheShiKTtcbiAgICAgICAgICAgIHZhciBqID0gMDtcbiAgICAgICAgICAgIGZvciAoaSA9IHRoaXMuYmxvY2tTaXplICsgb2wgLSAoKHRoaXMuYmxvY2tTaXplICsgb2wpICYgKHRoaXMuYmxvY2tTaXplIC0gMSkpOyBpIDw9IG5sOyBpICs9IHRoaXMuYmxvY2tTaXplKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmxvY2soYy5zdWJhcnJheSgxNiAqIGosIDE2ICogKGogKyAxKSkpO1xuICAgICAgICAgICAgICAgIGogKz0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGIuc3BsaWNlKDAsIDE2ICogaik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSB0aGlzLmJsb2NrU2l6ZSArIG9sIC0gKCh0aGlzLmJsb2NrU2l6ZSArIG9sKSAmICh0aGlzLmJsb2NrU2l6ZSAtIDEpKTsgaSA8PSBubDsgaSArPSB0aGlzLmJsb2NrU2l6ZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGIuc3BsaWNlKDAsIDE2KSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcbiAgICAvKipcbiAgICAgKiBDb21wbGV0ZSBoYXNoaW5nIGFuZCBvdXRwdXQgdGhlIGhhc2ggdmFsdWUuXG4gICAgICogQHJldHVybiB7Yml0QXJyYXl9IFRoZSBoYXNoIHZhbHVlLCBhbiBhcnJheSBvZiA1IGJpZy1lbmRpYW4gd29yZHMuIFRPRE9cbiAgICAgKi9cbiAgICBmaW5hbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaSwgYiA9IHRoaXMuX2J1ZmZlciwgaCA9IHRoaXMuX2g7XG4gICAgICAgIC8vIFJvdW5kIG91dCBhbmQgcHVzaCB0aGUgYnVmZmVyXG4gICAgICAgIGIgPSBzamNsLmJpdEFycmF5LmNvbmNhdChiLCBbc2pjbC5iaXRBcnJheS5wYXJ0aWFsKDEsIDEpXSk7XG4gICAgICAgIC8vIFJvdW5kIG91dCB0aGUgYnVmZmVyIHRvIGEgbXVsdGlwbGUgb2YgMTYgd29yZHMsIGxlc3MgdGhlIDIgbGVuZ3RoIHdvcmRzLlxuICAgICAgICBmb3IgKGkgPSBiLmxlbmd0aCArIDI7IGkgJiAxNTsgaSsrKSB7XG4gICAgICAgICAgICBiLnB1c2goMCk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gYXBwZW5kIHRoZSBsZW5ndGhcbiAgICAgICAgYi5wdXNoKE1hdGguZmxvb3IodGhpcy5fbGVuZ3RoIC8gMHgxMDAwMDAwMDApKTtcbiAgICAgICAgYi5wdXNoKHRoaXMuX2xlbmd0aCB8IDApO1xuICAgICAgICB3aGlsZSAoYi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuX2Jsb2NrKGIuc3BsaWNlKDAsIDE2KSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICByZXR1cm4gaDtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFRoZSBTSEEtMSBpbml0aWFsaXphdGlvbiB2ZWN0b3IuXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfaW5pdDogWzB4Njc0NTIzMDEsIDB4ZWZjZGFiODksIDB4OThiYWRjZmUsIDB4MTAzMjU0NzYsIDB4YzNkMmUxZjBdLFxuICAgIC8qKlxuICAgICAqIFRoZSBTSEEtMSBoYXNoIGtleS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9rZXk6IFsweDVhODI3OTk5LCAweDZlZDllYmExLCAweDhmMWJiY2RjLCAweGNhNjJjMWQ2XSxcbiAgICAvKipcbiAgICAgKiBUaGUgU0hBLTEgbG9naWNhbCBmdW5jdGlvbnMgZigwKSwgZigxKSwgLi4uLCBmKDc5KS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9mOiBmdW5jdGlvbiAodCwgYiwgYywgZCkge1xuICAgICAgICBpZiAodCA8PSAxOSkge1xuICAgICAgICAgICAgcmV0dXJuIChiICYgYykgfCAofmIgJiBkKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0IDw9IDM5KSB7XG4gICAgICAgICAgICByZXR1cm4gYiBeIGMgXiBkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHQgPD0gNTkpIHtcbiAgICAgICAgICAgIHJldHVybiAoYiAmIGMpIHwgKGIgJiBkKSB8IChjICYgZCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodCA8PSA3OSkge1xuICAgICAgICAgICAgcmV0dXJuIGIgXiBjIF4gZDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLyoqXG4gICAgICogQ2lyY3VsYXIgbGVmdC1zaGlmdCBvcGVyYXRvci5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9TOiBmdW5jdGlvbiAobiwgeCkge1xuICAgICAgICByZXR1cm4gKHggPDwgbikgfCAoeCA+Pj4gKDMyIC0gbikpO1xuICAgIH0sXG4gICAgLyoqXG4gICAgICogUGVyZm9ybSBvbmUgY3ljbGUgb2YgU0hBLTEuXG4gICAgICogQHBhcmFtIHtVaW50MzJBcnJheXxiaXRBcnJheX0gd29yZHMgb25lIGJsb2NrIG9mIHdvcmRzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2Jsb2NrOiBmdW5jdGlvbiAod29yZHMpIHtcbiAgICAgICAgdmFyIHQsIHRtcCwgYSwgYiwgYywgZCwgZSwgaCA9IHRoaXMuX2g7XG4gICAgICAgIHZhciB3O1xuICAgICAgICBpZiAodHlwZW9mIFVpbnQzMkFycmF5ICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdvcmRzIGlzIHBhc3NlZCB0byBfYmxvY2ssIGl0IGhhcyAxNiBlbGVtZW50cy4gU0hBMSBfYmxvY2tcbiAgICAgICAgICAgIC8vIGZ1bmN0aW9uIGV4dGVuZHMgd29yZHMgd2l0aCBuZXcgZWxlbWVudHMgKGF0IHRoZSBlbmQgdGhlcmUgYXJlIDgwIGVsZW1lbnRzKS5cbiAgICAgICAgICAgIC8vIFRoZSBwcm9ibGVtIGlzIHRoYXQgaWYgd2UgdXNlIFVpbnQzMkFycmF5IGluc3RlYWQgb2YgQXJyYXksXG4gICAgICAgICAgICAvLyB0aGUgbGVuZ3RoIG9mIFVpbnQzMkFycmF5IGNhbm5vdCBiZSBjaGFuZ2VkLiBUaHVzLCB3ZSByZXBsYWNlIHdvcmRzIHdpdGggYVxuICAgICAgICAgICAgLy8gbm9ybWFsIEFycmF5IGhlcmUuXG4gICAgICAgICAgICB3ID0gQXJyYXkoODApOyAvLyBkbyBub3QgdXNlIFVpbnQzMkFycmF5IGhlcmUgYXMgdGhlIGluc3RhbnRpYXRpb24gaXMgc2xvd2VyXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IDE2OyBqKyspIHtcbiAgICAgICAgICAgICAgICB3W2pdID0gd29yZHNbal07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB3ID0gd29yZHM7XG4gICAgICAgIH1cbiAgICAgICAgYSA9IGhbMF07XG4gICAgICAgIGIgPSBoWzFdO1xuICAgICAgICBjID0gaFsyXTtcbiAgICAgICAgZCA9IGhbM107XG4gICAgICAgIGUgPSBoWzRdO1xuICAgICAgICBmb3IgKHQgPSAwOyB0IDw9IDc5OyB0KyspIHtcbiAgICAgICAgICAgIGlmICh0ID49IDE2KSB7XG4gICAgICAgICAgICAgICAgd1t0XSA9IHRoaXMuX1MoMSwgd1t0IC0gM10gXiB3W3QgLSA4XSBeIHdbdCAtIDE0XSBeIHdbdCAtIDE2XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0bXAgPSAodGhpcy5fUyg1LCBhKSArIHRoaXMuX2YodCwgYiwgYywgZCkgKyBlICsgd1t0XSArIHRoaXMuX2tleVtNYXRoLmZsb29yKHQgLyAyMCldKSB8IDA7XG4gICAgICAgICAgICBlID0gZDtcbiAgICAgICAgICAgIGQgPSBjO1xuICAgICAgICAgICAgYyA9IHRoaXMuX1MoMzAsIGIpO1xuICAgICAgICAgICAgYiA9IGE7XG4gICAgICAgICAgICBhID0gdG1wO1xuICAgICAgICB9XG4gICAgICAgIGhbMF0gPSAoaFswXSArIGEpIHwgMDtcbiAgICAgICAgaFsxXSA9IChoWzFdICsgYikgfCAwO1xuICAgICAgICBoWzJdID0gKGhbMl0gKyBjKSB8IDA7XG4gICAgICAgIGhbM10gPSAoaFszXSArIGQpIHwgMDtcbiAgICAgICAgaFs0XSA9IChoWzRdICsgZSkgfCAwO1xuICAgIH0sXG59O1xuLyoqIEBmaWxlT3ZlcnZpZXcgQ0JDIG1vZGUgaW1wbGVtZW50YXRpb25cbiAqXG4gKiBAYXV0aG9yIEVtaWx5IFN0YXJrXG4gKiBAYXV0aG9yIE1pa2UgSGFtYnVyZ1xuICogQGF1dGhvciBEYW4gQm9uZWhcbiAqL1xuLyoqXG4gKiBEYW5nZXJvdXM6IENCQyBtb2RlIHdpdGggUEtDUyM1IHBhZGRpbmcuXG4gKiBAbmFtZXNwYWNlXG4gKiBAYXV0aG9yIEVtaWx5IFN0YXJrXG4gKiBAYXV0aG9yIE1pa2UgSGFtYnVyZ1xuICogQGF1dGhvciBEYW4gQm9uZWhcbiAqL1xuc2pjbC5tb2RlLmNiYyA9IHtcbiAgICAvKiogVGhlIG5hbWUgb2YgdGhlIG1vZGUuXG4gICAgICogQGNvbnN0YW50XG4gICAgICovXG4gICAgbmFtZTogXCJjYmNcIixcbiAgICAvKiogRW5jcnlwdCBpbiBDQkMgbW9kZSB3aXRoIFBLQ1MjNSBwYWRkaW5nLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcnAgVGhlIGJsb2NrIGNpcGhlci4gIEl0IG11c3QgaGF2ZSBhIGJsb2NrIHNpemUgb2YgMTYgYnl0ZXMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gcGxhaW50ZXh0IFRoZSBwbGFpbnRleHQgZGF0YS5cbiAgICAgKiBAcGFyYW0ge2JpdEFycmF5fSBpdiBUaGUgaW5pdGlhbGl6YXRpb24gdmFsdWUuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gW2FkYXRhPVtdXSBUaGUgYXV0aGVudGljYXRlZCBkYXRhLiAgTXVzdCBiZSBlbXB0eS5cbiAgICAgKiBAcGFyYW0ge2Jvb2xlYW59IHVzZVBhZGRpbmcgVHJ1ZSBpZiBwYWRkaW5nIHNoYWxsIGJlIHVzZWQsIGZhbHNlIG90aGVyd2lzZS5cbiAgICAgKiBAcmV0dXJuIFRoZSBlbmNyeXB0ZWQgZGF0YSwgYW4gYXJyYXkgb2YgYnl0ZXMuXG4gICAgICogQHRocm93cyB7c2pjbC5leGNlcHRpb24uaW52YWxpZH0gaWYgdGhlIElWIGlzbid0IGV4YWN0bHkgMTI4IGJpdHMsIG9yIGlmIGFueSBhZGF0YSBpcyBzcGVjaWZpZWQuXG4gICAgICovXG4gICAgZW5jcnlwdDogZnVuY3Rpb24gKHBycCwgcGxhaW50ZXh0LCBpdiwgYWRhdGEsIHVzZVBhZGRpbmcpIHtcbiAgICAgICAgaWYgKGFkYXRhICYmIGFkYXRhLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IHNqY2wuZXhjZXB0aW9uLmludmFsaWQoXCJjYmMgY2FuJ3QgYXV0aGVudGljYXRlIGRhdGFcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGl2KSAhPT0gMTI4KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uaW52YWxpZChcImNiYyBpdiBtdXN0IGJlIDEyOCBiaXRzXCIpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBpLCB3ID0gc2pjbC5iaXRBcnJheSwgeG9yID0gdy5feG9yNCwgYmwgPSB3LmJpdExlbmd0aChwbGFpbnRleHQpLCBicCA9IDAsIG91dHB1dCA9IFtdO1xuICAgICAgICBpZiAoYmwgJiA3KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uaW52YWxpZChcInBrY3MjNSBwYWRkaW5nIG9ubHkgd29ya3MgZm9yIG11bHRpcGxlcyBvZiBhIGJ5dGVcIik7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChpID0gMDsgYnAgKyAxMjggPD0gYmw7IGkgKz0gNCwgYnAgKz0gMTI4KSB7XG4gICAgICAgICAgICAvKiBFbmNyeXB0IGEgbm9uLWZpbmFsIGJsb2NrICovXG4gICAgICAgICAgICBpdiA9IHBycC5lbmNyeXB0KHhvcihpdiwgcGxhaW50ZXh0LnNsaWNlKGksIGkgKyA0KSkpO1xuICAgICAgICAgICAgLy8gVFVUQU86IHJlcGxhY2VkIHNwbGljZSB3aXRoIHB1c2ggYmVjYXVzZSBvZiBwZXJmb3JtYW5jZSBidWcgaW4gY2hyb21pdW1cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTkxNDM5NSZjYW49MSZxPXNwbGljZSZjb2xzcGVjPUlEJTIwUHJpJTIwTSUyMFN0YXJzJTIwUmVsZWFzZUJsb2NrJTIwQ29tcG9uZW50JTIwU3RhdHVzJTIwT3duZXIlMjBTdW1tYXJ5JTIwT1MlMjBNb2RpZmllZFxuICAgICAgICAgICAgLy9vdXRwdXQuc3BsaWNlKGksIDAsIGl2WzBdLCBpdlsxXSwgaXZbMl0sIGl2WzNdKTtcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKGl2WzBdLCBpdlsxXSwgaXZbMl0sIGl2WzNdKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodXNlUGFkZGluZykge1xuICAgICAgICAgICAgLyogQ29uc3RydWN0IHRoZSBwYWQuICovXG4gICAgICAgICAgICBibCA9ICgxNiAtICgoYmwgPj4gMykgJiAxNSkpICogMHgxMDEwMTAxO1xuICAgICAgICAgICAgLyogUGFkIGFuZCBlbmNyeXB0LiAqL1xuICAgICAgICAgICAgaXYgPSBwcnAuZW5jcnlwdCh4b3IoaXYsIHcuY29uY2F0KHBsYWludGV4dCwgW2JsLCBibCwgYmwsIGJsXSkuc2xpY2UoaSwgaSArIDQpKSk7XG4gICAgICAgICAgICAvLyBUVVRBTzogcmVwbGFjZWQgc3BsaWNlIHdpdGggcHVzaCBiZWNhdXNlIG9mIHBlcmZvcm1hbmNlIGJ1ZyBpbiBjaHJvbWl1bVxuICAgICAgICAgICAgLy8gb3V0cHV0LnNwbGljZShpLCAwLCBpdlswXSwgaXZbMV0sIGl2WzJdLCBpdlszXSk7XG4gICAgICAgICAgICBvdXRwdXQucHVzaChpdlswXSwgaXZbMV0sIGl2WzJdLCBpdlszXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9LFxuICAgIC8qKiBEZWNyeXB0IGluIENCQyBtb2RlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcnAgVGhlIGJsb2NrIGNpcGhlci4gIEl0IG11c3QgaGF2ZSBhIGJsb2NrIHNpemUgb2YgMTYgYnl0ZXMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gY2lwaGVydGV4dCBUaGUgY2lwaGVydGV4dCBkYXRhLlxuICAgICAqIEBwYXJhbSB7Yml0QXJyYXl9IGl2IFRoZSBpbml0aWFsaXphdGlvbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2JpdEFycmF5fSBbYWRhdGE9W11dIFRoZSBhdXRoZW50aWNhdGVkIGRhdGEuICBJdCBtdXN0IGJlIGVtcHR5LlxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gdXNlUGFkZGluZyBUcnVlIGlmIHBhZGRpbmcgc2hhbGwgYmUgdXNlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgICAqIEByZXR1cm4gVGhlIGRlY3J5cHRlZCBkYXRhLCBhbiBhcnJheSBvZiBieXRlcy5cbiAgICAgKiBAdGhyb3dzIHtzamNsLmV4Y2VwdGlvbi5pbnZhbGlkfSBpZiB0aGUgSVYgaXNuJ3QgZXhhY3RseSAxMjggYml0cywgb3IgaWYgYW55IGFkYXRhIGlzIHNwZWNpZmllZC5cbiAgICAgKiBAdGhyb3dzIHtzamNsLmV4Y2VwdGlvbi5jb3JydXB0fSBpZiBpZiB0aGUgbWVzc2FnZSBpcyBjb3JydXB0LlxuICAgICAqL1xuICAgIGRlY3J5cHQ6IGZ1bmN0aW9uIChwcnAsIGNpcGhlcnRleHQsIGl2LCBhZGF0YSwgdXNlUGFkZGluZykge1xuICAgICAgICBpZiAoYWRhdGEgJiYgYWRhdGEubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uaW52YWxpZChcImNiYyBjYW4ndCBhdXRoZW50aWNhdGUgZGF0YVwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoaXYpICE9PSAxMjgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5pbnZhbGlkKFwiY2JjIGl2IG11c3QgYmUgMTI4IGJpdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGNpcGhlcnRleHQpICYgMTI3IHx8ICFjaXBoZXJ0ZXh0Lmxlbmd0aCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IHNqY2wuZXhjZXB0aW9uLmNvcnJ1cHQoXCJjYmMgY2lwaGVydGV4dCBtdXN0IGJlIGEgcG9zaXRpdmUgbXVsdGlwbGUgb2YgdGhlIGJsb2NrIHNpemVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGksIHcgPSBzamNsLmJpdEFycmF5LCB4b3IgPSB3Ll94b3I0LCBiaSwgYm8sIG91dHB1dCA9IFtdO1xuICAgICAgICBhZGF0YSA9IGFkYXRhIHx8IFtdO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2lwaGVydGV4dC5sZW5ndGg7IGkgKz0gNCkge1xuICAgICAgICAgICAgYmkgPSBjaXBoZXJ0ZXh0LnNsaWNlKGksIGkgKyA0KTtcbiAgICAgICAgICAgIGJvID0geG9yKGl2LCBwcnAuZGVjcnlwdChiaSkpO1xuICAgICAgICAgICAgLy8gVFVUQU86IHJlcGxhY2VkIHNwbGljZSB3aXRoIHB1c2ggYmVjYXVzZSBvZiBwZXJmb3JtYW5jZSBidWcgaW4gY2hyb21pdW1cbiAgICAgICAgICAgIC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTkxNDM5NSZjYW49MSZxPXNwbGljZSZjb2xzcGVjPUlEJTIwUHJpJTIwTSUyMFN0YXJzJTIwUmVsZWFzZUJsb2NrJTIwQ29tcG9uZW50JTIwU3RhdHVzJTIwT3duZXIlMjBTdW1tYXJ5JTIwT1MlMjBNb2RpZmllZFxuICAgICAgICAgICAgLy9vdXRwdXQuc3BsaWNlKGksIDAsIGJvWzBdLCBib1sxXSwgYm9bMl0sIGJvWzNdKTtcbiAgICAgICAgICAgIG91dHB1dC5wdXNoKGJvWzBdLCBib1sxXSwgYm9bMl0sIGJvWzNdKTtcbiAgICAgICAgICAgIGl2ID0gYmk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZVBhZGRpbmcpIHtcbiAgICAgICAgICAgIC8qIGNoZWNrIGFuZCByZW1vdmUgdGhlIHBhZCAqL1xuICAgICAgICAgICAgYmkgPSBvdXRwdXRbaSAtIDFdICYgMjU1O1xuICAgICAgICAgICAgaWYgKGJpID09PSAwIHx8IGJpID4gMTYpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uY29ycnVwdChcInBrY3MjNSBwYWRkaW5nIGNvcnJ1cHRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibyA9IGJpICogMHgxMDEwMTAxO1xuICAgICAgICAgICAgaWYgKCF3LmVxdWFsKHcuYml0U2xpY2UoW2JvLCBibywgYm8sIGJvXSwgMCwgYmkgKiA4KSwgdy5iaXRTbGljZShvdXRwdXQsIG91dHB1dC5sZW5ndGggKiAzMiAtIGJpICogOCwgb3V0cHV0Lmxlbmd0aCAqIDMyKSkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uY29ycnVwdChcInBrY3MjNSBwYWRkaW5nIGNvcnJ1cHRcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdy5iaXRTbGljZShvdXRwdXQsIDAsIG91dHB1dC5sZW5ndGggKiAzMiAtIGJpICogOCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgICAgICB9XG4gICAgfSxcbn07XG4vKiogQGZpbGVPdmVydmlldyBHQ00gbW9kZSBpbXBsZW1lbnRhdGlvbi5cbiAqXG4gKiBAYXV0aG9yIEp1aG8gVsOkaMOkLUhlcnR0dWFcbiAqL1xuLyoqXG4gKiBHYWxvaXMvQ291bnRlciBtb2RlLlxuICogQG5hbWVzcGFjZVxuICovXG5zamNsLm1vZGUuZ2NtID0ge1xuICAgIC8qKlxuICAgICAqIFRoZSBuYW1lIG9mIHRoZSBtb2RlLlxuICAgICAqIEBjb25zdGFudFxuICAgICAqL1xuICAgIG5hbWU6IFwiZ2NtXCIsXG4gICAgLyoqIEVuY3J5cHQgaW4gR0NNIG1vZGUuXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcmYgVGhlIHBzZXVkb3JhbmRvbSBmdW5jdGlvbi4gIEl0IG11c3QgaGF2ZSBhIGJsb2NrIHNpemUgb2YgMTYgYnl0ZXMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gcGxhaW50ZXh0IFRoZSBwbGFpbnRleHQgZGF0YS5cbiAgICAgKiBAcGFyYW0ge2JpdEFycmF5fSBpdiBUaGUgaW5pdGlhbGl6YXRpb24gdmFsdWUuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gW2FkYXRhPVtdXSBUaGUgYXV0aGVudGljYXRlZCBkYXRhLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbdGxlbj0xMjhdIFRoZSBkZXNpcmVkIHRhZyBsZW5ndGgsIGluIGJpdHMuXG4gICAgICogQHJldHVybiB7Yml0QXJyYXl9IFRoZSBlbmNyeXB0ZWQgZGF0YSwgYW4gYXJyYXkgb2YgYnl0ZXMuXG4gICAgICovXG4gICAgZW5jcnlwdDogZnVuY3Rpb24gKHByZiwgcGxhaW50ZXh0LCBpdiwgYWRhdGEsIHRsZW4pIHtcbiAgICAgICAgdmFyIG91dCwgZGF0YSA9IHBsYWludGV4dC5zbGljZSgwKSwgdyA9IHNqY2wuYml0QXJyYXk7XG4gICAgICAgIHRsZW4gPSB0bGVuIHx8IDEyODtcbiAgICAgICAgYWRhdGEgPSBhZGF0YSB8fCBbXTtcbiAgICAgICAgLy8gZW5jcnlwdCBhbmQgdGFnXG4gICAgICAgIG91dCA9IHNqY2wubW9kZS5nY20uX2N0ck1vZGUodHJ1ZSwgcHJmLCBkYXRhLCBhZGF0YSwgaXYsIHRsZW4pO1xuICAgICAgICByZXR1cm4gdy5jb25jYXQob3V0LmRhdGEsIG91dC50YWcpO1xuICAgIH0sXG4gICAgLyoqIERlY3J5cHQgaW4gR0NNIG1vZGUuXG4gICAgICogQHN0YXRpY1xuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwcmYgVGhlIHBzZXVkb3JhbmRvbSBmdW5jdGlvbi4gIEl0IG11c3QgaGF2ZSBhIGJsb2NrIHNpemUgb2YgMTYgYnl0ZXMuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gY2lwaGVydGV4dCBUaGUgY2lwaGVydGV4dCBkYXRhLlxuICAgICAqIEBwYXJhbSB7Yml0QXJyYXl9IGl2IFRoZSBpbml0aWFsaXphdGlvbiB2YWx1ZS5cbiAgICAgKiBAcGFyYW0ge2JpdEFycmF5fSBbYWRhdGE9W11dIFRoZSBhdXRoZW50aWNhdGVkIGRhdGEuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IFt0bGVuPTEyOF0gVGhlIGRlc2lyZWQgdGFnIGxlbmd0aCwgaW4gYml0cy5cbiAgICAgKiBAcmV0dXJuIHtiaXRBcnJheX0gVGhlIGRlY3J5cHRlZCBkYXRhLlxuICAgICAqL1xuICAgIGRlY3J5cHQ6IGZ1bmN0aW9uIChwcmYsIGNpcGhlcnRleHQsIGl2LCBhZGF0YSwgdGxlbikge1xuICAgICAgICB2YXIgb3V0LCBkYXRhID0gY2lwaGVydGV4dC5zbGljZSgwKSwgdGFnLCB3ID0gc2pjbC5iaXRBcnJheSwgbCA9IHcuYml0TGVuZ3RoKGRhdGEpO1xuICAgICAgICB0bGVuID0gdGxlbiB8fCAxMjg7XG4gICAgICAgIGFkYXRhID0gYWRhdGEgfHwgW107XG4gICAgICAgIC8vIFNsaWNlIHRhZyBvdXQgb2YgZGF0YVxuICAgICAgICBpZiAodGxlbiA8PSBsKSB7XG4gICAgICAgICAgICB0YWcgPSB3LmJpdFNsaWNlKGRhdGEsIGwgLSB0bGVuKTtcbiAgICAgICAgICAgIGRhdGEgPSB3LmJpdFNsaWNlKGRhdGEsIDAsIGwgLSB0bGVuKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRhZyA9IGRhdGE7XG4gICAgICAgICAgICBkYXRhID0gW107XG4gICAgICAgIH1cbiAgICAgICAgLy8gZGVjcnlwdCBhbmQgdGFnXG4gICAgICAgIG91dCA9IHNqY2wubW9kZS5nY20uX2N0ck1vZGUoZmFsc2UsIHByZiwgZGF0YSwgYWRhdGEsIGl2LCB0bGVuKTtcbiAgICAgICAgaWYgKCF3LmVxdWFsKG91dC50YWcsIHRhZykpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5jb3JydXB0KFwiZ2NtOiB0YWcgZG9lc24ndCBtYXRjaFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3V0LmRhdGE7XG4gICAgfSxcbiAgICAvKiBDb21wdXRlIHRoZSBnYWxvaXMgbXVsdGlwbGljYXRpb24gb2YgWCBhbmQgWVxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dhbG9pc011bHRpcGx5OiBmdW5jdGlvbiAoeCwgeSkge1xuICAgICAgICB2YXIgaSwgaiwgeGksIFppLCBWaSwgbHNiX1ZpLCB3ID0gc2pjbC5iaXRBcnJheSwgeG9yID0gdy5feG9yNDtcbiAgICAgICAgWmkgPSBbMCwgMCwgMCwgMF07XG4gICAgICAgIFZpID0geS5zbGljZSgwKTtcbiAgICAgICAgLy8gQmxvY2sgc2l6ZSBpcyAxMjggYml0cywgcnVuIDEyOCB0aW1lcyB0byBnZXQgWl8xMjhcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDEyODsgaSsrKSB7XG4gICAgICAgICAgICB4aSA9ICh4W01hdGguZmxvb3IoaSAvIDMyKV0gJiAoMSA8PCAoMzEgLSAoaSAlIDMyKSkpKSAhPT0gMDtcbiAgICAgICAgICAgIGlmICh4aSkge1xuICAgICAgICAgICAgICAgIC8vIFpfaSsxID0gWl9pIF4gVl9pXG4gICAgICAgICAgICAgICAgWmkgPSB4b3IoWmksIFZpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFN0b3JlIHRoZSB2YWx1ZSBvZiBMU0IoVl9pKVxuICAgICAgICAgICAgbHNiX1ZpID0gKFZpWzNdICYgMSkgIT09IDA7XG4gICAgICAgICAgICAvLyBWX2krMSA9IFZfaSA+PiAxXG4gICAgICAgICAgICBmb3IgKGogPSAzOyBqID4gMDsgai0tKSB7XG4gICAgICAgICAgICAgICAgVmlbal0gPSAoVmlbal0gPj4+IDEpIHwgKChWaVtqIC0gMV0gJiAxKSA8PCAzMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBWaVswXSA9IFZpWzBdID4+PiAxO1xuICAgICAgICAgICAgLy8gSWYgTFNCKFZfaSkgaXMgMSwgVl9pKzEgPSAoVl9pID4+IDEpIF4gUlxuICAgICAgICAgICAgaWYgKGxzYl9WaSkge1xuICAgICAgICAgICAgICAgIFZpWzBdID0gVmlbMF0gXiAoMHhlMSA8PCAyNCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFppO1xuICAgIH0sXG4gICAgX2doYXNoOiBmdW5jdGlvbiAoSCwgWTAsIGRhdGEpIHtcbiAgICAgICAgdmFyIFlpLCBpLCBsID0gZGF0YS5sZW5ndGg7XG4gICAgICAgIFlpID0gWTAuc2xpY2UoMCk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpICs9IDQpIHtcbiAgICAgICAgICAgIFlpWzBdIF49IDB4ZmZmZmZmZmYgJiBkYXRhW2ldO1xuICAgICAgICAgICAgWWlbMV0gXj0gMHhmZmZmZmZmZiAmIGRhdGFbaSArIDFdO1xuICAgICAgICAgICAgWWlbMl0gXj0gMHhmZmZmZmZmZiAmIGRhdGFbaSArIDJdO1xuICAgICAgICAgICAgWWlbM10gXj0gMHhmZmZmZmZmZiAmIGRhdGFbaSArIDNdO1xuICAgICAgICAgICAgWWkgPSBzamNsLm1vZGUuZ2NtLl9nYWxvaXNNdWx0aXBseShZaSwgSCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFlpO1xuICAgIH0sXG4gICAgLyoqIEdDTSBDVFIgbW9kZS5cbiAgICAgKiBFbmNyeXB0IG9yIGRlY3J5cHQgZGF0YSBhbmQgdGFnIHdpdGggdGhlIHByZiBpbiBHQ00tc3R5bGUgQ1RSIG1vZGUuXG4gICAgICogQHBhcmFtIHtCb29sZWFufSBlbmNyeXB0IFRydWUgaWYgZW5jcnlwdCwgZmFsc2UgaWYgZGVjcnlwdC5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gcHJmIFRoZSBQUkYuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gZGF0YSBUaGUgZGF0YSB0byBiZSBlbmNyeXB0ZWQgb3IgZGVjcnlwdGVkLlxuICAgICAqIEBwYXJhbSB7Yml0QXJyYXl9IGl2IFRoZSBpbml0aWFsaXphdGlvbiB2ZWN0b3IuXG4gICAgICogQHBhcmFtIHtiaXRBcnJheX0gYWRhdGEgVGhlIGFzc29jaWF0ZWQgZGF0YSB0byBiZSB0YWdnZWQuXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IHRsZW4gVGhlIGxlbmd0aCBvZiB0aGUgdGFnLCBpbiBiaXRzLlxuICAgICAqL1xuICAgIF9jdHJNb2RlOiBmdW5jdGlvbiAoZW5jcnlwdCwgcHJmLCBkYXRhLCBhZGF0YSwgaXYsIHRsZW4pIHtcbiAgICAgICAgdmFyIEgsIEowLCBTMCwgZW5jLCBpLCBjdHIsIHRhZywgbGFzdCwgbCwgYmwsIGFibCwgaXZibCwgdyA9IHNqY2wuYml0QXJyYXk7XG4gICAgICAgIC8vIENhbGN1bGF0ZSBkYXRhIGxlbmd0aHNcbiAgICAgICAgbCA9IGRhdGEubGVuZ3RoO1xuICAgICAgICBibCA9IHcuYml0TGVuZ3RoKGRhdGEpO1xuICAgICAgICBhYmwgPSB3LmJpdExlbmd0aChhZGF0YSk7XG4gICAgICAgIGl2YmwgPSB3LmJpdExlbmd0aChpdik7XG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgcGFyYW1ldGVyc1xuICAgICAgICBIID0gcHJmLmVuY3J5cHQoWzAsIDAsIDAsIDBdKTtcbiAgICAgICAgaWYgKGl2YmwgPT09IDk2KSB7XG4gICAgICAgICAgICBKMCA9IGl2LnNsaWNlKDApO1xuICAgICAgICAgICAgSjAgPSB3LmNvbmNhdChKMCwgWzFdKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIEowID0gc2pjbC5tb2RlLmdjbS5fZ2hhc2goSCwgWzAsIDAsIDAsIDBdLCBpdik7XG4gICAgICAgICAgICBKMCA9IHNqY2wubW9kZS5nY20uX2doYXNoKEgsIEowLCBbMCwgMCwgTWF0aC5mbG9vcihpdmJsIC8gMHgxMDAwMDAwMDApLCBpdmJsICYgMHhmZmZmZmZmZl0pO1xuICAgICAgICB9XG4gICAgICAgIFMwID0gc2pjbC5tb2RlLmdjbS5fZ2hhc2goSCwgWzAsIDAsIDAsIDBdLCBhZGF0YSk7XG4gICAgICAgIC8vIEluaXRpYWxpemUgY3RyIGFuZCB0YWdcbiAgICAgICAgY3RyID0gSjAuc2xpY2UoMCk7XG4gICAgICAgIHRhZyA9IFMwLnNsaWNlKDApO1xuICAgICAgICAvLyBJZiBkZWNyeXB0aW5nLCBjYWxjdWxhdGUgaGFzaFxuICAgICAgICBpZiAoIWVuY3J5cHQpIHtcbiAgICAgICAgICAgIHRhZyA9IHNqY2wubW9kZS5nY20uX2doYXNoKEgsIFMwLCBkYXRhKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBFbmNyeXB0IGFsbCB0aGUgZGF0YVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSArPSA0KSB7XG4gICAgICAgICAgICBjdHJbM10rKztcbiAgICAgICAgICAgIGVuYyA9IHByZi5lbmNyeXB0KGN0cik7XG4gICAgICAgICAgICBkYXRhW2ldIF49IGVuY1swXTtcbiAgICAgICAgICAgIGRhdGFbaSArIDFdIF49IGVuY1sxXTtcbiAgICAgICAgICAgIGRhdGFbaSArIDJdIF49IGVuY1syXTtcbiAgICAgICAgICAgIGRhdGFbaSArIDNdIF49IGVuY1szXTtcbiAgICAgICAgfVxuICAgICAgICBkYXRhID0gdy5jbGFtcChkYXRhLCBibCk7XG4gICAgICAgIC8vIElmIGVuY3J5cHRpbmcsIGNhbGN1bGF0ZSBoYXNoXG4gICAgICAgIGlmIChlbmNyeXB0KSB7XG4gICAgICAgICAgICB0YWcgPSBzamNsLm1vZGUuZ2NtLl9naGFzaChILCBTMCwgZGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQ2FsY3VsYXRlIGxhc3QgYmxvY2sgZnJvbSBiaXQgbGVuZ3RocywgdWdseSBiZWNhdXNlIGJpdHdpc2Ugb3BlcmF0aW9ucyBhcmUgMzItYml0XG4gICAgICAgIGxhc3QgPSBbTWF0aC5mbG9vcihhYmwgLyAweDEwMDAwMDAwMCksIGFibCAmIDB4ZmZmZmZmZmYsIE1hdGguZmxvb3IoYmwgLyAweDEwMDAwMDAwMCksIGJsICYgMHhmZmZmZmZmZl07XG4gICAgICAgIC8vIENhbGN1bGF0ZSB0aGUgZmluYWwgdGFnIGJsb2NrXG4gICAgICAgIHRhZyA9IHNqY2wubW9kZS5nY20uX2doYXNoKEgsIHRhZywgbGFzdCk7XG4gICAgICAgIGVuYyA9IHByZi5lbmNyeXB0KEowKTtcbiAgICAgICAgdGFnWzBdIF49IGVuY1swXTtcbiAgICAgICAgdGFnWzFdIF49IGVuY1sxXTtcbiAgICAgICAgdGFnWzJdIF49IGVuY1syXTtcbiAgICAgICAgdGFnWzNdIF49IGVuY1szXTtcbiAgICAgICAgcmV0dXJuIHsgdGFnOiB3LmJpdFNsaWNlKHRhZywgMCwgdGxlbiksIGRhdGE6IGRhdGEgfTtcbiAgICB9LFxufTtcbi8qKiBAZmlsZU92ZXJ2aWV3IEhNQUMgaW1wbGVtZW50YXRpb24uXG4gKlxuICogQGF1dGhvciBFbWlseSBTdGFya1xuICogQGF1dGhvciBNaWtlIEhhbWJ1cmdcbiAqIEBhdXRob3IgRGFuIEJvbmVoXG4gKi9cbi8qKiBITUFDIHdpdGggdGhlIHNwZWNpZmllZCBoYXNoIGZ1bmN0aW9uLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge2JpdEFycmF5fSBrZXkgdGhlIGtleSBmb3IgSE1BQy5cbiAqIEBwYXJhbSB7T2JqZWN0fSBbSGFzaD1zamNsLmhhc2guc2hhMjU2XSBUaGUgaGFzaCBmdW5jdGlvbiB0byB1c2UuXG4gKi9cbnNqY2wubWlzYy5obWFjID0gZnVuY3Rpb24gKGtleSwgSGFzaCkge1xuICAgIHRoaXMuX2hhc2ggPSBIYXNoID0gSGFzaCB8fCBzamNsLmhhc2guc2hhMjU2O1xuICAgIHZhciBleEtleSA9IFtbXSwgW11dLCBpLCBicyA9IEhhc2gucHJvdG90eXBlLmJsb2NrU2l6ZSAvIDMyO1xuICAgIHRoaXMuX2Jhc2VIYXNoID0gW25ldyBIYXNoKCksIG5ldyBIYXNoKCldO1xuICAgIGlmIChrZXkubGVuZ3RoID4gYnMpIHtcbiAgICAgICAga2V5ID0gSGFzaC5oYXNoKGtleSk7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBiczsgaSsrKSB7XG4gICAgICAgIGV4S2V5WzBdW2ldID0ga2V5W2ldIF4gMHgzNjM2MzYzNjtcbiAgICAgICAgZXhLZXlbMV1baV0gPSBrZXlbaV0gXiAweDVjNWM1YzVjO1xuICAgIH1cbiAgICB0aGlzLl9iYXNlSGFzaFswXS51cGRhdGUoZXhLZXlbMF0pO1xuICAgIHRoaXMuX2Jhc2VIYXNoWzFdLnVwZGF0ZShleEtleVsxXSk7XG4gICAgdGhpcy5fcmVzdWx0SGFzaCA9IG5ldyBIYXNoKHRoaXMuX2Jhc2VIYXNoWzBdKTtcbn07XG4vKiogSE1BQyB3aXRoIHRoZSBzcGVjaWZpZWQgaGFzaCBmdW5jdGlvbi4gIEFsc28gY2FsbGVkIGVuY3J5cHQgc2luY2UgaXQncyBhIHByZi5cbiAqIEBwYXJhbSB7Yml0QXJyYXl8U3RyaW5nfSBkYXRhIFRoZSBkYXRhIHRvIG1hYy5cbiAqL1xuc2pjbC5taXNjLmhtYWMucHJvdG90eXBlLmVuY3J5cHQgPSBzamNsLm1pc2MuaG1hYy5wcm90b3R5cGUubWFjID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICBpZiAoIXRoaXMuX3VwZGF0ZWQpIHtcbiAgICAgICAgdGhpcy51cGRhdGUoZGF0YSk7XG4gICAgICAgIHJldHVybiB0aGlzLmRpZ2VzdChkYXRhKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5pbnZhbGlkKFwiZW5jcnlwdCBvbiBhbHJlYWR5IHVwZGF0ZWQgaG1hYyBjYWxsZWQhXCIpO1xuICAgIH1cbn07XG5zamNsLm1pc2MuaG1hYy5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5fcmVzdWx0SGFzaCA9IG5ldyB0aGlzLl9oYXNoKHRoaXMuX2Jhc2VIYXNoWzBdKTtcbiAgICB0aGlzLl91cGRhdGVkID0gZmFsc2U7XG59O1xuc2pjbC5taXNjLmhtYWMucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgdGhpcy5fdXBkYXRlZCA9IHRydWU7XG4gICAgdGhpcy5fcmVzdWx0SGFzaC51cGRhdGUoZGF0YSk7XG59O1xuc2pjbC5taXNjLmhtYWMucHJvdG90eXBlLmRpZ2VzdCA9IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgdyA9IHRoaXMuX3Jlc3VsdEhhc2guZmluYWxpemUoKSwgcmVzdWx0ID0gbmV3IHRoaXMuX2hhc2godGhpcy5fYmFzZUhhc2hbMV0pLnVwZGF0ZSh3KS5maW5hbGl6ZSgpO1xuICAgIHRoaXMucmVzZXQoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbi8qKiBAZmlsZU92ZXJ2aWV3IFJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICpcbiAqIEBhdXRob3IgRW1pbHkgU3RhcmtcbiAqIEBhdXRob3IgTWlrZSBIYW1idXJnXG4gKiBAYXV0aG9yIERhbiBCb25laFxuICogQGF1dGhvciBNaWNoYWVsIEJyb29rc1xuICogQGF1dGhvciBTdGV2ZSBUaG9tYXNcbiAqL1xuLyoqXG4gKiBAY2xhc3MgUmFuZG9tIG51bWJlciBnZW5lcmF0b3JcbiAqIEBkZXNjcmlwdGlvblxuICogPGI+VXNlIHNqY2wucmFuZG9tIGFzIGEgc2luZ2xldG9uIGZvciB0aGlzIGNsYXNzITwvYj5cbiAqIDxwPlxuICogVGhpcyByYW5kb20gbnVtYmVyIGdlbmVyYXRvciBpcyBhIGRlcml2YXRpdmUgb2YgRmVyZ3Vzb24gYW5kIFNjaG5laWVyJ3NcbiAqIGdlbmVyYXRvciBGb3J0dW5hLiAgSXQgY29sbGVjdHMgZW50cm9weSBmcm9tIHZhcmlvdXMgZXZlbnRzIGludG8gc2V2ZXJhbFxuICogcG9vbHMsIGltcGxlbWVudGVkIGJ5IHN0cmVhbWluZyBTSEEtMjU2IGluc3RhbmNlcy4gIEl0IGRpZmZlcnMgZnJvbVxuICogb3JkaW5hcnkgRm9ydHVuYSBpbiBhIGZldyB3YXlzLCB0aG91Z2guXG4gKiA8L3A+XG4gKlxuICogPHA+XG4gKiBNb3N0IGltcG9ydGFudGx5LCBpdCBoYXMgYW4gZW50cm9weSBlc3RpbWF0b3IuICBUaGlzIGlzIHByZXNlbnQgYmVjYXVzZVxuICogdGhlcmUgaXMgYSBzdHJvbmcgY29uZmxpY3QgaGVyZSBiZXR3ZWVuIG1ha2luZyB0aGUgZ2VuZXJhdG9yIGF2YWlsYWJsZVxuICogYXMgc29vbiBhcyBwb3NzaWJsZSwgYW5kIG1ha2luZyBzdXJlIHRoYXQgaXQgZG9lc24ndCBcInJ1biBvbiBlbXB0eVwiLlxuICogSW4gRm9ydHVuYSwgdGhlcmUgaXMgYSBzYXZlZCBzdGF0ZSBmaWxlLCBhbmQgdGhlIHN5c3RlbSBpcyBsaWtlbHkgdG8gaGF2ZVxuICogdGltZSB0byB3YXJtIHVwLlxuICogPC9wPlxuICpcbiAqIDxwPlxuICogU2Vjb25kLCBiZWNhdXNlIHVzZXJzIGFyZSB1bmxpa2VseSB0byBzdGF5IG9uIHRoZSBwYWdlIGZvciB2ZXJ5IGxvbmcsXG4gKiBhbmQgdG8gc3BlZWQgc3RhcnR1cCB0aW1lLCB0aGUgbnVtYmVyIG9mIHBvb2xzIGluY3JlYXNlcyBsb2dhcml0aG1pY2FsbHk6XG4gKiBhIG5ldyBwb29sIGlzIGNyZWF0ZWQgd2hlbiB0aGUgcHJldmlvdXMgb25lIGlzIGFjdHVhbGx5IHVzZWQgZm9yIGEgcmVzZWVkLlxuICogVGhpcyBnaXZlcyB0aGUgc2FtZSBhc3ltcHRvdGljIGd1YXJhbnRlZXMgYXMgRm9ydHVuYSwgYnV0IGdpdmVzIG1vcmVcbiAqIGVudHJvcHkgdG8gZWFybHkgcmVzZWVkcy5cbiAqIDwvcD5cbiAqXG4gKiA8cD5cbiAqIFRoZSBlbnRpcmUgbWVjaGFuaXNtIGhlcmUgZmVlbHMgcHJldHR5IGtsdW5reS4gIEZ1cnRoZXJtb3JlLCB0aGVyZSBhcmVcbiAqIHNldmVyYWwgaW1wcm92ZW1lbnRzIHRoYXQgc2hvdWxkIGJlIG1hZGUsIGluY2x1ZGluZyBzdXBwb3J0IGZvclxuICogZGVkaWNhdGVkIGNyeXB0b2dyYXBoaWMgZnVuY3Rpb25zIHRoYXQgbWF5IGJlIHByZXNlbnQgaW4gc29tZSBicm93c2VycztcbiAqIHN0YXRlIGZpbGVzIGluIGxvY2FsIHN0b3JhZ2U7IGNvb2tpZXMgY29udGFpbmluZyByYW5kb21uZXNzOyBldGMuICBTb1xuICogbG9vayBmb3IgaW1wcm92ZW1lbnRzIGluIGZ1dHVyZSB2ZXJzaW9ucy5cbiAqIDwvcD5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5zamNsLnBybmcgPSBmdW5jdGlvbiAoZGVmYXVsdFBhcmFub2lhKSB7XG4gICAgLyogcHJpdmF0ZSAqL1xuICAgIHRoaXMuX3Bvb2xzID0gW25ldyBzamNsLmhhc2guc2hhMjU2KCldO1xuICAgIHRoaXMuX3Bvb2xFbnRyb3B5ID0gWzBdO1xuICAgIHRoaXMuX3Jlc2VlZENvdW50ID0gMDtcbiAgICB0aGlzLl9yb2JpbnMgPSB7fTtcbiAgICB0aGlzLl9ldmVudElkID0gMDtcbiAgICB0aGlzLl9jb2xsZWN0b3JJZHMgPSB7fTtcbiAgICB0aGlzLl9jb2xsZWN0b3JJZE5leHQgPSAwO1xuICAgIHRoaXMuX3N0cmVuZ3RoID0gMDtcbiAgICB0aGlzLl9wb29sU3RyZW5ndGggPSAwO1xuICAgIHRoaXMuX25leHRSZXNlZWQgPSAwO1xuICAgIHRoaXMuX2tleSA9IFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXTtcbiAgICB0aGlzLl9jb3VudGVyID0gWzAsIDAsIDAsIDBdO1xuICAgIC8vIHRoaXMuX2NpcGhlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLl9kZWZhdWx0UGFyYW5vaWEgPSBkZWZhdWx0UGFyYW5vaWE7XG4gICAgLy8gLyogZXZlbnQgbGlzdGVuZXIgc3R1ZmYgKi9cbiAgICAvLyB0aGlzLl9jb2xsZWN0b3JzU3RhcnRlZCA9IGZhbHNlO1xuICAgIC8vIHRoaXMuX2NhbGxiYWNrcyA9IHtwcm9ncmVzczoge30sIHNlZWRlZDoge319O1xuICAgIC8vIHRoaXMuX2NhbGxiYWNrSSA9IDA7XG4gICAgLyogY29uc3RhbnRzICovXG4gICAgdGhpcy5fTk9UX1JFQURZID0gMDtcbiAgICB0aGlzLl9SRUFEWSA9IDE7XG4gICAgdGhpcy5fUkVRVUlSRVNfUkVTRUVEID0gMjtcbiAgICB0aGlzLl9NQVhfV09SRFNfUEVSX0JVUlNUID0gNjU1MzY7XG4gICAgdGhpcy5fUEFSQU5PSUFfTEVWRUxTID0gWzAsIDQ4LCA2NCwgOTYsIDEyOCwgMTkyLCAyNTYsIDM4NCwgNTEyLCA3NjgsIDEwMjRdO1xuICAgIHRoaXMuX01JTExJU0VDT05EU19QRVJfUkVTRUVEID0gMzAwMDA7XG4gICAgdGhpcy5fQklUU19QRVJfUkVTRUVEID0gODA7XG59O1xuc2pjbC5wcm5nLnByb3RvdHlwZSA9IHtcbiAgICAvKiogR2VuZXJhdGUgc2V2ZXJhbCByYW5kb20gd29yZHMsIGFuZCByZXR1cm4gdGhlbSBpbiBhbiBhcnJheS5cbiAgICAgKiBBIHdvcmQgY29uc2lzdHMgb2YgMzIgYml0cyAoNCBieXRlcylcbiAgICAgKiBAcGFyYW0ge051bWJlcn0gbndvcmRzIFRoZSBudW1iZXIgb2Ygd29yZHMgdG8gZ2VuZXJhdGUuXG4gICAgICovXG4gICAgcmFuZG9tV29yZHM6IGZ1bmN0aW9uIChud29yZHMsIHBhcmFub2lhKSB7XG4gICAgICAgIHZhciBvdXQgPSBbXSwgaSwgcmVhZGluZXNzID0gdGhpcy5pc1JlYWR5KHBhcmFub2lhKSwgZztcbiAgICAgICAgaWYgKHJlYWRpbmVzcyA9PT0gdGhpcy5fTk9UX1JFQURZKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24ubm90UmVhZHkoXCJnZW5lcmF0b3IgaXNuJ3Qgc2VlZGVkXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHJlYWRpbmVzcyAmIHRoaXMuX1JFUVVJUkVTX1JFU0VFRCkge1xuICAgICAgICAgICAgdGhpcy5fcmVzZWVkRnJvbVBvb2xzKCEocmVhZGluZXNzICYgdGhpcy5fUkVBRFkpKTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbndvcmRzOyBpICs9IDQpIHtcbiAgICAgICAgICAgIGlmICgoaSArIDEpICUgdGhpcy5fTUFYX1dPUkRTX1BFUl9CVVJTVCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuX2dhdGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGcgPSB0aGlzLl9nZW40d29yZHMoKTtcbiAgICAgICAgICAgIG91dC5wdXNoKGdbMF0sIGdbMV0sIGdbMl0sIGdbM10pO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuX2dhdGUoKTtcbiAgICAgICAgcmV0dXJuIG91dC5zbGljZSgwLCBud29yZHMpO1xuICAgIH0sXG4gICAgLy8gc2V0RGVmYXVsdFBhcmFub2lhOiBmdW5jdGlvbiAocGFyYW5vaWEsIGFsbG93WmVyb1BhcmFub2lhKSB7XG4gICAgLy8gXHRpZiAocGFyYW5vaWEgPT09IDAgJiYgYWxsb3daZXJvUGFyYW5vaWFcbiAgICAvLyBcdFx0IT09IFwiU2V0dGluZyBwYXJhbm9pYT0wIHdpbGwgcnVpbiB5b3VyIHNlY3VyaXR5OyB1c2UgaXQgb25seSBmb3IgdGVzdGluZ1wiKSB7XG4gICAgLy8gXHRcdHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5pbnZhbGlkKFwiU2V0dGluZyBwYXJhbm9pYT0wIHdpbGwgcnVpbiB5b3VyIHNlY3VyaXR5OyB1c2UgaXQgb25seSBmb3IgdGVzdGluZ1wiKTtcbiAgICAvLyBcdH1cbiAgICAvL1xuICAgIC8vIFx0dGhpcy5fZGVmYXVsdFBhcmFub2lhID0gcGFyYW5vaWE7XG4gICAgLy8gfSxcbiAgICAvKipcbiAgICAgKiBBZGQgZW50cm9weSB0byB0aGUgcG9vbHMuXG4gICAgICogQHBhcmFtIGRhdGEgVGhlIGVudHJvcGljIHZhbHVlLiAgU2hvdWxkIGJlIGEgMzItYml0IGludGVnZXIsIGFycmF5IG9mIDMyLWJpdCBpbnRlZ2Vycywgb3Igc3RyaW5nXG4gICAgICogQHBhcmFtIHtOdW1iZXJ9IGVzdGltYXRlZEVudHJvcHkgVGhlIGVzdGltYXRlZCBlbnRyb3B5IG9mIGRhdGEsIGluIGJpdHNcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gc291cmNlIFRoZSBzb3VyY2Ugb2YgdGhlIGVudHJvcHksIGVnIFwibW91c2VcIlxuICAgICAqL1xuICAgIGFkZEVudHJvcHk6IGZ1bmN0aW9uIChkYXRhLCBlc3RpbWF0ZWRFbnRyb3B5LCBzb3VyY2UpIHtcbiAgICAgICAgc291cmNlID0gc291cmNlIHx8IFwidXNlclwiO1xuICAgICAgICB2YXIgaWQsIGksIHRtcCwgdCA9IG5ldyBEYXRlKCkudmFsdWVPZigpLCByb2JpbiA9IHRoaXMuX3JvYmluc1tzb3VyY2VdLCBvbGRSZWFkeSA9IHRoaXMuaXNSZWFkeSgpLCBlcnIgPSAwLCBvYmpOYW1lO1xuICAgICAgICBpZCA9IHRoaXMuX2NvbGxlY3Rvcklkc1tzb3VyY2VdO1xuICAgICAgICBpZiAoaWQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWQgPSB0aGlzLl9jb2xsZWN0b3JJZHNbc291cmNlXSA9IHRoaXMuX2NvbGxlY3RvcklkTmV4dCsrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChyb2JpbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByb2JpbiA9IHRoaXMuX3JvYmluc1tzb3VyY2VdID0gMDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yb2JpbnNbc291cmNlXSA9ICh0aGlzLl9yb2JpbnNbc291cmNlXSArIDEpICUgdGhpcy5fcG9vbHMubGVuZ3RoO1xuICAgICAgICBzd2l0Y2ggKHR5cGVvZiBkYXRhKSB7XG4gICAgICAgICAgICBjYXNlIFwibnVtYmVyXCI6XG4gICAgICAgICAgICAgICAgaWYgKGVzdGltYXRlZEVudHJvcHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWRFbnRyb3B5ID0gMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9vbHNbcm9iaW5dLnVwZGF0ZShbaWQsIHRoaXMuX2V2ZW50SWQrKywgMSwgZXN0aW1hdGVkRW50cm9weSwgdCwgMSwgZGF0YSB8IDBdKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCJvYmplY3RcIjpcbiAgICAgICAgICAgICAgICBvYmpOYW1lID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChvYmpOYW1lID09PSBcIltvYmplY3QgVWludDMyQXJyYXldXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdG1wID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0bXAucHVzaChkYXRhW2ldKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBkYXRhID0gdG1wO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9iak5hbWUgIT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZXJyID0gMTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggJiYgIWVycjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGRhdGFbaV0gIT09IFwibnVtYmVyXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnIgPSAxO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlc3RpbWF0ZWRFbnRyb3B5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8qIGhvcnJpYmxlIGVudHJvcHkgZXN0aW1hdG9yICovXG4gICAgICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWRFbnRyb3B5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdG1wID0gZGF0YVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAodG1wID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWRFbnRyb3B5Kys7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRtcCA9IHRtcCA+Pj4gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fcG9vbHNbcm9iaW5dLnVwZGF0ZShbaWQsIHRoaXMuX2V2ZW50SWQrKywgMiwgZXN0aW1hdGVkRW50cm9weSwgdCwgZGF0YS5sZW5ndGhdLmNvbmNhdChkYXRhKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcInN0cmluZ1wiOlxuICAgICAgICAgICAgICAgIGlmIChlc3RpbWF0ZWRFbnRyb3B5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgLyogRW5nbGlzaCB0ZXh0IGhhcyBqdXN0IG92ZXIgMSBiaXQgcGVyIGNoYXJhY3RlciBvZiBlbnRyb3B5LlxuICAgICAgICAgICAgICAgICAgICAgKiBCdXQgdGhpcyBtaWdodCBiZSBIVE1MIG9yIHNvbWV0aGluZywgYW5kIGhhdmUgZmFyIGxlc3NcbiAgICAgICAgICAgICAgICAgICAgICogZW50cm9weSB0aGFuIEVuZ2xpc2guLi4gIE9oIHdlbGwsIGxldCdzIGp1c3Qgc2F5IG9uZSBiaXQuXG4gICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICBlc3RpbWF0ZWRFbnRyb3B5ID0gZGF0YS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMuX3Bvb2xzW3JvYmluXS51cGRhdGUoW2lkLCB0aGlzLl9ldmVudElkKyssIDMsIGVzdGltYXRlZEVudHJvcHksIHQsIGRhdGEubGVuZ3RoXSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fcG9vbHNbcm9iaW5dLnVwZGF0ZShkYXRhKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAgICAgZXJyID0gMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uYnVnKFwicmFuZG9tOiBhZGRFbnRyb3B5IG9ubHkgc3VwcG9ydHMgbnVtYmVyLCBhcnJheSBvZiBudW1iZXJzIG9yIHN0cmluZ1wiKTtcbiAgICAgICAgfVxuICAgICAgICAvKiByZWNvcmQgdGhlIG5ldyBzdHJlbmd0aCAqL1xuICAgICAgICB0aGlzLl9wb29sRW50cm9weVtyb2Jpbl0gKz0gZXN0aW1hdGVkRW50cm9weTtcbiAgICAgICAgdGhpcy5fcG9vbFN0cmVuZ3RoICs9IGVzdGltYXRlZEVudHJvcHk7XG4gICAgICAgIC8qIGZpcmUgb2ZmIGV2ZW50cyAqL1xuICAgICAgICAvKiBUVVRBTy5hcm06IHJlbW92ZWQgYmFkIGltcGxlbWVudGF0aW9uOiBfZmlyZUV2ZW50IGNhbGxzIHN0YXRpYyByYW5kb21pemVyIGluc3RhbmNlXG4gICAgICAgICBpZiAob2xkUmVhZHkgPT09IHRoaXMuX05PVF9SRUFEWSkge1xuICAgICAgICAgaWYgKHRoaXMuaXNSZWFkeSgpICE9PSB0aGlzLl9OT1RfUkVBRFkpIHtcbiAgICAgICAgIHRoaXMuX2ZpcmVFdmVudChcInNlZWRlZFwiLCBNYXRoLm1heCh0aGlzLl9zdHJlbmd0aCwgdGhpcy5fcG9vbFN0cmVuZ3RoKSk7XG4gICAgICAgICB9XG4gICAgICAgICB0aGlzLl9maXJlRXZlbnQoXCJwcm9ncmVzc1wiLCB0aGlzLmdldFByb2dyZXNzKCkpO1xuICAgICAgICAgfSovXG4gICAgfSxcbiAgICAvKiogSXMgdGhlIGdlbmVyYXRvciByZWFkeT8gKi9cbiAgICBpc1JlYWR5OiBmdW5jdGlvbiAocGFyYW5vaWEpIHtcbiAgICAgICAgdmFyIGVudHJvcHlSZXF1aXJlZCA9IHRoaXMuX1BBUkFOT0lBX0xFVkVMU1twYXJhbm9pYSAhPT0gdW5kZWZpbmVkID8gcGFyYW5vaWEgOiB0aGlzLl9kZWZhdWx0UGFyYW5vaWFdO1xuICAgICAgICBpZiAodGhpcy5fc3RyZW5ndGggJiYgdGhpcy5fc3RyZW5ndGggPj0gZW50cm9weVJlcXVpcmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcG9vbEVudHJvcHlbMF0gPiB0aGlzLl9CSVRTX1BFUl9SRVNFRUQgJiYgbmV3IERhdGUoKS52YWx1ZU9mKCkgPiB0aGlzLl9uZXh0UmVzZWVkID8gdGhpcy5fUkVRVUlSRVNfUkVTRUVEIHwgdGhpcy5fUkVBRFkgOiB0aGlzLl9SRUFEWTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9wb29sU3RyZW5ndGggPj0gZW50cm9weVJlcXVpcmVkID8gdGhpcy5fUkVRVUlSRVNfUkVTRUVEIHwgdGhpcy5fTk9UX1JFQURZIDogdGhpcy5fTk9UX1JFQURZO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvKiogR2VuZXJhdGUgNCByYW5kb20gd29yZHMsIG5vIHJlc2VlZCwgbm8gZ2F0ZS5cbiAgICAgKiBAcHJpdmF0ZVxuICAgICAqL1xuICAgIF9nZW40d29yZHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCA0OyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMuX2NvdW50ZXJbaV0gPSAodGhpcy5fY291bnRlcltpXSArIDEpIHwgMDtcbiAgICAgICAgICAgIGlmICh0aGlzLl9jb3VudGVyW2ldKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuX2NpcGhlci5lbmNyeXB0KHRoaXMuX2NvdW50ZXIpO1xuICAgIH0sXG4gICAgLyogUmVrZXkgdGhlIEFFUyBpbnN0YW5jZSB3aXRoIGl0c2VsZiBhZnRlciBhIHJlcXVlc3QsIG9yIGV2ZXJ5IF9NQVhfV09SRFNfUEVSX0JVUlNUIHdvcmRzLlxuICAgICAqIEBwcml2YXRlXG4gICAgICovXG4gICAgX2dhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fa2V5ID0gdGhpcy5fZ2VuNHdvcmRzKCkuY29uY2F0KHRoaXMuX2dlbjR3b3JkcygpKTtcbiAgICAgICAgdGhpcy5fY2lwaGVyID0gbmV3IHNqY2wuY2lwaGVyLmFlcyh0aGlzLl9rZXkpO1xuICAgIH0sXG4gICAgLyoqIFJlc2VlZCB0aGUgZ2VuZXJhdG9yIHdpdGggdGhlIGdpdmVuIHdvcmRzXG4gICAgICogQHByaXZhdGVcbiAgICAgKi9cbiAgICBfcmVzZWVkOiBmdW5jdGlvbiAoc2VlZFdvcmRzKSB7XG4gICAgICAgIHRoaXMuX2tleSA9IHNqY2wuaGFzaC5zaGEyNTYuaGFzaCh0aGlzLl9rZXkuY29uY2F0KHNlZWRXb3JkcykpO1xuICAgICAgICB0aGlzLl9jaXBoZXIgPSBuZXcgc2pjbC5jaXBoZXIuYWVzKHRoaXMuX2tleSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgNDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLl9jb3VudGVyW2ldID0gKHRoaXMuX2NvdW50ZXJbaV0gKyAxKSB8IDA7XG4gICAgICAgICAgICBpZiAodGhpcy5fY291bnRlcltpXSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSxcbiAgICAvKiogcmVzZWVkIHRoZSBkYXRhIGZyb20gdGhlIGVudHJvcHkgcG9vbHNcbiAgICAgKiBAcGFyYW0gZnVsbCBJZiBzZXQsIHVzZSBhbGwgdGhlIGVudHJvcHkgcG9vbHMgaW4gdGhlIHJlc2VlZC5cbiAgICAgKi9cbiAgICBfcmVzZWVkRnJvbVBvb2xzOiBmdW5jdGlvbiAoZnVsbCkge1xuICAgICAgICB2YXIgcmVzZWVkRGF0YSA9IFtdLCBzdHJlbmd0aCA9IDAsIGk7XG4gICAgICAgIHRoaXMuX25leHRSZXNlZWQgPSByZXNlZWREYXRhWzBdID0gbmV3IERhdGUoKS52YWx1ZU9mKCkgKyB0aGlzLl9NSUxMSVNFQ09ORFNfUEVSX1JFU0VFRDtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgICAgIC8qIE9uIHNvbWUgYnJvd3NlcnMsIHRoaXMgaXMgY3J5cHRvZ3JhcGhpY2FsbHkgcmFuZG9tLiAgU28gd2UgbWlnaHRcbiAgICAgICAgICAgICAqIGFzIHdlbGwgdG9zcyBpdCBpbiB0aGUgcG90IGFuZCBzdGlyLi4uXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHJlc2VlZERhdGEucHVzaCgoTWF0aC5yYW5kb20oKSAqIDB4MTAwMDAwMDAwKSB8IDApO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9wb29scy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzZWVkRGF0YSA9IHJlc2VlZERhdGEuY29uY2F0KHRoaXMuX3Bvb2xzW2ldLmZpbmFsaXplKCkpO1xuICAgICAgICAgICAgc3RyZW5ndGggKz0gdGhpcy5fcG9vbEVudHJvcHlbaV07XG4gICAgICAgICAgICB0aGlzLl9wb29sRW50cm9weVtpXSA9IDA7XG4gICAgICAgICAgICBpZiAoIWZ1bGwgJiYgdGhpcy5fcmVzZWVkQ291bnQgJiAoMSA8PCBpKSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8qIGlmIHdlIHVzZWQgdGhlIGxhc3QgcG9vbCwgcHVzaCBhIG5ldyBvbmUgb250byB0aGUgc3RhY2sgKi9cbiAgICAgICAgaWYgKHRoaXMuX3Jlc2VlZENvdW50ID49IDEgPDwgdGhpcy5fcG9vbHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLl9wb29scy5wdXNoKG5ldyBzamNsLmhhc2guc2hhMjU2KCkpO1xuICAgICAgICAgICAgdGhpcy5fcG9vbEVudHJvcHkucHVzaCgwKTtcbiAgICAgICAgfVxuICAgICAgICAvKiBob3cgc3Ryb25nIHdhcyB0aGlzIHJlc2VlZD8gKi9cbiAgICAgICAgdGhpcy5fcG9vbFN0cmVuZ3RoIC09IHN0cmVuZ3RoO1xuICAgICAgICBpZiAoc3RyZW5ndGggPiB0aGlzLl9zdHJlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy5fc3RyZW5ndGggPSBzdHJlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9yZXNlZWRDb3VudCsrO1xuICAgICAgICB0aGlzLl9yZXNlZWQocmVzZWVkRGF0YSk7XG4gICAgfSxcbn07XG4vKiogYW4gaW5zdGFuY2UgZm9yIHRoZSBwcm5nLlxuICogQHNlZSBzamNsLnBybmdcbiAqL1xuLyogVFVUQU8uYXJtOiByZW1vdmVkIHN0YXRpYyByYW5kb21pemVyIGluc3RhbmNlIGJlY2F1c2Ugd2UgaGF2ZSBvdXIgb3duXG5zamNsLnJhbmRvbSA9IG5ldyBzamNsLnBybmcoNik7XG5cbihmdW5jdGlvbiAoKSB7XG4gICAgLy8gZnVuY3Rpb24gZm9yIGdldHRpbmcgbm9kZWpzIGNyeXB0byBtb2R1bGUuIGNhdGNoZXMgYW5kIGlnbm9yZXMgZXJyb3JzLlxuICAgIGZ1bmN0aW9uIGdldENyeXB0b01vZHVsZSgpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHJldHVybiByZXF1aXJlKCdjcnlwdG8nKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgICB2YXIgYnVmLCBjcnlwdCwgYWI7XG5cbiAgICAgICAgLy8gZ2V0IGNyeXB0b2dyYXBoaWNhbGx5IHN0cm9uZyBlbnRyb3B5IGRlcGVuZGluZyBvbiBydW50aW1lIGVudmlyb25tZW50XG4gICAgICAgIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyAmJiAoY3J5cHQgPSBnZXRDcnlwdG9Nb2R1bGUoKSkgJiYgY3J5cHQucmFuZG9tQnl0ZXMpIHtcbiAgICAgICAgICAgIGJ1ZiA9IGNyeXB0LnJhbmRvbUJ5dGVzKDEwMjQgLyA4KTtcbiAgICAgICAgICAgIGJ1ZiA9IG5ldyBVaW50MzJBcnJheShuZXcgVWludDhBcnJheShidWYpLmJ1ZmZlcik7XG4gICAgICAgICAgICBzamNsLnJhbmRvbS5hZGRFbnRyb3B5KGJ1ZiwgMTAyNCwgXCJjcnlwdG8ucmFuZG9tQnl0ZXNcIik7XG5cbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgVWludDMyQXJyYXkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhYiA9IG5ldyBVaW50MzJBcnJheSgzMik7XG4gICAgICAgICAgICBpZiAod2luZG93LmNyeXB0byAmJiB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgICAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAod2luZG93Lm1zQ3J5cHRvICYmIHdpbmRvdy5tc0NyeXB0by5nZXRSYW5kb21WYWx1ZXMpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cubXNDcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKGFiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBnZXQgY3J5cHRvZ3JhcGhpY2FsbHkgc3Ryb25nIGVudHJvcHkgaW4gV2Via2l0XG4gICAgICAgICAgICBzamNsLnJhbmRvbS5hZGRFbnRyb3B5KGFiLCAxMDI0LCBcImNyeXB0by5nZXRSYW5kb21WYWx1ZXNcIik7XG5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIG5vIGdldFJhbmRvbVZhbHVlcyA6LShcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnICYmIHdpbmRvdy5jb25zb2xlKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRoZXJlIHdhcyBhbiBlcnJvciBjb2xsZWN0aW5nIGVudHJvcHkgZnJvbSB0aGUgYnJvd3NlcjpcIik7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhlKTtcbiAgICAgICAgICAgIC8vd2UgZG8gbm90IHdhbnQgdGhlIGxpYnJhcnkgdG8gZmFpbCBkdWUgdG8gcmFuZG9tbmVzcyBub3QgYmVpbmcgbWFpbnRhaW5lZC5cbiAgICAgICAgfVxuICAgIH1cbiB9KCkpOyovXG4vKipcbiAqIEFycmF5QnVmZmVyXG4gKiBAbmFtZXNwYWNlXG4gKi9cbnNqY2wuY29kZWMuYXJyYXlCdWZmZXIgPSB7XG4gICAgLyoqIENvbnZlcnQgZnJvbSBhIGJpdEFycmF5IHRvIGFuIEFycmF5QnVmZmVyLlxuICAgICAqIFdpbGwgZGVmYXVsdCB0byA4Ynl0ZSBwYWRkaW5nIGlmIHBhZGRpbmcgaXMgdW5kZWZpbmVkKi9cbiAgICBmcm9tQml0czogZnVuY3Rpb24gKGFyciwgcGFkZGluZywgcGFkZGluZ19jb3VudCkge1xuICAgICAgICB2YXIgb3V0LCBpLCBvbCwgdG1wLCBzbWFsbGVzdDtcbiAgICAgICAgcGFkZGluZyA9IHBhZGRpbmcgPT0gdW5kZWZpbmVkID8gdHJ1ZSA6IHBhZGRpbmc7XG4gICAgICAgIHBhZGRpbmdfY291bnQgPSBwYWRkaW5nX2NvdW50IHx8IDg7XG4gICAgICAgIGlmIChhcnIubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IEFycmF5QnVmZmVyKDApO1xuICAgICAgICB9XG4gICAgICAgIG9sID0gc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoYXJyKSAvIDg7XG4gICAgICAgIC8vY2hlY2sgdG8gbWFrZSBzdXJlIHRoZSBiaXRMZW5ndGggaXMgZGl2aXNpYmxlIGJ5IDgsIGlmIGl0IGlzbid0XG4gICAgICAgIC8vd2UgY2FuJ3QgZG8gYW55dGhpbmcgc2luY2UgYXJyYXlidWZmZXJzIHdvcmsgd2l0aCBieXRlcywgbm90IGJpdHNcbiAgICAgICAgaWYgKHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGFycikgJSA4ICE9PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgc2pjbC5leGNlcHRpb24uaW52YWxpZChcIkludmFsaWQgYml0IHNpemUsIG11c3QgYmUgZGl2aXNibGUgYnkgOCB0byBmaXQgaW4gYW4gYXJyYXlidWZmZXIgY29ycmVjdGx5XCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChwYWRkaW5nICYmIG9sICUgcGFkZGluZ19jb3VudCAhPT0gMCkge1xuICAgICAgICAgICAgb2wgKz0gcGFkZGluZ19jb3VudCAtIChvbCAlIHBhZGRpbmdfY291bnQpO1xuICAgICAgICB9XG4gICAgICAgIC8vcGFkZGVkIHRlbXAgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB0bXAgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKGFyci5sZW5ndGggKiA0KSk7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRtcC5zZXRVaW50MzIoaSAqIDQsIGFycltpXSA8PCAzMik7IC8vZ2V0IHJpZCBvZiB0aGUgaGlnaGVyIGJpdHNcbiAgICAgICAgfVxuICAgICAgICAvL25vdyBjb3B5IHRoZSBmaW5hbCBtZXNzYWdlIGlmIHdlIGFyZSBub3QgZ29pbmcgdG8gMCBwYWRcbiAgICAgICAgb3V0ID0gbmV3IERhdGFWaWV3KG5ldyBBcnJheUJ1ZmZlcihvbCkpO1xuICAgICAgICAvL3NhdmUgYSBzdGVwIHdoZW4gdGhlIHRtcCBhbmQgb3V0IGJ5dGVsZW5ndGggYXJlID09PVxuICAgICAgICBpZiAob3V0LmJ5dGVMZW5ndGggPT09IHRtcC5ieXRlTGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdG1wLmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgICBzbWFsbGVzdCA9IHRtcC5ieXRlTGVuZ3RoIDwgb3V0LmJ5dGVMZW5ndGggPyB0bXAuYnl0ZUxlbmd0aCA6IG91dC5ieXRlTGVuZ3RoO1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgc21hbGxlc3Q7IGkrKykge1xuICAgICAgICAgICAgb3V0LnNldFVpbnQ4KGksIHRtcC5nZXRVaW50OChpKSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG91dC5idWZmZXI7XG4gICAgfSxcbiAgICB0b0JpdHM6IGZ1bmN0aW9uIChidWZmZXIsIGJ5dGVPZmZzZXQsIGJ5dGVMZW5ndGgpIHtcbiAgICAgICAgdmFyIGksIG91dCA9IFtdLCBsZW4sIGluVmlldywgdG1wO1xuICAgICAgICBpZiAoYnVmZmVyLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBbXTtcbiAgICAgICAgfVxuICAgICAgICBpblZpZXcgPSBuZXcgRGF0YVZpZXcoYnVmZmVyLCBieXRlT2Zmc2V0LCBieXRlTGVuZ3RoKTtcbiAgICAgICAgbGVuID0gaW5WaWV3LmJ5dGVMZW5ndGggLSAoaW5WaWV3LmJ5dGVMZW5ndGggJSA0KTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkgKz0gNCkge1xuICAgICAgICAgICAgb3V0LnB1c2goaW5WaWV3LmdldFVpbnQzMihpKSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGluVmlldy5ieXRlTGVuZ3RoICUgNCAhPSAwKSB7XG4gICAgICAgICAgICB0bXAgPSBuZXcgRGF0YVZpZXcobmV3IEFycmF5QnVmZmVyKDQpKTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gaW5WaWV3LmJ5dGVMZW5ndGggJSA0OyBpIDwgbDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgLy93ZSB3YW50IHRoZSBkYXRhIHRvIHRoZSByaWdodCwgYmVjYXVzZSBwYXJ0aWFsIHNsaWNlcyBvZmYgdGhlIHN0YXJ0aW5nIGJpdHNcbiAgICAgICAgICAgICAgICB0bXAuc2V0VWludDgoaSArIDQgLSBsLCBpblZpZXcuZ2V0VWludDgobGVuICsgaSkpOyAvLyBiaWctZW5kaWFuLFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgb3V0LnB1c2goc2pjbC5iaXRBcnJheS5wYXJ0aWFsKChpblZpZXcuYnl0ZUxlbmd0aCAlIDQpICogOCwgdG1wLmdldFVpbnQzMigwKSkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvdXQ7XG4gICAgfSxcbn07XG5leHBvcnQgZGVmYXVsdCBzamNsO1xuIiwiLy8gQHRzLWlnbm9yZVt1bnR5cGVkLWltcG9ydF1cbmltcG9ydCBzamNsIGZyb20gXCIuLi9pbnRlcm5hbC9zamNsLmpzXCI7XG5pbXBvcnQgeyBDcnlwdG9FcnJvciB9IGZyb20gXCIuLi9taXNjL0NyeXB0b0Vycm9yLmpzXCI7XG4vKipcbiAqIFRoaXMgSW50ZXJmYWNlIHByb3ZpZGVzIGFuIGFic3RyYWN0aW9uIG9mIHRoZSByYW5kb20gbnVtYmVyIGdlbmVyYXRvciBpbXBsZW1lbnRhdGlvbi5cbiAqL1xuZXhwb3J0IGNsYXNzIFJhbmRvbWl6ZXIge1xuICAgIHJhbmRvbTtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgdGhpcy5yYW5kb20gPSBuZXcgc2pjbC5wcm5nKDYpO1xuICAgIH1cbiAgICAvKipcbiAgICAgKiBBZGRzIGVudHJvcHkgdG8gdGhlIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yIGFsZ29yaXRobVxuICAgICAqIEBwYXJhbSBlbnRyb3B5Q2FjaGUgd2l0aDogbnVtYmVyIEFueSBudW1iZXIgdmFsdWUsIGVudHJvcHkgVGhlIGFtb3VudCBvZiBlbnRyb3B5IGluIHRoZSBudW1iZXIgaW4gYml0LFxuICAgICAqIHNvdXJjZSBUaGUgc291cmNlIG9mIHRoZSBudW1iZXIuXG4gICAgICovXG4gICAgYWRkRW50cm9weShlbnRyb3B5Q2FjaGUpIHtcbiAgICAgICAgZm9yIChjb25zdCBlbnRyeSBvZiBlbnRyb3B5Q2FjaGUpIHtcbiAgICAgICAgICAgIHRoaXMucmFuZG9tLmFkZEVudHJvcHkoZW50cnkuZGF0YSwgZW50cnkuZW50cm9weSwgZW50cnkuc291cmNlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuICAgIGFkZFN0YXRpY0VudHJvcHkoYnl0ZXMpIHtcbiAgICAgICAgZm9yIChjb25zdCBieXRlIG9mIGJ5dGVzKSB7XG4gICAgICAgICAgICB0aGlzLnJhbmRvbS5hZGRFbnRyb3B5KGJ5dGUsIDgsIFwic3RhdGljXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8qKlxuICAgICAqIE5vdCB1c2VkIGN1cnJlbnRseSBiZWNhdXNlIHdlIGFsd2F5cyBoYXZlIGVub3VnaCBlbnRyb3B5IHVzaW5nIGdldFJhbmRvbVZhbHVlcygpXG4gICAgICovXG4gICAgaXNSZWFkeSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmFuZG9tLmlzUmVhZHkoKSAhPT0gMDtcbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGVzIHJhbmRvbSBkYXRhLiBUaGUgZnVuY3Rpb24gaW5pdFJhbmRvbURhdGFHZW5lcmF0b3IgbXVzdCBoYXZlIGJlZW4gY2FsbGVkIHByaW9yIHRvIHRoZSBmaXJzdCBjYWxsIHRvIHRoaXMgZnVuY3Rpb24uXG4gICAgICogQHBhcmFtIG5ick9mQnl0ZXMgVGhlIG51bWJlciBvZiBieXRlcyB0aGUgcmFuZG9tIGRhdGEgc2hhbGwgaGF2ZS5cbiAgICAgKiBAcmV0dXJuIEEgaGV4IGNvZGVkIHN0cmluZyBvZiByYW5kb20gZGF0YS5cbiAgICAgKiBAdGhyb3dzIHtDcnlwdG9FcnJvcn0gaWYgdGhlIHJhbmRvbWl6ZXIgaXMgbm90IHNlZWRlZCAoaXNSZWFkeSA9PSBmYWxzZSlcbiAgICAgKi9cbiAgICBnZW5lcmF0ZVJhbmRvbURhdGEobmJyT2ZCeXRlcykge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gcmVhZCB0aGUgbWluaW1hbCBudW1iZXIgb2Ygd29yZHMgdG8gZ2V0IG5ick9mQnl0ZXNcbiAgICAgICAgICAgIGxldCBuYnJPZldvcmRzID0gTWF0aC5mbG9vcigobmJyT2ZCeXRlcyArIDMpIC8gNCk7XG4gICAgICAgICAgICBsZXQgd29yZHMgPSB0aGlzLnJhbmRvbS5yYW5kb21Xb3JkcyhuYnJPZldvcmRzKTtcbiAgICAgICAgICAgIGxldCBhcnJheUJ1ZmZlciA9IHNqY2wuY29kZWMuYXJyYXlCdWZmZXIuZnJvbUJpdHMod29yZHMsIGZhbHNlKTtcbiAgICAgICAgICAgIC8vIHNpbXBseSBjdXQgb2ZmIHRoZSBleGNlZWRpbmcgYnl0ZXNcbiAgICAgICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlciwgMCwgbmJyT2ZCeXRlcyk7IC8vIHRydW5jYXRlIHRoZSBhcnJheWJ1ZmZlciBhcyBwcmVjYXV0aW9uXG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihcImVycm9yIGR1cmluZyByYW5kb20gbnVtYmVyIGdlbmVyYXRpb25cIiwgZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLyoqXG4gICAgICogR2VuZXJhdGUgYSBudW1iZXIgdGhhdCBmaXRzIGluIHRoZSByYW5nZSBvZiBhbiBuLWJ5dGUgaW50ZWdlclxuICAgICAqL1xuICAgIGdlbmVyYXRlUmFuZG9tTnVtYmVyKG5ick9mQnl0ZXMpIHtcbiAgICAgICAgY29uc3QgYnl0ZXMgPSB0aGlzLmdlbmVyYXRlUmFuZG9tRGF0YShuYnJPZkJ5dGVzKTtcbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYnl0ZXMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHJlc3VsdCArPSBieXRlc1tpXSA8PCAoaSAqIDgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuLy8gVE9ETyBzaW5nbGV0b24gc2hvdWxkIGJlIGNyZWF0ZWQgaW4gdGhlIGFwcD9cbi8vIHRoZSByYW5kb21pemVyIGluc3RhbmNlIChzaW5nbGV0b24pIHRoYXQgc2hvdWxkIGJlIHVzZWQgdGhyb3VnaG91dCB0aGUgYXBwXG5leHBvcnQgY29uc3QgcmFuZG9tID0gbmV3IFJhbmRvbWl6ZXIoKTtcbiIsIi8vIEB0cy1pZ25vcmVbdW50eXBlZC1pbXBvcnRdXG5pbXBvcnQgc2pjbCBmcm9tIFwiLi4vaW50ZXJuYWwvc2pjbC5qc1wiO1xuY29uc3Qgc2hhMjU2ID0gbmV3IHNqY2wuaGFzaC5zaGEyNTYoKTtcbmV4cG9ydCBjb25zdCBTSEEyNTZfSEFTSF9MRU5HVEhfQllURVMgPSAzMjtcbi8qKlxuICogQ3JlYXRlIHRoZSBoYXNoIG9mIHRoZSBnaXZlbiBkYXRhLlxuICogQHBhcmFtIHVpbnQ4QXJyYXkgVGhlIGJ5dGVzLlxuICogQHJldHVybiBUaGUgaGFzaC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNoYTI1Nkhhc2godWludDhBcnJheSkge1xuICAgIHRyeSB7XG4gICAgICAgIHNoYTI1Ni51cGRhdGUoc2pjbC5jb2RlYy5hcnJheUJ1ZmZlci50b0JpdHModWludDhBcnJheS5idWZmZXIsIHVpbnQ4QXJyYXkuYnl0ZU9mZnNldCwgdWludDhBcnJheS5ieXRlTGVuZ3RoKSk7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShzamNsLmNvZGVjLmFycmF5QnVmZmVyLmZyb21CaXRzKHNoYTI1Ni5maW5hbGl6ZSgpLCBmYWxzZSkpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgc2hhMjU2LnJlc2V0KCk7XG4gICAgfVxufVxuIiwiLy8gQHRzLWlnbm9yZVt1bnR5cGVkLWltcG9ydF1cbmltcG9ydCBzamNsIGZyb20gXCIuLi9pbnRlcm5hbC9zamNsLmpzXCI7XG5pbXBvcnQgeyBiYXNlNjRUb0Jhc2U2NFVybCwgYmFzZTY0VG9VaW50OEFycmF5LCBjb25jYXQsIGhleFRvVWludDhBcnJheSwgdWludDhBcnJheVRvQXJyYXlCdWZmZXIsIHVpbnQ4QXJyYXlUb0Jhc2U2NCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIjtcbmltcG9ydCB7IENyeXB0b0Vycm9yIH0gZnJvbSBcIi4vQ3J5cHRvRXJyb3IuanNcIjtcbmltcG9ydCB7IHNoYTI1Nkhhc2ggfSBmcm9tIFwiLi4vaGFzaGVzL1NoYTI1Ni5qc1wiO1xuY29uc3QgUEFERElOR19CTE9DS19MRU5HVEggPSAxNjsgLy8gc2FtZSBmb3IgYWVzMTI4IGFuZCBhZXMyNTYgYXMgdGhlIGJsb2NrIHNpemUgaXMgYWx3YXlzIDE2IGJ5dGVcbmV4cG9ydCBmdW5jdGlvbiBwYWRBZXMoYnl0ZXMpIHtcbiAgICBsZXQgcGFkZGluZ0xlbmd0aCA9IFBBRERJTkdfQkxPQ0tfTEVOR1RIIC0gKGJ5dGVzLmJ5dGVMZW5ndGggJSBQQURESU5HX0JMT0NLX0xFTkdUSCk7XG4gICAgbGV0IHBhZGRpbmcgPSBuZXcgVWludDhBcnJheShwYWRkaW5nTGVuZ3RoKTtcbiAgICBwYWRkaW5nLmZpbGwocGFkZGluZ0xlbmd0aCk7XG4gICAgcmV0dXJuIGNvbmNhdChieXRlcywgcGFkZGluZyk7XG59XG5leHBvcnQgZnVuY3Rpb24gdW5wYWRBZXMoYnl0ZXMpIHtcbiAgICBsZXQgcGFkZGluZ0xlbmd0aCA9IGJ5dGVzW2J5dGVzLmJ5dGVMZW5ndGggLSAxXTtcbiAgICBpZiAocGFkZGluZ0xlbmd0aCA9PT0gMCB8fCBwYWRkaW5nTGVuZ3RoID4gYnl0ZXMuYnl0ZUxlbmd0aCB8fCBwYWRkaW5nTGVuZ3RoID4gUEFERElOR19CTE9DS19MRU5HVEgpIHtcbiAgICAgICAgdGhyb3cgbmV3IENyeXB0b0Vycm9yKFwiaW52YWxpZCBwYWRkaW5nOiBcIiArIHBhZGRpbmdMZW5ndGgpO1xuICAgIH1cbiAgICBsZXQgbGVuZ3RoID0gYnl0ZXMuYnl0ZUxlbmd0aCAtIHBhZGRpbmdMZW5ndGg7XG4gICAgbGV0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gICAgcmVzdWx0LnNldChieXRlcy5zdWJhcnJheSgwLCBsZW5ndGgpKTtcbiAgICByZXR1cm4gcmVzdWx0O1xufVxuLyoqXG4gKiBDcmVhdGVzIHRoZSBhdXRoIHZlcmlmaWVyIGZyb20gdGhlIHBhc3N3b3JkIGtleS5cbiAqIEBwYXJhbSBwYXNzd29yZEtleSBUaGUga2V5LlxuICogQHJldHVybnMgVGhlIGF1dGggdmVyaWZpZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUF1dGhWZXJpZmllcihwYXNzd29yZEtleSkge1xuICAgIC8vIFRPRE8gQ29tcGF0aWJpbGl0eSBUZXN0XG4gICAgcmV0dXJuIHNoYTI1Nkhhc2goYml0QXJyYXlUb1VpbnQ4QXJyYXkocGFzc3dvcmRLZXkpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBdXRoVmVyaWZpZXJBc0Jhc2U2NFVybChwYXNzd29yZEtleSkge1xuICAgIHJldHVybiBiYXNlNjRUb0Jhc2U2NFVybCh1aW50OEFycmF5VG9CYXNlNjQoY3JlYXRlQXV0aFZlcmlmaWVyKHBhc3N3b3JkS2V5KSkpO1xufVxuLyoqXG4gKiBQcm92aWRlcyB0aGUgaW5mb3JtYXRpb24gaWYgYSBrZXkgaXMgMTI4IG9yIDI1NiBiaXQgbGVuZ3RoLlxuICogQHBhcmFtIGtleSBUaGUga2V5LlxuICogQHJldHVybnMgVHJ1ZSBpZiB0aGUga2V5IGxlbmd0aCBpcyAxMjgsIGZhbHNlIGlmIHRoZSBrZXkgbGVuZ3RoIGlzIDI1NiBiaXQuXG4gKiBAdGhyb3dzIElmIHRoZSBrZXkgaXMgbm90IDEyOCBiaXQgYW5kIG5vdCAyNTYgYml0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tJczEyOEJpdEtleShrZXkpIHtcbiAgICBsZXQgYml0TGVuZ3RoID0gc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoa2V5KTtcbiAgICBpZiAoYml0TGVuZ3RoID09PSAxMjgpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKGJpdExlbmd0aCA9PT0gMjU2KSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihcImludmFsaWQga2V5IGJpdCBsZW5ndGg6IFwiICsgYml0TGVuZ3RoKTtcbiAgICB9XG59XG4vKipcbiAqIENvbnZlcnRzIHRoZSBnaXZlbiBCaXRBcnJheSAoU0pDTCkgdG8gYW4gVWludDhBcnJheS5cbiAqIEBwYXJhbSBiaXRzIFRoZSBCaXRBcnJheS5cbiAqIEByZXR1cm4gVGhlIHVpbnQ4YXJyYXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaXRBcnJheVRvVWludDhBcnJheShiaXRzKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHNqY2wuY29kZWMuYXJyYXlCdWZmZXIuZnJvbUJpdHMoYml0cywgZmFsc2UpKTtcbn1cbi8qKlxuICogQ29udmVydHMgdGhlIGdpdmVuIHVpbnQ4YXJyYXkgdG8gYSBCaXRBcnJheSAoU0pDTCkuXG4gKiBAcGFyYW0gdWludDhBcnJheSBUaGUgdWludDhBcnJheSBrZXkuXG4gKiBAcmV0dXJuIFRoZSBrZXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1aW50OEFycmF5VG9CaXRBcnJheSh1aW50OEFycmF5KSB7XG4gICAgcmV0dXJuIHNqY2wuY29kZWMuYXJyYXlCdWZmZXIudG9CaXRzKHVpbnQ4QXJyYXlUb0FycmF5QnVmZmVyKHVpbnQ4QXJyYXkpKTtcbn1cbi8qKlxuICogQ29udmVydHMgdGhlIGdpdmVuIGtleSB0byBhIGJhc2U2NCBjb2RlZCBzdHJpbmcuXG4gKiBAcGFyYW0ga2V5IFRoZSBrZXkuXG4gKiBAcmV0dXJuIFRoZSBiYXNlNjQgY29kZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBrZXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBrZXlUb0Jhc2U2NChrZXkpIHtcbiAgICByZXR1cm4gc2pjbC5jb2RlYy5iYXNlNjQuZnJvbUJpdHMoa2V5KTtcbn1cbi8qKlxuICogQ29udmVydHMgdGhlIGdpdmVuIGJhc2U2NCBjb2RlZCBzdHJpbmcgdG8gYSBrZXkuXG4gKiBAcGFyYW0gYmFzZTY0IFRoZSBiYXNlNjQgY29kZWQgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBrZXkuXG4gKiBAcmV0dXJuIFRoZSBrZXkuXG4gKiBAdGhyb3dzIHtDcnlwdG9FcnJvcn0gSWYgdGhlIGNvbnZlcnNpb24gZmFpbHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlNjRUb0tleShiYXNlNjQpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gc2pjbC5jb2RlYy5iYXNlNjQudG9CaXRzKGJhc2U2NCk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihcImhleCB0byBhZXMga2V5IGZhaWxlZFwiLCBlKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gdWludDhBcnJheVRvS2V5KGFycmF5KSB7XG4gICAgcmV0dXJuIGJhc2U2NFRvS2V5KHVpbnQ4QXJyYXlUb0Jhc2U2NChhcnJheSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGtleVRvVWludDhBcnJheShrZXkpIHtcbiAgICByZXR1cm4gYmFzZTY0VG9VaW50OEFycmF5KGtleVRvQmFzZTY0KGtleSkpO1xufVxuZXhwb3J0IGNvbnN0IGZpeGVkSXYgPSBoZXhUb1VpbnQ4QXJyYXkoXCI4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4ODg4OFwiKTtcbiIsIi8vIEB0cy1pZ25vcmVbdW50eXBlZC1pbXBvcnRdXG5pbXBvcnQgc2pjbCBmcm9tIFwiLi4vaW50ZXJuYWwvc2pjbC5qc1wiO1xuY29uc3Qgc2hhNTEyID0gbmV3IHNqY2wuaGFzaC5zaGE1MTIoKTtcbmV4cG9ydCBjb25zdCBTSEE1MTJfSEFTSF9MRU5HVEhfQllURVMgPSA2NDtcbi8qKlxuICogQ3JlYXRlIHRoZSBoYXNoIG9mIHRoZSBnaXZlbiBkYXRhLlxuICogQHBhcmFtIHVpbnQ4QXJyYXkgVGhlIGJ5dGVzLlxuICogQHJldHVybiBUaGUgaGFzaC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNoYTUxMkhhc2godWludDhBcnJheSkge1xuICAgIHRyeSB7XG4gICAgICAgIHNoYTUxMi51cGRhdGUoc2pjbC5jb2RlYy5hcnJheUJ1ZmZlci50b0JpdHModWludDhBcnJheS5idWZmZXIsIHVpbnQ4QXJyYXkuYnl0ZU9mZnNldCwgdWludDhBcnJheS5ieXRlTGVuZ3RoKSk7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShzamNsLmNvZGVjLmFycmF5QnVmZmVyLmZyb21CaXRzKHNoYTUxMi5maW5hbGl6ZSgpLCBmYWxzZSkpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgc2hhNTEyLnJlc2V0KCk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHNqY2wgZnJvbSBcIi4uL2ludGVybmFsL3NqY2wuanNcIjtcbmltcG9ydCB7IHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb20vUmFuZG9taXplci5qc1wiO1xuaW1wb3J0IHsgYml0QXJyYXlUb1VpbnQ4QXJyYXksIHVpbnQ4QXJyYXlUb0JpdEFycmF5IH0gZnJvbSBcIi4uL21pc2MvVXRpbHMuanNcIjtcbmltcG9ydCB7IGFycmF5RXF1YWxzLCBjb25jYXQsIHVpbnQ4QXJyYXlUb0Jhc2U2NCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIjtcbmltcG9ydCB7IHNoYTI1Nkhhc2ggfSBmcm9tIFwiLi4vaGFzaGVzL1NoYTI1Ni5qc1wiO1xuaW1wb3J0IHsgQ3J5cHRvRXJyb3IgfSBmcm9tIFwiLi4vbWlzYy9DcnlwdG9FcnJvci5qc1wiO1xuaW1wb3J0IHsgc2hhNTEySGFzaCB9IGZyb20gXCIuLi9oYXNoZXMvU2hhNTEyLmpzXCI7XG5leHBvcnQgY29uc3QgRU5BQkxFX01BQyA9IHRydWU7XG5leHBvcnQgY29uc3QgSVZfQllURV9MRU5HVEggPSAxNjtcbmV4cG9ydCBjb25zdCBLRVlfTEVOR1RIX0JZVEVTX0FFU18yNTYgPSAzMjtcbmV4cG9ydCBjb25zdCBLRVlfTEVOR1RIX0JJVFNfQUVTXzI1NiA9IEtFWV9MRU5HVEhfQllURVNfQUVTXzI1NiAqIDg7XG5leHBvcnQgY29uc3QgS0VZX0xFTkdUSF9CWVRFU19BRVNfMTI4ID0gMTY7XG5jb25zdCBLRVlfTEVOR1RIX0JJVFNfQUVTXzEyOCA9IEtFWV9MRU5HVEhfQllURVNfQUVTXzEyOCAqIDg7XG5leHBvcnQgY29uc3QgTUFDX0VOQUJMRURfUFJFRklYID0gMTtcbmNvbnN0IE1BQ19MRU5HVEhfQllURVMgPSAzMjtcbi8qKlxuICogQHJldHVybiB0aGUga2V5IGxlbmd0aCBpbiBieXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0S2V5TGVuZ3RoQnl0ZXMoa2V5KSB7XG4gICAgLy8gc3RvcmVkIGFzIGFuIGFycmF5IG9mIDMyLWJpdCAoNCBieXRlKSBpbnRlZ2Vyc1xuICAgIHJldHVybiBrZXkubGVuZ3RoICogNDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBhZXMyNTZSYW5kb21LZXkoKSB7XG4gICAgcmV0dXJuIHVpbnQ4QXJyYXlUb0JpdEFycmF5KHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoS0VZX0xFTkdUSF9CWVRFU19BRVNfMjU2KSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVJVigpIHtcbiAgICByZXR1cm4gcmFuZG9tLmdlbmVyYXRlUmFuZG9tRGF0YShJVl9CWVRFX0xFTkdUSCk7XG59XG4vKipcbiAqIEVuY3J5cHRzIGJ5dGVzIHdpdGggQUVTMTI4IG9yIEFFUzI1NiBpbiBDQkMgbW9kZS5cbiAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byB1c2UgZm9yIHRoZSBlbmNyeXB0aW9uLlxuICogQHBhcmFtIGJ5dGVzIFRoZSBwbGFpbiB0ZXh0LlxuICogQHBhcmFtIGl2IFRoZSBpbml0aWFsaXphdGlvbiB2ZWN0b3IuXG4gKiBAcGFyYW0gdXNlUGFkZGluZyBJZiB0cnVlLCBwYWRkaW5nIGlzIHVzZWQsIG90aGVyd2lzZSBubyBwYWRkaW5nIGlzIHVzZWQgYW5kIHRoZSBlbmNyeXB0ZWQgZGF0YSBtdXN0IGhhdmUgdGhlIGtleSBzaXplLlxuICogQHBhcmFtIHVzZU1hYyBJZiB0cnVlLCB1c2UgSE1BQyAobm90ZSB0aGF0IHRoaXMgaXMgcmVxdWlyZWQgZm9yIEFFUy0yNTYpXG4gKiBAcmV0dXJuIFRoZSBlbmNyeXB0ZWQgYnl0ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFlc0VuY3J5cHQoa2V5LCBieXRlcywgaXYgPSBnZW5lcmF0ZUlWKCksIHVzZVBhZGRpbmcgPSB0cnVlLCB1c2VNYWMgPSB0cnVlKSB7XG4gICAgdmVyaWZ5S2V5U2l6ZShrZXksIFtLRVlfTEVOR1RIX0JJVFNfQUVTXzEyOCwgS0VZX0xFTkdUSF9CSVRTX0FFU18yNTZdKTtcbiAgICBpZiAoaXYubGVuZ3RoICE9PSBJVl9CWVRFX0xFTkdUSCkge1xuICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoYElsbGVnYWwgSVYgbGVuZ3RoOiAke2l2Lmxlbmd0aH0gKGV4cGVjdGVkOiAke0lWX0JZVEVfTEVOR1RIfSk6ICR7dWludDhBcnJheVRvQmFzZTY0KGl2KX0gYCk7XG4gICAgfVxuICAgIGlmICghdXNlTWFjICYmIGdldEtleUxlbmd0aEJ5dGVzKGtleSkgPT09IEtFWV9MRU5HVEhfQllURVNfQUVTXzI1Nikge1xuICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoYENhbid0IHVzZSBBRVMtMjU2IHdpdGhvdXQgTUFDYCk7XG4gICAgfVxuICAgIGxldCBzdWJLZXlzID0gZ2V0QWVzU3ViS2V5cyhrZXksIHVzZU1hYyk7XG4gICAgbGV0IGVuY3J5cHRlZEJpdHMgPSBzamNsLm1vZGUuY2JjLmVuY3J5cHQobmV3IHNqY2wuY2lwaGVyLmFlcyhzdWJLZXlzLmNLZXkpLCB1aW50OEFycmF5VG9CaXRBcnJheShieXRlcyksIHVpbnQ4QXJyYXlUb0JpdEFycmF5KGl2KSwgW10sIHVzZVBhZGRpbmcpO1xuICAgIGxldCBkYXRhID0gY29uY2F0KGl2LCBiaXRBcnJheVRvVWludDhBcnJheShlbmNyeXB0ZWRCaXRzKSk7XG4gICAgaWYgKHVzZU1hYykge1xuICAgICAgICBsZXQgaG1hYyA9IG5ldyBzamNsLm1pc2MuaG1hYyhzdWJLZXlzLm1LZXksIHNqY2wuaGFzaC5zaGEyNTYpO1xuICAgICAgICBsZXQgbWFjQnl0ZXMgPSBiaXRBcnJheVRvVWludDhBcnJheShobWFjLmVuY3J5cHQodWludDhBcnJheVRvQml0QXJyYXkoZGF0YSkpKTtcbiAgICAgICAgZGF0YSA9IGNvbmNhdChuZXcgVWludDhBcnJheShbTUFDX0VOQUJMRURfUFJFRklYXSksIGRhdGEsIG1hY0J5dGVzKTtcbiAgICB9XG4gICAgcmV0dXJuIGRhdGE7XG59XG4vKipcbiAqIEVuY3J5cHRzIGJ5dGVzIHdpdGggQUVTIDI1NiBpbiBDQkMgbW9kZSB3aXRob3V0IG1hYy4gVGhpcyBpcyBsZWdhY3kgY29kZSBhbmQgc2hvdWxkIGJlIHJlbW92ZWQgb25jZSB0aGUgaW5kZXggaGFzIGJlZW4gbWlncmF0ZWQuXG4gKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gdXNlIGZvciB0aGUgZW5jcnlwdGlvbi5cbiAqIEBwYXJhbSBieXRlcyBUaGUgcGxhaW4gdGV4dC5cbiAqIEBwYXJhbSBpdiBUaGUgaW5pdGlhbGl6YXRpb24gdmVjdG9yIChvbmx5IHRvIGJlIHBhc3NlZCBmb3IgdGVzdGluZykuXG4gKiBAcGFyYW0gdXNlUGFkZGluZyBJZiB0cnVlLCBwYWRkaW5nIGlzIHVzZWQsIG90aGVyd2lzZSBubyBwYWRkaW5nIGlzIHVzZWQgYW5kIHRoZSBlbmNyeXB0ZWQgZGF0YSBtdXN0IGhhdmUgdGhlIGtleSBzaXplLlxuICogQHJldHVybiBUaGUgZW5jcnlwdGVkIHRleHQgYXMgd29yZHMgKHNqY2wgaW50ZXJuYWwgc3RydWN0dXJlKS4uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZXMyNTZFbmNyeXB0U2VhcmNoSW5kZXhFbnRyeShrZXksIGJ5dGVzLCBpdiA9IGdlbmVyYXRlSVYoKSwgdXNlUGFkZGluZyA9IHRydWUpIHtcbiAgICB2ZXJpZnlLZXlTaXplKGtleSwgW0tFWV9MRU5HVEhfQklUU19BRVNfMjU2XSk7XG4gICAgaWYgKGl2Lmxlbmd0aCAhPT0gSVZfQllURV9MRU5HVEgpIHtcbiAgICAgICAgdGhyb3cgbmV3IENyeXB0b0Vycm9yKGBJbGxlZ2FsIElWIGxlbmd0aDogJHtpdi5sZW5ndGh9IChleHBlY3RlZDogJHtJVl9CWVRFX0xFTkdUSH0pOiAke3VpbnQ4QXJyYXlUb0Jhc2U2NChpdil9IGApO1xuICAgIH1cbiAgICBsZXQgc3ViS2V5cyA9IGdldEFlc1N1YktleXMoa2V5LCBmYWxzZSk7XG4gICAgbGV0IGVuY3J5cHRlZEJpdHMgPSBzamNsLm1vZGUuY2JjLmVuY3J5cHQobmV3IHNqY2wuY2lwaGVyLmFlcyhzdWJLZXlzLmNLZXkpLCB1aW50OEFycmF5VG9CaXRBcnJheShieXRlcyksIHVpbnQ4QXJyYXlUb0JpdEFycmF5KGl2KSwgW10sIHVzZVBhZGRpbmcpO1xuICAgIGxldCBkYXRhID0gY29uY2F0KGl2LCBiaXRBcnJheVRvVWludDhBcnJheShlbmNyeXB0ZWRCaXRzKSk7XG4gICAgcmV0dXJuIGRhdGE7XG59XG4vKipcbiAqIERlY3J5cHRzIHRoZSBnaXZlbiB3b3JkcyB3aXRoIEFFUy0xMjgvMjU2IGluIENCQyBtb2RlICh3aXRoIEhNQUMtU0hBLTI1NiBhcyBtYWMpLiBUaGUgbWFjIGlzIGVuZm9yY2VkIGZvciBBRVMtMjU2IGJ1dCBvcHRpb25hbCBmb3IgQUVTLTEyOC5cbiAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byB1c2UgZm9yIHRoZSBkZWNyeXB0aW9uLlxuICogQHBhcmFtIGVuY3J5cHRlZEJ5dGVzIFRoZSBjaXBoZXJ0ZXh0IGVuY29kZWQgYXMgYnl0ZXMuXG4gKiBAcGFyYW0gdXNlUGFkZGluZyBJZiB0cnVlLCBwYWRkaW5nIGlzIHVzZWQsIG90aGVyd2lzZSBubyBwYWRkaW5nIGlzIHVzZWQgYW5kIHRoZSBlbmNyeXB0ZWQgZGF0YSBtdXN0IGhhdmUgdGhlIGtleSBzaXplLlxuICogQHJldHVybiBUaGUgZGVjcnlwdGVkIGJ5dGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWVzRGVjcnlwdChrZXksIGVuY3J5cHRlZEJ5dGVzLCB1c2VQYWRkaW5nID0gdHJ1ZSkge1xuICAgIGNvbnN0IGtleUxlbmd0aCA9IGdldEtleUxlbmd0aEJ5dGVzKGtleSk7XG4gICAgaWYgKGtleUxlbmd0aCA9PT0gS0VZX0xFTkdUSF9CWVRFU19BRVNfMTI4KSB7XG4gICAgICAgIHJldHVybiBhZXNEZWNyeXB0SW1wbChrZXksIGVuY3J5cHRlZEJ5dGVzLCB1c2VQYWRkaW5nLCBmYWxzZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gYWVzRGVjcnlwdEltcGwoa2V5LCBlbmNyeXB0ZWRCeXRlcywgdXNlUGFkZGluZywgdHJ1ZSk7XG4gICAgfVxufVxuLyoqXG4gKiBEZWNyeXB0cyB0aGUgZ2l2ZW4gd29yZHMgd2l0aCBBRVMtMTI4LyBBRVMtMjU2IGluIENCQyBtb2RlIHdpdGggSE1BQy1TSEEtMjU2IGFzIG1hYy4gRW5mb3JjZXMgdGhlIG1hYy5cbiAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byB1c2UgZm9yIHRoZSBkZWNyeXB0aW9uLlxuICogQHBhcmFtIGVuY3J5cHRlZEJ5dGVzIFRoZSBjaXBoZXJ0ZXh0IGVuY29kZWQgYXMgYnl0ZXMuXG4gKiBAcGFyYW0gdXNlUGFkZGluZyBJZiB0cnVlLCBwYWRkaW5nIGlzIHVzZWQsIG90aGVyd2lzZSBubyBwYWRkaW5nIGlzIHVzZWQgYW5kIHRoZSBlbmNyeXB0ZWQgZGF0YSBtdXN0IGhhdmUgdGhlIGtleSBzaXplLlxuICogQHJldHVybiBUaGUgZGVjcnlwdGVkIGJ5dGVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXV0aGVudGljYXRlZEFlc0RlY3J5cHQoa2V5LCBlbmNyeXB0ZWRCeXRlcywgdXNlUGFkZGluZyA9IHRydWUpIHtcbiAgICByZXR1cm4gYWVzRGVjcnlwdEltcGwoa2V5LCBlbmNyeXB0ZWRCeXRlcywgdXNlUGFkZGluZywgdHJ1ZSk7XG59XG4vKipcbiAqIERlY3J5cHRzIHRoZSBnaXZlbiB3b3JkcyB3aXRoIEFFUy0xMjgvMjU2IGluIENCQyBtb2RlLiBEb2VzIG5vdCBlbmZvcmNlIGEgbWFjLlxuICogV2UgYWx3YXlzIG11c3QgZW5mb3JjZSBtYWNzLiBUaGlzIG9ubHkgZXhpc3RzIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IGluIHNvbWUgZXhjZXB0aW9uYWwgY2FzZXMgbGlrZSBzZWFyY2ggaW5kZXggZW50cnkgZW5jcnlwdGlvbi5cbiAqXG4gKiBAcGFyYW0ga2V5IFRoZSBrZXkgdG8gdXNlIGZvciB0aGUgZGVjcnlwdGlvbi5cbiAqIEBwYXJhbSBlbmNyeXB0ZWRCeXRlcyBUaGUgY2lwaGVydGV4dCBlbmNvZGVkIGFzIGJ5dGVzLlxuICogQHBhcmFtIHVzZVBhZGRpbmcgSWYgdHJ1ZSwgcGFkZGluZyBpcyB1c2VkLCBvdGhlcndpc2Ugbm8gcGFkZGluZyBpcyB1c2VkIGFuZCB0aGUgZW5jcnlwdGVkIGRhdGEgbXVzdCBoYXZlIHRoZSBrZXkgc2l6ZS5cbiAqIEByZXR1cm4gVGhlIGRlY3J5cHRlZCBieXRlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuYXV0aGVudGljYXRlZEFlc0RlY3J5cHQoa2V5LCBlbmNyeXB0ZWRCeXRlcywgdXNlUGFkZGluZyA9IHRydWUpIHtcbiAgICByZXR1cm4gYWVzRGVjcnlwdEltcGwoa2V5LCBlbmNyeXB0ZWRCeXRlcywgdXNlUGFkZGluZywgZmFsc2UpO1xufVxuLyoqXG4gKiBEZWNyeXB0cyB0aGUgZ2l2ZW4gd29yZHMgd2l0aCBBRVMtMTI4LzI1NiBpbiBDQkMgbW9kZS5cbiAqIEBwYXJhbSBrZXkgVGhlIGtleSB0byB1c2UgZm9yIHRoZSBkZWNyeXB0aW9uLlxuICogQHBhcmFtIGVuY3J5cHRlZEJ5dGVzIFRoZSBjaXBoZXJ0ZXh0IGVuY29kZWQgYXMgYnl0ZXMuXG4gKiBAcGFyYW0gdXNlUGFkZGluZyBJZiB0cnVlLCBwYWRkaW5nIGlzIHVzZWQsIG90aGVyd2lzZSBubyBwYWRkaW5nIGlzIHVzZWQgYW5kIHRoZSBlbmNyeXB0ZWQgZGF0YSBtdXN0IGhhdmUgdGhlIGtleSBzaXplLlxuICogQHBhcmFtIGVuZm9yY2VNYWMgaWYgdHJ1ZSBkZWNyeXB0aW9uIHdpbGwgZmFpbCBpZiB0aGVyZSBpcyBubyB2YWxpZCBtYWMuIHdlIG9ubHkgc3VwcG9ydCBmYWxzZSBmb3IgYmFja3dhcmQgY29tcGF0aWJpbGl0eS5cbiAqIFx0XHRcdFx0IGl0IG11c3Qgbm90IGJlIHVzZWQgd2l0aCBuZXcgY3J5dG8gYW55bW9yZS5cbiAqIEByZXR1cm4gVGhlIGRlY3J5cHRlZCBieXRlcy5cbiAqL1xuZnVuY3Rpb24gYWVzRGVjcnlwdEltcGwoa2V5LCBlbmNyeXB0ZWRCeXRlcywgdXNlUGFkZGluZywgZW5mb3JjZU1hYykge1xuICAgIHZlcmlmeUtleVNpemUoa2V5LCBbS0VZX0xFTkdUSF9CSVRTX0FFU18xMjgsIEtFWV9MRU5HVEhfQklUU19BRVNfMjU2XSk7XG4gICAgY29uc3QgaGFzTWFjID0gZW5jcnlwdGVkQnl0ZXMubGVuZ3RoICUgMiA9PT0gMTtcbiAgICBpZiAoZW5mb3JjZU1hYyAmJiAhaGFzTWFjKSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihcIm1hYyBleHBlY3RlZCBidXQgbm90IHByZXNlbnRcIik7XG4gICAgfVxuICAgIGNvbnN0IHN1YktleXMgPSBnZXRBZXNTdWJLZXlzKGtleSwgaGFzTWFjKTtcbiAgICBsZXQgY2lwaGVyVGV4dFdpdGhvdXRNYWM7XG4gICAgaWYgKGhhc01hYykge1xuICAgICAgICBjaXBoZXJUZXh0V2l0aG91dE1hYyA9IGVuY3J5cHRlZEJ5dGVzLnN1YmFycmF5KDEsIGVuY3J5cHRlZEJ5dGVzLmxlbmd0aCAtIE1BQ19MRU5HVEhfQllURVMpO1xuICAgICAgICBjb25zdCBwcm92aWRlZE1hY0J5dGVzID0gZW5jcnlwdGVkQnl0ZXMuc3ViYXJyYXkoZW5jcnlwdGVkQnl0ZXMubGVuZ3RoIC0gTUFDX0xFTkdUSF9CWVRFUyk7XG4gICAgICAgIGNvbnN0IGhtYWMgPSBuZXcgc2pjbC5taXNjLmhtYWMoc3ViS2V5cy5tS2V5LCBzamNsLmhhc2guc2hhMjU2KTtcbiAgICAgICAgY29uc3QgY29tcHV0ZWRNYWNCeXRlcyA9IGJpdEFycmF5VG9VaW50OEFycmF5KGhtYWMuZW5jcnlwdCh1aW50OEFycmF5VG9CaXRBcnJheShjaXBoZXJUZXh0V2l0aG91dE1hYykpKTtcbiAgICAgICAgaWYgKCFhcnJheUVxdWFscyhwcm92aWRlZE1hY0J5dGVzLCBjb21wdXRlZE1hY0J5dGVzKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IENyeXB0b0Vycm9yKFwiaW52YWxpZCBtYWNcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNpcGhlclRleHRXaXRob3V0TWFjID0gZW5jcnlwdGVkQnl0ZXM7XG4gICAgfVxuICAgIC8vIHRha2UgdGhlIGl2IGZyb20gdGhlIGZyb250IG9mIHRoZSBlbmNyeXB0ZWQgZGF0YVxuICAgIGNvbnN0IGl2ID0gY2lwaGVyVGV4dFdpdGhvdXRNYWMuc2xpY2UoMCwgSVZfQllURV9MRU5HVEgpO1xuICAgIGlmIChpdi5sZW5ndGggIT09IElWX0JZVEVfTEVOR1RIKSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihgSW52YWxpZCBJViBsZW5ndGggaW4gYWVzRGVjcnlwdDogJHtpdi5sZW5ndGh9IGJ5dGVzLCBtdXN0IGJlIDE2IGJ5dGVzICgxMjggYml0cylgKTtcbiAgICB9XG4gICAgY29uc3QgY2lwaGVydGV4dCA9IGNpcGhlclRleHRXaXRob3V0TWFjLnNsaWNlKElWX0JZVEVfTEVOR1RIKTtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBkZWNyeXB0ZWQgPSBzamNsLm1vZGUuY2JjLmRlY3J5cHQobmV3IHNqY2wuY2lwaGVyLmFlcyhzdWJLZXlzLmNLZXkpLCB1aW50OEFycmF5VG9CaXRBcnJheShjaXBoZXJ0ZXh0KSwgdWludDhBcnJheVRvQml0QXJyYXkoaXYpLCBbXSwgdXNlUGFkZGluZyk7XG4gICAgICAgIHJldHVybiBuZXcgVWludDhBcnJheShiaXRBcnJheVRvVWludDhBcnJheShkZWNyeXB0ZWQpKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IENyeXB0b0Vycm9yKFwiYWVzIGRlY3J5cHRpb24gZmFpbGVkXCIsIGUpO1xuICAgIH1cbn1cbi8vIHZpc2libGVGb3JUZXN0aW5nXG5leHBvcnQgZnVuY3Rpb24gdmVyaWZ5S2V5U2l6ZShrZXksIGJpdExlbmd0aCkge1xuICAgIGlmICghYml0TGVuZ3RoLmluY2x1ZGVzKHNqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGtleSkpKSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihgSWxsZWdhbCBrZXkgbGVuZ3RoOiAke3NqY2wuYml0QXJyYXkuYml0TGVuZ3RoKGtleSl9IChleHBlY3RlZDogJHtiaXRMZW5ndGh9KWApO1xuICAgIH1cbn1cbi8qKioqKioqKioqKioqKioqKioqKioqKiogTGVnYWN5IEFFUzEyOCAqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKipcbiAqIEBwcml2YXRlIHZpc2libGUgZm9yIHRlc3RzXG4gKiBAZGVwcmVjYXRlZFxuICogKi9cbmV4cG9ydCBmdW5jdGlvbiBfYWVzMTI4UmFuZG9tS2V5KCkge1xuICAgIHJldHVybiB1aW50OEFycmF5VG9CaXRBcnJheShyYW5kb20uZ2VuZXJhdGVSYW5kb21EYXRhKEtFWV9MRU5HVEhfQllURVNfQUVTXzEyOCkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEFlc1N1YktleXMoa2V5LCBtYWMpIHtcbiAgICBpZiAobWFjKSB7XG4gICAgICAgIGxldCBoYXNoZWRLZXk7XG4gICAgICAgIHN3aXRjaCAoZ2V0S2V5TGVuZ3RoQnl0ZXMoa2V5KSkge1xuICAgICAgICAgICAgY2FzZSBLRVlfTEVOR1RIX0JZVEVTX0FFU18xMjg6XG4gICAgICAgICAgICAgICAgaGFzaGVkS2V5ID0gc2hhMjU2SGFzaChiaXRBcnJheVRvVWludDhBcnJheShrZXkpKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgS0VZX0xFTkdUSF9CWVRFU19BRVNfMjU2OlxuICAgICAgICAgICAgICAgIGhhc2hlZEtleSA9IHNoYTUxMkhhc2goYml0QXJyYXlUb1VpbnQ4QXJyYXkoa2V5KSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgdW5leHBlY3RlZCBrZXkgbGVuZ3RoICR7Z2V0S2V5TGVuZ3RoQnl0ZXMoa2V5KX1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY0tleTogdWludDhBcnJheVRvQml0QXJyYXkoaGFzaGVkS2V5LnN1YmFycmF5KDAsIGhhc2hlZEtleS5sZW5ndGggLyAyKSksXG4gICAgICAgICAgICBtS2V5OiB1aW50OEFycmF5VG9CaXRBcnJheShoYXNoZWRLZXkuc3ViYXJyYXkoaGFzaGVkS2V5Lmxlbmd0aCAvIDIsIGhhc2hlZEtleS5sZW5ndGgpKSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBjS2V5OiBrZXksXG4gICAgICAgICAgICBtS2V5OiBudWxsLFxuICAgICAgICB9O1xuICAgIH1cbn1cbiIsIi8vIHgyNTUxOSBmcm9tIG5vYmxlLWN1cnZlcy0xLjMuMFxuLy9cbi8vIEhvdyB0byByZWJ1aWxkIHRoaXMgZmlsZVxuLy8gMS4gQ2xvbmUgbm9ibGUtY3VydmVzIGh0dHBzOi8vZ2l0aHViLmNvbS9wYXVsbWlsbHIvbm9ibGUtY3VydmVzIGFuZCBDRCBpbnRvIGl0XG4vLyAyLiBSdW4gYG5wbSBpYCBhbmQgdGhlbiBgbnBtIHJ1biBidWlsZGBcbi8vIDMuIENEIGludG8gYGJ1aWxkYFxuLy8gNC4gUmV3cml0ZSBpbnB1dC5qcyBpbnRvIGp1c3QgdGhpcyBvbmUgbGluZTogZXhwb3J0IHt4MjU1MTl9IGZyb20gJ0Bub2JsZS9jdXJ2ZXMvZWQyNTUxOSdcbi8vIDUuIFJ1biBgbnBtIGlgIGFuZCBgbnBtIHJ1biBidWlsZGBcbi8vIDYuIENvcHkgY29udGVudHMgb2Ygbm9ibGUtY3VydmVzLmpzIHRvIGJlbG93XG5cInVzZSBzdHJpY3RcIjtcbnZhciBub2JsZUN1cnZlcyA9ICgoKSA9PiB7XG4gICAgdmFyIF9fZGVmUHJvcCA9IE9iamVjdC5kZWZpbmVQcm9wZXJ0eTtcbiAgICB2YXIgX19nZXRPd25Qcm9wRGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3I7XG4gICAgdmFyIF9fZ2V0T3duUHJvcE5hbWVzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXM7XG4gICAgdmFyIF9faGFzT3duUHJvcCA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gICAgdmFyIF9fZXhwb3J0ID0gKHRhcmdldCwgYWxsKSA9PiB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gYWxsKVxuICAgICAgICAgICAgX19kZWZQcm9wKHRhcmdldCwgbmFtZSwgeyBnZXQ6IGFsbFtuYW1lXSwgZW51bWVyYWJsZTogdHJ1ZSB9KTtcbiAgICB9O1xuICAgIHZhciBfX2NvcHlQcm9wcyA9ICh0bywgZnJvbSwgZXhjZXB0LCBkZXNjKSA9PiB7XG4gICAgICAgIGlmIChmcm9tICYmIHR5cGVvZiBmcm9tID09PSBcIm9iamVjdFwiIHx8IHR5cGVvZiBmcm9tID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBvZiBfX2dldE93blByb3BOYW1lcyhmcm9tKSlcbiAgICAgICAgICAgICAgICBpZiAoIV9faGFzT3duUHJvcC5jYWxsKHRvLCBrZXkpICYmIGtleSAhPT0gZXhjZXB0KVxuICAgICAgICAgICAgICAgICAgICBfX2RlZlByb3AodG8sIGtleSwgeyBnZXQ6ICgpID0+IGZyb21ba2V5XSwgZW51bWVyYWJsZTogIShkZXNjID0gX19nZXRPd25Qcm9wRGVzYyhmcm9tLCBrZXkpKSB8fCBkZXNjLmVudW1lcmFibGUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvO1xuICAgIH07XG4gICAgdmFyIF9fdG9Db21tb25KUyA9IChtb2QyKSA9PiBfX2NvcHlQcm9wcyhfX2RlZlByb3Aoe30sIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pLCBtb2QyKTtcbiAgICAvLyBpbnB1dC5qc1xuICAgIHZhciBpbnB1dF9leHBvcnRzID0ge307XG4gICAgX19leHBvcnQoaW5wdXRfZXhwb3J0cywge1xuICAgICAgICB4MjU1MTk6ICgpID0+IHgyNTUxOVxuICAgIH0pO1xuICAgIC8vIC4uL25vZGVfbW9kdWxlcy9Abm9ibGUvaGFzaGVzL2VzbS9fYXNzZXJ0LmpzXG4gICAgZnVuY3Rpb24gaXNCeXRlcyhhKSB7XG4gICAgICAgIHJldHVybiBhIGluc3RhbmNlb2YgVWludDhBcnJheSB8fCBhICE9IG51bGwgJiYgdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiYgYS5jb25zdHJ1Y3Rvci5uYW1lID09PSBcIlVpbnQ4QXJyYXlcIjtcbiAgICB9XG4gICAgZnVuY3Rpb24gYnl0ZXMoYiwgLi4ubGVuZ3Rocykge1xuICAgICAgICBpZiAoIWlzQnl0ZXMoYikpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBVaW50OEFycmF5XCIpO1xuICAgICAgICBpZiAobGVuZ3Rocy5sZW5ndGggPiAwICYmICFsZW5ndGhzLmluY2x1ZGVzKGIubGVuZ3RoKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgVWludDhBcnJheSBvZiBsZW5ndGggJHtsZW5ndGhzfSwgbm90IG9mIGxlbmd0aD0ke2IubGVuZ3RofWApO1xuICAgIH1cbiAgICBmdW5jdGlvbiBleGlzdHMoaW5zdGFuY2UsIGNoZWNrRmluaXNoZWQgPSB0cnVlKSB7XG4gICAgICAgIGlmIChpbnN0YW5jZS5kZXN0cm95ZWQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJIYXNoIGluc3RhbmNlIGhhcyBiZWVuIGRlc3Ryb3llZFwiKTtcbiAgICAgICAgaWYgKGNoZWNrRmluaXNoZWQgJiYgaW5zdGFuY2UuZmluaXNoZWQpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJIYXNoI2RpZ2VzdCgpIGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkXCIpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBvdXRwdXQob3V0LCBpbnN0YW5jZSkge1xuICAgICAgICBieXRlcyhvdXQpO1xuICAgICAgICBjb25zdCBtaW4gPSBpbnN0YW5jZS5vdXRwdXRMZW47XG4gICAgICAgIGlmIChvdXQubGVuZ3RoIDwgbWluKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGRpZ2VzdEludG8oKSBleHBlY3RzIG91dHB1dCBidWZmZXIgb2YgbGVuZ3RoIGF0IGxlYXN0ICR7bWlufWApO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIC4uL25vZGVfbW9kdWxlcy9Abm9ibGUvaGFzaGVzL2VzbS9jcnlwdG8uanNcbiAgICB2YXIgY3J5cHRvID0gdHlwZW9mIGdsb2JhbFRoaXMgPT09IFwib2JqZWN0XCIgJiYgXCJjcnlwdG9cIiBpbiBnbG9iYWxUaGlzID8gZ2xvYmFsVGhpcy5jcnlwdG8gOiB2b2lkIDA7XG4gICAgLy8gLi4vbm9kZV9tb2R1bGVzL0Bub2JsZS9oYXNoZXMvZXNtL3V0aWxzLmpzXG4gICAgZnVuY3Rpb24gaXNCeXRlczIoYSkge1xuICAgICAgICByZXR1cm4gYSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgYSAhPSBudWxsICYmIHR5cGVvZiBhID09PSBcIm9iamVjdFwiICYmIGEuY29uc3RydWN0b3IubmFtZSA9PT0gXCJVaW50OEFycmF5XCI7XG4gICAgfVxuICAgIHZhciBjcmVhdGVWaWV3ID0gKGFycikgPT4gbmV3IERhdGFWaWV3KGFyci5idWZmZXIsIGFyci5ieXRlT2Zmc2V0LCBhcnIuYnl0ZUxlbmd0aCk7XG4gICAgdmFyIGlzTEUgPSBuZXcgVWludDhBcnJheShuZXcgVWludDMyQXJyYXkoWzI4NzQ1NDAyMF0pLmJ1ZmZlcilbMF0gPT09IDY4O1xuICAgIGlmICghaXNMRSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm9uIGxpdHRsZS1lbmRpYW4gaGFyZHdhcmUgaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICBmdW5jdGlvbiB1dGY4VG9CeXRlcyhzdHIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBzdHIgIT09IFwic3RyaW5nXCIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYHV0ZjhUb0J5dGVzIGV4cGVjdGVkIHN0cmluZywgZ290ICR7dHlwZW9mIHN0cn1gKTtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzdHIpKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdG9CeXRlcyhkYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIilcbiAgICAgICAgICAgIGRhdGEgPSB1dGY4VG9CeXRlcyhkYXRhKTtcbiAgICAgICAgaWYgKCFpc0J5dGVzMihkYXRhKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgZXhwZWN0ZWQgVWludDhBcnJheSwgZ290ICR7dHlwZW9mIGRhdGF9YCk7XG4gICAgICAgIHJldHVybiBkYXRhO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb25jYXRCeXRlcyguLi5hcnJheXMpIHtcbiAgICAgICAgbGV0IHN1bSA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhID0gYXJyYXlzW2ldO1xuICAgICAgICAgICAgaWYgKCFpc0J5dGVzMihhKSlcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJVaW50OEFycmF5IGV4cGVjdGVkXCIpO1xuICAgICAgICAgICAgc3VtICs9IGEubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlcyA9IG5ldyBVaW50OEFycmF5KHN1bSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwLCBwYWQgPSAwOyBpIDwgYXJyYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhID0gYXJyYXlzW2ldO1xuICAgICAgICAgICAgcmVzLnNldChhLCBwYWQpO1xuICAgICAgICAgICAgcGFkICs9IGEubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHZhciBIYXNoID0gY2xhc3Mge1xuICAgICAgICAvLyBTYWZlIHZlcnNpb24gdGhhdCBjbG9uZXMgaW50ZXJuYWwgc3RhdGVcbiAgICAgICAgY2xvbmUoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fY2xvbmVJbnRvKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHZhciB0b1N0ciA9IHt9LnRvU3RyaW5nO1xuICAgIGZ1bmN0aW9uIHdyYXBDb25zdHJ1Y3RvcihoYXNoQ29ucykge1xuICAgICAgICBjb25zdCBoYXNoQyA9IChtc2cpID0+IGhhc2hDb25zKCkudXBkYXRlKHRvQnl0ZXMobXNnKSkuZGlnZXN0KCk7XG4gICAgICAgIGNvbnN0IHRtcCA9IGhhc2hDb25zKCk7XG4gICAgICAgIGhhc2hDLm91dHB1dExlbiA9IHRtcC5vdXRwdXRMZW47XG4gICAgICAgIGhhc2hDLmJsb2NrTGVuID0gdG1wLmJsb2NrTGVuO1xuICAgICAgICBoYXNoQy5jcmVhdGUgPSAoKSA9PiBoYXNoQ29ucygpO1xuICAgICAgICByZXR1cm4gaGFzaEM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJhbmRvbUJ5dGVzKGJ5dGVzTGVuZ3RoID0gMzIpIHtcbiAgICAgICAgaWYgKGNyeXB0byAmJiB0eXBlb2YgY3J5cHRvLmdldFJhbmRvbVZhbHVlcyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShieXRlc0xlbmd0aCkpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNyeXB0by5nZXRSYW5kb21WYWx1ZXMgbXVzdCBiZSBkZWZpbmVkXCIpO1xuICAgIH1cbiAgICAvLyAuLi9ub2RlX21vZHVsZXMvQG5vYmxlL2hhc2hlcy9lc20vX3NoYTIuanNcbiAgICBmdW5jdGlvbiBzZXRCaWdVaW50NjQodmlldywgYnl0ZU9mZnNldCwgdmFsdWUsIGlzTEUyKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygdmlldy5zZXRCaWdVaW50NjQgPT09IFwiZnVuY3Rpb25cIilcbiAgICAgICAgICAgIHJldHVybiB2aWV3LnNldEJpZ1VpbnQ2NChieXRlT2Zmc2V0LCB2YWx1ZSwgaXNMRTIpO1xuICAgICAgICBjb25zdCBfMzJuMiA9IEJpZ0ludCgzMik7XG4gICAgICAgIGNvbnN0IF91MzJfbWF4ID0gQmlnSW50KDQyOTQ5NjcyOTUpO1xuICAgICAgICBjb25zdCB3aCA9IE51bWJlcih2YWx1ZSA+PiBfMzJuMiAmIF91MzJfbWF4KTtcbiAgICAgICAgY29uc3Qgd2wgPSBOdW1iZXIodmFsdWUgJiBfdTMyX21heCk7XG4gICAgICAgIGNvbnN0IGggPSBpc0xFMiA/IDQgOiAwO1xuICAgICAgICBjb25zdCBsID0gaXNMRTIgPyAwIDogNDtcbiAgICAgICAgdmlldy5zZXRVaW50MzIoYnl0ZU9mZnNldCArIGgsIHdoLCBpc0xFMik7XG4gICAgICAgIHZpZXcuc2V0VWludDMyKGJ5dGVPZmZzZXQgKyBsLCB3bCwgaXNMRTIpO1xuICAgIH1cbiAgICB2YXIgU0hBMiA9IGNsYXNzIGV4dGVuZHMgSGFzaCB7XG4gICAgICAgIGNvbnN0cnVjdG9yKGJsb2NrTGVuLCBvdXRwdXRMZW4sIHBhZE9mZnNldCwgaXNMRTIpIHtcbiAgICAgICAgICAgIHN1cGVyKCk7XG4gICAgICAgICAgICB0aGlzLmJsb2NrTGVuID0gYmxvY2tMZW47XG4gICAgICAgICAgICB0aGlzLm91dHB1dExlbiA9IG91dHB1dExlbjtcbiAgICAgICAgICAgIHRoaXMucGFkT2Zmc2V0ID0gcGFkT2Zmc2V0O1xuICAgICAgICAgICAgdGhpcy5pc0xFID0gaXNMRTI7XG4gICAgICAgICAgICB0aGlzLmZpbmlzaGVkID0gZmFsc2U7XG4gICAgICAgICAgICB0aGlzLmxlbmd0aCA9IDA7XG4gICAgICAgICAgICB0aGlzLnBvcyA9IDA7XG4gICAgICAgICAgICB0aGlzLmRlc3Ryb3llZCA9IGZhbHNlO1xuICAgICAgICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDhBcnJheShibG9ja0xlbik7XG4gICAgICAgICAgICB0aGlzLnZpZXcgPSBjcmVhdGVWaWV3KHRoaXMuYnVmZmVyKTtcbiAgICAgICAgfVxuICAgICAgICB1cGRhdGUoZGF0YSkge1xuICAgICAgICAgICAgZXhpc3RzKHRoaXMpO1xuICAgICAgICAgICAgY29uc3QgeyB2aWV3LCBidWZmZXIsIGJsb2NrTGVuIH0gPSB0aGlzO1xuICAgICAgICAgICAgZGF0YSA9IHRvQnl0ZXMoZGF0YSk7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IGxlbjspIHtcbiAgICAgICAgICAgICAgICBjb25zdCB0YWtlID0gTWF0aC5taW4oYmxvY2tMZW4gLSB0aGlzLnBvcywgbGVuIC0gcG9zKTtcbiAgICAgICAgICAgICAgICBpZiAodGFrZSA9PT0gYmxvY2tMZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZGF0YVZpZXcgPSBjcmVhdGVWaWV3KGRhdGEpO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKDsgYmxvY2tMZW4gPD0gbGVuIC0gcG9zOyBwb3MgKz0gYmxvY2tMZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3MoZGF0YVZpZXcsIHBvcyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBidWZmZXIuc2V0KGRhdGEuc3ViYXJyYXkocG9zLCBwb3MgKyB0YWtlKSwgdGhpcy5wb3MpO1xuICAgICAgICAgICAgICAgIHRoaXMucG9zICs9IHRha2U7XG4gICAgICAgICAgICAgICAgcG9zICs9IHRha2U7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucG9zID09PSBibG9ja0xlbikge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnByb2Nlc3ModmlldywgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucG9zID0gMDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmxlbmd0aCArPSBkYXRhLmxlbmd0aDtcbiAgICAgICAgICAgIHRoaXMucm91bmRDbGVhbigpO1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgZGlnZXN0SW50byhvdXQpIHtcbiAgICAgICAgICAgIGV4aXN0cyh0aGlzKTtcbiAgICAgICAgICAgIG91dHB1dChvdXQsIHRoaXMpO1xuICAgICAgICAgICAgdGhpcy5maW5pc2hlZCA9IHRydWU7XG4gICAgICAgICAgICBjb25zdCB7IGJ1ZmZlciwgdmlldywgYmxvY2tMZW4sIGlzTEU6IGlzTEUyIH0gPSB0aGlzO1xuICAgICAgICAgICAgbGV0IHsgcG9zIH0gPSB0aGlzO1xuICAgICAgICAgICAgYnVmZmVyW3BvcysrXSA9IDEyODtcbiAgICAgICAgICAgIHRoaXMuYnVmZmVyLnN1YmFycmF5KHBvcykuZmlsbCgwKTtcbiAgICAgICAgICAgIGlmICh0aGlzLnBhZE9mZnNldCA+IGJsb2NrTGVuIC0gcG9zKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcm9jZXNzKHZpZXcsIDApO1xuICAgICAgICAgICAgICAgIHBvcyA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gcG9zOyBpIDwgYmxvY2tMZW47IGkrKylcbiAgICAgICAgICAgICAgICBidWZmZXJbaV0gPSAwO1xuICAgICAgICAgICAgc2V0QmlnVWludDY0KHZpZXcsIGJsb2NrTGVuIC0gOCwgQmlnSW50KHRoaXMubGVuZ3RoICogOCksIGlzTEUyKTtcbiAgICAgICAgICAgIHRoaXMucHJvY2Vzcyh2aWV3LCAwKTtcbiAgICAgICAgICAgIGNvbnN0IG92aWV3ID0gY3JlYXRlVmlldyhvdXQpO1xuICAgICAgICAgICAgY29uc3QgbGVuID0gdGhpcy5vdXRwdXRMZW47XG4gICAgICAgICAgICBpZiAobGVuICUgNClcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJfc2hhMjogb3V0cHV0TGVuIHNob3VsZCBiZSBhbGlnbmVkIHRvIDMyYml0XCIpO1xuICAgICAgICAgICAgY29uc3Qgb3V0TGVuID0gbGVuIC8gNDtcbiAgICAgICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5nZXQoKTtcbiAgICAgICAgICAgIGlmIChvdXRMZW4gPiBzdGF0ZS5sZW5ndGgpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiX3NoYTI6IG91dHB1dExlbiBiaWdnZXIgdGhhbiBzdGF0ZVwiKTtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0TGVuOyBpKyspXG4gICAgICAgICAgICAgICAgb3ZpZXcuc2V0VWludDMyKDQgKiBpLCBzdGF0ZVtpXSwgaXNMRTIpO1xuICAgICAgICB9XG4gICAgICAgIGRpZ2VzdCgpIHtcbiAgICAgICAgICAgIGNvbnN0IHsgYnVmZmVyLCBvdXRwdXRMZW4gfSA9IHRoaXM7XG4gICAgICAgICAgICB0aGlzLmRpZ2VzdEludG8oYnVmZmVyKTtcbiAgICAgICAgICAgIGNvbnN0IHJlcyA9IGJ1ZmZlci5zbGljZSgwLCBvdXRwdXRMZW4pO1xuICAgICAgICAgICAgdGhpcy5kZXN0cm95KCk7XG4gICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICB9XG4gICAgICAgIF9jbG9uZUludG8odG8pIHtcbiAgICAgICAgICAgIHRvIHx8ICh0byA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKCkpO1xuICAgICAgICAgICAgdG8uc2V0KC4uLnRoaXMuZ2V0KCkpO1xuICAgICAgICAgICAgY29uc3QgeyBibG9ja0xlbiwgYnVmZmVyLCBsZW5ndGgsIGZpbmlzaGVkLCBkZXN0cm95ZWQsIHBvcyB9ID0gdGhpcztcbiAgICAgICAgICAgIHRvLmxlbmd0aCA9IGxlbmd0aDtcbiAgICAgICAgICAgIHRvLnBvcyA9IHBvcztcbiAgICAgICAgICAgIHRvLmZpbmlzaGVkID0gZmluaXNoZWQ7XG4gICAgICAgICAgICB0by5kZXN0cm95ZWQgPSBkZXN0cm95ZWQ7XG4gICAgICAgICAgICBpZiAobGVuZ3RoICUgYmxvY2tMZW4pXG4gICAgICAgICAgICAgICAgdG8uYnVmZmVyLnNldChidWZmZXIpO1xuICAgICAgICAgICAgcmV0dXJuIHRvO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAvLyAuLi9ub2RlX21vZHVsZXMvQG5vYmxlL2hhc2hlcy9lc20vX3U2NC5qc1xuICAgIHZhciBVMzJfTUFTSzY0ID0gLyogQF9fUFVSRV9fICovIEJpZ0ludCgyICoqIDMyIC0gMSk7XG4gICAgdmFyIF8zMm4gPSAvKiBAX19QVVJFX18gKi8gQmlnSW50KDMyKTtcbiAgICBmdW5jdGlvbiBmcm9tQmlnKG4sIGxlID0gZmFsc2UpIHtcbiAgICAgICAgaWYgKGxlKVxuICAgICAgICAgICAgcmV0dXJuIHsgaDogTnVtYmVyKG4gJiBVMzJfTUFTSzY0KSwgbDogTnVtYmVyKG4gPj4gXzMybiAmIFUzMl9NQVNLNjQpIH07XG4gICAgICAgIHJldHVybiB7IGg6IE51bWJlcihuID4+IF8zMm4gJiBVMzJfTUFTSzY0KSB8IDAsIGw6IE51bWJlcihuICYgVTMyX01BU0s2NCkgfCAwIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNwbGl0KGxzdCwgbGUgPSBmYWxzZSkge1xuICAgICAgICBsZXQgQWggPSBuZXcgVWludDMyQXJyYXkobHN0Lmxlbmd0aCk7XG4gICAgICAgIGxldCBBbCA9IG5ldyBVaW50MzJBcnJheShsc3QubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsc3QubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHsgaCwgbCB9ID0gZnJvbUJpZyhsc3RbaV0sIGxlKTtcbiAgICAgICAgICAgIFtBaFtpXSwgQWxbaV1dID0gW2gsIGxdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBbQWgsIEFsXTtcbiAgICB9XG4gICAgdmFyIHRvQmlnID0gKGgsIGwpID0+IEJpZ0ludChoID4+PiAwKSA8PCBfMzJuIHwgQmlnSW50KGwgPj4+IDApO1xuICAgIHZhciBzaHJTSCA9IChoLCBfbCwgcykgPT4gaCA+Pj4gcztcbiAgICB2YXIgc2hyU0wgPSAoaCwgbCwgcykgPT4gaCA8PCAzMiAtIHMgfCBsID4+PiBzO1xuICAgIHZhciByb3RyU0ggPSAoaCwgbCwgcykgPT4gaCA+Pj4gcyB8IGwgPDwgMzIgLSBzO1xuICAgIHZhciByb3RyU0wgPSAoaCwgbCwgcykgPT4gaCA8PCAzMiAtIHMgfCBsID4+PiBzO1xuICAgIHZhciByb3RyQkggPSAoaCwgbCwgcykgPT4gaCA8PCA2NCAtIHMgfCBsID4+PiBzIC0gMzI7XG4gICAgdmFyIHJvdHJCTCA9IChoLCBsLCBzKSA9PiBoID4+PiBzIC0gMzIgfCBsIDw8IDY0IC0gcztcbiAgICB2YXIgcm90cjMySCA9IChfaCwgbCkgPT4gbDtcbiAgICB2YXIgcm90cjMyTCA9IChoLCBfbCkgPT4gaDtcbiAgICB2YXIgcm90bFNIID0gKGgsIGwsIHMpID0+IGggPDwgcyB8IGwgPj4+IDMyIC0gcztcbiAgICB2YXIgcm90bFNMID0gKGgsIGwsIHMpID0+IGwgPDwgcyB8IGggPj4+IDMyIC0gcztcbiAgICB2YXIgcm90bEJIID0gKGgsIGwsIHMpID0+IGwgPDwgcyAtIDMyIHwgaCA+Pj4gNjQgLSBzO1xuICAgIHZhciByb3RsQkwgPSAoaCwgbCwgcykgPT4gaCA8PCBzIC0gMzIgfCBsID4+PiA2NCAtIHM7XG4gICAgZnVuY3Rpb24gYWRkKEFoLCBBbCwgQmgsIEJsKSB7XG4gICAgICAgIGNvbnN0IGwgPSAoQWwgPj4+IDApICsgKEJsID4+PiAwKTtcbiAgICAgICAgcmV0dXJuIHsgaDogQWggKyBCaCArIChsIC8gMiAqKiAzMiB8IDApIHwgMCwgbDogbCB8IDAgfTtcbiAgICB9XG4gICAgdmFyIGFkZDNMID0gKEFsLCBCbCwgQ2wpID0+IChBbCA+Pj4gMCkgKyAoQmwgPj4+IDApICsgKENsID4+PiAwKTtcbiAgICB2YXIgYWRkM0ggPSAobG93LCBBaCwgQmgsIENoKSA9PiBBaCArIEJoICsgQ2ggKyAobG93IC8gMiAqKiAzMiB8IDApIHwgMDtcbiAgICB2YXIgYWRkNEwgPSAoQWwsIEJsLCBDbCwgRGwpID0+IChBbCA+Pj4gMCkgKyAoQmwgPj4+IDApICsgKENsID4+PiAwKSArIChEbCA+Pj4gMCk7XG4gICAgdmFyIGFkZDRIID0gKGxvdywgQWgsIEJoLCBDaCwgRGgpID0+IEFoICsgQmggKyBDaCArIERoICsgKGxvdyAvIDIgKiogMzIgfCAwKSB8IDA7XG4gICAgdmFyIGFkZDVMID0gKEFsLCBCbCwgQ2wsIERsLCBFbCkgPT4gKEFsID4+PiAwKSArIChCbCA+Pj4gMCkgKyAoQ2wgPj4+IDApICsgKERsID4+PiAwKSArIChFbCA+Pj4gMCk7XG4gICAgdmFyIGFkZDVIID0gKGxvdywgQWgsIEJoLCBDaCwgRGgsIEVoKSA9PiBBaCArIEJoICsgQ2ggKyBEaCArIEVoICsgKGxvdyAvIDIgKiogMzIgfCAwKSB8IDA7XG4gICAgdmFyIHU2NCA9IHtcbiAgICAgICAgZnJvbUJpZyxcbiAgICAgICAgc3BsaXQsXG4gICAgICAgIHRvQmlnLFxuICAgICAgICBzaHJTSCxcbiAgICAgICAgc2hyU0wsXG4gICAgICAgIHJvdHJTSCxcbiAgICAgICAgcm90clNMLFxuICAgICAgICByb3RyQkgsXG4gICAgICAgIHJvdHJCTCxcbiAgICAgICAgcm90cjMySCxcbiAgICAgICAgcm90cjMyTCxcbiAgICAgICAgcm90bFNILFxuICAgICAgICByb3RsU0wsXG4gICAgICAgIHJvdGxCSCxcbiAgICAgICAgcm90bEJMLFxuICAgICAgICBhZGQsXG4gICAgICAgIGFkZDNMLFxuICAgICAgICBhZGQzSCxcbiAgICAgICAgYWRkNEwsXG4gICAgICAgIGFkZDRILFxuICAgICAgICBhZGQ1SCxcbiAgICAgICAgYWRkNUxcbiAgICB9O1xuICAgIHZhciB1NjRfZGVmYXVsdCA9IHU2NDtcbiAgICAvLyAuLi9ub2RlX21vZHVsZXMvQG5vYmxlL2hhc2hlcy9lc20vc2hhNTEyLmpzXG4gICAgdmFyIFtTSEE1MTJfS2gsIFNIQTUxMl9LbF0gPSAvKiBAX19QVVJFX18gKi8gKCgpID0+IHU2NF9kZWZhdWx0LnNwbGl0KFtcbiAgICAgICAgXCIweDQyOGEyZjk4ZDcyOGFlMjJcIixcbiAgICAgICAgXCIweDcxMzc0NDkxMjNlZjY1Y2RcIixcbiAgICAgICAgXCIweGI1YzBmYmNmZWM0ZDNiMmZcIixcbiAgICAgICAgXCIweGU5YjVkYmE1ODE4OWRiYmNcIixcbiAgICAgICAgXCIweDM5NTZjMjViZjM0OGI1MzhcIixcbiAgICAgICAgXCIweDU5ZjExMWYxYjYwNWQwMTlcIixcbiAgICAgICAgXCIweDkyM2Y4MmE0YWYxOTRmOWJcIixcbiAgICAgICAgXCIweGFiMWM1ZWQ1ZGE2ZDgxMThcIixcbiAgICAgICAgXCIweGQ4MDdhYTk4YTMwMzAyNDJcIixcbiAgICAgICAgXCIweDEyODM1YjAxNDU3MDZmYmVcIixcbiAgICAgICAgXCIweDI0MzE4NWJlNGVlNGIyOGNcIixcbiAgICAgICAgXCIweDU1MGM3ZGMzZDVmZmI0ZTJcIixcbiAgICAgICAgXCIweDcyYmU1ZDc0ZjI3Yjg5NmZcIixcbiAgICAgICAgXCIweDgwZGViMWZlM2IxNjk2YjFcIixcbiAgICAgICAgXCIweDliZGMwNmE3MjVjNzEyMzVcIixcbiAgICAgICAgXCIweGMxOWJmMTc0Y2Y2OTI2OTRcIixcbiAgICAgICAgXCIweGU0OWI2OWMxOWVmMTRhZDJcIixcbiAgICAgICAgXCIweGVmYmU0Nzg2Mzg0ZjI1ZTNcIixcbiAgICAgICAgXCIweDBmYzE5ZGM2OGI4Y2Q1YjVcIixcbiAgICAgICAgXCIweDI0MGNhMWNjNzdhYzljNjVcIixcbiAgICAgICAgXCIweDJkZTkyYzZmNTkyYjAyNzVcIixcbiAgICAgICAgXCIweDRhNzQ4NGFhNmVhNmU0ODNcIixcbiAgICAgICAgXCIweDVjYjBhOWRjYmQ0MWZiZDRcIixcbiAgICAgICAgXCIweDc2Zjk4OGRhODMxMTUzYjVcIixcbiAgICAgICAgXCIweDk4M2U1MTUyZWU2NmRmYWJcIixcbiAgICAgICAgXCIweGE4MzFjNjZkMmRiNDMyMTBcIixcbiAgICAgICAgXCIweGIwMDMyN2M4OThmYjIxM2ZcIixcbiAgICAgICAgXCIweGJmNTk3ZmM3YmVlZjBlZTRcIixcbiAgICAgICAgXCIweGM2ZTAwYmYzM2RhODhmYzJcIixcbiAgICAgICAgXCIweGQ1YTc5MTQ3OTMwYWE3MjVcIixcbiAgICAgICAgXCIweDA2Y2E2MzUxZTAwMzgyNmZcIixcbiAgICAgICAgXCIweDE0MjkyOTY3MGEwZTZlNzBcIixcbiAgICAgICAgXCIweDI3YjcwYTg1NDZkMjJmZmNcIixcbiAgICAgICAgXCIweDJlMWIyMTM4NWMyNmM5MjZcIixcbiAgICAgICAgXCIweDRkMmM2ZGZjNWFjNDJhZWRcIixcbiAgICAgICAgXCIweDUzMzgwZDEzOWQ5NWIzZGZcIixcbiAgICAgICAgXCIweDY1MGE3MzU0OGJhZjYzZGVcIixcbiAgICAgICAgXCIweDc2NmEwYWJiM2M3N2IyYThcIixcbiAgICAgICAgXCIweDgxYzJjOTJlNDdlZGFlZTZcIixcbiAgICAgICAgXCIweDkyNzIyYzg1MTQ4MjM1M2JcIixcbiAgICAgICAgXCIweGEyYmZlOGExNGNmMTAzNjRcIixcbiAgICAgICAgXCIweGE4MWE2NjRiYmM0MjMwMDFcIixcbiAgICAgICAgXCIweGMyNGI4YjcwZDBmODk3OTFcIixcbiAgICAgICAgXCIweGM3NmM1MWEzMDY1NGJlMzBcIixcbiAgICAgICAgXCIweGQxOTJlODE5ZDZlZjUyMThcIixcbiAgICAgICAgXCIweGQ2OTkwNjI0NTU2NWE5MTBcIixcbiAgICAgICAgXCIweGY0MGUzNTg1NTc3MTIwMmFcIixcbiAgICAgICAgXCIweDEwNmFhMDcwMzJiYmQxYjhcIixcbiAgICAgICAgXCIweDE5YTRjMTE2YjhkMmQwYzhcIixcbiAgICAgICAgXCIweDFlMzc2YzA4NTE0MWFiNTNcIixcbiAgICAgICAgXCIweDI3NDg3NzRjZGY4ZWViOTlcIixcbiAgICAgICAgXCIweDM0YjBiY2I1ZTE5YjQ4YThcIixcbiAgICAgICAgXCIweDM5MWMwY2IzYzVjOTVhNjNcIixcbiAgICAgICAgXCIweDRlZDhhYTRhZTM0MThhY2JcIixcbiAgICAgICAgXCIweDViOWNjYTRmNzc2M2UzNzNcIixcbiAgICAgICAgXCIweDY4MmU2ZmYzZDZiMmI4YTNcIixcbiAgICAgICAgXCIweDc0OGY4MmVlNWRlZmIyZmNcIixcbiAgICAgICAgXCIweDc4YTU2MzZmNDMxNzJmNjBcIixcbiAgICAgICAgXCIweDg0Yzg3ODE0YTFmMGFiNzJcIixcbiAgICAgICAgXCIweDhjYzcwMjA4MWE2NDM5ZWNcIixcbiAgICAgICAgXCIweDkwYmVmZmZhMjM2MzFlMjhcIixcbiAgICAgICAgXCIweGE0NTA2Y2ViZGU4MmJkZTlcIixcbiAgICAgICAgXCIweGJlZjlhM2Y3YjJjNjc5MTVcIixcbiAgICAgICAgXCIweGM2NzE3OGYyZTM3MjUzMmJcIixcbiAgICAgICAgXCIweGNhMjczZWNlZWEyNjYxOWNcIixcbiAgICAgICAgXCIweGQxODZiOGM3MjFjMGMyMDdcIixcbiAgICAgICAgXCIweGVhZGE3ZGQ2Y2RlMGViMWVcIixcbiAgICAgICAgXCIweGY1N2Q0ZjdmZWU2ZWQxNzhcIixcbiAgICAgICAgXCIweDA2ZjA2N2FhNzIxNzZmYmFcIixcbiAgICAgICAgXCIweDBhNjM3ZGM1YTJjODk4YTZcIixcbiAgICAgICAgXCIweDExM2Y5ODA0YmVmOTBkYWVcIixcbiAgICAgICAgXCIweDFiNzEwYjM1MTMxYzQ3MWJcIixcbiAgICAgICAgXCIweDI4ZGI3N2Y1MjMwNDdkODRcIixcbiAgICAgICAgXCIweDMyY2FhYjdiNDBjNzI0OTNcIixcbiAgICAgICAgXCIweDNjOWViZTBhMTVjOWJlYmNcIixcbiAgICAgICAgXCIweDQzMWQ2N2M0OWMxMDBkNGNcIixcbiAgICAgICAgXCIweDRjYzVkNGJlY2IzZTQyYjZcIixcbiAgICAgICAgXCIweDU5N2YyOTljZmM2NTdlMmFcIixcbiAgICAgICAgXCIweDVmY2I2ZmFiM2FkNmZhZWNcIixcbiAgICAgICAgXCIweDZjNDQxOThjNGE0NzU4MTdcIlxuICAgIF0ubWFwKChuKSA9PiBCaWdJbnQobikpKSkoKTtcbiAgICB2YXIgU0hBNTEyX1dfSCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgVWludDMyQXJyYXkoODApO1xuICAgIHZhciBTSEE1MTJfV19MID0gLyogQF9fUFVSRV9fICovIG5ldyBVaW50MzJBcnJheSg4MCk7XG4gICAgdmFyIFNIQTUxMiA9IGNsYXNzIGV4dGVuZHMgU0hBMiB7XG4gICAgICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICAgICAgc3VwZXIoMTI4LCA2NCwgMTYsIGZhbHNlKTtcbiAgICAgICAgICAgIHRoaXMuQWggPSAxNzc5MDMzNzAzIHwgMDtcbiAgICAgICAgICAgIHRoaXMuQWwgPSA0MDg5MjM1NzIwIHwgMDtcbiAgICAgICAgICAgIHRoaXMuQmggPSAzMTQ0MTM0Mjc3IHwgMDtcbiAgICAgICAgICAgIHRoaXMuQmwgPSAyMjI3ODczNTk1IHwgMDtcbiAgICAgICAgICAgIHRoaXMuQ2ggPSAxMDEzOTA0MjQyIHwgMDtcbiAgICAgICAgICAgIHRoaXMuQ2wgPSA0MjcxMTc1NzIzIHwgMDtcbiAgICAgICAgICAgIHRoaXMuRGggPSAyNzczNDgwNzYyIHwgMDtcbiAgICAgICAgICAgIHRoaXMuRGwgPSAxNTk1NzUwMTI5IHwgMDtcbiAgICAgICAgICAgIHRoaXMuRWggPSAxMzU5ODkzMTE5IHwgMDtcbiAgICAgICAgICAgIHRoaXMuRWwgPSAyOTE3NTY1MTM3IHwgMDtcbiAgICAgICAgICAgIHRoaXMuRmggPSAyNjAwODIyOTI0IHwgMDtcbiAgICAgICAgICAgIHRoaXMuRmwgPSA3MjU1MTExOTkgfCAwO1xuICAgICAgICAgICAgdGhpcy5HaCA9IDUyODczNDYzNSB8IDA7XG4gICAgICAgICAgICB0aGlzLkdsID0gNDIxNTM4OTU0NyB8IDA7XG4gICAgICAgICAgICB0aGlzLkhoID0gMTU0MTQ1OTIyNSB8IDA7XG4gICAgICAgICAgICB0aGlzLkhsID0gMzI3MDMzMjA5IHwgMDtcbiAgICAgICAgfVxuICAgICAgICAvLyBwcmV0dGllci1pZ25vcmVcbiAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgY29uc3QgeyBBaCwgQWwsIEJoLCBCbCwgQ2gsIENsLCBEaCwgRGwsIEVoLCBFbCwgRmgsIEZsLCBHaCwgR2wsIEhoLCBIbCB9ID0gdGhpcztcbiAgICAgICAgICAgIHJldHVybiBbQWgsIEFsLCBCaCwgQmwsIENoLCBDbCwgRGgsIERsLCBFaCwgRWwsIEZoLCBGbCwgR2gsIEdsLCBIaCwgSGxdO1xuICAgICAgICB9XG4gICAgICAgIC8vIHByZXR0aWVyLWlnbm9yZVxuICAgICAgICBzZXQoQWgsIEFsLCBCaCwgQmwsIENoLCBDbCwgRGgsIERsLCBFaCwgRWwsIEZoLCBGbCwgR2gsIEdsLCBIaCwgSGwpIHtcbiAgICAgICAgICAgIHRoaXMuQWggPSBBaCB8IDA7XG4gICAgICAgICAgICB0aGlzLkFsID0gQWwgfCAwO1xuICAgICAgICAgICAgdGhpcy5CaCA9IEJoIHwgMDtcbiAgICAgICAgICAgIHRoaXMuQmwgPSBCbCB8IDA7XG4gICAgICAgICAgICB0aGlzLkNoID0gQ2ggfCAwO1xuICAgICAgICAgICAgdGhpcy5DbCA9IENsIHwgMDtcbiAgICAgICAgICAgIHRoaXMuRGggPSBEaCB8IDA7XG4gICAgICAgICAgICB0aGlzLkRsID0gRGwgfCAwO1xuICAgICAgICAgICAgdGhpcy5FaCA9IEVoIHwgMDtcbiAgICAgICAgICAgIHRoaXMuRWwgPSBFbCB8IDA7XG4gICAgICAgICAgICB0aGlzLkZoID0gRmggfCAwO1xuICAgICAgICAgICAgdGhpcy5GbCA9IEZsIHwgMDtcbiAgICAgICAgICAgIHRoaXMuR2ggPSBHaCB8IDA7XG4gICAgICAgICAgICB0aGlzLkdsID0gR2wgfCAwO1xuICAgICAgICAgICAgdGhpcy5IaCA9IEhoIHwgMDtcbiAgICAgICAgICAgIHRoaXMuSGwgPSBIbCB8IDA7XG4gICAgICAgIH1cbiAgICAgICAgcHJvY2Vzcyh2aWV3LCBvZmZzZXQpIHtcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKywgb2Zmc2V0ICs9IDQpIHtcbiAgICAgICAgICAgICAgICBTSEE1MTJfV19IW2ldID0gdmlldy5nZXRVaW50MzIob2Zmc2V0KTtcbiAgICAgICAgICAgICAgICBTSEE1MTJfV19MW2ldID0gdmlldy5nZXRVaW50MzIob2Zmc2V0ICs9IDQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE2OyBpIDwgODA7IGkrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IFcxNWggPSBTSEE1MTJfV19IW2kgLSAxNV0gfCAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IFcxNWwgPSBTSEE1MTJfV19MW2kgLSAxNV0gfCAwO1xuICAgICAgICAgICAgICAgIGNvbnN0IHMwaCA9IHU2NF9kZWZhdWx0LnJvdHJTSChXMTVoLCBXMTVsLCAxKSBeIHU2NF9kZWZhdWx0LnJvdHJTSChXMTVoLCBXMTVsLCA4KSBeIHU2NF9kZWZhdWx0LnNoclNIKFcxNWgsIFcxNWwsIDcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHMwbCA9IHU2NF9kZWZhdWx0LnJvdHJTTChXMTVoLCBXMTVsLCAxKSBeIHU2NF9kZWZhdWx0LnJvdHJTTChXMTVoLCBXMTVsLCA4KSBeIHU2NF9kZWZhdWx0LnNoclNMKFcxNWgsIFcxNWwsIDcpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFcyaCA9IFNIQTUxMl9XX0hbaSAtIDJdIHwgMDtcbiAgICAgICAgICAgICAgICBjb25zdCBXMmwgPSBTSEE1MTJfV19MW2kgLSAyXSB8IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgczFoID0gdTY0X2RlZmF1bHQucm90clNIKFcyaCwgVzJsLCAxOSkgXiB1NjRfZGVmYXVsdC5yb3RyQkgoVzJoLCBXMmwsIDYxKSBeIHU2NF9kZWZhdWx0LnNoclNIKFcyaCwgVzJsLCA2KTtcbiAgICAgICAgICAgICAgICBjb25zdCBzMWwgPSB1NjRfZGVmYXVsdC5yb3RyU0woVzJoLCBXMmwsIDE5KSBeIHU2NF9kZWZhdWx0LnJvdHJCTChXMmgsIFcybCwgNjEpIF4gdTY0X2RlZmF1bHQuc2hyU0woVzJoLCBXMmwsIDYpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFNVTWwgPSB1NjRfZGVmYXVsdC5hZGQ0TChzMGwsIHMxbCwgU0hBNTEyX1dfTFtpIC0gN10sIFNIQTUxMl9XX0xbaSAtIDE2XSk7XG4gICAgICAgICAgICAgICAgY29uc3QgU1VNaCA9IHU2NF9kZWZhdWx0LmFkZDRIKFNVTWwsIHMwaCwgczFoLCBTSEE1MTJfV19IW2kgLSA3XSwgU0hBNTEyX1dfSFtpIC0gMTZdKTtcbiAgICAgICAgICAgICAgICBTSEE1MTJfV19IW2ldID0gU1VNaCB8IDA7XG4gICAgICAgICAgICAgICAgU0hBNTEyX1dfTFtpXSA9IFNVTWwgfCAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGV0IHsgQWgsIEFsLCBCaCwgQmwsIENoLCBDbCwgRGgsIERsLCBFaCwgRWwsIEZoLCBGbCwgR2gsIEdsLCBIaCwgSGwgfSA9IHRoaXM7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDgwOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBzaWdtYTFoID0gdTY0X2RlZmF1bHQucm90clNIKEVoLCBFbCwgMTQpIF4gdTY0X2RlZmF1bHQucm90clNIKEVoLCBFbCwgMTgpIF4gdTY0X2RlZmF1bHQucm90ckJIKEVoLCBFbCwgNDEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpZ21hMWwgPSB1NjRfZGVmYXVsdC5yb3RyU0woRWgsIEVsLCAxNCkgXiB1NjRfZGVmYXVsdC5yb3RyU0woRWgsIEVsLCAxOCkgXiB1NjRfZGVmYXVsdC5yb3RyQkwoRWgsIEVsLCA0MSk7XG4gICAgICAgICAgICAgICAgY29uc3QgQ0hJaCA9IEVoICYgRmggXiB+RWggJiBHaDtcbiAgICAgICAgICAgICAgICBjb25zdCBDSElsID0gRWwgJiBGbCBeIH5FbCAmIEdsO1xuICAgICAgICAgICAgICAgIGNvbnN0IFQxbGwgPSB1NjRfZGVmYXVsdC5hZGQ1TChIbCwgc2lnbWExbCwgQ0hJbCwgU0hBNTEyX0tsW2ldLCBTSEE1MTJfV19MW2ldKTtcbiAgICAgICAgICAgICAgICBjb25zdCBUMWggPSB1NjRfZGVmYXVsdC5hZGQ1SChUMWxsLCBIaCwgc2lnbWExaCwgQ0hJaCwgU0hBNTEyX0toW2ldLCBTSEE1MTJfV19IW2ldKTtcbiAgICAgICAgICAgICAgICBjb25zdCBUMWwgPSBUMWxsIHwgMDtcbiAgICAgICAgICAgICAgICBjb25zdCBzaWdtYTBoID0gdTY0X2RlZmF1bHQucm90clNIKEFoLCBBbCwgMjgpIF4gdTY0X2RlZmF1bHQucm90ckJIKEFoLCBBbCwgMzQpIF4gdTY0X2RlZmF1bHQucm90ckJIKEFoLCBBbCwgMzkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHNpZ21hMGwgPSB1NjRfZGVmYXVsdC5yb3RyU0woQWgsIEFsLCAyOCkgXiB1NjRfZGVmYXVsdC5yb3RyQkwoQWgsIEFsLCAzNCkgXiB1NjRfZGVmYXVsdC5yb3RyQkwoQWgsIEFsLCAzOSk7XG4gICAgICAgICAgICAgICAgY29uc3QgTUFKaCA9IEFoICYgQmggXiBBaCAmIENoIF4gQmggJiBDaDtcbiAgICAgICAgICAgICAgICBjb25zdCBNQUpsID0gQWwgJiBCbCBeIEFsICYgQ2wgXiBCbCAmIENsO1xuICAgICAgICAgICAgICAgIEhoID0gR2ggfCAwO1xuICAgICAgICAgICAgICAgIEhsID0gR2wgfCAwO1xuICAgICAgICAgICAgICAgIEdoID0gRmggfCAwO1xuICAgICAgICAgICAgICAgIEdsID0gRmwgfCAwO1xuICAgICAgICAgICAgICAgIEZoID0gRWggfCAwO1xuICAgICAgICAgICAgICAgIEZsID0gRWwgfCAwO1xuICAgICAgICAgICAgICAgICh7IGg6IEVoLCBsOiBFbCB9ID0gdTY0X2RlZmF1bHQuYWRkKERoIHwgMCwgRGwgfCAwLCBUMWggfCAwLCBUMWwgfCAwKSk7XG4gICAgICAgICAgICAgICAgRGggPSBDaCB8IDA7XG4gICAgICAgICAgICAgICAgRGwgPSBDbCB8IDA7XG4gICAgICAgICAgICAgICAgQ2ggPSBCaCB8IDA7XG4gICAgICAgICAgICAgICAgQ2wgPSBCbCB8IDA7XG4gICAgICAgICAgICAgICAgQmggPSBBaCB8IDA7XG4gICAgICAgICAgICAgICAgQmwgPSBBbCB8IDA7XG4gICAgICAgICAgICAgICAgY29uc3QgQWxsID0gdTY0X2RlZmF1bHQuYWRkM0woVDFsLCBzaWdtYTBsLCBNQUpsKTtcbiAgICAgICAgICAgICAgICBBaCA9IHU2NF9kZWZhdWx0LmFkZDNIKEFsbCwgVDFoLCBzaWdtYTBoLCBNQUpoKTtcbiAgICAgICAgICAgICAgICBBbCA9IEFsbCB8IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAoeyBoOiBBaCwgbDogQWwgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkFoIHwgMCwgdGhpcy5BbCB8IDAsIEFoIHwgMCwgQWwgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBCaCwgbDogQmwgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkJoIHwgMCwgdGhpcy5CbCB8IDAsIEJoIHwgMCwgQmwgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBDaCwgbDogQ2wgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkNoIHwgMCwgdGhpcy5DbCB8IDAsIENoIHwgMCwgQ2wgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBEaCwgbDogRGwgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkRoIHwgMCwgdGhpcy5EbCB8IDAsIERoIHwgMCwgRGwgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBFaCwgbDogRWwgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkVoIHwgMCwgdGhpcy5FbCB8IDAsIEVoIHwgMCwgRWwgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBGaCwgbDogRmwgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkZoIHwgMCwgdGhpcy5GbCB8IDAsIEZoIHwgMCwgRmwgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBHaCwgbDogR2wgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkdoIHwgMCwgdGhpcy5HbCB8IDAsIEdoIHwgMCwgR2wgfCAwKSk7XG4gICAgICAgICAgICAoeyBoOiBIaCwgbDogSGwgfSA9IHU2NF9kZWZhdWx0LmFkZCh0aGlzLkhoIHwgMCwgdGhpcy5IbCB8IDAsIEhoIHwgMCwgSGwgfCAwKSk7XG4gICAgICAgICAgICB0aGlzLnNldChBaCwgQWwsIEJoLCBCbCwgQ2gsIENsLCBEaCwgRGwsIEVoLCBFbCwgRmgsIEZsLCBHaCwgR2wsIEhoLCBIbCk7XG4gICAgICAgIH1cbiAgICAgICAgcm91bmRDbGVhbigpIHtcbiAgICAgICAgICAgIFNIQTUxMl9XX0guZmlsbCgwKTtcbiAgICAgICAgICAgIFNIQTUxMl9XX0wuZmlsbCgwKTtcbiAgICAgICAgfVxuICAgICAgICBkZXN0cm95KCkge1xuICAgICAgICAgICAgdGhpcy5idWZmZXIuZmlsbCgwKTtcbiAgICAgICAgICAgIHRoaXMuc2V0KDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIDApO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB2YXIgc2hhNTEyID0gLyogQF9fUFVSRV9fICovIHdyYXBDb25zdHJ1Y3RvcigoKSA9PiBuZXcgU0hBNTEyKCkpO1xuICAgIC8vIC4uL2VzbS9hYnN0cmFjdC91dGlscy5qc1xuICAgIHZhciBfMG4gPSBCaWdJbnQoMCk7XG4gICAgdmFyIF8xbiA9IEJpZ0ludCgxKTtcbiAgICB2YXIgXzJuID0gQmlnSW50KDIpO1xuICAgIGZ1bmN0aW9uIGlzQnl0ZXMzKGEpIHtcbiAgICAgICAgcmV0dXJuIGEgaW5zdGFuY2VvZiBVaW50OEFycmF5IHx8IGEgIT0gbnVsbCAmJiB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiAmJiBhLmNvbnN0cnVjdG9yLm5hbWUgPT09IFwiVWludDhBcnJheVwiO1xuICAgIH1cbiAgICB2YXIgaGV4ZXMgPSAvKiBAX19QVVJFX18gKi8gQXJyYXkuZnJvbSh7IGxlbmd0aDogMjU2IH0sIChfLCBpKSA9PiBpLnRvU3RyaW5nKDE2KS5wYWRTdGFydCgyLCBcIjBcIikpO1xuICAgIGZ1bmN0aW9uIGJ5dGVzVG9IZXgoYnl0ZXMyKSB7XG4gICAgICAgIGlmICghaXNCeXRlczMoYnl0ZXMyKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVpbnQ4QXJyYXkgZXhwZWN0ZWRcIik7XG4gICAgICAgIGxldCBoZXggPSBcIlwiO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJ5dGVzMi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaGV4ICs9IGhleGVzW2J5dGVzMltpXV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGhleDtcbiAgICB9XG4gICAgZnVuY3Rpb24gaGV4VG9OdW1iZXIoaGV4KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaGV4ICE9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaGV4IHN0cmluZyBleHBlY3RlZCwgZ290IFwiICsgdHlwZW9mIGhleCk7XG4gICAgICAgIHJldHVybiBCaWdJbnQoaGV4ID09PSBcIlwiID8gXCIwXCIgOiBgMHgke2hleH1gKTtcbiAgICB9XG4gICAgdmFyIGFzY2lpcyA9IHsgXzA6IDQ4LCBfOTogNTcsIF9BOiA2NSwgX0Y6IDcwLCBfYTogOTcsIF9mOiAxMDIgfTtcbiAgICBmdW5jdGlvbiBhc2NpaVRvQmFzZTE2KGNoYXIpIHtcbiAgICAgICAgaWYgKGNoYXIgPj0gYXNjaWlzLl8wICYmIGNoYXIgPD0gYXNjaWlzLl85KVxuICAgICAgICAgICAgcmV0dXJuIGNoYXIgLSBhc2NpaXMuXzA7XG4gICAgICAgIGlmIChjaGFyID49IGFzY2lpcy5fQSAmJiBjaGFyIDw9IGFzY2lpcy5fRilcbiAgICAgICAgICAgIHJldHVybiBjaGFyIC0gKGFzY2lpcy5fQSAtIDEwKTtcbiAgICAgICAgaWYgKGNoYXIgPj0gYXNjaWlzLl9hICYmIGNoYXIgPD0gYXNjaWlzLl9mKVxuICAgICAgICAgICAgcmV0dXJuIGNoYXIgLSAoYXNjaWlzLl9hIC0gMTApO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGZ1bmN0aW9uIGhleFRvQnl0ZXMoaGV4KSB7XG4gICAgICAgIGlmICh0eXBlb2YgaGV4ICE9PSBcInN0cmluZ1wiKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaGV4IHN0cmluZyBleHBlY3RlZCwgZ290IFwiICsgdHlwZW9mIGhleCk7XG4gICAgICAgIGNvbnN0IGhsID0gaGV4Lmxlbmd0aDtcbiAgICAgICAgY29uc3QgYWwgPSBobCAvIDI7XG4gICAgICAgIGlmIChobCAlIDIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJwYWRkZWQgaGV4IHN0cmluZyBleHBlY3RlZCwgZ290IHVucGFkZGVkIGhleCBvZiBsZW5ndGggXCIgKyBobCk7XG4gICAgICAgIGNvbnN0IGFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoYWwpO1xuICAgICAgICBmb3IgKGxldCBhaSA9IDAsIGhpID0gMDsgYWkgPCBhbDsgYWkrKywgaGkgKz0gMikge1xuICAgICAgICAgICAgY29uc3QgbjEgPSBhc2NpaVRvQmFzZTE2KGhleC5jaGFyQ29kZUF0KGhpKSk7XG4gICAgICAgICAgICBjb25zdCBuMiA9IGFzY2lpVG9CYXNlMTYoaGV4LmNoYXJDb2RlQXQoaGkgKyAxKSk7XG4gICAgICAgICAgICBpZiAobjEgPT09IHZvaWQgMCB8fCBuMiA9PT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgY2hhciA9IGhleFtoaV0gKyBoZXhbaGkgKyAxXTtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2hleCBzdHJpbmcgZXhwZWN0ZWQsIGdvdCBub24taGV4IGNoYXJhY3RlciBcIicgKyBjaGFyICsgJ1wiIGF0IGluZGV4ICcgKyBoaSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhcnJheVthaV0gPSBuMSAqIDE2ICsgbjI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICBmdW5jdGlvbiBieXRlc1RvTnVtYmVyQkUoYnl0ZXMyKSB7XG4gICAgICAgIHJldHVybiBoZXhUb051bWJlcihieXRlc1RvSGV4KGJ5dGVzMikpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBieXRlc1RvTnVtYmVyTEUoYnl0ZXMyKSB7XG4gICAgICAgIGlmICghaXNCeXRlczMoYnl0ZXMyKSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlVpbnQ4QXJyYXkgZXhwZWN0ZWRcIik7XG4gICAgICAgIHJldHVybiBoZXhUb051bWJlcihieXRlc1RvSGV4KFVpbnQ4QXJyYXkuZnJvbShieXRlczIpLnJldmVyc2UoKSkpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBudW1iZXJUb0J5dGVzQkUobiwgbGVuKSB7XG4gICAgICAgIHJldHVybiBoZXhUb0J5dGVzKG4udG9TdHJpbmcoMTYpLnBhZFN0YXJ0KGxlbiAqIDIsIFwiMFwiKSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG51bWJlclRvQnl0ZXNMRShuLCBsZW4pIHtcbiAgICAgICAgcmV0dXJuIG51bWJlclRvQnl0ZXNCRShuLCBsZW4pLnJldmVyc2UoKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gZW5zdXJlQnl0ZXModGl0bGUsIGhleCwgZXhwZWN0ZWRMZW5ndGgpIHtcbiAgICAgICAgbGV0IHJlcztcbiAgICAgICAgaWYgKHR5cGVvZiBoZXggPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmVzID0gaGV4VG9CeXRlcyhoZXgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGl0bGV9IG11c3QgYmUgdmFsaWQgaGV4IHN0cmluZywgZ290IFwiJHtoZXh9XCIuIENhdXNlOiAke2V9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaXNCeXRlczMoaGV4KSkge1xuICAgICAgICAgICAgcmVzID0gVWludDhBcnJheS5mcm9tKGhleCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYCR7dGl0bGV9IG11c3QgYmUgaGV4IHN0cmluZyBvciBVaW50OEFycmF5YCk7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgbGVuID0gcmVzLmxlbmd0aDtcbiAgICAgICAgaWYgKHR5cGVvZiBleHBlY3RlZExlbmd0aCA9PT0gXCJudW1iZXJcIiAmJiBsZW4gIT09IGV4cGVjdGVkTGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGAke3RpdGxlfSBleHBlY3RlZCAke2V4cGVjdGVkTGVuZ3RofSBieXRlcywgZ290ICR7bGVufWApO1xuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb25jYXRCeXRlczIoLi4uYXJyYXlzKSB7XG4gICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY29uc3QgYSA9IGFycmF5c1tpXTtcbiAgICAgICAgICAgIGlmICghaXNCeXRlczMoYSkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVWludDhBcnJheSBleHBlY3RlZFwiKTtcbiAgICAgICAgICAgIHN1bSArPSBhLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzID0gbmV3IFVpbnQ4QXJyYXkoc3VtKTtcbiAgICAgICAgbGV0IHBhZCA9IDA7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhID0gYXJyYXlzW2ldO1xuICAgICAgICAgICAgcmVzLnNldChhLCBwYWQpO1xuICAgICAgICAgICAgcGFkICs9IGEubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIHZhciBiaXRNYXNrID0gKG4pID0+IChfMm4gPDwgQmlnSW50KG4gLSAxKSkgLSBfMW47XG4gICAgdmFyIHZhbGlkYXRvckZucyA9IHtcbiAgICAgICAgYmlnaW50OiAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcImJpZ2ludFwiLFxuICAgICAgICBmdW5jdGlvbjogKHZhbCkgPT4gdHlwZW9mIHZhbCA9PT0gXCJmdW5jdGlvblwiLFxuICAgICAgICBib29sZWFuOiAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcImJvb2xlYW5cIixcbiAgICAgICAgc3RyaW5nOiAodmFsKSA9PiB0eXBlb2YgdmFsID09PSBcInN0cmluZ1wiLFxuICAgICAgICBzdHJpbmdPclVpbnQ4QXJyYXk6ICh2YWwpID0+IHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIgfHwgaXNCeXRlczModmFsKSxcbiAgICAgICAgaXNTYWZlSW50ZWdlcjogKHZhbCkgPT4gTnVtYmVyLmlzU2FmZUludGVnZXIodmFsKSxcbiAgICAgICAgYXJyYXk6ICh2YWwpID0+IEFycmF5LmlzQXJyYXkodmFsKSxcbiAgICAgICAgZmllbGQ6ICh2YWwsIG9iamVjdCkgPT4gb2JqZWN0LkZwLmlzVmFsaWQodmFsKSxcbiAgICAgICAgaGFzaDogKHZhbCkgPT4gdHlwZW9mIHZhbCA9PT0gXCJmdW5jdGlvblwiICYmIE51bWJlci5pc1NhZmVJbnRlZ2VyKHZhbC5vdXRwdXRMZW4pXG4gICAgfTtcbiAgICBmdW5jdGlvbiB2YWxpZGF0ZU9iamVjdChvYmplY3QsIHZhbGlkYXRvcnMsIG9wdFZhbGlkYXRvcnMgPSB7fSkge1xuICAgICAgICBjb25zdCBjaGVja0ZpZWxkID0gKGZpZWxkTmFtZSwgdHlwZSwgaXNPcHRpb25hbCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgY2hlY2tWYWwgPSB2YWxpZGF0b3JGbnNbdHlwZV07XG4gICAgICAgICAgICBpZiAodHlwZW9mIGNoZWNrVmFsICE9PSBcImZ1bmN0aW9uXCIpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHZhbGlkYXRvciBcIiR7dHlwZX1cIiwgZXhwZWN0ZWQgZnVuY3Rpb25gKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IG9iamVjdFtmaWVsZE5hbWVdO1xuICAgICAgICAgICAgaWYgKGlzT3B0aW9uYWwgJiYgdmFsID09PSB2b2lkIDApXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgaWYgKCFjaGVja1ZhbCh2YWwsIG9iamVjdCkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgcGFyYW0gJHtTdHJpbmcoZmllbGROYW1lKX09JHt2YWx9ICgke3R5cGVvZiB2YWx9KSwgZXhwZWN0ZWQgJHt0eXBlfWApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBmb3IgKGNvbnN0IFtmaWVsZE5hbWUsIHR5cGVdIG9mIE9iamVjdC5lbnRyaWVzKHZhbGlkYXRvcnMpKVxuICAgICAgICAgICAgY2hlY2tGaWVsZChmaWVsZE5hbWUsIHR5cGUsIGZhbHNlKTtcbiAgICAgICAgZm9yIChjb25zdCBbZmllbGROYW1lLCB0eXBlXSBvZiBPYmplY3QuZW50cmllcyhvcHRWYWxpZGF0b3JzKSlcbiAgICAgICAgICAgIGNoZWNrRmllbGQoZmllbGROYW1lLCB0eXBlLCB0cnVlKTtcbiAgICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9XG4gICAgLy8gLi4vZXNtL2Fic3RyYWN0L21vZHVsYXIuanNcbiAgICB2YXIgXzBuMiA9IEJpZ0ludCgwKTtcbiAgICB2YXIgXzFuMiA9IEJpZ0ludCgxKTtcbiAgICB2YXIgXzJuMiA9IEJpZ0ludCgyKTtcbiAgICB2YXIgXzNuID0gQmlnSW50KDMpO1xuICAgIHZhciBfNG4gPSBCaWdJbnQoNCk7XG4gICAgdmFyIF81biA9IEJpZ0ludCg1KTtcbiAgICB2YXIgXzhuID0gQmlnSW50KDgpO1xuICAgIHZhciBfOW4gPSBCaWdJbnQoOSk7XG4gICAgdmFyIF8xNm4gPSBCaWdJbnQoMTYpO1xuICAgIGZ1bmN0aW9uIG1vZChhLCBiKSB7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGEgJSBiO1xuICAgICAgICByZXR1cm4gcmVzdWx0ID49IF8wbjIgPyByZXN1bHQgOiBiICsgcmVzdWx0O1xuICAgIH1cbiAgICBmdW5jdGlvbiBwb3cobnVtLCBwb3dlciwgbW9kdWxvKSB7XG4gICAgICAgIGlmIChtb2R1bG8gPD0gXzBuMiB8fCBwb3dlciA8IF8wbjIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBwb3dlci9tb2R1bG8gPiAwXCIpO1xuICAgICAgICBpZiAobW9kdWxvID09PSBfMW4yKVxuICAgICAgICAgICAgcmV0dXJuIF8wbjI7XG4gICAgICAgIGxldCByZXMgPSBfMW4yO1xuICAgICAgICB3aGlsZSAocG93ZXIgPiBfMG4yKSB7XG4gICAgICAgICAgICBpZiAocG93ZXIgJiBfMW4yKVxuICAgICAgICAgICAgICAgIHJlcyA9IHJlcyAqIG51bSAlIG1vZHVsbztcbiAgICAgICAgICAgIG51bSA9IG51bSAqIG51bSAlIG1vZHVsbztcbiAgICAgICAgICAgIHBvd2VyID4+PSBfMW4yO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvdzIoeCwgcG93ZXIsIG1vZHVsbykge1xuICAgICAgICBsZXQgcmVzID0geDtcbiAgICAgICAgd2hpbGUgKHBvd2VyLS0gPiBfMG4yKSB7XG4gICAgICAgICAgICByZXMgKj0gcmVzO1xuICAgICAgICAgICAgcmVzICU9IG1vZHVsbztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzO1xuICAgIH1cbiAgICBmdW5jdGlvbiBpbnZlcnQobnVtYmVyLCBtb2R1bG8pIHtcbiAgICAgICAgaWYgKG51bWJlciA9PT0gXzBuMiB8fCBtb2R1bG8gPD0gXzBuMikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZlcnQ6IGV4cGVjdGVkIHBvc2l0aXZlIGludGVnZXJzLCBnb3Qgbj0ke251bWJlcn0gbW9kPSR7bW9kdWxvfWApO1xuICAgICAgICB9XG4gICAgICAgIGxldCBhID0gbW9kKG51bWJlciwgbW9kdWxvKTtcbiAgICAgICAgbGV0IGIgPSBtb2R1bG87XG4gICAgICAgIGxldCB4ID0gXzBuMiwgeSA9IF8xbjIsIHUgPSBfMW4yLCB2ID0gXzBuMjtcbiAgICAgICAgd2hpbGUgKGEgIT09IF8wbjIpIHtcbiAgICAgICAgICAgIGNvbnN0IHEgPSBiIC8gYTtcbiAgICAgICAgICAgIGNvbnN0IHIgPSBiICUgYTtcbiAgICAgICAgICAgIGNvbnN0IG0gPSB4IC0gdSAqIHE7XG4gICAgICAgICAgICBjb25zdCBuID0geSAtIHYgKiBxO1xuICAgICAgICAgICAgYiA9IGEsIGEgPSByLCB4ID0gdSwgeSA9IHYsIHUgPSBtLCB2ID0gbjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBnY2QgPSBiO1xuICAgICAgICBpZiAoZ2NkICE9PSBfMW4yKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52ZXJ0OiBkb2VzIG5vdCBleGlzdFwiKTtcbiAgICAgICAgcmV0dXJuIG1vZCh4LCBtb2R1bG8pO1xuICAgIH1cbiAgICBmdW5jdGlvbiB0b25lbGxpU2hhbmtzKFApIHtcbiAgICAgICAgY29uc3QgbGVnZW5kcmVDID0gKFAgLSBfMW4yKSAvIF8ybjI7XG4gICAgICAgIGxldCBRLCBTLCBaO1xuICAgICAgICBmb3IgKFEgPSBQIC0gXzFuMiwgUyA9IDA7IFEgJSBfMm4yID09PSBfMG4yOyBRIC89IF8ybjIsIFMrKylcbiAgICAgICAgICAgIDtcbiAgICAgICAgZm9yIChaID0gXzJuMjsgWiA8IFAgJiYgcG93KFosIGxlZ2VuZHJlQywgUCkgIT09IFAgLSBfMW4yOyBaKyspXG4gICAgICAgICAgICA7XG4gICAgICAgIGlmIChTID09PSAxKSB7XG4gICAgICAgICAgICBjb25zdCBwMWRpdjQgPSAoUCArIF8xbjIpIC8gXzRuO1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uIHRvbmVsbGlGYXN0KEZwMiwgbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBGcDIucG93KG4sIHAxZGl2NCk7XG4gICAgICAgICAgICAgICAgaWYgKCFGcDIuZXFsKEZwMi5zcXIocm9vdCksIG4pKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBzcXVhcmUgcm9vdFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgUTFkaXYyID0gKFEgKyBfMW4yKSAvIF8ybjI7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbiB0b25lbGxpU2xvdyhGcDIsIG4pIHtcbiAgICAgICAgICAgIGlmIChGcDIucG93KG4sIGxlZ2VuZHJlQykgPT09IEZwMi5uZWcoRnAyLk9ORSkpXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgc3F1YXJlIHJvb3RcIik7XG4gICAgICAgICAgICBsZXQgciA9IFM7XG4gICAgICAgICAgICBsZXQgZyA9IEZwMi5wb3coRnAyLm11bChGcDIuT05FLCBaKSwgUSk7XG4gICAgICAgICAgICBsZXQgeCA9IEZwMi5wb3cobiwgUTFkaXYyKTtcbiAgICAgICAgICAgIGxldCBiID0gRnAyLnBvdyhuLCBRKTtcbiAgICAgICAgICAgIHdoaWxlICghRnAyLmVxbChiLCBGcDIuT05FKSkge1xuICAgICAgICAgICAgICAgIGlmIChGcDIuZXFsKGIsIEZwMi5aRVJPKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEZwMi5aRVJPO1xuICAgICAgICAgICAgICAgIGxldCBtID0gMTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB0MiA9IEZwMi5zcXIoYik7IG0gPCByOyBtKyspIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEZwMi5lcWwodDIsIEZwMi5PTkUpKVxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIHQyID0gRnAyLnNxcih0Mik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IGdlID0gRnAyLnBvdyhnLCBfMW4yIDw8IEJpZ0ludChyIC0gbSAtIDEpKTtcbiAgICAgICAgICAgICAgICBnID0gRnAyLnNxcihnZSk7XG4gICAgICAgICAgICAgICAgeCA9IEZwMi5tdWwoeCwgZ2UpO1xuICAgICAgICAgICAgICAgIGIgPSBGcDIubXVsKGIsIGcpO1xuICAgICAgICAgICAgICAgIHIgPSBtO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHg7XG4gICAgICAgIH07XG4gICAgfVxuICAgIGZ1bmN0aW9uIEZwU3FydChQKSB7XG4gICAgICAgIGlmIChQICUgXzRuID09PSBfM24pIHtcbiAgICAgICAgICAgIGNvbnN0IHAxZGl2NCA9IChQICsgXzFuMikgLyBfNG47XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3FydDNtb2Q0KEZwMiwgbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3QgPSBGcDIucG93KG4sIHAxZGl2NCk7XG4gICAgICAgICAgICAgICAgaWYgKCFGcDIuZXFsKEZwMi5zcXIocm9vdCksIG4pKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBzcXVhcmUgcm9vdFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm9vdDtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgaWYgKFAgJSBfOG4gPT09IF81bikge1xuICAgICAgICAgICAgY29uc3QgYzEgPSAoUCAtIF81bikgLyBfOG47XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gc3FydDVtb2Q4KEZwMiwgbikge1xuICAgICAgICAgICAgICAgIGNvbnN0IG4yID0gRnAyLm11bChuLCBfMm4yKTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gRnAyLnBvdyhuMiwgYzEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IG52ID0gRnAyLm11bChuLCB2KTtcbiAgICAgICAgICAgICAgICBjb25zdCBpID0gRnAyLm11bChGcDIubXVsKG52LCBfMm4yKSwgdik7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdCA9IEZwMi5tdWwobnYsIEZwMi5zdWIoaSwgRnAyLk9ORSkpO1xuICAgICAgICAgICAgICAgIGlmICghRnAyLmVxbChGcDIuc3FyKHJvb3QpLCBuKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgc3F1YXJlIHJvb3RcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJvb3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIGlmIChQICUgXzE2biA9PT0gXzluKSB7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRvbmVsbGlTaGFua3MoUCk7XG4gICAgfVxuICAgIHZhciBpc05lZ2F0aXZlTEUgPSAobnVtLCBtb2R1bG8pID0+IChtb2QobnVtLCBtb2R1bG8pICYgXzFuMikgPT09IF8xbjI7XG4gICAgdmFyIEZJRUxEX0ZJRUxEUyA9IFtcbiAgICAgICAgXCJjcmVhdGVcIixcbiAgICAgICAgXCJpc1ZhbGlkXCIsXG4gICAgICAgIFwiaXMwXCIsXG4gICAgICAgIFwibmVnXCIsXG4gICAgICAgIFwiaW52XCIsXG4gICAgICAgIFwic3FydFwiLFxuICAgICAgICBcInNxclwiLFxuICAgICAgICBcImVxbFwiLFxuICAgICAgICBcImFkZFwiLFxuICAgICAgICBcInN1YlwiLFxuICAgICAgICBcIm11bFwiLFxuICAgICAgICBcInBvd1wiLFxuICAgICAgICBcImRpdlwiLFxuICAgICAgICBcImFkZE5cIixcbiAgICAgICAgXCJzdWJOXCIsXG4gICAgICAgIFwibXVsTlwiLFxuICAgICAgICBcInNxck5cIlxuICAgIF07XG4gICAgZnVuY3Rpb24gdmFsaWRhdGVGaWVsZChmaWVsZCkge1xuICAgICAgICBjb25zdCBpbml0aWFsID0ge1xuICAgICAgICAgICAgT1JERVI6IFwiYmlnaW50XCIsXG4gICAgICAgICAgICBNQVNLOiBcImJpZ2ludFwiLFxuICAgICAgICAgICAgQllURVM6IFwiaXNTYWZlSW50ZWdlclwiLFxuICAgICAgICAgICAgQklUUzogXCJpc1NhZmVJbnRlZ2VyXCJcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb3B0cyA9IEZJRUxEX0ZJRUxEUy5yZWR1Y2UoKG1hcCwgdmFsKSA9PiB7XG4gICAgICAgICAgICBtYXBbdmFsXSA9IFwiZnVuY3Rpb25cIjtcbiAgICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgIH0sIGluaXRpYWwpO1xuICAgICAgICByZXR1cm4gdmFsaWRhdGVPYmplY3QoZmllbGQsIG9wdHMpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBGcFBvdyhmLCBudW0sIHBvd2VyKSB7XG4gICAgICAgIGlmIChwb3dlciA8IF8wbjIpXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCBwb3dlciA+IDBcIik7XG4gICAgICAgIGlmIChwb3dlciA9PT0gXzBuMilcbiAgICAgICAgICAgIHJldHVybiBmLk9ORTtcbiAgICAgICAgaWYgKHBvd2VyID09PSBfMW4yKVxuICAgICAgICAgICAgcmV0dXJuIG51bTtcbiAgICAgICAgbGV0IHAgPSBmLk9ORTtcbiAgICAgICAgbGV0IGQgPSBudW07XG4gICAgICAgIHdoaWxlIChwb3dlciA+IF8wbjIpIHtcbiAgICAgICAgICAgIGlmIChwb3dlciAmIF8xbjIpXG4gICAgICAgICAgICAgICAgcCA9IGYubXVsKHAsIGQpO1xuICAgICAgICAgICAgZCA9IGYuc3FyKGQpO1xuICAgICAgICAgICAgcG93ZXIgPj49IF8xbjI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHA7XG4gICAgfVxuICAgIGZ1bmN0aW9uIEZwSW52ZXJ0QmF0Y2goZiwgbnVtcykge1xuICAgICAgICBjb25zdCB0bXAgPSBuZXcgQXJyYXkobnVtcy5sZW5ndGgpO1xuICAgICAgICBjb25zdCBsYXN0TXVsdGlwbGllZCA9IG51bXMucmVkdWNlKChhY2MsIG51bSwgaSkgPT4ge1xuICAgICAgICAgICAgaWYgKGYuaXMwKG51bSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGFjYztcbiAgICAgICAgICAgIHRtcFtpXSA9IGFjYztcbiAgICAgICAgICAgIHJldHVybiBmLm11bChhY2MsIG51bSk7XG4gICAgICAgIH0sIGYuT05FKTtcbiAgICAgICAgY29uc3QgaW52ZXJ0ZWQgPSBmLmludihsYXN0TXVsdGlwbGllZCk7XG4gICAgICAgIG51bXMucmVkdWNlUmlnaHQoKGFjYywgbnVtLCBpKSA9PiB7XG4gICAgICAgICAgICBpZiAoZi5pczAobnVtKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gYWNjO1xuICAgICAgICAgICAgdG1wW2ldID0gZi5tdWwoYWNjLCB0bXBbaV0pO1xuICAgICAgICAgICAgcmV0dXJuIGYubXVsKGFjYywgbnVtKTtcbiAgICAgICAgfSwgaW52ZXJ0ZWQpO1xuICAgICAgICByZXR1cm4gdG1wO1xuICAgIH1cbiAgICBmdW5jdGlvbiBuTGVuZ3RoKG4sIG5CaXRMZW5ndGgpIHtcbiAgICAgICAgY29uc3QgX25CaXRMZW5ndGggPSBuQml0TGVuZ3RoICE9PSB2b2lkIDAgPyBuQml0TGVuZ3RoIDogbi50b1N0cmluZygyKS5sZW5ndGg7XG4gICAgICAgIGNvbnN0IG5CeXRlTGVuZ3RoID0gTWF0aC5jZWlsKF9uQml0TGVuZ3RoIC8gOCk7XG4gICAgICAgIHJldHVybiB7IG5CaXRMZW5ndGg6IF9uQml0TGVuZ3RoLCBuQnl0ZUxlbmd0aCB9O1xuICAgIH1cbiAgICBmdW5jdGlvbiBGaWVsZChPUkRFUiwgYml0TGVuLCBpc0xFMiA9IGZhbHNlLCByZWRlZiA9IHt9KSB7XG4gICAgICAgIGlmIChPUkRFUiA8PSBfMG4yKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCBGaWVsZCBPUkRFUiA+IDAsIGdvdCAke09SREVSfWApO1xuICAgICAgICBjb25zdCB7IG5CaXRMZW5ndGg6IEJJVFMsIG5CeXRlTGVuZ3RoOiBCWVRFUyB9ID0gbkxlbmd0aChPUkRFUiwgYml0TGVuKTtcbiAgICAgICAgaWYgKEJZVEVTID4gMjA0OClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkZpZWxkIGxlbmd0aHMgb3ZlciAyMDQ4IGJ5dGVzIGFyZSBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICBjb25zdCBzcXJ0UCA9IEZwU3FydChPUkRFUik7XG4gICAgICAgIGNvbnN0IGYgPSBPYmplY3QuZnJlZXplKHtcbiAgICAgICAgICAgIE9SREVSLFxuICAgICAgICAgICAgQklUUyxcbiAgICAgICAgICAgIEJZVEVTLFxuICAgICAgICAgICAgTUFTSzogYml0TWFzayhCSVRTKSxcbiAgICAgICAgICAgIFpFUk86IF8wbjIsXG4gICAgICAgICAgICBPTkU6IF8xbjIsXG4gICAgICAgICAgICBjcmVhdGU6IChudW0pID0+IG1vZChudW0sIE9SREVSKSxcbiAgICAgICAgICAgIGlzVmFsaWQ6IChudW0pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG51bSAhPT0gXCJiaWdpbnRcIilcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGZpZWxkIGVsZW1lbnQ6IGV4cGVjdGVkIGJpZ2ludCwgZ290ICR7dHlwZW9mIG51bX1gKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gXzBuMiA8PSBudW0gJiYgbnVtIDwgT1JERVI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaXMwOiAobnVtKSA9PiBudW0gPT09IF8wbjIsXG4gICAgICAgICAgICBpc09kZDogKG51bSkgPT4gKG51bSAmIF8xbjIpID09PSBfMW4yLFxuICAgICAgICAgICAgbmVnOiAobnVtKSA9PiBtb2QoLW51bSwgT1JERVIpLFxuICAgICAgICAgICAgZXFsOiAobGhzLCByaHMpID0+IGxocyA9PT0gcmhzLFxuICAgICAgICAgICAgc3FyOiAobnVtKSA9PiBtb2QobnVtICogbnVtLCBPUkRFUiksXG4gICAgICAgICAgICBhZGQ6IChsaHMsIHJocykgPT4gbW9kKGxocyArIHJocywgT1JERVIpLFxuICAgICAgICAgICAgc3ViOiAobGhzLCByaHMpID0+IG1vZChsaHMgLSByaHMsIE9SREVSKSxcbiAgICAgICAgICAgIG11bDogKGxocywgcmhzKSA9PiBtb2QobGhzICogcmhzLCBPUkRFUiksXG4gICAgICAgICAgICBwb3c6IChudW0sIHBvd2VyKSA9PiBGcFBvdyhmLCBudW0sIHBvd2VyKSxcbiAgICAgICAgICAgIGRpdjogKGxocywgcmhzKSA9PiBtb2QobGhzICogaW52ZXJ0KHJocywgT1JERVIpLCBPUkRFUiksXG4gICAgICAgICAgICAvLyBTYW1lIGFzIGFib3ZlLCBidXQgZG9lc24ndCBub3JtYWxpemVcbiAgICAgICAgICAgIHNxck46IChudW0pID0+IG51bSAqIG51bSxcbiAgICAgICAgICAgIGFkZE46IChsaHMsIHJocykgPT4gbGhzICsgcmhzLFxuICAgICAgICAgICAgc3ViTjogKGxocywgcmhzKSA9PiBsaHMgLSByaHMsXG4gICAgICAgICAgICBtdWxOOiAobGhzLCByaHMpID0+IGxocyAqIHJocyxcbiAgICAgICAgICAgIGludjogKG51bSkgPT4gaW52ZXJ0KG51bSwgT1JERVIpLFxuICAgICAgICAgICAgc3FydDogcmVkZWYuc3FydCB8fCAoKG4pID0+IHNxcnRQKGYsIG4pKSxcbiAgICAgICAgICAgIGludmVydEJhdGNoOiAobHN0KSA9PiBGcEludmVydEJhdGNoKGYsIGxzdCksXG4gICAgICAgICAgICAvLyBUT0RPOiBkbyB3ZSByZWFsbHkgbmVlZCBjb25zdGFudCBjbW92P1xuICAgICAgICAgICAgLy8gV2UgZG9uJ3QgaGF2ZSBjb25zdC10aW1lIGJpZ2ludHMgYW55d2F5LCBzbyBwcm9iYWJseSB3aWxsIGJlIG5vdCB2ZXJ5IHVzZWZ1bFxuICAgICAgICAgICAgY21vdjogKGEsIGIsIGMpID0+IGMgPyBiIDogYSxcbiAgICAgICAgICAgIHRvQnl0ZXM6IChudW0pID0+IGlzTEUyID8gbnVtYmVyVG9CeXRlc0xFKG51bSwgQllURVMpIDogbnVtYmVyVG9CeXRlc0JFKG51bSwgQllURVMpLFxuICAgICAgICAgICAgZnJvbUJ5dGVzOiAoYnl0ZXMyKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKGJ5dGVzMi5sZW5ndGggIT09IEJZVEVTKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEZwLmZyb21CeXRlczogZXhwZWN0ZWQgJHtCWVRFU30sIGdvdCAke2J5dGVzMi5sZW5ndGh9YCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGlzTEUyID8gYnl0ZXNUb051bWJlckxFKGJ5dGVzMikgOiBieXRlc1RvTnVtYmVyQkUoYnl0ZXMyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKGYpO1xuICAgIH1cbiAgICBmdW5jdGlvbiBGcFNxcnRFdmVuKEZwMiwgZWxtKSB7XG4gICAgICAgIGlmICghRnAyLmlzT2RkKVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBGaWVsZCBkb2Vzbid0IGhhdmUgaXNPZGRgKTtcbiAgICAgICAgY29uc3Qgcm9vdCA9IEZwMi5zcXJ0KGVsbSk7XG4gICAgICAgIHJldHVybiBGcDIuaXNPZGQocm9vdCkgPyBGcDIubmVnKHJvb3QpIDogcm9vdDtcbiAgICB9XG4gICAgLy8gLi4vZXNtL2Fic3RyYWN0L2N1cnZlLmpzXG4gICAgdmFyIF8wbjMgPSBCaWdJbnQoMCk7XG4gICAgdmFyIF8xbjMgPSBCaWdJbnQoMSk7XG4gICAgZnVuY3Rpb24gd05BRihjLCBiaXRzKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0VGltZU5lZ2F0ZSA9IChjb25kaXRpb24sIGl0ZW0pID0+IHtcbiAgICAgICAgICAgIGNvbnN0IG5lZyA9IGl0ZW0ubmVnYXRlKCk7XG4gICAgICAgICAgICByZXR1cm4gY29uZGl0aW9uID8gbmVnIDogaXRlbTtcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3Qgb3B0cyA9IChXKSA9PiB7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3dzID0gTWF0aC5jZWlsKGJpdHMgLyBXKSArIDE7XG4gICAgICAgICAgICBjb25zdCB3aW5kb3dTaXplID0gMiAqKiAoVyAtIDEpO1xuICAgICAgICAgICAgcmV0dXJuIHsgd2luZG93cywgd2luZG93U2l6ZSB9O1xuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY29uc3RUaW1lTmVnYXRlLFxuICAgICAgICAgICAgLy8gbm9uLWNvbnN0IHRpbWUgbXVsdGlwbGljYXRpb24gbGFkZGVyXG4gICAgICAgICAgICB1bnNhZmVMYWRkZXIoZWxtLCBuKSB7XG4gICAgICAgICAgICAgICAgbGV0IHAgPSBjLlpFUk87XG4gICAgICAgICAgICAgICAgbGV0IGQgPSBlbG07XG4gICAgICAgICAgICAgICAgd2hpbGUgKG4gPiBfMG4zKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChuICYgXzFuMylcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBwLmFkZChkKTtcbiAgICAgICAgICAgICAgICAgICAgZCA9IGQuZG91YmxlKCk7XG4gICAgICAgICAgICAgICAgICAgIG4gPj49IF8xbjM7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBwO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ3JlYXRlcyBhIHdOQUYgcHJlY29tcHV0YXRpb24gd2luZG93LiBVc2VkIGZvciBjYWNoaW5nLlxuICAgICAgICAgICAgICogRGVmYXVsdCB3aW5kb3cgc2l6ZSBpcyBzZXQgYnkgYHV0aWxzLnByZWNvbXB1dGUoKWAgYW5kIGlzIGVxdWFsIHRvIDguXG4gICAgICAgICAgICAgKiBOdW1iZXIgb2YgcHJlY29tcHV0ZWQgcG9pbnRzIGRlcGVuZHMgb24gdGhlIGN1cnZlIHNpemU6XG4gICAgICAgICAgICAgKiAyXijwnZGK4oiSMSkgKiAoTWF0aC5jZWlsKPCdkZsgLyDwnZGKKSArIDEpLCB3aGVyZTpcbiAgICAgICAgICAgICAqIC0g8J2RiiBpcyB0aGUgd2luZG93IHNpemVcbiAgICAgICAgICAgICAqIC0g8J2RmyBpcyB0aGUgYml0bGVuZ3RoIG9mIHRoZSBjdXJ2ZSBvcmRlci5cbiAgICAgICAgICAgICAqIEZvciBhIDI1Ni1iaXQgY3VydmUgYW5kIHdpbmRvdyBzaXplIDgsIHRoZSBudW1iZXIgb2YgcHJlY29tcHV0ZWQgcG9pbnRzIGlzIDEyOCAqIDMzID0gNDIyNC5cbiAgICAgICAgICAgICAqIEByZXR1cm5zIHByZWNvbXB1dGVkIHBvaW50IHRhYmxlcyBmbGF0dGVuZWQgdG8gYSBzaW5nbGUgYXJyYXlcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgcHJlY29tcHV0ZVdpbmRvdyhlbG0sIFcpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHdpbmRvd3MsIHdpbmRvd1NpemUgfSA9IG9wdHMoVyk7XG4gICAgICAgICAgICAgICAgY29uc3QgcG9pbnRzID0gW107XG4gICAgICAgICAgICAgICAgbGV0IHAgPSBlbG07XG4gICAgICAgICAgICAgICAgbGV0IGJhc2UgPSBwO1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHdpbmRvdyA9IDA7IHdpbmRvdyA8IHdpbmRvd3M7IHdpbmRvdysrKSB7XG4gICAgICAgICAgICAgICAgICAgIGJhc2UgPSBwO1xuICAgICAgICAgICAgICAgICAgICBwb2ludHMucHVzaChiYXNlKTtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCB3aW5kb3dTaXplOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJhc2UgPSBiYXNlLmFkZChwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBvaW50cy5wdXNoKGJhc2UpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHAgPSBiYXNlLmRvdWJsZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gcG9pbnRzO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogSW1wbGVtZW50cyBlYyBtdWx0aXBsaWNhdGlvbiB1c2luZyBwcmVjb21wdXRlZCB0YWJsZXMgYW5kIHctYXJ5IG5vbi1hZGphY2VudCBmb3JtLlxuICAgICAgICAgICAgICogQHBhcmFtIFcgd2luZG93IHNpemVcbiAgICAgICAgICAgICAqIEBwYXJhbSBwcmVjb21wdXRlcyBwcmVjb21wdXRlZCB0YWJsZXNcbiAgICAgICAgICAgICAqIEBwYXJhbSBuIHNjYWxhciAod2UgZG9uJ3QgY2hlY2sgaGVyZSwgYnV0IHNob3VsZCBiZSBsZXNzIHRoYW4gY3VydmUgb3JkZXIpXG4gICAgICAgICAgICAgKiBAcmV0dXJucyByZWFsIGFuZCBmYWtlIChmb3IgY29uc3QtdGltZSkgcG9pbnRzXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHdOQUYoVywgcHJlY29tcHV0ZXMsIG4pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHdpbmRvd3MsIHdpbmRvd1NpemUgfSA9IG9wdHMoVyk7XG4gICAgICAgICAgICAgICAgbGV0IHAgPSBjLlpFUk87XG4gICAgICAgICAgICAgICAgbGV0IGYgPSBjLkJBU0U7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFzayA9IEJpZ0ludCgyICoqIFcgLSAxKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXhOdW1iZXIgPSAyICoqIFc7XG4gICAgICAgICAgICAgICAgY29uc3Qgc2hpZnRCeSA9IEJpZ0ludChXKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB3aW5kb3cgPSAwOyB3aW5kb3cgPCB3aW5kb3dzOyB3aW5kb3crKykge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBvZmZzZXQgPSB3aW5kb3cgKiB3aW5kb3dTaXplO1xuICAgICAgICAgICAgICAgICAgICBsZXQgd2JpdHMgPSBOdW1iZXIobiAmIG1hc2spO1xuICAgICAgICAgICAgICAgICAgICBuID4+PSBzaGlmdEJ5O1xuICAgICAgICAgICAgICAgICAgICBpZiAod2JpdHMgPiB3aW5kb3dTaXplKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB3Yml0cyAtPSBtYXhOdW1iZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICBuICs9IF8xbjM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0MSA9IG9mZnNldDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgb2Zmc2V0MiA9IG9mZnNldCArIE1hdGguYWJzKHdiaXRzKSAtIDE7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbmQxID0gd2luZG93ICUgMiAhPT0gMDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29uZDIgPSB3Yml0cyA8IDA7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3Yml0cyA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZiA9IGYuYWRkKGNvbnN0VGltZU5lZ2F0ZShjb25kMSwgcHJlY29tcHV0ZXNbb2Zmc2V0MV0pKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHAgPSBwLmFkZChjb25zdFRpbWVOZWdhdGUoY29uZDIsIHByZWNvbXB1dGVzW29mZnNldDJdKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcCwgZiB9O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHdOQUZDYWNoZWQoUCwgcHJlY29tcHV0ZXNNYXAsIG4sIHRyYW5zZm9ybSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IFcgPSBQLl9XSU5ET1dfU0laRSB8fCAxO1xuICAgICAgICAgICAgICAgIGxldCBjb21wID0gcHJlY29tcHV0ZXNNYXAuZ2V0KFApO1xuICAgICAgICAgICAgICAgIGlmICghY29tcCkge1xuICAgICAgICAgICAgICAgICAgICBjb21wID0gdGhpcy5wcmVjb21wdXRlV2luZG93KFAsIFcpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoVyAhPT0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJlY29tcHV0ZXNNYXAuc2V0KFAsIHRyYW5zZm9ybShjb21wKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud05BRihXLCBjb21wLCBuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdmFsaWRhdGVCYXNpYyhjdXJ2ZSkge1xuICAgICAgICB2YWxpZGF0ZUZpZWxkKGN1cnZlLkZwKTtcbiAgICAgICAgdmFsaWRhdGVPYmplY3QoY3VydmUsIHtcbiAgICAgICAgICAgIG46IFwiYmlnaW50XCIsXG4gICAgICAgICAgICBoOiBcImJpZ2ludFwiLFxuICAgICAgICAgICAgR3g6IFwiZmllbGRcIixcbiAgICAgICAgICAgIEd5OiBcImZpZWxkXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbkJpdExlbmd0aDogXCJpc1NhZmVJbnRlZ2VyXCIsXG4gICAgICAgICAgICBuQnl0ZUxlbmd0aDogXCJpc1NhZmVJbnRlZ2VyXCJcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHtcbiAgICAgICAgICAgIC4uLm5MZW5ndGgoY3VydmUubiwgY3VydmUubkJpdExlbmd0aCksXG4gICAgICAgICAgICAuLi5jdXJ2ZSxcbiAgICAgICAgICAgIC4uLnsgcDogY3VydmUuRnAuT1JERVIgfVxuICAgICAgICB9KTtcbiAgICB9XG4gICAgLy8gLi4vZXNtL2Fic3RyYWN0L2Vkd2FyZHMuanNcbiAgICB2YXIgXzBuNCA9IEJpZ0ludCgwKTtcbiAgICB2YXIgXzFuNCA9IEJpZ0ludCgxKTtcbiAgICB2YXIgXzJuMyA9IEJpZ0ludCgyKTtcbiAgICB2YXIgXzhuMiA9IEJpZ0ludCg4KTtcbiAgICB2YXIgVkVSSUZZX0RFRkFVTFQgPSB7IHppcDIxNTogdHJ1ZSB9O1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlT3B0cyhjdXJ2ZSkge1xuICAgICAgICBjb25zdCBvcHRzID0gdmFsaWRhdGVCYXNpYyhjdXJ2ZSk7XG4gICAgICAgIHZhbGlkYXRlT2JqZWN0KGN1cnZlLCB7XG4gICAgICAgICAgICBoYXNoOiBcImZ1bmN0aW9uXCIsXG4gICAgICAgICAgICBhOiBcImJpZ2ludFwiLFxuICAgICAgICAgICAgZDogXCJiaWdpbnRcIixcbiAgICAgICAgICAgIHJhbmRvbUJ5dGVzOiBcImZ1bmN0aW9uXCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgYWRqdXN0U2NhbGFyQnl0ZXM6IFwiZnVuY3Rpb25cIixcbiAgICAgICAgICAgIGRvbWFpbjogXCJmdW5jdGlvblwiLFxuICAgICAgICAgICAgdXZSYXRpbzogXCJmdW5jdGlvblwiLFxuICAgICAgICAgICAgbWFwVG9DdXJ2ZTogXCJmdW5jdGlvblwiXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gT2JqZWN0LmZyZWV6ZSh7IC4uLm9wdHMgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHR3aXN0ZWRFZHdhcmRzKGN1cnZlRGVmKSB7XG4gICAgICAgIGNvbnN0IENVUlZFID0gdmFsaWRhdGVPcHRzKGN1cnZlRGVmKTtcbiAgICAgICAgY29uc3QgeyBGcDogRnAyLCBuOiBDVVJWRV9PUkRFUiwgcHJlaGFzaCwgaGFzaDogY0hhc2gsIHJhbmRvbUJ5dGVzOiByYW5kb21CeXRlczIsIG5CeXRlTGVuZ3RoLCBoOiBjb2ZhY3RvciB9ID0gQ1VSVkU7XG4gICAgICAgIGNvbnN0IE1BU0sgPSBfMm4zIDw8IEJpZ0ludChuQnl0ZUxlbmd0aCAqIDgpIC0gXzFuNDtcbiAgICAgICAgY29uc3QgbW9kUCA9IEZwMi5jcmVhdGU7XG4gICAgICAgIGNvbnN0IHV2UmF0aW8yID0gQ1VSVkUudXZSYXRpbyB8fCAoKHUsIHYpID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgaXNWYWxpZDogdHJ1ZSwgdmFsdWU6IEZwMi5zcXJ0KHUgKiBGcDIuaW52KHYpKSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4geyBpc1ZhbGlkOiBmYWxzZSwgdmFsdWU6IF8wbjQgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIGNvbnN0IGFkanVzdFNjYWxhckJ5dGVzMiA9IENVUlZFLmFkanVzdFNjYWxhckJ5dGVzIHx8ICgoYnl0ZXMyKSA9PiBieXRlczIpO1xuICAgICAgICBjb25zdCBkb21haW4gPSBDVVJWRS5kb21haW4gfHwgKChkYXRhLCBjdHgsIHBoZmxhZykgPT4ge1xuICAgICAgICAgICAgaWYgKGN0eC5sZW5ndGggfHwgcGhmbGFnKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnRleHRzL3ByZS1oYXNoIGFyZSBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGRhdGE7XG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdCBpbkJpZyA9IChuKSA9PiB0eXBlb2YgbiA9PT0gXCJiaWdpbnRcIiAmJiBfMG40IDwgbjtcbiAgICAgICAgY29uc3QgaW5SYW5nZSA9IChuLCBtYXgpID0+IGluQmlnKG4pICYmIGluQmlnKG1heCkgJiYgbiA8IG1heDtcbiAgICAgICAgY29uc3QgaW4wTWFza1JhbmdlID0gKG4pID0+IG4gPT09IF8wbjQgfHwgaW5SYW5nZShuLCBNQVNLKTtcbiAgICAgICAgZnVuY3Rpb24gYXNzZXJ0SW5SYW5nZShuLCBtYXgpIHtcbiAgICAgICAgICAgIGlmIChpblJhbmdlKG4sIG1heCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIHZhbGlkIHNjYWxhciA8ICR7bWF4fSwgZ290ICR7dHlwZW9mIG59ICR7bn1gKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBhc3NlcnRHRTAobikge1xuICAgICAgICAgICAgcmV0dXJuIG4gPT09IF8wbjQgPyBuIDogYXNzZXJ0SW5SYW5nZShuLCBDVVJWRV9PUkRFUik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgcG9pbnRQcmVjb21wdXRlcyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG4gICAgICAgIGZ1bmN0aW9uIGlzUG9pbnQob3RoZXIpIHtcbiAgICAgICAgICAgIGlmICghKG90aGVyIGluc3RhbmNlb2YgUG9pbnQpKVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkV4dGVuZGVkUG9pbnQgZXhwZWN0ZWRcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2xhc3MgUG9pbnQge1xuICAgICAgICAgICAgY29uc3RydWN0b3IoZXgsIGV5LCBleiwgZXQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmV4ID0gZXg7XG4gICAgICAgICAgICAgICAgdGhpcy5leSA9IGV5O1xuICAgICAgICAgICAgICAgIHRoaXMuZXogPSBlejtcbiAgICAgICAgICAgICAgICB0aGlzLmV0ID0gZXQ7XG4gICAgICAgICAgICAgICAgaWYgKCFpbjBNYXNrUmFuZ2UoZXgpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ4IHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgICAgIGlmICghaW4wTWFza1JhbmdlKGV5KSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwieSByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIWluME1hc2tSYW5nZShleikpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInogcmVxdWlyZWRcIik7XG4gICAgICAgICAgICAgICAgaWYgKCFpbjBNYXNrUmFuZ2UoZXQpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJ0IHJlcXVpcmVkXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ2V0IHgoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9BZmZpbmUoKS54O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZ2V0IHkoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMudG9BZmZpbmUoKS55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGljIGZyb21BZmZpbmUocCkge1xuICAgICAgICAgICAgICAgIGlmIChwIGluc3RhbmNlb2YgUG9pbnQpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImV4dGVuZGVkIHBvaW50IG5vdCBhbGxvd2VkXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gcCB8fCB7fTtcbiAgICAgICAgICAgICAgICBpZiAoIWluME1hc2tSYW5nZSh4KSB8fCAhaW4wTWFza1JhbmdlKHkpKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGFmZmluZSBwb2ludFwiKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KHgsIHksIF8xbjQsIG1vZFAoeCAqIHkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN0YXRpYyBub3JtYWxpemVaKHBvaW50cykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHRvSW52ID0gRnAyLmludmVydEJhdGNoKHBvaW50cy5tYXAoKHApID0+IHAuZXopKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcG9pbnRzLm1hcCgocCwgaSkgPT4gcC50b0FmZmluZSh0b0ludltpXSkpLm1hcChQb2ludC5mcm9tQWZmaW5lKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIFwiUHJpdmF0ZSBtZXRob2RcIiwgZG9uJ3QgdXNlIGl0IGRpcmVjdGx5XG4gICAgICAgICAgICBfc2V0V2luZG93U2l6ZSh3aW5kb3dTaXplKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fV0lORE9XX1NJWkUgPSB3aW5kb3dTaXplO1xuICAgICAgICAgICAgICAgIHBvaW50UHJlY29tcHV0ZXMuZGVsZXRlKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm90IHJlcXVpcmVkIGZvciBmcm9tSGV4KCksIHdoaWNoIGFsd2F5cyBjcmVhdGVzIHZhbGlkIHBvaW50cy5cbiAgICAgICAgICAgIC8vIENvdWxkIGJlIHVzZWZ1bCBmb3IgZnJvbUFmZmluZSgpLlxuICAgICAgICAgICAgYXNzZXJ0VmFsaWRpdHkoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhLCBkIH0gPSBDVVJWRTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5pczAoKSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiYmFkIHBvaW50OiBaRVJPXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZXg6IFgsIGV5OiBZLCBlejogWiwgZXQ6IFQgfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgWDIgPSBtb2RQKFggKiBYKTtcbiAgICAgICAgICAgICAgICBjb25zdCBZMiA9IG1vZFAoWSAqIFkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFoyID0gbW9kUChaICogWik7XG4gICAgICAgICAgICAgICAgY29uc3QgWjQgPSBtb2RQKFoyICogWjIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGFYMiA9IG1vZFAoWDIgKiBhKTtcbiAgICAgICAgICAgICAgICBjb25zdCBsZWZ0ID0gbW9kUChaMiAqIG1vZFAoYVgyICsgWTIpKTtcbiAgICAgICAgICAgICAgICBjb25zdCByaWdodCA9IG1vZFAoWjQgKyBtb2RQKGQgKiBtb2RQKFgyICogWTIpKSk7XG4gICAgICAgICAgICAgICAgaWYgKGxlZnQgIT09IHJpZ2h0KVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgcG9pbnQ6IGVxdWF0aW9uIGxlZnQgIT0gcmlnaHQgKDEpXCIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFhZID0gbW9kUChYICogWSk7XG4gICAgICAgICAgICAgICAgY29uc3QgWlQgPSBtb2RQKFogKiBUKTtcbiAgICAgICAgICAgICAgICBpZiAoWFkgIT09IFpUKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJiYWQgcG9pbnQ6IGVxdWF0aW9uIGxlZnQgIT0gcmlnaHQgKDIpXCIpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQ29tcGFyZSBvbmUgcG9pbnQgdG8gYW5vdGhlci5cbiAgICAgICAgICAgIGVxdWFscyhvdGhlcikge1xuICAgICAgICAgICAgICAgIGlzUG9pbnQob3RoZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZXg6IFgxLCBleTogWTEsIGV6OiBaMSB9ID0gdGhpcztcbiAgICAgICAgICAgICAgICBjb25zdCB7IGV4OiBYMiwgZXk6IFkyLCBlejogWjIgfSA9IG90aGVyO1xuICAgICAgICAgICAgICAgIGNvbnN0IFgxWjIgPSBtb2RQKFgxICogWjIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFgyWjEgPSBtb2RQKFgyICogWjEpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFkxWjIgPSBtb2RQKFkxICogWjIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFkyWjEgPSBtb2RQKFkyICogWjEpO1xuICAgICAgICAgICAgICAgIHJldHVybiBYMVoyID09PSBYMloxICYmIFkxWjIgPT09IFkyWjE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpczAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZXF1YWxzKFBvaW50LlpFUk8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmVnYXRlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQobW9kUCgtdGhpcy5leCksIHRoaXMuZXksIHRoaXMuZXosIG1vZFAoLXRoaXMuZXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZhc3QgYWxnbyBmb3IgZG91YmxpbmcgRXh0ZW5kZWQgUG9pbnQuXG4gICAgICAgICAgICAvLyBodHRwczovL2h5cGVyZWxsaXB0aWMub3JnL0VGRC9nMXAvYXV0by10d2lzdGVkLWV4dGVuZGVkLmh0bWwjZG91YmxpbmctZGJsLTIwMDgtaHdjZFxuICAgICAgICAgICAgLy8gQ29zdDogNE0gKyA0UyArIDEqYSArIDZhZGQgKyAxKjIuXG4gICAgICAgICAgICBkb3VibGUoKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBhIH0gPSBDVVJWRTtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGV4OiBYMSwgZXk6IFkxLCBlejogWjEgfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgQSA9IG1vZFAoWDEgKiBYMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgQiA9IG1vZFAoWTEgKiBZMSk7XG4gICAgICAgICAgICAgICAgY29uc3QgQyA9IG1vZFAoXzJuMyAqIG1vZFAoWjEgKiBaMSkpO1xuICAgICAgICAgICAgICAgIGNvbnN0IEQgPSBtb2RQKGEgKiBBKTtcbiAgICAgICAgICAgICAgICBjb25zdCB4MXkxID0gWDEgKyBZMTtcbiAgICAgICAgICAgICAgICBjb25zdCBFID0gbW9kUChtb2RQKHgxeTEgKiB4MXkxKSAtIEEgLSBCKTtcbiAgICAgICAgICAgICAgICBjb25zdCBHMiA9IEQgKyBCO1xuICAgICAgICAgICAgICAgIGNvbnN0IEYgPSBHMiAtIEM7XG4gICAgICAgICAgICAgICAgY29uc3QgSCA9IEQgLSBCO1xuICAgICAgICAgICAgICAgIGNvbnN0IFgzID0gbW9kUChFICogRik7XG4gICAgICAgICAgICAgICAgY29uc3QgWTMgPSBtb2RQKEcyICogSCk7XG4gICAgICAgICAgICAgICAgY29uc3QgVDMgPSBtb2RQKEUgKiBIKTtcbiAgICAgICAgICAgICAgICBjb25zdCBaMyA9IG1vZFAoRiAqIEcyKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFBvaW50KFgzLCBZMywgWjMsIFQzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZhc3QgYWxnbyBmb3IgYWRkaW5nIDIgRXh0ZW5kZWQgUG9pbnRzLlxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9oeXBlcmVsbGlwdGljLm9yZy9FRkQvZzFwL2F1dG8tdHdpc3RlZC1leHRlbmRlZC5odG1sI2FkZGl0aW9uLWFkZC0yMDA4LWh3Y2RcbiAgICAgICAgICAgIC8vIENvc3Q6IDlNICsgMSphICsgMSpkICsgN2FkZC5cbiAgICAgICAgICAgIGFkZChvdGhlcikge1xuICAgICAgICAgICAgICAgIGlzUG9pbnQob3RoZXIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgYSwgZCB9ID0gQ1VSVkU7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBleDogWDEsIGV5OiBZMSwgZXo6IFoxLCBldDogVDEgfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgeyBleDogWDIsIGV5OiBZMiwgZXo6IFoyLCBldDogVDIgfSA9IG90aGVyO1xuICAgICAgICAgICAgICAgIGlmIChhID09PSBCaWdJbnQoLTEpKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEEyID0gbW9kUCgoWTEgLSBYMSkgKiAoWTIgKyBYMikpO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBCMiA9IG1vZFAoKFkxICsgWDEpICogKFkyIC0gWDIpKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRjIgPSBtb2RQKEIyIC0gQTIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoRjIgPT09IF8wbjQpXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5kb3VibGUoKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgQzIgPSBtb2RQKFoxICogXzJuMyAqIFQyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRDIgPSBtb2RQKFQxICogXzJuMyAqIFoyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgRTIgPSBEMiArIEMyO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBHMyA9IEIyICsgQTI7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IEgyID0gRDIgLSBDMjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWDMyID0gbW9kUChFMiAqIEYyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWTMyID0gbW9kUChHMyAqIEgyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgVDMyID0gbW9kUChFMiAqIEgyKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgWjMyID0gbW9kUChGMiAqIEczKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQb2ludChYMzIsIFkzMiwgWjMyLCBUMzIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb25zdCBBID0gbW9kUChYMSAqIFgyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBCID0gbW9kUChZMSAqIFkyKTtcbiAgICAgICAgICAgICAgICBjb25zdCBDID0gbW9kUChUMSAqIGQgKiBUMik7XG4gICAgICAgICAgICAgICAgY29uc3QgRCA9IG1vZFAoWjEgKiBaMik7XG4gICAgICAgICAgICAgICAgY29uc3QgRSA9IG1vZFAoKFgxICsgWTEpICogKFgyICsgWTIpIC0gQSAtIEIpO1xuICAgICAgICAgICAgICAgIGNvbnN0IEYgPSBEIC0gQztcbiAgICAgICAgICAgICAgICBjb25zdCBHMiA9IEQgKyBDO1xuICAgICAgICAgICAgICAgIGNvbnN0IEggPSBtb2RQKEIgLSBhICogQSk7XG4gICAgICAgICAgICAgICAgY29uc3QgWDMgPSBtb2RQKEUgKiBGKTtcbiAgICAgICAgICAgICAgICBjb25zdCBZMyA9IG1vZFAoRzIgKiBIKTtcbiAgICAgICAgICAgICAgICBjb25zdCBUMyA9IG1vZFAoRSAqIEgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IFozID0gbW9kUChGICogRzIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUG9pbnQoWDMsIFkzLCBaMywgVDMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3VidHJhY3Qob3RoZXIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5hZGQob3RoZXIubmVnYXRlKCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgd05BRihuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHduYWYud05BRkNhY2hlZCh0aGlzLCBwb2ludFByZWNvbXB1dGVzLCBuLCBQb2ludC5ub3JtYWxpemVaKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENvbnN0YW50LXRpbWUgbXVsdGlwbGljYXRpb24uXG4gICAgICAgICAgICBtdWx0aXBseShzY2FsYXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IHAsIGYgfSA9IHRoaXMud05BRihhc3NlcnRJblJhbmdlKHNjYWxhciwgQ1VSVkVfT1JERVIpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gUG9pbnQubm9ybWFsaXplWihbcCwgZl0pWzBdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTm9uLWNvbnN0YW50LXRpbWUgbXVsdGlwbGljYXRpb24uIFVzZXMgZG91YmxlLWFuZC1hZGQgYWxnb3JpdGhtLlxuICAgICAgICAgICAgLy8gSXQncyBmYXN0ZXIsIGJ1dCBzaG91bGQgb25seSBiZSB1c2VkIHdoZW4geW91IGRvbid0IGNhcmUgYWJvdXRcbiAgICAgICAgICAgIC8vIGFuIGV4cG9zZWQgcHJpdmF0ZSBrZXkgZS5nLiBzaWcgdmVyaWZpY2F0aW9uLlxuICAgICAgICAgICAgLy8gRG9lcyBOT1QgYWxsb3cgc2NhbGFycyBoaWdoZXIgdGhhbiBDVVJWRS5uLlxuICAgICAgICAgICAgbXVsdGlwbHlVbnNhZmUoc2NhbGFyKSB7XG4gICAgICAgICAgICAgICAgbGV0IG4gPSBhc3NlcnRHRTAoc2NhbGFyKTtcbiAgICAgICAgICAgICAgICBpZiAobiA9PT0gXzBuNClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZXF1YWxzKEkpIHx8IG4gPT09IF8xbjQpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmVxdWFscyhHKSlcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud05BRihuKS5wO1xuICAgICAgICAgICAgICAgIHJldHVybiB3bmFmLnVuc2FmZUxhZGRlcih0aGlzLCBuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENoZWNrcyBpZiBwb2ludCBpcyBvZiBzbWFsbCBvcmRlci5cbiAgICAgICAgICAgIC8vIElmIHlvdSBhZGQgc29tZXRoaW5nIHRvIHNtYWxsIG9yZGVyIHBvaW50LCB5b3Ugd2lsbCBoYXZlIFwiZGlydHlcIlxuICAgICAgICAgICAgLy8gcG9pbnQgd2l0aCB0b3JzaW9uIGNvbXBvbmVudC5cbiAgICAgICAgICAgIC8vIE11bHRpcGxpZXMgcG9pbnQgYnkgY29mYWN0b3IgYW5kIGNoZWNrcyBpZiB0aGUgcmVzdWx0IGlzIDAuXG4gICAgICAgICAgICBpc1NtYWxsT3JkZXIoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHlVbnNhZmUoY29mYWN0b3IpLmlzMCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gTXVsdGlwbGllcyBwb2ludCBieSBjdXJ2ZSBvcmRlciBhbmQgY2hlY2tzIGlmIHRoZSByZXN1bHQgaXMgMC5cbiAgICAgICAgICAgIC8vIFJldHVybnMgYGZhbHNlYCBpcyB0aGUgcG9pbnQgaXMgZGlydHkuXG4gICAgICAgICAgICBpc1RvcnNpb25GcmVlKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiB3bmFmLnVuc2FmZUxhZGRlcih0aGlzLCBDVVJWRV9PUkRFUikuaXMwKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBDb252ZXJ0cyBFeHRlbmRlZCBwb2ludCB0byBkZWZhdWx0ICh4LCB5KSBjb29yZGluYXRlcy5cbiAgICAgICAgICAgIC8vIENhbiBhY2NlcHQgcHJlY29tcHV0ZWQgWl4tMSAtIGZvciBleGFtcGxlLCBmcm9tIGludmVydEJhdGNoLlxuICAgICAgICAgICAgdG9BZmZpbmUoaXopIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGV4OiB4LCBleTogeSwgZXo6IHogfSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgY29uc3QgaXMwID0gdGhpcy5pczAoKTtcbiAgICAgICAgICAgICAgICBpZiAoaXogPT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgaXogPSBpczAgPyBfOG4yIDogRnAyLmludih6KTtcbiAgICAgICAgICAgICAgICBjb25zdCBheCA9IG1vZFAoeCAqIGl6KTtcbiAgICAgICAgICAgICAgICBjb25zdCBheSA9IG1vZFAoeSAqIGl6KTtcbiAgICAgICAgICAgICAgICBjb25zdCB6eiA9IG1vZFAoeiAqIGl6KTtcbiAgICAgICAgICAgICAgICBpZiAoaXMwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4geyB4OiBfMG40LCB5OiBfMW40IH07XG4gICAgICAgICAgICAgICAgaWYgKHp6ICE9PSBfMW40KVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZaIHdhcyBpbnZhbGlkXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiB7IHg6IGF4LCB5OiBheSB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY2xlYXJDb2ZhY3RvcigpIHtcbiAgICAgICAgICAgICAgICBjb25zdCB7IGg6IGNvZmFjdG9yMiB9ID0gQ1VSVkU7XG4gICAgICAgICAgICAgICAgaWYgKGNvZmFjdG9yMiA9PT0gXzFuNClcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMubXVsdGlwbHlVbnNhZmUoY29mYWN0b3IyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIENvbnZlcnRzIGhhc2ggc3RyaW5nIG9yIFVpbnQ4QXJyYXkgdG8gUG9pbnQuXG4gICAgICAgICAgICAvLyBVc2VzIGFsZ28gZnJvbSBSRkM4MDMyIDUuMS4zLlxuICAgICAgICAgICAgc3RhdGljIGZyb21IZXgoaGV4LCB6aXAyMTUgPSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgZCwgYSB9ID0gQ1VSVkU7XG4gICAgICAgICAgICAgICAgY29uc3QgbGVuID0gRnAyLkJZVEVTO1xuICAgICAgICAgICAgICAgIGhleCA9IGVuc3VyZUJ5dGVzKFwicG9pbnRIZXhcIiwgaGV4LCBsZW4pO1xuICAgICAgICAgICAgICAgIGNvbnN0IG5vcm1lZCA9IGhleC5zbGljZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGxhc3RCeXRlID0gaGV4W2xlbiAtIDFdO1xuICAgICAgICAgICAgICAgIG5vcm1lZFtsZW4gLSAxXSA9IGxhc3RCeXRlICYgfjEyODtcbiAgICAgICAgICAgICAgICBjb25zdCB5ID0gYnl0ZXNUb051bWJlckxFKG5vcm1lZCk7XG4gICAgICAgICAgICAgICAgaWYgKHkgPT09IF8wbjQpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh6aXAyMTUpXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnRJblJhbmdlKHksIE1BU0spO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBhc3NlcnRJblJhbmdlKHksIEZwMi5PUkRFUik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNvbnN0IHkyID0gbW9kUCh5ICogeSk7XG4gICAgICAgICAgICAgICAgY29uc3QgdSA9IG1vZFAoeTIgLSBfMW40KTtcbiAgICAgICAgICAgICAgICBjb25zdCB2ID0gbW9kUChkICogeTIgLSBhKTtcbiAgICAgICAgICAgICAgICBsZXQgeyBpc1ZhbGlkLCB2YWx1ZTogeCB9ID0gdXZSYXRpbzIodSwgdik7XG4gICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJQb2ludC5mcm9tSGV4OiBpbnZhbGlkIHkgY29vcmRpbmF0ZVwiKTtcbiAgICAgICAgICAgICAgICBjb25zdCBpc1hPZGQgPSAoeCAmIF8xbjQpID09PSBfMW40O1xuICAgICAgICAgICAgICAgIGNvbnN0IGlzTGFzdEJ5dGVPZGQgPSAobGFzdEJ5dGUgJiAxMjgpICE9PSAwO1xuICAgICAgICAgICAgICAgIGlmICghemlwMjE1ICYmIHggPT09IF8wbjQgJiYgaXNMYXN0Qnl0ZU9kZClcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUG9pbnQuZnJvbUhleDogeD0wIGFuZCB4XzA9MVwiKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNMYXN0Qnl0ZU9kZCAhPT0gaXNYT2RkKVxuICAgICAgICAgICAgICAgICAgICB4ID0gbW9kUCgteCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIFBvaW50LmZyb21BZmZpbmUoeyB4LCB5IH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3RhdGljIGZyb21Qcml2YXRlS2V5KHByaXZLZXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZ2V0RXh0ZW5kZWRQdWJsaWNLZXkocHJpdktleSkucG9pbnQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b1Jhd0J5dGVzKCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHsgeCwgeSB9ID0gdGhpcy50b0FmZmluZSgpO1xuICAgICAgICAgICAgICAgIGNvbnN0IGJ5dGVzMiA9IG51bWJlclRvQnl0ZXNMRSh5LCBGcDIuQllURVMpO1xuICAgICAgICAgICAgICAgIGJ5dGVzMltieXRlczIubGVuZ3RoIC0gMV0gfD0geCAmIF8xbjQgPyAxMjggOiAwO1xuICAgICAgICAgICAgICAgIHJldHVybiBieXRlczI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b0hleCgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gYnl0ZXNUb0hleCh0aGlzLnRvUmF3Qnl0ZXMoKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgUG9pbnQuQkFTRSA9IG5ldyBQb2ludChDVVJWRS5HeCwgQ1VSVkUuR3ksIF8xbjQsIG1vZFAoQ1VSVkUuR3ggKiBDVVJWRS5HeSkpO1xuICAgICAgICBQb2ludC5aRVJPID0gbmV3IFBvaW50KF8wbjQsIF8xbjQsIF8xbjQsIF8wbjQpO1xuICAgICAgICBjb25zdCB7IEJBU0U6IEcsIFpFUk86IEkgfSA9IFBvaW50O1xuICAgICAgICBjb25zdCB3bmFmID0gd05BRihQb2ludCwgbkJ5dGVMZW5ndGggKiA4KTtcbiAgICAgICAgZnVuY3Rpb24gbW9kTihhKSB7XG4gICAgICAgICAgICByZXR1cm4gbW9kKGEsIENVUlZFX09SREVSKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBtb2ROX0xFKGhhc2gpIHtcbiAgICAgICAgICAgIHJldHVybiBtb2ROKGJ5dGVzVG9OdW1iZXJMRShoYXNoKSk7XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gZ2V0RXh0ZW5kZWRQdWJsaWNLZXkoa2V5KSB7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBuQnl0ZUxlbmd0aDtcbiAgICAgICAgICAgIGtleSA9IGVuc3VyZUJ5dGVzKFwicHJpdmF0ZSBrZXlcIiwga2V5LCBsZW4pO1xuICAgICAgICAgICAgY29uc3QgaGFzaGVkID0gZW5zdXJlQnl0ZXMoXCJoYXNoZWQgcHJpdmF0ZSBrZXlcIiwgY0hhc2goa2V5KSwgMiAqIGxlbik7XG4gICAgICAgICAgICBjb25zdCBoZWFkID0gYWRqdXN0U2NhbGFyQnl0ZXMyKGhhc2hlZC5zbGljZSgwLCBsZW4pKTtcbiAgICAgICAgICAgIGNvbnN0IHByZWZpeCA9IGhhc2hlZC5zbGljZShsZW4sIDIgKiBsZW4pO1xuICAgICAgICAgICAgY29uc3Qgc2NhbGFyID0gbW9kTl9MRShoZWFkKTtcbiAgICAgICAgICAgIGNvbnN0IHBvaW50ID0gRy5tdWx0aXBseShzY2FsYXIpO1xuICAgICAgICAgICAgY29uc3QgcG9pbnRCeXRlcyA9IHBvaW50LnRvUmF3Qnl0ZXMoKTtcbiAgICAgICAgICAgIHJldHVybiB7IGhlYWQsIHByZWZpeCwgc2NhbGFyLCBwb2ludCwgcG9pbnRCeXRlcyB9O1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGdldFB1YmxpY0tleShwcml2S2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RXh0ZW5kZWRQdWJsaWNLZXkocHJpdktleSkucG9pbnRCeXRlcztcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBoYXNoRG9tYWluVG9TY2FsYXIoY29udGV4dCA9IG5ldyBVaW50OEFycmF5KCksIC4uLm1zZ3MpIHtcbiAgICAgICAgICAgIGNvbnN0IG1zZyA9IGNvbmNhdEJ5dGVzMiguLi5tc2dzKTtcbiAgICAgICAgICAgIHJldHVybiBtb2ROX0xFKGNIYXNoKGRvbWFpbihtc2csIGVuc3VyZUJ5dGVzKFwiY29udGV4dFwiLCBjb250ZXh0KSwgISFwcmVoYXNoKSkpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNpZ24obXNnLCBwcml2S2V5LCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgICAgIG1zZyA9IGVuc3VyZUJ5dGVzKFwibWVzc2FnZVwiLCBtc2cpO1xuICAgICAgICAgICAgaWYgKHByZWhhc2gpXG4gICAgICAgICAgICAgICAgbXNnID0gcHJlaGFzaChtc2cpO1xuICAgICAgICAgICAgY29uc3QgeyBwcmVmaXgsIHNjYWxhciwgcG9pbnRCeXRlcyB9ID0gZ2V0RXh0ZW5kZWRQdWJsaWNLZXkocHJpdktleSk7XG4gICAgICAgICAgICBjb25zdCByID0gaGFzaERvbWFpblRvU2NhbGFyKG9wdGlvbnMuY29udGV4dCwgcHJlZml4LCBtc2cpO1xuICAgICAgICAgICAgY29uc3QgUiA9IEcubXVsdGlwbHkocikudG9SYXdCeXRlcygpO1xuICAgICAgICAgICAgY29uc3QgayA9IGhhc2hEb21haW5Ub1NjYWxhcihvcHRpb25zLmNvbnRleHQsIFIsIHBvaW50Qnl0ZXMsIG1zZyk7XG4gICAgICAgICAgICBjb25zdCBzID0gbW9kTihyICsgayAqIHNjYWxhcik7XG4gICAgICAgICAgICBhc3NlcnRHRTAocyk7XG4gICAgICAgICAgICBjb25zdCByZXMgPSBjb25jYXRCeXRlczIoUiwgbnVtYmVyVG9CeXRlc0xFKHMsIEZwMi5CWVRFUykpO1xuICAgICAgICAgICAgcmV0dXJuIGVuc3VyZUJ5dGVzKFwicmVzdWx0XCIsIHJlcywgbkJ5dGVMZW5ndGggKiAyKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCB2ZXJpZnlPcHRzID0gVkVSSUZZX0RFRkFVTFQ7XG4gICAgICAgIGZ1bmN0aW9uIHZlcmlmeShzaWcsIG1zZywgcHVibGljS2V5LCBvcHRpb25zID0gdmVyaWZ5T3B0cykge1xuICAgICAgICAgICAgY29uc3QgeyBjb250ZXh0LCB6aXAyMTUgfSA9IG9wdGlvbnM7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBGcDIuQllURVM7XG4gICAgICAgICAgICBzaWcgPSBlbnN1cmVCeXRlcyhcInNpZ25hdHVyZVwiLCBzaWcsIDIgKiBsZW4pO1xuICAgICAgICAgICAgbXNnID0gZW5zdXJlQnl0ZXMoXCJtZXNzYWdlXCIsIG1zZyk7XG4gICAgICAgICAgICBpZiAocHJlaGFzaClcbiAgICAgICAgICAgICAgICBtc2cgPSBwcmVoYXNoKG1zZyk7XG4gICAgICAgICAgICBjb25zdCBzID0gYnl0ZXNUb051bWJlckxFKHNpZy5zbGljZShsZW4sIDIgKiBsZW4pKTtcbiAgICAgICAgICAgIGxldCBBLCBSLCBTQjtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgQSA9IFBvaW50LmZyb21IZXgocHVibGljS2V5LCB6aXAyMTUpO1xuICAgICAgICAgICAgICAgIFIgPSBQb2ludC5mcm9tSGV4KHNpZy5zbGljZSgwLCBsZW4pLCB6aXAyMTUpO1xuICAgICAgICAgICAgICAgIFNCID0gRy5tdWx0aXBseVVuc2FmZShzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlcnJvcikge1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghemlwMjE1ICYmIEEuaXNTbWFsbE9yZGVyKCkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgY29uc3QgayA9IGhhc2hEb21haW5Ub1NjYWxhcihjb250ZXh0LCBSLnRvUmF3Qnl0ZXMoKSwgQS50b1Jhd0J5dGVzKCksIG1zZyk7XG4gICAgICAgICAgICBjb25zdCBSa0EgPSBSLmFkZChBLm11bHRpcGx5VW5zYWZlKGspKTtcbiAgICAgICAgICAgIHJldHVybiBSa0Euc3VidHJhY3QoU0IpLmNsZWFyQ29mYWN0b3IoKS5lcXVhbHMoUG9pbnQuWkVSTyk7XG4gICAgICAgIH1cbiAgICAgICAgRy5fc2V0V2luZG93U2l6ZSg4KTtcbiAgICAgICAgY29uc3QgdXRpbHMgPSB7XG4gICAgICAgICAgICBnZXRFeHRlbmRlZFB1YmxpY0tleSxcbiAgICAgICAgICAgIC8vIGVkMjU1MTkgcHJpdmF0ZSBrZXlzIGFyZSB1bmlmb3JtIDMyYi4gTm8gbmVlZCB0byBjaGVjayBmb3IgbW9kdWxvIGJpYXMsIGxpa2UgaW4gc2VjcDI1NmsxLlxuICAgICAgICAgICAgcmFuZG9tUHJpdmF0ZUtleTogKCkgPT4gcmFuZG9tQnl0ZXMyKEZwMi5CWVRFUyksXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIFdlJ3JlIGRvaW5nIHNjYWxhciBtdWx0aXBsaWNhdGlvbiAodXNlZCBpbiBnZXRQdWJsaWNLZXkgZXRjKSB3aXRoIHByZWNvbXB1dGVkIEJBU0VfUE9JTlRcbiAgICAgICAgICAgICAqIHZhbHVlcy4gVGhpcyBzbG93cyBkb3duIGZpcnN0IGdldFB1YmxpY0tleSgpIGJ5IG1pbGxpc2Vjb25kcyAoc2VlIFNwZWVkIHNlY3Rpb24pLFxuICAgICAgICAgICAgICogYnV0IGFsbG93cyB0byBzcGVlZC11cCBzdWJzZXF1ZW50IGdldFB1YmxpY0tleSgpIGNhbGxzIHVwIHRvIDIweC5cbiAgICAgICAgICAgICAqIEBwYXJhbSB3aW5kb3dTaXplIDIsIDQsIDgsIDE2XG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHByZWNvbXB1dGUod2luZG93U2l6ZSA9IDgsIHBvaW50ID0gUG9pbnQuQkFTRSkge1xuICAgICAgICAgICAgICAgIHBvaW50Ll9zZXRXaW5kb3dTaXplKHdpbmRvd1NpemUpO1xuICAgICAgICAgICAgICAgIHBvaW50Lm11bHRpcGx5KEJpZ0ludCgzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBvaW50O1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgQ1VSVkUsXG4gICAgICAgICAgICBnZXRQdWJsaWNLZXksXG4gICAgICAgICAgICBzaWduLFxuICAgICAgICAgICAgdmVyaWZ5LFxuICAgICAgICAgICAgRXh0ZW5kZWRQb2ludDogUG9pbnQsXG4gICAgICAgICAgICB1dGlsc1xuICAgICAgICB9O1xuICAgIH1cbiAgICAvLyAuLi9lc20vYWJzdHJhY3QvbW9udGdvbWVyeS5qc1xuICAgIHZhciBfMG41ID0gQmlnSW50KDApO1xuICAgIHZhciBfMW41ID0gQmlnSW50KDEpO1xuICAgIGZ1bmN0aW9uIHZhbGlkYXRlT3B0czIoY3VydmUpIHtcbiAgICAgICAgdmFsaWRhdGVPYmplY3QoY3VydmUsIHtcbiAgICAgICAgICAgIGE6IFwiYmlnaW50XCJcbiAgICAgICAgfSwge1xuICAgICAgICAgICAgbW9udGdvbWVyeUJpdHM6IFwiaXNTYWZlSW50ZWdlclwiLFxuICAgICAgICAgICAgbkJ5dGVMZW5ndGg6IFwiaXNTYWZlSW50ZWdlclwiLFxuICAgICAgICAgICAgYWRqdXN0U2NhbGFyQnl0ZXM6IFwiZnVuY3Rpb25cIixcbiAgICAgICAgICAgIGRvbWFpbjogXCJmdW5jdGlvblwiLFxuICAgICAgICAgICAgcG93UG1pbnVzMjogXCJmdW5jdGlvblwiLFxuICAgICAgICAgICAgR3U6IFwiYmlnaW50XCJcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBPYmplY3QuZnJlZXplKHsgLi4uY3VydmUgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIG1vbnRnb21lcnkoY3VydmVEZWYpIHtcbiAgICAgICAgY29uc3QgQ1VSVkUgPSB2YWxpZGF0ZU9wdHMyKGN1cnZlRGVmKTtcbiAgICAgICAgY29uc3QgeyBQIH0gPSBDVVJWRTtcbiAgICAgICAgY29uc3QgbW9kUCA9IChuKSA9PiBtb2QobiwgUCk7XG4gICAgICAgIGNvbnN0IG1vbnRnb21lcnlCaXRzID0gQ1VSVkUubW9udGdvbWVyeUJpdHM7XG4gICAgICAgIGNvbnN0IG1vbnRnb21lcnlCeXRlcyA9IE1hdGguY2VpbChtb250Z29tZXJ5Qml0cyAvIDgpO1xuICAgICAgICBjb25zdCBmaWVsZExlbiA9IENVUlZFLm5CeXRlTGVuZ3RoO1xuICAgICAgICBjb25zdCBhZGp1c3RTY2FsYXJCeXRlczIgPSBDVVJWRS5hZGp1c3RTY2FsYXJCeXRlcyB8fCAoKGJ5dGVzMikgPT4gYnl0ZXMyKTtcbiAgICAgICAgY29uc3QgcG93UG1pbnVzMiA9IENVUlZFLnBvd1BtaW51czIgfHwgKCh4KSA9PiBwb3coeCwgUCAtIEJpZ0ludCgyKSwgUCkpO1xuICAgICAgICBmdW5jdGlvbiBjc3dhcChzd2FwLCB4XzIsIHhfMykge1xuICAgICAgICAgICAgY29uc3QgZHVtbXkgPSBtb2RQKHN3YXAgKiAoeF8yIC0geF8zKSk7XG4gICAgICAgICAgICB4XzIgPSBtb2RQKHhfMiAtIGR1bW15KTtcbiAgICAgICAgICAgIHhfMyA9IG1vZFAoeF8zICsgZHVtbXkpO1xuICAgICAgICAgICAgcmV0dXJuIFt4XzIsIHhfM107XG4gICAgICAgIH1cbiAgICAgICAgZnVuY3Rpb24gYXNzZXJ0RmllbGRFbGVtZW50KG4pIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgbiA9PT0gXCJiaWdpbnRcIiAmJiBfMG41IDw9IG4gJiYgbiA8IFApXG4gICAgICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJFeHBlY3RlZCB2YWxpZCBzY2FsYXIgMCA8IHNjYWxhciA8IENVUlZFLlBcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYTI0ID0gKENVUlZFLmEgLSBCaWdJbnQoMikpIC8gQmlnSW50KDQpO1xuICAgICAgICBmdW5jdGlvbiBtb250Z29tZXJ5TGFkZGVyKHBvaW50VSwgc2NhbGFyKSB7XG4gICAgICAgICAgICBjb25zdCB1ID0gYXNzZXJ0RmllbGRFbGVtZW50KHBvaW50VSk7XG4gICAgICAgICAgICBjb25zdCBrID0gYXNzZXJ0RmllbGRFbGVtZW50KHNjYWxhcik7XG4gICAgICAgICAgICBjb25zdCB4XzEgPSB1O1xuICAgICAgICAgICAgbGV0IHhfMiA9IF8xbjU7XG4gICAgICAgICAgICBsZXQgel8yID0gXzBuNTtcbiAgICAgICAgICAgIGxldCB4XzMgPSB1O1xuICAgICAgICAgICAgbGV0IHpfMyA9IF8xbjU7XG4gICAgICAgICAgICBsZXQgc3dhcCA9IF8wbjU7XG4gICAgICAgICAgICBsZXQgc3c7XG4gICAgICAgICAgICBmb3IgKGxldCB0ID0gQmlnSW50KG1vbnRnb21lcnlCaXRzIC0gMSk7IHQgPj0gXzBuNTsgdC0tKSB7XG4gICAgICAgICAgICAgICAgY29uc3Qga190ID0gayA+PiB0ICYgXzFuNTtcbiAgICAgICAgICAgICAgICBzd2FwIF49IGtfdDtcbiAgICAgICAgICAgICAgICBzdyA9IGNzd2FwKHN3YXAsIHhfMiwgeF8zKTtcbiAgICAgICAgICAgICAgICB4XzIgPSBzd1swXTtcbiAgICAgICAgICAgICAgICB4XzMgPSBzd1sxXTtcbiAgICAgICAgICAgICAgICBzdyA9IGNzd2FwKHN3YXAsIHpfMiwgel8zKTtcbiAgICAgICAgICAgICAgICB6XzIgPSBzd1swXTtcbiAgICAgICAgICAgICAgICB6XzMgPSBzd1sxXTtcbiAgICAgICAgICAgICAgICBzd2FwID0ga190O1xuICAgICAgICAgICAgICAgIGNvbnN0IEEgPSB4XzIgKyB6XzI7XG4gICAgICAgICAgICAgICAgY29uc3QgQUEgPSBtb2RQKEEgKiBBKTtcbiAgICAgICAgICAgICAgICBjb25zdCBCID0geF8yIC0gel8yO1xuICAgICAgICAgICAgICAgIGNvbnN0IEJCID0gbW9kUChCICogQik7XG4gICAgICAgICAgICAgICAgY29uc3QgRSA9IEFBIC0gQkI7XG4gICAgICAgICAgICAgICAgY29uc3QgQyA9IHhfMyArIHpfMztcbiAgICAgICAgICAgICAgICBjb25zdCBEID0geF8zIC0gel8zO1xuICAgICAgICAgICAgICAgIGNvbnN0IERBID0gbW9kUChEICogQSk7XG4gICAgICAgICAgICAgICAgY29uc3QgQ0IgPSBtb2RQKEMgKiBCKTtcbiAgICAgICAgICAgICAgICBjb25zdCBkYWNiID0gREEgKyBDQjtcbiAgICAgICAgICAgICAgICBjb25zdCBkYV9jYiA9IERBIC0gQ0I7XG4gICAgICAgICAgICAgICAgeF8zID0gbW9kUChkYWNiICogZGFjYik7XG4gICAgICAgICAgICAgICAgel8zID0gbW9kUCh4XzEgKiBtb2RQKGRhX2NiICogZGFfY2IpKTtcbiAgICAgICAgICAgICAgICB4XzIgPSBtb2RQKEFBICogQkIpO1xuICAgICAgICAgICAgICAgIHpfMiA9IG1vZFAoRSAqIChBQSArIG1vZFAoYTI0ICogRSkpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN3ID0gY3N3YXAoc3dhcCwgeF8yLCB4XzMpO1xuICAgICAgICAgICAgeF8yID0gc3dbMF07XG4gICAgICAgICAgICB4XzMgPSBzd1sxXTtcbiAgICAgICAgICAgIHN3ID0gY3N3YXAoc3dhcCwgel8yLCB6XzMpO1xuICAgICAgICAgICAgel8yID0gc3dbMF07XG4gICAgICAgICAgICB6XzMgPSBzd1sxXTtcbiAgICAgICAgICAgIGNvbnN0IHoyID0gcG93UG1pbnVzMih6XzIpO1xuICAgICAgICAgICAgcmV0dXJuIG1vZFAoeF8yICogejIpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIGVuY29kZVVDb29yZGluYXRlKHUpIHtcbiAgICAgICAgICAgIHJldHVybiBudW1iZXJUb0J5dGVzTEUobW9kUCh1KSwgbW9udGdvbWVyeUJ5dGVzKTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBkZWNvZGVVQ29vcmRpbmF0ZSh1RW5jKSB7XG4gICAgICAgICAgICBjb25zdCB1ID0gZW5zdXJlQnl0ZXMoXCJ1IGNvb3JkaW5hdGVcIiwgdUVuYywgbW9udGdvbWVyeUJ5dGVzKTtcbiAgICAgICAgICAgIGlmIChmaWVsZExlbiA9PT0gMzIpXG4gICAgICAgICAgICAgICAgdVszMV0gJj0gMTI3O1xuICAgICAgICAgICAgcmV0dXJuIGJ5dGVzVG9OdW1iZXJMRSh1KTtcbiAgICAgICAgfVxuICAgICAgICBmdW5jdGlvbiBkZWNvZGVTY2FsYXIobikge1xuICAgICAgICAgICAgY29uc3QgYnl0ZXMyID0gZW5zdXJlQnl0ZXMoXCJzY2FsYXJcIiwgbik7XG4gICAgICAgICAgICBjb25zdCBsZW4gPSBieXRlczIubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKGxlbiAhPT0gbW9udGdvbWVyeUJ5dGVzICYmIGxlbiAhPT0gZmllbGRMZW4pXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBFeHBlY3RlZCAke21vbnRnb21lcnlCeXRlc30gb3IgJHtmaWVsZExlbn0gYnl0ZXMsIGdvdCAke2xlbn1gKTtcbiAgICAgICAgICAgIHJldHVybiBieXRlc1RvTnVtYmVyTEUoYWRqdXN0U2NhbGFyQnl0ZXMyKGJ5dGVzMikpO1xuICAgICAgICB9XG4gICAgICAgIGZ1bmN0aW9uIHNjYWxhck11bHQoc2NhbGFyLCB1KSB7XG4gICAgICAgICAgICBjb25zdCBwb2ludFUgPSBkZWNvZGVVQ29vcmRpbmF0ZSh1KTtcbiAgICAgICAgICAgIGNvbnN0IF9zY2FsYXIgPSBkZWNvZGVTY2FsYXIoc2NhbGFyKTtcbiAgICAgICAgICAgIGNvbnN0IHB1ID0gbW9udGdvbWVyeUxhZGRlcihwb2ludFUsIF9zY2FsYXIpO1xuICAgICAgICAgICAgaWYgKHB1ID09PSBfMG41KVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcHJpdmF0ZSBvciBwdWJsaWMga2V5IHJlY2VpdmVkXCIpO1xuICAgICAgICAgICAgcmV0dXJuIGVuY29kZVVDb29yZGluYXRlKHB1KTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBHdUJ5dGVzID0gZW5jb2RlVUNvb3JkaW5hdGUoQ1VSVkUuR3UpO1xuICAgICAgICBmdW5jdGlvbiBzY2FsYXJNdWx0QmFzZShzY2FsYXIpIHtcbiAgICAgICAgICAgIHJldHVybiBzY2FsYXJNdWx0KHNjYWxhciwgR3VCeXRlcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHNjYWxhck11bHQsXG4gICAgICAgICAgICBzY2FsYXJNdWx0QmFzZSxcbiAgICAgICAgICAgIGdldFNoYXJlZFNlY3JldDogKHByaXZhdGVLZXksIHB1YmxpY0tleSkgPT4gc2NhbGFyTXVsdChwcml2YXRlS2V5LCBwdWJsaWNLZXkpLFxuICAgICAgICAgICAgZ2V0UHVibGljS2V5OiAocHJpdmF0ZUtleSkgPT4gc2NhbGFyTXVsdEJhc2UocHJpdmF0ZUtleSksXG4gICAgICAgICAgICB1dGlsczogeyByYW5kb21Qcml2YXRlS2V5OiAoKSA9PiBDVVJWRS5yYW5kb21CeXRlcyhDVVJWRS5uQnl0ZUxlbmd0aCkgfSxcbiAgICAgICAgICAgIEd1Qnl0ZXNcbiAgICAgICAgfTtcbiAgICB9XG4gICAgLy8gLi4vZXNtL2VkMjU1MTkuanNcbiAgICB2YXIgRUQyNTUxOV9QID0gQmlnSW50KFwiNTc4OTYwNDQ2MTg2NTgwOTc3MTE3ODU0OTI1MDQzNDM5NTM5MjY2MzQ5OTIzMzI4MjAyODIwMTk3Mjg3OTIwMDM5NTY1NjQ4MTk5NDlcIik7XG4gICAgdmFyIEVEMjU1MTlfU1FSVF9NMSA9IEJpZ0ludChcIjE5NjgxMTYxMzc2NzA3NTA1OTU2ODA3MDc5MzA0OTg4NTQyMDE1NDQ2MDY2NTE1OTIzODkwMTYyNzQ0MDIxMDczMTIzODI5Nzg0NzUyXCIpO1xuICAgIHZhciBfMG42ID0gQmlnSW50KDApO1xuICAgIHZhciBfMW42ID0gQmlnSW50KDEpO1xuICAgIHZhciBfMm40ID0gQmlnSW50KDIpO1xuICAgIHZhciBfNW4yID0gQmlnSW50KDUpO1xuICAgIHZhciBfMTBuID0gQmlnSW50KDEwKTtcbiAgICB2YXIgXzIwbiA9IEJpZ0ludCgyMCk7XG4gICAgdmFyIF80MG4gPSBCaWdJbnQoNDApO1xuICAgIHZhciBfODBuID0gQmlnSW50KDgwKTtcbiAgICBmdW5jdGlvbiBlZDI1NTE5X3Bvd18yXzI1Ml8zKHgpIHtcbiAgICAgICAgY29uc3QgUCA9IEVEMjU1MTlfUDtcbiAgICAgICAgY29uc3QgeDIgPSB4ICogeCAlIFA7XG4gICAgICAgIGNvbnN0IGIyID0geDIgKiB4ICUgUDtcbiAgICAgICAgY29uc3QgYjQgPSBwb3cyKGIyLCBfMm40LCBQKSAqIGIyICUgUDtcbiAgICAgICAgY29uc3QgYjUgPSBwb3cyKGI0LCBfMW42LCBQKSAqIHggJSBQO1xuICAgICAgICBjb25zdCBiMTAgPSBwb3cyKGI1LCBfNW4yLCBQKSAqIGI1ICUgUDtcbiAgICAgICAgY29uc3QgYjIwID0gcG93MihiMTAsIF8xMG4sIFApICogYjEwICUgUDtcbiAgICAgICAgY29uc3QgYjQwID0gcG93MihiMjAsIF8yMG4sIFApICogYjIwICUgUDtcbiAgICAgICAgY29uc3QgYjgwID0gcG93MihiNDAsIF80MG4sIFApICogYjQwICUgUDtcbiAgICAgICAgY29uc3QgYjE2MCA9IHBvdzIoYjgwLCBfODBuLCBQKSAqIGI4MCAlIFA7XG4gICAgICAgIGNvbnN0IGIyNDAgPSBwb3cyKGIxNjAsIF84MG4sIFApICogYjgwICUgUDtcbiAgICAgICAgY29uc3QgYjI1MCA9IHBvdzIoYjI0MCwgXzEwbiwgUCkgKiBiMTAgJSBQO1xuICAgICAgICBjb25zdCBwb3dfcF81XzggPSBwb3cyKGIyNTAsIF8ybjQsIFApICogeCAlIFA7XG4gICAgICAgIHJldHVybiB7IHBvd19wXzVfOCwgYjIgfTtcbiAgICB9XG4gICAgZnVuY3Rpb24gYWRqdXN0U2NhbGFyQnl0ZXMoYnl0ZXMyKSB7XG4gICAgICAgIGJ5dGVzMlswXSAmPSAyNDg7XG4gICAgICAgIGJ5dGVzMlszMV0gJj0gMTI3O1xuICAgICAgICBieXRlczJbMzFdIHw9IDY0O1xuICAgICAgICByZXR1cm4gYnl0ZXMyO1xuICAgIH1cbiAgICBmdW5jdGlvbiB1dlJhdGlvKHUsIHYpIHtcbiAgICAgICAgY29uc3QgUCA9IEVEMjU1MTlfUDtcbiAgICAgICAgY29uc3QgdjMgPSBtb2QodiAqIHYgKiB2LCBQKTtcbiAgICAgICAgY29uc3QgdjcgPSBtb2QodjMgKiB2MyAqIHYsIFApO1xuICAgICAgICBjb25zdCBwb3czID0gZWQyNTUxOV9wb3dfMl8yNTJfMyh1ICogdjcpLnBvd19wXzVfODtcbiAgICAgICAgbGV0IHggPSBtb2QodSAqIHYzICogcG93MywgUCk7XG4gICAgICAgIGNvbnN0IHZ4MiA9IG1vZCh2ICogeCAqIHgsIFApO1xuICAgICAgICBjb25zdCByb290MSA9IHg7XG4gICAgICAgIGNvbnN0IHJvb3QyID0gbW9kKHggKiBFRDI1NTE5X1NRUlRfTTEsIFApO1xuICAgICAgICBjb25zdCB1c2VSb290MSA9IHZ4MiA9PT0gdTtcbiAgICAgICAgY29uc3QgdXNlUm9vdDIgPSB2eDIgPT09IG1vZCgtdSwgUCk7XG4gICAgICAgIGNvbnN0IG5vUm9vdCA9IHZ4MiA9PT0gbW9kKC11ICogRUQyNTUxOV9TUVJUX00xLCBQKTtcbiAgICAgICAgaWYgKHVzZVJvb3QxKVxuICAgICAgICAgICAgeCA9IHJvb3QxO1xuICAgICAgICBpZiAodXNlUm9vdDIgfHwgbm9Sb290KVxuICAgICAgICAgICAgeCA9IHJvb3QyO1xuICAgICAgICBpZiAoaXNOZWdhdGl2ZUxFKHgsIFApKVxuICAgICAgICAgICAgeCA9IG1vZCgteCwgUCk7XG4gICAgICAgIHJldHVybiB7IGlzVmFsaWQ6IHVzZVJvb3QxIHx8IHVzZVJvb3QyLCB2YWx1ZTogeCB9O1xuICAgIH1cbiAgICB2YXIgRnAgPSBGaWVsZChFRDI1NTE5X1AsIHZvaWQgMCwgdHJ1ZSk7XG4gICAgdmFyIGVkMjU1MTlEZWZhdWx0cyA9IHtcbiAgICAgICAgLy8gUGFyYW06IGFcbiAgICAgICAgYTogQmlnSW50KC0xKSxcbiAgICAgICAgLy8gRnAuY3JlYXRlKC0xKSBpcyBwcm9wZXI7IG91ciB3YXkgc3RpbGwgd29ya3MgYW5kIGlzIGZhc3RlclxuICAgICAgICAvLyBkIGlzIGVxdWFsIHRvIC0xMjE2NjUvMTIxNjY2IG92ZXIgZmluaXRlIGZpZWxkLlxuICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXIgaXMgUCAtIG51bWJlciwgYW5kIGRpdmlzaW9uIGlzIGludmVydChudW1iZXIsIFApXG4gICAgICAgIGQ6IEJpZ0ludChcIjM3MDk1NzA1OTM0NjY5NDM5MzQzMTM4MDgzNTA4NzU0NTY1MTg5NTQyMTEzODc5ODQzMjE5MDE2Mzg4Nzg1NTMzMDg1OTQwMjgzNTU1XCIpLFxuICAgICAgICAvLyBGaW5pdGUgZmllbGQg8J2UvXAgb3ZlciB3aGljaCB3ZSdsbCBkbyBjYWxjdWxhdGlvbnM7IDJuKioyNTVuIC0gMTluXG4gICAgICAgIEZwLFxuICAgICAgICAvLyBTdWJncm91cCBvcmRlcjogaG93IG1hbnkgcG9pbnRzIGN1cnZlIGhhc1xuICAgICAgICAvLyAybioqMjUybiArIDI3NzQyMzE3Nzc3MzcyMzUzNTM1ODUxOTM3NzkwODgzNjQ4NDkzbjtcbiAgICAgICAgbjogQmlnSW50KFwiNzIzNzAwNTU3NzMzMjI2MjIxMzk3MzE4NjU2MzA0Mjk5NDI0MDg1NzExNjM1OTM3OTkwNzYwNjAwMTk1MDkzODI4NTQ1NDI1MDk4OVwiKSxcbiAgICAgICAgLy8gQ29mYWN0b3JcbiAgICAgICAgaDogQmlnSW50KDgpLFxuICAgICAgICAvLyBCYXNlIHBvaW50ICh4LCB5KSBha2EgZ2VuZXJhdG9yIHBvaW50XG4gICAgICAgIEd4OiBCaWdJbnQoXCIxNTExMjIyMTM0OTUzNTQwMDc3MjUwMTE1MTQwOTU4ODUzMTUxMTQ1NDAxMjY5MzA0MTg1NzIwNjA0NjExMzI4Mzk0OTg0Nzc2MjIwMlwiKSxcbiAgICAgICAgR3k6IEJpZ0ludChcIjQ2MzE2ODM1Njk0OTI2NDc4MTY5NDI4Mzk0MDAzNDc1MTYzMTQxMzA3OTkzODY2MjU2MjI1NjE1NzgzMDMzNjAzMTY1MjUxODU1OTYwXCIpLFxuICAgICAgICBoYXNoOiBzaGE1MTIsXG4gICAgICAgIHJhbmRvbUJ5dGVzLFxuICAgICAgICBhZGp1c3RTY2FsYXJCeXRlcyxcbiAgICAgICAgLy8gZG9tMlxuICAgICAgICAvLyBSYXRpbyBvZiB1IHRvIHYuIEFsbG93cyB1cyB0byBjb21iaW5lIGludmVyc2lvbiBhbmQgc3F1YXJlIHJvb3QuIFVzZXMgYWxnbyBmcm9tIFJGQzgwMzIgNS4xLjMuXG4gICAgICAgIC8vIENvbnN0YW50LXRpbWUsIHUv4oiadlxuICAgICAgICB1dlJhdGlvXG4gICAgfTtcbiAgICBmdW5jdGlvbiBlZDI1NTE5X2RvbWFpbihkYXRhLCBjdHgsIHBoZmxhZykge1xuICAgICAgICBpZiAoY3R4Lmxlbmd0aCA+IDI1NSlcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNvbnRleHQgaXMgdG9vIGJpZ1wiKTtcbiAgICAgICAgcmV0dXJuIGNvbmNhdEJ5dGVzKHV0ZjhUb0J5dGVzKFwiU2lnRWQyNTUxOSBubyBFZDI1NTE5IGNvbGxpc2lvbnNcIiksIG5ldyBVaW50OEFycmF5KFtwaGZsYWcgPyAxIDogMCwgY3R4Lmxlbmd0aF0pLCBjdHgsIGRhdGEpO1xuICAgIH1cbiAgICB2YXIgZWQyNTUxOWN0eCA9IC8qIEBfX1BVUkVfXyAqLyB0d2lzdGVkRWR3YXJkcyh7XG4gICAgICAgIC4uLmVkMjU1MTlEZWZhdWx0cyxcbiAgICAgICAgZG9tYWluOiBlZDI1NTE5X2RvbWFpblxuICAgIH0pO1xuICAgIHZhciBlZDI1NTE5cGggPSAvKiBAX19QVVJFX18gKi8gdHdpc3RlZEVkd2FyZHMoe1xuICAgICAgICAuLi5lZDI1NTE5RGVmYXVsdHMsXG4gICAgICAgIGRvbWFpbjogZWQyNTUxOV9kb21haW4sXG4gICAgICAgIHByZWhhc2g6IHNoYTUxMlxuICAgIH0pO1xuICAgIHZhciB4MjU1MTkgPSAvKiBAX19QVVJFX18gKi8gKCgpID0+IG1vbnRnb21lcnkoe1xuICAgICAgICBQOiBFRDI1NTE5X1AsXG4gICAgICAgIGE6IEJpZ0ludCg0ODY2NjIpLFxuICAgICAgICBtb250Z29tZXJ5Qml0czogMjU1LFxuICAgICAgICAvLyBuIGlzIDI1MyBiaXRzXG4gICAgICAgIG5CeXRlTGVuZ3RoOiAzMixcbiAgICAgICAgR3U6IEJpZ0ludCg5KSxcbiAgICAgICAgcG93UG1pbnVzMjogKHgpID0+IHtcbiAgICAgICAgICAgIGNvbnN0IFAgPSBFRDI1NTE5X1A7XG4gICAgICAgICAgICBjb25zdCB7IHBvd19wXzVfOCwgYjIgfSA9IGVkMjU1MTlfcG93XzJfMjUyXzMoeCk7XG4gICAgICAgICAgICByZXR1cm4gbW9kKHBvdzIocG93X3BfNV84LCBCaWdJbnQoMyksIFApICogYjIsIFApO1xuICAgICAgICB9LFxuICAgICAgICBhZGp1c3RTY2FsYXJCeXRlcyxcbiAgICAgICAgcmFuZG9tQnl0ZXNcbiAgICB9KSkoKTtcbiAgICB2YXIgRUxMMl9DMSA9IChGcC5PUkRFUiArIEJpZ0ludCgzKSkgLyBCaWdJbnQoOCk7XG4gICAgdmFyIEVMTDJfQzIgPSBGcC5wb3coXzJuNCwgRUxMMl9DMSk7XG4gICAgdmFyIEVMTDJfQzMgPSBGcC5zcXJ0KEZwLm5lZyhGcC5PTkUpKTtcbiAgICB2YXIgRUxMMl9DNCA9IChGcC5PUkRFUiAtIEJpZ0ludCg1KSkgLyBCaWdJbnQoOCk7XG4gICAgdmFyIEVMTDJfSiA9IEJpZ0ludCg0ODY2NjIpO1xuICAgIHZhciBFTEwyX0MxX0VEV0FSRFMgPSBGcFNxcnRFdmVuKEZwLCBGcC5uZWcoQmlnSW50KDQ4NjY2NCkpKTtcbiAgICB2YXIgU1FSVF9BRF9NSU5VU19PTkUgPSBCaWdJbnQoXCIyNTA2MzA2ODk1MzM4NDYyMzQ3NDExMTQxNDE1ODcwMjE1MjcwMTI0NDUzMTUwMjQ5MjY1NjQ2MDA3OTIxMDQ4MjYxMDQzMDc1MDIzNVwiKTtcbiAgICB2YXIgSU5WU1FSVF9BX01JTlVTX0QgPSBCaWdJbnQoXCI1NDQ2OTMwNzAwODkwOTMxNjkyMDk5NTgxMzg2ODc0NTE0MTYwNTM5MzU5NzI5MjkyNzQ1NjkyMTIwNTMxMjg5NjMxMTcyMTAxNzU3OFwiKTtcbiAgICB2YXIgT05FX01JTlVTX0RfU1EgPSBCaWdJbnQoXCIxMTU5ODQzMDIxNjY4Nzc5ODc5MTkzNzc1NTIxODU1NTg2NjQ3OTM3MzU3NzU5NzE1NDE3NjU0NDM5ODc5NzIwODc2MTExODA2ODM4XCIpO1xuICAgIHZhciBEX01JTlVTX09ORV9TUSA9IEJpZ0ludChcIjQwNDQwODM0MzQ2MzA4NTM2ODU4MTAxMDQyNDY5MzIzMTkwODI2MjQ4Mzk5MTQ2MjM4NzA4MzUyMjQwMTMzMjIwODY1MTM3MjY1OTUyXCIpO1xuICAgIHZhciBNQVhfMjU1QiA9IEJpZ0ludChcIjB4N2ZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZlwiKTtcbiAgICByZXR1cm4gX190b0NvbW1vbkpTKGlucHV0X2V4cG9ydHMpO1xufSkoKTtcbi8qISBub2JsZS1jdXJ2ZXMgLSBNSVQgTGljZW5zZSAoYykgMjAyMiBQYXVsIE1pbGxlciAocGF1bG1pbGxyLmNvbSkgKi9cbi8qISBCdW5kbGVkIGxpY2Vuc2UgaW5mb3JtYXRpb246XG5cbkBub2JsZS9oYXNoZXMvZXNtL3V0aWxzLmpzOlxuICAoKiEgbm9ibGUtaGFzaGVzIC0gTUlUIExpY2Vuc2UgKGMpIDIwMjIgUGF1bCBNaWxsZXIgKHBhdWxtaWxsci5jb20pICopXG4qL1xuZXhwb3J0IGNvbnN0IHgyNTUxOSA9IG5vYmxlQ3VydmVzLngyNTUxOTtcbiIsIi8vIEB0cy1pZ25vcmVbdW50eXBlZC1pbXBvcnRdXG5pbXBvcnQgeyB4MjU1MTkgfSBmcm9tIFwiLi4vaW50ZXJuYWwvbm9ibGUtY3VydmVzLTEuMy4wLmpzXCI7XG5pbXBvcnQgeyByYW5kb20gfSBmcm9tIFwiLi4vcmFuZG9tL1JhbmRvbWl6ZXIuanNcIjtcbi8vIFRoZSBudW1iZXIgb2YgYnl0ZXMgZm9yIGEgcHJpdmF0ZSBrZXkgaW4gdGhlIGN1cnZlXG4vLyB0aGUgYnl0ZSBsZW5ndGggb2YgdGhlIG1vZHVsdXNcbmNvbnN0IFgyNTUxOV9OX0JZVEVfTEVOR1RIID0gMzI7XG4vKipcbiAqIEByZXR1cm4gcmFuZG9tbHkgZ2VuZXJhdGVkIFgyNTUxOSBrZXkgcGFpclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVFY2NLZXlQYWlyKCkge1xuICAgIC8vIG5vYmxlLWN1cnZlcyBhcHBlYXJzIHRvIGNsYW1wIHRoZSBwcml2YXRlIGtleSB3aGVuIHVzaW5nIGl0LCBidXQgbm90IHdoZW4gZ2VuZXJhdGluZyBpdCwgc28gZm9yIHNhZmV0eSxcbiAgICAvLyB3ZSBkbyBub3Qgd2FudCB0byBzdG9yZSBpdCB1bi1jbGFtcGVkIGluIGNhc2Ugd2UgdXNlIGEgZGlmZmVyZW50IGltcGxlbWVudGF0aW9uIGxhdGVyXG4gICAgY29uc3QgcHJpdmF0ZUtleSA9IGNsYW1wUHJpdmF0ZUtleShyYW5kb20uZ2VuZXJhdGVSYW5kb21EYXRhKFgyNTUxOV9OX0JZVEVfTEVOR1RIKSk7XG4gICAgY29uc3QgcHVibGljS2V5ID0gZGVyaXZlUHVibGljS2V5KHByaXZhdGVLZXkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIHByaXZhdGVLZXksXG4gICAgICAgIHB1YmxpY0tleSxcbiAgICB9O1xufVxuLyoqXG4gKiBEZXJpdmUgYSBzaGFyZWQgc2VjcmV0IGZyb20gdGhlIHNlbmRlcidzIHByaXZhdGUga2V5IGFuZCB0aGUgcmVjaXBpZW50J3MgcHVibGljIGtleSB0byBlbmNyeXB0IGEgbWVzc2FnZVxuICogQHBhcmFtIHNlbmRlcklkZW50aXR5UHJpdmF0ZUtleVx0dGhlIHNlbmRlcidzIHByaXZhdGUgaWRlbnRpdHkga2V5XG4gKiBAcGFyYW0gZXBoZW1lcmFsUHJpdmF0ZUtleSAgdGhlIGVwaGVtZXJhbCBwcml2YXRlIGtleSBnZW5lcmF0ZWQgYnkgdGhlIHNlbmRlciBmb3IganVzdCBvbmUgbWVzc2FnZSAodG8gb25lIG9yIG1vcmUgcmVjaXBpZW50cylcbiAqIEBwYXJhbSByZWNpcGllbnRJZGVudGl0eVB1YmxpY0tleSB0aGUgcmVjaXBpZW50J3MgcHVibGljIGlkZW50aXR5IGtleVxuICogQHJldHVybiB0aGUgc2hhcmVkIHNlY3JldHNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVjY0VuY2Fwc3VsYXRlKHNlbmRlcklkZW50aXR5UHJpdmF0ZUtleSwgZXBoZW1lcmFsUHJpdmF0ZUtleSwgcmVjaXBpZW50SWRlbnRpdHlQdWJsaWNLZXkpIHtcbiAgICBjb25zdCBlcGhlbWVyYWxTaGFyZWRTZWNyZXQgPSBnZW5lcmF0ZVNoYXJlZFNlY3JldChlcGhlbWVyYWxQcml2YXRlS2V5LCByZWNpcGllbnRJZGVudGl0eVB1YmxpY0tleSk7XG4gICAgY29uc3QgYXV0aFNoYXJlZFNlY3JldCA9IGdlbmVyYXRlU2hhcmVkU2VjcmV0KHNlbmRlcklkZW50aXR5UHJpdmF0ZUtleSwgcmVjaXBpZW50SWRlbnRpdHlQdWJsaWNLZXkpO1xuICAgIHJldHVybiB7IGVwaGVtZXJhbFNoYXJlZFNlY3JldCwgYXV0aFNoYXJlZFNlY3JldCB9O1xufVxuLyoqXG4gKiBEZXJpdmUgYSBzaGFyZWQgc2VjcmV0IGZyb20gdGhlIHJlY2lwaWVudCdzIHByaXZhdGUga2V5IGFuZCB0aGUgc2VuZGVyJ3MgcHVibGljIGtleSB0byBkZWNyeXB0IGEgbWVzc2FnZVxuICogQHBhcmFtIHNlbmRlcklkZW50aXR5UHVibGljS2V5XHR0aGUgc2VuZGVyJ3MgcHVibGljIGlkZW50aXR5IGtleVxuICogQHBhcmFtIGVwaGVtZXJhbFB1YmxpY0tleSAgdGhlIGVwaGVtZXJhbCBwdWJsaWMga2V5IGdlbmVyYXRlZCBieSB0aGUgc2VuZGVyIGZvciBqdXN0IG9uZSBtZXNzYWdlICh0byBvbmUgb3IgbW9yZSByZWNpcGllbnRzKVxuICogQHBhcmFtIHJlY2lwaWVudElkZW50aXR5UHJpdmF0ZUtleSB0aGUgcmVjaXBpZW50J3MgcHJpdmF0ZSBpZGVudGl0eSBrZXlcbiAqIEByZXR1cm4gc2hhcmVkIHNlY3JldCBhbmQgdGhlIHNlbmRlcidzIHB1YmxpYyBrZXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVjY0RlY2Fwc3VsYXRlKHNlbmRlcklkZW50aXR5UHVibGljS2V5LCBlcGhlbWVyYWxQdWJsaWNLZXksIHJlY2lwaWVudElkZW50aXR5UHJpdmF0ZUtleSkge1xuICAgIGNvbnN0IGVwaGVtZXJhbFNoYXJlZFNlY3JldCA9IGdlbmVyYXRlU2hhcmVkU2VjcmV0KHJlY2lwaWVudElkZW50aXR5UHJpdmF0ZUtleSwgZXBoZW1lcmFsUHVibGljS2V5KTtcbiAgICBjb25zdCBhdXRoU2hhcmVkU2VjcmV0ID0gZ2VuZXJhdGVTaGFyZWRTZWNyZXQocmVjaXBpZW50SWRlbnRpdHlQcml2YXRlS2V5LCBzZW5kZXJJZGVudGl0eVB1YmxpY0tleSk7XG4gICAgcmV0dXJuIHsgZXBoZW1lcmFsU2hhcmVkU2VjcmV0LCBhdXRoU2hhcmVkU2VjcmV0IH07XG59XG4vKipcbiAqIERpZmZpZS1IZWxsbWFuIGtleSBleGNoYW5nZTsgd29ya3MgYnkgY29tYmluaW5nIG9uZSBwYXJ0eSdzIHByaXZhdGUga2V5IGFuZCB0aGUgb3RoZXIgcGFydHkncyBwdWJsaWMga2V5IHRvIGZvcm0gYSBzaGFyZWQgc2VjcmV0IGJldHdlZW4gYm90aCBwYXJ0aWVzXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlU2hhcmVkU2VjcmV0KGxvY2FsUHJpdmF0ZUtleSwgcmVtb3RlUHVibGljS2V5KSB7XG4gICAgY29uc3Qgc2hhcmVkU2VjcmV0ID0geDI1NTE5LmdldFNoYXJlZFNlY3JldChsb2NhbFByaXZhdGVLZXksIHJlbW90ZVB1YmxpY0tleSk7XG4gICAgLy8gaWYgZXZlcnkgYnl0ZSBzb21laG93IGhhcHBlbnMgdG8gYmUgMCwgd2UgY2FuJ3QgdXNlIHRoaXMgYXMgYSBzZWNyZXQ7IHRoaXMgaXMgYXN0cm9ub21pY2FsbHkgdW5saWtlbHkgdG8gaGFwcGVuIGJ5IGNoYW5jZVxuICAgIGlmIChzaGFyZWRTZWNyZXQuZXZlcnkoKHZhbCkgPT4gdmFsID09PSAwKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjYW4ndCBnZXQgc2hhcmVkIHNlY3JldDogYmFkIGtleSBpbnB1dHNcIik7XG4gICAgfVxuICAgIHJldHVybiBzaGFyZWRTZWNyZXQ7XG59XG4vLyBzZWUgaHR0cHM6Ly93d3cuamNyYWlnZS5jb20vYW4tZXhwbGFpbmVyLW9uLWVkMjU1MTktY2xhbXBpbmcgZm9yIGFuIGV4cGxhbmF0aW9uIG9uIHdoeSB3ZSBkbyB0aGlzXG5mdW5jdGlvbiBjbGFtcFByaXZhdGVLZXkocHJpdmF0ZUtleSkge1xuICAgIC8vIEZpcnN0LCB3ZSB3YW50IHRvIHVuc2V0IHRoZSBoaWdoZXN0IGJpdCBidXQgc2V0IHRoZSBzZWNvbmQtaGlnaGVzdCBiaXQgdG8gMS4gVGhpcyBwcmV2ZW50cyBwb3RlbnRpYWwgdGltaW5nIGFuZCBicnV0ZS1mb3JjZSBhdHRhY2tzLCByZXNwZWN0aXZlbHkuXG4gICAgcHJpdmF0ZUtleVtwcml2YXRlS2V5Lmxlbmd0aCAtIDFdID0gKHByaXZhdGVLZXlbcHJpdmF0ZUtleS5sZW5ndGggLSAxXSAmIDBiMDExMTExMTEpIHwgMGIwMTAwMDAwMDtcbiAgICAvLyBUaGVuLCB3ZSB3YW50IHRvIGd1YXJhbnRlZSBvdXIgc2NhbGFyIGlzIGEgbXVsdGlwbGUgb2YgOCwgb3VyIGNvZmFjdG9yLCB0byBwcm90ZWN0IGFnYWluc3Qgc21hbGwtc3ViZ3JvdXAgYXR0YWNrcyBwZXIgUkZDIDI3ODUgd2hpY2ggY291bGQgbGVhayBrZXkgZGF0YSFcbiAgICBwcml2YXRlS2V5WzBdICY9IDBiMTExMTEwMDA7XG4gICAgcmV0dXJuIHByaXZhdGVLZXk7XG59XG5mdW5jdGlvbiBkZXJpdmVQdWJsaWNLZXkocHJpdmF0ZUtleSkge1xuICAgIHJldHVybiB4MjU1MTkuZ2V0UHVibGljS2V5KHByaXZhdGVLZXkpO1xufVxuIiwiLy8gdjIuMlxuLy8gdHV0YW8obWFwKTogc2xpZ2h0bHkgbW9kaWZpZWQgPT4gbWFkZSBzeW5jaHJvbm91cywgcmVtb3ZlZCB1bnVzZWQgY29kZVxuZnVuY3Rpb24gYkNyeXB0KCkge1xuICAgIHRoaXMuR0VOU0FMVF9ERUZBVUxUX0xPRzJfUk9VTkRTID0gMTA7XG4gICAgdGhpcy5CQ1JZUFRfU0FMVF9MRU4gPSAxNjtcbiAgICB0aGlzLkJMT1dGSVNIX05VTV9ST1VORFMgPSAxNjtcbiAgICAvLyBjb21tZW50ZWQgbmV4dCBsaW5lIGJlY2F1c2UgaXQgaXMgbm90IHVzZWRcbiAgICAvL1x0dGhpcy5QUk5HID0gQ2xpcHBlcnouQ3J5cHRvLlBSTkcuZGVmYXVsdFJhbmRvbUdlbmVyYXRvcigpO1xuICAgIHRoaXMuTUFYX0VYRUNVVElPTl9USU1FID0gMTAwO1xuICAgIHRoaXMuUF9vcmlnID0gW1xuICAgICAgICAweDI0M2Y2YTg4LCAweDg1YTMwOGQzLCAweDEzMTk4YTJlLCAweDAzNzA3MzQ0LCAweGE0MDkzODIyLFxuICAgICAgICAweDI5OWYzMWQwLCAweDA4MmVmYTk4LCAweGVjNGU2Yzg5LCAweDQ1MjgyMWU2LCAweDM4ZDAxMzc3LFxuICAgICAgICAweGJlNTQ2NmNmLCAweDM0ZTkwYzZjLCAweGMwYWMyOWI3LCAweGM5N2M1MGRkLCAweDNmODRkNWI1LFxuICAgICAgICAweGI1NDcwOTE3LCAweDkyMTZkNWQ5LCAweDg5NzlmYjFiXG4gICAgXTtcbiAgICB0aGlzLlNfb3JpZyA9IFtcbiAgICAgICAgMHhkMTMxMGJhNiwgMHg5OGRmYjVhYywgMHgyZmZkNzJkYiwgMHhkMDFhZGZiNywgMHhiOGUxYWZlZCxcbiAgICAgICAgMHg2YTI2N2U5NiwgMHhiYTdjOTA0NSwgMHhmMTJjN2Y5OSwgMHgyNGExOTk0NywgMHhiMzkxNmNmNyxcbiAgICAgICAgMHgwODAxZjJlMiwgMHg4NThlZmMxNiwgMHg2MzY5MjBkOCwgMHg3MTU3NGU2OSwgMHhhNDU4ZmVhMyxcbiAgICAgICAgMHhmNDkzM2Q3ZSwgMHgwZDk1NzQ4ZiwgMHg3MjhlYjY1OCwgMHg3MThiY2Q1OCwgMHg4MjE1NGFlZSxcbiAgICAgICAgMHg3YjU0YTQxZCwgMHhjMjVhNTliNSwgMHg5YzMwZDUzOSwgMHgyYWYyNjAxMywgMHhjNWQxYjAyMyxcbiAgICAgICAgMHgyODYwODVmMCwgMHhjYTQxNzkxOCwgMHhiOGRiMzhlZiwgMHg4ZTc5ZGNiMCwgMHg2MDNhMTgwZSxcbiAgICAgICAgMHg2YzllMGU4YiwgMHhiMDFlOGEzZSwgMHhkNzE1NzdjMSwgMHhiZDMxNGIyNywgMHg3OGFmMmZkYSxcbiAgICAgICAgMHg1NTYwNWM2MCwgMHhlNjU1MjVmMywgMHhhYTU1YWI5NCwgMHg1NzQ4OTg2MiwgMHg2M2U4MTQ0MCxcbiAgICAgICAgMHg1NWNhMzk2YSwgMHgyYWFiMTBiNiwgMHhiNGNjNWMzNCwgMHgxMTQxZThjZSwgMHhhMTU0ODZhZixcbiAgICAgICAgMHg3YzcyZTk5MywgMHhiM2VlMTQxMSwgMHg2MzZmYmMyYSwgMHgyYmE5YzU1ZCwgMHg3NDE4MzFmNixcbiAgICAgICAgMHhjZTVjM2UxNiwgMHg5Yjg3OTMxZSwgMHhhZmQ2YmEzMywgMHg2YzI0Y2Y1YywgMHg3YTMyNTM4MSxcbiAgICAgICAgMHgyODk1ODY3NywgMHgzYjhmNDg5OCwgMHg2YjRiYjlhZiwgMHhjNGJmZTgxYiwgMHg2NjI4MjE5MyxcbiAgICAgICAgMHg2MWQ4MDljYywgMHhmYjIxYTk5MSwgMHg0ODdjYWM2MCwgMHg1ZGVjODAzMiwgMHhlZjg0NWQ1ZCxcbiAgICAgICAgMHhlOTg1NzViMSwgMHhkYzI2MjMwMiwgMHhlYjY1MWI4OCwgMHgyMzg5M2U4MSwgMHhkMzk2YWNjNSxcbiAgICAgICAgMHgwZjZkNmZmMywgMHg4M2Y0NDIzOSwgMHgyZTBiNDQ4MiwgMHhhNDg0MjAwNCwgMHg2OWM4ZjA0YSxcbiAgICAgICAgMHg5ZTFmOWI1ZSwgMHgyMWM2Njg0MiwgMHhmNmU5NmM5YSwgMHg2NzBjOWM2MSwgMHhhYmQzODhmMCxcbiAgICAgICAgMHg2YTUxYTBkMiwgMHhkODU0MmY2OCwgMHg5NjBmYTcyOCwgMHhhYjUxMzNhMywgMHg2ZWVmMGI2YyxcbiAgICAgICAgMHgxMzdhM2JlNCwgMHhiYTNiZjA1MCwgMHg3ZWZiMmE5OCwgMHhhMWYxNjUxZCwgMHgzOWFmMDE3NixcbiAgICAgICAgMHg2NmNhNTkzZSwgMHg4MjQzMGU4OCwgMHg4Y2VlODYxOSwgMHg0NTZmOWZiNCwgMHg3ZDg0YTVjMyxcbiAgICAgICAgMHgzYjhiNWViZSwgMHhlMDZmNzVkOCwgMHg4NWMxMjA3MywgMHg0MDFhNDQ5ZiwgMHg1NmMxNmFhNixcbiAgICAgICAgMHg0ZWQzYWE2MiwgMHgzNjNmNzcwNiwgMHgxYmZlZGY3MiwgMHg0MjliMDIzZCwgMHgzN2QwZDcyNCxcbiAgICAgICAgMHhkMDBhMTI0OCwgMHhkYjBmZWFkMywgMHg0OWYxYzA5YiwgMHgwNzUzNzJjOSwgMHg4MDk5MWI3YixcbiAgICAgICAgMHgyNWQ0NzlkOCwgMHhmNmU4ZGVmNywgMHhlM2ZlNTAxYSwgMHhiNjc5NGMzYiwgMHg5NzZjZTBiZCxcbiAgICAgICAgMHgwNGMwMDZiYSwgMHhjMWE5NGZiNiwgMHg0MDlmNjBjNCwgMHg1ZTVjOWVjMiwgMHgxOTZhMjQ2MyxcbiAgICAgICAgMHg2OGZiNmZhZiwgMHgzZTZjNTNiNSwgMHgxMzM5YjJlYiwgMHgzYjUyZWM2ZiwgMHg2ZGZjNTExZixcbiAgICAgICAgMHg5YjMwOTUyYywgMHhjYzgxNDU0NCwgMHhhZjVlYmQwOSwgMHhiZWUzZDAwNCwgMHhkZTMzNGFmZCxcbiAgICAgICAgMHg2NjBmMjgwNywgMHgxOTJlNGJiMywgMHhjMGNiYTg1NywgMHg0NWM4NzQwZiwgMHhkMjBiNWYzOSxcbiAgICAgICAgMHhiOWQzZmJkYiwgMHg1NTc5YzBiZCwgMHgxYTYwMzIwYSwgMHhkNmExMDBjNiwgMHg0MDJjNzI3OSxcbiAgICAgICAgMHg2NzlmMjVmZSwgMHhmYjFmYTNjYywgMHg4ZWE1ZTlmOCwgMHhkYjMyMjJmOCwgMHgzYzc1MTZkZixcbiAgICAgICAgMHhmZDYxNmIxNSwgMHgyZjUwMWVjOCwgMHhhZDA1NTJhYiwgMHgzMjNkYjVmYSwgMHhmZDIzODc2MCxcbiAgICAgICAgMHg1MzMxN2I0OCwgMHgzZTAwZGY4MiwgMHg5ZTVjNTdiYiwgMHhjYTZmOGNhMCwgMHgxYTg3NTYyZSxcbiAgICAgICAgMHhkZjE3NjlkYiwgMHhkNTQyYThmNiwgMHgyODdlZmZjMywgMHhhYzY3MzJjNiwgMHg4YzRmNTU3MyxcbiAgICAgICAgMHg2OTViMjdiMCwgMHhiYmNhNThjOCwgMHhlMWZmYTM1ZCwgMHhiOGYwMTFhMCwgMHgxMGZhM2Q5OCxcbiAgICAgICAgMHhmZDIxODNiOCwgMHg0YWZjYjU2YywgMHgyZGQxZDM1YiwgMHg5YTUzZTQ3OSwgMHhiNmY4NDU2NSxcbiAgICAgICAgMHhkMjhlNDliYywgMHg0YmZiOTc5MCwgMHhlMWRkZjJkYSwgMHhhNGNiN2UzMywgMHg2MmZiMTM0MSxcbiAgICAgICAgMHhjZWU0YzZlOCwgMHhlZjIwY2FkYSwgMHgzNjc3NGMwMSwgMHhkMDdlOWVmZSwgMHgyYmYxMWZiNCxcbiAgICAgICAgMHg5NWRiZGE0ZCwgMHhhZTkwOTE5OCwgMHhlYWFkOGU3MSwgMHg2YjkzZDVhMCwgMHhkMDhlZDFkMCxcbiAgICAgICAgMHhhZmM3MjVlMCwgMHg4ZTNjNWIyZiwgMHg4ZTc1OTRiNywgMHg4ZmY2ZTJmYiwgMHhmMjEyMmI2NCxcbiAgICAgICAgMHg4ODg4YjgxMiwgMHg5MDBkZjAxYywgMHg0ZmFkNWVhMCwgMHg2ODhmYzMxYywgMHhkMWNmZjE5MSxcbiAgICAgICAgMHhiM2E4YzFhZCwgMHgyZjJmMjIxOCwgMHhiZTBlMTc3NywgMHhlYTc1MmRmZSwgMHg4YjAyMWZhMSxcbiAgICAgICAgMHhlNWEwY2MwZiwgMHhiNTZmNzRlOCwgMHgxOGFjZjNkNiwgMHhjZTg5ZTI5OSwgMHhiNGE4NGZlMCxcbiAgICAgICAgMHhmZDEzZTBiNywgMHg3Y2M0M2I4MSwgMHhkMmFkYThkOSwgMHgxNjVmYTI2NiwgMHg4MDk1NzcwNSxcbiAgICAgICAgMHg5M2NjNzMxNCwgMHgyMTFhMTQ3NywgMHhlNmFkMjA2NSwgMHg3N2I1ZmE4NiwgMHhjNzU0NDJmNSxcbiAgICAgICAgMHhmYjlkMzVjZiwgMHhlYmNkYWYwYywgMHg3YjNlODlhMCwgMHhkNjQxMWJkMywgMHhhZTFlN2U0OSxcbiAgICAgICAgMHgwMDI1MGUyZCwgMHgyMDcxYjM1ZSwgMHgyMjY4MDBiYiwgMHg1N2I4ZTBhZiwgMHgyNDY0MzY5YixcbiAgICAgICAgMHhmMDA5YjkxZSwgMHg1NTYzOTExZCwgMHg1OWRmYTZhYSwgMHg3OGMxNDM4OSwgMHhkOTVhNTM3ZixcbiAgICAgICAgMHgyMDdkNWJhMiwgMHgwMmU1YjljNSwgMHg4MzI2MDM3NiwgMHg2Mjk1Y2ZhOSwgMHgxMWM4MTk2OCxcbiAgICAgICAgMHg0ZTczNGE0MSwgMHhiMzQ3MmRjYSwgMHg3YjE0YTk0YSwgMHgxYjUxMDA1MiwgMHg5YTUzMjkxNSxcbiAgICAgICAgMHhkNjBmNTczZiwgMHhiYzliYzZlNCwgMHgyYjYwYTQ3NiwgMHg4MWU2NzQwMCwgMHgwOGJhNmZiNSxcbiAgICAgICAgMHg1NzFiZTkxZiwgMHhmMjk2ZWM2YiwgMHgyYTBkZDkxNSwgMHhiNjYzNjUyMSwgMHhlN2I5ZjliNixcbiAgICAgICAgMHhmZjM0MDUyZSwgMHhjNTg1NTY2NCwgMHg1M2IwMmQ1ZCwgMHhhOTlmOGZhMSwgMHgwOGJhNDc5OSxcbiAgICAgICAgMHg2ZTg1MDc2YSwgMHg0YjdhNzBlOSwgMHhiNWIzMjk0NCwgMHhkYjc1MDkyZSwgMHhjNDE5MjYyMyxcbiAgICAgICAgMHhhZDZlYTZiMCwgMHg0OWE3ZGY3ZCwgMHg5Y2VlNjBiOCwgMHg4ZmVkYjI2NiwgMHhlY2FhOGM3MSxcbiAgICAgICAgMHg2OTlhMTdmZiwgMHg1NjY0NTI2YywgMHhjMmIxOWVlMSwgMHgxOTM2MDJhNSwgMHg3NTA5NGMyOSxcbiAgICAgICAgMHhhMDU5MTM0MCwgMHhlNDE4M2EzZSwgMHgzZjU0OTg5YSwgMHg1YjQyOWQ2NSwgMHg2YjhmZTRkNixcbiAgICAgICAgMHg5OWY3M2ZkNiwgMHhhMWQyOWMwNywgMHhlZmU4MzBmNSwgMHg0ZDJkMzhlNiwgMHhmMDI1NWRjMSxcbiAgICAgICAgMHg0Y2RkMjA4NiwgMHg4NDcwZWIyNiwgMHg2MzgyZTljNiwgMHgwMjFlY2M1ZSwgMHgwOTY4NmIzZixcbiAgICAgICAgMHgzZWJhZWZjOSwgMHgzYzk3MTgxNCwgMHg2YjZhNzBhMSwgMHg2ODdmMzU4NCwgMHg1MmEwZTI4NixcbiAgICAgICAgMHhiNzljNTMwNSwgMHhhYTUwMDczNywgMHgzZTA3ODQxYywgMHg3ZmRlYWU1YywgMHg4ZTdkNDRlYyxcbiAgICAgICAgMHg1NzE2ZjJiOCwgMHhiMDNhZGEzNywgMHhmMDUwMGMwZCwgMHhmMDFjMWYwNCwgMHgwMjAwYjNmZixcbiAgICAgICAgMHhhZTBjZjUxYSwgMHgzY2I1NzRiMiwgMHgyNTgzN2E1OCwgMHhkYzA5MjFiZCwgMHhkMTkxMTNmOSxcbiAgICAgICAgMHg3Y2E5MmZmNiwgMHg5NDMyNDc3MywgMHgyMmY1NDcwMSwgMHgzYWU1ZTU4MSwgMHgzN2MyZGFkYyxcbiAgICAgICAgMHhjOGI1NzYzNCwgMHg5YWYzZGRhNywgMHhhOTQ0NjE0NiwgMHgwZmQwMDMwZSwgMHhlY2M4YzczZSxcbiAgICAgICAgMHhhNDc1MWU0MSwgMHhlMjM4Y2Q5OSwgMHgzYmVhMGUyZiwgMHgzMjgwYmJhMSwgMHgxODNlYjMzMSxcbiAgICAgICAgMHg0ZTU0OGIzOCwgMHg0ZjZkYjkwOCwgMHg2ZjQyMGQwMywgMHhmNjBhMDRiZiwgMHgyY2I4MTI5MCxcbiAgICAgICAgMHgyNDk3N2M3OSwgMHg1Njc5YjA3MiwgMHhiY2FmODlhZiwgMHhkZTlhNzcxZiwgMHhkOTkzMDgxMCxcbiAgICAgICAgMHhiMzhiYWUxMiwgMHhkY2NmM2YyZSwgMHg1NTEyNzIxZiwgMHgyZTZiNzEyNCwgMHg1MDFhZGRlNixcbiAgICAgICAgMHg5Zjg0Y2Q4NywgMHg3YTU4NDcxOCwgMHg3NDA4ZGExNywgMHhiYzlmOWFiYywgMHhlOTRiN2Q4YyxcbiAgICAgICAgMHhlYzdhZWMzYSwgMHhkYjg1MWRmYSwgMHg2MzA5NDM2NiwgMHhjNDY0YzNkMiwgMHhlZjFjMTg0NyxcbiAgICAgICAgMHgzMjE1ZDkwOCwgMHhkZDQzM2IzNywgMHgyNGMyYmExNiwgMHgxMmExNGQ0MywgMHgyYTY1YzQ1MSxcbiAgICAgICAgMHg1MDk0MDAwMiwgMHgxMzNhZTRkZCwgMHg3MWRmZjg5ZSwgMHgxMDMxNGU1NSwgMHg4MWFjNzdkNixcbiAgICAgICAgMHg1ZjExMTk5YiwgMHgwNDM1NTZmMSwgMHhkN2EzYzc2YiwgMHgzYzExMTgzYiwgMHg1OTI0YTUwOSxcbiAgICAgICAgMHhmMjhmZTZlZCwgMHg5N2YxZmJmYSwgMHg5ZWJhYmYyYywgMHgxZTE1M2M2ZSwgMHg4NmUzNDU3MCxcbiAgICAgICAgMHhlYWU5NmZiMSwgMHg4NjBlNWUwYSwgMHg1YTNlMmFiMywgMHg3NzFmZTcxYywgMHg0ZTNkMDZmYSxcbiAgICAgICAgMHgyOTY1ZGNiOSwgMHg5OWU3MWQwZiwgMHg4MDNlODlkNiwgMHg1MjY2YzgyNSwgMHgyZTRjYzk3OCxcbiAgICAgICAgMHg5YzEwYjM2YSwgMHhjNjE1MGViYSwgMHg5NGUyZWE3OCwgMHhhNWZjM2M1MywgMHgxZTBhMmRmNCxcbiAgICAgICAgMHhmMmY3NGVhNywgMHgzNjFkMmIzZCwgMHgxOTM5MjYwZiwgMHgxOWMyNzk2MCwgMHg1MjIzYTcwOCxcbiAgICAgICAgMHhmNzEzMTJiNiwgMHhlYmFkZmU2ZSwgMHhlYWMzMWY2NiwgMHhlM2JjNDU5NSwgMHhhNjdiYzg4MyxcbiAgICAgICAgMHhiMTdmMzdkMSwgMHgwMThjZmYyOCwgMHhjMzMyZGRlZiwgMHhiZTZjNWFhNSwgMHg2NTU4MjE4NSxcbiAgICAgICAgMHg2OGFiOTgwMiwgMHhlZWNlYTUwZiwgMHhkYjJmOTUzYiwgMHgyYWVmN2RhZCwgMHg1YjZlMmY4NCxcbiAgICAgICAgMHgxNTIxYjYyOCwgMHgyOTA3NjE3MCwgMHhlY2RkNDc3NSwgMHg2MTlmMTUxMCwgMHgxM2NjYTgzMCxcbiAgICAgICAgMHhlYjYxYmQ5NiwgMHgwMzM0ZmUxZSwgMHhhYTAzNjNjZiwgMHhiNTczNWM5MCwgMHg0YzcwYTIzOSxcbiAgICAgICAgMHhkNTllOWUwYiwgMHhjYmFhZGUxNCwgMHhlZWNjODZiYywgMHg2MDYyMmNhNywgMHg5Y2FiNWNhYixcbiAgICAgICAgMHhiMmYzODQ2ZSwgMHg2NDhiMWVhZiwgMHgxOWJkZjBjYSwgMHhhMDIzNjliOSwgMHg2NTVhYmI1MCxcbiAgICAgICAgMHg0MDY4NWEzMiwgMHgzYzJhYjRiMywgMHgzMTllZTlkNSwgMHhjMDIxYjhmNywgMHg5YjU0MGIxOSxcbiAgICAgICAgMHg4NzVmYTA5OSwgMHg5NWY3OTk3ZSwgMHg2MjNkN2RhOCwgMHhmODM3ODg5YSwgMHg5N2UzMmQ3NyxcbiAgICAgICAgMHgxMWVkOTM1ZiwgMHgxNjY4MTI4MSwgMHgwZTM1ODgyOSwgMHhjN2U2MWZkNiwgMHg5NmRlZGZhMSxcbiAgICAgICAgMHg3ODU4YmE5OSwgMHg1N2Y1ODRhNSwgMHgxYjIyNzI2MywgMHg5YjgzYzNmZiwgMHgxYWMyNDY5NixcbiAgICAgICAgMHhjZGIzMGFlYiwgMHg1MzJlMzA1NCwgMHg4ZmQ5NDhlNCwgMHg2ZGJjMzEyOCwgMHg1OGViZjJlZixcbiAgICAgICAgMHgzNGM2ZmZlYSwgMHhmZTI4ZWQ2MSwgMHhlZTdjM2M3MywgMHg1ZDRhMTRkOSwgMHhlODY0YjdlMyxcbiAgICAgICAgMHg0MjEwNWQxNCwgMHgyMDNlMTNlMCwgMHg0NWVlZTJiNiwgMHhhM2FhYWJlYSwgMHhkYjZjNGYxNSxcbiAgICAgICAgMHhmYWNiNGZkMCwgMHhjNzQyZjQ0MiwgMHhlZjZhYmJiNSwgMHg2NTRmM2IxZCwgMHg0MWNkMjEwNSxcbiAgICAgICAgMHhkODFlNzk5ZSwgMHg4Njg1NGRjNywgMHhlNDRiNDc2YSwgMHgzZDgxNjI1MCwgMHhjZjYyYTFmMixcbiAgICAgICAgMHg1YjhkMjY0NiwgMHhmYzg4ODNhMCwgMHhjMWM3YjZhMywgMHg3ZjE1MjRjMywgMHg2OWNiNzQ5MixcbiAgICAgICAgMHg0Nzg0OGEwYiwgMHg1NjkyYjI4NSwgMHgwOTViYmYwMCwgMHhhZDE5NDg5ZCwgMHgxNDYyYjE3NCxcbiAgICAgICAgMHgyMzgyMGUwMCwgMHg1ODQyOGQyYSwgMHgwYzU1ZjVlYSwgMHgxZGFkZjQzZSwgMHgyMzNmNzA2MSxcbiAgICAgICAgMHgzMzcyZjA5MiwgMHg4ZDkzN2U0MSwgMHhkNjVmZWNmMSwgMHg2YzIyM2JkYiwgMHg3Y2RlMzc1OSxcbiAgICAgICAgMHhjYmVlNzQ2MCwgMHg0MDg1ZjJhNywgMHhjZTc3MzI2ZSwgMHhhNjA3ODA4NCwgMHgxOWY4NTA5ZSxcbiAgICAgICAgMHhlOGVmZDg1NSwgMHg2MWQ5OTczNSwgMHhhOTY5YTdhYSwgMHhjNTBjMDZjMiwgMHg1YTA0YWJmYyxcbiAgICAgICAgMHg4MDBiY2FkYywgMHg5ZTQ0N2EyZSwgMHhjMzQ1MzQ4NCwgMHhmZGQ1NjcwNSwgMHgwZTFlOWVjOSxcbiAgICAgICAgMHhkYjczZGJkMywgMHgxMDU1ODhjZCwgMHg2NzVmZGE3OSwgMHhlMzY3NDM0MCwgMHhjNWM0MzQ2NSxcbiAgICAgICAgMHg3MTNlMzhkOCwgMHgzZDI4Zjg5ZSwgMHhmMTZkZmYyMCwgMHgxNTNlMjFlNywgMHg4ZmIwM2Q0YSxcbiAgICAgICAgMHhlNmUzOWYyYiwgMHhkYjgzYWRmNywgMHhlOTNkNWE2OCwgMHg5NDgxNDBmNywgMHhmNjRjMjYxYyxcbiAgICAgICAgMHg5NDY5MjkzNCwgMHg0MTE1MjBmNywgMHg3NjAyZDRmNywgMHhiY2Y0NmIyZSwgMHhkNGEyMDA2OCxcbiAgICAgICAgMHhkNDA4MjQ3MSwgMHgzMzIwZjQ2YSwgMHg0M2I3ZDRiNywgMHg1MDAwNjFhZiwgMHgxZTM5ZjYyZSxcbiAgICAgICAgMHg5NzI0NDU0NiwgMHgxNDIxNGY3NCwgMHhiZjhiODg0MCwgMHg0ZDk1ZmMxZCwgMHg5NmI1OTFhZixcbiAgICAgICAgMHg3MGY0ZGRkMywgMHg2NmEwMmY0NSwgMHhiZmJjMDllYywgMHgwM2JkOTc4NSwgMHg3ZmFjNmRkMCxcbiAgICAgICAgMHgzMWNiODUwNCwgMHg5NmViMjdiMywgMHg1NWZkMzk0MSwgMHhkYTI1NDdlNiwgMHhhYmNhMGE5YSxcbiAgICAgICAgMHgyODUwNzgyNSwgMHg1MzA0MjlmNCwgMHgwYTJjODZkYSwgMHhlOWI2NmRmYiwgMHg2OGRjMTQ2MixcbiAgICAgICAgMHhkNzQ4NjkwMCwgMHg2ODBlYzBhNCwgMHgyN2ExOGRlZSwgMHg0ZjNmZmVhMiwgMHhlODg3YWQ4YyxcbiAgICAgICAgMHhiNThjZTAwNiwgMHg3YWY0ZDZiNiwgMHhhYWNlMWU3YywgMHhkMzM3NWZlYywgMHhjZTc4YTM5OSxcbiAgICAgICAgMHg0MDZiMmE0MiwgMHgyMGZlOWUzNSwgMHhkOWYzODViOSwgMHhlZTM5ZDdhYiwgMHgzYjEyNGU4YixcbiAgICAgICAgMHgxZGM5ZmFmNywgMHg0YjZkMTg1NiwgMHgyNmEzNjYzMSwgMHhlYWUzOTdiMiwgMHgzYTZlZmE3NCxcbiAgICAgICAgMHhkZDViNDMzMiwgMHg2ODQxZTdmNywgMHhjYTc4MjBmYiwgMHhmYjBhZjU0ZSwgMHhkOGZlYjM5NyxcbiAgICAgICAgMHg0NTQwNTZhYywgMHhiYTQ4OTUyNywgMHg1NTUzM2EzYSwgMHgyMDgzOGQ4NywgMHhmZTZiYTliNyxcbiAgICAgICAgMHhkMDk2OTU0YiwgMHg1NWE4NjdiYywgMHhhMTE1OWE1OCwgMHhjY2E5Mjk2MywgMHg5OWUxZGIzMyxcbiAgICAgICAgMHhhNjJhNGE1NiwgMHgzZjMxMjVmOSwgMHg1ZWY0N2UxYywgMHg5MDI5MzE3YywgMHhmZGY4ZTgwMixcbiAgICAgICAgMHgwNDI3MmY3MCwgMHg4MGJiMTU1YywgMHgwNTI4MmNlMywgMHg5NWMxMTU0OCwgMHhlNGM2NmQyMixcbiAgICAgICAgMHg0OGMxMTMzZiwgMHhjNzBmODZkYywgMHgwN2Y5YzllZSwgMHg0MTA0MWYwZiwgMHg0MDQ3NzlhNCxcbiAgICAgICAgMHg1ZDg4NmUxNywgMHgzMjVmNTFlYiwgMHhkNTliYzBkMSwgMHhmMmJjYzE4ZiwgMHg0MTExMzU2NCxcbiAgICAgICAgMHgyNTdiNzgzNCwgMHg2MDJhOWM2MCwgMHhkZmY4ZThhMywgMHgxZjYzNmMxYiwgMHgwZTEyYjRjMixcbiAgICAgICAgMHgwMmUxMzI5ZSwgMHhhZjY2NGZkMSwgMHhjYWQxODExNSwgMHg2YjIzOTVlMCwgMHgzMzNlOTJlMSxcbiAgICAgICAgMHgzYjI0MGI2MiwgMHhlZWJlYjkyMiwgMHg4NWIyYTIwZSwgMHhlNmJhMGQ5OSwgMHhkZTcyMGM4YyxcbiAgICAgICAgMHgyZGEyZjcyOCwgMHhkMDEyNzg0NSwgMHg5NWI3OTRmZCwgMHg2NDdkMDg2MiwgMHhlN2NjZjVmMCxcbiAgICAgICAgMHg1NDQ5YTM2ZiwgMHg4NzdkNDhmYSwgMHhjMzlkZmQyNywgMHhmMzNlOGQxZSwgMHgwYTQ3NjM0MSxcbiAgICAgICAgMHg5OTJlZmY3NCwgMHgzYTZmNmVhYiwgMHhmNGY4ZmQzNywgMHhhODEyZGM2MCwgMHhhMWViZGRmOCxcbiAgICAgICAgMHg5OTFiZTE0YywgMHhkYjZlNmIwZCwgMHhjNjdiNTUxMCwgMHg2ZDY3MmMzNywgMHgyNzY1ZDQzYixcbiAgICAgICAgMHhkY2QwZTgwNCwgMHhmMTI5MGRjNywgMHhjYzAwZmZhMywgMHhiNTM5MGY5MiwgMHg2OTBmZWQwYixcbiAgICAgICAgMHg2NjdiOWZmYiwgMHhjZWRiN2Q5YywgMHhhMDkxY2YwYiwgMHhkOTE1NWVhMywgMHhiYjEzMmY4OCxcbiAgICAgICAgMHg1MTViYWQyNCwgMHg3Yjk0NzliZiwgMHg3NjNiZDZlYiwgMHgzNzM5MmViMywgMHhjYzExNTk3OSxcbiAgICAgICAgMHg4MDI2ZTI5NywgMHhmNDJlMzEyZCwgMHg2ODQyYWRhNywgMHhjNjZhMmIzYiwgMHgxMjc1NGNjYyxcbiAgICAgICAgMHg3ODJlZjExYywgMHg2YTEyNDIzNywgMHhiNzkyNTFlNywgMHgwNmExYmJlNiwgMHg0YmZiNjM1MCxcbiAgICAgICAgMHgxYTZiMTAxOCwgMHgxMWNhZWRmYSwgMHgzZDI1YmRkOCwgMHhlMmUxYzNjOSwgMHg0NDQyMTY1OSxcbiAgICAgICAgMHgwYTEyMTM4NiwgMHhkOTBjZWM2ZSwgMHhkNWFiZWEyYSwgMHg2NGFmNjc0ZSwgMHhkYTg2YTg1ZixcbiAgICAgICAgMHhiZWJmZTk4OCwgMHg2NGU0YzNmZSwgMHg5ZGJjODA1NywgMHhmMGY3YzA4NiwgMHg2MDc4N2JmOCxcbiAgICAgICAgMHg2MDAzNjA0ZCwgMHhkMWZkODM0NiwgMHhmNjM4MWZiMCwgMHg3NzQ1YWUwNCwgMHhkNzM2ZmNjYyxcbiAgICAgICAgMHg4MzQyNmIzMywgMHhmMDFlYWI3MSwgMHhiMDgwNDE4NywgMHgzYzAwNWU1ZiwgMHg3N2EwNTdiZSxcbiAgICAgICAgMHhiZGU4YWUyNCwgMHg1NTQ2NDI5OSwgMHhiZjU4MmU2MSwgMHg0ZTU4ZjQ4ZiwgMHhmMmRkZmRhMixcbiAgICAgICAgMHhmNDc0ZWYzOCwgMHg4Nzg5YmRjMiwgMHg1MzY2ZjljMywgMHhjOGIzOGU3NCwgMHhiNDc1ZjI1NSxcbiAgICAgICAgMHg0NmZjZDliOSwgMHg3YWViMjY2MSwgMHg4YjFkZGY4NCwgMHg4NDZhMGU3OSwgMHg5MTVmOTVlMixcbiAgICAgICAgMHg0NjZlNTk4ZSwgMHgyMGI0NTc3MCwgMHg4Y2Q1NTU5MSwgMHhjOTAyZGU0YywgMHhiOTBiYWNlMSxcbiAgICAgICAgMHhiYjgyMDVkMCwgMHgxMWE4NjI0OCwgMHg3NTc0YTk5ZSwgMHhiNzdmMTliNiwgMHhlMGE5ZGMwOSxcbiAgICAgICAgMHg2NjJkMDlhMSwgMHhjNDMyNDYzMywgMHhlODVhMWYwMiwgMHgwOWYwYmU4YywgMHg0YTk5YTAyNSxcbiAgICAgICAgMHgxZDZlZmUxMCwgMHgxYWI5M2QxZCwgMHgwYmE1YTRkZiwgMHhhMTg2ZjIwZiwgMHgyODY4ZjE2OSxcbiAgICAgICAgMHhkY2I3ZGE4MywgMHg1NzM5MDZmZSwgMHhhMWUyY2U5YiwgMHg0ZmNkN2Y1MiwgMHg1MDExNWUwMSxcbiAgICAgICAgMHhhNzA2ODNmYSwgMHhhMDAyYjVjNCwgMHgwZGU2ZDAyNywgMHg5YWY4OGMyNywgMHg3NzNmODY0MSxcbiAgICAgICAgMHhjMzYwNGMwNiwgMHg2MWE4MDZiNSwgMHhmMDE3N2EyOCwgMHhjMGY1ODZlMCwgMHgwMDYwNThhYSxcbiAgICAgICAgMHgzMGRjN2Q2MiwgMHgxMWU2OWVkNywgMHgyMzM4ZWE2MywgMHg1M2MyZGQ5NCwgMHhjMmMyMTYzNCxcbiAgICAgICAgMHhiYmNiZWU1NiwgMHg5MGJjYjZkZSwgMHhlYmZjN2RhMSwgMHhjZTU5MWQ3NiwgMHg2ZjA1ZTQwOSxcbiAgICAgICAgMHg0YjdjMDE4OCwgMHgzOTcyMGEzZCwgMHg3YzkyN2MyNCwgMHg4NmUzNzI1ZiwgMHg3MjRkOWRiOSxcbiAgICAgICAgMHgxYWMxNWJiNCwgMHhkMzllYjhmYywgMHhlZDU0NTU3OCwgMHgwOGZjYTViNSwgMHhkODNkN2NkMyxcbiAgICAgICAgMHg0ZGFkMGZjNCwgMHgxZTUwZWY1ZSwgMHhiMTYxZTZmOCwgMHhhMjg1MTRkOSwgMHg2YzUxMTMzYyxcbiAgICAgICAgMHg2ZmQ1YzdlNywgMHg1NmUxNGVjNCwgMHgzNjJhYmZjZSwgMHhkZGM2YzgzNywgMHhkNzlhMzIzNCxcbiAgICAgICAgMHg5MjYzODIxMiwgMHg2NzBlZmE4ZSwgMHg0MDYwMDBlMCwgMHgzYTM5Y2UzNywgMHhkM2ZhZjVjZixcbiAgICAgICAgMHhhYmMyNzczNywgMHg1YWM1MmQxYiwgMHg1Y2IwNjc5ZSwgMHg0ZmEzMzc0MiwgMHhkMzgyMjc0MCxcbiAgICAgICAgMHg5OWJjOWJiZSwgMHhkNTExOGU5ZCwgMHhiZjBmNzMxNSwgMHhkNjJkMWM3ZSwgMHhjNzAwYzQ3YixcbiAgICAgICAgMHhiNzhjMWI2YiwgMHgyMWExOTA0NSwgMHhiMjZlYjFiZSwgMHg2YTM2NmViNCwgMHg1NzQ4YWIyZixcbiAgICAgICAgMHhiYzk0NmU3OSwgMHhjNmEzNzZkMiwgMHg2NTQ5YzJjOCwgMHg1MzBmZjhlZSwgMHg0NjhkZGU3ZCxcbiAgICAgICAgMHhkNTczMGExZCwgMHg0Y2QwNGRjNiwgMHgyOTM5YmJkYiwgMHhhOWJhNDY1MCwgMHhhYzk1MjZlOCxcbiAgICAgICAgMHhiZTVlZTMwNCwgMHhhMWZhZDVmMCwgMHg2YTJkNTE5YSwgMHg2M2VmOGNlMiwgMHg5YTg2ZWUyMixcbiAgICAgICAgMHhjMDg5YzJiOCwgMHg0MzI0MmVmNiwgMHhhNTFlMDNhYSwgMHg5Y2YyZDBhNCwgMHg4M2MwNjFiYSxcbiAgICAgICAgMHg5YmU5NmE0ZCwgMHg4ZmU1MTU1MCwgMHhiYTY0NWJkNiwgMHgyODI2YTJmOSwgMHhhNzNhM2FlMSxcbiAgICAgICAgMHg0YmE5OTU4NiwgMHhlZjU1NjJlOSwgMHhjNzJmZWZkMywgMHhmNzUyZjdkYSwgMHgzZjA0NmY2OSxcbiAgICAgICAgMHg3N2ZhMGE1OSwgMHg4MGU0YTkxNSwgMHg4N2IwODYwMSwgMHg5YjA5ZTZhZCwgMHgzYjNlZTU5MyxcbiAgICAgICAgMHhlOTkwZmQ1YSwgMHg5ZTM0ZDc5NywgMHgyY2YwYjdkOSwgMHgwMjJiOGI1MSwgMHg5NmQ1YWMzYSxcbiAgICAgICAgMHgwMTdkYTY3ZCwgMHhkMWNmM2VkNiwgMHg3YzdkMmQyOCwgMHgxZjlmMjVjZiwgMHhhZGYyYjg5YixcbiAgICAgICAgMHg1YWQ2YjQ3MiwgMHg1YTg4ZjU0YywgMHhlMDI5YWM3MSwgMHhlMDE5YTVlNiwgMHg0N2IwYWNmZCxcbiAgICAgICAgMHhlZDkzZmE5YiwgMHhlOGQzYzQ4ZCwgMHgyODNiNTdjYywgMHhmOGQ1NjYyOSwgMHg3OTEzMmUyOCxcbiAgICAgICAgMHg3ODVmMDE5MSwgMHhlZDc1NjA1NSwgMHhmNzk2MGU0NCwgMHhlM2QzNWU4YywgMHgxNTA1NmRkNCxcbiAgICAgICAgMHg4OGY0NmRiYSwgMHgwM2ExNjEyNSwgMHgwNTY0ZjBiZCwgMHhjM2ViOWUxNSwgMHgzYzkwNTdhMixcbiAgICAgICAgMHg5NzI3MWFlYywgMHhhOTNhMDcyYSwgMHgxYjNmNmQ5YiwgMHgxZTYzMjFmNSwgMHhmNTljNjZmYixcbiAgICAgICAgMHgyNmRjZjMxOSwgMHg3NTMzZDkyOCwgMHhiMTU1ZmRmNSwgMHgwMzU2MzQ4MiwgMHg4YWJhM2NiYixcbiAgICAgICAgMHgyODUxNzcxMSwgMHhjMjBhZDlmOCwgMHhhYmNjNTE2NywgMHhjY2FkOTI1ZiwgMHg0ZGU4MTc1MSxcbiAgICAgICAgMHgzODMwZGM4ZSwgMHgzNzlkNTg2MiwgMHg5MzIwZjk5MSwgMHhlYTdhOTBjMiwgMHhmYjNlN2JjZSxcbiAgICAgICAgMHg1MTIxY2U2NCwgMHg3NzRmYmUzMiwgMHhhOGI2ZTM3ZSwgMHhjMzI5M2Q0NiwgMHg0OGRlNTM2OSxcbiAgICAgICAgMHg2NDEzZTY4MCwgMHhhMmFlMDgxMCwgMHhkZDZkYjIyNCwgMHg2OTg1MmRmZCwgMHgwOTA3MjE2NixcbiAgICAgICAgMHhiMzlhNDYwYSwgMHg2NDQ1YzBkZCwgMHg1ODZjZGVjZiwgMHgxYzIwYzhhZSwgMHg1YmJlZjdkZCxcbiAgICAgICAgMHgxYjU4OGQ0MCwgMHhjY2QyMDE3ZiwgMHg2YmI0ZTNiYiwgMHhkZGEyNmE3ZSwgMHgzYTU5ZmY0NSxcbiAgICAgICAgMHgzZTM1MGE0NCwgMHhiY2I0Y2RkNSwgMHg3MmVhY2VhOCwgMHhmYTY0ODRiYiwgMHg4ZDY2MTJhZSxcbiAgICAgICAgMHhiZjNjNmY0NywgMHhkMjliZTQ2MywgMHg1NDJmNWQ5ZSwgMHhhZWMyNzcxYiwgMHhmNjRlNjM3MCxcbiAgICAgICAgMHg3NDBlMGQ4ZCwgMHhlNzViMTM1NywgMHhmODcyMTY3MSwgMHhhZjUzN2Q1ZCwgMHg0MDQwY2IwOCxcbiAgICAgICAgMHg0ZWI0ZTJjYywgMHgzNGQyNDY2YSwgMHgwMTE1YWY4NCwgMHhlMWIwMDQyOCwgMHg5NTk4M2ExZCxcbiAgICAgICAgMHgwNmI4OWZiNCwgMHhjZTZlYTA0OCwgMHg2ZjNmM2I4MiwgMHgzNTIwYWI4MiwgMHgwMTFhMWQ0YixcbiAgICAgICAgMHgyNzcyMjdmOCwgMHg2MTE1NjBiMSwgMHhlNzkzM2ZkYywgMHhiYjNhNzkyYiwgMHgzNDQ1MjViZCxcbiAgICAgICAgMHhhMDg4MzllMSwgMHg1MWNlNzk0YiwgMHgyZjMyYzliNywgMHhhMDFmYmFjOSwgMHhlMDFjYzg3ZSxcbiAgICAgICAgMHhiY2M3ZDFmNiwgMHhjZjAxMTFjMywgMHhhMWU4YWFjNywgMHgxYTkwODc0OSwgMHhkNDRmYmQ5YSxcbiAgICAgICAgMHhkMGRhZGVjYiwgMHhkNTBhZGEzOCwgMHgwMzM5YzMyYSwgMHhjNjkxMzY2NywgMHg4ZGY5MzE3YyxcbiAgICAgICAgMHhlMGIxMmI0ZiwgMHhmNzllNTliNywgMHg0M2Y1YmIzYSwgMHhmMmQ1MTlmZiwgMHgyN2Q5NDU5YyxcbiAgICAgICAgMHhiZjk3MjIyYywgMHgxNWU2ZmMyYSwgMHgwZjkxZmM3MSwgMHg5Yjk0MTUyNSwgMHhmYWU1OTM2MSxcbiAgICAgICAgMHhjZWI2OWNlYiwgMHhjMmE4NjQ1OSwgMHgxMmJhYThkMSwgMHhiNmMxMDc1ZSwgMHhlMzA1NmEwYyxcbiAgICAgICAgMHgxMGQyNTA2NSwgMHhjYjAzYTQ0MiwgMHhlMGVjNmUwZSwgMHgxNjk4ZGIzYiwgMHg0Yzk4YTBiZSxcbiAgICAgICAgMHgzMjc4ZTk2NCwgMHg5ZjFmOTUzMiwgMHhlMGQzOTJkZiwgMHhkM2EwMzQyYiwgMHg4OTcxZjIxZSxcbiAgICAgICAgMHgxYjBhNzQ0MSwgMHg0YmEzMzQ4YywgMHhjNWJlNzEyMCwgMHhjMzc2MzJkOCwgMHhkZjM1OWY4ZCxcbiAgICAgICAgMHg5Yjk5MmYyZSwgMHhlNjBiNmY0NywgMHgwZmUzZjExZCwgMHhlNTRjZGE1NCwgMHgxZWRhZDg5MSxcbiAgICAgICAgMHhjZTYyNzljZiwgMHhjZDNlN2U2ZiwgMHgxNjE4YjE2NiwgMHhmZDJjMWQwNSwgMHg4NDhmZDJjNSxcbiAgICAgICAgMHhmNmZiMjI5OSwgMHhmNTIzZjM1NywgMHhhNjMyNzYyMywgMHg5M2E4MzUzMSwgMHg1NmNjY2QwMixcbiAgICAgICAgMHhhY2YwODE2MiwgMHg1YTc1ZWJiNSwgMHg2ZTE2MzY5NywgMHg4OGQyNzNjYywgMHhkZTk2NjI5MixcbiAgICAgICAgMHg4MWI5NDlkMCwgMHg0YzUwOTAxYiwgMHg3MWM2NTYxNCwgMHhlNmM2YzdiZCwgMHgzMjdhMTQwYSxcbiAgICAgICAgMHg0NWUxZDAwNiwgMHhjM2YyN2I5YSwgMHhjOWFhNTNmZCwgMHg2MmE4MGYwMCwgMHhiYjI1YmZlMixcbiAgICAgICAgMHgzNWJkZDJmNiwgMHg3MTEyNjkwNSwgMHhiMjA0MDIyMiwgMHhiNmNiY2Y3YywgMHhjZDc2OWMyYixcbiAgICAgICAgMHg1MzExM2VjMCwgMHgxNjQwZTNkMywgMHgzOGFiYmQ2MCwgMHgyNTQ3YWRmMCwgMHhiYTM4MjA5YyxcbiAgICAgICAgMHhmNzQ2Y2U3NiwgMHg3N2FmYTFjNSwgMHgyMDc1NjA2MCwgMHg4NWNiZmU0ZSwgMHg4YWU4OGRkOCxcbiAgICAgICAgMHg3YWFhZjliMCwgMHg0Y2Y5YWE3ZSwgMHgxOTQ4YzI1YywgMHgwMmZiOGE4YywgMHgwMWMzNmFlNCxcbiAgICAgICAgMHhkNmViZTFmOSwgMHg5MGQ0Zjg2OSwgMHhhNjVjZGVhMCwgMHgzZjA5MjUyZCwgMHhjMjA4ZTY5ZixcbiAgICAgICAgMHhiNzRlNjEzMiwgMHhjZTc3ZTI1YiwgMHg1NzhmZGZlMywgMHgzYWMzNzJlNlxuICAgIF07XG4gICAgdGhpcy5iZl9jcnlwdF9jaXBoZXJ0ZXh0ID0gW1xuICAgICAgICAweDRmNzI3MDY4LCAweDY1NjE2ZTQyLCAweDY1Njg2ZjZjLFxuICAgICAgICAweDY0NjU3MjUzLCAweDYzNzI3OTQ0LCAweDZmNzU2Mjc0XG4gICAgXTtcbiAgICB0aGlzLmJhc2U2NF9jb2RlID0gW1xuICAgICAgICAnLicsICcvJywgJ0EnLCAnQicsICdDJywgJ0QnLCAnRScsICdGJywgJ0cnLCAnSCcsICdJJyxcbiAgICAgICAgJ0onLCAnSycsICdMJywgJ00nLCAnTicsICdPJywgJ1AnLCAnUScsICdSJywgJ1MnLCAnVCcsICdVJywgJ1YnLFxuICAgICAgICAnVycsICdYJywgJ1knLCAnWicsICdhJywgJ2InLCAnYycsICdkJywgJ2UnLCAnZicsICdnJywgJ2gnLCAnaScsXG4gICAgICAgICdqJywgJ2snLCAnbCcsICdtJywgJ24nLCAnbycsICdwJywgJ3EnLCAncicsICdzJywgJ3QnLCAndScsICd2JyxcbiAgICAgICAgJ3cnLCAneCcsICd5JywgJ3onLCAnMCcsICcxJywgJzInLCAnMycsICc0JywgJzUnLCAnNicsICc3JywgJzgnLFxuICAgICAgICAnOSdcbiAgICBdO1xuICAgIHRoaXMuaW5kZXhfNjQgPSBbXG4gICAgICAgIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSxcbiAgICAgICAgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLFxuICAgICAgICAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIC0xLCAwLCAxLFxuICAgICAgICA1NCwgNTUsIDU2LCA1NywgNTgsIDU5LCA2MCwgNjEsIDYyLCA2MywgLTEsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsXG4gICAgICAgIDIsIDMsIDQsIDUsIDYsIDcsIDgsIDksIDEwLCAxMSwgMTIsIDEzLCAxNCwgMTUsIDE2LCAxNywgMTgsIDE5LCAyMCxcbiAgICAgICAgMjEsIDIyLCAyMywgMjQsIDI1LCAyNiwgMjcsIC0xLCAtMSwgLTEsIC0xLCAtMSwgLTEsIDI4LCAyOSwgMzAsIDMxLFxuICAgICAgICAzMiwgMzMsIDM0LCAzNSwgMzYsIDM3LCAzOCwgMzksIDQwLCA0MSwgNDIsIDQzLCA0NCwgNDUsIDQ2LCA0NywgNDgsXG4gICAgICAgIDQ5LCA1MCwgNTEsIDUyLCA1MywgLTEsIC0xLCAtMSwgLTEsIC0xXG4gICAgXTtcbiAgICB0aGlzLlA7XG4gICAgdGhpcy5TO1xuICAgIHRoaXMubHI7XG4gICAgdGhpcy5vZmZwO1xufVxuYkNyeXB0LnByb3RvdHlwZS5nZXRCeXRlID0gZnVuY3Rpb24gKGMpIHtcbiAgICB2YXIgcmV0ID0gMDtcbiAgICB0cnkge1xuICAgICAgICB2YXIgYiA9IGMuY2hhckNvZGVBdCgwKTtcbiAgICB9XG4gICAgY2F0Y2ggKGVycikge1xuICAgICAgICBiID0gYztcbiAgICB9XG4gICAgaWYgKGIgPiAxMjcpIHtcbiAgICAgICAgcmV0dXJuIC0xMjggKyAoYiAlIDEyOCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gYjtcbiAgICB9XG59O1xuYkNyeXB0LnByb3RvdHlwZS5lbmNvZGVfYmFzZTY0ID0gZnVuY3Rpb24gKGQsIGxlbikge1xuICAgIHZhciBvZmYgPSAwO1xuICAgIHZhciBycyA9IFtdO1xuICAgIHZhciBjMTtcbiAgICB2YXIgYzI7XG4gICAgaWYgKGxlbiA8PSAwIHx8IGxlbiA+IGQubGVuZ3RoKSB7XG4gICAgICAgIHRocm93IFwiSW52YWxpZCBsZW5cIjtcbiAgICB9XG4gICAgd2hpbGUgKG9mZiA8IGxlbikge1xuICAgICAgICBjMSA9IGRbb2ZmKytdICYgMHhmZjtcbiAgICAgICAgcnMucHVzaCh0aGlzLmJhc2U2NF9jb2RlWyhjMSA+PiAyKSAmIDB4M2ZdKTtcbiAgICAgICAgYzEgPSAoYzEgJiAweDAzKSA8PCA0O1xuICAgICAgICBpZiAob2ZmID49IGxlbikge1xuICAgICAgICAgICAgcnMucHVzaCh0aGlzLmJhc2U2NF9jb2RlW2MxICYgMHgzZl0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYzIgPSBkW29mZisrXSAmIDB4ZmY7XG4gICAgICAgIGMxIHw9IChjMiA+PiA0KSAmIDB4MGY7XG4gICAgICAgIHJzLnB1c2godGhpcy5iYXNlNjRfY29kZVtjMSAmIDB4M2ZdKTtcbiAgICAgICAgYzEgPSAoYzIgJiAweDBmKSA8PCAyO1xuICAgICAgICBpZiAob2ZmID49IGxlbikge1xuICAgICAgICAgICAgcnMucHVzaCh0aGlzLmJhc2U2NF9jb2RlW2MxICYgMHgzZl0pO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYzIgPSBkW29mZisrXSAmIDB4ZmY7XG4gICAgICAgIGMxIHw9IChjMiA+PiA2KSAmIDB4MDM7XG4gICAgICAgIHJzLnB1c2godGhpcy5iYXNlNjRfY29kZVtjMSAmIDB4M2ZdKTtcbiAgICAgICAgcnMucHVzaCh0aGlzLmJhc2U2NF9jb2RlW2MyICYgMHgzZl0pO1xuICAgIH1cbiAgICByZXR1cm4gcnMuam9pbignJyk7XG59O1xuYkNyeXB0LnByb3RvdHlwZS5jaGFyNjQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHZhciBjb2RlID0geC5jaGFyQ29kZUF0KDApO1xuICAgIGlmIChjb2RlIDwgMCB8fCBjb2RlID4gdGhpcy5pbmRleF82NC5sZW5ndGgpIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5pbmRleF82NFtjb2RlXTtcbn07XG5iQ3J5cHQucHJvdG90eXBlLmRlY29kZV9iYXNlNjQgPSBmdW5jdGlvbiAocywgbWF4b2xlbikge1xuICAgIHZhciBvZmYgPSAwO1xuICAgIHZhciBzbGVuID0gcy5sZW5ndGg7XG4gICAgdmFyIG9sZW4gPSAwO1xuICAgIHZhciBycyA9IFtdO1xuICAgIHZhciBjMSwgYzIsIGMzLCBjNCwgbztcbiAgICBpZiAobWF4b2xlbiA8PSAwKSB7XG4gICAgICAgIHRocm93IFwiSW52YWxpZCBtYXhvbGVuXCI7XG4gICAgfVxuICAgIHdoaWxlIChvZmYgPCBzbGVuIC0gMSAmJiBvbGVuIDwgbWF4b2xlbikge1xuICAgICAgICBjMSA9IHRoaXMuY2hhcjY0KHMuY2hhckF0KG9mZisrKSk7XG4gICAgICAgIGMyID0gdGhpcy5jaGFyNjQocy5jaGFyQXQob2ZmKyspKTtcbiAgICAgICAgaWYgKGMxID09IC0xIHx8IGMyID09IC0xKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBvID0gdGhpcy5nZXRCeXRlKGMxIDw8IDIpO1xuICAgICAgICBvIHw9IChjMiAmIDB4MzApID4+IDQ7XG4gICAgICAgIHJzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShvKSk7XG4gICAgICAgIGlmICgrK29sZW4gPj0gbWF4b2xlbiB8fCBvZmYgPj0gc2xlbikge1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYzMgPSB0aGlzLmNoYXI2NChzLmNoYXJBdChvZmYrKykpO1xuICAgICAgICBpZiAoYzMgPT0gLTEpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG8gPSB0aGlzLmdldEJ5dGUoKGMyICYgMHgwZikgPDwgNCk7XG4gICAgICAgIG8gfD0gKGMzICYgMHgzYykgPj4gMjtcbiAgICAgICAgcnMucHVzaChTdHJpbmcuZnJvbUNoYXJDb2RlKG8pKTtcbiAgICAgICAgaWYgKCsrb2xlbiA+PSBtYXhvbGVuIHx8IG9mZiA+PSBzbGVuKSB7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjNCA9IHRoaXMuY2hhcjY0KHMuY2hhckF0KG9mZisrKSk7XG4gICAgICAgIG8gPSB0aGlzLmdldEJ5dGUoKGMzICYgMHgwMykgPDwgNik7XG4gICAgICAgIG8gfD0gYzQ7XG4gICAgICAgIHJzLnB1c2goU3RyaW5nLmZyb21DaGFyQ29kZShvKSk7XG4gICAgICAgICsrb2xlbjtcbiAgICB9XG4gICAgdmFyIHJldCA9IFtdO1xuICAgIGZvciAob2ZmID0gMDsgb2ZmIDwgb2xlbjsgb2ZmKyspIHtcbiAgICAgICAgcmV0LnB1c2godGhpcy5nZXRCeXRlKHJzW29mZl0pKTtcbiAgICB9XG4gICAgcmV0dXJuIHJldDtcbn07XG5iQ3J5cHQucHJvdG90eXBlLmVuY2lwaGVyID0gZnVuY3Rpb24gKGxyLCBvZmYpIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgbjtcbiAgICB2YXIgbCA9IGxyW29mZl07XG4gICAgdmFyIHIgPSBscltvZmYgKyAxXTtcbiAgICBsIF49IHRoaXMuUFswXTtcbiAgICBmb3IgKGkgPSAwOyBpIDw9IHRoaXMuQkxPV0ZJU0hfTlVNX1JPVU5EUyAtIDI7KSB7XG4gICAgICAgIC8vIEZlaXN0ZWwgc3Vic3RpdHV0aW9uIG9uIGxlZnQgd29yZFxuICAgICAgICBuID0gdGhpcy5TWyhsID4+IDI0KSAmIDB4ZmZdO1xuICAgICAgICBuICs9IHRoaXMuU1sweDEwMCB8ICgobCA+PiAxNikgJiAweGZmKV07XG4gICAgICAgIG4gXj0gdGhpcy5TWzB4MjAwIHwgKChsID4+IDgpICYgMHhmZildO1xuICAgICAgICBuICs9IHRoaXMuU1sweDMwMCB8IChsICYgMHhmZildO1xuICAgICAgICByIF49IG4gXiB0aGlzLlBbKytpXTtcbiAgICAgICAgLy8gRmVpc3RlbCBzdWJzdGl0dXRpb24gb24gcmlnaHQgd29yZFxuICAgICAgICBuID0gdGhpcy5TWyhyID4+IDI0KSAmIDB4ZmZdO1xuICAgICAgICBuICs9IHRoaXMuU1sweDEwMCB8ICgociA+PiAxNikgJiAweGZmKV07XG4gICAgICAgIG4gXj0gdGhpcy5TWzB4MjAwIHwgKChyID4+IDgpICYgMHhmZildO1xuICAgICAgICBuICs9IHRoaXMuU1sweDMwMCB8IChyICYgMHhmZildO1xuICAgICAgICBsIF49IG4gXiB0aGlzLlBbKytpXTtcbiAgICB9XG4gICAgbHJbb2ZmXSA9IHIgXiB0aGlzLlBbdGhpcy5CTE9XRklTSF9OVU1fUk9VTkRTICsgMV07XG4gICAgbHJbb2ZmICsgMV0gPSBsO1xufTtcbmJDcnlwdC5wcm90b3R5cGUuc3RyZWFtdG93b3JkID0gZnVuY3Rpb24gKGRhdGEsIG9mZnApIHtcbiAgICB2YXIgaTtcbiAgICB2YXIgd29yZCA9IDA7XG4gICAgdmFyIG9mZiA9IG9mZnA7XG4gICAgZm9yIChpID0gMDsgaSA8IDQ7IGkrKykge1xuICAgICAgICB3b3JkID0gKHdvcmQgPDwgOCkgfCAoZGF0YVtvZmZdICYgMHhmZik7XG4gICAgICAgIG9mZiA9IChvZmYgKyAxKSAlIGRhdGEubGVuZ3RoO1xuICAgIH1cbiAgICB0aGlzLm9mZnAgPSBvZmY7XG4gICAgcmV0dXJuIHdvcmQ7XG59O1xuYkNyeXB0LnByb3RvdHlwZS5pbml0X2tleSA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLlAgPSB0aGlzLlBfb3JpZy5zbGljZSgpO1xuICAgIHRoaXMuUyA9IHRoaXMuU19vcmlnLnNsaWNlKCk7XG59O1xuYkNyeXB0LnByb3RvdHlwZS5rZXkgPSBmdW5jdGlvbiAoa2V5KSB7XG4gICAgdmFyIGk7XG4gICAgdGhpcy5vZmZwID0gMDtcbiAgICB2YXIgbHIgPSBuZXcgQXJyYXkoMHgwMDAwMDAwMCwgMHgwMDAwMDAwMCk7XG4gICAgdmFyIHBsZW4gPSB0aGlzLlAubGVuZ3RoO1xuICAgIHZhciBzbGVuID0gdGhpcy5TLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgcGxlbjsgaSsrKSB7XG4gICAgICAgIHRoaXMuUFtpXSA9IHRoaXMuUFtpXSBeIHRoaXMuc3RyZWFtdG93b3JkKGtleSwgdGhpcy5vZmZwKTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHBsZW47IGkgKz0gMikge1xuICAgICAgICB0aGlzLmVuY2lwaGVyKGxyLCAwKTtcbiAgICAgICAgdGhpcy5QW2ldID0gbHJbMF07XG4gICAgICAgIHRoaXMuUFtpICsgMV0gPSBsclsxXTtcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8IHNsZW47IGkgKz0gMikge1xuICAgICAgICB0aGlzLmVuY2lwaGVyKGxyLCAwKTtcbiAgICAgICAgdGhpcy5TW2ldID0gbHJbMF07XG4gICAgICAgIHRoaXMuU1tpICsgMV0gPSBsclsxXTtcbiAgICB9XG59O1xuYkNyeXB0LnByb3RvdHlwZS5la3NrZXkgPSBmdW5jdGlvbiAoZGF0YSwga2V5KSB7XG4gICAgdmFyIGk7XG4gICAgdGhpcy5vZmZwID0gMDtcbiAgICB2YXIgbHIgPSBuZXcgQXJyYXkoMHgwMDAwMDAwMCwgMHgwMDAwMDAwMCk7XG4gICAgdmFyIHBsZW4gPSB0aGlzLlAubGVuZ3RoO1xuICAgIHZhciBzbGVuID0gdGhpcy5TLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgcGxlbjsgaSsrKVxuICAgICAgICB0aGlzLlBbaV0gPSB0aGlzLlBbaV0gXiB0aGlzLnN0cmVhbXRvd29yZChrZXksIHRoaXMub2ZmcCk7XG4gICAgdGhpcy5vZmZwID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgcGxlbjsgaSArPSAyKSB7XG4gICAgICAgIGxyWzBdIF49IHRoaXMuc3RyZWFtdG93b3JkKGRhdGEsIHRoaXMub2ZmcCk7XG4gICAgICAgIGxyWzFdIF49IHRoaXMuc3RyZWFtdG93b3JkKGRhdGEsIHRoaXMub2ZmcCk7XG4gICAgICAgIHRoaXMuZW5jaXBoZXIobHIsIDApO1xuICAgICAgICB0aGlzLlBbaV0gPSBsclswXTtcbiAgICAgICAgdGhpcy5QW2kgKyAxXSA9IGxyWzFdO1xuICAgIH1cbiAgICBmb3IgKGkgPSAwOyBpIDwgc2xlbjsgaSArPSAyKSB7XG4gICAgICAgIGxyWzBdIF49IHRoaXMuc3RyZWFtdG93b3JkKGRhdGEsIHRoaXMub2ZmcCk7XG4gICAgICAgIGxyWzFdIF49IHRoaXMuc3RyZWFtdG93b3JkKGRhdGEsIHRoaXMub2ZmcCk7XG4gICAgICAgIHRoaXMuZW5jaXBoZXIobHIsIDApO1xuICAgICAgICB0aGlzLlNbaV0gPSBsclswXTtcbiAgICAgICAgdGhpcy5TW2kgKyAxXSA9IGxyWzFdO1xuICAgIH1cbn07XG4vLyByZW1vdmVkIGFyZ3VtZW50cy5jYWxsZWUgZnJvbSBvcmlnaW5hbCB2ZXJzaW9uIGJlY2F1c2UgaXQgaXMgbm90IGFsbG93ZWQgaW4gc3RyaWN0IG1vZGVcbmJDcnlwdC5wcm90b3R5cGUuY3J5cHRfcmF3ID0gZnVuY3Rpb24gKHBhc3N3b3JkLCBzYWx0LCBsb2dfcm91bmRzKSB7XG4gICAgdmFyIHJvdW5kcztcbiAgICB2YXIgajtcbiAgICB2YXIgY2RhdGEgPSB0aGlzLmJmX2NyeXB0X2NpcGhlcnRleHQuc2xpY2UoKTtcbiAgICB2YXIgY2xlbiA9IGNkYXRhLmxlbmd0aDtcbiAgICB2YXIgb25lX3BlcmNlbnQ7XG4gICAgaWYgKGxvZ19yb3VuZHMgPCA0IHx8IGxvZ19yb3VuZHMgPiAzMSkge1xuICAgICAgICB0aHJvdyBcIkJhZCBudW1iZXIgb2Ygcm91bmRzXCI7XG4gICAgfVxuICAgIGlmIChzYWx0Lmxlbmd0aCAhPSB0aGlzLkJDUllQVF9TQUxUX0xFTikge1xuICAgICAgICB0aHJvdyBcIkJhZCBfc2FsdCBsZW5ndGhcIjtcbiAgICB9XG4gICAgcm91bmRzID0gMSA8PCBsb2dfcm91bmRzO1xuICAgIG9uZV9wZXJjZW50ID0gTWF0aC5mbG9vcihyb3VuZHMgLyAxMDApICsgMTtcbiAgICB0aGlzLmluaXRfa2V5KCk7XG4gICAgdGhpcy5la3NrZXkoc2FsdCwgcGFzc3dvcmQpO1xuICAgIHZhciBvYmogPSB0aGlzO1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgcm91bmRGdW5jdGlvbiA9IG51bGw7XG4gICAgcm91bmRGdW5jdGlvbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKGkgPCByb3VuZHMpIHtcbiAgICAgICAgICAgIHZhciBzdGFydCA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICBmb3IgKDsgaSA8IHJvdW5kczspIHtcbiAgICAgICAgICAgICAgICBpID0gaSArIDE7XG4gICAgICAgICAgICAgICAgb2JqLmtleShwYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgb2JqLmtleShzYWx0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByb3VuZEZ1bmN0aW9uKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgNjQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCAoY2xlbiA+PiAxKTsgaisrKSB7XG4gICAgICAgICAgICAgICAgICAgIG9iai5lbmNpcGhlcihjZGF0YSwgaiA8PCAxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcmV0ID0gW107XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2xlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcmV0LnB1c2gob2JqLmdldEJ5dGUoKGNkYXRhW2ldID4+IDI0KSAmIDB4ZmYpKTtcbiAgICAgICAgICAgICAgICByZXQucHVzaChvYmouZ2V0Qnl0ZSgoY2RhdGFbaV0gPj4gMTYpICYgMHhmZikpO1xuICAgICAgICAgICAgICAgIHJldC5wdXNoKG9iai5nZXRCeXRlKChjZGF0YVtpXSA+PiA4KSAmIDB4ZmYpKTtcbiAgICAgICAgICAgICAgICByZXQucHVzaChvYmouZ2V0Qnl0ZShjZGF0YVtpXSAmIDB4ZmYpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiByb3VuZEZ1bmN0aW9uKCk7XG59O1xuZXhwb3J0IGRlZmF1bHQgYkNyeXB0O1xuIiwiZXhwb3J0IHZhciBLZXlMZW5ndGg7XG4oZnVuY3Rpb24gKEtleUxlbmd0aCkge1xuICAgIEtleUxlbmd0aFtcImIxMjhcIl0gPSBcIjEyOFwiO1xuICAgIEtleUxlbmd0aFtcImIyNTZcIl0gPSBcIjI1NlwiO1xufSkoS2V5TGVuZ3RoIHx8IChLZXlMZW5ndGggPSB7fSkpO1xuIiwiLy8gQHRzLWlnbm9yZVt1bnR5cGVkLWltcG9ydF1cbmltcG9ydCBiQ3J5cHQgZnJvbSBcIi4uL2ludGVybmFsL2JDcnlwdC5qc1wiO1xuaW1wb3J0IHsgcmFuZG9tIH0gZnJvbSBcIi4uL3JhbmRvbS9SYW5kb21pemVyLmpzXCI7XG5pbXBvcnQgeyBzdHJpbmdUb1V0ZjhVaW50OEFycmF5IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiO1xuaW1wb3J0IHsgdWludDhBcnJheVRvQml0QXJyYXkgfSBmcm9tIFwiLi4vbWlzYy9VdGlscy5qc1wiO1xuaW1wb3J0IHsgS2V5TGVuZ3RoIH0gZnJvbSBcIi4uL21pc2MvQ29uc3RhbnRzLmpzXCI7XG5pbXBvcnQgeyBDcnlwdG9FcnJvciB9IGZyb20gXCIuLi9taXNjL0NyeXB0b0Vycm9yLmpzXCI7XG5pbXBvcnQgeyBzaGEyNTZIYXNoIH0gZnJvbSBcIi4vU2hhMjU2LmpzXCI7XG5jb25zdCBsb2dSb3VuZHMgPSA4OyAvLyBwYmtkZjIgbnVtYmVyIG9mIGl0ZXJhdGlvbnNcbi8qKlxuICogQ3JlYXRlIGEgMTI4IGJpdCByYW5kb20gX3NhbHQgdmFsdWUuXG4gKiByZXR1cm4gX3NhbHQgMTI4IGJpdCBvZiByYW5kb20gZGF0YSwgZW5jb2RlZCBhcyBhIGhleCBzdHJpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVJhbmRvbVNhbHQoKSB7XG4gICAgcmV0dXJuIHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoMTI4IC8gOCk7XG59XG4vKipcbiAqIENyZWF0ZSBhIDEyOCBiaXQgc3ltbWV0cmljIGtleSBmcm9tIHRoZSBnaXZlbiBwYXNzcGhyYXNlLlxuICogQHBhcmFtIHBhc3NwaHJhc2UgVGhlIHBhc3NwaHJhc2UgdG8gdXNlIGZvciBrZXkgZ2VuZXJhdGlvbiBhcyB1dGY4IHN0cmluZy5cbiAqIEBwYXJhbSBzYWx0IDE2IGJ5dGVzIG9mIHJhbmRvbSBkYXRhXG4gKiBAcGFyYW0ga2V5TGVuZ3RoVHlwZSBEZWZpbmVzIHRoZSBsZW5ndGggb2YgdGhlIGtleSB0aGF0IHNoYWxsIGJlIGdlbmVyYXRlZC5cbiAqIEByZXR1cm4gcmVzb2x2ZWQgd2l0aCB0aGUga2V5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUtleUZyb21QYXNzcGhyYXNlKHBhc3NwaHJhc2UsIHNhbHQsIGtleUxlbmd0aFR5cGUpIHtcbiAgICAvLyBoYXNoIHRoZSBwYXNzd29yZCBmaXJzdCB0byBhdm9pZCBsb2dpbiB3aXRoIG11bHRpcGxlcyBvZiBhIHBhc3N3b3JkLCBpLmUuIFwiaGVsbG9cIiBhbmQgXCJoZWxsb2hlbGxvXCIgcHJvZHVjZSB0aGUgc2FtZSBrZXkgaWYgdGhlIHNhbWUgX3NhbHQgaXMgdXNlZFxuICAgIGxldCBwYXNzcGhyYXNlQnl0ZXMgPSBzaGEyNTZIYXNoKHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkocGFzc3BocmFzZSkpO1xuICAgIGxldCBieXRlcyA9IGNyeXB0X3JhdyhwYXNzcGhyYXNlQnl0ZXMsIHNhbHQsIGxvZ1JvdW5kcyk7XG4gICAgaWYgKGtleUxlbmd0aFR5cGUgPT09IEtleUxlbmd0aC5iMTI4KSB7XG4gICAgICAgIHJldHVybiB1aW50OEFycmF5VG9CaXRBcnJheShieXRlcy5zbGljZSgwLCAxNikpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVpbnQ4QXJyYXlUb0JpdEFycmF5KHNoYTI1Nkhhc2goYnl0ZXMpKTtcbiAgICB9XG59XG5mdW5jdGlvbiBjcnlwdF9yYXcocGFzc3BocmFzZUJ5dGVzLCBzYWx0Qnl0ZXMsIGxvZ1JvdW5kcykge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBfc2lnbmVkQnl0ZXNUb1VpbnQ4QXJyYXkobmV3IGJDcnlwdCgpLmNyeXB0X3JhdyhfdWludDhBcnJheVRvU2lnbmVkQnl0ZXMocGFzc3BocmFzZUJ5dGVzKSwgX3VpbnQ4QXJyYXlUb1NpZ25lZEJ5dGVzKHNhbHRCeXRlcyksIGxvZ1JvdW5kcykpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBjb25zdCBlcnJvciA9IGU7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihlcnJvci5tZXNzYWdlLCBlcnJvcik7XG4gICAgfVxufVxuLyoqXG4gKiBDb252ZXJ0cyBhbiBhcnJheSBvZiBzaWduZWQgYnl0ZSB2YWx1ZXMgKC0xMjggdG8gMTI3KSB0byBhbiBVaW50OEFycmF5ICh2YWx1ZXMgMCB0byAyNTUpLlxuICogQHBhcmFtIHNpZ25lZEJ5dGVzIFRoZSBzaWduZWQgYnl0ZSB2YWx1ZXMuXG4gKiBAcmV0dXJuIFRoZSB1bnNpZ25lZCBieXRlIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gX3NpZ25lZEJ5dGVzVG9VaW50OEFycmF5KHNpZ25lZEJ5dGVzKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KG5ldyBJbnQ4QXJyYXkoc2lnbmVkQnl0ZXMpKTtcbn1cbi8qKlxuICogQ29udmVydHMgYW4gdWludDhBcnJheSAodmFsdWUgMCB0byAyNTUpIHRvIGFuIEFycmF5IHdpdGggdW5zaWduZWQgYnl0ZXMgKC0xMjggdG8gMTI3KS5cbiAqIEBwYXJhbSB1bnNpZ25lZEJ5dGVzIFRoZSB1bnNpZ25lZCBieXRlIHZhbHVlcy5cbiAqIEByZXR1cm4gVGhlIHNpZ25lZCBieXRlIHZhbHVlcy5cbiAqL1xuZnVuY3Rpb24gX3VpbnQ4QXJyYXlUb1NpZ25lZEJ5dGVzKHVuc2lnbmVkQnl0ZXMpIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbShuZXcgVWludDhBcnJheShuZXcgSW50OEFycmF5KHVuc2lnbmVkQnl0ZXMpKSk7XG59XG4iLCJpbXBvcnQgeyBjYWxsV2ViQXNzZW1ibHlGdW5jdGlvbldpdGhBcmd1bWVudHMsIG11dGFibGVTZWN1cmVGcmVlLCBzZWN1cmVGcmVlIH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiO1xuaW1wb3J0IHsgQ3J5cHRvRXJyb3IgfSBmcm9tIFwiLi4vLi4vbWlzYy9DcnlwdG9FcnJvci5qc1wiO1xuLyoqXG4gKiBOdW1iZXIgb2YgcmFuZG9tIGJ5dGVzIHJlcXVpcmVkIGZvciBhIEt5YmVyIG9wZXJhdGlvblxuICovXG5leHBvcnQgY29uc3QgS1lCRVJfUkFORF9BTU9VTlRfT0ZfRU5UUk9QWSA9IDY0O1xuY29uc3QgS1lCRVJfQUxHT1JJVEhNID0gXCJLeWJlcjEwMjRcIjtcbmNvbnN0IEtZQkVSX0sgPSA0O1xuY29uc3QgS1lCRVJfUE9MWUJZVEVTID0gMzg0O1xuZXhwb3J0IGNvbnN0IEtZQkVSX1BPTFlWRUNCWVRFUyA9IEtZQkVSX0sgKiBLWUJFUl9QT0xZQllURVM7XG5leHBvcnQgY29uc3QgS1lCRVJfU1lNQllURVMgPSAzMjtcbmNvbnN0IE9RU19LRU1fa3liZXJfMTAyNF9sZW5ndGhfcHVibGljX2tleSA9IDE1Njg7XG5jb25zdCBPUVNfS0VNX2t5YmVyXzEwMjRfbGVuZ3RoX3NlY3JldF9rZXkgPSAzMTY4O1xuY29uc3QgT1FTX0tFTV9reWJlcl8xMDI0X2xlbmd0aF9jaXBoZXJ0ZXh0ID0gMTU2ODtcbmNvbnN0IE9RU19LRU1fa3liZXJfMTAyNF9sZW5ndGhfc2hhcmVkX3NlY3JldCA9IDMyO1xuLyoqXG4gKiBAcmV0dXJucyBhIG5ldyByYW5kb20ga3liZXIga2V5IHBhaXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUtleVBhaXIoa3liZXJXYXNtLCByYW5kb21pemVyKSB7XG4gICAgY29uc3QgT1FTX0tFTSA9IGNyZWF0ZUtlbShreWJlcldhc20pO1xuICAgIHRyeSB7XG4gICAgICAgIGZpbGxFbnRyb3B5UG9vbChreWJlcldhc20sIHJhbmRvbWl6ZXIpO1xuICAgICAgICBjb25zdCBwdWJsaWNLZXkgPSBuZXcgVWludDhBcnJheShPUVNfS0VNX2t5YmVyXzEwMjRfbGVuZ3RoX3B1YmxpY19rZXkpO1xuICAgICAgICBjb25zdCBwcml2YXRlS2V5ID0gbmV3IFVpbnQ4QXJyYXkoT1FTX0tFTV9reWJlcl8xMDI0X2xlbmd0aF9zZWNyZXRfa2V5KTtcbiAgICAgICAgY29uc3QgcmVzdWx0ID0gY2FsbFdlYkFzc2VtYmx5RnVuY3Rpb25XaXRoQXJndW1lbnRzKGt5YmVyV2FzbS5PUVNfS0VNX2tleXBhaXIsIGt5YmVyV2FzbSwgT1FTX0tFTSwgbXV0YWJsZVNlY3VyZUZyZWUocHVibGljS2V5KSwgbXV0YWJsZVNlY3VyZUZyZWUocHJpdmF0ZUtleSkpO1xuICAgICAgICBpZiAocmVzdWx0ICE9IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgT1FTX0tFTV9rZXlwYWlyIHJldHVybmVkICR7cmVzdWx0fWApO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBwdWJsaWNLZXk6IHsgcmF3OiBwdWJsaWNLZXkgfSxcbiAgICAgICAgICAgIHByaXZhdGVLZXk6IHsgcmF3OiBwcml2YXRlS2V5IH0sXG4gICAgICAgIH07XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBmcmVlS2VtKGt5YmVyV2FzbSwgT1FTX0tFTSk7XG4gICAgfVxufVxuLyoqXG4gKiBAcGFyYW0ga3liZXJXYXNtIHRoZSBXZWJBc3NlbWJseS9Kc0ZhbGxiYWNrIG1vZHVsZSB0aGF0IGltcGxlbWVudHMgb3VyIGt5YmVyIHByaW1pdGl2ZXMgKGxpYm9xcylcbiAqIEBwYXJhbSBwdWJsaWNLZXkgdGhlIHB1YmxpYyBrZXkgdG8gZW5jYXBzdWxhdGUgd2l0aFxuICogQHBhcmFtIHJhbmRvbWl6ZXIgb3VyIHJhbmRvbWl6ZXIgdGhhdCBpcyB1c2VkIHRvIHRoZSBuYXRpdmUgbGlicmFyeSB3aXRoIGVudHJvcHlcbiAqIEByZXR1cm4gdGhlIHBsYWludGV4dCBzZWNyZXQga2V5IGFuZCB0aGUgZW5jYXBzdWxhdGVkIGtleSBmb3IgdXNlIHdpdGggQUVTIG9yIGFzIGlucHV0IHRvIGEgS0RGXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNhcHN1bGF0ZShreWJlcldhc20sIHB1YmxpY0tleSwgcmFuZG9taXplcikge1xuICAgIGlmIChwdWJsaWNLZXkucmF3Lmxlbmd0aCAhPSBPUVNfS0VNX2t5YmVyXzEwMjRfbGVuZ3RoX3B1YmxpY19rZXkpIHtcbiAgICAgICAgdGhyb3cgbmV3IENyeXB0b0Vycm9yKGBJbnZhbGlkIHB1YmxpYyBrZXkgbGVuZ3RoOyBleHBlY3RlZCAke09RU19LRU1fa3liZXJfMTAyNF9sZW5ndGhfcHVibGljX2tleX0sIGdvdCAke3B1YmxpY0tleS5yYXcubGVuZ3RofWApO1xuICAgIH1cbiAgICBjb25zdCBPUVNfS0VNID0gY3JlYXRlS2VtKGt5YmVyV2FzbSk7XG4gICAgdHJ5IHtcbiAgICAgICAgZmlsbEVudHJvcHlQb29sKGt5YmVyV2FzbSwgcmFuZG9taXplcik7XG4gICAgICAgIGNvbnN0IGNpcGhlcnRleHQgPSBuZXcgVWludDhBcnJheShPUVNfS0VNX2t5YmVyXzEwMjRfbGVuZ3RoX2NpcGhlcnRleHQpO1xuICAgICAgICBjb25zdCBzaGFyZWRTZWNyZXQgPSBuZXcgVWludDhBcnJheShPUVNfS0VNX2t5YmVyXzEwMjRfbGVuZ3RoX3NoYXJlZF9zZWNyZXQpO1xuICAgICAgICBjb25zdCByZXN1bHQgPSBjYWxsV2ViQXNzZW1ibHlGdW5jdGlvbldpdGhBcmd1bWVudHMoa3liZXJXYXNtLk9RU19LRU1fZW5jYXBzLCBreWJlcldhc20sIE9RU19LRU0sIG11dGFibGVTZWN1cmVGcmVlKGNpcGhlcnRleHQpLCBtdXRhYmxlU2VjdXJlRnJlZShzaGFyZWRTZWNyZXQpLCBtdXRhYmxlU2VjdXJlRnJlZShwdWJsaWNLZXkucmF3KSk7XG4gICAgICAgIGlmIChyZXN1bHQgIT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBPUVNfS0VNX2VuY2FwcyByZXR1cm5lZCAke3Jlc3VsdH1gKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4geyBjaXBoZXJ0ZXh0LCBzaGFyZWRTZWNyZXQgfTtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIGZyZWVLZW0oa3liZXJXYXNtLCBPUVNfS0VNKTtcbiAgICB9XG59XG4vKipcbiAqIEBwYXJhbSBreWJlcldhc20gdGhlIFdlYkFzc2VtYmx5L0pzRmFsbGJhY2sgbW9kdWxlIHRoYXQgaW1wbGVtZW50cyBvdXIga3liZXIgcHJpbWl0aXZlcyAobGlib3FzKVxuICogQHBhcmFtIHByaXZhdGVLZXkgICAgICB0aGUgY29ycmVzcG9uZGluZyBwcml2YXRlIGtleSBvZiB0aGUgcHVibGljIGtleSB3aXRoIHdoaWNoIHRoZSBlbmNhcHN1bGF0ZWRLZXkgd2FzIGVuY2Fwc3VsYXRlZCB3aXRoXG4gKiBAcGFyYW0gY2lwaGVydGV4dCB0aGUgY2lwaGVydGV4dCBvdXRwdXQgb2YgZW5jYXBzdWxhdGUoKVxuICogQHJldHVybiB0aGUgcGxhaW50ZXh0IHNlY3JldCBrZXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRlY2Fwc3VsYXRlKGt5YmVyV2FzbSwgcHJpdmF0ZUtleSwgY2lwaGVydGV4dCkge1xuICAgIGlmIChwcml2YXRlS2V5LnJhdy5sZW5ndGggIT0gT1FTX0tFTV9reWJlcl8xMDI0X2xlbmd0aF9zZWNyZXRfa2V5KSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihgSW52YWxpZCBwcml2YXRlIGtleSBsZW5ndGg7IGV4cGVjdGVkICR7T1FTX0tFTV9reWJlcl8xMDI0X2xlbmd0aF9zZWNyZXRfa2V5fSwgZ290ICR7cHJpdmF0ZUtleS5yYXcubGVuZ3RofWApO1xuICAgIH1cbiAgICBpZiAoY2lwaGVydGV4dC5sZW5ndGggIT0gT1FTX0tFTV9reWJlcl8xMDI0X2xlbmd0aF9jaXBoZXJ0ZXh0KSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihgSW52YWxpZCBjaXBoZXJ0ZXh0IGxlbmd0aDsgZXhwZWN0ZWQgJHtPUVNfS0VNX2t5YmVyXzEwMjRfbGVuZ3RoX2NpcGhlcnRleHR9LCBnb3QgJHtjaXBoZXJ0ZXh0Lmxlbmd0aH1gKTtcbiAgICB9XG4gICAgY29uc3QgT1FTX0tFTSA9IGNyZWF0ZUtlbShreWJlcldhc20pO1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHNoYXJlZFNlY3JldCA9IG5ldyBVaW50OEFycmF5KE9RU19LRU1fa3liZXJfMTAyNF9sZW5ndGhfc2hhcmVkX3NlY3JldCk7XG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxXZWJBc3NlbWJseUZ1bmN0aW9uV2l0aEFyZ3VtZW50cyhreWJlcldhc20uT1FTX0tFTV9kZWNhcHMsIGt5YmVyV2FzbSwgT1FTX0tFTSwgbXV0YWJsZVNlY3VyZUZyZWUoc2hhcmVkU2VjcmV0KSwgc2VjdXJlRnJlZShjaXBoZXJ0ZXh0KSwgc2VjdXJlRnJlZShwcml2YXRlS2V5LnJhdykpO1xuICAgICAgICBpZiAocmVzdWx0ICE9IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgT1FTX0tFTV9kZWNhcHMgcmV0dXJuZWQgJHtyZXN1bHR9YCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHNoYXJlZFNlY3JldDtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIGZyZWVLZW0oa3liZXJXYXNtLCBPUVNfS0VNKTtcbiAgICB9XG59XG5mdW5jdGlvbiBmcmVlS2VtKGt5YmVyV2FzbSwgT1FTX0tFTSkge1xuICAgIGNhbGxXZWJBc3NlbWJseUZ1bmN0aW9uV2l0aEFyZ3VtZW50cyhreWJlcldhc20uT1FTX0tFTV9mcmVlLCBreWJlcldhc20sIE9RU19LRU0pO1xufVxuLy8gVGhlIHJldHVybmVkIHBvaW50ZXIgbmVlZHMgdG8gYmUgZnJlZWQgb25jZSBub3QgbmVlZGVkIGFueW1vcmUgYnkgdGhlIGNhbGxlclxuZnVuY3Rpb24gY3JlYXRlS2VtKGt5YmVyV2FzbSkge1xuICAgIHJldHVybiBjYWxsV2ViQXNzZW1ibHlGdW5jdGlvbldpdGhBcmd1bWVudHMoa3liZXJXYXNtLk9RU19LRU1fbmV3LCBreWJlcldhc20sIEtZQkVSX0FMR09SSVRITSk7XG59XG4vLyBBZGQgYnl0ZXMgZXh0ZXJuYWxseSB0byB0aGUgcmFuZG9tIG51bWJlciBnZW5lcmF0b3JcbmZ1bmN0aW9uIGZpbGxFbnRyb3B5UG9vbChleHBvcnRzLCByYW5kb21pemVyKSB7XG4gICAgY29uc3QgZW50cm9weUFtb3VudCA9IHJhbmRvbWl6ZXIuZ2VuZXJhdGVSYW5kb21EYXRhKEtZQkVSX1JBTkRfQU1PVU5UX09GX0VOVFJPUFkpO1xuICAgIGNvbnN0IHJlbWFpbmluZyA9IGNhbGxXZWJBc3NlbWJseUZ1bmN0aW9uV2l0aEFyZ3VtZW50cyhleHBvcnRzLlRVVEFfaW5qZWN0X2VudHJvcHksIGV4cG9ydHMsIGVudHJvcHlBbW91bnQsIGVudHJvcHlBbW91bnQubGVuZ3RoKTtcbiAgICBpZiAocmVtYWluaW5nIDwgMCkge1xuICAgICAgICBjb25zb2xlLndhcm4oYHRyaWVkIHRvIGNvcHkgdG9vIG11Y2ggZW50cm9weTogb3ZlcmZsb3dlZCB3aXRoICR7LXJlbWFpbmluZ30gYnl0ZXM7IGZpeCBSQU5EX0FNT1VOVF9PRl9FTlRST1BZL2dlbmVyYXRlUmFuZG9tRGF0YSB0byBzaWxlbmNlIHRoaXNgKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgeyBieXRlQXJyYXlzVG9CeXRlcywgYnl0ZXNUb0J5dGVBcnJheXMsIGNvbmNhdCB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIjtcbmltcG9ydCB7IEtZQkVSX1BPTFlWRUNCWVRFUywgS1lCRVJfU1lNQllURVMgfSBmcm9tIFwiLi9LeWJlci5qc1wiO1xuLyoqXG4gKiBFbmNvZGVzIHRoZSBreWJlciBwcml2YXRlIGtleSBpbnRvIGEgYnl0ZSBhcnJheSBpbiB0aGUgZm9sbG93aW5nIGZvcm1hdC5cbiAqIHwgbGVuZ3RoICgyIEJ5dGUpIHwgcHJpdmF0ZUtleS5TIChuIEJ5dGUpICAgfFxuICogfCBsZW5ndGggKDIgQnl0ZSkgfCBwcml2YXRlS2V5LkhQSyAobiBCeXRlKSB8XG4gKiB8IGxlbmd0aCAoMiBCeXRlKSB8IHByaXZhdGVLZXkuTm9uY2UgKG4gQnl0ZSkgfFxuICogfCBsZW5ndGggKDIgQnl0ZSkgfCBwcml2YXRlS2V5LlQgKG4gQnl0ZSkgfFxuICogfCBsZW5ndGggKDIgQnl0ZSkgfCBwcml2YXRlS2V5LlJobyAobiBCeXRlKSB8XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBreWJlclByaXZhdGVLZXlUb0J5dGVzKGtleSkge1xuICAgIGNvbnN0IGtleUJ5dGVzID0ga2V5LnJhdztcbiAgICAvL2xpYm9xczogcywgdCwgcmhvLCBocGssIG5vbmNlXG4gICAgLy90dXRhIGVuY29kZWQ6IHMsIGhwaywgbm9uY2UsIHQsIHJob1xuICAgIGNvbnN0IHMgPSBrZXlCeXRlcy5zbGljZSgwLCBLWUJFUl9QT0xZVkVDQllURVMpO1xuICAgIGNvbnN0IHQgPSBrZXlCeXRlcy5zbGljZShLWUJFUl9QT0xZVkVDQllURVMsIDIgKiBLWUJFUl9QT0xZVkVDQllURVMpO1xuICAgIGNvbnN0IHJobyA9IGtleUJ5dGVzLnNsaWNlKDIgKiBLWUJFUl9QT0xZVkVDQllURVMsIDIgKiBLWUJFUl9QT0xZVkVDQllURVMgKyBLWUJFUl9TWU1CWVRFUyk7XG4gICAgY29uc3QgaHBrID0ga2V5Qnl0ZXMuc2xpY2UoMiAqIEtZQkVSX1BPTFlWRUNCWVRFUyArIEtZQkVSX1NZTUJZVEVTLCAyICogS1lCRVJfUE9MWVZFQ0JZVEVTICsgMiAqIEtZQkVSX1NZTUJZVEVTKTtcbiAgICBjb25zdCBub25jZSA9IGtleUJ5dGVzLnNsaWNlKDIgKiBLWUJFUl9QT0xZVkVDQllURVMgKyAyICogS1lCRVJfU1lNQllURVMsIDIgKiBLWUJFUl9QT0xZVkVDQllURVMgKyAzICogS1lCRVJfU1lNQllURVMpO1xuICAgIHJldHVybiBieXRlQXJyYXlzVG9CeXRlcyhbcywgaHBrLCBub25jZSwgdCwgcmhvXSk7XG59XG4vKipcbiAqIEVuY29kZXMgdGhlIGt5YmVyIHB1YmxpYyBrZXkgaW50byBhIGJ5dGUgYXJyYXkgaW4gdGhlIGZvbGxvd2luZyBmb3JtYXQuXG4gKiB8IGxlbmd0aCAoMiBCeXRlKSB8IHB1YmxpY0tleS5UIChuIEJ5dGUpICB8XG4gKiB8IGxlbmd0aCAoMiBCeXRlKSB8IHB1YmxpY0tleS5SaG8gKG4gQnl0ZSkgfFxuICovXG5leHBvcnQgZnVuY3Rpb24ga3liZXJQdWJsaWNLZXlUb0J5dGVzKGtleSkge1xuICAgIGNvbnN0IGtleUJ5dGVzID0ga2V5LnJhdztcbiAgICBjb25zdCB0ID0ga2V5Qnl0ZXMuc2xpY2UoMCwgS1lCRVJfUE9MWVZFQ0JZVEVTKTtcbiAgICBjb25zdCByaG8gPSBrZXlCeXRlcy5zbGljZShLWUJFUl9QT0xZVkVDQllURVMsIEtZQkVSX1BPTFlWRUNCWVRFUyArIEtZQkVSX1NZTUJZVEVTKTtcbiAgICByZXR1cm4gYnl0ZUFycmF5c1RvQnl0ZXMoW3QsIHJob10pO1xufVxuLyoqXG4gKiBJbnZlcnNlIG9mIHB1YmxpY0tleVRvQnl0ZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ5dGVzVG9LeWJlclB1YmxpY0tleShlbmNvZGVkUHVibGljS2V5KSB7XG4gICAgY29uc3Qga2V5Q29tcG9uZW50cyA9IGJ5dGVzVG9CeXRlQXJyYXlzKGVuY29kZWRQdWJsaWNLZXksIDIpO1xuICAgIC8vIGtleSBpcyBleHBlY3RlZCBieSBvcXMgaW4gdGhlIHNhbWUgb3JkZXIgdCwgcmhvXG4gICAgcmV0dXJuIHsgcmF3OiBjb25jYXQoLi4ua2V5Q29tcG9uZW50cykgfTtcbn1cbi8qKlxuICogSW52ZXJzZSBvZiBwcml2YXRlS2V5VG9CeXRlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gYnl0ZXNUb0t5YmVyUHJpdmF0ZUtleShlbmNvZGVkUHJpdmF0ZUtleSkge1xuICAgIGNvbnN0IGtleUNvbXBvbmVudHMgPSBieXRlc1RvQnl0ZUFycmF5cyhlbmNvZGVkUHJpdmF0ZUtleSwgNSk7XG4gICAgY29uc3QgcyA9IGtleUNvbXBvbmVudHNbMF07XG4gICAgY29uc3QgaHBrID0ga2V5Q29tcG9uZW50c1sxXTtcbiAgICBjb25zdCBub25jZSA9IGtleUNvbXBvbmVudHNbMl07XG4gICAgY29uc3QgdCA9IGtleUNvbXBvbmVudHNbM107XG4gICAgY29uc3QgcmhvID0ga2V5Q29tcG9uZW50c1s0XTtcbiAgICAvLyBrZXkgaXMgZXhwZWN0ZWQgYnkgb3FzIGluIHRoaXMgb3JkZXIgKHZzIGhvdyB3ZSBlbmNvZGUgaXQgb24gdGhlIHNlcnZlcik6IHMsIHQsIHJobywgaHBrLCBub25jZVxuICAgIHJldHVybiB7IHJhdzogY29uY2F0KHMsIHQsIHJobywgaHBrLCBub25jZSkgfTtcbn1cbiIsImltcG9ydCB7IGNhbGxXZWJBc3NlbWJseUZ1bmN0aW9uV2l0aEFyZ3VtZW50cywgbXV0YWJsZVNlY3VyZUZyZWUsIHNlY3VyZUZyZWUsIHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkgfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCI7XG5pbXBvcnQgeyB1aW50OEFycmF5VG9CaXRBcnJheSB9IGZyb20gXCIuLi8uLi9taXNjL1V0aWxzLmpzXCI7XG4vLyBQZXIgT1dBU1AncyByZWNvbW1lbmRhdGlvbnMgQCBodHRwczovL2NoZWF0c2hlZXRzZXJpZXMub3dhc3Aub3JnL2NoZWF0c2hlZXRzL1Bhc3N3b3JkX1N0b3JhZ2VfQ2hlYXRfU2hlZXQuaHRtbFxuZXhwb3J0IGNvbnN0IEFSR09OMklEX0lURVJBVElPTlMgPSA0O1xuZXhwb3J0IGNvbnN0IEFSR09OMklEX01FTU9SWV9JTl9LaUIgPSAzMiAqIDEwMjQ7XG5leHBvcnQgY29uc3QgQVJHT04ySURfUEFSQUxMRUxJU00gPSAxO1xuZXhwb3J0IGNvbnN0IEFSR09OMklEX0tFWV9MRU5HVEggPSAzMjtcbi8qKlxuICogQ3JlYXRlIGEgMjU2LWJpdCBzeW1tZXRyaWMga2V5IGZyb20gdGhlIGdpdmVuIHBhc3NwaHJhc2UuXG4gKiBAcGFyYW0gYXJnb24yIGFyZ29uMiBtb2R1bGUgZXhwb3J0c1xuICogQHBhcmFtIHBhc3MgVGhlIHBhc3NwaHJhc2UgdG8gdXNlIGZvciBrZXkgZ2VuZXJhdGlvbiBhcyB1dGY4IHN0cmluZy5cbiAqIEBwYXJhbSBzYWx0IDE2IGJ5dGVzIG9mIHJhbmRvbSBkYXRhXG4gKiBAcmV0dXJuIHJlc29sdmVkIHdpdGggdGhlIGtleVxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2VuZXJhdGVLZXlGcm9tUGFzc3BocmFzZShhcmdvbjIsIHBhc3MsIHNhbHQpIHtcbiAgICBjb25zdCBoYXNoID0gYXdhaXQgYXJnb24yaWRIYXNoUmF3KGFyZ29uMiwgQVJHT04ySURfSVRFUkFUSU9OUywgQVJHT04ySURfTUVNT1JZX0lOX0tpQiwgQVJHT04ySURfUEFSQUxMRUxJU00sIHN0cmluZ1RvVXRmOFVpbnQ4QXJyYXkocGFzcyksIHNhbHQsIEFSR09OMklEX0tFWV9MRU5HVEgpO1xuICAgIHJldHVybiB1aW50OEFycmF5VG9CaXRBcnJheShoYXNoKTtcbn1cbmFzeW5jIGZ1bmN0aW9uIGFyZ29uMmlkSGFzaFJhdyhhcmdvbjIsIHRpbWVDb3N0LCBtZW1vcnlDb3N0LCBwYXJhbGxlbGlzbSwgcGFzc3dvcmQsIHNhbHQsIGhhc2hMZW5ndGgpIHtcbiAgICBjb25zdCBoYXNoID0gbmV3IFVpbnQ4QXJyYXkoaGFzaExlbmd0aCk7XG4gICAgY29uc3QgcmVzdWx0ID0gY2FsbFdlYkFzc2VtYmx5RnVuY3Rpb25XaXRoQXJndW1lbnRzKGFyZ29uMi5hcmdvbjJpZF9oYXNoX3JhdywgYXJnb24yLCB0aW1lQ29zdCwgbWVtb3J5Q29zdCwgcGFyYWxsZWxpc20sIHNlY3VyZUZyZWUocGFzc3dvcmQpLCBwYXNzd29yZC5sZW5ndGgsIHNhbHQsIHNhbHQubGVuZ3RoLCBtdXRhYmxlU2VjdXJlRnJlZShoYXNoKSwgaGFzaC5sZW5ndGgpO1xuICAgIGlmIChyZXN1bHQgIT09IDApIHtcbiAgICAgICAgLy8gSWYgeW91IGhpdCB0aGlzLCByZWZlciB0byBhcmdvbi5oIChsb29rIGZvciBBcmdvbjJfRXJyb3JDb2RlcykgZm9yIGEgZGVzY3JpcHRpb24gb2Ygd2hhdCBpdCBtZWFucy4gSXQncyBsaWtlbHkgYW4gaXNzdWUgd2l0aCBvbmUgb2YgeW91ciBpbnB1dHMuXG4gICAgICAgIC8vXG4gICAgICAgIC8vIE5vdGU6IElmIHlvdSBnb3QgQVJHT04yX01FTU9SWV9BTExPQ0FUSU9OX0VSUk9SICgtMjIpLCB5b3UgcHJvYmFibHkgZ2F2ZSB0b28gYmlnIG9mIGEgbWVtb3J5IGNvc3QuIFlvdSBuZWVkIHRvIHJlY29tcGlsZSBhcmdvbjIud2FzbSB0byBzdXBwb3J0IG1vcmUgbWVtb3J5LlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGFyZ29uMmlkX2hhc2hfcmF3IHJldHVybmVkICR7cmVzdWx0fWApO1xuICAgIH1cbiAgICByZXR1cm4gaGFzaDtcbn1cbiIsImltcG9ydCB7IHJhbmRvbSB9IGZyb20gXCIuL1JhbmRvbWl6ZXIuanNcIjtcbi8qKlxuICogVGhpcyBpcyB0aGUgYWRhcHRlciB0byB0aGUgUFJORyBpbnRlcmZhY2UgcmVxdWlyZWQgYnkgSlNCTi5cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5leHBvcnQgY2xhc3MgU2VjdXJlUmFuZG9tIHtcbiAgICAvKipcbiAgICAgKiBPbmx5IHRoaXMgZnVuY3Rpb24gaXMgdXNlZCBieSBqc2JuIGZvciBnZXR0aW5nIHJhbmRvbSBieXRlcy4gRWFjaCBieXRlIGlzIGEgdmFsdWUgYmV0d2VlbiAwIGFuZCAyNTUuXG4gICAgICogQHBhcmFtIGFycmF5IEFuIGFycmF5IHRvIGZpbGwgd2l0aCByYW5kb20gYnl0ZXMuIFRoZSBsZW5ndGggb2YgdGhlIGFycmF5IGRlZmluZXMgdGhlIG51bWJlciBvZiBieXRlcyB0byBjcmVhdGUuXG4gICAgICovXG4gICAgbmV4dEJ5dGVzKGFycmF5KSB7XG4gICAgICAgIGxldCBieXRlcyA9IHJhbmRvbS5nZW5lcmF0ZVJhbmRvbURhdGEoYXJyYXkubGVuZ3RoKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJyYXlbaV0gPSBieXRlc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbn1cbiIsImltcG9ydCB7IFNlY3VyZVJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb20vU2VjdXJlUmFuZG9tLmpzXCI7XG4vLyBDb3B5cmlnaHQgKGMpIDIwMDUgIFRvbSBXdVxuLy8gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNlZSBcIkxJQ0VOU0VcIiBmb3IgZGV0YWlscy5cbi8vIEJhc2ljIEphdmFTY3JpcHQgQk4gbGlicmFyeSAtIHN1YnNldCB1c2VmdWwgZm9yIFJTQSBlbmNyeXB0aW9uLlxuLy8gQml0cyBwZXIgZGlnaXRcbnZhciBkYml0cztcbi8vIEphdmFTY3JpcHQgZW5naW5lIGFuYWx5c2lzXG52YXIgY2FuYXJ5ID0gMHhkZWFkYmVlZmNhZmU7XG52YXIgal9sbSA9IChjYW5hcnkgJiAweGZmZmZmZikgPT0gMHhlZmNhZmU7XG4vLyAocHVibGljKSBDb25zdHJ1Y3RvclxuLy8gdHV0YW86IGEgPSBiaXRsZW5ndGggKDEwMjQpXG4vLyAgICAgICAgYiA9IG51bWJlciBvZiBtaWxsZXIgcmFiaW4gdGVzdCAqIDJcbi8vICAgICAgICBjID0gU2VjdXJlUmFuZG9tXG5leHBvcnQgZnVuY3Rpb24gQmlnSW50ZWdlcihhLCBiLCBjKSB7XG4gICAgaWYgKGEgIT0gbnVsbCkge1xuICAgICAgICBpZiAoXCJudW1iZXJcIiA9PSB0eXBlb2YgYSkge1xuICAgICAgICAgICAgdGhpcy5mcm9tTnVtYmVyKGEsIGIsIGMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGIgPT0gbnVsbCAmJiBcInN0cmluZ1wiICE9IHR5cGVvZiBhKSB7XG4gICAgICAgICAgICB0aGlzLmZyb21TdHJpbmcoYSwgMjU2KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZnJvbVN0cmluZyhhLCBiKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIHJldHVybiBuZXcsIHVuc2V0IEJpZ0ludGVnZXJcbmZ1bmN0aW9uIG5iaSgpIHtcbiAgICByZXR1cm4gbmV3IEJpZ0ludGVnZXIobnVsbCk7XG59XG4vLyBhbTogQ29tcHV0ZSB3X2ogKz0gKHgqdGhpc19pKSwgcHJvcGFnYXRlIGNhcnJpZXMsXG4vLyBjIGlzIGluaXRpYWwgY2FycnksIHJldHVybnMgZmluYWwgY2FycnkuXG4vLyBjIDwgMypkdmFsdWUsIHggPCAyKmR2YWx1ZSwgdGhpc19pIDwgZHZhbHVlXG4vLyBXZSBuZWVkIHRvIHNlbGVjdCB0aGUgZmFzdGVzdCBvbmUgdGhhdCB3b3JrcyBpbiB0aGlzIGVudmlyb25tZW50LlxuLy8gYW0xOiB1c2UgYSBzaW5nbGUgbXVsdCBhbmQgZGl2aWRlIHRvIGdldCB0aGUgaGlnaCBiaXRzLFxuLy8gbWF4IGRpZ2l0IGJpdHMgc2hvdWxkIGJlIDI2IGJlY2F1c2Vcbi8vIG1heCBpbnRlcm5hbCB2YWx1ZSA9IDIqZHZhbHVlXjItMipkdmFsdWUgKDwgMl41MylcbmZ1bmN0aW9uIGFtMShpLCB4LCB3LCBqLCBjLCBuKSB7XG4gICAgd2hpbGUgKC0tbiA+PSAwKSB7XG4gICAgICAgIHZhciB2ID0geCAqIHRoaXNbaSsrXSArIHdbal0gKyBjO1xuICAgICAgICBjID0gTWF0aC5mbG9vcih2IC8gMHg0MDAwMDAwKTtcbiAgICAgICAgd1tqKytdID0gdiAmIDB4M2ZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG59XG4vLyBhbTIgYXZvaWRzIGEgYmlnIG11bHQtYW5kLWV4dHJhY3QgY29tcGxldGVseS5cbi8vIE1heCBkaWdpdCBiaXRzIHNob3VsZCBiZSA8PSAzMCBiZWNhdXNlIHdlIGRvIGJpdHdpc2Ugb3BzXG4vLyBvbiB2YWx1ZXMgdXAgdG8gMipoZHZhbHVlXjItaGR2YWx1ZS0xICg8IDJeMzEpXG5mdW5jdGlvbiBhbTIoaSwgeCwgdywgaiwgYywgbikge1xuICAgIHZhciB4bCA9IHggJiAweDdmZmYsIHhoID0geCA+PiAxNTtcbiAgICB3aGlsZSAoLS1uID49IDApIHtcbiAgICAgICAgdmFyIGwgPSB0aGlzW2ldICYgMHg3ZmZmO1xuICAgICAgICB2YXIgaCA9IHRoaXNbaSsrXSA+PiAxNTtcbiAgICAgICAgdmFyIG0gPSB4aCAqIGwgKyBoICogeGw7XG4gICAgICAgIGwgPSB4bCAqIGwgKyAoKG0gJiAweDdmZmYpIDw8IDE1KSArIHdbal0gKyAoYyAmIDB4M2ZmZmZmZmYpO1xuICAgICAgICBjID0gKGwgPj4+IDMwKSArIChtID4+PiAxNSkgKyB4aCAqIGggKyAoYyA+Pj4gMzApO1xuICAgICAgICB3W2orK10gPSBsICYgMHgzZmZmZmZmZjtcbiAgICB9XG4gICAgcmV0dXJuIGM7XG59XG4vLyBBbHRlcm5hdGVseSwgc2V0IG1heCBkaWdpdCBiaXRzIHRvIDI4IHNpbmNlIHNvbWVcbi8vIGJyb3dzZXJzIHNsb3cgZG93biB3aGVuIGRlYWxpbmcgd2l0aCAzMi1iaXQgbnVtYmVycy5cbmZ1bmN0aW9uIGFtMyhpLCB4LCB3LCBqLCBjLCBuKSB7XG4gICAgdmFyIHhsID0geCAmIDB4M2ZmZiwgeGggPSB4ID4+IDE0O1xuICAgIHdoaWxlICgtLW4gPj0gMCkge1xuICAgICAgICB2YXIgbCA9IHRoaXNbaV0gJiAweDNmZmY7XG4gICAgICAgIHZhciBoID0gdGhpc1tpKytdID4+IDE0O1xuICAgICAgICB2YXIgbSA9IHhoICogbCArIGggKiB4bDtcbiAgICAgICAgbCA9IHhsICogbCArICgobSAmIDB4M2ZmZikgPDwgMTQpICsgd1tqXSArIGM7XG4gICAgICAgIGMgPSAobCA+PiAyOCkgKyAobSA+PiAxNCkgKyB4aCAqIGg7XG4gICAgICAgIHdbaisrXSA9IGwgJiAweGZmZmZmZmY7XG4gICAgfVxuICAgIHJldHVybiBjO1xufVxuaWYgKGpfbG0gJiYgdHlwZW9mIG5hdmlnYXRvciA9PT0gXCJvYmplY3RcIiAmJiBuYXZpZ2F0b3IuYXBwTmFtZSA9PSBcIk1pY3Jvc29mdCBJbnRlcm5ldCBFeHBsb3JlclwiKSB7XG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTI7XG4gICAgZGJpdHMgPSAzMDtcbn1cbmVsc2UgaWYgKGpfbG0gJiYgdHlwZW9mIG5hdmlnYXRvciA9PT0gXCJvYmplY3RcIiAmJiBuYXZpZ2F0b3IuYXBwTmFtZSAhPSBcIk5ldHNjYXBlXCIpIHtcbiAgICBCaWdJbnRlZ2VyLnByb3RvdHlwZS5hbSA9IGFtMTtcbiAgICBkYml0cyA9IDI2O1xufVxuZWxzZSB7XG4gICAgLy8gTW96aWxsYS9OZXRzY2FwZSBzZWVtcyB0byBwcmVmZXIgYW0zXG4gICAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTM7XG4gICAgZGJpdHMgPSAyODtcbn1cbkJpZ0ludGVnZXIucHJvdG90eXBlLkRCID0gZGJpdHM7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5ETSA9ICgxIDw8IGRiaXRzKSAtIDE7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5EViA9IDEgPDwgZGJpdHM7XG52YXIgQklfRlAgPSA1MjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLkZWID0gTWF0aC5wb3coMiwgQklfRlApO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRjEgPSBCSV9GUCAtIGRiaXRzO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRjIgPSAyICogZGJpdHMgLSBCSV9GUDtcbi8vIERpZ2l0IGNvbnZlcnNpb25zXG52YXIgQklfUk0gPSBcIjAxMjM0NTY3ODlhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5elwiO1xudmFyIEJJX1JDID0gbmV3IEFycmF5KCk7XG52YXIgcnIsIHZ2O1xucnIgPSBcIjBcIi5jaGFyQ29kZUF0KDApO1xuZm9yICh2diA9IDA7IHZ2IDw9IDk7ICsrdnYpXG4gICAgQklfUkNbcnIrK10gPSB2djtcbnJyID0gXCJhXCIuY2hhckNvZGVBdCgwKTtcbmZvciAodnYgPSAxMDsgdnYgPCAzNjsgKyt2dilcbiAgICBCSV9SQ1tycisrXSA9IHZ2O1xucnIgPSBcIkFcIi5jaGFyQ29kZUF0KDApO1xuZm9yICh2diA9IDEwOyB2diA8IDM2OyArK3Z2KVxuICAgIEJJX1JDW3JyKytdID0gdnY7XG5mdW5jdGlvbiBpbnQyY2hhcihuKSB7XG4gICAgcmV0dXJuIEJJX1JNLmNoYXJBdChuKTtcbn1cbmZ1bmN0aW9uIGludEF0KHMsIGkpIHtcbiAgICB2YXIgYyA9IEJJX1JDW3MuY2hhckNvZGVBdChpKV07XG4gICAgcmV0dXJuIGMgPT0gbnVsbCA/IC0xIDogYztcbn1cbi8vIChwcm90ZWN0ZWQpIGNvcHkgdGhpcyB0byByXG5mdW5jdGlvbiBibnBDb3B5VG8ocikge1xuICAgIGZvciAodmFyIGkgPSB0aGlzLnQgLSAxOyBpID49IDA7IC0taSlcbiAgICAgICAgcltpXSA9IHRoaXNbaV07XG4gICAgci50ID0gdGhpcy50O1xuICAgIHIucyA9IHRoaXMucztcbn1cbi8vIChwcm90ZWN0ZWQpIHNldCBmcm9tIGludGVnZXIgdmFsdWUgeCwgLURWIDw9IHggPCBEVlxuZnVuY3Rpb24gYm5wRnJvbUludCh4KSB7XG4gICAgdGhpcy50ID0gMTtcbiAgICB0aGlzLnMgPSB4IDwgMCA/IC0xIDogMDtcbiAgICBpZiAoeCA+IDApIHtcbiAgICAgICAgdGhpc1swXSA9IHg7XG4gICAgfVxuICAgIGVsc2UgaWYgKHggPCAtMSkge1xuICAgICAgICB0aGlzWzBdID0geCArIERWO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhpcy50ID0gMDtcbiAgICB9XG59XG4vLyByZXR1cm4gYmlnaW50IGluaXRpYWxpemVkIHRvIHZhbHVlXG5mdW5jdGlvbiBuYnYoaSkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgci5mcm9tSW50KGkpO1xuICAgIHJldHVybiByO1xufVxuLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gc3RyaW5nIGFuZCByYWRpeFxuZnVuY3Rpb24gYm5wRnJvbVN0cmluZyhzLCBiKSB7XG4gICAgdmFyIGs7XG4gICAgaWYgKGIgPT0gMTYpIHtcbiAgICAgICAgayA9IDQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGIgPT0gOCkge1xuICAgICAgICBrID0gMztcbiAgICB9XG4gICAgZWxzZSBpZiAoYiA9PSAyNTYpIHtcbiAgICAgICAgayA9IDg7XG4gICAgfSAvLyBieXRlIGFycmF5XG4gICAgZWxzZSBpZiAoYiA9PSAyKSB7XG4gICAgICAgIGsgPSAxO1xuICAgIH1cbiAgICBlbHNlIGlmIChiID09IDMyKSB7XG4gICAgICAgIGsgPSA1O1xuICAgIH1cbiAgICBlbHNlIGlmIChiID09IDQpIHtcbiAgICAgICAgayA9IDI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aGlzLmZyb21SYWRpeChzLCBiKTtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnQgPSAwO1xuICAgIHRoaXMucyA9IDA7XG4gICAgdmFyIGkgPSBzLmxlbmd0aCwgbWkgPSBmYWxzZSwgc2ggPSAwO1xuICAgIHdoaWxlICgtLWkgPj0gMCkge1xuICAgICAgICB2YXIgeCA9IGsgPT0gOCA/IHNbaV0gJiAweGZmIDogaW50QXQocywgaSk7XG4gICAgICAgIGlmICh4IDwgMCkge1xuICAgICAgICAgICAgaWYgKHMuY2hhckF0KGkpID09IFwiLVwiKVxuICAgICAgICAgICAgICAgIG1pID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIG1pID0gZmFsc2U7XG4gICAgICAgIGlmIChzaCA9PSAwKSB7XG4gICAgICAgICAgICB0aGlzW3RoaXMudCsrXSA9IHg7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc2ggKyBrID4gdGhpcy5EQikge1xuICAgICAgICAgICAgdGhpc1t0aGlzLnQgLSAxXSB8PSAoeCAmICgoMSA8PCAodGhpcy5EQiAtIHNoKSkgLSAxKSkgPDwgc2g7XG4gICAgICAgICAgICB0aGlzW3RoaXMudCsrXSA9IHggPj4gKHRoaXMuREIgLSBzaCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzW3RoaXMudCAtIDFdIHw9IHggPDwgc2g7XG4gICAgICAgIH1cbiAgICAgICAgc2ggKz0gaztcbiAgICAgICAgaWYgKHNoID49IHRoaXMuREIpXG4gICAgICAgICAgICBzaCAtPSB0aGlzLkRCO1xuICAgIH1cbiAgICBpZiAoayA9PSA4ICYmIChzWzBdICYgMHg4MCkgIT0gMCkge1xuICAgICAgICB0aGlzLnMgPSAtMTtcbiAgICAgICAgaWYgKHNoID4gMClcbiAgICAgICAgICAgIHRoaXNbdGhpcy50IC0gMV0gfD0gKCgxIDw8ICh0aGlzLkRCIC0gc2gpKSAtIDEpIDw8IHNoO1xuICAgIH1cbiAgICB0aGlzLmNsYW1wKCk7XG4gICAgaWYgKG1pKVxuICAgICAgICBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8odGhpcywgdGhpcyk7XG59XG4vLyAocHJvdGVjdGVkKSBjbGFtcCBvZmYgZXhjZXNzIGhpZ2ggd29yZHNcbmZ1bmN0aW9uIGJucENsYW1wKCkge1xuICAgIHZhciBjID0gdGhpcy5zICYgdGhpcy5ETTtcbiAgICB3aGlsZSAodGhpcy50ID4gMCAmJiB0aGlzW3RoaXMudCAtIDFdID09IGMpXG4gICAgICAgIC0tdGhpcy50O1xufVxuLy8gKHB1YmxpYykgcmV0dXJuIHN0cmluZyByZXByZXNlbnRhdGlvbiBpbiBnaXZlbiByYWRpeFxuZnVuY3Rpb24gYm5Ub1N0cmluZyhiKSB7XG4gICAgaWYgKHRoaXMucyA8IDApXG4gICAgICAgIHJldHVybiBcIi1cIiArIHRoaXMubmVnYXRlKCkudG9TdHJpbmcoYik7XG4gICAgdmFyIGs7XG4gICAgaWYgKGIgPT0gMTYpIHtcbiAgICAgICAgayA9IDQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKGIgPT0gOCkge1xuICAgICAgICBrID0gMztcbiAgICB9XG4gICAgZWxzZSBpZiAoYiA9PSAyKSB7XG4gICAgICAgIGsgPSAxO1xuICAgIH1cbiAgICBlbHNlIGlmIChiID09IDMyKSB7XG4gICAgICAgIGsgPSA1O1xuICAgIH1cbiAgICBlbHNlIGlmIChiID09IDQpIHtcbiAgICAgICAgayA9IDI7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhpcy50b1JhZGl4KGIpO1xuICAgIH1cbiAgICB2YXIga20gPSAoMSA8PCBrKSAtIDEsIGQsIG0gPSBmYWxzZSwgciA9IFwiXCIsIGkgPSB0aGlzLnQ7XG4gICAgdmFyIHAgPSB0aGlzLkRCIC0gKChpICogdGhpcy5EQikgJSBrKTtcbiAgICBpZiAoaS0tID4gMCkge1xuICAgICAgICBpZiAocCA8IHRoaXMuREIgJiYgKGQgPSB0aGlzW2ldID4+IHApID4gMCkge1xuICAgICAgICAgICAgbSA9IHRydWU7XG4gICAgICAgICAgICByID0gaW50MmNoYXIoZCk7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKGkgPj0gMCkge1xuICAgICAgICAgICAgaWYgKHAgPCBrKSB7XG4gICAgICAgICAgICAgICAgZCA9ICh0aGlzW2ldICYgKCgxIDw8IHApIC0gMSkpIDw8IChrIC0gcCk7XG4gICAgICAgICAgICAgICAgZCB8PSB0aGlzWy0taV0gPj4gKHAgKz0gdGhpcy5EQiAtIGspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgZCA9ICh0aGlzW2ldID4+IChwIC09IGspKSAmIGttO1xuICAgICAgICAgICAgICAgIGlmIChwIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcCArPSB0aGlzLkRCO1xuICAgICAgICAgICAgICAgICAgICAtLWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGQgPiAwKVxuICAgICAgICAgICAgICAgIG0gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKG0pXG4gICAgICAgICAgICAgICAgciArPSBpbnQyY2hhcihkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbSA/IHIgOiBcIjBcIjtcbn1cbi8vIChwdWJsaWMpIC10aGlzXG5mdW5jdGlvbiBibk5lZ2F0ZSgpIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLCByKTtcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHx0aGlzfFxuZnVuY3Rpb24gYm5BYnMoKSB7XG4gICAgcmV0dXJuIHRoaXMucyA8IDAgPyB0aGlzLm5lZ2F0ZSgpIDogdGhpcztcbn1cbi8vIChwdWJsaWMpIHJldHVybiArIGlmIHRoaXMgPiBhLCAtIGlmIHRoaXMgPCBhLCAwIGlmIGVxdWFsXG5mdW5jdGlvbiBibkNvbXBhcmVUbyhhKSB7XG4gICAgdmFyIHIgPSB0aGlzLnMgLSBhLnM7XG4gICAgaWYgKHIgIT0gMClcbiAgICAgICAgcmV0dXJuIHI7XG4gICAgdmFyIGkgPSB0aGlzLnQ7XG4gICAgciA9IGkgLSBhLnQ7XG4gICAgaWYgKHIgIT0gMClcbiAgICAgICAgcmV0dXJuIHRoaXMucyA8IDAgPyAtciA6IHI7XG4gICAgd2hpbGUgKC0taSA+PSAwKVxuICAgICAgICBpZiAoKHIgPSB0aGlzW2ldIC0gYVtpXSkgIT0gMClcbiAgICAgICAgICAgIHJldHVybiByO1xuICAgIHJldHVybiAwO1xufVxuLy8gcmV0dXJucyBiaXQgbGVuZ3RoIG9mIHRoZSBpbnRlZ2VyIHhcbmZ1bmN0aW9uIG5iaXRzKHgpIHtcbiAgICB2YXIgciA9IDEsIHQ7XG4gICAgaWYgKCh0ID0geCA+Pj4gMTYpICE9IDApIHtcbiAgICAgICAgeCA9IHQ7XG4gICAgICAgIHIgKz0gMTY7XG4gICAgfVxuICAgIGlmICgodCA9IHggPj4gOCkgIT0gMCkge1xuICAgICAgICB4ID0gdDtcbiAgICAgICAgciArPSA4O1xuICAgIH1cbiAgICBpZiAoKHQgPSB4ID4+IDQpICE9IDApIHtcbiAgICAgICAgeCA9IHQ7XG4gICAgICAgIHIgKz0gNDtcbiAgICB9XG4gICAgaWYgKCh0ID0geCA+PiAyKSAhPSAwKSB7XG4gICAgICAgIHggPSB0O1xuICAgICAgICByICs9IDI7XG4gICAgfVxuICAgIGlmICgodCA9IHggPj4gMSkgIT0gMCkge1xuICAgICAgICB4ID0gdDtcbiAgICAgICAgciArPSAxO1xuICAgIH1cbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHJldHVybiB0aGUgbnVtYmVyIG9mIGJpdHMgaW4gXCJ0aGlzXCJcbmZ1bmN0aW9uIGJuQml0TGVuZ3RoKCkge1xuICAgIGlmICh0aGlzLnQgPD0gMClcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgcmV0dXJuIHRoaXMuREIgKiAodGhpcy50IC0gMSkgKyBuYml0cyh0aGlzW3RoaXMudCAtIDFdIF4gKHRoaXMucyAmIHRoaXMuRE0pKTtcbn1cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzIDw8IG4qREJcbmZ1bmN0aW9uIGJucERMU2hpZnRUbyhuLCByKSB7XG4gICAgdmFyIGk7XG4gICAgZm9yIChpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpXG4gICAgICAgIHJbaSArIG5dID0gdGhpc1tpXTtcbiAgICBmb3IgKGkgPSBuIC0gMTsgaSA+PSAwOyAtLWkpXG4gICAgICAgIHJbaV0gPSAwO1xuICAgIHIudCA9IHRoaXMudCArIG47XG4gICAgci5zID0gdGhpcy5zO1xufVxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gbipEQlxuZnVuY3Rpb24gYm5wRFJTaGlmdFRvKG4sIHIpIHtcbiAgICBmb3IgKHZhciBpID0gbjsgaSA8IHRoaXMudDsgKytpKVxuICAgICAgICByW2kgLSBuXSA9IHRoaXNbaV07XG4gICAgci50ID0gTWF0aC5tYXgodGhpcy50IC0gbiwgMCk7XG4gICAgci5zID0gdGhpcy5zO1xufVxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPDwgblxuZnVuY3Rpb24gYm5wTFNoaWZ0VG8obiwgcikge1xuICAgIHZhciBicyA9IG4gJSB0aGlzLkRCO1xuICAgIHZhciBjYnMgPSB0aGlzLkRCIC0gYnM7XG4gICAgdmFyIGJtID0gKDEgPDwgY2JzKSAtIDE7XG4gICAgdmFyIGRzID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQiksIGMgPSAodGhpcy5zIDw8IGJzKSAmIHRoaXMuRE0sIGk7XG4gICAgZm9yIChpID0gdGhpcy50IC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgICAgcltpICsgZHMgKyAxXSA9ICh0aGlzW2ldID4+IGNicykgfCBjO1xuICAgICAgICBjID0gKHRoaXNbaV0gJiBibSkgPDwgYnM7XG4gICAgfVxuICAgIGZvciAoaSA9IGRzIC0gMTsgaSA+PSAwOyAtLWkpXG4gICAgICAgIHJbaV0gPSAwO1xuICAgIHJbZHNdID0gYztcbiAgICByLnQgPSB0aGlzLnQgKyBkcyArIDE7XG4gICAgci5zID0gdGhpcy5zO1xuICAgIHIuY2xhbXAoKTtcbn1cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzID4+IG5cbmZ1bmN0aW9uIGJucFJTaGlmdFRvKG4sIHIpIHtcbiAgICByLnMgPSB0aGlzLnM7XG4gICAgdmFyIGRzID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQik7XG4gICAgaWYgKGRzID49IHRoaXMudCkge1xuICAgICAgICByLnQgPSAwO1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBicyA9IG4gJSB0aGlzLkRCO1xuICAgIHZhciBjYnMgPSB0aGlzLkRCIC0gYnM7XG4gICAgdmFyIGJtID0gKDEgPDwgYnMpIC0gMTtcbiAgICByWzBdID0gdGhpc1tkc10gPj4gYnM7XG4gICAgZm9yICh2YXIgaSA9IGRzICsgMTsgaSA8IHRoaXMudDsgKytpKSB7XG4gICAgICAgIHJbaSAtIGRzIC0gMV0gfD0gKHRoaXNbaV0gJiBibSkgPDwgY2JzO1xuICAgICAgICByW2kgLSBkc10gPSB0aGlzW2ldID4+IGJzO1xuICAgIH1cbiAgICBpZiAoYnMgPiAwKVxuICAgICAgICByW3RoaXMudCAtIGRzIC0gMV0gfD0gKHRoaXMucyAmIGJtKSA8PCBjYnM7XG4gICAgci50ID0gdGhpcy50IC0gZHM7XG4gICAgci5jbGFtcCgpO1xufVxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgLSBhXG5mdW5jdGlvbiBibnBTdWJUbyhhLCByKSB7XG4gICAgdmFyIGkgPSAwLCBjID0gMCwgbSA9IE1hdGgubWluKGEudCwgdGhpcy50KTtcbiAgICB3aGlsZSAoaSA8IG0pIHtcbiAgICAgICAgYyArPSB0aGlzW2ldIC0gYVtpXTtcbiAgICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgfVxuICAgIGlmIChhLnQgPCB0aGlzLnQpIHtcbiAgICAgICAgYyAtPSBhLnM7XG4gICAgICAgIHdoaWxlIChpIDwgdGhpcy50KSB7XG4gICAgICAgICAgICBjICs9IHRoaXNbaV07XG4gICAgICAgICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgICAgIH1cbiAgICAgICAgYyArPSB0aGlzLnM7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjICs9IHRoaXMucztcbiAgICAgICAgd2hpbGUgKGkgPCBhLnQpIHtcbiAgICAgICAgICAgIGMgLT0gYVtpXTtcbiAgICAgICAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICAgICAgfVxuICAgICAgICBjIC09IGEucztcbiAgICB9XG4gICAgci5zID0gYyA8IDAgPyAtMSA6IDA7XG4gICAgaWYgKGMgPCAtMSkge1xuICAgICAgICByW2krK10gPSB0aGlzLkRWICsgYztcbiAgICB9XG4gICAgZWxzZSBpZiAoYyA+IDApXG4gICAgICAgIHJbaSsrXSA9IGM7XG4gICAgci50ID0gaTtcbiAgICByLmNsYW1wKCk7XG59XG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyAqIGEsIHIgIT0gdGhpcyxhIChIQUMgMTQuMTIpXG4vLyBcInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG5mdW5jdGlvbiBibnBNdWx0aXBseVRvKGEsIHIpIHtcbiAgICB2YXIgeCA9IHRoaXMuYWJzKCksIHkgPSBhLmFicygpO1xuICAgIHZhciBpID0geC50O1xuICAgIHIudCA9IGkgKyB5LnQ7XG4gICAgd2hpbGUgKC0taSA+PSAwKVxuICAgICAgICByW2ldID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgeS50OyArK2kpXG4gICAgICAgIHJbaSArIHgudF0gPSB4LmFtKDAsIHlbaV0sIHIsIGksIDAsIHgudCk7XG4gICAgci5zID0gMDtcbiAgICByLmNsYW1wKCk7XG4gICAgaWYgKHRoaXMucyAhPSBhLnMpXG4gICAgICAgIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLCByKTtcbn1cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzXjIsIHIgIT0gdGhpcyAoSEFDIDE0LjE2KVxuZnVuY3Rpb24gYm5wU3F1YXJlVG8ocikge1xuICAgIHZhciB4ID0gdGhpcy5hYnMoKTtcbiAgICB2YXIgaSA9IChyLnQgPSAyICogeC50KTtcbiAgICB3aGlsZSAoLS1pID49IDApXG4gICAgICAgIHJbaV0gPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCB4LnQgLSAxOyArK2kpIHtcbiAgICAgICAgdmFyIGMgPSB4LmFtKGksIHhbaV0sIHIsIDIgKiBpLCAwLCAxKTtcbiAgICAgICAgaWYgKChyW2kgKyB4LnRdICs9IHguYW0oaSArIDEsIDIgKiB4W2ldLCByLCAyICogaSArIDEsIGMsIHgudCAtIGkgLSAxKSkgPj0geC5EVikge1xuICAgICAgICAgICAgcltpICsgeC50XSAtPSB4LkRWO1xuICAgICAgICAgICAgcltpICsgeC50ICsgMV0gPSAxO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChyLnQgPiAwKVxuICAgICAgICByW3IudCAtIDFdICs9IHguYW0oaSwgeFtpXSwgciwgMiAqIGksIDAsIDEpO1xuICAgIHIucyA9IDA7XG4gICAgci5jbGFtcCgpO1xufVxuLy8gKHByb3RlY3RlZCkgZGl2aWRlIHRoaXMgYnkgbSwgcXVvdGllbnQgYW5kIHJlbWFpbmRlciB0byBxLCByIChIQUMgMTQuMjApXG4vLyByICE9IHEsIHRoaXMgIT0gbS4gIHEgb3IgciBtYXkgYmUgbnVsbC5cbmZ1bmN0aW9uIGJucERpdlJlbVRvKG0sIHEsIHIpIHtcbiAgICB2YXIgcG0gPSBtLmFicygpO1xuICAgIGlmIChwbS50IDw9IDApXG4gICAgICAgIHJldHVybjtcbiAgICB2YXIgcHQgPSB0aGlzLmFicygpO1xuICAgIGlmIChwdC50IDwgcG0udCkge1xuICAgICAgICBpZiAocSAhPSBudWxsKVxuICAgICAgICAgICAgcS5mcm9tSW50KDApO1xuICAgICAgICBpZiAociAhPSBudWxsKVxuICAgICAgICAgICAgdGhpcy5jb3B5VG8ocik7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKHIgPT0gbnVsbClcbiAgICAgICAgciA9IG5iaSgpO1xuICAgIHZhciB5ID0gbmJpKCksIHRzID0gdGhpcy5zLCBtcyA9IG0ucztcbiAgICB2YXIgbnNoID0gdGhpcy5EQiAtIG5iaXRzKHBtW3BtLnQgLSAxXSk7IC8vIG5vcm1hbGl6ZSBtb2R1bHVzXG4gICAgaWYgKG5zaCA+IDApIHtcbiAgICAgICAgcG0ubFNoaWZ0VG8obnNoLCB5KTtcbiAgICAgICAgcHQubFNoaWZ0VG8obnNoLCByKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHBtLmNvcHlUbyh5KTtcbiAgICAgICAgcHQuY29weVRvKHIpO1xuICAgIH1cbiAgICB2YXIgeXMgPSB5LnQ7XG4gICAgdmFyIHkwID0geVt5cyAtIDFdO1xuICAgIGlmICh5MCA9PSAwKVxuICAgICAgICByZXR1cm47XG4gICAgdmFyIHl0ID0geTAgKiAoMSA8PCB0aGlzLkYxKSArICh5cyA+IDEgPyB5W3lzIC0gMl0gPj4gdGhpcy5GMiA6IDApO1xuICAgIHZhciBkMSA9IHRoaXMuRlYgLyB5dCwgZDIgPSAoMSA8PCB0aGlzLkYxKSAvIHl0LCBlID0gMSA8PCB0aGlzLkYyO1xuICAgIHZhciBpID0gci50LCBqID0gaSAtIHlzLCB0ID0gcSA9PSBudWxsID8gbmJpKCkgOiBxO1xuICAgIHkuZGxTaGlmdFRvKGosIHQpO1xuICAgIGlmIChyLmNvbXBhcmVUbyh0KSA+PSAwKSB7XG4gICAgICAgIHJbci50KytdID0gMTtcbiAgICAgICAgci5zdWJUbyh0LCByKTtcbiAgICB9XG4gICAgQmlnSW50ZWdlci5PTkUuZGxTaGlmdFRvKHlzLCB0KTtcbiAgICB0LnN1YlRvKHksIHkpOyAvLyBcIm5lZ2F0aXZlXCIgeSBzbyB3ZSBjYW4gcmVwbGFjZSBzdWIgd2l0aCBhbSBsYXRlclxuICAgIHdoaWxlICh5LnQgPCB5cylcbiAgICAgICAgeVt5LnQrK10gPSAwO1xuICAgIHdoaWxlICgtLWogPj0gMCkge1xuICAgICAgICAvLyBFc3RpbWF0ZSBxdW90aWVudCBkaWdpdFxuICAgICAgICB2YXIgcWQgPSByWy0taV0gPT0geTAgPyB0aGlzLkRNIDogTWF0aC5mbG9vcihyW2ldICogZDEgKyAocltpIC0gMV0gKyBlKSAqIGQyKTtcbiAgICAgICAgaWYgKChyW2ldICs9IHkuYW0oMCwgcWQsIHIsIGosIDAsIHlzKSkgPCBxZCkge1xuICAgICAgICAgICAgLy8gVHJ5IGl0IG91dFxuICAgICAgICAgICAgeS5kbFNoaWZ0VG8oaiwgdCk7XG4gICAgICAgICAgICByLnN1YlRvKHQsIHIpO1xuICAgICAgICAgICAgd2hpbGUgKHJbaV0gPCAtLXFkKVxuICAgICAgICAgICAgICAgIHIuc3ViVG8odCwgcik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHEgIT0gbnVsbCkge1xuICAgICAgICByLmRyU2hpZnRUbyh5cywgcSk7XG4gICAgICAgIGlmICh0cyAhPSBtcylcbiAgICAgICAgICAgIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhxLCBxKTtcbiAgICB9XG4gICAgci50ID0geXM7XG4gICAgci5jbGFtcCgpO1xuICAgIGlmIChuc2ggPiAwKVxuICAgICAgICByLnJTaGlmdFRvKG5zaCwgcik7IC8vIERlbm9ybWFsaXplIHJlbWFpbmRlclxuICAgIGlmICh0cyA8IDApXG4gICAgICAgIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLCByKTtcbn1cbi8vIChwdWJsaWMpIHRoaXMgbW9kIGFcbmZ1bmN0aW9uIGJuTW9kKGEpIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYWJzKCkuZGl2UmVtVG8oYSwgbnVsbCwgcik7XG4gICAgaWYgKHRoaXMucyA8IDAgJiYgci5jb21wYXJlVG8oQmlnSW50ZWdlci5aRVJPKSA+IDApXG4gICAgICAgIGEuc3ViVG8ociwgcik7XG4gICAgcmV0dXJuIHI7XG59XG4vLyBNb2R1bGFyIHJlZHVjdGlvbiB1c2luZyBcImNsYXNzaWNcIiBhbGdvcml0aG1cbmZ1bmN0aW9uIENsYXNzaWMobSkge1xuICAgIHRoaXMubSA9IG07XG59XG5mdW5jdGlvbiBjQ29udmVydCh4KSB7XG4gICAgaWYgKHgucyA8IDAgfHwgeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSB7XG4gICAgICAgIHJldHVybiB4Lm1vZCh0aGlzLm0pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxufVxuZnVuY3Rpb24gY1JldmVydCh4KSB7XG4gICAgcmV0dXJuIHg7XG59XG5mdW5jdGlvbiBjUmVkdWNlKHgpIHtcbiAgICB4LmRpdlJlbVRvKHRoaXMubSwgbnVsbCwgeCk7XG59XG5mdW5jdGlvbiBjTXVsVG8oeCwgeSwgcikge1xuICAgIHgubXVsdGlwbHlUbyh5LCByKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbn1cbmZ1bmN0aW9uIGNTcXJUbyh4LCByKSB7XG4gICAgeC5zcXVhcmVUbyhyKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbn1cbkNsYXNzaWMucHJvdG90eXBlLmNvbnZlcnQgPSBjQ29udmVydDtcbkNsYXNzaWMucHJvdG90eXBlLnJldmVydCA9IGNSZXZlcnQ7XG5DbGFzc2ljLnByb3RvdHlwZS5yZWR1Y2UgPSBjUmVkdWNlO1xuQ2xhc3NpYy5wcm90b3R5cGUubXVsVG8gPSBjTXVsVG87XG5DbGFzc2ljLnByb3RvdHlwZS5zcXJUbyA9IGNTcXJUbztcbi8vIChwcm90ZWN0ZWQpIHJldHVybiBcIi0xL3RoaXMgJSAyXkRCXCI7IHVzZWZ1bCBmb3IgTW9udC4gcmVkdWN0aW9uXG4vLyBqdXN0aWZpY2F0aW9uOlxuLy8gICAgICAgICB4eSA9PSAxIChtb2QgbSlcbi8vICAgICAgICAgeHkgPSAgMStrbVxuLy8gICB4eSgyLXh5KSA9ICgxK2ttKSgxLWttKVxuLy8geFt5KDIteHkpXSA9IDEta14ybV4yXG4vLyB4W3koMi14eSldID09IDEgKG1vZCBtXjIpXG4vLyBpZiB5IGlzIDEveCBtb2QgbSwgdGhlbiB5KDIteHkpIGlzIDEveCBtb2QgbV4yXG4vLyBzaG91bGQgcmVkdWNlIHggYW5kIHkoMi14eSkgYnkgbV4yIGF0IGVhY2ggc3RlcCB0byBrZWVwIHNpemUgYm91bmRlZC5cbi8vIEpTIG11bHRpcGx5IFwib3ZlcmZsb3dzXCIgZGlmZmVyZW50bHkgZnJvbSBDL0MrKywgc28gY2FyZSBpcyBuZWVkZWQgaGVyZS5cbmZ1bmN0aW9uIGJucEludkRpZ2l0KCkge1xuICAgIGlmICh0aGlzLnQgPCAxKVxuICAgICAgICByZXR1cm4gMDtcbiAgICB2YXIgeCA9IHRoaXNbMF07XG4gICAgaWYgKCh4ICYgMSkgPT0gMClcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgdmFyIHkgPSB4ICYgMzsgLy8geSA9PSAxL3ggbW9kIDJeMlxuICAgIHkgPSAoeSAqICgyIC0gKHggJiAweGYpICogeSkpICYgMHhmOyAvLyB5ID09IDEveCBtb2QgMl40XG4gICAgeSA9ICh5ICogKDIgLSAoeCAmIDB4ZmYpICogeSkpICYgMHhmZjsgLy8geSA9PSAxL3ggbW9kIDJeOFxuICAgIHkgPSAoeSAqICgyIC0gKCgoeCAmIDB4ZmZmZikgKiB5KSAmIDB4ZmZmZikpKSAmIDB4ZmZmZjsgLy8geSA9PSAxL3ggbW9kIDJeMTZcbiAgICAvLyBsYXN0IHN0ZXAgLSBjYWxjdWxhdGUgaW52ZXJzZSBtb2QgRFYgZGlyZWN0bHk7XG4gICAgLy8gYXNzdW1lcyAxNiA8IERCIDw9IDMyIGFuZCBhc3N1bWVzIGFiaWxpdHkgdG8gaGFuZGxlIDQ4LWJpdCBpbnRzXG4gICAgeSA9ICh5ICogKDIgLSAoKHggKiB5KSAlIHRoaXMuRFYpKSkgJSB0aGlzLkRWOyAvLyB5ID09IDEveCBtb2QgMl5kYml0c1xuICAgIC8vIHdlIHJlYWxseSB3YW50IHRoZSBuZWdhdGl2ZSBpbnZlcnNlLCBhbmQgLURWIDwgeSA8IERWXG4gICAgcmV0dXJuIHkgPiAwID8gdGhpcy5EViAtIHkgOiAteTtcbn1cbi8vIE1vbnRnb21lcnkgcmVkdWN0aW9uXG5mdW5jdGlvbiBNb250Z29tZXJ5KG0pIHtcbiAgICB0aGlzLm0gPSBtO1xuICAgIHRoaXMubXAgPSBtLmludkRpZ2l0KCk7XG4gICAgdGhpcy5tcGwgPSB0aGlzLm1wICYgMHg3ZmZmO1xuICAgIHRoaXMubXBoID0gdGhpcy5tcCA+PiAxNTtcbiAgICB0aGlzLnVtID0gKDEgPDwgKG0uREIgLSAxNSkpIC0gMTtcbiAgICB0aGlzLm10MiA9IDIgKiBtLnQ7XG59XG4vLyB4UiBtb2QgbVxuZnVuY3Rpb24gbW9udENvbnZlcnQoeCkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgeC5hYnMoKS5kbFNoaWZ0VG8odGhpcy5tLnQsIHIpO1xuICAgIHIuZGl2UmVtVG8odGhpcy5tLCBudWxsLCByKTtcbiAgICBpZiAoeC5zIDwgMCAmJiByLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLlpFUk8pID4gMClcbiAgICAgICAgdGhpcy5tLnN1YlRvKHIsIHIpO1xuICAgIHJldHVybiByO1xufVxuLy8geC9SIG1vZCBtXG5mdW5jdGlvbiBtb250UmV2ZXJ0KHgpIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHguY29weVRvKHIpO1xuICAgIHRoaXMucmVkdWNlKHIpO1xuICAgIHJldHVybiByO1xufVxuLy8geCA9IHgvUiBtb2QgbSAoSEFDIDE0LjMyKVxuZnVuY3Rpb24gbW9udFJlZHVjZSh4KSB7XG4gICAgd2hpbGUgKHgudCA8PSB0aGlzLm10MilcbiAgICAgICAgLy8gcGFkIHggc28gYW0gaGFzIGVub3VnaCByb29tIGxhdGVyXG4gICAgICAgIHhbeC50KytdID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubS50OyArK2kpIHtcbiAgICAgICAgLy8gZmFzdGVyIHdheSBvZiBjYWxjdWxhdGluZyB1MCA9IHhbaV0qbXAgbW9kIERWXG4gICAgICAgIHZhciBqID0geFtpXSAmIDB4N2ZmZjtcbiAgICAgICAgdmFyIHUwID0gKGogKiB0aGlzLm1wbCArICgoKGogKiB0aGlzLm1waCArICh4W2ldID4+IDE1KSAqIHRoaXMubXBsKSAmIHRoaXMudW0pIDw8IDE1KSkgJiB4LkRNO1xuICAgICAgICAvLyB1c2UgYW0gdG8gY29tYmluZSB0aGUgbXVsdGlwbHktc2hpZnQtYWRkIGludG8gb25lIGNhbGxcbiAgICAgICAgaiA9IGkgKyB0aGlzLm0udDtcbiAgICAgICAgeFtqXSArPSB0aGlzLm0uYW0oMCwgdTAsIHgsIGksIDAsIHRoaXMubS50KTtcbiAgICAgICAgLy8gcHJvcGFnYXRlIGNhcnJ5XG4gICAgICAgIHdoaWxlICh4W2pdID49IHguRFYpIHtcbiAgICAgICAgICAgIHhbal0gLT0geC5EVjtcbiAgICAgICAgICAgIHhbKytqXSsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIHguY2xhbXAoKTtcbiAgICB4LmRyU2hpZnRUbyh0aGlzLm0udCwgeCk7XG4gICAgaWYgKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMClcbiAgICAgICAgeC5zdWJUbyh0aGlzLm0sIHgpO1xufVxuLy8gciA9IFwieF4yL1IgbW9kIG1cIjsgeCAhPSByXG5mdW5jdGlvbiBtb250U3FyVG8oeCwgcikge1xuICAgIHguc3F1YXJlVG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG59XG4vLyByID0gXCJ4eS9SIG1vZCBtXCI7IHgseSAhPSByXG5mdW5jdGlvbiBtb250TXVsVG8oeCwgeSwgcikge1xuICAgIHgubXVsdGlwbHlUbyh5LCByKTtcbiAgICB0aGlzLnJlZHVjZShyKTtcbn1cbk1vbnRnb21lcnkucHJvdG90eXBlLmNvbnZlcnQgPSBtb250Q29udmVydDtcbk1vbnRnb21lcnkucHJvdG90eXBlLnJldmVydCA9IG1vbnRSZXZlcnQ7XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5yZWR1Y2UgPSBtb250UmVkdWNlO1xuTW9udGdvbWVyeS5wcm90b3R5cGUubXVsVG8gPSBtb250TXVsVG87XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5zcXJUbyA9IG1vbnRTcXJUbztcbi8vIChwcm90ZWN0ZWQpIHRydWUgaWZmIHRoaXMgaXMgZXZlblxuZnVuY3Rpb24gYm5wSXNFdmVuKCkge1xuICAgIHJldHVybiAodGhpcy50ID4gMCA/IHRoaXNbMF0gJiAxIDogdGhpcy5zKSA9PSAwO1xufVxuLy8gKHByb3RlY3RlZCkgdGhpc15lLCBlIDwgMl4zMiwgZG9pbmcgc3FyIGFuZCBtdWwgd2l0aCBcInJcIiAoSEFDIDE0Ljc5KVxuZnVuY3Rpb24gYm5wRXhwKGUsIHopIHtcbiAgICBpZiAoZSA+IDB4ZmZmZmZmZmYgfHwgZSA8IDEpXG4gICAgICAgIHJldHVybiBCaWdJbnRlZ2VyLk9ORTtcbiAgICB2YXIgciA9IG5iaSgpLCByMiA9IG5iaSgpLCBnID0gei5jb252ZXJ0KHRoaXMpLCBpID0gbmJpdHMoZSkgLSAxO1xuICAgIGcuY29weVRvKHIpO1xuICAgIHdoaWxlICgtLWkgPj0gMCkge1xuICAgICAgICB6LnNxclRvKHIsIHIyKTtcbiAgICAgICAgaWYgKChlICYgKDEgPDwgaSkpID4gMCkge1xuICAgICAgICAgICAgei5tdWxUbyhyMiwgZywgcik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgdCA9IHI7XG4gICAgICAgICAgICByID0gcjI7XG4gICAgICAgICAgICByMiA9IHQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHoucmV2ZXJ0KHIpO1xufVxuLy8gKHB1YmxpYykgdGhpc15lICUgbSwgMCA8PSBlIDwgMl4zMlxuZnVuY3Rpb24gYm5Nb2RQb3dJbnQoZSwgbSkge1xuICAgIHZhciB6O1xuICAgIGlmIChlIDwgMjU2IHx8IG0uaXNFdmVuKCkpXG4gICAgICAgIHogPSBuZXcgQ2xhc3NpYyhtKTtcbiAgICBlbHNlXG4gICAgICAgIHogPSBuZXcgTW9udGdvbWVyeShtKTtcbiAgICByZXR1cm4gdGhpcy5leHAoZSwgeik7XG59XG4vLyBwcm90ZWN0ZWRcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvcHlUbyA9IGJucENvcHlUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21JbnQgPSBibnBGcm9tSW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVN0cmluZyA9IGJucEZyb21TdHJpbmc7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jbGFtcCA9IGJucENsYW1wO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGxTaGlmdFRvID0gYm5wRExTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZHJTaGlmdFRvID0gYm5wRFJTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubFNoaWZ0VG8gPSBibnBMU2hpZnRUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLnJTaGlmdFRvID0gYm5wUlNoaWZ0VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJUbyA9IGJucFN1YlRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlUbyA9IGJucE11bHRpcGx5VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zcXVhcmVUbyA9IGJucFNxdWFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2UmVtVG8gPSBibnBEaXZSZW1UbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmludkRpZ2l0ID0gYm5wSW52RGlnaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBibnBJc0V2ZW47XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5leHAgPSBibnBFeHA7XG4vLyBwdWJsaWNcbkJpZ0ludGVnZXIucHJvdG90eXBlLnRvU3RyaW5nID0gYm5Ub1N0cmluZztcbkJpZ0ludGVnZXIucHJvdG90eXBlLm5lZ2F0ZSA9IGJuTmVnYXRlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYWJzID0gYm5BYnM7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jb21wYXJlVG8gPSBibkNvbXBhcmVUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmJpdExlbmd0aCA9IGJuQml0TGVuZ3RoO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kID0gYm5Nb2Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RQb3dJbnQgPSBibk1vZFBvd0ludDtcbi8vIFwiY29uc3RhbnRzXCJcbkJpZ0ludGVnZXIuWkVSTyA9IG5idigwKTtcbkJpZ0ludGVnZXIuT05FID0gbmJ2KDEpO1xuLy8gQ29weXJpZ2h0IChjKSAyMDA1LTIwMDkgIFRvbSBXdVxuLy8gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbi8vIFNlZSBcIkxJQ0VOU0VcIiBmb3IgZGV0YWlscy5cbi8vIEV4dGVuZGVkIEphdmFTY3JpcHQgQk4gZnVuY3Rpb25zLCByZXF1aXJlZCBmb3IgUlNBIHByaXZhdGUgb3BzLlxuLy8gVmVyc2lvbiAxLjE6IG5ldyBCaWdJbnRlZ2VyKFwiMFwiLCAxMCkgcmV0dXJucyBcInByb3BlclwiIHplcm9cbi8vIFZlcnNpb24gMS4yOiBzcXVhcmUoKSBBUEksIGlzUHJvYmFibGVQcmltZSBmaXhcbi8vIChwdWJsaWMpXG5mdW5jdGlvbiBibkNsb25lKCkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5jb3B5VG8ocik7XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgaW50ZWdlclxuZnVuY3Rpb24gYm5JbnRWYWx1ZSgpIHtcbiAgICBpZiAodGhpcy5zIDwgMCkge1xuICAgICAgICBpZiAodGhpcy50ID09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzWzBdIC0gdGhpcy5EVjtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0aGlzLnQgPT0gMClcbiAgICAgICAgICAgIHJldHVybiAtMTtcbiAgICB9XG4gICAgZWxzZSBpZiAodGhpcy50ID09IDEpIHtcbiAgICAgICAgcmV0dXJuIHRoaXNbMF07XG4gICAgfVxuICAgIGVsc2UgaWYgKHRoaXMudCA9PSAwKVxuICAgICAgICByZXR1cm4gMDtcbiAgICAvLyBhc3N1bWVzIDE2IDwgREIgPCAzMlxuICAgIHJldHVybiAoKHRoaXNbMV0gJiAoKDEgPDwgKDMyIC0gdGhpcy5EQikpIC0gMSkpIDw8IHRoaXMuREIpIHwgdGhpc1swXTtcbn1cbi8vIChwdWJsaWMpIHJldHVybiB2YWx1ZSBhcyBieXRlXG5mdW5jdGlvbiBibkJ5dGVWYWx1ZSgpIHtcbiAgICByZXR1cm4gdGhpcy50ID09IDAgPyB0aGlzLnMgOiAodGhpc1swXSA8PCAyNCkgPj4gMjQ7XG59XG4vLyAocHVibGljKSByZXR1cm4gdmFsdWUgYXMgc2hvcnQgKGFzc3VtZXMgREI+PTE2KVxuZnVuY3Rpb24gYm5TaG9ydFZhbHVlKCkge1xuICAgIHJldHVybiB0aGlzLnQgPT0gMCA/IHRoaXMucyA6ICh0aGlzWzBdIDw8IDE2KSA+PiAxNjtcbn1cbi8vIChwcm90ZWN0ZWQpIHJldHVybiB4IHMudC4gcl54IDwgRFZcbmZ1bmN0aW9uIGJucENodW5rU2l6ZShyKSB7XG4gICAgcmV0dXJuIE1hdGguZmxvb3IoKE1hdGguTE4yICogdGhpcy5EQikgLyBNYXRoLmxvZyhyKSk7XG59XG4vLyAocHVibGljKSAwIGlmIHRoaXMgPT0gMCwgMSBpZiB0aGlzID4gMFxuZnVuY3Rpb24gYm5TaWdOdW0oKSB7XG4gICAgaWYgKHRoaXMucyA8IDApIHtcbiAgICAgICAgcmV0dXJuIC0xO1xuICAgIH1cbiAgICBlbHNlIGlmICh0aGlzLnQgPD0gMCB8fCAodGhpcy50ID09IDEgJiYgdGhpc1swXSA8PSAwKSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiAxO1xuICAgIH1cbn1cbi8vIChwcm90ZWN0ZWQpIGNvbnZlcnQgdG8gcmFkaXggc3RyaW5nXG5mdW5jdGlvbiBibnBUb1JhZGl4KGIpIHtcbiAgICBpZiAoYiA9PSBudWxsKVxuICAgICAgICBiID0gMTA7XG4gICAgaWYgKHRoaXMuc2lnbnVtKCkgPT0gMCB8fCBiIDwgMiB8fCBiID4gMzYpXG4gICAgICAgIHJldHVybiBcIjBcIjtcbiAgICB2YXIgY3MgPSB0aGlzLmNodW5rU2l6ZShiKTtcbiAgICB2YXIgYSA9IE1hdGgucG93KGIsIGNzKTtcbiAgICB2YXIgZCA9IG5idihhKSwgeSA9IG5iaSgpLCB6ID0gbmJpKCksIHIgPSBcIlwiO1xuICAgIHRoaXMuZGl2UmVtVG8oZCwgeSwgeik7XG4gICAgd2hpbGUgKHkuc2lnbnVtKCkgPiAwKSB7XG4gICAgICAgIHIgPSAoYSArIHouaW50VmFsdWUoKSkudG9TdHJpbmcoYikuc3Vic3RyaW5nKDEpICsgcjtcbiAgICAgICAgeS5kaXZSZW1UbyhkLCB5LCB6KTtcbiAgICB9XG4gICAgcmV0dXJuIHouaW50VmFsdWUoKS50b1N0cmluZyhiKSArIHI7XG59XG4vLyAocHJvdGVjdGVkKSBjb252ZXJ0IGZyb20gcmFkaXggc3RyaW5nXG5mdW5jdGlvbiBibnBGcm9tUmFkaXgocywgYikge1xuICAgIHRoaXMuZnJvbUludCgwKTtcbiAgICBpZiAoYiA9PSBudWxsKVxuICAgICAgICBiID0gMTA7XG4gICAgdmFyIGNzID0gdGhpcy5jaHVua1NpemUoYik7XG4gICAgdmFyIGQgPSBNYXRoLnBvdyhiLCBjcyksIG1pID0gZmFsc2UsIGogPSAwLCB3ID0gMDtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIHggPSBpbnRBdChzLCBpKTtcbiAgICAgICAgaWYgKHggPCAwKSB7XG4gICAgICAgICAgICBpZiAocy5jaGFyQXQoaSkgPT0gXCItXCIgJiYgdGhpcy5zaWdudW0oKSA9PSAwKVxuICAgICAgICAgICAgICAgIG1pID0gdHJ1ZTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG4gICAgICAgIHcgPSBiICogdyArIHg7XG4gICAgICAgIGlmICgrK2ogPj0gY3MpIHtcbiAgICAgICAgICAgIHRoaXMuZE11bHRpcGx5KGQpO1xuICAgICAgICAgICAgdGhpcy5kQWRkT2Zmc2V0KHcsIDApO1xuICAgICAgICAgICAgaiA9IDA7XG4gICAgICAgICAgICB3ID0gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoaiA+IDApIHtcbiAgICAgICAgdGhpcy5kTXVsdGlwbHkoTWF0aC5wb3coYiwgaikpO1xuICAgICAgICB0aGlzLmRBZGRPZmZzZXQodywgMCk7XG4gICAgfVxuICAgIGlmIChtaSlcbiAgICAgICAgQmlnSW50ZWdlci5aRVJPLnN1YlRvKHRoaXMsIHRoaXMpO1xufVxuLy8gKHByb3RlY3RlZCkgYWx0ZXJuYXRlIGNvbnN0cnVjdG9yXG4vLyB0dXRhbzogb24gZmlyc3QgaW52b2NhdGlvbjpcbi8vICAgICAgICBhID0gYml0bGVuZ3RoICgxMDI0KVxuLy8gICAgICAgIGIgPSBudW1iZXIgb2YgbWlsbGVyIHJhYmluIHRlc3QgKiAyXG4vLyAgICAgICAgYyA9IFNlY3VyZVJhbmRvbVxuLy8gICAgICAgb24gc2Vjb25kIGludm9jYXRpb246XG4vLyAgICAgICAgYSA9IGJpdGxlbmd0aCAoMTAyNClcbi8vICAgICAgICBiID0gU2VjdXJlUmFuZG9tXG4vLyAgICAgICAgYyA9PSB1bmRlZmluZWRcbmZ1bmN0aW9uIGJucEZyb21OdW1iZXIoYSwgYiwgYykge1xuICAgIGlmIChcIm51bWJlclwiID09IHR5cGVvZiBiKSB7XG4gICAgICAgIC8vIG5ldyBCaWdJbnRlZ2VyKGludCxpbnQsUk5HKVxuICAgICAgICBpZiAoYSA8IDIpIHtcbiAgICAgICAgICAgIHRoaXMuZnJvbUludCgxKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuZnJvbU51bWJlcihhLCBjKTtcbiAgICAgICAgICAgIGlmICghdGhpcy50ZXN0Qml0KGEgLSAxKSkge1xuICAgICAgICAgICAgICAgIC8vIGZvcmNlIE1TQiBzZXRcbiAgICAgICAgICAgICAgICB0aGlzLmJpdHdpc2VUbyhCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQoYSAtIDEpLCBvcF9vciwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodGhpcy5pc0V2ZW4oKSlcbiAgICAgICAgICAgICAgICB0aGlzLmRBZGRPZmZzZXQoMSwgMCk7IC8vIGZvcmNlIG9kZFxuICAgICAgICAgICAgd2hpbGUgKCF0aGlzLmlzUHJvYmFibGVQcmltZShiKSkge1xuICAgICAgICAgICAgICAgIHRoaXMuZEFkZE9mZnNldCgyLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5iaXRMZW5ndGgoKSA+IGEpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuc3ViVG8oQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KGEgLSAxKSwgdGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIC8vIG5ldyBCaWdJbnRlZ2VyKGludCxSTkcpXG4gICAgICAgIHZhciB4ID0gbmV3IEFycmF5KCksIHQgPSBhICYgNztcbiAgICAgICAgeC5sZW5ndGggPSAoYSA+PiAzKSArIDE7XG4gICAgICAgIGIubmV4dEJ5dGVzKHgpO1xuICAgICAgICBpZiAodCA+IDApXG4gICAgICAgICAgICB4WzBdICY9ICgxIDw8IHQpIC0gMTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgeFswXSA9IDA7XG4gICAgICAgIHRoaXMuZnJvbVN0cmluZyh4LCAyNTYpO1xuICAgIH1cbn1cbi8vIChwdWJsaWMpIGNvbnZlcnQgdG8gYmlnZW5kaWFuIGJ5dGUgYXJyYXlcbmZ1bmN0aW9uIGJuVG9CeXRlQXJyYXkoKSB7XG4gICAgdmFyIGkgPSB0aGlzLnQsIHIgPSBuZXcgQXJyYXkoKTtcbiAgICByWzBdID0gdGhpcy5zO1xuICAgIHZhciBwID0gdGhpcy5EQiAtICgoaSAqIHRoaXMuREIpICUgOCksIGQsIGsgPSAwO1xuICAgIGlmIChpLS0gPiAwKSB7XG4gICAgICAgIGlmIChwIDwgdGhpcy5EQiAmJiAoZCA9IHRoaXNbaV0gPj4gcCkgIT0gKHRoaXMucyAmIHRoaXMuRE0pID4+IHApIHtcbiAgICAgICAgICAgIHJbaysrXSA9IGQgfCAodGhpcy5zIDw8ICh0aGlzLkRCIC0gcCkpO1xuICAgICAgICB9XG4gICAgICAgIHdoaWxlIChpID49IDApIHtcbiAgICAgICAgICAgIGlmIChwIDwgOCkge1xuICAgICAgICAgICAgICAgIGQgPSAodGhpc1tpXSAmICgoMSA8PCBwKSAtIDEpKSA8PCAoOCAtIHApO1xuICAgICAgICAgICAgICAgIGQgfD0gdGhpc1stLWldID4+IChwICs9IHRoaXMuREIgLSA4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGQgPSAodGhpc1tpXSA+PiAocCAtPSA4KSkgJiAweGZmO1xuICAgICAgICAgICAgICAgIGlmIChwIDw9IDApIHtcbiAgICAgICAgICAgICAgICAgICAgcCArPSB0aGlzLkRCO1xuICAgICAgICAgICAgICAgICAgICAtLWk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKChkICYgMHg4MCkgIT0gMClcbiAgICAgICAgICAgICAgICBkIHw9IC0yNTY7XG4gICAgICAgICAgICBpZiAoayA9PSAwICYmICh0aGlzLnMgJiAweDgwKSAhPSAoZCAmIDB4ODApKVxuICAgICAgICAgICAgICAgICsraztcbiAgICAgICAgICAgIGlmIChrID4gMCB8fCBkICE9IHRoaXMucylcbiAgICAgICAgICAgICAgICByW2srK10gPSBkO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByO1xufVxuZnVuY3Rpb24gYm5FcXVhbHMoYSkge1xuICAgIHJldHVybiB0aGlzLmNvbXBhcmVUbyhhKSA9PSAwO1xufVxuZnVuY3Rpb24gYm5NaW4oYSkge1xuICAgIHJldHVybiB0aGlzLmNvbXBhcmVUbyhhKSA8IDAgPyB0aGlzIDogYTtcbn1cbmZ1bmN0aW9uIGJuTWF4KGEpIHtcbiAgICByZXR1cm4gdGhpcy5jb21wYXJlVG8oYSkgPiAwID8gdGhpcyA6IGE7XG59XG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyBvcCBhIChiaXR3aXNlKVxuZnVuY3Rpb24gYm5wQml0d2lzZVRvKGEsIG9wLCByKSB7XG4gICAgdmFyIGksIGYsIG0gPSBNYXRoLm1pbihhLnQsIHRoaXMudCk7XG4gICAgZm9yIChpID0gMDsgaSA8IG07ICsraSlcbiAgICAgICAgcltpXSA9IG9wKHRoaXNbaV0sIGFbaV0pO1xuICAgIGlmIChhLnQgPCB0aGlzLnQpIHtcbiAgICAgICAgZiA9IGEucyAmIHRoaXMuRE07XG4gICAgICAgIGZvciAoaSA9IG07IGkgPCB0aGlzLnQ7ICsraSlcbiAgICAgICAgICAgIHJbaV0gPSBvcCh0aGlzW2ldLCBmKTtcbiAgICAgICAgci50ID0gdGhpcy50O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZiA9IHRoaXMucyAmIHRoaXMuRE07XG4gICAgICAgIGZvciAoaSA9IG07IGkgPCBhLnQ7ICsraSlcbiAgICAgICAgICAgIHJbaV0gPSBvcChmLCBhW2ldKTtcbiAgICAgICAgci50ID0gYS50O1xuICAgIH1cbiAgICByLnMgPSBvcCh0aGlzLnMsIGEucyk7XG4gICAgci5jbGFtcCgpO1xufVxuLy8gKHB1YmxpYykgdGhpcyAmIGFcbmZ1bmN0aW9uIG9wX2FuZCh4LCB5KSB7XG4gICAgcmV0dXJuIHggJiB5O1xufVxuZnVuY3Rpb24gYm5BbmQoYSkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5iaXR3aXNlVG8oYSwgb3BfYW5kLCByKTtcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHRoaXMgfCBhXG5mdW5jdGlvbiBvcF9vcih4LCB5KSB7XG4gICAgcmV0dXJuIHggfCB5O1xufVxuZnVuY3Rpb24gYm5PcihhKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF9vciwgcik7XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSB0aGlzIF4gYVxuZnVuY3Rpb24gb3BfeG9yKHgsIHkpIHtcbiAgICByZXR1cm4geCBeIHk7XG59XG5mdW5jdGlvbiBiblhvcihhKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF94b3IsIHIpO1xuICAgIHJldHVybiByO1xufVxuLy8gKHB1YmxpYykgdGhpcyAmIH5hXG5mdW5jdGlvbiBvcF9hbmRub3QoeCwgeSkge1xuICAgIHJldHVybiB4ICYgfnk7XG59XG5mdW5jdGlvbiBibkFuZE5vdChhKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmJpdHdpc2VUbyhhLCBvcF9hbmRub3QsIHIpO1xuICAgIHJldHVybiByO1xufVxuLy8gKHB1YmxpYykgfnRoaXNcbmZ1bmN0aW9uIGJuTm90KCkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICAgICAgcltpXSA9IHRoaXMuRE0gJiB+dGhpc1tpXTtcbiAgICByLnQgPSB0aGlzLnQ7XG4gICAgci5zID0gfnRoaXMucztcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHRoaXMgPDwgblxuZnVuY3Rpb24gYm5TaGlmdExlZnQobikge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgaWYgKG4gPCAwKVxuICAgICAgICB0aGlzLnJTaGlmdFRvKC1uLCByKTtcbiAgICBlbHNlXG4gICAgICAgIHRoaXMubFNoaWZ0VG8obiwgcik7XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSB0aGlzID4+IG5cbmZ1bmN0aW9uIGJuU2hpZnRSaWdodChuKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICBpZiAobiA8IDApXG4gICAgICAgIHRoaXMubFNoaWZ0VG8oLW4sIHIpO1xuICAgIGVsc2VcbiAgICAgICAgdGhpcy5yU2hpZnRUbyhuLCByKTtcbiAgICByZXR1cm4gcjtcbn1cbi8vIHJldHVybiBpbmRleCBvZiBsb3dlc3QgMS1iaXQgaW4geCwgeCA8IDJeMzFcbmZ1bmN0aW9uIGxiaXQoeCkge1xuICAgIGlmICh4ID09IDApXG4gICAgICAgIHJldHVybiAtMTtcbiAgICB2YXIgciA9IDA7XG4gICAgaWYgKCh4ICYgMHhmZmZmKSA9PSAwKSB7XG4gICAgICAgIHggPj49IDE2O1xuICAgICAgICByICs9IDE2O1xuICAgIH1cbiAgICBpZiAoKHggJiAweGZmKSA9PSAwKSB7XG4gICAgICAgIHggPj49IDg7XG4gICAgICAgIHIgKz0gODtcbiAgICB9XG4gICAgaWYgKCh4ICYgMHhmKSA9PSAwKSB7XG4gICAgICAgIHggPj49IDQ7XG4gICAgICAgIHIgKz0gNDtcbiAgICB9XG4gICAgaWYgKCh4ICYgMykgPT0gMCkge1xuICAgICAgICB4ID4+PSAyO1xuICAgICAgICByICs9IDI7XG4gICAgfVxuICAgIGlmICgoeCAmIDEpID09IDApXG4gICAgICAgICsrcjtcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHJldHVybnMgaW5kZXggb2YgbG93ZXN0IDEtYml0IChvciAtMSBpZiBub25lKVxuZnVuY3Rpb24gYm5HZXRMb3dlc3RTZXRCaXQoKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICAgICAgaWYgKHRoaXNbaV0gIT0gMClcbiAgICAgICAgICAgIHJldHVybiBpICogdGhpcy5EQiArIGxiaXQodGhpc1tpXSk7XG4gICAgaWYgKHRoaXMucyA8IDApXG4gICAgICAgIHJldHVybiB0aGlzLnQgKiB0aGlzLkRCO1xuICAgIHJldHVybiAtMTtcbn1cbi8vIHJldHVybiBudW1iZXIgb2YgMSBiaXRzIGluIHhcbmZ1bmN0aW9uIGNiaXQoeCkge1xuICAgIHZhciByID0gMDtcbiAgICB3aGlsZSAoeCAhPSAwKSB7XG4gICAgICAgIHggJj0geCAtIDE7XG4gICAgICAgICsrcjtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSByZXR1cm4gbnVtYmVyIG9mIHNldCBiaXRzXG5mdW5jdGlvbiBibkJpdENvdW50KCkge1xuICAgIHZhciByID0gMCwgeCA9IHRoaXMucyAmIHRoaXMuRE07XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnQ7ICsraSlcbiAgICAgICAgciArPSBjYml0KHRoaXNbaV0gXiB4KTtcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHRydWUgaWZmIG50aCBiaXQgaXMgc2V0XG5mdW5jdGlvbiBiblRlc3RCaXQobikge1xuICAgIHZhciBqID0gTWF0aC5mbG9vcihuIC8gdGhpcy5EQik7XG4gICAgaWYgKGogPj0gdGhpcy50KVxuICAgICAgICByZXR1cm4gdGhpcy5zICE9IDA7XG4gICAgcmV0dXJuICh0aGlzW2pdICYgKDEgPDwgbiAlIHRoaXMuREIpKSAhPSAwO1xufVxuLy8gKHByb3RlY3RlZCkgdGhpcyBvcCAoMTw8bilcbmZ1bmN0aW9uIGJucENoYW5nZUJpdChuLCBvcCkge1xuICAgIHZhciByID0gQmlnSW50ZWdlci5PTkUuc2hpZnRMZWZ0KG4pO1xuICAgIHRoaXMuYml0d2lzZVRvKHIsIG9wLCByKTtcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHRoaXMgfCAoMTw8bilcbmZ1bmN0aW9uIGJuU2V0Qml0KG4pIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobiwgb3Bfb3IpO1xufVxuLy8gKHB1YmxpYykgdGhpcyAmIH4oMTw8bilcbmZ1bmN0aW9uIGJuQ2xlYXJCaXQobikge1xuICAgIHJldHVybiB0aGlzLmNoYW5nZUJpdChuLCBvcF9hbmRub3QpO1xufVxuLy8gKHB1YmxpYykgdGhpcyBeICgxPDxuKVxuZnVuY3Rpb24gYm5GbGlwQml0KG4pIHtcbiAgICByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobiwgb3BfeG9yKTtcbn1cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICsgYVxuZnVuY3Rpb24gYm5wQWRkVG8oYSwgcikge1xuICAgIHZhciBpID0gMCwgYyA9IDAsIG0gPSBNYXRoLm1pbihhLnQsIHRoaXMudCk7XG4gICAgd2hpbGUgKGkgPCBtKSB7XG4gICAgICAgIGMgKz0gdGhpc1tpXSArIGFbaV07XG4gICAgICAgIHJbaSsrXSA9IGMgJiB0aGlzLkRNO1xuICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgIH1cbiAgICBpZiAoYS50IDwgdGhpcy50KSB7XG4gICAgICAgIGMgKz0gYS5zO1xuICAgICAgICB3aGlsZSAoaSA8IHRoaXMudCkge1xuICAgICAgICAgICAgYyArPSB0aGlzW2ldO1xuICAgICAgICAgICAgcltpKytdID0gYyAmIHRoaXMuRE07XG4gICAgICAgICAgICBjID4+PSB0aGlzLkRCO1xuICAgICAgICB9XG4gICAgICAgIGMgKz0gdGhpcy5zO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYyArPSB0aGlzLnM7XG4gICAgICAgIHdoaWxlIChpIDwgYS50KSB7XG4gICAgICAgICAgICBjICs9IGFbaV07XG4gICAgICAgICAgICByW2krK10gPSBjICYgdGhpcy5ETTtcbiAgICAgICAgICAgIGMgPj49IHRoaXMuREI7XG4gICAgICAgIH1cbiAgICAgICAgYyArPSBhLnM7XG4gICAgfVxuICAgIHIucyA9IGMgPCAwID8gLTEgOiAwO1xuICAgIGlmIChjID4gMCkge1xuICAgICAgICByW2krK10gPSBjO1xuICAgIH1cbiAgICBlbHNlIGlmIChjIDwgLTEpXG4gICAgICAgIHJbaSsrXSA9IHRoaXMuRFYgKyBjO1xuICAgIHIudCA9IGk7XG4gICAgci5jbGFtcCgpO1xufVxuLy8gKHB1YmxpYykgdGhpcyArIGFcbmZ1bmN0aW9uIGJuQWRkKGEpIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuYWRkVG8oYSwgcik7XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSB0aGlzIC0gYVxuZnVuY3Rpb24gYm5TdWJ0cmFjdChhKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLnN1YlRvKGEsIHIpO1xuICAgIHJldHVybiByO1xufVxuLy8gKHB1YmxpYykgdGhpcyAqIGFcbmZ1bmN0aW9uIGJuTXVsdGlwbHkoYSkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5tdWx0aXBseVRvKGEsIHIpO1xuICAgIHJldHVybiByO1xufVxuLy8gKHB1YmxpYykgdGhpc14yXG5mdW5jdGlvbiBiblNxdWFyZSgpIHtcbiAgICB2YXIgciA9IG5iaSgpO1xuICAgIHRoaXMuc3F1YXJlVG8ocik7XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSB0aGlzIC8gYVxuZnVuY3Rpb24gYm5EaXZpZGUoYSkge1xuICAgIHZhciByID0gbmJpKCk7XG4gICAgdGhpcy5kaXZSZW1UbyhhLCByLCBudWxsKTtcbiAgICByZXR1cm4gcjtcbn1cbi8vIChwdWJsaWMpIHRoaXMgJSBhXG5mdW5jdGlvbiBiblJlbWFpbmRlcihhKSB7XG4gICAgdmFyIHIgPSBuYmkoKTtcbiAgICB0aGlzLmRpdlJlbVRvKGEsIG51bGwsIHIpO1xuICAgIHJldHVybiByO1xufVxuLy8gKHB1YmxpYykgW3RoaXMvYSx0aGlzJWFdXG5mdW5jdGlvbiBibkRpdmlkZUFuZFJlbWFpbmRlcihhKSB7XG4gICAgdmFyIHEgPSBuYmkoKSwgciA9IG5iaSgpO1xuICAgIHRoaXMuZGl2UmVtVG8oYSwgcSwgcik7XG4gICAgcmV0dXJuIG5ldyBBcnJheShxLCByKTtcbn1cbi8vIChwcm90ZWN0ZWQpIHRoaXMgKj0gbiwgdGhpcyA+PSAwLCAxIDwgbiA8IERWXG5mdW5jdGlvbiBibnBETXVsdGlwbHkobikge1xuICAgIHRoaXNbdGhpcy50XSA9IHRoaXMuYW0oMCwgbiAtIDEsIHRoaXMsIDAsIDAsIHRoaXMudCk7XG4gICAgKyt0aGlzLnQ7XG4gICAgdGhpcy5jbGFtcCgpO1xufVxuLy8gKHByb3RlY3RlZCkgdGhpcyArPSBuIDw8IHcgd29yZHMsIHRoaXMgPj0gMFxuZnVuY3Rpb24gYm5wREFkZE9mZnNldChuLCB3KSB7XG4gICAgaWYgKG4gPT0gMClcbiAgICAgICAgcmV0dXJuO1xuICAgIHdoaWxlICh0aGlzLnQgPD0gdylcbiAgICAgICAgdGhpc1t0aGlzLnQrK10gPSAwO1xuICAgIHRoaXNbd10gKz0gbjtcbiAgICB3aGlsZSAodGhpc1t3XSA+PSB0aGlzLkRWKSB7XG4gICAgICAgIHRoaXNbd10gLT0gdGhpcy5EVjtcbiAgICAgICAgaWYgKCsrdyA+PSB0aGlzLnQpXG4gICAgICAgICAgICB0aGlzW3RoaXMudCsrXSA9IDA7XG4gICAgICAgICsrdGhpc1t3XTtcbiAgICB9XG59XG4vLyBBIFwibnVsbFwiIHJlZHVjZXJcbmZ1bmN0aW9uIE51bGxFeHAoKSB7IH1cbmZ1bmN0aW9uIG5Ob3AoeCkge1xuICAgIHJldHVybiB4O1xufVxuZnVuY3Rpb24gbk11bFRvKHgsIHksIHIpIHtcbiAgICB4Lm11bHRpcGx5VG8oeSwgcik7XG59XG5mdW5jdGlvbiBuU3FyVG8oeCwgcikge1xuICAgIHguc3F1YXJlVG8ocik7XG59XG5OdWxsRXhwLnByb3RvdHlwZS5jb252ZXJ0ID0gbk5vcDtcbk51bGxFeHAucHJvdG90eXBlLnJldmVydCA9IG5Ob3A7XG5OdWxsRXhwLnByb3RvdHlwZS5tdWxUbyA9IG5NdWxUbztcbk51bGxFeHAucHJvdG90eXBlLnNxclRvID0gblNxclRvO1xuLy8gKHB1YmxpYykgdGhpc15lXG5mdW5jdGlvbiBiblBvdyhlKSB7XG4gICAgcmV0dXJuIHRoaXMuZXhwKGUsIG5ldyBOdWxsRXhwKCkpO1xufVxuLy8gKHByb3RlY3RlZCkgciA9IGxvd2VyIG4gd29yZHMgb2YgXCJ0aGlzICogYVwiLCBhLnQgPD0gblxuLy8gXCJ0aGlzXCIgc2hvdWxkIGJlIHRoZSBsYXJnZXIgb25lIGlmIGFwcHJvcHJpYXRlLlxuZnVuY3Rpb24gYm5wTXVsdGlwbHlMb3dlclRvKGEsIG4sIHIpIHtcbiAgICB2YXIgaSA9IE1hdGgubWluKHRoaXMudCArIGEudCwgbik7XG4gICAgci5zID0gMDsgLy8gYXNzdW1lcyBhLHRoaXMgPj0gMFxuICAgIHIudCA9IGk7XG4gICAgd2hpbGUgKGkgPiAwKVxuICAgICAgICByWy0taV0gPSAwO1xuICAgIHZhciBqO1xuICAgIGZvciAoaiA9IHIudCAtIHRoaXMudDsgaSA8IGo7ICsraSlcbiAgICAgICAgcltpICsgdGhpcy50XSA9IHRoaXMuYW0oMCwgYVtpXSwgciwgaSwgMCwgdGhpcy50KTtcbiAgICBmb3IgKGogPSBNYXRoLm1pbihhLnQsIG4pOyBpIDwgajsgKytpKVxuICAgICAgICB0aGlzLmFtKDAsIGFbaV0sIHIsIGksIDAsIG4gLSBpKTtcbiAgICByLmNsYW1wKCk7XG59XG4vLyAocHJvdGVjdGVkKSByID0gXCJ0aGlzICogYVwiIHdpdGhvdXQgbG93ZXIgbiB3b3JkcywgbiA+IDBcbi8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbmZ1bmN0aW9uIGJucE11bHRpcGx5VXBwZXJUbyhhLCBuLCByKSB7XG4gICAgLS1uO1xuICAgIHZhciBpID0gKHIudCA9IHRoaXMudCArIGEudCAtIG4pO1xuICAgIHIucyA9IDA7IC8vIGFzc3VtZXMgYSx0aGlzID49IDBcbiAgICB3aGlsZSAoLS1pID49IDApXG4gICAgICAgIHJbaV0gPSAwO1xuICAgIGZvciAoaSA9IE1hdGgubWF4KG4gLSB0aGlzLnQsIDApOyBpIDwgYS50OyArK2kpXG4gICAgICAgIHJbdGhpcy50ICsgaSAtIG5dID0gdGhpcy5hbShuIC0gaSwgYVtpXSwgciwgMCwgMCwgdGhpcy50ICsgaSAtIG4pO1xuICAgIHIuY2xhbXAoKTtcbiAgICByLmRyU2hpZnRUbygxLCByKTtcbn1cbi8vIEJhcnJldHQgbW9kdWxhciByZWR1Y3Rpb25cbmZ1bmN0aW9uIEJhcnJldHQobSkge1xuICAgIC8vIHNldHVwIEJhcnJldHRcbiAgICB0aGlzLnIyID0gbmJpKCk7XG4gICAgdGhpcy5xMyA9IG5iaSgpO1xuICAgIEJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbygyICogbS50LCB0aGlzLnIyKTtcbiAgICB0aGlzLm11ID0gdGhpcy5yMi5kaXZpZGUobSk7XG4gICAgdGhpcy5tID0gbTtcbn1cbmZ1bmN0aW9uIGJhcnJldHRDb252ZXJ0KHgpIHtcbiAgICBpZiAoeC5zIDwgMCB8fCB4LnQgPiAyICogdGhpcy5tLnQpIHtcbiAgICAgICAgcmV0dXJuIHgubW9kKHRoaXMubSk7XG4gICAgfVxuICAgIGVsc2UgaWYgKHguY29tcGFyZVRvKHRoaXMubSkgPCAwKSB7XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdmFyIHIgPSBuYmkoKTtcbiAgICAgICAgeC5jb3B5VG8ocik7XG4gICAgICAgIHRoaXMucmVkdWNlKHIpO1xuICAgICAgICByZXR1cm4gcjtcbiAgICB9XG59XG5mdW5jdGlvbiBiYXJyZXR0UmV2ZXJ0KHgpIHtcbiAgICByZXR1cm4geDtcbn1cbi8vIHggPSB4IG1vZCBtIChIQUMgMTQuNDIpXG5mdW5jdGlvbiBiYXJyZXR0UmVkdWNlKHgpIHtcbiAgICB4LmRyU2hpZnRUbyh0aGlzLm0udCAtIDEsIHRoaXMucjIpO1xuICAgIGlmICh4LnQgPiB0aGlzLm0udCArIDEpIHtcbiAgICAgICAgeC50ID0gdGhpcy5tLnQgKyAxO1xuICAgICAgICB4LmNsYW1wKCk7XG4gICAgfVxuICAgIHRoaXMubXUubXVsdGlwbHlVcHBlclRvKHRoaXMucjIsIHRoaXMubS50ICsgMSwgdGhpcy5xMyk7XG4gICAgdGhpcy5tLm11bHRpcGx5TG93ZXJUbyh0aGlzLnEzLCB0aGlzLm0udCArIDEsIHRoaXMucjIpO1xuICAgIHdoaWxlICh4LmNvbXBhcmVUbyh0aGlzLnIyKSA8IDApXG4gICAgICAgIHguZEFkZE9mZnNldCgxLCB0aGlzLm0udCArIDEpO1xuICAgIHguc3ViVG8odGhpcy5yMiwgeCk7XG4gICAgd2hpbGUgKHguY29tcGFyZVRvKHRoaXMubSkgPj0gMClcbiAgICAgICAgeC5zdWJUbyh0aGlzLm0sIHgpO1xufVxuLy8gciA9IHheMiBtb2QgbTsgeCAhPSByXG5mdW5jdGlvbiBiYXJyZXR0U3FyVG8oeCwgcikge1xuICAgIHguc3F1YXJlVG8ocik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG59XG4vLyByID0geCp5IG1vZCBtOyB4LHkgIT0gclxuZnVuY3Rpb24gYmFycmV0dE11bFRvKHgsIHksIHIpIHtcbiAgICB4Lm11bHRpcGx5VG8oeSwgcik7XG4gICAgdGhpcy5yZWR1Y2Uocik7XG59XG5CYXJyZXR0LnByb3RvdHlwZS5jb252ZXJ0ID0gYmFycmV0dENvbnZlcnQ7XG5CYXJyZXR0LnByb3RvdHlwZS5yZXZlcnQgPSBiYXJyZXR0UmV2ZXJ0O1xuQmFycmV0dC5wcm90b3R5cGUucmVkdWNlID0gYmFycmV0dFJlZHVjZTtcbkJhcnJldHQucHJvdG90eXBlLm11bFRvID0gYmFycmV0dE11bFRvO1xuQmFycmV0dC5wcm90b3R5cGUuc3FyVG8gPSBiYXJyZXR0U3FyVG87XG4vLyAocHVibGljKSB0aGlzXmUgJSBtIChIQUMgMTQuODUpXG5mdW5jdGlvbiBibk1vZFBvdyhlLCBtKSB7XG4gICAgLy8gd2Ugc3dpdGNoZWQgdG8gbGVlbW9ucyBiaWdpbnQgbGliIGZvciBtb2Rwb3csIGFzIHRoaXMgaXMgZmFzdGVyIG9uIHNhZmFyaSBicm93c2VycyAocmVkdWNlZCB0aGUgZGVjcnlwdGlvbiB0aW1lczogOXMgLT4gMyw0cylcbiAgICAvLyBUT0RPIGludHJvZHVjZSBzd2l0Y2ggZm9yIG90aGVyIGJyb3dzZXJzLCBhcyB0aGV5IGFyZSBzbG93ZXIgKGJ5IGZhY3RvciAwLjUpIGJlY2F1c2Ugb2YgdGhlIGNvbnZlcnNpb24gb3ZlcmhlYWRcbiAgICB2YXIgeEhleCA9IHRoaXMudG9TdHJpbmcoMTYpO1xuICAgIHZhciBlSGV4ID0gZS50b1N0cmluZygxNik7XG4gICAgdmFyIG1IZXggPSBtLnRvU3RyaW5nKDE2KTtcbiAgICB2YXIgcmVzdWx0ID0gcG93TW9kKHN0cjJiaWdJbnQoeEhleCwgMTYpLCBzdHIyYmlnSW50KGVIZXgsIDE2KSwgc3RyMmJpZ0ludChtSGV4LCAxNikpO1xuICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihiaWdJbnQyc3RyKHJlc3VsdCwgMTYpLCAxNik7XG4gICAgLy8gIHZhciBpID0gZS5iaXRMZW5ndGgoKSwgaywgciA9IG5idigxKSwgejtcbiAgICAvLyAgaWYoaSA8PSAwKSByZXR1cm4gcjtcbiAgICAvLyAgZWxzZSBpZihpIDwgMTgpIGsgPSAxO1xuICAgIC8vICBlbHNlIGlmKGkgPCA0OCkgayA9IDM7XG4gICAgLy8gIGVsc2UgaWYoaSA8IDE0NCkgayA9IDQ7XG4gICAgLy8gIGVsc2UgaWYoaSA8IDc2OCkgayA9IDU7XG4gICAgLy8gIGVsc2UgayA9IDY7XG4gICAgLy8gIGlmKGkgPCA4KVxuICAgIC8vICAgIHogPSBuZXcgQ2xhc3NpYyhtKTtcbiAgICAvLyAgZWxzZSBpZihtLmlzRXZlbigpKVxuICAgIC8vICAgIHogPSBuZXcgQmFycmV0dChtKTtcbiAgICAvLyAgZWxzZVxuICAgIC8vICAgIHogPSBuZXcgTW9udGdvbWVyeShtKTtcbiAgICAvL1xuICAgIC8vICAvLyBwcmVjb21wdXRhdGlvblxuICAgIC8vICB2YXIgZyA9IG5ldyBBcnJheSgpLCBuID0gMywgazEgPSBrLTEsIGttID0gKDE8PGspLTE7XG4gICAgLy8gIGdbMV0gPSB6LmNvbnZlcnQodGhpcyk7XG4gICAgLy8gIGlmKGsgPiAxKSB7XG4gICAgLy8gICAgdmFyIGcyID0gbmJpKCk7XG4gICAgLy8gICAgei5zcXJUbyhnWzFdLGcyKTtcbiAgICAvLyAgICB3aGlsZShuIDw9IGttKSB7XG4gICAgLy8gICAgICBnW25dID0gbmJpKCk7XG4gICAgLy8gICAgICB6Lm11bFRvKGcyLGdbbi0yXSxnW25dKTtcbiAgICAvLyAgICAgIG4gKz0gMjtcbiAgICAvLyAgICB9XG4gICAgLy8gIH1cbiAgICAvL1xuICAgIC8vICB2YXIgaiA9IGUudC0xLCB3LCBpczEgPSB0cnVlLCByMiA9IG5iaSgpLCB0O1xuICAgIC8vICBpID0gbmJpdHMoZVtqXSktMTtcbiAgICAvLyAgd2hpbGUoaiA+PSAwKSB7XG4gICAgLy8gICAgaWYoaSA+PSBrMSkgdyA9IChlW2pdPj4oaS1rMSkpJmttO1xuICAgIC8vICAgIGVsc2Uge1xuICAgIC8vICAgICAgdyA9IChlW2pdJigoMTw8KGkrMSkpLTEpKTw8KGsxLWkpO1xuICAgIC8vICAgICAgaWYoaiA+IDApIHcgfD0gZVtqLTFdPj4odGhpcy5EQitpLWsxKTtcbiAgICAvLyAgICB9XG4gICAgLy9cbiAgICAvLyAgICBuID0gaztcbiAgICAvLyAgICB3aGlsZSgodyYxKSA9PSAwKSB7IHcgPj49IDE7IC0tbjsgfVxuICAgIC8vICAgIGlmKChpIC09IG4pIDwgMCkgeyBpICs9IHRoaXMuREI7IC0tajsgfVxuICAgIC8vICAgIGlmKGlzMSkge1x0Ly8gcmV0ID09IDEsIGRvbid0IGJvdGhlciBzcXVhcmluZyBvciBtdWx0aXBseWluZyBpdFxuICAgIC8vICAgICAgZ1t3XS5jb3B5VG8ocik7XG4gICAgLy8gICAgICBpczEgPSBmYWxzZTtcbiAgICAvLyAgICB9XG4gICAgLy8gICAgZWxzZSB7XG4gICAgLy8gICAgICB3aGlsZShuID4gMSkgeyB6LnNxclRvKHIscjIpOyB6LnNxclRvKHIyLHIpOyBuIC09IDI7IH1cbiAgICAvLyAgICAgIGlmKG4gPiAwKSB6LnNxclRvKHIscjIpOyBlbHNlIHsgdCA9IHI7IHIgPSByMjsgcjIgPSB0OyB9XG4gICAgLy8gICAgICB6Lm11bFRvKHIyLGdbd10scik7XG4gICAgLy8gICAgfVxuICAgIC8vXG4gICAgLy8gICAgd2hpbGUoaiA+PSAwICYmIChlW2pdJigxPDxpKSkgPT0gMCkge1xuICAgIC8vICAgICAgei5zcXJUbyhyLHIyKTsgdCA9IHI7IHIgPSByMjsgcjIgPSB0O1xuICAgIC8vICAgICAgaWYoLS1pIDwgMCkgeyBpID0gdGhpcy5EQi0xOyAtLWo7IH1cbiAgICAvLyAgICB9XG4gICAgLy8gIH1cbiAgICAvLyAgcmV0dXJuIHoucmV2ZXJ0KHIpO1xufVxuLy8gKHB1YmxpYykgZ2NkKHRoaXMsYSkgKEhBQyAxNC41NClcbmZ1bmN0aW9uIGJuR0NEKGEpIHtcbiAgICB2YXIgeCA9IHRoaXMucyA8IDAgPyB0aGlzLm5lZ2F0ZSgpIDogdGhpcy5jbG9uZSgpO1xuICAgIHZhciB5ID0gYS5zIDwgMCA/IGEubmVnYXRlKCkgOiBhLmNsb25lKCk7XG4gICAgaWYgKHguY29tcGFyZVRvKHkpIDwgMCkge1xuICAgICAgICB2YXIgdCA9IHg7XG4gICAgICAgIHggPSB5O1xuICAgICAgICB5ID0gdDtcbiAgICB9XG4gICAgdmFyIGkgPSB4LmdldExvd2VzdFNldEJpdCgpLCBnID0geS5nZXRMb3dlc3RTZXRCaXQoKTtcbiAgICBpZiAoZyA8IDApXG4gICAgICAgIHJldHVybiB4O1xuICAgIGlmIChpIDwgZylcbiAgICAgICAgZyA9IGk7XG4gICAgaWYgKGcgPiAwKSB7XG4gICAgICAgIHguclNoaWZ0VG8oZywgeCk7XG4gICAgICAgIHkuclNoaWZ0VG8oZywgeSk7XG4gICAgfVxuICAgIHdoaWxlICh4LnNpZ251bSgpID4gMCkge1xuICAgICAgICBpZiAoKGkgPSB4LmdldExvd2VzdFNldEJpdCgpKSA+IDApXG4gICAgICAgICAgICB4LnJTaGlmdFRvKGksIHgpO1xuICAgICAgICBpZiAoKGkgPSB5LmdldExvd2VzdFNldEJpdCgpKSA+IDApXG4gICAgICAgICAgICB5LnJTaGlmdFRvKGksIHkpO1xuICAgICAgICBpZiAoeC5jb21wYXJlVG8oeSkgPj0gMCkge1xuICAgICAgICAgICAgeC5zdWJUbyh5LCB4KTtcbiAgICAgICAgICAgIHguclNoaWZ0VG8oMSwgeCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB5LnN1YlRvKHgsIHkpO1xuICAgICAgICAgICAgeS5yU2hpZnRUbygxLCB5KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZyA+IDApXG4gICAgICAgIHkubFNoaWZ0VG8oZywgeSk7XG4gICAgcmV0dXJuIHk7XG59XG4vLyAocHJvdGVjdGVkKSB0aGlzICUgbiwgbiA8IDJeMjZcbmZ1bmN0aW9uIGJucE1vZEludChuKSB7XG4gICAgaWYgKG4gPD0gMClcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgdmFyIGQgPSB0aGlzLkRWICUgbiwgciA9IHRoaXMucyA8IDAgPyBuIC0gMSA6IDA7XG4gICAgaWYgKHRoaXMudCA+IDApIHtcbiAgICAgICAgaWYgKGQgPT0gMCkge1xuICAgICAgICAgICAgciA9IHRoaXNbMF0gJSBuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMudCAtIDE7IGkgPj0gMDsgLS1pKVxuICAgICAgICAgICAgICAgIHIgPSAoZCAqIHIgKyB0aGlzW2ldKSAlIG47XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHI7XG59XG4vLyAocHVibGljKSAxL3RoaXMgJSBtIChIQUMgMTQuNjEpXG5mdW5jdGlvbiBibk1vZEludmVyc2UobSkge1xuICAgIHZhciBhYyA9IG0uaXNFdmVuKCk7XG4gICAgaWYgKCh0aGlzLmlzRXZlbigpICYmIGFjKSB8fCBtLnNpZ251bSgpID09IDApXG4gICAgICAgIHJldHVybiBCaWdJbnRlZ2VyLlpFUk87XG4gICAgdmFyIHUgPSBtLmNsb25lKCksIHYgPSB0aGlzLmNsb25lKCk7XG4gICAgdmFyIGEgPSBuYnYoMSksIGIgPSBuYnYoMCksIGMgPSBuYnYoMCksIGQgPSBuYnYoMSk7XG4gICAgd2hpbGUgKHUuc2lnbnVtKCkgIT0gMCkge1xuICAgICAgICB3aGlsZSAodS5pc0V2ZW4oKSkge1xuICAgICAgICAgICAgdS5yU2hpZnRUbygxLCB1KTtcbiAgICAgICAgICAgIGlmIChhYykge1xuICAgICAgICAgICAgICAgIGlmICghYS5pc0V2ZW4oKSB8fCAhYi5pc0V2ZW4oKSkge1xuICAgICAgICAgICAgICAgICAgICBhLmFkZFRvKHRoaXMsIGEpO1xuICAgICAgICAgICAgICAgICAgICBiLnN1YlRvKG0sIGIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBhLnJTaGlmdFRvKDEsIGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoIWIuaXNFdmVuKCkpXG4gICAgICAgICAgICAgICAgYi5zdWJUbyhtLCBiKTtcbiAgICAgICAgICAgIGIuclNoaWZ0VG8oMSwgYik7XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKHYuaXNFdmVuKCkpIHtcbiAgICAgICAgICAgIHYuclNoaWZ0VG8oMSwgdik7XG4gICAgICAgICAgICBpZiAoYWMpIHtcbiAgICAgICAgICAgICAgICBpZiAoIWMuaXNFdmVuKCkgfHwgIWQuaXNFdmVuKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgYy5hZGRUbyh0aGlzLCBjKTtcbiAgICAgICAgICAgICAgICAgICAgZC5zdWJUbyhtLCBkKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYy5yU2hpZnRUbygxLCBjKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKCFkLmlzRXZlbigpKVxuICAgICAgICAgICAgICAgIGQuc3ViVG8obSwgZCk7XG4gICAgICAgICAgICBkLnJTaGlmdFRvKDEsIGQpO1xuICAgICAgICB9XG4gICAgICAgIGlmICh1LmNvbXBhcmVUbyh2KSA+PSAwKSB7XG4gICAgICAgICAgICB1LnN1YlRvKHYsIHUpO1xuICAgICAgICAgICAgaWYgKGFjKVxuICAgICAgICAgICAgICAgIGEuc3ViVG8oYywgYSk7XG4gICAgICAgICAgICBiLnN1YlRvKGQsIGIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdi5zdWJUbyh1LCB2KTtcbiAgICAgICAgICAgIGlmIChhYylcbiAgICAgICAgICAgICAgICBjLnN1YlRvKGEsIGMpO1xuICAgICAgICAgICAgZC5zdWJUbyhiLCBkKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAodi5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpICE9IDApXG4gICAgICAgIHJldHVybiBCaWdJbnRlZ2VyLlpFUk87XG4gICAgaWYgKGQuY29tcGFyZVRvKG0pID49IDApXG4gICAgICAgIHJldHVybiBkLnN1YnRyYWN0KG0pO1xuICAgIGlmIChkLnNpZ251bSgpIDwgMClcbiAgICAgICAgZC5hZGRUbyhtLCBkKTtcbiAgICBlbHNlXG4gICAgICAgIHJldHVybiBkO1xuICAgIGlmIChkLnNpZ251bSgpIDwgMClcbiAgICAgICAgcmV0dXJuIGQuYWRkKG0pO1xuICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIGQ7XG59XG52YXIgbG93cHJpbWVzID0gW1xuICAgIDIsIDMsIDUsIDcsIDExLCAxMywgMTcsIDE5LCAyMywgMjksIDMxLCAzNywgNDEsIDQzLCA0NywgNTMsIDU5LCA2MSwgNjcsIDcxLCA3MywgNzksIDgzLCA4OSwgOTcsIDEwMSwgMTAzLCAxMDcsIDEwOSwgMTEzLCAxMjcsIDEzMSwgMTM3LCAxMzksIDE0OSwgMTUxLCAxNTcsXG4gICAgMTYzLCAxNjcsIDE3MywgMTc5LCAxODEsIDE5MSwgMTkzLCAxOTcsIDE5OSwgMjExLCAyMjMsIDIyNywgMjI5LCAyMzMsIDIzOSwgMjQxLCAyNTEsIDI1NywgMjYzLCAyNjksIDI3MSwgMjc3LCAyODEsIDI4MywgMjkzLCAzMDcsIDMxMSwgMzEzLCAzMTcsIDMzMSwgMzM3LFxuICAgIDM0NywgMzQ5LCAzNTMsIDM1OSwgMzY3LCAzNzMsIDM3OSwgMzgzLCAzODksIDM5NywgNDAxLCA0MDksIDQxOSwgNDIxLCA0MzEsIDQzMywgNDM5LCA0NDMsIDQ0OSwgNDU3LCA0NjEsIDQ2MywgNDY3LCA0NzksIDQ4NywgNDkxLCA0OTksIDUwMywgNTA5LCA1MjEsIDUyMyxcbiAgICA1NDEsIDU0NywgNTU3LCA1NjMsIDU2OSwgNTcxLCA1NzcsIDU4NywgNTkzLCA1OTksIDYwMSwgNjA3LCA2MTMsIDYxNywgNjE5LCA2MzEsIDY0MSwgNjQzLCA2NDcsIDY1MywgNjU5LCA2NjEsIDY3MywgNjc3LCA2ODMsIDY5MSwgNzAxLCA3MDksIDcxOSwgNzI3LCA3MzMsXG4gICAgNzM5LCA3NDMsIDc1MSwgNzU3LCA3NjEsIDc2OSwgNzczLCA3ODcsIDc5NywgODA5LCA4MTEsIDgyMSwgODIzLCA4MjcsIDgyOSwgODM5LCA4NTMsIDg1NywgODU5LCA4NjMsIDg3NywgODgxLCA4ODMsIDg4NywgOTA3LCA5MTEsIDkxOSwgOTI5LCA5MzcsIDk0MSwgOTQ3LFxuICAgIDk1MywgOTY3LCA5NzEsIDk3NywgOTgzLCA5OTEsIDk5Nyxcbl07XG52YXIgbHBsaW0gPSAoMSA8PCAyNikgLyBsb3dwcmltZXNbbG93cHJpbWVzLmxlbmd0aCAtIDFdO1xuLy8gKHB1YmxpYykgdGVzdCBwcmltYWxpdHkgd2l0aCBjZXJ0YWludHkgPj0gMS0uNV50XG5mdW5jdGlvbiBibklzUHJvYmFibGVQcmltZSh0KSB7XG4gICAgdmFyIGksIHggPSB0aGlzLmFicygpO1xuICAgIGlmICh4LnQgPT0gMSAmJiB4WzBdIDw9IGxvd3ByaW1lc1tsb3dwcmltZXMubGVuZ3RoIC0gMV0pIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGxvd3ByaW1lcy5sZW5ndGg7ICsraSlcbiAgICAgICAgICAgIGlmICh4WzBdID09IGxvd3ByaW1lc1tpXSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoeC5pc0V2ZW4oKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIGkgPSAxO1xuICAgIHdoaWxlIChpIDwgbG93cHJpbWVzLmxlbmd0aCkge1xuICAgICAgICB2YXIgbSA9IGxvd3ByaW1lc1tpXSwgaiA9IGkgKyAxO1xuICAgICAgICB3aGlsZSAoaiA8IGxvd3ByaW1lcy5sZW5ndGggJiYgbSA8IGxwbGltKVxuICAgICAgICAgICAgbSAqPSBsb3dwcmltZXNbaisrXTtcbiAgICAgICAgbSA9IHgubW9kSW50KG0pO1xuICAgICAgICB3aGlsZSAoaSA8IGopXG4gICAgICAgICAgICBpZiAobSAlIGxvd3ByaW1lc1tpKytdID09IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4geC5taWxsZXJSYWJpbih0KTtcbn1cbi8vIChwcm90ZWN0ZWQpIHRydWUgaWYgcHJvYmFibHkgcHJpbWUgKEhBQyA0LjI0LCBNaWxsZXItUmFiaW4pXG5mdW5jdGlvbiBibnBNaWxsZXJSYWJpbih0KSB7XG4gICAgdmFyIG4xID0gdGhpcy5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSk7XG4gICAgdmFyIGsgPSBuMS5nZXRMb3dlc3RTZXRCaXQoKTtcbiAgICBpZiAoayA8PSAwKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgdmFyIHIgPSBuMS5zaGlmdFJpZ2h0KGspO1xuICAgIHQgPSAodCArIDEpID4+IDE7XG4gICAgaWYgKHQgPiBsb3dwcmltZXMubGVuZ3RoKVxuICAgICAgICB0ID0gbG93cHJpbWVzLmxlbmd0aDtcbiAgICB2YXIgYSA9IG5iaSgpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdDsgKytpKSB7XG4gICAgICAgIC8vUGljayBiYXNlcyBhdCByYW5kb20sIGluc3RlYWQgb2Ygc3RhcnRpbmcgYXQgMlxuICAgICAgICAvLyBUVVRBTzogSXQgaXMgZmluZSB0byB1c2UgTWF0aC5yYW5kb20oKSBpbnN0ZWFkIHNlY3VyZSByYW5kb20gaGVyZSBiZWNhdXNlIGl0IGlzIG9ubHkgdXNlZCBmb3IgY2hlY2tpbmcgaWYgdGhlIG51bWJlciBpcyBhIHByaW1lLiBUaGUgbnVtYmVyIGl0c2VsZiBpcyBnZW5lcmF0ZWQgd2l0aCB0aGUgc2VjdXJlIHJhbmRvbSBudW1iZXIgZ2VuZXJhdG9yLlxuICAgICAgICBhLmZyb21JbnQobG93cHJpbWVzW01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGxvd3ByaW1lcy5sZW5ndGgpXSk7XG4gICAgICAgIHZhciB5ID0gYS5tb2RQb3cociwgdGhpcyk7XG4gICAgICAgIGlmICh5LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgIT0gMCAmJiB5LmNvbXBhcmVUbyhuMSkgIT0gMCkge1xuICAgICAgICAgICAgdmFyIGogPSAxO1xuICAgICAgICAgICAgd2hpbGUgKGorKyA8IGsgJiYgeS5jb21wYXJlVG8objEpICE9IDApIHtcbiAgICAgICAgICAgICAgICB5ID0geS5tb2RQb3dJbnQoMiwgdGhpcyk7XG4gICAgICAgICAgICAgICAgaWYgKHkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSA9PSAwKVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoeS5jb21wYXJlVG8objEpICE9IDApXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xufVxuLy8gcHJvdGVjdGVkXG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jaHVua1NpemUgPSBibnBDaHVua1NpemU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS50b1JhZGl4ID0gYm5wVG9SYWRpeDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21SYWRpeCA9IGJucEZyb21SYWRpeDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21OdW1iZXIgPSBibnBGcm9tTnVtYmVyO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYml0d2lzZVRvID0gYm5wQml0d2lzZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuY2hhbmdlQml0ID0gYm5wQ2hhbmdlQml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYWRkVG8gPSBibnBBZGRUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmRNdWx0aXBseSA9IGJucERNdWx0aXBseTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmRBZGRPZmZzZXQgPSBibnBEQWRkT2Zmc2V0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlMb3dlclRvID0gYm5wTXVsdGlwbHlMb3dlclRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlVcHBlclRvID0gYm5wTXVsdGlwbHlVcHBlclRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kSW50ID0gYm5wTW9kSW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubWlsbGVyUmFiaW4gPSBibnBNaWxsZXJSYWJpbjtcbi8vIHB1YmxpY1xuQmlnSW50ZWdlci5wcm90b3R5cGUuY2xvbmUgPSBibkNsb25lO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuaW50VmFsdWUgPSBibkludFZhbHVlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYnl0ZVZhbHVlID0gYm5CeXRlVmFsdWU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zaG9ydFZhbHVlID0gYm5TaG9ydFZhbHVlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc2lnbnVtID0gYm5TaWdOdW07XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS50b0J5dGVBcnJheSA9IGJuVG9CeXRlQXJyYXk7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHMgPSBibkVxdWFscztcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1pbiA9IGJuTWluO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubWF4ID0gYm5NYXg7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQgPSBibkFuZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm9yID0gYm5PcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnhvciA9IGJuWG9yO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYW5kTm90ID0gYm5BbmROb3Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5ub3QgPSBibk5vdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdCA9IGJuU2hpZnRMZWZ0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IGJuU2hpZnRSaWdodDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmdldExvd2VzdFNldEJpdCA9IGJuR2V0TG93ZXN0U2V0Qml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYml0Q291bnQgPSBibkJpdENvdW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUudGVzdEJpdCA9IGJuVGVzdEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNldEJpdCA9IGJuU2V0Qml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuY2xlYXJCaXQgPSBibkNsZWFyQml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZmxpcEJpdCA9IGJuRmxpcEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmFkZCA9IGJuQWRkO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3QgPSBiblN1YnRyYWN0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHkgPSBibk11bHRpcGx5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2aWRlID0gYm5EaXZpZGU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5yZW1haW5kZXIgPSBiblJlbWFpbmRlcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZUFuZFJlbWFpbmRlciA9IGJuRGl2aWRlQW5kUmVtYWluZGVyO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93ID0gYm5Nb2RQb3c7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnZlcnNlID0gYm5Nb2RJbnZlcnNlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUucG93ID0gYm5Qb3c7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5nY2QgPSBibkdDRDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZSA9IGJuSXNQcm9iYWJsZVByaW1lO1xuLy8gSlNCTi1zcGVjaWZpYyBleHRlbnNpb25cbkJpZ0ludGVnZXIucHJvdG90eXBlLnNxdWFyZSA9IGJuU3F1YXJlO1xuLy8gQmlnSW50ZWdlciBpbnRlcmZhY2VzIG5vdCBpbXBsZW1lbnRlZCBpbiBqc2JuOlxuLy8gQmlnSW50ZWdlcihpbnQgc2lnbnVtLCBieXRlW10gbWFnbml0dWRlKVxuLy8gZG91YmxlIGRvdWJsZVZhbHVlKClcbi8vIGZsb2F0IGZsb2F0VmFsdWUoKVxuLy8gaW50IGhhc2hDb2RlKClcbi8vIGxvbmcgbG9uZ1ZhbHVlKClcbi8vIHN0YXRpYyBCaWdJbnRlZ2VyIHZhbHVlT2YobG9uZyB2YWwpXG4vLyBEZXBlbmRzIG9uIGpzYm4uanMgYW5kIHJuZy5qc1xuLy8gVmVyc2lvbiAxLjE6IHN1cHBvcnQgdXRmLTggZW5jb2RpbmcgaW4gcGtjczFwYWQyXG4vLyBjb252ZXJ0IGEgKGhleCkgc3RyaW5nIHRvIGEgYmlnbnVtIG9iamVjdFxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlQmlnSW50KHN0ciwgcikge1xuICAgIHJldHVybiBuZXcgQmlnSW50ZWdlcihzdHIsIHIpO1xufVxuZnVuY3Rpb24gbGluZWJyayhzLCBuKSB7XG4gICAgdmFyIHJldCA9IFwiXCI7XG4gICAgdmFyIGkgPSAwO1xuICAgIHdoaWxlIChpICsgbiA8IHMubGVuZ3RoKSB7XG4gICAgICAgIHJldCArPSBzLnN1YnN0cmluZyhpLCBpICsgbikgKyBcIlxcblwiO1xuICAgICAgICBpICs9IG47XG4gICAgfVxuICAgIHJldHVybiByZXQgKyBzLnN1YnN0cmluZyhpLCBzLmxlbmd0aCk7XG59XG5mdW5jdGlvbiBieXRlMkhleChiKSB7XG4gICAgaWYgKGIgPCAweDEwKSB7XG4gICAgICAgIHJldHVybiBcIjBcIiArIGIudG9TdHJpbmcoMTYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGIudG9TdHJpbmcoMTYpO1xuICAgIH1cbn1cbi8vIFBLQ1MjMSAodHlwZSAyLCByYW5kb20pIHBhZCBpbnB1dCBzdHJpbmcgcyB0byBuIGJ5dGVzLCBhbmQgcmV0dXJuIGEgYmlnaW50XG5mdW5jdGlvbiBwa2NzMXBhZDIocywgbikge1xuICAgIGlmIChuIDwgcy5sZW5ndGggKyAxMSkge1xuICAgICAgICAvLyBUT0RPOiBmaXggZm9yIHV0Zi04XG4gICAgICAgIGFsZXJ0KFwiTWVzc2FnZSB0b28gbG9uZyBmb3IgUlNBXCIpO1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIGJhID0gbmV3IEFycmF5KCk7XG4gICAgdmFyIGkgPSBzLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKGkgPj0gMCAmJiBuID4gMCkge1xuICAgICAgICB2YXIgYyA9IHMuY2hhckNvZGVBdChpLS0pO1xuICAgICAgICBpZiAoYyA8IDEyOCkge1xuICAgICAgICAgICAgLy8gZW5jb2RlIHVzaW5nIHV0Zi04XG4gICAgICAgICAgICBiYVstLW5dID0gYztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjID4gMTI3ICYmIGMgPCAyMDQ4KSB7XG4gICAgICAgICAgICBiYVstLW5dID0gKGMgJiA2MykgfCAxMjg7XG4gICAgICAgICAgICBiYVstLW5dID0gKGMgPj4gNikgfCAxOTI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBiYVstLW5dID0gKGMgJiA2MykgfCAxMjg7XG4gICAgICAgICAgICBiYVstLW5dID0gKChjID4+IDYpICYgNjMpIHwgMTI4O1xuICAgICAgICAgICAgYmFbLS1uXSA9IChjID4+IDEyKSB8IDIyNDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBiYVstLW5dID0gMDtcbiAgICB2YXIgcm5nID0gbmV3IFNlY3VyZVJhbmRvbSgpO1xuICAgIHZhciB4ID0gbmV3IEFycmF5KCk7XG4gICAgd2hpbGUgKG4gPiAyKSB7XG4gICAgICAgIC8vIHJhbmRvbSBub24temVybyBwYWRcbiAgICAgICAgeFswXSA9IDA7XG4gICAgICAgIHdoaWxlICh4WzBdID09IDApXG4gICAgICAgICAgICBybmcubmV4dEJ5dGVzKHgpO1xuICAgICAgICBiYVstLW5dID0geFswXTtcbiAgICB9XG4gICAgYmFbLS1uXSA9IDI7XG4gICAgYmFbLS1uXSA9IDA7XG4gICAgcmV0dXJuIG5ldyBCaWdJbnRlZ2VyKGJhKTtcbn1cbi8vIFwiZW1wdHlcIiBSU0Ega2V5IGNvbnN0cnVjdG9yXG5leHBvcnQgZnVuY3Rpb24gUlNBS2V5KCkge1xuICAgIHRoaXMubiA9IG51bGw7XG4gICAgdGhpcy5lID0gMDtcbiAgICB0aGlzLmQgPSBudWxsO1xuICAgIHRoaXMucCA9IG51bGw7XG4gICAgdGhpcy5xID0gbnVsbDtcbiAgICB0aGlzLmRtcDEgPSBudWxsO1xuICAgIHRoaXMuZG1xMSA9IG51bGw7XG4gICAgdGhpcy5jb2VmZiA9IG51bGw7XG59XG4vLyBTZXQgdGhlIHB1YmxpYyBrZXkgZmllbGRzIE4gYW5kIGUgZnJvbSBoZXggc3RyaW5nc1xuZnVuY3Rpb24gUlNBU2V0UHVibGljKE4sIEUpIHtcbiAgICBpZiAoTiAhPSBudWxsICYmIEUgIT0gbnVsbCAmJiBOLmxlbmd0aCA+IDAgJiYgRS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMubiA9IHBhcnNlQmlnSW50KE4sIDE2KTtcbiAgICAgICAgdGhpcy5lID0gcGFyc2VJbnQoRSwgMTYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYWxlcnQoXCJJbnZhbGlkIFJTQSBwdWJsaWMga2V5XCIpO1xuICAgIH1cbn1cbi8vIFBlcmZvcm0gcmF3IHB1YmxpYyBvcGVyYXRpb24gb24gXCJ4XCI6IHJldHVybiB4XmUgKG1vZCBuKVxuZnVuY3Rpb24gUlNBRG9QdWJsaWMoeCkge1xuICAgIHJldHVybiB4Lm1vZFBvd0ludCh0aGlzLmUsIHRoaXMubik7XG59XG4vLyBSZXR1cm4gdGhlIFBLQ1MjMSBSU0EgZW5jcnlwdGlvbiBvZiBcInRleHRcIiBhcyBhbiBldmVuLWxlbmd0aCBoZXggc3RyaW5nXG5mdW5jdGlvbiBSU0FFbmNyeXB0KHRleHQpIHtcbiAgICB2YXIgbSA9IHBrY3MxcGFkMih0ZXh0LCAodGhpcy5uLmJpdExlbmd0aCgpICsgNykgPj4gMyk7XG4gICAgaWYgKG0gPT0gbnVsbClcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgdmFyIGMgPSB0aGlzLmRvUHVibGljKG0pO1xuICAgIGlmIChjID09IG51bGwpXG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIHZhciBoID0gYy50b1N0cmluZygxNik7XG4gICAgaWYgKChoLmxlbmd0aCAmIDEpID09IDApXG4gICAgICAgIHJldHVybiBoO1xuICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIFwiMFwiICsgaDtcbn1cbi8vIFJldHVybiB0aGUgUEtDUyMxIFJTQSBlbmNyeXB0aW9uIG9mIFwidGV4dFwiIGFzIGEgQmFzZTY0LWVuY29kZWQgc3RyaW5nXG4vL2Z1bmN0aW9uIFJTQUVuY3J5cHRCNjQodGV4dCkge1xuLy8gIHZhciBoID0gdGhpcy5lbmNyeXB0KHRleHQpO1xuLy8gIGlmKGgpIHJldHVybiBoZXgyYjY0KGgpOyBlbHNlIHJldHVybiBudWxsO1xuLy99XG4vLyBwcm90ZWN0ZWRcblJTQUtleS5wcm90b3R5cGUuZG9QdWJsaWMgPSBSU0FEb1B1YmxpYztcbi8vIHB1YmxpY1xuUlNBS2V5LnByb3RvdHlwZS5zZXRQdWJsaWMgPSBSU0FTZXRQdWJsaWM7XG5SU0FLZXkucHJvdG90eXBlLmVuY3J5cHQgPSBSU0FFbmNyeXB0O1xuLy9SU0FLZXkucHJvdG90eXBlLmVuY3J5cHRfYjY0ID0gUlNBRW5jcnlwdEI2NDtcbi8vIERlcGVuZHMgb24gcnNhLmpzIGFuZCBqc2JuMi5qc1xuLy8gVmVyc2lvbiAxLjE6IHN1cHBvcnQgdXRmLTggZGVjb2RpbmcgaW4gcGtjczF1bnBhZDJcbi8vIFVuZG8gUEtDUyMxICh0eXBlIDIsIHJhbmRvbSkgcGFkZGluZyBhbmQsIGlmIHZhbGlkLCByZXR1cm4gdGhlIHBsYWludGV4dFxuZnVuY3Rpb24gcGtjczF1bnBhZDIoZCwgbikge1xuICAgIHZhciBiID0gZC50b0J5dGVBcnJheSgpO1xuICAgIHZhciBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGIubGVuZ3RoICYmIGJbaV0gPT0gMClcbiAgICAgICAgKytpO1xuICAgIGlmIChiLmxlbmd0aCAtIGkgIT0gbiAtIDEgfHwgYltpXSAhPSAyKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICArK2k7XG4gICAgd2hpbGUgKGJbaV0gIT0gMClcbiAgICAgICAgaWYgKCsraSA+PSBiLmxlbmd0aClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgIHZhciByZXQgPSBcIlwiO1xuICAgIHdoaWxlICgrK2kgPCBiLmxlbmd0aCkge1xuICAgICAgICB2YXIgYyA9IGJbaV0gJiAyNTU7XG4gICAgICAgIGlmIChjIDwgMTI4KSB7XG4gICAgICAgICAgICAvLyB1dGYtOCBkZWNvZGVcbiAgICAgICAgICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGMgPiAxOTEgJiYgYyA8IDIyNCkge1xuICAgICAgICAgICAgcmV0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoKChjICYgMzEpIDw8IDYpIHwgKGJbaSArIDFdICYgNjMpKTtcbiAgICAgICAgICAgICsraTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKCgoYyAmIDE1KSA8PCAxMikgfCAoKGJbaSArIDFdICYgNjMpIDw8IDYpIHwgKGJbaSArIDJdICYgNjMpKTtcbiAgICAgICAgICAgIGkgKz0gMjtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcmV0O1xufVxuLy8gU2V0IHRoZSBwcml2YXRlIGtleSBmaWVsZHMgTiwgZSwgYW5kIGQgZnJvbSBoZXggc3RyaW5nc1xuZnVuY3Rpb24gUlNBU2V0UHJpdmF0ZShOLCBFLCBEKSB7XG4gICAgaWYgKE4gIT0gbnVsbCAmJiBFICE9IG51bGwgJiYgTi5sZW5ndGggPiAwICYmIEUubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLm4gPSBwYXJzZUJpZ0ludChOLCAxNik7XG4gICAgICAgIHRoaXMuZSA9IHBhcnNlSW50KEUsIDE2KTtcbiAgICAgICAgdGhpcy5kID0gcGFyc2VCaWdJbnQoRCwgMTYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYWxlcnQoXCJJbnZhbGlkIFJTQSBwcml2YXRlIGtleVwiKTtcbiAgICB9XG59XG4vLyBTZXQgdGhlIHByaXZhdGUga2V5IGZpZWxkcyBOLCBlLCBkIGFuZCBDUlQgcGFyYW1zIGZyb20gaGV4IHN0cmluZ3NcbmZ1bmN0aW9uIFJTQVNldFByaXZhdGVFeChOLCBFLCBELCBQLCBRLCBEUCwgRFEsIEMpIHtcbiAgICBpZiAoTiAhPSBudWxsICYmIEUgIT0gbnVsbCAmJiBOLmxlbmd0aCA+IDAgJiYgRS5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMubiA9IHBhcnNlQmlnSW50KE4sIDE2KTtcbiAgICAgICAgdGhpcy5lID0gcGFyc2VJbnQoRSwgMTYpO1xuICAgICAgICB0aGlzLmQgPSBwYXJzZUJpZ0ludChELCAxNik7XG4gICAgICAgIHRoaXMucCA9IHBhcnNlQmlnSW50KFAsIDE2KTtcbiAgICAgICAgdGhpcy5xID0gcGFyc2VCaWdJbnQoUSwgMTYpO1xuICAgICAgICB0aGlzLmRtcDEgPSBwYXJzZUJpZ0ludChEUCwgMTYpO1xuICAgICAgICB0aGlzLmRtcTEgPSBwYXJzZUJpZ0ludChEUSwgMTYpO1xuICAgICAgICB0aGlzLmNvZWZmID0gcGFyc2VCaWdJbnQoQywgMTYpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYWxlcnQoXCJJbnZhbGlkIFJTQSBwcml2YXRlIGtleVwiKTtcbiAgICB9XG59XG4vLyBHZW5lcmF0ZSBhIG5ldyByYW5kb20gcHJpdmF0ZSBrZXkgQiBiaXRzIGxvbmcsIHVzaW5nIHB1YmxpYyBleHB0IEVcbmZ1bmN0aW9uIFJTQUdlbmVyYXRlKEIsIEUpIHtcbiAgICB2YXIgcm5nID0gbmV3IFNlY3VyZVJhbmRvbSgpO1xuICAgIHZhciBxcyA9IEIgPj4gMTtcbiAgICB0aGlzLmUgPSBwYXJzZUludChFLCAxNik7XG4gICAgdmFyIGVlID0gbmV3IEJpZ0ludGVnZXIoRSwgMTYpO1xuICAgIGZvciAoOzspIHtcbiAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgdGhpcy5wID0gbmV3IEJpZ0ludGVnZXIoQiAtIHFzLCAxMCwgcm5nKTsgLy8gdHV0YW86IGNoYW5nZWQgcGFyYW1ldGVyIGIgZnJvbSAxIHRvIDEwICg9PiA1IHJvdW5kcyk7IGFjY29yZGluZyB0byBIQUMgNC40OSwgd2Ugb25seSBuZWVkIDIgcm91bmRzICYmIGRpc2N1c3Npb246IGh0dHBzOi8vZ2l0aHViLmNvbS9kaWdpdGFsYmF6YWFyL2ZvcmdlL2lzc3Vlcy8yOFxuICAgICAgICAgICAgLy8gdHV0YW86IHRoZSBwcmltZSBwcm9iYWJpbGl0eSBpcyBhbHJlYWR5IGd1YXJhbnRlZWQgYnkgdGhlIEJpZ0ludGVnZXIgY29uc3RydWN0b3IgYWJvdmU7IGlmKHRoaXMucC5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSkuZ2NkKGVlKS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpID09IDAgJiYgdGhpcy5wLmlzUHJvYmFibGVQcmltZSgxMCkpIGJyZWFrO1xuICAgICAgICAgICAgaWYgKHRoaXMucC5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSkuZ2NkKGVlKS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpID09IDApXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7Oykge1xuICAgICAgICAgICAgLy8gdHV0YW86IHNhbWUgY2hhbmdlcyBhcyBhYm92ZVxuICAgICAgICAgICAgdGhpcy5xID0gbmV3IEJpZ0ludGVnZXIocXMsIDEwLCBybmcpO1xuICAgICAgICAgICAgaWYgKHRoaXMucS5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSkuZ2NkKGVlKS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpID09IDApXG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRoaXMucC5jb21wYXJlVG8odGhpcy5xKSA8PSAwKSB7XG4gICAgICAgICAgICB2YXIgdCA9IHRoaXMucDtcbiAgICAgICAgICAgIHRoaXMucCA9IHRoaXMucTtcbiAgICAgICAgICAgIHRoaXMucSA9IHQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHAxID0gdGhpcy5wLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKTtcbiAgICAgICAgdmFyIHExID0gdGhpcy5xLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKTtcbiAgICAgICAgdmFyIHBoaSA9IHAxLm11bHRpcGx5KHExKTtcbiAgICAgICAgaWYgKHBoaS5nY2QoZWUpLmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgPT0gMCkge1xuICAgICAgICAgICAgdGhpcy5uID0gdGhpcy5wLm11bHRpcGx5KHRoaXMucSk7XG4gICAgICAgICAgICB0aGlzLmQgPSBlZS5tb2RJbnZlcnNlKHBoaSk7XG4gICAgICAgICAgICB0aGlzLmRtcDEgPSB0aGlzLmQubW9kKHAxKTtcbiAgICAgICAgICAgIHRoaXMuZG1xMSA9IHRoaXMuZC5tb2QocTEpO1xuICAgICAgICAgICAgdGhpcy5jb2VmZiA9IHRoaXMucS5tb2RJbnZlcnNlKHRoaXMucCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vIFBlcmZvcm0gcmF3IHByaXZhdGUgb3BlcmF0aW9uIG9uIFwieFwiOiByZXR1cm4geF5kIChtb2QgbilcbmZ1bmN0aW9uIFJTQURvUHJpdmF0ZSh4KSB7XG4gICAgaWYgKHRoaXMucCA9PSBudWxsIHx8IHRoaXMucSA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiB4Lm1vZFBvdyh0aGlzLmQsIHRoaXMubik7XG4gICAgfVxuICAgIC8vIFRPRE86IHJlLWNhbGN1bGF0ZSBhbnkgbWlzc2luZyBDUlQgcGFyYW1zXG4gICAgdmFyIHhwID0geC5tb2QodGhpcy5wKS5tb2RQb3codGhpcy5kbXAxLCB0aGlzLnApO1xuICAgIHZhciB4cSA9IHgubW9kKHRoaXMucSkubW9kUG93KHRoaXMuZG1xMSwgdGhpcy5xKTtcbiAgICB3aGlsZSAoeHAuY29tcGFyZVRvKHhxKSA8IDApXG4gICAgICAgIHhwID0geHAuYWRkKHRoaXMucCk7XG4gICAgcmV0dXJuIHhwLnN1YnRyYWN0KHhxKS5tdWx0aXBseSh0aGlzLmNvZWZmKS5tb2QodGhpcy5wKS5tdWx0aXBseSh0aGlzLnEpLmFkZCh4cSk7XG59XG4vLyBSZXR1cm4gdGhlIFBLQ1MjMSBSU0EgZGVjcnlwdGlvbiBvZiBcImN0ZXh0XCIuXG4vLyBcImN0ZXh0XCIgaXMgYW4gZXZlbi1sZW5ndGggaGV4IHN0cmluZyBhbmQgdGhlIG91dHB1dCBpcyBhIHBsYWluIHN0cmluZy5cbmZ1bmN0aW9uIFJTQURlY3J5cHQoY3RleHQpIHtcbiAgICB2YXIgYyA9IHBhcnNlQmlnSW50KGN0ZXh0LCAxNik7XG4gICAgdmFyIG0gPSB0aGlzLmRvUHJpdmF0ZShjKTtcbiAgICBpZiAobSA9PSBudWxsKVxuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gcGtjczF1bnBhZDIobSwgKHRoaXMubi5iaXRMZW5ndGgoKSArIDcpID4+IDMpO1xufVxuLy8gUmV0dXJuIHRoZSBQS0NTIzEgUlNBIGRlY3J5cHRpb24gb2YgXCJjdGV4dFwiLlxuLy8gXCJjdGV4dFwiIGlzIGEgQmFzZTY0LWVuY29kZWQgc3RyaW5nIGFuZCB0aGUgb3V0cHV0IGlzIGEgcGxhaW4gc3RyaW5nLlxuLy9mdW5jdGlvbiBSU0FCNjREZWNyeXB0KGN0ZXh0KSB7XG4vLyAgdmFyIGggPSBiNjR0b2hleChjdGV4dCk7XG4vLyAgaWYoaCkgcmV0dXJuIHRoaXMuZGVjcnlwdChoKTsgZWxzZSByZXR1cm4gbnVsbDtcbi8vfVxuLy8gcHJvdGVjdGVkXG5SU0FLZXkucHJvdG90eXBlLmRvUHJpdmF0ZSA9IFJTQURvUHJpdmF0ZTtcbi8vIHB1YmxpY1xuUlNBS2V5LnByb3RvdHlwZS5zZXRQcml2YXRlID0gUlNBU2V0UHJpdmF0ZTtcblJTQUtleS5wcm90b3R5cGUuc2V0UHJpdmF0ZUV4ID0gUlNBU2V0UHJpdmF0ZUV4O1xuUlNBS2V5LnByb3RvdHlwZS5nZW5lcmF0ZSA9IFJTQUdlbmVyYXRlO1xuUlNBS2V5LnByb3RvdHlwZS5kZWNyeXB0ID0gUlNBRGVjcnlwdDtcbi8vUlNBS2V5LnByb3RvdHlwZS5iNjRfZGVjcnlwdCA9IFJTQUI2NERlY3J5cHQ7XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBCaWcgSW50ZWdlciBMaWJyYXJ5IHYuIDUuNFxuLy8gQ3JlYXRlZCAyMDAwLCBsYXN0IG1vZGlmaWVkIDIwMDlcbi8vIExlZW1vbiBCYWlyZFxuLy8gd3d3LmxlZW1vbi5jb21cbi8vXG4vLyBWZXJzaW9uIGhpc3Rvcnk6XG4vLyB2IDUuNCAgMyBPY3QgMjAwOVxuLy8gICAtIGFkZGVkIFwidmFyIGlcIiB0byBncmVhdGVyU2hpZnQoKSBzbyBpIGlzIG5vdCBnbG9iYWwuIChUaGFua3MgdG8gUMW9dGVyIFN6YWLigJQgZm9yIGZpbmRpbmcgdGhhdCBidWcpXG4vL1xuLy8gdiA1LjMgIDIxIFNlcCAyMDA5XG4vLyAgIC0gYWRkZWQgcmFuZFByb2JQcmltZShrKSBmb3IgcHJvYmFibGUgcHJpbWVzXG4vLyAgIC0gdW5yb2xsZWQgbG9vcCBpbiBtb250XyAoc2xpZ2h0bHkgZmFzdGVyKVxuLy8gICAtIG1pbGxlclJhYmluIG5vdyB0YWtlcyBhIGJpZ0ludCBwYXJhbWV0ZXIgcmF0aGVyIHRoYW4gYW4gaW50XG4vL1xuLy8gdiA1LjIgIDE1IFNlcCAyMDA5XG4vLyAgIC0gZml4ZWQgY2FwaXRhbGl6YXRpb24gaW4gY2FsbCB0byBpbnQyYmlnSW50IGluIHJhbmRCaWdJbnRcbi8vICAgICAodGhhbmtzIHRvIEVtaWxpIEV2cmlwaWRvdSwgUmVpbmhvbGQgQmVocmluZ2VyLCBhbmQgU2FtdWVsIE1hY2FsZWVzZSBmb3IgZmluZGluZyB0aGF0IGJ1Zylcbi8vXG4vLyB2IDUuMSAgOCBPY3QgMjAwN1xuLy8gICAtIHJlbmFtZWQgaW52ZXJzZU1vZEludF8gdG8gaW52ZXJzZU1vZEludCBzaW5jZSBpdCBkb2Vzbid0IGNoYW5nZSBpdHMgcGFyYW1ldGVyc1xuLy8gICAtIGFkZGVkIGZ1bmN0aW9ucyBHQ0QgYW5kIHJhbmRCaWdJbnQsIHdoaWNoIGNhbGwgR0NEXyBhbmQgcmFuZEJpZ0ludF9cbi8vICAgLSBmaXhlZCBhIGJ1ZyBmb3VuZCBieSBSb2IgVmlzc2VyIChzZWUgY29tbWVudCB3aXRoIGhpcyBuYW1lIGJlbG93KVxuLy8gICAtIGltcHJvdmVkIGNvbW1lbnRzXG4vL1xuLy8gVGhpcyBmaWxlIGlzIHB1YmxpYyBkb21haW4uICAgWW91IGNhbiB1c2UgaXQgZm9yIGFueSBwdXJwb3NlIHdpdGhvdXQgcmVzdHJpY3Rpb24uXG4vLyBJIGRvIG5vdCBndWFyYW50ZWUgdGhhdCBpdCBpcyBjb3JyZWN0LCBzbyB1c2UgaXQgYXQgeW91ciBvd24gcmlzay4gIElmIHlvdSB1c2Vcbi8vIGl0IGZvciBzb21ldGhpbmcgaW50ZXJlc3RpbmcsIEknZCBhcHByZWNpYXRlIGhlYXJpbmcgYWJvdXQgaXQuICBJZiB5b3UgZmluZFxuLy8gYW55IGJ1Z3Mgb3IgbWFrZSBhbnkgaW1wcm92ZW1lbnRzLCBJJ2QgYXBwcmVjaWF0ZSBoZWFyaW5nIGFib3V0IHRob3NlIHRvby5cbi8vIEl0IHdvdWxkIGFsc28gYmUgbmljZSBpZiBteSBuYW1lIGFuZCBVUkwgd2VyZSBsZWZ0IGluIHRoZSBjb21tZW50cy4gIEJ1dCBub25lXG4vLyBvZiB0aGF0IGlzIHJlcXVpcmVkLlxuLy9cbi8vIFRoaXMgY29kZSBkZWZpbmVzIGEgYmlnSW50IGxpYnJhcnkgZm9yIGFyYml0cmFyeS1wcmVjaXNpb24gaW50ZWdlcnMuXG4vLyBBIGJpZ0ludCBpcyBhbiBhcnJheSBvZiBpbnRlZ2VycyBzdG9yaW5nIHRoZSB2YWx1ZSBpbiBjaHVua3Mgb2YgYnBlIGJpdHMsXG4vLyBsaXR0bGUgZW5kaWFuIChidWZmWzBdIGlzIHRoZSBsZWFzdCBzaWduaWZpY2FudCB3b3JkKS5cbi8vIE5lZ2F0aXZlIGJpZ0ludHMgYXJlIHN0b3JlZCB0d28ncyBjb21wbGVtZW50LiAgQWxtb3N0IGFsbCB0aGUgZnVuY3Rpb25zIHRyZWF0XG4vLyBiaWdJbnRzIGFzIG5vbm5lZ2F0aXZlLiAgVGhlIGZldyB0aGF0IHZpZXcgdGhlbSBhcyB0d28ncyBjb21wbGVtZW50IHNheSBzb1xuLy8gaW4gdGhlaXIgY29tbWVudHMuICBTb21lIGZ1bmN0aW9ucyBhc3N1bWUgdGhlaXIgcGFyYW1ldGVycyBoYXZlIGF0IGxlYXN0IG9uZVxuLy8gbGVhZGluZyB6ZXJvIGVsZW1lbnQuIEZ1bmN0aW9ucyB3aXRoIGFuIHVuZGVyc2NvcmUgYXQgdGhlIGVuZCBvZiB0aGUgbmFtZSBwdXRcbi8vIHRoZWlyIGFuc3dlciBpbnRvIG9uZSBvZiB0aGUgYXJyYXlzIHBhc3NlZCBpbiwgYW5kIGhhdmUgdW5wcmVkaWN0YWJsZSBiZWhhdmlvclxuLy8gaW4gY2FzZSBvZiBvdmVyZmxvdywgc28gdGhlIGNhbGxlciBtdXN0IG1ha2Ugc3VyZSB0aGUgYXJyYXlzIGFyZSBiaWcgZW5vdWdoIHRvXG4vLyBob2xkIHRoZSBhbnN3ZXIuICBCdXQgdGhlIGF2ZXJhZ2UgdXNlciBzaG91bGQgbmV2ZXIgaGF2ZSB0byBjYWxsIGFueSBvZiB0aGVcbi8vIHVuZGVyc2NvcmVkIGZ1bmN0aW9ucy4gIEVhY2ggaW1wb3J0YW50IHVuZGVyc2NvcmVkIGZ1bmN0aW9uIGhhcyBhIHdyYXBwZXIgZnVuY3Rpb25cbi8vIG9mIHRoZSBzYW1lIG5hbWUgd2l0aG91dCB0aGUgdW5kZXJzY29yZSB0aGF0IHRha2VzIGNhcmUgb2YgdGhlIGRldGFpbHMgZm9yIHlvdS5cbi8vIEZvciBlYWNoIHVuZGVyc2NvcmVkIGZ1bmN0aW9uIHdoZXJlIGEgcGFyYW1ldGVyIGlzIG1vZGlmaWVkLCB0aGF0IHNhbWUgdmFyaWFibGVcbi8vIG11c3Qgbm90IGJlIHVzZWQgYXMgYW5vdGhlciBhcmd1bWVudCB0b28uICBTbywgeW91IGNhbm5vdCBzcXVhcmUgeCBieSBkb2luZ1xuLy8gbXVsdE1vZF8oeCx4LG4pLiAgWW91IG11c3QgdXNlIHNxdWFyZU1vZF8oeCxuKSBpbnN0ZWFkLCBvciBkbyB5PWR1cCh4KTsgbXVsdE1vZF8oeCx5LG4pLlxuLy8gT3Igc2ltcGx5IHVzZSB0aGUgbXVsdE1vZCh4LHgsbikgZnVuY3Rpb24gd2l0aG91dCB0aGUgdW5kZXJzY29yZSwgd2hlcmVcbi8vIHN1Y2ggaXNzdWVzIG5ldmVyIGFyaXNlLCBiZWNhdXNlIG5vbi11bmRlcnNjb3JlZCBmdW5jdGlvbnMgbmV2ZXIgY2hhbmdlXG4vLyB0aGVpciBwYXJhbWV0ZXJzOyB0aGV5IGFsd2F5cyBhbGxvY2F0ZSBuZXcgbWVtb3J5IGZvciB0aGUgYW5zd2VyIHRoYXQgaXMgcmV0dXJuZWQuXG4vL1xuLy8gVGhlc2UgZnVuY3Rpb25zIGFyZSBkZXNpZ25lZCB0byBhdm9pZCBmcmVxdWVudCBkeW5hbWljIG1lbW9yeSBhbGxvY2F0aW9uIGluIHRoZSBpbm5lciBsb29wLlxuLy8gRm9yIG1vc3QgZnVuY3Rpb25zLCBpZiBpdCBuZWVkcyBhIEJpZ0ludCBhcyBhIGxvY2FsIHZhcmlhYmxlIGl0IHdpbGwgYWN0dWFsbHkgdXNlXG4vLyBhIGdsb2JhbCwgYW5kIHdpbGwgb25seSBhbGxvY2F0ZSB0byBpdCBvbmx5IHdoZW4gaXQncyBub3QgdGhlIHJpZ2h0IHNpemUuICBUaGlzIGVuc3VyZXNcbi8vIHRoYXQgd2hlbiBhIGZ1bmN0aW9uIGlzIGNhbGxlZCByZXBlYXRlZGx5IHdpdGggc2FtZS1zaXplZCBwYXJhbWV0ZXJzLCBpdCBvbmx5IGFsbG9jYXRlc1xuLy8gbWVtb3J5IG9uIHRoZSBmaXJzdCBjYWxsLlxuLy9cbi8vIE5vdGUgdGhhdCBmb3IgY3J5cHRvZ3JhcGhpYyBwdXJwb3NlcywgdGhlIGNhbGxzIHRvIE1hdGgucmFuZG9tKCkgbXVzdFxuLy8gYmUgcmVwbGFjZWQgd2l0aCBjYWxscyB0byBhIGJldHRlciBwc2V1ZG9yYW5kb20gbnVtYmVyIGdlbmVyYXRvci5cbi8vXG4vLyBJbiB0aGUgZm9sbG93aW5nLCBcImJpZ0ludFwiIG1lYW5zIGEgYmlnSW50IHdpdGggYXQgbGVhc3Qgb25lIGxlYWRpbmcgemVybyBlbGVtZW50LFxuLy8gYW5kIFwiaW50ZWdlclwiIG1lYW5zIGEgbm9ubmVnYXRpdmUgaW50ZWdlciBsZXNzIHRoYW4gcmFkaXguICBJbiBzb21lIGNhc2VzLCBpbnRlZ2VyXG4vLyBjYW4gYmUgbmVnYXRpdmUuICBOZWdhdGl2ZSBiaWdJbnRzIGFyZSAycyBjb21wbGVtZW50LlxuLy9cbi8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIGRvIG5vdCBtb2RpZnkgdGhlaXIgaW5wdXRzLlxuLy8gVGhvc2UgcmV0dXJuaW5nIGEgYmlnSW50LCBzdHJpbmcsIG9yIEFycmF5IHdpbGwgZHluYW1pY2FsbHkgYWxsb2NhdGUgbWVtb3J5IGZvciB0aGF0IHZhbHVlLlxuLy8gVGhvc2UgcmV0dXJuaW5nIGEgYm9vbGVhbiB3aWxsIHJldHVybiB0aGUgaW50ZWdlciAwIChmYWxzZSkgb3IgMSAodHJ1ZSkuXG4vLyBUaG9zZSByZXR1cm5pbmcgYm9vbGVhbiBvciBpbnQgd2lsbCBub3QgYWxsb2NhdGUgbWVtb3J5IGV4Y2VwdCBwb3NzaWJseSBvbiB0aGUgZmlyc3Rcbi8vIHRpbWUgdGhleSdyZSBjYWxsZWQgd2l0aCBhIGdpdmVuIHBhcmFtZXRlciBzaXplLlxuLy9cbi8vIGJpZ0ludCAgYWRkKHgseSkgICAgICAgICAgICAgICAvL3JldHVybiAoeCt5KSBmb3IgYmlnSW50cyB4IGFuZCB5LlxuLy8gYmlnSW50ICBhZGRJbnQoeCxuKSAgICAgICAgICAgIC8vcmV0dXJuICh4K24pIHdoZXJlIHggaXMgYSBiaWdJbnQgYW5kIG4gaXMgYW4gaW50ZWdlci5cbi8vIHN0cmluZyAgYmlnSW50MnN0cih4LGJhc2UpICAgICAvL3JldHVybiBhIHN0cmluZyBmb3JtIG9mIGJpZ0ludCB4IGluIGEgZ2l2ZW4gYmFzZSwgd2l0aCAyIDw9IGJhc2UgPD0gOTVcbi8vIGludCAgICAgYml0U2l6ZSh4KSAgICAgICAgICAgICAvL3JldHVybiBob3cgbWFueSBiaXRzIGxvbmcgdGhlIGJpZ0ludCB4IGlzLCBub3QgY291bnRpbmcgbGVhZGluZyB6ZXJvc1xuLy8gYmlnSW50ICBkdXAoeCkgICAgICAgICAgICAgICAgIC8vcmV0dXJuIGEgY29weSBvZiBiaWdJbnQgeFxuLy8gYm9vbGVhbiBlcXVhbHMoeCx5KSAgICAgICAgICAgIC8vaXMgdGhlIGJpZ0ludCB4IGVxdWFsIHRvIHRoZSBiaWdpbnQgeT9cbi8vIGJvb2xlYW4gZXF1YWxzSW50KHgseSkgICAgICAgICAvL2lzIGJpZ2ludCB4IGVxdWFsIHRvIGludGVnZXIgeT9cbi8vIGJpZ0ludCAgZXhwYW5kKHgsbikgICAgICAgICAgICAvL3JldHVybiBhIGNvcHkgb2YgeCB3aXRoIGF0IGxlYXN0IG4gZWxlbWVudHMsIGFkZGluZyBsZWFkaW5nIHplcm9zIGlmIG5lZWRlZFxuLy8gQXJyYXkgICBmaW5kUHJpbWVzKG4pICAgICAgICAgIC8vcmV0dXJuIGFycmF5IG9mIGFsbCBwcmltZXMgbGVzcyB0aGFuIGludGVnZXIgblxuLy8gYmlnSW50ICBHQ0QoeCx5KSAgICAgICAgICAgICAgIC8vcmV0dXJuIGdyZWF0ZXN0IGNvbW1vbiBkaXZpc29yIG9mIGJpZ0ludHMgeCBhbmQgeSAoZWFjaCB3aXRoIHNhbWUgbnVtYmVyIG9mIGVsZW1lbnRzKS5cbi8vIGJvb2xlYW4gZ3JlYXRlcih4LHkpICAgICAgICAgICAvL2lzIHg+eT8gICh4IGFuZCB5IGFyZSBub25uZWdhdGl2ZSBiaWdJbnRzKVxuLy8gYm9vbGVhbiBncmVhdGVyU2hpZnQoeCx5LHNoaWZ0KS8vaXMgKHggPDwoc2hpZnQqYnBlKSkgPiB5P1xuLy8gYmlnSW50ICBpbnQyYmlnSW50KHQsbixtKSAgICAgIC8vcmV0dXJuIGEgYmlnSW50IGVxdWFsIHRvIGludGVnZXIgdCwgd2l0aCBhdCBsZWFzdCBuIGJpdHMgYW5kIG0gYXJyYXkgZWxlbWVudHNcbi8vIGJpZ0ludCAgaW52ZXJzZU1vZCh4LG4pICAgICAgICAvL3JldHVybiAoeCoqKC0xKSBtb2QgbikgZm9yIGJpZ0ludHMgeCBhbmQgbi4gIElmIG5vIGludmVyc2UgZXhpc3RzLCBpdCByZXR1cm5zIG51bGxcbi8vIGludCAgICAgaW52ZXJzZU1vZEludCh4LG4pICAgICAvL3JldHVybiB4KiooLTEpIG1vZCBuLCBmb3IgaW50ZWdlcnMgeCBhbmQgbi4gIFJldHVybiAwIGlmIHRoZXJlIGlzIG5vIGludmVyc2Vcbi8vIGJvb2xlYW4gaXNaZXJvKHgpICAgICAgICAgICAgICAvL2lzIHRoZSBiaWdJbnQgeCBlcXVhbCB0byB6ZXJvP1xuLy8gYm9vbGVhbiBtaWxsZXJSYWJpbih4LGIpICAgICAgIC8vZG9lcyBvbmUgcm91bmQgb2YgTWlsbGVyLVJhYmluIGJhc2UgaW50ZWdlciBiIHNheSB0aGF0IGJpZ0ludCB4IGlzIHBvc3NpYmx5IHByaW1lPyAoYiBpcyBiaWdJbnQsIDE8Yjx4KVxuLy8gYm9vbGVhbiBtaWxsZXJSYWJpbkludCh4LGIpICAgIC8vZG9lcyBvbmUgcm91bmQgb2YgTWlsbGVyLVJhYmluIGJhc2UgaW50ZWdlciBiIHNheSB0aGF0IGJpZ0ludCB4IGlzIHBvc3NpYmx5IHByaW1lPyAoYiBpcyBpbnQsICAgIDE8Yjx4KVxuLy8gYmlnSW50ICBtb2QoeCxuKSAgICAgICAgICAgICAgIC8vcmV0dXJuIGEgbmV3IGJpZ0ludCBlcXVhbCB0byAoeCBtb2QgbikgZm9yIGJpZ0ludHMgeCBhbmQgbi5cbi8vIGludCAgICAgbW9kSW50KHgsbikgICAgICAgICAgICAvL3JldHVybiB4IG1vZCBuIGZvciBiaWdJbnQgeCBhbmQgaW50ZWdlciBuLlxuLy8gYmlnSW50ICBtdWx0KHgseSkgICAgICAgICAgICAgIC8vcmV0dXJuIHgqeSBmb3IgYmlnSW50cyB4IGFuZCB5LiBUaGlzIGlzIGZhc3RlciB3aGVuIHk8eC5cbi8vIGJpZ0ludCAgbXVsdE1vZCh4LHksbikgICAgICAgICAvL3JldHVybiAoeCp5IG1vZCBuKSBmb3IgYmlnSW50cyB4LHksbi4gIEZvciBncmVhdGVyIHNwZWVkLCBsZXQgeTx4LlxuLy8gYm9vbGVhbiBuZWdhdGl2ZSh4KSAgICAgICAgICAgIC8vaXMgYmlnSW50IHggbmVnYXRpdmU/XG4vLyBiaWdJbnQgIHBvd01vZCh4LHksbikgICAgICAgICAgLy9yZXR1cm4gKHgqKnkgbW9kIG4pIHdoZXJlIHgseSxuIGFyZSBiaWdJbnRzIGFuZCAqKiBpcyBleHBvbmVudGlhdGlvbi4gIDAqKjA9MS4gRmFzdGVyIGZvciBvZGQgbi5cbi8vIGJpZ0ludCAgcmFuZEJpZ0ludChuLHMpICAgICAgICAvL3JldHVybiBhbiBuLWJpdCByYW5kb20gQmlnSW50IChuPj0xKS4gIElmIHM9MSwgdGhlbiB0aGUgbW9zdCBzaWduaWZpY2FudCBvZiB0aG9zZSBuIGJpdHMgaXMgc2V0IHRvIDEuXG4vLyBiaWdJbnQgIHJhbmRUcnVlUHJpbWUoaykgICAgICAgLy9yZXR1cm4gYSBuZXcsIHJhbmRvbSwgay1iaXQsIHRydWUgcHJpbWUgYmlnSW50IHVzaW5nIE1hdXJlcidzIGFsZ29yaXRobS5cbi8vIGJpZ0ludCAgcmFuZFByb2JQcmltZShrKSAgICAgICAvL3JldHVybiBhIG5ldywgcmFuZG9tLCBrLWJpdCwgcHJvYmFibGUgcHJpbWUgYmlnSW50IChwcm9iYWJpbGl0eSBpdCdzIGNvbXBvc2l0ZSBsZXNzIHRoYW4gMl4tODApLlxuLy8gYmlnSW50ICBzdHIyYmlnSW50KHMsYixuLG0pICAgIC8vcmV0dXJuIGEgYmlnSW50IGZvciBudW1iZXIgcmVwcmVzZW50ZWQgaW4gc3RyaW5nIHMgaW4gYmFzZSBiIHdpdGggYXQgbGVhc3QgbiBiaXRzIGFuZCBtIGFycmF5IGVsZW1lbnRzXG4vLyBiaWdJbnQgIHN1Yih4LHkpICAgICAgICAgICAgICAgLy9yZXR1cm4gKHgteSkgZm9yIGJpZ0ludHMgeCBhbmQgeS4gIE5lZ2F0aXZlIGFuc3dlcnMgd2lsbCBiZSAycyBjb21wbGVtZW50XG4vLyBiaWdJbnQgIHRyaW0oeCxrKSAgICAgICAgICAgICAgLy9yZXR1cm4gYSBjb3B5IG9mIHggd2l0aCBleGFjdGx5IGsgbGVhZGluZyB6ZXJvIGVsZW1lbnRzXG4vL1xuLy9cbi8vIFRoZSBmb2xsb3dpbmcgZnVuY3Rpb25zIGVhY2ggaGF2ZSBhIG5vbi11bmRlcnNjb3JlZCB2ZXJzaW9uLCB3aGljaCBtb3N0IHVzZXJzIHNob3VsZCBjYWxsIGluc3RlYWQuXG4vLyBUaGVzZSBmdW5jdGlvbnMgZWFjaCB3cml0ZSB0byBhIHNpbmdsZSBwYXJhbWV0ZXIsIGFuZCB0aGUgY2FsbGVyIGlzIHJlc3BvbnNpYmxlIGZvciBlbnN1cmluZyB0aGUgYXJyYXlcbi8vIHBhc3NlZCBpbiBpcyBsYXJnZSBlbm91Z2ggdG8gaG9sZCB0aGUgcmVzdWx0LlxuLy9cbi8vIHZvaWQgICAgYWRkSW50Xyh4LG4pICAgICAgICAgIC8vZG8geD14K24gd2hlcmUgeCBpcyBhIGJpZ0ludCBhbmQgbiBpcyBhbiBpbnRlZ2VyXG4vLyB2b2lkICAgIGFkZF8oeCx5KSAgICAgICAgICAgICAvL2RvIHg9eCt5IGZvciBiaWdJbnRzIHggYW5kIHlcbi8vIHZvaWQgICAgY29weV8oeCx5KSAgICAgICAgICAgIC8vZG8geD15IG9uIGJpZ0ludHMgeCBhbmQgeVxuLy8gdm9pZCAgICBjb3B5SW50Xyh4LG4pICAgICAgICAgLy9kbyB4PW4gb24gYmlnSW50IHggYW5kIGludGVnZXIgblxuLy8gdm9pZCAgICBHQ0RfKHgseSkgICAgICAgICAgICAgLy9zZXQgeCB0byB0aGUgZ3JlYXRlc3QgY29tbW9uIGRpdmlzb3Igb2YgYmlnSW50cyB4IGFuZCB5LCAoeSBpcyBkZXN0cm95ZWQpLiAgKFRoaXMgbmV2ZXIgb3ZlcmZsb3dzIGl0cyBhcnJheSkuXG4vLyBib29sZWFuIGludmVyc2VNb2RfKHgsbikgICAgICAvL2RvIHg9eCoqKC0xKSBtb2QgbiwgZm9yIGJpZ0ludHMgeCBhbmQgbi4gUmV0dXJucyAxICgwKSBpZiBpbnZlcnNlIGRvZXMgKGRvZXNuJ3QpIGV4aXN0XG4vLyB2b2lkICAgIG1vZF8oeCxuKSAgICAgICAgICAgICAvL2RvIHg9eCBtb2QgbiBmb3IgYmlnSW50cyB4IGFuZCBuLiAoVGhpcyBuZXZlciBvdmVyZmxvd3MgaXRzIGFycmF5KS5cbi8vIHZvaWQgICAgbXVsdF8oeCx5KSAgICAgICAgICAgIC8vZG8geD14KnkgZm9yIGJpZ0ludHMgeCBhbmQgeS5cbi8vIHZvaWQgICAgbXVsdE1vZF8oeCx5LG4pICAgICAgIC8vZG8geD14KnkgIG1vZCBuIGZvciBiaWdJbnRzIHgseSxuLlxuLy8gdm9pZCAgICBwb3dNb2RfKHgseSxuKSAgICAgICAgLy9kbyB4PXgqKnkgbW9kIG4sIHdoZXJlIHgseSxuIGFyZSBiaWdJbnRzIChuIGlzIG9kZCkgYW5kICoqIGlzIGV4cG9uZW50aWF0aW9uLiAgMCoqMD0xLlxuLy8gdm9pZCAgICByYW5kQmlnSW50XyhiLG4scykgICAgLy9kbyBiID0gYW4gbi1iaXQgcmFuZG9tIEJpZ0ludC4gaWYgcz0xLCB0aGVuIG50aCBiaXQgKG1vc3Qgc2lnbmlmaWNhbnQgYml0KSBpcyBzZXQgdG8gMS4gbj49MS5cbi8vIHZvaWQgICAgcmFuZFRydWVQcmltZV8oYW5zLGspIC8vZG8gYW5zID0gYSByYW5kb20gay1iaXQgdHJ1ZSByYW5kb20gcHJpbWUgKG5vdCBqdXN0IHByb2JhYmxlIHByaW1lKSB3aXRoIDEgaW4gdGhlIG1zYi5cbi8vIHZvaWQgICAgc3ViXyh4LHkpICAgICAgICAgICAgIC8vZG8geD14LXkgZm9yIGJpZ0ludHMgeCBhbmQgeS4gTmVnYXRpdmUgYW5zd2VycyB3aWxsIGJlIDJzIGNvbXBsZW1lbnQuXG4vL1xuLy8gVGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgZG8gTk9UIGhhdmUgYSBub24tdW5kZXJzY29yZWQgdmVyc2lvbi5cbi8vIFRoZXkgZWFjaCB3cml0ZSBhIGJpZ0ludCByZXN1bHQgdG8gb25lIG9yIG1vcmUgcGFyYW1ldGVycy4gIFRoZSBjYWxsZXIgaXMgcmVzcG9uc2libGUgZm9yXG4vLyBlbnN1cmluZyB0aGUgYXJyYXlzIHBhc3NlZCBpbiBhcmUgbGFyZ2UgZW5vdWdoIHRvIGhvbGQgdGhlIHJlc3VsdHMuXG4vL1xuLy8gdm9pZCBhZGRTaGlmdF8oeCx5LHlzKSAgICAgICAvL2RvIHg9eCsoeTw8KHlzKmJwZSkpXG4vLyB2b2lkIGNhcnJ5Xyh4KSAgICAgICAgICAgICAgIC8vZG8gY2FycmllcyBhbmQgYm9ycm93cyBzbyBlYWNoIGVsZW1lbnQgb2YgdGhlIGJpZ0ludCB4IGZpdHMgaW4gYnBlIGJpdHMuXG4vLyB2b2lkIGRpdmlkZV8oeCx5LHEscikgICAgICAgIC8vZGl2aWRlIHggYnkgeSBnaXZpbmcgcXVvdGllbnQgcSBhbmQgcmVtYWluZGVyIHJcbi8vIGludCAgZGl2SW50Xyh4LG4pICAgICAgICAgICAgLy9kbyB4PWZsb29yKHgvbikgZm9yIGJpZ0ludCB4IGFuZCBpbnRlZ2VyIG4sIGFuZCByZXR1cm4gdGhlIHJlbWFpbmRlci4gKFRoaXMgbmV2ZXIgb3ZlcmZsb3dzIGl0cyBhcnJheSkuXG4vLyBpbnQgIGVHQ0RfKHgseSxkLGEsYikgICAgICAgIC8vc2V0cyBhLGIsZCB0byBwb3NpdGl2ZSBiaWdJbnRzIHN1Y2ggdGhhdCBkID0gR0NEXyh4LHkpID0gYSp4LWIqeVxuLy8gdm9pZCBoYWx2ZV8oeCkgICAgICAgICAgICAgICAvL2RvIHg9Zmxvb3IofHh8LzIpKnNnbih4KSBmb3IgYmlnSW50IHggaW4gMidzIGNvbXBsZW1lbnQuICAoVGhpcyBuZXZlciBvdmVyZmxvd3MgaXRzIGFycmF5KS5cbi8vIHZvaWQgbGVmdFNoaWZ0Xyh4LG4pICAgICAgICAgLy9sZWZ0IHNoaWZ0IGJpZ0ludCB4IGJ5IG4gYml0cy4gIG48YnBlLlxuLy8gdm9pZCBsaW5Db21iXyh4LHksYSxiKSAgICAgICAvL2RvIHg9YSp4K2IqeSBmb3IgYmlnSW50cyB4IGFuZCB5IGFuZCBpbnRlZ2VycyBhIGFuZCBiXG4vLyB2b2lkIGxpbkNvbWJTaGlmdF8oeCx5LGIseXMpIC8vZG8geD14K2IqKHk8PCh5cypicGUpKSBmb3IgYmlnSW50cyB4IGFuZCB5LCBhbmQgaW50ZWdlcnMgYiBhbmQgeXNcbi8vIHZvaWQgbW9udF8oeCx5LG4sbnApICAgICAgICAgLy9Nb250Z29tZXJ5IG11bHRpcGxpY2F0aW9uIChzZWUgY29tbWVudHMgd2hlcmUgdGhlIGZ1bmN0aW9uIGlzIGRlZmluZWQpXG4vLyB2b2lkIG11bHRJbnRfKHgsbikgICAgICAgICAgIC8vZG8geD14Km4gd2hlcmUgeCBpcyBhIGJpZ0ludCBhbmQgbiBpcyBhbiBpbnRlZ2VyLlxuLy8gdm9pZCByaWdodFNoaWZ0Xyh4LG4pICAgICAgICAvL3JpZ2h0IHNoaWZ0IGJpZ0ludCB4IGJ5IG4gYml0cy4gIDAgPD0gbiA8IGJwZS4gKFRoaXMgbmV2ZXIgb3ZlcmZsb3dzIGl0cyBhcnJheSkuXG4vLyB2b2lkIHNxdWFyZU1vZF8oeCxuKSAgICAgICAgIC8vZG8geD14KnggIG1vZCBuIGZvciBiaWdJbnRzIHgsblxuLy8gdm9pZCBzdWJTaGlmdF8oeCx5LHlzKSAgICAgICAvL2RvIHg9eC0oeTw8KHlzKmJwZSkpLiBOZWdhdGl2ZSBhbnN3ZXJzIHdpbGwgYmUgMnMgY29tcGxlbWVudC5cbi8vXG4vLyBUaGUgZm9sbG93aW5nIGZ1bmN0aW9ucyBhcmUgYmFzZWQgb24gYWxnb3JpdGhtcyBmcm9tIHRoZSBfSGFuZGJvb2sgb2YgQXBwbGllZCBDcnlwdG9ncmFwaHlfXG4vLyAgICBwb3dNb2RfKCkgICAgICAgICAgID0gYWxnb3JpdGhtIDE0Ljk0LCBNb250Z29tZXJ5IGV4cG9uZW50aWF0aW9uXG4vLyAgICBlR0NEXyxpbnZlcnNlTW9kXygpID0gYWxnb3JpdGhtIDE0LjYxLCBCaW5hcnkgZXh0ZW5kZWQgR0NEX1xuLy8gICAgR0NEXygpICAgICAgICAgICAgICA9IGFsZ29yb3RobSAxNC41NywgTGVobWVyJ3MgYWxnb3JpdGhtXG4vLyAgICBtb250XygpICAgICAgICAgICAgID0gYWxnb3JpdGhtIDE0LjM2LCBNb250Z29tZXJ5IG11bHRpcGxpY2F0aW9uXG4vLyAgICBkaXZpZGVfKCkgICAgICAgICAgID0gYWxnb3JpdGhtIDE0LjIwICBNdWx0aXBsZS1wcmVjaXNpb24gZGl2aXNpb25cbi8vICAgIHNxdWFyZU1vZF8oKSAgICAgICAgPSBhbGdvcml0aG0gMTQuMTYgIE11bHRpcGxlLXByZWNpc2lvbiBzcXVhcmluZ1xuLy8gICAgcmFuZFRydWVQcmltZV8oKSAgICA9IGFsZ29yaXRobSAgNC42MiwgTWF1cmVyJ3MgYWxnb3JpdGhtXG4vLyAgICBtaWxsZXJSYWJpbigpICAgICAgID0gYWxnb3JpdGhtICA0LjI0LCBNaWxsZXItUmFiaW4gYWxnb3JpdGhtXG4vL1xuLy8gUHJvZmlsaW5nIHNob3dzOlxuLy8gICAgIHJhbmRUcnVlUHJpbWVfKCkgc3BlbmRzOlxuLy8gICAgICAgICAxMCUgb2YgaXRzIHRpbWUgaW4gY2FsbHMgdG8gcG93TW9kXygpXG4vLyAgICAgICAgIDg1JSBvZiBpdHMgdGltZSBpbiBjYWxscyB0byBtaWxsZXJSYWJpbigpXG4vLyAgICAgbWlsbGVyUmFiaW4oKSBzcGVuZHM6XG4vLyAgICAgICAgIDk5JSBvZiBpdHMgdGltZSBpbiBjYWxscyB0byBwb3dNb2RfKCkgICAoYWx3YXlzIHdpdGggYSBiYXNlIG9mIDIpXG4vLyAgICAgcG93TW9kXygpIHNwZW5kczpcbi8vICAgICAgICAgOTQlIG9mIGl0cyB0aW1lIGluIGNhbGxzIHRvIG1vbnRfKCkgIChhbG1vc3QgYWx3YXlzIHdpdGggeD09eSlcbi8vXG4vLyBUaGlzIHN1Z2dlc3RzIHRoZXJlIGFyZSBzZXZlcmFsIHdheXMgdG8gc3BlZWQgdXAgdGhpcyBsaWJyYXJ5IHNsaWdodGx5OlxuLy8gICAgIC0gY29udmVydCBwb3dNb2RfIHRvIHVzZSBhIE1vbnRnb21lcnkgZm9ybSBvZiBrLWFyeSB3aW5kb3cgKG9yIG1heWJlIGEgTW9udGdvbWVyeSBmb3JtIG9mIHNsaWRpbmcgd2luZG93KVxuLy8gICAgICAgICAtLSB0aGlzIHNob3VsZCBlc3BlY2lhbGx5IGZvY3VzIG9uIGJlaW5nIGZhc3Qgd2hlbiByYWlzaW5nIDIgdG8gYSBwb3dlciBtb2QgblxuLy8gICAgIC0gY29udmVydCByYW5kVHJ1ZVByaW1lXygpIHRvIHVzZSBhIG1pbmltdW0gciBvZiAxLzMgaW5zdGVhZCBvZiAxLzIgd2l0aCB0aGUgYXBwcm9wcmlhdGUgY2hhbmdlIHRvIHRoZSB0ZXN0XG4vLyAgICAgLSB0dW5lIHRoZSBwYXJhbWV0ZXJzIGluIHJhbmRUcnVlUHJpbWVfKCksIGluY2x1ZGluZyBjLCBtLCBhbmQgcmVjTGltaXRcbi8vICAgICAtIHNwZWVkIHVwIHRoZSBzaW5nbGUgbG9vcCBpbiBtb250XygpIHRoYXQgdGFrZXMgOTUlIG9mIHRoZSBydW50aW1lLCBwZXJoYXBzIGJ5IHJlZHVjaW5nIGNoZWNraW5nXG4vLyAgICAgICB3aXRoaW4gdGhlIGxvb3Agd2hlbiBhbGwgdGhlIHBhcmFtZXRlcnMgYXJlIHRoZSBzYW1lIGxlbmd0aC5cbi8vXG4vLyBUaGVyZSBhcmUgc2V2ZXJhbCBpZGVhcyB0aGF0IGxvb2sgbGlrZSB0aGV5IHdvdWxkbid0IGhlbHAgbXVjaCBhdCBhbGw6XG4vLyAgICAgLSByZXBsYWNpbmcgdHJpYWwgZGl2aXNpb24gaW4gcmFuZFRydWVQcmltZV8oKSB3aXRoIGEgc2lldmUgKHRoYXQgc3BlZWRzIHVwIHNvbWV0aGluZyB0YWtpbmcgYWxtb3N0IG5vIHRpbWUgYW55d2F5KVxuLy8gICAgIC0gaW5jcmVhc2UgYnBlIGZyb20gMTUgdG8gMzAgKHRoYXQgd291bGQgaGVscCBpZiB3ZSBoYWQgYSAzMiozMi0+NjQgbXVsdGlwbGllciwgYnV0IG5vdCB3aXRoIEphdmFTY3JpcHQncyAzMiozMi0+MzIpXG4vLyAgICAgLSBzcGVlZGluZyB1cCBtb250Xyh4LHksbixucCkgd2hlbiB4PT15IGJ5IGRvaW5nIGEgbm9uLW1vZHVsYXIsIG5vbi1Nb250Z29tZXJ5IHNxdWFyZVxuLy8gICAgICAgZm9sbG93ZWQgYnkgYSBNb250Z29tZXJ5IHJlZHVjdGlvbi4gIFRoZSBpbnRlcm1lZGlhdGUgYW5zd2VyIHdpbGwgYmUgdHdpY2UgYXMgbG9uZyBhcyB4LCBzbyB0aGF0XG4vLyAgICAgICBtZXRob2Qgd291bGQgYmUgc2xvd2VyLiAgVGhpcyBpcyB1bmZvcnR1bmF0ZSBiZWNhdXNlIHRoZSBjb2RlIGN1cnJlbnRseSBzcGVuZHMgYWxtb3N0IGFsbCBvZiBpdHMgdGltZVxuLy8gICAgICAgZG9pbmcgbW9udF8oeCx4LC4uLiksIGJvdGggZm9yIHJhbmRUcnVlUHJpbWVfKCkgYW5kIHBvd01vZF8oKS4gIEEgZmFzdGVyIG1ldGhvZCBmb3IgTW9udGdvbWVyeSBzcXVhcmluZ1xuLy8gICAgICAgd291bGQgaGF2ZSBhIGxhcmdlIGltcGFjdCBvbiB0aGUgc3BlZWQgb2YgcmFuZFRydWVQcmltZV8oKSBhbmQgcG93TW9kXygpLiAgSEFDIGhhcyBhIGNvdXBsZSBvZiBwb29ybHktd29yZGVkXG4vLyAgICAgICBzZW50ZW5jZXMgdGhhdCBzZWVtIHRvIGltcGx5IGl0J3MgZmFzdGVyIHRvIGRvIGEgbm9uLW1vZHVsYXIgc3F1YXJlIGZvbGxvd2VkIGJ5IGEgc2luZ2xlXG4vLyAgICAgICBNb250Z29tZXJ5IHJlZHVjdGlvbiwgYnV0IHRoYXQncyBvYnZpb3VzbHkgd3JvbmcuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vL2dsb2JhbHNcbnZhciBicGUgPSAwOyAvL2JpdHMgc3RvcmVkIHBlciBhcnJheSBlbGVtZW50XG52YXIgbWFzayA9IDA7IC8vQU5EIHRoaXMgd2l0aCBhbiBhcnJheSBlbGVtZW50IHRvIGNob3AgaXQgZG93biB0byBicGUgYml0c1xudmFyIHJhZGl4ID0gbWFzayArIDE7IC8vZXF1YWxzIDJeYnBlLiAgQSBzaW5nbGUgMSBiaXQgdG8gdGhlIGxlZnQgb2YgdGhlIGxhc3QgYml0IG9mIG1hc2suXG4vL3RoZSBkaWdpdHMgZm9yIGNvbnZlcnRpbmcgdG8gZGlmZmVyZW50IGJhc2VzXG5jb25zdCBkaWdpdHNTdHIgPSBcIjAxMjM0NTY3ODlBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6Xz0hQCMkJV4mKigpW117fXw7OiwuPD4vP2B+IFxcXFwnXFxcIistXCI7XG4vL2luaXRpYWxpemUgdGhlIGdsb2JhbCB2YXJpYWJsZXNcbmZvciAoYnBlID0gMDsgMSA8PCAoYnBlICsgMSkgPiAxIDw8IGJwZTsgYnBlKyspXG4gICAgOyAvL2JwZT1udW1iZXIgb2YgYml0cyBpbiB0aGUgbWFudGlzc2Egb24gdGhpcyBwbGF0Zm9ybVxuYnBlID4+PSAxOyAvL2JwZT1udW1iZXIgb2YgYml0cyBpbiBvbmUgZWxlbWVudCBvZiB0aGUgYXJyYXkgcmVwcmVzZW50aW5nIHRoZSBiaWdJbnRcbm1hc2sgPSAoMSA8PCBicGUpIC0gMTsgLy9BTkQgdGhlIG1hc2sgd2l0aCBhbiBpbnRlZ2VyIHRvIGdldCBpdHMgYnBlIGxlYXN0IHNpZ25pZmljYW50IGJpdHNcbnJhZGl4ID0gbWFzayArIDE7IC8vMl5icGUuICBhIHNpbmdsZSAxIGJpdCB0byB0aGUgbGVmdCBvZiB0aGUgZmlyc3QgYml0IG9mIG1hc2tcbmNvbnN0IG9uZSA9IGludDJiaWdJbnQoMSwgMSwgMSk7IC8vY29uc3RhbnQgdXNlZCBpbiBwb3dNb2RfKClcbi8vdGhlIGZvbGxvd2luZyBnbG9iYWwgdmFyaWFibGVzIGFyZSBzY3JhdGNocGFkIG1lbW9yeSB0b1xuLy9yZWR1Y2UgZHluYW1pYyBtZW1vcnkgYWxsb2NhdGlvbiBpbiB0aGUgaW5uZXIgbG9vcFxudmFyIHQgPSBuZXcgQXJyYXkoMCk7XG52YXIgc3MgPSB0OyAvL3VzZWQgaW4gbXVsdF8oKVxudmFyIHMwID0gdDsgLy91c2VkIGluIG11bHRNb2RfKCksIHNxdWFyZU1vZF8oKVxudmFyIHMxID0gdDsgLy91c2VkIGluIHBvd01vZF8oKSwgbXVsdE1vZF8oKSwgc3F1YXJlTW9kXygpXG52YXIgczIgPSB0OyAvL3VzZWQgaW4gcG93TW9kXygpLCBtdWx0TW9kXygpXG52YXIgczMgPSB0OyAvL3VzZWQgaW4gcG93TW9kXygpXG52YXIgczQgPSB0O1xudmFyIHM1ID0gdDsgLy91c2VkIGluIG1vZF8oKVxudmFyIHM2ID0gdDsgLy91c2VkIGluIGJpZ0ludDJzdHIoKVxudmFyIHM3ID0gdDsgLy91c2VkIGluIHBvd01vZF8oKVxudmFyIFQgPSB0OyAvL3VzZWQgaW4gR0NEXygpXG52YXIgc2EgPSB0OyAvL3VzZWQgaW4gbW9udF8oKVxudmFyIG1yX3gxID0gdDtcbnZhciBtcl9yID0gdDtcbnZhciBtcl9hID0gdDsgLy91c2VkIGluIG1pbGxlclJhYmluKClcbnZhciBlZ192ID0gdDtcbnZhciBlZ191ID0gdDtcbnZhciBlZ19BID0gdDtcbnZhciBlZ19CID0gdDtcbnZhciBlZ19DID0gdDtcbnZhciBlZ19EID0gdDsgLy91c2VkIGluIGVHQ0RfKCksIGludmVyc2VNb2RfKClcbnZhciBtZF9xMSA9IHQ7XG52YXIgbWRfcTIgPSB0O1xudmFyIG1kX3EzID0gdDtcbnZhciBtZF9yID0gdDtcbnZhciBtZF9yMSA9IHQ7XG52YXIgbWRfcjIgPSB0O1xudmFyIG1kX3R0ID0gdDsgLy91c2VkIGluIG1vZF8oKVxudmFyIHByaW1lcyA9IHQ7XG52YXIgcG93cyA9IHQ7XG52YXIgc19pID0gdDtcbnZhciBzX2kyID0gdDtcbnZhciBzX1IgPSB0O1xudmFyIHNfcm0gPSB0O1xudmFyIHNfcSA9IHQ7XG52YXIgc19uMSA9IHQ7XG52YXIgc19hID0gdDtcbnZhciBzX3IyID0gdDtcbnZhciBzX24gPSB0O1xudmFyIHNfYiA9IHQ7XG52YXIgc19kID0gdDtcbnZhciBzX3gxID0gdDtcbnZhciBzX3gyID0gdDtcbnZhciBzX2FhID0gdDsgLy91c2VkIGluIHJhbmRUcnVlUHJpbWVfKClcbnZhciBycHByYiA9IHQ7IC8vdXNlZCBpbiByYW5kUHJvYlByaW1lUm91bmRzKCkgKHdoaWNoIGFsc28gdXNlcyBcInByaW1lc1wiKVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy9yZXR1cm4gYXJyYXkgb2YgYWxsIHByaW1lcyBsZXNzIHRoYW4gaW50ZWdlciBuXG5mdW5jdGlvbiBmaW5kUHJpbWVzKG4pIHtcbiAgICB2YXIgaSwgcywgcCwgYW5zO1xuICAgIHMgPSBuZXcgQXJyYXkobik7XG4gICAgZm9yIChpID0gMDsgaSA8IG47IGkrKylcbiAgICAgICAgc1tpXSA9IDA7XG4gICAgc1swXSA9IDI7XG4gICAgcCA9IDA7IC8vZmlyc3QgcCBlbGVtZW50cyBvZiBzIGFyZSBwcmltZXMsIHRoZSByZXN0IGFyZSBhIHNpZXZlXG4gICAgZm9yICg7IHNbcF0gPCBuOykge1xuICAgICAgICAvL3NbcF0gaXMgdGhlIHB0aCBwcmltZVxuICAgICAgICBmb3IgKGkgPSBzW3BdICogc1twXTsgaSA8IG47IGkgKz0gc1twXSAvL21hcmsgbXVsdGlwbGVzIG9mIHNbcF1cbiAgICAgICAgKVxuICAgICAgICAgICAgc1tpXSA9IDE7XG4gICAgICAgIHArKztcbiAgICAgICAgc1twXSA9IHNbcCAtIDFdICsgMTtcbiAgICAgICAgZm9yICg7IHNbcF0gPCBuICYmIHNbc1twXV07IHNbcF0rKylcbiAgICAgICAgICAgIDsgLy9maW5kIG5leHQgcHJpbWUgKHdoZXJlIHNbcF09PTApXG4gICAgfVxuICAgIGFucyA9IG5ldyBBcnJheShwKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgcDsgaSsrKVxuICAgICAgICBhbnNbaV0gPSBzW2ldO1xuICAgIHJldHVybiBhbnM7XG59XG4vL2RvZXMgYSBzaW5nbGUgcm91bmQgb2YgTWlsbGVyLVJhYmluIGJhc2UgYiBjb25zaWRlciB4IHRvIGJlIGEgcG9zc2libGUgcHJpbWU/XG4vL3ggaXMgYSBiaWdJbnQsIGFuZCBiIGlzIGFuIGludGVnZXIsIHdpdGggYjx4XG5mdW5jdGlvbiBtaWxsZXJSYWJpbkludCh4LCBiKSB7XG4gICAgaWYgKG1yX3gxLmxlbmd0aCAhPSB4Lmxlbmd0aCkge1xuICAgICAgICBtcl94MSA9IGR1cCh4KTtcbiAgICAgICAgbXJfciA9IGR1cCh4KTtcbiAgICAgICAgbXJfYSA9IGR1cCh4KTtcbiAgICB9XG4gICAgY29weUludF8obXJfYSwgYik7XG4gICAgcmV0dXJuIG1pbGxlclJhYmluKHgsIG1yX2EpO1xufVxuLy9kb2VzIGEgc2luZ2xlIHJvdW5kIG9mIE1pbGxlci1SYWJpbiBiYXNlIGIgY29uc2lkZXIgeCB0byBiZSBhIHBvc3NpYmxlIHByaW1lP1xuLy94IGFuZCBiIGFyZSBiaWdJbnRzIHdpdGggYjx4XG5mdW5jdGlvbiBtaWxsZXJSYWJpbih4LCBiKSB7XG4gICAgdmFyIGksIGosIGssIHM7XG4gICAgaWYgKG1yX3gxLmxlbmd0aCAhPSB4Lmxlbmd0aCkge1xuICAgICAgICBtcl94MSA9IGR1cCh4KTtcbiAgICAgICAgbXJfciA9IGR1cCh4KTtcbiAgICAgICAgbXJfYSA9IGR1cCh4KTtcbiAgICB9XG4gICAgY29weV8obXJfYSwgYik7XG4gICAgY29weV8obXJfciwgeCk7XG4gICAgY29weV8obXJfeDEsIHgpO1xuICAgIGFkZEludF8obXJfciwgLTEpO1xuICAgIGFkZEludF8obXJfeDEsIC0xKTtcbiAgICAvL3M9dGhlIGhpZ2hlc3QgcG93ZXIgb2YgdHdvIHRoYXQgZGl2aWRlcyBtcl9yXG4gICAgayA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IG1yX3IubGVuZ3RoOyBpKyspXG4gICAgICAgIGZvciAoaiA9IDE7IGogPCBtYXNrOyBqIDw8PSAxKVxuICAgICAgICAgICAgaWYgKHhbaV0gJiBqKSB7XG4gICAgICAgICAgICAgICAgcyA9IGsgPCBtcl9yLmxlbmd0aCArIGJwZSA/IGsgOiAwO1xuICAgICAgICAgICAgICAgIGkgPSBtcl9yLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBqID0gbWFzaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGsrKztcbiAgICAgICAgICAgIH1cbiAgICBpZiAocykge1xuICAgICAgICByaWdodFNoaWZ0Xyhtcl9yLCBzKTtcbiAgICB9XG4gICAgcG93TW9kXyhtcl9hLCBtcl9yLCB4KTtcbiAgICBpZiAoIWVxdWFsc0ludChtcl9hLCAxKSAmJiAhZXF1YWxzKG1yX2EsIG1yX3gxKSkge1xuICAgICAgICBqID0gMTtcbiAgICAgICAgd2hpbGUgKGogPD0gcyAtIDEgJiYgIWVxdWFscyhtcl9hLCBtcl94MSkpIHtcbiAgICAgICAgICAgIHNxdWFyZU1vZF8obXJfYSwgeCk7XG4gICAgICAgICAgICBpZiAoZXF1YWxzSW50KG1yX2EsIDEpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFlcXVhbHMobXJfYSwgbXJfeDEpKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMTtcbn1cbi8vcmV0dXJucyBob3cgbWFueSBiaXRzIGxvbmcgdGhlIGJpZ0ludCBpcywgbm90IGNvdW50aW5nIGxlYWRpbmcgemVyb3MuXG5mdW5jdGlvbiBiaXRTaXplKHgpIHtcbiAgICB2YXIgaiwgeiwgdztcbiAgICBmb3IgKGogPSB4Lmxlbmd0aCAtIDE7IHhbal0gPT0gMCAmJiBqID4gMDsgai0tKVxuICAgICAgICA7XG4gICAgZm9yICh6ID0gMCwgdyA9IHhbal07IHc7IHcgPj49IDEsIHorKylcbiAgICAgICAgO1xuICAgIHogKz0gYnBlICogajtcbiAgICByZXR1cm4gejtcbn1cbi8vcmV0dXJuIGEgY29weSBvZiB4IHdpdGggYXQgbGVhc3QgbiBlbGVtZW50cywgYWRkaW5nIGxlYWRpbmcgemVyb3MgaWYgbmVlZGVkXG5mdW5jdGlvbiBleHBhbmQoeCwgbikge1xuICAgIHZhciBhbnMgPSBpbnQyYmlnSW50KDAsICh4Lmxlbmd0aCA+IG4gPyB4Lmxlbmd0aCA6IG4pICogYnBlLCAwKTtcbiAgICBjb3B5XyhhbnMsIHgpO1xuICAgIHJldHVybiBhbnM7XG59XG4vL3JldHVybiBhIGstYml0IHRydWUgcmFuZG9tIHByaW1lIHVzaW5nIE1hdXJlcidzIGFsZ29yaXRobS5cbmZ1bmN0aW9uIHJhbmRUcnVlUHJpbWUoaykge1xuICAgIHZhciBhbnMgPSBpbnQyYmlnSW50KDAsIGssIDApO1xuICAgIHJhbmRUcnVlUHJpbWVfKGFucywgayk7XG4gICAgcmV0dXJuIHRyaW0oYW5zLCAxKTtcbn1cbi8vcmV0dXJuIGEgay1iaXQgcmFuZG9tIHByb2JhYmxlIHByaW1lIHdpdGggcHJvYmFiaWxpdHkgb2YgZXJyb3IgPCAyXi04MFxuZnVuY3Rpb24gcmFuZFByb2JQcmltZShrKSB7XG4gICAgaWYgKGsgPj0gNjAwKVxuICAgICAgICByZXR1cm4gcmFuZFByb2JQcmltZVJvdW5kcyhrLCAyKTsgLy9udW1iZXJzIGZyb20gSEFDIHRhYmxlIDQuM1xuICAgIGlmIChrID49IDU1MClcbiAgICAgICAgcmV0dXJuIHJhbmRQcm9iUHJpbWVSb3VuZHMoaywgNCk7XG4gICAgaWYgKGsgPj0gNTAwKVxuICAgICAgICByZXR1cm4gcmFuZFByb2JQcmltZVJvdW5kcyhrLCA1KTtcbiAgICBpZiAoayA+PSA0MDApXG4gICAgICAgIHJldHVybiByYW5kUHJvYlByaW1lUm91bmRzKGssIDYpO1xuICAgIGlmIChrID49IDM1MClcbiAgICAgICAgcmV0dXJuIHJhbmRQcm9iUHJpbWVSb3VuZHMoaywgNyk7XG4gICAgaWYgKGsgPj0gMzAwKVxuICAgICAgICByZXR1cm4gcmFuZFByb2JQcmltZVJvdW5kcyhrLCA5KTtcbiAgICBpZiAoayA+PSAyNTApXG4gICAgICAgIHJldHVybiByYW5kUHJvYlByaW1lUm91bmRzKGssIDEyKTsgLy9udW1iZXJzIGZyb20gSEFDIHRhYmxlIDQuNFxuICAgIGlmIChrID49IDIwMClcbiAgICAgICAgcmV0dXJuIHJhbmRQcm9iUHJpbWVSb3VuZHMoaywgMTUpO1xuICAgIGlmIChrID49IDE1MClcbiAgICAgICAgcmV0dXJuIHJhbmRQcm9iUHJpbWVSb3VuZHMoaywgMTgpO1xuICAgIGlmIChrID49IDEwMClcbiAgICAgICAgcmV0dXJuIHJhbmRQcm9iUHJpbWVSb3VuZHMoaywgMjcpO1xuICAgIHJldHVybiByYW5kUHJvYlByaW1lUm91bmRzKGssIDQwKTsgLy9udW1iZXIgZnJvbSBIQUMgcmVtYXJrIDQuMjYgKG9ubHkgYW4gZXN0aW1hdGUpXG59XG4vL3JldHVybiBhIGstYml0IHByb2JhYmxlIHJhbmRvbSBwcmltZSB1c2luZyBuIHJvdW5kcyBvZiBNaWxsZXIgUmFiaW4gKGFmdGVyIHRyaWFsIGRpdmlzaW9uIHdpdGggc21hbGwgcHJpbWVzKVxuZnVuY3Rpb24gcmFuZFByb2JQcmltZVJvdW5kcyhrLCBuKSB7XG4gICAgdmFyIGFucywgaSwgZGl2aXNpYmxlLCBCO1xuICAgIEIgPSAzMDAwMDsgLy9CIGlzIGxhcmdlc3QgcHJpbWUgdG8gdXNlIGluIHRyaWFsIGRpdmlzaW9uXG4gICAgYW5zID0gaW50MmJpZ0ludCgwLCBrLCAwKTtcbiAgICAvL29wdGltaXphdGlvbjogdHJ5IGxhcmdlciBhbmQgc21hbGxlciBCIHRvIGZpbmQgdGhlIGJlc3QgbGltaXQuXG4gICAgaWYgKHByaW1lcy5sZW5ndGggPT0gMCkge1xuICAgICAgICBwcmltZXMgPSBmaW5kUHJpbWVzKDMwMDAwKTtcbiAgICB9IC8vY2hlY2sgZm9yIGRpdmlzaWJpbGl0eSBieSBwcmltZXMgPD0zMDAwMFxuICAgIGlmIChycHByYi5sZW5ndGggIT0gYW5zLmxlbmd0aCkge1xuICAgICAgICBycHByYiA9IGR1cChhbnMpO1xuICAgIH1cbiAgICBmb3IgKDs7KSB7XG4gICAgICAgIC8va2VlcCB0cnlpbmcgcmFuZG9tIHZhbHVlcyBmb3IgYW5zIHVudGlsIG9uZSBhcHBlYXJzIHRvIGJlIHByaW1lXG4gICAgICAgIC8vb3B0aW1pemF0aW9uOiBwaWNrIGEgcmFuZG9tIG51bWJlciB0aW1lcyBMPTIqMyo1Ki4uLipwLCBwbHVzIGFcbiAgICAgICAgLy8gICByYW5kb20gZWxlbWVudCBvZiB0aGUgbGlzdCBvZiBhbGwgbnVtYmVycyBpbiBbMCxMKSBub3QgZGl2aXNpYmxlIGJ5IGFueSBwcmltZSB1cCB0byBwLlxuICAgICAgICAvLyAgIFRoaXMgY2FuIHJlZHVjZSB0aGUgYW1vdW50IG9mIHJhbmRvbSBudW1iZXIgZ2VuZXJhdGlvbi5cbiAgICAgICAgcmFuZEJpZ0ludF8oYW5zLCBrLCAwKTsgLy9hbnMgPSBhIHJhbmRvbSBvZGQgbnVtYmVyIHRvIGNoZWNrXG4gICAgICAgIGFuc1swXSB8PSAxO1xuICAgICAgICBkaXZpc2libGUgPSAwO1xuICAgICAgICAvL2NoZWNrIGFucyBmb3IgZGl2aXNpYmlsaXR5IGJ5IHNtYWxsIHByaW1lcyB1cCB0byBCXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBwcmltZXMubGVuZ3RoICYmIHByaW1lc1tpXSA8PSBCOyBpKyspXG4gICAgICAgICAgICBpZiAobW9kSW50KGFucywgcHJpbWVzW2ldKSA9PSAwICYmICFlcXVhbHNJbnQoYW5zLCBwcmltZXNbaV0pKSB7XG4gICAgICAgICAgICAgICAgZGl2aXNpYmxlID0gMTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgLy9vcHRpbWl6YXRpb246IGNoYW5nZSBtaWxsZXJSYWJpbiBzbyB0aGUgYmFzZSBjYW4gYmUgYmlnZ2VyIHRoYW4gdGhlIG51bWJlciBiZWluZyBjaGVja2VkLCB0aGVuIGVsaW1pbmF0ZSB0aGUgd2hpbGUgaGVyZS5cbiAgICAgICAgLy9kbyBuIHJvdW5kcyBvZiBNaWxsZXIgUmFiaW4sIHdpdGggcmFuZG9tIGJhc2VzIGxlc3MgdGhhbiBhbnNcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG4gJiYgIWRpdmlzaWJsZTsgaSsrKSB7XG4gICAgICAgICAgICByYW5kQmlnSW50XyhycHByYiwgaywgMCk7XG4gICAgICAgICAgICB3aGlsZSAoIWdyZWF0ZXIoYW5zLCBycHByYikpXG4gICAgICAgICAgICAgICAgLy9waWNrIGEgcmFuZG9tIHJwcHJiIHRoYXQncyA8IGFuc1xuICAgICAgICAgICAgICAgIHJhbmRCaWdJbnRfKHJwcHJiLCBrLCAwKTtcbiAgICAgICAgICAgIGlmICghbWlsbGVyUmFiaW4oYW5zLCBycHByYikpIHtcbiAgICAgICAgICAgICAgICBkaXZpc2libGUgPSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZGl2aXNpYmxlKSB7XG4gICAgICAgICAgICByZXR1cm4gYW5zO1xuICAgICAgICB9XG4gICAgfVxufVxuLy9yZXR1cm4gYSBuZXcgYmlnSW50IGVxdWFsIHRvICh4IG1vZCBuKSBmb3IgYmlnSW50cyB4IGFuZCBuLlxuZnVuY3Rpb24gbW9kKHgsIG4pIHtcbiAgICB2YXIgYW5zID0gZHVwKHgpO1xuICAgIG1vZF8oYW5zLCBuKTtcbiAgICByZXR1cm4gdHJpbShhbnMsIDEpO1xufVxuLy9yZXR1cm4gKHgrbikgd2hlcmUgeCBpcyBhIGJpZ0ludCBhbmQgbiBpcyBhbiBpbnRlZ2VyLlxuZnVuY3Rpb24gYWRkSW50KHgsIG4pIHtcbiAgICB2YXIgYW5zID0gZXhwYW5kKHgsIHgubGVuZ3RoICsgMSk7XG4gICAgYWRkSW50XyhhbnMsIG4pO1xuICAgIHJldHVybiB0cmltKGFucywgMSk7XG59XG4vL3JldHVybiB4KnkgZm9yIGJpZ0ludHMgeCBhbmQgeS4gVGhpcyBpcyBmYXN0ZXIgd2hlbiB5PHguXG5mdW5jdGlvbiBtdWx0KHgsIHkpIHtcbiAgICB2YXIgYW5zID0gZXhwYW5kKHgsIHgubGVuZ3RoICsgeS5sZW5ndGgpO1xuICAgIG11bHRfKGFucywgeSk7XG4gICAgcmV0dXJuIHRyaW0oYW5zLCAxKTtcbn1cbi8vcmV0dXJuICh4Kip5IG1vZCBuKSB3aGVyZSB4LHksbiBhcmUgYmlnSW50cyBhbmQgKiogaXMgZXhwb25lbnRpYXRpb24uICAwKiowPTEuIEZhc3RlciBmb3Igb2RkIG4uXG5mdW5jdGlvbiBwb3dNb2QoeCwgeSwgbikge1xuICAgIHZhciBhbnMgPSBleHBhbmQoeCwgbi5sZW5ndGgpO1xuICAgIHBvd01vZF8oYW5zLCB0cmltKHksIDIpLCB0cmltKG4sIDIpLCAwKTsgLy90aGlzIHNob3VsZCB3b3JrIHdpdGhvdXQgdGhlIHRyaW0sIGJ1dCBkb2Vzbid0XG4gICAgcmV0dXJuIHRyaW0oYW5zLCAxKTtcbn1cbi8vcmV0dXJuICh4LXkpIGZvciBiaWdJbnRzIHggYW5kIHkuICBOZWdhdGl2ZSBhbnN3ZXJzIHdpbGwgYmUgMnMgY29tcGxlbWVudFxuZnVuY3Rpb24gc3ViKHgsIHkpIHtcbiAgICB2YXIgYW5zID0gZXhwYW5kKHgsIHgubGVuZ3RoID4geS5sZW5ndGggPyB4Lmxlbmd0aCArIDEgOiB5Lmxlbmd0aCArIDEpO1xuICAgIHN1Yl8oYW5zLCB5KTtcbiAgICByZXR1cm4gdHJpbShhbnMsIDEpO1xufVxuLy9yZXR1cm4gKHgreSkgZm9yIGJpZ0ludHMgeCBhbmQgeS5cbmZ1bmN0aW9uIGFkZCh4LCB5KSB7XG4gICAgdmFyIGFucyA9IGV4cGFuZCh4LCB4Lmxlbmd0aCA+IHkubGVuZ3RoID8geC5sZW5ndGggKyAxIDogeS5sZW5ndGggKyAxKTtcbiAgICBhZGRfKGFucywgeSk7XG4gICAgcmV0dXJuIHRyaW0oYW5zLCAxKTtcbn1cbi8vcmV0dXJuICh4KiooLTEpIG1vZCBuKSBmb3IgYmlnSW50cyB4IGFuZCBuLiAgSWYgbm8gaW52ZXJzZSBleGlzdHMsIGl0IHJldHVybnMgbnVsbFxuZnVuY3Rpb24gaW52ZXJzZU1vZCh4LCBuKSB7XG4gICAgdmFyIGFucyA9IGV4cGFuZCh4LCBuLmxlbmd0aCk7XG4gICAgdmFyIHM7XG4gICAgcyA9IGludmVyc2VNb2RfKGFucywgbik7XG4gICAgcmV0dXJuIHMgPyB0cmltKGFucywgMSkgOiBudWxsO1xufVxuLy9yZXR1cm4gKHgqeSBtb2QgbikgZm9yIGJpZ0ludHMgeCx5LG4uICBGb3IgZ3JlYXRlciBzcGVlZCwgbGV0IHk8eC5cbmZ1bmN0aW9uIG11bHRNb2QoeCwgeSwgbikge1xuICAgIHZhciBhbnMgPSBleHBhbmQoeCwgbi5sZW5ndGgpO1xuICAgIG11bHRNb2RfKGFucywgeSwgbik7XG4gICAgcmV0dXJuIHRyaW0oYW5zLCAxKTtcbn1cbi8qIFRVVEFPOiBub3QgdXNlZFxuIC8vZ2VuZXJhdGUgYSBrLWJpdCB0cnVlIHJhbmRvbSBwcmltZSB1c2luZyBNYXVyZXIncyBhbGdvcml0aG0sXG4gLy9hbmQgcHV0IGl0IGludG8gYW5zLiAgVGhlIGJpZ0ludCBhbnMgbXVzdCBiZSBsYXJnZSBlbm91Z2ggdG8gaG9sZCBpdC5cbiBmdW5jdGlvbiByYW5kVHJ1ZVByaW1lXyhhbnMsaykge1xuIHZhciBjLG0scG0sZGQsaixyLEIsZGl2aXNpYmxlLHosenoscmVjU2l6ZTtcblxuIGlmIChwcmltZXMubGVuZ3RoPT0wKVxuIHByaW1lcz1maW5kUHJpbWVzKDMwMDAwKTsgIC8vY2hlY2sgZm9yIGRpdmlzaWJpbGl0eSBieSBwcmltZXMgPD0zMDAwMFxuXG4gaWYgKHBvd3MubGVuZ3RoPT0wKSB7XG4gcG93cz1uZXcgQXJyYXkoNTEyKTtcbiBmb3IgKGo9MDtqPDUxMjtqKyspIHtcbiBwb3dzW2pdPU1hdGgucG93KDIsai81MTEuLTEuKTtcbiB9XG4gfVxuXG4gLy9jIGFuZCBtIHNob3VsZCBiZSB0dW5lZCBmb3IgYSBwYXJ0aWN1bGFyIG1hY2hpbmUgYW5kIHZhbHVlIG9mIGssIHRvIG1heGltaXplIHNwZWVkXG4gYz0wLjE7ICAvL2M9MC4xIGluIEhBQ1xuIG09MjA7ICAgLy9nZW5lcmF0ZSB0aGlzIGstYml0IG51bWJlciBieSBmaXJzdCByZWN1cnNpdmVseSBnZW5lcmF0aW5nIGEgbnVtYmVyIHRoYXQgaGFzIGJldHdlZW4gay8yIGFuZCBrLW0gYml0c1xuIHJlY0xpbWl0PTIwOyAvL3N0b3AgcmVjdXJzaW9uIHdoZW4gayA8PXJlY0xpbWl0LiAgTXVzdCBoYXZlIHJlY0xpbWl0ID49IDJcblxuIGlmIChzX2kyLmxlbmd0aCE9YW5zLmxlbmd0aCkge1xuIHNfaTI9ZHVwKGFucyk7XG4gc19SID1kdXAoYW5zKTtcbiBzX24xPWR1cChhbnMpO1xuIHNfcjI9ZHVwKGFucyk7XG4gc19kID1kdXAoYW5zKTtcbiBzX3gxPWR1cChhbnMpO1xuIHNfeDI9ZHVwKGFucyk7XG4gc19iID1kdXAoYW5zKTtcbiBzX24gPWR1cChhbnMpO1xuIHNfaSA9ZHVwKGFucyk7XG4gc19ybT1kdXAoYW5zKTtcbiBzX3EgPWR1cChhbnMpO1xuIHNfYSA9ZHVwKGFucyk7XG4gc19hYT1kdXAoYW5zKTtcbiB9XG5cbiBpZiAoayA8PSByZWNMaW1pdCkgeyAgLy9nZW5lcmF0ZSBzbWFsbCByYW5kb20gcHJpbWVzIGJ5IHRyaWFsIGRpdmlzaW9uIHVwIHRvIGl0cyBzcXVhcmUgcm9vdFxuIHBtPSgxPDwoKGsrMik+PjEpKS0xOyAvL3BtIGlzIGJpbmFyeSBudW1iZXIgd2l0aCBhbGwgb25lcywganVzdCBvdmVyIHNxcnQoMl5rKVxuIGNvcHlJbnRfKGFucywwKTtcbiBmb3IgKGRkPTE7ZGQ7KSB7XG4gZGQ9MDtcbiBhbnNbMF09IDEgfCAoMTw8KGstMSkpIHwgTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKigxPDxrKSk7ICAvL3JhbmRvbSwgay1iaXQsIG9kZCBpbnRlZ2VyLCB3aXRoIG1zYiAxXG4gZm9yIChqPTE7KGo8cHJpbWVzLmxlbmd0aCkgJiYgKChwcmltZXNbal0mcG0pPT1wcmltZXNbal0pO2orKykgeyAvL3RyaWFsIGRpdmlzaW9uIGJ5IGFsbCBwcmltZXMgMy4uLnNxcnQoMl5rKVxuIGlmICgwPT0oYW5zWzBdJXByaW1lc1tqXSkpIHtcbiBkZD0xO1xuIGJyZWFrO1xuIH1cbiB9XG4gfVxuIGNhcnJ5XyhhbnMpO1xuIHJldHVybjtcbiB9XG5cbiBCPWMqayprOyAgICAvL3RyeSBzbWFsbCBwcmltZXMgdXAgdG8gQiAob3IgYWxsIHRoZSBwcmltZXNbXSBhcnJheSBpZiB0aGUgbGFyZ2VzdCBpcyBsZXNzIHRoYW4gQikuXG4gaWYgKGs+MiptKSAgLy9nZW5lcmF0ZSB0aGlzIGstYml0IG51bWJlciBieSBmaXJzdCByZWN1cnNpdmVseSBnZW5lcmF0aW5nIGEgbnVtYmVyIHRoYXQgaGFzIGJldHdlZW4gay8yIGFuZCBrLW0gYml0c1xuIGZvciAocj0xOyBrLWsqcjw9bTsgKVxuIHI9cG93c1tNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqNTEyKV07ICAgLy9yPU1hdGgucG93KDIsTWF0aC5yYW5kb20oKS0xKTtcbiBlbHNlXG4gcj0uNTtcblxuIC8vc2ltdWxhdGlvbiBzdWdnZXN0cyB0aGUgbW9yZSBjb21wbGV4IGFsZ29yaXRobSB1c2luZyByPS4zMzMgaXMgb25seSBzbGlnaHRseSBmYXN0ZXIuXG5cbiByZWNTaXplPU1hdGguZmxvb3IociprKSsxO1xuXG4gcmFuZFRydWVQcmltZV8oc19xLHJlY1NpemUpO1xuIGNvcHlJbnRfKHNfaTIsMCk7XG4gc19pMltNYXRoLmZsb29yKChrLTIpL2JwZSldIHw9ICgxPDwoKGstMiklYnBlKSk7ICAgLy9zX2kyPTJeKGstMilcbiBkaXZpZGVfKHNfaTIsc19xLHNfaSxzX3JtKTsgICAgICAgICAgICAgICAgICAgICAgICAvL3NfaT1mbG9vcigoMl4oay0xKSkvKDJxKSlcblxuIHo9Yml0U2l6ZShzX2kpO1xuXG4gZm9yICg7Oykge1xuIGZvciAoOzspIHsgIC8vZ2VuZXJhdGUgei1iaXQgbnVtYmVycyB1bnRpbCBvbmUgZmFsbHMgaW4gdGhlIHJhbmdlIFswLHNfaS0xXVxuIHJhbmRCaWdJbnRfKHNfUix6LDApO1xuIGlmIChncmVhdGVyKHNfaSxzX1IpKVxuIGJyZWFrO1xuIH0gICAgICAgICAgICAgICAgLy9ub3cgc19SIGlzIGluIHRoZSByYW5nZSBbMCxzX2ktMV1cbiBhZGRJbnRfKHNfUiwxKTsgIC8vbm93IHNfUiBpcyBpbiB0aGUgcmFuZ2UgWzEsc19pXVxuIGFkZF8oc19SLHNfaSk7ICAgLy9ub3cgc19SIGlzIGluIHRoZSByYW5nZSBbc19pKzEsMipzX2ldXG5cbiBjb3B5XyhzX24sc19xKTtcbiBtdWx0XyhzX24sc19SKTtcbiBtdWx0SW50XyhzX24sMik7XG4gYWRkSW50XyhzX24sMSk7ICAgIC8vc19uPTIqc19SKnNfcSsxXG5cbiBjb3B5XyhzX3IyLHNfUik7XG4gbXVsdEludF8oc19yMiwyKTsgIC8vc19yMj0yKnNfUlxuXG4gLy9jaGVjayBzX24gZm9yIGRpdmlzaWJpbGl0eSBieSBzbWFsbCBwcmltZXMgdXAgdG8gQlxuIGZvciAoZGl2aXNpYmxlPTAsaj0wOyAoajxwcmltZXMubGVuZ3RoKSAmJiAocHJpbWVzW2pdPEIpOyBqKyspXG4gaWYgKG1vZEludChzX24scHJpbWVzW2pdKT09MCAmJiAhZXF1YWxzSW50KHNfbixwcmltZXNbal0pKSB7XG4gZGl2aXNpYmxlPTE7XG4gYnJlYWs7XG4gfVxuXG4gaWYgKCFkaXZpc2libGUpICAgIC8vaWYgaXQgcGFzc2VzIHNtYWxsIHByaW1lcyBjaGVjaywgdGhlbiB0cnkgYSBzaW5nbGUgTWlsbGVyLVJhYmluIGJhc2UgMlxuIGlmICghbWlsbGVyUmFiaW5JbnQoc19uLDIpKSAvL3RoaXMgbGluZSByZXByZXNlbnRzIDc1JSBvZiB0aGUgdG90YWwgcnVudGltZSBmb3IgcmFuZFRydWVQcmltZV9cbiBkaXZpc2libGU9MTtcblxuIGlmICghZGl2aXNpYmxlKSB7ICAvL2lmIGl0IHBhc3NlcyB0aGF0IHRlc3QsIGNvbnRpbnVlIGNoZWNraW5nIHNfblxuIGFkZEludF8oc19uLC0zKTtcbiBmb3IgKGo9c19uLmxlbmd0aC0xOyhzX25bal09PTApICYmIChqPjApOyBqLS0pOyAgLy9zdHJpcCBsZWFkaW5nIHplcm9zXG4gZm9yICh6ej0wLHc9c19uW2pdOyB3OyAodz4+PTEpLHp6KyspO1xuIHp6Kz1icGUqajsgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8veno9bnVtYmVyIG9mIGJpdHMgaW4gc19uLCBpZ25vcmluZyBsZWFkaW5nIHplcm9zXG4gZm9yICg7OykgeyAgLy9nZW5lcmF0ZSB6LWJpdCBudW1iZXJzIHVudGlsIG9uZSBmYWxscyBpbiB0aGUgcmFuZ2UgWzAsc19uLTFdXG4gcmFuZEJpZ0ludF8oc19hLHp6LDApO1xuIGlmIChncmVhdGVyKHNfbixzX2EpKVxuIGJyZWFrO1xuIH0gICAgICAgICAgICAgICAgLy9ub3cgc19hIGlzIGluIHRoZSByYW5nZSBbMCxzX24tMV1cbiBhZGRJbnRfKHNfbiwzKTsgIC8vbm93IHNfYSBpcyBpbiB0aGUgcmFuZ2UgWzAsc19uLTRdXG4gYWRkSW50XyhzX2EsMik7ICAvL25vdyBzX2EgaXMgaW4gdGhlIHJhbmdlIFsyLHNfbi0yXVxuIGNvcHlfKHNfYixzX2EpO1xuIGNvcHlfKHNfbjEsc19uKTtcbiBhZGRJbnRfKHNfbjEsLTEpO1xuIHBvd01vZF8oc19iLHNfbjEsc19uKTsgICAvL3NfYj1zX2FeKHNfbi0xKSBtb2R1bG8gc19uXG4gYWRkSW50XyhzX2IsLTEpO1xuIGlmIChpc1plcm8oc19iKSkge1xuIGNvcHlfKHNfYixzX2EpO1xuIHBvd01vZF8oc19iLHNfcjIsc19uKTtcbiBhZGRJbnRfKHNfYiwtMSk7XG4gY29weV8oc19hYSxzX24pO1xuIGNvcHlfKHNfZCxzX2IpO1xuIEdDRF8oc19kLHNfbik7ICAvL2lmIHNfYiBhbmQgc19uIGFyZSByZWxhdGl2ZWx5IHByaW1lLCB0aGVuIHNfbiBpcyBhIHByaW1lXG4gaWYgKGVxdWFsc0ludChzX2QsMSkpIHtcbiBjb3B5XyhhbnMsc19hYSk7XG4gcmV0dXJuOyAgICAgLy9pZiB3ZSd2ZSBtYWRlIGl0IHRoaXMgZmFyLCB0aGVuIHNfbiBpcyBhYnNvbHV0ZWx5IGd1YXJhbnRlZWQgdG8gYmUgcHJpbWVcbiB9XG4gfVxuIH1cbiB9XG4gfVxuICovXG4vL1JldHVybiBhbiBuLWJpdCByYW5kb20gQmlnSW50IChuPj0xKS4gIElmIHM9MSwgdGhlbiB0aGUgbW9zdCBzaWduaWZpY2FudCBvZiB0aG9zZSBuIGJpdHMgaXMgc2V0IHRvIDEuXG5mdW5jdGlvbiByYW5kQmlnSW50KG4sIHMpIHtcbiAgICB2YXIgYSwgYjtcbiAgICBhID0gTWF0aC5mbG9vcigobiAtIDEpIC8gYnBlKSArIDI7IC8vIyBhcnJheSBlbGVtZW50cyB0byBob2xkIHRoZSBCaWdJbnQgd2l0aCBhIGxlYWRpbmcgMCBlbGVtZW50XG4gICAgYiA9IGludDJiaWdJbnQoMCwgMCwgYSk7XG4gICAgcmFuZEJpZ0ludF8oYiwgbiwgcyk7XG4gICAgcmV0dXJuIGI7XG59XG4vKiBUVVRBTzogbm90IHVzZWRcbiAvL1NldCBiIHRvIGFuIG4tYml0IHJhbmRvbSBCaWdJbnQuICBJZiBzPTEsIHRoZW4gdGhlIG1vc3Qgc2lnbmlmaWNhbnQgb2YgdGhvc2UgbiBiaXRzIGlzIHNldCB0byAxLlxuIC8vQXJyYXkgYiBtdXN0IGJlIGJpZyBlbm91Z2ggdG8gaG9sZCB0aGUgcmVzdWx0LiBNdXN0IGhhdmUgbj49MVxuIGZ1bmN0aW9uIHJhbmRCaWdJbnRfKGIsbixzKSB7XG4gdmFyIGksYTtcbiBmb3IgKGk9MDtpPGIubGVuZ3RoO2krKylcbiBiW2ldPTA7XG4gYT1NYXRoLmZsb29yKChuLTEpL2JwZSkrMTsgLy8jIGFycmF5IGVsZW1lbnRzIHRvIGhvbGQgdGhlIEJpZ0ludFxuIGZvciAoaT0wO2k8YTtpKyspIHtcbiBiW2ldPU1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSooMTw8KGJwZS0xKSkpO1xuIH1cbiBiW2EtMV0gJj0gKDI8PCgobi0xKSVicGUpKS0xO1xuIGlmIChzPT0xKVxuIGJbYS0xXSB8PSAoMTw8KChuLTEpJWJwZSkpO1xuIH1cbiAqL1xuLy9SZXR1cm4gdGhlIGdyZWF0ZXN0IGNvbW1vbiBkaXZpc29yIG9mIGJpZ0ludHMgeCBhbmQgeSAoZWFjaCB3aXRoIHNhbWUgbnVtYmVyIG9mIGVsZW1lbnRzKS5cbmZ1bmN0aW9uIEdDRCh4LCB5KSB7XG4gICAgdmFyIHhjLCB5YztcbiAgICB4YyA9IGR1cCh4KTtcbiAgICB5YyA9IGR1cCh5KTtcbiAgICBHQ0RfKHhjLCB5Yyk7XG4gICAgcmV0dXJuIHhjO1xufVxuLy9zZXQgeCB0byB0aGUgZ3JlYXRlc3QgY29tbW9uIGRpdmlzb3Igb2YgYmlnSW50cyB4IGFuZCB5IChlYWNoIHdpdGggc2FtZSBudW1iZXIgb2YgZWxlbWVudHMpLlxuLy95IGlzIGRlc3Ryb3llZC5cbmZ1bmN0aW9uIEdDRF8oeCwgeSkge1xuICAgIHZhciBpLCB4cCwgeXAsIEEsIEIsIEMsIEQsIHEsIHNpbmc7XG4gICAgaWYgKFQubGVuZ3RoICE9IHgubGVuZ3RoKSB7XG4gICAgICAgIFQgPSBkdXAoeCk7XG4gICAgfVxuICAgIHNpbmcgPSAxO1xuICAgIHdoaWxlIChzaW5nKSB7XG4gICAgICAgIC8vd2hpbGUgeSBoYXMgbm9uemVybyBlbGVtZW50cyBvdGhlciB0aGFuIHlbMF1cbiAgICAgICAgc2luZyA9IDA7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCB5Lmxlbmd0aDsgaSsrIC8vY2hlY2sgaWYgeSBoYXMgbm9uemVybyBlbGVtZW50cyBvdGhlciB0aGFuIDBcbiAgICAgICAgKVxuICAgICAgICAgICAgaWYgKHlbaV0pIHtcbiAgICAgICAgICAgICAgICBzaW5nID0gMTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgaWYgKCFzaW5nKVxuICAgICAgICAgICAgYnJlYWs7IC8vcXVpdCB3aGVuIHkgYWxsIHplcm8gZWxlbWVudHMgZXhjZXB0IHBvc3NpYmx5IHlbMF1cbiAgICAgICAgZm9yIChpID0geC5sZW5ndGg7ICF4W2ldICYmIGkgPj0gMDsgaS0tKVxuICAgICAgICAgICAgOyAvL2ZpbmQgbW9zdCBzaWduaWZpY2FudCBlbGVtZW50IG9mIHhcbiAgICAgICAgeHAgPSB4W2ldO1xuICAgICAgICB5cCA9IHlbaV07XG4gICAgICAgIEEgPSAxO1xuICAgICAgICBCID0gMDtcbiAgICAgICAgQyA9IDA7XG4gICAgICAgIEQgPSAxO1xuICAgICAgICB3aGlsZSAoeXAgKyBDICYmIHlwICsgRCkge1xuICAgICAgICAgICAgcSA9IE1hdGguZmxvb3IoKHhwICsgQSkgLyAoeXAgKyBDKSk7XG4gICAgICAgICAgICBsZXQgcXAgPSBNYXRoLmZsb29yKCh4cCArIEIpIC8gKHlwICsgRCkpO1xuICAgICAgICAgICAgaWYgKHEgIT0gcXApIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHQgPSBBIC0gcSAqIEM7XG4gICAgICAgICAgICBBID0gQztcbiAgICAgICAgICAgIEMgPSB0OyAvLyAgZG8gKEEsQix4cCwgQyxELHlwKSA9IChDLEQseXAsIEEsQix4cCkgLSBxKigwLDAsMCwgQyxELHlwKVxuICAgICAgICAgICAgdCA9IEIgLSBxICogRDtcbiAgICAgICAgICAgIEIgPSBEO1xuICAgICAgICAgICAgRCA9IHQ7XG4gICAgICAgICAgICB0ID0geHAgLSBxICogeXA7XG4gICAgICAgICAgICB4cCA9IHlwO1xuICAgICAgICAgICAgeXAgPSB0O1xuICAgICAgICB9XG4gICAgICAgIGlmIChCKSB7XG4gICAgICAgICAgICBjb3B5XyhULCB4KTtcbiAgICAgICAgICAgIGxpbkNvbWJfKHgsIHksIEEsIEIpOyAvL3g9QSp4K0IqeVxuICAgICAgICAgICAgbGluQ29tYl8oeSwgVCwgRCwgQyk7IC8veT1EKnkrQypUXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBtb2RfKHgsIHkpO1xuICAgICAgICAgICAgY29weV8oVCwgeCk7XG4gICAgICAgICAgICBjb3B5Xyh4LCB5KTtcbiAgICAgICAgICAgIGNvcHlfKHksIFQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICh5WzBdID09IDApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0ID0gbW9kSW50KHgsIHlbMF0pO1xuICAgIGNvcHlJbnRfKHgsIHlbMF0pO1xuICAgIHlbMF0gPSB0O1xuICAgIHdoaWxlICh5WzBdKSB7XG4gICAgICAgIHhbMF0gJT0geVswXTtcbiAgICAgICAgdCA9IHhbMF07XG4gICAgICAgIHhbMF0gPSB5WzBdO1xuICAgICAgICB5WzBdID0gdDtcbiAgICB9XG59XG4vL2RvIHg9eCoqKC0xKSBtb2QgbiwgZm9yIGJpZ0ludHMgeCBhbmQgbi5cbi8vSWYgbm8gaW52ZXJzZSBleGlzdHMsIGl0IHNldHMgeCB0byB6ZXJvIGFuZCByZXR1cm5zIDAsIGVsc2UgaXQgcmV0dXJucyAxLlxuLy9UaGUgeCBhcnJheSBtdXN0IGJlIGF0IGxlYXN0IGFzIGxhcmdlIGFzIHRoZSBuIGFycmF5LlxuZnVuY3Rpb24gaW52ZXJzZU1vZF8oeCwgbikge1xuICAgIHZhciBrID0gMSArIDIgKiBNYXRoLm1heCh4Lmxlbmd0aCwgbi5sZW5ndGgpO1xuICAgIGlmICghKHhbMF0gJiAxKSAmJiAhKG5bMF0gJiAxKSkge1xuICAgICAgICAvL2lmIGJvdGggaW5wdXRzIGFyZSBldmVuLCB0aGVuIGludmVyc2UgZG9lc24ndCBleGlzdFxuICAgICAgICBjb3B5SW50Xyh4LCAwKTtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmIChlZ191Lmxlbmd0aCAhPSBrKSB7XG4gICAgICAgIGVnX3UgPSBuZXcgQXJyYXkoayk7XG4gICAgICAgIGVnX3YgPSBuZXcgQXJyYXkoayk7XG4gICAgICAgIGVnX0EgPSBuZXcgQXJyYXkoayk7XG4gICAgICAgIGVnX0IgPSBuZXcgQXJyYXkoayk7XG4gICAgICAgIGVnX0MgPSBuZXcgQXJyYXkoayk7XG4gICAgICAgIGVnX0QgPSBuZXcgQXJyYXkoayk7XG4gICAgfVxuICAgIGNvcHlfKGVnX3UsIHgpO1xuICAgIGNvcHlfKGVnX3YsIG4pO1xuICAgIGNvcHlJbnRfKGVnX0EsIDEpO1xuICAgIGNvcHlJbnRfKGVnX0IsIDApO1xuICAgIGNvcHlJbnRfKGVnX0MsIDApO1xuICAgIGNvcHlJbnRfKGVnX0QsIDEpO1xuICAgIGZvciAoOzspIHtcbiAgICAgICAgd2hpbGUgKCEoZWdfdVswXSAmIDEpKSB7XG4gICAgICAgICAgICAvL3doaWxlIGVnX3UgaXMgZXZlblxuICAgICAgICAgICAgaGFsdmVfKGVnX3UpO1xuICAgICAgICAgICAgaWYgKCEoZWdfQVswXSAmIDEpICYmICEoZWdfQlswXSAmIDEpKSB7XG4gICAgICAgICAgICAgICAgLy9pZiBlZ19BPT1lZ19CPT0wIG1vZCAyXG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0EpO1xuICAgICAgICAgICAgICAgIGhhbHZlXyhlZ19CKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZF8oZWdfQSwgbik7XG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0EpO1xuICAgICAgICAgICAgICAgIHN1Yl8oZWdfQiwgeCk7XG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0IpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHdoaWxlICghKGVnX3ZbMF0gJiAxKSkge1xuICAgICAgICAgICAgLy93aGlsZSBlZ192IGlzIGV2ZW5cbiAgICAgICAgICAgIGhhbHZlXyhlZ192KTtcbiAgICAgICAgICAgIGlmICghKGVnX0NbMF0gJiAxKSAmJiAhKGVnX0RbMF0gJiAxKSkge1xuICAgICAgICAgICAgICAgIC8vaWYgZWdfQz09ZWdfRD09MCBtb2QgMlxuICAgICAgICAgICAgICAgIGhhbHZlXyhlZ19DKTtcbiAgICAgICAgICAgICAgICBoYWx2ZV8oZWdfRCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBhZGRfKGVnX0MsIG4pO1xuICAgICAgICAgICAgICAgIGhhbHZlXyhlZ19DKTtcbiAgICAgICAgICAgICAgICBzdWJfKGVnX0QsIHgpO1xuICAgICAgICAgICAgICAgIGhhbHZlXyhlZ19EKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoIWdyZWF0ZXIoZWdfdiwgZWdfdSkpIHtcbiAgICAgICAgICAgIC8vZWdfdiA8PSBlZ191XG4gICAgICAgICAgICBzdWJfKGVnX3UsIGVnX3YpO1xuICAgICAgICAgICAgc3ViXyhlZ19BLCBlZ19DKTtcbiAgICAgICAgICAgIHN1Yl8oZWdfQiwgZWdfRCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL2VnX3YgPiBlZ191XG4gICAgICAgICAgICBzdWJfKGVnX3YsIGVnX3UpO1xuICAgICAgICAgICAgc3ViXyhlZ19DLCBlZ19BKTtcbiAgICAgICAgICAgIHN1Yl8oZWdfRCwgZWdfQik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGVxdWFsc0ludChlZ191LCAwKSkge1xuICAgICAgICAgICAgaWYgKG5lZ2F0aXZlKGVnX0MpKSB7XG4gICAgICAgICAgICAgICAgLy9tYWtlIHN1cmUgYW5zd2VyIGlzIG5vbm5lZ2F0aXZlXG4gICAgICAgICAgICAgICAgYWRkXyhlZ19DLCBuKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvcHlfKHgsIGVnX0MpO1xuICAgICAgICAgICAgaWYgKCFlcXVhbHNJbnQoZWdfdiwgMSkpIHtcbiAgICAgICAgICAgICAgICAvL2lmIEdDRF8oeCxuKSE9MSwgdGhlbiB0aGVyZSBpcyBubyBpbnZlcnNlXG4gICAgICAgICAgICAgICAgY29weUludF8oeCwgMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vcmV0dXJuIHgqKigtMSkgbW9kIG4sIGZvciBpbnRlZ2VycyB4IGFuZCBuLiAgUmV0dXJuIDAgaWYgdGhlcmUgaXMgbm8gaW52ZXJzZVxuZnVuY3Rpb24gaW52ZXJzZU1vZEludCh4LCBuKSB7XG4gICAgdmFyIGEgPSAxLCBiID0gMCwgdDtcbiAgICBmb3IgKDs7KSB7XG4gICAgICAgIGlmICh4ID09IDEpXG4gICAgICAgICAgICByZXR1cm4gYTtcbiAgICAgICAgaWYgKHggPT0gMClcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBiIC09IGEgKiBNYXRoLmZsb29yKG4gLyB4KTtcbiAgICAgICAgbiAlPSB4O1xuICAgICAgICBpZiAobiA9PSAxKVxuICAgICAgICAgICAgcmV0dXJuIGI7IC8vdG8gYXZvaWQgbmVnYXRpdmVzLCBjaGFuZ2UgdGhpcyBiIHRvIG4tYiwgYW5kIGVhY2ggLT0gdG8gKz1cbiAgICAgICAgaWYgKG4gPT0gMClcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICBhIC09IGIgKiBNYXRoLmZsb29yKHggLyBuKTtcbiAgICAgICAgeCAlPSBuO1xuICAgIH1cbn1cbi8vdGhpcyBkZXByZWNhdGVkIGZ1bmN0aW9uIGlzIGZvciBiYWNrd2FyZCBjb21wYXRpYmlsaXR5IG9ubHkuXG5mdW5jdGlvbiBpbnZlcnNlTW9kSW50Xyh4LCBuKSB7XG4gICAgcmV0dXJuIGludmVyc2VNb2RJbnQoeCwgbik7XG59XG4vL0dpdmVuIHBvc2l0aXZlIGJpZ0ludHMgeCBhbmQgeSwgY2hhbmdlIHRoZSBiaWdpbnRzIHYsIGEsIGFuZCBiIHRvIHBvc2l0aXZlIGJpZ0ludHMgc3VjaCB0aGF0OlxuLy8gICAgIHYgPSBHQ0RfKHgseSkgPSBhKngtYip5XG4vL1RoZSBiaWdJbnRzIHYsIGEsIGIsIG11c3QgaGF2ZSBleGFjdGx5IGFzIG1hbnkgZWxlbWVudHMgYXMgdGhlIGxhcmdlciBvZiB4IGFuZCB5LlxuZnVuY3Rpb24gZUdDRF8oeCwgeSwgdiwgYSwgYikge1xuICAgIHZhciBnID0gMDtcbiAgICB2YXIgayA9IE1hdGgubWF4KHgubGVuZ3RoLCB5Lmxlbmd0aCk7XG4gICAgaWYgKGVnX3UubGVuZ3RoICE9IGspIHtcbiAgICAgICAgZWdfdSA9IG5ldyBBcnJheShrKTtcbiAgICAgICAgZWdfQSA9IG5ldyBBcnJheShrKTtcbiAgICAgICAgZWdfQiA9IG5ldyBBcnJheShrKTtcbiAgICAgICAgZWdfQyA9IG5ldyBBcnJheShrKTtcbiAgICAgICAgZWdfRCA9IG5ldyBBcnJheShrKTtcbiAgICB9XG4gICAgd2hpbGUgKCEoeFswXSAmIDEpICYmICEoeVswXSAmIDEpKSB7XG4gICAgICAgIC8vd2hpbGUgeCBhbmQgeSBib3RoIGV2ZW5cbiAgICAgICAgaGFsdmVfKHgpO1xuICAgICAgICBoYWx2ZV8oeSk7XG4gICAgICAgIGcrKztcbiAgICB9XG4gICAgY29weV8oZWdfdSwgeCk7XG4gICAgY29weV8odiwgeSk7XG4gICAgY29weUludF8oZWdfQSwgMSk7XG4gICAgY29weUludF8oZWdfQiwgMCk7XG4gICAgY29weUludF8oZWdfQywgMCk7XG4gICAgY29weUludF8oZWdfRCwgMSk7XG4gICAgZm9yICg7Oykge1xuICAgICAgICB3aGlsZSAoIShlZ191WzBdICYgMSkpIHtcbiAgICAgICAgICAgIC8vd2hpbGUgdSBpcyBldmVuXG4gICAgICAgICAgICBoYWx2ZV8oZWdfdSk7XG4gICAgICAgICAgICBpZiAoIShlZ19BWzBdICYgMSkgJiYgIShlZ19CWzBdICYgMSkpIHtcbiAgICAgICAgICAgICAgICAvL2lmIEE9PUI9PTAgbW9kIDJcbiAgICAgICAgICAgICAgICBoYWx2ZV8oZWdfQSk7XG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0IpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgYWRkXyhlZ19BLCB5KTtcbiAgICAgICAgICAgICAgICBoYWx2ZV8oZWdfQSk7XG4gICAgICAgICAgICAgICAgc3ViXyhlZ19CLCB4KTtcbiAgICAgICAgICAgICAgICBoYWx2ZV8oZWdfQik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgd2hpbGUgKCEodlswXSAmIDEpKSB7XG4gICAgICAgICAgICAvL3doaWxlIHYgaXMgZXZlblxuICAgICAgICAgICAgaGFsdmVfKHYpO1xuICAgICAgICAgICAgaWYgKCEoZWdfQ1swXSAmIDEpICYmICEoZWdfRFswXSAmIDEpKSB7XG4gICAgICAgICAgICAgICAgLy9pZiBDPT1EPT0wIG1vZCAyXG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0MpO1xuICAgICAgICAgICAgICAgIGhhbHZlXyhlZ19EKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGFkZF8oZWdfQywgeSk7XG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0MpO1xuICAgICAgICAgICAgICAgIHN1Yl8oZWdfRCwgeCk7XG4gICAgICAgICAgICAgICAgaGFsdmVfKGVnX0QpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZ3JlYXRlcih2LCBlZ191KSkge1xuICAgICAgICAgICAgLy92PD11XG4gICAgICAgICAgICBzdWJfKGVnX3UsIHYpO1xuICAgICAgICAgICAgc3ViXyhlZ19BLCBlZ19DKTtcbiAgICAgICAgICAgIHN1Yl8oZWdfQiwgZWdfRCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvL3Y+dVxuICAgICAgICAgICAgc3ViXyh2LCBlZ191KTtcbiAgICAgICAgICAgIHN1Yl8oZWdfQywgZWdfQSk7XG4gICAgICAgICAgICBzdWJfKGVnX0QsIGVnX0IpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChlcXVhbHNJbnQoZWdfdSwgMCkpIHtcbiAgICAgICAgICAgIGlmIChuZWdhdGl2ZShlZ19DKSkge1xuICAgICAgICAgICAgICAgIC8vbWFrZSBzdXJlIGEgKEMpaXMgbm9ubmVnYXRpdmVcbiAgICAgICAgICAgICAgICBhZGRfKGVnX0MsIHkpO1xuICAgICAgICAgICAgICAgIHN1Yl8oZWdfRCwgeCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtdWx0SW50XyhlZ19ELCAtMSk7IC8vL21ha2Ugc3VyZSBiIChEKSBpcyBub25uZWdhdGl2ZVxuICAgICAgICAgICAgY29weV8oYSwgZWdfQyk7XG4gICAgICAgICAgICBjb3B5XyhiLCBlZ19EKTtcbiAgICAgICAgICAgIGxlZnRTaGlmdF8odiwgZyk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9XG59XG4vL2lzIGJpZ0ludCB4IG5lZ2F0aXZlP1xuZnVuY3Rpb24gbmVnYXRpdmUoeCkge1xuICAgIHJldHVybiAoeFt4Lmxlbmd0aCAtIDFdID4+IChicGUgLSAxKSkgJiAxO1xufVxuLy9pcyAoeCA8PCAoc2hpZnQqYnBlKSkgPiB5P1xuLy94IGFuZCB5IGFyZSBub25uZWdhdGl2ZSBiaWdJbnRzXG4vL3NoaWZ0IGlzIGEgbm9ubmVnYXRpdmUgaW50ZWdlclxuZnVuY3Rpb24gZ3JlYXRlclNoaWZ0KHgsIHksIHNoaWZ0KSB7XG4gICAgdmFyIGksIGt4ID0geC5sZW5ndGgsIGt5ID0geS5sZW5ndGgsIGsgPSBreCArIHNoaWZ0IDwga3kgPyBreCArIHNoaWZ0IDoga3k7XG4gICAgZm9yIChpID0ga3kgLSAxIC0gc2hpZnQ7IGkgPCBreCAmJiBpID49IDA7IGkrKylcbiAgICAgICAgaWYgKHhbaV0gPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfSAvL2lmIHRoZXJlIGFyZSBub256ZXJvcyBpbiB4IHRvIHRoZSBsZWZ0IG9mIHRoZSBmaXJzdCBjb2x1bW4gb2YgeSwgdGhlbiB4IGlzIGJpZ2dlclxuICAgIGZvciAoaSA9IGt4IC0gMSArIHNoaWZ0OyBpIDwga3k7IGkrKylcbiAgICAgICAgaWYgKHlbaV0gPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfSAvL2lmIHRoZXJlIGFyZSBub256ZXJvcyBpbiB5IHRvIHRoZSBsZWZ0IG9mIHRoZSBmaXJzdCBjb2x1bW4gb2YgeCwgdGhlbiB4IGlzIG5vdCBiaWdnZXJcbiAgICBmb3IgKGkgPSBrIC0gMTsgaSA+PSBzaGlmdDsgaS0tKVxuICAgICAgICBpZiAoeFtpIC0gc2hpZnRdID4geVtpXSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoeFtpIC0gc2hpZnRdIDwgeVtpXSlcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgIHJldHVybiAwO1xufVxuLy9pcyB4ID4geT8gKHggYW5kIHkgYm90aCBub25uZWdhdGl2ZSlcbmZ1bmN0aW9uIGdyZWF0ZXIoeCwgeSkge1xuICAgIHZhciBpO1xuICAgIHZhciBrID0geC5sZW5ndGggPCB5Lmxlbmd0aCA/IHgubGVuZ3RoIDogeS5sZW5ndGg7XG4gICAgZm9yIChpID0geC5sZW5ndGg7IGkgPCB5Lmxlbmd0aDsgaSsrKVxuICAgICAgICBpZiAoeVtpXSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH0gLy95IGhhcyBtb3JlIGRpZ2l0c1xuICAgIGZvciAoaSA9IHkubGVuZ3RoOyBpIDwgeC5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYgKHhbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiAxO1xuICAgICAgICB9IC8veCBoYXMgbW9yZSBkaWdpdHNcbiAgICBmb3IgKGkgPSBrIC0gMTsgaSA+PSAwOyBpLS0pXG4gICAgICAgIGlmICh4W2ldID4geVtpXSkge1xuICAgICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoeFtpXSA8IHlbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgcmV0dXJuIDA7XG59XG4vL2RpdmlkZSB4IGJ5IHkgZ2l2aW5nIHF1b3RpZW50IHEgYW5kIHJlbWFpbmRlciByLiAgKHE9Zmxvb3IoeC95KSwgIHI9eCBtb2QgeSkuICBBbGwgNCBhcmUgYmlnaW50cy5cbi8veCBtdXN0IGhhdmUgYXQgbGVhc3Qgb25lIGxlYWRpbmcgemVybyBlbGVtZW50LlxuLy95IG11c3QgYmUgbm9uemVyby5cbi8vcSBhbmQgciBtdXN0IGJlIGFycmF5cyB0aGF0IGFyZSBleGFjdGx5IHRoZSBzYW1lIGxlbmd0aCBhcyB4LiAoT3IgcSBjYW4gaGF2ZSBtb3JlKS5cbi8vTXVzdCBoYXZlIHgubGVuZ3RoID49IHkubGVuZ3RoID49IDIuXG5mdW5jdGlvbiBkaXZpZGVfKHgsIHksIHEsIHIpIHtcbiAgICB2YXIga3gsIGt5O1xuICAgIHZhciBpLCBqLCB5MSwgeTIsIGMsIGEsIGI7XG4gICAgY29weV8ociwgeCk7XG4gICAgZm9yIChreSA9IHkubGVuZ3RoOyB5W2t5IC0gMV0gPT0gMDsga3ktLSlcbiAgICAgICAgOyAvL2t5IGlzIG51bWJlciBvZiBlbGVtZW50cyBpbiB5LCBub3QgaW5jbHVkaW5nIGxlYWRpbmcgemVyb3NcbiAgICAvL25vcm1hbGl6ZTogZW5zdXJlIHRoZSBtb3N0IHNpZ25pZmljYW50IGVsZW1lbnQgb2YgeSBoYXMgaXRzIGhpZ2hlc3QgYml0IHNldFxuICAgIGIgPSB5W2t5IC0gMV07XG4gICAgZm9yIChhID0gMDsgYjsgYSsrKVxuICAgICAgICBiID4+PSAxO1xuICAgIGEgPSBicGUgLSBhOyAvL2EgaXMgaG93IG1hbnkgYml0cyB0byBzaGlmdCBzbyB0aGF0IHRoZSBoaWdoIG9yZGVyIGJpdCBvZiB5IGlzIGxlZnRtb3N0IGluIGl0cyBhcnJheSBlbGVtZW50XG4gICAgbGVmdFNoaWZ0Xyh5LCBhKTsgLy9tdWx0aXBseSBib3RoIGJ5IDE8PGEgbm93LCB0aGVuIGRpdmlkZSBib3RoIGJ5IHRoYXQgYXQgdGhlIGVuZFxuICAgIGxlZnRTaGlmdF8ociwgYSk7XG4gICAgLy9Sb2IgVmlzc2VyIGRpc2NvdmVyZWQgYSBidWc6IHRoZSBmb2xsb3dpbmcgbGluZSB3YXMgb3JpZ2luYWxseSBqdXN0IGJlZm9yZSB0aGUgbm9ybWFsaXphdGlvbi5cbiAgICBmb3IgKGt4ID0gci5sZW5ndGg7IHJba3ggLSAxXSA9PSAwICYmIGt4ID4ga3k7IGt4LS0pXG4gICAgICAgIDsgLy9reCBpcyBudW1iZXIgb2YgZWxlbWVudHMgaW4gbm9ybWFsaXplZCB4LCBub3QgaW5jbHVkaW5nIGxlYWRpbmcgemVyb3NcbiAgICBjb3B5SW50XyhxLCAwKTsgLy8gcT0wXG4gICAgd2hpbGUgKCFncmVhdGVyU2hpZnQoeSwgciwga3ggLSBreSkpIHtcbiAgICAgICAgLy8gd2hpbGUgKGxlZnRTaGlmdF8oeSxreC1reSkgPD0gcikge1xuICAgICAgICBzdWJTaGlmdF8ociwgeSwga3ggLSBreSk7IC8vICAgcj1yLWxlZnRTaGlmdF8oeSxreC1reSlcbiAgICAgICAgcVtreCAtIGt5XSsrOyAvLyAgIHFba3gta3ldKys7XG4gICAgfSAvLyB9XG4gICAgZm9yIChpID0ga3ggLSAxOyBpID49IGt5OyBpLS0pIHtcbiAgICAgICAgaWYgKHJbaV0gPT0geVtreSAtIDFdKSB7XG4gICAgICAgICAgICBxW2kgLSBreV0gPSBtYXNrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcVtpIC0ga3ldID0gTWF0aC5mbG9vcigocltpXSAqIHJhZGl4ICsgcltpIC0gMV0pIC8geVtreSAtIDFdKTtcbiAgICAgICAgfVxuICAgICAgICAvL1RoZSBmb2xsb3dpbmcgZm9yKDs7KSBsb29wIGlzIGVxdWl2YWxlbnQgdG8gdGhlIGNvbW1lbnRlZCB3aGlsZSBsb29wLFxuICAgICAgICAvL2V4Y2VwdCB0aGF0IHRoZSB1bmNvbW1lbnRlZCB2ZXJzaW9uIGF2b2lkcyBvdmVyZmxvdy5cbiAgICAgICAgLy9UaGUgY29tbWVudGVkIGxvb3AgY29tZXMgZnJvbSBIQUMsIHdoaWNoIGFzc3VtZXMgclstMV09PXlbLTFdPT0wXG4gICAgICAgIC8vICB3aGlsZSAocVtpLWt5XSooeVtreS0xXSpyYWRpeCt5W2t5LTJdKSA+IHJbaV0qcmFkaXgqcmFkaXgrcltpLTFdKnJhZGl4K3JbaS0yXSlcbiAgICAgICAgLy8gICAgcVtpLWt5XS0tO1xuICAgICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgICB5MiA9IChreSA+IDEgPyB5W2t5IC0gMl0gOiAwKSAqIHFbaSAtIGt5XTtcbiAgICAgICAgICAgIGMgPSB5MiA+PiBicGU7XG4gICAgICAgICAgICB5MiA9IHkyICYgbWFzaztcbiAgICAgICAgICAgIHkxID0gYyArIHFbaSAtIGt5XSAqIHlba3kgLSAxXTtcbiAgICAgICAgICAgIGMgPSB5MSA+PiBicGU7XG4gICAgICAgICAgICB5MSA9IHkxICYgbWFzaztcbiAgICAgICAgICAgIGlmIChjID09IHJbaV0gPyAoeTEgPT0gcltpIC0gMV0gPyB5MiA+IChpID4gMSA/IHJbaSAtIDJdIDogMCkgOiB5MSA+IHJbaSAtIDFdKSA6IGMgPiByW2ldKSB7XG4gICAgICAgICAgICAgICAgcVtpIC0ga3ldLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBsaW5Db21iU2hpZnRfKHIsIHksIC1xW2kgLSBreV0sIGkgLSBreSk7IC8vcj1yLXFbaS1reV0qbGVmdFNoaWZ0Xyh5LGkta3kpXG4gICAgICAgIGlmIChuZWdhdGl2ZShyKSkge1xuICAgICAgICAgICAgYWRkU2hpZnRfKHIsIHksIGkgLSBreSk7IC8vcj1yK2xlZnRTaGlmdF8oeSxpLWt5KVxuICAgICAgICAgICAgcVtpIC0ga3ldLS07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmlnaHRTaGlmdF8oeSwgYSk7IC8vdW5kbyB0aGUgbm9ybWFsaXphdGlvbiBzdGVwXG4gICAgcmlnaHRTaGlmdF8ociwgYSk7IC8vdW5kbyB0aGUgbm9ybWFsaXphdGlvbiBzdGVwXG59XG4vL2RvIGNhcnJpZXMgYW5kIGJvcnJvd3Mgc28gZWFjaCBlbGVtZW50IG9mIHRoZSBiaWdJbnQgeCBmaXRzIGluIGJwZSBiaXRzLlxuZnVuY3Rpb24gY2FycnlfKHgpIHtcbiAgICB2YXIgaSwgaywgYywgYjtcbiAgICBrID0geC5sZW5ndGg7XG4gICAgYyA9IDA7XG4gICAgZm9yIChpID0gMDsgaSA8IGs7IGkrKykge1xuICAgICAgICBjICs9IHhbaV07XG4gICAgICAgIGIgPSAwO1xuICAgICAgICBpZiAoYyA8IDApIHtcbiAgICAgICAgICAgIGIgPSAtKGMgPj4gYnBlKTtcbiAgICAgICAgICAgIGMgKz0gYiAqIHJhZGl4O1xuICAgICAgICB9XG4gICAgICAgIHhbaV0gPSBjICYgbWFzaztcbiAgICAgICAgYyA9IChjID4+IGJwZSkgLSBiO1xuICAgIH1cbn1cbi8vcmV0dXJuIHggbW9kIG4gZm9yIGJpZ0ludCB4IGFuZCBpbnRlZ2VyIG4uXG5mdW5jdGlvbiBtb2RJbnQoeCwgbikge1xuICAgIHZhciBpLCBjID0gMDtcbiAgICBmb3IgKGkgPSB4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKVxuICAgICAgICBjID0gKGMgKiByYWRpeCArIHhbaV0pICUgbjtcbiAgICByZXR1cm4gYztcbn1cbi8vY29udmVydCB0aGUgaW50ZWdlciB0IGludG8gYSBiaWdJbnQgd2l0aCBhdCBsZWFzdCB0aGUgZ2l2ZW4gbnVtYmVyIG9mIGJpdHMuXG4vL3RoZSByZXR1cm5lZCBhcnJheSBzdG9yZXMgdGhlIGJpZ0ludCBpbiBicGUtYml0IGNodW5rcywgbGl0dGxlIGVuZGlhbiAoYnVmZlswXSBpcyBsZWFzdCBzaWduaWZpY2FudCB3b3JkKVxuLy9QYWQgdGhlIGFycmF5IHdpdGggbGVhZGluZyB6ZXJvcyBzbyB0aGF0IGl0IGhhcyBhdCBsZWFzdCBtaW5TaXplIGVsZW1lbnRzLlxuLy9UaGVyZSB3aWxsIGFsd2F5cyBiZSBhdCBsZWFzdCBvbmUgbGVhZGluZyAwIGVsZW1lbnQuXG5mdW5jdGlvbiBpbnQyYmlnSW50KHQsIGJpdHMsIG1pblNpemUpIHtcbiAgICB2YXIgaSwgaywgYnVmZjtcbiAgICBrID0gTWF0aC5jZWlsKGJpdHMgLyBicGUpICsgMTtcbiAgICBrID0gbWluU2l6ZSA+IGsgPyBtaW5TaXplIDogaztcbiAgICBidWZmID0gbmV3IEFycmF5KGspO1xuICAgIGNvcHlJbnRfKGJ1ZmYsIHQpO1xuICAgIHJldHVybiBidWZmO1xufVxuLy9yZXR1cm4gdGhlIGJpZ0ludCBnaXZlbiBhIHN0cmluZyByZXByZXNlbnRhdGlvbiBpbiBhIGdpdmVuIGJhc2UuXG4vL1BhZCB0aGUgYXJyYXkgd2l0aCBsZWFkaW5nIHplcm9zIHNvIHRoYXQgaXQgaGFzIGF0IGxlYXN0IG1pblNpemUgZWxlbWVudHMuXG4vL0lmIGJhc2U9LTEsIHRoZW4gaXQgcmVhZHMgaW4gYSBzcGFjZS1zZXBhcmF0ZWQgbGlzdCBvZiBhcnJheSBlbGVtZW50cyBpbiBkZWNpbWFsLlxuLy9UaGUgYXJyYXkgd2lsbCBhbHdheXMgaGF2ZSBhdCBsZWFzdCBvbmUgbGVhZGluZyB6ZXJvLCB1bmxlc3MgYmFzZT0tMS5cbmZ1bmN0aW9uIHN0cjJiaWdJbnQocywgYmFzZSwgbWluU2l6ZSkge1xuICAgIHZhciBkLCBpLCBqLCB4LCB5LCBraztcbiAgICB2YXIgayA9IHMubGVuZ3RoO1xuICAgIGlmIChiYXNlID09IC0xKSB7XG4gICAgICAgIC8vY29tbWEtc2VwYXJhdGVkIGxpc3Qgb2YgYXJyYXkgZWxlbWVudHMgaW4gZGVjaW1hbFxuICAgICAgICB4ID0gbmV3IEFycmF5KDApO1xuICAgICAgICBmb3IgKDs7KSB7XG4gICAgICAgICAgICB5ID0gbmV3IEFycmF5KHgubGVuZ3RoICsgMSk7XG4gICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgICAgICB5W2kgKyAxXSA9IHhbaV07XG4gICAgICAgICAgICB5WzBdID0gcGFyc2VJbnQocywgMTApO1xuICAgICAgICAgICAgeCA9IHk7XG4gICAgICAgICAgICBkID0gcy5pbmRleE9mKFwiLFwiLCAwKTtcbiAgICAgICAgICAgIGlmIChkIDwgMSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcyA9IHMuc3Vic3RyaW5nKGQgKyAxKTtcbiAgICAgICAgICAgIGlmIChzLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHgubGVuZ3RoIDwgbWluU2l6ZSkge1xuICAgICAgICAgICAgeSA9IG5ldyBBcnJheShtaW5TaXplKTtcbiAgICAgICAgICAgIGNvcHlfKHksIHgpO1xuICAgICAgICAgICAgcmV0dXJuIHk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHg7XG4gICAgfVxuICAgIHggPSBpbnQyYmlnSW50KDAsIGJhc2UgKiBrLCAwKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgazsgaSsrKSB7XG4gICAgICAgIGQgPSBkaWdpdHNTdHIuaW5kZXhPZihzLnN1YnN0cmluZyhpLCBpICsgMSksIDApO1xuICAgICAgICBpZiAoYmFzZSA8PSAzNiAmJiBkID49IDM2KSB7XG4gICAgICAgICAgICAvL2NvbnZlcnQgbG93ZXJjYXNlIHRvIHVwcGVyY2FzZSBpZiBiYXNlPD0zNlxuICAgICAgICAgICAgZCAtPSAyNjtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZCA+PSBiYXNlIHx8IGQgPCAwKSB7XG4gICAgICAgICAgICAvL3N0b3AgYXQgZmlyc3QgaWxsZWdhbCBjaGFyYWN0ZXJcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIG11bHRJbnRfKHgsIGJhc2UpO1xuICAgICAgICBhZGRJbnRfKHgsIGQpO1xuICAgIH1cbiAgICBmb3IgKGsgPSB4Lmxlbmd0aDsgayA+IDAgJiYgIXhbayAtIDFdOyBrLS0pXG4gICAgICAgIDsgLy9zdHJpcCBvZmYgbGVhZGluZyB6ZXJvc1xuICAgIGsgPSBtaW5TaXplID4gayArIDEgPyBtaW5TaXplIDogayArIDE7XG4gICAgeSA9IG5ldyBBcnJheShrKTtcbiAgICBrayA9IGsgPCB4Lmxlbmd0aCA/IGsgOiB4Lmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwga2s7IGkrKylcbiAgICAgICAgeVtpXSA9IHhbaV07XG4gICAgZm9yICg7IGkgPCBrOyBpKyspXG4gICAgICAgIHlbaV0gPSAwO1xuICAgIHJldHVybiB5O1xufVxuLy9pcyBiaWdpbnQgeCBlcXVhbCB0byBpbnRlZ2VyIHk/XG4vL3kgbXVzdCBoYXZlIGxlc3MgdGhhbiBicGUgYml0c1xuZnVuY3Rpb24gZXF1YWxzSW50KHgsIHkpIHtcbiAgICB2YXIgaTtcbiAgICBpZiAoeFswXSAhPSB5KSB7XG4gICAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICBmb3IgKGkgPSAxOyBpIDwgeC5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYgKHhbaV0pIHtcbiAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICB9XG4gICAgcmV0dXJuIDE7XG59XG4vL2FyZSBiaWdpbnRzIHggYW5kIHkgZXF1YWw/XG4vL3RoaXMgd29ya3MgZXZlbiBpZiB4IGFuZCB5IGFyZSBkaWZmZXJlbnQgbGVuZ3RocyBhbmQgaGF2ZSBhcmJpdHJhcmlseSBtYW55IGxlYWRpbmcgemVyb3NcbmZ1bmN0aW9uIGVxdWFscyh4LCB5KSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIGsgPSB4Lmxlbmd0aCA8IHkubGVuZ3RoID8geC5sZW5ndGggOiB5Lmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgazsgaSsrKVxuICAgICAgICBpZiAoeFtpXSAhPSB5W2ldKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgIGlmICh4Lmxlbmd0aCA+IHkubGVuZ3RoKSB7XG4gICAgICAgIGZvciAoOyBpIDwgeC5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIGlmICh4W2ldKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmb3IgKDsgaSA8IHkubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBpZiAoeVtpXSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAwO1xuICAgICAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gMTtcbn1cbi8vaXMgdGhlIGJpZ0ludCB4IGVxdWFsIHRvIHplcm8/XG5mdW5jdGlvbiBpc1plcm8oeCkge1xuICAgIHZhciBpO1xuICAgIGZvciAoaSA9IDA7IGkgPCB4Lmxlbmd0aDsgaSsrKVxuICAgICAgICBpZiAoeFtpXSkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICByZXR1cm4gMTtcbn1cbi8vY29udmVydCBhIGJpZ0ludCBpbnRvIGEgc3RyaW5nIGluIGEgZ2l2ZW4gYmFzZSwgZnJvbSBiYXNlIDIgdXAgdG8gYmFzZSA5NS5cbi8vQmFzZSAtMSBwcmludHMgdGhlIGNvbnRlbnRzIG9mIHRoZSBhcnJheSByZXByZXNlbnRpbmcgdGhlIG51bWJlci5cbmZ1bmN0aW9uIGJpZ0ludDJzdHIoeCwgYmFzZSkge1xuICAgIHZhciBpLCB0LCBzID0gXCJcIjtcbiAgICBpZiAoczYubGVuZ3RoICE9IHgubGVuZ3RoKSB7XG4gICAgICAgIHM2ID0gZHVwKHgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29weV8oczYsIHgpO1xuICAgIH1cbiAgICBpZiAoYmFzZSA9PSAtMSkge1xuICAgICAgICAvL3JldHVybiB0aGUgbGlzdCBvZiBhcnJheSBjb250ZW50c1xuICAgICAgICBmb3IgKGkgPSB4Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pXG4gICAgICAgICAgICBzICs9IHhbaV0gKyBcIixcIjtcbiAgICAgICAgcyArPSB4WzBdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgLy9yZXR1cm4gaXQgaW4gdGhlIGdpdmVuIGJhc2VcbiAgICAgICAgd2hpbGUgKCFpc1plcm8oczYpKSB7XG4gICAgICAgICAgICB0ID0gZGl2SW50XyhzNiwgYmFzZSk7IC8vdD1zNiAlIGJhc2U7IHM2PWZsb29yKHM2L2Jhc2UpO1xuICAgICAgICAgICAgcyA9IGRpZ2l0c1N0ci5zdWJzdHJpbmcodCwgdCArIDEpICsgcztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocy5sZW5ndGggPT0gMCkge1xuICAgICAgICBzID0gXCIwXCI7XG4gICAgfVxuICAgIHJldHVybiBzO1xufVxuLy9yZXR1cm5zIGEgZHVwbGljYXRlIG9mIGJpZ0ludCB4XG5mdW5jdGlvbiBkdXAoeCkge1xuICAgIHZhciBpLCBidWZmO1xuICAgIGJ1ZmYgPSBuZXcgQXJyYXkoeC5sZW5ndGgpO1xuICAgIGNvcHlfKGJ1ZmYsIHgpO1xuICAgIHJldHVybiBidWZmO1xufVxuLy9kbyB4PXkgb24gYmlnSW50cyB4IGFuZCB5LiAgeCBtdXN0IGJlIGFuIGFycmF5IGF0IGxlYXN0IGFzIGJpZyBhcyB5IChub3QgY291bnRpbmcgdGhlIGxlYWRpbmcgemVyb3MgaW4geSkuXG5mdW5jdGlvbiBjb3B5Xyh4LCB5KSB7XG4gICAgdmFyIGk7XG4gICAgdmFyIGsgPSB4Lmxlbmd0aCA8IHkubGVuZ3RoID8geC5sZW5ndGggOiB5Lmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgazsgaSsrKVxuICAgICAgICB4W2ldID0geVtpXTtcbiAgICBmb3IgKGkgPSBrOyBpIDwgeC5sZW5ndGg7IGkrKylcbiAgICAgICAgeFtpXSA9IDA7XG59XG4vL2RvIHg9eSBvbiBiaWdJbnQgeCBhbmQgaW50ZWdlciB5LlxuZnVuY3Rpb24gY29weUludF8oeCwgbikge1xuICAgIHZhciBpLCBjO1xuICAgIGZvciAoYyA9IG4sIGkgPSAwOyBpIDwgeC5sZW5ndGg7IGkrKykge1xuICAgICAgICB4W2ldID0gYyAmIG1hc2s7XG4gICAgICAgIGMgPj49IGJwZTtcbiAgICB9XG59XG4vL2RvIHg9eCtuIHdoZXJlIHggaXMgYSBiaWdJbnQgYW5kIG4gaXMgYW4gaW50ZWdlci5cbi8veCBtdXN0IGJlIGxhcmdlIGVub3VnaCB0byBob2xkIHRoZSByZXN1bHQuXG5mdW5jdGlvbiBhZGRJbnRfKHgsIG4pIHtcbiAgICB2YXIgaSwgaywgYywgYjtcbiAgICB4WzBdICs9IG47XG4gICAgayA9IHgubGVuZ3RoO1xuICAgIGMgPSAwO1xuICAgIGZvciAoaSA9IDA7IGkgPCBrOyBpKyspIHtcbiAgICAgICAgYyArPSB4W2ldO1xuICAgICAgICBiID0gMDtcbiAgICAgICAgaWYgKGMgPCAwKSB7XG4gICAgICAgICAgICBiID0gLShjID4+IGJwZSk7XG4gICAgICAgICAgICBjICs9IGIgKiByYWRpeDtcbiAgICAgICAgfVxuICAgICAgICB4W2ldID0gYyAmIG1hc2s7XG4gICAgICAgIGMgPSAoYyA+PiBicGUpIC0gYjtcbiAgICAgICAgaWYgKCFjKVxuICAgICAgICAgICAgcmV0dXJuOyAvL3N0b3AgY2FycnlpbmcgYXMgc29vbiBhcyB0aGUgY2FycnkgaXMgemVyb1xuICAgIH1cbn1cbi8vcmlnaHQgc2hpZnQgYmlnSW50IHggYnkgbiBiaXRzLiAgMCA8PSBuIDwgYnBlLlxuZnVuY3Rpb24gcmlnaHRTaGlmdF8oeCwgbikge1xuICAgIHZhciBpO1xuICAgIHZhciBrID0gTWF0aC5mbG9vcihuIC8gYnBlKTtcbiAgICBpZiAoaykge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgeC5sZW5ndGggLSBrOyBpKysgLy9yaWdodCBzaGlmdCB4IGJ5IGsgZWxlbWVudHNcbiAgICAgICAgKVxuICAgICAgICAgICAgeFtpXSA9IHhbaSArIGtdO1xuICAgICAgICBmb3IgKDsgaSA8IHgubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICB4W2ldID0gMDtcbiAgICAgICAgbiAlPSBicGU7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCB4Lmxlbmd0aCAtIDE7IGkrKykge1xuICAgICAgICB4W2ldID0gbWFzayAmICgoeFtpICsgMV0gPDwgKGJwZSAtIG4pKSB8ICh4W2ldID4+IG4pKTtcbiAgICB9XG4gICAgeFtpXSA+Pj0gbjtcbn1cbi8vZG8geD1mbG9vcih8eHwvMikqc2duKHgpIGZvciBiaWdJbnQgeCBpbiAyJ3MgY29tcGxlbWVudFxuZnVuY3Rpb24gaGFsdmVfKHgpIHtcbiAgICB2YXIgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgeC5sZW5ndGggLSAxOyBpKyspIHtcbiAgICAgICAgeFtpXSA9IG1hc2sgJiAoKHhbaSArIDFdIDw8IChicGUgLSAxKSkgfCAoeFtpXSA+PiAxKSk7XG4gICAgfVxuICAgIHhbaV0gPSAoeFtpXSA+PiAxKSB8ICh4W2ldICYgKHJhZGl4ID4+IDEpKTsgLy9tb3N0IHNpZ25pZmljYW50IGJpdCBzdGF5cyB0aGUgc2FtZVxufVxuLy9sZWZ0IHNoaWZ0IGJpZ0ludCB4IGJ5IG4gYml0cy5cbmZ1bmN0aW9uIGxlZnRTaGlmdF8oeCwgbikge1xuICAgIHZhciBpO1xuICAgIHZhciBrID0gTWF0aC5mbG9vcihuIC8gYnBlKTtcbiAgICBpZiAoaykge1xuICAgICAgICBmb3IgKGkgPSB4Lmxlbmd0aDsgaSA+PSBrOyBpLS0gLy9sZWZ0IHNoaWZ0IHggYnkgayBlbGVtZW50c1xuICAgICAgICApXG4gICAgICAgICAgICB4W2ldID0geFtpIC0ga107XG4gICAgICAgIGZvciAoOyBpID49IDA7IGktLSlcbiAgICAgICAgICAgIHhbaV0gPSAwO1xuICAgICAgICBuICU9IGJwZTtcbiAgICB9XG4gICAgaWYgKCFuKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChpID0geC5sZW5ndGggLSAxOyBpID4gMDsgaS0tKSB7XG4gICAgICAgIHhbaV0gPSBtYXNrICYgKCh4W2ldIDw8IG4pIHwgKHhbaSAtIDFdID4+IChicGUgLSBuKSkpO1xuICAgIH1cbiAgICB4W2ldID0gbWFzayAmICh4W2ldIDw8IG4pO1xufVxuLy9kbyB4PXgqbiB3aGVyZSB4IGlzIGEgYmlnSW50IGFuZCBuIGlzIGFuIGludGVnZXIuXG4vL3ggbXVzdCBiZSBsYXJnZSBlbm91Z2ggdG8gaG9sZCB0aGUgcmVzdWx0LlxuZnVuY3Rpb24gbXVsdEludF8oeCwgbikge1xuICAgIHZhciBpLCBrLCBjLCBiO1xuICAgIGlmICghbikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGsgPSB4Lmxlbmd0aDtcbiAgICBjID0gMDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgazsgaSsrKSB7XG4gICAgICAgIGMgKz0geFtpXSAqIG47XG4gICAgICAgIGIgPSAwO1xuICAgICAgICBpZiAoYyA8IDApIHtcbiAgICAgICAgICAgIGIgPSAtKGMgPj4gYnBlKTtcbiAgICAgICAgICAgIGMgKz0gYiAqIHJhZGl4O1xuICAgICAgICB9XG4gICAgICAgIHhbaV0gPSBjICYgbWFzaztcbiAgICAgICAgYyA9IChjID4+IGJwZSkgLSBiO1xuICAgIH1cbn1cbi8vZG8geD1mbG9vcih4L24pIGZvciBiaWdJbnQgeCBhbmQgaW50ZWdlciBuLCBhbmQgcmV0dXJuIHRoZSByZW1haW5kZXJcbmZ1bmN0aW9uIGRpdkludF8oeCwgbikge1xuICAgIHZhciBpLCByID0gMCwgcztcbiAgICBmb3IgKGkgPSB4Lmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgIHMgPSByICogcmFkaXggKyB4W2ldO1xuICAgICAgICB4W2ldID0gTWF0aC5mbG9vcihzIC8gbik7XG4gICAgICAgIHIgPSBzICUgbjtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG59XG4vL2RvIHRoZSBsaW5lYXIgY29tYmluYXRpb24geD1hKngrYip5IGZvciBiaWdJbnRzIHggYW5kIHksIGFuZCBpbnRlZ2VycyBhIGFuZCBiLlxuLy94IG11c3QgYmUgbGFyZ2UgZW5vdWdoIHRvIGhvbGQgdGhlIGFuc3dlci5cbmZ1bmN0aW9uIGxpbkNvbWJfKHgsIHksIGEsIGIpIHtcbiAgICB2YXIgaSwgYywgaywga2s7XG4gICAgayA9IHgubGVuZ3RoIDwgeS5sZW5ndGggPyB4Lmxlbmd0aCA6IHkubGVuZ3RoO1xuICAgIGtrID0geC5sZW5ndGg7XG4gICAgZm9yIChjID0gMCwgaSA9IDA7IGkgPCBrOyBpKyspIHtcbiAgICAgICAgYyArPSBhICogeFtpXSArIGIgKiB5W2ldO1xuICAgICAgICB4W2ldID0gYyAmIG1hc2s7XG4gICAgICAgIGMgPj49IGJwZTtcbiAgICB9XG4gICAgZm9yIChpID0gazsgaSA8IGtrOyBpKyspIHtcbiAgICAgICAgYyArPSBhICogeFtpXTtcbiAgICAgICAgeFtpXSA9IGMgJiBtYXNrO1xuICAgICAgICBjID4+PSBicGU7XG4gICAgfVxufVxuLy9kbyB0aGUgbGluZWFyIGNvbWJpbmF0aW9uIHg9YSp4K2IqKHk8PCh5cypicGUpKSBmb3IgYmlnSW50cyB4IGFuZCB5LCBhbmQgaW50ZWdlcnMgYSwgYiBhbmQgeXMuXG4vL3ggbXVzdCBiZSBsYXJnZSBlbm91Z2ggdG8gaG9sZCB0aGUgYW5zd2VyLlxuZnVuY3Rpb24gbGluQ29tYlNoaWZ0Xyh4LCB5LCBiLCB5cykge1xuICAgIHZhciBpLCBjLCBrLCBraztcbiAgICBrID0geC5sZW5ndGggPCB5cyArIHkubGVuZ3RoID8geC5sZW5ndGggOiB5cyArIHkubGVuZ3RoO1xuICAgIGtrID0geC5sZW5ndGg7XG4gICAgZm9yIChjID0gMCwgaSA9IHlzOyBpIDwgazsgaSsrKSB7XG4gICAgICAgIGMgKz0geFtpXSArIGIgKiB5W2kgLSB5c107XG4gICAgICAgIHhbaV0gPSBjICYgbWFzaztcbiAgICAgICAgYyA+Pj0gYnBlO1xuICAgIH1cbiAgICBmb3IgKGkgPSBrOyBjICYmIGkgPCBrazsgaSsrKSB7XG4gICAgICAgIGMgKz0geFtpXTtcbiAgICAgICAgeFtpXSA9IGMgJiBtYXNrO1xuICAgICAgICBjID4+PSBicGU7XG4gICAgfVxufVxuLy9kbyB4PXgrKHk8PCh5cypicGUpKSBmb3IgYmlnSW50cyB4IGFuZCB5LCBhbmQgaW50ZWdlcnMgYSxiIGFuZCB5cy5cbi8veCBtdXN0IGJlIGxhcmdlIGVub3VnaCB0byBob2xkIHRoZSBhbnN3ZXIuXG5mdW5jdGlvbiBhZGRTaGlmdF8oeCwgeSwgeXMpIHtcbiAgICB2YXIgaSwgYywgaywga2s7XG4gICAgayA9IHgubGVuZ3RoIDwgeXMgKyB5Lmxlbmd0aCA/IHgubGVuZ3RoIDogeXMgKyB5Lmxlbmd0aDtcbiAgICBrayA9IHgubGVuZ3RoO1xuICAgIGZvciAoYyA9IDAsIGkgPSB5czsgaSA8IGs7IGkrKykge1xuICAgICAgICBjICs9IHhbaV0gKyB5W2kgLSB5c107XG4gICAgICAgIHhbaV0gPSBjICYgbWFzaztcbiAgICAgICAgYyA+Pj0gYnBlO1xuICAgIH1cbiAgICBmb3IgKGkgPSBrOyBjICYmIGkgPCBrazsgaSsrKSB7XG4gICAgICAgIGMgKz0geFtpXTtcbiAgICAgICAgeFtpXSA9IGMgJiBtYXNrO1xuICAgICAgICBjID4+PSBicGU7XG4gICAgfVxufVxuLy9kbyB4PXgtKHk8PCh5cypicGUpKSBmb3IgYmlnSW50cyB4IGFuZCB5LCBhbmQgaW50ZWdlcnMgYSxiIGFuZCB5cy5cbi8veCBtdXN0IGJlIGxhcmdlIGVub3VnaCB0byBob2xkIHRoZSBhbnN3ZXIuXG5mdW5jdGlvbiBzdWJTaGlmdF8oeCwgeSwgeXMpIHtcbiAgICB2YXIgaSwgYywgaywga2s7XG4gICAgayA9IHgubGVuZ3RoIDwgeXMgKyB5Lmxlbmd0aCA/IHgubGVuZ3RoIDogeXMgKyB5Lmxlbmd0aDtcbiAgICBrayA9IHgubGVuZ3RoO1xuICAgIGZvciAoYyA9IDAsIGkgPSB5czsgaSA8IGs7IGkrKykge1xuICAgICAgICBjICs9IHhbaV0gLSB5W2kgLSB5c107XG4gICAgICAgIHhbaV0gPSBjICYgbWFzaztcbiAgICAgICAgYyA+Pj0gYnBlO1xuICAgIH1cbiAgICBmb3IgKGkgPSBrOyBjICYmIGkgPCBrazsgaSsrKSB7XG4gICAgICAgIGMgKz0geFtpXTtcbiAgICAgICAgeFtpXSA9IGMgJiBtYXNrO1xuICAgICAgICBjID4+PSBicGU7XG4gICAgfVxufVxuLy9kbyB4PXgteSBmb3IgYmlnSW50cyB4IGFuZCB5LlxuLy94IG11c3QgYmUgbGFyZ2UgZW5vdWdoIHRvIGhvbGQgdGhlIGFuc3dlci5cbi8vbmVnYXRpdmUgYW5zd2VycyB3aWxsIGJlIDJzIGNvbXBsZW1lbnRcbmZ1bmN0aW9uIHN1Yl8oeCwgeSkge1xuICAgIHZhciBpLCBjLCBrLCBraztcbiAgICBrID0geC5sZW5ndGggPCB5Lmxlbmd0aCA/IHgubGVuZ3RoIDogeS5sZW5ndGg7XG4gICAgZm9yIChjID0gMCwgaSA9IDA7IGkgPCBrOyBpKyspIHtcbiAgICAgICAgYyArPSB4W2ldIC0geVtpXTtcbiAgICAgICAgeFtpXSA9IGMgJiBtYXNrO1xuICAgICAgICBjID4+PSBicGU7XG4gICAgfVxuICAgIGZvciAoaSA9IGs7IGMgJiYgaSA8IHgubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgYyArPSB4W2ldO1xuICAgICAgICB4W2ldID0gYyAmIG1hc2s7XG4gICAgICAgIGMgPj49IGJwZTtcbiAgICB9XG59XG4vL2RvIHg9eCt5IGZvciBiaWdJbnRzIHggYW5kIHkuXG4vL3ggbXVzdCBiZSBsYXJnZSBlbm91Z2ggdG8gaG9sZCB0aGUgYW5zd2VyLlxuZnVuY3Rpb24gYWRkXyh4LCB5KSB7XG4gICAgdmFyIGksIGMsIGssIGtrO1xuICAgIGsgPSB4Lmxlbmd0aCA8IHkubGVuZ3RoID8geC5sZW5ndGggOiB5Lmxlbmd0aDtcbiAgICBmb3IgKGMgPSAwLCBpID0gMDsgaSA8IGs7IGkrKykge1xuICAgICAgICBjICs9IHhbaV0gKyB5W2ldO1xuICAgICAgICB4W2ldID0gYyAmIG1hc2s7XG4gICAgICAgIGMgPj49IGJwZTtcbiAgICB9XG4gICAgZm9yIChpID0gazsgYyAmJiBpIDwgeC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjICs9IHhbaV07XG4gICAgICAgIHhbaV0gPSBjICYgbWFzaztcbiAgICAgICAgYyA+Pj0gYnBlO1xuICAgIH1cbn1cbi8vZG8geD14KnkgZm9yIGJpZ0ludHMgeCBhbmQgeS4gIFRoaXMgaXMgZmFzdGVyIHdoZW4geTx4LlxuZnVuY3Rpb24gbXVsdF8oeCwgeSkge1xuICAgIHZhciBpO1xuICAgIGlmIChzcy5sZW5ndGggIT0gMiAqIHgubGVuZ3RoKSB7XG4gICAgICAgIHNzID0gbmV3IEFycmF5KDIgKiB4Lmxlbmd0aCk7XG4gICAgfVxuICAgIGNvcHlJbnRfKHNzLCAwKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgeS5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYgKHlbaV0pIHtcbiAgICAgICAgICAgIGxpbkNvbWJTaGlmdF8oc3MsIHgsIHlbaV0sIGkpO1xuICAgICAgICB9IC8vc3M9MSpzcyt5W2ldKih4PDwoaSpicGUpKVxuICAgIGNvcHlfKHgsIHNzKTtcbn1cbi8vZG8geD14IG1vZCBuIGZvciBiaWdJbnRzIHggYW5kIG4uXG5mdW5jdGlvbiBtb2RfKHgsIG4pIHtcbiAgICBpZiAoczQubGVuZ3RoICE9IHgubGVuZ3RoKSB7XG4gICAgICAgIHM0ID0gZHVwKHgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29weV8oczQsIHgpO1xuICAgIH1cbiAgICBpZiAoczUubGVuZ3RoICE9IHgubGVuZ3RoKSB7XG4gICAgICAgIHM1ID0gZHVwKHgpO1xuICAgIH1cbiAgICBkaXZpZGVfKHM0LCBuLCBzNSwgeCk7IC8veCA9IHJlbWFpbmRlciBvZiBzNCAvIG5cbn1cbi8vZG8geD14KnkgbW9kIG4gZm9yIGJpZ0ludHMgeCx5LG4uXG4vL2ZvciBncmVhdGVyIHNwZWVkLCBsZXQgeTx4LlxuZnVuY3Rpb24gbXVsdE1vZF8oeCwgeSwgbikge1xuICAgIHZhciBpO1xuICAgIGlmIChzMC5sZW5ndGggIT0gMiAqIHgubGVuZ3RoKSB7XG4gICAgICAgIHMwID0gbmV3IEFycmF5KDIgKiB4Lmxlbmd0aCk7XG4gICAgfVxuICAgIGNvcHlJbnRfKHMwLCAwKTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgeS5sZW5ndGg7IGkrKylcbiAgICAgICAgaWYgKHlbaV0pIHtcbiAgICAgICAgICAgIGxpbkNvbWJTaGlmdF8oczAsIHgsIHlbaV0sIGkpO1xuICAgICAgICB9IC8vczA9MSpzMCt5W2ldKih4PDwoaSpicGUpKVxuICAgIG1vZF8oczAsIG4pO1xuICAgIGNvcHlfKHgsIHMwKTtcbn1cbi8vZG8geD14KnggbW9kIG4gZm9yIGJpZ0ludHMgeCxuLlxuZnVuY3Rpb24gc3F1YXJlTW9kXyh4LCBuKSB7XG4gICAgdmFyIGksIGosIGQsIGMsIGt4LCBrbiwgaztcbiAgICBmb3IgKGt4ID0geC5sZW5ndGg7IGt4ID4gMCAmJiAheFtreCAtIDFdOyBreC0tKVxuICAgICAgICA7IC8vaWdub3JlIGxlYWRpbmcgemVyb3MgaW4geFxuICAgIGsgPSBreCA+IG4ubGVuZ3RoID8gMiAqIGt4IDogMiAqIG4ubGVuZ3RoOyAvL2s9IyBlbGVtZW50cyBpbiB0aGUgcHJvZHVjdCwgd2hpY2ggaXMgdHdpY2UgdGhlIGVsZW1lbnRzIGluIHRoZSBsYXJnZXIgb2YgeCBhbmQgblxuICAgIGlmIChzMC5sZW5ndGggIT0gaykge1xuICAgICAgICBzMCA9IG5ldyBBcnJheShrKTtcbiAgICB9XG4gICAgY29weUludF8oczAsIDApO1xuICAgIGZvciAoaSA9IDA7IGkgPCBreDsgaSsrKSB7XG4gICAgICAgIGMgPSBzMFsyICogaV0gKyB4W2ldICogeFtpXTtcbiAgICAgICAgczBbMiAqIGldID0gYyAmIG1hc2s7XG4gICAgICAgIGMgPj49IGJwZTtcbiAgICAgICAgZm9yIChqID0gaSArIDE7IGogPCBreDsgaisrKSB7XG4gICAgICAgICAgICBjID0gczBbaSArIGpdICsgMiAqIHhbaV0gKiB4W2pdICsgYztcbiAgICAgICAgICAgIHMwW2kgKyBqXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICB9XG4gICAgICAgIHMwW2kgKyBreF0gPSBjO1xuICAgIH1cbiAgICBtb2RfKHMwLCBuKTtcbiAgICBjb3B5Xyh4LCBzMCk7XG59XG4vL3JldHVybiB4IHdpdGggZXhhY3RseSBrIGxlYWRpbmcgemVybyBlbGVtZW50c1xuZnVuY3Rpb24gdHJpbSh4LCBrKSB7XG4gICAgdmFyIGksIHk7XG4gICAgZm9yIChpID0geC5sZW5ndGg7IGkgPiAwICYmICF4W2kgLSAxXTsgaS0tKVxuICAgICAgICA7XG4gICAgeSA9IG5ldyBBcnJheShpICsgayk7XG4gICAgY29weV8oeSwgeCk7XG4gICAgcmV0dXJuIHk7XG59XG4vL2RvIHg9eCoqeSBtb2Qgbiwgd2hlcmUgeCx5LG4gYXJlIGJpZ0ludHMgYW5kICoqIGlzIGV4cG9uZW50aWF0aW9uLiAgMCoqMD0xLlxuLy90aGlzIGlzIGZhc3RlciB3aGVuIG4gaXMgb2RkLiAgeCB1c3VhbGx5IG5lZWRzIHRvIGhhdmUgYXMgbWFueSBlbGVtZW50cyBhcyBuLlxuZnVuY3Rpb24gcG93TW9kXyh4LCB5LCBuKSB7XG4gICAgdmFyIGsxLCBrMiwga24sIG5wO1xuICAgIGlmIChzNy5sZW5ndGggIT0gbi5sZW5ndGgpIHtcbiAgICAgICAgczcgPSBkdXAobik7XG4gICAgfVxuICAgIC8vZm9yIGV2ZW4gbW9kdWx1cywgdXNlIGEgc2ltcGxlIHNxdWFyZS1hbmQtbXVsdGlwbHkgYWxnb3JpdGhtLFxuICAgIC8vcmF0aGVyIHRoYW4gdXNpbmcgdGhlIG1vcmUgY29tcGxleCBNb250Z29tZXJ5IGFsZ29yaXRobS5cbiAgICBpZiAoKG5bMF0gJiAxKSA9PSAwKSB7XG4gICAgICAgIGNvcHlfKHM3LCB4KTtcbiAgICAgICAgY29weUludF8oeCwgMSk7XG4gICAgICAgIHdoaWxlICghZXF1YWxzSW50KHksIDApKSB7XG4gICAgICAgICAgICBpZiAoeVswXSAmIDEpIHtcbiAgICAgICAgICAgICAgICBtdWx0TW9kXyh4LCBzNywgbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkaXZJbnRfKHksIDIpO1xuICAgICAgICAgICAgc3F1YXJlTW9kXyhzNywgbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvL2NhbGN1bGF0ZSBucCBmcm9tIG4gZm9yIHRoZSBNb250Z29tZXJ5IG11bHRpcGxpY2F0aW9uc1xuICAgIGNvcHlJbnRfKHM3LCAwKTtcbiAgICBmb3IgKGtuID0gbi5sZW5ndGg7IGtuID4gMCAmJiAhbltrbiAtIDFdOyBrbi0tKVxuICAgICAgICA7XG4gICAgbnAgPSByYWRpeCAtIGludmVyc2VNb2RJbnQobW9kSW50KG4sIHJhZGl4KSwgcmFkaXgpO1xuICAgIHM3W2tuXSA9IDE7XG4gICAgbXVsdE1vZF8oeCwgczcsIG4pOyAvLyB4ID0geCAqIDIqKihrbipicCkgbW9kIG5cbiAgICBpZiAoczMubGVuZ3RoICE9IHgubGVuZ3RoKSB7XG4gICAgICAgIHMzID0gZHVwKHgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29weV8oczMsIHgpO1xuICAgIH1cbiAgICBmb3IgKGsxID0geS5sZW5ndGggLSAxOyAoazEgPiAwKSAmICF5W2sxXTsgazEtLSlcbiAgICAgICAgOyAvL2sxPWZpcnN0IG5vbnplcm8gZWxlbWVudCBvZiB5XG4gICAgaWYgKHlbazFdID09IDApIHtcbiAgICAgICAgLy9hbnl0aGluZyB0byB0aGUgMHRoIHBvd2VyIGlzIDFcbiAgICAgICAgY29weUludF8oeCwgMSk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZm9yIChrMiA9IDEgPDwgKGJwZSAtIDEpOyBrMiAmJiAhKHlbazFdICYgazIpOyBrMiA+Pj0gMSlcbiAgICAgICAgOyAvL2syPXBvc2l0aW9uIG9mIGZpcnN0IDEgYml0IGluIHlbazFdXG4gICAgZm9yICg7Oykge1xuICAgICAgICBrMiA+Pj0gMTtcbiAgICAgICAgaWYgKCFrMikge1xuICAgICAgICAgICAgLy9sb29rIGF0IG5leHQgYml0IG9mIHlcbiAgICAgICAgICAgIGsxLS07XG4gICAgICAgICAgICBpZiAoazEgPCAwKSB7XG4gICAgICAgICAgICAgICAgbW9udF8oeCwgb25lLCBuLCBucCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgazIgPSAxIDw8IChicGUgLSAxKTtcbiAgICAgICAgfVxuICAgICAgICBtb250Xyh4LCB4LCBuLCBucCk7XG4gICAgICAgIGlmIChrMiAmIHlbazFdKSB7XG4gICAgICAgICAgICAvL2lmIG5leHQgYml0IGlzIGEgMVxuICAgICAgICAgICAgbW9udF8oeCwgczMsIG4sIG5wKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbi8vZG8geD14KnkqUmkgbW9kIG4gZm9yIGJpZ0ludHMgeCx5LG4sXG4vLyAgd2hlcmUgUmkgPSAyKiooLWtuKmJwZSkgbW9kIG4sIGFuZCBrbiBpcyB0aGVcbi8vICBudW1iZXIgb2YgZWxlbWVudHMgaW4gdGhlIG4gYXJyYXksIG5vdFxuLy8gIGNvdW50aW5nIGxlYWRpbmcgemVyb3MuXG4vL3ggYXJyYXkgbXVzdCBoYXZlIGF0IGxlYXN0IGFzIG1hbnkgZWxlbW50cyBhcyB0aGUgbiBhcnJheVxuLy9JdCdzIE9LIGlmIHggYW5kIHkgYXJlIHRoZSBzYW1lIHZhcmlhYmxlLlxuLy9tdXN0IGhhdmU6XG4vLyAgeCx5IDwgblxuLy8gIG4gaXMgb2RkXG4vLyAgbnAgPSAtKG5eKC0xKSkgbW9kIHJhZGl4XG5mdW5jdGlvbiBtb250Xyh4LCB5LCBuLCBucCkge1xuICAgIHZhciBpLCBqLCBjLCB1aSwgdCwga3M7XG4gICAgdmFyIGtuID0gbi5sZW5ndGg7XG4gICAgdmFyIGt5ID0geS5sZW5ndGg7XG4gICAgaWYgKHNhLmxlbmd0aCAhPSBrbikge1xuICAgICAgICBzYSA9IG5ldyBBcnJheShrbik7XG4gICAgfVxuICAgIGNvcHlJbnRfKHNhLCAwKTtcbiAgICBmb3IgKDsga24gPiAwICYmIG5ba24gLSAxXSA9PSAwOyBrbi0tKVxuICAgICAgICA7IC8vaWdub3JlIGxlYWRpbmcgemVyb3Mgb2YgblxuICAgIGZvciAoOyBreSA+IDAgJiYgeVtreSAtIDFdID09IDA7IGt5LS0pXG4gICAgICAgIDsgLy9pZ25vcmUgbGVhZGluZyB6ZXJvcyBvZiB5XG4gICAga3MgPSBzYS5sZW5ndGggLSAxOyAvL3NhIHdpbGwgbmV2ZXIgaGF2ZSBtb3JlIHRoYW4gdGhpcyBtYW55IG5vbnplcm8gZWxlbWVudHMuXG4gICAgLy90aGUgZm9sbG93aW5nIGxvb3AgY29uc3VtZXMgOTUlIG9mIHRoZSBydW50aW1lIGZvciByYW5kVHJ1ZVByaW1lXygpIGFuZCBwb3dNb2RfKCkgZm9yIGxhcmdlIG51bWJlcnNcbiAgICBmb3IgKGkgPSAwOyBpIDwga247IGkrKykge1xuICAgICAgICB0ID0gc2FbMF0gKyB4W2ldICogeVswXTtcbiAgICAgICAgdWkgPSAoKHQgJiBtYXNrKSAqIG5wKSAmIG1hc2s7IC8vdGhlIGlubmVyIFwiJiBtYXNrXCIgd2FzIG5lZWRlZCBvbiBTYWZhcmkgKGJ1dCBub3QgTVNJRSkgYXQgb25lIHRpbWVcbiAgICAgICAgYyA9ICh0ICsgdWkgKiBuWzBdKSA+PiBicGU7XG4gICAgICAgIHQgPSB4W2ldO1xuICAgICAgICAvL2RvIHNhPShzYSt4W2ldKnkrdWkqbikvYiAgIHdoZXJlIGI9MioqYnBlLiAgTG9vcCBpcyB1bnJvbGxlZCA1LWZvbGQgZm9yIHNwZWVkXG4gICAgICAgIGogPSAxO1xuICAgICAgICBmb3IgKDsgaiA8IGt5IC0gNDspIHtcbiAgICAgICAgICAgIGMgKz0gc2Fbal0gKyB1aSAqIG5bal0gKyB0ICogeVtqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXSArIHQgKiB5W2pdO1xuICAgICAgICAgICAgc2FbaiAtIDFdID0gYyAmIG1hc2s7XG4gICAgICAgICAgICBjID4+PSBicGU7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgICAgICBjICs9IHNhW2pdICsgdWkgKiBuW2pdICsgdCAqIHlbal07XG4gICAgICAgICAgICBzYVtqIC0gMV0gPSBjICYgbWFzaztcbiAgICAgICAgICAgIGMgPj49IGJwZTtcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgICAgIGMgKz0gc2Fbal0gKyB1aSAqIG5bal0gKyB0ICogeVtqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXSArIHQgKiB5W2pdO1xuICAgICAgICAgICAgc2FbaiAtIDFdID0gYyAmIG1hc2s7XG4gICAgICAgICAgICBjID4+PSBicGU7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGogPCBreTspIHtcbiAgICAgICAgICAgIGMgKz0gc2Fbal0gKyB1aSAqIG5bal0gKyB0ICogeVtqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoOyBqIDwga24gLSA0Oykge1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICAgICAgYyArPSBzYVtqXSArIHVpICogbltqXTtcbiAgICAgICAgICAgIHNhW2ogLSAxXSA9IGMgJiBtYXNrO1xuICAgICAgICAgICAgYyA+Pj0gYnBlO1xuICAgICAgICAgICAgaisrO1xuICAgICAgICB9XG4gICAgICAgIGZvciAoOyBqIDwga247KSB7XG4gICAgICAgICAgICBjICs9IHNhW2pdICsgdWkgKiBuW2pdO1xuICAgICAgICAgICAgc2FbaiAtIDFdID0gYyAmIG1hc2s7XG4gICAgICAgICAgICBjID4+PSBicGU7XG4gICAgICAgICAgICBqKys7XG4gICAgICAgIH1cbiAgICAgICAgZm9yICg7IGogPCBrczspIHtcbiAgICAgICAgICAgIGMgKz0gc2Fbal07XG4gICAgICAgICAgICBzYVtqIC0gMV0gPSBjICYgbWFzaztcbiAgICAgICAgICAgIGMgPj49IGJwZTtcbiAgICAgICAgICAgIGorKztcbiAgICAgICAgfVxuICAgICAgICBzYVtqIC0gMV0gPSBjICYgbWFzaztcbiAgICB9XG4gICAgaWYgKCFncmVhdGVyKG4sIHNhKSkge1xuICAgICAgICBzdWJfKHNhLCBuKTtcbiAgICB9XG4gICAgY29weV8oeCwgc2EpO1xufVxuIiwiZXhwb3J0IHZhciBLZXlQYWlyVHlwZTtcbihmdW5jdGlvbiAoS2V5UGFpclR5cGUpIHtcbiAgICBLZXlQYWlyVHlwZVtLZXlQYWlyVHlwZVtcIlJTQVwiXSA9IDBdID0gXCJSU0FcIjtcbiAgICBLZXlQYWlyVHlwZVtLZXlQYWlyVHlwZVtcIlJTQV9BTkRfRUNDXCJdID0gMV0gPSBcIlJTQV9BTkRfRUNDXCI7XG4gICAgS2V5UGFpclR5cGVbS2V5UGFpclR5cGVbXCJUVVRBX0NSWVBUXCJdID0gMl0gPSBcIlRVVEFfQ1JZUFRcIjtcbn0pKEtleVBhaXJUeXBlIHx8IChLZXlQYWlyVHlwZSA9IHt9KSk7XG5leHBvcnQgZnVuY3Rpb24gaXNQcUtleVBhaXJzKGtleVBhaXIpIHtcbiAgICByZXR1cm4ga2V5UGFpci5rZXlQYWlyVHlwZSA9PT0gS2V5UGFpclR5cGUuVFVUQV9DUllQVDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1JzYU9yUnNhRWNjS2V5UGFpcihrZXlQYWlyKSB7XG4gICAgcmV0dXJuIGtleVBhaXIua2V5UGFpclR5cGUgPT09IEtleVBhaXJUeXBlLlJTQSB8fCBrZXlQYWlyLmtleVBhaXJUeXBlID09PSBLZXlQYWlyVHlwZS5SU0FfQU5EX0VDQztcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1JzYUVjY0tleVBhaXIoa2V5UGFpcikge1xuICAgIHJldHVybiBrZXlQYWlyLmtleVBhaXJUeXBlID09PSBLZXlQYWlyVHlwZS5SU0FfQU5EX0VDQztcbn1cbmV4cG9ydCBmdW5jdGlvbiBpc1BxUHVibGljS2V5KHB1YmxpY0tleSkge1xuICAgIHJldHVybiBwdWJsaWNLZXkua2V5UGFpclR5cGUgPT09IEtleVBhaXJUeXBlLlRVVEFfQ1JZUFQ7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNSc2FQdWJsaWNLZXkocHVibGljS2V5KSB7XG4gICAgcmV0dXJuIHB1YmxpY0tleS5rZXlQYWlyVHlwZSA9PT0gS2V5UGFpclR5cGUuUlNBO1xufVxuIiwiLy8gQHRzLWlnbm9yZVt1bnR5cGVkLWltcG9ydF1cbmltcG9ydCB7IEJpZ0ludGVnZXIsIHBhcnNlQmlnSW50LCBSU0FLZXkgfSBmcm9tIFwiLi4vaW50ZXJuYWwvY3J5cHRvLWpzYm4tMjAxMi0wOC0wOV8xLmpzXCI7XG5pbXBvcnQgeyBiYXNlNjRUb0hleCwgYmFzZTY0VG9VaW50OEFycmF5LCBjb25jYXQsIGludDhBcnJheVRvQmFzZTY0LCB1aW50OEFycmF5VG9IZXggfSBmcm9tIFwiQHR1dGFvL3R1dGFub3RhLXV0aWxzXCI7XG5pbXBvcnQgeyBDcnlwdG9FcnJvciB9IGZyb20gXCIuLi9taXNjL0NyeXB0b0Vycm9yLmpzXCI7XG5pbXBvcnQgeyBzaGEyNTZIYXNoIH0gZnJvbSBcIi4uL2hhc2hlcy9TaGEyNTYuanNcIjtcbmltcG9ydCB7IEtleVBhaXJUeXBlIH0gZnJvbSBcIi4vQXN5bW1ldHJpY0tleVBhaXIuanNcIjtcbmNvbnN0IFJTQV9LRVlfTEVOR1RIX0JJVFMgPSAyMDQ4O1xuY29uc3QgUlNBX1BVQkxJQ19FWFBPTkVOVCA9IDY1NTM3O1xuZXhwb3J0IGZ1bmN0aW9uIHJzYUVuY3J5cHQocHVibGljS2V5LCBieXRlcywgc2VlZCkge1xuICAgIGNvbnN0IHJzYSA9IG5ldyBSU0FLZXkoKTtcbiAgICAvLyB3ZSBoYXZlIGRvdWJsZSBjb252ZXJzaW9uIGZyb20gYnl0ZXMgdG8gaGV4IHRvIGJpZyBpbnQgYmVjYXVzZSB0aGVyZSBpcyBubyBkaXJlY3QgY29udmVyc2lvbiBmcm9tIGJ5dGVzIHRvIGJpZyBpbnRcbiAgICAvLyBCaWdJbnRlZ2VyIG9mIEpTQk4gdXNlcyBhIHNpZ25lZCBieXRlIGFycmF5IGFuZCB3ZSBjb252ZXJ0IHRvIGl0IGJ5IHVzaW5nIEludDhBcnJheVxuICAgIHJzYS5uID0gbmV3IEJpZ0ludGVnZXIobmV3IEludDhBcnJheShiYXNlNjRUb1VpbnQ4QXJyYXkocHVibGljS2V5Lm1vZHVsdXMpKSk7XG4gICAgcnNhLmUgPSBwdWJsaWNLZXkucHVibGljRXhwb25lbnQ7XG4gICAgY29uc3QgcGFkZGVkQnl0ZXMgPSBvYWVwUGFkKGJ5dGVzLCBwdWJsaWNLZXkua2V5TGVuZ3RoLCBzZWVkKTtcbiAgICBjb25zdCBwYWRkZWRIZXggPSB1aW50OEFycmF5VG9IZXgocGFkZGVkQnl0ZXMpO1xuICAgIGNvbnN0IGJpZ0ludCA9IHBhcnNlQmlnSW50KHBhZGRlZEhleCwgMTYpO1xuICAgIGxldCBlbmNyeXB0ZWQ7XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gdG9CeXRlQXJyYXkoKSBwcm9kdWNlcyBBcnJheSBzbyB3ZSBjb252ZXJ0IGl0IHRvIGJ1ZmZlci5cbiAgICAgICAgZW5jcnlwdGVkID0gbmV3IFVpbnQ4QXJyYXkocnNhLmRvUHVibGljKGJpZ0ludCkudG9CeXRlQXJyYXkoKSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihcImZhaWxlZCBSU0EgZW5jcnlwdGlvblwiLCBlKTtcbiAgICB9XG4gICAgLy8gdGhlIGVuY3J5cHRlZCB2YWx1ZSBtaWdodCBoYXZlIGxlYWRpbmcgemVyb3Mgb3IgbmVlZHMgdG8gYmUgcGFkZGVkIHdpdGggemVyb3NcbiAgICByZXR1cm4gX3BhZEFuZFVucGFkTGVhZGluZ1plcm9zKHB1YmxpY0tleS5rZXlMZW5ndGggLyA4LCBlbmNyeXB0ZWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJzYURlY3J5cHQocHJpdmF0ZUtleSwgYnl0ZXMpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCByc2EgPSBuZXcgUlNBS2V5KCk7XG4gICAgICAgIC8vIHdlIGhhdmUgZG91YmxlIGNvbnZlcnNpb24gZnJvbSBieXRlcyB0byBoZXggdG8gYmlnIGludCBiZWNhdXNlIHRoZXJlIGlzIG5vIGRpcmVjdCBjb252ZXJzaW9uIGZyb20gYnl0ZXMgdG8gYmlnIGludFxuICAgICAgICAvLyBCaWdJbnRlZ2VyIG9mIEpTQk4gdXNlcyBhIHNpZ25lZCBieXRlIGFycmF5IGFuZCB3ZSBjb252ZXJ0IHRvIGl0IGJ5IHVzaW5nIEludDhBcnJheVxuICAgICAgICByc2EubiA9IG5ldyBCaWdJbnRlZ2VyKG5ldyBJbnQ4QXJyYXkoYmFzZTY0VG9VaW50OEFycmF5KHByaXZhdGVLZXkubW9kdWx1cykpKTtcbiAgICAgICAgcnNhLmQgPSBuZXcgQmlnSW50ZWdlcihuZXcgSW50OEFycmF5KGJhc2U2NFRvVWludDhBcnJheShwcml2YXRlS2V5LnByaXZhdGVFeHBvbmVudCkpKTtcbiAgICAgICAgcnNhLnAgPSBuZXcgQmlnSW50ZWdlcihuZXcgSW50OEFycmF5KGJhc2U2NFRvVWludDhBcnJheShwcml2YXRlS2V5LnByaW1lUCkpKTtcbiAgICAgICAgcnNhLnEgPSBuZXcgQmlnSW50ZWdlcihuZXcgSW50OEFycmF5KGJhc2U2NFRvVWludDhBcnJheShwcml2YXRlS2V5LnByaW1lUSkpKTtcbiAgICAgICAgcnNhLmRtcDEgPSBuZXcgQmlnSW50ZWdlcihuZXcgSW50OEFycmF5KGJhc2U2NFRvVWludDhBcnJheShwcml2YXRlS2V5LnByaW1lRXhwb25lbnRQKSkpO1xuICAgICAgICByc2EuZG1xMSA9IG5ldyBCaWdJbnRlZ2VyKG5ldyBJbnQ4QXJyYXkoYmFzZTY0VG9VaW50OEFycmF5KHByaXZhdGVLZXkucHJpbWVFeHBvbmVudFEpKSk7XG4gICAgICAgIHJzYS5jb2VmZiA9IG5ldyBCaWdJbnRlZ2VyKG5ldyBJbnQ4QXJyYXkoYmFzZTY0VG9VaW50OEFycmF5KHByaXZhdGVLZXkuY3J0Q29lZmZpY2llbnQpKSk7XG4gICAgICAgIGNvbnN0IGhleCA9IHVpbnQ4QXJyYXlUb0hleChieXRlcyk7XG4gICAgICAgIGNvbnN0IGJpZ0ludCA9IHBhcnNlQmlnSW50KGhleCwgMTYpO1xuICAgICAgICBjb25zdCBkZWNyeXB0ZWQgPSBuZXcgVWludDhBcnJheShyc2EuZG9Qcml2YXRlKGJpZ0ludCkudG9CeXRlQXJyYXkoKSk7XG4gICAgICAgIC8vIHRoZSBkZWNyeXB0ZWQgdmFsdWUgbWlnaHQgaGF2ZSBsZWFkaW5nIHplcm9zIG9yIG5lZWRzIHRvIGJlIHBhZGRlZCB3aXRoIHplcm9zXG4gICAgICAgIGNvbnN0IHBhZGRlZERlY3J5cHRlZCA9IF9wYWRBbmRVbnBhZExlYWRpbmdaZXJvcyhwcml2YXRlS2V5LmtleUxlbmd0aCAvIDggLSAxLCBkZWNyeXB0ZWQpO1xuICAgICAgICByZXR1cm4gb2FlcFVucGFkKHBhZGRlZERlY3J5cHRlZCwgcHJpdmF0ZUtleS5rZXlMZW5ndGgpO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJmYWlsZWQgUlNBIGRlY3J5cHRpb25cIiwgZSk7XG4gICAgfVxufVxuLyoqXG4gKiBBZGRzIGxlYWRpbmcgMCdzIHRvIHRoZSBnaXZlbiBieXRlIGFycmF5IHVudGlsIHRhcmdlQnl0ZUxlbmd0aCBieXRlcyBhcmUgcmVhY2hlZC4gUmVtb3ZlcyBsZWFkaW5nIDAncyBpZiBieXRlQXJyYXkgaXMgbG9uZ2VyIHRoYW4gdGFyZ2V0Qnl0ZUxlbmd0aC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9wYWRBbmRVbnBhZExlYWRpbmdaZXJvcyh0YXJnZXRCeXRlTGVuZ3RoLCBieXRlQXJyYXkpIHtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheSh0YXJnZXRCeXRlTGVuZ3RoKTtcbiAgICAvLyBKU0JOIHByb2R1Y2VzIHJlc3VsdHMgd2hpY2ggYXJlIG5vdCBhbHdheXMgZXhhY3QgbGVuZ3RoLlxuICAgIC8vIFRoZSBieXRlQXJyYXkgbWlnaHQgaGF2ZSBsZWFkaW5nIDAgdGhhdCBtYWtlIGl0IGxhcmdlciB0aGFuIHRoZSBhY3R1YWwgcmVzdWx0IGFycmF5IGxlbmd0aC5cbiAgICAvLyBIZXJlIHdlIGN1dCB0aGVtIG9mZlxuICAgIC8vIGJ5dGVBcnJheSBbMCwgMCwgMSwgMSwgMV1cbiAgICAvLyB0YXJnZXQgICAgICAgWzAsIDAsIDAsIDBdXG4gICAgLy8gcmVzdWx0ICAgICAgIFswLCAxLCAxLCAxXVxuICAgIGlmIChieXRlQXJyYXkubGVuZ3RoID4gcmVzdWx0Lmxlbmd0aCkge1xuICAgICAgICBjb25zdCBsYXN0RXh0cmFCeXRlID0gYnl0ZUFycmF5W2J5dGVBcnJheS5sZW5ndGggLSByZXN1bHQubGVuZ3RoIC0gMV07XG4gICAgICAgIGlmIChsYXN0RXh0cmFCeXRlICE9PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoYGxlYWRpbmcgYnl0ZSBpcyBub3QgMCBidXQgJHtsYXN0RXh0cmFCeXRlfSwgZW5jcnlwdGVkIGxlbmd0aDogJHtieXRlQXJyYXkubGVuZ3RofWApO1xuICAgICAgICB9XG4gICAgICAgIGJ5dGVBcnJheSA9IGJ5dGVBcnJheS5zbGljZShieXRlQXJyYXkubGVuZ3RoIC0gcmVzdWx0Lmxlbmd0aCk7XG4gICAgfVxuICAgIC8vIElmIHRoZSBieXRlQXJyYXkgaXMgbm90IGFzIGxvbmcgYXMgdGhlIHJlc3VsdCBhcnJheSB3ZSBhZGQgbGVhZGluZyAwJ3NcbiAgICAvLyBieXRlQXJyYXkgICAgIFsxLCAxLCAxXVxuICAgIC8vIHRhcmdldCAgICAgWzAsIDAsIDAsIDBdXG4gICAgLy8gcmVzdWx0ICAgICBbMCwgMSwgMSwgMV1cbiAgICByZXN1bHQuc2V0KGJ5dGVBcnJheSwgcmVzdWx0Lmxlbmd0aCAtIGJ5dGVBcnJheS5sZW5ndGgpO1xuICAgIHJldHVybiByZXN1bHQ7XG59XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIE9BRVAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqXG4gKiBPcHRpbWFsIEFzeW1tZXRyaWMgRW5jcnlwdGlvbiBQYWRkaW5nIChPQUVQKSAvIFJTQSBwYWRkaW5nXG4gKiBAc2VlIGh0dHBzOi8vdG9vbHMuaWV0Zi5vcmcvaHRtbC9yZmMzNDQ3I3NlY3Rpb24tNy4xXG4gKlxuICogQHBhcmFtIHZhbHVlIFRoZSBieXRlIGFycmF5IHRvIGVuY29kZS5cbiAqIEBwYXJhbSBrZXlMZW5ndGggVGhlIGxlbmd0aCBvZiB0aGUgUlNBIGtleSBpbiBiaXQuXG4gKiBAcGFyYW0gc2VlZCBBbiBhcnJheSBvZiAzMiByYW5kb20gYnl0ZXMuXG4gKiBAcmV0dXJuIFRoZSBwYWRkZWQgYnl0ZSBhcnJheS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9hZXBQYWQodmFsdWUsIGtleUxlbmd0aCwgc2VlZCkge1xuICAgIGxldCBoYXNoTGVuZ3RoID0gMzI7IC8vIGJ5dGVzIHNoYTI1NlxuICAgIGlmIChzZWVkLmxlbmd0aCAhPT0gaGFzaExlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJpbnZhbGlkIHNlZWQgbGVuZ3RoOiBcIiArIHNlZWQubGVuZ3RoICsgXCIuIGV4cGVjdGVkOiBcIiArIGhhc2hMZW5ndGggKyBcIiBieXRlcyFcIik7XG4gICAgfVxuICAgIGlmICh2YWx1ZS5sZW5ndGggPiBrZXlMZW5ndGggLyA4IC0gaGFzaExlbmd0aCAtIDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IENyeXB0b0Vycm9yKFwiaW52YWxpZCB2YWx1ZSBsZW5ndGg6IFwiICsgdmFsdWUubGVuZ3RoICsgXCIuIGV4cGVjdGVkOiBtYXguIFwiICsgKGtleUxlbmd0aCAvIDggLSBoYXNoTGVuZ3RoIC0gMSkpO1xuICAgIH1cbiAgICBsZXQgYmxvY2sgPSBfZ2V0UFNCbG9jayh2YWx1ZSwga2V5TGVuZ3RoKTtcbiAgICBsZXQgZGJNYXNrID0gbWdmMShzZWVkLCBibG9jay5sZW5ndGggLSBoYXNoTGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gaGFzaExlbmd0aDsgaSA8IGJsb2NrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJsb2NrW2ldIF49IGRiTWFza1tpIC0gaGFzaExlbmd0aF07XG4gICAgfVxuICAgIC8vIHNhbWUgYXMgaW52b2tpbmcgc2hhMjU2IGRpcmVjdGx5IGJlY2F1c2Ugb25seSBvbmUgYmxvY2sgaXMgaGFzaGVkXG4gICAgbGV0IHNlZWRNYXNrID0gbWdmMShibG9jay5zbGljZShoYXNoTGVuZ3RoLCBibG9jay5sZW5ndGgpLCBoYXNoTGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNlZWRNYXNrLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGJsb2NrW2ldID0gc2VlZFtpXSBeIHNlZWRNYXNrW2ldO1xuICAgIH1cbiAgICByZXR1cm4gYmxvY2s7XG59XG4vKipcbiAqIEBwYXJhbSB2YWx1ZSBUaGUgYnl0ZSBhcnJheSB0byB1bnBhZC5cbiAqIEBwYXJhbSBrZXlMZW5ndGggVGhlIGxlbmd0aCBvZiB0aGUgUlNBIGtleSBpbiBiaXQuXG4gKiBAcmV0dXJuIFRoZSB1bnBhZGRlZCBieXRlIGFycmF5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gb2FlcFVucGFkKHZhbHVlLCBrZXlMZW5ndGgpIHtcbiAgICBsZXQgaGFzaExlbmd0aCA9IDMyOyAvLyBieXRlcyBzaGEyNTZcbiAgICBpZiAodmFsdWUubGVuZ3RoICE9PSBrZXlMZW5ndGggLyA4IC0gMSkge1xuICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJpbnZhbGlkIHZhbHVlIGxlbmd0aDogXCIgKyB2YWx1ZS5sZW5ndGggKyBcIi4gZXhwZWN0ZWQ6IFwiICsgKGtleUxlbmd0aCAvIDggLSAxKSArIFwiIGJ5dGVzIVwiKTtcbiAgICB9XG4gICAgbGV0IHNlZWRNYXNrID0gbWdmMSh2YWx1ZS5zbGljZShoYXNoTGVuZ3RoLCB2YWx1ZS5sZW5ndGgpLCBoYXNoTGVuZ3RoKTtcbiAgICBsZXQgc2VlZCA9IG5ldyBVaW50OEFycmF5KGhhc2hMZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2VlZE1hc2subGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc2VlZFtpXSA9IHZhbHVlW2ldIF4gc2VlZE1hc2tbaV07XG4gICAgfVxuICAgIGxldCBkYk1hc2sgPSBtZ2YxKHNlZWQsIHZhbHVlLmxlbmd0aCAtIGhhc2hMZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSBoYXNoTGVuZ3RoOyBpIDwgdmFsdWUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFsdWVbaV0gXj0gZGJNYXNrW2kgLSBoYXNoTGVuZ3RoXTtcbiAgICB9XG4gICAgLy8gY2hlY2sgdGhhdCB0aGUgemVyb3MgYW5kIHRoZSBvbmUgaXMgdGhlcmVcbiAgICBsZXQgaW5kZXg7XG4gICAgZm9yIChpbmRleCA9IDIgKiBoYXNoTGVuZ3RoOyBpbmRleCA8IHZhbHVlLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICBpZiAodmFsdWVbaW5kZXhdID09PSAxKSB7XG4gICAgICAgICAgICAvLyBmb3VuZCB0aGUgMHgwMVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodmFsdWVbaW5kZXhdICE9PSAwIHx8IGluZGV4ID09PSB2YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBDcnlwdG9FcnJvcihcImludmFsaWQgcGFkZGluZ1wiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWUuc2xpY2UoaW5kZXggKyAxLCB2YWx1ZS5sZW5ndGgpO1xufVxuLyoqXG4gKiBQcm92aWRlcyBhIGJsb2NrIG9mIGtleUxlbmd0aCAvIDggLSAxIGJ5dGVzIHdpdGggdGhlIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiBbIHplcm9zIF0gWyBsYWJlbCBoYXNoIF0gWyB6ZXJvcyBdIFsgMSBdIFsgdmFsdWUgXVxuICogICAgMzIgICAgICAgICAgIDMyICAgIGtleUxlbi0yKjMyLTIgIDEgIHZhbHVlLmxlbmd0aFxuICogVGhlIGxhYmVsIGlzIHRoZSBoYXNoIG9mIGFuIGVtcHR5IHN0cmluZyBsaWtlIGRlZmluZWQgaW4gUEtDUyMxIHYyLjFcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9nZXRQU0Jsb2NrKHZhbHVlLCBrZXlMZW5ndGgpIHtcbiAgICBsZXQgaGFzaExlbmd0aCA9IDMyOyAvLyBieXRlcyBzaGEyNTZcbiAgICBsZXQgYmxvY2tMZW5ndGggPSBrZXlMZW5ndGggLyA4IC0gMTsgLy8gdGhlIGxlYWRpbmcgYnl0ZSBzaGFsbCBiZSAwIHRvIG1ha2UgdGhlIHJlc3VsdGluZyB2YWx1ZSBpbiBhbnkgY2FzZSBzbWFsbGVyIHRoYW4gdGhlIG1vZHVsdXMsIHNvIHdlIGp1c3QgbGVhdmUgdGhlIGJ5dGUgb2ZmXG4gICAgbGV0IGJsb2NrID0gbmV3IFVpbnQ4QXJyYXkoYmxvY2tMZW5ndGgpO1xuICAgIGxldCBkZWZIYXNoID0gc2hhMjU2SGFzaChuZXcgVWludDhBcnJheShbXSkpOyAvLyBlbXB0eSBsYWJlbFxuICAgIGxldCBuYnJPZlplcm9zID0gYmxvY2subGVuZ3RoIC0gKDEgKyB2YWx1ZS5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2subGVuZ3RoOyBpKyspIHtcbiAgICAgICAgaWYgKGkgPj0gaGFzaExlbmd0aCAmJiBpIDwgMiAqIGhhc2hMZW5ndGgpIHtcbiAgICAgICAgICAgIGJsb2NrW2ldID0gZGVmSGFzaFtpIC0gaGFzaExlbmd0aF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoaSA8IG5ick9mWmVyb3MpIHtcbiAgICAgICAgICAgIGJsb2NrW2ldID0gMDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpID09PSBuYnJPZlplcm9zKSB7XG4gICAgICAgICAgICBibG9ja1tpXSA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBibG9ja1tpXSA9IHZhbHVlW2kgLSBuYnJPZlplcm9zIC0gMV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGJsb2NrO1xufVxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiBQU1MgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyoqXG4gKiBAcGFyYW0gbWVzc2FnZSBUaGUgYnl0ZSBhcnJheSB0byBlbmNvZGUuXG4gKiBAcGFyYW0ga2V5TGVuZ3RoIFRoZSBsZW5ndGggb2YgdGhlIFJTQSBrZXkgaW4gYml0LlxuICogQHBhcmFtIHNhbHQgQW4gYXJyYXkgb2YgcmFuZG9tIGJ5dGVzLlxuICogQHJldHVybiBUaGUgcGFkZGVkIGJ5dGUgYXJyYXkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmNvZGUobWVzc2FnZSwga2V5TGVuZ3RoLCBzYWx0KSB7XG4gICAgbGV0IGhhc2hMZW5ndGggPSAzMjsgLy8gYnl0ZXMgc2hhMjU2XG4gICAgbGV0IGVtTGVuID0gTWF0aC5jZWlsKGtleUxlbmd0aCAvIDgpO1xuICAgIGlmIChzYWx0Lmxlbmd0aCAhPT0gaGFzaExlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIF9zYWx0IGxlbmd0aDogXCIgKyBzYWx0Lmxlbmd0aCArIFwiLiBleHBlY3RlZDogXCIgKyBoYXNoTGVuZ3RoICsgXCIgYnl0ZXMhXCIpO1xuICAgIH1cbiAgICBsZXQgbGVuZ3RoID0gaGFzaExlbmd0aCArIHNhbHQubGVuZ3RoICsgMjtcbiAgICBpZiAoZW1MZW4gPCBsZW5ndGgpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBoYXNoL19zYWx0IGxlbmd0aDogXCIgKyBsZW5ndGggKyBcIi4gZXhwZWN0ZWQ6IG1heC4gXCIgKyBlbUxlbik7XG4gICAgfVxuICAgIGxldCBlbUJpdHMgPSBrZXlMZW5ndGggLSAxO1xuICAgIGxldCBtaW5FbUJpdHNMZW5ndGggPSA4ICogaGFzaExlbmd0aCArIDggKiBzYWx0Lmxlbmd0aCArIDk7XG4gICAgaWYgKGVtQml0cyA8IG1pbkVtQml0c0xlbmd0aCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIG1heGltdW0gZW1CaXRzIGxlbmd0aC4gV2FzIFwiICsgZW1CaXRzICsgXCIsIGV4cGVjdGVkOiBcIiArIG1pbkVtQml0c0xlbmd0aCk7XG4gICAgfVxuICAgIGxldCBtZXNzYWdlSGFzaCA9IHNoYTI1Nkhhc2gobWVzc2FnZSk7XG4gICAgLy8gIE0nID0gKDB4KTAwIDAwIDAwIDAwIDAwIDAwIDAwIDAwIHx8IG1IYXNoIHx8IF9zYWx0XG4gICAgbGV0IG1lc3NhZ2UyID0gY29uY2F0KG5ldyBVaW50OEFycmF5KFswLCAwLCAwLCAwLCAwLCAwLCAwLCAwXSksIG1lc3NhZ2VIYXNoLCBzYWx0KTtcbiAgICBsZXQgbWVzc2FnZTJIYXNoID0gc2hhMjU2SGFzaChtZXNzYWdlMik7XG4gICAgbGV0IHBzID0gbmV3IFVpbnQ4QXJyYXkoZW1MZW4gLSBzYWx0Lmxlbmd0aCAtIGhhc2hMZW5ndGggLSAyKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHBzW2ldID0gMDtcbiAgICB9XG4gICAgbGV0IGRiID0gY29uY2F0KHBzLCBuZXcgVWludDhBcnJheShbMV0pLCBzYWx0KTtcbiAgICBfY2xlYXIocHMpO1xuICAgIGxldCBleHBlY3RlZERiTGVuZ3RoID0gZW1MZW4gLSBoYXNoTGVuZ3RoIC0gMTtcbiAgICBpZiAoZGIubGVuZ3RoICE9PSBleHBlY3RlZERiTGVuZ3RoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuZXhwZWN0ZWQgbGVuZ3RoIG9mIGJsb2NrOiBcIiArIGRiLmxlbmd0aCArIFwiLiBFeHBlY3RlZDogXCIgKyBleHBlY3RlZERiTGVuZ3RoKTtcbiAgICB9XG4gICAgbGV0IGRiTWFzayA9IG1nZjEobWVzc2FnZTJIYXNoLCBlbUxlbiAtIG1lc3NhZ2UySGFzaC5sZW5ndGggLSAxKTtcbiAgICBsZXQgbWFza2VkRGIgPSBuZXcgVWludDhBcnJheShkYk1hc2subGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRiTWFzay5sZW5ndGg7IGkrKykge1xuICAgICAgICBtYXNrZWREYltpXSA9IGRiW2ldIF4gZGJNYXNrW2ldO1xuICAgIH1cbiAgICBfY2xlYXIoZGIpO1xuICAgIG1hc2tlZERiWzBdICY9IDB4ZmYgPj4gKDggKiBlbUxlbiAtIGVtQml0cyk7XG4gICAgbGV0IGVtID0gY29uY2F0KG1hc2tlZERiLCBtZXNzYWdlMkhhc2gsIG5ldyBVaW50OEFycmF5KFsxODhdKSk7IC8vIDB4YmNcbiAgICBfY2xlYXIobWFza2VkRGIpO1xuICAgIHJldHVybiBlbTtcbn1cbi8qKlxuICogY2xlYXJzIGFuIGFycmF5IHRvIGNvbnRhaW4gb25seSB6ZXJvcyAoMClcbiAqL1xuZnVuY3Rpb24gX2NsZWFyKGFycmF5KSB7XG4gICAgaWYgKCFhcnJheSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGFycmF5LmZpbGwoMCk7XG59XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIFJTQSB1dGlscyAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKipcbiAqIEBwYXJhbSBzZWVkIEFuIGFycmF5IG9mIGJ5dGUgdmFsdWVzLlxuICogQHBhcmFtIGxlbmd0aCBUaGUgbGVuZ3RoIG9mIHRoZSByZXR1cm4gdmFsdWUgaW4gYnl0ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZ2YxKHNlZWQsIGxlbmd0aCkge1xuICAgIGxldCBDID0gbnVsbDtcbiAgICBsZXQgY291bnRlciA9IDA7XG4gICAgbGV0IFQgPSBuZXcgVWludDhBcnJheSgwKTtcbiAgICBkbyB7XG4gICAgICAgIEMgPSBpMm9zcChjb3VudGVyKTtcbiAgICAgICAgVCA9IGNvbmNhdChULCBzaGEyNTZIYXNoKGNvbmNhdChzZWVkLCBDKSkpO1xuICAgIH0gd2hpbGUgKCsrY291bnRlciA8IE1hdGguY2VpbChsZW5ndGggLyAoMjU2IC8gOCkpKTtcbiAgICByZXR1cm4gVC5zbGljZSgwLCBsZW5ndGgpO1xufVxuLyoqXG4gKiBjb252ZXJ0cyBhbiBpbnRlZ2VyIHRvIGEgNCBieXRlIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpMm9zcChpKSB7XG4gICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KFsoaSA+PiAyNCkgJiAyNTUsIChpID4+IDE2KSAmIDI1NSwgKGkgPj4gOCkgJiAyNTUsIChpID4+IDApICYgMjU1XSk7XG59XG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqIEtleSBjb252ZXJzaW9uICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cbi8qKlxuICogQHBhcmFtIHB1YmxpY0tleVxuICogQHJldHVybnMgVGhlIHB1YmxpYyBrZXkgaW4gYSBwZXJzaXN0YWJsZSBhcnJheSBmb3JtYXRcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9wdWJsaWNLZXlUb0FycmF5KHB1YmxpY0tleSkge1xuICAgIHJldHVybiBbX2Jhc2U2NFRvQmlnSW50KHB1YmxpY0tleS5tb2R1bHVzKV07XG59XG4vKipcbiAqIEBwYXJhbSBwcml2YXRlS2V5XG4gKiBAcmV0dXJucyBUaGUgcHJpdmF0ZSBrZXkgaW4gYSBwZXJzaXN0YWJsZSBhcnJheSBmb3JtYXRcbiAqIEBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIF9wcml2YXRlS2V5VG9BcnJheShwcml2YXRlS2V5KSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICAgX2Jhc2U2NFRvQmlnSW50KHByaXZhdGVLZXkubW9kdWx1cyksXG4gICAgICAgIF9iYXNlNjRUb0JpZ0ludChwcml2YXRlS2V5LnByaXZhdGVFeHBvbmVudCksXG4gICAgICAgIF9iYXNlNjRUb0JpZ0ludChwcml2YXRlS2V5LnByaW1lUCksXG4gICAgICAgIF9iYXNlNjRUb0JpZ0ludChwcml2YXRlS2V5LnByaW1lUSksXG4gICAgICAgIF9iYXNlNjRUb0JpZ0ludChwcml2YXRlS2V5LnByaW1lRXhwb25lbnRQKSxcbiAgICAgICAgX2Jhc2U2NFRvQmlnSW50KHByaXZhdGVLZXkucHJpbWVFeHBvbmVudFEpLFxuICAgICAgICBfYmFzZTY0VG9CaWdJbnQocHJpdmF0ZUtleS5jcnRDb2VmZmljaWVudCksXG4gICAgXTtcbn1cbmZ1bmN0aW9uIF9hcnJheVRvUHVibGljS2V5KHB1YmxpY0tleSkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGtleVBhaXJUeXBlOiBLZXlQYWlyVHlwZS5SU0EsXG4gICAgICAgIHZlcnNpb246IDAsXG4gICAgICAgIGtleUxlbmd0aDogUlNBX0tFWV9MRU5HVEhfQklUUyxcbiAgICAgICAgbW9kdWx1czogaW50OEFycmF5VG9CYXNlNjQobmV3IEludDhBcnJheShwdWJsaWNLZXlbMF0udG9CeXRlQXJyYXkoKSkpLFxuICAgICAgICBwdWJsaWNFeHBvbmVudDogUlNBX1BVQkxJQ19FWFBPTkVOVCxcbiAgICB9O1xufVxuZnVuY3Rpb24gX2FycmF5VG9Qcml2YXRlS2V5KHByaXZhdGVLZXkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICB2ZXJzaW9uOiAwLFxuICAgICAgICBrZXlMZW5ndGg6IFJTQV9LRVlfTEVOR1RIX0JJVFMsXG4gICAgICAgIG1vZHVsdXM6IGludDhBcnJheVRvQmFzZTY0KG5ldyBJbnQ4QXJyYXkocHJpdmF0ZUtleVswXS50b0J5dGVBcnJheSgpKSksXG4gICAgICAgIHByaXZhdGVFeHBvbmVudDogaW50OEFycmF5VG9CYXNlNjQobmV3IEludDhBcnJheShwcml2YXRlS2V5WzFdLnRvQnl0ZUFycmF5KCkpKSxcbiAgICAgICAgcHJpbWVQOiBpbnQ4QXJyYXlUb0Jhc2U2NChuZXcgSW50OEFycmF5KHByaXZhdGVLZXlbMl0udG9CeXRlQXJyYXkoKSkpLFxuICAgICAgICBwcmltZVE6IGludDhBcnJheVRvQmFzZTY0KG5ldyBJbnQ4QXJyYXkocHJpdmF0ZUtleVszXS50b0J5dGVBcnJheSgpKSksXG4gICAgICAgIHByaW1lRXhwb25lbnRQOiBpbnQ4QXJyYXlUb0Jhc2U2NChuZXcgSW50OEFycmF5KHByaXZhdGVLZXlbNF0udG9CeXRlQXJyYXkoKSkpLFxuICAgICAgICBwcmltZUV4cG9uZW50UTogaW50OEFycmF5VG9CYXNlNjQobmV3IEludDhBcnJheShwcml2YXRlS2V5WzVdLnRvQnl0ZUFycmF5KCkpKSxcbiAgICAgICAgY3J0Q29lZmZpY2llbnQ6IGludDhBcnJheVRvQmFzZTY0KG5ldyBJbnQ4QXJyYXkocHJpdmF0ZUtleVs2XS50b0J5dGVBcnJheSgpKSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIF9iYXNlNjRUb0JpZ0ludChiYXNlNjQpIHtcbiAgICByZXR1cm4gcGFyc2VCaWdJbnQoYmFzZTY0VG9IZXgoYmFzZTY0KSwgMTYpO1xufVxuLyoqXG4gKiBQcm92aWRlcyB0aGUgbGVuZ3RoIG9mIHRoZSBnaXZlbiBzdHJpbmcgYXMgaGV4IHN0cmluZyBvZiA0IGNoYXJhY3RlcnMgbGVuZ3RoLiBQYWRkaW5nIHRvIDQgY2hhcmFjdGVycyBpcyBkb25lIHdpdGggJzAnLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBBIHN0cmluZyB0byBnZXQgdGhlIGxlbmd0aCBvZi5cbiAqIEByZXR1cm4ge3N0cmluZ30gQSBoZXggc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGxlbmd0aCBvZiBzdHJpbmcuXG4gKi9cbmZ1bmN0aW9uIF9oZXhMZW4oc3RyaW5nKSB7XG4gICAgbGV0IGhleExlbiA9IHN0cmluZy5sZW5ndGgudG9TdHJpbmcoMTYpO1xuICAgIHdoaWxlIChoZXhMZW4ubGVuZ3RoIDwgNCkge1xuICAgICAgICBoZXhMZW4gPSBcIjBcIiArIGhleExlbjtcbiAgICB9XG4gICAgcmV0dXJuIGhleExlbjtcbn1cbmV4cG9ydCBmdW5jdGlvbiBfa2V5QXJyYXlUb0hleChrZXkpIHtcbiAgICBsZXQgaGV4ID0gXCJcIjtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGtleS5sZW5ndGg7IGkrKykge1xuICAgICAgICBsZXQgcGFyYW0gPSBrZXlbaV0udG9TdHJpbmcoMTYpO1xuICAgICAgICBpZiAocGFyYW0ubGVuZ3RoICUgMiA9PT0gMSkge1xuICAgICAgICAgICAgcGFyYW0gPSBcIjBcIiArIHBhcmFtO1xuICAgICAgICB9XG4gICAgICAgIGhleCArPSBfaGV4TGVuKHBhcmFtKSArIHBhcmFtO1xuICAgIH1cbiAgICByZXR1cm4gaGV4O1xufVxuZnVuY3Rpb24gX2hleFRvS2V5QXJyYXkoaGV4KSB7XG4gICAgdHJ5IHtcbiAgICAgICAgbGV0IGtleSA9IFtdO1xuICAgICAgICBsZXQgcG9zID0gMDtcbiAgICAgICAgd2hpbGUgKHBvcyA8IGhleC5sZW5ndGgpIHtcbiAgICAgICAgICAgIGxldCBuZXh0UGFyYW1MZW4gPSBwYXJzZUludChoZXguc3Vic3RyaW5nKHBvcywgcG9zICsgNCksIDE2KTtcbiAgICAgICAgICAgIHBvcyArPSA0O1xuICAgICAgICAgICAga2V5LnB1c2gocGFyc2VCaWdJbnQoaGV4LnN1YnN0cmluZyhwb3MsIHBvcyArIG5leHRQYXJhbUxlbiksIDE2KSk7XG4gICAgICAgICAgICBwb3MgKz0gbmV4dFBhcmFtTGVuO1xuICAgICAgICB9XG4gICAgICAgIF92YWxpZGF0ZUtleUxlbmd0aChrZXkpO1xuICAgICAgICByZXR1cm4ga2V5O1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICB0aHJvdyBuZXcgQ3J5cHRvRXJyb3IoXCJoZXggdG8gcnNhIGtleSBmYWlsZWRcIiwgZSk7XG4gICAgfVxufVxuZnVuY3Rpb24gX3ZhbGlkYXRlS2V5TGVuZ3RoKGtleSkge1xuICAgIGlmIChrZXkubGVuZ3RoICE9PSAxICYmIGtleS5sZW5ndGggIT09IDcpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiaW52YWxpZCBrZXkgcGFyYW1zXCIpO1xuICAgIH1cbiAgICBpZiAoa2V5WzBdLmJpdExlbmd0aCgpIDwgUlNBX0tFWV9MRU5HVEhfQklUUyAtIDEgfHwga2V5WzBdLmJpdExlbmd0aCgpID4gUlNBX0tFWV9MRU5HVEhfQklUUykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJpbnZhbGlkIGtleSBsZW5ndGgsIGV4cGVjdGVkOiBhcm91bmQgXCIgKyBSU0FfS0VZX0xFTkdUSF9CSVRTICsgXCIsIGJ1dCB3YXM6IFwiICsga2V5WzBdLmJpdExlbmd0aCgpKTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gcnNhUHJpdmF0ZUtleVRvSGV4KHByaXZhdGVLZXkpIHtcbiAgICByZXR1cm4gX2tleUFycmF5VG9IZXgoX3ByaXZhdGVLZXlUb0FycmF5KHByaXZhdGVLZXkpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByc2FQdWJsaWNLZXlUb0hleChwdWJsaWNLZXkpIHtcbiAgICByZXR1cm4gX2tleUFycmF5VG9IZXgoX3B1YmxpY0tleVRvQXJyYXkocHVibGljS2V5KSk7XG59XG5leHBvcnQgZnVuY3Rpb24gaGV4VG9Sc2FQcml2YXRlS2V5KHByaXZhdGVLZXlIZXgpIHtcbiAgICByZXR1cm4gX2FycmF5VG9Qcml2YXRlS2V5KF9oZXhUb0tleUFycmF5KHByaXZhdGVLZXlIZXgpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBoZXhUb1JzYVB1YmxpY0tleShwdWJsaWNLZXlIZXgpIHtcbiAgICByZXR1cm4gX2FycmF5VG9QdWJsaWNLZXkoX2hleFRvS2V5QXJyYXkocHVibGljS2V5SGV4KSk7XG59XG4iLCJpbXBvcnQgeyBhZXNEZWNyeXB0LCBhZXNFbmNyeXB0LCBnZXRLZXlMZW5ndGhCeXRlcywgS0VZX0xFTkdUSF9CWVRFU19BRVNfMTI4LCBLRVlfTEVOR1RIX0JZVEVTX0FFU18yNTYsIHVuYXV0aGVudGljYXRlZEFlc0RlY3J5cHQgfSBmcm9tIFwiLi9BZXMuanNcIjtcbmltcG9ydCB7IGJpdEFycmF5VG9VaW50OEFycmF5LCBmaXhlZEl2LCB1aW50OEFycmF5VG9CaXRBcnJheSB9IGZyb20gXCIuLi9taXNjL1V0aWxzLmpzXCI7XG5pbXBvcnQgeyBhc3NlcnROb3ROdWxsLCBjb25jYXQsIGhleFRvVWludDhBcnJheSwgdWludDhBcnJheVRvSGV4IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiO1xuaW1wb3J0IHsgaGV4VG9Sc2FQcml2YXRlS2V5LCBoZXhUb1JzYVB1YmxpY0tleSwgcnNhUHJpdmF0ZUtleVRvSGV4IH0gZnJvbSBcIi4vUnNhLmpzXCI7XG5pbXBvcnQgeyBieXRlc1RvS3liZXJQcml2YXRlS2V5LCBieXRlc1RvS3liZXJQdWJsaWNLZXksIGt5YmVyUHJpdmF0ZUtleVRvQnl0ZXMgfSBmcm9tIFwiLi9MaWJvcXMvS3liZXJLZXlQYWlyLmpzXCI7XG5pbXBvcnQgeyBLZXlQYWlyVHlwZSB9IGZyb20gXCIuL0FzeW1tZXRyaWNLZXlQYWlyLmpzXCI7XG5leHBvcnQgZnVuY3Rpb24gZW5jcnlwdEtleShlbmNyeXB0aW9uS2V5LCBrZXlUb0JlRW5jcnlwdGVkKSB7XG4gICAgY29uc3Qga2V5TGVuZ3RoID0gZ2V0S2V5TGVuZ3RoQnl0ZXMoZW5jcnlwdGlvbktleSk7XG4gICAgaWYgKGtleUxlbmd0aCA9PT0gS0VZX0xFTkdUSF9CWVRFU19BRVNfMTI4KSB7XG4gICAgICAgIHJldHVybiBhZXNFbmNyeXB0KGVuY3J5cHRpb25LZXksIGJpdEFycmF5VG9VaW50OEFycmF5KGtleVRvQmVFbmNyeXB0ZWQpLCBmaXhlZEl2LCBmYWxzZSwgZmFsc2UpLnNsaWNlKGZpeGVkSXYubGVuZ3RoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAoa2V5TGVuZ3RoID09PSBLRVlfTEVOR1RIX0JZVEVTX0FFU18yNTYpIHtcbiAgICAgICAgcmV0dXJuIGFlc0VuY3J5cHQoZW5jcnlwdGlvbktleSwgYml0QXJyYXlUb1VpbnQ4QXJyYXkoa2V5VG9CZUVuY3J5cHRlZCksIHVuZGVmaW5lZCwgZmFsc2UsIHRydWUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIEFFUyBrZXkgbGVuZ3RoIChtdXN0IGJlIDEyOC1iaXQgb3IgMjU2LWJpdCwgZ290ICR7a2V5TGVuZ3RofSBieXRlcyBpbnN0ZWFkKWApO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWNyeXB0S2V5KGVuY3J5cHRpb25LZXksIGtleVRvQmVEZWNyeXB0ZWQpIHtcbiAgICBjb25zdCBrZXlMZW5ndGggPSBnZXRLZXlMZW5ndGhCeXRlcyhlbmNyeXB0aW9uS2V5KTtcbiAgICBpZiAoa2V5TGVuZ3RoID09PSBLRVlfTEVOR1RIX0JZVEVTX0FFU18xMjgpIHtcbiAgICAgICAgcmV0dXJuIHVpbnQ4QXJyYXlUb0JpdEFycmF5KGFlc0RlY3J5cHQoZW5jcnlwdGlvbktleSwgY29uY2F0KGZpeGVkSXYsIGtleVRvQmVEZWNyeXB0ZWQpLCBmYWxzZSkpO1xuICAgIH1cbiAgICBlbHNlIGlmIChrZXlMZW5ndGggPT09IEtFWV9MRU5HVEhfQllURVNfQUVTXzI1Nikge1xuICAgICAgICByZXR1cm4gdWludDhBcnJheVRvQml0QXJyYXkoYWVzRGVjcnlwdChlbmNyeXB0aW9uS2V5LCBrZXlUb0JlRGVjcnlwdGVkLCBmYWxzZSkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIEFFUyBrZXkgbGVuZ3RoIChtdXN0IGJlIDEyOC1iaXQgb3IgMjU2LWJpdCwgZ290ICR7a2V5TGVuZ3RofSBieXRlcyBpbnN0ZWFkKWApO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBhZXMyNTZEZWNyeXB0V2l0aFJlY292ZXJ5S2V5KGVuY3J5cHRpb25LZXksIGtleVRvQmVEZWNyeXB0ZWQpIHtcbiAgICAvLyBsZWdhY3kgY2FzZTogcmVjb3ZlcnkgY29kZSB3aXRob3V0IElWL21hY1xuICAgIGlmIChrZXlUb0JlRGVjcnlwdGVkLmxlbmd0aCA9PT0gS0VZX0xFTkdUSF9CWVRFU19BRVNfMTI4KSB7XG4gICAgICAgIHJldHVybiB1aW50OEFycmF5VG9CaXRBcnJheSh1bmF1dGhlbnRpY2F0ZWRBZXNEZWNyeXB0KGVuY3J5cHRpb25LZXksIGNvbmNhdChmaXhlZEl2LCBrZXlUb0JlRGVjcnlwdGVkKSwgZmFsc2UpKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJldHVybiBkZWNyeXB0S2V5KGVuY3J5cHRpb25LZXksIGtleVRvQmVEZWNyeXB0ZWQpO1xuICAgIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBlbmNyeXB0UnNhS2V5KGVuY3J5cHRpb25LZXksIHByaXZhdGVLZXksIGl2KSB7XG4gICAgcmV0dXJuIGFlc0VuY3J5cHQoZW5jcnlwdGlvbktleSwgaGV4VG9VaW50OEFycmF5KHJzYVByaXZhdGVLZXlUb0hleChwcml2YXRlS2V5KSksIGl2LCB0cnVlLCB0cnVlKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBlbmNyeXB0RWNjS2V5KGVuY3J5cHRpb25LZXksIHByaXZhdGVLZXkpIHtcbiAgICByZXR1cm4gYWVzRW5jcnlwdChlbmNyeXB0aW9uS2V5LCBwcml2YXRlS2V5LCB1bmRlZmluZWQsIHRydWUsIHRydWUpOyAvLyBwYXNzaW5nIElWIGFzIHVuZGVmaW5lZCBoZXJlIGlzIGZpbmUsIGFzIGl0IHdpbGwgZ2VuZXJhdGUgYSBuZXcgb25lIGZvciBlYWNoIGVuY3J5cHRpb25cbn1cbmV4cG9ydCBmdW5jdGlvbiBlbmNyeXB0S3liZXJLZXkoZW5jcnlwdGlvbktleSwgcHJpdmF0ZUtleSkge1xuICAgIHJldHVybiBhZXNFbmNyeXB0KGVuY3J5cHRpb25LZXksIGt5YmVyUHJpdmF0ZUtleVRvQnl0ZXMocHJpdmF0ZUtleSkpOyAvLyBwYXNzaW5nIElWIGFzIHVuZGVmaW5lZCBoZXJlIGlzIGZpbmUsIGFzIGl0IHdpbGwgZ2VuZXJhdGUgYSBuZXcgb25lIGZvciBlYWNoIGVuY3J5cHRpb25cbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWNyeXB0UnNhS2V5KGVuY3J5cHRpb25LZXksIGVuY3J5cHRlZFByaXZhdGVLZXkpIHtcbiAgICByZXR1cm4gaGV4VG9Sc2FQcml2YXRlS2V5KHVpbnQ4QXJyYXlUb0hleChhZXNEZWNyeXB0KGVuY3J5cHRpb25LZXksIGVuY3J5cHRlZFByaXZhdGVLZXksIHRydWUpKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZGVjcnlwdEtleVBhaXIoZW5jcnlwdGlvbktleSwga2V5UGFpcikge1xuICAgIGlmIChrZXlQYWlyLnN5bUVuY1ByaXZSc2FLZXkpIHtcbiAgICAgICAgcmV0dXJuIGRlY3J5cHRSc2FPclJzYUVjY0tleVBhaXIoZW5jcnlwdGlvbktleSwga2V5UGFpcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gZGVjcnlwdFBRS2V5UGFpcihlbmNyeXB0aW9uS2V5LCBrZXlQYWlyKTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZWNyeXB0UnNhT3JSc2FFY2NLZXlQYWlyKGVuY3J5cHRpb25LZXksIGtleVBhaXIpIHtcbiAgICBjb25zdCBwdWJsaWNLZXkgPSBoZXhUb1JzYVB1YmxpY0tleSh1aW50OEFycmF5VG9IZXgoYXNzZXJ0Tm90TnVsbChrZXlQYWlyLnB1YlJzYUtleSkpKTtcbiAgICBjb25zdCBwcml2YXRlS2V5ID0gaGV4VG9Sc2FQcml2YXRlS2V5KHVpbnQ4QXJyYXlUb0hleChhZXNEZWNyeXB0KGVuY3J5cHRpb25LZXksIGtleVBhaXIuc3ltRW5jUHJpdlJzYUtleSwgdHJ1ZSkpKTtcbiAgICBpZiAoa2V5UGFpci5zeW1FbmNQcml2RWNjS2V5KSB7XG4gICAgICAgIGNvbnN0IHB1YmxpY0VjY0tleSA9IGFzc2VydE5vdE51bGwoa2V5UGFpci5wdWJFY2NLZXkpO1xuICAgICAgICBjb25zdCBwcml2YXRlRWNjS2V5ID0gYWVzRGVjcnlwdChlbmNyeXB0aW9uS2V5LCBhc3NlcnROb3ROdWxsKGtleVBhaXIuc3ltRW5jUHJpdkVjY0tleSkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2V5UGFpclR5cGU6IEtleVBhaXJUeXBlLlJTQV9BTkRfRUNDLFxuICAgICAgICAgICAgcHVibGljS2V5LFxuICAgICAgICAgICAgcHJpdmF0ZUtleSxcbiAgICAgICAgICAgIHB1YmxpY0VjY0tleSxcbiAgICAgICAgICAgIHByaXZhdGVFY2NLZXksXG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4geyBrZXlQYWlyVHlwZTogS2V5UGFpclR5cGUuUlNBLCBwdWJsaWNLZXksIHByaXZhdGVLZXkgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBkZWNyeXB0UFFLZXlQYWlyKGVuY3J5cHRpb25LZXksIGtleVBhaXIpIHtcbiAgICBjb25zdCBlY2NQdWJsaWNLZXkgPSBhc3NlcnROb3ROdWxsKGtleVBhaXIucHViRWNjS2V5LCBcImV4cGVjdGVkIHB1YiBlY2Mga2V5IGZvciBQUSBrZXlwYWlyXCIpO1xuICAgIGNvbnN0IGVjY1ByaXZhdGVLZXkgPSBhZXNEZWNyeXB0KGVuY3J5cHRpb25LZXksIGFzc2VydE5vdE51bGwoa2V5UGFpci5zeW1FbmNQcml2RWNjS2V5LCBcImV4cGVjdGVkIHByaXYgZWNjIGtleSBmb3IgUFEga2V5cGFpclwiKSk7XG4gICAgY29uc3Qga3liZXJQdWJsaWNLZXkgPSBieXRlc1RvS3liZXJQdWJsaWNLZXkoYXNzZXJ0Tm90TnVsbChrZXlQYWlyLnB1Ykt5YmVyS2V5LCBcImV4cGVjdGVkIHB1YiBreWJlciBrZXkgZm9yIFBRIGtleXBhaXJcIikpO1xuICAgIGNvbnN0IGt5YmVyUHJpdmF0ZUtleSA9IGJ5dGVzVG9LeWJlclByaXZhdGVLZXkoYWVzRGVjcnlwdChlbmNyeXB0aW9uS2V5LCBhc3NlcnROb3ROdWxsKGtleVBhaXIuc3ltRW5jUHJpdkt5YmVyS2V5LCBcImV4cGVjdGVkIGVuYyBwcml2IGt5YmVyIGtleSBmb3IgUFEga2V5cGFpclwiKSkpO1xuICAgIHJldHVybiB7XG4gICAgICAgIGtleVBhaXJUeXBlOiBLZXlQYWlyVHlwZS5UVVRBX0NSWVBULFxuICAgICAgICBlY2NLZXlQYWlyOiB7XG4gICAgICAgICAgICBwdWJsaWNLZXk6IGVjY1B1YmxpY0tleSxcbiAgICAgICAgICAgIHByaXZhdGVLZXk6IGVjY1ByaXZhdGVLZXksXG4gICAgICAgIH0sXG4gICAgICAgIGt5YmVyS2V5UGFpcjoge1xuICAgICAgICAgICAgcHVibGljS2V5OiBreWJlclB1YmxpY0tleSxcbiAgICAgICAgICAgIHByaXZhdGVLZXk6IGt5YmVyUHJpdmF0ZUtleSxcbiAgICAgICAgfSxcbiAgICB9O1xufVxuIiwiZXhwb3J0IGZ1bmN0aW9uIHBxS2V5UGFpcnNUb1B1YmxpY0tleXMoa2V5UGFpcnMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBrZXlQYWlyVHlwZToga2V5UGFpcnMua2V5UGFpclR5cGUsXG4gICAgICAgIGVjY1B1YmxpY0tleToga2V5UGFpcnMuZWNjS2V5UGFpci5wdWJsaWNLZXksXG4gICAgICAgIGt5YmVyUHVibGljS2V5OiBrZXlQYWlycy5reWJlcktleVBhaXIucHVibGljS2V5LFxuICAgIH07XG59XG4iLCIvLyBAdHMtaWdub3JlW3VudHlwZWQtaW1wb3J0XVxuaW1wb3J0IHNqY2wgZnJvbSBcIi4uL2ludGVybmFsL3NqY2wuanNcIjtcbmNvbnN0IHNoYTEgPSBuZXcgc2pjbC5oYXNoLnNoYTEoKTtcbi8qKlxuICogQ3JlYXRlIHRoZSBoYXNoIG9mIHRoZSBnaXZlbiBkYXRhLlxuICogQHBhcmFtIHVpbnQ4QXJyYXkgVGhlIGJ5dGVzLlxuICogQHJldHVybiBUaGUgaGFzaC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNoYTFIYXNoKHVpbnQ4QXJyYXkpIHtcbiAgICB0cnkge1xuICAgICAgICBzaGExLnVwZGF0ZShzamNsLmNvZGVjLmFycmF5QnVmZmVyLnRvQml0cyh1aW50OEFycmF5LmJ1ZmZlciwgdWludDhBcnJheS5ieXRlT2Zmc2V0LCB1aW50OEFycmF5LmJ5dGVMZW5ndGgpKTtcbiAgICAgICAgcmV0dXJuIG5ldyBVaW50OEFycmF5KHNqY2wuY29kZWMuYXJyYXlCdWZmZXIuZnJvbUJpdHMoc2hhMS5maW5hbGl6ZSgpLCBmYWxzZSkpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgc2hhMS5yZXNldCgpO1xuICAgIH1cbn1cbiIsIi8vIEB0cy1pZ25vcmVbdW50eXBlZC1pbXBvcnRdXG5pbXBvcnQgc2pjbCBmcm9tIFwiLi4vaW50ZXJuYWwvc2pjbC5qc1wiO1xuaW1wb3J0IHsgYml0QXJyYXlUb1VpbnQ4QXJyYXksIHVpbnQ4QXJyYXlUb0JpdEFycmF5IH0gZnJvbSBcIi4vVXRpbHMuanNcIjtcbmltcG9ydCB7IGhleFRvVWludDhBcnJheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIjtcbmltcG9ydCB7IHJhbmRvbSB9IGZyb20gXCIuLi9yYW5kb20vUmFuZG9taXplci5qc1wiO1xuZXhwb3J0IGxldCBESUdJVFMgPSA2O1xuY29uc3QgRElHSVRTX1BPV0VSID0gXG4vLyAwICAgMSAgIDIgICAgMyAgICA0ICAgICAgNSAgICAgICA2ICAgICAgICA3ICAgICAgICAgOFxuWzEsIDEwLCAxMDAsIDEwMDAsIDEwMDAwLCAxMDAwMDAsIDEwMDAwMDAsIDEwMDAwMDAwLCAxMDAwMDAwMDBdO1xuY29uc3QgYmFzZTMyID0gc2pjbC5jb2RlYy5iYXNlMzI7XG5leHBvcnQgY2xhc3MgVG90cFZlcmlmaWVyIHtcbiAgICBfZGlnaXRzO1xuICAgIGNvbnN0cnVjdG9yKGRpZ2l0cyA9IERJR0lUUykge1xuICAgICAgICB0aGlzLl9kaWdpdHMgPSBkaWdpdHM7XG4gICAgfVxuICAgIGdlbmVyYXRlU2VjcmV0KCkge1xuICAgICAgICBsZXQga2V5ID0gcmFuZG9tLmdlbmVyYXRlUmFuZG9tRGF0YSgxNik7XG4gICAgICAgIGxldCByZWFkYWJsZUtleSA9IFRvdHBWZXJpZmllci5yZWFkYWJsZUtleShrZXkpO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAga2V5LFxuICAgICAgICAgICAgcmVhZGFibGVLZXksXG4gICAgICAgIH07XG4gICAgfVxuICAgIC8qKlxuICAgICAqIFRoaXMgbWV0aG9kIGdlbmVyYXRlcyBhIFRPVFAgdmFsdWUgZm9yIHRoZSBnaXZlblxuICAgICAqIHNldCBvZiBwYXJhbWV0ZXJzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHRpbWUgOiBhIHZhbHVlIHRoYXQgcmVmbGVjdHMgYSB0aW1lXG4gICAgICogQHBhcmFtIGtleSAgOiAgdGhlIHNoYXJlZCBzZWNyZXQuIEl0IGlzIGdlbmVyYXRlZCBpZiBpdCBkb2VzIG5vdCBleGlzdFxuICAgICAqIEByZXR1cm46IHRoZSBrZXkgYW5kIGEgbnVtZXJpYyBTdHJpbmcgaW4gYmFzZSAxMCB0aGF0IGluY2x1ZGVzIHRydW5jYXRpb25EaWdpdHMgZGlnaXRzXG4gICAgICovXG4gICAgZ2VuZXJhdGVUb3RwKHRpbWUsIGtleSkge1xuICAgICAgICAvLyBVc2luZyB0aGUgY291bnRlclxuICAgICAgICAvLyBGaXJzdCA4IGJ5dGVzIGFyZSBmb3IgdGhlIG1vdmluZ0ZhY3RvclxuICAgICAgICAvLyBDb21wbGlhbnQgd2l0aCBiYXNlIFJGQyA0MjI2IChIT1RQKVxuICAgICAgICBsZXQgdGltZUhleCA9IHRpbWUudG9TdHJpbmcoMTYpO1xuICAgICAgICB3aGlsZSAodGltZUhleC5sZW5ndGggPCAxNilcbiAgICAgICAgICAgIHRpbWVIZXggPSBcIjBcIiArIHRpbWVIZXg7XG4gICAgICAgIGxldCBtc2cgPSBoZXhUb1VpbnQ4QXJyYXkodGltZUhleCk7XG4gICAgICAgIGxldCBoYXNoID0gdGhpcy5obWFjX3NoYShrZXksIG1zZyk7XG4gICAgICAgIGxldCBvZmZzZXQgPSBoYXNoW2hhc2gubGVuZ3RoIC0gMV0gJiAweGY7XG4gICAgICAgIGxldCBiaW5hcnkgPSAoKGhhc2hbb2Zmc2V0XSAmIDB4N2YpIDw8IDI0KSB8ICgoaGFzaFtvZmZzZXQgKyAxXSAmIDB4ZmYpIDw8IDE2KSB8ICgoaGFzaFtvZmZzZXQgKyAyXSAmIDB4ZmYpIDw8IDgpIHwgKGhhc2hbb2Zmc2V0ICsgM10gJiAweGZmKTtcbiAgICAgICAgbGV0IGNvZGUgPSBiaW5hcnkgJSBESUdJVFNfUE9XRVJbdGhpcy5fZGlnaXRzXTtcbiAgICAgICAgcmV0dXJuIGNvZGU7XG4gICAgfVxuICAgIGhtYWNfc2hhKGtleSwgdGV4dCkge1xuICAgICAgICBsZXQgaG1hYyA9IG5ldyBzamNsLm1pc2MuaG1hYyh1aW50OEFycmF5VG9CaXRBcnJheShrZXkpLCBzamNsLmhhc2guc2hhMSk7XG4gICAgICAgIHJldHVybiBiaXRBcnJheVRvVWludDhBcnJheShobWFjLmVuY3J5cHQodWludDhBcnJheVRvQml0QXJyYXkodGV4dCkpKTtcbiAgICB9XG4gICAgc3RhdGljIHJlYWRhYmxlS2V5KGtleSkge1xuICAgICAgICByZXR1cm4gYmFzZTMyXG4gICAgICAgICAgICAuZnJvbUJpdHModWludDhBcnJheVRvQml0QXJyYXkoa2V5KSlcbiAgICAgICAgICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgICAgICAgICAucmVwbGFjZSgvKC57NH0pL2csIFwiJDEgXCIpXG4gICAgICAgICAgICAucmVwbGFjZSgvPS9nLCBcIlwiKVxuICAgICAgICAgICAgLnRyaW0oKTtcbiAgICB9XG59XG4iLCIvKiFcbiAqICstLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tK1xuICogfCBtdXJtdXJIYXNoMy5qcyB2My4wLjAgKGh0dHA6Ly9naXRodWIuY29tL2thcmFubHlvbnMvbXVybXVySGFzaDMuanMpICAgICAgICAgICAgICB8XG4gKiB8IEEgVHlwZVNjcmlwdC9KYXZhU2NyaXB0IGltcGxlbWVudGF0aW9uIG9mIE11cm11ckhhc2gzJ3MgaGFzaGluZyBhbGdvcml0aG1zLiAgICAgIHxcbiAqIHwtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tfFxuICogfCBDb3B5cmlnaHQgKGMpIDIwMTItMjAyMCBLYXJhbiBMeW9ucy4gRnJlZWx5IGRpc3RyaWJ1dGFibGUgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLiB8XG4gKiArLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLStcbiAqXG4gKiB0dXRhbzogaGVhdmlseSBzdHJpcHBlZCBkb3duIHRvIG9ubHkgdGFrZSB4ODZoYXNoMzIsIHJlbW92ZWQgdHlwZXMgZm9yIG5vdy5cbiAqIFRoaXMgaW1wbGVtZW50YXRpb24gc2hvdWxkIGhhbmRsZSBub24tYXNjaWkgY2hhcmFjdGVycy5cbiAqL1xuaW1wb3J0IHsgc3RyaW5nVG9VdGY4VWludDhBcnJheSB9IGZyb20gXCJAdHV0YW8vdHV0YW5vdGEtdXRpbHNcIjtcbmZ1bmN0aW9uIHg4NmZtaXgzMihoKSB7XG4gICAgaCBePSBoID4+PiAxNjtcbiAgICBoID0gbXVsMzIoaCwgMHg4NWViY2E2Yik7XG4gICAgaCBePSBoID4+PiAxMztcbiAgICBoID0gbXVsMzIoaCwgMHhjMmIyYWUzNSk7XG4gICAgaCBePSBoID4+PiAxNjtcbiAgICByZXR1cm4gaDtcbn1cbmNvbnN0IHg4Nmhhc2gzMmMxID0gMHhjYzllMmQ1MTtcbmNvbnN0IHg4Nmhhc2gzMmMyID0gMHgxYjg3MzU5MztcbmZ1bmN0aW9uIHg4Nm1peDMyKGgsIGspIHtcbiAgICBrID0gbXVsMzIoaywgeDg2aGFzaDMyYzEpO1xuICAgIGsgPSByb2wzMihrLCAxNSk7XG4gICAgayA9IG11bDMyKGssIHg4Nmhhc2gzMmMyKTtcbiAgICBoIF49IGs7XG4gICAgaCA9IHJvbDMyKGgsIDEzKTtcbiAgICBoID0gbXVsMzIoaCwgNSkgKyAweGU2NTQ2YjY0O1xuICAgIHJldHVybiBoO1xufVxuZnVuY3Rpb24gbXVsMzIobSwgbikge1xuICAgIHJldHVybiAobSAmIDB4ZmZmZikgKiBuICsgKCgoKG0gPj4+IDE2KSAqIG4pICYgMHhmZmZmKSA8PCAxNik7XG59XG5mdW5jdGlvbiByb2wzMihuLCByKSB7XG4gICAgcmV0dXJuIChuIDw8IHIpIHwgKG4gPj4+ICgzMiAtIHIpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtdXJtdXJIYXNoKHZhbHVlKSB7XG4gICAgbGV0IHN0YXRlID0gMDtcbiAgICBjb25zdCBidWYgPSBzdHJpbmdUb1V0ZjhVaW50OEFycmF5KHZhbHVlKTtcbiAgICBsZXQgaDE7XG4gICAgbGV0IGk7XG4gICAgbGV0IGxlbjtcbiAgICBoMSA9IHN0YXRlO1xuICAgIGkgPSAwO1xuICAgIGxlbiA9IDA7XG4gICAgY29uc3QgZHR2ID0gbmV3IERhdGFWaWV3KGJ1Zi5idWZmZXIsIGJ1Zi5ieXRlT2Zmc2V0KTtcbiAgICBjb25zdCByZW1haW5kZXIgPSAoYnVmLmJ5dGVMZW5ndGggLSBpKSAlIDQ7XG4gICAgY29uc3QgYnl0ZXMgPSBidWYuYnl0ZUxlbmd0aCAtIGkgLSByZW1haW5kZXI7XG4gICAgbGVuICs9IGJ5dGVzO1xuICAgIGZvciAoOyBpIDwgYnl0ZXM7IGkgKz0gNCkge1xuICAgICAgICBoMSA9IHg4Nm1peDMyKGgxLCBkdHYuZ2V0VWludDMyKGksIHRydWUpKTtcbiAgICB9XG4gICAgbGVuICs9IHJlbWFpbmRlcjtcbiAgICBsZXQgazEgPSAweDA7XG4gICAgc3dpdGNoIChyZW1haW5kZXIpIHtcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgICAgazEgXj0gYnVmW2kgKyAyXSA8PCAxNjtcbiAgICAgICAgLy8gZmFsbHMgdGhyb3VnaFxuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBrMSBePSBidWZbaSArIDFdIDw8IDg7XG4gICAgICAgIC8vIGZhbGxzIHRocm91Z2hcbiAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgazEgXj0gYnVmW2ldO1xuICAgICAgICAgICAgazEgPSBtdWwzMihrMSwgeDg2aGFzaDMyYzEpO1xuICAgICAgICAgICAgazEgPSByb2wzMihrMSwgMTUpO1xuICAgICAgICAgICAgazEgPSBtdWwzMihrMSwgeDg2aGFzaDMyYzIpO1xuICAgICAgICAgICAgaDEgXj0gazE7XG4gICAgfVxuICAgIGgxIF49IGxlbiAmIDB4ZmZmZmZmZmY7XG4gICAgaDEgPSB4ODZmbWl4MzIoaDEpO1xuICAgIHJldHVybiBoMSA+Pj4gMDtcbn1cbiIsImltcG9ydCBzamNsIGZyb20gXCIuLi9pbnRlcm5hbC9zamNsLmpzXCI7XG5pbXBvcnQgeyBiaXRBcnJheVRvVWludDhBcnJheSwgdWludDhBcnJheVRvQml0QXJyYXkgfSBmcm9tIFwiLi4vbWlzYy9VdGlscy5qc1wiO1xuLyoqXG4gKiBEZXJpdmVzIGEga2V5IG9mIGEgZGVmaW5lZCBsZW5ndGggZnJvbSBzYWx0LCBpbnB1dEtleU1hdGVyaWFsIGFuZCBpbmZvLlxuICogQHJldHVybiB0aGUgZGVyaXZlZCBzYWx0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoa2RmKHNhbHQsIGlucHV0S2V5TWF0ZXJpYWwsIGluZm8sIGxlbmd0aEluQnl0ZXMpIHtcbiAgICBjb25zdCBzYWx0SG1hYyA9IG5ldyBzamNsLm1pc2MuaG1hYyh1aW50OEFycmF5VG9CaXRBcnJheShzYWx0KSwgc2pjbC5oYXNoLnNoYTI1Nik7XG4gICAgY29uc3Qga2V5ID0gc2FsdEhtYWMubWFjKHVpbnQ4QXJyYXlUb0JpdEFycmF5KGlucHV0S2V5TWF0ZXJpYWwpKTtcbiAgICBjb25zdCBoYXNoTGVuID0gc2pjbC5iaXRBcnJheS5iaXRMZW5ndGgoa2V5KTtcbiAgICBjb25zdCBsb29wcyA9IE1hdGguY2VpbCgobGVuZ3RoSW5CeXRlcyAqIDgpIC8gaGFzaExlbik7XG4gICAgaWYgKGxvb3BzID4gMjU1KSB7XG4gICAgICAgIHRocm93IG5ldyBzamNsLmV4Y2VwdGlvbi5pbnZhbGlkKFwia2V5IGJpdCBsZW5ndGggaXMgdG9vIGxhcmdlIGZvciBoa2RmXCIpO1xuICAgIH1cbiAgICBjb25zdCBpbnB1dEtleU1hdGVyaWFsSG1hYyA9IG5ldyBzamNsLm1pc2MuaG1hYyhrZXksIHNqY2wuaGFzaC5zaGEyNTYpO1xuICAgIGxldCBjdXJPdXQgPSBbXTtcbiAgICBsZXQgcmV0ID0gW107XG4gICAgZm9yIChsZXQgaSA9IDE7IGkgPD0gbG9vcHM7IGkrKykge1xuICAgICAgICBpbnB1dEtleU1hdGVyaWFsSG1hYy51cGRhdGUoY3VyT3V0KTtcbiAgICAgICAgaW5wdXRLZXlNYXRlcmlhbEhtYWMudXBkYXRlKHVpbnQ4QXJyYXlUb0JpdEFycmF5KGluZm8pKTtcbiAgICAgICAgaW5wdXRLZXlNYXRlcmlhbEhtYWMudXBkYXRlKFtzamNsLmJpdEFycmF5LnBhcnRpYWwoOCwgaSldKTtcbiAgICAgICAgY3VyT3V0ID0gaW5wdXRLZXlNYXRlcmlhbEhtYWMuZGlnZXN0KCk7XG4gICAgICAgIHJldCA9IHNqY2wuYml0QXJyYXkuY29uY2F0KHJldCwgY3VyT3V0KTtcbiAgICB9XG4gICAgcmV0dXJuIGJpdEFycmF5VG9VaW50OEFycmF5KHNqY2wuYml0QXJyYXkuY2xhbXAocmV0LCBsZW5ndGhJbkJ5dGVzICogOCkpO1xufVxuIl0sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFzQkEsSUFBSSxPQUFPO0NBS1AsUUFBUSxDQUFFO0NBS1YsTUFBTSxDQUFFO0NBS1IsYUFBYSxDQUFFO0NBS2YsTUFBTSxDQUFFO0NBS1IsTUFBTSxDQUFFO0NBV1IsT0FBTyxDQUFFO0NBS1QsV0FBVztFQUtQLFNBQVMsU0FBVSxTQUFTO0FBQ3hCLFFBQUssV0FBVyxXQUFZO0FBQ3hCLFdBQU8sY0FBYyxLQUFLO0dBQzdCO0FBQ0QsUUFBSyxVQUFVO0VBQ2xCO0VBS0QsU0FBUyxTQUFVLFNBQVM7QUFDeEIsUUFBSyxXQUFXLFdBQVk7QUFDeEIsV0FBTyxjQUFjLEtBQUs7R0FDN0I7QUFDRCxRQUFLLFVBQVU7RUFDbEI7RUFLRCxLQUFL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TUFBTSxNQUFPO0FBQ3BCLFVBQU8sT0FBTyxRQUFRLElBQUksUUFBUSxJQUFJLElBQUk7R0FFMUMsSUFBSSxNQUFNLFVBQVU7R0FDcEIsSUFBSSxNQUFNLFVBQVUsUUFBUSxRQUFRLElBQUksWUFBWSxJQUFJLElBQUk7QUFFNUQsUUFBSztBQUNMLFFBQUs7QUFDTCxRQUFLO0FBQ0wsUUFBSztBQUNMLFFBQUs7QUFDTCxRQUFLO0FBQ0wsUUFBTSxLQUFLLE1BQU87QUFDbEIsUUFBTSxLQUFLLE9BQU8sT0FBTyxJQUFJLE9BQU8sSUFBSSxJQUFJLEtBQU07QUFDbEQsUUFBSztBQUNMLFFBQUs7QUFDTCxRQUFLO0FBQ0wsUUFBSztBQUNMLFFBQUs7QUFDTCxRQUFLO0FBQ0wsUUFBTSxNQUFNLE1BQU87QUFDbkIsUUFBTSxNQUFNLE9BQU8sT0FBTyxJQUFJLFFBQVEsSUFBSSxJQUFJLEtBQU07RUFDdkQ7QUFFRCxRQUFNLEVBQUUsS0FBTSxNQUFNLEtBQU07QUFDMUIsSUFBRSxLQUFNLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTyxJQUFJLElBQUksS0FBTTtBQUNyRCxRQUFNLEVBQUUsS0FBTSxNQUFNLEtBQU07QUFDMUIsSUFBRSxLQUFNLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTyxJQUFJLElBQUksS0FBTTtBQUNyRCxRQUFNLEVBQUUsS0FBTSxNQUFNLEtBQU07QUFDMUIsSUFBRSxLQUFNLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTyxJQUFJLElBQUksS0FBTTtBQUNyRCxRQUFNLEVBQUUsS0FBTSxNQUFNLEtBQU07QUFDMUIsSUFBRSxLQUFNLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTyxJQUFJLElBQUksS0FBTTtBQUNyRCxRQUFNLEVBQUUsS0FBTSxNQUFNLEtBQU07QUFDMUIsSUFBRSxLQUFNLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTyxJQUFJLElBQUksS0FBTTtBQUNyRCxRQUFNLEVBQUUsTUFBTyxNQUFNLEtBQU07QUFDM0IsSUFBRSxNQUFPLE1BQU0sTUFBTSxRQUFRLElBQUksT0FBTyxJ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QUFTLEtBQUs7QUFDL0MsU0FBSyxNQUFNO0dBQ2Q7QUFDRCxJQUFDLENBQUUsR0FBRyxJQUFJLEdBQUcsR0FBSSxHQUFHLFlBQVksSUFBSSxLQUFLLEtBQUssR0FBRyxLQUFLLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQzdFLElBQUMsQ0FBRSxHQUFHLElBQUksR0FBRyxHQUFJLEdBQUcsWUFBWSxJQUFJLEtBQUssS0FBSyxHQUFHLEtBQUssS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEVBQUU7QUFDN0UsSUFBQyxDQUFFLEdBQUcsSUFBSSxHQUFHLEdBQUksR0FBRyxZQUFZLElBQUksS0FBSyxLQUFLLEdBQUcsS0FBSyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssRUFBRTtBQUM3RSxJQUFDLENBQUUsR0FBRyxJQUFJLEdBQUcsR0FBSSxHQUFHLFlBQVksSUFBSSxLQUFLLEtBQUssR0FBRyxLQUFLLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQzdFLElBQUMsQ0FBRSxHQUFHLElBQUksR0FBRyxHQUFJLEdBQUcsWUFBWSxJQUFJLEtBQUssS0FBSyxHQUFHLEtBQUssS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEVBQUU7QUFDN0UsSUFBQyxDQUFFLEdBQUcsSUFBSSxHQUFHLEdBQUksR0FBRyxZQUFZLElBQUksS0FBSyxLQUFLLEdBQUcsS0FBSyxLQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssRUFBRTtBQUM3RSxJQUFDLENBQUUsR0FBRyxJQUFJLEdBQUcsR0FBSSxHQUFHLFlBQVksSUFBSSxLQUFLLEtBQUssR0FBRyxLQUFLLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxFQUFFO0FBQzdFLElBQUMsQ0FBRSxHQUFHLElBQUksR0FBRyxHQUFJLEdBQUcsWUFBWSxJQUFJLEtBQUssS0FBSyxHQUFHLEtBQUssS0FBSyxHQUFHLEtBQUssR0FBRyxLQUFLLEVBQUU7QUFDN0UsUUFBSyxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7RUFDM0U7RUFDRCxhQUFhO0FBQ1QsY0FBVyxLQUFLLEVBQUU7QUFDbEIsY0FBVyxLQUFLLEVBQUU7RUFDckI7RUFDRCxVQUFVO0FBQ04sUUFBSyxPQUFPLEtBQUssRUFBRTtBQUNuQixRQUFLLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsRUFBRTtFQUMzRDtDQUNKO0NBQ0QsSUFBSUMsMkJBQXlCLGdCQUFnQixNQUFNLElBQUksU0FBUztDQUVoRSxJQUFJLE1BQU0sT0FBTyxFQUFFO0NBQ25CLElBQUksTUFBTSxPQUFPLEVBQUU7Q0FDbkIsSUFBSSxNQUFNLE9BQU8sRUFBRTtDQUNuQixTQUFTLFNBQVMsR0FBRztBQUNqQixTQUFPLGFBQWEsY0FBYyxLQUFLLGVBQWUsTUFBTSxZQUFZLEVBQUUsWUFBWSxTQUFTO0NBQ2xHO0NBQ0QsSUFBSSx3QkFBd0IsTUFBTSxLQUFLLEVBQUUsUUFBUSxJQUFLLEdBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxTQUFTLEdBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO0NBQ2xHLFNBQVMsV0FBVyxRQUFRO0FBQ3hCLE9BQUssU0FBUyxPQUFPLENBQ2pCLE9BQU0sSUFBSSxNQUFNO0VBQ3BCLElBQUksTUFBTTtBQUNWLE9BQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxPQUFPLFFBQVEsSUFDL0IsUUFBTyxNQUFNLE9BQU87QUFFeEIsU0FBTztDQUNWO0NBQ0QsU0FBUyxZQUFZLEtBQUs7QUFDdEIsYUFBVyxRQUFRLFNBQ2YsT0FBTSxJQUFJLE1BQU0scUNBQXFDO0FBQ3pELFNBQU8sT0FBTyxRQUFRLEtBQUssT0FBTyxJQUFJLElBQUksRUFBRTtDQUMvQztDQUNELElBQUksU0FBUztFQUFFLElBQUk7RUFBSSxJQUFJO0VBQUksSUFBSTtFQUFJLElBQUk7RUFBSSxJQUFJO0VBQUksSUFBSTtDQUFLO0NBQ2hFLFNBQVMsY0FBYyxNQUFNO0FBQ3pCLE1BQUksUUFBUSxPQUFPLE1BQU0sUUFBUSxPQUFPLEdBQ3BDLFFBQU8sT0FBTyxPQUFPO0FBQ3pCLE1BQUksUUFBUSxPQUFPLE1BQU0sUUFBUSxPQUFPLEdBQ3BDLFFBQU8sUUFBUSxPQUFPLEtBQUs7QUFDL0IsTUFBSSxRQUFRLE9BQU8sTUFBTSxRQUFRLE9BQU8sR0FDcEMsUUFBTyxRQUFRLE9BQU8sS0FBSztBQUMvQjtDQUNIO0NBQ0QsU0FBUyxXQUFXLEtBQUs7QUFDckIsYUFBVyxRQUFRLFNBQ2YsT0FBTSxJQUFJLE1BQU0scUNBQXFDO0VBQ3pELE1BQU0sS0FBSyxJQUFJO0VBQ2YsTUFBTSxLQUFLLEtBQUs7QUFDaEIsTUFBSSxLQUFLLEVBQ0wsT0FBTSxJQUFJLE1BQU0sNERBQTREO0VBQ2hGLE1BQU0sUUFBUSxJQUFJLFdBQVc7QUFDN0IsT0FBSyxJQUFJLEtBQUssR0FBRyxLQUFLLEdBQUcsS0FBSyxJQUFJLE1BQU0sTUFBTSxHQUFHO0dBQzdDLE1BQU0sS0FBSyxjQUFjLElBQUksV0FBVyxHQUFHLENBQUM7R0FDNUMsTUFBTSxLQUFLLGNBQWMsSUFBSSxXQUFXLEtBQUssRUFBRSxDQUFDO0FBQ2hELE9BQUksWUFBWSxLQUFLLFlBQVksR0FBRztJQUNoQyxNQUFNLE9BQU8sSUFBSSxNQUFNLElBQUksS0FBSztBQUNoQyxVQUFNLElBQUksTUFBTSxrREFBaUQsT0FBTyxpQkFBZ0I7R0FDM0Y7QUFDRCxTQUFNLE1BQU0sS0FBSyxLQUFLO0VBQ3pCO0FBQ0QsU0FBTztDQUNWO0NBQ0QsU0FBUyxnQkFBZ0IsUUFBUTtBQUM3QixTQUFPLFlBQVksV0FBVyxPQUFPLENBQUM7Q0FDekM7Q0FDRCxTQUFTLGdCQUFnQixRQUFRO0FBQzdCLE9BQUssU0FBUyxPQUFPLENBQ2pCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFNBQU8sWUFBWSxXQUFXLFdBQVcsS0FBSyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDcEU7Q0FDRCxTQUFTLGdCQUFnQixHQUFHLEtBQUs7QUFDN0IsU0FBTyxXQUFXLEVBQUUsU0FBUyxHQUFHLENBQUMsU0FBUyxNQUFNLEdBQUcsSUFBSSxDQUFDO0NBQzNEO0NBQ0QsU0FBUyxnQkFBZ0IsR0FBRyxLQUFLO0FBQzdCLFNBQU8sZ0JBQWdCLEdBQUcsSUFBSSxDQUFDLFNBQVM7Q0FDM0M7Q0FDRCxTQUFTLFlBQVksT0FBTyxLQUFLLGdCQUFnQjtFQUM3QyxJQUFJO0FBQ0osYUFBVyxRQUFRLFNBQ2YsS0FBSTtBQUNBLFNBQU0sV0FBVyxJQUFJO0VBQ3hCLFNBQ00sR0FBRztBQUNOLFNBQU0sSUFBSSxPQUFPLEVBQUUsTUFBTSxrQ0FBa0MsSUFBSSxZQUFZLEVBQUU7RUFDaEY7U0FFSSxTQUFTLElBQUksQ0FDbEIsT0FBTSxXQUFXLEtBQUssSUFBSTtJQUcxQixPQUFNLElBQUksT0FBTyxFQUFFLE1BQU07RUFFN0IsTUFBTSxNQUFNLElBQUk7QUFDaEIsYUFBVyxtQkFBbUIsWUFBWSxRQUFRLGVBQzlDLE9BQU0sSUFBSSxPQUFPLEVBQUUsTUFBTSxZQUFZLGVBQWUsY0FBYyxJQUFJO0FBQzFFLFNBQU87Q0FDVjtDQUNELFNBQVMsYUFBYSxHQUFHLFFBQVE7RUFDN0IsSUFBSSxNQUFNO0FBQ1YsT0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLE9BQU8sUUFBUSxLQUFLO0dBQ3BDLE1BQU0sSUFBSSxPQUFPO0FBQ2pCLFFBQUssU0FBUyxFQUFFLENBQ1osT0FBTSxJQUFJLE1BQU07QUFDcEIsVUFBTyxFQUFFO0VBQ1o7RUFDRCxJQUFJLE1BQU0sSUFBSSxXQUFXO0VBQ3pCLElBQUksTUFBTTtBQUNWLE9BQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxPQUFPLFFBQVEsS0FBSztHQUNwQyxNQUFNLElBQUksT0FBTztBQUNqQixPQUFJLElBQUksR0FBRyxJQUFJO0FBQ2YsVUFBTyxFQUFFO0VBQ1o7QUFDRCxTQUFPO0NBQ1Y7Q0FDRCxJQUFJLFVBQVUsQ0FBQyxPQUFPLE9BQU8sT0FBTyxJQUFJLEVBQUUsSUFBSTtDQUM5QyxJQUFJLGVBQWU7RUFDZixRQUFRLENBQUMsZUFBZSxRQUFRO0VBQ2hDLFVBQVUsQ0FBQyxlQUFlLFFBQVE7RUFDbEMsU0FBUyxDQUFDLGVBQWUsUUFBUTtFQUNqQyxRQUFRLENBQUMsZUFBZSxRQUFRO0VBQ2hDLG9CQUFvQixDQUFDLGVBQWUsUUFBUSxZQUFZLFNBQVMsSUFBSTtFQUNyRSxlQUFlLENBQUMsUUFBUSxPQUFPLGNBQWMsSUFBSTtFQUNqRCxPQUFPLENBQUMsUUFBUSxNQUFNLFFBQVEsSUFBSTtFQUNsQyxPQUFPLENBQUMsS0FBSyxXQUFXLE9BQU8sR0FBRyxRQUFRLElBQUk7RUFDOUMsTUFBTSxDQUFDLGVBQWUsUUFBUSxjQUFjLE9BQU8sY0FBYyxJQUFJLFVBQVU7Q0FDbEY7Q0FDRCxTQUFTLGVBQWUsUUFBUSxZQUFZLGdCQUFnQixDQUFFLEdBQUU7RUFDNUQsTUFBTSxhQUFhLENBQUMsV0FBVyxNQUFNLGVBQWU7R0FDaEQsTUFBTSxXQUFXLGFBQWE7QUFDOUIsY0FBVyxhQUFhLFdBQ3BCLE9BQU0sSUFBSSxPQUFPLHFCQUFxQixLQUFLO0dBQy9DLE1BQU0sTUFBTSxPQUFPO0FBQ25CLE9BQUksY0FBYyxhQUFhLEVBQzNCO0FBQ0osUUFBSyxTQUFTLEtBQUssT0FBTyxDQUN0QixPQUFNLElBQUksT0FBTyxnQkFBZ0IsT0FBTyxVQUFVLENBQUMsR0FBRyxJQUFJLFdBQVcsSUFBSSxjQUFjLEtBQUs7RUFFbkc7QUFDRCxPQUFLLE1BQU0sQ0FBQyxXQUFXLEtBQUssSUFBSSxPQUFPLFFBQVEsV0FBVyxDQUN0RCxZQUFXLFdBQVcsTUFBTSxNQUFNO0FBQ3RDLE9BQUssTUFBTSxDQUFDLFdBQVcsS0FBSyxJQUFJLE9BQU8sUUFBUSxjQUFjLENBQ3pELFlBQVcsV0FBVyxNQUFNLEtBQUs7QUFDckMsU0FBTztDQUNWO0NBRUQsSUFBSSxPQUFPLE9BQU8sRUFBRTtDQUNwQixJQUFJLE9BQU8sT0FBTyxFQUFFO0NBQ3BCLElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsSUFBSSxNQUFNLE9BQU8sRUFBRTtDQUNuQixJQUFJLE1BQU0sT0FBTyxFQUFFO0NBQ25CLElBQUksTUFBTSxPQUFPLEVBQUU7Q0FDbkIsSUFBSSxNQUFNLE9BQU8sRUFBRTtDQUNuQixJQUFJLE1BQU0sT0FBTyxFQUFFO0NBQ25CLElBQUksT0FBTyxPQUFPLEdBQUc7Q0FDckIsU0FBUyxJQUFJLEdBQUcsR0FBRztFQUNmLE1BQU0sU0FBUyxJQUFJO0FBQ25CLFNBQU8sVUFBVSxPQUFPLFNBQVMsSUFBSTtDQUN4QztDQUNELFNBQVMsSUFBSSxLQUFLLE9BQU8sUUFBUTtBQUM3QixNQUFJLFVBQVUsUUFBUSxRQUFRLEtBQzFCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLE1BQUksV0FBVyxLQUNYLFFBQU87RUFDWCxJQUFJLE1BQU07QUFDVixTQUFPLFFBQVEsTUFBTTtBQUNqQixPQUFJLFFBQVEsS0FDUixPQUFNLE1BQU0sTUFBTTtBQUN0QixTQUFNLE1BQU0sTUFBTTtBQUNsQixhQUFVO0VBQ2I7QUFDRCxTQUFPO0NBQ1Y7Q0FDRCxTQUFTLEtBQUssR0FBRyxPQUFPLFFBQVE7RUFDNUIsSUFBSSxNQUFNO0FBQ1YsU0FBTyxVQUFVLE1BQU07QUFDbkIsVUFBTztBQUNQLFVBQU87RUFDVjtBQUNELFNBQU87Q0FDVjtDQUNELFNBQVMsT0FBTyxRQUFRLFFBQVE7QUFDNUIsTUFBSSxXQUFXLFFBQVEsVUFBVSxLQUM3QixPQUFNLElBQUksT0FBTyw0Q0FBNEMsT0FBTyxPQUFPLE9BQU87RUFFdEYsSUFBSSxJQUFJLElBQUksUUFBUSxPQUFPO0VBQzNCLElBQUksSUFBSTtFQUNSLElBQUksSUFBSSxNQUFNLElBQUksTUFBTSxJQUFJLE1BQU0sSUFBSTtBQUN0QyxTQUFPLE1BQU0sTUFBTTtHQUNmLE1BQU0sSUFBSSxJQUFJO0dBQ2QsTUFBTSxJQUFJLElBQUk7R0FDZCxNQUFNLElBQUksSUFBSSxJQUFJO0dBQ2xCLE1BQU0sSUFBSSxJQUFJLElBQUk7QUFDbEIsT0FBSSxHQUFHLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxJQUFJO0VBQzFDO0VBQ0QsTUFBTSxNQUFNO0FBQ1osTUFBSSxRQUFRLEtBQ1IsT0FBTSxJQUFJLE1BQU07QUFDcEIsU0FBTyxJQUFJLEdBQUcsT0FBTztDQUN4QjtDQUNELFNBQVMsY0FBYyxHQUFHO0VBQ3RCLE1BQU0sYUFBYSxJQUFJLFFBQVE7RUFDL0IsSUFBSSxHQUFHLEdBQUc7QUFDVixPQUFLLElBQUksSUFBSSxNQUFNLElBQUksR0FBRyxJQUFJLFNBQVMsTUFBTSxLQUFLLE1BQU07QUFFeEQsT0FBSyxJQUFJLE1BQU0sSUFBSSxLQUFLLElBQUksR0FBRyxXQUFXLEVBQUUsS0FBSyxJQUFJLE1BQU07QUFFM0QsTUFBSSxNQUFNLEdBQUc7R0FDVCxNQUFNLFVBQVUsSUFBSSxRQUFRO0FBQzVCLFVBQU8sU0FBUyxZQUFZLEtBQUssR0FBRztJQUNoQyxNQUFNLE9BQU8sSUFBSSxJQUFJLEdBQUcsT0FBTztBQUMvQixTQUFLLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsQ0FDMUIsT0FBTSxJQUFJLE1BQU07QUFDcEIsV0FBTztHQUNWO0VBQ0o7RUFDRCxNQUFNLFVBQVUsSUFBSSxRQUFRO0FBQzVCLFNBQU8sU0FBUyxZQUFZLEtBQUssR0FBRztBQUNoQyxPQUFJLElBQUksSUFBSSxHQUFHLFVBQVUsS0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLENBQzFDLE9BQU0sSUFBSSxNQUFNO0dBQ3BCLElBQUksSUFBSTtHQUNSLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsRUFBRTtHQUN2QyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsT0FBTztHQUMxQixJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsRUFBRTtBQUNyQixXQUFRLElBQUksSUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO0FBQ3pCLFFBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQ3BCLFFBQU8sSUFBSTtJQUNmLElBQUksSUFBSTtBQUNSLFNBQUssSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxHQUFHLEtBQUs7QUFDbEMsU0FBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksQ0FDcEI7QUFDSixVQUFLLElBQUksSUFBSSxHQUFHO0lBQ25CO0lBQ0QsTUFBTSxLQUFLLElBQUksSUFBSSxHQUFHLFFBQVEsT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDO0FBQ2hELFFBQUksSUFBSSxJQUFJLEdBQUc7QUFDZixRQUFJLElBQUksSUFBSSxHQUFHLEdBQUc7QUFDbEIsUUFBSSxJQUFJLElBQUksR0FBRyxFQUFFO0FBQ2pCLFFBQUk7R0FDUDtBQUNELFVBQU87RUFDVjtDQUNKO0NBQ0QsU0FBUyxPQUFPLEdBQUc7QUFDZixNQUFJLElBQUksUUFBUSxLQUFLO0dBQ2pCLE1BQU0sVUFBVSxJQUFJLFFBQVE7QUFDNUIsVUFBTyxTQUFTLFVBQVUsS0FBSyxHQUFHO0lBQzlCLE1BQU0sT0FBTyxJQUFJLElBQUksR0FBRyxPQUFPO0FBQy9CLFNBQUssSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxDQUMxQixPQUFNLElBQUksTUFBTTtBQUNwQixXQUFPO0dBQ1Y7RUFDSjtBQUNELE1BQUksSUFBSSxRQUFRLEtBQUs7R0FDakIsTUFBTSxNQUFNLElBQUksT0FBTztBQUN2QixVQUFPLFNBQVMsVUFBVSxLQUFLLEdBQUc7SUFDOUIsTUFBTSxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUs7SUFDM0IsTUFBTSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7SUFDekIsTUFBTSxLQUFLLElBQUksSUFBSSxHQUFHLEVBQUU7SUFDeEIsTUFBTSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxLQUFLLEVBQUUsRUFBRTtJQUN2QyxNQUFNLE9BQU8sSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsSUFBSSxJQUFJLENBQUM7QUFDN0MsU0FBSyxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLENBQzFCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFdBQU87R0FDVjtFQUNKO0FBQ0QsTUFBSSxJQUFJLFNBQVMsS0FBSyxDQUNyQjtBQUNELFNBQU8sY0FBYyxFQUFFO0NBQzFCO0NBQ0QsSUFBSSxlQUFlLENBQUMsS0FBSyxZQUFZLElBQUksS0FBSyxPQUFPLEdBQUcsVUFBVTtDQUNsRSxJQUFJLGVBQWU7RUFDZjtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0NBQ0g7Q0FDRCxTQUFTLGNBQWMsT0FBTztFQUMxQixNQUFNLFVBQVU7R0FDWixPQUFPO0dBQ1AsTUFBTTtHQUNOLE9BQU87R0FDUCxNQUFNO0VBQ1Q7RUFDRCxNQUFNLE9BQU8sYUFBYSxPQUFPLENBQUMsS0FBSyxRQUFRO0FBQzNDLE9BQUksT0FBTztBQUNYLFVBQU87RUFDVixHQUFFLFFBQVE7QUFDWCxTQUFPLGVBQWUsT0FBTyxLQUFLO0NBQ3JDO0NBQ0QsU0FBUyxNQUFNLEdBQUcsS0FBSyxPQUFPO0FBQzFCLE1BQUksUUFBUSxLQUNSLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLE1BQUksVUFBVSxLQUNWLFFBQU8sRUFBRTtBQUNiLE1BQUksVUFBVSxLQUNWLFFBQU87RUFDWCxJQUFJLElBQUksRUFBRTtFQUNWLElBQUksSUFBSTtBQUNSLFNBQU8sUUFBUSxNQUFNO0FBQ2pCLE9BQUksUUFBUSxLQUNSLEtBQUksRUFBRSxJQUFJLEdBQUcsRUFBRTtBQUNuQixPQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ1osYUFBVTtFQUNiO0FBQ0QsU0FBTztDQUNWO0NBQ0QsU0FBUyxjQUFjLEdBQUcsTUFBTTtFQUM1QixNQUFNLE1BQU0sSUFBSSxNQUFNLEtBQUs7RUFDM0IsTUFBTSxpQkFBaUIsS0FBSyxPQUFPLENBQUMsS0FBSyxLQUFLLE1BQU07QUFDaEQsT0FBSSxFQUFFLElBQUksSUFBSSxDQUNWLFFBQU87QUFDWCxPQUFJLEtBQUs7QUFDVCxVQUFPLEVBQUUsSUFBSSxLQUFLLElBQUk7RUFDekIsR0FBRSxFQUFFLElBQUk7RUFDVCxNQUFNLFdBQVcsRUFBRSxJQUFJLGVBQWU7QUFDdEMsT0FBSyxZQUFZLENBQUMsS0FBSyxLQUFLLE1BQU07QUFDOUIsT0FBSSxFQUFFLElBQUksSUFBSSxDQUNWLFFBQU87QUFDWCxPQUFJLEtBQUssRUFBRSxJQUFJLEtBQUssSUFBSSxHQUFHO0FBQzNCLFVBQU8sRUFBRSxJQUFJLEtBQUssSUFBSTtFQUN6QixHQUFFLFNBQVM7QUFDWixTQUFPO0NBQ1Y7Q0FDRCxTQUFTLFFBQVEsR0FBRyxZQUFZO0VBQzVCLE1BQU0sY0FBYyxvQkFBb0IsSUFBSSxhQUFhLEVBQUUsU0FBUyxFQUFFLENBQUM7RUFDdkUsTUFBTSxjQUFjLEtBQUssS0FBSyxjQUFjLEVBQUU7QUFDOUMsU0FBTztHQUFFLFlBQVk7R0FBYTtFQUFhO0NBQ2xEO0NBQ0QsU0FBUyxNQUFNLE9BQU8sUUFBUSxRQUFRLE9BQU8sUUFBUSxDQUFFLEdBQUU7QUFDckQsTUFBSSxTQUFTLEtBQ1QsT0FBTSxJQUFJLE9BQU8sZ0NBQWdDLE1BQU07RUFDM0QsTUFBTSxFQUFFLFlBQVksTUFBTSxhQUFhLE9BQU8sR0FBRyxRQUFRLE9BQU8sT0FBTztBQUN2RSxNQUFJLFFBQVEsS0FDUixPQUFNLElBQUksTUFBTTtFQUNwQixNQUFNLFFBQVEsT0FBTyxNQUFNO0VBQzNCLE1BQU0sSUFBSSxPQUFPLE9BQU87R0FDcEI7R0FDQTtHQUNBO0dBQ0EsTUFBTSxRQUFRLEtBQUs7R0FDbkIsTUFBTTtHQUNOLEtBQUs7R0FDTCxRQUFRLENBQUMsUUFBUSxJQUFJLEtBQUssTUFBTTtHQUNoQyxTQUFTLENBQUMsUUFBUTtBQUNkLGVBQVcsUUFBUSxTQUNmLE9BQU0sSUFBSSxPQUFPLHFEQUFxRCxJQUFJO0FBQzlFLFdBQU8sUUFBUSxPQUFPLE1BQU07R0FDL0I7R0FDRCxLQUFLLENBQUMsUUFBUSxRQUFRO0dBQ3RCLE9BQU8sQ0FBQyxTQUFTLE1BQU0sVUFBVTtHQUNqQyxLQUFLLENBQUMsUUFBUSxLQUFLLEtBQUssTUFBTTtHQUM5QixLQUFLLENBQUMsS0FBSyxRQUFRLFFBQVE7R0FDM0IsS0FBSyxDQUFDLFFBQVEsSUFBSSxNQUFNLEtBQUssTUFBTTtHQUNuQyxLQUFLLENBQUMsS0FBSyxRQUFRLElBQUksTUFBTSxLQUFLLE1BQU07R0FDeEMsS0FBSyxDQUFDLEtBQUssUUFBUSxJQUFJLE1BQU0sS0FBSyxNQUFNO0dBQ3hDLEtBQUssQ0FBQyxLQUFLLFFBQVEsSUFBSSxNQUFNLEtBQUssTUFBTTtHQUN4QyxLQUFLLENBQUMsS0FBSyxVQUFVLE1BQU0sR0FBRyxLQUFLLE1BQU07R0FDekMsS0FBSyxDQUFDLEtBQUssUUFBUSxJQUFJLE1BQU0sT0FBTyxLQUFLLE1BQU0sRUFBRSxNQUFNO0dBRXZELE1BQU0sQ0FBQyxRQUFRLE1BQU07R0FDckIsTUFBTSxDQUFDLEtBQUssUUFBUSxNQUFNO0dBQzFCLE1BQU0sQ0FBQyxLQUFLLFFBQVEsTUFBTTtHQUMxQixNQUFNLENBQUMsS0FBSyxRQUFRLE1BQU07R0FDMUIsS0FBSyxDQUFDLFFBQVEsT0FBTyxLQUFLLE1BQU07R0FDaEMsTUFBTSxNQUFNLFNBQVMsQ0FBQyxNQUFNLE1BQU0sR0FBRyxFQUFFO0dBQ3ZDLGFBQWEsQ0FBQyxRQUFRLGNBQWMsR0FBRyxJQUFJO0dBRzNDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsTUFBTSxJQUFJLElBQUk7R0FDM0IsU0FBUyxDQUFDLFFBQVEsUUFBUSxnQkFBZ0IsS0FBSyxNQUFNLEdBQUcsZ0JBQWdCLEtBQUssTUFBTTtHQUNuRixXQUFXLENBQUMsV0FBVztBQUNuQixRQUFJLE9BQU8sV0FBVyxNQUNsQixPQUFNLElBQUksT0FBTyx5QkFBeUIsTUFBTSxRQUFRLE9BQU8sT0FBTztBQUMxRSxXQUFPLFFBQVEsZ0JBQWdCLE9BQU8sR0FBRyxnQkFBZ0IsT0FBTztHQUNuRTtFQUNKLEVBQUM7QUFDRixTQUFPLE9BQU8sT0FBTyxFQUFFO0NBQzFCO0NBQ0QsU0FBUyxXQUFXLEtBQUssS0FBSztBQUMxQixPQUFLLElBQUksTUFDTCxPQUFNLElBQUksT0FBTztFQUNyQixNQUFNLE9BQU8sSUFBSSxLQUFLLElBQUk7QUFDMUIsU0FBTyxJQUFJLE1BQU0sS0FBSyxHQUFHLElBQUksSUFBSSxLQUFLLEdBQUc7Q0FDNUM7Q0FFRCxJQUFJLE9BQU8sT0FBTyxFQUFFO0NBQ3BCLElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsU0FBUyxLQUFLLEdBQUcsTUFBTTtFQUNuQixNQUFNLGtCQUFrQixDQUFDLFdBQVcsU0FBUztHQUN6QyxNQUFNLE1BQU0sS0FBSyxRQUFRO0FBQ3pCLFVBQU8sWUFBWSxNQUFNO0VBQzVCO0VBQ0QsTUFBTSxPQUFPLENBQUMsTUFBTTtHQUNoQixNQUFNLFVBQVUsS0FBSyxLQUFLLE9BQU8sRUFBRSxHQUFHO0dBQ3RDLE1BQU0sYUFBYSxNQUFNLElBQUk7QUFDN0IsVUFBTztJQUFFO0lBQVM7R0FBWTtFQUNqQztBQUNELFNBQU87R0FDSDtHQUVBLGFBQWEsS0FBSyxHQUFHO0lBQ2pCLElBQUksSUFBSSxFQUFFO0lBQ1YsSUFBSSxJQUFJO0FBQ1IsV0FBTyxJQUFJLE1BQU07QUFDYixTQUFJLElBQUksS0FDSixLQUFJLEVBQUUsSUFBSSxFQUFFO0FBQ2hCLFNBQUksRUFBRSxRQUFRO0FBQ2QsV0FBTTtJQUNUO0FBQ0QsV0FBTztHQUNWO0dBV0QsaUJBQWlCLEtBQUssR0FBRztJQUNyQixNQUFNLEVBQUUsU0FBUyxZQUFZLEdBQUcsS0FBSyxFQUFFO0lBQ3ZDLE1BQU0sU0FBUyxDQUFFO0lBQ2pCLElBQUksSUFBSTtJQUNSLElBQUksT0FBTztBQUNYLFNBQUssSUFBSSxTQUFTLEdBQUcsU0FBUyxTQUFTLFVBQVU7QUFDN0MsWUFBTztBQUNQLFlBQU8sS0FBSyxLQUFLO0FBQ2pCLFVBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxZQUFZLEtBQUs7QUFDakMsYUFBTyxLQUFLLElBQUksRUFBRTtBQUNsQixhQUFPLEtBQUssS0FBSztLQUNwQjtBQUNELFNBQUksS0FBSyxRQUFRO0lBQ3BCO0FBQ0QsV0FBTztHQUNWO0dBUUQsS0FBSyxHQUFHLGFBQWEsR0FBRztJQUNwQixNQUFNLEVBQUUsU0FBUyxZQUFZLEdBQUcsS0FBSyxFQUFFO0lBQ3ZDLElBQUksSUFBSSxFQUFFO0lBQ1YsSUFBSSxJQUFJLEVBQUU7SUFDVixNQUFNQyxTQUFPLE9BQU8sS0FBSyxJQUFJLEVBQUU7SUFDL0IsTUFBTSxZQUFZLEtBQUs7SUFDdkIsTUFBTSxVQUFVLE9BQU8sRUFBRTtBQUN6QixTQUFLLElBQUksU0FBUyxHQUFHLFNBQVMsU0FBUyxVQUFVO0tBQzdDLE1BQU0sU0FBUyxTQUFTO0tBQ3hCLElBQUksUUFBUSxPQUFPLElBQUlBLE9BQUs7QUFDNUIsV0FBTTtBQUNOLFNBQUksUUFBUSxZQUFZO0FBQ3BCLGVBQVM7QUFDVCxXQUFLO0tBQ1I7S0FDRCxNQUFNLFVBQVU7S0FDaEIsTUFBTSxVQUFVLFNBQVMsS0FBSyxJQUFJLE1BQU0sR0FBRztLQUMzQyxNQUFNLFFBQVEsU0FBUyxNQUFNO0tBQzdCLE1BQU0sUUFBUSxRQUFRO0FBQ3RCLFNBQUksVUFBVSxFQUNWLEtBQUksRUFBRSxJQUFJLGdCQUFnQixPQUFPLFlBQVksU0FBUyxDQUFDO0lBR3ZELEtBQUksRUFBRSxJQUFJLGdCQUFnQixPQUFPLFlBQVksU0FBUyxDQUFDO0lBRTlEO0FBQ0QsV0FBTztLQUFFO0tBQUc7SUFBRztHQUNsQjtHQUNELFdBQVcsR0FBRyxnQkFBZ0IsR0FBRyxXQUFXO0lBQ3hDLE1BQU0sSUFBSSxFQUFFLGdCQUFnQjtJQUM1QixJQUFJLE9BQU8sZUFBZSxJQUFJLEVBQUU7QUFDaEMsU0FBSyxNQUFNO0FBQ1AsWUFBTyxLQUFLLGlCQUFpQixHQUFHLEVBQUU7QUFDbEMsU0FBSSxNQUFNLEVBQ04sZ0JBQWUsSUFBSSxHQUFHLFVBQVUsS0FBSyxDQUFDO0lBRTdDO0FBQ0QsV0FBTyxLQUFLLEtBQUssR0FBRyxNQUFNLEVBQUU7R0FDL0I7RUFDSjtDQUNKO0NBQ0QsU0FBUyxjQUFjLE9BQU87QUFDMUIsZ0JBQWMsTUFBTSxHQUFHO0FBQ3ZCLGlCQUFlLE9BQU87R0FDbEIsR0FBRztHQUNILEdBQUc7R0FDSCxJQUFJO0dBQ0osSUFBSTtFQUNQLEdBQUU7R0FDQyxZQUFZO0dBQ1osYUFBYTtFQUNoQixFQUFDO0FBQ0YsU0FBTyxPQUFPLE9BQU87R0FDakIsR0FBRyxRQUFRLE1BQU0sR0FBRyxNQUFNLFdBQVc7R0FDckMsR0FBRztHQUNILEdBQUcsRUFBRSxHQUFHLE1BQU0sR0FBRyxNQUFPO0VBQzNCLEVBQUM7Q0FDTDtDQUVELElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsSUFBSSxPQUFPLE9BQU8sRUFBRTtDQUNwQixJQUFJLE9BQU8sT0FBTyxFQUFFO0NBQ3BCLElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsSUFBSSxpQkFBaUIsRUFBRSxRQUFRLEtBQU07Q0FDckMsU0FBUyxhQUFhLE9BQU87RUFDekIsTUFBTSxPQUFPLGNBQWMsTUFBTTtBQUNqQyxpQkFBZSxPQUFPO0dBQ2xCLE1BQU07R0FDTixHQUFHO0dBQ0gsR0FBRztHQUNILGFBQWE7RUFDaEIsR0FBRTtHQUNDLG1CQUFtQjtHQUNuQixRQUFRO0dBQ1IsU0FBUztHQUNULFlBQVk7RUFDZixFQUFDO0FBQ0YsU0FBTyxPQUFPLE9BQU8sRUFBRSxHQUFHLEtBQU0sRUFBQztDQUNwQztDQUNELFNBQVMsZUFBZSxVQUFVO0VBQzlCLE1BQU0sUUFBUSxhQUFhLFNBQVM7RUFDcEMsTUFBTSxFQUFFLElBQUksS0FBSyxHQUFHLGFBQWEsU0FBUyxNQUFNLE9BQU8sYUFBYSxjQUFjLGFBQWEsR0FBRyxVQUFVLEdBQUc7RUFDL0csTUFBTSxPQUFPLFFBQVEsT0FBTyxjQUFjLEVBQUUsR0FBRztFQUMvQyxNQUFNLE9BQU8sSUFBSTtFQUNqQixNQUFNLFdBQVcsTUFBTSxZQUFZLENBQUMsR0FBRyxNQUFNO0FBQ3pDLE9BQUk7QUFDQSxXQUFPO0tBQUUsU0FBUztLQUFNLE9BQU8sSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLEVBQUUsQ0FBQztJQUFFO0dBQzVELFNBQ00sR0FBRztBQUNOLFdBQU87S0FBRSxTQUFTO0tBQU8sT0FBTztJQUFNO0dBQ3pDO0VBQ0o7RUFDRCxNQUFNLHFCQUFxQixNQUFNLHNCQUFzQixDQUFDLFdBQVc7RUFDbkUsTUFBTSxTQUFTLE1BQU0sV0FBVyxDQUFDLE1BQU0sS0FBSyxXQUFXO0FBQ25ELE9BQUksSUFBSSxVQUFVLE9BQ2QsT0FBTSxJQUFJLE1BQU07QUFDcEIsVUFBTztFQUNWO0VBQ0QsTUFBTSxRQUFRLENBQUMsYUFBYSxNQUFNLFlBQVksT0FBTztFQUNyRCxNQUFNLFVBQVUsQ0FBQyxHQUFHLFFBQVEsTUFBTSxFQUFFLElBQUksTUFBTSxJQUFJLElBQUksSUFBSTtFQUMxRCxNQUFNLGVBQWUsQ0FBQyxNQUFNLE1BQU0sUUFBUSxRQUFRLEdBQUcsS0FBSztFQUMxRCxTQUFTLGNBQWMsR0FBRyxLQUFLO0FBQzNCLE9BQUksUUFBUSxHQUFHLElBQUksQ0FDZixRQUFPO0FBQ1gsU0FBTSxJQUFJLE9BQU8sMEJBQTBCLElBQUksZUFBZSxFQUFFLEdBQUcsRUFBRTtFQUN4RTtFQUNELFNBQVMsVUFBVSxHQUFHO0FBQ2xCLFVBQU8sTUFBTSxPQUFPLElBQUksY0FBYyxHQUFHLFlBQVk7RUFDeEQ7RUFDRCxNQUFNLG1DQUFtQyxJQUFJO0VBQzdDLFNBQVMsUUFBUSxPQUFPO0FBQ3BCLFNBQU0saUJBQWlCLE9BQ25CLE9BQU0sSUFBSSxNQUFNO0VBQ3ZCO0VBQ0QsTUFBTSxNQUFNO0dBQ1IsWUFBWSxJQUFJLElBQUksSUFBSSxJQUFJO0FBQ3hCLFNBQUssS0FBSztBQUNWLFNBQUssS0FBSztBQUNWLFNBQUssS0FBSztBQUNWLFNBQUssS0FBSztBQUNWLFNBQUssYUFBYSxHQUFHLENBQ2pCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFNBQUssYUFBYSxHQUFHLENBQ2pCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFNBQUssYUFBYSxHQUFHLENBQ2pCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFNBQUssYUFBYSxHQUFHLENBQ2pCLE9BQU0sSUFBSSxNQUFNO0dBQ3ZCO0dBQ0QsSUFBSSxJQUFJO0FBQ0osV0FBTyxLQUFLLFVBQVUsQ0FBQztHQUMxQjtHQUNELElBQUksSUFBSTtBQUNKLFdBQU8sS0FBSyxVQUFVLENBQUM7R0FDMUI7R0FDRCxPQUFPLFdBQVcsR0FBRztBQUNqQixRQUFJLGFBQWEsTUFDYixPQUFNLElBQUksTUFBTTtJQUNwQixNQUFNLEVBQUUsR0FBRyxHQUFHLEdBQUcsS0FBSyxDQUFFO0FBQ3hCLFNBQUssYUFBYSxFQUFFLEtBQUssYUFBYSxFQUFFLENBQ3BDLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFdBQU8sSUFBSSxNQUFNLEdBQUcsR0FBRyxNQUFNLEtBQUssSUFBSSxFQUFFO0dBQzNDO0dBQ0QsT0FBTyxXQUFXLFFBQVE7SUFDdEIsTUFBTSxRQUFRLElBQUksWUFBWSxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDO0FBQ3RELFdBQU8sT0FBTyxJQUFJLENBQUMsR0FBRyxNQUFNLEVBQUUsU0FBUyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksTUFBTSxXQUFXO0dBQzFFO0dBRUQsZUFBZSxZQUFZO0FBQ3ZCLFNBQUssZUFBZTtBQUNwQixxQkFBaUIsT0FBTyxLQUFLO0dBQ2hDO0dBR0QsaUJBQWlCO0lBQ2IsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHO0FBQ2pCLFFBQUksS0FBSyxLQUFLLENBQ1YsT0FBTSxJQUFJLE1BQU07SUFDcEIsTUFBTSxFQUFFLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxHQUFHO0lBQ3ZDLE1BQU0sS0FBSyxLQUFLLElBQUksRUFBRTtJQUN0QixNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxLQUFLLEtBQUssSUFBSSxFQUFFO0lBQ3RCLE1BQU0sS0FBSyxLQUFLLEtBQUssR0FBRztJQUN4QixNQUFNLE1BQU0sS0FBSyxLQUFLLEVBQUU7SUFDeEIsTUFBTSxPQUFPLEtBQUssS0FBSyxLQUFLLE1BQU0sR0FBRyxDQUFDO0lBQ3RDLE1BQU0sUUFBUSxLQUFLLEtBQUssS0FBSyxJQUFJLEtBQUssS0FBSyxHQUFHLENBQUMsQ0FBQztBQUNoRCxRQUFJLFNBQVMsTUFDVCxPQUFNLElBQUksTUFBTTtJQUNwQixNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxLQUFLLEtBQUssSUFBSSxFQUFFO0FBQ3RCLFFBQUksT0FBTyxHQUNQLE9BQU0sSUFBSSxNQUFNO0dBQ3ZCO0dBRUQsT0FBTyxPQUFPO0FBQ1YsWUFBUSxNQUFNO0lBQ2QsTUFBTSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7SUFDbkMsTUFBTSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7SUFDbkMsTUFBTSxPQUFPLEtBQUssS0FBSyxHQUFHO0lBQzFCLE1BQU0sT0FBTyxLQUFLLEtBQUssR0FBRztJQUMxQixNQUFNLE9BQU8sS0FBSyxLQUFLLEdBQUc7SUFDMUIsTUFBTSxPQUFPLEtBQUssS0FBSyxHQUFHO0FBQzFCLFdBQU8sU0FBUyxRQUFRLFNBQVM7R0FDcEM7R0FDRCxNQUFNO0FBQ0YsV0FBTyxLQUFLLE9BQU8sTUFBTSxLQUFLO0dBQ2pDO0dBQ0QsU0FBUztBQUNMLFdBQU8sSUFBSSxNQUFNLE1BQU0sS0FBSyxHQUFHLEVBQUUsS0FBSyxJQUFJLEtBQUssSUFBSSxNQUFNLEtBQUssR0FBRztHQUNwRTtHQUlELFNBQVM7SUFDTCxNQUFNLEVBQUUsR0FBRyxHQUFHO0lBQ2QsTUFBTSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7SUFDbkMsTUFBTSxJQUFJLEtBQUssS0FBSyxHQUFHO0lBQ3ZCLE1BQU0sSUFBSSxLQUFLLEtBQUssR0FBRztJQUN2QixNQUFNLElBQUksS0FBSyxPQUFPLEtBQUssS0FBSyxHQUFHLENBQUM7SUFDcEMsTUFBTSxJQUFJLEtBQUssSUFBSSxFQUFFO0lBQ3JCLE1BQU0sT0FBTyxLQUFLO0lBQ2xCLE1BQU0sSUFBSSxLQUFLLEtBQUssT0FBTyxLQUFLLEdBQUcsSUFBSSxFQUFFO0lBQ3pDLE1BQU0sS0FBSyxJQUFJO0lBQ2YsTUFBTSxJQUFJLEtBQUs7SUFDZixNQUFNLElBQUksSUFBSTtJQUNkLE1BQU0sS0FBSyxLQUFLLElBQUksRUFBRTtJQUN0QixNQUFNLEtBQUssS0FBSyxLQUFLLEVBQUU7SUFDdkIsTUFBTSxLQUFLLEtBQUssSUFBSSxFQUFFO0lBQ3RCLE1BQU0sS0FBSyxLQUFLLElBQUksR0FBRztBQUN2QixXQUFPLElBQUksTUFBTSxJQUFJLElBQUksSUFBSTtHQUNoQztHQUlELElBQUksT0FBTztBQUNQLFlBQVEsTUFBTTtJQUNkLE1BQU0sRUFBRSxHQUFHLEdBQUcsR0FBRztJQUNqQixNQUFNLEVBQUUsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUc7SUFDM0MsTUFBTSxFQUFFLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHO0FBQzNDLFFBQUksTUFBTSxPQUFPLEdBQUcsRUFBRTtLQUNsQixNQUFNLEtBQUssTUFBTSxLQUFLLE9BQU8sS0FBSyxJQUFJO0tBQ3RDLE1BQU0sS0FBSyxNQUFNLEtBQUssT0FBTyxLQUFLLElBQUk7S0FDdEMsTUFBTSxLQUFLLEtBQUssS0FBSyxHQUFHO0FBQ3hCLFNBQUksT0FBTyxLQUNQLFFBQU8sS0FBSyxRQUFRO0tBQ3hCLE1BQU0sS0FBSyxLQUFLLEtBQUssT0FBTyxHQUFHO0tBQy9CLE1BQU0sS0FBSyxLQUFLLEtBQUssT0FBTyxHQUFHO0tBQy9CLE1BQU0sS0FBSyxLQUFLO0tBQ2hCLE1BQU0sS0FBSyxLQUFLO0tBQ2hCLE1BQU0sS0FBSyxLQUFLO0tBQ2hCLE1BQU0sTUFBTSxLQUFLLEtBQUssR0FBRztLQUN6QixNQUFNLE1BQU0sS0FBSyxLQUFLLEdBQUc7S0FDekIsTUFBTSxNQUFNLEtBQUssS0FBSyxHQUFHO0tBQ3pCLE1BQU0sTUFBTSxLQUFLLEtBQUssR0FBRztBQUN6QixZQUFPLElBQUksTUFBTSxLQUFLLEtBQUssS0FBSztJQUNuQztJQUNELE1BQU0sSUFBSSxLQUFLLEtBQUssR0FBRztJQUN2QixNQUFNLElBQUksS0FBSyxLQUFLLEdBQUc7SUFDdkIsTUFBTSxJQUFJLEtBQUssS0FBSyxJQUFJLEdBQUc7SUFDM0IsTUFBTSxJQUFJLEtBQUssS0FBSyxHQUFHO0lBQ3ZCLE1BQU0sSUFBSSxNQUFNLEtBQUssT0FBTyxLQUFLLE1BQU0sSUFBSSxFQUFFO0lBQzdDLE1BQU0sSUFBSSxJQUFJO0lBQ2QsTUFBTSxLQUFLLElBQUk7SUFDZixNQUFNLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtJQUN6QixNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxLQUFLLEtBQUssS0FBSyxFQUFFO0lBQ3ZCLE1BQU0sS0FBSyxLQUFLLElBQUksRUFBRTtJQUN0QixNQUFNLEtBQUssS0FBSyxJQUFJLEdBQUc7QUFDdkIsV0FBTyxJQUFJLE1BQU0sSUFBSSxJQUFJLElBQUk7R0FDaEM7R0FDRCxTQUFTLE9BQU87QUFDWixXQUFPLEtBQUssSUFBSSxNQUFNLFFBQVEsQ0FBQztHQUNsQztHQUNELEtBQUssR0FBRztBQUNKLFdBQU8sS0FBSyxXQUFXLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxXQUFXO0dBQ3RFO0dBRUQsU0FBUyxRQUFRO0lBQ2IsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLEtBQUssS0FBSyxjQUFjLFFBQVEsWUFBWSxDQUFDO0FBQzlELFdBQU8sTUFBTSxXQUFXLENBQUMsR0FBRyxDQUFFLEVBQUMsQ0FBQztHQUNuQztHQUtELGVBQWUsUUFBUTtJQUNuQixJQUFJLElBQUksVUFBVSxPQUFPO0FBQ3pCLFFBQUksTUFBTSxLQUNOLFFBQU87QUFDWCxRQUFJLEtBQUssT0FBTyxFQUFFLElBQUksTUFBTSxLQUN4QixRQUFPO0FBQ1gsUUFBSSxLQUFLLE9BQU8sRUFBRSxDQUNkLFFBQU8sS0FBSyxLQUFLLEVBQUUsQ0FBQztBQUN4QixXQUFPLEtBQUssYUFBYSxNQUFNLEVBQUU7R0FDcEM7R0FLRCxlQUFlO0FBQ1gsV0FBTyxLQUFLLGVBQWUsU0FBUyxDQUFDLEtBQUs7R0FDN0M7R0FHRCxnQkFBZ0I7QUFDWixXQUFPLEtBQUssYUFBYSxNQUFNLFlBQVksQ0FBQyxLQUFLO0dBQ3BEO0dBR0QsU0FBUyxJQUFJO0lBQ1QsTUFBTSxFQUFFLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUc7SUFDaEMsTUFBTSxNQUFNLEtBQUssS0FBSztBQUN0QixRQUFJLE1BQU0sS0FDTixNQUFLLE1BQU0sT0FBTyxJQUFJLElBQUksRUFBRTtJQUNoQyxNQUFNLEtBQUssS0FBSyxJQUFJLEdBQUc7SUFDdkIsTUFBTSxLQUFLLEtBQUssSUFBSSxHQUFHO0lBQ3ZCLE1BQU0sS0FBSyxLQUFLLElBQUksR0FBRztBQUN2QixRQUFJLElBQ0EsUUFBTztLQUFFLEdBQUc7S0FBTSxHQUFHO0lBQU07QUFDL0IsUUFBSSxPQUFPLEtBQ1AsT0FBTSxJQUFJLE1BQU07QUFDcEIsV0FBTztLQUFFLEdBQUc7S0FBSSxHQUFHO0lBQUk7R0FDMUI7R0FDRCxnQkFBZ0I7SUFDWixNQUFNLEVBQUUsR0FBRyxXQUFXLEdBQUc7QUFDekIsUUFBSSxjQUFjLEtBQ2QsUUFBTztBQUNYLFdBQU8sS0FBSyxlQUFlLFVBQVU7R0FDeEM7R0FHRCxPQUFPLFFBQVEsS0FBSyxTQUFTLE9BQU87SUFDaEMsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHO0lBQ2pCLE1BQU0sTUFBTSxJQUFJO0FBQ2hCLFVBQU0sWUFBWSxZQUFZLEtBQUssSUFBSTtJQUN2QyxNQUFNLFNBQVMsSUFBSSxPQUFPO0lBQzFCLE1BQU0sV0FBVyxJQUFJLE1BQU07QUFDM0IsV0FBTyxNQUFNLEtBQUssV0FBVztJQUM3QixNQUFNLElBQUksZ0JBQWdCLE9BQU87QUFDakMsUUFBSSxNQUFNLE1BQU0sQ0FDZixXQUVPLE9BQ0EsZUFBYyxHQUFHLEtBQUs7SUFFdEIsZUFBYyxHQUFHLElBQUksTUFBTTtJQUVuQyxNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxJQUFJLEtBQUssS0FBSyxLQUFLO0lBQ3pCLE1BQU0sSUFBSSxLQUFLLElBQUksS0FBSyxFQUFFO0lBQzFCLElBQUksRUFBRSxTQUFTLE9BQU8sR0FBRyxHQUFHLFNBQVMsR0FBRyxFQUFFO0FBQzFDLFNBQUssUUFDRCxPQUFNLElBQUksTUFBTTtJQUNwQixNQUFNLFVBQVUsSUFBSSxVQUFVO0lBQzlCLE1BQU0saUJBQWlCLFdBQVcsU0FBUztBQUMzQyxTQUFLLFVBQVUsTUFBTSxRQUFRLGNBQ3pCLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFFBQUksa0JBQWtCLE9BQ2xCLEtBQUksTUFBTSxFQUFFO0FBQ2hCLFdBQU8sTUFBTSxXQUFXO0tBQUU7S0FBRztJQUFHLEVBQUM7R0FDcEM7R0FDRCxPQUFPLGVBQWUsU0FBUztBQUMzQixXQUFPLHFCQUFxQixRQUFRLENBQUM7R0FDeEM7R0FDRCxhQUFhO0lBQ1QsTUFBTSxFQUFFLEdBQUcsR0FBRyxHQUFHLEtBQUssVUFBVTtJQUNoQyxNQUFNLFNBQVMsZ0JBQWdCLEdBQUcsSUFBSSxNQUFNO0FBQzVDLFdBQU8sT0FBTyxTQUFTLE1BQU0sSUFBSSxPQUFPLE1BQU07QUFDOUMsV0FBTztHQUNWO0dBQ0QsUUFBUTtBQUNKLFdBQU8sV0FBVyxLQUFLLFlBQVksQ0FBQztHQUN2QztFQUNKO0FBQ0QsUUFBTSxPQUFPLElBQUksTUFBTSxNQUFNLElBQUksTUFBTSxJQUFJLE1BQU0sS0FBSyxNQUFNLEtBQUssTUFBTSxHQUFHO0FBQzFFLFFBQU0sT0FBTyxJQUFJLE1BQU0sTUFBTSxNQUFNLE1BQU07RUFDekMsTUFBTSxFQUFFLE1BQU0sR0FBRyxNQUFNLEdBQUcsR0FBRztFQUM3QixNQUFNLE9BQU8sS0FBSyxPQUFPLGNBQWMsRUFBRTtFQUN6QyxTQUFTLEtBQUssR0FBRztBQUNiLFVBQU8sSUFBSSxHQUFHLFlBQVk7RUFDN0I7RUFDRCxTQUFTLFFBQVEsTUFBTTtBQUNuQixVQUFPLEtBQUssZ0JBQWdCLEtBQUssQ0FBQztFQUNyQztFQUNELFNBQVMscUJBQXFCLEtBQUs7R0FDL0IsTUFBTSxNQUFNO0FBQ1osU0FBTSxZQUFZLGVBQWUsS0FBSyxJQUFJO0dBQzFDLE1BQU0sU0FBUyxZQUFZLHNCQUFzQixNQUFNLElBQUksRUFBRSxJQUFJLElBQUk7R0FDckUsTUFBTSxPQUFPLG1CQUFtQixPQUFPLE1BQU0sR0FBRyxJQUFJLENBQUM7R0FDckQsTUFBTSxTQUFTLE9BQU8sTUFBTSxLQUFLLElBQUksSUFBSTtHQUN6QyxNQUFNLFNBQVMsUUFBUSxLQUFLO0dBQzVCLE1BQU0sUUFBUSxFQUFFLFNBQVMsT0FBTztHQUNoQyxNQUFNLGFBQWEsTUFBTSxZQUFZO0FBQ3JDLFVBQU87SUFBRTtJQUFNO0lBQVE7SUFBUTtJQUFPO0dBQVk7RUFDckQ7RUFDRCxTQUFTLGFBQWEsU0FBUztBQUMzQixVQUFPLHFCQUFxQixRQUFRLENBQUM7RUFDeEM7RUFDRCxTQUFTLG1CQUFtQixVQUFVLElBQUksY0FBYyxHQUFHLE1BQU07R0FDN0QsTUFBTSxNQUFNLGFBQWEsR0FBRyxLQUFLO0FBQ2pDLFVBQU8sUUFBUSxNQUFNLE9BQU8sS0FBSyxZQUFZLFdBQVcsUUFBUSxJQUFJLFFBQVEsQ0FBQyxDQUFDO0VBQ2pGO0VBQ0QsU0FBUyxLQUFLLEtBQUssU0FBUyxVQUFVLENBQUUsR0FBRTtBQUN0QyxTQUFNLFlBQVksV0FBVyxJQUFJO0FBQ2pDLE9BQUksUUFDQSxPQUFNLFFBQVEsSUFBSTtHQUN0QixNQUFNLEVBQUUsUUFBUSxRQUFRLFlBQVksR0FBRyxxQkFBcUIsUUFBUTtHQUNwRSxNQUFNLElBQUksbUJBQW1CLFFBQVEsU0FBUyxRQUFRLElBQUk7R0FDMUQsTUFBTSxJQUFJLEVBQUUsU0FBUyxFQUFFLENBQUMsWUFBWTtHQUNwQyxNQUFNLElBQUksbUJBQW1CLFFBQVEsU0FBUyxHQUFHLFlBQVksSUFBSTtHQUNqRSxNQUFNLElBQUksS0FBSyxJQUFJLElBQUksT0FBTztBQUM5QixhQUFVLEVBQUU7R0FDWixNQUFNLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixHQUFHLElBQUksTUFBTSxDQUFDO0FBQzFELFVBQU8sWUFBWSxVQUFVLEtBQUssY0FBYyxFQUFFO0VBQ3JEO0VBQ0QsTUFBTSxhQUFhO0VBQ25CLFNBQVMsT0FBTyxLQUFLLEtBQUssV0FBVyxVQUFVLFlBQVk7R0FDdkQsTUFBTSxFQUFFLFNBQVMsUUFBUSxHQUFHO0dBQzVCLE1BQU0sTUFBTSxJQUFJO0FBQ2hCLFNBQU0sWUFBWSxhQUFhLEtBQUssSUFBSSxJQUFJO0FBQzVDLFNBQU0sWUFBWSxXQUFXLElBQUk7QUFDakMsT0FBSSxRQUNBLE9BQU0sUUFBUSxJQUFJO0dBQ3RCLE1BQU0sSUFBSSxnQkFBZ0IsSUFBSSxNQUFNLEtBQUssSUFBSSxJQUFJLENBQUM7R0FDbEQsSUFBSSxHQUFHLEdBQUc7QUFDVixPQUFJO0FBQ0EsUUFBSSxNQUFNLFFBQVEsV0FBVyxPQUFPO0FBQ3BDLFFBQUksTUFBTSxRQUFRLElBQUksTUFBTSxHQUFHLElBQUksRUFBRSxPQUFPO0FBQzVDLFNBQUssRUFBRSxlQUFlLEVBQUU7R0FDM0IsU0FDTSxPQUFPO0FBQ1YsV0FBTztHQUNWO0FBQ0QsUUFBSyxVQUFVLEVBQUUsY0FBYyxDQUMzQixRQUFPO0dBQ1gsTUFBTSxJQUFJLG1CQUFtQixTQUFTLEVBQUUsWUFBWSxFQUFFLEVBQUUsWUFBWSxFQUFFLElBQUk7R0FDMUUsTUFBTSxNQUFNLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRSxDQUFDO0FBQ3RDLFVBQU8sSUFBSSxTQUFTLEdBQUcsQ0FBQyxlQUFlLENBQUMsT0FBTyxNQUFNLEtBQUs7RUFDN0Q7QUFDRCxJQUFFLGVBQWUsRUFBRTtFQUNuQixNQUFNLFFBQVE7R0FDVjtHQUVBLGtCQUFrQixNQUFNLGFBQWEsSUFBSSxNQUFNO0dBTy9DLFdBQVcsYUFBYSxHQUFHLFFBQVEsTUFBTSxNQUFNO0FBQzNDLFVBQU0sZUFBZSxXQUFXO0FBQ2hDLFVBQU0sU0FBUyxPQUFPLEVBQUUsQ0FBQztBQUN6QixXQUFPO0dBQ1Y7RUFDSjtBQUNELFNBQU87R0FDSDtHQUNBO0dBQ0E7R0FDQTtHQUNBLGVBQWU7R0FDZjtFQUNIO0NBQ0o7Q0FFRCxJQUFJLE9BQU8sT0FBTyxFQUFFO0NBQ3BCLElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsU0FBUyxjQUFjLE9BQU87QUFDMUIsaUJBQWUsT0FBTyxFQUNsQixHQUFHLFNBQ04sR0FBRTtHQUNDLGdCQUFnQjtHQUNoQixhQUFhO0dBQ2IsbUJBQW1CO0dBQ25CLFFBQVE7R0FDUixZQUFZO0dBQ1osSUFBSTtFQUNQLEVBQUM7QUFDRixTQUFPLE9BQU8sT0FBTyxFQUFFLEdBQUcsTUFBTyxFQUFDO0NBQ3JDO0NBQ0QsU0FBUyxXQUFXLFVBQVU7RUFDMUIsTUFBTSxRQUFRLGNBQWMsU0FBUztFQUNyQyxNQUFNLEVBQUUsR0FBRyxHQUFHO0VBQ2QsTUFBTSxPQUFPLENBQUMsTUFBTSxJQUFJLEdBQUcsRUFBRTtFQUM3QixNQUFNLGlCQUFpQixNQUFNO0VBQzdCLE1BQU0sa0JBQWtCLEtBQUssS0FBSyxpQkFBaUIsRUFBRTtFQUNyRCxNQUFNLFdBQVcsTUFBTTtFQUN2QixNQUFNLHFCQUFxQixNQUFNLHNCQUFzQixDQUFDLFdBQVc7RUFDbkUsTUFBTSxhQUFhLE1BQU0sZUFBZSxDQUFDLE1BQU0sSUFBSSxHQUFHLElBQUksT0FBTyxFQUFFLEVBQUUsRUFBRTtFQUN2RSxTQUFTLE1BQU0sTUFBTSxLQUFLLEtBQUs7R0FDM0IsTUFBTSxRQUFRLEtBQUssUUFBUSxNQUFNLEtBQUs7QUFDdEMsU0FBTSxLQUFLLE1BQU0sTUFBTTtBQUN2QixTQUFNLEtBQUssTUFBTSxNQUFNO0FBQ3ZCLFVBQU8sQ0FBQyxLQUFLLEdBQUk7RUFDcEI7RUFDRCxTQUFTLG1CQUFtQixHQUFHO0FBQzNCLGNBQVcsTUFBTSxZQUFZLFFBQVEsS0FBSyxJQUFJLEVBQzFDLFFBQU87QUFDWCxTQUFNLElBQUksTUFBTTtFQUNuQjtFQUNELE1BQU0sT0FBTyxNQUFNLElBQUksT0FBTyxFQUFFLElBQUksT0FBTyxFQUFFO0VBQzdDLFNBQVMsaUJBQWlCLFFBQVEsUUFBUTtHQUN0QyxNQUFNLElBQUksbUJBQW1CLE9BQU87R0FDcEMsTUFBTSxJQUFJLG1CQUFtQixPQUFPO0dBQ3BDLE1BQU0sTUFBTTtHQUNaLElBQUksTUFBTTtHQUNWLElBQUksTUFBTTtHQUNWLElBQUksTUFBTTtHQUNWLElBQUksTUFBTTtHQUNWLElBQUksT0FBTztHQUNYLElBQUk7QUFDSixRQUFLLElBQUlDLE1BQUksT0FBTyxpQkFBaUIsRUFBRSxFQUFFQSxPQUFLLE1BQU1BLE9BQUs7SUFDckQsTUFBTSxNQUFNLEtBQUtBLE1BQUk7QUFDckIsWUFBUTtBQUNSLFNBQUssTUFBTSxNQUFNLEtBQUssSUFBSTtBQUMxQixVQUFNLEdBQUc7QUFDVCxVQUFNLEdBQUc7QUFDVCxTQUFLLE1BQU0sTUFBTSxLQUFLLElBQUk7QUFDMUIsVUFBTSxHQUFHO0FBQ1QsVUFBTSxHQUFHO0FBQ1QsV0FBTztJQUNQLE1BQU0sSUFBSSxNQUFNO0lBQ2hCLE1BQU0sS0FBSyxLQUFLLElBQUksRUFBRTtJQUN0QixNQUFNLElBQUksTUFBTTtJQUNoQixNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxJQUFJLEtBQUs7SUFDZixNQUFNLElBQUksTUFBTTtJQUNoQixNQUFNLElBQUksTUFBTTtJQUNoQixNQUFNLEtBQUssS0FBSyxJQUFJLEVBQUU7SUFDdEIsTUFBTSxLQUFLLEtBQUssSUFBSSxFQUFFO0lBQ3RCLE1BQU0sT0FBTyxLQUFLO0lBQ2xCLE1BQU0sUUFBUSxLQUFLO0FBQ25CLFVBQU0sS0FBSyxPQUFPLEtBQUs7QUFDdkIsVUFBTSxLQUFLLE1BQU0sS0FBSyxRQUFRLE1BQU0sQ0FBQztBQUNyQyxVQUFNLEtBQUssS0FBSyxHQUFHO0FBQ25CLFVBQU0sS0FBSyxLQUFLLEtBQUssS0FBSyxNQUFNLEVBQUUsRUFBRTtHQUN2QztBQUNELFFBQUssTUFBTSxNQUFNLEtBQUssSUFBSTtBQUMxQixTQUFNLEdBQUc7QUFDVCxTQUFNLEdBQUc7QUFDVCxRQUFLLE1BQU0sTUFBTSxLQUFLLElBQUk7QUFDMUIsU0FBTSxHQUFHO0FBQ1QsU0FBTSxHQUFHO0dBQ1QsTUFBTSxLQUFLLFdBQVcsSUFBSTtBQUMxQixVQUFPLEtBQUssTUFBTSxHQUFHO0VBQ3hCO0VBQ0QsU0FBUyxrQkFBa0IsR0FBRztBQUMxQixVQUFPLGdCQUFnQixLQUFLLEVBQUUsRUFBRSxnQkFBZ0I7RUFDbkQ7RUFDRCxTQUFTLGtCQUFrQixNQUFNO0dBQzdCLE1BQU0sSUFBSSxZQUFZLGdCQUFnQixNQUFNLGdCQUFnQjtBQUM1RCxPQUFJLGFBQWEsR0FDYixHQUFFLE9BQU87QUFDYixVQUFPLGdCQUFnQixFQUFFO0VBQzVCO0VBQ0QsU0FBUyxhQUFhLEdBQUc7R0FDckIsTUFBTSxTQUFTLFlBQVksVUFBVSxFQUFFO0dBQ3ZDLE1BQU0sTUFBTSxPQUFPO0FBQ25CLE9BQUksUUFBUSxtQkFBbUIsUUFBUSxTQUNuQyxPQUFNLElBQUksT0FBTyxXQUFXLGdCQUFnQixNQUFNLFNBQVMsY0FBYyxJQUFJO0FBQ2pGLFVBQU8sZ0JBQWdCLG1CQUFtQixPQUFPLENBQUM7RUFDckQ7RUFDRCxTQUFTLFdBQVcsUUFBUSxHQUFHO0dBQzNCLE1BQU0sU0FBUyxrQkFBa0IsRUFBRTtHQUNuQyxNQUFNLFVBQVUsYUFBYSxPQUFPO0dBQ3BDLE1BQU0sS0FBSyxpQkFBaUIsUUFBUSxRQUFRO0FBQzVDLE9BQUksT0FBTyxLQUNQLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFVBQU8sa0JBQWtCLEdBQUc7RUFDL0I7RUFDRCxNQUFNLFVBQVUsa0JBQWtCLE1BQU0sR0FBRztFQUMzQyxTQUFTLGVBQWUsUUFBUTtBQUM1QixVQUFPLFdBQVcsUUFBUSxRQUFRO0VBQ3JDO0FBQ0QsU0FBTztHQUNIO0dBQ0E7R0FDQSxpQkFBaUIsQ0FBQyxZQUFZLGNBQWMsV0FBVyxZQUFZLFVBQVU7R0FDN0UsY0FBYyxDQUFDLGVBQWUsZUFBZSxXQUFXO0dBQ3hELE9BQU8sRUFBRSxrQkFBa0IsTUFBTSxNQUFNLFlBQVksTUFBTSxZQUFZLENBQUU7R0FDdkU7RUFDSDtDQUNKO0NBRUQsSUFBSSxZQUFZLE9BQU8sZ0ZBQWdGO0NBQ3ZHLElBQUksa0JBQWtCLE9BQU8sZ0ZBQWdGO0NBQzdHLElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsSUFBSSxPQUFPLE9BQU8sRUFBRTtDQUNwQixJQUFJLE9BQU8sT0FBTyxFQUFFO0NBQ3BCLElBQUksT0FBTyxPQUFPLEVBQUU7Q0FDcEIsSUFBSSxPQUFPLE9BQU8sR0FBRztDQUNyQixJQUFJLE9BQU8sT0FBTyxHQUFHO0NBQ3JCLElBQUksT0FBTyxPQUFPLEdBQUc7Q0FDckIsSUFBSSxPQUFPLE9BQU8sR0FBRztDQUNyQixTQUFTLG9CQUFvQixHQUFHO0VBQzVCLE1BQU0sSUFBSTtFQUNWLE1BQU0sS0FBSyxJQUFJLElBQUk7RUFDbkIsTUFBTSxLQUFLLEtBQUssSUFBSTtFQUNwQixNQUFNLEtBQUssS0FBSyxJQUFJLE1BQU0sRUFBRSxHQUFHLEtBQUs7RUFDcEMsTUFBTSxLQUFLLEtBQUssSUFBSSxNQUFNLEVBQUUsR0FBRyxJQUFJO0VBQ25DLE1BQU0sTUFBTSxLQUFLLElBQUksTUFBTSxFQUFFLEdBQUcsS0FBSztFQUNyQyxNQUFNLE1BQU0sS0FBSyxLQUFLLE1BQU0sRUFBRSxHQUFHLE1BQU07RUFDdkMsTUFBTSxNQUFNLEtBQUssS0FBSyxNQUFNLEVBQUUsR0FBRyxNQUFNO0VBQ3ZDLE1BQU0sTUFBTSxLQUFLLEtBQUssTUFBTSxFQUFFLEdBQUcsTUFBTTtFQUN2QyxNQUFNLE9BQU8sS0FBSyxLQUFLLE1BQU0sRUFBRSxHQUFHLE1BQU07RUFDeEMsTUFBTSxPQUFPLEtBQUssTUFBTSxNQUFNLEVBQUUsR0FBRyxNQUFNO0VBQ3pDLE1BQU0sT0FBTyxLQUFLLE1BQU0sTUFBTSxFQUFFLEdBQUcsTUFBTTtFQUN6QyxNQUFNLFlBQVksS0FBSyxNQUFNLE1BQU0sRUFBRSxHQUFHLElBQUk7QUFDNUMsU0FBTztHQUFFO0dBQVc7RUFBSTtDQUMzQjtDQUNELFNBQVMsa0JBQWtCLFFBQVE7QUFDL0IsU0FBTyxNQUFNO0FBQ2IsU0FBTyxPQUFPO0FBQ2QsU0FBTyxPQUFPO0FBQ2QsU0FBTztDQUNWO0NBQ0QsU0FBUyxRQUFRLEdBQUcsR0FBRztFQUNuQixNQUFNLElBQUk7RUFDVixNQUFNLEtBQUssSUFBSSxJQUFJLElBQUksR0FBRyxFQUFFO0VBQzVCLE1BQU0sS0FBSyxJQUFJLEtBQUssS0FBSyxHQUFHLEVBQUU7RUFDOUIsTUFBTSxPQUFPLG9CQUFvQixJQUFJLEdBQUcsQ0FBQztFQUN6QyxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssTUFBTSxFQUFFO0VBQzdCLE1BQU0sTUFBTSxJQUFJLElBQUksSUFBSSxHQUFHLEVBQUU7RUFDN0IsTUFBTSxRQUFRO0VBQ2QsTUFBTSxRQUFRLElBQUksSUFBSSxpQkFBaUIsRUFBRTtFQUN6QyxNQUFNLFdBQVcsUUFBUTtFQUN6QixNQUFNLFdBQVcsUUFBUSxLQUFLLEdBQUcsRUFBRTtFQUNuQyxNQUFNLFNBQVMsUUFBUSxLQUFLLElBQUksaUJBQWlCLEVBQUU7QUFDbkQsTUFBSSxTQUNBLEtBQUk7QUFDUixNQUFJLFlBQVksT0FDWixLQUFJO0FBQ1IsTUFBSSxhQUFhLEdBQUcsRUFBRSxDQUNsQixLQUFJLEtBQUssR0FBRyxFQUFFO0FBQ2xCLFNBQU87R0FBRSxTQUFTLFlBQVk7R0FBVSxPQUFPO0VBQUc7Q0FDckQ7Q0FDRCxJQUFJLEtBQUssTUFBTSxnQkFBZ0IsR0FBRyxLQUFLO0NBQ3ZDLElBQUksa0JBQWtCO0VBRWxCLEdBQUcsT0FBTyxHQUFHO0VBSWIsR0FBRyxPQUFPLGdGQUFnRjtFQUUxRjtFQUdBLEdBQUcsT0FBTywrRUFBK0U7RUFFekYsR0FBRyxPQUFPLEVBQUU7RUFFWixJQUFJLE9BQU8sZ0ZBQWdGO0VBQzNGLElBQUksT0FBTyxnRkFBZ0Y7RUFDM0YsTUFBTUY7RUFDTjtFQUNBO0VBSUE7Q0FDSDtDQUNELFNBQVMsZUFBZSxNQUFNLEtBQUssUUFBUTtBQUN2QyxNQUFJLElBQUksU0FBUyxJQUNiLE9BQU0sSUFBSSxNQUFNO0FBQ3BCLFNBQU8sWUFBWSxZQUFZLG1DQUFtQyxFQUFFLElBQUksV0FBVyxDQUFDLFNBQVMsSUFBSSxHQUFHLElBQUksTUFBTyxJQUFHLEtBQUssS0FBSztDQUMvSDtDQUNELElBQUksNkJBQTZCLGVBQWU7RUFDNUMsR0FBRztFQUNILFFBQVE7Q0FDWCxFQUFDO0NBQ0YsSUFBSSw0QkFBNEIsZUFBZTtFQUMzQyxHQUFHO0VBQ0gsUUFBUTtFQUNSLFNBQVNBO0NBQ1osRUFBQztDQUNGLElBQUlELDJCQUF5QixDQUFDLE1BQU0sV0FBVztFQUMzQyxHQUFHO0VBQ0gsR0FBRyxPQUFPLE9BQU87RUFDakIsZ0JBQWdCO0VBRWhCLGFBQWE7RUFDYixJQUFJLE9BQU8sRUFBRTtFQUNiLFlBQVksQ0FBQyxNQUFNO0dBQ2YsTUFBTSxJQUFJO0dBQ1YsTUFBTSxFQUFFLFdBQVcsSUFBSSxHQUFHLG9CQUFvQixFQUFFO0FBQ2hELFVBQU8sSUFBSSxLQUFLLFdBQVcsT0FBTyxFQUFFLEVBQUUsRUFBRSxHQUFHLElBQUksRUFBRTtFQUNwRDtFQUNEO0VBQ0E7Q0FDSCxFQUFDLEdBQUc7Q0FDTCxJQUFJLFdBQVcsR0FBRyxRQUFRLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBRTtDQUNoRCxJQUFJLFVBQVUsR0FBRyxJQUFJLE1BQU0sUUFBUTtDQUNuQyxJQUFJLFVBQVUsR0FBRyxLQUFLLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztDQUNyQyxJQUFJLFdBQVcsR0FBRyxRQUFRLE9BQU8sRUFBRSxJQUFJLE9BQU8sRUFBRTtDQUNoRCxJQUFJLFNBQVMsT0FBTyxPQUFPO0NBQzNCLElBQUksa0JBQWtCLFdBQVcsSUFBSSxHQUFHLElBQUksT0FBTyxPQUFPLENBQUMsQ0FBQztDQUM1RCxJQUFJLG9CQUFvQixPQUFPLGdGQUFnRjtDQUMvRyxJQUFJLG9CQUFvQixPQUFPLGdGQUFnRjtDQUMvRyxJQUFJLGlCQUFpQixPQUFPLCtFQUErRTtDQUMzRyxJQUFJLGlCQUFpQixPQUFPLGdGQUFnRjtDQUM1RyxJQUFJLFdBQVcsT0FBTyxxRUFBcUU7QUFDM0YsUUFBTyxhQUFhLGNBQWM7QUFDckMsSUFBRztNQU9TLFNBQVMsWUFBWTs7OztBQ3hrRGxDLE1BQU0sdUJBQXVCO0FBSXRCLFNBQVMscUJBQXFCO0NBR2pDLE1BQU0sYUFBYSxnQkFBZ0IsT0FBTyxtQkFBbUIscUJBQXFCLENBQUM7Q0FDbkYsTUFBTSxZQUFZLGdCQUFnQixXQUFXO0FBQzdDLFFBQU87RUFDSDtFQUNBO0NBQ0g7QUFDSjtBQVFNLFNBQVMsZUFBZSwwQkFBMEIscUJBQXFCLDRCQUE0QjtDQUN0RyxNQUFNLHdCQUF3QixxQkFBcUIscUJBQXFCLDJCQUEyQjtDQUNuRyxNQUFNLG1CQUFtQixxQkFBcUIsMEJBQTBCLDJCQUEyQjtBQUNuRyxRQUFPO0VBQUU7RUFBdUI7Q0FBa0I7QUFDckQ7QUFRTSxTQUFTLGVBQWUseUJBQXlCLG9CQUFvQiw2QkFBNkI7Q0FDckcsTUFBTSx3QkFBd0IscUJBQXFCLDZCQUE2QixtQkFBbUI7Q0FDbkcsTUFBTSxtQkFBbUIscUJBQXFCLDZCQUE2Qix3QkFBd0I7QUFDbkcsUUFBTztFQUFFO0VBQXVCO0NBQWtCO0FBQ3JEOzs7O0FBSUQsU0FBUyxxQkFBcUIsaUJBQWlCLGlCQUFpQjtDQUM1RCxNQUFNLGVBQWUsT0FBTyxnQkFBZ0IsaUJBQWlCLGdCQUFnQjtBQUU3RSxLQUFJLGFBQWEsTUFBTSxDQUFDLFFBQVEsUUFBUSxFQUFFLENBQ3RDLE9BQU0sSUFBSSxNQUFNO0FBRXBCLFFBQU87QUFDVjtBQUVELFNBQVMsZ0JBQWdCLFlBQVk7QUFFakMsWUFBVyxXQUFXLFNBQVMsS0FBTSxXQUFXLFdBQVcsU0FBUyxLQUFLLE1BQWM7QUFFdkYsWUFBVyxNQUFNO0FBQ2pCLFFBQU87QUFDVjtBQUNELFNBQVMsZ0JBQWdCLFlBQVk7QUFDakMsUUFBTyxPQUFPLGFBQWEsV0FBVztBQUN6Qzs7OztBQzlERCxTQUFTLFNBQVM7QUFDZCxNQUFLLDhCQUE4QjtBQUNuQyxNQUFLLGtCQUFrQjtBQUN2QixNQUFLLHNCQUFzQjtBQUczQixNQUFLLHFCQUFxQjtBQUMxQixNQUFLLFNBQVM7RUFDVjtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7Q0FDM0I7QUFDRCxNQUFLLFNBQVM7RUFDVjtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtFQUFZO0VBQ2hEO0VBQVk7RUFBWTtFQUFZO0VBQVk7RUFDaEQ7RUFBWTtFQUFZO0VBQVk7RUFBWTtFQUNoRDtFQUFZO0VBQVk7RUFBWTtDQUN2QztBQUNELE1BQUssc0JBQXNCO0VBQ3ZCO0VBQVk7RUFBWTtFQUN4QjtFQUFZO0VBQVk7Q0FDM0I7QUFDRCxNQUFLLGNBQWM7RUFDZjtFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQ2xEO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQzVEO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQzVEO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQzVEO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQUs7RUFBSztFQUFLO0VBQzVEO0NBQ0g7QUFDRCxNQUFLLFdBQVc7RUFDWjtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQ3BEO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFDaEU7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBRztFQUMvRDtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQ2hFO0VBQUc7RUFBRztFQUFHO0VBQUc7RUFBRztFQUFHO0VBQUc7RUFBRztFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQ2hFO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFDaEU7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUNoRTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtFQUFJO0VBQUk7RUFBSTtDQUN2QztBQUNELE1BQUs7QUFDTCxNQUFLO0FBQ0wsTUFBSztBQUNMLE1BQUs7QUFDUjtBQUNELE9BQU8sVUFBVSxVQUFVLFNBQVUsR0FBRztDQUNwQyxJQUFJLE1BQU07QUFDVixLQUFJO0VBQ0EsSUFBSSxJQUFJLEVBQUUsV0FBVyxFQUFFO0NBQzFCLFNBQ00sS0FBSztBQUNSLE1BQUk7Q0FDUDtBQUNELEtBQUksSUFBSSxJQUNKLFFBQU8sT0FBUSxJQUFJO0lBR25CLFFBQU87QUFFZDtBQUNELE9BQU8sVUFBVSxnQkFBZ0IsU0FBVSxHQUFHLEtBQUs7Q0FDL0MsSUFBSSxNQUFNO0NBQ1YsSUFBSSxLQUFLLENBQUU7Q0FDWCxJQUFJO0NBQ0osSUFBSTtBQUNKLEtBQUksT0FBTyxLQUFLLE1BQU0sRUFBRSxPQUNwQixPQUFNO0FBRVYsUUFBTyxNQUFNLEtBQUs7QUFDZCxPQUFLLEVBQUUsU0FBUztBQUNoQixLQUFHLEtBQUssS0FBSyxZQUFhLE1BQU0sSUFBSyxJQUFNO0FBQzNDLFFBQU0sS0FBSyxNQUFTO0FBQ3BCLE1BQUksT0FBTyxLQUFLO0FBQ1osTUFBRyxLQUFLLEtBQUssWUFBWSxLQUFLLElBQU07QUFDcEM7RUFDSDtBQUNELE9BQUssRUFBRSxTQUFTO0FBQ2hCLFFBQU8sTUFBTSxJQUFLO0FBQ2xCLEtBQUcsS0FBSyxLQUFLLFlBQVksS0FBSyxJQUFNO0FBQ3BDLFFBQU0sS0FBSyxPQUFTO0FBQ3BCLE1BQUksT0FBTyxLQUFLO0FBQ1osTUFBRyxLQUFLLEtBQUssWUFBWSxLQUFLLElBQU07QUFDcEM7RUFDSDtBQUNELE9BQUssRUFBRSxTQUFTO0FBQ2hCLFFBQU8sTUFBTSxJQUFLO0FBQ2xCLEtBQUcsS0FBSyxLQUFLLFlBQVksS0FBSyxJQUFNO0FBQ3BDLEtBQUcsS0FBSyxLQUFLLFlBQVksS0FBSyxJQUFNO0NBQ3ZDO0FBQ0QsUUFBTyxHQUFHLEtBQUssR0FBRztBQUNyQjtBQUNELE9BQU8sVUFBVSxTQUFTLFNBQVUsR0FBRztDQUNuQyxJQUFJLE9BQU8sRUFBRSxXQUFXLEVBQUU7QUFDMUIsS0FBSSxPQUFPLEtBQUssT0FBTyxLQUFLLFNBQVMsT0FDakMsUUFBTztBQUVYLFFBQU8sS0FBSyxTQUFTO0FBQ3hCO0FBQ0QsT0FBTyxVQUFVLGdCQUFnQixTQUFVLEdBQUcsU0FBUztDQUNuRCxJQUFJLE1BQU07Q0FDVixJQUFJLE9BQU8sRUFBRTtDQUNiLElBQUksT0FBTztDQUNYLElBQUksS0FBSyxDQUFFO0NBQ1gsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJO0FBQ3BCLEtBQUksV0FBVyxFQUNYLE9BQU07QUFFVixRQUFPLE1BQU0sT0FBTyxLQUFLLE9BQU8sU0FBUztBQUNyQyxPQUFLLEtBQUssT0FBTyxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ2pDLE9BQUssS0FBSyxPQUFPLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFDakMsTUFBSSxNQUFNLE1BQU0sTUFBTSxHQUNsQjtBQUVKLE1BQUksS0FBSyxRQUFRLE1BQU0sRUFBRTtBQUN6QixRQUFNLEtBQUssT0FBUztBQUNwQixLQUFHLEtBQUssT0FBTyxhQUFhLEVBQUUsQ0FBQztBQUMvQixNQUFJLEVBQUUsUUFBUSxXQUFXLE9BQU8sS0FDNUI7QUFFSixPQUFLLEtBQUssT0FBTyxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ2pDLE1BQUksTUFBTSxHQUNOO0FBRUosTUFBSSxLQUFLLFNBQVMsS0FBSyxPQUFTLEVBQUU7QUFDbEMsUUFBTSxLQUFLLE9BQVM7QUFDcEIsS0FBRyxLQUFLLE9BQU8sYUFBYSxFQUFFLENBQUM7QUFDL0IsTUFBSSxFQUFFLFFBQVEsV0FBVyxPQUFPLEtBQzVCO0FBRUosT0FBSyxLQUFLLE9BQU8sRUFBRSxPQUFPLE1BQU0sQ0FBQztBQUNqQyxNQUFJLEtBQUssU0FBUyxLQUFLLE1BQVMsRUFBRTtBQUNsQyxPQUFLO0FBQ0wsS0FBRyxLQUFLLE9BQU8sYUFBYSxFQUFFLENBQUM7QUFDL0IsSUFBRTtDQUNMO0NBQ0QsSUFBSSxNQUFNLENBQUU7QUFDWixNQUFLLE1BQU0sR0FBRyxNQUFNLE1BQU0sTUFDdEIsS0FBSSxLQUFLLEtBQUssUUFBUSxHQUFHLEtBQUssQ0FBQztBQUVuQyxRQUFPO0FBQ1Y7QUFDRCxPQUFPLFVBQVUsV0FBVyxTQUFVLElBQUksS0FBSztDQUMzQyxJQUFJO0NBQ0osSUFBSTtDQUNKLElBQUksSUFBSSxHQUFHO0NBQ1gsSUFBSSxJQUFJLEdBQUcsTUFBTTtBQUNqQixNQUFLLEtBQUssRUFBRTtBQUNaLE1BQUssSUFBSSxHQUFHLEtBQUssS0FBSyxzQkFBc0IsSUFBSTtBQUU1QyxNQUFJLEtBQUssRUFBRyxLQUFLLEtBQU07QUFDdkIsT0FBSyxLQUFLLEVBQUUsTUFBVSxLQUFLLEtBQU07QUFDakMsT0FBSyxLQUFLLEVBQUUsTUFBVSxLQUFLLElBQUs7QUFDaEMsT0FBSyxLQUFLLEVBQUUsTUFBUyxJQUFJO0FBQ3pCLE9BQUssSUFBSSxLQUFLLEVBQUUsRUFBRTtBQUVsQixNQUFJLEtBQUssRUFBRyxLQUFLLEtBQU07QUFDdkIsT0FBSyxLQUFLLEVBQUUsTUFBVSxLQUFLLEtBQU07QUFDakMsT0FBSyxLQUFLLEVBQUUsTUFBVSxLQUFLLElBQUs7QUFDaEMsT0FBSyxLQUFLLEVBQUUsTUFBUyxJQUFJO0FBQ3pCLE9BQUssSUFBSSxLQUFLLEVBQUUsRUFBRTtDQUNyQjtBQUNELElBQUcsT0FBTyxJQUFJLEtBQUssRUFBRSxLQUFLLHNCQUFzQjtBQUNoRCxJQUFHLE1BQU0sS0FBSztBQUNqQjtBQUNELE9BQU8sVUFBVSxlQUFlLFNBQVUsTUFBTSxNQUFNO0NBQ2xELElBQUk7Q0FDSixJQUFJLE9BQU87Q0FDWCxJQUFJLE1BQU07QUFDVixNQUFLLElBQUksR0FBRyxJQUFJLEdBQUcsS0FBSztBQUNwQixTQUFRLFFBQVEsSUFBTSxLQUFLLE9BQU87QUFDbEMsU0FBTyxNQUFNLEtBQUssS0FBSztDQUMxQjtBQUNELE1BQUssT0FBTztBQUNaLFFBQU87QUFDVjtBQUNELE9BQU8sVUFBVSxXQUFXLFdBQVk7QUFDcEMsTUFBSyxJQUFJLEtBQUssT0FBTyxPQUFPO0FBQzVCLE1BQUssSUFBSSxLQUFLLE9BQU8sT0FBTztBQUMvQjtBQUNELE9BQU8sVUFBVSxNQUFNLFNBQVUsS0FBSztDQUNsQyxJQUFJO0FBQ0osTUFBSyxPQUFPO0NBQ1osSUFBSSxLQUFLLElBQUksTUFBTSxHQUFZO0NBQy9CLElBQUksT0FBTyxLQUFLLEVBQUU7Q0FDbEIsSUFBSSxPQUFPLEtBQUssRUFBRTtBQUNsQixNQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sSUFDbEIsTUFBSyxFQUFFLEtBQUssS0FBSyxFQUFFLEtBQUssS0FBSyxhQUFhLEtBQUssS0FBSyxLQUFLO0FBRTdELE1BQUssSUFBSSxHQUFHLElBQUksTUFBTSxLQUFLLEdBQUc7QUFDMUIsT0FBSyxTQUFTLElBQUksRUFBRTtBQUNwQixPQUFLLEVBQUUsS0FBSyxHQUFHO0FBQ2YsT0FBSyxFQUFFLElBQUksS0FBSyxHQUFHO0NBQ3RCO0FBQ0QsTUFBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEtBQUssR0FBRztBQUMxQixPQUFLLFNBQVMsSUFBSSxFQUFFO0FBQ3BCLE9BQUssRUFBRSxLQUFLLEdBQUc7QUFDZixPQUFLLEVBQUUsSUFBSSxLQUFLLEdBQUc7Q0FDdEI7QUFDSjtBQUNELE9BQU8sVUFBVSxTQUFTLFNBQVUsTUFBTSxLQUFLO0NBQzNDLElBQUk7QUFDSixNQUFLLE9BQU87Q0FDWixJQUFJLEtBQUssSUFBSSxNQUFNLEdBQVk7Q0FDL0IsSUFBSSxPQUFPLEtBQUssRUFBRTtDQUNsQixJQUFJLE9BQU8sS0FBSyxFQUFFO0FBQ2xCLE1BQUssSUFBSSxHQUFHLElBQUksTUFBTSxJQUNsQixNQUFLLEVBQUUsS0FBSyxLQUFLLEVBQUUsS0FBSyxLQUFLLGFBQWEsS0FBSyxLQUFLLEtBQUs7QUFDN0QsTUFBSyxPQUFPO0FBQ1osTUFBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEtBQUssR0FBRztBQUMxQixLQUFHLE1BQU0sS0FBSyxhQUFhLE1BQU0sS0FBSyxLQUFLO0FBQzNDLEtBQUcsTUFBTSxLQUFLLGFBQWEsTUFBTSxLQUFLLEtBQUs7QUFDM0MsT0FBSyxTQUFTLElBQUksRUFBRTtBQUNwQixPQUFLLEVBQUUsS0FBSyxHQUFHO0FBQ2YsT0FBSyxFQUFFLElBQUksS0FBSyxHQUFHO0NBQ3RCO0FBQ0QsTUFBSyxJQUFJLEdBQUcsSUFBSSxNQUFNLEtBQUssR0FBRztBQUMxQixLQUFHLE1BQU0sS0FBSyxhQUFhLE1BQU0sS0FBSyxLQUFLO0FBQzNDLEtBQUcsTUFBTSxLQUFLLGFBQWEsTUFBTSxLQUFLLEtBQUs7QUFDM0MsT0FBSyxTQUFTLElBQUksRUFBRTtBQUNwQixPQUFLLEVBQUUsS0FBSyxHQUFHO0FBQ2YsT0FBSyxFQUFFLElBQUksS0FBSyxHQUFHO0NBQ3RCO0FBQ0o7QUFFRCxPQUFPLFVBQVUsWUFBWSxTQUFVLFVBQVUsTUFBTSxZQUFZO0NBQy9ELElBQUk7Q0FDSixJQUFJO0NBQ0osSUFBSSxRQUFRLEtBQUssb0JBQW9CLE9BQU87Q0FDNUMsSUFBSSxPQUFPLE1BQU07Q0FDakIsSUFBSTtBQUNKLEtBQUksYUFBYSxLQUFLLGFBQWEsR0FDL0IsT0FBTTtBQUVWLEtBQUksS0FBSyxVQUFVLEtBQUssZ0JBQ3BCLE9BQU07QUFFVixVQUFTLEtBQUs7QUFDZCxlQUFjLEtBQUssTUFBTSxTQUFTLElBQUksR0FBRztBQUN6QyxNQUFLLFVBQVU7QUFDZixNQUFLLE9BQU8sTUFBTSxTQUFTO0NBQzNCLElBQUksTUFBTTtDQUNWLElBQUksSUFBSTtDQUNSLElBQUksZ0JBQWdCO0FBQ3BCLGlCQUFnQixXQUFZO0FBQ3hCLE1BQUksSUFBSSxRQUFRO0dBQ1osSUFBSSxRQUFRLElBQUk7QUFDaEIsVUFBTyxJQUFJLFNBQVM7QUFDaEIsUUFBSSxJQUFJO0FBQ1IsUUFBSSxJQUFJLFNBQVM7QUFDakIsUUFBSSxJQUFJLEtBQUs7R0FDaEI7QUFDRCxVQUFPLGVBQWU7RUFDekIsT0FDSTtBQUNELFFBQUssSUFBSSxHQUFHLElBQUksSUFBSSxJQUNoQixNQUFLLElBQUksR0FBRyxJQUFLLFFBQVEsR0FBSSxJQUN6QixLQUFJLFNBQVMsT0FBTyxLQUFLLEVBQUU7R0FHbkMsSUFBSSxNQUFNLENBQUU7QUFDWixRQUFLLElBQUksR0FBRyxJQUFJLE1BQU0sS0FBSztBQUN2QixRQUFJLEtBQUssSUFBSSxRQUFTLE1BQU0sTUFBTSxLQUFNLElBQUssQ0FBQztBQUM5QyxRQUFJLEtBQUssSUFBSSxRQUFTLE1BQU0sTUFBTSxLQUFNLElBQUssQ0FBQztBQUM5QyxRQUFJLEtBQUssSUFBSSxRQUFTLE1BQU0sTUFBTSxJQUFLLElBQUssQ0FBQztBQUM3QyxRQUFJLEtBQUssSUFBSSxRQUFRLE1BQU0sS0FBSyxJQUFLLENBQUM7R0FDekM7QUFDRCxVQUFPO0VBQ1Y7Q0FDSjtBQUNELFFBQU8sZUFBZTtBQUN6QjtxQkFDYzs7OztJQzNkSjtBQUNYLENBQUMsU0FBVUksYUFBVztBQUNsQixhQUFVLFVBQVU7QUFDcEIsYUFBVSxVQUFVO0FBQ3ZCLEdBQUUsY0FBYyxZQUFZLENBQUUsR0FBRTs7OztBQ0lqQyxNQUFNLFlBQVk7QUFLWCxTQUFTLHFCQUFxQjtBQUNqQyxRQUFPLE9BQU8sbUJBQW1CLEdBQVE7QUFDNUM7QUFRTSxTQUFTLDBCQUEwQixZQUFZLE1BQU0sZUFBZTtDQUV2RSxJQUFJLGtCQUFrQixXQUFXLHVCQUF1QixXQUFXLENBQUM7Q0FDcEUsSUFBSSxRQUFRLFVBQVUsaUJBQWlCLE1BQU0sVUFBVTtBQUN2RCxLQUFJLGtCQUFrQixVQUFVLEtBQzVCLFFBQU8scUJBQXFCLE1BQU0sTUFBTSxHQUFHLEdBQUcsQ0FBQztJQUcvQyxRQUFPLHFCQUFxQixXQUFXLE1BQU0sQ0FBQztBQUVyRDtBQUNELFNBQVMsVUFBVSxpQkFBaUIsV0FBV0MsYUFBVztBQUN0RCxLQUFJO0FBQ0EsU0FBTyx5QkFBeUIsSUFBSUMsaUJBQVMsVUFBVSx5QkFBeUIsZ0JBQWdCLEVBQUUseUJBQXlCLFVBQVUsRUFBRUQsWUFBVSxDQUFDO0NBQ3JKLFNBQ00sR0FBRztFQUNOLE1BQU0sUUFBUTtBQUNkLFFBQU0sSUFBSSxZQUFZLE1BQU0sU0FBUztDQUN4QztBQUNKOzs7Ozs7QUFNRCxTQUFTLHlCQUF5QixhQUFhO0FBQzNDLFFBQU8sSUFBSSxXQUFXLElBQUksVUFBVTtBQUN2Qzs7Ozs7O0FBTUQsU0FBUyx5QkFBeUIsZUFBZTtBQUM3QyxRQUFPLE1BQU0sS0FBSyxJQUFJLFdBQVcsSUFBSSxVQUFVLGdCQUFnQjtBQUNsRTs7OztNQ3JEWSwrQkFBK0I7QUFDNUMsTUFBTSxrQkFBa0I7QUFDeEIsTUFBTSxVQUFVO0FBQ2hCLE1BQU0sa0JBQWtCO01BQ1gscUJBQXFCLFVBQVU7TUFDL0IsaUJBQWlCO0FBQzlCLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0sdUNBQXVDO0FBQzdDLE1BQU0sMENBQTBDO0FBSXpDLFNBQVMsZ0JBQWdCLFdBQVcsWUFBWTtDQUNuRCxNQUFNLFVBQVUsVUFBVSxVQUFVO0FBQ3BDLEtBQUk7QUFDQSxrQkFBZ0IsV0FBVyxXQUFXO0VBQ3RDLE1BQU0sWUFBWSxJQUFJLFdBQVc7RUFDakMsTUFBTSxhQUFhLElBQUksV0FBVztFQUNsQyxNQUFNLFNBQVMscUNBQXFDLFVBQVUsaUJBQWlCLFdBQVcsU0FBUyxrQkFBa0IsVUFBVSxFQUFFLGtCQUFrQixXQUFXLENBQUM7QUFDL0osTUFBSSxVQUFVLEVBQ1YsT0FBTSxJQUFJLE9BQU8sMkJBQTJCLE9BQU87QUFFdkQsU0FBTztHQUNILFdBQVcsRUFBRSxLQUFLLFVBQVc7R0FDN0IsWUFBWSxFQUFFLEtBQUssV0FBWTtFQUNsQztDQUNKLFVBQ087QUFDSixVQUFRLFdBQVcsUUFBUTtDQUM5QjtBQUNKO0FBT00sU0FBUyxZQUFZLFdBQVcsV0FBVyxZQUFZO0FBQzFELEtBQUksVUFBVSxJQUFJLFVBQVUscUNBQ3hCLE9BQU0sSUFBSSxhQUFhLHNDQUFzQyxxQ0FBcUMsUUFBUSxVQUFVLElBQUksT0FBTztDQUVuSSxNQUFNLFVBQVUsVUFBVSxVQUFVO0FBQ3BDLEtBQUk7QUFDQSxrQkFBZ0IsV0FBVyxXQUFXO0VBQ3RDLE1BQU0sYUFBYSxJQUFJLFdBQVc7RUFDbEMsTUFBTSxlQUFlLElBQUksV0FBVztFQUNwQyxNQUFNLFNBQVMscUNBQXFDLFVBQVUsZ0JBQWdCLFdBQVcsU0FBUyxrQkFBa0IsV0FBVyxFQUFFLGtCQUFrQixhQUFhLEVBQUUsa0JBQWtCLFVBQVUsSUFBSSxDQUFDO0FBQ25NLE1BQUksVUFBVSxFQUNWLE9BQU0sSUFBSSxPQUFPLDBCQUEwQixPQUFPO0FBRXRELFNBQU87R0FBRTtHQUFZO0VBQWM7Q0FDdEMsVUFDTztBQUNKLFVBQVEsV0FBVyxRQUFRO0NBQzlCO0FBQ0o7QUFPTSxTQUFTLFlBQVksV0FBVyxZQUFZLFlBQVk7QUFDM0QsS0FBSSxXQUFXLElBQUksVUFBVSxxQ0FDekIsT0FBTSxJQUFJLGFBQWEsdUNBQXVDLHFDQUFxQyxRQUFRLFdBQVcsSUFBSSxPQUFPO0FBRXJJLEtBQUksV0FBVyxVQUFVLHFDQUNyQixPQUFNLElBQUksYUFBYSxzQ0FBc0MscUNBQXFDLFFBQVEsV0FBVyxPQUFPO0NBRWhJLE1BQU0sVUFBVSxVQUFVLFVBQVU7QUFDcEMsS0FBSTtFQUNBLE1BQU0sZUFBZSxJQUFJLFdBQVc7RUFDcEMsTUFBTSxTQUFTLHFDQUFxQyxVQUFVLGdCQUFnQixXQUFXLFNBQVMsa0JBQWtCLGFBQWEsRUFBRSxXQUFXLFdBQVcsRUFBRSxXQUFXLFdBQVcsSUFBSSxDQUFDO0FBQ3RMLE1BQUksVUFBVSxFQUNWLE9BQU0sSUFBSSxPQUFPLDBCQUEwQixPQUFPO0FBRXRELFNBQU87Q0FDVixVQUNPO0FBQ0osVUFBUSxXQUFXLFFBQVE7Q0FDOUI7QUFDSjtBQUNELFNBQVMsUUFBUSxXQUFXLFNBQVM7QUFDakMsc0NBQXFDLFVBQVUsY0FBYyxXQUFXLFFBQVE7QUFDbkY7QUFFRCxTQUFTLFVBQVUsV0FBVztBQUMxQixRQUFPLHFDQUFxQyxVQUFVLGFBQWEsV0FBVyxnQkFBZ0I7QUFDakc7QUFFRCxTQUFTLGdCQUFnQixTQUFTLFlBQVk7Q0FDMUMsTUFBTSxnQkFBZ0IsV0FBVyxtQkFBbUIsNkJBQTZCO0NBQ2pGLE1BQU0sWUFBWSxxQ0FBcUMsUUFBUSxxQkFBcUIsU0FBUyxlQUFlLGNBQWMsT0FBTztBQUNqSSxLQUFJLFlBQVksRUFDWixTQUFRLE1BQU0sbURBQW1ELFVBQVUsdUVBQXVFO0FBRXpKOzs7O0FDNUZNLFNBQVMsdUJBQXVCLEtBQUs7Q0FDeEMsTUFBTSxXQUFXLElBQUk7Q0FHckIsTUFBTSxJQUFJLFNBQVMsTUFBTSxHQUFHLG1CQUFtQjtDQUMvQyxNQUFNRSxNQUFJLFNBQVMsTUFBTSxvQkFBb0IsSUFBSSxtQkFBbUI7Q0FDcEUsTUFBTSxNQUFNLFNBQVMsTUFBTSxJQUFJLG9CQUFvQixJQUFJLHFCQUFxQixlQUFlO0NBQzNGLE1BQU0sTUFBTSxTQUFTLE1BQU0sSUFBSSxxQkFBcUIsZ0JBQWdCLElBQUkscUJBQXFCLElBQUksZUFBZTtDQUNoSCxNQUFNLFFBQVEsU0FBUyxNQUFNLElBQUkscUJBQXFCLElBQUksZ0JBQWdCLElBQUkscUJBQXFCLElBQUksZUFBZTtBQUN0SCxRQUFPLGtCQUFrQjtFQUFDO0VBQUc7RUFBSztFQUFPQTtFQUFHO0NBQUksRUFBQztBQUNwRDtBQU1NLFNBQVMsc0JBQXNCLEtBQUs7Q0FDdkMsTUFBTSxXQUFXLElBQUk7Q0FDckIsTUFBTUEsTUFBSSxTQUFTLE1BQU0sR0FBRyxtQkFBbUI7Q0FDL0MsTUFBTSxNQUFNLFNBQVMsTUFBTSxvQkFBb0IscUJBQXFCLGVBQWU7QUFDbkYsUUFBTyxrQkFBa0IsQ0FBQ0EsS0FBRyxHQUFJLEVBQUM7QUFDckM7QUFJTSxTQUFTLHNCQUFzQixrQkFBa0I7Q0FDcEQsTUFBTSxnQkFBZ0Isa0JBQWtCLGtCQUFrQixFQUFFO0FBRTVELFFBQU8sRUFBRSxLQUFLLE9BQU8sR0FBRyxjQUFjLENBQUU7QUFDM0M7QUFJTSxTQUFTLHVCQUF1QixtQkFBbUI7Q0FDdEQsTUFBTSxnQkFBZ0Isa0JBQWtCLG1CQUFtQixFQUFFO0NBQzdELE1BQU0sSUFBSSxjQUFjO0NBQ3hCLE1BQU0sTUFBTSxjQUFjO0NBQzFCLE1BQU0sUUFBUSxjQUFjO0NBQzVCLE1BQU1BLE1BQUksY0FBYztDQUN4QixNQUFNLE1BQU0sY0FBYztBQUUxQixRQUFPLEVBQUUsS0FBSyxPQUFPLEdBQUdBLEtBQUcsS0FBSyxLQUFLLE1BQU0sQ0FBRTtBQUNoRDs7OztNQ2pEWSxzQkFBc0I7TUFDdEIseUJBQXlCO01BQ3pCLHVCQUF1QjtNQUN2QixzQkFBc0I7QUFRNUIsZUFBZUMsNEJBQTBCLFFBQVEsTUFBTSxNQUFNO0NBQ2hFLE1BQU0sT0FBTyxNQUFNLGdCQUFnQixRQUFRLHFCQUFxQix3QkFBd0Isc0JBQXNCLHVCQUF1QixLQUFLLEVBQUUsTUFBTSxvQkFBb0I7QUFDdEssUUFBTyxxQkFBcUIsS0FBSztBQUNwQztBQUNELGVBQWUsZ0JBQWdCLFFBQVEsVUFBVSxZQUFZLGFBQWEsVUFBVSxNQUFNLFlBQVk7Q0FDbEcsTUFBTSxPQUFPLElBQUksV0FBVztDQUM1QixNQUFNLFNBQVMscUNBQXFDLE9BQU8sbUJBQW1CLFFBQVEsVUFBVSxZQUFZLGFBQWEsV0FBVyxTQUFTLEVBQUUsU0FBUyxRQUFRLE1BQU0sS0FBSyxRQUFRLGtCQUFrQixLQUFLLEVBQUUsS0FBSyxPQUFPO0FBQ3hOLEtBQUksV0FBVyxFQUlYLE9BQU0sSUFBSSxPQUFPLDZCQUE2QixPQUFPO0FBRXpELFFBQU87QUFDVjs7OztJQ3ZCWSxlQUFOLE1BQW1COzs7OztDQUt0QixVQUFVLE9BQU87RUFDYixJQUFJLFFBQVEsT0FBTyxtQkFBbUIsTUFBTSxPQUFPO0FBQ25ELE9BQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxNQUFNLFFBQVEsSUFDOUIsT0FBTSxLQUFLLE1BQU07Q0FFeEI7QUFDSjs7OztBQ1ZELElBQUk7QUFFSixJQUFJLFNBQVM7QUFDYixJQUFJLFFBQVEsU0FBUyxhQUFhO0FBSzNCLFNBQVMsV0FBVyxHQUFHLEdBQUcsR0FBRztBQUNoQyxLQUFJLEtBQUssS0FDTCxLQUFJLG1CQUFtQixFQUNuQixNQUFLLFdBQVcsR0FBRyxHQUFHLEVBQUU7U0FFbkIsS0FBSyxRQUFRLG1CQUFtQixFQUNyQyxNQUFLLFdBQVcsR0FBRyxJQUFJO0lBR3ZCLE1BQUssV0FBVyxHQUFHLEVBQUU7QUFHaEM7QUFFRCxTQUFTLE1BQU07QUFDWCxRQUFPLElBQUksV0FBVztBQUN6QjtBQVFELFNBQVMsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRztBQUMzQixRQUFPLEVBQUUsS0FBSyxHQUFHO0VBQ2IsSUFBSSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUUsS0FBSztBQUMvQixNQUFJLEtBQUssTUFBTSxJQUFJLFNBQVU7QUFDN0IsSUFBRSxPQUFPLElBQUk7Q0FDaEI7QUFDRCxRQUFPO0FBQ1Y7QUFJRCxTQUFTLElBQUksR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUc7Q0FDM0IsSUFBSSxLQUFLLElBQUksT0FBUSxLQUFLLEtBQUs7QUFDL0IsUUFBTyxFQUFFLEtBQUssR0FBRztFQUNiLElBQUksSUFBSSxLQUFLLEtBQUs7RUFDbEIsSUFBSSxJQUFJLEtBQUssUUFBUTtFQUNyQixJQUFJLElBQUksS0FBSyxJQUFJLElBQUk7QUFDckIsTUFBSSxLQUFLLE1BQU0sSUFBSSxVQUFXLE1BQU0sRUFBRSxNQUFNLElBQUk7QUFDaEQsT0FBSyxNQUFNLE9BQU8sTUFBTSxNQUFNLEtBQUssS0FBSyxNQUFNO0FBQzlDLElBQUUsT0FBTyxJQUFJO0NBQ2hCO0FBQ0QsUUFBTztBQUNWO0FBR0QsU0FBUyxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHO0NBQzNCLElBQUksS0FBSyxJQUFJLE9BQVEsS0FBSyxLQUFLO0FBQy9CLFFBQU8sRUFBRSxLQUFLLEdBQUc7RUFDYixJQUFJLElBQUksS0FBSyxLQUFLO0VBQ2xCLElBQUksSUFBSSxLQUFLLFFBQVE7RUFDckIsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJO0FBQ3JCLE1BQUksS0FBSyxNQUFNLElBQUksVUFBVyxNQUFNLEVBQUUsS0FBSztBQUMzQyxPQUFLLEtBQUssT0FBTyxLQUFLLE1BQU0sS0FBSztBQUNqQyxJQUFFLE9BQU8sSUFBSTtDQUNoQjtBQUNELFFBQU87QUFDVjtBQUNELElBQUksZUFBZSxjQUFjLFlBQVksVUFBVSxXQUFXLCtCQUErQjtBQUM3RixZQUFXLFVBQVUsS0FBSztBQUMxQixTQUFRO0FBQ1gsV0FDUSxlQUFlLGNBQWMsWUFBWSxVQUFVLFdBQVcsWUFBWTtBQUMvRSxZQUFXLFVBQVUsS0FBSztBQUMxQixTQUFRO0FBQ1gsT0FDSTtBQUVELFlBQVcsVUFBVSxLQUFLO0FBQzFCLFNBQVE7QUFDWDtBQUNELFdBQVcsVUFBVSxLQUFLO0FBQzFCLFdBQVcsVUFBVSxNQUFNLEtBQUssU0FBUztBQUN6QyxXQUFXLFVBQVUsS0FBSyxLQUFLO0FBQy9CLElBQUksUUFBUTtBQUNaLFdBQVcsVUFBVSxLQUFLLEtBQUssSUFBSSxHQUFHLE1BQU07QUFDNUMsV0FBVyxVQUFVLEtBQUssUUFBUTtBQUNsQyxXQUFXLFVBQVUsS0FBSyxJQUFJLFFBQVE7QUFFdEMsSUFBSSxRQUFRO0FBQ1osSUFBSSxRQUFRLElBQUk7QUFDaEIsSUFBSSxJQUFJO0FBQ1IsS0FBSyxJQUFJLFdBQVcsRUFBRTtBQUN0QixLQUFLLEtBQUssR0FBRyxNQUFNLEdBQUcsRUFBRSxHQUNwQixPQUFNLFFBQVE7QUFDbEIsS0FBSyxJQUFJLFdBQVcsRUFBRTtBQUN0QixLQUFLLEtBQUssSUFBSSxLQUFLLElBQUksRUFBRSxHQUNyQixPQUFNLFFBQVE7QUFDbEIsS0FBSyxJQUFJLFdBQVcsRUFBRTtBQUN0QixLQUFLLEtBQUssSUFBSSxLQUFLLElBQUksRUFBRSxHQUNyQixPQUFNLFFBQVE7QUFDbEIsU0FBUyxTQUFTLEdBQUc7QUFDakIsUUFBTyxNQUFNLE9BQU8sRUFBRTtBQUN6QjtBQUNELFNBQVMsTUFBTSxHQUFHLEdBQUc7Q0FDakIsSUFBSSxJQUFJLE1BQU0sRUFBRSxXQUFXLEVBQUU7QUFDN0IsUUFBTyxLQUFLLE9BQU8sS0FBSztBQUMzQjtBQUVELFNBQVMsVUFBVSxHQUFHO0FBQ2xCLE1BQUssSUFBSSxJQUFJLEtBQUssSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFLEVBQy9CLEdBQUUsS0FBSyxLQUFLO0FBQ2hCLEdBQUUsSUFBSSxLQUFLO0FBQ1gsR0FBRSxJQUFJLEtBQUs7QUFDZDtBQUVELFNBQVMsV0FBVyxHQUFHO0FBQ25CLE1BQUssSUFBSTtBQUNULE1BQUssSUFBSSxJQUFJLElBQUksS0FBSztBQUN0QixLQUFJLElBQUksRUFDSixNQUFLLEtBQUs7U0FFTCxJQUFJLEdBQ1QsTUFBSyxLQUFLLElBQUk7SUFHZCxNQUFLLElBQUk7QUFFaEI7QUFFRCxTQUFTLElBQUksR0FBRztDQUNaLElBQUksSUFBSSxLQUFLO0FBQ2IsR0FBRSxRQUFRLEVBQUU7QUFDWixRQUFPO0FBQ1Y7QUFFRCxTQUFTLGNBQWMsR0FBRyxHQUFHO0NBQ3pCLElBQUk7QUFDSixLQUFJLEtBQUssR0FDTCxLQUFJO1NBRUMsS0FBSyxFQUNWLEtBQUk7U0FFQyxLQUFLLElBQ1YsS0FBSTtTQUVDLEtBQUssRUFDVixLQUFJO1NBRUMsS0FBSyxHQUNWLEtBQUk7U0FFQyxLQUFLLEVBQ1YsS0FBSTtLQUVIO0FBQ0QsT0FBSyxVQUFVLEdBQUcsRUFBRTtBQUNwQjtDQUNIO0FBQ0QsTUFBSyxJQUFJO0FBQ1QsTUFBSyxJQUFJO0NBQ1QsSUFBSSxJQUFJLEVBQUUsUUFBUSxLQUFLLE9BQU8sS0FBSztBQUNuQyxRQUFPLEVBQUUsS0FBSyxHQUFHO0VBQ2IsSUFBSSxJQUFJLEtBQUssSUFBSSxFQUFFLEtBQUssTUFBTyxNQUFNLEdBQUcsRUFBRTtBQUMxQyxNQUFJLElBQUksR0FBRztBQUNQLE9BQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxJQUNmLE1BQUs7QUFDVDtFQUNIO0FBQ0QsT0FBSztBQUNMLE1BQUksTUFBTSxFQUNOLE1BQUssS0FBSyxPQUFPO1NBRVosS0FBSyxJQUFJLEtBQUssSUFBSTtBQUN2QixRQUFLLEtBQUssSUFBSSxPQUFPLEtBQU0sS0FBTSxLQUFLLEtBQUssTUFBTyxNQUFPO0FBQ3pELFFBQUssS0FBSyxPQUFPLEtBQU0sS0FBSyxLQUFLO0VBQ3BDLE1BRUcsTUFBSyxLQUFLLElBQUksTUFBTSxLQUFLO0FBRTdCLFFBQU07QUFDTixNQUFJLE1BQU0sS0FBSyxHQUNYLE9BQU0sS0FBSztDQUNsQjtBQUNELEtBQUksS0FBSyxNQUFNLEVBQUUsS0FBSyxRQUFTLEdBQUc7QUFDOUIsT0FBSyxJQUFJO0FBQ1QsTUFBSSxLQUFLLEVBQ0wsTUFBSyxLQUFLLElBQUksT0FBUSxLQUFNLEtBQUssS0FBSyxNQUFPLEtBQU07Q0FDMUQ7QUFDRCxNQUFLLE9BQU87QUFDWixLQUFJLEdBQ0EsWUFBVyxLQUFLLE1BQU0sTUFBTSxLQUFLO0FBQ3hDO0FBRUQsU0FBUyxXQUFXO0NBQ2hCLElBQUksSUFBSSxLQUFLLElBQUksS0FBSztBQUN0QixRQUFPLEtBQUssSUFBSSxLQUFLLEtBQUssS0FBSyxJQUFJLE1BQU0sRUFDckMsR0FBRSxLQUFLO0FBQ2Q7QUFFRCxTQUFTLFdBQVcsR0FBRztBQUNuQixLQUFJLEtBQUssSUFBSSxFQUNULFFBQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQyxTQUFTLEVBQUU7Q0FDMUMsSUFBSTtBQUNKLEtBQUksS0FBSyxHQUNMLEtBQUk7U0FFQyxLQUFLLEVBQ1YsS0FBSTtTQUVDLEtBQUssRUFDVixLQUFJO1NBRUMsS0FBSyxHQUNWLEtBQUk7U0FFQyxLQUFLLEVBQ1YsS0FBSTtJQUdKLFFBQU8sS0FBSyxRQUFRLEVBQUU7Q0FFMUIsSUFBSSxNQUFNLEtBQUssS0FBSyxHQUFHLEdBQUcsSUFBSSxPQUFPLElBQUksSUFBSSxJQUFJLEtBQUs7Q0FDdEQsSUFBSSxJQUFJLEtBQUssS0FBTyxJQUFJLEtBQUssS0FBTTtBQUNuQyxLQUFJLE1BQU0sR0FBRztBQUNULE1BQUksSUFBSSxLQUFLLE9BQU8sSUFBSSxLQUFLLE1BQU0sS0FBSyxHQUFHO0FBQ3ZDLE9BQUk7QUFDSixPQUFJLFNBQVMsRUFBRTtFQUNsQjtBQUNELFNBQU8sS0FBSyxHQUFHO0FBQ1gsT0FBSSxJQUFJLEdBQUc7QUFDUCxTQUFLLEtBQUssTUFBTyxLQUFLLEtBQUssTUFBUSxJQUFJO0FBQ3ZDLFNBQUssS0FBSyxFQUFFLE9BQU8sS0FBSyxLQUFLLEtBQUs7R0FDckMsT0FDSTtBQUNELFFBQUssS0FBSyxPQUFPLEtBQUssS0FBTTtBQUM1QixRQUFJLEtBQUssR0FBRztBQUNSLFVBQUssS0FBSztBQUNWLE9BQUU7SUFDTDtHQUNKO0FBQ0QsT0FBSSxJQUFJLEVBQ0osS0FBSTtBQUNSLE9BQUksRUFDQSxNQUFLLFNBQVMsRUFBRTtFQUN2QjtDQUNKO0FBQ0QsUUFBTyxJQUFJLElBQUk7QUFDbEI7QUFFRCxTQUFTLFdBQVc7Q0FDaEIsSUFBSSxJQUFJLEtBQUs7QUFDYixZQUFXLEtBQUssTUFBTSxNQUFNLEVBQUU7QUFDOUIsUUFBTztBQUNWO0FBRUQsU0FBUyxRQUFRO0FBQ2IsUUFBTyxLQUFLLElBQUksSUFBSSxLQUFLLFFBQVEsR0FBRztBQUN2QztBQUVELFNBQVMsWUFBWSxHQUFHO0NBQ3BCLElBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUNuQixLQUFJLEtBQUssRUFDTCxRQUFPO0NBQ1gsSUFBSSxJQUFJLEtBQUs7QUFDYixLQUFJLElBQUksRUFBRTtBQUNWLEtBQUksS0FBSyxFQUNMLFFBQU8sS0FBSyxJQUFJLEtBQUssSUFBSTtBQUM3QixRQUFPLEVBQUUsS0FBSyxFQUNWLE1BQUssSUFBSSxLQUFLLEtBQUssRUFBRSxPQUFPLEVBQ3hCLFFBQU87QUFDZixRQUFPO0FBQ1Y7QUFFRCxTQUFTLE1BQU0sR0FBRztDQUNkLElBQUksSUFBSSxHQUFHQztBQUNYLE1BQUtBLE1BQUksTUFBTSxPQUFPLEdBQUc7QUFDckIsTUFBSUE7QUFDSixPQUFLO0NBQ1I7QUFDRCxNQUFLQSxNQUFJLEtBQUssTUFBTSxHQUFHO0FBQ25CLE1BQUlBO0FBQ0osT0FBSztDQUNSO0FBQ0QsTUFBS0EsTUFBSSxLQUFLLE1BQU0sR0FBRztBQUNuQixNQUFJQTtBQUNKLE9BQUs7Q0FDUjtBQUNELE1BQUtBLE1BQUksS0FBSyxNQUFNLEdBQUc7QUFDbkIsTUFBSUE7QUFDSixPQUFLO0NBQ1I7QUFDRCxNQUFLQSxNQUFJLEtBQUssTUFBTSxHQUFHO0FBQ25CLE1BQUlBO0FBQ0osT0FBSztDQUNSO0FBQ0QsUUFBTztBQUNWO0FBRUQsU0FBUyxjQUFjO0FBQ25CLEtBQUksS0FBSyxLQUFLLEVBQ1YsUUFBTztBQUNYLFFBQU8sS0FBSyxNQUFNLEtBQUssSUFBSSxLQUFLLE1BQU0sS0FBSyxLQUFLLElBQUksS0FBTSxLQUFLLElBQUksS0FBSyxHQUFJO0FBQy9FO0FBRUQsU0FBUyxhQUFhLEdBQUcsR0FBRztDQUN4QixJQUFJO0FBQ0osTUFBSyxJQUFJLEtBQUssSUFBSSxHQUFHLEtBQUssR0FBRyxFQUFFLEVBQzNCLEdBQUUsSUFBSSxLQUFLLEtBQUs7QUFDcEIsTUFBSyxJQUFJLElBQUksR0FBRyxLQUFLLEdBQUcsRUFBRSxFQUN0QixHQUFFLEtBQUs7QUFDWCxHQUFFLElBQUksS0FBSyxJQUFJO0FBQ2YsR0FBRSxJQUFJLEtBQUs7QUFDZDtBQUVELFNBQVMsYUFBYSxHQUFHLEdBQUc7QUFDeEIsTUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssR0FBRyxFQUFFLEVBQzFCLEdBQUUsSUFBSSxLQUFLLEtBQUs7QUFDcEIsR0FBRSxJQUFJLEtBQUssSUFBSSxLQUFLLElBQUksR0FBRyxFQUFFO0FBQzdCLEdBQUUsSUFBSSxLQUFLO0FBQ2Q7QUFFRCxTQUFTLFlBQVksR0FBRyxHQUFHO0NBQ3ZCLElBQUksS0FBSyxJQUFJLEtBQUs7Q0FDbEIsSUFBSSxNQUFNLEtBQUssS0FBSztDQUNwQixJQUFJLE1BQU0sS0FBSyxPQUFPO0NBQ3RCLElBQUksS0FBSyxLQUFLLE1BQU0sSUFBSSxLQUFLLEdBQUcsRUFBRSxJQUFLLEtBQUssS0FBSyxLQUFNLEtBQUssSUFBSTtBQUNoRSxNQUFLLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUUsR0FBRztBQUM5QixJQUFFLElBQUksS0FBSyxLQUFNLEtBQUssTUFBTSxNQUFPO0FBQ25DLE9BQUssS0FBSyxLQUFLLE9BQU87Q0FDekI7QUFDRCxNQUFLLElBQUksS0FBSyxHQUFHLEtBQUssR0FBRyxFQUFFLEVBQ3ZCLEdBQUUsS0FBSztBQUNYLEdBQUUsTUFBTTtBQUNSLEdBQUUsSUFBSSxLQUFLLElBQUksS0FBSztBQUNwQixHQUFFLElBQUksS0FBSztBQUNYLEdBQUUsT0FBTztBQUNaO0FBRUQsU0FBUyxZQUFZLEdBQUcsR0FBRztBQUN2QixHQUFFLElBQUksS0FBSztDQUNYLElBQUksS0FBSyxLQUFLLE1BQU0sSUFBSSxLQUFLLEdBQUc7QUFDaEMsS0FBSSxNQUFNLEtBQUssR0FBRztBQUNkLElBQUUsSUFBSTtBQUNOO0NBQ0g7Q0FDRCxJQUFJLEtBQUssSUFBSSxLQUFLO0NBQ2xCLElBQUksTUFBTSxLQUFLLEtBQUs7Q0FDcEIsSUFBSSxNQUFNLEtBQUssTUFBTTtBQUNyQixHQUFFLEtBQUssS0FBSyxPQUFPO0FBQ25CLE1BQUssSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLEtBQUssR0FBRyxFQUFFLEdBQUc7QUFDbEMsSUFBRSxJQUFJLEtBQUssT0FBTyxLQUFLLEtBQUssT0FBTztBQUNuQyxJQUFFLElBQUksTUFBTSxLQUFLLE1BQU07Q0FDMUI7QUFDRCxLQUFJLEtBQUssRUFDTCxHQUFFLEtBQUssSUFBSSxLQUFLLE9BQU8sS0FBSyxJQUFJLE9BQU87QUFDM0MsR0FBRSxJQUFJLEtBQUssSUFBSTtBQUNmLEdBQUUsT0FBTztBQUNaO0FBRUQsU0FBUyxTQUFTLEdBQUcsR0FBRztDQUNwQixJQUFJLElBQUksR0FBRyxJQUFJLEdBQUcsSUFBSSxLQUFLLElBQUksRUFBRSxHQUFHLEtBQUssRUFBRTtBQUMzQyxRQUFPLElBQUksR0FBRztBQUNWLE9BQUssS0FBSyxLQUFLLEVBQUU7QUFDakIsSUFBRSxPQUFPLElBQUksS0FBSztBQUNsQixRQUFNLEtBQUs7Q0FDZDtBQUNELEtBQUksRUFBRSxJQUFJLEtBQUssR0FBRztBQUNkLE9BQUssRUFBRTtBQUNQLFNBQU8sSUFBSSxLQUFLLEdBQUc7QUFDZixRQUFLLEtBQUs7QUFDVixLQUFFLE9BQU8sSUFBSSxLQUFLO0FBQ2xCLFNBQU0sS0FBSztFQUNkO0FBQ0QsT0FBSyxLQUFLO0NBQ2IsT0FDSTtBQUNELE9BQUssS0FBSztBQUNWLFNBQU8sSUFBSSxFQUFFLEdBQUc7QUFDWixRQUFLLEVBQUU7QUFDUCxLQUFFLE9BQU8sSUFBSSxLQUFLO0FBQ2xCLFNBQU0sS0FBSztFQUNkO0FBQ0QsT0FBSyxFQUFFO0NBQ1Y7QUFDRCxHQUFFLElBQUksSUFBSSxJQUFJLEtBQUs7QUFDbkIsS0FBSSxJQUFJLEdBQ0osR0FBRSxPQUFPLEtBQUssS0FBSztTQUVkLElBQUksRUFDVCxHQUFFLE9BQU87QUFDYixHQUFFLElBQUk7QUFDTixHQUFFLE9BQU87QUFDWjtBQUdELFNBQVMsY0FBYyxHQUFHLEdBQUc7Q0FDekIsSUFBSSxJQUFJLEtBQUssS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLO0NBQy9CLElBQUksSUFBSSxFQUFFO0FBQ1YsR0FBRSxJQUFJLElBQUksRUFBRTtBQUNaLFFBQU8sRUFBRSxLQUFLLEVBQ1YsR0FBRSxLQUFLO0FBQ1gsTUFBSyxJQUFJLEdBQUcsSUFBSSxFQUFFLEdBQUcsRUFBRSxFQUNuQixHQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxHQUFHLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxFQUFFLEVBQUU7QUFDNUMsR0FBRSxJQUFJO0FBQ04sR0FBRSxPQUFPO0FBQ1QsS0FBSSxLQUFLLEtBQUssRUFBRSxFQUNaLFlBQVcsS0FBSyxNQUFNLEdBQUcsRUFBRTtBQUNsQztBQUVELFNBQVMsWUFBWSxHQUFHO0NBQ3BCLElBQUksSUFBSSxLQUFLLEtBQUs7Q0FDbEIsSUFBSSxJQUFLLEVBQUUsSUFBSSxJQUFJLEVBQUU7QUFDckIsUUFBTyxFQUFFLEtBQUssRUFDVixHQUFFLEtBQUs7QUFDWCxNQUFLLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxHQUFHLEVBQUUsR0FBRztFQUMxQixJQUFJLElBQUksRUFBRSxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsRUFBRTtBQUNyQyxPQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxHQUFHLElBQUksR0FBRyxJQUFJLEVBQUUsSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLEdBQUcsRUFBRSxJQUFJLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSTtBQUM3RSxLQUFFLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDaEIsS0FBRSxJQUFJLEVBQUUsSUFBSSxLQUFLO0VBQ3BCO0NBQ0o7QUFDRCxLQUFJLEVBQUUsSUFBSSxFQUNOLEdBQUUsRUFBRSxJQUFJLE1BQU0sRUFBRSxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsSUFBSSxHQUFHLEdBQUcsRUFBRTtBQUMvQyxHQUFFLElBQUk7QUFDTixHQUFFLE9BQU87QUFDWjtBQUdELFNBQVMsWUFBWSxHQUFHLEdBQUcsR0FBRztDQUMxQixJQUFJLEtBQUssRUFBRSxLQUFLO0FBQ2hCLEtBQUksR0FBRyxLQUFLLEVBQ1I7Q0FDSixJQUFJLEtBQUssS0FBSyxLQUFLO0FBQ25CLEtBQUksR0FBRyxJQUFJLEdBQUcsR0FBRztBQUNiLE1BQUksS0FBSyxLQUNMLEdBQUUsUUFBUSxFQUFFO0FBQ2hCLE1BQUksS0FBSyxLQUNMLE1BQUssT0FBTyxFQUFFO0FBQ2xCO0NBQ0g7QUFDRCxLQUFJLEtBQUssS0FDTCxLQUFJLEtBQUs7Q0FDYixJQUFJLElBQUksS0FBSyxFQUFFLEtBQUssS0FBSyxHQUFHLEtBQUssRUFBRTtDQUNuQyxJQUFJLE1BQU0sS0FBSyxLQUFLLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRztBQUN2QyxLQUFJLE1BQU0sR0FBRztBQUNULEtBQUcsU0FBUyxLQUFLLEVBQUU7QUFDbkIsS0FBRyxTQUFTLEtBQUssRUFBRTtDQUN0QixPQUNJO0FBQ0QsS0FBRyxPQUFPLEVBQUU7QUFDWixLQUFHLE9BQU8sRUFBRTtDQUNmO0NBQ0QsSUFBSSxLQUFLLEVBQUU7Q0FDWCxJQUFJLEtBQUssRUFBRSxLQUFLO0FBQ2hCLEtBQUksTUFBTSxFQUNOO0NBQ0osSUFBSSxLQUFLLE1BQU0sS0FBSyxLQUFLLE9BQU8sS0FBSyxJQUFJLEVBQUUsS0FBSyxNQUFNLEtBQUssS0FBSztDQUNoRSxJQUFJLEtBQUssS0FBSyxLQUFLLElBQUksTUFBTSxLQUFLLEtBQUssTUFBTSxJQUFJLElBQUksS0FBSyxLQUFLO0NBQy9ELElBQUksSUFBSSxFQUFFLEdBQUcsSUFBSSxJQUFJLElBQUlBLE1BQUksS0FBSyxPQUFPLEtBQUssR0FBRztBQUNqRCxHQUFFLFVBQVUsR0FBR0EsSUFBRTtBQUNqQixLQUFJLEVBQUUsVUFBVUEsSUFBRSxJQUFJLEdBQUc7QUFDckIsSUFBRSxFQUFFLE9BQU87QUFDWCxJQUFFLE1BQU1BLEtBQUcsRUFBRTtDQUNoQjtBQUNELFlBQVcsSUFBSSxVQUFVLElBQUlBLElBQUU7QUFDL0IsS0FBRSxNQUFNLEdBQUcsRUFBRTtBQUNiLFFBQU8sRUFBRSxJQUFJLEdBQ1QsR0FBRSxFQUFFLE9BQU87QUFDZixRQUFPLEVBQUUsS0FBSyxHQUFHO0VBRWIsSUFBSSxLQUFLLEVBQUUsRUFBRSxNQUFNLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTSxFQUFFLEtBQUssTUFBTSxFQUFFLElBQUksS0FBSyxLQUFLLEdBQUc7QUFDN0UsT0FBSyxFQUFFLE1BQU0sRUFBRSxHQUFHLEdBQUcsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLElBQUksSUFBSTtBQUV6QyxLQUFFLFVBQVUsR0FBR0EsSUFBRTtBQUNqQixLQUFFLE1BQU1BLEtBQUcsRUFBRTtBQUNiLFVBQU8sRUFBRSxLQUFLLEVBQUUsR0FDWixHQUFFLE1BQU1BLEtBQUcsRUFBRTtFQUNwQjtDQUNKO0FBQ0QsS0FBSSxLQUFLLE1BQU07QUFDWCxJQUFFLFVBQVUsSUFBSSxFQUFFO0FBQ2xCLE1BQUksTUFBTSxHQUNOLFlBQVcsS0FBSyxNQUFNLEdBQUcsRUFBRTtDQUNsQztBQUNELEdBQUUsSUFBSTtBQUNOLEdBQUUsT0FBTztBQUNULEtBQUksTUFBTSxFQUNOLEdBQUUsU0FBUyxLQUFLLEVBQUU7QUFDdEIsS0FBSSxLQUFLLEVBQ0wsWUFBVyxLQUFLLE1BQU0sR0FBRyxFQUFFO0FBQ2xDO0FBRUQsU0FBUyxNQUFNLEdBQUc7Q0FDZCxJQUFJLElBQUksS0FBSztBQUNiLE1BQUssS0FBSyxDQUFDLFNBQVMsR0FBRyxNQUFNLEVBQUU7QUFDL0IsS0FBSSxLQUFLLElBQUksS0FBSyxFQUFFLFVBQVUsV0FBVyxLQUFLLEdBQUcsRUFDN0MsR0FBRSxNQUFNLEdBQUcsRUFBRTtBQUNqQixRQUFPO0FBQ1Y7QUFFRCxTQUFTLFFBQVEsR0FBRztBQUNoQixNQUFLLElBQUk7QUFDWjtBQUNELFNBQVMsU0FBUyxHQUFHO0FBQ2pCLEtBQUksRUFBRSxJQUFJLEtBQUssRUFBRSxVQUFVLEtBQUssRUFBRSxJQUFJLEVBQ2xDLFFBQU8sRUFBRSxJQUFJLEtBQUssRUFBRTtJQUdwQixRQUFPO0FBRWQ7QUFDRCxTQUFTLFFBQVEsR0FBRztBQUNoQixRQUFPO0FBQ1Y7QUFDRCxTQUFTLFFBQVEsR0FBRztBQUNoQixHQUFFLFNBQVMsS0FBSyxHQUFHLE1BQU0sRUFBRTtBQUM5QjtBQUNELFNBQVMsT0FBTyxHQUFHLEdBQUcsR0FBRztBQUNyQixHQUFFLFdBQVcsR0FBRyxFQUFFO0FBQ2xCLE1BQUssT0FBTyxFQUFFO0FBQ2pCO0FBQ0QsU0FBUyxPQUFPLEdBQUcsR0FBRztBQUNsQixHQUFFLFNBQVMsRUFBRTtBQUNiLE1BQUssT0FBTyxFQUFFO0FBQ2pCO0FBQ0QsUUFBUSxVQUFVLFVBQVU7QUFDNUIsUUFBUSxVQUFVLFNBQVM7QUFDM0IsUUFBUSxVQUFVLFNBQVM7QUFDM0IsUUFBUSxVQUFVLFFBQVE7QUFDMUIsUUFBUSxVQUFVLFFBQVE7QUFXMUIsU0FBUyxjQUFjO0FBQ25CLEtBQUksS0FBSyxJQUFJLEVBQ1QsUUFBTztDQUNYLElBQUksSUFBSSxLQUFLO0FBQ2IsTUFBSyxJQUFJLE1BQU0sRUFDWCxRQUFPO0NBQ1gsSUFBSSxJQUFJLElBQUk7QUFDWixLQUFLLEtBQUssS0FBSyxJQUFJLE1BQU8sS0FBTTtBQUNoQyxLQUFLLEtBQUssS0FBSyxJQUFJLE9BQVEsS0FBTTtBQUNqQyxLQUFLLEtBQUssTUFBTyxJQUFJLFNBQVUsSUFBSyxVQUFZO0FBR2hELEtBQUssS0FBSyxJQUFNLElBQUksSUFBSyxLQUFLLE1BQVEsS0FBSztBQUUzQyxRQUFPLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSztBQUNqQztBQUVELFNBQVMsV0FBVyxHQUFHO0FBQ25CLE1BQUssSUFBSTtBQUNULE1BQUssS0FBSyxFQUFFLFVBQVU7QUFDdEIsTUFBSyxNQUFNLEtBQUssS0FBSztBQUNyQixNQUFLLE1BQU0sS0FBSyxNQUFNO0FBQ3RCLE1BQUssTUFBTSxLQUFNLEVBQUUsS0FBSyxNQUFPO0FBQy9CLE1BQUssTUFBTSxJQUFJLEVBQUU7QUFDcEI7QUFFRCxTQUFTLFlBQVksR0FBRztDQUNwQixJQUFJLElBQUksS0FBSztBQUNiLEdBQUUsS0FBSyxDQUFDLFVBQVUsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUM5QixHQUFFLFNBQVMsS0FBSyxHQUFHLE1BQU0sRUFBRTtBQUMzQixLQUFJLEVBQUUsSUFBSSxLQUFLLEVBQUUsVUFBVSxXQUFXLEtBQUssR0FBRyxFQUMxQyxNQUFLLEVBQUUsTUFBTSxHQUFHLEVBQUU7QUFDdEIsUUFBTztBQUNWO0FBRUQsU0FBUyxXQUFXLEdBQUc7Q0FDbkIsSUFBSSxJQUFJLEtBQUs7QUFDYixHQUFFLE9BQU8sRUFBRTtBQUNYLE1BQUssT0FBTyxFQUFFO0FBQ2QsUUFBTztBQUNWO0FBRUQsU0FBUyxXQUFXLEdBQUc7QUFDbkIsUUFBTyxFQUFFLEtBQUssS0FBSyxJQUVmLEdBQUUsRUFBRSxPQUFPO0FBQ2YsTUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssRUFBRSxHQUFHLEVBQUUsR0FBRztFQUUvQixJQUFJLElBQUksRUFBRSxLQUFLO0VBQ2YsSUFBSSxLQUFNLElBQUksS0FBSyxRQUFTLElBQUksS0FBSyxPQUFPLEVBQUUsTUFBTSxNQUFNLEtBQUssTUFBTyxLQUFLLE9BQU8sTUFBTyxFQUFFO0FBRTNGLE1BQUksSUFBSSxLQUFLLEVBQUU7QUFDZixJQUFFLE1BQU0sS0FBSyxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsR0FBRyxHQUFHLEtBQUssRUFBRSxFQUFFO0FBRTNDLFNBQU8sRUFBRSxNQUFNLEVBQUUsSUFBSTtBQUNqQixLQUFFLE1BQU0sRUFBRTtBQUNWLEtBQUUsRUFBRTtFQUNQO0NBQ0o7QUFDRCxHQUFFLE9BQU87QUFDVCxHQUFFLFVBQVUsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUN4QixLQUFJLEVBQUUsVUFBVSxLQUFLLEVBQUUsSUFBSSxFQUN2QixHQUFFLE1BQU0sS0FBSyxHQUFHLEVBQUU7QUFDekI7QUFFRCxTQUFTLFVBQVUsR0FBRyxHQUFHO0FBQ3JCLEdBQUUsU0FBUyxFQUFFO0FBQ2IsTUFBSyxPQUFPLEVBQUU7QUFDakI7QUFFRCxTQUFTLFVBQVUsR0FBRyxHQUFHLEdBQUc7QUFDeEIsR0FBRSxXQUFXLEdBQUcsRUFBRTtBQUNsQixNQUFLLE9BQU8sRUFBRTtBQUNqQjtBQUNELFdBQVcsVUFBVSxVQUFVO0FBQy9CLFdBQVcsVUFBVSxTQUFTO0FBQzlCLFdBQVcsVUFBVSxTQUFTO0FBQzlCLFdBQVcsVUFBVSxRQUFRO0FBQzdCLFdBQVcsVUFBVSxRQUFRO0FBRTdCLFNBQVMsWUFBWTtBQUNqQixTQUFRLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxJQUFJLEtBQUssTUFBTTtBQUNqRDtBQUVELFNBQVMsT0FBTyxHQUFHLEdBQUc7QUFDbEIsS0FBSSxJQUFJLGNBQWMsSUFBSSxFQUN0QixRQUFPLFdBQVc7Q0FDdEIsSUFBSSxJQUFJLEtBQUssRUFBRSxLQUFLLEtBQUssRUFBRSxJQUFJLEVBQUUsUUFBUSxLQUFLLEVBQUUsSUFBSSxNQUFNLEVBQUUsR0FBRztBQUMvRCxHQUFFLE9BQU8sRUFBRTtBQUNYLFFBQU8sRUFBRSxLQUFLLEdBQUc7QUFDYixJQUFFLE1BQU0sR0FBRyxHQUFHO0FBQ2QsT0FBSyxJQUFLLEtBQUssS0FBTSxFQUNqQixHQUFFLE1BQU0sSUFBSSxHQUFHLEVBQUU7S0FFaEI7R0FDRCxJQUFJQSxNQUFJO0FBQ1IsT0FBSTtBQUNKLFFBQUtBO0VBQ1I7Q0FDSjtBQUNELFFBQU8sRUFBRSxPQUFPLEVBQUU7QUFDckI7QUFFRCxTQUFTLFlBQVksR0FBRyxHQUFHO0NBQ3ZCLElBQUk7QUFDSixLQUFJLElBQUksT0FBTyxFQUFFLFFBQVEsQ0FDckIsS0FBSSxJQUFJLFFBQVE7SUFFaEIsS0FBSSxJQUFJLFdBQVc7QUFDdkIsUUFBTyxLQUFLLElBQUksR0FBRyxFQUFFO0FBQ3hCO0FBRUQsV0FBVyxVQUFVLFNBQVM7QUFDOUIsV0FBVyxVQUFVLFVBQVU7QUFDL0IsV0FBVyxVQUFVLGFBQWE7QUFDbEMsV0FBVyxVQUFVLFFBQVE7QUFDN0IsV0FBVyxVQUFVLFlBQVk7QUFDakMsV0FBVyxVQUFVLFlBQVk7QUFDakMsV0FBVyxVQUFVLFdBQVc7QUFDaEMsV0FBVyxVQUFVLFdBQVc7QUFDaEMsV0FBVyxVQUFVLFFBQVE7QUFDN0IsV0FBVyxVQUFVLGFBQWE7QUFDbEMsV0FBVyxVQUFVLFdBQVc7QUFDaEMsV0FBVyxVQUFVLFdBQVc7QUFDaEMsV0FBVyxVQUFVLFdBQVc7QUFDaEMsV0FBVyxVQUFVLFNBQVM7QUFDOUIsV0FBVyxVQUFVLE1BQU07QUFFM0IsV0FBVyxVQUFVLFdBQVc7QUFDaEMsV0FBVyxVQUFVLFNBQVM7QUFDOUIsV0FBVyxVQUFVLE1BQU07QUFDM0IsV0FBVyxVQUFVLFlBQVk7QUFDakMsV0FBVyxVQUFVLFlBQVk7QUFDakMsV0FBVyxVQUFVLE1BQU07QUFDM0IsV0FBVyxVQUFVLFlBQVk7QUFFakMsV0FBVyxPQUFPLElBQUksRUFBRTtBQUN4QixXQUFXLE1BQU0sSUFBSSxFQUFFO0FBUXZCLFNBQVMsVUFBVTtDQUNmLElBQUksSUFBSSxLQUFLO0FBQ2IsTUFBSyxPQUFPLEVBQUU7QUFDZCxRQUFPO0FBQ1Y7QUFFRCxTQUFTLGFBQWE7QUFDbEIsS0FBSSxLQUFLLElBQUksR0FDVDtNQUFJLEtBQUssS0FBSyxFQUNWLFFBQU8sS0FBSyxLQUFLLEtBQUs7U0FFakIsS0FBSyxLQUFLLEVBQ2YsUUFBTztDQUFHLFdBRVQsS0FBSyxLQUFLLEVBQ2YsUUFBTyxLQUFLO1NBRVAsS0FBSyxLQUFLLEVBQ2YsUUFBTztBQUVYLFNBQVMsS0FBSyxNQUFPLEtBQU0sS0FBSyxLQUFLLE1BQU8sTUFBTyxLQUFLLEtBQU0sS0FBSztBQUN0RTtBQUVELFNBQVMsY0FBYztBQUNuQixRQUFPLEtBQUssS0FBSyxJQUFJLEtBQUssSUFBSyxLQUFLLE1BQU0sTUFBTztBQUNwRDtBQUVELFNBQVMsZUFBZTtBQUNwQixRQUFPLEtBQUssS0FBSyxJQUFJLEtBQUssSUFBSyxLQUFLLE1BQU0sTUFBTztBQUNwRDtBQUVELFNBQVMsYUFBYSxHQUFHO0FBQ3JCLFFBQU8sS0FBSyxNQUFPLEtBQUssTUFBTSxLQUFLLEtBQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztBQUN4RDtBQUVELFNBQVMsV0FBVztBQUNoQixLQUFJLEtBQUssSUFBSSxFQUNULFFBQU87U0FFRixLQUFLLEtBQUssS0FBTSxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sRUFDL0MsUUFBTztJQUdQLFFBQU87QUFFZDtBQUVELFNBQVMsV0FBVyxHQUFHO0FBQ25CLEtBQUksS0FBSyxLQUNMLEtBQUk7QUFDUixLQUFJLEtBQUssUUFBUSxJQUFJLEtBQUssSUFBSSxLQUFLLElBQUksR0FDbkMsUUFBTztDQUNYLElBQUksS0FBSyxLQUFLLFVBQVUsRUFBRTtDQUMxQixJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsR0FBRztDQUN2QixJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxLQUFLLEVBQUUsSUFBSSxLQUFLLEVBQUUsSUFBSTtBQUMxQyxNQUFLLFNBQVMsR0FBRyxHQUFHLEVBQUU7QUFDdEIsUUFBTyxFQUFFLFFBQVEsR0FBRyxHQUFHO0FBQ25CLE1BQUksQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxDQUFDLFVBQVUsRUFBRSxHQUFHO0FBQ2xELElBQUUsU0FBUyxHQUFHLEdBQUcsRUFBRTtDQUN0QjtBQUNELFFBQU8sRUFBRSxVQUFVLENBQUMsU0FBUyxFQUFFLEdBQUc7QUFDckM7QUFFRCxTQUFTLGFBQWEsR0FBRyxHQUFHO0FBQ3hCLE1BQUssUUFBUSxFQUFFO0FBQ2YsS0FBSSxLQUFLLEtBQ0wsS0FBSTtDQUNSLElBQUksS0FBSyxLQUFLLFVBQVUsRUFBRTtDQUMxQixJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsR0FBRyxFQUFFLEtBQUssT0FBTyxJQUFJLEdBQUcsSUFBSTtBQUNoRCxNQUFLLElBQUksSUFBSSxHQUFHLElBQUksRUFBRSxRQUFRLEVBQUUsR0FBRztFQUMvQixJQUFJLElBQUksTUFBTSxHQUFHLEVBQUU7QUFDbkIsTUFBSSxJQUFJLEdBQUc7QUFDUCxPQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksT0FBTyxLQUFLLFFBQVEsSUFBSSxFQUN2QyxNQUFLO0FBQ1Q7RUFDSDtBQUNELE1BQUksSUFBSSxJQUFJO0FBQ1osTUFBSSxFQUFFLEtBQUssSUFBSTtBQUNYLFFBQUssVUFBVSxFQUFFO0FBQ2pCLFFBQUssV0FBVyxHQUFHLEVBQUU7QUFDckIsT0FBSTtBQUNKLE9BQUk7RUFDUDtDQUNKO0FBQ0QsS0FBSSxJQUFJLEdBQUc7QUFDUCxPQUFLLFVBQVUsS0FBSyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQzlCLE9BQUssV0FBVyxHQUFHLEVBQUU7Q0FDeEI7QUFDRCxLQUFJLEdBQ0EsWUFBVyxLQUFLLE1BQU0sTUFBTSxLQUFLO0FBQ3hDO0FBVUQsU0FBUyxjQUFjLEdBQUcsR0FBRyxHQUFHO0FBQzVCLEtBQUksbUJBQW1CLEVBRW5CLEtBQUksSUFBSSxFQUNKLE1BQUssUUFBUSxFQUFFO0tBRWQ7QUFDRCxPQUFLLFdBQVcsR0FBRyxFQUFFO0FBQ3JCLE9BQUssS0FBSyxRQUFRLElBQUksRUFBRSxDQUVwQixNQUFLLFVBQVUsV0FBVyxJQUFJLFVBQVUsSUFBSSxFQUFFLEVBQUUsT0FBTyxLQUFLO0FBRWhFLE1BQUksS0FBSyxRQUFRLENBQ2IsTUFBSyxXQUFXLEdBQUcsRUFBRTtBQUN6QixVQUFRLEtBQUssZ0JBQWdCLEVBQUUsRUFBRTtBQUM3QixRQUFLLFdBQVcsR0FBRyxFQUFFO0FBQ3JCLE9BQUksS0FBSyxXQUFXLEdBQUcsRUFDbkIsTUFBSyxNQUFNLFdBQVcsSUFBSSxVQUFVLElBQUksRUFBRSxFQUFFLEtBQUs7RUFDeEQ7Q0FDSjtLQUVBO0VBRUQsSUFBSSxJQUFJLElBQUksU0FBU0EsTUFBSSxJQUFJO0FBQzdCLElBQUUsVUFBVSxLQUFLLEtBQUs7QUFDdEIsSUFBRSxVQUFVLEVBQUU7QUFDZCxNQUFJQSxNQUFJLEVBQ0osR0FBRSxPQUFPLEtBQUtBLE9BQUs7SUFFbkIsR0FBRSxLQUFLO0FBQ1gsT0FBSyxXQUFXLEdBQUcsSUFBSTtDQUMxQjtBQUNKO0FBRUQsU0FBUyxnQkFBZ0I7Q0FDckIsSUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUk7QUFDeEIsR0FBRSxLQUFLLEtBQUs7Q0FDWixJQUFJLElBQUksS0FBSyxLQUFPLElBQUksS0FBSyxLQUFNLEdBQUksR0FBRyxJQUFJO0FBQzlDLEtBQUksTUFBTSxHQUFHO0FBQ1QsTUFBSSxJQUFJLEtBQUssT0FBTyxJQUFJLEtBQUssTUFBTSxPQUFPLEtBQUssSUFBSSxLQUFLLE9BQU8sRUFDM0QsR0FBRSxPQUFPLElBQUssS0FBSyxLQUFNLEtBQUssS0FBSztBQUV2QyxTQUFPLEtBQUssR0FBRztBQUNYLE9BQUksSUFBSSxHQUFHO0FBQ1AsU0FBSyxLQUFLLE1BQU8sS0FBSyxLQUFLLE1BQVEsSUFBSTtBQUN2QyxTQUFLLEtBQUssRUFBRSxPQUFPLEtBQUssS0FBSyxLQUFLO0dBQ3JDLE9BQ0k7QUFDRCxRQUFLLEtBQUssT0FBTyxLQUFLLEtBQU07QUFDNUIsUUFBSSxLQUFLLEdBQUc7QUFDUixVQUFLLEtBQUs7QUFDVixPQUFFO0lBQ0w7R0FDSjtBQUNELFFBQUssSUFBSSxRQUFTLEVBQ2QsTUFBSztBQUNULE9BQUksS0FBSyxNQUFNLEtBQUssSUFBSSxTQUFVLElBQUksS0FDbEMsR0FBRTtBQUNOLE9BQUksSUFBSSxLQUFLLEtBQUssS0FBSyxFQUNuQixHQUFFLE9BQU87RUFDaEI7Q0FDSjtBQUNELFFBQU87QUFDVjtBQUNELFNBQVMsU0FBUyxHQUFHO0FBQ2pCLFFBQU8sS0FBSyxVQUFVLEVBQUUsSUFBSTtBQUMvQjtBQUNELFNBQVMsTUFBTSxHQUFHO0FBQ2QsUUFBTyxLQUFLLFVBQVUsRUFBRSxHQUFHLElBQUksT0FBTztBQUN6QztBQUNELFNBQVMsTUFBTSxHQUFHO0FBQ2QsUUFBTyxLQUFLLFVBQVUsRUFBRSxHQUFHLElBQUksT0FBTztBQUN6QztBQUVELFNBQVMsYUFBYSxHQUFHLElBQUksR0FBRztDQUM1QixJQUFJLEdBQUcsR0FBRyxJQUFJLEtBQUssSUFBSSxFQUFFLEdBQUcsS0FBSyxFQUFFO0FBQ25DLE1BQUssSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFLEVBQ2pCLEdBQUUsS0FBSyxHQUFHLEtBQUssSUFBSSxFQUFFLEdBQUc7QUFDNUIsS0FBSSxFQUFFLElBQUksS0FBSyxHQUFHO0FBQ2QsTUFBSSxFQUFFLElBQUksS0FBSztBQUNmLE9BQUssSUFBSSxHQUFHLElBQUksS0FBSyxHQUFHLEVBQUUsRUFDdEIsR0FBRSxLQUFLLEdBQUcsS0FBSyxJQUFJLEVBQUU7QUFDekIsSUFBRSxJQUFJLEtBQUs7Q0FDZCxPQUNJO0FBQ0QsTUFBSSxLQUFLLElBQUksS0FBSztBQUNsQixPQUFLLElBQUksR0FBRyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQ25CLEdBQUUsS0FBSyxHQUFHLEdBQUcsRUFBRSxHQUFHO0FBQ3RCLElBQUUsSUFBSSxFQUFFO0NBQ1g7QUFDRCxHQUFFLElBQUksR0FBRyxLQUFLLEdBQUcsRUFBRSxFQUFFO0FBQ3JCLEdBQUUsT0FBTztBQUNaO0FBRUQsU0FBUyxPQUFPLEdBQUcsR0FBRztBQUNsQixRQUFPLElBQUk7QUFDZDtBQUNELFNBQVMsTUFBTSxHQUFHO0NBQ2QsSUFBSSxJQUFJLEtBQUs7QUFDYixNQUFLLFVBQVUsR0FBRyxRQUFRLEVBQUU7QUFDNUIsUUFBTztBQUNWO0FBRUQsU0FBUyxNQUFNLEdBQUcsR0FBRztBQUNqQixRQUFPLElBQUk7QUFDZDtBQUNELFNBQVMsS0FBSyxHQUFHO0NBQ2IsSUFBSSxJQUFJLEtBQUs7QUFDYixNQUFLLFVBQVUsR0FBRyxPQUFPLEVBQUU7QUFDM0IsUUFBTztBQUNWO0FBRUQsU0FBUyxPQUFPLEdBQUcsR0FBRztBQUNsQixRQUFPLElBQUk7QUFDZDtBQUNELFNBQVMsTUFBTSxHQUFHO0NBQ2QsSUFBSSxJQUFJLEtBQUs7QUFDYixNQUFLLFVBQVUsR0FBRyxRQUFRLEVBQUU7QUFDNUIsUUFBTztBQUNWO0FBRUQsU0FBUyxVQUFVLEdBQUcsR0FBRztBQUNyQixRQUFPLEtBQUs7QUFDZjtBQUNELFNBQVMsU0FBUyxHQUFHO0NBQ2pCLElBQUksSUFBSSxLQUFLO0FBQ2IsTUFBSyxVQUFVLEdBQUcsV0FBVyxFQUFFO0FBQy9CLFFBQU87QUFDVjtBQUVELFNBQVMsUUFBUTtDQUNiLElBQUksSUFBSSxLQUFLO0FBQ2IsTUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssR0FBRyxFQUFFLEVBQzFCLEdBQUUsS0FBSyxLQUFLLE1BQU0sS0FBSztBQUMzQixHQUFFLElBQUksS0FBSztBQUNYLEdBQUUsS0FBSyxLQUFLO0FBQ1osUUFBTztBQUNWO0FBRUQsU0FBUyxZQUFZLEdBQUc7Q0FDcEIsSUFBSSxJQUFJLEtBQUs7QUFDYixLQUFJLElBQUksRUFDSixNQUFLLFVBQVUsR0FBRyxFQUFFO0lBRXBCLE1BQUssU0FBUyxHQUFHLEVBQUU7QUFDdkIsUUFBTztBQUNWO0FBRUQsU0FBUyxhQUFhLEdBQUc7Q0FDckIsSUFBSSxJQUFJLEtBQUs7QUFDYixLQUFJLElBQUksRUFDSixNQUFLLFVBQVUsR0FBRyxFQUFFO0lBRXBCLE1BQUssU0FBUyxHQUFHLEVBQUU7QUFDdkIsUUFBTztBQUNWO0FBRUQsU0FBUyxLQUFLLEdBQUc7QUFDYixLQUFJLEtBQUssRUFDTCxRQUFPO0NBQ1gsSUFBSSxJQUFJO0FBQ1IsTUFBSyxJQUFJLFVBQVcsR0FBRztBQUNuQixRQUFNO0FBQ04sT0FBSztDQUNSO0FBQ0QsTUFBSyxJQUFJLFFBQVMsR0FBRztBQUNqQixRQUFNO0FBQ04sT0FBSztDQUNSO0FBQ0QsTUFBSyxJQUFJLE9BQVEsR0FBRztBQUNoQixRQUFNO0FBQ04sT0FBSztDQUNSO0FBQ0QsTUFBSyxJQUFJLE1BQU0sR0FBRztBQUNkLFFBQU07QUFDTixPQUFLO0NBQ1I7QUFDRCxNQUFLLElBQUksTUFBTSxFQUNYLEdBQUU7QUFDTixRQUFPO0FBQ1Y7QUFFRCxTQUFTLG9CQUFvQjtBQUN6QixNQUFLLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxHQUFHLEVBQUUsRUFDMUIsS0FBSSxLQUFLLE1BQU0sRUFDWCxRQUFPLElBQUksS0FBSyxLQUFLLEtBQUssS0FBSyxHQUFHO0FBQzFDLEtBQUksS0FBSyxJQUFJLEVBQ1QsUUFBTyxLQUFLLElBQUksS0FBSztBQUN6QixRQUFPO0FBQ1Y7QUFFRCxTQUFTLEtBQUssR0FBRztDQUNiLElBQUksSUFBSTtBQUNSLFFBQU8sS0FBSyxHQUFHO0FBQ1gsT0FBSyxJQUFJO0FBQ1QsSUFBRTtDQUNMO0FBQ0QsUUFBTztBQUNWO0FBRUQsU0FBUyxhQUFhO0NBQ2xCLElBQUksSUFBSSxHQUFHLElBQUksS0FBSyxJQUFJLEtBQUs7QUFDN0IsTUFBSyxJQUFJLElBQUksR0FBRyxJQUFJLEtBQUssR0FBRyxFQUFFLEVBQzFCLE1BQUssS0FBSyxLQUFLLEtBQUssRUFBRTtBQUMxQixRQUFPO0FBQ1Y7QUFFRCxTQUFTLFVBQVUsR0FBRztDQUNsQixJQUFJLElBQUksS0FBSyxNQUFNLElBQUksS0FBSyxHQUFHO0FBQy9CLEtBQUksS0FBSyxLQUFLLEVBQ1YsUUFBTyxLQUFLLEtBQUs7QUFDckIsU0FBUSxLQUFLLEtBQU0sS0FBSyxJQUFJLEtBQUssT0FBUTtBQUM1QztBQUVELFNBQVMsYUFBYSxHQUFHLElBQUk7Q0FDekIsSUFBSSxJQUFJLFdBQVcsSUFBSSxVQUFVLEVBQUU7QUFDbkMsTUFBSyxVQUFVLEdBQUcsSUFBSSxFQUFFO0FBQ3hCLFFBQU87QUFDVjtBQUVELFNBQVMsU0FBUyxHQUFHO0FBQ2pCLFFBQU8sS0FBSyxVQUFVLEdBQUcsTUFBTTtBQUNsQztBQUVELFNBQVMsV0FBVyxHQUFHO0FBQ25CLFFBQU8sS0FBSyxVQUFVLEdBQUcsVUFBVTtBQUN0QztBQUVELFNBQVMsVUFBVSxHQUFHO0FBQ2xCLFFBQU8sS0FBSyxVQUFVLEdBQUcsT0FBTztBQUNuQztBQUVELFNBQVMsU0FBUyxHQUFHLEdBQUc7Q0FDcEIsSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksS0FBSyxJQUFJLEVBQUUsR0FBRyxLQUFLLEVBQUU7QUFDM0MsUUFBTyxJQUFJLEdBQUc7QUFDVixPQUFLLEtBQUssS0FBSyxFQUFFO0FBQ2pCLElBQUUsT0FBTyxJQUFJLEtBQUs7QUFDbEIsUUFBTSxLQUFLO0NBQ2Q7QUFDRCxLQUFJLEVBQUUsSUFBSSxLQUFLLEdBQUc7QUFDZCxPQUFLLEVBQUU7QUFDUCxTQUFPLElBQUksS0FBSyxHQUFHO0FBQ2YsUUFBSyxLQUFLO0FBQ1YsS0FBRSxPQUFPLElBQUksS0FBSztBQUNsQixTQUFNLEtBQUs7RUFDZDtBQUNELE9BQUssS0FBSztDQUNiLE9BQ0k7QUFDRCxPQUFLLEtBQUs7QUFDVixTQUFPLElBQUksRUFBRSxHQUFHO0FBQ1osUUFBSyxFQUFFO0FBQ1AsS0FBRSxPQUFPLElBQUksS0FBSztBQUNsQixTQUFNLEtBQUs7RUFDZDtBQUNELE9BQUssRUFBRTtDQUNWO0FBQ0QsR0FBRSxJQUFJLElBQUksSUFBSSxLQUFLO0FBQ25CLEtBQUksSUFBSSxFQUNKLEdBQUUsT0FBTztTQUVKLElBQUksR0FDVCxHQUFFLE9BQU8sS0FBSyxLQUFLO0FBQ3ZCLEdBQUUsSUFBSTtBQUNOLEdBQUUsT0FBTztBQUNaO0FBRUQsU0FBUyxNQUFNLEdBQUc7Q0FDZCxJQUFJLElBQUksS0FBSztBQUNiLE1BQUssTUFBTSxHQUFHLEVBQUU7QUFDaEIsUUFBTztBQUNWO0FBRUQsU0FBUyxXQUFXLEdBQUc7Q0FDbkIsSUFBSSxJQUFJLEtBQUs7QUFDYixNQUFLLE1BQU0sR0FBRyxFQUFFO0FBQ2hCLFFBQU87QUFDVjtBQUVELFNBQVMsV0FBVyxHQUFHO0NBQ25CLElBQUksSUFBSSxLQUFLO0FBQ2IsTUFBSyxXQUFXLEdBQUcsRUFBRTtBQUNyQixRQUFPO0FBQ1Y7QUFFRCxTQUFTLFdBQVc7Q0FDaEIsSUFBSSxJQUFJLEtBQUs7QUFDYixNQUFLLFNBQVMsRUFBRTtBQUNoQixRQUFPO0FBQ1Y7QUFFRCxTQUFTLFNBQVMsR0FBRztDQUNqQixJQUFJLElBQUksS0FBSztBQUNiLE1BQUssU0FBUyxHQUFHLEdBQUcsS0FBSztBQUN6QixRQUFPO0FBQ1Y7QUFFRCxTQUFTLFlBQVksR0FBRztDQUNwQixJQUFJLElBQUksS0FBSztBQUNiLE1BQUssU0FBUyxHQUFHLE1BQU0sRUFBRTtBQUN6QixRQUFPO0FBQ1Y7QUFFRCxTQUFTLHFCQUFxQixHQUFHO0NBQzdCLElBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxLQUFLO0FBQ3hCLE1BQUssU0FBUyxHQUFHLEdBQUcsRUFBRTtBQUN0QixRQUFPLElBQUksTUFBTSxHQUFHO0FBQ3ZCO0FBRUQsU0FBUyxhQUFhLEdBQUc7QUFDckIsTUFBSyxLQUFLLEtBQUssS0FBSyxHQUFHLEdBQUcsSUFBSSxHQUFHLE1BQU0sR0FBRyxHQUFHLEtBQUssRUFBRTtBQUNwRCxHQUFFLEtBQUs7QUFDUCxNQUFLLE9BQU87QUFDZjtBQUVELFNBQVMsY0FBYyxHQUFHLEdBQUc7QUFDekIsS0FBSSxLQUFLLEVBQ0w7QUFDSixRQUFPLEtBQUssS0FBSyxFQUNiLE1BQUssS0FBSyxPQUFPO0FBQ3JCLE1BQUssTUFBTTtBQUNYLFFBQU8sS0FBSyxNQUFNLEtBQUssSUFBSTtBQUN2QixPQUFLLE1BQU0sS0FBSztBQUNoQixNQUFJLEVBQUUsS0FBSyxLQUFLLEVBQ1osTUFBSyxLQUFLLE9BQU87QUFDckIsSUFBRSxLQUFLO0NBQ1Y7QUFDSjtBQUVELFNBQVMsVUFBVSxDQUFHO0FBQ3RCLFNBQVMsS0FBSyxHQUFHO0FBQ2IsUUFBTztBQUNWO0FBQ0QsU0FBUyxPQUFPLEdBQUcsR0FBRyxHQUFHO0FBQ3JCLEdBQUUsV0FBVyxHQUFHLEVBQUU7QUFDckI7QUFDRCxTQUFTLE9BQU8sR0FBRyxHQUFHO0FBQ2xCLEdBQUUsU0FBUyxFQUFFO0FBQ2hCO0FBQ0QsUUFBUSxVQUFVLFVBQVU7QUFDNUIsUUFBUSxVQUFVLFNBQVM7QUFDM0IsUUFBUSxVQUFVLFFBQVE7QUFDMUIsUUFBUSxVQUFVLFFBQVE7QUFFMUIsU0FBUyxNQUFNLEdBQUc7QUFDZCxRQUFPLEtBQUssSUFBSSxHQUFHLElBQUksVUFBVTtBQUNwQztBQUdELFNBQVMsbUJBQW1CLEdBQUcsR0FBRyxHQUFHO0NBQ2pDLElBQUksSUFBSSxLQUFLLElBQUksS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQ2pDLEdBQUUsSUFBSTtBQUNOLEdBQUUsSUFBSTtBQUNOLFFBQU8sSUFBSSxFQUNQLEdBQUUsRUFBRSxLQUFLO0NBQ2IsSUFBSTtBQUNKLE1BQUssSUFBSSxFQUFFLElBQUksS0FBSyxHQUFHLElBQUksR0FBRyxFQUFFLEVBQzVCLEdBQUUsSUFBSSxLQUFLLEtBQUssS0FBSyxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLEtBQUssRUFBRTtBQUNyRCxNQUFLLElBQUksS0FBSyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxHQUFHLEVBQUUsRUFDaEMsTUFBSyxHQUFHLEdBQUcsRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLElBQUksRUFBRTtBQUNwQyxHQUFFLE9BQU87QUFDWjtBQUdELFNBQVMsbUJBQW1CLEdBQUcsR0FBRyxHQUFHO0FBQ2pDLEdBQUU7Q0FDRixJQUFJLElBQUssRUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFLElBQUk7QUFDOUIsR0FBRSxJQUFJO0FBQ04sUUFBTyxFQUFFLEtBQUssRUFDVixHQUFFLEtBQUs7QUFDWCxNQUFLLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxHQUFHLEVBQUUsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQ3pDLEdBQUUsS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLLEdBQUcsSUFBSSxHQUFHLEVBQUUsSUFBSSxHQUFHLEdBQUcsR0FBRyxLQUFLLElBQUksSUFBSSxFQUFFO0FBQ3JFLEdBQUUsT0FBTztBQUNULEdBQUUsVUFBVSxHQUFHLEVBQUU7QUFDcEI7QUFFRCxTQUFTLFFBQVEsR0FBRztBQUVoQixNQUFLLEtBQUssS0FBSztBQUNmLE1BQUssS0FBSyxLQUFLO0FBQ2YsWUFBVyxJQUFJLFVBQVUsSUFBSSxFQUFFLEdBQUcsS0FBSyxHQUFHO0FBQzFDLE1BQUssS0FBSyxLQUFLLEdBQUcsT0FBTyxFQUFFO0FBQzNCLE1BQUssSUFBSTtBQUNaO0FBQ0QsU0FBUyxlQUFlLEdBQUc7QUFDdkIsS0FBSSxFQUFFLElBQUksS0FBSyxFQUFFLElBQUksSUFBSSxLQUFLLEVBQUUsRUFDNUIsUUFBTyxFQUFFLElBQUksS0FBSyxFQUFFO1NBRWYsRUFBRSxVQUFVLEtBQUssRUFBRSxHQUFHLEVBQzNCLFFBQU87S0FFTjtFQUNELElBQUksSUFBSSxLQUFLO0FBQ2IsSUFBRSxPQUFPLEVBQUU7QUFDWCxPQUFLLE9BQU8sRUFBRTtBQUNkLFNBQU87Q0FDVjtBQUNKO0FBQ0QsU0FBUyxjQUFjLEdBQUc7QUFDdEIsUUFBTztBQUNWO0FBRUQsU0FBUyxjQUFjLEdBQUc7QUFDdEIsR0FBRSxVQUFVLEtBQUssRUFBRSxJQUFJLEdBQUcsS0FBSyxHQUFHO0FBQ2xDLEtBQUksRUFBRSxJQUFJLEtBQUssRUFBRSxJQUFJLEdBQUc7QUFDcEIsSUFBRSxJQUFJLEtBQUssRUFBRSxJQUFJO0FBQ2pCLElBQUUsT0FBTztDQUNaO0FBQ0QsTUFBSyxHQUFHLGdCQUFnQixLQUFLLElBQUksS0FBSyxFQUFFLElBQUksR0FBRyxLQUFLLEdBQUc7QUFDdkQsTUFBSyxFQUFFLGdCQUFnQixLQUFLLElBQUksS0FBSyxFQUFFLElBQUksR0FBRyxLQUFLLEdBQUc7QUFDdEQsUUFBTyxFQUFFLFVBQVUsS0FBSyxHQUFHLEdBQUcsRUFDMUIsR0FBRSxXQUFXLEdBQUcsS0FBSyxFQUFFLElBQUksRUFBRTtBQUNqQyxHQUFFLE1BQU0sS0FBSyxJQUFJLEVBQUU7QUFDbkIsUUFBTyxFQUFFLFVBQVUsS0FBSyxFQUFFLElBQUksRUFDMUIsR0FBRSxNQUFNLEtBQUssR0FBRyxFQUFFO0FBQ3pCO0FBRUQsU0FBUyxhQUFhLEdBQUcsR0FBRztBQUN4QixHQUFFLFNBQVMsRUFBRTtBQUNiLE1BQUssT0FBTyxFQUFFO0FBQ2pCO0FBRUQsU0FBUyxhQUFhLEdBQUcsR0FBRyxHQUFHO0FBQzNCLEdBQUUsV0FBVyxHQUFHLEVBQUU7QUFDbEIsTUFBSyxPQUFPLEVBQUU7QUFDakI7QUFDRCxRQUFRLFVBQVUsVUFBVTtBQUM1QixRQUFRLFVBQVUsU0FBUztBQUMzQixRQUFRLFVBQVUsU0FBUztBQUMzQixRQUFRLFVBQVUsUUFBUTtBQUMxQixRQUFRLFVBQVUsUUFBUTtBQUUxQixTQUFTLFNBQVMsR0FBRyxHQUFHO0NBR3BCLElBQUksT0FBTyxLQUFLLFNBQVMsR0FBRztDQUM1QixJQUFJLE9BQU8sRUFBRSxTQUFTLEdBQUc7Q0FDekIsSUFBSSxPQUFPLEVBQUUsU0FBUyxHQUFHO0NBQ3pCLElBQUksU0FBUyxPQUFPLFdBQVcsTUFBTSxHQUFHLEVBQUUsV0FBVyxNQUFNLEdBQUcsRUFBRSxXQUFXLE1BQU0sR0FBRyxDQUFDO0FBQ3JGLFFBQU8sSUFBSSxXQUFXLFdBQVcsUUFBUSxHQUFHLEVBQUU7QUF3RGpEO0FBRUQsU0FBUyxNQUFNLEdBQUc7Q0FDZCxJQUFJLElBQUksS0FBSyxJQUFJLElBQUksS0FBSyxRQUFRLEdBQUcsS0FBSyxPQUFPO0NBQ2pELElBQUksSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFLFFBQVEsR0FBRyxFQUFFLE9BQU87QUFDeEMsS0FBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLEdBQUc7RUFDcEIsSUFBSUEsTUFBSTtBQUNSLE1BQUk7QUFDSixNQUFJQTtDQUNQO0NBQ0QsSUFBSSxJQUFJLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLGlCQUFpQjtBQUNwRCxLQUFJLElBQUksRUFDSixRQUFPO0FBQ1gsS0FBSSxJQUFJLEVBQ0osS0FBSTtBQUNSLEtBQUksSUFBSSxHQUFHO0FBQ1AsSUFBRSxTQUFTLEdBQUcsRUFBRTtBQUNoQixJQUFFLFNBQVMsR0FBRyxFQUFFO0NBQ25CO0FBQ0QsUUFBTyxFQUFFLFFBQVEsR0FBRyxHQUFHO0FBQ25CLE9BQUssSUFBSSxFQUFFLGlCQUFpQixJQUFJLEVBQzVCLEdBQUUsU0FBUyxHQUFHLEVBQUU7QUFDcEIsT0FBSyxJQUFJLEVBQUUsaUJBQWlCLElBQUksRUFDNUIsR0FBRSxTQUFTLEdBQUcsRUFBRTtBQUNwQixNQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksR0FBRztBQUNyQixLQUFFLE1BQU0sR0FBRyxFQUFFO0FBQ2IsS0FBRSxTQUFTLEdBQUcsRUFBRTtFQUNuQixPQUNJO0FBQ0QsS0FBRSxNQUFNLEdBQUcsRUFBRTtBQUNiLEtBQUUsU0FBUyxHQUFHLEVBQUU7RUFDbkI7Q0FDSjtBQUNELEtBQUksSUFBSSxFQUNKLEdBQUUsU0FBUyxHQUFHLEVBQUU7QUFDcEIsUUFBTztBQUNWO0FBRUQsU0FBUyxVQUFVLEdBQUc7QUFDbEIsS0FBSSxLQUFLLEVBQ0wsUUFBTztDQUNYLElBQUksSUFBSSxLQUFLLEtBQUssR0FBRyxJQUFJLEtBQUssSUFBSSxJQUFJLElBQUksSUFBSTtBQUM5QyxLQUFJLEtBQUssSUFBSSxFQUNULEtBQUksS0FBSyxFQUNMLEtBQUksS0FBSyxLQUFLO0lBR2QsTUFBSyxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxHQUFHLEVBQUUsRUFDL0IsTUFBSyxJQUFJLElBQUksS0FBSyxNQUFNO0FBR3BDLFFBQU87QUFDVjtBQUVELFNBQVMsYUFBYSxHQUFHO0NBQ3JCLElBQUksS0FBSyxFQUFFLFFBQVE7QUFDbkIsS0FBSyxLQUFLLFFBQVEsSUFBSSxNQUFPLEVBQUUsUUFBUSxJQUFJLEVBQ3ZDLFFBQU8sV0FBVztDQUN0QixJQUFJLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxLQUFLLE9BQU87Q0FDbkMsSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLElBQUksSUFBSSxFQUFFLEVBQUUsSUFBSSxJQUFJLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtBQUNsRCxRQUFPLEVBQUUsUUFBUSxJQUFJLEdBQUc7QUFDcEIsU0FBTyxFQUFFLFFBQVEsRUFBRTtBQUNmLEtBQUUsU0FBUyxHQUFHLEVBQUU7QUFDaEIsT0FBSSxJQUFJO0FBQ0osU0FBSyxFQUFFLFFBQVEsS0FBSyxFQUFFLFFBQVEsRUFBRTtBQUM1QixPQUFFLE1BQU0sTUFBTSxFQUFFO0FBQ2hCLE9BQUUsTUFBTSxHQUFHLEVBQUU7SUFDaEI7QUFDRCxNQUFFLFNBQVMsR0FBRyxFQUFFO0dBQ25CLFlBQ1MsRUFBRSxRQUFRLENBQ2hCLEdBQUUsTUFBTSxHQUFHLEVBQUU7QUFDakIsS0FBRSxTQUFTLEdBQUcsRUFBRTtFQUNuQjtBQUNELFNBQU8sRUFBRSxRQUFRLEVBQUU7QUFDZixLQUFFLFNBQVMsR0FBRyxFQUFFO0FBQ2hCLE9BQUksSUFBSTtBQUNKLFNBQUssRUFBRSxRQUFRLEtBQUssRUFBRSxRQUFRLEVBQUU7QUFDNUIsT0FBRSxNQUFNLE1BQU0sRUFBRTtBQUNoQixPQUFFLE1BQU0sR0FBRyxFQUFFO0lBQ2hCO0FBQ0QsTUFBRSxTQUFTLEdBQUcsRUFBRTtHQUNuQixZQUNTLEVBQUUsUUFBUSxDQUNoQixHQUFFLE1BQU0sR0FBRyxFQUFFO0FBQ2pCLEtBQUUsU0FBUyxHQUFHLEVBQUU7RUFDbkI7QUFDRCxNQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksR0FBRztBQUNyQixLQUFFLE1BQU0sR0FBRyxFQUFFO0FBQ2IsT0FBSSxHQUNBLEdBQUUsTUFBTSxHQUFHLEVBQUU7QUFDakIsS0FBRSxNQUFNLEdBQUcsRUFBRTtFQUNoQixPQUNJO0FBQ0QsS0FBRSxNQUFNLEdBQUcsRUFBRTtBQUNiLE9BQUksR0FDQSxHQUFFLE1BQU0sR0FBRyxFQUFFO0FBQ2pCLEtBQUUsTUFBTSxHQUFHLEVBQUU7RUFDaEI7Q0FDSjtBQUNELEtBQUksRUFBRSxVQUFVLFdBQVcsSUFBSSxJQUFJLEVBQy9CLFFBQU8sV0FBVztBQUN0QixLQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFDbEIsUUFBTyxFQUFFLFNBQVMsRUFBRTtBQUN4QixLQUFJLEVBQUUsUUFBUSxHQUFHLEVBQ2IsR0FBRSxNQUFNLEdBQUcsRUFBRTtJQUViLFFBQU87QUFDWCxLQUFJLEVBQUUsUUFBUSxHQUFHLEVBQ2IsUUFBTyxFQUFFLElBQUksRUFBRTtJQUVmLFFBQU87QUFDZDtBQUNELElBQUksWUFBWTtDQUNaO0NBQUc7Q0FBRztDQUFHO0NBQUc7Q0FBSTtDQUFJO0NBQUk7Q0FBSTtDQUFJO0NBQUk7Q0FBSTtDQUFJO0NBQUk7Q0FBSTtDQUFJO0NBQUk7Q0FBSTtDQUFJO0NBQUk7Q0FBSTtDQUFJO0NBQUk7Q0FBSTtDQUFJO0NBQUk7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQ3ZKO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQ3RKO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQ3RKO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQ3RKO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztDQUFLO0NBQUs7Q0FBSztD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