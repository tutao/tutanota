import { Nullable } from "@tutao/utils"

export enum ExtensionPoint {
	SaveAttachmentDialog = 0,
	EventLocationButton = 1, // Nextcloud Talk or MS Teams link
	ConfigField = 2,
}

export enum PluginLanguageCode {
	de = "de",
	en = "en",
}

export interface ButtonConfiguration {
	extensionPoint: ExtensionPoint
	text: Partial<Record<PluginLanguageCode, string>>
}

export interface ConfigFieldConfiguration {
	extensionPoint: ExtensionPoint.ConfigField
	configFieldId: string
	text: Partial<Record<PluginLanguageCode, string>>
}

export type ButtonRef = {
	id: string
}
export interface PluginHostApi {
	registerButton(config: ButtonConfiguration): ButtonRef
	registerConfigField(config: ConfigFieldConfiguration): void
	storeUserConfig(configJson: string): Promise<void>
	getUserConfig(): Promise<Nullable<string>>
	getCustomerConfig(): Promise<Nullable<string>>
}
