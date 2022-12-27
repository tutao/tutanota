import m from "mithril"
import { logins } from "../../api/main/LoginController"
import { locator } from "../../api/main/MainLocator"
import { MailFolderType } from "../../api/common/TutanotaConstants.js"

export function openMailbox(userId: Id, mailAddress: string, requestedPath: string | null): void {
	if (logins.isUserLoggedIn() && logins.getUserController().user._id === userId) {
		if (!requestedPath) {
			locator.mailModel
				.getMailboxDetails()
				.then((mailboxDetails) => m.route.set("/mail/" + mailboxDetails[0].folders.getSystemFolderByType(MailFolderType.INBOX).mails))
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
	if (logins.isUserLoggedIn() && logins.getUserController().user._id === userId) {
		m.route.set("/calendar/agenda")
	} else {
		m.route.set(`/login?noAutoLogin=false&userId=${userId}&requestedPath=${encodeURIComponent("/calendar/agenda")}`)
	}
}
