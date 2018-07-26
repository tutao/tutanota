//@flow
import m from "mithril"
import {getInboxFolder} from "../mail/MailUtils"
import {mailModel} from "../mail/MailModel"
import {logins} from "../api/main/LoginController"


export function openMailbox(userId: Id, mailAddress: string): void {
	if (logins.isUserLoggedIn() && logins.getUserController().user._id === userId) {
		m.route.set("/mail/" + getInboxFolder(mailModel.mailboxDetails()[0].folders).mails)
	} else {
		m.route.set(`/login?noAutoLogin=false&userId=${userId}&loginWith=${mailAddress}`)
	}
}