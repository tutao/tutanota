/* generated file, don't edit. */


import {ThemeFacade} from "./ThemeFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ThemeFacadeSendDispatcher implements ThemeFacade {
	constructor(private readonly transport: NativeInterface) {}
	async getThemes(...args: Parameters<ThemeFacade["getThemes"]>) {
		return this.transport.invokeNative("ipc",  ["ThemeFacade", "getThemes", ...args])
	}
	async setThemes(...args: Parameters<ThemeFacade["setThemes"]>) {
		return this.transport.invokeNative("ipc",  ["ThemeFacade", "setThemes", ...args])
	}
	async getSelectedTheme(...args: Parameters<ThemeFacade["getSelectedTheme"]>) {
		return this.transport.invokeNative("ipc",  ["ThemeFacade", "getSelectedTheme", ...args])
	}
	async setSelectedTheme(...args: Parameters<ThemeFacade["setSelectedTheme"]>) {
		return this.transport.invokeNative("ipc",  ["ThemeFacade", "setSelectedTheme", ...args])
	}
}
