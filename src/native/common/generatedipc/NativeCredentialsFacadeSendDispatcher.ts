/* generated file, don't edit. */

import { NativeCredentialsFacade } from "./NativeCredentialsFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeCredentialsFacadeSendDispatcher implements NativeCredentialsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async encryptUsingKeychain(...args: Parameters<NativeCredentialsFacade["encryptUsingKeychain"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "encryptUsingKeychain", ...args])
	}
	async decryptUsingKeychain(...args: Parameters<NativeCredentialsFacade["decryptUsingKeychain"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "decryptUsingKeychain", ...args])
	}
	async getSupportedEncryptionModes(...args: Parameters<NativeCredentialsFacade["getSupportedEncryptionModes"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "getSupportedEncryptionModes", ...args])
	}
	async loadAll(...args: Parameters<NativeCredentialsFacade["loadAll"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "loadAll", ...args])
	}
	async store(...args: Parameters<NativeCredentialsFacade["store"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "store", ...args])
	}
	async loadByUserId(...args: Parameters<NativeCredentialsFacade["loadByUserId"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "loadByUserId", ...args])
	}
	async deleteByUserId(...args: Parameters<NativeCredentialsFacade["deleteByUserId"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "deleteByUserId", ...args])
	}
	async getCredentialEncryptionMode(...args: Parameters<NativeCredentialsFacade["getCredentialEncryptionMode"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "getCredentialEncryptionMode", ...args])
	}
	async setCredentialEncryptionMode(...args: Parameters<NativeCredentialsFacade["setCredentialEncryptionMode"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "setCredentialEncryptionMode", ...args])
	}
	async getCredentialsEncryptionKey(...args: Parameters<NativeCredentialsFacade["getCredentialsEncryptionKey"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "getCredentialsEncryptionKey", ...args])
	}
	async setCredentialsEncryptionKey(...args: Parameters<NativeCredentialsFacade["setCredentialsEncryptionKey"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "setCredentialsEncryptionKey", ...args])
	}
}
