import m from "mithril"
import { locator } from "../../api/main/CommonLocator"
import { MailFolderType } from "../../api/common/TutanotaConstants.js"

import { assertSystemFolderOfType } from "../../mailFunctionality/SharedMailUtils.js"

export async function openMailbox(userId: Id, mailAddress: string, requestedPath: string | null) {
	if (locator.logins.isUserLoggedIn() && locator.logins.getUserController().user._id === userId) {
		if (!requestedPath) {
			const [mailboxDetail] = await locator.mailModel.getMailboxDetails()
			const inbox = assertSystemFolderOfType(mailboxDetail.folders, MailFolderType.INBOX)
			m.route.set("/mail/" + inbox.mails)
		} else {
			m.route.set("/mail" + requestedPath, { focusItem: true })
		}
	} else {
		if (!requestedPath) {
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}`)
		} else {
			const fullRequestedPath = `/mail${requestedPath}?focusItem=true`
			m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}&requestedPath=${encodeURIComponent(fullRequestedPath)}`)
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
