import { ImapAccount } from "../../../../desktop/imapimport/adsync/ImapSyncState.js"
import { ImapMail, ImapMailAddress, ImapMailAttachment } from "./ImapMail.js"
import { ImapMailbox, ImapMailboxSpecialUse } from "./ImapMailbox.js"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { ImapImportAttachments, ImapImportDataFile, ImportMailParams } from "../../../worker/facades/lazy/ImportMailFacade"
import { MailMethod, MailState, ReplyType } from "@tutao/app-env"
import { PartialRecipient, RecipientList } from "../../recipients/Recipient"
import { plainTextToHtml } from "../PlainTextToHtmlConverter"
import { InitializeImapImportParams } from "../../../../../mail-app/workerUtils/imapimport/ImapImporter"
import { getConfigForDomain, ServerImapImportParams } from "./ImapWellKnownConfigs"

const TEXT_CALENDAR_MIME_TYPE = "text/calendar"
const CALENDAR_METHOD_MIME_PARAMETER = "method"

const IMAP_FLAG_SEEN = "\\Seen"
const IMAP_FLAG_ANSWERED = "\\Answered"
const IMAP_FLAG_FORWARDED = "$Forwarded"

export function importImapAccountToImapAccount(importImapAccount: tutanotaTypeRefs.ImportImapAccount): ImapAccount {
	let imapAccount = new ImapAccount(importImapAccount.host, parseInt(importImapAccount.port), importImapAccount.userName)
	imapAccount.password = importImapAccount.password ?? undefined
	imapAccount.accessToken = importImapAccount.accessToken ?? undefined

	return imapAccount
}

export function getFolderSyncStateForMailboxPath(
	mailboxPath: string,
	folderSyncStates: tutanotaTypeRefs.ImportImapFolderSyncState[],
): tutanotaTypeRefs.ImportImapFolderSyncState | null {
	let folderSyncState = folderSyncStates.find((folderSyncState) => {
		return folderSyncState.path === mailboxPath
	})
	return folderSyncState ? folderSyncState : null
}

export function imapMailToImportMailParams(
	imapMail: ImapMail,
	folderSyncStateId: IdTuple,
	deduplicatedAttachments: ImapImportAttachments | null,
): ImportMailParams {
	let fromMailAddress = imapMail.envelope?.from?.at(0)?.address ?? ""
	let fromName = imapMail.envelope?.from?.at(0)?.name ?? ""
	let senderMailAddress = imapMail.envelope?.sender?.at(0)?.address ?? null

	let differentEnvelopeSender = senderMailAddress !== fromMailAddress ? senderMailAddress : null

	let attachments = deduplicatedAttachments
	if (!attachments) {
		attachments = imapMail.attachments ? importAttachmentsFromImapMailAttachments(imapMail.attachments) : null
	}

	return {
		subject: imapMail.envelope?.subject ?? "",
		// fixme put into html quotes similar to server
		bodyText: imapMail.body?.html?.trim() || (imapMail.body?.plaintext?.trim() ? plainTextToHtml(imapMail.body.plaintext) : ""),
		sentDate: imapMail.envelope?.date ?? new Date(Date.now()),
		receivedDate: imapMail.internalDate ?? new Date(Date.now()),
		state: mailStateFromImapMailbox(imapMail.belongsToMailbox),
		unread: unreadFromImapMail(imapMail),
		messageId: imapMail.envelope?.messageId ?? null, // TODO if null, a new messageId should be generated on the Tutadb server
		senderMailAddress: fromMailAddress,
		senderName: fromName,
		method: mailMethodFromImapMail(imapMail),
		replyType: replyTypeFromImapMail(imapMail),
		differentEnvelopeSender: differentEnvelopeSender, // null if sender == from in mail envelope
		headers: imapMail.headers ?? "",
		replyTos: imapMail.envelope?.replyTo ? recipientsFromImapMailAddresses(imapMail.envelope?.replyTo!) : [],
		toRecipients: imapMail.envelope?.to ? recipientsFromImapMailAddresses(imapMail.envelope?.to!) : [],
		ccRecipients: imapMail.envelope?.cc ? recipientsFromImapMailAddresses(imapMail.envelope?.cc!) : [],
		bccRecipients: imapMail.envelope?.bcc ? recipientsFromImapMailAddresses(imapMail.envelope?.bcc!) : [],
		attachments: attachments,
		inReplyTo: imapMail.envelope?.inReplyTo ?? null,
		references: imapMail.envelope?.references ?? [],
		imapUid: imapMail.uid,
		imapModSeq: imapMail.modSeq ?? null,
		imapFolderSyncState: folderSyncStateId,
	}
}

