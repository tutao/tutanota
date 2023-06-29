import o from "@tutao/otest"
import { bitArrayToUint8Array, checkIs128BitKey, padAes, uint8ArrayToBitArray, unpadAes } from "../lib/misc/Utils.js"
import { CryptoError } from "../lib/misc/CryptoError.js"
import { random } from "../lib/random/Randomizer.js"

o.spec("crypto utils", function () {
	o("pad ", function () {
		_testPadding([], 16)

		_testPadding([1], 15)

		_testPadding([1, 2], 14)

		_testPadding([1, 2, 3], 13)

		_testPadding([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5], 1)

		_testPadding([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6], 16)

		_testPadding([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7], 15)

		_testPadding([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1], 1)

		_testPadding([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2], 16)

		_testPadding([1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3], 15)
	})

	let _testPadding = function (array, expectedNbrOfPaddingBytes) {
		let padded = padAes(new Uint8Array(array))
		o(padded.byteLength - array.length).equals(expectedNbrOfPaddingBytes)

		for (let i = 0; i < array.length; i++) {
			o(padded[i]).equals(array[i])
		}

		for (let i = 0; i < expectedNbrOfPaddingBytes; i++) {
			o(padded[array.length + i]).equals(expectedNbrOfPaddingBytes)
		}

		let unpadded = unpadAes(padded)
		o(unpadded.length).equals(array.length)

		for (let i = 0; i < array.length; i++) {
			o(unpadded[i]).equals(array[i])
		}
	}

	o("checkIs128BitKey", function () {
		let key128 = uint8ArrayToBitArray(random.generateRandomData(16))
		let key256 = uint8ArrayToBitArray(random.generateRandomData(32))
		let badKey = uint8ArrayToBitArray(random.generateRandomData(20))
		o(checkIs128BitKey(key128)).equals(true)
		o(checkIs128BitKey(key256)).equals(false)

		o(() => checkIs128BitKey(badKey)).throws(CryptoError)
	})
	o("bitArrayToUint8Array", function () {
		let bitArray = [8794650181632]
		o(Array.from(bitArrayToUint8Array(bitArray))).deepEquals([170])("no padding should be added during the conversion from bitarray to Uint8Array")
		o(Array.from(bitArrayToUint8Array(uint8ArrayToBitArray(new Uint8Array([170]))))).deepEquals([170])
	})
})
