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
	createImapPutIn,
	createMailboxMigrationDeleteIn,
	createMailboxMigrationPostIn,
	DeduplicatedImportedAttachment,
	DeduplicatedImportedAttachmentTypeRef,
	ImapFolderService_DELETE,
	ImapFolderService_POST,
	ImapService_PUT,
	ImportedImapMail,
	ImportedImapMailTypeRef,
	MailboxGroupRootTypeRef,
	MailboxMigrationService_DELETE,
	MailboxMigrationService_POST,
	MailboxMigrationSyncState,
	MailboxMigrationSyncStateTypeRef,
	MailBoxTypeRef,
	MailSetTypeRef,
	MigrationFolderSyncState,
	MigrationFolderSyncStateTypeRef,
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
import { ImapAccountSyncStatus, ImapFolderSyncStatus, MailSetKind } from "../../../../../../entities/tutanota/Utils"
import { ImapMailbox, ImapMailboxSpecialUse, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { KeyLoaderFacade } from "../../../../../../platform-kit/base/base-crypto/KeyLoaderFacade"
import {
	DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
	DEFAULT_EXTRA_SERVICE_PARAMS,
	EntityRestClientLoadOptions,
} from "../../../../../../platform-kit/instance-pipeline/RestClientOptions"
import { getElementId, idToElementId } from "@tutao/meta"
import { parseKeyVersion } from "../../../../../../platform-kit/crypto/CryptoUtils"
import { oAuthTokenLikeToTokenEndpointResponse, randomHexColor, tokenEndpointResponseToOAuthToken } from "../../../common/utils/imapImportUtils/ImapImportUtils"
import { ImapProvider } from "../../../common/utils/imapImportUtils/ImapKnownConfigs"

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
	): Promise<{ imapAccountSyncState: MailboxMigrationSyncState; initialFolderSyncStates: MigrationFolderSyncState[] }> {
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

		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const sk = this.cryptoWrapper.aes256RandomKey()
		const ownerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(mailGroupKey, sk)
		const ownerKeyVersion = ownerEncSessionKey.encryptingKeyVersion.toString()

		// The current source of truth for the account's credentials is a UserMigrationInformation created via
		// UserMigrationService, not the (legacy/shared-fallback) imapAccount embedded in the sync state.
		// See ImapImportUtils.getImapCredentialSource.
		// UserMigrationInformation has no client-settable ownerGroup (it lives in the user's own
		// userMigrationInfos list), so its session key must be wrapped with the user group key, not the
		// mailGroupKey used below for MailboxMigrationPostIn - otherwise decrypting it back fails with
		// "invalid mac" since the entity's actual _ownerGroup won't match the group the key was wrapped with.
		// MailboxMigrationPostIn only needs the resulting id (userMigrationServicePostOut.credential) to link
		// back to it; the two payloads don't need to share a session key.
		const userGroupKey = this.keyLoader.getCurrentSymUserGroupKey()
		const userMigrationSessionKey = this.cryptoWrapper.aes256RandomKey()
		const userMigrationOwnerEncSessionKey = this.cryptoWrapper.encryptKeyWithVersionedKey(userGroupKey, userMigrationSessionKey)

		const userMigrationCredential = createUserMigrationCredential({
			username: assertNotNull(initializeParams.imapAccount.sharedUsername),
			password: initializeParams.imapAccount.sharedPassword,
			oAuthToken: initializeParams.imapAccount.sharedOauthToken
				? tokenEndpointResponseToOAuthToken(oAuthTokenLikeToTokenEndpointResponse(initializeParams.imapAccount.sharedOauthToken))
				: null,
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

		const mailboxMigrationPostIn = createMailboxMigrationPostIn({
			postponedUntil: Date.now().toString(),
			provider: initializeParams.provider.toString(),
			mailboxMigrationImapConfiguration: initializeParams.imapAccount,
			rootImportMailSet: rootImportMailSetId,
			syncLabel: syncLabelId,
			// Links the sync state to the UserMigrationInformation created above so the server can set
			// UserMigrationInformation.mailboxMigrationSyncState atomically in this same request, instead of
			// requiring a separate load+patch+update afterward.
			userMigrationInformation: userMigrationServicePostOut.credential,
		})
		mailboxMigrationPostIn.ownerEncSessionKey = ownerEncSessionKey.key
		mailboxMigrationPostIn.ownerKeyVersion = ownerKeyVersion
		mailboxMigrationPostIn.ownerGroup = mailGroupId

		console.log("before post out")
		const mailboxMigrationPostOut = await this.serviceExecutor.execute(MailboxMigrationService_POST, mailboxMigrationPostIn, {
			...DEFAULT_EXTRA_SERVICE_PARAMS,
			sessionKey: sk,
		})
		console.log("after postout.")
		//const imapPostOut = await this.serviceExecutor.execute(ImapService_POST, imapPostIn, { ...DEFAULT_EXTRA_SERVICE_PARAMS, sessionKey: sk })
		//const imapAccountSyncState = await this.entityClient.load(ImapAccountSyncStateTypeRef, imapPostOut.imapAccountSyncState)
		const mailboxMigrationSyncState = await this.entityClient.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationPostOut.mailboxMigrationSyncState)

		console.log("got here... ##")
		let initialFolderSyncStates: MigrationFolderSyncState[] = []
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

		return { imapAccountSyncState: mailboxMigrationSyncState, initialFolderSyncStates }
	}

	// NOTE: intentionally still using the deprecated ImapService here. MailboxMigrationService only exposes
	// POST/DELETE (see Services.ts) - there is no PUT to update status/postponedUntil for the sync state and
	// cascade it to all of its folder sync states. Raising as an open question rather than guessing a
	// replacement: MigrationFolderSyncState.status is a plain, directly-updatable field, so this *could* be
	// reimplemented with N+1 generic EntityClient.update() calls (one per folder sync state, mirroring
	// updateImapFolderSyncState below), but that trades the current single atomic server-side operation for
	// several non-atomic ones, and MailboxMigrationSyncState.postponedUntil is non-nullable, so the "clear
	// postponedUntil" behavior used by the ImapPutIn call below (`newPostponedUntil ?? null`) has no direct
	// equivalent via a plain field write.
	async updateAccountSyncStateAndAllFolderSyncStates(
		imapAccountSyncState: MailboxMigrationSyncState,
		newImapAccountSyncStatus: ImapAccountSyncStatus,
		newImapFolderSyncStatus: ImapFolderSyncStatus,
		newPostponedUntil?: string,
	) {
		const ownerKeyVersion = parseKeyVersion(assertNotNull(imapAccountSyncState._ownerKeyVersion))
		const mailGroupKey = await this.keyLoader.loadSymGroupKey(assertNotNull(imapAccountSyncState._ownerGroup), ownerKeyVersion)
		const imapPutIn = createImapPutIn({
			imapAccountSyncState: imapAccountSyncState._id,
			newImapAccountSyncStatus,
			newImapFolderSyncStatus,
			newPostponedUntil: newPostponedUntil ?? null,
		})
		const sessionKey = this.cryptoWrapper.decryptKey(mailGroupKey, assertNotNull(imapAccountSyncState._ownerEncSessionKey))
		await this.serviceExecutor.execute(ImapService_PUT, imapPutIn, {
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
	): Promise<MigrationFolderSyncState[]> {
		const mailGroupId = assertNotNull(imapAccountSyncState._ownerGroup)
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))
		const mailbox = await this.entityClient.load(MailBoxTypeRef, idToElementId(mailboxGroupRoot.mailbox))
		const imapFolderSyncStates: MigrationFolderSyncState[] = []
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
			const imapFolderSyncState = await this.entityClient.load(MigrationFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
			imapFolderSyncStates.push(imapFolderSyncState)
		}
		return imapFolderSyncStates
	}

	async initializeImapMailSet(
		imapMailbox: ImapMailbox,
		imapAccountSyncState: MailboxMigrationSyncState,
		provider: ImapProvider,
		parentMailSetId: IdTuple | null,
		shouldSync: boolean,
		shouldCreateLabels: boolean,
	): Promise<MigrationFolderSyncState | undefined> {
		const isGmail = provider === ImapProvider.Gmail
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
			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
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

			const imapFolderPostOut = await this.serviceExecutor.execute(ImapFolderService_POST, imapFolderPostIn, {
				...DEFAULT_EXTRA_SERVICE_PARAMS,
				sessionKey: sk,
			})
			return this.entityClient.load(MigrationFolderSyncStateTypeRef, imapFolderPostOut.imapFolderSyncState)
		}
	}

	async updateImapFolderSyncState(imapMailboxStatus: ImapMailboxStatus, folderSyncState: MigrationFolderSyncState): Promise<void> {
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

	async getImapFolderSyncStateById(imapFolderSyncStateId: IdTuple): Promise<MigrationFolderSyncState> {
		return this.entityClient.load(MigrationFolderSyncStateTypeRef, imapFolderSyncStateId)
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

	async getAllImapFolderSyncStates(imapFolderSyncStateListId: Id): Promise<MigrationFolderSyncState[]> {
		return this.entityClient.loadAll(MigrationFolderSyncStateTypeRef, imapFolderSyncStateListId)
	}
}
