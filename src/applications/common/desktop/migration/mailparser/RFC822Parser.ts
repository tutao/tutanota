import {
	MigrationMailAttachment,
	MigrationMailAttachmentDisposition,
	MigrationMailBody,
	MigrationMailEnvelope,
} from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"

import { PostalMime } from "./postalmime-custom"
import { promiseMap } from "@tutao/utils"
import type { Email } from "postal-mime"

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

		parsedRFC822.parsedEnvelope = this.migrationMailEnvelopeFromPostalMimeEmail(email)

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

	private migrationMailEnvelopeFromPostalMimeEmail(email: Email) {
		let migrationMailEnvelope: MigrationMailEnvelope = {}

		if (email.date) {
			migrationMailEnvelope.date = new Date(Date.parse(email.date))
		}

		if (email.subject) {
			migrationMailEnvelope.subject = email.subject
		}

		if (email.messageId) {
			migrationMailEnvelope.messageId = email.messageId
		}

		if (email.inReplyTo) {
			migrationMailEnvelope.inReplyTo = email.inReplyTo
		}

		if (email.references) {
			migrationMailEnvelope.references = email.references.split(",")
		}

		if (email.from) {
			migrationMailEnvelope.from = [email.from]
		}

		if (email.sender) {
			migrationMailEnvelope.sender = [email.sender]
		}

		if (email.to) {
			migrationMailEnvelope.to = email.to
		}

		if (email.cc) {
			migrationMailEnvelope.cc = email.cc
		}

		if (email.bcc) {
			migrationMailEnvelope.bcc = email.bcc
		}

		if (email.replyTo) {
			migrationMailEnvelope.replyTo = email.replyTo
		}

		return migrationMailEnvelope
	}
}
