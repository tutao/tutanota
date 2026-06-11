import { ImapMailAttachment, ImapMailAttachmentDisposition, ImapMailBody, ImapMailEnvelope } from "../../../../api/common/utils/imapImportUtils/ImapMail.js"

import { PostalMime } from "./postalmime-custom.js"
import { promiseMap } from "@tutao/utils"

export interface ParsedImapRFC822 {
	parsedEnvelope?: ImapMailEnvelope
	parsedBody?: ImapMailBody
	parsedAttachments?: ImapMailAttachment[]
}

export class ImapMailRFC822Parser {
	constructor() {}

	async parseSource(source: Buffer): Promise<ParsedImapRFC822> {
		const parsedImapRFC822: ParsedImapRFC822 = {}

		const email = await PostalMime.parse(source, {
			attachmentEncoding: "arraybuffer",
		})

		parsedImapRFC822.parsedEnvelope = ImapMailEnvelope.fromPostalMimeEmail(email)

		parsedImapRFC822.parsedBody = new ImapMailBody(email.html ?? "", email.text ?? "")

		parsedImapRFC822.parsedAttachments = await promiseMap(email.attachments, async (attachment) => {
			// when parsing, the encoding is set to arrayBuffer, so this will always be an arrayBuffer
			const content = attachment.content as ArrayBuffer
			const size = content.byteLength
			const imapImportAttachment = new ImapMailAttachment(size, attachment.mimeType, Buffer.from(new Uint8Array(content)))
				.setRelated(attachment.related ?? false) // related true == inline attachment
				.setCid(attachment.contentId)
				.setMethod(attachment.method)

			if (attachment.filename) {
				imapImportAttachment.setFilename(attachment.filename)
			}

			if (attachment.disposition) {
				imapImportAttachment.setDisposition(attachment.disposition as ImapMailAttachmentDisposition)
			}

			return imapImportAttachment
		})

		return parsedImapRFC822
	}
}
