import { ConfigHostApi } from "./ConfigHostApi"
import { UiHostApi } from "./UiHostApi"
import { MailEditorHostApi } from "./MailEditorHostApi"
import { WindowHostApi } from "./WindowHostApi"
import { Nullable } from "@tutao/utils"

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

export type PluginHostApiCollection = {
	config: ConfigHostApi
	ui: UiHostApi
	// mailEditorHostApi is only available in mail app and not in calendar & drive
	mailEditor: Nullable<MailEditorHostApi>
	window: WindowHostApi
}

type UnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never
export type PluginHostApi = UnionToIntersection<NonNullable<PluginHostApiCollection[keyof PluginHostApiCollection]>>
