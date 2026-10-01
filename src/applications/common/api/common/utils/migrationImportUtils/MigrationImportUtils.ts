import { MigrationMail, MigrationMailAddress, MigrationMailAttachment } from "./MigrationMail.js"
import { MigrationMailboxSpecialUse } from "./MigrationMailbox.js"
import { plainTextToHtml } from "./PlainTextToHtmlConverter"
import { getServerMigrationConfigForDomain, MailboxMigrationProvider, ServerMigrationConfig } from "./MigrationKnownConfigs"

import { MigrationCredentials } from "./MigrationSyncContext"
import type { TokenEndpointResponse } from "oauth4webapi"
import {
	createOAuthTokenEndpointResponseLegacy,
	MailboxMigrationFolderSyncState,
	MailboxMigrationSyncState,
	OAuthTokenEndpointResponseLegacy,
} from "@tutao/entities/tutanota"
import { createOAuthToken, OAuthToken, UserMigrationInformation } from "@tutao/entities/sys"
import { MigrationImportAttachments, MigrationImportDataFile, ImportMailParams } from "../../../worker/facades/lazy/ImportMailFacade"
import {
	CalendarMethod,
	calendarMethodToMailMethod,
	MailMethod,
	MailState,
	PartialRecipient,
	RecipientList,
	ReplyType,
} from "../../../../../../entities/tutanota/Utils"
import { isSameSingleId, listIdPart } from "@tutao/meta"
import { assertNotNull } from "@tutao/utils"
import { ProgrammingError } from "@tutao/app-env"

const TEXT_CALENDAR_MIME_TYPE = "text/calendar"

const SEEN_FLAG = "\\Seen"
const ANSWERED_FLAG = "\\Answered"
const FORWARDED_FLAG = "$Forwarded"

export type MailboxMigrationCredential = {
	provider: MailboxMigrationProvider
	username: string
	password: string | null
	oAuthToken: OAuthToken | OAuthTokenEndpointResponseLegacy | null
}

export function getMailboxMigrationCredential(
	migrationSyncState: MailboxMigrationSyncState,
	userMigrationInformation: UserMigrationInformation | null,
): MailboxMigrationCredential {
	const imapConfiguration = migrationSyncState.imapConfiguration

	if (userMigrationInformation) {
		const userMigrationCredential = userMigrationInformation.credential
		return {
			provider: parseInt(assertNotNull(userMigrationInformation?.provider)) as MailboxMigrationProvider,
			username: imapConfiguration?.sharedUsername ?? userMigrationCredential.username,
			password: imapConfiguration?.sharedPassword ?? userMigrationCredential?.password ?? null,
			oAuthToken: imapConfiguration?.sharedOauthToken ?? userMigrationCredential?.oAuthToken ?? null,
		}
	} else if (imapConfiguration) {
		return {
			provider: parseInt(assertNotNull(migrationSyncState.legacyProvider)) as MailboxMigrationProvider,
			username: assertNotNull(imapConfiguration.sharedUsername),
			password: imapConfiguration.sharedPassword,
			oAuthToken: imapConfiguration.sharedOauthToken,
		}
	} else {
		throw new ProgrammingError("no mailbox migration credential available")
	}
}

export function findUserMigrationInfoForSyncState(
	userMigrationInformationList: ReadonlyArray<UserMigrationInformation>,
	migrationSyncStateId: IdTuple,
): UserMigrationInformation | null {
	return (
		userMigrationInformationList.find((userMigrationInformation) => {
			const syncStateRef = userMigrationInformation.mailboxMigrationSyncStates
			return syncStateRef !== null && isSameSingleId(syncStateRef.value, listIdPart(migrationSyncStateId))
		}) ?? null
	)
}

export function migrationSyncStateToMigrationCredentials(
	migrationSyncState: MailboxMigrationSyncState,
	userMigrationInformation: UserMigrationInformation | null,
): MigrationCredentials {
	const mailboxMigrationImapConfiguration = assertNotNull(migrationSyncState.imapConfiguration)
	const migrationCredential = getMailboxMigrationCredential(migrationSyncState, userMigrationInformation)
	const migrationCredentials: MigrationCredentials = {
		host: mailboxMigrationImapConfiguration.host,
		port: parseInt(mailboxMigrationImapConfiguration.port),
		username: migrationCredential.username,
		ignoreCertificateErrors: mailboxMigrationImapConfiguration.ignoreCertificateErrors,
		customCertificateData: mailboxMigrationImapConfiguration.customCertificateData,
		provider: migrationCredential.provider,
		useSSL: mailboxMigrationImapConfiguration.useSSL,
		isLegacy: userMigrationInformation === null,
	}
	migrationCredentials.password = migrationCredential.password ?? undefined
	migrationCredentials.tokenEndpointResponse =
		migrationCredential.oAuthToken !== null ? oAuthTokenToTokenEndpointResponse(migrationCredential.oAuthToken) : undefined

	return migrationCredentials
}

