//@flow
import type {Recipients} from "../mail/editor/SendMailModel"
import {getDefaultSender, getEnabledMailAddresses, getSenderNameForUser} from "../mail/model/MailUtils"
import type {GroupInfo} from "../api/entities/sys/GroupInfo"
import type {ReceivedGroupInvitation} from "../api/entities/sys/ReceivedGroupInvitation"
import {locator} from "../api/main/MainLocator"
import type {RecipientInfo} from "../api/common/RecipientInfo"
import {logins} from "../api/main/LoginController"
import {MailMethod} from "../api/common/TutanotaConstants"
import {showProgressDialog} from "../gui/ProgressDialog"
import type {GroupSharingTexts} from "./GroupGuiUtils"
import {getDefaultGroupName, getInvitationGroupType, getSharedGroupName} from "./GroupUtils"

export function sendShareNotificationEmail(sharedGroupInfo: GroupInfo, recipients: Array<RecipientInfo>, texts: GroupSharingTexts) {
	locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
		const senderMailAddress = getDefaultSender(logins, mailboxDetails)
		const userName = getSenderNameForUser(mailboxDetails, logins.getUserController())
		// Sending notifications as bcc so that invited people don't see each other
		const bcc = recipients.map(({name, mailAddress}) => ({name, address: mailAddress}))
		_sendNotificationEmail({bcc}, texts.shareEmailSubject, texts.shareEmailBody(userName, getSharedGroupName(sharedGroupInfo, true)), senderMailAddress)
	})
}


export function sendAcceptNotificationEmail(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts) {
	const to = [{name: invitation.inviterName, address: invitation.inviterMailAddress}]
	const userName = invitation.inviterMailAddress
	const invitee = invitation.inviteeMailAddress
	const groupName = invitation.sharedGroupName || getDefaultGroupName(getInvitationGroupType(invitation))
	const senderMailAddress = invitation.inviteeMailAddress
	_sendNotificationEmail({to}, texts.acceptEmailSubject, texts.acceptEmailBody(userName, invitee, groupName), senderMailAddress)
}

export function sendRejectNotificationEmail(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts) {
	const to = [{name: invitation.inviterName, address: invitation.inviterMailAddress}]
	const userName = invitation.inviterMailAddress
	const invitee = invitation.inviteeMailAddress
	const groupName = invitation.sharedGroupName || getDefaultGroupName(getInvitationGroupType(invitation))
	const senderMailAddress = invitation.inviteeMailAddress
	_sendNotificationEmail({to}, texts.declineEmailSubject, texts.declineEmailBody(userName, invitee, groupName), senderMailAddress)
}


function _sendNotificationEmail(recipients: Recipients, subject: string, body: string, senderMailAddress: string) {
	import("../misc/HtmlSanitizer").then(({htmlSanitizer}) => {

		const sanitizedBody = htmlSanitizer.sanitize(body, {
			blockExternalContent: false,
			allowRelativeLinks: false,
			usePlaceholderForInlineImages: false
		}).text

		locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
			const sender = getEnabledMailAddresses(mailboxDetails).includes(senderMailAddress)
				? senderMailAddress
				: getDefaultSender(logins, mailboxDetails)

			const confirm = _ => Promise.resolve(true)
			const wait = showProgressDialog
			import("../mail/editor/SendMailModel").then(({defaultSendMailModel}) => {
				return defaultSendMailModel(mailboxDetails)
					.initWithTemplate(recipients, subject, sanitizedBody, [], true, sender)
					.then(model => model.send(MailMethod.NONE, confirm, wait, "tooManyMailsAuto_msg"))
			})
		})
	})

}