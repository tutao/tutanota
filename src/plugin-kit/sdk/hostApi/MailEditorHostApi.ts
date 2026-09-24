import { PluginDataFile } from "../PluginDataFile"

export interface MailEditorHostApi {
	openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void>
}
