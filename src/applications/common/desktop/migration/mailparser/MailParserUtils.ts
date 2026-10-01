import { MigrationMailbox } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox"
import { MigrationMail, MigrationMailEnvelope } from "../../../api/common/utils/migrationImportUtils/MigrationMail"
import { RFC822Parser } from "./RFC822Parser"
import { ProgrammingError } from "@tutao/app-env"
import type { Email } from "postal-mime"
import { FetchMessageObject } from "imapflow"

export async function migrationMailFromImapFlowFetchMessageObject(mail: FetchMessageObject, belongsToMailbox: MigrationMailbox): Promise<MigrationMail> {
	if (mail.source === undefined) {
		throw new ProgrammingError(`IMAP mail source not available.`)
	}

	const rfc822Parser = new RFC822Parser()
	const parsedMailRFC822 = await rfc822Parser.parseSource(mail.source)

	const migrationMail: MigrationMail = {
		sourceId: mail.uid.toString(),
		belongsToMailbox,
		modSeq: mail.modseq,
		size: mail.size,
		internalDate: typeof mail.internalDate === "string" ? new Date(Date.parse(mail.internalDate)) : mail.internalDate,
		flags: mail.flags,
		labels: mail.labels,
		headers: parsedMailRFC822.parsedHeaders,
		rfc822Source: mail.source,
	}

	if (parsedMailRFC822.parsedEnvelope) {
		migrationMail.envelope = parsedMailRFC822.parsedEnvelope
	}

	if (parsedMailRFC822.parsedBody) {
		migrationMail.body = parsedMailRFC822.parsedBody
	}

	if (parsedMailRFC822.parsedAttachments) {
		migrationMail.attachments = parsedMailRFC822.parsedAttachments
	}

	return migrationMail
}
export function migrationMailEnvelopeFromPostalMimeEmail(email: Email) {
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
