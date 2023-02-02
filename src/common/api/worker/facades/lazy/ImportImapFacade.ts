/**
 * The ImportImapFacade is responsible for initializing (and terminating) an IMAP import process on the Tutanota server.
 * The ImportImapFacade is also responsible for initializing the ImportImapFolderSyncState for a single Tutanota folder.
 * The ImportImapFolderSyncState is needed to store relevant IMAP synchronization information for a single folder, most importantly the UID to TutanotaID map.
 * The facade communicates directly with the ImportImapService and the ImportImapFolderService.
 */
import { aes256RandomKey, encryptKey } from "@tutao/crypto"
import { UserFacade } from "../UserFacade.js"
import { MailFacade } from "./MailFacade.js"
import { IServiceExecutor } from "../../../common/ServiceRequest.js"
import { EntityClient } from "../../../common/EntityClient.js"
import { tutanotaTypeRefs, tutanotaServices, isFolder } from "@tutao/typerefs"
import { GroupType, MailSetKind } from "@tutao/app-env"
import { InitializeImapImportParams } from "../../../../../mail-app/workerUtils/imapimport/ImapImporter"
import { ImapMailbox, ImapMailboxSpecialUse, ImapMailboxStatus } from "../../../common/utils/imapImportUtils/ImapMailbox"
import { KeyLoaderFacade } from "../KeyLoaderFacade"
import { assertNotNull, getFirstOrThrow, isEmpty } from "@tutao/utils"
import { FolderSystem } from "../../../common/mail/FolderSystem"

export class ImportImapFacade {
	constructor(
		private readonly userFacade: UserFacade,
		private readonly mailFacade: MailFacade,
		private readonly serviceExecutor: IServiceExecutor,
		private readonly entityClient: EntityClient,
		private readonly keyLoader: KeyLoaderFacade,
	) {}

