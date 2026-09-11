import { PluginApi, PluginMetadata } from "../../sdk/PluginApi"
import { ButtonConfiguration, ButtonExtensionPoint, ButtonRef, PluginHostApi } from "../../sdk/PluginHostApi"
import { AttachmentButtonExtension, PluginDataFile } from "../../sdk/AttachmentButtonExtensionPoint"

export class Plugin extends PluginApi implements AttachmentButtonExtension {
	public readonly attachmentButton: ButtonConfiguration

	constructor(pluginHost: PluginHostApi) {
		super(pluginHost)
	}
	getMetadata(): PluginMetadata {
		return {
			name: "Nextcloud Plugin",
			description: "Save attachments to your Nextcloud server",
			version: "1",
		}
	}

	async load(): Promise<void> {
		let saveAttachmentBtnConfig: ButtonConfiguration = {
			extensionPoint: ButtonExtensionPoint.SaveAttachmentDialog,
			text: { de: "Nextcloud attachment anhaengen" },
		}
		this.pluginHost.registerButton(saveAttachmentBtnConfig)
	}

	async unload(): Promise<void> {}

	attachmentButtonClicked(dataFile: PluginDataFile): void {
		console.log("data file " + dataFile.name)
	}
}
