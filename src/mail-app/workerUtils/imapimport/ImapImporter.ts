import { AdSyncEventType } from "../../../common/desktop/imapimport/adsync/AdSyncEventListener"
import {
	getFolderSyncStateForMailboxPath,
	ImapImportState,
	imapMailToImportMailParams,
	importImapAccountToImapAccount,
	ImportState,
} from "../../../common/api/common/utils/imapImportUtils/ImapImportUtils.js"
import { ImapMailboxState, ImapMailId, ImapSyncState } from "../../../common/desktop/imapimport/adsync/ImapSyncState.js"
import { ImapMailbox, ImapMailboxStatus } from "../../../common/api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapMail, ImapMailAttachment } from "../../../common/api/common/utils/imapImportUtils/ImapMail.js"
import { ImapError } from "../../../common/desktop/imapimport/adsync/imapmail/ImapError.js"

import { assertNotNull, getFirstOrThrow, isEmpty, uint8ArrayToString } from "@tutao/utils"
import { sha256Hash } from "@tutao/crypto"
import { MaybePromise } from "rollup"
import { tutanotaTypeRefs } from "@tutao/typerefs"
import { ProgrammingError } from "@tutao/app-env"
import { ImapImportDataFile, ImapImportTutanotaFileId, ImportMailFacade, ImportMailParams } from "../../../common/api/worker/facades/lazy/ImportMailFacade"
import { SuspensionError } from "../../../common/api/common/error/SuspensionError"
import { ImapImportFacade } from "../../../common/native/common/generatedipc/ImapImportFacade"
import { ImapImportSystemFacade } from "../../../common/native/common/generatedipc/ImapImportSystemFacade"
import { ImportImapFacade } from "../../../common/api/worker/facades/lazy/ImportImapFacade"

const DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME = 120 * 1000 // 120 seconds

export type InitializeImapImportParams = {
	/** hostname of the imap server to import mail from */
	host: string
	/** imap port of the host */
	port: number
	username: string
	password: string | null
	accessToken: string | null
	maxQuota: string
	rootImportMailFolderName: string | null
	matchImportFoldersToTutanotaFolders: boolean
	isModifyingExistingImport: boolean
}

