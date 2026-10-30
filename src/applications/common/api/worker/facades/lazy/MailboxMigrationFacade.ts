/**
 * The MailboxMigrationFacade is responsible for initializing (and terminating) a mailbox migration.
 * The MailboxMigrationFacade is also responsible for initializing the MailboxMigrationFolderSyncStates for each single mapping from migration folder to Tuta folder.
 * The facade communicates directly with the MailboxMigrationService and MailboxMigrationFolderService.
 */
import { CryptoWrapper, SymmetricCipherUtils } from "@tutao/crypto"
import { MailFacade } from "./MailFacade.js"
import { InitializeMigrationParams, MailSetMapping } from "../../../../../mail-app/workerUtils/migration/MailboxImporter"
import { assertNotNull, Nullable } from "@tutao/utils"
import {
	createMailboxMigrationDeleteIn,
	createMailboxMigrationFolderDeleteIn,
	createMailboxMigrationFolderPostIn,
	createMailboxMigrationFolderSyncStateTransferAggregatedType,
	createMailboxMigrationImapConfigurationTransferAggregatedType,
	createMailboxMigrationPostIn,
	createMailboxMigrationPutIn,
	createMailboxMigrationSyncStateTransferAggregatedType,
	createOAuthTokenEndpointResponseLegacyTransferAggregatedType,
	createUpdateMailboxMigrationSyncStateTransferAggregatedType,
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
	UpdateMailboxMigrationSyncStateTransferAggregatedType,
} from "@tutao/entities/tutanota"
import {
	createOAuthTokenTransferAggregatedType,
	createUserMigrationCredentialTransferAggregatedType,
	createUserMigrationInfoTransferAggregatedType,
	createUserMigrationServicePostIn,
	UserMigrationInfo,
	UserMigrationInfoTypeRef,
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
import { UserFacade } from "../../../../../../platform-kit/base/facades/UserFacade"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"

export class MailboxMigrationFacade {
	constructor(
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoader: KeyLoaderFacade,
		private readonly cryptoWrapper: CryptoWrapper,
		private readonly symmetricCipherUtils: SymmetricCipherUtils,
		private readonly userFacade: UserFacade,
	) {}

	async initializeMailboxImport(initializeParams: InitializeMigrationParams): Promise<{
		mailboxMigrationSyncState: MailboxMigrationSyncState
		initialFolderSyncStates: MailboxMigrationFolderSyncState[]
		userMigrationInfo: UserMigrationInfo | null
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

		const userGroupId = this.userFacade.getUserGroupId()
		const userGroupKey = this.keyLoader.getCurrentSymUserGroupKey()
		const userMigrationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const userMigrationOwnerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, userMigrationSessionKey)
		const oAuthToken = initializeParams.credential.oAuthToken
		const userMigrationCredential = createUserMigrationCredentialTransferAggregatedType({
			username: initializeParams.credential.username,
			password: initializeParams.credential.password,
			oAuthToken:
				oAuthToken &&
				createOAuthTokenTransferAggregatedType({
					accessToken: oAuthToken.accessToken,
					refreshToken: oAuthToken.refreshToken,
					expiresIn: oAuthToken.expiresIn,
					tokenType: oAuthToken.tokenType,
				}),
		})
		const userMigrationServicePostIn = createUserMigrationServicePostIn({
			userMigrationInfo: createUserMigrationInfoTransferAggregatedType({
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				_ownerEncSessionKey: userMigrationOwnerEncSessionKey.key,
				_ownerKeyVersion: userMigrationOwnerEncSessionKey.encryptingKeyVersion.toString(),
				provider: initializeParams.provider.toString(),
				credential: userMigrationCredential,
			}),
		})
		const userMigrationServicePostOut = await this.serviceExecutor.execute(UserMigrationService_POST, userMigrationServicePostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.keyLoader.assembleServiceEncryptionParamsForPost(userGroupId)),
		})

		const sk = this.cryptoWrapper.aes256RandomKey()
		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)
		const mailboxMigrationSyncStateTransfer = createMailboxMigrationSyncStateTransferAggregatedType({
			_ownerGroup: mailGroupId,
			_ownerEncSessionKey: ownerEncSessionKey.key,
			_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
			_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
			postponedUntil: Date.now().toString(),
			legacyProvider: null,
			imapConfiguration:
				initializeParams.imapConfiguration &&
				createMailboxMigrationImapConfigurationTransferAggregatedType({
					host: initializeParams.imapConfiguration.host,
					port: initializeParams.imapConfiguration.port,
					sharedUsername: initializeParams.imapConfiguration.sharedUsername,
					sharedPassword: initializeParams.imapConfiguration.sharedPassword,
					ignoreCertificateErrors: initializeParams.imapConfiguration.ignoreCertificateErrors,
					customCertificateData: initializeParams.imapConfiguration.customCertificateData,
					useSSL: initializeParams.imapConfiguration.useSSL,
					legacyOauthToken:
						initializeParams.imapConfiguration.legacyOauthToken &&
						createOAuthTokenEndpointResponseLegacyTransferAggregatedType({
							accessToken: initializeParams.imapConfiguration.legacyOauthToken.accessToken,
							refreshToken: initializeParams.imapConfiguration.legacyOauthToken.refreshToken,
							tokenType: initializeParams.imapConfiguration.legacyOauthToken.tokenType,
							expiresIn: initializeParams.imapConfiguration.legacyOauthToken.expiresIn,
						}),
				}),
			rootImportMailSet: rootImportMailSetId,
			syncLabel: syncLabelId,
		})
		const mailboxMigrationPostIn = createMailboxMigrationPostIn({
			userMigrationInfo: userMigrationServicePostOut.userMigrationInfo,
			mailboxMigrationSyncState: mailboxMigrationSyncStateTransfer,
		})
		const mailboxMigrationPostOut = await this.serviceExecutor.execute(MailboxMigrationService_POST, mailboxMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			...(await this.keyLoader.assembleServiceEncryptionParamsForPost(mailGroupId)),
		})
		const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationPostOut.mailboxMigrationSyncState)
		const userMigrationInfo = await this.getUserMigrationInfoById(userMigrationServicePostOut.userMigrationInfo)

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

		return { mailboxMigrationSyncState: mailboxMigrationSyncState, initialFolderSyncStates, userMigrationInfo }
	}

	async updateMailboxMigrationSyncStateAndAllFolderSyncStates(
		mailboxMigrationSyncState: MailboxMigrationSyncState,
		newMailboxMigrationSyncStatus: MailboxMigrationSyncStatus,
		newMailboxMigrationFolderSyncStatus: MailboxMigrationFolderSyncStatus,
		newPostponedUntil?: string,
	) {
		let mailboxMigrationSyncStateWithNewPostponedUntil: Nullable<UpdateMailboxMigrationSyncStateTransferAggregatedType> = null
		if (newPostponedUntil != null) {
			const kdfNonce = await this.entityClient.ensureKdfNonce(mailboxMigrationSyncState)
			mailboxMigrationSyncStateWithNewPostponedUntil = createUpdateMailboxMigrationSyncStateTransferAggregatedType({
				_ownerEncSessionKey: mailboxMigrationSyncState._ownerEncSessionKey,
				_ownerKeyVersion: mailboxMigrationSyncState._ownerKeyVersion,
				_kdfNonce: kdfNonce,
				postponedUntil: newPostponedUntil,
			})
		}

		const mailboxMigrationPutIn = createMailboxMigrationPutIn({
			mailboxMigrationSyncState: mailboxMigrationSyncState._id,
			newMailboxMigrationSyncStatus,
			newMailboxMigrationFolderSyncStatus,
			mailboxMigrationSyncStateWithNewPostponedUntil,
		})
		const ownerKeyVersion = parseKeyVersion(assertNotNull(mailboxMigrationSyncState._ownerKeyVersion))
		const mailGroupKey = await this.keyLoader.loadSymGroupKey(assertNotNull(mailboxMigrationSyncState._ownerGroup), ownerKeyVersion)
		const sessionKey = this.cryptoWrapper.decryptKey(mailGroupKey, assertNotNull(mailboxMigrationSyncState._ownerEncSessionKey))

		const ownerGroup = assertNotNull(mailboxMigrationSyncState._ownerGroup)
		await this.serviceExecutor.execute(MailboxMigrationService_PUT, mailboxMigrationPutIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey,
			...(await this.keyLoader.assembleServiceEncryptionParamsForPut(ownerGroup, mailboxMigrationSyncState)),
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

			const mailboxMigrationFolderSyncStateTransfer = createMailboxMigrationFolderSyncStateTransferAggregatedType({
				_ownerGroup: mailGroupId,
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				sourceId: migrationMailboxPath,
				specialUse: specialUse,
				mailSet: shouldSync ? [mailbox.mailSets.mailSets, mailSetElementId] : null,
			})
			const mailboxMigrationFolderPostIn = createMailboxMigrationFolderPostIn({
				mailboxMigrationSyncState: mailboxMigrationSyncState._id,
				shouldSync,
				mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateTransfer,
			})
			const mailboxMigrationFolderPostOut = await this.serviceExecutor.execute(MailboxMigrationFolderService_POST, mailboxMigrationFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				...(await this.keyLoader.assembleServiceEncryptionParamsForPost(mailGroupId)),
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

			const mailboxMigrationFolderSyncStateTransfer = createMailboxMigrationFolderSyncStateTransferAggregatedType({
				_ownerGroup: mailGroupId,
				_ownerEncSessionKey: ownerEncSessionKey.key,
				_ownerKeyVersion: ownerEncSessionKey.encryptingKeyVersion.toString(),
				_kdfNonce: this.symmetricCipherUtils.generateKdfNonce(),
				sourceId: migrationMailbox.sourceId,
				specialUse: migrationMailbox.specialUse ?? null,
				mailSet: mailSetId,
			})
			const mailboxMigrationFolderPostIn = createMailboxMigrationFolderPostIn({
				mailboxMigrationSyncState: mailboxMigrationSyncState._id,
				shouldSync: mailSetId !== null && !shouldCreateLabels,
				mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateTransfer,
			})

			const mailboxMigrationFolderPostOut = await this.serviceExecutor.execute(MailboxMigrationFolderService_POST, mailboxMigrationFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				...(await this.keyLoader.assembleServiceEncryptionParamsForPost(mailGroupId)),
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

	async getUserMigrationInfoById(userMigrationInfoId: IdTuple, opts: EntityRestClientLoadOptions = DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS) {
		return await this.entityClient.load(UserMigrationInfoTypeRef, userMigrationInfoId, opts)
	}

	async getMailboxMigrationFolderSyncStateById(mailboxMigrationFolderSyncStateId: IdTuple): Promise<MailboxMigrationFolderSyncState> {
		return this.entityClient.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateId)
	}

	async getAllUserMigrationInfo(userMigrationInfosListId: Id | null): Promise<UserMigrationInfo[]> {
		return userMigrationInfosListId ? this.entityClient.loadAll(UserMigrationInfoTypeRef, userMigrationInfosListId) : []
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
