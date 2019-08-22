// @flow
import {CryptoError} from "../error/CryptoError"
import {pad} from "./StringUtils"

// TODO rename methods according to their JAVA counterparts (e.g. Uint8Array == bytes, Utf8Uint8Array == bytes...)

export function uint8ArrayToArrayBuffer(uint8Array: Uint8Array): ArrayBuffer {
	if (uint8Array.byteLength === uint8Array.buffer.byteLength) {
		return uint8Array.buffer
	} else {
		return new Uint8Array(uint8Array).buffer // create a new instance with the correct length, if uint8Array is only a DataView on a longer Array.buffer
	}
}


/**
 * Converts a hex coded string into a base64 coded string.
 *
 * @param hex A hex encoded string.
 * @return A base64 encoded string.
 */
export function hexToBase64(hex: Hex): Base64 {
	return uint8ArrayToBase64(hexToUint8Array(hex))
}

/**
 * Converts a base64 coded string into a hex coded string.
 *
 * @param base64 A base64 encoded string.
 * @return A hex encoded string.
 */
export function base64ToHex(base64: Base64): Hex {
	return uint8ArrayToHex(base64ToUint8Array(base64))
}

/**
 * Converts a base64 string to a url-conform base64 string. This is used for
 * base64 coded url parameters.
 *
 * @param base64 The base64 string.
 * @return The base64url string.
 */
