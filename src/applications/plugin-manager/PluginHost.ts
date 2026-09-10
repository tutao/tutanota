import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../../plugin-kit/sdk/PluginHostApi"

export class PluginHost implements PluginHostApi {
	registerButton(config: ButtonConfiguration): ButtonRef {
		switch (config.extensionPoint) {
			case ButtonExtensionPoint.SaveAttachmentDialog: {
				break
			}
			default:
				throw new Error(`unsupported button extension point ${config.extensionPoint}`)
		}
		return null!
	}
}
