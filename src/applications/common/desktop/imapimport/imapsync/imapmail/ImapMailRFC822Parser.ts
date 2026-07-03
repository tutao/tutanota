import { ImapMailAttachment, ImapMailAttachmentDisposition, ImapMailBody, ImapMailEnvelope } from "../../../../api/common/utils/imapImportUtils/ImapMail.js"

import { PostalMime } from "./postalmime-custom"
import { promiseMap } from "@tutao/utils"
import { imapMailEnvelopeFromPostalMimeEmail } from "./ImapParserUtils"

export type ParsedImapRFC822 = {
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

		parsedImapRFC822.parsedEnvelope = imapMailEnvelopeFromPostalMimeEmail(email)

		parsedImapRFC822.parsedBody = { html: email.html ?? "", plaintext: email.text ?? "" }

		parsedImapRFC822.parsedAttachments = await promiseMap(email.attachments, async (attachment) => {
			// when parsing, the encoding is set to arrayBuffer, so this will always be an arrayBuffer
			const content = attachment.content as ArrayBuffer
			const size = content.byteLength
			const imapImportAttachment: ImapMailAttachment = {
				size,
				mimeType: attachment.mimeType,
				content: Buffer.from(new Uint8Array(content)),
				related: attachment.related ?? false, // related true == inline attachment
				cid: attachment.contentId,
				method: attachment.method,
			}

			if (attachment.filename) {
				imapImportAttachment.filename = attachment.filename
			}

			if (attachment.disposition) {
				imapImportAttachment.disposition = attachment.disposition as ImapMailAttachmentDisposition
			}

			return imapImportAttachment
		})

		return parsedImapRFC822
	}
}
