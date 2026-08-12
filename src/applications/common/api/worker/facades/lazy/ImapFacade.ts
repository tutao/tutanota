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
	createImapPutIn,
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
	MailSet,
	MailSetTypeRef,
} from "@tutao/entities/tutanota"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { ProgrammingError } from "@tutao/app-env"
import { ImapAccountSyncStatus, ImapFolderSyncStatus, MailSetKind } from "../../../../../../entities/tutanota/Utils"
import { ImapMailbox, ImapMailboxSpecialUse, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { GroupKeyProvider } from "../../../../../../platform-kit/base/base-crypto/GroupKeyProvider"
import {
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	DEFAULT_EXTRA_SERVICE_PARAMS,
	EntityRestClientLoadOptions,
} from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { getElementId, idToElementId } from "@tutao/meta"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"
import { randomHexColor } from "../../../common/utils/imapImportUtils/ImapImportUtils"
import { ImapProvider } from "../../../common/utils/imapImportUtils/ImapKnownConfigs"

export class ImapFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly groupKeyProvider: GroupKeyProvider,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async initializeImapImport(
		initializeParams: InitializeImapImportParams,
	): Promise<{ imapAccountSyncState: ImapAccountSyncState; initialFolderSyncStates: ImapFolderSyncState[] }> {
		const mailGroupId = initializeParams.mailGroupId

		if (initializeParams.rootImportMailSetName === "" && !initializeParams.matchImapMailboxesToTutaMailSets) {
			throw new ProgrammingError("Either rootImportMailFolderName or matchImapMailboxesToTutaMailSets must be set")
		}

		let rootImportMailSetId: IdTuple | null = null
		if (initializeParams.rootImportMailSetName) {
			if (initializeParams.provider === ImapProvider.Gmail) {
				rootImportMailSetId = await this.mailFacade.createLabel(mailGroupId, {
					name: initializeParams.rootImportMailSetName,
					color: randomHexColor(),
				})
			} else {
				rootImportMailSetId = await this.mailFacade.createMailFolder(initializeParams.rootImportMailSetName, null, mailGroupId)
			}
		}

		let syncLabelId: IdTuple | null = null
		if (initializeParams.imapSyncLabelData) {
			syncLabelId = await this.mailFacade.createLabel(mailGroupId, initializeParams.imapSyncLabelData)
		}

		const mailGroupKey = await this.groupKeyProvider.getCurrentSymGroupKey(mailGroupId)
		const sk = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

		const imapPostIn = createImapPostIn({
			imapAccount: initializeParams.imapAccount,
			maxQuota: initializeParams.maxQuota,
			postponedUntil: Date.now().toString(),
			rootImportMailSet: rootImportMailSetId,
			syncLabel: syncLabelId,
			provider: initializeParams.provider.toString(),
		})
		imapPostIn.ownerEncSessionKey = ownerEncSessionKey.key
		imapPostIn.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
		imapPostIn.ownerGroup = mailGroupId

		const imapPostOut = await this.serviceExecutor.post(ImapService, imapPostIn, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey: sk })
		const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapPostOut.imapAccountSyncState)

		let initialFolderSyncStates: ImapFolderSyncState[] = []
		if (initializeParams.imapMailboxesToTutaMailSets) {
			initialFolderSyncStates = await this.createInitialImportMailFolders(imapAccountSyncState, initializeParams.imapMailboxesToTutaMailSets)
		} else if (
			initializeParams.spamFolderMigrationInformation.shouldMigrateSpamFolder &&
			initializeParams.spamFolderMigrationInformation.spamMailbox !== null
		) {
			const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
			const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
			const allMailSets = await this.entityClient.loadAll(MailSetTypeRef, mailbox.mailSets.mailSets)
			const spamMailSet = assertNotNull(allMailSets.find((mailSet) => mailSet.folderType === MailSetKind.SPAM))
			const mailSetMapping = new Map([
				[
					initializeParams.spamFolderMigrationInformation.spamMailbox.path,
					{ mailSetElementId: getElementId(spamMailSet), shouldSync: true, specialUse: ImapMailboxSpecialUse.JUNK },
				],
			])
			initialFolderSyncStates = await this.createInitialImportMailFolders(imapAccountSyncState, mailSetMapping)
		}

		return { imapAccountSyncState, initialFolderSyncStates }
	}

	async updateAccountSyncStateAndAllFolderSyncStates(
		imapAccountSyncState: ImapAccountSyncState,
		newImapAccountSyncStatus: ImapAccountSyncStatus,
		newImapFolderSyncStatus: ImapFolderSyncStatus,
		newPostponedUntil?: string,
	) {
		const ownerKeyVersion = parseKeyVersion(assertNotNull(imapAccountSyncState._ownerKeyVersion))
		const mailGroupKey = await this.groupKeyProvider.loadSymGroupKey(assertNotNull(imapAccountSyncState._ownerGroup), ownerKeyVersion)
		const imapPutIn = createImapPutIn({
			imapAccountSyncState: imapAccountSyncState._id,
			newImapAccountSyncStatus,
			newImapFolderSyncStatus,
			newPostponedUntil: newPostponedUntil ?? null,
		})
		const sessionKey = this.cryptoWrapper.decryptKey(mailGroupKey, assertNotNull(imapAccountSyncState._ownerEncSessionKey))
		await this.serviceExecutor.put(ImapService, imapPutIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey,
		})
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
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
		const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
		const imapFolderSyncStates: ImapFolderSyncState[] = []
		for (const [imapMailboxPath, { mailSetElementId, shouldSync, specialUse }] of imapMailboxesToTutaFolders.entries()) {
			const mailGroupKey = await this.groupKeyProvider.getCurrentSymGroupKey(mailGroupId)
			const sk = this.cryptoWrapper.aes256RandomKey()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const imapFolderPostIn = createImapFolderPostIn({
				path: imapMailboxPath,
				imapAccountSyncState: imapAccountSyncState._id,
				mailSet: shouldSync ? [mailbox.mailSets.mailSets, mailSetElementId] : null,
				shouldSync,
				imapSpecialUse: specialUse,
			})
			imapFolderPostIn.ownerEncSessionKey = ownerEncSessionKey.key
			imapFolderPostIn.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
			imapFolderPostIn.ownerGroup = mailGroupId
			const imapFolderPostOut = await this.serviceExecutor.post(ImapFolderService, imapFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			const imapFolderSyncState = await this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
			imapFolderSyncStates.push(imapFolderSyncState)
		}
		return imapFolderSyncStates
	}

	async initializeImapMailSet(
		imapMailbox: ImapMailbox,
		imapAccountSyncState: ImapAccountSyncState,
		parentMailSetId: IdTuple | null,
		shouldSync: boolean,
		shouldCreateLabels: boolean,
	): Promise<ImapFolderSyncState | undefined> {
		const isGmail = (parseInt(imapAccountSyncState.provider) as ImapProvider) === ImapProvider.Gmail
		const isGmailAllMailsFolder = isGmail && shouldSync && !shouldCreateLabels
		let name: string | undefined
		if (isGmailAllMailsFolder) {
			const rootMailSet = await this.entityClient.load(MailSetTypeRef, assertNotNull(imapAccountSyncState.rootImportMailSet))
			name = rootMailSet.name
		} else {
			name = imapMailbox.name
		}
		if (name) {
			const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
			let mailSetId: IdTuple | null
			if (shouldCreateLabels) {
				mailSetId = await this.mailFacade.createLabel(mailGroupId, {
					name: name,
					color: randomHexColor(),
					parentLabelId: parentMailSetId ?? undefined,
				})
			} else {
				mailSetId = shouldSync ? await this.mailFacade.createMailFolder(name, parentMailSetId, mailGroupId) : null
			}
			const mailGroupKey = await this.groupKeyProvider.getCurrentSymGroupKey(mailGroupId)
			const sk = this.cryptoWrapper.aes256RandomKey()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const imapFolderPostIn = createImapFolderPostIn({
				path: imapMailbox.path,
				imapAccountSyncState: imapAccountSyncState._id,
				mailSet: mailSetId,
				shouldSync: mailSetId !== null && !shouldCreateLabels,
				imapSpecialUse: imapMailbox.specialUse ?? null,
			})
			imapFolderPostIn.ownerEncSessionKey = ownerEncSessionKey.key
			imapFolderPostIn.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
			imapFolderPostIn.ownerGroup = mailGroupId

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
		folderSyncState.status = imapMailboxStatus.syncStatus.toString()
		await this.entityClient.update(folderSyncState)
	}

	async deleteImapFolderSyncState(folderSyncStateId: IdTuple) {
		await this.serviceExecutor.delete(ImapFolderService, createImapFolderDeleteIn({ imapFolderSyncState: folderSyncStateId }), null)
	}

	async getImapAccountSyncStateById(
		imapAccountSyncStateId: IdTuple,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<ImapAccountSyncState> {
		return await this.entityClient.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateId, opts)
	}

	async getImapFolderSyncStateById(imapFolderSyncStateId: IdTuple): Promise<ImapFolderSyncState> {
		return this.entityClient.load(ImapFolderSyncStateTypeRef, imapFolderSyncStateId)
	}

	async getImportedMails(importedMailListId: Id): Promise<ImportedImapMail[]> {
		return this.entityClient.loadAll(ImportedImapMailTypeRef, importedMailListId)
	}

	async getDeduplicatedImportedAttachments(mailGroupId: Id): Promise<DeduplicatedImportedAttachment[]> {
		const mailBoxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
		const mailBox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailBoxGroupRoot.mailbox))
		return await this.entityClient.loadAll(DeduplicatedImportedAttachmentTypeRef, assertNotNull(mailBox.deduplicatedImportedAttachments))
	}

	async getDeduplicatedImportedAttachmentListId(mailGroupId: Id) {
		const mailBoxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
		const mailBox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailBoxGroupRoot.mailbox))
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
