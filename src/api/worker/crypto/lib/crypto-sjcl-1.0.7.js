/** @fileOverview Javascript cryptography implementation.
 *
 * Crush to remove comments, shorten variable names and
 * generally reduce transmission size.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */


// CHANGED (tutao.arm)
// - added option to not use padding in encrypt/decrypt in cbc mode
// Configured with: ./configure --with-codecArrayBuffer --with-cbc --with-sha1 --with-sha512 --with-codecBytes --without-ccm --without-ocb2 --without-pbkdf2 --without-convenience --compress=none

"use strict";
/*jslint indent: 2, bitwise: false, nomen: false, plusplus: false, white: false, regexp: false */
/*global document, window, escape, unescape, module, require, Uint32Array */

/**
 * The Stanford Javascript Crypto Library, top-level namespace.
 * @namespace
 */
var sjcl = {
	/**
	 * Symmetric ciphers.
	 * @namespace
	 */
	cipher: {},

	/**
	 * Hash functions.  Right now only SHA256 is implemented.
	 * @namespace
	 */
	hash: {},

	/**
	 * Key exchange functions.  Right now only SRP is implemented.
	 * @namespace
	 */
	keyexchange: {},

	/**
	 * Cipher modes of operation.
	 * @namespace
	 */
	mode: {},

	/**
	 * Miscellaneous.  HMAC and PBKDF2.
	 * @namespace
	 */
	misc: {},

	/**
	 * Bit array encoders and decoders.
	 * @namespace
	 *
	 * @description
	 * The members of this namespace are functions which translate between
	 * SJCL's bitArrays and other objects (usually strings).  Because it
	 * isn't always clear which direction is encoding and which is decoding,
	 * the method names are "fromBits" and "toBits".
	 */
	codec: {},

	/**
	 * Exceptions.
	 * @namespace
	 */
	exception: {
		/**
		 * Ciphertext is corrupt.
		 * @constructor
		 */
		corrupt: function (message) {
			this.toString = function () {
				return "CORRUPT: " + this.message;
			};
			this.message = message;
		},

		/**
		 * Invalid parameter.
		 * @constructor
		 */
		invalid: function (message) {
			this.toString = function () {
				return "INVALID: " + this.message;
			};
			this.message = message;
		},

		/**
		 * Bug or missing feature in SJCL.
		 * @constructor
		 */
		bug: function (message) {
			this.toString = function () {
				return "BUG: " + this.message;
			};
			this.message = message;
		},

		/**
		 * Something isn't ready.
		 * @constructor
		 */
		notReady: function (message) {
			this.toString = function () {
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
sjcl.cipher.aes = function (key) {
	if (!this._tables[0][0][0]) {
		this._precompute();
	}

	var i, j, tmp,
		encKey, decKey,
		sbox = this._tables[0][4], decTable = this._tables[1],
		keyLen = key.length, rcon = 1;

	if (keyLen !== 4 && keyLen !== 6 && keyLen !== 8) {
		throw new sjcl.exception.invalid("invalid aes key size");
	}

	this._key = [encKey = key.slice(0), decKey = []];

	// schedule encryption keys
	for (i = keyLen; i < 4 * keyLen + 28; i++) {
		tmp = encKey[i - 1];

		// apply sbox
		if (i % keyLen === 0 || (keyLen === 8 && i % keyLen === 4)) {
			tmp = sbox[tmp >>> 24] << 24 ^ sbox[tmp >> 16 & 255] << 16 ^ sbox[tmp >> 8 & 255] << 8 ^ sbox[tmp & 255];

			// shift rows and add rcon
			if (i % keyLen === 0) {
				tmp = tmp << 8 ^ tmp >>> 24 ^ rcon << 24;
				rcon = rcon << 1 ^ (rcon >> 7) * 283;
			}
		}

		encKey[i] = encKey[i - keyLen] ^ tmp;
	}

	// schedule decryption keys
	for (j = 0; i; j++, i--) {
		tmp = encKey[j & 3 ? i : i - 4];
		if (i <= 4 || j < 4) {
			decKey[j] = tmp;
		} else {
			decKey[j] = decTable[0][sbox[tmp >>> 24]] ^
				decTable[1][sbox[tmp >> 16 & 255]] ^
				decTable[2][sbox[tmp >> 8 & 255]] ^
				decTable[3][sbox[tmp & 255]];
		}
	}
};

sjcl.cipher.aes.prototype = {
	// public
	/* Something like this might appear here eventually
	 name: "AES",
	 blockSize: 4,
	 keySizes: [4,6,8],
	 */

	/**
	 * Encrypt an array of 4 big-endian words.
	 * @param {Array} data The plaintext.
	 * @return {Array} The ciphertext.
	 */
	encrypt: function (data) {
		return this._crypt(data, 0);
	},

	/**
	 * Decrypt an array of 4 big-endian words.
	 * @param {Array} data The ciphertext.
	 * @return {Array} The plaintext.
	 */
	decrypt: function (data) {
		return this._crypt(data, 1);
	},

	/**
	 * The expanded S-box and inverse S-box tables.  These will be computed
	 * on the client so that we don't have to send them down the wire.
	 *
	 * There are two tables, _tables[0] is for encryption and
	 * _tables[1] is for decryption.
	 *
	 * The first 4 sub-tables are the expanded S-box with MixColumns.  The
	 * last (_tables[01][4]) is the S-box itself.
	 *
	 * @private
	 */
	_tables: [[[], [], [], [], []], [[], [], [], [], []]],

	/**
	 * Expand the S-box tables.
	 *
	 * @private
	 */
	_precompute: function () {
		var encTable = this._tables[0], decTable = this._tables[1],
			sbox = encTable[4], sboxInv = decTable[4],
			i, x, xInv, d = [], th = [], x2, x4, x8, s, tEnc, tDec;

		// Compute double and third tables
		for (i = 0; i < 256; i++) {
			th[(d[i] = i << 1 ^ (i >> 7) * 283) ^ i] = i;
		}

		for (x = xInv = 0; !sbox[x]; x ^= x2 || 1, xInv = th[xInv] || 1) {
			// Compute sbox
			s = xInv ^ xInv << 1 ^ xInv << 2 ^ xInv << 3 ^ xInv << 4;
			s = s >> 8 ^ s & 255 ^ 99;
			sbox[x] = s;
			sboxInv[s] = x;

			// Compute MixColumns
			x8 = d[x4 = d[x2 = d[x]]];
			tDec = x8 * 0x1010101 ^ x4 * 0x10001 ^ x2 * 0x101 ^ x * 0x1010100;
			tEnc = d[s] * 0x101 ^ s * 0x1010100;

			for (i = 0; i < 4; i++) {
				encTable[i][x] = tEnc = tEnc << 24 ^ tEnc >>> 8;
				decTable[i][s] = tDec = tDec << 24 ^ tDec >>> 8;
			}
		}

		// Compactify.  Considerable speedup on Firefox.
		for (i = 0; i < 5; i++) {
			encTable[i] = encTable[i].slice(0);
			decTable[i] = decTable[i].slice(0);
		}
	},

	/**
	 * Encryption and decryption core.
	 * @param {Array} input Four words to be encrypted or decrypted.
	 * @param dir The direction, 0 for encrypt and 1 for decrypt.
	 * @return {Array} The four encrypted or decrypted words.
	 * @private
	 */
	_crypt: function (input, dir) {
		if (input.length !== 4) {
			throw new sjcl.exception.invalid("invalid aes block size");
		}

		var key = this._key[dir],
			// state variables a,b,c,d are loaded with pre-whitened data
			a = input[0] ^ key[0],
			b = input[dir ? 3 : 1] ^ key[1],
			c = input[2] ^ key[2],
			d = input[dir ? 1 : 3] ^ key[3],
			a2, b2, c2,

			nInnerRounds = key.length / 4 - 2,
			i,
			kIndex = 4,
			out = [0, 0, 0, 0],
			table = this._tables[dir],

			// load up the tables
			t0 = table[0],
			t1 = table[1],
			t2 = table[2],
			t3 = table[3],
			sbox = table[4];

		// Inner rounds.  Cribbed from OpenSSL.
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

		// Last round.
		for (i = 0; i < 4; i++) {
			out[dir ? 3 & -i : i] =
				sbox[a >>> 24] << 24 ^
				sbox[b >> 16 & 255] << 16 ^
				sbox[c >> 8 & 255] << 8 ^
				sbox[d & 255] ^
				key[kIndex++];
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
	/**
	 * Array slices in units of bits.
	 * @param {bitArray} a The array to slice.
	 * @param {Number} bstart The offset to the start of the slice, in bits.
	 * @param {Number} bend The offset to the end of the slice, in bits.  If this is undefined,
	 * slice until the end of the array.
	 * @return {bitArray} The requested slice.
	 */
	bitSlice: function (a, bstart, bend) {
		a = sjcl.bitArray._shiftRight(a.slice(bstart / 32), 32 - (bstart & 31)).slice(1);
		return (bend === undefined) ? a : sjcl.bitArray.clamp(a, bend - bstart);
	},

	/**
	 * Extract a number packed into a bit array.
	 * @param {bitArray} a The array to slice.
	 * @param {Number} bstart The offset to the start of the slice, in bits.
	 * @param {Number} blength The length of the number to extract.
	 * @return {Number} The requested slice.
	 */
	extract: function (a, bstart, blength) {
		// FIXME: this Math.floor is not necessary at all, but for some reason
		// seems to suppress a bug in the Chromium JIT.
		var x, sh = Math.floor((-bstart - blength) & 31);
		if ((bstart + blength - 1 ^ bstart) & -32) {
			// it crosses a boundary
			x = (a[bstart / 32 | 0] << (32 - sh)) ^ (a[bstart / 32 + 1 | 0] >>> sh);
		} else {
			// within a single word
			x = a[bstart / 32 | 0] >>> sh;
		}
		return x & ((1 << blength) - 1);
	},

	/**
	 * Concatenate two bit arrays.
	 * @param {bitArray} a1 The first array.
	 * @param {bitArray} a2 The second array.
	 * @return {bitArray} The concatenation of a1 and a2.
	 */
	concat: function (a1, a2) {
		if (a1.length === 0 || a2.length === 0) {
			return a1.concat(a2);
		}

		var last = a1[a1.length - 1], shift = sjcl.bitArray.getPartial(last);
		if (shift === 32) {
			return a1.concat(a2);
		} else {
			return sjcl.bitArray._shiftRight(a2, shift, last | 0, a1.slice(0, a1.length - 1));
		}
	},

	/**
	 * Find the length of an array of bits.
	 * @param {bitArray} a The array.
	 * @return {Number} The length of a, in bits.
	 */
	bitLength: function (a) {
		var l = a.length, x;
		if (l === 0) {
			return 0;
		}
		x = a[l - 1];
		return (l - 1) * 32 + sjcl.bitArray.getPartial(x);
	},

	/**
	 * Truncate an array.
	 * @param {bitArray} a The array.
	 * @param {Number} len The length to truncate to, in bits.
	 * @return {bitArray} A new array, truncated to len bits.
	 */
	clamp: function (a, len) {
		if (a.length * 32 < len) {
			return a;
		}
		a = a.slice(0, Math.ceil(len / 32));
		var l = a.length;
		len = len & 31;
		if (l > 0 && len) {
			a[l - 1] = sjcl.bitArray.partial(len, a[l - 1] & 0x80000000 >> (len - 1), 1);
		}
		return a;
	},

	/**
	 * Make a partial word for a bit array.
	 * @param {Number} len The number of bits in the word.
	 * @param {Number} x The bits.
	 * @param {Number} [_end=0] Pass 1 if x has already been shifted to the high side.
	 * @return {Number} The partial word.
	 */
	partial: function (len, x, _end) {
		if (len === 32) {
			return x;
		}
		return (_end ? x | 0 : x << (32 - len)) + len * 0x10000000000;
	},

	/**
	 * Get the number of bits used by a partial word.
	 * @param {Number} x The partial word.
	 * @return {Number} The number of bits used by the partial word.
	 */
	getPartial: function (x) {
		return Math.round(x / 0x10000000000) || 32;
	},

	/**
	 * Compare two arrays for equality in a predictable amount of time.
	 * @param {bitArray} a The first array.
	 * @param {bitArray} b The second array.
	 * @return {boolean} true if a == b; false otherwise.
	 */
	equal: function (a, b) {
		if (sjcl.bitArray.bitLength(a) !== sjcl.bitArray.bitLength(b)) {
			return false;
		}
		var x = 0, i;
		for (i = 0; i < a.length; i++) {
			x |= a[i] ^ b[i];
		}
		return (x === 0);
	},

	/** Shift an array right.
	 * @param {bitArray} a The array to shift.
	 * @param {Number} shift The number of bits to shift.
	 * @param {Number} [carry=0] A byte to carry in
	 * @param {bitArray} [out=[]] An array to prepend to the output.
	 * @private
	 */
	_shiftRight: function (a, shift, carry, out) {
		var i, last2 = 0, shift2;
		if (out === undefined) {
			out = [];
		}

		for (; shift >= 32; shift -= 32) {
			out.push(carry);
			carry = 0;
		}
		if (shift === 0) {
			return out.concat(a);
		}

		for (i = 0; i < a.length; i++) {
			out.push(carry | a[i] >>> shift);
			carry = a[i] << (32 - shift);
		}
		last2 = a.length ? a[a.length - 1] : 0;
		shift2 = sjcl.bitArray.getPartial(last2);
		out.push(sjcl.bitArray.partial(shift + shift2 & 31, (shift + shift2 > 32) ? carry : out.pop(), 1));
		return out;
	},

	/** xor a block of 4 words together.
	 * @private
	 */
	_xor4: function (x, y) {
		return [x[0] ^ y[0], x[1] ^ y[1], x[2] ^ y[2], x[3] ^ y[3]];
	},

	/** byteswap a word array inplace.
	 * (does not handle partial words)
	 * @param {sjcl.bitArray} a word array
	 * @return {sjcl.bitArray} byteswapped array
	 */
	byteswapM: function (a) {
		var i, v, m = 0xff00;
		for (i = 0; i < a.length; ++i) {
			v = a[i];
			a[i] = (v >>> 24) | ((v >>> 8) & m) | ((v & m) << 8) | (v << 24);
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
	/** Convert from a bitArray to a UTF-8 string. */
	fromBits: function (arr) {
		var out = "", bl = sjcl.bitArray.bitLength(arr), i, tmp;
		for (i = 0; i < bl / 8; i++) {
			if ((i & 3) === 0) {
				tmp = arr[i / 4];
			}
			out += String.fromCharCode(tmp >>> 8 >>> 8 >>> 8);
			tmp <<= 8;
		}
		return decodeURIComponent(escape(out));
	},

	/** Convert from a UTF-8 string to a bitArray. */
	toBits: function (str) {
		str = unescape(encodeURIComponent(str));
		var out = [], i, tmp = 0;
		for (i = 0; i < str.length; i++) {
			tmp = tmp << 8 | str.charCodeAt(i);
			if ((i & 3) === 3) {
				out.push(tmp);
				tmp = 0;
			}
		}
		if (i & 3) {
			out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
		}
		return out;
	}
};
/** @fileOverview Bit array codec implementations.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * Hexadecimal
 * @namespace
 */
sjcl.codec.hex = {
	/** Convert from a bitArray to a hex string. */
	fromBits: function (arr) {
		var out = "", i;
		for (i = 0; i < arr.length; i++) {
			out += ((arr[i] | 0) + 0xF00000000000).toString(16).substr(4);
		}
		return out.substr(0, sjcl.bitArray.bitLength(arr) / 4);//.replace(/(.{8})/g, "$1 ");
	},
	/** Convert from a hex string to a bitArray. */
	toBits: function (str) {
		var i, out = [], len;
		str = str.replace(/\s|0x/g, "");
		len = str.length;
		str = str + "00000000";
		for (i = 0; i < str.length; i += 8) {
			out.push(parseInt(str.substr(i, 8), 16) ^ 0);
		}
		return sjcl.bitArray.clamp(out, len * 4);
	}
};

/** @fileOverview Bit array codec implementations.
 *
 * @author Nils Kenneweg
 */

/**
 * Base32 encoding/decoding
 * @namespace
 */
sjcl.codec.base32 = {
	/** The base32 alphabet.
	 * @private
	 */
	_chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
	_hexChars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",

	/* bits in an array */
	BITS: 32,
	/* base to encode at (2^x) */
	BASE: 5,
	/* bits - base */
	REMAINING: 27,

	/** Convert from a bitArray to a base32 string. */
	fromBits: function (arr, _noEquals, _hex) {
		var BITS = sjcl.codec.base32.BITS, BASE = sjcl.codec.base32.BASE, REMAINING = sjcl.codec.base32.REMAINING;
		var out = "", i, bits = 0, c = sjcl.codec.base32._chars, ta = 0, bl = sjcl.bitArray.bitLength(arr);

		if (_hex) {
			c = sjcl.codec.base32._hexChars;
		}

		for (i = 0; out.length * BASE < bl;) {
			out += c.charAt((ta ^ arr[i] >>> bits) >>> REMAINING);
			if (bits < BASE) {
				ta = arr[i] << (BASE - bits);
				bits += REMAINING;
				i++;
			} else {
				ta <<= BASE;
				bits -= BASE;
			}
		}
		while ((out.length & 7) && !_noEquals) {
			out += "=";
		}

		return out;
	},

	/** Convert from a base32 string to a bitArray */
	toBits: function (str, _hex) {
		str = str.replace(/\s|=/g, '').toUpperCase();
		var BITS = sjcl.codec.base32.BITS, BASE = sjcl.codec.base32.BASE, REMAINING = sjcl.codec.base32.REMAINING;
		var out = [], i, bits = 0, c = sjcl.codec.base32._chars, ta = 0, x, format = "base32";

		if (_hex) {
			c = sjcl.codec.base32._hexChars;
			format = "base32hex";
		}

		for (i = 0; i < str.length; i++) {
			x = c.indexOf(str.charAt(i));
			if (x < 0) {
				// Invalid character, try hex format
				if (!_hex) {
					try {
						return sjcl.codec.base32hex.toBits(str);
					}
					catch (e) {
					}
				}
				throw new sjcl.exception.invalid("this isn't " + format + "!");
			}
			if (bits > REMAINING) {
				bits -= REMAINING;
				out.push(ta ^ x >>> bits);
				ta = x << (BITS - bits);
			} else {
				bits += BASE;
				ta ^= x << (BITS - bits);
			}
		}
		if (bits & 56) {
			out.push(sjcl.bitArray.partial(bits & 56, ta, 1));
		}
		return out;
	}
};

sjcl.codec.base32hex = {
	fromBits: function (arr, _noEquals) {
		return sjcl.codec.base32.fromBits(arr, _noEquals, 1);
	},
	toBits: function (str) {
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
	/** The base64 alphabet.
	 * @private
	 */
	_chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",

	/** Convert from a bitArray to a base64 string. */
	fromBits: function (arr, _noEquals, _url) {
		var out = "", i, bits = 0, c = sjcl.codec.base64._chars, ta = 0, bl = sjcl.bitArray.bitLength(arr);
		if (_url) {
			c = c.substr(0, 62) + '-_';
		}
		for (i = 0; out.length * 6 < bl;) {
			out += c.charAt((ta ^ arr[i] >>> bits) >>> 26);
			if (bits < 6) {
				ta = arr[i] << (6 - bits);
				bits += 26;
				i++;
			} else {
				ta <<= 6;
				bits -= 6;
			}
		}
		while ((out.length & 3) && !_noEquals) {
			out += "=";
		}
		return out;
	},

	/** Convert from a base64 string to a bitArray */
	toBits: function (str, _url) {
		str = str.replace(/\s|=/g, '');
		var out = [], i, bits = 0, c = sjcl.codec.base64._chars, ta = 0, x;
		if (_url) {
			c = c.substr(0, 62) + '-_';
		}
		for (i = 0; i < str.length; i++) {
			x = c.indexOf(str.charAt(i));
			if (x < 0) {
				throw new sjcl.exception.invalid("this isn't base64!");
			}
			if (bits > 26) {
				bits -= 26;
				out.push(ta ^ x >>> bits);
				ta = x << (32 - bits);
			} else {
				bits += 6;
				ta ^= x << (32 - bits);
			}
		}
		if (bits & 56) {
			out.push(sjcl.bitArray.partial(bits & 56, ta, 1));
		}
		return out;
	}
};

sjcl.codec.base64url = {
	fromBits: function (arr) {
		return sjcl.codec.base64.fromBits(arr, 1, 1);
	},
	toBits: function (str) {
		return sjcl.codec.base64.toBits(str, 1);
	}
};
/** @fileOverview Bit array codec implementations.
 *
 * @author Emily Stark
 * @author Mike Hamburg
 * @author Dan Boneh
 */

/**
 * Arrays of bytes
 * @namespace
 */
sjcl.codec.bytes = {
	/** Convert from a bitArray to an array of bytes. */
	fromBits: function (arr) {
		var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
		for (i = 0; i < bl / 8; i++) {
			if ((i & 3) === 0) {
				tmp = arr[i / 4];
			}
			out.push(tmp >>> 24);
			tmp <<= 8;
		}
		return out;
	},
	/** Convert from an array of bytes to a bitArray. */
	toBits: function (bytes) {
		var out = [], i, tmp = 0;
		for (i = 0; i < bytes.length; i++) {
			tmp = tmp << 8 | bytes[i];
			if ((i & 3) === 3) {
				out.push(tmp);
				tmp = 0;
			}
		}
		if (i & 3) {
			out.push(sjcl.bitArray.partial(8 * (i & 3), tmp));
		}
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
sjcl.hash.sha256 = function (hash) {
	if (!this._key[0]) {
		this._precompute();
	}
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else {
		this.reset();
	}
};

/**
 * Hash a string or an array of words.
 * @static
 * @param {bitArray|String} data the data to hash.
 * @return {bitArray} The hash value, an array of 16 big-endian words.
 */
sjcl.hash.sha256.hash = function (data) {
	return (new sjcl.hash.sha256()).update(data).finalize();
};

sjcl.hash.sha256.prototype = {
	/**
	 * The hash's block size, in bits.
	 * @constant
	 */
	blockSize: 512,

	/**
	 * Reset the hash state.
	 * @return this
	 */
	reset: function () {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},

	/**
	 * Input several words to the hash.
	 * @param {bitArray|String} data the data to hash.
	 * @return this
	 */
	update: function (data) {
		if (typeof data === "string") {
			data = sjcl.codec.utf8String.toBits(data);
		}
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
			ol = this._length,
			nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) {
			throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		}

		if (typeof Uint32Array !== 'undefined') {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = 512 + ol - ((512 + ol) & 511); i <= nl; i += 512) {
				this._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
		} else {
			for (i = 512 + ol - ((512 + ol) & 511); i <= nl; i += 512) {
				this._block(b.splice(0, 16));
			}
		}
		return this;
	},

	/**
	 * Complete hashing and output the hash value.
	 * @return {bitArray} The hash value, an array of 8 big-endian words.
	 */
	finalize: function () {
		var i, b = this._buffer, h = this._h;

		// Round out and push the buffer
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);

		// Round out the buffer to a multiple of 16 words, less the 2 length words.
		for (i = b.length + 2; i & 15; i++) {
			b.push(0);
		}

		// append the length
		b.push(Math.floor(this._length / 0x100000000));
		b.push(this._length | 0);

		while (b.length) {
			this._block(b.splice(0, 16));
		}

		this.reset();
		return h;
	},

	/**
	 * The SHA-256 initialization vector, to be precomputed.
	 * @private
	 */
	_init: [],
	/*
	 _init:[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19],
	 */

	/**
	 * The SHA-256 hash key, to be precomputed.
	 * @private
	 */
	_key: [],
	/*
	 _key:
	 [0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2],
	 */


	/**
	 * Function to precompute _init and _key.
	 * @private
	 */
	_precompute: function () {
		var i = 0, prime = 2, factor, isPrime;

		function frac(x) {
			return (x - Math.floor(x)) * 0x100000000 | 0;
		}

		for (; i < 64; prime++) {
			isPrime = true;
			for (factor = 2; factor * factor <= prime; factor++) {
				if (prime % factor === 0) {
					isPrime = false;
					break;
				}
			}
			if (isPrime) {
				if (i < 8) {
					this._init[i] = frac(Math.pow(prime, 1 / 2));
				}
				this._key[i] = frac(Math.pow(prime, 1 / 3));
				i++;
			}
		}
	},

	/**
	 * Perform one cycle of SHA-256.
	 * @param {Uint32Array|bitArray} w one block of words.
	 * @private
	 */
	_block: function (w) {
		var i, tmp, a, b,
			h = this._h,
			k = this._key,
			h0 = h[0], h1 = h[1], h2 = h[2], h3 = h[3],
			h4 = h[4], h5 = h[5], h6 = h[6], h7 = h[7];

		/* Rationale for placement of |0 :
		 * If a value can overflow is original 32 bits by a factor of more than a few
		 * million (2^23 ish), there is a possibility that it might overflow the
		 * 53-bit mantissa and lose precision.
		 *
		 * To avoid this, we clamp back to 32 bits by |'ing with 0 on any value that
		 * propagates around the loop, and on the hash state h[].  I don't believe
		 * that the clamps on h4 and on h0 are strictly necessary, but it's close
		 * (for h4 anyway), and better safe than sorry.
		 *
		 * The clamps on h[] are necessary for the output to be correct even in the
		 * common case and for short inputs.
		 */
		for (i = 0; i < 64; i++) {
			// load up the input word for this round
			if (i < 16) {
				tmp = w[i];
			} else {
				a = w[(i + 1) & 15];
				b = w[(i + 14) & 15];
				tmp = w[i & 15] = ((a >>> 7 ^ a >>> 18 ^ a >>> 3 ^ a << 25 ^ a << 14) +
					(b >>> 17 ^ b >>> 19 ^ b >>> 10 ^ b << 15 ^ b << 13) +
					w[i & 15] + w[(i + 9) & 15]) | 0;
			}

			tmp = (tmp + h7 + (h4 >>> 6 ^ h4 >>> 11 ^ h4 >>> 25 ^ h4 << 26 ^ h4 << 21 ^ h4 << 7) + (h6 ^ h4 & (h5 ^ h6))
				+ k[i]); // | 0;

			// shift register
			h7 = h6;
			h6 = h5;
			h5 = h4;
			h4 = h3 + tmp | 0;
			h3 = h2;
			h2 = h1;
			h1 = h0;

			h0 = (tmp + ((h1 & h2) ^ (h3 & (h1 ^ h2))) + (h1 >>> 2 ^ h1 >>> 13 ^ h1 >>> 22 ^ h1 << 30 ^ h1 << 19 ^ h1
				<< 10)) | 0;
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
sjcl.hash.sha512 = function (hash) {
	if (!this._key[0]) {
		this._precompute();
	}
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else {
		this.reset();
	}
};

/**
 * Hash a string or an array of words.
 * @static
 * @param {bitArray|String} data the data to hash.
 * @return {bitArray} The hash value, an array of 16 big-endian words.
 */
sjcl.hash.sha512.hash = function (data) {
	return (new sjcl.hash.sha512()).update(data).finalize();
};

sjcl.hash.sha512.prototype = {
	/**
	 * The hash's block size, in bits.
	 * @constant
	 */
	blockSize: 1024,

	/**
	 * Reset the hash state.
	 * @return this
	 */
	reset: function () {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},

	/**
	 * Input several words to the hash.
	 * @param {bitArray|String} data the data to hash.
	 * @return this
	 */
	update: function (data) {
		if (typeof data === "string") {
			data = sjcl.codec.utf8String.toBits(data);
		}
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
			ol = this._length,
			nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) {
			throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		}

		if (typeof Uint32Array !== 'undefined') {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = 1024 + ol - ((1024 + ol) & 1023); i <= nl; i += 1024) {
				this._block(c.subarray(32 * j, 32 * (j + 1)));
				j += 1;
			}
			b.splice(0, 32 * j);
		} else {
			for (i = 1024 + ol - ((1024 + ol) & 1023); i <= nl; i += 1024) {
				this._block(b.splice(0, 32));
			}
		}
		return this;
	},

	/**
	 * Complete hashing and output the hash value.
	 * @return {bitArray} The hash value, an array of 16 big-endian words.
	 */
	finalize: function () {
		var i, b = this._buffer, h = this._h;

		// Round out and push the buffer
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);

		// Round out the buffer to a multiple of 32 words, less the 4 length words.
		for (i = b.length + 4; i & 31; i++) {
			b.push(0);
		}

		// append the length
		b.push(0);
		b.push(0);
		b.push(Math.floor(this._length / 0x100000000));
		b.push(this._length | 0);

		while (b.length) {
			this._block(b.splice(0, 32));
		}

		this.reset();
		return h;
	},

	/**
	 * The SHA-512 initialization vector, to be precomputed.
	 * @private
	 */
	_init: [],

	/**
	 * Least significant 24 bits of SHA512 initialization values.
	 *
	 * Javascript only has 53 bits of precision, so we compute the 40 most
	 * significant bits and add the remaining 24 bits as constants.
	 *
	 * @private
	 */
	_initr: [0xbcc908, 0xcaa73b, 0x94f82b, 0x1d36f1, 0xe682d1, 0x3e6c1f, 0x41bd6b, 0x7e2179],

	/*
  _init:
  [0x6a09e667, 0xf3bcc908, 0xbb67ae85, 0x84caa73b, 0x3c6ef372, 0xfe94f82b, 0xa54ff53a, 0x5f1d36f1,
   0x510e527f, 0xade682d1, 0x9b05688c, 0x2b3e6c1f, 0x1f83d9ab, 0xfb41bd6b, 0x5be0cd19, 0x137e2179],
  */

	/**
	 * The SHA-512 hash key, to be precomputed.
	 * @private
	 */
	_key: [],

	/**
	 * Least significant 24 bits of SHA512 key values.
	 * @private
	 */
	_keyr:
		[
			0x28ae22, 0xef65cd, 0x4d3b2f, 0x89dbbc, 0x48b538, 0x05d019, 0x194f9b, 0x6d8118,
			0x030242, 0x706fbe, 0xe4b28c, 0xffb4e2, 0x7b896f, 0x1696b1, 0xc71235, 0x692694,
			0xf14ad2, 0x4f25e3, 0x8cd5b5, 0xac9c65, 0x2b0275, 0xa6e483, 0x41fbd4, 0x1153b5,
			0x66dfab, 0xb43210, 0xfb213f, 0xef0ee4, 0xa88fc2, 0x0aa725, 0x03826f, 0x0e6e70,
			0xd22ffc, 0x26c926, 0xc42aed, 0x95b3df, 0xaf63de, 0x77b2a8, 0xedaee6, 0x82353b,
			0xf10364, 0x423001, 0xf89791, 0x54be30, 0xef5218, 0x65a910, 0x71202a, 0xbbd1b8,
			0xd2d0c8, 0x41ab53, 0x8eeb99, 0x9b48a8, 0xc95a63, 0x418acb, 0x63e373, 0xb2b8a3,
			0xefb2fc, 0x172f60, 0xf0ab72, 0x6439ec, 0x631e28, 0x82bde9, 0xc67915, 0x72532b,
			0x26619c, 0xc0c207, 0xe0eb1e, 0x6ed178, 0x176fba, 0xc898a6, 0xf90dae, 0x1c471b,
			0x047d84, 0xc72493, 0xc9bebc, 0x100d4c, 0x3e42b6, 0x657e2a, 0xd6faec, 0x475817
		],

	/*
  _key:
  [0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc,
   0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118,
   0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2,
   0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694,
   0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65,
   0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5,
   0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4,
   0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70,
   0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df,
   0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b,
   0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30,
   0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8,
   0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8,
   0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3,
   0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec,
   0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b,
   0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178,
   0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b,
   0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c,
   0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817],
  */

	/**
	 * Function to precompute _init and _key.
	 * @private
	 */
	_precompute: function () {
		// XXX: This code is for precomputing the SHA256 constants, change for
		//      SHA512 and re-enable.
		var i = 0, prime = 2, factor, isPrime;

		function frac(x) { return (x - Math.floor(x)) * 0x100000000 | 0; }

		function frac2(x) { return (x - Math.floor(x)) * 0x10000000000 & 0xff; }

		for (; i < 80; prime++) {
			isPrime = true;
			for (factor = 2; factor * factor <= prime; factor++) {
				if (prime % factor === 0) {
					isPrime = false;
					break;
				}
			}
			if (isPrime) {
				if (i < 8) {
					this._init[i * 2] = frac(Math.pow(prime, 1 / 2));
					this._init[i * 2 + 1] = (frac2(Math.pow(prime, 1 / 2)) << 24) | this._initr[i];
				}
				this._key[i * 2] = frac(Math.pow(prime, 1 / 3));
				this._key[i * 2 + 1] = (frac2(Math.pow(prime, 1 / 3)) << 24) | this._keyr[i];
				i++;
			}
		}
	},

	/**
	 * Perform one cycle of SHA-512.
	 * @param {Uint32Array|bitArray} words one block of words.
	 * @private
	 */
	_block: function (words) {
		var i, wrh, wrl,
			h = this._h,
			k = this._key,
			h0h = h[0], h0l = h[1], h1h = h[2], h1l = h[3],
			h2h = h[4], h2l = h[5], h3h = h[6], h3l = h[7],
			h4h = h[8], h4l = h[9], h5h = h[10], h5l = h[11],
			h6h = h[12], h6l = h[13], h7h = h[14], h7l = h[15];
		var w;
		if (typeof Uint32Array !== 'undefined') {
			// When words is passed to _block, it has 32 elements. SHA512 _block
			// function extends words with new elements (at the end there are 160 elements).
			// The problem is that if we use Uint32Array instead of Array,
			// the length of Uint32Array cannot be changed. Thus, we replace words with a
			// normal Array here.
			w = Array(160); // do not use Uint32Array here as the instantiation is slower
			for (var j = 0; j < 32; j++) {
				w[j] = words[j];
			}
		} else {
			w = words;
		}

		// Working variables
		var ah = h0h, al = h0l, bh = h1h, bl = h1l,
			ch = h2h, cl = h2l, dh = h3h, dl = h3l,
			eh = h4h, el = h4l, fh = h5h, fl = h5l,
			gh = h6h, gl = h6l, hh = h7h, hl = h7l;

		for (i = 0; i < 80; i++) {
			// load up the input word for this round
			if (i < 16) {
				wrh = w[i * 2];
				wrl = w[i * 2 + 1];
			} else {
				// Gamma0
				var gamma0xh = w[(i - 15) * 2];
				var gamma0xl = w[(i - 15) * 2 + 1];
				var gamma0h =
					((gamma0xl << 31) | (gamma0xh >>> 1)) ^
					((gamma0xl << 24) | (gamma0xh >>> 8)) ^
					(gamma0xh >>> 7);
				var gamma0l =
					((gamma0xh << 31) | (gamma0xl >>> 1)) ^
					((gamma0xh << 24) | (gamma0xl >>> 8)) ^
					((gamma0xh << 25) | (gamma0xl >>> 7));

				// Gamma1
				var gamma1xh = w[(i - 2) * 2];
				var gamma1xl = w[(i - 2) * 2 + 1];
				var gamma1h =
					((gamma1xl << 13) | (gamma1xh >>> 19)) ^
					((gamma1xh << 3) | (gamma1xl >>> 29)) ^
					(gamma1xh >>> 6);
				var gamma1l =
					((gamma1xh << 13) | (gamma1xl >>> 19)) ^
					((gamma1xl << 3) | (gamma1xh >>> 29)) ^
					((gamma1xh << 26) | (gamma1xl >>> 6));

				// Shortcuts
				var wr7h = w[(i - 7) * 2];
				var wr7l = w[(i - 7) * 2 + 1];

				var wr16h = w[(i - 16) * 2];
				var wr16l = w[(i - 16) * 2 + 1];

				// W(round) = gamma0 + W(round - 7) + gamma1 + W(round - 16)
				wrl = gamma0l + wr7l;
				wrh = gamma0h + wr7h + ((wrl >>> 0) < (gamma0l >>> 0) ? 1 : 0);
				wrl += gamma1l;
				wrh += gamma1h + ((wrl >>> 0) < (gamma1l >>> 0) ? 1 : 0);
				wrl += wr16l;
				wrh += wr16h + ((wrl >>> 0) < (wr16l >>> 0) ? 1 : 0);
			}

			w[i * 2] = wrh |= 0;
			w[i * 2 + 1] = wrl |= 0;

			// Ch
			var chh = (eh & fh) ^ (~eh & gh);
			var chl = (el & fl) ^ (~el & gl);

			// Maj
			var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
			var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

			// Sigma0
			var sigma0h = ((al << 4) | (ah >>> 28)) ^ ((ah << 30) | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
			var sigma0l = ((ah << 4) | (al >>> 28)) ^ ((al << 30) | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));

			// Sigma1
			var sigma1h = ((el << 18) | (eh >>> 14)) ^ ((el << 14) | (eh >>> 18)) ^ ((eh << 23) | (el >>> 9));
			var sigma1l = ((eh << 18) | (el >>> 14)) ^ ((eh << 14) | (el >>> 18)) ^ ((el << 23) | (eh >>> 9));

			// K(round)
			var krh = k[i * 2];
			var krl = k[i * 2 + 1];

			// t1 = h + sigma1 + ch + K(round) + W(round)
			var t1l = hl + sigma1l;
			var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
			t1l += chl;
			t1h += chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
			t1l += krl;
			t1h += krh + ((t1l >>> 0) < (krl >>> 0) ? 1 : 0);
			t1l = t1l + wrl | 0;   // FF32..FF34 perf issue https://bugzilla.mozilla.org/show_bug.cgi?id=1054972
			t1h += wrh + ((t1l >>> 0) < (wrl >>> 0) ? 1 : 0);

			// t2 = sigma0 + maj
			var t2l = sigma0l + majl;
			var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

			// Update working variables
			hh = gh;
			hl = gl;
			gh = fh;
			gl = fl;
			fh = eh;
			fl = el;
			el = (dl + t1l) | 0;
			eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
			dh = ch;
			dl = cl;
			ch = bh;
			cl = bl;
			bh = ah;
			bl = al;
			al = (t1l + t2l) | 0;
			ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
		}

		// Intermediate hash
		h0l = h[1] = (h0l + al) | 0;
		h[0] = (h0h + ah + ((h0l >>> 0) < (al >>> 0) ? 1 : 0)) | 0;
		h1l = h[3] = (h1l + bl) | 0;
		h[2] = (h1h + bh + ((h1l >>> 0) < (bl >>> 0) ? 1 : 0)) | 0;
		h2l = h[5] = (h2l + cl) | 0;
		h[4] = (h2h + ch + ((h2l >>> 0) < (cl >>> 0) ? 1 : 0)) | 0;
		h3l = h[7] = (h3l + dl) | 0;
		h[6] = (h3h + dh + ((h3l >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
		h4l = h[9] = (h4l + el) | 0;
		h[8] = (h4h + eh + ((h4l >>> 0) < (el >>> 0) ? 1 : 0)) | 0;
		h5l = h[11] = (h5l + fl) | 0;
		h[10] = (h5h + fh + ((h5l >>> 0) < (fl >>> 0) ? 1 : 0)) | 0;
		h6l = h[13] = (h6l + gl) | 0;
		h[12] = (h6h + gh + ((h6l >>> 0) < (gl >>> 0) ? 1 : 0)) | 0;
		h7l = h[15] = (h7l + hl) | 0;
		h[14] = (h7h + hh + ((h7l >>> 0) < (hl >>> 0) ? 1 : 0)) | 0;
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
sjcl.hash.sha1 = function (hash) {
	if (hash) {
		this._h = hash._h.slice(0);
		this._buffer = hash._buffer.slice(0);
		this._length = hash._length;
	} else {
		this.reset();
	}
};

/**
 * Hash a string or an array of words.
 * @static
 * @param {bitArray|String} data the data to hash.
 * @return {bitArray} The hash value, an array of 5 big-endian words.
 */
sjcl.hash.sha1.hash = function (data) {
	return (new sjcl.hash.sha1()).update(data).finalize();
};

sjcl.hash.sha1.prototype = {
	/**
	 * The hash's block size, in bits.
	 * @constant
	 */
	blockSize: 512,

	/**
	 * Reset the hash state.
	 * @return this
	 */
	reset: function () {
		this._h = this._init.slice(0);
		this._buffer = [];
		this._length = 0;
		return this;
	},

	/**
	 * Input several words to the hash.
	 * @param {bitArray|String} data the data to hash.
	 * @return this
	 */
	update: function (data) {
		if (typeof data === "string") {
			data = sjcl.codec.utf8String.toBits(data);
		}
		var i, b = this._buffer = sjcl.bitArray.concat(this._buffer, data),
			ol = this._length,
			nl = this._length = ol + sjcl.bitArray.bitLength(data);
		if (nl > 9007199254740991) {
			throw new sjcl.exception.invalid("Cannot hash more than 2^53 - 1 bits");
		}

		if (typeof Uint32Array !== 'undefined') {
			var c = new Uint32Array(b);
			var j = 0;
			for (i = this.blockSize + ol - ((this.blockSize + ol) & (this.blockSize - 1)); i <= nl;
			     i += this.blockSize) {
				this._block(c.subarray(16 * j, 16 * (j + 1)));
				j += 1;
			}
			b.splice(0, 16 * j);
		} else {
			for (i = this.blockSize + ol - ((this.blockSize + ol) & (this.blockSize - 1)); i <= nl;
			     i += this.blockSize) {
				this._block(b.splice(0, 16));
			}
		}
		return this;
	},

	/**
	 * Complete hashing and output the hash value.
	 * @return {bitArray} The hash value, an array of 5 big-endian words. TODO
	 */
	finalize: function () {
		var i, b = this._buffer, h = this._h;

		// Round out and push the buffer
		b = sjcl.bitArray.concat(b, [sjcl.bitArray.partial(1, 1)]);
		// Round out the buffer to a multiple of 16 words, less the 2 length words.
		for (i = b.length + 2; i & 15; i++) {
			b.push(0);
		}

		// append the length
		b.push(Math.floor(this._length / 0x100000000));
		b.push(this._length | 0);

		while (b.length) {
			this._block(b.splice(0, 16));
		}

		this.reset();
		return h;
	},

	/**
	 * The SHA-1 initialization vector.
	 * @private
	 */
	_init: [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],

	/**
	 * The SHA-1 hash key.
	 * @private
	 */
	_key: [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6],

	/**
	 * The SHA-1 logical functions f(0), f(1), ..., f(79).
	 * @private
	 */
	_f: function (t, b, c, d) {
		if (t <= 19) {
			return (b & c) | (~b & d);
		} else if (t <= 39) {
			return b ^ c ^ d;
		} else if (t <= 59) {
			return (b & c) | (b & d) | (c & d);
		} else if (t <= 79) {
			return b ^ c ^ d;
		}
	},

	/**
	 * Circular left-shift operator.
	 * @private
	 */
	_S: function (n, x) {
		return (x << n) | (x >>> 32 - n);
	},

	/**
	 * Perform one cycle of SHA-1.
	 * @param {Uint32Array|bitArray} words one block of words.
	 * @private
	 */
	_block: function (words) {
		var t, tmp, a, b, c, d, e,
			h = this._h;
		var w;
		if (typeof Uint32Array !== 'undefined') {
			// When words is passed to _block, it has 16 elements. SHA1 _block
			// function extends words with new elements (at the end there are 80 elements).
			// The problem is that if we use Uint32Array instead of Array,
			// the length of Uint32Array cannot be changed. Thus, we replace words with a
			// normal Array here.
			w = Array(80); // do not use Uint32Array here as the instantiation is slower
			for (var j = 0; j < 16; j++) {
				w[j] = words[j];
			}
		} else {
			w = words;
		}

		a = h[0];
		b = h[1];
		c = h[2];
		d = h[3];
		e = h[4];

		for (t = 0; t <= 79; t++) {
			if (t >= 16) {
				w[t] = this._S(1, w[t - 3] ^ w[t - 8] ^ w[t - 14] ^ w[t - 16]);
			}
			tmp = (this._S(5, a) + this._f(t, b, c, d) + e + w[t] +
				this._key[Math.floor(t / 20)]) | 0;
			e = d;
			d = c;
			c = this._S(30, b);
			b = a;
			a = tmp;
		}

		h[0] = (h[0] + a) | 0;
		h[1] = (h[1] + b) | 0;
		h[2] = (h[2] + c) | 0;
		h[3] = (h[3] + d) | 0;
		h[4] = (h[4] + e) | 0;
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
	/** The name of the mode.
	 * @constant
	 */
	name: "cbc",

	/** Encrypt in CBC mode with PKCS#5 padding.
	 * @param {Object} prp The block cipher.  It must have a block size of 16 bytes.
	 * @param {bitArray} plaintext The plaintext data.
	 * @param {bitArray} iv The initialization value.
	 * @param {bitArray} [adata=[]] The authenticated data.  Must be empty.
	 * @param {boolean} usePadding True if padding shall be used, false otherwise.
	 * @return The encrypted data, an array of bytes.
	 * @throws {sjcl.exception.invalid} if the IV isn't exactly 128 bits, or if any adata is specified.
	 */
	encrypt: function (prp, plaintext, iv, adata, usePadding) {
		if (adata && adata.length) {
			throw new sjcl.exception.invalid("cbc can't authenticate data");
		}
		if (sjcl.bitArray.bitLength(iv) !== 128) {
			throw new sjcl.exception.invalid("cbc iv must be 128 bits");
		}
		var i,
			w = sjcl.bitArray,
			xor = w._xor4,
			bl = w.bitLength(plaintext),
			bp = 0,
			output = [];

		if (bl & 7) {
			throw new sjcl.exception.invalid("pkcs#5 padding only works for multiples of a byte");
		}

		for (i = 0; bp + 128 <= bl; i += 4, bp += 128) {
			/* Encrypt a non-final block */
			iv = prp.encrypt(xor(iv, plaintext.slice(i, i + 4)));
			// TUTAO: replaced splice with push because of performance bug in chromium
			// https://bugs.chromium.org/p/chromium/issues/detail?id=914395&can=1&q=splice&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified
			//output.splice(i, 0, iv[0], iv[1], iv[2], iv[3]);
			output.push(iv[0], iv[1], iv[2], iv[3])
		}

		if (usePadding) {
			/* Construct the pad. */
			bl = (16 - ((bl >> 3) & 15)) * 0x1010101;

			/* Pad and encrypt. */
			iv = prp.encrypt(xor(iv, w.concat(plaintext, [bl, bl, bl, bl]).slice(i, i + 4)));
			// TUTAO: replaced splice with push because of performance bug in chromium
			// output.splice(i, 0, iv[0], iv[1], iv[2], iv[3]);
			output.push(iv[0], iv[1], iv[2], iv[3])

		}
		return output;
	},

	/** Decrypt in CBC mode.
	 * @param {Object} prp The block cipher.  It must have a block size of 16 bytes.
	 * @param {bitArray} ciphertext The ciphertext data.
	 * @param {bitArray} iv The initialization value.
	 * @param {bitArray} [adata=[]] The authenticated data.  It must be empty.
	 * @param {boolean} usePadding True if padding shall be used, false otherwise.
	 * @return The decrypted data, an array of bytes.
	 * @throws {sjcl.exception.invalid} if the IV isn't exactly 128 bits, or if any adata is specified.
	 * @throws {sjcl.exception.corrupt} if if the message is corrupt.
	 */
	decrypt: function (prp, ciphertext, iv, adata, usePadding) {
		if (adata && adata.length) {
			throw new sjcl.exception.invalid("cbc can't authenticate data");
		}
		if (sjcl.bitArray.bitLength(iv) !== 128) {
			throw new sjcl.exception.invalid("cbc iv must be 128 bits");
		}
		if ((sjcl.bitArray.bitLength(ciphertext) & 127) || !ciphertext.length) {
			throw new sjcl.exception.corrupt("cbc ciphertext must be a positive multiple of the block size");
		}
		var i,
			w = sjcl.bitArray,
			xor = w._xor4,
			bi, bo,
			output = [];

		adata = adata || [];

		for (i = 0; i < ciphertext.length; i += 4) {
			bi = ciphertext.slice(i, i + 4);
			bo = xor(iv, prp.decrypt(bi));
			// TUTAO: replaced splice with push because of performance bug in chromium
			// https://bugs.chromium.org/p/chromium/issues/detail?id=914395&can=1&q=splice&colspec=ID%20Pri%20M%20Stars%20ReleaseBlock%20Component%20Status%20Owner%20Summary%20OS%20Modified
			//output.splice(i, 0, bo[0], bo[1], bo[2], bo[3]);
			output.push(bo[0], bo[1], bo[2], bo[3]);
			iv = bi;
		}

		if (usePadding) {
			/* check and remove the pad */
			bi = output[i - 1] & 255;
			if (bi === 0 || bi > 16) {
				throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
			}
			bo = bi * 0x1010101;
			if (!w.equal(w.bitSlice([bo, bo, bo, bo], 0, bi * 8),
				w.bitSlice(output, output.length * 32 - bi * 8, output.length * 32))) {
				throw new sjcl.exception.corrupt("pkcs#5 padding corrupt");
			}

			return w.bitSlice(output, 0, output.length * 32 - bi * 8);
		} else {
			return output;
		}
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
	/**
	 * The name of the mode.
	 * @constant
	 */
	name: "gcm",

	/** Encrypt in GCM mode.
	 * @static
	 * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
	 * @param {bitArray} plaintext The plaintext data.
	 * @param {bitArray} iv The initialization value.
	 * @param {bitArray} [adata=[]] The authenticated data.
	 * @param {Number} [tlen=128] The desired tag length, in bits.
	 * @return {bitArray} The encrypted data, an array of bytes.
	 */
	encrypt: function (prf, plaintext, iv, adata, tlen) {
		var out, data = plaintext.slice(0), w = sjcl.bitArray;
		tlen = tlen || 128;
		adata = adata || [];

		// encrypt and tag
		out = sjcl.mode.gcm._ctrMode(true, prf, data, adata, iv, tlen);

		return w.concat(out.data, out.tag);
	},

	/** Decrypt in GCM mode.
	 * @static
	 * @param {Object} prf The pseudorandom function.  It must have a block size of 16 bytes.
	 * @param {bitArray} ciphertext The ciphertext data.
	 * @param {bitArray} iv The initialization value.
	 * @param {bitArray} [adata=[]] The authenticated data.
	 * @param {Number} [tlen=128] The desired tag length, in bits.
	 * @return {bitArray} The decrypted data.
	 */
	decrypt: function (prf, ciphertext, iv, adata, tlen) {
		var out, data = ciphertext.slice(0), tag, w = sjcl.bitArray, l = w.bitLength(data);
		tlen = tlen || 128;
		adata = adata || [];

		// Slice tag out of data
		if (tlen <= l) {
			tag = w.bitSlice(data, l - tlen);
			data = w.bitSlice(data, 0, l - tlen);
		} else {
			tag = data;
			data = [];
		}

		// decrypt and tag
		out = sjcl.mode.gcm._ctrMode(false, prf, data, adata, iv, tlen);

		if (!w.equal(out.tag, tag)) {
			throw new sjcl.exception.corrupt("gcm: tag doesn't match");
		}
		return out.data;
	},

	/* Compute the galois multiplication of X and Y
	 * @private
	 */
	_galoisMultiply: function (x, y) {
		var i, j, xi, Zi, Vi, lsb_Vi, w = sjcl.bitArray, xor = w._xor4;

		Zi = [0, 0, 0, 0];
		Vi = y.slice(0);

		// Block size is 128 bits, run 128 times to get Z_128
		for (i = 0; i < 128; i++) {
			xi = (x[Math.floor(i / 32)] & (1 << (31 - i % 32))) !== 0;
			if (xi) {
				// Z_i+1 = Z_i ^ V_i
				Zi = xor(Zi, Vi);
			}

			// Store the value of LSB(V_i)
			lsb_Vi = (Vi[3] & 1) !== 0;

			// V_i+1 = V_i >> 1
			for (j = 3; j > 0; j--) {
				Vi[j] = (Vi[j] >>> 1) | ((Vi[j - 1] & 1) << 31);
			}
			Vi[0] = Vi[0] >>> 1;

			// If LSB(V_i) is 1, V_i+1 = (V_i >> 1) ^ R
			if (lsb_Vi) {
				Vi[0] = Vi[0] ^ (0xe1 << 24);
			}
		}
		return Zi;
	},

	_ghash: function (H, Y0, data) {
		var Yi, i, l = data.length;

		Yi = Y0.slice(0);
		for (i = 0; i < l; i += 4) {
			Yi[0] ^= 0xffffffff & data[i];
			Yi[1] ^= 0xffffffff & data[i + 1];
			Yi[2] ^= 0xffffffff & data[i + 2];
			Yi[3] ^= 0xffffffff & data[i + 3];
			Yi = sjcl.mode.gcm._galoisMultiply(Yi, H);
		}
		return Yi;
	},

	/** GCM CTR mode.
	 * Encrypt or decrypt data and tag with the prf in GCM-style CTR mode.
	 * @param {Boolean} encrypt True if encrypt, false if decrypt.
	 * @param {Object} prf The PRF.
	 * @param {bitArray} data The data to be encrypted or decrypted.
	 * @param {bitArray} iv The initialization vector.
	 * @param {bitArray} adata The associated data to be tagged.
	 * @param {Number} tlen The length of the tag, in bits.
	 */
	_ctrMode: function (encrypt, prf, data, adata, iv, tlen) {
		var H, J0, S0, enc, i, ctr, tag, last, l, bl, abl, ivbl, w = sjcl.bitArray;

		// Calculate data lengths
		l = data.length;
		bl = w.bitLength(data);
		abl = w.bitLength(adata);
		ivbl = w.bitLength(iv);

		// Calculate the parameters
		H = prf.encrypt([0, 0, 0, 0]);
		if (ivbl === 96) {
			J0 = iv.slice(0);
			J0 = w.concat(J0, [1]);
		} else {
			J0 = sjcl.mode.gcm._ghash(H, [0, 0, 0, 0], iv);
			J0 = sjcl.mode.gcm._ghash(H, J0, [0, 0, Math.floor(ivbl / 0x100000000), ivbl & 0xffffffff]);
		}
		S0 = sjcl.mode.gcm._ghash(H, [0, 0, 0, 0], adata);

		// Initialize ctr and tag
		ctr = J0.slice(0);
		tag = S0.slice(0);

		// If decrypting, calculate hash
		if (!encrypt) {
			tag = sjcl.mode.gcm._ghash(H, S0, data);
		}

		// Encrypt all the data
		for (i = 0; i < l; i += 4) {
			ctr[3]++;
			enc = prf.encrypt(ctr);
			data[i] ^= enc[0];
			data[i + 1] ^= enc[1];
			data[i + 2] ^= enc[2];
			data[i + 3] ^= enc[3];
		}
		data = w.clamp(data, bl);

		// If encrypting, calculate hash
		if (encrypt) {
			tag = sjcl.mode.gcm._ghash(H, S0, data);
		}

		// Calculate last block from bit lengths, ugly because bitwise operations are 32-bit
		last = [
			Math.floor(abl / 0x100000000), abl & 0xffffffff,
			Math.floor(bl / 0x100000000), bl & 0xffffffff
		];

		// Calculate the final tag block
		tag = sjcl.mode.gcm._ghash(H, tag, last);
		enc = prf.encrypt(J0);
		tag[0] ^= enc[0];
		tag[1] ^= enc[1];
		tag[2] ^= enc[2];
		tag[3] ^= enc[3];

		return {tag: w.bitSlice(tag, 0, tlen), data: data};
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
sjcl.misc.hmac = function (key, Hash) {
	this._hash = Hash = Hash || sjcl.hash.sha256;
	var exKey = [[], []], i,
		bs = Hash.prototype.blockSize / 32;
	this._baseHash = [new Hash(), new Hash()];

	if (key.length > bs) {
		key = Hash.hash(key);
	}

	for (i = 0; i < bs; i++) {
		exKey[0][i] = key[i] ^ 0x36363636;
		exKey[1][i] = key[i] ^ 0x5C5C5C5C;
	}

	this._baseHash[0].update(exKey[0]);
	this._baseHash[1].update(exKey[1]);
	this._resultHash = new Hash(this._baseHash[0]);
};

/** HMAC with the specified hash function.  Also called encrypt since it's a prf.
 * @param {bitArray|String} data The data to mac.
 */
sjcl.misc.hmac.prototype.encrypt = sjcl.misc.hmac.prototype.mac = function (data) {
	if (!this._updated) {
		this.update(data);
		return this.digest(data);
	} else {
		throw new sjcl.exception.invalid("encrypt on already updated hmac called!");
	}
};

sjcl.misc.hmac.prototype.reset = function () {
	this._resultHash = new this._hash(this._baseHash[0]);
	this._updated = false;
};

sjcl.misc.hmac.prototype.update = function (data) {
	this._updated = true;
	this._resultHash.update(data);
};

sjcl.misc.hmac.prototype.digest = function () {
	var w = this._resultHash.finalize(), result = new (this._hash)(this._baseHash[1]).update(w).finalize();

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
sjcl.prng = function (defaultParanoia) {

	/* private */
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
	this._key = [0, 0, 0, 0, 0, 0, 0, 0];
	this._counter = [0, 0, 0, 0];
	this._cipher = undefined;
	this._defaultParanoia = defaultParanoia;

	/* event listener stuff */
	this._collectorsStarted = false;
	this._callbacks = {progress: {}, seeded: {}};
	this._callbackI = 0;

	/* constants */
	this._NOT_READY = 0;
	this._READY = 1;
	this._REQUIRES_RESEED = 2;

	this._MAX_WORDS_PER_BURST = 65536;
	this._PARANOIA_LEVELS = [0, 48, 64, 96, 128, 192, 256, 384, 512, 768, 1024];
	this._MILLISECONDS_PER_RESEED = 30000;
	this._BITS_PER_RESEED = 80;
};

sjcl.prng.prototype = {
	/** Generate several random words, and return them in an array.
	 * A word consists of 32 bits (4 bytes)
	 * @param {Number} nwords The number of words to generate.
	 */
	randomWords: function (nwords, paranoia) {
		var out = [], i, readiness = this.isReady(paranoia), g;

		if (readiness === this._NOT_READY) {
			throw new sjcl.exception.notReady("generator isn't seeded");
		} else if (readiness & this._REQUIRES_RESEED) {
			this._reseedFromPools(!(readiness & this._READY));
		}

		for (i = 0; i < nwords; i += 4) {
			if ((i + 1) % this._MAX_WORDS_PER_BURST === 0) {
				this._gate();
			}

			g = this._gen4words();
			out.push(g[0], g[1], g[2], g[3]);
		}
		this._gate();

		return out.slice(0, nwords);
	},

	setDefaultParanoia: function (paranoia, allowZeroParanoia) {
		if (paranoia === 0 && allowZeroParanoia
			!== "Setting paranoia=0 will ruin your security; use it only for testing") {
			throw new sjcl.exception.invalid("Setting paranoia=0 will ruin your security; use it only for testing");
		}

		this._defaultParanoia = paranoia;
	},

	/**
	 * Add entropy to the pools.
	 * @param data The entropic value.  Should be a 32-bit integer, array of 32-bit integers, or string
	 * @param {Number} estimatedEntropy The estimated entropy of data, in bits
	 * @param {String} source The source of the entropy, eg "mouse"
	 */
	addEntropy: function (data, estimatedEntropy, source) {
		source = source || "user";

		var id,
			i, tmp,
			t = (new Date()).valueOf(),
			robin = this._robins[source],
			oldReady = this.isReady(), err = 0, objName;

		id = this._collectorIds[source];
		if (id === undefined) {
			id = this._collectorIds[source] = this._collectorIdNext++;
		}

		if (robin === undefined) {
			robin = this._robins[source] = 0;
		}
		this._robins[source] = (this._robins[source] + 1) % this._pools.length;

		switch (typeof(data)) {

			case "number":
				if (estimatedEntropy === undefined) {
					estimatedEntropy = 1;
				}
				this._pools[robin].update([id, this._eventId++, 1, estimatedEntropy, t, 1, data | 0]);
				break;

			case "object":
				objName = Object.prototype.toString.call(data);
				if (objName === "[object Uint32Array]") {
					tmp = [];
					for (i = 0; i < data.length; i++) {
						tmp.push(data[i]);
					}
					data = tmp;
				} else {
					if (objName !== "[object Array]") {
						err = 1;
					}
					for (i = 0; i < data.length && !err; i++) {
						if (typeof(data[i]) !== "number") {
							err = 1;
						}
					}
				}
				if (!err) {
					if (estimatedEntropy === undefined) {
						/* horrible entropy estimator */
						estimatedEntropy = 0;
						for (i = 0; i < data.length; i++) {
							tmp = data[i];
							while (tmp > 0) {
								estimatedEntropy++;
								tmp = tmp >>> 1;
							}
						}
					}
					this._pools[robin].update([id, this._eventId++, 2, estimatedEntropy, t, data.length].concat(data));
				}
				break;

			case "string":
				if (estimatedEntropy === undefined) {
					/* English text has just over 1 bit per character of entropy.
					 * But this might be HTML or something, and have far less
					 * entropy than English...  Oh well, let's just say one bit.
					 */
					estimatedEntropy = data.length;
				}
				this._pools[robin].update([id, this._eventId++, 3, estimatedEntropy, t, data.length]);
				this._pools[robin].update(data);
				break;

			default:
				err = 1;
		}
		if (err) {
			throw new sjcl.exception.bug("random: addEntropy only supports number, array of numbers or string");
		}

		/* record the new strength */
		this._poolEntropy[robin] += estimatedEntropy;
		this._poolStrength += estimatedEntropy;

		/* fire off events */
		/* TUTAO.arm: removed bad implementation: _fireEvent calls static randomizer instance
		 if (oldReady === this._NOT_READY) {
		 if (this.isReady() !== this._NOT_READY) {
		 this._fireEvent("seeded", Math.max(this._strength, this._poolStrength));
		 }
		 this._fireEvent("progress", this.getProgress());
		 }*/
	},

	/** Is the generator ready? */
	isReady: function (paranoia) {
		var entropyRequired = this._PARANOIA_LEVELS[(paranoia !== undefined) ? paranoia : this._defaultParanoia];

		if (this._strength && this._strength >= entropyRequired) {
			return (this._poolEntropy[0] > this._BITS_PER_RESEED && (new Date()).valueOf() > this._nextReseed) ?
				this._REQUIRES_RESEED | this._READY :
				this._READY;
		} else {
			return (this._poolStrength >= entropyRequired) ?
				this._REQUIRES_RESEED | this._NOT_READY :
				this._NOT_READY;
		}
	},

	/** Get the generator's progress toward readiness, as a fraction */
	getProgress: function (paranoia) {
		var entropyRequired = this._PARANOIA_LEVELS[paranoia ? paranoia : this._defaultParanoia];

		if (this._strength >= entropyRequired) {
			return 1.0;
		} else {
			return (this._poolStrength > entropyRequired) ?
				1.0 :
				this._poolStrength / entropyRequired;
		}
	},

	/** start the built-in entropy collectors */
	startCollectors: function () {
		if (this._collectorsStarted) {
			return;
		}

		this._eventListener = {
			loadTimeCollector: this._bind(this._loadTimeCollector),
			mouseCollector: this._bind(this._mouseCollector),
			keyboardCollector: this._bind(this._keyboardCollector),
			accelerometerCollector: this._bind(this._accelerometerCollector),
			touchCollector: this._bind(this._touchCollector)
		};

		if (window.addEventListener) {
			window.addEventListener("load", this._eventListener.loadTimeCollector, false);
			window.addEventListener("mousemove", this._eventListener.mouseCollector, false);
			window.addEventListener("keypress", this._eventListener.keyboardCollector, false);
			window.addEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
			window.addEventListener("touchmove", this._eventListener.touchCollector, false);
		} else if (document.attachEvent) {
			document.attachEvent("onload", this._eventListener.loadTimeCollector);
			document.attachEvent("onmousemove", this._eventListener.mouseCollector);
			document.attachEvent("keypress", this._eventListener.keyboardCollector);
		} else {
			throw new sjcl.exception.bug("can't attach event");
		}

		this._collectorsStarted = true;
	},

	/** stop the built-in entropy collectors */
	stopCollectors: function () {
		if (!this._collectorsStarted) {
			return;
		}

		if (window.removeEventListener) {
			window.removeEventListener("load", this._eventListener.loadTimeCollector, false);
			window.removeEventListener("mousemove", this._eventListener.mouseCollector, false);
			window.removeEventListener("keypress", this._eventListener.keyboardCollector, false);
			window.removeEventListener("devicemotion", this._eventListener.accelerometerCollector, false);
			window.removeEventListener("touchmove", this._eventListener.touchCollector, false);
		} else if (document.detachEvent) {
			document.detachEvent("onload", this._eventListener.loadTimeCollector);
			document.detachEvent("onmousemove", this._eventListener.mouseCollector);
			document.detachEvent("keypress", this._eventListener.keyboardCollector);
		}

		this._collectorsStarted = false;
	},

	/* use a cookie to store entropy.
	 useCookie: function (all_cookies) {
	 throw new sjcl.exception.bug("random: useCookie is unimplemented");
	 },*/

	/** add an event listener for progress or seeded-ness. */
	addEventListener: function (name, callback) {
		this._callbacks[name][this._callbackI++] = callback;
	},

	/** remove an event listener for progress or seeded-ness */
	removeEventListener: function (name, cb) {
		var i, j, cbs = this._callbacks[name], jsTemp = [];

		/* I'm not sure if this is necessary; in C++, iterating over a
		 * collection and modifying it at the same time is a no-no.
		 */

		for (j in cbs) {
			if (cbs.hasOwnProperty(j) && cbs[j] === cb) {
				jsTemp.push(j);
			}
		}

		for (i = 0; i < jsTemp.length; i++) {
			j = jsTemp[i];
			delete cbs[j];
		}
	},

	_bind: function (func) {
		var that = this;
		return function () {
			func.apply(that, arguments);
		};
	},

	/** Generate 4 random words, no reseed, no gate.
	 * @private
	 */
	_gen4words: function () {
		for (var i = 0; i < 4; i++) {
			this._counter[i] = this._counter[i] + 1 | 0;
			if (this._counter[i]) {
				break;
			}
		}
		return this._cipher.encrypt(this._counter);
	},

	/* Rekey the AES instance with itself after a request, or every _MAX_WORDS_PER_BURST words.
	 * @private
	 */
	_gate: function () {
		this._key = this._gen4words().concat(this._gen4words());
		this._cipher = new sjcl.cipher.aes(this._key);
	},

	/** Reseed the generator with the given words
	 * @private
	 */
	_reseed: function (seedWords) {
		this._key = sjcl.hash.sha256.hash(this._key.concat(seedWords));
		this._cipher = new sjcl.cipher.aes(this._key);
		for (var i = 0; i < 4; i++) {
			this._counter[i] = this._counter[i] + 1 | 0;
			if (this._counter[i]) {
				break;
			}
		}
	},

	/** reseed the data from the entropy pools
	 * @param full If set, use all the entropy pools in the reseed.
	 */
	_reseedFromPools: function (full) {
		var reseedData = [], strength = 0, i;

		this._nextReseed = reseedData[0] =
			(new Date()).valueOf() + this._MILLISECONDS_PER_RESEED;

		for (i = 0; i < 16; i++) {
			/* On some browsers, this is cryptographically random.  So we might
			 * as well toss it in the pot and stir...
			 */
			reseedData.push(Math.random() * 0x100000000 | 0);
		}

		for (i = 0; i < this._pools.length; i++) {
			reseedData = reseedData.concat(this._pools[i].finalize());
			strength += this._poolEntropy[i];
			this._poolEntropy[i] = 0;

			if (!full && (this._reseedCount & (1 << i))) {
				break;
			}
		}

		/* if we used the last pool, push a new one onto the stack */
		if (this._reseedCount >= 1 << this._pools.length) {
			this._pools.push(new sjcl.hash.sha256());
			this._poolEntropy.push(0);
		}

		/* how strong was this reseed? */
		this._poolStrength -= strength;
		if (strength > this._strength) {
			this._strength = strength;
		}

		this._reseedCount++;
		this._reseed(reseedData);
	},

	_keyboardCollector: function () {
		this._addCurrentTimeToEntropy(1);
	},

	_mouseCollector: function (ev) {
		var x, y;

		try {
			x = ev.x || ev.clientX || ev.offsetX || 0;
			y = ev.y || ev.clientY || ev.offsetY || 0;
		} catch (err) {
			// Event originated from a secure element. No mouse position available.
			x = 0;
			y = 0;
		}

		if (x != 0 && y != 0) {
			this.addEntropy([x, y], 2, "mouse");
		}

		this._addCurrentTimeToEntropy(0);
	},

	_touchCollector: function (ev) {
		var touch = ev.touches[0] || ev.changedTouches[0];
		var x = touch.pageX || touch.clientX,
			y = touch.pageY || touch.clientY;

		this.addEntropy([x, y], 1, "touch");

		this._addCurrentTimeToEntropy(0);
	},

	_loadTimeCollector: function () {
		this._addCurrentTimeToEntropy(2);
	},

	_addCurrentTimeToEntropy: function (estimatedEntropy) {
		if (typeof window !== 'undefined' && window.performance && typeof window.performance.now === "function") {
			//how much entropy do we want to add here?
			this.addEntropy(window.performance.now(), estimatedEntropy, "loadtime");
		} else {
			this.addEntropy((new Date()).valueOf(), estimatedEntropy, "loadtime");
		}
	},
	_accelerometerCollector: function (ev) {
		var ac = ev.accelerationIncludingGravity.x || ev.accelerationIncludingGravity.y
			|| ev.accelerationIncludingGravity.z;
		if (window.orientation) {
			var or = window.orientation;
			if (typeof or === "number") {
				this.addEntropy(or, 1, "accelerometer");
			}
		}
		if (ac) {
			this.addEntropy(ac, 2, "accelerometer");
		}
		this._addCurrentTimeToEntropy(0);
	},

	_fireEvent: function (name, arg) {
		var j, cbs = sjcl.random._callbacks[name], cbsTemp = [];
		/* TODO: there is a race condition between removing collectors and firing them */

		/* I'm not sure if this is necessary; in C++, iterating over a
		 * collection and modifying it at the same time is a no-no.
		 */

		for (j in cbs) {
			if (cbs.hasOwnProperty(j)) {
				cbsTemp.push(cbs[j]);
			}
		}

		for (j = 0; j < cbsTemp.length; j++) {
			cbsTemp[j](arg);
		}
	}
};

/** an instance for the prng.
 * @see sjcl.prng
 */
/* TUTAO.arm: removed static randomizer instance because we have our own
sjcl.random = new sjcl.prng(6);

(function () {
	// function for getting nodejs crypto module. catches and ignores errors.
	function getCryptoModule() {
		try {
			return require('crypto');
		}
		catch (e) {
			return null;
		}
	}

	try {
		var buf, crypt, ab;

		// get cryptographically strong entropy depending on runtime environment
		if (typeof module !== 'undefined' && module.exports && (crypt = getCryptoModule()) && crypt.randomBytes) {
			buf = crypt.randomBytes(1024 / 8);
			buf = new Uint32Array(new Uint8Array(buf).buffer);
			sjcl.random.addEntropy(buf, 1024, "crypto.randomBytes");

		} else if (typeof window !== 'undefined' && typeof Uint32Array !== 'undefined') {
			ab = new Uint32Array(32);
			if (window.crypto && window.crypto.getRandomValues) {
				window.crypto.getRandomValues(ab);
			} else if (window.msCrypto && window.msCrypto.getRandomValues) {
				window.msCrypto.getRandomValues(ab);
			} else {
				return;
			}

			// get cryptographically strong entropy in Webkit
			sjcl.random.addEntropy(ab, 1024, "crypto.getRandomValues");

		} else {
			// no getRandomValues :-(
		}
	} catch (e) {
		if (typeof window !== 'undefined' && window.console) {
			console.log("There was an error collecting entropy from the browser:");
			console.log(e);
			//we do not want the library to fail due to randomness not being maintained.
		}
	}
 }());*/
/** @fileOverview Bit array codec implementations.
 *
 * @author Marco Munizaga
 */

//patch arraybuffers if they don't exist
if (typeof(ArrayBuffer) === 'undefined') {
	(function (globals) {
		"use strict";
		globals.ArrayBuffer = function () {
		};
		globals.DataView = function () {
		};
	}(this));
}

/**
 * ArrayBuffer
 * @namespace
 */
sjcl.codec.arrayBuffer = {
	/** Convert from a bitArray to an ArrayBuffer.
	 * Will default to 8byte padding if padding is undefined*/
	fromBits: function (arr, padding, padding_count) {
		var out, i, ol, tmp, smallest;
		padding = padding == undefined ? true : padding;
		padding_count = padding_count || 8;

		if (arr.length === 0) {
			return new ArrayBuffer(0);
		}

		ol = sjcl.bitArray.bitLength(arr) / 8;

		//check to make sure the bitLength is divisible by 8, if it isn't
		//we can't do anything since arraybuffers work with bytes, not bits
		if (sjcl.bitArray.bitLength(arr) % 8 !== 0) {
			throw new sjcl.exception.invalid("Invalid bit size, must be divisble by 8 to fit in an arraybuffer correctly");
		}

		if (padding && ol % padding_count !== 0) {
			ol += padding_count - (ol % padding_count);
		}


		//padded temp for easy copying
		tmp = new DataView(new ArrayBuffer(arr.length * 4));
		for (i = 0; i < arr.length; i++) {
			tmp.setUint32(i * 4, (arr[i] << 32)); //get rid of the higher bits
		}

		//now copy the final message if we are not going to 0 pad
		out = new DataView(new ArrayBuffer(ol));

		//save a step when the tmp and out bytelength are ===
		if (out.byteLength === tmp.byteLength) {
			return tmp.buffer;
		}

		smallest = tmp.byteLength < out.byteLength ? tmp.byteLength : out.byteLength;
		for (i = 0; i < smallest; i++) {
			out.setUint8(i, tmp.getUint8(i));
		}


		return out.buffer;
	},

	toBits: function (buffer) {
		var i, out = [], len, inView, tmp;

		if (buffer.byteLength === 0) {
			return [];
		}

		inView = new DataView(buffer);
		len = inView.byteLength - inView.byteLength % 4;

		for (var i = 0; i < len; i += 4) {
			out.push(inView.getUint32(i));
		}

		if (inView.byteLength % 4 != 0) {
			tmp = new DataView(new ArrayBuffer(4));
			for (var i = 0, l = inView.byteLength % 4; i < l; i++) {
				//we want the data to the right, because partial slices off the starting bits
				tmp.setUint8(i + 4 - l, inView.getUint8(len + i)); // big-endian,
			}
			out.push(
				sjcl.bitArray.partial((inView.byteLength % 4) * 8, tmp.getUint32(0))
			);
		}
		return out;
	},


	/** Prints a hex output of the buffer contents, akin to hexdump **/
	hexDumpBuffer: function (buffer) {
		var stringBufferView = new DataView(buffer);
		var string = '';
		var pad = function (n, width) {
			n = n + '';
			return n.length >= width ? n : new Array(width - n.length + 1).join('0') + n;
		};

		for (var i = 0; i < stringBufferView.byteLength; i += 2) {
			if (i % 16 == 0) string += ('\n' + (i).toString(16) + '\t');
			string += (pad(stringBufferView.getUint16(i).toString(16), 4) + ' ');
		}

		if (typeof console === undefined) {
			console = console || {
				log: function () {
				}
			}; //fix for IE
		}
		console.log(string.toUpperCase());
	}
};

if (typeof module !== 'undefined' && module.exports) {
	module.exports = sjcl;
}
if (typeof define === "function") {
	define([], function () {
		return sjcl;
	});
}
