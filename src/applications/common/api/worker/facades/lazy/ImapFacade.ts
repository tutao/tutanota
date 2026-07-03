/**
 * The ImapFacade is responsible for initializing (and terminating) an IMAP migration.
 * The ImapFacade is also responsible for initializing the ImapFolderSyncStates for each single mapping from IMAP folder to Tuta folder.
 * The ImapFolderSyncState is needed to store relevant IMAP synchronization information for a single folder, most importantly the IMAP UID to Tuta mailId.
 * The facade communicates directly with the ImapService and ImapFolderService.
 */
import { CryptoWrapper } from "@tutao/crypto"
import { MailFacade } from "./MailFacade.js"
import { InitializeImapImportParams, MailSetMapping } from "../../../../../mail-app/workerUtils/imapimport/ImapImporter"
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
	MailSetTypeRef,
} from "@tutao/entities/tutanota"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { ProgrammingError } from "@tutao/app-env"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, MailSetKind } from "../../../../../../entities/tutanota/Utils"
import { ImapMailbox, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import { DEFAULT_EXTRA_SERVICE_PARAMS } from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { getElementId } from "@tutao/meta"

export class ImapFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async initializeImapImport(
		initializeParams: InitializeImapImportParams,
	): Promise<{ imapAccountSyncState: ImapAccountSyncState; initialFolderSyncStates: ImapFolderSyncState[] }> {
		const mailGroupId = initializeParams.mailGroupId

		if (initializeParams.rootImportMailFolderName === "" && !initializeParams.matchImapMailboxesToTutaMailSets) {
			throw new ProgrammingError("Either rootImportMailFolderName or matchImapMailboxesToTutaMailSets must be set")
		}

		let rootImportMailFolderId: IdTuple | null = null
		if (initializeParams.rootImportMailFolderName) {
			rootImportMailFolderId = await this.mailFacade.createMailFolder(initializeParams.rootImportMailFolderName, null, mailGroupId)
		}

		let syncLabelId: IdTuple | null = null
		if (initializeParams.imapSyncLabelData) {
			syncLabelId = await this.mailFacade.createLabel(mailGroupId, initializeParams.imapSyncLabelData)
		}

		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const sk = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

		const imapPostIn = createImapPostIn({
			ownerEncSessionKey: ownerEncSessionKey.key,
			ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
			ownerGroup: mailGroupId,
			imapAccount: initializeParams.imapAccount,
			maxQuota: initializeParams.maxQuota,
			postponedUntil: Date.now().toString(),
			rootImportMailFolder: rootImportMailFolderId,
			syncLabel: syncLabelId,
			provider: initializeParams.provider.toString(),
		})

		const imapPostOut = await this.serviceExecutor.post(ImapService, imapPostIn, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey: sk })
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapPostOut.imapAccountSyncState)

		let initialFolderSyncStates: ImapFolderSyncState[] = []
		if (initializeParams.imapMailboxesToTutaMailSets) {
			initialFolderSyncStates = await this.createInitialImportMailFolders(imapAccountSyncState, initializeParams.imapMailboxesToTutaMailSets)
		} else if (
			initializeParams.spamFolderMigrationInformation.shouldMigrateSpamFolder &&
			initializeParams.spamFolderMigrationInformation.spamMailbox !== null
		) {
			const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
			const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
			const allMailSets = await this.entityClient.loadAll(MailSetTypeRef, mailbox.mailSets.mailSets)
			const spamMailSet = assertNotNull(allMailSets.find((mailSet) => mailSet.folderType === MailSetKind.SPAM))
			const mailSetMapping = new Map([
				[initializeParams.spamFolderMigrationInformation.spamMailbox.path, { mailSetElementId: getElementId(spamMailSet), shouldSync: true }],
			])
			initialFolderSyncStates = await this.createInitialImportMailFolders(imapAccountSyncState, mailSetMapping)
		}

		return { imapAccountSyncState, initialFolderSyncStates }
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
			if (imapFolderSyncState.status === ImapFolderSyncStatus.NO_SYNC) {
				continue
			}
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
			imapAccountSyncState.status = imapAccountSyncStatus
			await this.entityClient.update(imapAccountSyncState)
		}
	}

	async deleteImapImport(imapAccountSyncStateId: IdTuple): Promise<void> {
		const imapDeleteIn = createImapDeleteIn({ imapAccountSyncState: imapAccountSyncStateId })
		await this.serviceExecutor.delete(ImapService, imapDeleteIn, null)
	}

	async createInitialImportMailFolders(
		imapAccountSyncState: ImapAccountSyncState,
		imapMailboxesToTutaFolders: Map<string, MailSetMapping>,
	): Promise<ImapFolderSyncState[]> {
		const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)
		const mailbox = await this.entityClient.load(MailBoxTypeRef, mailboxGroupRoot.mailbox)
		const imapFolderSyncStates: ImapFolderSyncState[] = []
		for (const [imapMailboxPath, { mailSetElementId, shouldSync }] of imapMailboxesToTutaFolders.entries()) {
			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = this.cryptoWrapper.aes256RandomKey()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const imapFolderPostIn = createImapFolderPostIn({
				ownerEncSessionKey: ownerEncSessionKey.key,
				ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				ownerGroup: mailGroupId,
				path: imapMailboxPath,
				imapAccountSyncState: imapAccountSyncState._id,
				mailFolder: shouldSync ? [mailbox.mailSets.mailSets, mailSetElementId] : null,
			})
			const imapFolderPostOut = await this.serviceExecutor.post(ImapFolderService, imapFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			const imapFolderSyncState = await this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
			imapFolderSyncStates.push(imapFolderSyncState)
		}
		return imapFolderSyncStates
	}

	async initializeImapMailFolder(
		imapMailbox: ImapMailbox,
		imapAccountSyncState: ImapAccountSyncState,
		parentFolderId: IdTuple | null,
		shouldSync: boolean,
	): Promise<ImapFolderSyncState | undefined> {
		if (imapMailbox.name) {
			const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
			const mailFolderId = shouldSync ? await this.mailFacade.createMailFolder(imapMailbox.name, parentFolderId, mailGroupId) : null

			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = this.cryptoWrapper.aes256RandomKey()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const imapFolderPostIn = createImapFolderPostIn({
				ownerEncSessionKey: ownerEncSessionKey.key,
				ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
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