	async initializeImapImport(initializeParams: InitializeImapImportParams): Promise<tutanotaTypeRefs.ImportImapAccountSyncState> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)

		if (initializeParams.rootImportMailFolderName == null && !initializeParams.matchImportFoldersToTutanotaFolders) {
			throw new Error("Either rootImportMailFolderName or matchImportFoldersToTutanotaFolders must be set")
		}
		let rootImportMailFolderId: IdTuple | null = null
		if (initializeParams.rootImportMailFolderName) {
			rootImportMailFolderId = await this.mailFacade.createMailFolder(initializeParams.rootImportMailFolderName, null, mailGroupId)
		}

		let importImapAccount = tutanotaTypeRefs.createImportImapAccount({
			host: initializeParams.host,
			port: initializeParams.port.toString(),
			userName: initializeParams.username,
			password: initializeParams.password,
			accessToken: initializeParams.accessToken,
		})

		const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
		const sk = aes256RandomKey()
		const importImapPostIn = tutanotaTypeRefs.createImportImapPostIn({
			ownerEncSessionKey: encryptKey(mailGroupKey.object, sk),
			ownerGroup: mailGroupId,
			imapAccount: importImapAccount,
			maxQuota: initializeParams.maxQuota,
			postponedUntil: Date.now().toString(),
			rootImportMailFolder: rootImportMailFolderId,
		})

		const importImapPostOut = await this.serviceExecutor.post(tutanotaServices.ImportImapService, importImapPostIn, { sessionKey: sk })
		return this.entityClient.load(tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef, importImapPostOut.imapAccountSyncState)
	}

	async updateImapImport(
		initializeParams: InitializeImapImportParams,
		importImapAccountSyncState: tutanotaTypeRefs.ImportImapAccountSyncState,
	): Promise<tutanotaTypeRefs.ImportImapAccountSyncState> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)

		let newRootImportMailFolderName = initializeParams.rootImportMailFolderName
		if (importImapAccountSyncState.rootImportMailFolder != null) {
			let rootImportMailFolder = await this.getRootImportFolder(importImapAccountSyncState.rootImportMailFolder)
			if (newRootImportMailFolderName !== null && newRootImportMailFolderName !== rootImportMailFolder?.name) {
				importImapAccountSyncState.rootImportMailFolder = await this.mailFacade.createMailFolder(newRootImportMailFolderName, null, mailGroupId)
			}
		}

		importImapAccountSyncState.imapAccount.host = initializeParams.host
		importImapAccountSyncState.imapAccount.port = initializeParams.port.toString()
		importImapAccountSyncState.imapAccount.userName = initializeParams.username
		importImapAccountSyncState.imapAccount.password = initializeParams.password

		await this.entityClient.update(importImapAccountSyncState)
		return this.entityClient.load(tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef, importImapAccountSyncState._id)
	}

	async postponeImapImport(postponedUntil: Date, importImapAccountSyncStateId: IdTuple): Promise<tutanotaTypeRefs.ImportImapAccountSyncState> {
		const importImapAccountSyncState = await this.entityClient.load(tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef, importImapAccountSyncStateId)
		importImapAccountSyncState.postponedUntil = postponedUntil.getTime().toString()

		await this.entityClient.update(importImapAccountSyncState)
		return importImapAccountSyncState
	}

	async deleteImapImport(importImapAccountSyncStateId: IdTuple): Promise<void> {
		const importImapDeleteIn = tutanotaTypeRefs.createImportImapDeleteIn({ imapAccountSyncState: importImapAccountSyncStateId })
		await this.serviceExecutor.delete(tutanotaServices.ImportImapService, importImapDeleteIn, { sessionKey: aes256RandomKey() })
	}

	async createImportMailFolder(
		imapMailbox: ImapMailbox,
		importImapAccountSyncState: tutanotaTypeRefs.ImportImapAccountSyncState,
		parentFolderId: IdTuple | null,
	): Promise<tutanotaTypeRefs.ImportImapFolderSyncState | undefined> {
		if (imapMailbox.name) {
			const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)
			// if a root folder is not set on importImapAccountSyncState, we try to match the folder to a Tutanota folder, if that fails, we create a new folder
			let mailFolderId: IdTuple
			if (importImapAccountSyncState.rootImportMailFolder == null) {
				const existingTutanotaFolder = await this.findExistingTutanotaFolderForImapMailbox(imapMailbox, mailGroupId)
				if (existingTutanotaFolder) {
					mailFolderId = existingTutanotaFolder._id
				} else {
					mailFolderId = await this.mailFacade.createMailFolder(imapMailbox.name, parentFolderId, mailGroupId)
				}
			} else {
				mailFolderId = await this.mailFacade.createMailFolder(imapMailbox.name, parentFolderId, mailGroupId)
			}

			const mailGroupKey = await this.keyLoader.getCurrentSymGroupKey(mailGroupId)
			const sk = aes256RandomKey()
			const importImapFolderPostIn = tutanotaTypeRefs.createImportImapFolderPostIn({
				ownerEncSessionKey: encryptKey(mailGroupKey.object, sk),
				ownerGroup: mailGroupId,
				path: imapMailbox.path,
				imapAccountSyncState: importImapAccountSyncState._id,
				mailFolder: mailFolderId,
			})

			const importImapFolderPostOut = await this.serviceExecutor.post(tutanotaServices.ImportImapFolderService, importImapFolderPostIn, {
				sessionKey: sk,
			})
			return this.entityClient.load(tutanotaTypeRefs.ImportImapFolderSyncStateTypeRef, importImapFolderPostOut.imapFolderSyncState)
		}
	}

	async deleteImportMailFolder(imapMailbox: ImapMailbox, folderSyncState: tutanotaTypeRefs.ImportImapFolderSyncState): Promise<void> {
		await this.mailFacade.deleteFolder(folderSyncState.mailFolder)

		const importImapFolderDeleteIn = tutanotaTypeRefs.createImportImapFolderDeleteIn({
			imapFolderSyncState: folderSyncState._id,
		})
		await this.serviceExecutor.delete(tutanotaServices.ImportImapFolderService, importImapFolderDeleteIn)
	}

	async updateImportImapFolderSyncState(
		imapMailboxStatus: ImapMailboxStatus,
		folderSyncState: tutanotaTypeRefs.ImportImapFolderSyncState,
	): Promise<tutanotaTypeRefs.ImportImapFolderSyncState> {
		folderSyncState.uidnext = imapMailboxStatus.uidNext.toString()
		folderSyncState.uidvalidity = imapMailboxStatus.uidValidity.toString()
		folderSyncState.highestmodseq = imapMailboxStatus.highestModSeq?.toString() ?? null // value null denotes that the mailbox doesn't support IMAP QRESYNC feature

		await this.entityClient.update(folderSyncState)
		return this.entityClient.load(tutanotaTypeRefs.ImportImapFolderSyncStateTypeRef, folderSyncState._id)
	}

	async getRootImportFolder(rootImportFolderId: IdTuple): Promise<tutanotaTypeRefs.MailSet | null> {
		return this.entityClient.load(tutanotaTypeRefs.MailSetTypeRef, rootImportFolderId)
	}

	async getImportImapAccountSyncState(): Promise<tutanotaTypeRefs.ImportImapAccountSyncState | null> {
		const mailGroupId = this.userFacade.getGroupId(GroupType.Mail)
		const mailboxGroupRoot = await this.entityClient.load(tutanotaTypeRefs.MailboxGroupRootTypeRef, mailGroupId)
		const mailbox = await this.entityClient.load(tutanotaTypeRefs.MailBoxTypeRef, mailboxGroupRoot.mailbox)

		// if imapAccountSyncState is null, no import is initialized yet
		if (mailbox.imapAccountSyncStates == null) {
			return null
		}

		const importImapAccountSyncStates = await this.entityClient.loadAll(tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef, mailbox.imapAccountSyncStates)
		return isEmpty(importImapAccountSyncStates) ? null : getFirstOrThrow(importImapAccountSyncStates)
	}

	async getImportImapAccountSyncStateById(importImapAccountSyncStateId: IdTuple): Promise<tutanotaTypeRefs.ImportImapAccountSyncState | null> {
		return await this.entityClient.load(tutanotaTypeRefs.ImportImapAccountSyncStateTypeRef, importImapAccountSyncStateId)
	}

	async getAllImportImapFolderSyncStates(importImapFolderSyncStateListId: Id): Promise<tutanotaTypeRefs.ImportImapFolderSyncState[]> {
		return this.entityClient.loadAll(tutanotaTypeRefs.ImportImapFolderSyncStateTypeRef, importImapFolderSyncStateListId)
	}

	async getImportedMails(importedMailListId: Id): Promise<tutanotaTypeRefs.ImportedImapMail[]> {
		return this.entityClient.loadAll(tutanotaTypeRefs.ImportedImapMailTypeRef, importedMailListId)
	}

	async getDeduplicatedImportedAttachment(deduplicatedImportedAttachmentId: IdTuple): Promise<tutanotaTypeRefs.DeduplicatedImportedAttachment> {
		return this.entityClient.load(tutanotaTypeRefs.DeduplicatedImportedAttachmentTypeRef, deduplicatedImportedAttachmentId)
	}

	async getDeduplicatedImportedAttachmentsList(mailGroupId: Id): Promise<tutanotaTypeRefs.DeduplicatedImportedAttachment[]> {
		const mailBoxGroupRoot = await this.entityClient.load(tutanotaTypeRefs.MailboxGroupRootTypeRef, mailGroupId)
		const mailBox = await this.entityClient.load(tutanotaTypeRefs.MailBoxTypeRef, mailBoxGroupRoot.mailbox)
		return this.entityClient.loadAll(tutanotaTypeRefs.DeduplicatedImportedAttachmentTypeRef, assertNotNull(mailBox.deduplicatedImportedAttachments))
	}

	// private getFoldersForMailGroup(mailGroupId: Id): FolderSystem {
	// 	if (mailGroupId) {
	// 		const folderSystem = mailLocator.mailModel.getFolderSystemByGroupId(mailGroupId)
	// 		if (folderSystem) {
	// 			return folderSystem
	// 		}
	// 	}
	// 	throw new Error("could not load folder list")
	// }
	private async findExistingTutanotaFolderForImapMailbox(imapMailbox: ImapMailbox, mailGroupId: Id): Promise<tutanotaTypeRefs.MailSet | null> {
		const mailBoxGroupRoot = await this.entityClient.load(tutanotaTypeRefs.MailboxGroupRootTypeRef, mailGroupId)
		const mailBox = await this.entityClient.load(tutanotaTypeRefs.MailBoxTypeRef, mailBoxGroupRoot.mailbox)
		const allMailFolders = (await this.entityClient.loadAll(tutanotaTypeRefs.MailSetTypeRef, mailBox.mailSets.mailSets)).filter(isFolder)
		const folderSystem = new FolderSystem(allMailFolders)
		if (imapMailbox.specialUse) {
			switch (imapMailbox.specialUse) {
				case ImapMailboxSpecialUse.INBOX:
					return folderSystem.getSystemFolderByType(MailSetKind.INBOX)
				case ImapMailboxSpecialUse.DRAFTS:
					return folderSystem.getSystemFolderByType(MailSetKind.DRAFT)
				case ImapMailboxSpecialUse.SENT:
					return folderSystem.getSystemFolderByType(MailSetKind.SENT)
				case ImapMailboxSpecialUse.TRASH:
					return folderSystem.getSystemFolderByType(MailSetKind.TRASH)
				case ImapMailboxSpecialUse.ARCHIVE:
					return folderSystem.getSystemFolderByType(MailSetKind.ARCHIVE)
				case ImapMailboxSpecialUse.JUNK:
					return folderSystem.getSystemFolderByType(MailSetKind.SPAM)
			}
		}

		return allMailFolders.find((folder) => folder.name === imapMailbox.name) ?? null
	}
}
