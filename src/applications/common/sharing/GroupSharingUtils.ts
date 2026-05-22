import { locator } from "../api/main/CommonLocator"
import { showProgressDialog } from "../../../ui/dialogs/ProgressDialog"
import type { GroupSharingTexts } from "./GroupGuiUtils"
import { getDefaultGroupName, getSharedGroupName } from "./GroupUtils"
import { getDefaultSender, getSenderNameForUser, isAliasEnabledWithUser } from "../mailFunctionality/SharedMailUtils.js"
import { getInvitationGroupType, GroupInfo, ReceivedGroupInvitation } from "@tutao/entities/sys"
import { MailMethod, PartialRecipient, VerificationRecipients } from "@tutao/entities/tutanota"

export function sendShareNotificationEmail(sharedGroupInfo: GroupInfo, recipients: Array<PartialRecipient>, texts: GroupSharingTexts) {
	locator.mailboxModel.getUserMailboxDetails().then((mailboxDetails) => {
		const senderMailAddress = getDefaultSender(locator.logins, mailboxDetails)
		const userName = getSenderNameForUser(mailboxDetails, locator.logins.getUserController())
		// Sending notifications as bcc so that invited people don't see each other
		const bcc = recipients.map(({ name, address }) => ({
			name,
			address,
		}))

		let senderDisplayName

		if (!userName) {
			senderDisplayName = senderMailAddress
		} else {
			// use html code for < > so that they (and the enclosed email address) do not get sanitized away
			senderDisplayName = `${userName} &lt;${senderMailAddress}&gt;`
		}

		_sendNotificationEmail(
			{
				bcc,
			},
			texts.shareEmailSubject,
			texts.shareEmailBody(senderDisplayName, getSharedGroupName(sharedGroupInfo, locator.logins.getUserController().userSettingsGroupRoot, true)),
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

function _sendNotificationEmail(recipients: VerificationRecipients, subject: string, body: string, senderMailAddress: string) {
	import("../misc/HtmlSanitizer").then(({ getHtmlSanitizer }) => {
		const sanitizedBody = getHtmlSanitizer().sanitizeHTML(body, {
			blockExternalContent: false,
			allowRelativeLinks: false,
			usePlaceholderForInlineImages: false,
		}).html
		locator.mailboxModel.getUserMailboxDetails().then(async (mailboxDetails) => {
			const sender = isAliasEnabledWithUser(mailboxDetails, locator.logins.getUserController().userGroupInfo, senderMailAddress)
				? senderMailAddress
				: getDefaultSender(locator.logins, mailboxDetails)

			const confirm = () => Promise.resolve(true)

			const wait = showProgressDialog
			const mailboxProperties = await locator.mailboxModel.getMailboxProperties(mailboxDetails.mailboxGroupRoot)
			const model = await locator.sendMailModel(mailboxDetails, mailboxProperties)
			await model.initWithTemplate(recipients, subject, sanitizedBody, [], true, sender)
			await model.send(MailMethod.NONE, confirm, wait, null, "tooManyMailsAuto_msg")
		})
	})
}
