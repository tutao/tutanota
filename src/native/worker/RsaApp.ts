import {base64ToUint8Array, uint8ArrayToBase64} from "@tutao/tutanota-utils"
import type {PrivateKey, PublicKey, Randomizer, RsaKeyPair} from "@tutao/tutanota-crypto"
import type {RsaImplementation} from "../../api/worker/crypto/RsaImplementation"
import {NativeCryptoFacade} from "../common/generatedipc/NativeCryptoFacade"

export class RsaApp implements RsaImplementation {

	constructor(
		private readonly nativeCryptoFacade: NativeCryptoFacade,
		private readonly rng: Randomizer
	) {
	}

	generateKey(): Promise<RsaKeyPair> {
		const seed = this.rng.generateRandomData(512)

		return this.nativeCryptoFacade.generateRsaKey(uint8ArrayToBase64(seed))
	}

	/**
	 * Encrypt bytes with the provided publicKey
	 */
	async encrypt(publicKey: PublicKey, bytes: Uint8Array): Promise<Uint8Array> {
		const seed = this.rng.generateRandomData(32)

		let encodedBytes = uint8ArrayToBase64(bytes)
		const base64 = await this.nativeCryptoFacade.rsaEncrypt(publicKey, encodedBytes, uint8ArrayToBase64(seed))
		return base64ToUint8Array(base64)
	}

	/**
	 * Decrypt bytes with the provided privateKey
	 */
	async decrypt(privateKey: PrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
		let encodedBytes = uint8ArrayToBase64(bytes)
		const base64 = await this.nativeCryptoFacade.rsaDecrypt(privateKey, encodedBytes)
		return base64ToUint8Array(base64)
	}
}