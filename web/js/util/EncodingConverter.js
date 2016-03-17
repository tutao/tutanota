"use strict";

tutao.provide('tutao.util.EncodingConverter');

/**
 * Converts a hex coded string into a base64 coded string.
 *
 * @param {String} hex A hex encoded string.
 * @return {String} A base64 encoded string.
 */
tutao.util.EncodingConverter.hexToBase64 = function(hex) {
	return sjcl.codec.base64.fromBits(sjcl.codec.hex.toBits(hex));
};

/**
 * Converts a base64 coded string into a hex coded string.
 *
 * @param {String} base64 A base64 encoded string.
 * @return {String} A hex encoded string.
 */
tutao.util.EncodingConverter.base64ToHex = function(base64) {
	return sjcl.codec.hex.fromBits(sjcl.codec.base64.toBits(base64));
};

/**
 * Converts a utf8 bytes hex coded string into a string.
 *
 * @param {String} hex A hex encoded string.
 * @return {String} A utf8 encoded string.
 */
tutao.util.EncodingConverter.hexToUtf8 = function(hex) {
	return sjcl.codec.utf8String.fromBits(sjcl.codec.hex.toBits(hex));
};

/**
 * Converts a string into a hex coded string containing utf8 bytes.
 *
 * @param {String} utf8 A utf8 encoded string.
 * @return {String} A hex encoded string.
 */
tutao.util.EncodingConverter.utf8ToHex = function(utf8) {
	return sjcl.codec.hex.fromBits(sjcl.codec.utf8String.toBits(utf8));
};

/**
 * Converts a hex coded string into an array of byte values.
 *
 * @param {String} hex A hex encoded string.
 * @return {Array.<number>} An array of byte values. A byte can have the value
 *         0 to 255.
 */
tutao.util.EncodingConverter.hexToBytes = function(hex) {
	return sjcl.codec.bytes.fromBits(sjcl.codec.hex.toBits(hex));
};

/**
 * Converts an array of byte values into a hex coded string.
 *
 * @param {Array.<number>} bytes An array of byte values. A byte can have the value
 *            0 to 255.
 * @return {String} A hex encoded string.
 */
tutao.util.EncodingConverter.bytesToHex = function(bytes) {
	return sjcl.codec.hex.fromBits(sjcl.codec.bytes.toBits(bytes));
};

/**
 * Converts a base64 string to a url-conform base64 string. This is used for
 * base64 coded url parameters.
 *
 * @param {string} base64 The base64 string.
 * @return {string} The base64url string.
 */
