import { ImapCredentials, ImapMailboxState, ImapMailId } from "../../../common/api/common/utils/imapImportUtils/ImapSyncContext.js"
import { ImapMailbox, ImapMailboxStatus } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapMail, ImapMailAttachment } from "../../../common/api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError } from "../../../common/api/common/error/ImapError.js"

import { assertNotNull, getFirstOrThrow, isEmpty, promiseMap, uint8ArrayToString } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"
import { ImapImportDataFile, ImapImportTutaFileId, ImportMailFacade, ImportMailParams } from "../../../common/api/worker/facades/lazy/ImportMailFacade"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { ImapGetMailboxResult } from "../../../common/api/common/utils/imapImportUtils/ImapGetMailboxResult"
import { ImapImportSession, newImapImportSession } from "./ImapImportSession"
import { ImapProvider } from "../../../common/api/common/utils/imapImportUtils/ImapKnownConfigs"
import {
	getFolderSyncStateForMailboxPath,
	imapAccountToImapCredentials,
	imapMailToImportMailParams,
} from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, ImapSyncEventType } from "../../../../entities/tutanota/Utils"
import {
	DeduplicatedImportedAttachmentTypeRef,
	ImapAccount,
	ImapAccountSyncStateTypeRef,
	ImapFolderSyncStateTypeRef,
	MailBox,
	ManageLabelServiceLabelData,
} from "@tutao/entities/tutanota"
import { collapseId, elementIdPart, isSameId, OperationType } from "@tutao/meta"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ImapFacade } from "../../../common/api/worker/facades/lazy/ImapFacade"
import { ImapSyncFacade, ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { OAuthErrorHandler } from "../../settings/imapimport/oauth/OAuthErrorHandler"
import { ImapImportUiSession } from "../../settings/imapimport/ImapMailImportController"
import { FileTypeRef } from "@tutao/entities/sys"
import Id from "../../../../ui/translations/id"

const DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME = 120 * 1000 // 120 seconds

type BaseInitializeImapImportParams = {
	mailGroupId: Id
	imapAccount: ImapAccount
	provider: ImapProvider
	imapSyncLabelData: ManageLabelServiceLabelData | null
	maxQuota: string
}

export type InitializeImapImportParams =
	| (BaseInitializeImapImportParams & {
			matchImapMailboxesToTutaMailSets: true
			imapMailboxesToTutaMailSets: Map<string, Id>
			rootImportMailFolderName?: never
	  })
	| (BaseInitializeImapImportParams & {
			matchImapMailboxesToTutaMailSets: false
			rootImportMailFolderName: string
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
	activeImapImportSessions: Map<string, ImapImportSession> = new Map()
	deduplicatedImportedAttachmentHashToFileIdByMailGroup: Map<Id, Map<string, Promise<IdTuple | undefined>>> = new Map()
	fileElementIdToAttachmentHashMap: Map<Id, string> = new Map()

	constructor(
		private readonly imapSyncSystemFacade: ImapSyncSystemFacade,
		private readonly imapFacade: ImapFacade,
		private readonly importMailFacade: ImportMailFacade,
		private readonly oAuthErrorHandler: OAuthErrorHandler,
	) {}

	async init(mailboxes: MailBox[]) {
		for (const mailbox of mailboxes) {
			if (mailbox.imapAccountSyncStates) {
				const imapAccountSyncStates = await this.imapFacade.getAllImapAccountSyncStates(mailbox.imapAccountSyncStates)
				for (const accountSyncState of imapAccountSyncStates) {
					const imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(accountSyncState.imapFolderSyncStateList)
					const session = newImapImportSession(accountSyncState, imapFolderSyncStates)
					this.activeImapImportSessions.set(this.getImapImportSessionsMapKey(accountSyncState._id), session)
				}
			}
		}
	}

	async initializeNewImport(initializeParams: InitializeImapImportParams): Promise<ImapImportSession> {
		const imapAccountSyncState = await this.imapFacade.initializeImapImport(initializeParams)
		const imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(imapAccountSyncState.imapFolderSyncStateList)

		const newSession = newImapImportSession(imapAccountSyncState, imapFolderSyncStates)
		this.activeImapImportSessions.set(this.getImapImportSessionsMapKey(imapAccountSyncState._id), newSession)

		return newSession
	}

	/**
	 * Attempts to continue an import from an existing state, it may return errors in case of failure.
	 */
	async continueImport(imapAccountSyncStateId: IdTuple, retryAttempts = 0): Promise<ImportResult> {
		let session = assertNotNull(this.getActiveImapImportSessionOrNull(imapAccountSyncStateId))

		if (
			session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED &&
			new Date(parseInt(session.imapAccountSyncState.postponedUntil)).getTime() > Date.now()
		) {
			session.imapAccountSyncState.status = ImapAccountSyncStatus.POSTPONED
			return {
				state: {
					status: session.imapAccountSyncState.status as ImapAccountSyncStatus,
					postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
				},
				remoteStateId: session.imapAccountSyncState._id,
			}
		}

		if (parseInt(session.imapAccountSyncState.postponedUntil) > Date.now()) {
			session.imapAccountSyncState.status = ImapAccountSyncStatus.POSTPONED
			return {
				state: {
					status: session.imapAccountSyncState.status as ImapAccountSyncStatus,
					postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
				},
				remoteStateId: session.imapAccountSyncState._id,
			}
		}

		const imapCredentials = imapAccountToImapCredentials(session.imapAccountSyncState.imapAccount)
		const maxQuota = parseInt(session.imapAccountSyncState.maxQuota)
		const imapMailboxStates = await this.getAllImapMailboxStates(session)
		const imapSyncContext = { imapCredentials, maxQuota, imapMailboxStates }

		const mailGroupId = assertNotNull(session.imapAccountSyncState._ownerGroup)
		const hashToIdMap = await this.getImportedImapAttachmentHashToIdMap(session)
		this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, hashToIdMap)

		try {
			await this.imapSyncSystemFacade.startSync(imapAccountSyncStateId, imapSyncContext)

			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState, ImapAccountSyncStatus.RUNNING)
			await this.imapFacade.updateAllImapFolderSyncStates(session.imapAccountSyncState._id, ImapFolderSyncStatus.RUNNING)
			return Promise.resolve({
				state: { status: ImapAccountSyncStatus.RUNNING },
				remoteStateId: session.imapAccountSyncState._id,
			})
		} catch (imapError) {
			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState, ImapAccountSyncStatus.PAUSED)
			await this.imapFacade.updateAllImapFolderSyncStates(session.imapAccountSyncState._id, ImapFolderSyncStatus.PAUSED)
			if (this.oAuthErrorHandler.isAuthError(imapError) && retryAttempts < 1) {
				const shouldRetry = await this.oAuthErrorHandler.handleAuthError(session.imapAccountSyncState)
				if (shouldRetry) {
					return await this.continueImport(imapAccountSyncStateId, 1)
				}
			}
			return Promise.reject(imapError)
		}
	}

	async pauseImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.imapAccountSyncState._id)
			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState, ImapAccountSyncStatus.PAUSED)
			await this.imapFacade.pauseRunningImapImportFolderSyncStates(session.imapAccountSyncState._id)
		}
	}

	private async postponeImport(accountSyncStateId: IdTuple, postponedUntil: Date): Promise<void> {
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.imapAccountSyncState._id)
			await this.imapFacade.postponeImapImport(postponedUntil, session.imapAccountSyncState?._id)
		}
	}

	async deleteImport(imapAccountSyncStateId: IdTuple): Promise<void> {
		await this.imapFacade.deleteImapImport(imapAccountSyncStateId)
		await this.imapSyncSystemFacade.stopSync(imapAccountSyncStateId)
		this.activeImapImportSessions.delete(this.getImapImportSessionsMapKey(imapAccountSyncStateId))
	}

	async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ImapGetMailboxResult> {
		return await this.imapSyncSystemFacade.getImapMailboxesFromServer(imapCredentials)
	}

	private async getAllImapMailboxStates(session: ImapImportSession): Promise<ImapMailboxState[]> {
		const imapMailboxStates: ImapMailboxState[] = []
		const imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(session.imapAccountSyncState.imapFolderSyncStateList)

		for (const folderSyncState of imapFolderSyncStates) {
			const importedImapUidToImapMailId = new Map<number, ImapMailId>()
			const importedImapMails = await this.imapFacade.getImportedMails(folderSyncState.importedMails)
			for (const importedImapMail of importedImapMails) {
				const imapUid = parseInt(importedImapMail.imapUid)
				const importedImapMailId: ImapMailId = { uid: imapUid }
				if (importedImapMail.imapModSeq !== null) {
					importedImapMailId.modSeq = BigInt(importedImapMail.imapModSeq)
				}
				importedImapMailId.messageId = importedImapMail.messageId
				session.importedMessageIds.add(importedImapMail.messageId)

				importedImapUidToImapMailId.set(imapUid, importedImapMailId)
			}

			const imapMailboxState: ImapMailboxState = { path: folderSyncState.path, importedUidToMailIdsMap: importedImapUidToImapMailId }
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
			if (groupMap.has(fileHash)) {
				const attachmentId = await groupMap.get(fileHash)
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
				groupMap.set(fileHash, Promise.resolve(attachmentId))
				return attachmentId
			})()

			groupMap.set(fileHash, deferredPromise)
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
		const session = assertNotNull(this.getActiveImapImportSessionOrNull(accountSyncStateId))

		switch (eventType) {
			case ImapSyncEventType.CREATE: {
				let parentFolderId = session.imapAccountSyncState.rootImportMailFolder

				if (imapMailbox.parentFolder) {
					const parentFolderSyncState = getFolderSyncStateForMailboxPath(imapMailbox.parentFolder.path, session.imapFolderSyncStates ?? [])
					parentFolderId = parentFolderSyncState?.mailFolder ? parentFolderSyncState.mailFolder : null
				}

				if (!session.imapFolderSyncStates.some((folder) => folder.path === imapMailbox.path)) {
					const folderSyncState = await this.imapFacade.createImportMailFolder(imapMailbox, session.imapAccountSyncState, parentFolderId)
					if (folderSyncState) {
						const folderSyncStateIndex = session.imapFolderSyncStates.findIndex((imapFolderSyncState) =>
							isSameId(folderSyncState._id, imapFolderSyncState._id),
						)
						// an CREATE entityEvent might have already added the folderSyncState to the session.imapFolderSyncStates list
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
				if (folderSyncStateForMailboxPath) {
					await this.imapFacade.deleteImapFolderSyncState(folderSyncStateForMailboxPath._id)
				}
				break
			}
		}

		return Promise.resolve()
	}

	async onMailboxStatus(accountSyncStateId: IdTuple, imapMailboxStatus: ImapMailboxStatus): Promise<void> {
		const session = assertNotNull(this.getActiveImapImportSessionOrNull(accountSyncStateId))
		const folderSyncState = getFolderSyncStateForMailboxPath(imapMailboxStatus.path, session.imapFolderSyncStates)
		if (folderSyncState !== null) {
			// If the uidvalidity of a folder has changed, it means all IMAP uids are invalidated, and we cannot continue with the sync.
			// This should usually never happen, only with bad IMAP server implementations.
			if (folderSyncState.uidvalidity && !(folderSyncState.uidvalidity === imapMailboxStatus.uidValidity.toString())) {
				await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState, ImapAccountSyncStatus.ERROR)
				await this.imapFacade.deleteImapFolderSyncState(folderSyncState._id)
				console.error(
					`uidvalidity of a folder has changed for the account sync state ${accountSyncStateId} on mail group ${folderSyncState._ownerGroup}.`,
				)
			}

			await this.imapFacade.updateImapFolderSyncState(imapMailboxStatus, folderSyncState)
		}
	}

	async onMultipleMails(accountSyncStateId: IdTuple, imapMails: ImapMail[], eventType: ImapSyncEventType) {
		const session = assertNotNull(this.getActiveImapImportSessionOrNull(accountSyncStateId))
		if (isEmpty(imapMails)) {
			return Promise.resolve()
		}

		const folderSyncState = getFolderSyncStateForMailboxPath(getFirstOrThrow(imapMails).belongsToMailbox.path, session.imapFolderSyncStates)
		const importMailParamsList: ImportMailParams[] = []
		for (const imapMail of imapMails) {
			if (folderSyncState) {
				const deduplicatedAttachments = imapMail.attachments ? await this.performAttachmentDeduplication(session, imapMail.attachments) : []
				const importMailParams = imapMailToImportMailParams(imapMail, folderSyncState._id, deduplicatedAttachments)
				// we don't want to import mails that are already imported
				// CREATE events are also triggered if the mail has been moved or copied
				const messageId = imapMail.envelope?.messageId
				if (messageId && !session.importedMessageIds.has(messageId)) {
					importMailParamsList.push(importMailParams)
				}
			}
		}
		switch (eventType) {
			case ImapSyncEventType.CREATE: {
				if (isEmpty(importMailParamsList)) {
					return Promise.resolve()
				}
				try {
					await this.importMailFacade.importMails(importMailParamsList, assertNotNull(folderSyncState?._ownerGroup))
				} catch (error) {
					// we need to check the name instead of instanceof
					if (error.name === "SuspensionError") {
						await this.postponeImport(
							accountSyncStateId,
							new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME)),
						)
					} else {
						console.log("There was some unknown error while importing using imap importer ... ", error)
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
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session) {
			session.imapAccountSyncState.status = ImapAccountSyncStatus.FINISHED
			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState, ImapAccountSyncStatus.FINISHED)
			await this.imapFacade.updateAllImapFolderSyncStates(accountSyncStateId, ImapFolderSyncStatus.FINISHED)
		}
	}

	async onError(accountSyncStateId: IdTuple, imapError: ImapError): Promise<void> {
		console.error("Error while importing from IMAP, error:", accountSyncStateId, imapError)

		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session) {
			await this.pauseImport(accountSyncStateId)
			if (this.oAuthErrorHandler.isAuthError(imapError)) {
				const shouldRetry = await this.oAuthErrorHandler.handleAuthError(session.imapAccountSyncState)
				if (shouldRetry) {
					this.continueImport(accountSyncStateId)
				}
			} else {
				//
			}
		}
		return Promise.resolve()
	}

	async entityEventsReceived(updates: readonly EntityUpdateData[], groupId: Id) {
		for (const update of updates) {
			if (isUpdateForTypeRef(ImapAccountSyncStateTypeRef, update)) {
				const accountSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const idKey = this.getImapImportSessionsMapKey(accountSyncStateId)
				if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
					const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
					if (session) {
						session.imapAccountSyncState = await this.imapFacade.getImapAccountSyncStateById(accountSyncStateId)
					} else {
						const accountSyncState = await this.imapFacade.getImapAccountSyncStateById(accountSyncStateId)
						const folderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(accountSyncState.imapFolderSyncStateList)
						const session = newImapImportSession(accountSyncState, folderSyncStates)
						this.activeImapImportSessions.set(idKey, session)
					}
				} else if (update.operation === OperationType.DELETE) {
					this.activeImapImportSessions.delete(idKey)
				}
			} else if (isUpdateForTypeRef(ImapFolderSyncStateTypeRef, update)) {
				const folderSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const folderSyncState = await this.imapFacade.getImapFolderSyncStateById(folderSyncStateId)
				const idKey = this.getImapImportSessionsMapKey(folderSyncState.imapAccountSyncState)
				const session = this.activeImapImportSessions.get(idKey)

				if (session) {
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						const folderSyncStateIndex = session.imapFolderSyncStates.findIndex((folderSyncState) =>
							isSameId(folderSyncState._id, folderSyncStateId),
						)
						console.log("folder sync state index", folderSyncStateIndex)
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

					this.activeImapImportSessions.set(idKey, session)
				}
			} else if (isUpdateForTypeRef(DeduplicatedImportedAttachmentTypeRef, update)) {
				if (update.operation === OperationType.CREATE) {
					const idTuple = collapseId(update.instanceListId, update.instanceId) as IdTuple
					const deduplicatedImportedAttachment = await this.imapFacade.getDeduplicatedImportedAttachmentById(idTuple)
					const mailGroupId = assertNotNull(deduplicatedImportedAttachment._ownerGroup)
					const groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(mailGroupId) ?? new Map<string, Promise<IdTuple>>()
					groupMap.set(deduplicatedImportedAttachment.attachmentHash, Promise.resolve(deduplicatedImportedAttachment.attachment))
					this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, groupMap)
				}
			} else if (isUpdateForTypeRef(FileTypeRef, update)) {
				if (update.operation === OperationType.DELETE) {
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
	private getActiveImapImportSessionOrNull(accountSyncId: IdTuple): ImapImportSession | null {
		const session = this.activeImapImportSessions.get(this.getImapImportSessionsMapKey(accountSyncId))
		return session ?? null
	}

	async getActiveImapImportSessions() {
		return Array.from(this.activeImapImportSessions.values())
	}

	async getActiveImapImportUiSessions(): Promise<ImapImportUiSession[]> {
		return Promise.resolve(
			Array.from(this.activeImapImportSessions.values()).map((session) => {
				return {
					imapAccountSyncStateId: session.imapAccountSyncState._id,
					mailGroupId: assertNotNull(session.imapAccountSyncState._ownerGroup),
					sourceImapAddress: session.imapAccountSyncState.imapAccount.username,
					imapAccountSyncStatus: session.imapAccountSyncState.status as ImapAccountSyncStatus,
					postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
					syncProgress: {
						completed: session.imapFolderSyncStates.filter((folderSyncState) => folderSyncState.status === ImapFolderSyncStatus.FINISHED).length,
						total: session.imapFolderSyncStates.length,
					},
				}
			}),
		)
	}
}
