import { ButtonConfiguration, ButtonRef, ConfigFieldConfiguration, PluginHostApi } from "../sdk/PluginHostApi"
import { assertNotNull, isNotNull, Nullable } from "@tutao/utils"
import { PluginManager } from "./PluginManager"
import { PluginDataFile } from "../sdk/PluginDataFile"
import { PluginId } from "../sdk/PluginId"
import { isNull } from "../../platform-kit/utils/Utils"
import { PluginManifest } from "../sdk/PluginManifest"
import { HostApiPermissionDenied } from "../sdk/PluginError"

export type ButtonExtension = {
	config: ButtonConfiguration
	pluginId: PluginId
}

export type ConfigExtension = {
	config: ConfigFieldConfiguration
	pluginId: PluginId
}

export type PluginConfigJson = string

export const enum PluginConfigurationOwner {
	Customer,
	User,
}
export interface ConfigurationAdapter {
	storeUserConfig(pluginId: PluginId, configJson: string): Promise<void>
	storeCustomerConfig(pluginId: PluginId, configJson: string): Promise<void>

	getUserConfig(pluginId: PluginId): Promise<Nullable<string>>
	getCustomerPluginConfigs(): Promise<Map<PluginId, PluginConfigJson>>

	getConfigOwner(configListId: Id): PluginConfigurationOwner
}

export interface MailIntegrationAdapter {
	openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void>
}

export class PluginHost implements PluginHostApi {
	private nextWindowId = 0
	private readonly openedWindows: Map<number, Window> = new Map()
	private manifest: Readonly<PluginManifest> = null!

	constructor(
		private readonly pluginManager: PluginManager,
		private readonly pluginId: PluginId,
	) {}

	setPluginManifest(pluginManifest: Readonly<PluginManifest>) {
		this.manifest = pluginManifest
	}

	async registerConfigFields(configs: ConfigFieldConfiguration[]): Promise<void> {
		for (const config of configs) {
			this.pluginManager.registerConfigField(this.pluginId, config)
		}
	}

	async registerButton(config: ButtonConfiguration): Promise<ButtonRef> {
		this.pluginManager.registerButton(this.pluginId, config)
		return { id: this.pluginId }
	}

	async storeUserConfig(configJson: string): Promise<void> {
		await this.pluginManager.configurationAdapter.storeUserConfig(this.pluginId, configJson)
	}

	async storeCustomerConfig(configJson: string): Promise<void> {
		await this.pluginManager.configurationAdapter.storeCustomerConfig(this.pluginId, configJson)
	}

	async getUserConfig(): Promise<Nullable<string>> {
		return await this.pluginManager.configurationAdapter.getUserConfig(this.pluginId)
	}

	async getCustomerConfig(): Promise<Nullable<string>> {
		return (await this.pluginManager.configurationAdapter.getCustomerPluginConfigs()).get(this.pluginId) ?? null
	}

	async openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void> {
		if (this.pluginManager.mailIntegrationAdapter == null) {
			throw new Error("openMailEditor is not supported in this application")
		}
		await this.pluginManager.mailIntegrationAdapter.openMailEditor(dataFile, subject, recipientAddresses)
	}

	async openWindow(url: string): Promise<Nullable<number>> {
		const targetUrl = new URL(url)
		if (targetUrl.protocol !== "https" && targetUrl.protocol !== "http") {
			throw new HostApiPermissionDenied(`Only https url are supported. Found: ${targetUrl.protocol}`)
		}

		if (this.manifest.permissions.windowOpen.allowedDomains.includes(targetUrl.host)) {
			throw new HostApiPermissionDenied(`Hostname: ${targetUrl.host} is not included in manifest permissions.windowOpen.allowedDomains`)
		}

		const win = window.open(url)
		if (isNull(win)) {
			return null
		}
		const windowId = this.nextWindowId++
		if (isNotNull(win)) {
			this.openedWindows.set(windowId, win)
		}
		return windowId
	}

	async closeWindow(windowId: number): Promise<void> {
		const win = assertNotNull(this.openedWindows.get(windowId), `WindowId ${windowId} does not exist`)
		win.close()
	}

	async isWindowOpen(windowId: number): Promise<boolean> {
		const win = assertNotNull(this.openedWindows.get(windowId), `WindowId ${windowId} does not exist`)
		return win && !win.closed
	}
	async getHost(): Promise<string> {
		if (!this.manifest.permissions.getHost) {
			throw new HostApiPermissionDenied("permissions.getHost is not declared true in manifest file")
		}

		return new URL(window.origin).hostname
	}
}