tutao.util.EncodingConverter.base64ToBase64Url = function(base64) {
	var base64url = base64.replace(/\+/g, "-");
	base64url = base64url.replace(/\//g, "_");
	base64url = base64url.replace(/=/g, "");
	return base64url;
};

/**
 * Converts a base64 string to a base64ext string. Base64ext uses another character set than base64 in order to make it sortable.
 * 
 *
 * @param {string} base64 The base64 string.
 * @return {string} The base64url string.
 */
tutao.util.EncodingConverter.base64ToBase64Ext = function(base64) {
	var base64Alphabet =  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var base64extAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz";

	base64 = base64.replace(/=/g, "");
	var base64ext = new Array(base64.length);
	for (var i = 0; i < base64.length; i++) {
		var index = base64Alphabet.indexOf(base64.charAt(i));
		base64ext[i] = base64extAlphabet[index];
	}
	return base64ext.join("");
};

/**
 * Converts a timestamp number to a GeneratedId (the counter is set to zero) in hex format. 
 * 
 * @param {number} timestamp The timestamp of the GeneratedId
 * @return {string} The GeneratedId as hex string.
 */
tutao.util.EncodingConverter.timestampToHexGeneratedId = function(timestamp) {
	var id = timestamp * 4; // shifted 2 bits left, so the value covers 44 bits overall (42 timestamp + 2 shifted)
	var hex = parseInt(id).toString(16) + "0000000"; // add one zero for the missing 4 bits plus 6 more (3 bytes) to get 9 bytes 
	// add leading zeros to reach 9 bytes (GeneratedId length) = 18 hex
	for (var length = hex.length; length < 18; length++) {
		hex = "0" + hex;
	}
	return hex;
};

/**
 * Converts a timestamp number to a GeneratedId (the counter is set to zero).
 * 
 * @param {number} timestamp The timestamp of the GeneratedId
 * @return {string} The GeneratedId.
 */
tutao.util.EncodingConverter.timestampToGeneratedId = function(timestamp) {
	var hex = tutao.util.EncodingConverter.timestampToHexGeneratedId(timestamp);
	return tutao.util.EncodingConverter.base64ToBase64Ext(tutao.util.EncodingConverter.hexToBase64(hex));
};

/**
 * Converts a base64 url string to a "normal" base64 string. This is used for
 * base64 coded url parameters.
 *
 * @param {string} base64url The base64 url string.
 * @return {string} The base64 string.
 */
tutao.util.EncodingConverter.base64UrlToBase64 = function(base64url) {
	var base64 = base64url.replace(/\-/g, "+");
	base64 = base64.replace(/_/g, "/");
	var nbrOfRemainingChars = base64.length % 4;
	if (nbrOfRemainingChars === 0) {
		return base64;
	} else if (nbrOfRemainingChars === 2) {
		return base64 + "==";
	} else if (nbrOfRemainingChars === 3) {
		return base64 + "=";
	}
	throw new Error("Illegal base64 string.");
};

/**
 * Converts the content of an array to a base64 string. For comparison
 * see http://jsperf.com/encoding-xhr-image-data/5
 *
 * @param {Array.<number>} byteArray The Array of bytes.
 * @return {string} The base64 string.
 */
tutao.util.EncodingConverter.bytesToBase64 = function(byteArray) {
	var encodings = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

	var byteLength = byteArray.length;

	var byteRemainder = byteLength % 3;
	var mainLength = byteLength - byteRemainder;

	var base64Array = [];
	base64Array.length = Math.floor((byteLength + 2) / 3 * 4);
	var index = 0;

	var a, b, c, d;
	var chunk;

	// Main loop deals with bytes in chunks of 3
	for (var i = 0; i < mainLength; i = i + 3) {
		// Combine the three bytes into a single integer
		chunk = (byteArray[i] << 16) | (byteArray[i + 1] << 8) | byteArray[i + 2];

		// Use bitmasks to extract 6-bit segments from the triplet
		a = (chunk & 16515072) >> 18; // 16515072 = (2^6 - 1) << 18
		b = (chunk & 258048) >> 12; // 258048 = (2^6 - 1) << 12
		c = (chunk & 4032) >> 6; // 4032 = (2^6 - 1) << 6
		d = chunk & 63; // 63 = 2^6 - 1

		// Convert the raw binary segments to the appropriate ASCII encoding
		base64Array[index++] = encodings[a];
		base64Array[index++] = encodings[b];
		base64Array[index++] = encodings[c];
		base64Array[index++] = encodings[d];
	}

	// Deal with the remaining bytes and padding
	if (byteRemainder == 1) {
		chunk = byteArray[mainLength];

		a = (chunk & 252) >> 2; // 252 = (2^6 - 1) << 2

		// Set the 4 least significant bits to zero
		b = (chunk & 3) << 4; // 3 = 2^2 - 1

		base64Array[index++] = encodings[a];
		base64Array[index++] = encodings[b];
		base64Array[index++] = '=';
		//noinspection JSUnusedAssignment
        base64Array[index++] = '=';
	} else if (byteRemainder == 2) {
		chunk = (byteArray[mainLength] << 8) | byteArray[mainLength + 1];

		a = (chunk & 64512) >> 10; // 64512 = (2^6 - 1) << 10
		b = (chunk & 1008) >> 4; // 1008 = (2^6 - 1) << 4

		// Set the 2 least significant bits to zero
		c = (chunk & 15) << 2; // 15 = 2^4 - 1

		base64Array[index++] = encodings[a];
		base64Array[index++] = encodings[b];
		base64Array[index++] = encodings[c];
		//noinspection JSUnusedAssignment
        base64Array[index++] = '=';
	}

	return base64Array.join('');
};

/**
 * Converts an ASCII string to an ArrayBuffer string. Do not use this
 * for UTF-8/UTF-16-Strings as this conversion uses only one byte per char!
 *
 * @param {string} string The ASCII-String to convert.
 * @return {ArrayBuffer} The ArrayBuffer.
 */
tutao.util.EncodingConverter.asciiToArrayBuffer = function(string) {
    var buffer = new ArrayBuffer(string.length);
    var bytes = new Uint8Array( buffer );
    for(var i = 0; i < string.length; i++) {
        bytes[i] = string.charCodeAt(i);
    }
    return buffer;
};


tutao.util.EncodingConverter._UTF8 = {
    // UTF8 decoding functions
    'getCharLength': function(theByte) {
        // 4 bytes encoded char (mask 11110000)
        if(0xF0 == (theByte&0xF0)) {
            return 4;
            // 3 bytes encoded char (mask 11100000)
        } else if(0xE0 == (theByte&0xE0)) {
            return 3;
            // 2 bytes encoded char (mask 11000000)
        } else if(0xC0 == (theByte&0xC0)) {
            return 2;
            // 1 bytes encoded char
        } else if(theByte == (theByte&0x7F)) {
            return 1;
        }
        return 0;
    },
    'getCharCode': function(bytes, byteOffset, charLength) {
        var charCode = 0, mask = '';
        byteOffset = byteOffset || 0;
        // Retrieve charLength if not given
        charLength = charLength || tutao.util.EncodingConverter._UTF8.getCharLength(bytes[byteOffset]);
        if(charLength == 0) {
            throw new Error(bytes[byteOffset].toString(2)+' is not a significative' +
            ' byte (offset:'+byteOffset+').');
        }
        // Return byte value if charlength is 1
        if(1 === charLength) {
            return bytes[byteOffset];
        }
        // Test UTF8 integrity
        mask = '00000000'.slice(0, charLength) + 1 + '00000000'.slice(charLength + 1);
        if(bytes[byteOffset]&(parseInt(mask, 2))) {
            throw Error('Index ' + byteOffset + ': A ' + charLength + ' bytes' +
            ' encoded char' +' cannot encode the '+(charLength+1)+'th rank bit to 1.');
        }
        // Reading the first byte
        mask='0000'.slice(0,charLength+1)+'11111111'.slice(charLength+1);
        charCode+=(bytes[byteOffset]&parseInt(mask,2))<<((--charLength)*6);
        // Reading the next bytes
        while(charLength) {
            if(0x80!==(bytes[byteOffset+1]&0x80)
                ||0x40===(bytes[byteOffset+1]&0x40)) {
                throw Error('Index '+(byteOffset+1)+': Next bytes of encoded char'
                +' must begin with a "10" bit sequence.');
            }
            charCode += ((bytes[++byteOffset]&0x3F) << ((--charLength) * 6));
        }
        return charCode;
    },
    'getStringFromBytes': function(bytes, byteOffset, byteLength, strict) {
        var charLength, chars = [];
        byteOffset = byteOffset|0;
        byteLength=('number' === typeof byteLength ?
            byteLength :
        bytes.byteLength || bytes.length
        );
        for(; byteOffset < byteLength; byteOffset++) {
            charLength = tutao.util.EncodingConverter._UTF8.getCharLength(bytes[byteOffset]);
            if(byteOffset + charLength > byteLength) {
                if(strict) {
                    throw Error('Index ' + byteOffset + ': Found a ' + charLength +
                    ' bytes encoded char declaration but only ' +
                    (byteLength - byteOffset) +' bytes are available.');
                }
            } else {
                chars.push(String.fromCodePoint(
                    tutao.util.EncodingConverter._UTF8.getCharCode(bytes, byteOffset, charLength, strict)
                ));
            }
            byteOffset += charLength - 1;
        }
        return chars.join('');
    },
    // UTF8 encoding functions
    'getBytesForCharCode': function(charCode) {
        if(charCode < 128) {
            return 1;
        } else if(charCode < 2048) {
            return 2;
        } else if(charCode < 65536) {
            return 3;
        } else if(charCode < 2097152) {
            return 4;
        }
        throw new Error('CharCode '+charCode+' cannot be encoded with UTF8.');
    },
    'setBytesFromCharCode': function(charCode, bytes, byteOffset, neededBytes) {
        charCode = charCode|0;
        bytes = bytes || [];
        byteOffset = byteOffset|0;
        neededBytes = neededBytes || tutao.util.EncodingConverter._UTF8.getBytesForCharCode(charCode);
        // Setting the charCode as it to bytes if the byte length is 1
        if(1 == neededBytes) {
            bytes[byteOffset] = charCode;
        } else {
            // Computing the first byte
            bytes[byteOffset++] =
                (parseInt('1111'.slice(0, neededBytes), 2) << 8 - neededBytes) +
                (charCode >>> ((--neededBytes) * 6));
            // Computing next bytes
            for(;neededBytes>0;) {
                bytes[byteOffset++] = ((charCode>>>((--neededBytes) * 6))&0x3F)|0x80;
            }
        }
        return bytes;
    },
    'setBytesFromString': function(string, bytes, byteOffset, byteLength, strict) {
        string = string || '';
        bytes = bytes || [];
        byteOffset = byteOffset|0;
        byteLength = ('number' === typeof byteLength ?
            byteLength :
        bytes.byteLength||Infinity
        );
        for(var i = 0, j = string.length; i < j; i++) {
            var neededBytes = tutao.util.EncodingConverter._UTF8.getBytesForCharCode(string[i].codePointAt(0));
            if(strict && byteOffset + neededBytes > byteLength) {
                throw new Error('Not enought bytes to encode the char "' + string[i] +
                '" at the offset "' + byteOffset + '".');
            }
            tutao.util.EncodingConverter._UTF8.setBytesFromCharCode(string[i].codePointAt(0),
                bytes, byteOffset, neededBytes, strict);
            byteOffset += neededBytes;
        }
        return bytes;
    }
};

/**
 * Converts a string to an ArrayBuffer containing a UTF-8 string.
 *
 * @param {string} string The string to convert.
 * @return {ArrayBuffer} The ArrayBuffer.
 */
tutao.util.EncodingConverter.stringToUint8ArrayBuffer = function(string) {
    var bytes = tutao.util.EncodingConverter._UTF8.setBytesFromString(string);
    return Uint8Array.from(bytes).buffer;
};


/**
 * Converts an ArrayBuffer containing an UTF-8 string into a string.
 *
 * @param {ArrayBuffer} buffer The ArrayBuffer to convert.
 * @return {string} The string.
 */
tutao.util.EncodingConverter.utf8ArrayBufferToString = function(buffer) {
    return tutao.util.EncodingConverter._UTF8.getStringFromBytes(new Uint8Array(buffer));
};

tutao.util.EncodingConverter.hexToArrayBuffer = function(hex) {
	var buffer = new ArrayBuffer(hex.length / 2);
	var bufView = new Uint8Array(buffer);
	for (var i=0; i<buffer.byteLength; i++) {
		bufView[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
	}
	return buffer;
};

tutao.util.EncodingConverter.arrayBufferToHex = function(buffer) {
	var hexDigits = '0123456789abcdef';
	var hex = "";
	var bufView = new Uint8Array(buffer);
	for (var i=0; i<buffer.byteLength; i++) {
		var value = bufView[i];
		hex += hexDigits[value >> 4] + hexDigits[value & 15];
	}
	return hex;
};

/**
 * Converts an ArrayBuffer to a Base64 encoded string.
 * Works only on IE > 10 (uses btoa).
 *
 * @param {ArrayBuffer} buffer The ASCII-String to convert.
 * @return {string} The Base64 encoded string.
 */
tutao.util.EncodingConverter.arrayBufferToBase64 = function(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return btoa(binary);
};

tutao.util.EncodingConverter.base64ToArrayBuffer = function(base64) {
	return tutao.util.EncodingConverter.base64ToArray(base64).buffer;
};

tutao.util.EncodingConverter.base64ToArray = function(base64) {
    return new Uint8Array(atob(base64).split("").map(function(c) {
        return c.charCodeAt(0);
    }));
};
