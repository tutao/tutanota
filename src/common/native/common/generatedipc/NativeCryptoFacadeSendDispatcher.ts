/* generated file, don't edit. */

import { NativeCryptoFacade } from "./NativeCryptoFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeCryptoFacadeSendDispatcher implements NativeCryptoFacade {
	constructor(private readonly transport: NativeInterface) {}
	async rsaEncrypt(...args: Parameters<NativeCryptoFacade["rsaEncrypt"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "rsaEncrypt", ...args])
	}
	async rsaDecrypt(...args: Parameters<NativeCryptoFacade["rsaDecrypt"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "rsaDecrypt", ...args])
	}
	async aesEncryptFile(...args: Parameters<NativeCryptoFacade["aesEncryptFile"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "aesEncryptFile", ...args])
	}
	async aesDecryptFile(...args: Parameters<NativeCryptoFacade["aesDecryptFile"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "aesDecryptFile", ...args])
	}
	async argon2idGeneratePassphraseKey(...args: Parameters<NativeCryptoFacade["argon2idGeneratePassphraseKey"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "argon2idGeneratePassphraseKey", ...args])
	}
	async generateKyberKeypair(...args: Parameters<NativeCryptoFacade["generateKyberKeypair"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "generateKyberKeypair", ...args])
	}
	async kyberEncapsulate(...args: Parameters<NativeCryptoFacade["kyberEncapsulate"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "kyberEncapsulate", ...args])
	}
	async kyberDecapsulate(...args: Parameters<NativeCryptoFacade["kyberDecapsulate"]>) {
		return this.transport.invokeNative("ipc", ["NativeCryptoFacade", "kyberDecapsulate", ...args])
	}
}
