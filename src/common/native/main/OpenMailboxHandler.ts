import m from "mithril"
import { locator } from "../../api/main/CommonLocator"
import { MailSetKind } from "../../api/common/TutanotaConstants.js"

import { assertSystemFolderOfType } from "../../mailFunctionality/SharedMailUtils.js"
import { getElementId } from "../../api/common/utils/EntityUtils.js"

export async function openMailbox(userId: Id, mailAddress: string, requestedPath: string | null) {
	if (locator.logins.isUserLoggedIn() && locator.logins.getUserController().user._id === userId) {
		if (!requestedPath) {
			const [mailboxDetail] = await locator.mailModel.getMailboxDetails()
			const inbox = assertSystemFolderOfType(mailboxDetail.folders, MailSetKind.INBOX)
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

export function openCalendar(userId: Id) {
	if (locator.logins.isUserLoggedIn() && locator.logins.getUserController().user._id === userId) {
		m.route.set("/calendar/agenda")
	} else {
		m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent("/calendar/agenda")}`)
	}
}
