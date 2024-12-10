/* generated file, don't edit. */

import { SettingsFacade } from "./SettingsFacade.js"

interface NativeInterface {
	invokeNative(requestType: string, args: unknown[]): Promise<any>
}
export class SettingsFacadeSendDispatcher implements SettingsFacade {
	constructor(private readonly transport: NativeInterface) {}
	async getStringConfigValue(...args: Parameters<SettingsFacade["getStringConfigValue"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "getStringConfigValue", ...args])
	}
	async setStringConfigValue(...args: Parameters<SettingsFacade["setStringConfigValue"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "setStringConfigValue", ...args])
	}
	async getBooleanConfigValue(...args: Parameters<SettingsFacade["getBooleanConfigValue"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "getBooleanConfigValue", ...args])
	}
	async setBooleanConfigValue(...args: Parameters<SettingsFacade["setBooleanConfigValue"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "setBooleanConfigValue", ...args])
	}
	async getUpdateInfo(...args: Parameters<SettingsFacade["getUpdateInfo"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "getUpdateInfo", ...args])
	}
	async registerMailto(...args: Parameters<SettingsFacade["registerMailto"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "registerMailto", ...args])
	}
	async unregisterMailto(...args: Parameters<SettingsFacade["unregisterMailto"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "unregisterMailto", ...args])
	}
	async integrateDesktop(...args: Parameters<SettingsFacade["integrateDesktop"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "integrateDesktop", ...args])
	}
	async unIntegrateDesktop(...args: Parameters<SettingsFacade["unIntegrateDesktop"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "unIntegrateDesktop", ...args])
	}
	async getSpellcheckLanguages(...args: Parameters<SettingsFacade["getSpellcheckLanguages"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "getSpellcheckLanguages", ...args])
	}
	async getIntegrationInfo(...args: Parameters<SettingsFacade["getIntegrationInfo"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "getIntegrationInfo", ...args])
	}
	async enableAutoLaunch(...args: Parameters<SettingsFacade["enableAutoLaunch"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "enableAutoLaunch", ...args])
	}
	async disableAutoLaunch(...args: Parameters<SettingsFacade["disableAutoLaunch"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "disableAutoLaunch", ...args])
	}
	async manualUpdate(...args: Parameters<SettingsFacade["manualUpdate"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "manualUpdate", ...args])
	}
	async changeLanguage(...args: Parameters<SettingsFacade["changeLanguage"]>) {
		return this.transport.invokeNative("ipc", ["SettingsFacade", "changeLanguage", ...args])
	}
}
