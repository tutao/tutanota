import { MailIntegrationAdapter } from "../../../plugin-kit/plugin-manager/hostApi/PluginHost"
import { PluginDataFile } from "../../../plugin-kit/sdk/PluginDataFile"
import { MailboxModel } from "../../common/mailFunctionality/MailboxModel.js"
import { DataFile } from "../../../entities/tutanota/MailBundle"
import { VerificationRecipients } from "../../../entities/tutanota/Utils"

export class MailPluginIntegrationAdapter implements MailIntegrationAdapter {
	constructor(private readonly mailboxModel: MailboxModel) {}

	async openMailEditor(dataFile: PluginDataFile, subject?: string, recipientAddresses?: string[]): Promise<void> {
		const { newMailEditorFromTemplate } = await import("../mail/editor/MailEditor.js")
		const mailboxDetails = await this.mailboxModel.getUserMailboxDetails()
		const attachment: DataFile = {
			_type: "DataFile",
			name: dataFile.name,
			mimeType: dataFile.mimeType,
			data: dataFile.data,
			size: dataFile.size,
		}
		const recipients: VerificationRecipients = recipientAddresses?.length ? { to: recipientAddresses.map((address) => ({ address })) } : {}
		const editor = await newMailEditorFromTemplate(mailboxDetails, recipients, subject ?? "", "", [attachment])
		editor?.show()
	}
}
