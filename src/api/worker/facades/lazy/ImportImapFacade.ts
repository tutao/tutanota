/**
 * The ImportImapFacade is responsible for initializing (and terminating) an IMAP import process on the Tutanota server.
 * The ImportImapFacade is also responsible for initializing the ImportImapFolderSyncState for a single Tutanota folder.
 * The ImportImapFolderSyncState is needed to store relevant IMAP synchronization information for a single folder, most importantly the UID to TutanotaID map.
 * The facade communicates directly with the ImportImapService and the ImportImapFolderService.
 */
import { aes128RandomKey, encryptKey } from "@tutao/tutanota-crypto"
import { UserFacade } from "../UserFacade.js"
import { MailFacade } from "./MailFacade.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { EntityClient } from "../../../common/EntityClient.js"
import {
	createImportImapAccount,
	createImportImapFolderDeleteIn,
	createImportImapFolderPostIn,
	createImportImapPostIn,
	ImportImapAccountSyncState,
	ImportImapAccountSyncStateTypeRef,
	ImportImapAttachmentHashToId,
	ImportImapAttachmentHashToIdTypeRef,
	ImportImapFolderSyncState,
	ImportImapFolderSyncStateTypeRef,
	ImportImapUidToMailIds,
	ImportImapUidToMailIdsTypeRef,
	MailboxGroupRootTypeRef,
	MailFolder,
	MailFolderTypeRef,
} from "../../../entities/tutanota/TypeRefs.js"
import { ImportImapFolderService, ImportImapService } from "../../../entities/tutanota/Services.js"
import { GroupType } from "../../../common/TutanotaConstants.js"
import { InitializeImapImportParams } from "../../imapimport/ImapImporter.js"
import { ImapMailbox, ImapMailboxStatus } from "../../../../desktop/imapimport/adsync/imapmail/ImapMailbox.js"

