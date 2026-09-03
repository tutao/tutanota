import { ImapCredentials, ImapMailboxState, ImapMailId, ImapSyncContext } from "../../../common/api/common/utils/imapImportUtils/ImapSyncContext.js"
import { ImapMailbox, ImapMailboxSpecialUse, ImapMailboxStatus } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapMail, ImapMailAttachment } from "../../../common/api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError } from "../../../common/api/common/error/ImapError.js"

import { assertNotNull, base64UrlCustomIdToString, getFirstOrThrow, isEmpty, partition, promiseMap, uint8ArrayToString } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"
import { ImapImportDataFile, ImapImportTutaFileId, ImportMailFacade, ImportMailParams } from "../../../common/api/worker/facades/lazy/ImportMailFacade"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { ImapImportSession, newImapImportSession } from "./ImapImportSession"
import { getImapConfigForProvider, ImapProvider, ImapTransport } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import {
	getFolderSyncStateForMailboxPath,
	imapAccountSyncStateToImapCredentials,
	imapMailToImportMailParams,
} from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, ImapSyncEventType } from "../../../../entities/tutanota/Utils"
import {
	DeduplicatedImportedAttachmentTypeRef,
	ImapAccount,
	ImapAccountSyncStateTypeRef,
	ImapFolderSyncState,
	ImapFolderSyncStateTypeRef,
	MailBox,
	ManageLabelServiceLabelData,
} from "@tutao/entities/tutanota"
import { collapseId, elementIdPart, isSameId, OperationType } from "@tutao/meta"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ImapFacade } from "../../../common/api/worker/facades/lazy/ImapFacade"
import { ImapSyncFacade, ImapSyncSystemFacade, M365SyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ImapImportUiSession } from "../../settings/imapimport/ImapMailImportController"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../platform-kit/instance-pipeline/RestClientOptions"

const DEFAULT_TUTA_SERVER_SUSPENSION_POSTPONE_TIME = 120 * 1000 // 120 seconds
const DEFAULT_TUTA_SERVER_STORAGE_ERROR_POSTPONE_TIME = 25 * 60 * 60 * 1000 // 25 hours
const DEFAULT_TUTA_SERVER_ERROR_POSTPONE_TIME = 60 * 1000 // 60 seconds

type BaseInitializeImapImportParams = {
	mailGroupId: Id
	imapAccount: ImapAccount
	provider: ImapProvider
	imapSyncLabelData: ManageLabelServiceLabelData | null
	maxQuota: string
}

export type MailSetMapping = { mailSetElementId: Id; shouldSync: boolean; specialUse: ImapMailboxSpecialUse | null }

export type InitializeImapImportParams =
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
		status: ImapAccountSyncStatus
		postponedUntil?: Date
	}
	remoteStateId: IdTuple
}

export class ImapImporter implements ImapSyncFacade {
	// key is the accountSyncState._id
	imapImportSessions: Map<string, ImapImportSession> = new Map()
	deduplicatedImportedAttachmentHashToFileIdByMailGroup: Map<Id, Map<string, Promise<IdTuple | undefined>>> = new Map()
	fileElementIdToAttachmentHashMap: Map<Id, string> = new Map()

	constructor(
		private readonly imapSyncSystemFacade: ImapSyncSystemFacade,
		private readonly m365SyncSystemFacade: M365SyncSystemFacade,
		private readonly imapFacade: ImapFacade,
		private readonly importMailFacade: ImportMailFacade,
	) {}

	private getSyncFacadeForProvider(provider: ImapProvider): ImapSyncSystemFacade | M365SyncSystemFacade {
		return getImapConfigForProvider(provider)?.transport === ImapTransport.GraphApi ? this.m365SyncSystemFacade : this.imapSyncSystemFacade
	}

	async init(mailboxes: MailBox[]) {
		for (const mailbox of mailboxes) {
			if (mailbox.imapAccountSyncStates) {
				const imapAccountSyncStates = await this.imapFacade.getAllImapAccountSyncStates(mailbox.imapAccountSyncStates)
				for (const accountSyncState of imapAccountSyncStates) {
					const imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(accountSyncState.imapFolderSyncStateList)
					const session = newImapImportSession(accountSyncState, imapFolderSyncStates)
					this.imapImportSessions.set(this.getImapImportSessionsMapKey(accountSyncState._id), session)
				}
			}
		}
	}

