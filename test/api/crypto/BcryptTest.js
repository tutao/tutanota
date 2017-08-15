// @flow
import o from "ospec/ospec.js"
import {generateRandomSalt, generateKeyFromPassphrase} from "../../../src/api/worker/crypto/Bcrypt"
import {KeyLength} from "../../../src/api/worker/crypto/CryptoConstants"
import {bitArrayToUint8Array} from "../../../src/api/worker/crypto/CryptoUtils"

o.spec("Bcrypt", function () {

	o("GenerateRandomSalt", function () {
		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		o(salt1).notDeepEquals(salt2)
		o(salt1.length).equals(16) // 16 bytes in hex
		o(salt2.length).equals(16)
		o(salt1 instanceof Uint8Array).equals(true)
	})

	o("CreateKeyFromPassphrase 128", function () {
		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		let key0 = generateKeyFromPassphrase("hello", salt1, KeyLength.b128)
		let key1 = generateKeyFromPassphrase("hello", salt1, KeyLength.b128)
		let key2 = generateKeyFromPassphrase("hello", salt2, KeyLength.b128)
		let key3 = generateKeyFromPassphrase("hellohello", salt1, KeyLength.b128)

		o(key1).deepEquals(key0)
		// make sure a different password or different key result in different keys
		o(key2).notDeepEquals(key0)
		o(key3).notDeepEquals(key0)
		// test the key length to be 128 bit
		o(Array.from(bitArrayToUint8Array(key0)).length).equals(16)
		o(Array.from(bitArrayToUint8Array(key2)).length).equals(16)
		o(Array.from(bitArrayToUint8Array(key3)).length).equals(16)
	})

	o("CreateKeyFromPassphrase 256", function () {
		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		let key0 = generateKeyFromPassphrase("hello", salt1, KeyLength.b256)
		let key1 = generateKeyFromPassphrase("hello", salt1, KeyLength.b256)
		let key2 = generateKeyFromPassphrase("hello", salt2, KeyLength.b256)
		let key3 = generateKeyFromPassphrase("hellohello", salt1, KeyLength.b256)

		o(key1).deepEquals(key0)
		// make sure a different password or different key result in different keys
		o(key2).notDeepEquals(key0)
		o(key3).notDeepEquals(key0)
		// test the key length to be 128 bit
		o(Array.from(bitArrayToUint8Array(key0)).length).equals(32)
		o(Array.from(bitArrayToUint8Array(key2)).length).equals(32)
		o(Array.from(bitArrayToUint8Array(key3)).length).equals(32)
	})

})
