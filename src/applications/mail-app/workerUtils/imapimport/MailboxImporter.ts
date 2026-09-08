import { ImapCredentials, ImapMailboxState, ImapMailId, ImapSyncContext } from "../../../common/api/common/utils/migrationImportUtils/ImapSyncContext.js"
import { ImapMailbox, ImapMailboxSpecialUse, ImapMailboxStatus } from "../../../common/api/common/utils/migrationImportUtils/ImapMailbox.js"
import { ImapMail, ImapMailAttachment } from "../../../common/api/common/utils/migrationImportUtils/ImapMail.js"
import { ImapError } from "../../../common/api/common/error/ImapError.js"

import { assertNotNull, getFirstOrThrow, isEmpty, partition, promiseMap, uint8ArrayToString } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"
import { ImapImportDataFile, ImapImportTutaFileId, ImportMailFacade, ImportMailParams } from "../../../common/api/worker/facades/lazy/ImportMailFacade"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { MailboxImportSession, newMailboxImportSession } from "./MailboxImportSession"
import { MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/ImapKnownConfigs"
import {
	findUserMigrationInfoForSyncState,
	getFolderSyncStateForMailboxPath,
	getMailboxMigrationCredential,
	imapMailToImportMailParams,
	migrationSyncStateToImapCredentials,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { ImapSyncEventType, MailboxMigrationFolderSyncStatus, MailboxMigrationSyncStatus } from "../../../../entities/tutanota/Utils"
import {
	DeduplicatedImportedAttachmentTypeRef,
	MailBox,
	MailboxMigrationFolderSyncState,
	MailboxMigrationFolderSyncStateTypeRef,
	MailboxMigrationImapConfiguration,
	MailboxMigrationSyncStateTypeRef,
	ManageLabelServiceLabelData,
} from "@tutao/entities/tutanota"
import { UserMigrationCredentialParams, UserMigrationInformation } from "@tutao/entities/sys"
import { collapseId, elementIdPart, isSameId, OperationType } from "@tutao/meta"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { MailboxMigrationFacade } from "../../../common/api/worker/facades/lazy/MailboxMigrationFacade"
import { ImapSyncFacade, ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MailboxImportUiSession } from "../../settings/imapimport/ImapMailImportController"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../platform-kit/instance-pipeline/RestClientOptions"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade"

const DEFAULT_TUTA_SERVER_SUSPENSION_POSTPONE_TIME = 120 * 1000 // 120 seconds
const DEFAULT_TUTA_SERVER_STORAGE_ERROR_POSTPONE_TIME = 25 * 60 * 60 * 1000 // 25 hours
const DEFAULT_TUTA_SERVER_ERROR_POSTPONE_TIME = 60 * 1000 // 60 seconds

type BaseInitializeImapImportParams = {
	mailGroupId: Id
	imapConfiguration: MailboxMigrationImapConfiguration
	provider: MailboxMigrationProvider
	imapSyncLabelData: ManageLabelServiceLabelData | null
	credential: UserMigrationCredentialParams
}

export type MailSetMapping = { mailSetElementId: Id; shouldSync: boolean; specialUse: ImapMailboxSpecialUse | null }

export type InitializeMailboxImportParams =
	| (BaseInitializeImapImportParams & {
			matchImapMailboxesToTutaMailSets: true
			imapMailboxesToTutaMailSets: Map<string, MailSetMapping>
			rootImportMailSetName?: never
			spamFolderMigrationInformation?: never
	  })
	| (BaseInitializeImapImportParams & {
			matchImapMailboxesToTutaMailSets: false
			rootImportMailSetName: string
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: boolean
				spamMailbox: ImapMailbox | null
			}
			imapMailboxesToTutaMailSets?: never
	  })

export type ImportResult = {
	state: {
		status: MailboxMigrationSyncStatus
		postponedUntil?: Date
	}
	remoteStateId: IdTuple
}

export class MailboxImporter implements ImapSyncFacade {
	// key is the mailboxMigrationSyncState._id
	mailboxImportSessions: Map<string, MailboxImportSession> = new Map()
	deduplicatedImportedAttachmentHashToFileIdByMailGroup: Map<Id, Map<string, Promise<IdTuple | undefined>>> = new Map()
	fileElementIdToAttachmentHashMap: Map<Id, string> = new Map()

	constructor(
		private readonly imapSyncSystemFacade: ImapSyncSystemFacade,
		private readonly mailboxMigrationFacade: MailboxMigrationFacade,
		private readonly importMailFacade: ImportMailFacade,
		private readonly userFacade: UserFacade,
	) {}

	private async loadUserMigrationInformationForSyncState(
		migrationSyncStateId: IdTuple,
		userMigrationInfoListId?: IdTuple,
	): Promise<UserMigrationInformation | null> {
		if (userMigrationInfoListId) {
			return await this.mailboxMigrationFacade.getUserMigrationInformationById(userMigrationInfoListId)
		} else {
			// legacy case
			const userMigrationInfoListId = this.userFacade.getLoggedInUser().userMigrationInfos
			const userMigrationInfos = await this.mailboxMigrationFacade.getAllUserMigrationInformation(userMigrationInfoListId)
			return findUserMigrationInfoForSyncState(userMigrationInfos, migrationSyncStateId)
		}
	}

	async init(mailboxes: MailBox[]) {
		// legacy case
		for (const mailbox of mailboxes) {
			if (mailbox.legacyMailboxMigrationSyncStates) {
				const mailboxMigrationSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationSyncStates(mailbox.legacyMailboxMigrationSyncStates)
				for (const mailboxMigrationSyncState of mailboxMigrationSyncStates) {
					const folderSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(
						mailboxMigrationSyncState.mailboxMigrationFolderSyncStates,
					)
					const session = newMailboxImportSession(mailboxMigrationSyncState, folderSyncStates, null)
					this.mailboxImportSessions.set(this.getMailboxImportSessionsMapKey(mailboxMigrationSyncState._id), session)
				}
			}
		}
		// new case
		const userMigrationInfoListId = this.userFacade.getLoggedInUser().userMigrationInfos
		const userMigrationInfos = await this.mailboxMigrationFacade.getAllUserMigrationInformation(userMigrationInfoListId)
		for (const userMigrationInfo of userMigrationInfos) {
			const mailboxMigrationSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationSyncStates(
				userMigrationInfo.mailboxMigrationSyncStates.value,
			)
			for (const mailboxMigrationSyncState of mailboxMigrationSyncStates) {
				const folderSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(
					mailboxMigrationSyncState.mailboxMigrationFolderSyncStates,
				)
				const session = newMailboxImportSession(mailboxMigrationSyncState, folderSyncStates, userMigrationInfo)
				this.mailboxImportSessions.set(this.getMailboxImportSessionsMapKey(mailboxMigrationSyncState._id), session)
			}
		}
	}

	async initializeNewImport(initializeParams: InitializeMailboxImportParams): Promise<MailboxImportSession> {
		const { mailboxMigrationSyncState, initialFolderSyncStates, userMigrationInformation } =
			await this.mailboxMigrationFacade.initializeMailboxImport(initializeParams)
		const newSession = newMailboxImportSession(mailboxMigrationSyncState, initialFolderSyncStates, userMigrationInformation)
		this.mailboxImportSessions.set(this.getMailboxImportSessionsMapKey(mailboxMigrationSyncState._id), newSession)
		return newSession
	}

	/**
	 * Reloads mailboxMigrationSyncState from the server and updates the corresponding MailboxImportSession
	 *
	 * @param mailboxMigrationSyncStateId
	 */
	private async reloadMailboxImportSession(mailboxMigrationSyncStateId: IdTuple) {
		const mailboxMigrationSyncState = await this.mailboxMigrationFacade.getMailboxMigrationSyncStateById(mailboxMigrationSyncStateId, {
			...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
			cacheMode: CacheMode.WriteOnly,
		})
		const idKey = this.getMailboxImportSessionsMapKey(mailboxMigrationSyncStateId)
		this.mailboxImportSessions.get(idKey)
		let session = this.getMailboxImportSessionOrNull(mailboxMigrationSyncStateId)
		if (session) {
			session.mailboxMigrationSyncState = mailboxMigrationSyncState
			session.userMigrationInformation = await this.loadUserMigrationInformationForSyncState(
				mailboxMigrationSyncStateId,
				session.userMigrationInformation?._id,
			)
		} else {
			const folderSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(
				mailboxMigrationSyncState.mailboxMigrationFolderSyncStates,
			)
			const userMigrationInformation = await this.loadUserMigrationInformationForSyncState(mailboxMigrationSyncStateId)
			session = newMailboxImportSession(mailboxMigrationSyncState, folderSyncStates, userMigrationInformation)
			this.mailboxImportSessions.set(this.getMailboxImportSessionsMapKey(mailboxMigrationSyncState._id), session)
		}
		return session
	}

	/**
	 * Attempts to continue an import from an existing state, it may return errors in case of failure.
	 */
	async continueImport(mailboxMigrationSyncStateId: IdTuple, isForceRetry: boolean = false): Promise<ImportResult> {
		let session = await this.reloadMailboxImportSession(mailboxMigrationSyncStateId)

		if (session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.CANCELED) {
			return Promise.resolve({
				state: { status: MailboxMigrationSyncStatus.CANCELED },
				remoteStateId: session.mailboxMigrationSyncState._id,
			})
		}

		if (
			!isForceRetry &&
			session.mailboxMigrationSyncState.status === MailboxMigrationSyncStatus.POSTPONED &&
			new Date(parseInt(session.mailboxMigrationSyncState.postponedUntil)).getTime() > Date.now()
		) {
			return {
				state: {
					status: session.mailboxMigrationSyncState.status as MailboxMigrationSyncStatus,
					postponedUntil: new Date(parseInt(session.mailboxMigrationSyncState.postponedUntil)),
				},
				remoteStateId: session.mailboxMigrationSyncState._id,
			}
		}

		const imapCredentials = migrationSyncStateToImapCredentials(session.mailboxMigrationSyncState, session.userMigrationInformation)
		const imapMailboxStates = await this.getAllImapMailboxStates(session)
		const isGmail = imapCredentials.provider === MailboxMigrationProvider.Gmail
		const imapSyncContext: ImapSyncContext = { imapCredentials, imapMailboxStates, isGmail }

		const mailGroupId = assertNotNull(session.mailboxMigrationSyncState._ownerGroup)
		const hashToIdMap = await this.getImportedImapAttachmentHashToIdMap(session)
		this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, hashToIdMap)

		await this.imapSyncSystemFacade.startSync(mailboxMigrationSyncStateId, imapSyncContext)

		await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
			session.mailboxMigrationSyncState,
			MailboxMigrationSyncStatus.RUNNING,
			MailboxMigrationFolderSyncStatus.RUNNING,
		)
		return Promise.resolve({
			state: { status: MailboxMigrationSyncStatus.RUNNING },
			remoteStateId: session.mailboxMigrationSyncState._id,
		})
	}

	async pauseImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
			await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.PAUSED,
				MailboxMigrationFolderSyncStatus.PAUSED,
			)
		}
	}

	async stopLocalImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
		}
	}

	async postponeImport(accountSyncStateId: IdTuple, postponedUntil: Date): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
			await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.POSTPONED,
				MailboxMigrationFolderSyncStatus.PAUSED,
				postponedUntil.getTime().toString(),
			)
		}
	}

	async setGmailAllMailsImapDisabledOnImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
			await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR,
				MailboxMigrationFolderSyncStatus.PAUSED,
				undefined,
			)
		}
	}

	async deleteImport(mailboxMigrationSyncStateId: IdTuple): Promise<void> {
		await this.mailboxMigrationFacade.deleteImapImport(mailboxMigrationSyncStateId)
		await this.imapSyncSystemFacade.stopSync(mailboxMigrationSyncStateId)
		this.mailboxImportSessions.delete(this.getMailboxImportSessionsMapKey(mailboxMigrationSyncStateId))
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		return await this.imapSyncSystemFacade.getImapMailboxesFromServer(imapCredentials)
	}

	private async getAllImapMailboxStates(session: MailboxImportSession): Promise<ImapMailboxState[]> {
		const imapMailboxStates: ImapMailboxState[] = []
		const imapFolderSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(
			session.mailboxMigrationSyncState.mailboxMigrationFolderSyncStates,
		)

		for (const folderSyncState of imapFolderSyncStates) {
			const importedImapUidToImapMailId = new Map<number, ImapMailId>()
			if (!(folderSyncState.status === MailboxMigrationFolderSyncStatus.NO_SYNC)) {
				const importedImapMails = await this.mailboxMigrationFacade.getImportedMails(folderSyncState.importedMails)
				for (const importedImapMail of importedImapMails) {
					const imapUid = parseInt(importedImapMail.sourceId)
					const importedImapMailId: ImapMailId = { uid: imapUid }
					if (importedImapMail.imapModSeq !== null) {
						importedImapMailId.modSeq = BigInt(importedImapMail.imapModSeq)
					}
					importedImapMailId.messageId = importedImapMail.messageId
					session.importedMessageIds.add(importedImapMail.messageId)

					importedImapUidToImapMailId.set(imapUid, importedImapMailId)
				}
			}

			const imapMailboxState: ImapMailboxState = {
				path: folderSyncState.sourceId,
				importedUidToMailIdsMap: importedImapUidToImapMailId,
				noSync: folderSyncState.status === MailboxMigrationFolderSyncStatus.NO_SYNC,
			}
			imapMailboxState.uidNext = folderSyncState.uidnext ? parseInt(folderSyncState.uidnext) : undefined
			imapMailboxState.uidValidity = folderSyncState.uidvalidity ? BigInt(folderSyncState.uidvalidity) : undefined
			imapMailboxState.highestModSeq = folderSyncState.highestmodseq ? BigInt(folderSyncState.highestmodseq) : null

			imapMailboxStates.push(imapMailboxState)
		}

		return imapMailboxStates
	}

	private async getImportedImapAttachmentHashToIdMap(session: MailboxImportSession): Promise<Map<string, Promise<IdTuple>>> {
		const importedImapAttachmentHashToIdMap = new Map<string, Promise<IdTuple>>()
		const importedImapAttachmentHashToIdMapList = await this.mailboxMigrationFacade.getDeduplicatedImportedAttachments(
			assertNotNull(session.mailboxMigrationSyncState._ownerGroup),
		)

		for (const importedImapAttachmentHashToId of importedImapAttachmentHashToIdMapList) {
			const imapAttachmentHash = importedImapAttachmentHashToId.attachmentHash
			const attachmentId = importedImapAttachmentHashToId.attachment
			importedImapAttachmentHashToIdMap.set(imapAttachmentHash, Promise.resolve(attachmentId))
			this.fileElementIdToAttachmentHashMap.set(elementIdPart(attachmentId), imapAttachmentHash)
		}

		return importedImapAttachmentHashToIdMap
	}

	// Visible for testing
	async performAttachmentDeduplication(session: MailboxImportSession, imapMailAttachments: ImapMailAttachment[]) {
		const mailGroupId = assertNotNull(session.mailboxMigrationSyncState._ownerGroup)
		let groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(mailGroupId)
		if (!groupMap) {
			groupMap = await this.getImportedImapAttachmentHashToIdMap(session)
			this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, groupMap)
		}
		return await promiseMap(imapMailAttachments, async (imapMailAttachment) => {
			// calculate fileHash to perform IMAP import attachment de-duplication
			const fileHash = uint8ArrayToString("utf-8", sha256Hash(imapMailAttachment.content))
			const groupMapLocal = assertNotNull(groupMap)
			if (groupMapLocal.has(fileHash)) {
				const attachmentId = await groupMapLocal.get(fileHash)
				if (attachmentId) {
					return {
						_type: "ImapImportTutaFileId",
						_id: attachmentId,
					} as ImapImportTutaFileId
				}
			}

			const deferredPromise = (async () => {
				const refreshedMap = await this.getImportedImapAttachmentHashToIdMap(session)
				this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, refreshedMap)
				const attachmentId = refreshedMap.get(fileHash)
				if (attachmentId) {
					this.fileElementIdToAttachmentHashMap.set(elementIdPart(await attachmentId), fileHash)
				}
				// replace the promise with the new promise that resolves directly to the attachmentId
				// for future calls to prevent unnecessary server requests
				groupMapLocal.set(fileHash, Promise.resolve(attachmentId))
				return attachmentId
			})()

			groupMapLocal.set(fileHash, deferredPromise)
			const importDataFile: ImapImportDataFile = {
				_type: "DataFile",
				name: imapMailAttachment.filename ?? "unknown.txt",
				data: imapMailAttachment.content,
				size: imapMailAttachment.size,
				mimeType: imapMailAttachment.mimeType,
				cid: imapMailAttachment.cid,
				fileHash: fileHash,
			}
			return importDataFile
		})
	}

	async onMailbox(accountSyncStateId: IdTuple, imapMailbox: ImapMailbox, eventType: ImapSyncEventType): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (!session) {
			return Promise.resolve()
		}
		const isALLSystemFolder = imapMailbox.specialUse !== undefined && imapMailbox.specialUse === ImapMailboxSpecialUse.ALL
		const provider = getMailboxMigrationCredential(session.mailboxMigrationSyncState, session.userMigrationInformation).provider
		const isGmail = provider === MailboxMigrationProvider.Gmail

		switch (eventType) {
			case ImapSyncEventType.CREATE: {
				let parentImportFolderId = isGmail && isALLSystemFolder ? null : session.mailboxMigrationSyncState.rootImportMailSet
				let parentFolderSyncState: MailboxMigrationFolderSyncState | null = null
				if (imapMailbox.parentFolder) {
					parentFolderSyncState = getFolderSyncStateForMailboxPath(imapMailbox.parentFolder.path, session.imapFolderSyncStates)
					parentImportFolderId = parentFolderSyncState?.mailSet ? parentFolderSyncState.mailSet : null
				}

				if (!session.imapFolderSyncStates.some((folder) => folder.sourceId === imapMailbox.path)) {
					const shouldSync = parentFolderSyncState === null || parentFolderSyncState.status !== MailboxMigrationFolderSyncStatus.NO_SYNC
					const shouldCreateLabels = isGmail && !isALLSystemFolder
					const folderSyncState = await this.mailboxMigrationFacade.initializeImapMailSet(
						imapMailbox,
						session.mailboxMigrationSyncState,
						provider,
						parentImportFolderId,
						shouldSync,
						shouldCreateLabels,
					)
					if (folderSyncState) {
						const folderSyncStateIndex = session.imapFolderSyncStates.findIndex((imapFolderSyncState) =>
							isSameId(folderSyncState._id, imapFolderSyncState._id),
						)
						// a CREATE entityEvent might have already added the folderSyncState to the session.imapFolderSyncStates list
						if (folderSyncStateIndex === -1) {
							session.imapFolderSyncStates.push(folderSyncState)
						}
					}
				}
				break
			}
			case ImapSyncEventType.UPDATE:
				// We do not process updates because it is a one-way sync
				break
			case ImapSyncEventType.DELETE: {
				const folderSyncStateForMailboxPath = getFolderSyncStateForMailboxPath(imapMailbox.path, session.imapFolderSyncStates)
				if (folderSyncStateForMailboxPath && folderSyncStateForMailboxPath.status !== MailboxMigrationFolderSyncStatus.NO_SYNC) {
					await this.mailboxMigrationFacade.deleteImapFolderSyncState(folderSyncStateForMailboxPath._id)
				}
				break
			}
		}

		return Promise.resolve()
	}

	async onMailboxStatus(accountSyncStateId: IdTuple, imapMailboxStatus: ImapMailboxStatus): Promise<void> {
		const session = assertNotNull(this.getMailboxImportSessionOrNull(accountSyncStateId))
		const folderSyncState = getFolderSyncStateForMailboxPath(imapMailboxStatus.path, session.imapFolderSyncStates)
		if (folderSyncState !== null && folderSyncState.status !== MailboxMigrationFolderSyncStatus.NO_SYNC) {
			// If the uidvalidity of a folder has changed, it means all IMAP uids are invalidated, and we cannot continue with the sync.
			// This should usually never happen, only with bad IMAP server implementations.
			if (folderSyncState.uidvalidity && !(folderSyncState.uidvalidity === imapMailboxStatus.uidValidity.toString())) {
				await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
					session.mailboxMigrationSyncState,
					MailboxMigrationSyncStatus.ERROR,
					MailboxMigrationFolderSyncStatus.CANCELED,
					undefined,
				)
				console.error(
					`uidvalidity of a folder has changed for the account sync state ${accountSyncStateId} on mail group ${folderSyncState._ownerGroup}.`,
				)
			}
			await this.mailboxMigrationFacade.updateImapFolderSyncState(imapMailboxStatus, folderSyncState)
		}
	}

	async onMultipleMails(accountSyncStateId: IdTuple, imapMails: ImapMail[], eventType: ImapSyncEventType) {
		const session = assertNotNull(this.getMailboxImportSessionOrNull(accountSyncStateId))
		const mailGroupId = assertNotNull(session.mailboxMigrationSyncState._ownerGroup)

		if (isEmpty(imapMails)) {
			return Promise.resolve()
		}

		const folderSyncState = getFolderSyncStateForMailboxPath(getFirstOrThrow(imapMails).belongsToMailbox.path, session.imapFolderSyncStates)
		if (folderSyncState === null || folderSyncState.status === MailboxMigrationFolderSyncStatus.NO_SYNC) {
			console.log("folder sync state is null or no sync")
			return Promise.resolve()
		}
		const importMailParamsList: ImportMailParams[] = []
		for (const imapMail of imapMails) {
			const deduplicatedAttachments = imapMail.attachments ? await this.performAttachmentDeduplication(session, imapMail.attachments) : []
			const importMailParams = imapMailToImportMailParams(imapMail, folderSyncState._id, deduplicatedAttachments, session.imapFolderSyncStates)
			importMailParamsList.push(importMailParams)
		}
		switch (eventType) {
			case ImapSyncEventType.CREATE: {
				if (isEmpty(importMailParamsList)) {
					return Promise.resolve()
				}
				try {
					await this.importMailFacade.importMails(importMailParamsList, mailGroupId)
				} catch (error) {
					// we need to check the name instead of instanceof
					if (error.name === "SuspensionError") {
						console.log("SuspensionError while importing using imap importer ... ", error)
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTA_SERVER_SUSPENSION_POSTPONE_TIME)),
						)
					} else if (error.name === "InsufficientStorageError") {
						console.error("There was a storage error while importing using imap importer, postponing for a day ... ", error)
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTA_SERVER_STORAGE_ERROR_POSTPONE_TIME)),
						)
					} else if (error.name === "LockedError") {
						console.error(
							"There was a locked error while importing using imap importer, caused by two clients importing simultaneously. Stopping sync on this client ... ",
							error,
						)
						await this.imapSyncSystemFacade.stopSync(accountSyncStateId)
					} else {
						console.error("There was some unknown error while importing using imap importer ... ", error)
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTA_SERVER_ERROR_POSTPONE_TIME)),
						)
					}
				}
				break
			}
			case ImapSyncEventType.UPDATE:
				// We do not process updates because it is a one-way sync
				break
			case ImapSyncEventType.DELETE:
				// We do not process updates because it is a one-way sync
				break
		}
	}

	async onPostpone(accountSyncStateId: IdTuple, postponedUntil: number): Promise<void> {
		return await this.postponeImport(accountSyncStateId, new Date(postponedUntil))
	}

	async onFinish(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (session) {
			await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.FINISHED,
				MailboxMigrationFolderSyncStatus.FINISHED,
			)
		}
	}

	async onError(accountSyncStateId: IdTuple, imapError: ImapError): Promise<void> {
		console.error(`Error while synchronizing IMAP account with accountSyncState ${accountSyncStateId}, error`, imapError)
		return Promise.resolve()
	}

	async onEntityUpdatesReceived(updates: readonly EntityUpdateData[], groupId: Id) {
		for (const update of updates) {
			if (isUpdateForTypeRef(MailboxMigrationSyncStateTypeRef, update)) {
				const accountSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const idKey = this.getMailboxImportSessionsMapKey(accountSyncStateId)
				const accountSyncState = await this.mailboxMigrationFacade.getMailboxMigrationSyncStateById(accountSyncStateId)
				if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
					const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
					if (session) {
						session.mailboxMigrationSyncState = await this.mailboxMigrationFacade.getMailboxMigrationSyncStateById(accountSyncStateId)
						session.userMigrationInformation = await this.loadUserMigrationInformationForSyncState(
							accountSyncStateId,
							session.userMigrationInformation?._id,
						)
					} else {
						const folderSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(
							accountSyncState.mailboxMigrationFolderSyncStates,
						)
						const userMigrationInformation = await this.loadUserMigrationInformationForSyncState(accountSyncStateId)
						const session = newMailboxImportSession(accountSyncState, folderSyncStates, userMigrationInformation)
						this.mailboxImportSessions.set(idKey, session)
					}
				} else if (update.operation === OperationType.DELETE) {
					this.mailboxImportSessions.delete(idKey)
				}
			} else if (isUpdateForTypeRef(MailboxMigrationFolderSyncStateTypeRef, update)) {
				const folderSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const folderSyncState = await this.mailboxMigrationFacade.getImapFolderSyncStateById(folderSyncStateId)
				const idKey = this.getMailboxImportSessionsMapKey(folderSyncState.mailboxMigrationSyncState)
				const session = this.mailboxImportSessions.get(idKey)

				if (session) {
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						const folderSyncStateIndex = session.imapFolderSyncStates.findIndex((folderSyncState) =>
							isSameId(folderSyncState._id, folderSyncStateId),
						)
						if (folderSyncStateIndex !== -1) {
							session.imapFolderSyncStates[folderSyncStateIndex] = folderSyncState
						} else {
							session.imapFolderSyncStates.push(folderSyncState)
						}
					} else if (update.operation === OperationType.DELETE) {
						const folderSyncStateIndex = session.imapFolderSyncStates.findIndex((folderSyncState) =>
							isSameId(folderSyncState._id, folderSyncStateId),
						)
						if (folderSyncStateIndex !== -1) {
							session.imapFolderSyncStates.splice(folderSyncStateIndex, 1)
						}
					}

					this.mailboxImportSessions.set(idKey, session)
				}
			} else if (isUpdateForTypeRef(DeduplicatedImportedAttachmentTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					const idTuple = collapseId(update.instanceListId, update.instanceId) as IdTuple
					const deduplicatedImportedAttachment = await this.mailboxMigrationFacade.getDeduplicatedImportedAttachmentById(idTuple)
					const mailGroupId = assertNotNull(deduplicatedImportedAttachment._ownerGroup)
					const groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(mailGroupId) ?? new Map<string, Promise<IdTuple>>()
					groupMap.set(deduplicatedImportedAttachment.attachmentHash, Promise.resolve(deduplicatedImportedAttachment.attachment))
					this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, groupMap)
				} else if (update.operation === OperationType.DELETE) {
					const deduplicatedImportedAttachmentsListId = await this.mailboxMigrationFacade.getDeduplicatedImportedAttachmentListId(groupId)
					if (deduplicatedImportedAttachmentsListId) {
						const groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(groupId)
						if (groupMap) {
							const attachmentHash = this.fileElementIdToAttachmentHashMap.get(update.instanceId)
							if (attachmentHash) {
								groupMap.delete(attachmentHash)
								this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(groupId, groupMap)
							}
						}
					}
				}
			}
		}
	}
	// Visible for testing
	getMailboxImportSessionsMapKey(id: IdTuple): string {
		return id.join("/")
	}

	private getMailboxImportSessionOrNull(accountSyncId: IdTuple): MailboxImportSession | null {
		const session = this.mailboxImportSessions.get(this.getMailboxImportSessionsMapKey(accountSyncId))
		return session ?? null
	}

	async getImapImportSessions() {
		return Array.from(this.mailboxImportSessions.values())
	}

	async getMailboxImportUiSessions(): Promise<{ activeSessions: MailboxImportUiSession[]; canceledSessions: MailboxImportUiSession[] }> {
		const mailboxImportUiSessions: MailboxImportUiSession[] = Array.from(this.mailboxImportSessions.values()).map((session) => {
			const mailboxMigrationCredential = getMailboxMigrationCredential(session.mailboxMigrationSyncState, session.userMigrationInformation)
			return {
				provider: mailboxMigrationCredential.provider,
				mailboxMigrationSyncStateId: session.mailboxMigrationSyncState._id,
				mailGroupId: assertNotNull(session.mailboxMigrationSyncState._ownerGroup),
				username: mailboxMigrationCredential.username,
				mailboxMigrationSyncStatus: session.mailboxMigrationSyncState.status as MailboxMigrationSyncStatus,
				postponedUntil: new Date(parseInt(session.mailboxMigrationSyncState.postponedUntil)),
				syncProgress: {
					completed: session.imapFolderSyncStates.filter((folderSyncState) => folderSyncState.status === MailboxMigrationFolderSyncStatus.FINISHED)
						.length,
					total: session.imapFolderSyncStates.filter((folderSyncState) => folderSyncState.status !== MailboxMigrationFolderSyncStatus.NO_SYNC).length,
				},
				importedMailCount: parseInt(session.mailboxMigrationSyncState.importedMailCount ?? "0"),
			}
		})
		const [activeSessions, canceledSessions] = partition(
			mailboxImportUiSessions,
			(imapImportUiSession) => imapImportUiSession.mailboxMigrationSyncStatus !== MailboxMigrationSyncStatus.CANCELED,
		)
		return Promise.resolve({ activeSessions, canceledSessions })
	}
}