export function oAuthTokenToTokenEndpointResponse(oAuthToken: OAuthToken | OAuthTokenEndpointResponseLegacy): TokenEndpointResponse {
	return {
		access_token: oAuthToken.accessToken,
		refresh_token: oAuthToken.refreshToken ?? undefined,
		expires_in: oAuthToken.expiresIn !== null ? parseInt(oAuthToken.expiresIn) : undefined,
		token_type: oAuthToken.tokenType as "bearer" | "dpop" | Lowercase<string>,
	}
}

export function tokenEndpointResponseToOAuthTokenEndpointResponseLegacy(tokenEndpointResponse: TokenEndpointResponse): OAuthTokenEndpointResponseLegacy {
	return createOAuthTokenEndpointResponseLegacy({
		accessToken: tokenEndpointResponse.access_token,
		refreshToken: tokenEndpointResponse.refresh_token ?? null,
		expiresIn: tokenEndpointResponse.expires_in !== undefined ? tokenEndpointResponse.expires_in.toString() : null,
		tokenType: tokenEndpointResponse.token_type,
	})
}

export function tokenEndpointResponseToOAuthToken(tokenEndpointResponse: TokenEndpointResponse): OAuthToken {
	return createOAuthToken({
		accessToken: tokenEndpointResponse.access_token,
		refreshToken: tokenEndpointResponse.refresh_token ?? null,
		expiresIn: tokenEndpointResponse.expires_in !== undefined ? tokenEndpointResponse.expires_in.toString() : null,
		tokenType: tokenEndpointResponse.token_type,
	})
}

export function getFolderSyncStateForMailboxPath(
	mailboxPath: string,
	folderSyncStates: MailboxMigrationFolderSyncState[],
): MailboxMigrationFolderSyncState | null {
	return (
		folderSyncStates.find((folderSyncState) => {
			return folderSyncState.sourceId === mailboxPath
		}) ?? null
	)
}

export function migrationMailToImportMailParams(
	migrationMail: MigrationMail,
	folderSyncStateId: IdTuple,
	deduplicatedAttachments: MigrationImportAttachments | null,
	migrationFolderSyncStates: MailboxMigrationFolderSyncState[],
): ImportMailParams {
	const fromMailAddress = migrationMail.envelope?.from?.at(0)?.address ?? ""
	const fromName = migrationMail.envelope?.from?.at(0)?.name ?? ""
	const senderMailAddress = migrationMail.envelope?.sender?.at(0)?.address ?? null

	const differentEnvelopeSender = senderMailAddress !== fromMailAddress ? senderMailAddress : null

	let attachments = deduplicatedAttachments
	if (!attachments) {
		attachments = migrationMail.attachments ? importAttachmentsFromMigrationMailAttachments(migrationMail.attachments) : null
	}

	const bodyText = migrationMail.body?.html.trim() || (migrationMail.body?.plaintext.trim() ? plainTextToHtml(migrationMail.body.plaintext) : "")

	return {
		subject: migrationMail.envelope?.subject ?? "",
		bodyText: bodyText,
		sentDate: migrationMail.envelope?.date ?? new Date(Date.now()),
		receivedDate: migrationMail.internalDate ?? new Date(Date.now()),
		state: mailStateFromMigrationMailbox(migrationMail),
		unread: unreadFromMigrationMail(migrationMail),
		messageId: migrationMail.envelope?.messageId ?? null,
		senderMailAddress: fromMailAddress,
		senderName: fromName,
		method: mailMethodFromMigrationMail(migrationMail),
		replyType: replyTypeFromMigrationMail(migrationMail),
		differentEnvelopeSender: differentEnvelopeSender, // null if sender == from in mail envelope
		headers: migrationMail.headers ?? "",
		replyTos: migrationMail.envelope?.replyTo ? recipientsFromMigrationMailAddresses(migrationMail.envelope?.replyTo!) : [],
		toRecipients: migrationMail.envelope?.to ? recipientsFromMigrationMailAddresses(migrationMail.envelope?.to!) : [],
		ccRecipients: migrationMail.envelope?.cc ? recipientsFromMigrationMailAddresses(migrationMail.envelope?.cc!) : [],
		bccRecipients: migrationMail.envelope?.bcc ? recipientsFromMigrationMailAddresses(migrationMail.envelope?.bcc!) : [],
		attachments: attachments,
		inReplyTo: migrationMail.envelope?.inReplyTo ?? null,
		references: migrationMail.envelope?.references ?? [],
		sourceId: migrationMail.sourceId,
		imapModSeq: migrationMail.modSeq ?? null,
		mailboxMigrationFolderSyncState: folderSyncStateId,
		labels: migrationMail.labels ? labelsFromMigrationLabels(migrationMail.labels, migrationFolderSyncStates) : [],
	}
}

