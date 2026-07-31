import type { NativeInterface } from "../common/NativeInterface.js"
import { NativeCryptoFacadeSendDispatcher } from "../common/generatedipc/dispatchers/NativeCryptoFacadeSendDispatcher.js"
import type { RsaPrivateKey, RsaPublicKey } from "../../../platform-kit/crypto"
import { random, rsaDecrypt, rsaEncrypt, RsaImplementation } from "../../../platform-kit/crypto"
import { EnvProvider } from "../../../platform-kit/app-env"

export async function createRsaImplementation(native: NativeInterface): Promise<RsaImplementation> {
	if (EnvProvider.get().isApp()) {
		const { RsaApp } = await import("./RsaApp.js")
		return new RsaApp(new NativeCryptoFacadeSendDispatcher(native), random)
	} else {
		return new RsaWeb()
	}
}

export class RsaWeb implements RsaImplementation {
	async encrypt(publicKey: RsaPublicKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		const seed = random.generateRandomData(32)
		return rsaEncrypt(publicKey, bytes, seed)
	}

	async decrypt(privateKey: RsaPrivateKey, bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
		return rsaDecrypt(privateKey, bytes)
	}
}
