//@flow
import type {Mail} from "../../api/entities/tutanota/Mail";
import type {EntityClient} from "../../api/common/EntityClient";
import type {WorkerClient} from "../../api/main/WorkerClient";
import {MailBodyTypeRef} from "../../api/entities/tutanota/MailBody";
import {getMailBodyText, getMailHeaders} from "../../api/common/utils/Utils";
import {FileTypeRef} from "../../api/entities/tutanota/File";
import {MailHeadersTypeRef} from "../../api/entities/tutanota/MailHeaders";
import {MailState} from "../../api/common/TutanotaConstants";
import {getLetId} from "../../api/common/utils/EntityUtils"
import {HtmlSanitizer} from "../../misc/HtmlSanitizer"

/**
 * Used to pass all downloaded mail stuff to the desktop side to be exported as MSG
 * Ideally this would just be {Mail, MailHeaders, MailBody, FileReference[]}
 * but we can't send Dates over to the native side so we may as well just extract everything here
 */
export type MailBundleRecipient = {address: string, name?: string}
export type MailBundle = {
	mailId: IdTuple,
	subject: string,
	body: string,
	sender: MailBundleRecipient,
	to: MailBundleRecipient[],
	cc: MailBundleRecipient[],
	bcc: MailBundleRecipient[],
	replyTo: MailBundleRecipient[],
	isDraft: boolean,
	isRead: boolean,
	sentOn: number, // UNIX timestamp
	receivedOn: number, // UNIX timestamp,
	headers: ?string,
	attachments: DataFile[]
}

/**
 * Downloads the mail body and the attachments for an email, to prepare for exporting
 * @param mail
 * @param entityClient
 * @param worker
 * @param sanitizer
 */
export function makeMailBundle(mail: Mail, entityClient: EntityClient, worker: WorkerClient, sanitizer: HtmlSanitizer): Promise<MailBundle> {
	const bodyTextPromise = entityClient.load(MailBodyTypeRef, mail.body)
	                                    .then(getMailBodyText)
	                                    .then(body =>
		                                    sanitizer.sanitize(body, {
			                                    blockExternalContent: false,
			                                    allowRelativeLinks: false,
			                                    usePlaceholderForInlineImages: false
		                                    }).text
	                                    )

	const attachmentsPromise = Promise.all(
		mail.attachments.map(fileId => entityClient.load(FileTypeRef, fileId)
		                                           .then(worker.downloadFileContent.bind(worker))))

	const headersPromise = mail.headers
		? entityClient.load(MailHeadersTypeRef, mail.headers)
		: Promise.resolve(null)

	const recipientMapper = addr => ({address: addr.address, name: addr.name})
	return Promise.all([bodyTextPromise, attachmentsPromise, headersPromise])
	              .then(([bodyText, attachments, headers]) => {
		              return {
			              mailId: getLetId(mail),
			              subject: mail.subject,
			              body: bodyText,
			              sender: recipientMapper(mail.sender),
			              to: mail.toRecipients.map(recipientMapper),
			              cc: mail.ccRecipients.map(recipientMapper),
			              bcc: mail.bccRecipients.map(recipientMapper),
			              replyTo: mail.replyTos.map(recipientMapper),
			              isDraft: mail.state === MailState.DRAFT,
			              isRead: !mail.unread,
			              sentOn: mail.sentDate.getTime(),
			              receivedOn: mail.receivedDate.getTime(),
			              headers: headers && getMailHeaders(headers),
			              attachments: attachments
		              }
	              })
}