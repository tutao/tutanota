import { Aes256Key, uint8ArrayTo256Key } from "@tutao/crypto"
import { NativeCryptoFacade } from "../../../app-kit/native-bridge/common/generatedipc/types/NativeCryptoFacade"
import { assertWorkerOrNode } from "@tutao/app-env"
import { Argon2idFacade } from "./WasmArgon2idFacade"

assertWorkerOrNode()

/**
 * Native implementation of Argon2id
 */
export class NativeArgon2idFacade implements Argon2idFacade {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade) {}

	async generateKeyFromPassphrase(passphrase: string, salt: Uint8Array<ArrayBuffer>): Promise<Aes256Key> {
		const passphraseKeyBytes = await this.nativeCryptoFacade.argon2idGeneratePassphraseKey(passphrase, salt)
		return uint8ArrayTo256Key(passphraseKeyBytes)
	}
}
