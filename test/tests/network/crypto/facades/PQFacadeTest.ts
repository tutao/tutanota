import o from "@tutao/otest"
import {
	Aes,
	AesCbcFacade,
	CryptoWrapper,
	KeyEncryption,
	keyToUint8Array,
	pqKeyPairsToPublicKeys,
	random,
	SymmetricCipherFacade,
	SymmetricCipherUtils,
	X25519,
} from "../../../../../src/platform-kit/crypto"
import { PQFacade } from "../../../../../src/platform-kit/base/base-crypto/PQFacade.js"
import { WASMKyberFacade } from "../../../../../src/platform-kit/base/base-crypto/KyberFacade.js"

import { loadLibOQSWASM } from "../../../crypto/WebAssemblyTestUtils"
import { AeadFacade } from "@tutao/crypto/aead-facade"
import { SymmetricKeyDeriver } from "@tutao/crypto/symmetric-key-deriver"

o.spec("PQFacade test", function () {
	let symmetricCipherUtils: SymmetricCipherUtils
	let x25519: X25519
	let cryptoWrapper: CryptoWrapper

	o.beforeEach(function () {
		symmetricCipherUtils = new SymmetricCipherUtils(random)
		x25519 = new X25519(random)
		const symmetricCipherFacade = new SymmetricCipherFacade(
			new AesCbcFacade(),
			new AeadFacade(symmetricCipherUtils),
			new SymmetricKeyDeriver(),
			symmetricCipherUtils,
		)
		const aes = new Aes(symmetricCipherFacade)
		cryptoWrapper = new CryptoWrapper(symmetricCipherUtils, aes, new KeyEncryption(symmetricCipherFacade, aes), x25519)
	})

	o.spec("encapsulateDecapsulateRoundtrip", function () {
		o("should lead to same result", async function () {
			const kyberFacade = new WASMKyberFacade(random, await loadLibOQSWASM())
			const pqFacade: PQFacade = new PQFacade(kyberFacade, cryptoWrapper, x25519)

			const senderIdentityKeyPair = x25519.generateX25519KeyPair()
			const ephemeralKeyPair = x25519.generateX25519KeyPair()

			const recipientKeys = await pqFacade.generateKeyPairs()
			const bucketKey = keyToUint8Array(symmetricCipherUtils.aes256RandomKey())
			const pqMessage = await pqFacade.encapsulate(senderIdentityKeyPair, ephemeralKeyPair, pqKeyPairsToPublicKeys(recipientKeys), bucketKey)

			const decryptedBucketKey = await pqFacade.decapsulate(pqMessage, recipientKeys)

			o(bucketKey).deepEquals(decryptedBucketKey)
		})
	})
})
