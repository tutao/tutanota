import type { GroupInfo, ReceivedGroupInvitation } from "../api/entities/sys/TypeRefs.js"
import { locator } from "../api/main/CommonLocator"
import { MailMethod } from "../api/common/TutanotaConstants"
import { showProgressDialog } from "../gui/dialogs/ProgressDialog"
import type { GroupSharingTexts } from "./GroupGuiUtils"
import { getDefaultGroupName, getInvitationGroupType, getSharedGroupName } from "./GroupUtils"
import { PartialRecipient, Recipients } from "../api/common/recipients/Recipient"
import { getDefaultSender, getEnabledMailAddressesWithUser, getSenderNameForUser } from "../mailFunctionality/CommonMailUtils.js"

export function sendShareNotificationEmail(sharedGroupInfo: GroupInfo, recipients: Array<PartialRecipient>, texts: GroupSharingTexts) {
	locator.mailModel.getUserMailboxDetails().then((mailboxDetails) => {
		const senderMailAddress = getDefaultSender(locator.logins, mailboxDetails)
		const userName = getSenderNameForUser(mailboxDetails, locator.logins.getUserController())
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
			texts.shareEmailBody(userName, getSharedGroupName(sharedGroupInfo, locator.logins.getUserController(), true)),
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

function _sendNotificationEmail(recipients: Recipients, subject: string, body: string, senderMailAddress: string) {
	import("../misc/HtmlSanitizer").then(({ htmlSanitizer }) => {
		const sanitizedBody = htmlSanitizer.sanitizeHTML(body, {
			blockExternalContent: false,
			allowRelativeLinks: false,
			usePlaceholderForInlineImages: false,
		}).html
		locator.mailModel.getUserMailboxDetails().then(async (mailboxDetails) => {
			const sender = getEnabledMailAddressesWithUser(mailboxDetails, locator.logins.getUserController().userGroupInfo).includes(senderMailAddress)
				? senderMailAddress
				: getDefaultSender(locator.logins, mailboxDetails)

			const confirm = () => Promise.resolve(true)

			const wait = showProgressDialog
			const mailboxProperties = await locator.mailModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
			const model = await locator.sendMailModel(mailboxDetails, mailboxProperties)
			await model.initWithTemplate(recipients, subject, sanitizedBody, [], true, sender)
			await model.send(MailMethod.NONE, confirm, wait, "tooManyMailsAuto_msg")
		})
	})
}
