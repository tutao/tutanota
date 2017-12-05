import o from "ospec/ospec.js"
import {
	rsaEncryptSync,
	rsaDecryptSync,
	sign,
	verifySignature,
	hexToPublicKey,
	hexToPrivateKey
} from "../../../src/api/worker/crypto/Rsa"
import {
	uint8ArrayToBase64,
	base64ToUint8Array,
	hexToUint8Array,
	stringToUtf8Uint8Array,
	utf8Uint8ArrayToString,
	uint8ArrayToHex
} from "../../../src/api/common/utils/Encoding"
import {
	aes256Encrypt,
	aes256Decrypt,
	aes128Encrypt,
	aes128Decrypt,
	aes256EncryptFile
} from "../../../src/api/worker/crypto/Aes"
import {generateKeyFromPassphrase} from "../../../src/api/worker/crypto/Bcrypt"
import {KeyLength} from "../../../src/api/worker/crypto/CryptoConstants"
import {random} from "../../../src/api/worker/crypto/Randomizer"
import compatibilityTestData from "./CompatibilityTestData"
import {bitArrayToUint8Array, uint8ArrayToBitArray} from "../../../src/api/worker/crypto/CryptoUtils"


const originalRandom = random.generateRandomData


o.spec("crypto compatibility", function () {

	o.afterEach(function () {
		random.generateRandomData = originalRandom
	})

	o("rsa encryption", () => {
		compatibilityTestData.rsaEncryptionTests.forEach(td => {
			random.generateRandomData = (number) => hexToUint8Array(td.seed)

			let publicKey = hexToPublicKey(td.publicKey)


			let encryptedData = rsaEncryptSync(publicKey, hexToUint8Array(td.input), hexToUint8Array(td.seed))
			o(uint8ArrayToHex(encryptedData)).equals(td.result)

			let privateKey = hexToPrivateKey(td.privateKey)
			let data = rsaDecryptSync(privateKey, encryptedData)
			o(uint8ArrayToHex(data)).equals(td.input)
		})
	})

	o("rsa signature", function () {
		compatibilityTestData.rsaSignatureTests.forEach(td => {
			random.generateRandomData = (number) => hexToUint8Array(td.seed)

			let privateKey = hexToPrivateKey(td.privateKey)
			let publicKey = hexToPublicKey(td.publicKey)


			let signature = sign(privateKey, hexToUint8Array(td.input))
			o(uint8ArrayToHex(signature)).equals(td.result)

			verifySignature(publicKey, hexToUint8Array(td.input), signature)
		})
	})

	o("aes 256", function () {
		compatibilityTestData.aes256Tests.forEach(td => {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aes256Encrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true)
			o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

			let decryptedBytes = uint8ArrayToBase64(aes256Decrypt(key, encryptedBytes))
			o(decryptedBytes).deepEquals(td.plainTextBase64)
		})
	})

	o("aes 256 webcrypto", browser((done, timeout) => {
		timeout(2000)
		Promise.all(
			compatibilityTestData.aes256Tests.map(td => {
				let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
				return aes256EncryptFile(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true).then(encryptedBytes => {
					o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

					return aes256Decrypt(key, encryptedBytes)
				}).then(decryptedBytes => {
					let decrypted = uint8ArrayToBase64(decryptedBytes)
					o(decrypted).deepEquals(td.plainTextBase64)
				})
			})
		).then(() => done())
	}))


	o("aes 128", function () {
		compatibilityTestData.aes128Tests.forEach(td => {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aes128Encrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, false)
			o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

			let decryptedBytes = uint8ArrayToBase64(aes128Decrypt(key, encryptedBytes))
			o(decryptedBytes).deepEquals(td.plainTextBase64)
		})
	})

	o("aes 128 mac", function () {
		compatibilityTestData.aes128MacTests.forEach(td => {
			let key = uint8ArrayToBitArray(hexToUint8Array(td.hexKey))
			let encryptedBytes = aes128Encrypt(key, base64ToUint8Array(td.plainTextBase64), base64ToUint8Array(td.ivBase64), true, true)
			o(uint8ArrayToBase64(encryptedBytes)).deepEquals(td.cipherTextBase64)

			let decryptedBytes = uint8ArrayToBase64(aes128Decrypt(key, encryptedBytes))
			o(decryptedBytes).deepEquals(td.plainTextBase64)
		})
	})

	o("StringToUint8Array compatibility test", function () {
		compatibilityTestData.encodingTests.forEach(td => {
			let encoded = stringToUtf8Uint8Array(td.string)
			o(uint8ArrayToBase64(encoded)).deepEquals(td.encodedString)
			let decoded = utf8Uint8ArrayToString(encoded)
			o(decoded).equals(td.string)
		})
	})

	o("bcrypt 128", function () {
		compatibilityTestData.bcrypt128Tests.forEach(td => {
			let key = generateKeyFromPassphrase(td.password, hexToUint8Array(td.saltHex), KeyLength.b128)
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).deepEquals(td.keyHex)
		})
	})

	o("bcrypt 256", function () {
		compatibilityTestData.bcrypt256Tests.forEach(td => {
			let key = generateKeyFromPassphrase(td.password, hexToUint8Array(td.saltHex), KeyLength.b256)
			o(uint8ArrayToHex(bitArrayToUint8Array(key))).deepEquals(td.keyHex)
		})
	})
})
