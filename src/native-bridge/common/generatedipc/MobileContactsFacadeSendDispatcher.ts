/* generated file, don't edit. */

import { MobileContactsFacade } from "./MobileContactsFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class MobileContactsFacadeSendDispatcher implements MobileContactsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async findSuggestions(...args: Parameters<MobileContactsFacade["findSuggestions"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "findSuggestions", ...args])
	}
	async saveContacts(...args: Parameters<MobileContactsFacade["saveContacts"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "saveContacts", ...args])
	}
	async syncContacts(...args: Parameters<MobileContactsFacade["syncContacts"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "syncContacts", ...args])
	}
	async getContactBooks(...args: Parameters<MobileContactsFacade["getContactBooks"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "getContactBooks", ...args])
	}
	async getContactsInContactBook(...args: Parameters<MobileContactsFacade["getContactsInContactBook"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "getContactsInContactBook", ...args])
	}
	async deleteContacts(...args: Parameters<MobileContactsFacade["deleteContacts"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "deleteContacts", ...args])
	}
	async isLocalStorageAvailable(...args: Parameters<MobileContactsFacade["isLocalStorageAvailable"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "isLocalStorageAvailable", ...args])
	}
	async findLocalMatches(...args: Parameters<MobileContactsFacade["findLocalMatches"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "findLocalMatches", ...args])
	}
	async deleteLocalContacts(...args: Parameters<MobileContactsFacade["deleteLocalContacts"]>) {
		return this.transport.invokeNative("ipc", ["MobileContactsFacade", "deleteLocalContacts", ...args])
	}
}
