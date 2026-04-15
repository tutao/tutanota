import m from "mithril"
import { assertSystemFolderOfType } from "../../mail/model/MailUtils.js"
import { getElementId } from "@tutao/typerefs"
import { LoginController } from "../../../common/api/main/LoginController.js"
import { MailModel } from "../../mail/model/MailModel.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailSetKind } from "@tutao/app-env"

/**
 * Handles requests for opening mailbox paths from native.
 */
export class OpenMailboxHandler {
	constructor(
		private readonly logins: LoginController,
		private readonly mailModel: MailModel,
		private readonly mailboxModel: MailboxModel,
	) {}

	async openMailbox(userId: Id, mailAddress: string, requestedPath: string | null): Promise<void> {
		if (this.logins.isUserLoggedIn() && this.logins.getUserController().user._id === userId) {
			if (!requestedPath) {
				const [mailboxDetail] = await this.mailboxModel.getMailboxDetails()
				const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
				const inbox = assertSystemFolderOfType(folders, MailSetKind.INBOX)
				m.route.set("/mail/" + getElementId(inbox))
			} else {
				m.route.set("/mail" + requestedPath)
			}
		} else {
			if (!requestedPath) {
				m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}`)
			} else {
				const fullRequestedPath = `/mail${requestedPath}`
				m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}&requestedPath=${encodeURIComponent(fullRequestedPath)}`)
			}
		}
	}
}
