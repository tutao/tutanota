import o from "@tutao/otest"
import { compress, uncompress } from "../../../../src/common/api/worker/Compression.js"
import { base64ToUint8Array, stringToUtf8Uint8Array, uint8ArrayToBase64, utf8Uint8ArrayToString } from "@tutao/tutanota-utils"

import testData from "./crypto/CompatibilityTestData.json"

o.spec("Compression/Decompression", function () {
	const lowerBound = 12

	o.spec("round trip good input", function () {
		function compressibleData(n) {
			const data = "wwwwoooooooooooowwwwwwwwwweeeeeeeeeeeeeeeeeeeee"
			return Uint8Array.from(new Array(n).fill(undefined).map((_, idx) => data.charCodeAt(idx % data.length) % 256))
		}

		function testGoodInput(input) {
			const a = compress(input)
			const b = uncompress(a)
			const c = compress(b)
			const result = uncompress(c)
			o(Array.from(result)).deepEquals(Array.from(input))
		}

		o("almost too small", function () {
			testGoodInput(compressibleData(lowerBound + 1))
		})
		o("too small", function () {
			testGoodInput(compressibleData(lowerBound))
		})
		o("empty", function () {
			testGoodInput(new Uint8Array(0))
		})
	})

	o.spec("compatibility", function () {
		o("compression", function () {
			for (const testCase of testData.compressionTests) {
				o(uint8ArrayToBase64(compress(stringToUtf8Uint8Array(testCase.uncompressedText)))).equals(testCase.compressedBase64TextJavaScript)
			}
		})

		o("decompression", function () {
			for (const testCase of testData.compressionTests) {
				o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(testCase.compressedBase64TextJavaScript)))).equals(testCase.uncompressedText)
				o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(testCase.compressedBase64TextJava)))).equals(testCase.uncompressedText)
				o(utf8Uint8ArrayToString(uncompress(base64ToUint8Array(testCase.compressedBase64TextRust)))).equals(testCase.uncompressedText)
			}
		})
	})
})
