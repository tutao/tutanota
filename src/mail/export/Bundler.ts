import type { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { FileTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import type { EntityClient } from "../../api/common/EntityClient"
import { MailState } from "../../api/common/TutanotaConstants"
import { getLetId } from "../../api/common/utils/EntityUtils"
import type { HtmlSanitizer } from "../../misc/HtmlSanitizer"
import { promiseMap } from "@tutao/tutanota-utils"
import { DataFile } from "../../api/common/DataFile"
import { FileController } from "../../file/FileController"
import { getMailBodyText, loadMailDetails, loadMailHeaders } from "../model/MailUtils.js"
import { MailFacade } from "../../api/worker/facades/lazy/MailFacade.js"
import { getDisplayedSender, MailAddressAndName } from "../../api/common/mail/CommonMailUtils.js"
import { CryptoFacade } from "../../api/worker/crypto/CryptoFacade.js"

/**
 * Used to pass all downloaded mail stuff to the desktop side to be exported as a file
 * Ideally this would just be {Mail, Headers, Body, FileReference[]}
 * but we can't send Dates over to the native side, so we may as well just extract everything here
 */
export type MailBundleRecipient = {
	address: string
	name?: string
}
export type MailBundle = {
	mailId: IdTuple
	subject: string
	body: string
	sender: MailBundleRecipient
	to: MailBundleRecipient[]
	cc: MailBundleRecipient[]
	bcc: MailBundleRecipient[]
	replyTo: MailBundleRecipient[]
	isDraft: boolean
	isRead: boolean
	sentOn: number
	// UNIX timestamp
	receivedOn: number // UNIX timestamp,
	headers: string | null
	attachments: DataFile[]
}

/**
 * Downloads the mail body and the attachments for an email, to prepare for exporting
 */
export async function makeMailBundle(
	mail: Mail,
	mailFacade: MailFacade,
	entityClient: EntityClient,
	fileController: FileController,
	sanitizer: HtmlSanitizer,
	cryptoFacade: CryptoFacade,
): Promise<MailBundle> {
	const mailDetails = await loadMailDetails(mailFacade, mail)
	const body = sanitizer.sanitizeHTML(getMailBodyText(mailDetails.body), {
		blockExternalContent: false,
		allowRelativeLinks: false,
		usePlaceholderForInlineImages: false,
	}).html

	const files = await promiseMap(mail.attachments, async (fileId) => await entityClient.load(FileTypeRef, fileId))
	const attachments = await promiseMap(
		await cryptoFacade.enforceSessionKeyUpdateIfNeeded(mail, files),
		async (file) => await fileController.getAsDataFile(file),
	)

	const headers = await loadMailHeaders(mailDetails)
	const recipientMapper = ({ address, name }: MailAddressAndName) => ({ address, name })

	return {
		mailId: getLetId(mail),
		subject: mail.subject,
		body,
		sender: recipientMapper(getDisplayedSender(mail)),
		to: mailDetails.recipients.toRecipients.map(recipientMapper),
		cc: mailDetails.recipients.ccRecipients.map(recipientMapper),
		bcc: mailDetails.recipients.bccRecipients.map(recipientMapper),
		replyTo: mailDetails.replyTos.map(recipientMapper),
		isDraft: mail.state === MailState.DRAFT,
		isRead: !mail.unread,
		sentOn: mailDetails.sentDate.getTime(),
		receivedOn: mail.receivedDate.getTime(),
		headers,
		attachments,
	}
}
