import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils"
import { InitializeMigrationParams } from "../../../../../src/applications/mail-app/workerUtils/migration/MailboxImporter"
import { MigrationMailbox, MigrationMailboxStatus } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { aes256RandomKey, CryptoWrapper } from "../../../../../src/platform-kit/crypto"
import {
	createMailboxMigrationDeleteIn,
	createMailboxMigrationFolderDeleteIn,
	DeduplicatedImportedAttachmentTypeRef,
	ImportedMigrationMailTypeRef,
	MailBox,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailboxMigrationFolderService_DELETE,
	MailboxMigrationFolderService_POST,
	MailboxMigrationFolderSyncState,
	MailboxMigrationFolderSyncStateTypeRef,
	MailboxMigrationImapConfigurationTypeRef,
	MailboxMigrationService_DELETE,
	MailboxMigrationService_POST,
	MailboxMigrationService_PUT,
	MailboxMigrationSyncState,
	MailboxMigrationSyncStateTypeRef,
	MailBoxTypeRef,
	MailSetRefTypeRef,
} from "@tutao/entities/tutanota"
import { UserMigrationService_POST } from "@tutao/entities/sys"
import { MailboxMigrationSyncStatus, MailboxMigrationFolderSyncStatus } from "../../../../../src/entities/tutanota/Utils"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { MailboxMigrationFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailboxMigrationFacade"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import { idToElementId } from "../../../../../src/platform-kit/meta"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"

const { anything } = matchers

o.spec("MailboxMigrationFacade", () => {
	let mailFacadeMock: MailFacade
	let serviceExecutorMock: IServiceExecutor
	let entityClientMock: EntityClient
	let keyLoaderMock: KeyLoaderFacade
	let cryptoWrapperMock: CryptoWrapper
	let mailboxMigrationFacade: MailboxMigrationFacade

	const mailGroupId = "mailGroup123"

	const mailboxMigrationSyncStateIdMock: IdTuple = ["accountSyncStateListId", "accountSyncStateElementId"]
	const mailboxMigrationFolderSyncStateIdMock: IdTuple = ["folderSyncStateListId", "folderSyncStateElementId"]
	const mailFolderIdMock: IdTuple = ["mailSetListId", "mailSetElementId"]
	const rootImportMailFolderIdMock: IdTuple = ["mailSetListId", "rootFolderElementId"]

	let mailboxMigrationAccountSyncStateMock: MailboxMigrationSyncState
	let mailboxMigrationFolderSyncStateMock: MailboxMigrationFolderSyncState
	let mailboxGroupRootMock: MailboxGroupRoot
	let mailBoxMock: MailBox

	o.beforeEach(async () => {
		mailFacadeMock = object<MailFacade>()
		serviceExecutorMock = object<IServiceExecutor>()
		entityClientMock = object<EntityClient>()
		keyLoaderMock = object<KeyLoaderFacade>()
		cryptoWrapperMock = object<CryptoWrapper>()
		mailboxMigrationFacade = new MailboxMigrationFacade(mailFacadeMock, serviceExecutorMock, entityClientMock, keyLoaderMock, cryptoWrapperMock)
		when(keyLoaderMock.getCurrentSymGroupKey(mailGroupId)).thenResolve({ object: object(), version: 1 })
		when(cryptoWrapperMock.aes256RandomKey()).thenReturn(aes256RandomKey())
		when(cryptoWrapperMock.encryptKeyWithVersionedKey(anything(), anything())).thenReturn({ key: Uint8Array.from([1, 2, 3]), encryptingKeyVersion: 1 })
		mailboxMigrationAccountSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: mailboxMigrationSyncStateIdMock,
			_ownerGroup: mailGroupId,
			_ownerKeyVersion: "0",
			_ownerEncSessionKey: new Uint8Array([1, 2, 3]),
			rootImportMailSet: null,
			mailboxMigrationFolderSyncStates: "folderSyncStateListId",
		})

		mailboxMigrationFolderSyncStateMock = createTestEntity(MailboxMigrationFolderSyncStateTypeRef, {
			_id: mailboxMigrationFolderSyncStateIdMock,
			status: MailboxMigrationFolderSyncStatus.RUNNING,
			uidnext: "1",
			uidvalidity: "123",
			highestmodseq: null,
		})

		mailboxGroupRootMock = createTestEntity(MailboxGroupRootTypeRef, { mailbox: "mailboxId" })
		mailBoxMock = createTestEntity(MailBoxTypeRef, {
			_id: idToElementId("mailboxId"),
			mailSets: createTestEntity(MailSetRefTypeRef, { mailSets: "mailSetListId" }),
			legacyMailboxMigrationSyncStates: "accountSyncStateListId",
			deduplicatedImportedAttachments: "attachmentsListId",
		})
	})

	o.test("initializeMailboxImport - creates root folder and starts import", async () => {
		const initializeParams: InitializeMigrationParams = {
			mailGroupId,
			rootImportMailSetName: "Migration Import",
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			credential: {
				username: "user",
				password: "pass",
				oAuthToken: null,
			},
			matchMigrationMailboxesToTutaMailSets: false,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
				host: "imap.test.com",
				port: "993",
				sharedUsername: null,
				sharedPassword: null,
				sharedOauthToken: null,
				ignoreCertificateErrors: false,
				customCertificateData: null,
			}),
			migrationSyncLabelData: null,
			provider: MailboxMigrationProvider.Outlook,
		}

		when(mailFacadeMock.createMailFolder("Migration Import", null, mailGroupId)).thenResolve(rootImportMailFolderIdMock)

		const userMigrationInformationIdMock: IdTuple = ["userMigrationInfosListId", "userMigrationInfoElementId"]
		when(serviceExecutorMock.execute(UserMigrationService_POST, anything(), anything())).thenResolve({ userMigrationInfo: userMigrationInformationIdMock })

		const mailboxMigrationPostOutMock = { mailboxMigrationSyncState: mailboxMigrationSyncStateIdMock }
		when(serviceExecutorMock.execute(MailboxMigrationService_POST, anything(), anything())).thenResolve(mailboxMigrationPostOutMock)
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateIdMock)).thenResolve(mailboxMigrationAccountSyncStateMock)

		const result = await mailboxMigrationFacade.initializeMailboxImport(initializeParams)

		verify(mailFacadeMock.createMailFolder("Migration Import", null, mailGroupId), { times: 1 })
		verify(serviceExecutorMock.execute(MailboxMigrationService_POST, anything(), anything()), { times: 1 })
		verify(entityClientMock.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateIdMock), { times: 1 })
		o.check(result.mailboxMigrationSyncState).equals(mailboxMigrationAccountSyncStateMock)
	})

	o.test("initializeMailboxImport - throws if neither root folder nor matching is set", async () => {
		const initializeParams: InitializeMigrationParams = {
			mailGroupId,
			rootImportMailSetName: "",
			matchMigrationMailboxesToTutaMailSets: false,
			credential: {
				username: "user",
				password: "pass",
				oAuthToken: null,
			},
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			imapConfiguration: { ignoreCertificateErrors: false, customCertificateData: null } as any,
			migrationSyncLabelData: null,
			provider: MailboxMigrationProvider.Outlook,
		}
		const error = await assertThrows(ProgrammingError, () => mailboxMigrationFacade.initializeMailboxImport(initializeParams))
		o.check(error.message).equals("Either rootImportMailFolderName or matchMigrationMailboxesToTutaMailSets must be set")
	})

	o.test("updateAccountSyncStateAndAllFolderSyncStates - calls service executor", async () => {
		when(serviceExecutorMock.execute(MailboxMigrationService_PUT, anything(), anything())).thenDo(() => Promise.resolve())
		await mailboxMigrationFacade.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
			mailboxMigrationAccountSyncStateMock,
			MailboxMigrationSyncStatus.FINISHED,
			MailboxMigrationFolderSyncStatus.FINISHED,
			undefined,
		)
		verify(serviceExecutorMock.execute(MailboxMigrationService_PUT, anything(), anything()), { times: 1 })
	})

	o.test("deleteMigrationImport - calls service executor delete", async () => {
		const deleteInMock = createMailboxMigrationDeleteIn({ mailboxMigrationSyncState: mailboxMigrationSyncStateIdMock })
		when(serviceExecutorMock.execute(MailboxMigrationService_DELETE, anything(), null)).thenDo(() => Promise.resolve())

		await mailboxMigrationFacade.deleteMigrationImport(mailboxMigrationSyncStateIdMock)

		verify(serviceExecutorMock.execute(MailboxMigrationService_DELETE, deleteInMock, null), { times: 1 })
	})

	o.test("createImportMailFolder - creates folder and returns sync state when no root folder and mapping exists", async () => {
		const migrationMailbox: MigrationMailbox = { path: "INBOX", name: "INBOX" }
		mailboxMigrationAccountSyncStateMock.rootImportMailSet = null

		when(entityClientMock.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))).thenResolve(mailboxGroupRootMock)
		when(entityClientMock.load(MailBoxTypeRef, idToElementId(mailboxGroupRootMock.mailbox))).thenResolve(mailBoxMock)
		const postOutMock = { mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateIdMock }
		when(serviceExecutorMock.execute(MailboxMigrationFolderService_POST, anything(), anything())).thenResolve(postOutMock)
		when(entityClientMock.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateIdMock)).thenResolve(
			mailboxMigrationFolderSyncStateMock,
		)

		await mailboxMigrationFacade.initializeMigrationMailSet(
			migrationMailbox,
			mailboxMigrationAccountSyncStateMock,
			MailboxMigrationProvider.Other,
			null,
			true,
			false,
		)

		verify(serviceExecutorMock.execute(MailboxMigrationFolderService_POST, anything(), anything()), { times: 1 })
	})

	o.test("createImportMailFolder - creates new folder when root folder is set", async () => {
		const migrationMailbox: MigrationMailbox = { path: "Sent", name: "Sent" }
		mailboxMigrationAccountSyncStateMock.rootImportMailSet = rootImportMailFolderIdMock
		when(mailFacadeMock.createMailFolder("Sent", null, mailGroupId)).thenResolve(mailFolderIdMock)

		const postOutMock = { mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateIdMock }
		when(serviceExecutorMock.execute(MailboxMigrationFolderService_POST, anything(), anything())).thenResolve(postOutMock)
		when(entityClientMock.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateIdMock)).thenResolve(
			mailboxMigrationFolderSyncStateMock,
		)

		await mailboxMigrationFacade.initializeMigrationMailSet(
			migrationMailbox,
			mailboxMigrationAccountSyncStateMock,
			MailboxMigrationProvider.Other,
			null,
			true,
			false,
		)

		verify(mailFacadeMock.createMailFolder("Sent", null, mailGroupId), { times: 1 })
	})

	o.test("createImportMailFolder - returns undefined if migrationMailbox.name is falsy", async () => {
		const migrationMailbox: MigrationMailbox = { path: "", name: "" }
		const result = await mailboxMigrationFacade.initializeMigrationMailSet(
			migrationMailbox,
			mailboxMigrationAccountSyncStateMock,
			MailboxMigrationProvider.Other,
			null,
			true,
			false,
		)
		o.check(result).equals(undefined)
	})

	o.test("updateMigrationFolderSyncState - updates fields and reloads", async () => {
		const migrationMailboxStatus: MigrationMailboxStatus = {
			uidNext: 100,
			uidValidity: BigInt(456),
			syncStatus: MailboxMigrationFolderSyncStatus.FINISHED,
		} as MigrationMailboxStatus
		mailboxMigrationFolderSyncStateMock.uidnext = "1"
		mailboxMigrationFolderSyncStateMock.uidvalidity = "123"
		mailboxMigrationFolderSyncStateMock.highestmodseq = null
		mailboxMigrationFolderSyncStateMock.status = MailboxMigrationFolderSyncStatus.RUNNING

		when(entityClientMock.update(mailboxMigrationFolderSyncStateMock)).thenResolve()
		when(entityClientMock.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateIdMock)).thenResolve(
			mailboxMigrationFolderSyncStateMock,
		)
		await mailboxMigrationFacade.updateMigrationFolderSyncState(migrationMailboxStatus, mailboxMigrationFolderSyncStateMock)

		o.check(mailboxMigrationFolderSyncStateMock.uidnext).equals("100")
		o.check(mailboxMigrationFolderSyncStateMock.uidvalidity).equals("456")
		//We expect this field to not be updated here but on the server instead
		o.check(mailboxMigrationFolderSyncStateMock.highestmodseq!).equals(null)
		o.check(mailboxMigrationFolderSyncStateMock.status).equals(MailboxMigrationFolderSyncStatus.FINISHED.toString())
		verify(entityClientMock.update(mailboxMigrationFolderSyncStateMock), { times: 1 })
	})

	o.test("updateMigrationFolderSyncState - does not change highestmodseq", async () => {
		const migrationMailboxStatus: MigrationMailboxStatus = {
			uidNext: 200,
			uidValidity: BigInt(789),
			syncStatus: MailboxMigrationFolderSyncStatus.RUNNING,
		} as MigrationMailboxStatus
		mailboxMigrationFolderSyncStateMock.highestmodseq = "old"
		await mailboxMigrationFacade.updateMigrationFolderSyncState(migrationMailboxStatus, mailboxMigrationFolderSyncStateMock)
		o.check(mailboxMigrationFolderSyncStateMock.highestmodseq).equals("old")
	})

	o.test("deleteMigrationFolderSyncState - calls service executor delete", async () => {
		const deleteInMock = createMailboxMigrationFolderDeleteIn({ mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateIdMock })
		when(serviceExecutorMock.execute(MailboxMigrationFolderService_DELETE, anything(), null)).thenDo(() => Promise.resolve())

		await mailboxMigrationFacade.deleteMigrationFolderSyncState(mailboxMigrationFolderSyncStateIdMock)

		verify(serviceExecutorMock.execute(MailboxMigrationFolderService_DELETE, deleteInMock, null), { times: 1 })
	})

	o.test("getMailboxMigrationSyncStateById - loads entity", async () => {
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, mailboxMigrationSyncStateIdMock, anything())).thenResolve(
			mailboxMigrationAccountSyncStateMock,
		)

		const result = await mailboxMigrationFacade.getMailboxMigrationSyncStateById(mailboxMigrationSyncStateIdMock)

		o.check(result).equals(mailboxMigrationAccountSyncStateMock)
	})

	o.test("getAllMailboxMigrationFolderSyncStates - loads all from list", async () => {
		const listId = "folderStateListId"
		when(entityClientMock.loadAll(MailboxMigrationFolderSyncStateTypeRef, listId)).thenResolve([mailboxMigrationFolderSyncStateMock])

		const result = await mailboxMigrationFacade.getAllMailboxMigrationFolderSyncStates(listId)

		o.check(result).deepEquals([mailboxMigrationFolderSyncStateMock])
	})

	o.test("getImportedMails - loads all from list", async () => {
		const importedMailListId = "importedMailListId"
		const importedMailMock = createTestEntity(ImportedMigrationMailTypeRef, { _id: ["importedMailListId", "importedMailElementId"] as IdTuple })
		when(entityClientMock.loadAll(ImportedMigrationMailTypeRef, importedMailListId)).thenResolve([importedMailMock])

		const result = await mailboxMigrationFacade.getImportedMails(importedMailListId)

		o.check(result).deepEquals([importedMailMock])
	})

	o.test("getDeduplicatedImportedAttachmentsList - loads all from mailbox", async () => {
		when(entityClientMock.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))).thenResolve(mailboxGroupRootMock)
		when(entityClientMock.load(MailBoxTypeRef, idToElementId("mailboxId"))).thenResolve(mailBoxMock)
		const attachmentMock = createTestEntity(DeduplicatedImportedAttachmentTypeRef, { _id: ["attachmentsListId", "attachmentsElementId"] })
		when(entityClientMock.loadAll(DeduplicatedImportedAttachmentTypeRef, "attachmentsListId")).thenResolve([attachmentMock])

		const result = await mailboxMigrationFacade.getDeduplicatedImportedAttachments(mailGroupId)

		o.check(result).deepEquals([attachmentMock])
	})
})
