import type { Randomizer, RsaPrivateKey, RsaPublicKey } from "../../../platform-kit/crypto"
import { NativeCryptoFacade } from "../common/generatedipc/types/NativeCryptoFacade.js"
import { RsaImplementation } from "../../../platform-kit/crypto/encryption/RsaImplementation"

export class RsaApp implements RsaImplementation {
	constructor(
		private readonly nativeCryptoFacade: NativeCryptoFacade,
		private readonly rng: Randomizer,
	) {}

	/**
	 * Encrypt bytes with the provided publicKey
	 */
	async encrypt(publicKey: RsaPublicKey, bytes: Uint8Array): Promise<Uint8Array> {
		const seed = this.rng.generateRandomData(32)

		return await this.nativeCryptoFacade.rsaEncrypt(publicKey, bytes, seed)
	}

	/**
	 * Decrypt bytes with the provided privateKey
	 */
	async decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
		return await this.nativeCryptoFacade.rsaDecrypt(privateKey, bytes)
	}
}
