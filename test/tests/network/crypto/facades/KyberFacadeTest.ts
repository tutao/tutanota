import o from "@tutao/otest"
import { WASMKyberFacade } from "../../../../../src/platform-kit/base/base-crypto/KyberFacade.js"
import { bytesToKyberPrivateKey, bytesToKyberPublicKey, kyberPrivateKeyToBytes, kyberPublicKeyToBytes } from "../../../../../src/platform-kit/crypto"

import { loadLibOQSWASM } from "../../../crypto/WebAssemblyTestUtils"
import { getTestRandom } from "../../../TestUtils"

o.spec("KyberFacade", function () {
	let kyberFacade: WASMKyberFacade
	const random = getTestRandom()
	o.before(async () => {
		kyberFacade = new WASMKyberFacade(random, await loadLibOQSWASM())
	})
	o("encoding roundtrip", async function () {
		const keyPair = await kyberFacade.generateKeypair()
		o(bytesToKyberPublicKey(kyberPublicKeyToBytes(keyPair.publicKey))).deepEquals(keyPair.publicKey)
		o(bytesToKyberPrivateKey(kyberPrivateKeyToBytes(keyPair.privateKey))).deepEquals(keyPair.privateKey)
	})

	o("encryptionDecryptionRoundtrip", async function () {
		const keyPairBob = await kyberFacade.generateKeypair()
		const encapsulation = await kyberFacade.encapsulate(keyPairBob.publicKey)
		const sharedSecretAlice = encapsulation.sharedSecret
		const sharedSecretBob = await kyberFacade.decapsulate(keyPairBob.privateKey, encapsulation.ciphertext)

		o(sharedSecretAlice).deepEquals(sharedSecretBob)
	})
})
