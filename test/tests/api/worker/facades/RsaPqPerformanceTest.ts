import o from "@tutao/otest"
import { aes256RandomKey, bitArrayToUint8Array, generateEccKeyPair, rsaDecrypt, rsaEncrypt } from "@tutao/tutanota-crypto"
import { PQFacade } from "../../../../../src/api/worker/facades/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/api/worker/facades/KyberFacade.js"
import { loadWasmModuleFromFile } from "../../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"
import { decodePQMessage, encodePQMessage } from "../../../../../src/api/worker/facades/PQMessage.js"
import { RSA_TEST_KEYPAIR } from "../../../../../packages/tutanota-crypto/test/RsaTest.js"

o.spec("RsaPqPerformanceTest", function () {
	o.spec("perf", function () {
		const iterations = 1;

		function formatNumber(x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
		}

		o("pq", async function () {
			const kyberFacade = new WASMKyberFacade(await loadWasmModuleFromFile("../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm"))
			const pqFacade: PQFacade = new PQFacade(kyberFacade)
			const bucketKey = bitArrayToUint8Array(aes256RandomKey())

			const senderIdentityKeyPair = generateEccKeyPair()
			const recipientKeys = await pqFacade.generateKeyPairs()

			let start = window.performance.now()
			let pubEncBucketKey
			for (let i = 0; i < iterations; i++) {
				const ephemeralKeyPair = generateEccKeyPair()
				pubEncBucketKey = encodePQMessage(await pqFacade.encapsulate(senderIdentityKeyPair, ephemeralKeyPair, recipientKeys.toPublicKeys(), bucketKey))
			}
			let end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per pq encryption");

			let decryptedBucketKey
			for (let i = 0; i < iterations; i++) {
				 decryptedBucketKey = await pqFacade.decapsulate(decodePQMessage(pubEncBucketKey), recipientKeys)
			}
			end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per pq decryption");

			o(bucketKey).deepEquals(decryptedBucketKey)
		})

		o("rsa", async function () {
			const bucketKey = bitArrayToUint8Array(aes256RandomKey())

			const keyPair = RSA_TEST_KEYPAIR;
			let seed = new Uint8Array(32)
			crypto.getRandomValues(seed)

			let start = window.performance.now()
			let pubEncBucketKey
			for (let i = 0; i < iterations; i++) {
				const ephemeralKeyPair = generateEccKeyPair()
				pubEncBucketKey = rsaEncrypt(keyPair.publicKey, bucketKey, seed)
			}
			let end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per rsa encryption");

			let decryptedBucketKey
			for (let i = 0; i < iterations; i++) {
				decryptedBucketKey = rsaDecrypt(keyPair.privateKey, pubEncBucketKey)
			}
			end = window.performance.now()
			console.log(formatNumber((end - start) / iterations) + "ms per rsa decryption");

			o(bucketKey).deepEquals(decryptedBucketKey)
		})
	})
})
