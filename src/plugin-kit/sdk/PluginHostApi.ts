export enum ButtonExtensionPoint {
	SaveAttachmentDialog = 0,
	EventLocationButton = 1, // Nextcloud Talk or MS Teams link
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
	storeUserConfig(configJson: string): Promise<void>
	getUserConfig(): Promise<string>
	getCustomerConfig(): Promise<string>
}
