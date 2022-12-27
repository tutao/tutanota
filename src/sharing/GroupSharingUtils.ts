import { getDefaultSender, getEnabledMailAddressesWithUser, getSenderNameForUser } from "../mail/model/MailUtils"
import type { GroupInfo, ReceivedGroupInvitation } from "../api/entities/sys/TypeRefs.js"
import { locator } from "../api/main/MainLocator"
import { logins } from "../api/main/LoginController"
import { MailMethod } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { GroupSharingTexts } from "./GroupGuiUtils"
import { getDefaultGroupName, getInvitationGroupType, getSharedGroupName } from "./GroupUtils"
import { PartialRecipient, Recipients } from "../api/common/recipients/Recipient"

export function sendShareNotificationEmail(sharedGroupInfo: GroupInfo, recipients: Array<PartialRecipient>, texts: GroupSharingTexts) {
	locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
		const senderMailAddress = getDefaultSender(logins, mailboxDetails)
		const userName = getSenderNameForUser(mailboxDetails, logins.getUserController())
		// Sending notifications as bcc so that invited people don't see each other
		const bcc = recipients.map(({ name, address }) => ({
			name,
			address,
		}))

		_sendNotificationEmail(
			{
				bcc,
			},
			texts.shareEmailSubject,
			texts.shareEmailBody(getSharedGroupName(sharedGroupInfo, true), userName),
			senderMailAddress,
		)
	})
}

export function sendAcceptNotificationEmail(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts) {
	const to = [
		{
			name: invitation.inviterName,
			address: invitation.inviterMailAddress,
		},
	]
	const userName = invitation.inviterMailAddress
	const invitee = invitation.inviteeMailAddress
	const groupName = invitation.sharedGroupName || getDefaultGroupName(getInvitationGroupType(invitation))
	const senderMailAddress = invitation.inviteeMailAddress

	_sendNotificationEmail(
		{
			to,
		},
		texts.acceptEmailSubject,
		texts.acceptEmailBody(userName, invitee, groupName),
		senderMailAddress,
	)
}

export function sendRejectNotificationEmail(invitation: ReceivedGroupInvitation, texts: GroupSharingTexts) {
	const to = [
		{
			name: invitation.inviterName,
			address: invitation.inviterMailAddress,
		},
	]
	const userName = invitation.inviterMailAddress
	const invitee = invitation.inviteeMailAddress
	const groupName = invitation.sharedGroupName || getDefaultGroupName(getInvitationGroupType(invitation))
	const senderMailAddress = invitation.inviteeMailAddress

	_sendNotificationEmail(
		{
			to,
		},
		texts.declineEmailSubject,
		texts.declineEmailBody(userName, invitee, groupName),
		senderMailAddress,
	)
}

async function _sendNotificationEmail(recipients: Recipients, subject: string, body: string, senderMailAddress: string) {
	const { htmlSanitizer } = await import("../misc/HtmlSanitizer")
	const sanitizedBody = htmlSanitizer.sanitizeHTML(body, {
		blockExternalContent: false,
		allowRelativeLinks: false,
		usePlaceholderForInlineImages: false,
	}).html
	const mailboxDetails = await locator.mailModel.getUserMailboxDetails()
	const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
	const sender = getEnabledMailAddressesWithUser(mailboxDetails, logins.getUserController().userGroupInfo).includes(senderMailAddress)
		? senderMailAddress
		: getDefaultSender(logins, mailboxDetails)
	const confirm = () => Promise.resolve(true)

	const wait = showProgressDialog
	const { defaultSendMailModel } = await import("../mail/editor/SendMailModel")
	return defaultSendMailModel(mailboxDetails, mailboxProperties)
		.initWithTemplate(recipients, subject, sanitizedBody, [], true, sender)
		.then((model) => model.send(MailMethod.NONE, confirm, wait, "tooManyMailsAuto_msg"))
}
