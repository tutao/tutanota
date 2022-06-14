/* generated file, don't edit. */


import {NativeCryptoFacade} from "./NativeCryptoFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeCryptoFacadeSendDispatcher implements NativeCryptoFacade {
	constructor(private readonly transport: NativeInterface) {}
	async rsaEncrypt(...args: Parameters<NativeCryptoFacade["rsaEncrypt"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCryptoFacade", "rsaEncrypt", ...args])
	}
	async rsaDecrypt(...args: Parameters<NativeCryptoFacade["rsaDecrypt"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCryptoFacade", "rsaDecrypt", ...args])
	}
	async aesEncryptFile(...args: Parameters<NativeCryptoFacade["aesEncryptFile"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCryptoFacade", "aesEncryptFile", ...args])
	}
	async aesDecryptFile(...args: Parameters<NativeCryptoFacade["aesDecryptFile"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCryptoFacade", "aesDecryptFile", ...args])
	}
	async generateRsaKey(...args: Parameters<NativeCryptoFacade["generateRsaKey"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCryptoFacade", "generateRsaKey", ...args])
	}
}
