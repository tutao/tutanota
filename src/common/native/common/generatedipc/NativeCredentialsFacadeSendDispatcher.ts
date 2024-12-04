/* generated file, don't edit. */

import { NativeCredentialsFacade } from "./NativeCredentialsFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class NativeCredentialsFacadeSendDispatcher implements NativeCredentialsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async getSupportedEncryptionModes(...args: Parameters<NativeCredentialsFacade["getSupportedEncryptionModes"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "getSupportedEncryptionModes", ...args])
	}
	async loadAll(...args: Parameters<NativeCredentialsFacade["loadAll"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "loadAll", ...args])
	}
	async store(...args: Parameters<NativeCredentialsFacade["store"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "store", ...args])
	}
	async storeEncrypted(...args: Parameters<NativeCredentialsFacade["storeEncrypted"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "storeEncrypted", ...args])
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
	async clear(...args: Parameters<NativeCredentialsFacade["clear"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "clear", ...args])
	}
	async migrateToNativeCredentials(...args: Parameters<NativeCredentialsFacade["migrateToNativeCredentials"]>) {
		return this.transport.invokeNative("ipc", ["NativeCredentialsFacade", "migrateToNativeCredentials", ...args])
	}
}
