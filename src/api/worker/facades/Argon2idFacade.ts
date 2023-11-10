import {
	Aes256Key,
	ARGON2ID_ITERATIONS,
	ARGON2ID_KEY_LENGTH,
	ARGON2ID_MEMORY_IN_KiB,
	ARGON2ID_PARALLELISM,
	generateKeyFromPassphraseArgon2id,
	uint8ArrayToBitArray,
} from "@tutao/tutanota-crypto"
import { LazyLoaded, stringToUtf8Uint8Array } from "@tutao/tutanota-utils"
import { NativeCryptoFacade } from "../../../native/common/generatedipc/NativeCryptoFacade.js"
import { assertWorkerOrNode } from "../../common/Env.js"

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
 * WebAssembly implementation of Argon2id for the web app and node
 */
export class WASMArgon2idFacade implements Argon2idFacade {
	/**
	 * @param fetcher to fetch the WASM binary response
	 */
	constructor(private readonly fetcher: () => Promise<Response>) {}

	// loads argon2 WASM
	private argon2: LazyLoaded<WebAssembly.Exports> = new LazyLoaded(async () => {
		const wasm = this.fetcher()
		if (WebAssembly.instantiateStreaming) {
			return (await WebAssembly.instantiateStreaming(wasm)).instance.exports
		} else {
			// Fallback if the client does not support instantiateStreaming
			const buffer = await (await wasm).arrayBuffer()
			return (await WebAssembly.instantiate(buffer)).instance.exports
		}
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
		const hash = await this.nativeCryptoFacade.argon2idHashRaw(
			stringToUtf8Uint8Array(passphrase),
			salt,
			ARGON2ID_ITERATIONS,
			ARGON2ID_MEMORY_IN_KiB,
			ARGON2ID_PARALLELISM,
			ARGON2ID_KEY_LENGTH,
		)
		return uint8ArrayToBitArray(hash)
	}
}