export class ImapImporter implements ImapImportFacade {
	private imapImportState: ImapImportState = new ImapImportState(ImportState.NOT_INITIALIZED)
	private importImapAccountSyncState: tutanotaTypeRefs.ImportImapAccountSyncState | null = null
	private importImapFolderSyncStates?: tutanotaTypeRefs.ImportImapFolderSyncState[]
	private deduplicatedImportedAttachmentHashToFileId?: Map<string, MaybePromise<IdTuple | undefined>>
	private importedMessageIds: Set<string> = new Set()

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
			if (initializeParams.isModifyingExistingImport) {
				this.importImapAccountSyncState = await this.importImapFacade.updateImapImport(initializeParams, importImapAccountSyncState)
			}
		}

		this.imapImportState = new ImapImportState(ImportState.PAUSED)
		return Promise.resolve(this.imapImportState)
	}

	async continueImport(): Promise<ImapImportState> {
		if (this.imapImportState.state === ImportState.RUNNING) {
			return this.imapImportState
		}

		if (this.imapImportState.state === ImportState.POSTPONED && this.imapImportState.postponedUntil.getTime() > Date.now()) {
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
			this.imapImportState.postponedUntil = new Date(Number.parseInt(postponedUntil))
		}

		if (this.imapImportState.postponedUntil.getTime() > Date.now()) {
			this.imapImportState.state = ImportState.POSTPONED
			return this.imapImportState
		}

		let imapAccount = importImapAccountToImapAccount(this.importImapAccountSyncState.imapAccount)
		let maxQuota = parseInt(this.importImapAccountSyncState.maxQuota)
		let imapMailboxStates = await this.getAllImapMailboxStates(this.importImapAccountSyncState.imapFolderSyncStateList)
		let imapSyncState = new ImapSyncState(imapAccount, maxQuota, imapMailboxStates)

		this.deduplicatedImportedAttachmentHashToFileId = await this.getImportedImapAttachmentHashToIdMap()

		await this.imapImportSystemFacade.startImport(imapSyncState)

		this.imapImportState = new ImapImportState(ImportState.RUNNING)
		return Promise.resolve(this.imapImportState)
	}

	async pauseImport(): Promise<ImapImportState> {
		await this.imapImportSystemFacade.stopImport()
		this.imapImportState = new ImapImportState(ImportState.PAUSED)
		return Promise.resolve(this.imapImportState)
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
		if (this.importImapAccountSyncState == null) {
			return Promise.resolve(false)
		} else {
			await this.importImapFacade.deleteImapImport(this.importImapAccountSyncState._id)
			await this.imapImportSystemFacade.stopImport()
			this.importImapAccountSyncState = null
			return Promise.resolve(true)
		}
	}

	async loadRootImportFolder(): Promise<tutanotaTypeRefs.MailSet | null> {
		if (this.importImapAccountSyncState?.rootImportMailFolder == null) {
			return Promise.resolve(null)
		}

		return Promise.resolve(this.importImapFacade.getRootImportFolder(this.importImapAccountSyncState?.rootImportMailFolder))
	}

	async loadImportImapAccountSyncState(): Promise<tutanotaTypeRefs.ImportImapAccountSyncState | null> {
		return Promise.resolve(this.importImapFacade.getImportImapAccountSyncState())
	}

	loadImapImportState(): Promise<ImapImportState> {
		return Promise.resolve(this.imapImportState)
	}

	private async loadAllImportImapFolderSyncStates(importImapFolderSyncStateListId: Id): Promise<tutanotaTypeRefs.ImportImapFolderSyncState[]> {
		if (this.importImapAccountSyncState == null) {
			throw new ProgrammingError("ImportImapAccountSyncState not initialized!")
		}
		return this.importImapFacade.getAllImportImapFolderSyncStates(importImapFolderSyncStateListId)
	}

	private async getAllImapMailboxStates(importImapFolderSyncStateListId: Id): Promise<ImapMailboxState[]> {
		let imapMailboxStates: ImapMailboxState[] = []
		this.importImapFolderSyncStates = await this.loadAllImportImapFolderSyncStates(importImapFolderSyncStateListId)

		for (const folderSyncState of this.importImapFolderSyncStates) {
			let importedImapUidToImapMailId = new Map<number, ImapMailId>()
			let importedImapMails = await this.importImapFacade.getImportedMails(folderSyncState.importedMails)
			for (const importedImapMail of importedImapMails) {
				let imapUid = parseInt(importedImapMail.imapUid)
				let importedImapMailId = new ImapMailId(imapUid)
				if (importedImapMail.imapModSeq != null) {
					importedImapMailId.modSeq = BigInt(importedImapMail.imapModSeq)
				}
				importedImapMailId.messageId = importedImapMail.messageId
				this.importedMessageIds.add(importedImapMail.messageId)

				importedImapUidToImapMailId.set(imapUid, importedImapMailId)
			}

			let imapMailboxState = new ImapMailboxState(folderSyncState.path, importedImapUidToImapMailId)
			imapMailboxState.uidNext = folderSyncState.uidnext ? parseInt(folderSyncState.uidnext) : undefined
			imapMailboxState.uidValidity = folderSyncState.uidvalidity ? BigInt(folderSyncState.uidvalidity) : undefined
			imapMailboxState.highestModSeq = folderSyncState.highestmodseq ? BigInt(folderSyncState.highestmodseq) : null

			imapMailboxStates.push(imapMailboxState)
		}

		return imapMailboxStates
	}

	private async getImportedImapAttachmentHashToIdMap(): Promise<Map<string, MaybePromise<IdTuple>>> {
		let importedImapAttachmentHashToIdMap = new Map<string, MaybePromise<IdTuple>>()
		if (this.importImapAccountSyncState == null) {
			return importedImapAttachmentHashToIdMap
		}
		let importedImapAttachmentHashToIdMapList = await this.importImapFacade.getDeduplicatedImportedAttachmentsList(
			assertNotNull(this.importImapAccountSyncState._ownerGroup),
		)

		for (const importedImapAttachmentHashToId of importedImapAttachmentHashToIdMapList) {
			let imapAttachmentHash = importedImapAttachmentHashToId.attachmentHash
			let attachmentId = importedImapAttachmentHashToId.attachment
			importedImapAttachmentHashToIdMap.set(imapAttachmentHash, attachmentId)
		}

		return importedImapAttachmentHashToIdMap
	}

	private async performAttachmentDeduplication(imapMailAttachments: ImapMailAttachment[]) {
		let deduplicatedAttachments = imapMailAttachments.map(async (imapMailAttachment) => {
			// calculate fileHash to perform IMAP import attachment de-duplication
			let fileHash = uint8ArrayToString("utf-8", sha256Hash(imapMailAttachment.content))

			if (this.deduplicatedImportedAttachmentHashToFileId?.has(fileHash)) {
				let attachmentId = await this.deduplicatedImportedAttachmentHashToFileId.get(fileHash)
				if (attachmentId) {
					let imapImportTutanotaFileId: ImapImportTutanotaFileId = {
						_type: "ImapImportTutanotaFileId",
						_id: attachmentId,
					}
					return imapImportTutanotaFileId
				}
			}

			// eslint-disable-next-line no-async-promise-executor
			let deferredAttachmentId: Promise<IdTuple | undefined> = new Promise(async (resolve) => {
				this.deduplicatedImportedAttachmentHashToFileId = await this.getImportedImapAttachmentHashToIdMap()
				resolve(this.deduplicatedImportedAttachmentHashToFileId.get(fileHash))
			})

			this.deduplicatedImportedAttachmentHashToFileId?.set(fileHash, deferredAttachmentId)
			let importDataFile: ImapImportDataFile = {
				_type: "DataFile",
				name: imapMailAttachment.filename ?? fileHash,
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
			case AdSyncEventType.CREATE: {
				let parentFolderId = this.importImapAccountSyncState.rootImportMailFolder
				if (imapMailbox.parentFolder) {
					let parentFolderSyncState = getFolderSyncStateForMailboxPath(imapMailbox.parentFolder.path, this.importImapFolderSyncStates ?? [])
					parentFolderId = parentFolderSyncState?.mailFolder ? parentFolderSyncState.mailFolder : null
				}

				let newFolderSyncState = await this.importImapFacade.createImportMailFolder(imapMailbox, this.importImapAccountSyncState, parentFolderId)

				if (newFolderSyncState) {
					this.importImapFolderSyncStates?.push(newFolderSyncState)
				}
				break
			}
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

			let index = this.importImapFolderSyncStates.findIndex((folderSyncState) => folderSyncState.path === newFolderSyncState.path)
			this.importImapFolderSyncStates[index] = newFolderSyncState
		}

		return Promise.resolve()
	}

	async onMail(imapMail: ImapMail, eventType: AdSyncEventType): Promise<void> {
		await this.onMultipleMails([imapMail], eventType)
	}

	async onMultipleMails(imapMails: ImapMail[], eventType: AdSyncEventType) {
		// fixme
		if (isEmpty(imapMails)) {
			return Promise.resolve()
		}
		if (this.importImapFolderSyncStates === undefined) {
			throw new ProgrammingError("onMail event received but importImapFolderSyncStates not initialized!")
		}

		let folderSyncState = getFolderSyncStateForMailboxPath(getFirstOrThrow(imapMails).belongsToMailbox.path, this.importImapFolderSyncStates)
		let importMailParamsList: ImportMailParams[] = []
		for (const imapMail of imapMails) {
			if (folderSyncState) {
				let deduplicatedAttachments = imapMail.attachments ? await this.performAttachmentDeduplication(imapMail.attachments) : []
				let importMailParams = imapMailToImportMailParams(imapMail, folderSyncState._id, deduplicatedAttachments)
				// we don't want to import mails that are already imported
				// CREATE events are also triggered if the mail has been moved or copied
				const messageId = imapMail.envelope?.messageId
				if (messageId && !this.importedMessageIds.has(messageId)) {
					importMailParamsList.push(importMailParams)
				}
			}
		}
		switch (eventType) {
			case AdSyncEventType.CREATE: {
				this.importMailFacade.importMails(importMailParamsList).catch((error: Error) => {
					if (error instanceof SuspensionError) {
						this.postponeImport(new Date(Date.now() + (error.data ? parseInt(error.data) : DEFAULT_TUTANOTA_SERVER_POSTPONE_TIME)))
					} else {
						//FIXME: Keep this for now as there was no other error warning when failing.
						console.log("There was some other error while importing...", error)
					}
				})
				break
			}
			case AdSyncEventType.UPDATE:
				// TODO update mail properties through existing Tutanota API's (unread / read, etc.)
				break
			case AdSyncEventType.DELETE:
				// TODO delete mail through existing Tutanota API's
				break
		}

		return Promise.resolve()
	}

	async onPostpone(postponedUntil: number): Promise<void> {
		await this.postponeImport(new Date(postponedUntil))
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
