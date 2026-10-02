import type { NativeInterface } from "../common/NativeInterface.js"
import { NativeCryptoFacadeSendDispatcher } from "../common/generatedipc/dispatchers/NativeCryptoFacadeSendDispatcher.js"
import { Randomizer, rsaDecrypt, rsaEncrypt, RsaImplementation, RsaPrivateKey, RsaPublicKey } from "../../../platform-kit/crypto"
import { isApp } from "../../../platform-kit/app-env"

export async function createRsaImplementation(native: NativeInterface, random: Randomizer): Promise<RsaImplementation> {
	if (isApp()) {
		const { RsaApp } = await import("./RsaApp.js")
		return new RsaApp(new NativeCryptoFacadeSendDispatcher(native), random)
	} else {
		return new RsaWeb(random)
	}
}

export class RsaWeb implements RsaImplementation {
	constructor(private readonly random: Randomizer) {}

	async encrypt(publicKey: RsaPublicKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		const seed = this.random.generateRandomData(32)
		return rsaEncrypt(publicKey, bytes, seed)
	}

	async decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		return rsaDecrypt(privateKey, bytes)
	}
}