export class ImportImapFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
	) {}

	async initializeImapImport(initializeParams: InitializeImapImportParams): Promise<ImportImapAccountSyncState> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)

		let rootImportMailFolder = await this.mailFacade.createMailFolder(initializeParams.rootImportMailFolderName, null, mailGroupId)

		let importImapAccount = createImportImapAccount({
			host: initializeParams.host,
			port: initializeParams.port,
			userName: initializeParams.username,
			password: initializeParams.password,
			accessToken: initializeParams.accessToken,
		})

		const mailGroupKey = this.userFacade.getGroupKey(mailGroupId)
		const sk = aes128RandomKey()
		const importImapPostIn = createImportImapPostIn({
			ownerEncImapAccountSyncStateSessionKey: encryptKey(mailGroupKey, sk),
			ownerGroup: mailGroupId,
			imapAccount: importImapAccount,
			maxQuota: initializeParams.maxQuota,
			postponedUntil: Date.now().toString(),
			rootImportMailFolder: rootImportMailFolder._id,
		})

		const importImapPostOut = await this.serviceExecutor.post(ImportImapService, importImapPostIn, { sessionKey: sk })
		return this.entityClient.load(ImportImapAccountSyncStateTypeRef, importImapPostOut.imapAccountSyncState)
	}

	async updateImapImport(
		initializeParams: InitializeImapImportParams,
		importImapAccountSyncState: ImportImapAccountSyncState,
	): Promise<ImportImapAccountSyncState> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)

		let newRootImportMailFolderName = initializeParams.rootImportMailFolderName
		if (importImapAccountSyncState.rootImportMailFolder != null) {
			let rootImportMailFolder = await this.getRootImportFolder(importImapAccountSyncState.rootImportMailFolder)
			if (newRootImportMailFolderName != rootImportMailFolder?.name) {
				let rootImportMailFolder = await this.mailFacade.createMailFolder(initializeParams.rootImportMailFolderName, null, mailGroupId)
				importImapAccountSyncState.rootImportMailFolder = rootImportMailFolder._id
			}
		}

		importImapAccountSyncState.imapAccount.host = initializeParams.host
		importImapAccountSyncState.imapAccount.port = initializeParams.port
		importImapAccountSyncState.imapAccount.userName = initializeParams.username
		importImapAccountSyncState.imapAccount.password = initializeParams.password

		await this.entityClient.update(importImapAccountSyncState)
		return this.entityClient.load(ImportImapAccountSyncStateTypeRef, importImapAccountSyncState._id)
	}

	async postponeImapImport(postponedUntil: Date, importImapAccountSyncStateId: Id): Promise<ImportImapAccountSyncState> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)

		const importImapAccountSyncState = await this.entityClient.load(ImportImapAccountSyncStateTypeRef, importImapAccountSyncStateId)
		importImapAccountSyncState.postponedUntil = postponedUntil.getTime().toString()

		await this.entityClient.update(importImapAccountSyncState)

		return importImapAccountSyncState
	}

	async createImportMailFolder(
		imapMailbox: ImapMailbox,
		importImapAccountSyncStateId: Id,
		parentFolderId: IdTuple | null,
	): Promise<ImportImapFolderSyncState | undefined> {
		if (imapMailbox.name) {
			const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)
			const newMailFolder = await this.mailFacade.createMailFolder(imapMailbox.name, parentFolderId, mailGroupId)

			const mailGroupKey = this.userFacade.getGroupKey(mailGroupId)
			const sk = aes128RandomKey()
			const importImapFolderPostIn = createImportImapFolderPostIn({
				ownerEncSessionKey: encryptKey(mailGroupKey, sk),
				ownerGroup: mailGroupId,
				path: imapMailbox.path,
				imapAccountSyncState: importImapAccountSyncStateId,
				mailFolder: newMailFolder._id,
			})

			const importImapFolderPostOut = await this.serviceExecutor.post(ImportImapFolderService, importImapFolderPostIn, { sessionKey: sk })
			return this.entityClient.load(ImportImapFolderSyncStateTypeRef, importImapFolderPostOut.imapFolderSyncState)
		}
	}

	async deleteImportMailFolder(imapMailbox: ImapMailbox, folderSyncState: ImportImapFolderSyncState): Promise<void> {
		await this.mailFacade.deleteFolder(folderSyncState.mailFolder)

		const importImapFolderDeleteIn = createImportImapFolderDeleteIn({
			imapFolderSyncState: folderSyncState._id,
		})
		await this.serviceExecutor.delete(ImportImapFolderService, importImapFolderDeleteIn)
	}

	async updateImportImapFolderSyncState(
		imapMailboxStatus: ImapMailboxStatus,
		folderSyncState: ImportImapFolderSyncState,
	): Promise<ImportImapFolderSyncState> {
		folderSyncState.uidnext = imapMailboxStatus.uidNext.toString()
		folderSyncState.uidvalidity = imapMailboxStatus.uidValidity.toString()
		folderSyncState.highestmodseq = imapMailboxStatus.highestModSeq?.toString() ?? null // value null denotes that the mailbox doesn't support persistent mod-sequences

		await this.entityClient.update(folderSyncState)
		return this.entityClient.load(ImportImapFolderSyncStateTypeRef, folderSyncState._id)
	}

	async getRootImportFolder(rootImportFolderId: IdTuple): Promise<MailFolder | null> {
		return this.entityClient.load(MailFolderTypeRef, rootImportFolderId)
	}

	async getImportImapAccountSyncState(): Promise<ImportImapAccountSyncState | null> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)
		const mailboxGroupRoot = await this.entityClient.load(MailboxGroupRootTypeRef, mailGroupId)

		// if imapAccountSyncState is null, no import is initialized yet
		if (mailboxGroupRoot.imapAccountSyncState == null) {
			return null
		}

		return this.entityClient.load(ImportImapAccountSyncStateTypeRef, mailboxGroupRoot.imapAccountSyncState)
	}

	async getAllImportImapFolderSyncStates(importImapFolderSyncStateListId: Id): Promise<ImportImapFolderSyncState[]> {
		return this.entityClient.loadAll(ImportImapFolderSyncStateTypeRef, importImapFolderSyncStateListId)
	}

	async getImportedImapUidToMailIdsMapList(importedImapUidToMailIdsMapId: Id): Promise<ImportImapUidToMailIds[]> {
		return this.entityClient.loadAll(ImportImapUidToMailIdsTypeRef, importedImapUidToMailIdsMapId)
	}

	async getImportedImapAttachmentHashToIdMap(importedImapAttachmentHashToIdMapId: IdTuple): Promise<ImportImapAttachmentHashToId> {
		return this.entityClient.load(ImportImapAttachmentHashToIdTypeRef, importedImapAttachmentHashToIdMapId)
	}

	async getImportedImapAttachmentHashToIdMapList(importedImapAttachmentHashToIdMapListId: Id): Promise<ImportImapAttachmentHashToId[]> {
		return this.entityClient.loadAll(ImportImapAttachmentHashToIdTypeRef, importedImapAttachmentHashToIdMapListId)
	}
}