	async initializeNewImport(initializeParams: InitializeImapImportParams): Promise<ImapImportSession> {
		const { imapAccountSyncState, initialFolderSyncStates } = await this.imapFacade.initializeImapImport(initializeParams)
		const newSession = newImapImportSession(imapAccountSyncState, initialFolderSyncStates)
		this.imapImportSessions.set(this.getImapImportSessionsMapKey(imapAccountSyncState._id), newSession)
		return newSession
	}

	/**
	 * Reloads imapAccountSyncState from the server and updates the corresponding ImapImportSession
	 *
	 * @param imapAccountSyncStateId
	 */
	private async reloadImapImportSession(imapAccountSyncStateId: IdTuple) {
		const imapAccountSyncState = await this.imapFacade.getImapAccountSyncStateById(imapAccountSyncStateId, {
			...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
			cacheMode: CacheMode.WriteOnly,
		})
		const idKey = this.getImapImportSessionsMapKey(imapAccountSyncStateId)
		this.imapImportSessions.get(idKey)
		let session = this.getImapImportSessionOrNull(imapAccountSyncStateId)
		if (session) {
			session.imapAccountSyncState = imapAccountSyncState
		} else {
			const imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(imapAccountSyncState.imapFolderSyncStateList)
			session = newImapImportSession(imapAccountSyncState, imapFolderSyncStates)
			this.imapImportSessions.set(this.getImapImportSessionsMapKey(imapAccountSyncState._id), session)
		}
		return session
	}

	/**
	 * Attempts to continue an import from an existing state, it may return errors in case of failure.
	 */
	async continueImport(imapAccountSyncStateId: IdTuple, isForceRetry: boolean = false, retryAttempts = 0): Promise<ImportResult> {
		let session = await this.reloadImapImportSession(imapAccountSyncStateId)

		if (session.imapAccountSyncState.status === ImapAccountSyncStatus.CANCELED) {
			return Promise.resolve({
				state: { status: ImapAccountSyncStatus.CANCELED },
				remoteStateId: session.imapAccountSyncState._id,
			})
		}

		if (
			!isForceRetry &&
			session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED &&
			new Date(parseInt(session.imapAccountSyncState.postponedUntil)).getTime() > Date.now()
		) {
			return {
				state: {
					status: session.imapAccountSyncState.status as ImapAccountSyncStatus,
					postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
				},
				remoteStateId: session.imapAccountSyncState._id,
			}
		}

		// A second concurrent call for an already-RUNNING account (e.g. the periodic resync interval and
		// continueAllImportsAfterLogin firing close together) must not start another round: M365SyncSystemFacade's
		// startSync stops whatever is currently active for this accountSyncId before starting a new one, so without
		// this guard a concurrent call kills an in-progress M365 round after only its first folder(s).
		if (!isForceRetry && session.imapAccountSyncState.status === ImapAccountSyncStatus.RUNNING) {
			console.log(`continueImport: accountSyncState ${imapAccountSyncStateId} is already RUNNING, skipping duplicate start.`)
			return {
				state: { status: ImapAccountSyncStatus.RUNNING },
				remoteStateId: session.imapAccountSyncState._id,
			}
		}

		const imapCredentials = imapAccountSyncStateToImapCredentials(session.imapAccountSyncState)
		const maxQuota = parseInt(session.imapAccountSyncState.maxQuota)
		const imapMailboxStates = await this.getAllImapMailboxStates(session)
		const isGmail = (parseInt(session.imapAccountSyncState.provider) as ImapProvider) === ImapProvider.Gmail
		const imapSyncContext: ImapSyncContext = { imapCredentials, maxQuota, imapMailboxStates, isGmail }

		const mailGroupId = assertNotNull(session.imapAccountSyncState._ownerGroup)
		const hashToIdMap = await this.getImportedImapAttachmentHashToIdMap(session)
		this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, hashToIdMap)

