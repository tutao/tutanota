import { ImapCredentials, ImapMailboxState, ImapMailId, ImapSyncState } from "../../../common/api/common/utils/imapImportUtils/ImapSyncState.js"
import { ImapMailbox, ImapMailboxStatus } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapMail, ImapMailAttachment } from "../../../common/api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError } from "../../../common/api/common/utils/imapImportUtils/ImapError.js"

import { assertNotNull, first, getFirstOrThrow, isEmpty, promiseMap, uint8ArrayToString } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"
import { ImapImportDataFile, ImapImportTutaFileId, ImportMailFacade, ImportMailParams } from "../../../common/api/worker/facades/lazy/ImportMailFacade"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { ImapGetMailboxResult } from "../../../common/api/common/utils/imapImportUtils/ImapGetMailboxResult"
import { ImapImportSession } from "./ImapImportSession"
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
	ImapAccountSyncState,
	ImapAccountSyncStateTypeRef,
	ImapFolderSyncState,
	ImapFolderSyncStateTypeRef,
	ManageLabelServiceLabelData,
} from "@tutao/entities/tutanota"
import { collapseId, elementIdPart, isSameId, OperationType } from "@tutao/meta"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../../platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { ImapFacade } from "../../../common/api/worker/facades/lazy/ImapFacade"
import { ImapSyncFacade, ImapSyncSystemFacade } from "@tutao/native-bridge/generatedIpc/types"
import { ProgrammingError } from "@tutao/app-env"

const DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME = 120 * 1000 // 120 seconds

