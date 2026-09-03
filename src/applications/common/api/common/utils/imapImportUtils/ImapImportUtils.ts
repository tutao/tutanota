import { ImapMail, ImapMailAddress, ImapMailAttachment } from "./ImapMail.js"
import { ImapMailboxSpecialUse } from "./ImapMailbox.js"
import { plainTextToHtml } from "./PlainTextToHtmlConverter"
import { getImapConfigWithPasswordAuthForDomain, ImapProvider, ServerImapImportParams } from "./ImapKnownConfigs"

import { ImapCredentials } from "./ImapSyncContext"
import type { TokenEndpointResponse } from "oauth4webapi"
import { createOAuthTokenEndpointResponse, ImapAccountSyncState, ImapFolderSyncState, OAuthTokenEndpointResponse } from "@tutao/entities/tutanota"
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

export function imapAccountSyncStateToImapCredentials(imapAccountSyncState: ImapAccountSyncState): ImapCredentials {
	const imapAccount = imapAccountSyncState.imapAccount
	const imapCredentials: ImapCredentials = {
		host: imapAccount.host,
		port: parseInt(imapAccount.port),
		username: imapAccount.username,
		ignoreCertificateErrors: imapAccount.ignoreCertificateErrors,
		customCertificateData: imapAccount.customCertificateData,
		provider: parseInt(imapAccountSyncState.provider) as ImapProvider,
		useSSL: imapAccount.useSSL,
	}
	imapCredentials.password = imapAccount.password ?? undefined
	const tokenEndpointResponse = imapAccount.oAuthTokenEndpointResponse
	imapCredentials.tokenEndpointResponse =
		tokenEndpointResponse !== null ? oAuthTokenEndpointResponseToTokenEndpointResponse(tokenEndpointResponse) : undefined

	return imapCredentials
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
	imapFolderSyncStates: ImapFolderSyncState[],
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
		state: mailStateFromImapMailbox(imapMail),
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
		sourceId: imapMail.sourceId,
		imapUid: imapMail.uid ?? null,
		imapModSeq: imapMail.modSeq ?? null,
		imapFolderSyncState: folderSyncStateId,
		labels: imapMail.labels ? labelsFromImapLabels(imapMail.labels, imapFolderSyncStates) : [],
	}
}

export function labelsFromImapLabels(imapLabels: Set<string>, imapFolderSyncStates: ImapFolderSyncState[]): IdTuple[] {
	let result: Set<IdTuple> = new Set()

	for (const imapLabel of imapLabels) {
		let folderSyncState: ImapFolderSyncState | null
		folderSyncState = imapFolderSyncStates.find((imapFolderSyncState) => imapFolderSyncState.imapSpecialUse === imapLabel) ?? null
		// Gmail announces the folder's special use as DRAFTS, but the label on the mail is DRAFT...
		if (imapLabel === ImapMailboxSpecialUse.DRAFT || imapLabel === ImapMailboxSpecialUse.DRAFTS) {
			folderSyncState =
				imapFolderSyncStates.find(
					(imapFolderSyncState) =>
						imapFolderSyncState.imapSpecialUse === ImapMailboxSpecialUse.DRAFTS ||
						imapFolderSyncState.imapSpecialUse === ImapMailboxSpecialUse.DRAFT,
				) ?? null
		}
		if (!folderSyncState) {
			folderSyncState = getFolderSyncStateForMailboxPath(imapLabel, imapFolderSyncStates)
		}
		if (folderSyncState?.mailSet) {
			result.add(folderSyncState.mailSet)
		}
	}
	return Array.from(result)
}

function importAttachmentsFromImapMailAttachments(imapMailAttachments: ImapMailAttachment[]): ImapImportDataFile[] {
	return imapMailAttachments.map((imapMailAttachment) => {
		const imapImportDataFile: ImapImportDataFile = {
			_type: "DataFile",
			name: imapMailAttachment.filename ?? guessFilenameBasedOnMimeType(imapMailAttachment.mimeType),
			data: imapMailAttachment.content,
			size: imapMailAttachment.size,
			mimeType: imapMailAttachment.mimeType,
			cid: imapMailAttachment.cid,
			fileHash: null,
		}
		return imapImportDataFile
	})
}

function guessFilenameBasedOnMimeType(mimeType: string): string {
	if (mimeType.startsWith("image/")) {
		return "image.png"
	} else if (mimeType.startsWith("audio/")) {
		return "audio.mp3"
	} else if (mimeType.startsWith("video/")) {
		return "video.mp4"
	} else if (mimeType.startsWith("application/pdf")) {
		return "document.pdf"
	} else if (mimeType.startsWith("application/zip")) {
		return "archive.zip"
	} else if (mimeType.startsWith(TEXT_CALENDAR_MIME_TYPE)) {
		return "calendar.ics"
	}
	return "unknown.txt"
}

function mailStateFromImapMailbox(imapMail: ImapMail): MailState {
	let mailState: MailState
	const specialUse = imapMail.belongsToMailbox.specialUse
	// in case of Gmail we do only fetch the ALL folder, so we need to check for the labels
	const isSent = specialUse === ImapMailboxSpecialUse.SENT || (imapMail.labels?.has(ImapMailboxSpecialUse.SENT) ?? false)
	const isDraft =
		specialUse === ImapMailboxSpecialUse.DRAFTS ||
		specialUse === ImapMailboxSpecialUse.DRAFT ||
		(imapMail.labels?.has(ImapMailboxSpecialUse.DRAFT) ?? false) ||
		(imapMail.labels?.has(ImapMailboxSpecialUse.DRAFTS) ?? false)
	if (isSent) {
		mailState = MailState.SENT
	} else if (isDraft) {
		mailState = MailState.DRAFT
	} else {
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

	return getImapConfigWithPasswordAuthForDomain(domain)
}

export function randomHexColor() {
	return (
		"#" +
		Math.floor(Math.random() * 0x1000000)
			.toString(16)
			.padStart(6, "0")
	)
}