function importAttachmentsFromImapMailAttachments(imapMailAttachments: ImapMailAttachment[]): ImapImportDataFile[] {
	return imapMailAttachments.map((imapMailAttachment) => {
		let imapImportDataFile: ImapImportDataFile = {
			_type: "DataFile",
			name: imapMailAttachment.filename ?? imapMailAttachment.cid + Date.now().toString(),
			data: imapMailAttachment.content,
			size: imapMailAttachment.size,
			mimeType: imapMailAttachment.contentType,
			cid: imapMailAttachment.cid,
			fileHash: null,
		}
		return imapImportDataFile
	})
}

function mailStateFromImapMailbox(imapMailbox: ImapMailbox): MailState {
	let mailState: MailState
	switch (imapMailbox.specialUse) {
		case ImapMailboxSpecialUse.SENT:
			mailState = MailState.SENT
			break
		case ImapMailboxSpecialUse.DRAFTS:
			mailState = MailState.DRAFT
			break
		default:
			mailState = MailState.RECEIVED
	}
	return mailState
}

function unreadFromImapMail(imapMail: ImapMail): boolean {
	return !(imapMail.flags?.has(IMAP_FLAG_SEEN) ?? false)
}

function mailMethodFromImapMail(imapMail: ImapMail): MailMethod {
	let iCalAttachments = imapMail.attachments?.find((attachment) => {
		return attachment.contentType === TEXT_CALENDAR_MIME_TYPE
	})
	// fixme attachments do not have headers in postal mime
	return MailMethod.NONE
}

function replyTypeFromImapMail(imapMail: ImapMail): ReplyType {
	let flags = imapMail.flags
	if (flags === undefined) {
		return ReplyType.NONE
	}

	let replyType: ReplyType
	if (flags.has(IMAP_FLAG_ANSWERED) && flags.has(IMAP_FLAG_FORWARDED)) {
		replyType = ReplyType.REPLY_FORWARD
	} else if (flags.has(IMAP_FLAG_ANSWERED)) {
		replyType = ReplyType.REPLY
	} else if (flags.has(IMAP_FLAG_FORWARDED)) {
		replyType = ReplyType.FORWARD
	} else {
		replyType = ReplyType.NONE
	}
	return replyType
}

function recipientsFromImapMailAddresses(imapMailAddresses: ImapMailAddress[]): RecipientList {
	return imapMailAddresses.map((imapMailAddress) => {
		let partialRecipient: PartialRecipient = {
			address: imapMailAddress.address ?? "",
			name: imapMailAddress.name,
		}
		return partialRecipient
	})
}

export function guessServerImapConfigFromEmail(username: string): ServerImapImportParams | null {
	const domain = username.split("@")[1]
	if (domain === undefined) {
		return null
	}

	// TODO: Also add logic for guessing usual imap configs in case domain isn't on precomputed list
	return getConfigForDomain(domain)
}
export enum ImportState {
	NOT_INITIALIZED,
	RUNNING,
	PAUSED,
	POSTPONED,
	FINISHED,
}

export class ImapImportState {
	state: ImportState
	postponedUntil: Date

	constructor(initialState: ImportState, postponedUntil: Date = new Date(Date.now())) {
		this.state = initialState
		this.postponedUntil = postponedUntil
	}
}
