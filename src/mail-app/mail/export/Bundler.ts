import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { FileTypeRef } from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import { MailState } from "../../../common/api/common/TutanotaConstants"
import { getLetId } from "../../../common/api/common/utils/EntityUtils"
import type { HtmlSanitizer } from "../../../common/misc/HtmlSanitizer"
import { promiseMap } from "@tutao/tutanota-utils"
import { FileController } from "../../../common/file/FileController"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade.js"
import { getDisplayedSender, getMailBodyText, MailAddressAndName } from "../../../common/api/common/CommonMailUtils.js"
import { loadMailDetails } from "../view/MailViewerUtils.js"
import { loadMailHeaders } from "../model/MailUtils.js"
import { MailBundle } from "../../../common/mailFunctionality/SharedMailUtils.js"

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
