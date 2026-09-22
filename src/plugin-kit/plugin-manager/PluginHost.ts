import { ButtonConfiguration, ButtonRef, ConfigFieldConfiguration, PluginHostApi } from "../sdk/PluginHostApi"
import { Nullable } from "@tutao/utils"
import { PluginManager } from "./PluginManager"
import { PluginDataFile } from "../sdk/PluginDataFile"
import { PluginId } from "../sdk/PluginId"

export type ButtonExtension = {
	config: ButtonConfiguration
	pluginId: PluginId
}

export type ConfigExtension = {
	config: ConfigFieldConfiguration
	pluginId: string
}

export type PluginConfigJson = string

export interface ConfigurationAdapter {
	storeUserConfig(pluginId: string, configJson: string): Promise<void>
	storeCustomerConfig(pluginId: string, configJson: string): Promise<void>

	getUserConfig(pluginId: string): Promise<Nullable<string>>
	getCustomerPluginConfigs(): Promise<Map<PluginId, PluginConfigJson>>
}

export interface MailIntegrationAdapter {
	openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void>
}

export class PluginHost implements PluginHostApi {
	constructor(
		private readonly pluginManager: PluginManager,
		private readonly pluginId: PluginId,
	) {}

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

	async openWindow(url: string): Promise<void> {
		window.open(url)
	}

	async openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void> {
		if (this.pluginManager.mailIntegrationAdapter == null) {
			throw new Error("openMailEditor is not supported in this application")
		}
		await this.pluginManager.mailIntegrationAdapter.openMailEditor(dataFile, subject, recipientAddresses)
	}
}
