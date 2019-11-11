//@flow


import {MailEditor} from "../mail/MailEditor"
import {mailModel} from "../mail/MailModel"
import {getDefaultSender, getEnabledMailAddresses, getSenderName} from "../mail/MailUtils"
import {getCalendarName} from "./CalendarUtils"
import type {TranslationKey} from "../misc/LanguageViewModel"
import {lang} from "../misc/LanguageViewModel"

export function sendAcceptNotificationEmail(sharedGroupName: string, recipient: RecipientInfo, senderMailAddress: string) {
	_sendNotificationEmail(sharedGroupName, recipient, "acceptCalendarEmailSubject", "acceptCalendarEmailBody", senderMailAddress)
}

export function sendRejectNotificationEmail(sharedGroupName: string, recipient: RecipientInfo, senderMailAddress: string) {
	_sendNotificationEmail(sharedGroupName, recipient, "rejectCalendarEmailSubject", "rejectCalendarEmailBody", senderMailAddress)
}

function _sendNotificationEmail(sharedGroupName: string, recipient: RecipientInfo, subject: TranslationKey, body: TranslationKey, senderMailAddress: string) {
	const editor = new MailEditor(mailModel.getUserMailboxDetails())
	const sender = getEnabledMailAddresses(mailModel.getUserMailboxDetails()).includes(senderMailAddress) ? senderMailAddress : getDefaultSender(mailModel.getUserMailboxDetails())

	const replacements = {
		// Sender is displayed like Name <mail.address@tutanota.com>. Less-than and greater-than must be encoded for HTML
		"{user}": `${getSenderName(mailModel.getUserMailboxDetails())} &lt;${sender}&gt;`,
		"{calendarName}": getCalendarName(sharedGroupName)
	}
	const subjectString = lang.get(subject)
	const bodyString = lang.get(body, replacements)
// Sending notifications as bcc so that invited people don't see each other
	const to = [{name: recipient.name, address: recipient.mailAddress}]
	editor.initWithTemplate({to}, subjectString, bodyString, true, sender)
	editor.send(false)
}