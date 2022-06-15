/* generated file, don't edit. */


import {NativeCredentialsFacade} from "./NativeCredentialsFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeCredentialsFacadeSendDispatcher implements NativeCredentialsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async encryptUsingKeychain(...args: Parameters<NativeCredentialsFacade["encryptUsingKeychain"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCredentialsFacade", "encryptUsingKeychain", ...args])
	}
	async decryptUsingKeychain(...args: Parameters<NativeCredentialsFacade["decryptUsingKeychain"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCredentialsFacade", "decryptUsingKeychain", ...args])
	}
	async getSupportedEncryptionModes(...args: Parameters<NativeCredentialsFacade["getSupportedEncryptionModes"]>) {
		return this.transport.invokeNative("ipc",  ["NativeCredentialsFacade", "getSupportedEncryptionModes", ...args])
	}
}
