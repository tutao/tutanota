import { Aes256Key, Argon2IDExports, generateKeyFromPassphraseArgon2id, uint8ArrayToBitArray } from "@tutao/tutanota-crypto"
import { LazyLoaded, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { NativeCryptoFacade } from "../../../native/common/generatedipc/NativeCryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"
import { loadWasm } from "argon2.wasm"

assertWorkerOrNode()

/**
 * Abstract interface for generating Argon2id passphrase keys using the preferred implementation (i.e. native or WASM)
 */
export interface Argon2idFacade {
	/**
	 * Generate a key from a passphrase
	 * @param passphrase
	 * @param salt
	 * @return bit array of the resulting key
	 */
	generateKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<Aes256Key>
}

/**
 * WebAssembly implementation of Argon2id
 */
export class WASMArgon2idFacade implements Argon2idFacade {
	// loads argon2 WASM
	private argon2: LazyLoaded<Argon2IDExports> = new LazyLoaded(async () => {
		return await loadWasm()
	})

	async generateKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<Aes256Key> {
		return generateKeyFromPassphraseArgon2id(await this.argon2.getAsync(), passphrase, salt)
	}
}

/**
 * Native implementation of Argon2id
 */
export class NativeArgon2idFacade implements Argon2idFacade {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade) {}

	async generateKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<Aes256Key> {
		const hash = await this.nativeCryptoFacade.argon2idGeneratePassphraseKey(passphrase, salt)
		return uint8ArrayToBitArray(hash)
	}
}
