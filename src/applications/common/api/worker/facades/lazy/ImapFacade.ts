/**
 * The ImapFacade is responsible for initializing (and terminating) an IMAP migration.
 * The ImapFacade is also responsible for initializing the ImapFolderSyncStates for each single mapping from IMAP folder to Tuta folder.
 * The ImapFolderSyncState is needed to store relevant IMAP synchronization information for a single folder, most importantly the IMAP UID to Tuta mailId.
 * The facade communicates directly with the ImapService and ImapFolderService.
 */
import { aes256RandomKey, CryptoWrapper } from "@tutao/crypto"
import { MailFacade } from "./MailFacade.js"
import { InitializeImapImportParams } from "../../../../../mail-app/workerUtils/imapimport/ImapImporter"
import { assertNotNull } from "@tutao/utils"
import {
	createImapDeleteIn,
	createImapFolderDeleteIn,
	createImapFolderPostIn,
	createImapPostIn,
	DeduplicatedImportedAttachment,
	DeduplicatedImportedAttachmentTypeRef,
	ImapAccountSyncState,
	ImapAccountSyncStateTypeRef,
	ImapFolderService,
	ImapFolderSyncState,
	ImapFolderSyncStateTypeRef,
	ImapService,
	ImportedImapMail,
	ImportedImapMailTypeRef,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
} from "@tutao/entities/tutanota"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { ProgrammingError } from "@tutao/app-env"
import { ImapFolderSyncStatus, ImapAccountSyncStatus } from "../../../../../../entities/tutanota/Utils"
import { ImapMailbox, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"

export class ImapFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async initializeImapImport(initializeParams: InitializeImapImportParams): Promise<ImapAccountSyncState> {
		const mailGroupId = initializeParams.mailGroupId

		if (initializeParams.rootImportMailFolderName === "" && !initializeParams.matchImapMailboxesToTutaMailSets) {
			throw new ProgrammingError("Either rootImportMailFolderName or matchImapMailboxesToTutaMailSets must be set")
		}
		let rootImportMailFolderId: IdTuple | null = null
		if (initializeParams.rootImportMailFolderName) {
			rootImportMailFolderId = await this.mailFacade.createMailFolder(initializeParams.rootImportMailFolderName, null, mailGroupId)
		}

		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const sk = aes256RandomKey()
		const imapPostIn = createImapPostIn({
			ownerEncSessionKey: this.cryptoWrapper.encryptKey(mailGroupKey.object, sk),
			ownerGroup: mailGroupId,
			imapAccount: initializeParams.imapAccount,
			maxQuota: initializeParams.maxQuota,
			postponedUntil: Date.now().toString(),
			rootImportMailFolder: rootImportMailFolderId,
			labelData: initializeParams.imapSyncLabelData,
			provider: initializeParams.provider.toString(),
		})

		const imapPostOut = await this.serviceExecutor.post(ImapService, imapPostIn, { sessionKey: sk })
		return this.entityClient.load(ImapAccountSyncStateTypeRef, imapPostOut.imapAccountSyncState)
	}

	async postponeImapImport(postponedUntil: Date, imapAccountSyncStateId: IdTuple): Promise<ImapAccountSyncState> {
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
		imapAccountSyncState.postponedUntil = postponedUntil.getTime().toString()
		imapAccountSyncState.status = ImapAccountSyncStatus.POSTPONED
		await this.entityClient.update(imapAccountSyncState)
		await this.pauseRunningImapImportFolderSyncStates(imapAccountSyncStateId)
		return imapAccountSyncState
	}

	async pauseRunningImapImportFolderSyncStates(imapAccountSyncStateId: IdTuple): Promise<ImapAccountSyncState> {
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
		const imapFolderSyncStates = await this.getAllImapFolderSyncStates(imapAccountSyncState.imapFolderSyncStateList)
		for (const imapFolderSyncState of imapFolderSyncStates) {
			if (imapFolderSyncState.status === ImapFolderSyncStatus.RUNNING) {
				imapFolderSyncState.status = ImapFolderSyncStatus.PAUSED
				await this.entityClient.update(imapFolderSyncState)
			}
		}
		return imapAccountSyncState
	}

	async updateAllImapFolderSyncStates(imapAccountSyncStateId: IdTuple, status: ImapFolderSyncStatus): Promise<ImapAccountSyncState> {
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
		const imapFolderSyncStates = await this.getAllImapFolderSyncStates(imapAccountSyncState.imapFolderSyncStateList)
		for (const imapFolderSyncState of imapFolderSyncStates) {
			if (imapFolderSyncState.status !== status) {
				imapFolderSyncState.status = status
				try {
					await this.entityClient.update(imapFolderSyncState)
				} catch (e) {
					console.log("Could not update imapFolderSyncState because", imapFolderSyncState._id, e)
				}
			}
		}
		return imapAccountSyncState
	}

	async updateImapAccountSyncStateStatus(imapAccountSyncState: ImapAccountSyncState, imapAccountSyncStatus: ImapAccountSyncStatus) {
		if (imapAccountSyncState.status !== imapAccountSyncStatus) {
			console.log("Updating imapAccountSyncState status from", imapAccountSyncState.status, "to", imapAccountSyncStatus)
			imapAccountSyncState.status = imapAccountSyncStatus
			await this.entityClient.update(imapAccountSyncState)
		}
	}

	async deleteImapImport(imapAccountSyncStateId: IdTuple): Promise<void> {
		const imapDeleteIn = createImapDeleteIn({ imapAccountSyncState: imapAccountSyncStateId })
		await this.serviceExecutor.delete(ImapService, imapDeleteIn)
	}

	async createImportMailFolder(
		imapMailbox: ImapMailbox,
		imapAccountSyncState: ImapAccountSyncState,
		parentFolderId: IdTuple | null,
		imapMailboxesToTutaFolders?: Map<string, Id>,
	): Promise<ImapFolderSyncState | undefined> {
		if (imapMailbox.name) {
			const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
			// if a root folder is not set on imapAccountSyncState, we try to match the folder to a Tuta folder, if that fails, we create a new folder
			let mailFolderId: IdTuple
			if (imapAccountSyncState.rootImportMailFolder == null && imapMailboxesToTutaFolders && imapMailboxesToTutaFolders.has(imapMailbox.path)) {
				mailFolderId = await this.findTutaFolderForImapMailbox(imapMailbox, mailGroupId, imapMailboxesToTutaFolders)
			} else {
				mailFolderId = await this.mailFacade.createMailFolder(imapMailbox.name, parentFolderId, mailGroupId)
			}

			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = aes256RandomKey()
			const imapFolderPostIn = createImapFolderPostIn({
				ownerEncSessionKey: this.cryptoWrapper.encryptKey(mailGroupKey.object, sk),
				ownerGroup: mailGroupId,
				path: imapMailbox.path,
				imapAccountSyncState: imapAccountSyncState._id,
				mailFolder: mailFolderId,
			})

			const imapFolderPostOut = await this.serviceExecutor.post(ImapFolderService, imapFolderPostIn, {
				sessionKey: sk,
			})
			return this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
		}
	}

	async updateImapFolderSyncState(imapMailboxStatus: ImapMailboxStatus, folderSyncState: ImapFolderSyncState): Promise<ImapFolderSyncState> {
		folderSyncState.uidnext = imapMailboxStatus.uidNext.toString()
		folderSyncState.uidvalidity = imapMailboxStatus.uidValidity.toString()
		folderSyncState.highestmodseq = imapMailboxStatus.highestModSeq?.toString() ?? null // value null denotes that the mailbox doesn't support IMAP QRESYNC feature
		folderSyncState.status = imapMailboxStatus.syncStatus.toString()
		await this.entityClient.update(folderSyncState)
		return this.entityClient.load(ImapFolderSyncStateTypeRef, folderSyncState._id)
	}

	async deleteImapFolderSyncState(folderSyncStateId: IdTuple) {
		await this.serviceExecutor.delete(ImapFolderService, createImapFolderDeleteIn({ imapFolderSyncState: folderSyncStateId }))
	}

	async getImapAccountSyncStatesForMailGroup(mailGroupId: Id): Promise<ImapAccountSyncState[]> {
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		if (mailbox.imapAccountSyncStates == null) {
			return []
		}
		return await this.entityClient.loadAll(ImapAccountSyncStateTypeRef, mailbox.imapAccountSyncStates)
	}

	async getImapAccountSyncStateById(imapAccountSyncStateId: IdTuple): Promise<ImapAccountSyncState> {
		return await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
	}

	async getAllImapFolderSyncStates(imapFolderSyncStateListId: Id): Promise<ImapFolderSyncState[]> {
		return this.entityClient.loadAll(ImapFolderSyncStateTypeRef, imapFolderSyncStateListId)
	}

	async getImapFolderSyncStateById(imapFolderSyncStateId: IdTuple): Promise<ImapFolderSyncState> {
		return this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderSyncStateId)
	}

	async getImportedMails(importedMailListId: Id): Promise<ImportedImapMail[]> {
		return this.entityClient.loadAll(ImportedImapMailTypeRef, importedMailListId)
	}

	async getDeduplicatedImportedAttachmentsList(mailGroupId: Id): Promise<DeduplicatedImportedAttachment[]> {
		const mailBoxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailBox = await this.entityClient.load(MailBoxTypeRef, mailBoxGroupRoot.mailbox)
		return await this.entityClient.loadAll(DeduplicatedImportedAttachmentTypeRef, assertNotNull(mailBox.deduplicatedImportedAttachments))
	}

	async getDeduplicatedImportedAttachmentById(deduplicatedImportedAttachmentId: IdTuple): Promise<DeduplicatedImportedAttachment> {
		return this.entityClient.load(DeduplicatedImportedAttachmentTypeRef, deduplicatedImportedAttachmentId)
	}

	private async findTutaFolderForImapMailbox(imapMailbox: ImapMailbox, mailGroupId: Id, imapMailboxesToTutaFolders: Map<string, Id>): Promise<IdTuple> {
		const mailBoxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailBox = await this.entityClient.load(MailBoxTypeRef, mailBoxGroupRoot.mailbox)
		const mailSetElementId = assertNotNull(imapMailboxesToTutaFolders.get(imapMailbox.path), JSON.stringify(imapMailboxesToTutaFolders))
		return [mailBox.mailSets.mailSets, mailSetElementId]
	}
}
