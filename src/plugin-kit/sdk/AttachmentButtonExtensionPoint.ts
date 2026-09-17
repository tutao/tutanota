import { ButtonConfiguration, ButtonRef } from "./PluginHostApi"
import type { PluginDataFile } from "./PluginDataFile"

export type { PluginDataFile } from "./PluginDataFile"

export interface AttachmentButtonExtension {
	attachmentButtonClicked(dataFile: PluginDataFile): void
}
