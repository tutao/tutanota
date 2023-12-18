import type { Randomizer, RsaKeyPair, RsaPrivateKey, RsaPublicKey } from "@tutao/tutanota-crypto"
import { KeyPairType } from "@tutao/tutanota-crypto"
import type { RsaImplementation } from "../../api/worker/crypto/RsaImplementation"
import { NativeCryptoFacade } from "../common/generatedipc/NativeCryptoFacade"

export class RsaApp implements RsaImplementation {
	constructor(private readonly nativeCryptoFacade: NativeCryptoFacade, private readonly rng: Randomizer) {}

	async generateKey(): Promise<RsaKeyPair> {
		const seed = this.rng.generateRandomData(512)

		const rawKeyPair = await this.nativeCryptoFacade.generateRsaKey(seed)
		const publicKey = Object.assign({ keyPairType: KeyPairType.RSA }, rawKeyPair.publicKey)
		return { keyPairType: KeyPairType.RSA, publicKey, privateKey: rawKeyPair.privateKey }
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
