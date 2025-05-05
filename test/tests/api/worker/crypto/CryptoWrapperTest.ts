import o from "@tutao/otest"
import { CryptoWrapper } from "../../../../../src/common/api/worker/crypto/CryptoWrapper"
import { RSA_TEST_KEYPAIR } from "../facades/RsaPqPerformanceTest"
import { generateX25519KeyPair, KyberKeyPair, RsaKeyPair, X25519KeyPair } from "@tutao/tutanota-crypto"
import { assertThrows } from "@tutao/tutanota-test-utils"
import { CryptoError } from "@tutao/tutanota-crypto/error.js"
import { WASMKyberFacade } from "../../../../../src/common/api/worker/facades/KyberFacade"
import { loadLibOQSWASM } from "../WASMTestUtils"

o.spec("CryptoWrapperTest", function () {
	let cryptoWrapper: CryptoWrapper

	o.beforeEach(() => {
		cryptoWrapper = new CryptoWrapper()
	})

	o.spec("verify public keys", function () {
		let kyberFacade: WASMKyberFacade
		o.before(async () => {
			kyberFacade = new WASMKyberFacade(await loadLibOQSWASM())
		})

		o("x25519 key success", function () {
			const keyPair = generateX25519KeyPair()
			const extractedPubKey = cryptoWrapper.verifyPublicX25519Key(keyPair)
			o(extractedPubKey).deepEquals(keyPair.publicKey)
		})

		o("x25519 key failure", async function () {
			const keyPair = generateX25519KeyPair()
			const anotherKeyPair = generateX25519KeyPair()
			const badKeyPair: X25519KeyPair = { privateKey: keyPair.privateKey, publicKey: anotherKeyPair.publicKey }
			await assertThrows(CryptoError, async () => cryptoWrapper.verifyPublicX25519Key(badKeyPair))
		})

		o("kyber key success", async function () {
			const keyPair = await kyberFacade.generateKeypair()
			const extractedPubKey = cryptoWrapper.verifyKyberPublicKey(keyPair)
			o(extractedPubKey).deepEquals(keyPair.publicKey)
		})

		o("kyber key failure", async function () {
			const keyPair = await kyberFacade.generateKeypair()
			const anotherKeyPair = await kyberFacade.generateKeypair()
			const badKeyPair: KyberKeyPair = { privateKey: keyPair.privateKey, publicKey: anotherKeyPair.publicKey }
			await assertThrows(CryptoError, async () => cryptoWrapper.verifyKyberPublicKey(badKeyPair))
		})

		o("rsa key success", function () {
			const extractedPubKey = cryptoWrapper.verifyRsaPublicKey(RSA_TEST_KEYPAIR)
			o(extractedPubKey).deepEquals(RSA_TEST_KEYPAIR.publicKey)
		})

		o("rsa key failure", async function () {
			const badKeyPair: RsaKeyPair = {
				keyPairType: RSA_TEST_KEYPAIR.keyPairType,
				privateKey: RSA_TEST_KEYPAIR.privateKey,
				publicKey: {
					modulus: "23", // wrong modulus
					keyPairType: RSA_TEST_KEYPAIR.keyPairType,
					publicExponent: RSA_TEST_KEYPAIR.publicKey.publicExponent,
					keyLength: RSA_TEST_KEYPAIR.publicKey.keyLength,
					version: RSA_TEST_KEYPAIR.publicKey.version,
				},
			}
			await assertThrows(CryptoError, async () => cryptoWrapper.verifyRsaPublicKey(badKeyPair))
		})
	})
})
