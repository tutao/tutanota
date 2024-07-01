/* generated file, don't edit. */

import { ThemeFacade } from "./ThemeFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class ThemeFacadeSendDispatcher implements ThemeFacade {
	constructor(private readonly transport: NativeInterface) {}
	async getThemes(...args: Parameters<ThemeFacade["getThemes"]>) {
		return this.transport.invokeNative("ipc", ["ThemeFacade", "getThemes", ...args])
	}
	async setThemes(...args: Parameters<ThemeFacade["setThemes"]>) {
		return this.transport.invokeNative("ipc", ["ThemeFacade", "setThemes", ...args])
	}
	async getThemePreference(...args: Parameters<ThemeFacade["getThemePreference"]>) {
		return this.transport.invokeNative("ipc", ["ThemeFacade", "getThemePreference", ...args])
	}
	async setThemePreference(...args: Parameters<ThemeFacade["setThemePreference"]>) {
		return this.transport.invokeNative("ipc", ["ThemeFacade", "setThemePreference", ...args])
	}
	async prefersDark(...args: Parameters<ThemeFacade["prefersDark"]>) {
		return this.transport.invokeNative("ipc", ["ThemeFacade", "prefersDark", ...args])
	}
}
