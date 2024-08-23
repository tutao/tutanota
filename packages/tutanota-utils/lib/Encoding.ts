export type Base64 = string
export type Base64Ext = string
export type Base64Url = string
export type Hex = string

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

function makeLookup(str: string): Record<string, number> {
	const lookup: Record<string, number> = {}

	for (let i = 0; i < str.length; i++) {
		lookup[str.charAt(i)] = i
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
		const index = base64Lookup[base64.charAt(i)]
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

const REPLACEMENT_CHAR = "\uFFFD"

export function _replaceLoneSurrogates(s: string | null | undefined): string {
	if (s == null) {
		return ""
	}

	let result: string[] = []

	for (let i = 0; i < s.length; i++) {
		let code = s.charCodeAt(i)
		let char = s.charAt(i)

		if (0xd800 <= code && code <= 0xdbff) {
			if (s.length === i) {
				// replace high surrogate without following low surrogate
				result.push(REPLACEMENT_CHAR)
			} else {
				let next = s.charCodeAt(i + 1)

				if (0xdc00 <= next && next <= 0xdfff) {
					result.push(char)
					result.push(s.charAt(i + 1))
					i++ // valid high and low surrogate, skip next low surrogate check
				} else {
					result.push(REPLACEMENT_CHAR)
				}
			}
		} else if (0xdc00 <= code && code <= 0xdfff) {
			// replace low surrogate without preceding high surrogate
			result.push(REPLACEMENT_CHAR)
		} else {
			result.push(char)
		}
	}

	return result.join("")
}

const encoder =
	typeof TextEncoder == "function"
		? new TextEncoder()
		: {
				encode: _stringToUtf8Uint8ArrayLegacy,
		  }
const decoder =
	typeof TextDecoder == "function"
		? new TextDecoder()
		: {
				decode: _utf8Uint8ArrayToStringLegacy,
		  }

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
	let stringArray: string[] = []
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

const hexDigits = "0123456789abcdef"

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
		return btoa(String.fromCharCode(...bytes))
	}

	let binary = ""
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
		throw new Error(`invalid base64 length: ${base64} (${base64.length})`)
	}

	const binaryString = atob(base64)
	const result = new Uint8Array(binaryString.length)

	for (let i = 0; i < binaryString.length; i++) {
		result[i] = binaryString.charCodeAt(i)
	}

	return result
}

/**
 * Converts a Uint8Array containing string data into a string, given the charset the data is in.
 * @param charset The charset. Must be supported by TextDecoder.
 * @param bytes The string data
 * @trhows RangeError if the charset is not supported
 * @return The string
 */
export function uint8ArrayToString(charset: string, bytes: Uint8Array): string {
	const decoder = new TextDecoder(charset)
	return decoder.decode(bytes)
}

/**
 * Decodes a quoted-printable piece of text in a given charset.
 * This was copied and modified from https://github.com/mathiasbynens/quoted-printable/blob/master/src/quoted-printable.js (MIT licensed)
 *
 * @param charset Must be supported by TextEncoder
 * @param input The encoded text
 * @throws RangeError if the charset is not supported
 * @returns The text as a JavaScript string
 */
export function decodeQuotedPrintable(charset: string, input: string): string {
	return (
		input // https://tools.ietf.org/html/rfc2045#section-6.7, rule 3:
			// “Therefore, when decoding a `Quoted-Printable` body, any trailing white
			// space on a line must be deleted, as it will necessarily have been added
			// by intermediate transport agents.”
			.replace(/[\t\x20]$/gm, "") // Remove hard line breaks preceded by `=`. Proper `Quoted-Printable`-
			// encoded data only contains CRLF line  endings, but for compatibility
			// reasons we support separate CR and LF too.
			.replace(/=(?:\r\n?|\n|$)/g, "") // Decode escape sequences of the form `=XX` where `XX` is any
			// combination of two hexidecimal digits. For optimal compatibility,
			// lowercase hexadecimal digits are supported as well. See
			// https://tools.ietf.org/html/rfc2045#section-6.7, note 1.
			.replace(/(=([a-fA-F0-9]{2}))+/g, (match) => {
				const hexValues = match.split(/=/)
				// splitting on '=' is convenient, but adds an empty string at the start due to the first byte
				hexValues.shift()
				const intArray = hexValues.map((char) => parseInt(char, 16))
				const bytes = Uint8Array.from(intArray)
				return uint8ArrayToString(charset, bytes)
			})
	)
}

