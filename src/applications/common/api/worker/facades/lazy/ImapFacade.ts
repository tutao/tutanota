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
import { ImapAccountSyncStatus, ImapFolderSyncStatus } from "../../../../../../entities/tutanota/Utils"
import { ImapMailbox, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"

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

		const imapPostOut = await this.serviceExecutor.post(ImapService, imapPostIn, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey: sk })
		const accountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapPostOut.imapAccountSyncState)

		if (initializeParams.imapMailboxesToTutaMailSets) {
			await this.createInitialImportMailFolders(accountSyncState, initializeParams.imapMailboxesToTutaMailSets)
		}

		return accountSyncState
	}

	async postponeImapImport(postponedUntil: Date, imapAccountSyncStateId: IdTuple): Promise<void> {
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
		imapAccountSyncState.postponedUntil = postponedUntil.getTime().toString()
		imapAccountSyncState.status = ImapAccountSyncStatus.POSTPONED
		await this.entityClient.update(imapAccountSyncState)
		await this.pauseRunningImapImportFolderSyncStates(imapAccountSyncStateId)
	}

	async pauseRunningImapImportFolderSyncStates(imapAccountSyncStateId: IdTuple): Promise<void> {
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
		const imapFolderSyncStates = await this.getAllImapFolderSyncStates(imapAccountSyncState.imapFolderSyncStateList)
		for (const imapFolderSyncState of imapFolderSyncStates) {
			if (imapFolderSyncState.status === ImapFolderSyncStatus.RUNNING) {
				imapFolderSyncState.status = ImapFolderSyncStatus.PAUSED
				await this.entityClient.update(imapFolderSyncState)
			}
		}
	}

	async updateAllImapFolderSyncStates(imapAccountSyncStateId: IdTuple, status: ImapFolderSyncStatus): Promise<void> {
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
		await this.serviceExecutor.delete(ImapService, imapDeleteIn, null)
	}

	async createInitialImportMailFolders(imapAccountSyncState: ImapAccountSyncState, imapMailboxesToTutaFolders: Map<string, Id>) {
		const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		for (const [imapMailboxPath, mailSetElementId] of imapMailboxesToTutaFolders.entries()) {
			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = aes256RandomKey()
			const imapFolderPostIn = createImapFolderPostIn({
				ownerEncSessionKey: this.cryptoWrapper.encryptKey(mailGroupKey.object, sk),
				ownerGroup: mailGroupId,
				path: imapMailboxPath,
				imapAccountSyncState: imapAccountSyncState._id,
				mailFolder: [mailbox.mailSets.mailSets, mailSetElementId],
			})

			await this.serviceExecutor.post(ImapFolderService, imapFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
		}
	}

	async createImportMailFolder(
		imapMailbox: ImapMailbox,
		imapAccountSyncState: ImapAccountSyncState,
		parentFolderId: IdTuple | null,
	): Promise<ImapFolderSyncState | undefined> {
		if (imapMailbox.name) {
			const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
			const mailFolderId = await this.mailFacade.createMailFolder(imapMailbox.name, parentFolderId, mailGroupId)

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
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			return this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
		}
	}

	async updateImapFolderSyncState(imapMailboxStatus: ImapMailboxStatus, folderSyncState: ImapFolderSyncState): Promise<void> {
		folderSyncState.uidnext = imapMailboxStatus.uidNext.toString()
		folderSyncState.uidvalidity = imapMailboxStatus.uidValidity.toString()
		// value null for highestmodseq denotes that the mailbox doesn't support IMAP QRESYNC feature
		folderSyncState.highestmodseq = imapMailboxStatus.highestModSeq?.toString() ?? null
		folderSyncState.status = imapMailboxStatus.syncStatus.toString()
		await this.entityClient.update(folderSyncState)
	}

	async deleteImapFolderSyncState(folderSyncStateId: IdTuple) {
		await this.serviceExecutor.delete(ImapFolderService, createImapFolderDeleteIn({ imapFolderSyncState: folderSyncStateId }), null)
	}

	async getImapAccountSyncStateById(imapAccountSyncStateId: IdTuple): Promise<ImapAccountSyncState> {
		return await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId)
	}

	async getImapFolderSyncStateById(imapFolderSyncStateId: IdTuple): Promise<ImapFolderSyncState> {
		return this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderSyncStateId)
	}

	async getImportedMails(importedMailListId: Id): Promise<ImportedImapMail[]> {
		return this.entityClient.loadAll(ImportedImapMailTypeRef, importedMailListId)
	}

	async getDeduplicatedImportedAttachments(mailGroupId: Id): Promise<DeduplicatedImportedAttachment[]> {
		const mailBoxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailBox = await this.entityClient.load(MailBoxTypeRef, mailBoxGroupRoot.mailbox)
		return await this.entityClient.loadAll(DeduplicatedImportedAttachmentTypeRef, assertNotNull(mailBox.deduplicatedImportedAttachments))
	}

	async getDeduplicatedImportedAttachmentListId(mailGroupId: Id) {
		const mailBoxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailBox = await this.entityClient.load(MailBoxTypeRef, mailBoxGroupRoot.mailbox)
		return mailBox.deduplicatedImportedAttachments
	}

	async getDeduplicatedImportedAttachmentById(deduplicatedImportedAttachmentId: IdTuple): Promise<DeduplicatedImportedAttachment> {
		return this.entityClient.load(DeduplicatedImportedAttachmentTypeRef, deduplicatedImportedAttachmentId)
	}

	async getAllImapAccountSyncStates(imapAccountSyncStateListId: Id) {
		return this.entityClient.loadAll(ImapAccountSyncStateTypeRef, imapAccountSyncStateListId)
	}

	async getAllImapFolderSyncStates(imapFolderSyncStateListId: Id): Promise<ImapFolderSyncState[]> {
		return this.entityClient.loadAll(ImapFolderSyncStateTypeRef, imapFolderSyncStateListId)
	}
}
