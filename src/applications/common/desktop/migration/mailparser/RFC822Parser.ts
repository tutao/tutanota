import {
	MigrationMailAttachment,
	MigrationMailAttachmentDisposition,
	MigrationMailBody,
	MigrationMailEnvelope,
} from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"

import { PostalMime } from "./postalmime-custom"
import { promiseMap } from "@tutao/utils"
import { migrationMailEnvelopeFromPostalMimeEmail } from "./MailParserUtils"

export type ParsedRFC822 = {
	parsedEnvelope?: MigrationMailEnvelope
	parsedBody?: MigrationMailBody
	parsedAttachments?: MigrationMailAttachment[]
	parsedHeaders?: string
}

export class RFC822Parser {
	constructor() {}

	async parseSource(source: Buffer): Promise<ParsedRFC822> {
		const parsedRFC822: ParsedRFC822 = {}

		const email = await PostalMime.parse(source, {
			attachmentEncoding: "arraybuffer",
		})

		parsedRFC822.parsedEnvelope = migrationMailEnvelopeFromPostalMimeEmail(email)

		parsedRFC822.parsedBody = { html: email.html ?? "", plaintext: email.text ?? "" }
		parsedRFC822.parsedHeaders = email.headers.map((header) => `${header.originalKey}: ${header.value}`).join("\n")

		parsedRFC822.parsedAttachments = await promiseMap(email.attachments, async (attachment) => {
			// when parsing, the encoding is set to arrayBuffer, so this will always be an arrayBuffer
			const content = attachment.content as ArrayBuffer
			const size = content.byteLength
			const migrationMailAttachment: MigrationMailAttachment = {
				size,
				mimeType: attachment.mimeType,
				content: Buffer.from(new Uint8Array(content)),
				related: attachment.related ?? false, // related true == inline attachment
				//replace "<",">" characters with empty for inline attachments, fix for gmail which adds such.
				cid: attachment.contentId?.replaceAll("<", "").replaceAll(">", ""),
				method: attachment.method,
			}

			if (attachment.filename) {
				migrationMailAttachment.filename = attachment.filename
			}

			if (attachment.disposition) {
				migrationMailAttachment.disposition = attachment.disposition as MigrationMailAttachmentDisposition
			}

			return migrationMailAttachment
		})

		return parsedRFC822
	}
}
