import type { RsaPrivateKey, RsaPublicKey, Randomizer, RsaKeyPair } from "@tutao/tutanota-crypto"
import type { RsaImplementation } from "../../api/worker/crypto/RsaImplementation"
import { NativeCryptoFacade } from "../common/generatedipc/NativeCryptoFacade"

export class RsaApp implements RsaImplementation {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade, private readonly rng: Randomizer) {}

	generateKey(): Promise<RsaKeyPair> {
		const seed = this.rng.generateRandomData(512)

		return this.nativeCryptoFacade.generateRsaKey(seed)
	}

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