type BaseInitializeImapImportParams = {
	imapAccount: ImapAccount
	maxQuota: string
	imapSyncLabelData: ManageLabelServiceLabelData | null
	mailGroupId: Id
	provider: ImapProvider
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

export type ImapOk = {
	state: {
		status: ImapAccountSyncStatus
		postponedUntil?: Date
	}
	remoteStateId: IdTuple
}

export type ImportResult = {
	ok?: ImapOk
	error?: ImapError
}

export class ImapImporter implements ImapSyncFacade {
	// key is the accountSyncState._id
	activeImapImportSessions: Map<string, ImapImportSession> = new Map()
	deduplicatedImportedAttachmentHashToFileIdByMailGroup: Map<Id, Map<string, Promise<IdTuple | undefined>>> = new Map()

	constructor(
		private readonly imapSyncSystemFacade: ImapSyncSystemFacade,
		private readonly imapFacade: ImapFacade,
		private readonly importMailFacade: ImportMailFacade,
	) {}

	async initializeImport(initializeParams: InitializeImapImportParams): Promise<ImapImportSession> {
		let accountSyncState = await this.getImapAccountSyncState(initializeParams)

		if (accountSyncState == null) {
			accountSyncState = await this.imapFacade.initializeImapImport(initializeParams)
		}

		const session = new ImapImportSession(accountSyncState)
		session.imapMailboxesToTutaFolders = initializeParams.imapMailboxesToTutaMailSets ?? new Map()

		this.activeImapImportSessions.set(this.getImapImportSessionsMapKey(accountSyncState._id), session)

		return session
	}

	/**
	 * Attempts to continue an import from an existing state, it may return errors in case of failure.
	 */
	async continueImport(imapAccountSyncStateId: IdTuple): Promise<ImportResult> {
		const session = assertNotNull(this.getActiveImapImportSessionOrNull(imapAccountSyncStateId))
		if (session.imapAccountSyncState.status === ImapAccountSyncStatus.RUNNING) {
			return { ok: { state: { status: session.imapAccountSyncState.status }, remoteStateId: session.imapAccountSyncState._id } }
		}

		if (
			session.imapAccountSyncState.status === ImapAccountSyncStatus.POSTPONED &&
			new Date(parseInt(session.imapAccountSyncState.postponedUntil)).getTime() > Date.now()
		) {
			session.imapAccountSyncState.status = ImapAccountSyncStatus.POSTPONED
			return {
				ok: {
					state: {
						status: session.imapAccountSyncState.status as ImapAccountSyncStatus,
						postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
					},
					remoteStateId: session.imapAccountSyncState._id,
				},
			}
		}

		if (parseInt(session.imapAccountSyncState.postponedUntil) > Date.now()) {
			session.imapAccountSyncState.status = ImapAccountSyncStatus.POSTPONED
			return {
				ok: {
					state: {
						status: session.imapAccountSyncState.status as ImapAccountSyncStatus,
						postponedUntil: new Date(parseInt(session.imapAccountSyncState.postponedUntil)),
					},
					remoteStateId: session.imapAccountSyncState._id,
				},
			}
		}

		const imapAccount = imapAccountToImapCredentials(session.imapAccountSyncState.imapAccount)
		const maxQuota = parseInt(session.imapAccountSyncState.maxQuota)
		const imapMailboxStates = await this.getAllImapMailboxStates(session)
		const imapSyncState = new ImapSyncState(imapAccount, maxQuota, imapMailboxStates)

		const mailGroupId = assertNotNull(session.imapAccountSyncState._ownerGroup)
		const hashToIdMap = await this.getImportedImapAttachmentHashToIdMap(session)
		this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, hashToIdMap)

		const startImportError = await this.imapSyncSystemFacade.startSync(imapAccountSyncStateId, imapSyncState)

		if (startImportError !== null) {
			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState._id, ImapAccountSyncStatus.PAUSED)
			await this.imapFacade.updateAllImapFolderSyncStates(session.imapAccountSyncState._id, ImapFolderSyncStatus.PAUSED)
			return Promise.resolve({ error: startImportError })
		} else {
			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState._id, ImapAccountSyncStatus.RUNNING)
			session.imapAccountSyncState = await this.imapFacade.updateAllImapFolderSyncStates(session.imapAccountSyncState._id, ImapFolderSyncStatus.RUNNING)
			session.imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(session.imapAccountSyncState.imapFolderSyncStateList)
			return Promise.resolve({
				ok: { state: { status: session.imapAccountSyncState.status as ImapAccountSyncStatus }, remoteStateId: session.imapAccountSyncState._id },
			})
		}
	}

	async pauseImport(accountSyncStateId: IdTuple): Promise<void> {
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.imapAccountSyncState._id)
			await this.imapFacade.updateImapAccountSyncStateStatus(session.imapAccountSyncState._id, ImapAccountSyncStatus.PAUSED)
			session.imapAccountSyncState = await this.imapFacade.pauseRunningImapImportFolderSyncStates(session.imapAccountSyncState._id)
			session.imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(session.imapAccountSyncState.imapFolderSyncStateList)
		}
	}

	private async postponeImport(accountSyncStateId: IdTuple, postponedUntil: Date): Promise<void> {
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session !== null) {
			await this.imapSyncSystemFacade.stopSync(session.imapAccountSyncState._id)
			session.imapAccountSyncState = await this.imapFacade.postponeImapImport(postponedUntil, session.imapAccountSyncState?._id)
			session.imapFolderSyncStates = await this.imapFacade.getAllImapFolderSyncStates(session.imapAccountSyncState.imapFolderSyncStateList)
		}
	}

	async deleteImport(imapAccountSyncStateId: IdTuple): Promise<void> {
		await this.imapFacade.deleteImapImport(imapAccountSyncStateId)
		await this.imapSyncSystemFacade.stopSync(imapAccountSyncStateId)
		this.activeImapImportSessions.delete(this.getImapImportSessionsMapKey(imapAccountSyncStateId))
	}

	async getImapMailboxesFromServer(imapAccount: ImapCredentials): Promise<ImapGetMailboxResult> {
		return await this.imapSyncSystemFacade.getImapMailboxesFromServer(imapAccount)
	}

	async getActiveImapImportSessions(): Promise<Map<string, ImapImportSession>> {
		return Promise.resolve(this.activeImapImportSessions)
	}

	private async getImapAccountSyncState(initializeParams: InitializeImapImportParams) {
		return first(
			(await this.getImapAccountSyncStatesForMailGroup(initializeParams.mailGroupId)).filter(
				(accountSyncState) => accountSyncState.imapAccount.username === initializeParams.imapAccount.username,
			),
		)
	}

	private async getImapAccountSyncStatesForMailGroup(mailGroupId: Id): Promise<ImapAccountSyncState[]> {
		return await this.imapFacade.getImapAccountSyncStatesForMailGroup(mailGroupId)
	}

	private async loadAllImapFolderSyncStates(imapFolderSyncStateListId: Id): Promise<ImapFolderSyncState[]> {
		return await this.imapFacade.getAllImapFolderSyncStates(imapFolderSyncStateListId)
	}

	private async getAllImapMailboxStates(session: ImapImportSession): Promise<ImapMailboxState[]> {
		const imapMailboxStates: ImapMailboxState[] = []
		session.imapFolderSyncStates = await this.loadAllImapFolderSyncStates(session.imapAccountSyncState.imapFolderSyncStateList)

		for (const folderSyncState of session.imapFolderSyncStates) {
			const importedImapUidToImapMailId = new Map<number, ImapMailId>()
			const importedImapMails = await this.imapFacade.getImportedMails(folderSyncState.importedMails)
			for (const importedImapMail of importedImapMails) {
				const imapUid = parseInt(importedImapMail.imapUid)
				const importedImapMailId = new ImapMailId(imapUid)
				if (importedImapMail.imapModSeq !== null) {
					importedImapMailId.modSeq = BigInt(importedImapMail.imapModSeq)
				}
				importedImapMailId.messageId = importedImapMail.messageId
				session.importedMessageIds.add(importedImapMail.messageId)

				importedImapUidToImapMailId.set(imapUid, importedImapMailId)
			}

			const imapMailboxState = new ImapMailboxState(folderSyncState.path, importedImapUidToImapMailId)
			imapMailboxState.uidNext = folderSyncState.uidnext ? parseInt(folderSyncState.uidnext) : undefined
			imapMailboxState.uidValidity = folderSyncState.uidvalidity ? BigInt(folderSyncState.uidvalidity) : undefined
			imapMailboxState.highestModSeq = folderSyncState.highestmodseq ? BigInt(folderSyncState.highestmodseq) : null

			imapMailboxStates.push(imapMailboxState)
		}

		return imapMailboxStates
	}

	private async getImportedImapAttachmentHashToIdMap(session: ImapImportSession): Promise<Map<string, Promise<IdTuple>>> {
		const importedImapAttachmentHashToIdMap = new Map<string, Promise<IdTuple>>()
		const importedImapAttachmentHashToIdMapList = await this.imapFacade.getDeduplicatedImportedAttachmentsList(
			assertNotNull(session.imapAccountSyncState._ownerGroup),
		)

		for (const importedImapAttachmentHashToId of importedImapAttachmentHashToIdMapList) {
			const imapAttachmentHash = importedImapAttachmentHashToId.attachmentHash
			const attachmentId = importedImapAttachmentHashToId.attachment
			importedImapAttachmentHashToIdMap.set(imapAttachmentHash, Promise.resolve(attachmentId))
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

				const newFolderSyncState = await this.imapFacade.createImportMailFolder(
					imapMailbox,
					session.imapAccountSyncState,
					parentFolderId,
					session.imapMailboxesToTutaFolders ?? undefined,
				)

				if (newFolderSyncState) {
					session.imapFolderSyncStates?.push(newFolderSyncState)
					if (session.imapMailboxesToTutaFolders && !session.imapMailboxesToTutaFolders.has(imapMailbox.path)) {
						session.imapMailboxesToTutaFolders.set(imapMailbox.path, elementIdPart(newFolderSyncState.mailFolder))
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
				await this.imapFacade.deleteImapFolderSyncState(folderSyncState._id)
				throw new ProgrammingError(
					`uidvalidity of a folder has changed for the account sync state ${accountSyncStateId} on mail group ${folderSyncState._ownerGroup}.`,
				)
			}
			const newFolderSyncState = await this.imapFacade.updateImapFolderSyncState(imapMailboxStatus, folderSyncState)

			const index = session.imapFolderSyncStates.findIndex((folderSyncState) => folderSyncState.path === newFolderSyncState.path)
			session.imapFolderSyncStates[index] = newFolderSyncState
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

	async onFinish(accountSyncStateId: IdTuple, downloadedQuota: number): Promise<void> {
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session) {
			session.imapAccountSyncState.status = ImapAccountSyncStatus.FINISHED
			await this.imapFacade.updateImapAccountSyncStateStatus(accountSyncStateId, ImapAccountSyncStatus.FINISHED)
			await this.imapFacade.updateAllImapFolderSyncStates(accountSyncStateId, ImapFolderSyncStatus.FINISHED)
		}
	}

	async onError(accountSyncStateId: IdTuple, imapError: ImapError): Promise<void> {
		const session = this.getActiveImapImportSessionOrNull(accountSyncStateId)
		if (session) {
			await this.imapFacade.updateImapAccountSyncStateStatus(accountSyncStateId, ImapAccountSyncStatus.PAUSED)
		}
		console.error("Error while importing from IMAP, error:", accountSyncStateId, imapError)
		return Promise.resolve()
	}

	async entityEventsReceived(updates: readonly EntityUpdateData[]) {
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
						const imapImportSession = new ImapImportSession(accountSyncState)
						imapImportSession.imapFolderSyncStates = await this.loadAllImapFolderSyncStates(accountSyncState.imapFolderSyncStateList)
						this.activeImapImportSessions.set(idKey, imapImportSession)
					}
				} else if (update.operation === OperationType.DELETE) {
					this.activeImapImportSessions.delete(idKey)
				}
			} else if (isUpdateForTypeRef(ImapFolderSyncStateTypeRef, update)) {
				const folderSyncStateId = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const session = Array.from(this.activeImapImportSessions.values()).find((session) =>
					session.imapFolderSyncStates?.some((folderSyncState) => isSameId(folderSyncState._id, folderSyncStateId)),
				)
				if (session) {
					const folderSyncStateIndex = session.imapFolderSyncStates.findIndex((syncState) => isSameId(syncState._id, folderSyncStateId))
					if (update.operation === OperationType.CREATE || update.operation === OperationType.UPDATE) {
						const folderSyncState = await this.imapFacade.getImapFolderSyncStateById(folderSyncStateId)
						if (folderSyncStateIndex !== -1) {
							session.imapFolderSyncStates[folderSyncStateIndex] = folderSyncState
						} else {
							session.imapFolderSyncStates.push(folderSyncState)
						}
					} else if (update.operation === OperationType.DELETE && folderSyncStateIndex !== -1) {
						session.imapFolderSyncStates.splice(folderSyncStateIndex, 1)
					}
				}
			} else if (isUpdateForTypeRef(DeduplicatedImportedAttachmentTypeRef, update) && update.operation === OperationType.CREATE) {
				// TODO: we can remove this here and on the server
				const idTuple = collapseId(update.instanceListId, update.instanceId) as IdTuple
				const deduplicatedImportedAttachment = await this.imapFacade.getDeduplicatedImportedAttachmentById(idTuple)
				const mailGroupId = assertNotNull(deduplicatedImportedAttachment._ownerGroup)
				const groupMap = this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.get(mailGroupId) ?? new Map<string, Promise<IdTuple>>()
				groupMap.set(deduplicatedImportedAttachment.attachmentHash, Promise.resolve(deduplicatedImportedAttachment.attachment))
				this.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupId, groupMap)
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
}