export function decodeBase64(charset: string, input: string): string {
	return uint8ArrayToString(charset, base64ToUint8Array(input))
}

export function stringToBase64(str: string): string {
	return uint8ArrayToBase64(stringToUtf8Uint8Array(str))
}

/**
 * Encodes a variable number of byte arrays as a single byte array. Format:
 * short(length of byteArray[0]) | byteArray[0] | ... | short(length of byteArray[n]) | byteArray[n]
 *
 * @return encoded byte array
 */
export function byteArraysToBytes(byteArrays: Array<Uint8Array>): Uint8Array {
	const totalBytesLength = byteArrays.reduce((acc, element) => acc + element.length, 0)
	const encodingOverhead = byteArrays.length * 2 // two byte length overhead for each byte array
	const encodedByteArrays = new Uint8Array(encodingOverhead + totalBytesLength)
	let index = 0
	for (var byteArray of byteArrays) {
		if (byteArray.length > MAX_ENCODED_BYTES_LENGTH) {
			throw new Error("byte array is to long for encoding")
		}
		index = writeByteArray(encodedByteArrays, byteArray, index)
	}
	return encodedByteArrays
}

/**
 * Decodes a byte array encoded by #byteArraysToBytes.
 *
 * @return list of byte arrays
 */
export function bytesToByteArrays(encodedByteArrays: Uint8Array, expectedByteArrays: Number): Array<Uint8Array> {
	const byteArrays = new Array<Uint8Array>()
	let index = 0
	while (index < encodedByteArrays.length) {
		const readResult = readByteArray(encodedByteArrays, index)
		byteArrays.push(readResult.byteArray)
		index = readResult.index
	}
	if (byteArrays.length != expectedByteArrays) {
		throw new Error("invalid amount of key parameters. Expected: " + expectedByteArrays + " actual:" + byteArrays.length)
	}
	return byteArrays
}

// Size of the length field for encoded byte arrays
const BYTE_ARRAY_LENGTH_FIELD_SIZE = 2
const MAX_ENCODED_BYTES_LENGTH = 65535

function writeByteArray(result: Uint8Array, byteArray: Uint8Array, index: number): number {
	writeShort(result, byteArray.length, index)
	index += BYTE_ARRAY_LENGTH_FIELD_SIZE
	result.set(byteArray, index)
	index += byteArray.length
	return index
}

function readByteArray(encoded: Uint8Array, index: number): { index: number; byteArray: Uint8Array } {
	const length = readShort(encoded, index)
	index += BYTE_ARRAY_LENGTH_FIELD_SIZE
	const byteArray = encoded.slice(index, length + index)
	index += length
	if (byteArray.length != length) {
		throw new Error("cannot read encoded byte array at pos:" + index + " expected bytes:" + length + " read bytes:" + byteArray.length)
	}
	return { index, byteArray }
}

function writeShort(array: Uint8Array, value: number, index: number) {
	array[index] = (value & 0x0000ff00) >> 8
	array[index + 1] = (value & 0x000000ff) >> 0
}

function readShort(array: Uint8Array, index: number): number {
	const bytes = array.subarray(index, index + BYTE_ARRAY_LENGTH_FIELD_SIZE)
	let n = 0
	for (const byte of bytes.values()) {
		n = (n << 8) | byte
	}
	return n
}
