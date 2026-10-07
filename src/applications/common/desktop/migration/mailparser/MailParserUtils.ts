import { MigrationMailbox } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox"
import {
	MigrationMail,
	MigrationMailAddress,
	MigrationMailAttachment,
	MigrationMailAttachmentDisposition,
	MigrationMailBody,
	MigrationMailEnvelope,
} from "../../../api/common/utils/migrationImportUtils/MigrationMail"
import { RFC822Parser } from "./RFC822Parser"
import { ProgrammingError } from "@tutao/app-env"
import type { Email } from "postal-mime"
import { FetchMessageObject } from "imapflow"
import type { GmailMessageResource } from "../gmailsync/GmailApiClient"
import type { GraphMessageResource, GraphRecipient } from "../m365sync/GraphApiClient"
import { GMAIL_SYSTEM_LABELS } from "../gmailsync/GmailSyncSession"

const SEEN_FLAG = "\\Seen"
const FLAGGED_FLAG = "\\Flagged"
const DRAFT_FLAG = "\\Draft"

export async function migrationMailFromImapFlowFetchMessageObject(mail: FetchMessageObject, belongsToMailbox: MigrationMailbox): Promise<MigrationMail> {
	if (mail.source === undefined) {
		throw new ProgrammingError(`IMAP mail source not available.`)
	}

	const rfc822Parser = new RFC822Parser()
	const parsedMailRFC822 = await rfc822Parser.parseSource(mail.source)

	const migrationMail: MigrationMail = {
		imapUid: mail.uid,
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

/**
 * Converts a mail of the Gmail API (in raw format) like the mails of the IMAP server of Gmail are converted:
 * The flags are derived from the labels, system labels are referenced by their special use and user labels by their name (= mailbox path),
 * see labelsFromMigrationLabels.
 */
export async function migrationMailFromGmailMessage(
	message: GmailMessageResource,
	belongsToMailbox: MigrationMailbox,
	labelNameById: ReadonlyMap<string, string>,
): Promise<MigrationMail> {
	const source = Buffer.from(message.raw ?? "", "base64url")
	const parsedMailRFC822 = await new RFC822Parser().parseSource(source)

	const labelIds = message.labelIds ?? []
	const flags = new Set<string>()
	if (!labelIds.includes("UNREAD")) {
		flags.add(SEEN_FLAG)
	}
	if (labelIds.includes("STARRED")) {
		flags.add(FLAGGED_FLAG)
	}
	if (labelIds.includes("DRAFT")) {
		flags.add(DRAFT_FLAG)
	}

	const labels = new Set<string>()
	for (const labelId of labelIds) {
		const systemLabel = GMAIL_SYSTEM_LABELS.find((label) => label.id === labelId)
		const name = systemLabel ? systemLabel.specialUse : labelNameById.get(labelId)
		if (name) {
			labels.add(name)
		}
	}

	return {
		sourceId: message.id,
		size: source.length,
		internalDate: message.internalDate ? new Date(Number(message.internalDate)) : undefined,
		flags,
		labels,
		envelope: parsedMailRFC822.parsedEnvelope,
		body: parsedMailRFC822.parsedBody,
		attachments: parsedMailRFC822.parsedAttachments,
		headers: parsedMailRFC822.parsedHeaders,
		belongsToMailbox,
		rfc822Source: source,
	}
}

/** Converts a mail of Microsoft Graph (with its attachments). */
export function migrationMailFromGraphMessage(message: GraphMessageResource, belongsToMailbox: MigrationMailbox): MigrationMail {
	const envelope: MigrationMailEnvelope = {
		date: message.sentDateTime ? new Date(message.sentDateTime) : undefined,
		subject: message.subject,
		messageId: message.internetMessageId,
		from: message.from ? [migrationMailAddressFromGraphRecipient(message.from)] : undefined,
		sender: message.sender ? [migrationMailAddressFromGraphRecipient(message.sender)] : undefined,
		to: message.toRecipients?.map(migrationMailAddressFromGraphRecipient),
		cc: message.ccRecipients?.map(migrationMailAddressFromGraphRecipient),
		bcc: message.bccRecipients?.map(migrationMailAddressFromGraphRecipient),
		replyTo: message.replyTo?.map(migrationMailAddressFromGraphRecipient),
	}

	const isHtml = message.body?.contentType?.toLowerCase() === "html"
	const body: MigrationMailBody = {
		html: isHtml ? (message.body?.content ?? "") : "",
		plaintext: isHtml ? "" : (message.body?.content ?? ""),
	}

	const flags = new Set<string>()
	if (message.isRead) {
		flags.add(SEEN_FLAG)
	}

	const attachments: MigrationMailAttachment[] = (message.attachments ?? [])
		.filter((attachment) => attachment.contentBytes !== undefined)
		.map((attachment) => ({
			size: attachment.size ?? 0,
			mimeType: attachment.contentType ?? "application/octet-stream",
			content: Buffer.from(attachment.contentBytes!, "base64"),
			disposition: attachment.isInline ? MigrationMailAttachmentDisposition.Inline : MigrationMailAttachmentDisposition.Attachment,
			filename: attachment.name,
			cid: attachment.contentId,
		}))

	return {
		sourceId: message.id,
		internalDate: message.receivedDateTime ? new Date(message.receivedDateTime) : undefined,
		flags,
		envelope,
		body,
		attachments,
		headers: reconstructHeadersFromGraphMessageHeaders(message.internetMessageHeaders),
		belongsToMailbox,
	}
}

function migrationMailAddressFromGraphRecipient(recipient: GraphRecipient): MigrationMailAddress {
	return { name: recipient.emailAddress?.name, address: recipient.emailAddress?.address }
}

function reconstructHeadersFromGraphMessageHeaders(headers?: { name: string; value: string }[]): string | undefined {
	if (!headers || headers.length === 0) {
		return undefined
	}
	return headers.map((header) => `${header.name}: ${header.value}`).join("\r\n")
}