		// Persist RUNNING before kicking off startSync, not after: ImapSyncSystemFacade.startSync resolves almost
		// immediately (ImapSyncSession fires off its per-mailbox chain without awaiting it), but
		// M365SyncSystemFacade.startSync awaits the *entire* per-folder loop before resolving. If RUNNING were
		// persisted afterwards, the account would stay at its stale pre-round status (POSTPONED/FINISHED) for the
		// whole M365 round, which reloadImapImportSession + the POSTPONED-expiry check above read fresh on every
		// call - a concurrent continueImport (periodic resync, login, retry) would then see that stale status,
		// consider it safe to start another round, and DesktopM365SyncSystemFacade.startSync's own
		// `await this.stopSync(accountSyncId)` would kill the still-running round after only its first folder(s).
		await this.imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
			session.imapAccountSyncState,
			ImapAccountSyncStatus.RUNNING,
			ImapFolderSyncStatus.RUNNING,
		)
		await this.getSyncFacadeForProvider(imapCredentials.provider).startSync(imapAccountSyncStateId, imapSyncContext)

		return Promise.resolve({
			state: { status: ImapAccountSyncStatus.RUNNING },
			remoteStateId: session.imapAccountSyncState._id,
		})
	}

	async pauseImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.stopSync(accountSyncStateId)
			await this.imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
				session.imapAccountSyncState,
				ImapAccountSyncStatus.PAUSED,
				ImapFolderSyncStatus.PAUSED,
			)
		}
	}

	async stopLocalImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			const provider = parseInt(session.imapAccountSyncState.provider) as ImapProvider
			await this.getSyncFacadeForProvider(provider).stopSync(session.imapAccountSyncState._id)
		}
	}

	async postponeImport(accountSyncStateId: IdTuple, postponedUntil: Date): Promise<void> {
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.stopSync(accountSyncStateId)
			await this.imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
				session.imapAccountSyncState,
				ImapAccountSyncStatus.POSTPONED,
				ImapFolderSyncStatus.PAUSED,
				postponedUntil.getTime().toString(),
			)
		}
	}

	async setGmailAllMailsImapDisabledOnImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.stopSync(accountSyncStateId)
			await this.imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
				session.imapAccountSyncState,
				ImapAccountSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR,
				ImapFolderSyncStatus.PAUSED,
				undefined,
			)
		}
	}

	async deleteImport(imapAccountSyncStateId: IdTuple): Promise<void> {
		await this.imapFacade.deleteImapImport(imapAccountSyncStateId)
		await this.stopSync(imapAccountSyncStateId)
		this.imapImportSessions.delete(this.getImapImportSessionsMapKey(imapAccountSyncStateId))
	}

	/** Stops whichever sync transport (IMAP or Microsoft Graph) is active for this account. */
	private async stopSync(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		const provider = session ? (parseInt(session.imapAccountSyncState.provider) as ImapProvider) : ImapProvider.Other
		await this.getSyncFacadeForProvider(provider).stopSync(accountSyncStateId)
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		return await this.getSyncFacadeForProvider(imapCredentials.provider).getImapMailboxesFromServer(imapCredentials)
	}

	private async getAllImapMailboxStates(session: ImapImportSession): Promise<ImapMailboxState[]> {
		const imapMailboxStates: ImapMailboxState[] = []
		const imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(session.imapAccountSyncState.imapFolderSyncStateList)

		for (const folderSyncState of imapFolderSyncStates) {
			const importedImapUidToImapMailId = new Map<number, ImapMailId>()
			const importedSourceIds = new Set<string>()
			if (!(folderSyncState.status === ImapFolderSyncStatus.NO_SYNC)) {
				const importedImapMails = await this.imapFacade.getImportedMails(folderSyncState.importedMails)
				for (const importedImapMail of importedImapMails) {
					// Every ImportedImapMail is identified by exactly one of sourceId (non-IMAP, e.g. Microsoft
					// Graph) or imapUid (IMAP) - mirrors correlationKeyFor in ImportMailFacade. imapUid is a
					// non-nullable server field for historical reasons, so its presence can't signal which case
					// applies; sourceId's presence is the only reliable signal.
					if (importedImapMail.sourceId !== null) {
						importedSourceIds.add(base64UrlCustomIdToString(importedImapMail.sourceId))
					} else {
						const imapUid = parseInt(assertNotNull(importedImapMail.imapUid))
						const importedImapMailId: ImapMailId = { uid: imapUid }
						if (importedImapMail.imapModSeq !== null) {
							importedImapMailId.modSeq = BigInt(importedImapMail.imapModSeq)
						}
						importedImapMailId.messageId = importedImapMail.messageId

						importedImapUidToImapMailId.set(imapUid, importedImapMailId)
					}
					session.importedMessageIds.add(importedImapMail.messageId)
				}
			}

			const imapMailboxState: ImapMailboxState = {
				path: folderSyncState.path,
				importedUidToMailIdsMap: importedImapUidToImapMailId,
				importedSourceIds,
				noSync: folderSyncState.status === ImapFolderSyncStatus.NO_SYNC,
			}
			imapMailboxState.uidNext = folderSyncState.uidnext ? parseInt(folderSyncState.uidnext) : undefined
			imapMailboxState.uidValidity = folderSyncState.uidvalidity ? BigInt(folderSyncState.uidvalidity) : undefined
			imapMailboxState.highestModSeq = folderSyncState.highestmodseq ? BigInt(folderSyncState.highestmodseq) : null

			imapMailboxStates.push(imapMailboxState)
		}

		return imapMailboxStates
	}

	private async getImportedImapAttachmentHashToIdMap(session: ImapImportSession): Promise<Map<string, Promise<IdTuple>>> {
		const importedImapAttachmentHashToIdMap = new Map<string, Promise<IdTuple>>()
		const importedImapAttachmentHashToIdMapList = await this.imapFacade.getDeduplicatedImportedAttachments(
			assertNotNull(session.imapAccountSyncState._ownerGroup),
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
	async performAttachmentDeduplication(session: ImapImportSession, imapMailAttachments: ImapMailAttachment[]) {
		const mailGroupId = assertNotNull(session.imapAccountSyncState._ownerGroup)
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
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		if (!session) {
			return Promise.resolve()
		}
		const isALLSystemFolder = imapMailbox.specialUse !== undefined && imapMailbox.specialUse === ImapMailboxSpecialUse.ALL
		const isGmail = (parseInt(session.imapAccountSyncState.provider) as ImapProvider) === ImapProvider.Gmail

		switch (eventType) {
			case ImapSyncEventType.CREATE: {
				let parentImportFolderId = isGmail && isALLSystemFolder ? null : session.imapAccountSyncState.rootImportMailSet
				let parentFolderSyncState: ImapFolderSyncState | null = null
				if (imapMailbox.parentFolder) {
					parentFolderSyncState = getFolderSyncStateForMailboxPath(imapMailbox.parentFolder.path, session.imapFolderSyncStates)
					parentImportFolderId = parentFolderSyncState?.mailSet ? parentFolderSyncState.mailSet : null
				}

				if (!session.imapFolderSyncStates.some((folder) => folder.path === imapMailbox.path)) {
					const shouldSync = parentFolderSyncState === null || parentFolderSyncState.status !== ImapFolderSyncStatus.NO_SYNC
					const shouldCreateLabels = isGmail && !isALLSystemFolder
					const folderSyncState = await this.imapFacade.initializeImapMailSet(
						imapMailbox,
						session.imapAccountSyncState,
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
				if (folderSyncStateForMailboxPath && folderSyncStateForMailboxPath.status !== ImapFolderSyncStatus.NO_SYNC) {
					await this.imapFacade.deleteImapFolderSyncState(folderSyncStateForMailboxPath._id)
				}
				break
			}
		}

		return Promise.resolve()
	}

	async onMailboxStatus(accountSyncStateId: IdTuple, imapMailboxStatus: ImapMailboxStatus): Promise<void> {
		const session = assertNotNull(this.getImapImportSessionOrNull(accountSyncStateId))
		const folderSyncState = getFolderSyncStateForMailboxPath(imapMailboxStatus.path, session.imapFolderSyncStates)
		if (folderSyncState !== null && folderSyncState.status !== ImapFolderSyncStatus.NO_SYNC) {
			// If the uidvalidity of a folder has changed, it means all IMAP uids are invalidated, and we cannot continue with the sync.
			// This should usually never happen, only with bad IMAP server implementations.
			if (folderSyncState.uidvalidity && !(folderSyncState.uidvalidity === imapMailboxStatus.uidValidity.toString())) {
				await this.imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
					session.imapAccountSyncState,
					ImapAccountSyncStatus.ERROR,
					ImapFolderSyncStatus.CANCELED,
					undefined,
				)
				console.error(
					`uidvalidity of a folder has changed for the account sync state ${accountSyncStateId} on mail group ${folderSyncState._ownerGroup}.`,
				)
			}
			await this.imapFacade.updateImapFolderSyncState(imapMailboxStatus, folderSyncState)
		}
	}

	async onMultipleMails(accountSyncStateId: IdTuple, imapMails: ImapMail[], eventType: ImapSyncEventType) {
		const session = assertNotNull(this.getImapImportSessionOrNull(accountSyncStateId))
		const mailGroupId = assertNotNull(session.imapAccountSyncState._ownerGroup)

		if (isEmpty(imapMails)) {
			return Promise.resolve()
		}

		const folderSyncState = getFolderSyncStateForMailboxPath(getFirstOrThrow(imapMails).belongsToMailbox.path, session.imapFolderSyncStates)
		if (folderSyncState === null || folderSyncState.status === ImapFolderSyncStatus.NO_SYNC) {
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
						await this.stopSync(accountSyncStateId)
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
		const session = this.getImapImportSessionOrNull(accountSyncStateId)
		if (session) {
			await this.imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
				session.imapAccountSyncState,
				ImapAccountSyncStatus.FINISHED,
				ImapFolderSyncStatus.FINISHED,
			)
		}
	}

	async onError(accountSyncStateId: IdTuple, imapError: ImapError): Promise<void> {
		console.error(`Error while synchronizing IMAP account with accountSyncState ${accountSyncStateId}, error`, imapError)
		return Promise.resolve()
	}

	async onEntityUpdatesReceived(updates: readonly EntityUpdateData[], groupId: Id) {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImapAccountSyncStateTypeRef, update)) {
				const accountSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const idKey = this.getImapImportSessionsMapKey(accountSyncStateId)
				const accountSyncState = await this.imapFacade.getImapAccountSyncStateById(accountSyncStateId)
				if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
					const session = this.getImapImportSessionOrNull(accountSyncStateId)
					if (session) {
						session.imapAccountSyncState = await this.imapFacade.getImapAccountSyncStateById(accountSyncStateId)
					} else {
						const folderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(accountSyncState.imapFolderSyncStateList)
						const session = newImapImportSession(accountSyncState, folderSyncStates)
						this.imapImportSessions.set(idKey, session)
					}
				} else if (update.operation === OperationType.DELETE) {
					this.imapImportSessions.delete(idKey)
				}
			} else if (isUpdateForTypeRef(ImapFolderSyncStateTypeRef, update)) {
				const folderSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const folderSyncState = await this.imapFacade.getImapFolderSyncStateById(folderSyncStateId)
				const idKey = this.getImapImportSessionsMapKey(folderSyncState.imapAccountSyncState)
				const session = this.imapImportSessions.get(idKey)

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

					this.imapImportSessions.set(idKey, session)
				}
			} else if (isUpdateForTypeRef(DeduplicatedImportedAttachmentTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					const idTuple = collapseId(update.instanceListId, update.instanceId) as IdTuple
					const deduplicatedImportedAttachment = await this.imapFacade.getDeduplicatedImportedAttachmentById(idTuple)
					const mailGroupId = assertNotNull(deduplicatedImportedAttachment._ownerGroup)
					const groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(mailGroupId) ?? new Map<string, Promise<IdTuple>>()
					groupMap.set(deduplicatedImportedAttachment.attachmentHash, Promise.resolve(deduplicatedImportedAttachment.attachment))
					this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, groupMap)
				} else if (update.operation === OperationType.DELETE) {
					const deduplicatedImportedAttachmentsListId = await this.imapFacade.getDeduplicatedImportedAttachmentListId(groupId)
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
	getImapImportSessionsMapKey(id: IdTuple): string {
		return id.join("/")
	}

	private getImapImportSessionOrNull(accountSyncId: IdTuple): ImapImportSession | null {
		const session = this.imapImportSessions.get(this.getImapImportSessionsMapKey(accountSyncId))
		return session ?? null
	}

	async getImapImportSessions() {
		return Array.from(this.imapImportSessions.values())
	}

	async getImapImportUiSessions(): Promise<{ activeSessions: ImapImportUiSession[]; canceledSessions: ImapImportUiSession[] }> {
		const imapImportUiSessions: ImapImportUiSession[] = Array.from(this.imapImportSessions.values()).map((session) => {
			return {
				provider: parseInt(session.imapAccountSyncState.provider) as ImapProvider,
				imapAccountSyncStateId: session.imapAccountSyncState._id,
				mailGroupId: assertNotNull(session.imapAccountSyncState._ownerGroup),
				sourceImapAddress: session.imapAccountSyncState.imapAccount.username,
				imapAccountSyncStatus: session.imapAccountSyncState.status as ImapAccountSyncStatus,
				postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
				syncProgress: {
					completed: session.imapFolderSyncStates.filter((folderSyncState) => folderSyncState.status === ImapFolderSyncStatus.FINISHED).length,
					total: session.imapFolderSyncStates.filter((folderSyncState) => folderSyncState.status !== ImapFolderSyncStatus.NO_SYNC).length,
				},
				importedMailCount: parseInt(session.imapAccountSyncState.importedMailCount ?? "0"),
			}
		})
		const [activeSessions, canceledSessions] = partition(
			imapImportUiSessions,
			(imapImportUiSession) => imapImportUiSession.imapAccountSyncStatus !== ImapAccountSyncStatus.CANCELED,
		)
		return Promise.resolve({ activeSessions, canceledSessions })
	}
}
