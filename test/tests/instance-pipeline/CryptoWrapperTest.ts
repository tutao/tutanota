import o, { assertThrows } from "@tutao/otest"
import { RSA_TEST_KEYPAIR } from "../api/worker/facades/RsaPqPerformanceTest"
import {
	Aes,
	AesCbcFacade,
	KeyEncryption,
	KyberKeyPair,
	random,
	RsaKeyPair,
	SymmetricCipherFacade,
	SymmetricCipherUtils,
	X25519,
	X25519KeyPair,
} from "../../../src/platform-kit/crypto"
import { CryptoError } from "../../../src/platform-kit/crypto/error"
import { WASMKyberFacade } from "../../../src/platform-kit/base/base-crypto/KyberFacade"

import { loadLibOQSWASM } from "../crypto/WebAssemblyTestUtils"
import { CryptoWrapper } from "../../../src/platform-kit/crypto/instance-pipeline-crypto/CryptoWrapper"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"

o.spec("CryptoWrapperTest", function () {
	let cryptoWrapper: CryptoWrapper
	let x25519: X25519

	o.beforeEach(() => {
		const symmetricCipherUtils = new SymmetricCipherUtils(random)
		const symmetricCipherFacade = new SymmetricCipherFacade(
			new AesCbcFacade(),
			new AeadFacade(symmetricCipherUtils),
			new SymmetricKeyDeriver(),
			symmetricCipherUtils,
		)
		const aes = new Aes(symmetricCipherFacade)
		x25519 = new X25519(random)
		cryptoWrapper = new CryptoWrapper(symmetricCipherUtils, aes, new KeyEncryption(symmetricCipherFacade, aes), x25519)
	})

	o.spec("verify public keys", function () {
		let kyberFacade: WASMKyberFacade
		o.before(async () => {
			kyberFacade = new WASMKyberFacade(random, await loadLibOQSWASM())
		})

		o("x25519 key success", function () {
			const keyPair = x25519.generateX25519KeyPair()
			const extractedPubKey = cryptoWrapper.verifyPublicX25519Key(keyPair)
			o(extractedPubKey).deepEquals(keyPair.publicKey)
		})

		o("x25519 key failure", async function () {
			const keyPair = x25519.generateX25519KeyPair()
			const anotherKeyPair = x25519.generateX25519KeyPair()
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
