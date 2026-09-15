import { ButtonConfiguration, ExtensionPoint, ButtonRef, PluginHostApi, ConfigFieldConfiguration } from "../sdk/PluginHostApi"
import { assertNotNull, Nullable } from "@tutao/utils"
import { PluginManager } from "./PluginManager"

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

export class PluginHost implements PluginHostApi {
	constructor(
		private readonly pluginManager: PluginManager,
		private readonly pluginId: string,
	) {}

	registerConfigField(config: ConfigFieldConfiguration): void {
		switch (config.extensionPoint) {
			case ExtensionPoint.ConfigField: {
				this.pluginManager.configFieldRegistry.push({ config, pluginName: this.pluginId })
				return
			}
		}
		throw new Error(`unsupported config field extension point ${config.extensionPoint}`)
	}

	registerButton(config: ButtonConfiguration): ButtonRef {
		switch (config.extensionPoint) {
			case ExtensionPoint.SaveAttachmentDialog: {
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
}
