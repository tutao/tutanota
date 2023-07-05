import { AdSyncEventType } from "../../../desktop/imapimport/adsync/AdSyncEventListener"
import { ImportImapAccountSyncState, ImportImapFolderSyncState, MailFolder } from "../../entities/tutanota/TypeRefs.js"
import { ImportImapFacade } from "../facades/lazy/ImportImapFacade.js"
import { ImapImportDataFile, ImapImportTutanotaFileId, ImportMailFacade } from "../facades/lazy/ImportMailFacade.js"
import { ImapImportState, ImportState } from "./ImapImportState.js"
import { getFolderSyncStateForMailboxPath, imapMailToImportMailParams, importImapAccountToImapAccount } from "./ImapImportUtils.js"
import { ImapMailboxState, ImapMailIds, ImapSyncState } from "../../../desktop/imapimport/adsync/ImapSyncState.js"
import { ImapMailbox, ImapMailboxStatus } from "../../../desktop/imapimport/adsync/imapmail/ImapMailbox.js"
import { ProgrammingError } from "../../common/error/ProgrammingError.js"
import { ImapMail, ImapMailAttachment } from "../../../desktop/imapimport/adsync/imapmail/ImapMail.js"
import { ImapError } from "../../../desktop/imapimport/adsync/imapmail/ImapError.js"
import { ImapImportSystemFacade } from "../../../native/common/generatedipc/ImapImportSystemFacade.js"
import { ImapImportFacade } from "../../../native/common/generatedipc/ImapImportFacade.js"
import { uint8ArrayToString } from "@tutao/tutanota-utils"
import { sha256Hash } from "@tutao/tutanota-crypto"
import { MaybePromise } from "rollup"
import { SuspensionError } from "../../common/error/SuspensionError.js"

const DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME = 120 * 1000 // 120 seconds

export interface InitializeImapImportParams {
	/** hostname of the imap server to import mail from */
	host: string
	/** imap port of the host */
	port: string
	username: string
	password: string | null
	accessToken: string | null
	maxQuota: string
	rootImportMailFolderName: string
}

export class ImapImporter implements ImapImportFacade {
	private imapImportState: ImapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
	private importImapAccountSyncState: ImportImapAccountSyncState | null = null
	private importImapFolderSyncStates?: ImportImapFolderSyncState[]
	private importedImapAttachmentHashToIdMap?: Map<string, MaybePromise<IdTuple | undefined>>

	constructor(
		private readonly imapImportSystemFacade: ImapImportSystemFacade,
		private readonly importImapFacade: ImportImapFacade,
		private readonly importMailFacade: ImportMailFacade,
	) {}

	async initializeImport(initializeParams: InitializeImapImportParams): Promise<ImapImportState> {
		let importImapAccountSyncState = await this.loadImportImapAccountSyncState()

		if (importImapAccountSyncState == null) {
			this.importImapAccountSyncState = await this.importImapFacade.initializeImapImport(initializeParams)
		} else {
			this.importImapAccountSyncState = await this.importImapFacade.updateImapImport(initializeParams, importImapAccountSyncState)
		}

		this.imapImportState = new ImapImportState(ImportState.PAUSED)
		return this.imapImportState
	}

	async continueImport(): Promise<ImapImportState> {
		if (this.imapImportState.state == ImportState.RUNNING) {
			return this.imapImportState
		}

		if (this.imapImportState.state == ImportState.POSTPONED && this.imapImportState.postponedUntil.getTime() > Date.now()) {
			this.imapImportState.state = ImportState.POSTPONED
			return this.imapImportState
		}

		this.importImapAccountSyncState = await this.loadImportImapAccountSyncState()

		if (this.importImapAccountSyncState == null) {
			this.imapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
			return this.imapImportState
		}

		let postponedUntil = this.importImapAccountSyncState?.postponedUntil
		if (postponedUntil) {
			this.imapImportState.postponedUntil = new Date(postponedUntil)
		}

		if (this.imapImportState.postponedUntil.getTime() > Date.now()) {
			this.imapImportState.state = ImportState.POSTPONED
			return this.imapImportState
		}

		let imapAccount = importImapAccountToImapAccount(this.importImapAccountSyncState.imapAccount)
		let maxQuota = parseInt(this.importImapAccountSyncState.maxQuota)
		let imapMailboxStates = await this.getAllImapMailboxStates(this.importImapAccountSyncState.imapFolderSyncStateList)
		let imapSyncState = new ImapSyncState(imapAccount, maxQuota, imapMailboxStates)

		this.importedImapAttachmentHashToIdMap = await this.getImportedImapAttachmentHashToIdMap()

		await this.imapImportSystemFacade.startImport(imapSyncState)

		this.imapImportState = new ImapImportState(ImportState.RUNNING)
		return this.imapImportState
	}

	async pauseImport(): Promise<ImapImportState> {
		await this.imapImportSystemFacade.stopImport()
		this.imapImportState = new ImapImportState(ImportState.PAUSED)
		return this.imapImportState
	}

