import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../sdk/PluginHostApi"
import { assertNotNull, Nullable } from "@tutao/utils"
import { PluginManager } from "./PluginManager"

export type PluginButtonConfiguration = {
	config: ButtonConfiguration
	pluginName: string
}

export type PluginConfigJson = string

export interface ConfigurationAdapter {
	storeUserConfig(pluginId: string, configJson: string): Promise<void>
	getUserConfig(pluginId: string): Promise<string>
	getCustomerPluginConfigs(): Promise<Map<string, PluginConfigJson>>
}

export class PluginHost implements PluginHostApi {
	public loadingPluginName: Nullable<string> = null
	constructor(
		private readonly pluginManager: PluginManager,
		private readonly pluginId: string,
	) {}

	registerButton(config: ButtonConfiguration): ButtonRef {
		switch (config.extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog: {
				this.pluginManager.buttonRegistry.push({ config, pluginName: assertNotNull(this.loadingPluginName) })
				break
			}
			default:
				throw new Error(`unsupported button extension point ${config.extensionPoint}`)
		}
		return null!
	}

	async storeUserConfig(configJson: string): Promise<void> {
		await this.pluginManager.configurationAdapter.storeUserConfig(this.pluginId, configJson)
	}
	async getUserConfig(): Promise<string> {
		return await this.pluginManager.configurationAdapter.getUserConfig(this.pluginId)
	}

	async getCustomerConfig(): Promise<string> {
		return await this.pluginManager.configurationAdapter.getUserConfig(this.pluginId)
	}
}
