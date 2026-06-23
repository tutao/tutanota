import { ImapMailbox } from "../../../../api/common/utils/imapImportUtils/ImapMailbox"
import { ImapMail, ImapMailEnvelope } from "../../../../api/common/utils/imapImportUtils/ImapMail"
import { ImapMailRFC822Parser } from "./ImapMailRFC822Parser"
import { ProgrammingError } from "@tutao/app-env"
import type { Email } from "postal-mime"

export async function imapMailFromImapFlowFetchMessageObject(mail: any, belongsToMailbox: ImapMailbox, externalMailId: any): Promise<ImapMail> {
	if (mail.source === undefined) {
		throw new ProgrammingError(`IMAP mail source not available.`)
	}

	const imapMailRFC822Parser = new ImapMailRFC822Parser()
	const parsedMailRFC822 = await imapMailRFC822Parser.parseSource(mail.source)

	const headersString = new TextDecoder().decode(mail.headers)

	const imapMail: ImapMail = {
		uid: mail.uid,
		belongsToMailbox,
		modSeq: mail.modseq,
		size: mail.size,
		internalDate: mail.internalDate,
		flags: mail.flags,
		labels: mail.labels,
		headers: headersString,
		rfc822Source: mail.source,
	}

	if (parsedMailRFC822.parsedEnvelope) {
		imapMail.envelope = parsedMailRFC822.parsedEnvelope
	}

	if (parsedMailRFC822.parsedBody) {
		imapMail.body = parsedMailRFC822.parsedBody
	}

	if (parsedMailRFC822.parsedAttachments) {
		imapMail.attachments = parsedMailRFC822.parsedAttachments
	}

	return imapMail
}
export function imapMailEnvelopeFromPostalMimeEmail(email: Email) {
	let imapMailEnvelope: ImapMailEnvelope = {}

	if (email.date) {
		imapMailEnvelope.date = new Date(Date.parse(email.date))
	}

	if (email.subject) {
		imapMailEnvelope.subject = email.subject
	}

	if (email.messageId) {
		imapMailEnvelope.messageId = email.messageId
	}

	if (email.inReplyTo) {
		imapMailEnvelope.inReplyTo = email.inReplyTo
	}

	if (email.references) {
		imapMailEnvelope.references = email.references.split(",")
	}

	if (email.from) {
		imapMailEnvelope.from = [email.from]
	}

	if (email.sender) {
		imapMailEnvelope.sender = [email.sender]
	}

	if (email.to) {
		imapMailEnvelope.to = email.to
	}

	if (email.cc) {
		imapMailEnvelope.cc = email.cc
	}

	if (email.bcc) {
		imapMailEnvelope.bcc = email.bcc
	}

	if (email.replyTo) {
		imapMailEnvelope.replyTo = email.replyTo
	}

	return imapMailEnvelope
}
