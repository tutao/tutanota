import { ButtonConfiguration, ButtonRef, ConfigFieldConfiguration, ExtensionPoint, PluginHostApi } from "../sdk/PluginHostApi"
import { Nullable } from "@tutao/utils"
import { PluginManager } from "./PluginManager"
import { PluginDataFile } from "../sdk/PluginDataFile"

export type ButtonExtension = {
	config: ButtonConfiguration
	pluginName: string
}

export type ConfigExtension = {
	config: ConfigFieldConfiguration
	pluginName: string
}

export type PluginConfigJson = string

export interface ConfigurationAdapter {
	storeUserConfig(pluginId: string, configJson: string): Promise<void>
	getUserConfig(pluginId: string): Promise<Nullable<string>>
	getCustomerPluginConfigs(): Promise<Map<string, PluginConfigJson>>
}

export interface MailIntegrationAdapter {
	openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void>
}

export class PluginHost implements PluginHostApi {
	constructor(
		private readonly pluginManager: PluginManager,
		private readonly pluginId: string,
	) {}

	async registerConfigField(config: ConfigFieldConfiguration): Promise<void> {
		switch (config.extensionPoint) {
			case ExtensionPoint.ConfigField: {
				this.pluginManager.configFieldRegistry.push({ config, pluginName: this.pluginId })
				return
			}
		}
		throw new Error(`unsupported config field extension point ${config.extensionPoint}`)
	}

	async registerButton(config: ButtonConfiguration): Promise<ButtonRef> {
		switch (config.extensionPoint) {
			case ExtensionPoint.SaveAttachmentDialog:
			case ExtensionPoint.EventLocationButton: {
				this.pluginManager.buttonRegistry.push({ config, pluginName: this.pluginId })
				return { id: this.pluginId }
			}
		}
		throw new Error(`unsupported button extension point ${config.extensionPoint}`)
	}

	async storeUserConfig(configJson: string): Promise<void> {
		await this.pluginManager.configurationAdapter.storeUserConfig(this.pluginId, configJson)
	}
	async getUserConfig(): Promise<Nullable<string>> {
		return await this.pluginManager.configurationAdapter.getUserConfig(this.pluginId)
	}

	async getCustomerConfig(): Promise<Nullable<string>> {
		return await this.pluginManager.configurationAdapter.getUserConfig(this.pluginId)
	}

	async openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void> {
		if (this.pluginManager.mailIntegrationAdapter == null) {
			throw new Error("openMailEditor is not supported in this application")
		}
		await this.pluginManager.mailIntegrationAdapter.openMailEditor(dataFile, subject, recipientAddresses)
	}

	async openWindow(url: string): Promise<void> {
		window.open(url)
	}
}