	async postponeImport(postponedUntil: Date): Promise<ImapImportState> {
		await this.imapImportSystemFacade.stopImport()

		if (this.importImapAccountSyncState != null) {
			await this.importImapFacade.postponeImapImport(postponedUntil, this.importImapAccountSyncState?._id)
			this.imapImportState = new ImapImportState(ImportState.POSTPONED, postponedUntil)
		} else {
			this.imapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
		}

		return this.imapImportState
	}

	async deleteImport(): Promise<boolean> {
		// TODO delete import
		return true
	}

	async loadRootImportFolder(): Promise<MailFolder | null> {
		if (this.importImapAccountSyncState?.rootImportMailFolder == null) {
			return Promise.resolve(null)
		}

		return this.importImapFacade.getRootImportFolder(this.importImapAccountSyncState?.rootImportMailFolder)
	}

	async loadImportImapAccountSyncState(): Promise<ImportImapAccountSyncState | null> {
		return this.importImapFacade.getImportImapAccountSyncState()
	}

	loadImapImportState(): ImapImportState {
		return this.imapImportState
	}

	private async loadAllImportImapFolderSyncStates(importImapFolderSyncStateListId: Id): Promise<ImportImapFolderSyncState[]> {
		if (this.importImapAccountSyncState == null) {
			throw new ProgrammingError("ImportImapAccountSyncState not initialized!")
		}
		return this.importImapFacade.getAllImportImapFolderSyncStates(importImapFolderSyncStateListId)
	}

	private async getAllImapMailboxStates(importImapFolderSyncStateListId: Id): Promise<ImapMailboxState[]> {
		let imapMailboxStates: ImapMailboxState[] = []
		this.importImapFolderSyncStates = await this.loadAllImportImapFolderSyncStates(importImapFolderSyncStateListId)

		for (const folderSyncState of this.importImapFolderSyncStates) {
			let importedImapUidToMailIdsMap = new Map<number, ImapMailIds>()
			let importedImapUidToMailIdMapList = await this.importImapFacade.getImportedImapUidToMailIdsMapList(folderSyncState.importedImapUidToMailIdsMap)
			importedImapUidToMailIdMapList.forEach((importImapUidToMailIds) => {
				let imapUid = parseInt(importImapUidToMailIds.imapUid)
				let importedImapMailIds = new ImapMailIds(imapUid)
				if (importImapUidToMailIds.imapModSeq != null) {
					importedImapMailIds.modSeq = BigInt(importImapUidToMailIds.imapModSeq)
				}
				importedImapMailIds.externalMailId = importImapUidToMailIds.mail

				importedImapUidToMailIdsMap.set(imapUid, importedImapMailIds)
			})

			let imapMailboxState = new ImapMailboxState(folderSyncState.path, importedImapUidToMailIdsMap)
			imapMailboxState.uidNext = folderSyncState.uidnext ? parseInt(folderSyncState.uidnext) : undefined
			imapMailboxState.uidValidity = folderSyncState.uidvalidity ? BigInt(folderSyncState.uidvalidity) : undefined
			imapMailboxState.highestModSeq = folderSyncState.highestmodseq ? BigInt(folderSyncState.highestmodseq) : null

			imapMailboxStates.push(imapMailboxState)
		}

		return imapMailboxStates
	}

	private async getImportedImapAttachmentHashToIdMap(): Promise<Map<string, MaybePromise<IdTuple>>> {
		if (this.importImapAccountSyncState == null) {
			throw new ProgrammingError("ImportImapAccountSyncState not initialized!")
		}

		let importedImapAttachmentHashToIdMap = new Map<string, MaybePromise<IdTuple>>()
		let importedImapAttachmentHashToIdMapList = await this.importImapFacade.getImportedImapAttachmentHashToIdMapList(
			this.importImapAccountSyncState.importedImapAttachmentHashToIdMap,
		)

		importedImapAttachmentHashToIdMapList.forEach((importedImapAttachmentHashToId) => {
			let imapAttachmentHash = importedImapAttachmentHashToId.imapAttachmentHash
			let attachmentId = importedImapAttachmentHashToId.attachment
			importedImapAttachmentHashToIdMap.set(imapAttachmentHash, attachmentId)
		})

		return importedImapAttachmentHashToIdMap
	}

