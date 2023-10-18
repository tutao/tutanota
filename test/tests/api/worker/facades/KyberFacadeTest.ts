import o from "@tutao/otest"
import { WASMKyberFacade } from "../../../../../src/api/worker/facades/KyberFacade.js"
import { loadWasmModuleFromFile } from "../../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"
import { hexToKyberPrivateKey, hexToKyberPublicKey, kyberPrivateKeyToHex, kyberPublicKeyToHex } from "@tutao/tutanota-crypto"

o.spec("KyberFacade", async function () {
	let kyberFacade: WASMKyberFacade
	o.before(async () => {
		kyberFacade = new WASMKyberFacade(await loadWasmModuleFromFile("../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm"))
	})
	o("encoding roundtrip", async function () {
		const keyPair = await kyberFacade.generateKeypair()
		o(hexToKyberPublicKey(kyberPublicKeyToHex(keyPair.publicKey))).deepEquals(keyPair.publicKey)
		o(hexToKyberPrivateKey(kyberPrivateKeyToHex(keyPair.privateKey))).deepEquals(keyPair.privateKey)
	})

	o("encryptionDecryptionRoundtrip", async function () {
		const keyPairBob = await kyberFacade.generateKeypair()
		const encapsulation = await kyberFacade.encapsulate(keyPairBob.publicKey)
		const sharedSecretAlice = encapsulation.sharedSecret
		const sharedSecretBob = await kyberFacade.decapsulate(keyPairBob.privateKey, encapsulation.ciphertext)

		o(sharedSecretAlice).deepEquals(sharedSecretBob)
	})
})
