export enum ButtonExtensionPoint {
	SaveAttachmentDialog = 0,
}

export type ButtonConfiguration = {
	name: string
	extensionPoint: ButtonExtensionPoint
	text: {
		de: "Nextcloud attachment anhaengen"
	}
}
export type ButtonRef = {
	id: number
}
export interface PluginHostApi {
	registerButton(config: ButtonConfiguration): ButtonRef
}
