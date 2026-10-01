import {
	MigrationMailId,
	MigrationCredentials,
	MigrationMailboxState,
	MigrationSyncContext,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox, MigrationMailboxSpecialUse, MigrationMailboxStatus } from "../../../common/api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationMail, MigrationMailAttachment } from "../../../common/api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationError } from "../../../common/api/common/error/MigrationError.js"

import { assertNotNull, base64UrlCustomIdToString, getFirstOrThrow, isEmpty, partition, promiseMap, uint8ArrayToString } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"
import {
	MigrationImportDataFile,
	MigrationImportTutaFileId,
	ImportMailFacade,
	ImportMailParams,
} from "../../../common/api/worker/facades/lazy/ImportMailFacade"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { MailboxImportSession, newMailboxImportSession } from "./MailboxImportSession"
import { MailboxMigrationProvider } from "../../../common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import {
	findUserMigrationInfoForSyncState,
	getFolderSyncStateForMailboxPath,
	getMailboxMigrationCredential,
	migrationMailToImportMailParams,
	migrationSyncStateToMigrationCredentials,
} from "../../../common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { MailboxMigrationFolderSyncStatus, MailboxMigrationSyncStatus, MigrationSyncEventType } from "../../../../entities/tutanota/Utils"
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
import { MigrationSyncSystemFacade, MigrationSyncFacade } from "@tutao/native-bridge/generatedIpc/types"
import { MailboxMigrationUiSession } from "../../settings/migration/MailboxMigrationController"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../platform-kit/instance-pipeline/RestClientOptions"
import { UserFacade } from "../../../../platform-kit/base/facades/UserFacade"

const DEFAULT_TUTA_SERVER_SUSPENSION_POSTPONE_TIME = 120 * 1000 // 120 seconds
const DEFAULT_TUTA_SERVER_STORAGE_ERROR_POSTPONE_TIME = 25 * 60 * 60 * 1000 // 25 hours
const DEFAULT_TUTA_SERVER_ERROR_POSTPONE_TIME = 60 * 1000 // 60 seconds

type BaseInitializeMigrationParams = {
	mailGroupId: Id
	imapConfiguration: MailboxMigrationImapConfiguration
	provider: MailboxMigrationProvider
	migrationSyncLabelData: ManageLabelServiceLabelData | null
	credential: UserMigrationCredentialParams
}

export type MailSetMapping = { mailSetElementId: Id; shouldSync: boolean; specialUse: MigrationMailboxSpecialUse | null }

export type InitializeMigrationParams =
	| (BaseInitializeMigrationParams & {
			matchMigrationMailboxesToTutaMailSets: true
			migrationMailboxesToTutaMailSets: Map<string, MailSetMapping>
			rootImportMailSetName?: never
			spamFolderMigrationInformation?: never
	  })
	| (BaseInitializeMigrationParams & {
			matchMigrationMailboxesToTutaMailSets: false
			rootImportMailSetName: string
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: boolean
				spamMailbox: MigrationMailbox | null
			}
			migrationMailboxesToTutaMailSets?: never
	  })

export type ImportResult = {
	state: {
		status: MailboxMigrationSyncStatus
		postponedUntil?: Date
	}
	remoteStateId: IdTuple
}

export class MailboxImporter implements MigrationSyncFacade {
	// key is the mailboxMigrationSyncState._id
	mailboxImportSessions: Map<string, MailboxImportSession> = new Map()
	deduplicatedImportedAttachmentHashToFileIdByMailGroup: Map<Id, Map<string, Promise<IdTuple | undefined>>> = new Map()
	fileElementIdToAttachmentHashMap: Map<Id, string> = new Map()

