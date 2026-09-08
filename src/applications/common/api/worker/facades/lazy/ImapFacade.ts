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
	createImapFolderDeleteIn,
	createImapFolderPostIn,
	createMailboxMigrationDeleteIn,
	createMailboxMigrationFolderPostIn,
	createMailboxMigrationPostIn,
	createMailboxMigrationPutIn,
	DeduplicatedImportedAttachment,
	DeduplicatedImportedAttachmentTypeRef,
	ImapFolderService_DELETE,
	ImapFolderService_POST,
	ImportedImapMail,
	ImportedImapMailTypeRef,
	MailboxGroupRootTypeRef,
	MailboxMigrationFolderService_POST,
	MailboxMigrationFolderSyncState,
	MailboxMigrationFolderSyncStateTypeRef,
	MailboxMigrationService_DELETE,
	MailboxMigrationService_POST,
	MailboxMigrationService_PUT,
	MailboxMigrationSyncState,
	MailboxMigrationSyncStateTypeRef,
	MailBoxTypeRef,
	MailSetTypeRef,
} from "@tutao/entities/tutanota"
import {
	createUserMigrationCredential,
	createUserMigrationServicePostIn,
	UserMigrationInformation,
	UserMigrationInformationTypeRef,
	UserMigrationService_POST,
} from "@tutao/entities/sys"
import { EntityClient } from "../../../../../../platform-kit/network/EntityClient"
import { IServiceExecutor } from "../../../../../../platform-kit/network/ServiceRequest"
import { ProgrammingError } from "@tutao/app-env"
import { ImapAccountSyncStatus, MailboxMigrationFolderSyncStatus, MailSetKind } from "../../../../../../entities/tutanota/Utils"
import { ImapMailbox, ImapMailboxSpecialUse, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import {
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	DEFAULT_EXTRA_SERVICE_PARAMS,
	EntityRestClientLoadOptions,
} from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { getElementId, idToElementId } from "@tutao/meta"
import { randomHexColor } from "../../../common/utils/imapImportUtils/ImapImportUtils"
import { MailboxMigrationProvider } from "../../../common/utils/imapImportUtils/ImapKnownConfigs"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"

export class ImapFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async initializeImapImport(initializeParams: InitializeImapImportParams): Promise<{
		imapAccountSyncState: MailboxMigrationSyncState
		initialFolderSyncStates: MailboxMigrationFolderSyncState[]
		userMigrationInformation: UserMigrationInformation
	}> {
		const mailGroupId = initializeParams.mailGroupId

		if (initializeParams.rootImportMailSetName === "" && !initializeParams.matchImapMailboxesToTutaMailSets) {
			throw new ProgrammingError("Either rootImportMailFolderName or matchImapMailboxesToTutaMailSets must be set")
		}

		let rootImportMailSetId: IdTuple | null = null
		if (initializeParams.rootImportMailSetName) {
			if (initializeParams.provider === MailboxMigrationProvider.Gmail) {
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

		const userGroupKey = this.keyLoader.getCurrentSymUserGroupKey()
		const userMigrationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const userMigrationOwnerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, userMigrationSessionKey)
		const userMigrationCredential = createUserMigrationCredential({
			username: initializeParams.credential.username,
			password: initializeParams.credential.password,
			oAuthToken: initializeParams.credential.oAuthToken,
		})

		const userMigrationServicePostIn = createUserMigrationServicePostIn({
			provider: initializeParams.provider.toString(),
			credential: userMigrationCredential,
		})

		const sk = this.cryptoWrapper.aes256RandomKey()
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)
		const ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
		userMigrationServicePostIn.ownerEncSessionKey = userMigrationOwnerEncSessionKey.key
		userMigrationServicePostIn.ownerKeyVersion = userMigrationOwnerEncSessionKey.encryptingKeyVersion.toString()
		const userMigrationServicePostOut = await this.serviceExecutor.execute(UserMigrationService_POST, userMigrationServicePostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: userMigrationSessionKey,
		})

		const mailboxMigrationPostIn = createMailboxMigrationPostIn({
			postponedUntil: Date.now().toString(),
			provider: initializeParams.provider.toString(),
			imapConfiguration: initializeParams.imapConfiguration,
			rootImportMailSet: rootImportMailSetId,
			syncLabel: syncLabelId,
			userMigrationInfo: userMigrationServicePostOut.userMigrationInfo,
		})
		mailboxMigrationPostIn.ownerEncSessionKey = ownerEncSessionKey.key
		mailboxMigrationPostIn.ownerKeyVersion = ownerKeyVersion
		mailboxMigrationPostIn.ownerGroup = mailGroupId

		const mailboxMigrationPostOut = await this.serviceExecutor.execute(MailboxMigrationService_POST, mailboxMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: sk,
		})
		const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationPostOut.mailboxMigrationSyncState)
		const userMigrationInformation = await this.entityClient.load(UserMigrationInformationTypeRef, userMigrationServicePostOut.userMigrationInfo)

		let initialFolderSyncStates: MailboxMigrationFolderSyncState[] = []
		if (initializeParams.imapMailboxesToTutaMailSets) {
			initialFolderSyncStates = await this.createInitialImportMailFolders(mailboxMigrationSyncState, initializeParams.imapMailboxesToTutaMailSets)
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
			initialFolderSyncStates = await this.createInitialImportMailFolders(mailboxMigrationSyncState, mailSetMapping)
		}

		return { imapAccountSyncState: mailboxMigrationSyncState, initialFolderSyncStates, userMigrationInformation }
	}

	async updateAccountSyncStateAndAllFolderSyncStates(
		imapAccountSyncState: MailboxMigrationSyncState,
		newImapAccountSyncStatus: ImapAccountSyncStatus,
		newImapFolderSyncStatus: MailboxMigrationFolderSyncStatus,
		newPostponedUntil?: string,
	) {
		const mailboxMigrationPutIn = createMailboxMigrationPutIn({
			mailboxMigrationSyncState: imapAccountSyncState._id,
			newMailboxMigrationSyncStatus: newImapAccountSyncStatus,
			newMailboxMigrationFolderSyncStatus: newImapFolderSyncStatus,
			newPostponedUntil: newPostponedUntil ?? null,
		})
		const ownerKeyVersion = parseKeyVersion(assertNotNull(imapAccountSyncState._ownerKeyVersion))
		const mailGroupKey = await this.keyLoader.loadSymGroupKey(assertNotNull(imapAccountSyncState._ownerGroup), ownerKeyVersion)
		const sessionKey = this.cryptoWrapper.decryptKey(mailGroupKey, assertNotNull(imapAccountSyncState._ownerEncSessionKey))

		await this.serviceExecutor.execute(MailboxMigrationService_PUT, mailboxMigrationPutIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey,
		})
	}

	async deleteImapImport(imapAccountSyncStateId: IdTuple): Promise<void> {
		const mailboxMigrationDeleteIn = createMailboxMigrationDeleteIn({ mailboxMigrationSyncState: imapAccountSyncStateId })
		await this.serviceExecutor.execute(MailboxMigrationService_DELETE, mailboxMigrationDeleteIn, null)
	}

	async createInitialImportMailFolders(
		imapAccountSyncState: MailboxMigrationSyncState,
		imapMailboxesToTutaFolders: Map<string, MailSetMapping>,
	): Promise<MailboxMigrationFolderSyncState[]> {
		const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
		const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
		const imapFolderSyncStates: MailboxMigrationFolderSyncState[] = []
		for (const [imapMailboxPath, { mailSetElementId, shouldSync, specialUse }] of imapMailboxesToTutaFolders.entries()) {
			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
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
			const imapFolderPostOut = await this.serviceExecutor.execute(ImapFolderService_POST, imapFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			const imapFolderSyncState = await this.entityClient.load(MailboxMigrationFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
			imapFolderSyncStates.push(imapFolderSyncState)
		}
		return imapFolderSyncStates
	}

	async initializeImapMailSet(
		imapMailbox: ImapMailbox,
		mailboxMigrationSyncState: MailboxMigrationSyncState,
		provider: MailboxMigrationProvider,
		parentMailSetId: IdTuple | null,
		shouldSync: boolean,
		shouldCreateLabels: boolean,
	): Promise<MailboxMigrationFolderSyncState | undefined> {
		const isGmail = provider === MailboxMigrationProvider.Gmail
		const isGmailAllMailsFolder = isGmail && shouldSync && !shouldCreateLabels
		let name: string | undefined
		if (isGmailAllMailsFolder) {
			const rootMailSet = await this.entityClient.load(MailSetTypeRef, assertNotNull(mailboxMigrationSyncState.rootImportMailSet))
			name = rootMailSet.name
		} else {
			name = imapMailbox.name
		}
		if (name) {
			const mailGroupId = assertNotNull(mailboxMigrationSyncState._ownerGroup)
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
			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = this.cryptoWrapper.aes256RandomKey()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const mailboxMigrationFolderPostIn = createMailboxMigrationFolderPostIn({
				path: imapMailbox.path,
				mailboxMigrationSyncState: mailboxMigrationSyncState._id,
				mailSet: mailSetId,
				shouldSync: mailSetId !== null && !shouldCreateLabels,
				specialUse: imapMailbox.specialUse ?? null,
			})
			mailboxMigrationFolderPostIn.ownerEncSessionKey = ownerEncSessionKey.key
			mailboxMigrationFolderPostIn.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
			mailboxMigrationFolderPostIn.ownerGroup = mailGroupId

			const mailboxMigrationFolderPostOut = await this.serviceExecutor.execute(MailboxMigrationFolderService_POST, mailboxMigrationFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			return this.entityClient.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderPostOut.mailboxMigrationFolderSyncState)
		}
	}

	async updateImapFolderSyncState(imapMailboxStatus: ImapMailboxStatus, folderSyncState: MailboxMigrationFolderSyncState): Promise<void> {
		folderSyncState.uidnext = imapMailboxStatus.uidNext.toString()
		folderSyncState.uidvalidity = imapMailboxStatus.uidValidity.toString()
		folderSyncState.status = imapMailboxStatus.syncStatus.toString()
		await this.entityClient.update(folderSyncState)
	}

	async deleteImapFolderSyncState(folderSyncStateId: IdTuple) {
		await this.serviceExecutor.execute(ImapFolderService_DELETE, createImapFolderDeleteIn({ imapFolderSyncState: folderSyncStateId }), null)
	}

	async getImapAccountSyncStateById(
		imapAccountSyncStateId: IdTuple,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<MailboxMigrationSyncState> {
		return await this.entityClient.load(MailboxMigrationSyncStateTypeRef, imapAccountSyncStateId, opts)
	}

	async getImapFolderSyncStateById(imapFolderSyncStateId: IdTuple): Promise<MailboxMigrationFolderSyncState> {
		return this.entityClient.load(MailboxMigrationFolderSyncStateTypeRef, imapFolderSyncStateId)
	}

	async getAllUserMigrationInformation(userMigrationInfosListId: Id | null): Promise<UserMigrationInformation[]> {
		return userMigrationInfosListId ? this.entityClient.loadAll(UserMigrationInformationTypeRef, userMigrationInfosListId) : []
	}

	async getUserMigrationInformationById(userMigrationInformationId: IdTuple): Promise<UserMigrationInformation> {
		return this.entityClient.load(UserMigrationInformationTypeRef, userMigrationInformationId)
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
		return this.entityClient.loadAll(MailboxMigrationSyncStateTypeRef, imapAccountSyncStateListId)
	}

	async getAllImapFolderSyncStates(imapFolderSyncStateListId: Id): Promise<MailboxMigrationFolderSyncState[]> {
		return this.entityClient.loadAll(MailboxMigrationFolderSyncStateTypeRef, imapFolderSyncStateListId)
	}
}
