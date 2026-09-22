import { Nullable } from "@tutao/utils"
import { PluginDataFile } from "./PluginDataFile"

export enum ExtensionPoint {
	SaveAttachmentDialog = 0,
	EventLocationButton = 1, // e.g. Nextcloud Talk or MS Teams link generated for the event location field
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
	registerButton(config: ButtonConfiguration): Promise<ButtonRef>
	registerConfigFields(config: ConfigFieldConfiguration[]): Promise<void>
	storeUserConfig(configJson: string): Promise<void>
	storeCustomerConfig(configJson: string): Promise<void>
	getUserConfig(): Promise<Nullable<string>>
	getCustomerConfig(): Promise<Nullable<string>>
	openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void>
	openWindow(url: string): Promise<Nullable<number>>
	closeWindow(windowId: number): Promise<void>
	isWindowOpen(windowId: number): Promise<boolean>
	getHost(): Promise<string>
}
