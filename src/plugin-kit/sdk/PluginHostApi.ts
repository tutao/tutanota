export enum ButtonExtensionPoint {
	SaveAttachmentDialog = 0,
	EventLocationButton = 0, // Nextcloud Talk or MS Teams link
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
	storeConfig(configJson: string): Promise<void>
	getConfig(): Promise<string>
}
