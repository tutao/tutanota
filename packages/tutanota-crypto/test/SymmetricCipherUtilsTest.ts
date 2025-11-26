import o from "@tutao/otest"
import { base64ToKey, bitArrayToUint8Array, keyToBase64, uint8ArrayToBitArray } from "../lib/index.js"

o.spec("SymmetricCipherUtilsTest", function () {
	o("bitArrayToUint8Array", function () {
		let bitArray = [8794650181632]
		o(Array.from(bitArrayToUint8Array(bitArray))).deepEquals([170])("no padding should be added during the conversion from bitarray to Uint8Array")
		o(Array.from(bitArrayToUint8Array(uint8ArrayToBitArray(new Uint8Array([170]))))).deepEquals([170])
	})
	o("keyToBase64 round trip", function () {
		let key = [8794650181632]
		o(base64ToKey(keyToBase64(key))).deepEquals(key)
	})
})
