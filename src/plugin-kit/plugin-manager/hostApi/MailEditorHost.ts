import { MailEditorHostApi } from "../../sdk/hostApi/MailEditorHostApi"
import { PluginDataFile } from "../../sdk/PluginDataFile"
import { MailIntegrationAdapter } from "./PluginHost"

export class MailEditorHost implements MailEditorHostApi {
	public constructor(private readonly mailIntegrationAdapter: MailIntegrationAdapter) {}

	async openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void> {
		return this.mailIntegrationAdapter.openMailEditor(dataFile, subject, recipientAddresses)
	}
}
