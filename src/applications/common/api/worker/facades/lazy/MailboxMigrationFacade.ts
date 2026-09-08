/**
 * The MailboxMigrationFacade is responsible for initializing (and terminating) a mailbox migration.
 * The MailboxMigrationFacade is also responsible for initializing the MailboxMigrationFolderSyncStates for each single mapping from migration folder to Tuta folder.
 * The facade communicates directly with the MailboxMigrationService and MailboxMigrationFolderService.
 */
import { CryptoWrapper } from "@tutao/crypto"
import { MailFacade } from "./MailFacade.js"
import { InitializeMigrationParams, MailSetMapping } from "../../../../../mail-app/workerUtils/migration/MailboxImporter"
import { assertNotNull } from "@tutao/utils"
import {
	createMailboxMigrationDeleteIn,
	createMailboxMigrationFolderDeleteIn,
	createMailboxMigrationFolderPostIn,
	createMailboxMigrationPostIn,
	createMailboxMigrationPutIn,
	DeduplicatedImportedAttachment,
	DeduplicatedImportedAttachmentTypeRef,
	ImportedMigrationMail,
	ImportedMigrationMailTypeRef,
	MailboxGroupRootTypeRef,
	MailboxMigrationFolderService_DELETE,
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
import { MailboxMigrationFolderSyncStatus, MailboxMigrationSyncStatus, MailSetKind } from "../../../../../../entities/tutanota/Utils"
import { MigrationMailbox, MigrationMailboxSpecialUse, MigrationMailboxStatus } from "../../../common/utils/migrationImportUtils/MigrationMailbox"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import {
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	DEFAULT_EXTRA_SERVICE_PARAMS,
	EntityRestClientLoadOptions,
} from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { getElementId, idToElementId } from "@tutao/meta"
import { randomHexColor } from "../../../common/utils/migrationImportUtils/MigrationImportUtils"
import { MailboxMigrationProvider } from "../../../common/utils/migrationImportUtils/MigrationKnownConfigs"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"

export class MailboxMigrationFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
	) {}

	async initializeMailboxImport(initializeParams: InitializeMigrationParams): Promise<{
		mailboxMigrationSyncState: MailboxMigrationSyncState
		initialFolderSyncStates: MailboxMigrationFolderSyncState[]
		userMigrationInformation: UserMigrationInformation | null
	}> {
		const mailGroupId = initializeParams.mailGroupId

		if (initializeParams.rootImportMailSetName === "" && !initializeParams.matchMigrationMailboxesToTutaMailSets) {
			throw new ProgrammingError("Either rootImportMailFolderName or matchMigrationMailboxesToTutaMailSets must be set")
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
		if (initializeParams.migrationSyncLabelData) {
			syncLabelId = await this.mailFacade.createLabel(mailGroupId, initializeParams.migrationSyncLabelData)
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
		userMigrationServicePostIn.ownerEncSessionKey = userMigrationOwnerEncSessionKey.key
		userMigrationServicePostIn.ownerKeyVersion = userMigrationOwnerEncSessionKey.encryptingKeyVersion.toString()
		const userMigrationServicePostOut = await this.serviceExecutor.execute(UserMigrationService_POST, userMigrationServicePostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: userMigrationSessionKey,
		})

		const sk = this.cryptoWrapper.aes256RandomKey()
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)
		const ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
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
		if (initializeParams.migrationMailboxesToTutaMailSets) {
			initialFolderSyncStates = await this.createInitialImportMailFolders(mailboxMigrationSyncState, initializeParams.migrationMailboxesToTutaMailSets)
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
					initializeParams.spamFolderMigrationInformation.spamMailbox.sourceId,
					{ mailSetElementId: getElementId(spamMailSet), shouldSync: true, specialUse: MigrationMailboxSpecialUse.JUNK },
				],
			])
			initialFolderSyncStates = await this.createInitialImportMailFolders(mailboxMigrationSyncState, mailSetMapping)
		}

		return { mailboxMigrationSyncState: mailboxMigrationSyncState, initialFolderSyncStates, userMigrationInformation }
	}

	async updateMailboxMigrationSyncStateAndAllFolderSyncStates(
		mailboxMigrationSyncState: MailboxMigrationSyncState,
		newMailboxMigrationSyncStatus: MailboxMigrationSyncStatus,
		newMailboxMigrationFolderSyncStatus: MailboxMigrationFolderSyncStatus,
		newPostponedUntil?: string,
	) {
		const mailboxMigrationPutIn = createMailboxMigrationPutIn({
			mailboxMigrationSyncState: mailboxMigrationSyncState._id,
			newMailboxMigrationSyncStatus: newMailboxMigrationSyncStatus,
			newMailboxMigrationFolderSyncStatus: newMailboxMigrationFolderSyncStatus,
			newPostponedUntil: newPostponedUntil ?? null,
		})
		const ownerKeyVersion = parseKeyVersion(assertNotNull(mailboxMigrationSyncState._ownerKeyVersion))
		const mailGroupKey = await this.keyLoader.loadSymGroupKey(assertNotNull(mailboxMigrationSyncState._ownerGroup), ownerKeyVersion)
		const sessionKey = this.cryptoWrapper.decryptKey(mailGroupKey, assertNotNull(mailboxMigrationSyncState._ownerEncSessionKey))

		await this.serviceExecutor.execute(MailboxMigrationService_PUT, mailboxMigrationPutIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey,
		})
	}

	async deleteMigrationImport(mailboxMigrationSyncStateId: IdTuple): Promise<void> {
		const mailboxMigrationDeleteIn = createMailboxMigrationDeleteIn({ mailboxMigrationSyncState: mailboxMigrationSyncStateId })
		await this.serviceExecutor.execute(MailboxMigrationService_DELETE, mailboxMigrationDeleteIn, null)
	}

	async createInitialImportMailFolders(
		mailboxMigrationSyncState: MailboxMigrationSyncState,
		migrationMailboxesToTutaFolders: Map<string, MailSetMapping>,
	): Promise<MailboxMigrationFolderSyncState[]> {
		const mailGroupId = assertNotNull(mailboxMigrationSyncState._ownerGroup)
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
		const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
		const mailboxMigrationFolderSyncStates: MailboxMigrationFolderSyncState[] = []
		for (const [migrationMailboxPath, { mailSetElementId, shouldSync, specialUse }] of migrationMailboxesToTutaFolders.entries()) {
			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = this.cryptoWrapper.aes256RandomKey()
			const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)

			const mailboxMigrationFolderPostIn = createMailboxMigrationFolderPostIn({
				sourceId: migrationMailboxPath,
				mailboxMigrationSyncState: mailboxMigrationSyncState._id,
				mailSet: shouldSync ? [mailbox.mailSets.mailSets, mailSetElementId] : null,
				shouldSync,
				specialUse,
			})
			mailboxMigrationFolderPostIn.ownerEncSessionKey = ownerEncSessionKey.key
			mailboxMigrationFolderPostIn.ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()
			mailboxMigrationFolderPostIn.ownerGroup = mailGroupId
			const mailboxMigrationFolderPostOut = await this.serviceExecutor.execute(MailboxMigrationFolderService_POST, mailboxMigrationFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			const mailboxMigrationFolderSyncState = await this.entityClient.load(
				MailboxMigrationFolderSyncStateTypeRef,
				mailboxMigrationFolderPostOut.mailboxMigrationFolderSyncState,
			)
			mailboxMigrationFolderSyncStates.push(mailboxMigrationFolderSyncState)
		}
		return mailboxMigrationFolderSyncStates
	}

	async initializeMigrationMailSet(
		migrationMailbox: MigrationMailbox,
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
			name = migrationMailbox.name
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
				sourceId: migrationMailbox.sourceId,
				mailboxMigrationSyncState: mailboxMigrationSyncState._id,
				mailSet: mailSetId,
				shouldSync: mailSetId !== null && !shouldCreateLabels,
				specialUse: migrationMailbox.specialUse ?? null,
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

	async updateMigrationFolderSyncState(migrationMailboxStatus: MigrationMailboxStatus, folderSyncState: MailboxMigrationFolderSyncState): Promise<void> {
		folderSyncState.uidnext = migrationMailboxStatus.uidNext.toString()
		folderSyncState.uidvalidity = migrationMailboxStatus.uidValidity.toString()
		folderSyncState.status = migrationMailboxStatus.syncStatus.toString()
		await this.entityClient.update(folderSyncState)
	}

	async deleteMigrationFolderSyncState(folderSyncStateId: IdTuple) {
		await this.serviceExecutor.execute(
			MailboxMigrationFolderService_DELETE,
			createMailboxMigrationFolderDeleteIn({ mailboxMigrationFolderSyncState: folderSyncStateId }),
			null,
		)
	}

	async getMailboxMigrationSyncStateById(
		mailboxMigrationSyncStateId: IdTuple,
		opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	): Promise<MailboxMigrationSyncState> {
		return await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateId, opts)
	}

	async getMailboxMigrationFolderSyncStateById(mailboxMigrationFolderSyncStateId: IdTuple): Promise<MailboxMigrationFolderSyncState> {
		return this.entityClient.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateId)
	}

	async getAllUserMigrationInformation(userMigrationInfosListId: Id | null): Promise<UserMigrationInformation[]> {
		return userMigrationInfosListId ? this.entityClient.loadAll(UserMigrationInformationTypeRef, userMigrationInfosListId) : []
	}

	async getUserMigrationInformationById(userMigrationInformationId: IdTuple): Promise<UserMigrationInformation> {
		return this.entityClient.load(UserMigrationInformationTypeRef, userMigrationInformationId)
	}

	async getImportedMails(importedMailListId: Id): Promise<ImportedMigrationMail[]> {
		return this.entityClient.loadAll(ImportedMigrationMailTypeRef, importedMailListId)
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

	async getAllMailboxMigrationSyncStates(mailboxMigrationSyncStateListId: Id) {
		return this.entityClient.loadAll(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateListId)
	}

	async getAllMailboxMigrationFolderSyncStates(mailboxMigrationFolderSyncStateListId: Id): Promise<MailboxMigrationFolderSyncState[]> {
		return this.entityClient.loadAll(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateListId)
	}
}
