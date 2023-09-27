import o from "@tutao/otest"
import { generateKeyPair } from "@tutao/tutanota-crypto/dist/encryption/Liboqs/Kyber.js"
import { random } from "@tutao/tutanota-crypto"
import {
	hexToKyberPrivateKey,
	hexToKyberPublicKey,
	kyberPrivateKeyToHex,
	kyberPublicKeyToHex,
	WASMKyberFacade,
} from "../../../../../src/api/worker/facades/KyberFacade.js"
import { loadWasmModuleFromFile } from "../../../../../packages/tutanota-crypto/test/WebAssemblyTestUtils.js"

o.spec("KyberFacade", async () => {
	const kyberFacade = new WASMKyberFacade(await loadWasmModuleFromFile("../packages/tutanota-crypto/lib/encryption/Liboqs/liboqs.wasm"))
	o("encoding roundtrip", async function () {
		const keyPair = await kyberFacade.generateKeypair()
		o(hexToKyberPublicKey(kyberPublicKeyToHex(keyPair.publicKey))).deepEquals(keyPair.publicKey)
		o(hexToKyberPrivateKey(kyberPrivateKeyToHex(keyPair.privateKey))).deepEquals(keyPair.privateKey)
	})
})
