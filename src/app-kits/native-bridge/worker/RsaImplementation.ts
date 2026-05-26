import type { NativeInterface } from "../common/NativeInterface.js"
import { NativeCryptoFacadeSendDispatcher } from "../common/generatedipc/dispatchers/NativeCryptoFacadeSendDispatcher.js"
import type { RsaPrivateKey, RsaPublicKey } from "../../../platform-kits/crypto"
import { random, rsaDecrypt, rsaEncrypt } from "../../../platform-kits/crypto"
import { isApp } from "../../../platform-kits/app-env"

export async function createRsaImplementation(native: NativeInterface): Promise<RsaImplementation> {
	if (isApp()) {
		const { RsaApp } = await import("./RsaApp.js")
		return new RsaApp(new NativeCryptoFacadeSendDispatcher(native), random)
	} else {
		return new RsaWeb()
	}
}

export interface RsaImplementation {
	encrypt(publicKey: RsaPublicKey, bytes: Uint8Array): Promise<Uint8Array>

	decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array): Promise<Uint8Array>
}

export class RsaWeb implements RsaImplementation {
	async encrypt(publicKey: RsaPublicKey, bytes: Uint8Array): Promise<Uint8Array> {
		const seed = random.generateRandomData(32)
		return rsaEncrypt(publicKey, bytes, seed)
	}

	async decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array): Promise<Uint8Array> {
		return rsaDecrypt(privateKey, bytes)
	}
}
