import { Aes256Key, Argon2IDExports, generateKeyFromPassphraseArgon2id } from "@tutao/crypto"
import { LazyLoaded } from "../../utils"
import { loadWasmFromFileOrNetwork } from "../../utils/WebAssembly"

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
		return await loadWasmFromFileOrNetwork<Argon2IDExports>("argon2.wasm", import.meta.url)
	})

	async generateKeyFromPassphrase(passphrase: string, salt: Uint8Array): Promise<Aes256Key> {
		return generateKeyFromPassphraseArgon2id(await this.argon2.getAsync(), passphrase, salt)
	}
}
