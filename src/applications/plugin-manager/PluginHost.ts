import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../../plugin-kit/sdk/PluginHostApi"

export class PluginHost implements PluginHostApi {
	public readonly buttonRegistry: Array<ButtonConfiguration> = []
	constructor() {}
	registerButton(config: ButtonConfiguration): ButtonRef {
		switch (config.extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog: {
				this.buttonRegistry.push(config)
				break
			}
			default:
				throw new Error(`unsupported button extension point ${config.extensionPoint}`)
		}
		return null!
	}
}
