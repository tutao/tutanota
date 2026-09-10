import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../../sdk/PluginHostApi"

export class Plugin extends PluginApi {
	public readonly mainButton: ButtonConfiguration

	constructor(pluginHost: PluginHostApi) {
		super(pluginHost)
		this.mainButton = {
			clickCallback: this.buttonClicked,
			extensionPoint: ButtonExtensionPoint.SaveAttachmentDialog,
			text: { de: "Nextcloud attachment anhaengen" },
			pluginId: "nextcloud",
		}
	}
	getMetadata(): PluginMetadata {
		return {
			name: "Nextcloud Plugin",
			description: "Save attachments to your Nextcloud server",
			version: "1",
		}
	}

	load(): Promise<void> {
		this.pluginHost.registerButton(this.mainButton)
		return Promise.resolve()
	}

	unload(): Promise<void> {
		return Promise.resolve()
	}

	buttonClicked(button: ButtonRef) {
		console.log("Nextcloud button clicked!")
	}
}
