// @flow
import o from "ospec/ospec.js"
import {
	pad,
	unpad,
	checkIs128BitKey,
	uint8ArrayToBitArray,
	bitArrayToUint8Array
} from "../../../src/api/worker/crypto/CryptoUtils"
import {random} from "../../../src/api/worker/crypto/Randomizer"
import {CryptoError} from "../../../src/api/common/error/CryptoError"

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
		let padded = pad(new Uint8Array(array))
		o(padded.byteLength - array.length).equals(expectedNbrOfPaddingBytes)
		for (let i = 0; i < array.length; i++) {
			o(padded[i]).equals(array[i])
		}
		for (let i = 0; i < expectedNbrOfPaddingBytes; i++) {
			o(padded[array.length + i]).equals(expectedNbrOfPaddingBytes)
		}

		let unpadded = unpad(padded)
		o(unpadded.length).equals(array.length)
		for (let i = 0; i < array.length; i++) {
			o(unpadded[i]).equals(array[i])
		}
	}

	o("checkIs128BitKey", function (done) {
		let key128 = uint8ArrayToBitArray(random.generateRandomData(16))
		let key256 = uint8ArrayToBitArray(random.generateRandomData(32))
		let badKey = uint8ArrayToBitArray(random.generateRandomData(20))

		o(checkIs128BitKey(key128)).equals(true)
		o(checkIs128BitKey(key256)).equals(false)
		try {
			checkIs128BitKey(badKey)
		} catch (e) {
			o(e instanceof CryptoError).equals(true)
			done()
		}
	})

	o("bitArrayToUint8Array", function () {
		let bitArray = [8794650181632]
		o(Array.from(bitArrayToUint8Array(bitArray))).deepEquals([170])("no padding should be added during the conversion from bitarray to Uint8Array")

		o(Array.from(bitArrayToUint8Array(uint8ArrayToBitArray(new Uint8Array([170]))))).deepEquals([170])
	})

})
