//@flow


import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"
import {getDefaultSender, getSenderName} from "../mail/MailUtils"
import {getCalendarName} from "./CalendarUtils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"

export function sendAcceptNotificationEmail(name: string, recipient: RecipientInfo) {
	_sendNotificationEmail(name, recipient, "acceptCalendarEmailSubject", "acceptCalendarEmailBody")
}

export function sendRejectNotificationEmail(name: string, recipient: RecipientInfo) {
	_sendNotificationEmail(name, recipient, "rejectCalendarEmailSubject", "rejectCalendarEmailBody")
}

function _sendNotificationEmail(name: string, recipient: RecipientInfo, subject: TranslationKey, body: TranslationKey) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const replacements = {
		// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
		"{user}": `${getSenderName(mailModel.getUserMailboxDetails())} &lt;${getDefaultSender(mailModel.getUserMailboxDetails())}&gt;`,
		"{calendarName}": getCalendarName(name)
	}
	const subjectString = lang.get(subject)
	const bodyString = lang.get(body, replacements)
	// Sending notifications as bcc so that invited people don't see each other
	const to = [{name: recipient.name, address: recipient.mailAddress}]
	editor.initWithTemplate({to}, subjectString, bodyString, true)
	editor.send(false)
}