	constructor(
		private readonly migrationSyncSystemFacade: MigrationSyncSystemFacade,
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

	async initializeNewImport(initializeParams: InitializeMigrationParams): Promise<MailboxImportSession> {
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

		const migrationCredentials = migrationSyncStateToMigrationCredentials(session.mailboxMigrationSyncState, session.userMigrationInformation)
		const migrationMailboxStates = await this.getAllMigrationMailboxStates(session)
		const isGmail = migrationCredentials.provider === MailboxMigrationProvider.Gmail
		const migrationSyncContext: MigrationSyncContext = {
			migrationCredentials: migrationCredentials,
			migrationMailboxStates: migrationMailboxStates,
			isGmail,
		}

		const mailGroupId = assertNotNull(session.mailboxMigrationSyncState._ownerGroup)
		const hashToIdMap = await this.getImportedMigrationAttachmentHashToIdMap(session)
		this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, hashToIdMap)

		await this.migrationSyncSystemFacade.startSync(mailboxMigrationSyncStateId, migrationSyncContext)

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
			await this.migrationSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
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
			await this.migrationSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
		}
	}

	async postponeImport(accountSyncStateId: IdTuple, postponedUntil: Date): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.migrationSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
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
			await this.migrationSyncSystemFacade.stopSync(session.mailboxMigrationSyncState._id)
			await this.mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.GMAIL_ALL_MAILS_IMAP_DISABLED_ERROR,
				MailboxMigrationFolderSyncStatus.PAUSED,
				undefined,
			)
		}
	}

	async deleteImport(mailboxMigrationSyncStateId: IdTuple): Promise<void> {
		await this.mailboxMigrationFacade.deleteMigrationImport(mailboxMigrationSyncStateId)
		await this.migrationSyncSystemFacade.stopSync(mailboxMigrationSyncStateId)
		this.mailboxImportSessions.delete(this.getMailboxImportSessionsMapKey(mailboxMigrationSyncStateId))
	}

	async getMigrationMailboxesFromServer(migrationCredentials: MigrationCredentials): Promise<ReadonlyArray<MigrationMailbox>> {
		return await this.migrationSyncSystemFacade.getMigrationMailboxes(migrationCredentials)
	}

	private async getAllMigrationMailboxStates(session: MailboxImportSession): Promise<MigrationMailboxState[]> {
		const migrationMailboxStates: MigrationMailboxState[] = []
		const mailboxMigrationFolderSyncStates = await this.mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(
			session.mailboxMigrationSyncState.mailboxMigrationFolderSyncStates,
		)

		for (const folderSyncState of mailboxMigrationFolderSyncStates) {
			const importedSourceIdToMigrationMailId = new Map<string, MigrationMailId>()
			if (!(folderSyncState.status === MailboxMigrationFolderSyncStatus.NO_SYNC)) {
				const importedMigrationMails = await this.mailboxMigrationFacade.getImportedMails(folderSyncState.importedMails)
				for (const importedMigrationMail of importedMigrationMails) {
					const migrationMailId: MigrationMailId = { sourceId: importedMigrationMail.sourceId }
					if (importedMigrationMail.imapModSeq !== null) {
						migrationMailId.modSeq = BigInt(importedMigrationMail.imapModSeq)
					}
					migrationMailId.messageId = importedMigrationMail.messageId
					session.importedMessageIds.add(importedMigrationMail.messageId)
				}
			}

			const migrationMailboxState: MigrationMailboxState = {
				path: folderSyncState.sourceId,
				importedSourceIdToMailIdsMap: importedSourceIdToMigrationMailId,
				noSync: folderSyncState.status === MailboxMigrationFolderSyncStatus.NO_SYNC,
			}
			migrationMailboxState.uidNext = folderSyncState.uidnext ? parseInt(folderSyncState.uidnext) : undefined
			migrationMailboxState.uidValidity = folderSyncState.uidvalidity ? BigInt(folderSyncState.uidvalidity) : undefined
			migrationMailboxState.highestModSeq = folderSyncState.highestmodseq ? BigInt(folderSyncState.highestmodseq) : null

			migrationMailboxStates.push(migrationMailboxState)
		}

		return migrationMailboxStates
	}

	private async getImportedMigrationAttachmentHashToIdMap(session: MailboxImportSession): Promise<Map<string, Promise<IdTuple>>> {
		const importedMigrationAttachmentHashToIdMap = new Map<string, Promise<IdTuple>>()
		const importedMigrationAttachmentHashToIdMapList = await this.mailboxMigrationFacade.getDeduplicatedImportedAttachments(
			assertNotNull(session.mailboxMigrationSyncState._ownerGroup),
		)

		for (const importedMigrationAttachmentHashToId of importedMigrationAttachmentHashToIdMapList) {
			const attachmentHash = importedMigrationAttachmentHashToId.attachmentHash
			const attachmentId = importedMigrationAttachmentHashToId.attachment
			importedMigrationAttachmentHashToIdMap.set(attachmentHash, Promise.resolve(attachmentId))
			this.fileElementIdToAttachmentHashMap.set(elementIdPart(attachmentId), attachmentHash)
		}

		return importedMigrationAttachmentHashToIdMap
	}

	// Visible for testing
	async performAttachmentDeduplication(session: MailboxImportSession, migrationMailAttachments: MigrationMailAttachment[]) {
		const mailGroupId = assertNotNull(session.mailboxMigrationSyncState._ownerGroup)
		let groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(mailGroupId)
		if (!groupMap) {
			groupMap = await this.getImportedMigrationAttachmentHashToIdMap(session)
			this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, groupMap)
		}
		return await promiseMap(migrationMailAttachments, async (migrationMailAttachment) => {
			// calculate fileHash to perform Migration import attachment de-duplication
			const fileHash = uint8ArrayToString("utf-8", sha256Hash(migrationMailAttachment.content))
			const groupMapLocal = assertNotNull(groupMap)
			if (groupMapLocal.has(fileHash)) {
				const attachmentId = await groupMapLocal.get(fileHash)
				if (attachmentId) {
					return {
						_type: "MigrationImportTutaFileId",
						_id: attachmentId,
					} as MigrationImportTutaFileId
				}
			}

			const deferredPromise = (async () => {
				const refreshedMap = await this.getImportedMigrationAttachmentHashToIdMap(session)
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
			const importDataFile: MigrationImportDataFile = {
				_type: "DataFile",
				name: migrationMailAttachment.filename ?? "unknown.txt",
				data: migrationMailAttachment.content,
				size: migrationMailAttachment.size,
				mimeType: migrationMailAttachment.mimeType,
				cid: migrationMailAttachment.cid,
				fileHash: fileHash,
			}
			return importDataFile
		})
	}

	async onMailbox(accountSyncStateId: IdTuple, migrationMailbox: MigrationMailbox, eventType: MigrationSyncEventType): Promise<void> {
		const session = this.getMailboxImportSessionOrNull(accountSyncStateId)
		if (!session) {
			return Promise.resolve()
		}
		const isALLSystemFolder = migrationMailbox.specialUse !== undefined && migrationMailbox.specialUse === MigrationMailboxSpecialUse.ALL
		const provider = getMailboxMigrationCredential(session.mailboxMigrationSyncState, session.userMigrationInformation).provider
		const isGmail = provider === MailboxMigrationProvider.Gmail

		switch (eventType) {
			case MigrationSyncEventType.CREATE: {
				let parentImportFolderId = isGmail && isALLSystemFolder ? null : session.mailboxMigrationSyncState.rootImportMailSet
				let parentFolderSyncState: MailboxMigrationFolderSyncState | null = null
				if (migrationMailbox.parentFolder) {
					parentFolderSyncState = getFolderSyncStateForMailboxPath(migrationMailbox.parentFolder.path, session.mailboxMigrationFolderSyncStates)
					parentImportFolderId = parentFolderSyncState?.mailSet ? parentFolderSyncState.mailSet : null
				}

				if (!session.mailboxMigrationFolderSyncStates.some((folder) => folder.sourceId === migrationMailbox.path)) {
					const shouldSync = parentFolderSyncState === null || parentFolderSyncState.status !== MailboxMigrationFolderSyncStatus.NO_SYNC
					const shouldCreateLabels = isGmail && !isALLSystemFolder
					const folderSyncState = await this.mailboxMigrationFacade.initializeMigrationMailSet(
						migrationMailbox,
						session.mailboxMigrationSyncState,
						provider,
						parentImportFolderId,
						shouldSync,
						shouldCreateLabels,
					)
					if (folderSyncState) {
						const folderSyncStateIndex = session.mailboxMigrationFolderSyncStates.findIndex((existingFolderSyncState) =>
							isSameId(existingFolderSyncState._id, folderSyncState._id),
						)
						// a CREATE entityEvent might have already added the folderSyncState to the session.mailboxMigrationFolderSyncStates list
						if (folderSyncStateIndex === -1) {
							session.mailboxMigrationFolderSyncStates.push(folderSyncState)
						}
					}
				}
				break
			}
			case MigrationSyncEventType.UPDATE:
				// We do not process updates because it is a one-way sync
				break
			case MigrationSyncEventType.DELETE: {
				const folderSyncStateForMailboxPath = getFolderSyncStateForMailboxPath(migrationMailbox.path, session.mailboxMigrationFolderSyncStates)
				if (folderSyncStateForMailboxPath && folderSyncStateForMailboxPath.status !== MailboxMigrationFolderSyncStatus.NO_SYNC) {
					await this.mailboxMigrationFacade.deleteMigrationFolderSyncState(folderSyncStateForMailboxPath._id)
				}
				break
			}
		}

		return Promise.resolve()
	}

	async onMailboxStatus(accountSyncStateId: IdTuple, migrationMailboxStatus: MigrationMailboxStatus): Promise<void> {
		const session = assertNotNull(this.getMailboxImportSessionOrNull(accountSyncStateId))
		const folderSyncState = getFolderSyncStateForMailboxPath(migrationMailboxStatus.path, session.mailboxMigrationFolderSyncStates)
		if (folderSyncState !== null && folderSyncState.status !== MailboxMigrationFolderSyncStatus.NO_SYNC) {
			// If the uidvalidity of a folder has changed, it means all IMAP uids are invalidated, and we cannot continue with the sync.
			// This should usually never happen, only with bad IMAP server implementations.
			if (folderSyncState.uidvalidity && !(folderSyncState.uidvalidity === migrationMailboxStatus.uidValidity.toString())) {
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
			await this.mailboxMigrationFacade.updateMigrationFolderSyncState(migrationMailboxStatus, folderSyncState)
		}
	}

	async onMultipleMails(accountSyncStateId: IdTuple, migrationMails: MigrationMail[], eventType: MigrationSyncEventType) {
		const session = assertNotNull(this.getMailboxImportSessionOrNull(accountSyncStateId))
		const mailGroupId = assertNotNull(session.mailboxMigrationSyncState._ownerGroup)

		if (isEmpty(migrationMails)) {
			return Promise.resolve()
		}

		const folderSyncState = getFolderSyncStateForMailboxPath(
			getFirstOrThrow(migrationMails).belongsToMailbox.path,
			session.mailboxMigrationFolderSyncStates,
		)
		if (folderSyncState === null || folderSyncState.status === MailboxMigrationFolderSyncStatus.NO_SYNC) {
			console.log("folder sync state is null or no sync")
			return Promise.resolve()
		}
		const importMailParamsList: ImportMailParams[] = []
		for (const migrationMail of migrationMails) {
			const deduplicatedAttachments = migrationMail.attachments ? await this.performAttachmentDeduplication(session, migrationMail.attachments) : []
			const importMailParams = migrationMailToImportMailParams(
				migrationMail,
				folderSyncState._id,
				deduplicatedAttachments,
				session.mailboxMigrationFolderSyncStates,
			)
			importMailParamsList.push(importMailParams)
		}
		switch (eventType) {
			case MigrationSyncEventType.CREATE: {
				if (isEmpty(importMailParamsList)) {
					return Promise.resolve()
				}
				try {
					await this.importMailFacade.importMails(importMailParamsList, mailGroupId)
				} catch (error) {
					// we need to check the name instead of instanceof
					if (error.name === "SuspensionError") {
						console.log("SuspensionError while importing using mailbox importer ... ", error)
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTA_SERVER_SUSPENSION_POSTPONE_TIME)),
						)
					} else if (error.name === "InsufficientStorageError") {
						console.error("There was a storage error while importing using mailbox importer, postponing for a day ... ", error)
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTA_SERVER_STORAGE_ERROR_POSTPONE_TIME)),
						)
					} else if (error.name === "LockedError") {
						console.error(
							"There was a locked error while importing using mailbox importer, caused by two clients importing simultaneously. Stopping sync on this client ... ",
							error,
						)
						await this.migrationSyncSystemFacade.stopSync(accountSyncStateId)
					} else {
						console.error("There was some unknown error while importing using mailbox importer ... ", error)
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTA_SERVER_ERROR_POSTPONE_TIME)),
						)
					}
				}
				break
			}
			case MigrationSyncEventType.UPDATE:
				// We do not process updates because it is a one-way sync
				break
			case MigrationSyncEventType.DELETE:
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

	async onError(accountSyncStateId: IdTuple, migrationError: MigrationError): Promise<void> {
		console.error(`Error while migrating account with accountSyncState ${accountSyncStateId}, error`, migrationError)
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
				const folderSyncState = await this.mailboxMigrationFacade.getMailboxMigrationFolderSyncStateById(folderSyncStateId)
				const idKey = this.getMailboxImportSessionsMapKey(folderSyncState.mailboxMigrationSyncState)
				const session = this.mailboxImportSessions.get(idKey)

				if (session) {
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						const folderSyncStateIndex = session.mailboxMigrationFolderSyncStates.findIndex((folderSyncState) =>
							isSameId(folderSyncState._id, folderSyncStateId),
						)
						if (folderSyncStateIndex !== -1) {
							session.mailboxMigrationFolderSyncStates[folderSyncStateIndex] = folderSyncState
						} else {
							session.mailboxMigrationFolderSyncStates.push(folderSyncState)
						}
					} else if (update.operation === OperationType.DELETE) {
						const folderSyncStateIndex = session.mailboxMigrationFolderSyncStates.findIndex((folderSyncState) =>
							isSameId(folderSyncState._id, folderSyncStateId),
						)
						if (folderSyncStateIndex !== -1) {
							session.mailboxMigrationFolderSyncStates.splice(folderSyncStateIndex, 1)
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

	async getMailboxImportSessions() {
		return Array.from(this.mailboxImportSessions.values())
	}

	async getMailboxImportUiSessions(): Promise<{ activeSessions: MailboxMigrationUiSession[]; canceledSessions: MailboxMigrationUiSession[] }> {
		const mailboxImportUiSessions: MailboxMigrationUiSession[] = Array.from(this.mailboxImportSessions.values()).map((session) => {
			const mailboxMigrationCredential = getMailboxMigrationCredential(session.mailboxMigrationSyncState, session.userMigrationInformation)
			return {
				provider: mailboxMigrationCredential.provider,
				mailboxMigrationSyncStateId: session.mailboxMigrationSyncState._id,
				mailGroupId: assertNotNull(session.mailboxMigrationSyncState._ownerGroup),
				username: mailboxMigrationCredential.username,
				mailboxMigrationSyncStatus: session.mailboxMigrationSyncState.status as MailboxMigrationSyncStatus,
				postponedUntil: new Date(parseInt(session.mailboxMigrationSyncState.postponedUntil)),
				syncProgress: {
					completed: session.mailboxMigrationFolderSyncStates.filter(
						(folderSyncState) => folderSyncState.status === MailboxMigrationFolderSyncStatus.FINISHED,
					).length,
					total: session.mailboxMigrationFolderSyncStates.filter(
						(folderSyncState) => folderSyncState.status !== MailboxMigrationFolderSyncStatus.NO_SYNC,
					).length,
				},
				importedMailCount: parseInt(session.mailboxMigrationSyncState.importedMailCount ?? "0"),
			}
		})
		const [activeSessions, canceledSessions] = partition(
			mailboxImportUiSessions,
			(mailboxImportUiSession) => mailboxImportUiSession.mailboxMigrationSyncStatus !== MailboxMigrationSyncStatus.CANCELED,
		)
		return Promise.resolve({ activeSessions, canceledSessions })
	}
}
