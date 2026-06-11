import { ImapMail, ImapMailAddress, ImapMailAttachment } from "./ImapMail.js"
import { ImapMailbox, ImapMailboxSpecialUse } from "./ImapMailbox.js"
import { plainTextToHtml } from "./PlainTextToHtmlConverter"
import { getImapConfigForDomain, ServerImapImportParams } from "./ImapKnownConfigs"

import { ImapCredentials } from "./ImapSyncState"
import type { TokenEndpointResponse } from "oauth4webapi"
import { createOAuthTokenEndpointResponse, ImapAccount, ImapFolderSyncState, OAuthTokenEndpointResponse } from "@tutao/entities/tutanota"
import { ImapImportAttachments, ImapImportDataFile, ImportMailParams } from "../../../worker/facades/lazy/ImportMailFacade"
import {
	CalendarMethod,
	calendarMethodToMailMethod,
	MailMethod,
	MailState,
	PartialRecipient,
	RecipientList,
	ReplyType,
} from "../../../../../../entities/tutanota/Utils"

export const DEFAULT_IMAP_IMPORT_MAX_QUOTA = "2500000000"

const TEXT_CALENDAR_MIME_TYPE = "text/calendar"

const IMAP_FLAG_SEEN = "\\Seen"
const IMAP_FLAG_ANSWERED = "\\Answered"
const IMAP_FLAG_FORWARDED = "$Forwarded"

export function imapAccountToImapCredentials(imapAccount: ImapAccount): ImapCredentials {
	const imapAccountAdSync = new ImapCredentials(imapAccount.host, parseInt(imapAccount.port), imapAccount.username)
	imapAccountAdSync.password = imapAccount.password ?? undefined
	const tokenEndpointResponse = imapAccount.oAuthTokenEndpointResponse
	imapAccountAdSync.tokenEndpointResponse =
		tokenEndpointResponse !== null ? oAuthTokenEndpointResponseToTokenEndpointResponse(tokenEndpointResponse) : undefined

	return imapAccountAdSync
}

export function oAuthTokenEndpointResponseToTokenEndpointResponse(tokenEndpointResponse: OAuthTokenEndpointResponse): TokenEndpointResponse {
	return {
		access_token: tokenEndpointResponse.accessToken,
		refresh_token: tokenEndpointResponse.refreshToken ?? undefined,
		expires_in: tokenEndpointResponse.expiresIn !== null ? parseInt(tokenEndpointResponse.expiresIn) : undefined,
		token_type: tokenEndpointResponse.tokenType as "bearer" | "dpop" | Lowercase<string>,
	}
}

export function tokenEndpointResponseToOAuthTokenEndpointResponse(tokenEndpointResponse: TokenEndpointResponse): OAuthTokenEndpointResponse {
	return createOAuthTokenEndpointResponse({
		accessToken: tokenEndpointResponse.access_token,
		refreshToken: tokenEndpointResponse.refresh_token ?? null,
		expiresIn: tokenEndpointResponse.expires_in !== undefined ? tokenEndpointResponse.expires_in.toString() : null,
		tokenType: tokenEndpointResponse.token_type,
	})
}

export function getFolderSyncStateForMailboxPath(mailboxPath: string, folderSyncStates: ImapFolderSyncState[]): ImapFolderSyncState | null {
	return (
		folderSyncStates.find((folderSyncState) => {
			return folderSyncState.path === mailboxPath
		}) ?? null
	)
}

export function imapMailToImportMailParams(
	imapMail: ImapMail,
	folderSyncStateId: IdTuple,
	deduplicatedAttachments: ImapImportAttachments | null,
): ImportMailParams {
	const fromMailAddress = imapMail.envelope?.from?.at(0)?.address ?? ""
	const fromName = imapMail.envelope?.from?.at(0)?.name ?? ""
	const senderMailAddress = imapMail.envelope?.sender?.at(0)?.address ?? null

	const differentEnvelopeSender = senderMailAddress !== fromMailAddress ? senderMailAddress : null

	let attachments = deduplicatedAttachments
	if (!attachments) {
		attachments = imapMail.attachments ? importAttachmentsFromImapMailAttachments(imapMail.attachments) : null
	}

	const bodyText = imapMail.body?.html.trim() || (imapMail.body?.plaintext.trim() ? plainTextToHtml(imapMail.body.plaintext) : "")

	return {
		subject: imapMail.envelope?.subject ?? "",
		bodyText: bodyText,
		sentDate: imapMail.envelope?.date ?? new Date(Date.now()),
		receivedDate: imapMail.internalDate ?? new Date(Date.now()),
		state: mailStateFromImapMailbox(imapMail.belongsToMailbox),
		unread: unreadFromImapMail(imapMail),
		messageId: imapMail.envelope?.messageId ?? null,
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
		const imapImportDataFile: ImapImportDataFile = {
			_type: "DataFile",
			name: imapMailAttachment.filename ?? "unknown.txt",
			data: imapMailAttachment.content,
			size: imapMailAttachment.size,
			mimeType: imapMailAttachment.mimeType,
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
	const iCalAttachments = imapMail.attachments?.find((attachment) => {
		return attachment.mimeType === TEXT_CALENDAR_MIME_TYPE
	})
	let calendarMethod = iCalAttachments?.method as CalendarMethod
	return calendarMethod ? calendarMethodToMailMethod(calendarMethod) : MailMethod.NONE
}

function replyTypeFromImapMail(imapMail: ImapMail): ReplyType {
	const flags = imapMail.flags
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
		const partialRecipient: PartialRecipient = {
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

	return getImapConfigForDomain(domain)
}