export function base64ToBase64Url(base64: Base64): Base64Url {
	let base64url = base64.replace(/\+/g, "-")
	base64url = base64url.replace(/\//g, "_")
	base64url = base64url.replace(/=/g, "")
	return base64url
}

function makeLookup(str: string): {[string]: number} {
	const lookup = {}
	for (let i = 0; i < str.length; i++) {
		lookup[str.charAt(i)] = i;
	}
	return lookup
}

const base64Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
const base64Lookup = makeLookup(base64Alphabet)
const base64extAlphabet = "-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz"
const base64ExtLookup = makeLookup(base64extAlphabet)

/**
 * Converts a base64 string to a base64ext string. Base64ext uses another character set than base64 in order to make it sortable.
 *
 *
 * @param base64 The base64 string.
 * @return The base64Ext string.
 */
export function base64ToBase64Ext(base64: Base64): Base64Ext {
	base64 = base64.replace(/=/g, "")
	let base64ext = ""
	for (let i = 0; i < base64.length; i++) {
		let index = base64Lookup[base64.charAt(i)]
		base64ext += base64extAlphabet[index]
	}
	return base64ext
}

/**
 * Converts a Base64Ext string to a Base64 string and appends the padding if needed.
 * @param base64ext The base64Ext string
 * @returns The base64 string
 */
export function base64ExtToBase64(base64ext: Base64Ext): Base64 {
	let base64 = ""
	for (let i = 0; i < base64ext.length; i++) {
		const index = base64ExtLookup[base64ext.charAt(i)]
		base64 += base64Alphabet[index]
	}
	let padding
	if (base64.length % 4 === 2) {
		padding = "=="
	} else if (base64.length % 4 === 3) {
		padding = "="
	} else {
		padding = ""
	}
	return base64 + padding
}

/**
 * Converts a timestamp number to a GeneratedId (the counter is set to zero) in hex format.
 *
 * @param timestamp The timestamp of the GeneratedId
 * @return The GeneratedId as hex string.
 */
export function timestampToHexGeneratedId(timestamp: number, serverId: number): Hex {
	let id = timestamp * 4 // shifted 2 bits left, so the value covers 44 bits overall (42 timestamp + 2 shifted)
	let hex = parseInt(id).toString(16) + "00000" + pad(serverId, 2) // add one zero for the missing 4 bits plus 4 more (2 bytes) plus 2 more for the server id to get 9 bytes
	// add leading zeros to reach 9 bytes (GeneratedId length) = 18 hex
	for (let length = hex.length; length < 18; length++) {
		hex = "0" + hex
	}
	return hex
}

/**
 * Converts a timestamp number to a GeneratedId (the counter and server bits are set to zero).
 *
 * @param timestamp The timestamp of the GeneratedId
 * @return The GeneratedId.
 */
export function timestampToGeneratedId(timestamp: number, serverId: number = 0): Id {
	let hex = timestampToHexGeneratedId(timestamp, serverId)
	return base64ToBase64Ext(hexToBase64(hex))
}

/**
 * Extracts the timestamp from a GeneratedId
 * @param base64Ext The id as base64Ext
 * @returns The timestamp of the GeneratedId
 */
export function generatedIdToTimestamp(base64Ext: Id): number {
	const base64 = base64ExtToBase64(base64Ext)
	const decodedbB4 = atob(base64)
	let numberResult = 0
	// Timestamp is in the first 42 bits
	for (let i = 0; i < 5; i++) {
		// We "shift" each number by 8 bits to the left: numberResult << 8
		numberResult = numberResult * 256
		numberResult += decodedbB4.charCodeAt(i)
	}
	// We need to shift the whole number to the left by 2 bits (because 42 bits is encoded in 6 bytes)
	numberResult = numberResult * 4
	// We take only last two highest bits from the last byte
	numberResult += decodedbB4.charCodeAt(5) >>> 6
	return numberResult
}

/**
 * Converts a base64 url string to a "normal" base64 string. This is used for
 * base64 coded url parameters.
 *
 * @param base64url The base64 url string.
 * @return The base64 string.
 */
export function base64UrlToBase64(base64url: Base64Url): Base64 {
	let base64 = base64url.replace(/-/g, "+")
	base64 = base64.replace(/_/g, "/")
	let nbrOfRemainingChars = base64.length % 4
	if (nbrOfRemainingChars === 0) {
		return base64
	} else if (nbrOfRemainingChars === 2) {
		return base64 + "=="
	} else if (nbrOfRemainingChars === 3) {
		return base64 + "="
	}
	throw new Error("Illegal base64 string.")
}

// just for edge, as it does not support TextEncoder yet
export function _stringToUtf8Uint8ArrayLegacy(string: string): Uint8Array {
	let fixedString
	try {
		fixedString = encodeURIComponent(string)
	} catch (e) {
		fixedString = encodeURIComponent(_replaceLoneSurrogates(string)) // we filter lone surrogates as trigger URIErrors, otherwise (see https://github.com/tutao/tutanota/issues/618)
	}
	let utf8 = unescape(fixedString)
	let uint8Array = new Uint8Array(utf8.length)
	for (let i = 0; i < utf8.length; i++) {
		uint8Array[i] = utf8.charCodeAt(i)
	}
	return uint8Array
}

const REPLACEMENT_CHAR = '\uFFFD'

export function _replaceLoneSurrogates(s: ?string): string {
	if (s == null) {
		return ""
	}
	let result = []
	for (let i = 0; i < s.length; i++) {
		let code = s.charCodeAt(i)
		let char = s.charAt(i)
		if (0xD800 <= code && code <= 0xDBFF) {
			if (s.length === i) {
				// replace high surrogate without following low surrogate
				result.push(REPLACEMENT_CHAR)
			} else {
				let next = s.charCodeAt(i + 1)
				if (0xDC00 <= next && next <= 0xDFFF) {
					result.push(char)
					result.push(s.charAt(i + 1))
					i++ // valid high and low surrogate, skip next low surrogate check
				} else {
					result.push(REPLACEMENT_CHAR)
				}
			}
		} else if (0xDC00 <= code && code <= 0xDFFF) {
			// replace low surrogate without preceding high surrogate
			result.push(REPLACEMENT_CHAR)
		} else {
			result.push(char)
		}
	}
	return result.join("")
}

const encoder = (typeof TextEncoder == "function" ? new TextEncoder() : {encode: _stringToUtf8Uint8ArrayLegacy})
const decoder = (typeof TextDecoder == "function" ? new TextDecoder() : {decode: _utf8Uint8ArrayToStringLegacy})

/**
 * Converts a string to a Uint8Array containing a UTF-8 string data.
 *
 * @param string The string to convert.
 * @return The array.
 */
export function stringToUtf8Uint8Array(string: string): Uint8Array {
	return encoder.encode(string)
}

// just for edge, as it does not support TextDecoder yet
export function _utf8Uint8ArrayToStringLegacy(uint8Array: Uint8Array): string {
	let stringArray = []
	stringArray.length = uint8Array.length
	for (let i = 0; i < uint8Array.length; i++) {
		stringArray[i] = String.fromCharCode(uint8Array[i])
	}
	return decodeURIComponent(escape(stringArray.join("")))
}

/**
 * Converts an Uint8Array containing UTF-8 string data into a string.
 *
 * @param uint8Array The Uint8Array.
 * @return The string.
 */
export function utf8Uint8ArrayToString(uint8Array: Uint8Array): string {
	return decoder.decode(uint8Array)
}

export function hexToUint8Array(hex: Hex): Uint8Array {
	let bufView = new Uint8Array(hex.length / 2)
	for (let i = 0; i < bufView.byteLength; i++) {
		bufView[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16)
	}
	return bufView
}

const hexDigits = '0123456789abcdef'

export function uint8ArrayToHex(uint8Array: Uint8Array): Hex {
	let hex = ""
	for (let i = 0; i < uint8Array.byteLength; i++) {
		let value = uint8Array[i]
		hex += hexDigits[value >> 4] + hexDigits[value & 15]
	}
	return hex
}

/**
 * Converts an Uint8Array to a Base64 encoded string.
 *
 * @param bytes The bytes to convert.
 * @return The Base64 encoded string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): Base64 {
	if (bytes.length < 512) {
		// Apply fails on big arrays fairly often. We tried it with 60000 but if you're already
		// deep in the stack than we cannot allocate such a big argument array.
		return btoa(String.fromCharCode.apply(null, bytes))
	}
	let binary = ''
	const len = bytes.byteLength
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(bytes[i])
	}
	return btoa(binary)
}

export function int8ArrayToBase64(bytes: Int8Array): Base64 {
	// Values 0 to 127 are the same for signed and unsigned bytes
	// and -128 to -1 are mapped to the same chars as 128 to 255.
	let converted = new Uint8Array(bytes)
	return uint8ArrayToBase64(converted)
}

/**
 * Converts a base64 encoded string to a Uint8Array.
 *
 * @param base64 The Base64 encoded string.
 * @return The bytes.
 */
export function base64ToUint8Array(base64: Base64): Uint8Array {
	if (base64.length % 4 !== 0) {
		throw new CryptoError(`invalid base64 length: ${base64} (${base64.length})`);
	}
	const binaryString = atob(base64)
	const result = new Uint8Array(binaryString.length)
	for (let i = 0; i < binaryString.length; i++) {
		result[i] = binaryString.charCodeAt(i)
	}
	return result
}
