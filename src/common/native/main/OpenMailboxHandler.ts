import m from "mithril"
import { locator } from "../../api/main/CommonLocator"
import { MailSetKind } from "../../api/common/TutanotaConstants.js"
import { assertSystemFolderOfType } from "../../../mail-app/mail/model/MailModel.js"
import { mailLocator } from "../../../mail-app/mailLocator.js"
import { assertNotNull } from "@tutao/tutanota-utils"
import { getElementId } from "../../api/common/utils/EntityUtils.js"

export async function openMailbox(userId: Id, mailAddress: string, requestedPath: string | null) {
	if (locator.logins.isUserLoggedIn() && locator.logins.getUserController().user._id === userId) {
		if (!requestedPath) {
			const [mailboxDetail] = await locator.mailboxModel.getMailboxDetails()
			const folders = mailLocator.mailModel.getMailboxFoldersForId(assertNotNull(mailboxDetail.mailbox.folders)._id)
			const inbox = assertSystemFolderOfType(folders, MailSetKind.INBOX)
			m.route.set("/mail/" + getElementId(inbox))
		} else {
			m.route.set("/mail" + requestedPath)
		}
	} else {
		if (!requestedPath) {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}`)
		} else {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}&requestedPath=${encodeURIComponent(requestedPath)}`)
		}
	}
}

export function openCalendar(userId: Id) {
	if (locator.logins.isUserLoggedIn() && locator.logins.getUserController().user._id === userId) {
		m.route.set("/calendar/agenda")
	} else {
		m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent("/calendar/agenda")}`)
	}
}
