import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../../plugin-kit/sdk/PluginHostApi"
import { assertNotNull, Nullable } from "@tutao/utils"

export type PluginButtonConfiguration = {
	config: ButtonConfiguration
	pluginName: string
}

export class PluginHost implements PluginHostApi {
	public readonly buttonRegistry: Array<PluginButtonConfiguration> = []
	public loadingPluginName: Nullable<string> = null
	constructor() {}
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
}
