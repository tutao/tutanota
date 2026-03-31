import o from "@tutao/otest"
import { generateKeyFromPassphraseBcrypt, generateRandomSalt, KeyLength, keyToUint8Array } from "@tutao/crypto"

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
		let key0 = generateKeyFromPassphraseBcrypt("hello", salt1, KeyLength.b128)
		let key1 = generateKeyFromPassphraseBcrypt("hello", salt1, KeyLength.b128)
		let key2 = generateKeyFromPassphraseBcrypt("hello", salt2, KeyLength.b128)
		let key3 = generateKeyFromPassphraseBcrypt("hellohello", salt1, KeyLength.b128)
		o(key1).deepEquals(key0)
		// make sure a different password or different key result in different keys
		o(key2).notDeepEquals(key0)
		o(key3).notDeepEquals(key0)
		// test the key length to be 128 bit
		o(Array.from(keyToUint8Array(key0)).length).equals(16)
		o(Array.from(keyToUint8Array(key2)).length).equals(16)
		o(Array.from(keyToUint8Array(key3)).length).equals(16)
	})
	o("CreateKeyFromPassphrase 256", function () {
		let salt1 = generateRandomSalt()
		let salt2 = generateRandomSalt()
		let key0 = generateKeyFromPassphraseBcrypt("hello", salt1, KeyLength.b256)
		let key1 = generateKeyFromPassphraseBcrypt("hello", salt1, KeyLength.b256)
		let key2 = generateKeyFromPassphraseBcrypt("hello", salt2, KeyLength.b256)
		let key3 = generateKeyFromPassphraseBcrypt("hellohello", salt1, KeyLength.b256)
		o(key1).deepEquals(key0)
		// make sure a different password or different key result in different keys
		o(key2).notDeepEquals(key0)
		o(key3).notDeepEquals(key0)
		// test the key length to be 128 bit
		o(Array.from(keyToUint8Array(key0)).length).equals(32)
		o(Array.from(keyToUint8Array(key2)).length).equals(32)
		o(Array.from(keyToUint8Array(key3)).length).equals(32)
	})
})
