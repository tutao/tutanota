export enum ButtonExtensionPoint {
	SaveAttachmentDialog = 0,
}

export enum PluginLanguageCode {
	de = "de",
	en = "en",
}

export interface ButtonConfiguration {
	extensionPoint: ButtonExtensionPoint
	text: Partial<Record<PluginLanguageCode, string>>
}

export type ButtonRef = {
	id: string
}
export interface PluginHostApi {
	registerButton(config: ButtonConfiguration): ButtonRef
}
