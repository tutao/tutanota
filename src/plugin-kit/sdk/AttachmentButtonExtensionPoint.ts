import { ButtonConfiguration, ButtonRef } from "./PluginHostApi"

export type PluginDataFile = {
	name: string
	mimeType: string
	data: Uint8Array
	size: number
}

export interface AttachmentButtonExtension {
	attachmentButton: ButtonConfiguration
	attachmentButtonClicked(dataFile: PluginDataFile): void
}
