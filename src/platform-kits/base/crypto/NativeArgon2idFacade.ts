import { Aes256Key, uint8ArrayToKey } from "@tutao/crypto"
import { NativeCryptoFacade } from "@tutao/native-bridge/generatedIpc/types"
import { assertWorkerOrNode } from "../../app-env"
import { Argon2idFacade } from "./WasmArgon2idFacade"

assertWorkerOrNode()

/**
 * Native implementation of Argon2id
 */
export class NativeArgon2idFacade implements Argon2idFacade {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade) {}

	async generateKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<Aes256Key> {
		const passphraseKeyBytes = await this.nativeCryptoFacade.argon2idGeneratePassphraseKey(passphrase, salt)
		return uint8ArrayToKey(passphraseKeyBytes)
	}
}
