import { lazyAsync } from "@tutao/utils"

export enum ButtonExtensionPoint {
	SaveAttachmentDialog = 0,
}

export type ButtonConfiguration = {
	pluginId: string
	extensionPoint: ButtonExtensionPoint
	text: {
		de: "Nextcloud attachment anhaengen"
	}
	clickCallback: lazyAsync<void>
}
export type ButtonRef = {
	id: string
}
export interface PluginHostApi {
	buttonRegistry: Array<ButtonConfiguration>
	registerButton(config: ButtonConfiguration): ButtonRef
}