	private async performAttachmentDeduplication(imapMailAttachments: ImapMailAttachment[]) {
		let deduplicatedAttachments = imapMailAttachments.map(async (imapMailAttachment) => {
			// calculate fileHash to perform IMAP import attachment de-duplication
			let fileHash = uint8ArrayToString("utf-8", sha256Hash(imapMailAttachment.content))

			if (this.importedImapAttachmentHashToIdMap?.has(fileHash)) {
				let attachmentId = await this.importedImapAttachmentHashToIdMap.get(fileHash)
				if (attachmentId) {
					let imapImportTutanotaFileId: ImapImportTutanotaFileId = {
						_type: "ImapImportTutanotaFileId",
						_id: attachmentId,
					}
					return imapImportTutanotaFileId
				}
			}

			let deferredAttachmentId: Promise<IdTuple | undefined> = new Promise(async (resolve) => {
				this.importedImapAttachmentHashToIdMap = await this.getImportedImapAttachmentHashToIdMap()
				resolve(this.importedImapAttachmentHashToIdMap.get(fileHash))
			})

			this.importedImapAttachmentHashToIdMap?.set(fileHash, deferredAttachmentId)
			let importDataFile: ImapImportDataFile = {
				_type: "DataFile",
				name: imapMailAttachment.filename ?? imapMailAttachment.cid + Date.now().toString(), // TODO Should we use the hash directly?
				data: imapMailAttachment.content,
				size: imapMailAttachment.size,
				mimeType: imapMailAttachment.contentType,
				cid: imapMailAttachment.cid,
				fileHash: fileHash,
			}
			return importDataFile
		})

		return Promise.all(deduplicatedAttachments)
	}

	async onMailbox(imapMailbox: ImapMailbox, eventType: AdSyncEventType): Promise<void> {
		if (this.importImapAccountSyncState == null) {
			throw new ProgrammingError("onMailbox event received but importImapAccountSyncState not initialized!")
		}

		switch (eventType) {
			case AdSyncEventType.CREATE:
				let parentFolderId = this.importImapAccountSyncState.rootImportMailFolder
				if (imapMailbox.parentFolder) {
					let parentFolderSyncState = getFolderSyncStateForMailboxPath(imapMailbox.parentFolder.path, this.importImapFolderSyncStates ?? [])
					parentFolderId = parentFolderSyncState?.mailFolder ? parentFolderSyncState.mailFolder : null
				}

				let newFolderSyncState = await this.importImapFacade.createImportMailFolder(imapMailbox, this.importImapAccountSyncState._id, parentFolderId)

				if (newFolderSyncState) {
					this.importImapFolderSyncStates?.push(newFolderSyncState)
				}
				break
			case AdSyncEventType.UPDATE:
				// TODO update mail folder through existing Tutanota API's
				break
			case AdSyncEventType.DELETE:
				// TODO delete mail folder through existing Tutanota API's
				break
		}

		return Promise.resolve()
	}

	async onMailboxStatus(imapMailboxStatus: ImapMailboxStatus): Promise<void> {
		if (this.importImapFolderSyncStates === undefined) {
			throw new ProgrammingError("onMailboxStatus event received but importImapFolderSyncStates not initialized!")
		}

		let folderSyncState = getFolderSyncStateForMailboxPath(imapMailboxStatus.path, this.importImapFolderSyncStates)
		if (folderSyncState) {
			const newFolderSyncState = await this.importImapFacade.updateImportImapFolderSyncState(imapMailboxStatus, folderSyncState)

			let index = this.importImapFolderSyncStates.findIndex((folderSyncState) => folderSyncState.path == newFolderSyncState.path)
			this.importImapFolderSyncStates[index] = newFolderSyncState
		}

		return Promise.resolve()
	}

	async onMail(imapMail: ImapMail, eventType: AdSyncEventType): Promise<void> {
		if (this.importImapFolderSyncStates === undefined) {
			throw new ProgrammingError("onMail event received but importImapFolderSyncStates not initialized!")
		}

		let folderSyncState = getFolderSyncStateForMailboxPath(imapMail.belongsToMailbox.path, this.importImapFolderSyncStates)
		if (folderSyncState) {
			let deduplicatedAttachments = imapMail.attachments ? await this.performAttachmentDeduplication(imapMail.attachments) : []
			let importMailParams = imapMailToImportMailParams(imapMail, folderSyncState._id, deduplicatedAttachments)

			switch (eventType) {
				case AdSyncEventType.CREATE:
					this.importMailFacade.importMail(importMailParams).catch((error) => {
						if (error instanceof SuspensionError) {
							this.postponeImport(
								new Date(Date.now() + (error.suspensionTime ? parseInt(error.suspensionTime) : DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME)),
							)
						}
					})
					break
				case AdSyncEventType.UPDATE:
					// TODO update mail properties through existing Tutanota API's (unread / read, etc.)
					break
				case AdSyncEventType.DELETE:
					// TODO delete mail through existing Tutanota API's
					break
			}
		}

		return Promise.resolve()
	}

	async onPostpone(postponedUntil: Date): Promise<void> {
		await this.postponeImport(postponedUntil)
		return Promise.resolve()
	}

	onFinish(downloadedQuota: number): Promise<void> {
		this.imapImportState = new ImapImportState(ImportState.FINISHED)
		return Promise.resolve()
	}

	onError(imapError: ImapError): Promise<void> {
		return Promise.resolve()
	}
}
