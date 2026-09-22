import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../sdk/PluginHostApi"
import { assertNotNull, Nullable } from "@tutao/utils"

export type PluginButtonConfiguration = {
	config: ButtonConfiguration
	pluginName: string
}

export interface ConfigurationAdapter {
	storeConfig(pluginId: string, configJson: string): Promise<void>
	getConfig(pluginId: string): Promise<string>
}

export class PluginHost implements PluginHostApi {
	public readonly buttonRegistry: Array<PluginButtonConfiguration> = []
	public loadingPluginName: Nullable<string> = null
	constructor(private readonly configurationAdapter: ConfigurationAdapter) {}

	registerButton(config: ButtonConfiguration): ButtonRef {
		switch (config.extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog: {
				this.buttonRegistry.push({ config, pluginName: assertNotNull(this.loadingPluginName) })
				break
			}
			default:
				throw new Error(`unsupported button extension point ${config.extensionPoint}`)
		}
		return null!
	}

	async storeConfig(configJson: string): Promise<void> {
		const pluginId = "nextcloud" // FIXME
		await this.configurationAdapter.storeConfig(pluginId, configJson)
	}
	async getConfig(): Promise<string> {
		const pluginId = "nextcloud" // FIXME
		return await this.configurationAdapter.getConfig(pluginId)
	}
}