export function labelsFromMigrationLabels(migrationLabels: Set<string>, mailboxMigrationFolderSyncStates: MailboxMigrationFolderSyncState[]): IdTuple[] {
	let result: Set<IdTuple> = new Set()

	for (const migrationLabel of migrationLabels) {
		let folderSyncState: MailboxMigrationFolderSyncState | null
		folderSyncState = mailboxMigrationFolderSyncStates.find((folderSyncState) => folderSyncState.specialUse === migrationLabel) ?? null
		// Gmail announces the folder's special use as DRAFTS, but the label on the mail is DRAFT...
		if (migrationLabel === MigrationMailboxSpecialUse.DRAFT || migrationLabel === MigrationMailboxSpecialUse.DRAFTS) {
			folderSyncState =
				mailboxMigrationFolderSyncStates.find(
					(folderSyncState) =>
						folderSyncState.specialUse === MigrationMailboxSpecialUse.DRAFTS || folderSyncState.specialUse === MigrationMailboxSpecialUse.DRAFT,
				) ?? null
		}
		if (!folderSyncState) {
			folderSyncState = getFolderSyncStateForMailboxPath(migrationLabel, mailboxMigrationFolderSyncStates)
		}
		if (folderSyncState?.mailSet) {
			result.add(folderSyncState.mailSet)
		}
	}
	return Array.from(result)
}

function importAttachmentsFromMigrationMailAttachments(migrationMailAttachments: MigrationMailAttachment[]): MigrationImportDataFile[] {
	return migrationMailAttachments.map((migrationMailAttachment) => {
		const migrationImportDataFile: MigrationImportDataFile = {
			_type: "DataFile",
			name: migrationMailAttachment.filename ?? guessFilenameBasedOnMimeType(migrationMailAttachment.mimeType),
			data: migrationMailAttachment.content,
			size: migrationMailAttachment.size,
			mimeType: migrationMailAttachment.mimeType,
			cid: migrationMailAttachment.cid,
			fileHash: null,
		}
		return migrationImportDataFile
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

function mailStateFromMigrationMailbox(migrationMail: MigrationMail): MailState {
	let mailState: MailState
	const specialUse = migrationMail.belongsToMailbox.specialUse
	// in case of Gmail we do only fetch the ALL folder, so we need to check for the labels
	const isSent = specialUse === MigrationMailboxSpecialUse.SENT || (migrationMail.labels?.has(MigrationMailboxSpecialUse.SENT) ?? false)
	const isDraft =
		specialUse === MigrationMailboxSpecialUse.DRAFTS ||
		specialUse === MigrationMailboxSpecialUse.DRAFT ||
		(migrationMail.labels?.has(MigrationMailboxSpecialUse.DRAFT) ?? false) ||
		(migrationMail.labels?.has(MigrationMailboxSpecialUse.DRAFTS) ?? false)
	if (isSent) {
		mailState = MailState.SENT
	} else if (isDraft) {
		mailState = MailState.DRAFT
	} else {
		mailState = MailState.RECEIVED
	}
	return mailState
}

function unreadFromMigrationMail(migrationMail: MigrationMail): boolean {
	return !(migrationMail.flags?.has(SEEN_FLAG) ?? false)
}

function mailMethodFromMigrationMail(migrationMail: MigrationMail): MailMethod {
	const iCalAttachments = migrationMail.attachments?.find((attachment) => {
		return attachment.mimeType === TEXT_CALENDAR_MIME_TYPE
	})
	let calendarMethod = iCalAttachments?.method as CalendarMethod
	return calendarMethod ? calendarMethodToMailMethod(calendarMethod) : MailMethod.NONE
}

function replyTypeFromMigrationMail(migrationMail: MigrationMail): ReplyType {
	const flags = migrationMail.flags
	if (flags === undefined) {
		return ReplyType.NONE
	}

	let replyType: ReplyType
	if (flags.has(ANSWERED_FLAG) && flags.has(FORWARDED_FLAG)) {
		replyType = ReplyType.REPLY_FORWARD
	} else if (flags.has(ANSWERED_FLAG)) {
		replyType = ReplyType.REPLY
	} else if (flags.has(FORWARDED_FLAG)) {
		replyType = ReplyType.FORWARD
	} else {
		replyType = ReplyType.NONE
	}
	return replyType
}

function recipientsFromMigrationMailAddresses(migrationMailAddresses: MigrationMailAddress[]): RecipientList {
	return migrationMailAddresses.map((migrationMailAddress) => {
		const partialRecipient: PartialRecipient = {
			address: migrationMailAddress.address ?? "",
			name: migrationMailAddress.name,
		}
		return partialRecipient
	})
}

export function guessServerMigrationParamsFromEmail(username: string): ServerMigrationConfig | null {
	const domain = username.split("@")[1]
	if (domain === undefined) {
		return null
	}

	return getServerMigrationConfigForDomain(domain)
}

export function randomHexColor() {
	return (
		"#" +
		Math.floor(Math.random() * 0x1000000)
			.toString(16)
			.padStart(6, "0")
	)
}
