import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { createTestEntity } from "../../../TestUtils"
import { InitializeImapImportParams } from "../../../../../src/applications/mail-app/workerUtils/imapimport/ImapImporter"
import { ImapMailbox, ImapMailboxStatus } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapMailbox"
import { MailFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/MailFacade"
import { IServiceExecutor } from "../../../../../src/platform-kit/network/ServiceRequest"
import { EntityClient } from "../../../../../src/platform-kit/network/EntityClient"
import { aes256RandomKey, CryptoWrapper } from "../../../../../src/platform-kit/crypto"
import {
	createImapFolderDeleteIn,
	createMailboxMigrationDeleteIn,
	DeduplicatedImportedAttachmentTypeRef,
	ImapFolderService_DELETE,
	ImportedImapMailTypeRef,
	MailBox,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
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
import { ImapAccountSyncStatus, MailboxMigrationFolderSyncStatus } from "../../../../../src/entities/tutanota/Utils"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { ImapFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/ImapFacade"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"
import { idToElementId } from "../../../../../src/platform-kit/meta"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/imapImportUtils/ImapKnownConfigs"

const { anything } = matchers

o.spec("ImapFacade", () => {
	let mailFacadeMock: MailFacade
	let serviceExecutorMock: IServiceExecutor
	let entityClientMock: EntityClient
	let keyLoaderMock: KeyLoaderFacade
	let cryptoWrapperMock: CryptoWrapper
	let imapFacade: ImapFacade

	const mailGroupId = "mailGroup123"

	const imapAccountSyncStateIdMock: IdTuple = ["accountSyncStateListId", "accountSyncStateElementId"]
	const mailboxMigrationFolderSyncStateIdMock: IdTuple = ["folderSyncStateListId", "folderSyncStateElementId"]
	const mailFolderIdMock: IdTuple = ["mailSetListId", "mailSetElementId"]
	const rootImportMailFolderIdMock: IdTuple = ["mailSetListId", "rootFolderElementId"]

	let imapAccountSyncStateMock: MailboxMigrationSyncState
	let mailboxMigrationFolderSyncStateMock: MailboxMigrationFolderSyncState
	let mailboxGroupRootMock: MailboxGroupRoot
	let mailBoxMock: MailBox

	o.beforeEach(async () => {
		mailFacadeMock = object<MailFacade>()
		serviceExecutorMock = object<IServiceExecutor>()
		entityClientMock = object<EntityClient>()
		keyLoaderMock = object<KeyLoaderFacade>()
		cryptoWrapperMock = object<CryptoWrapper>()
		imapFacade = new ImapFacade(mailFacadeMock, serviceExecutorMock, entityClientMock, keyLoaderMock, cryptoWrapperMock)
		when(keyLoaderMock.getCurrentSymGroupKey(mailGroupId)).thenResolve({ object: object(), version: 1 })
		when(cryptoWrapperMock.aes256RandomKey()).thenReturn(aes256RandomKey())
		when(cryptoWrapperMock.encryptKeyWithVersionedKey(anything(), anything())).thenReturn({ key: Uint8Array.from([1, 2, 3]), encryptingKeyVersion: 1 })
		imapAccountSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: imapAccountSyncStateIdMock,
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
			imapAccountSyncStates: "accountSyncStateListId",
			deduplicatedImportedAttachments: "attachmentsListId",
		})
	})

	o.test("initializeImapImport - creates root folder and starts import", async () => {
		const initializeParams: InitializeImapImportParams = {
			mailGroupId,
			rootImportMailSetName: "IMAP Import",
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			credential: {
				username: "user",
				password: "pass",
				oAuthToken: null,
			},
			matchImapMailboxesToTutaMailSets: false,
			imapConfiguration: createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
				host: "imap.test.com",
				port: "993",
				sharedUsername: null,
				sharedPassword: null,
				sharedOauthToken: null,
				ignoreCertificateErrors: false,
				customCertificateData: null,
			}),
			imapSyncLabelData: null,
			provider: MailboxMigrationProvider.Outlook,
		}

		when(mailFacadeMock.createMailFolder("IMAP Import", null, mailGroupId)).thenResolve(rootImportMailFolderIdMock)

		const userMigrationInformationIdMock: IdTuple = ["userMigrationInfosListId", "userMigrationInfoElementId"]
		when(serviceExecutorMock.execute(UserMigrationService_POST, anything(), anything())).thenResolve({ userMigrationInfo: userMigrationInformationIdMock })

		const mailboxMigrationPostOutMock = { mailboxMigrationSyncState: imapAccountSyncStateIdMock }
		when(serviceExecutorMock.execute(MailboxMigrationService_POST, anything(), anything())).thenResolve(mailboxMigrationPostOutMock)
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(imapAccountSyncStateMock)

		const result = await imapFacade.initializeImapImport(initializeParams)

		verify(mailFacadeMock.createMailFolder("IMAP Import", null, mailGroupId), { times: 1 })
		verify(serviceExecutorMock.execute(MailboxMigrationService_POST, anything(), anything()), { times: 1 })
		verify(entityClientMock.load(MailboxMigrationSyncStateTypeRef, imapAccountSyncStateIdMock), { times: 1 })
		o.check(result.imapAccountSyncState).equals(imapAccountSyncStateMock)
	})

	o.test("initializeImapImport - throws if neither root folder nor matching is set", async () => {
		const initializeParams: InitializeImapImportParams = {
			mailGroupId,
			rootImportMailSetName: "",
			matchImapMailboxesToTutaMailSets: false,
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
			imapSyncLabelData: null,
			provider: MailboxMigrationProvider.Outlook,
		}
		const error = await assertThrows(ProgrammingError, () => imapFacade.initializeImapImport(initializeParams))
		o.check(error.message).equals("Either rootImportMailFolderName or matchImapMailboxesToTutaMailSets must be set")
	})

	o.test("updateAccountSyncStateAndAllFolderSyncStates - calls service executor", async () => {
		when(serviceExecutorMock.execute(MailboxMigrationService_PUT, anything(), anything())).thenDo(() => Promise.resolve())
		await imapFacade.updateAccountSyncStateAndAllFolderSyncStates(
			imapAccountSyncStateMock,
			ImapAccountSyncStatus.FINISHED,
			MailboxMigrationFolderSyncStatus.FINISHED,
			undefined,
		)
		verify(serviceExecutorMock.execute(MailboxMigrationService_PUT, anything(), anything()), { times: 1 })
	})

	o.test("deleteImapImport - calls service executor delete", async () => {
		const deleteInMock = createMailboxMigrationDeleteIn({ mailboxMigrationSyncState: imapAccountSyncStateIdMock })
		when(serviceExecutorMock.execute(MailboxMigrationService_DELETE, anything(), null)).thenDo(() => Promise.resolve())

		await imapFacade.deleteImapImport(imapAccountSyncStateIdMock)

		verify(serviceExecutorMock.execute(MailboxMigrationService_DELETE, deleteInMock, null), { times: 1 })
	})

	o.test("createImportMailFolder - creates folder and returns sync state when no root folder and mapping exists", async () => {
		const imapMailbox: ImapMailbox = { path: "INBOX", name: "INBOX" }
		imapAccountSyncStateMock.rootImportMailSet = null

		when(entityClientMock.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))).thenResolve(mailboxGroupRootMock)
		when(entityClientMock.load(MailBoxTypeRef, idToElementId(mailboxGroupRootMock.mailbox))).thenResolve(mailBoxMock)
		const postOutMock = { mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateIdMock }
		when(serviceExecutorMock.execute(MailboxMigrationFolderService_POST, anything(), anything())).thenResolve(postOutMock)
		when(entityClientMock.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateIdMock)).thenResolve(
			mailboxMigrationFolderSyncStateMock,
		)

		await imapFacade.initializeImapMailSet(imapMailbox, imapAccountSyncStateMock, MailboxMigrationProvider.Other, null, true, false)

		verify(serviceExecutorMock.execute(MailboxMigrationFolderService_POST, anything(), anything()), { times: 1 })
	})

	o.test("createImportMailFolder - creates new folder when root folder is set", async () => {
		const imapMailbox: ImapMailbox = { path: "Sent", name: "Sent" }
		imapAccountSyncStateMock.rootImportMailSet = rootImportMailFolderIdMock
		when(mailFacadeMock.createMailFolder("Sent", null, mailGroupId)).thenResolve(mailFolderIdMock)

		const postOutMock = { mailboxMigrationFolderSyncState: mailboxMigrationFolderSyncStateIdMock }
		when(serviceExecutorMock.execute(MailboxMigrationFolderService_POST, anything(), anything())).thenResolve(postOutMock)
		when(entityClientMock.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateIdMock)).thenResolve(
			mailboxMigrationFolderSyncStateMock,
		)

		await imapFacade.initializeImapMailSet(imapMailbox, imapAccountSyncStateMock, MailboxMigrationProvider.Other, null, true, false)

		verify(mailFacadeMock.createMailFolder("Sent", null, mailGroupId), { times: 1 })
	})

	o.test("createImportMailFolder - returns undefined if imapMailbox.name is falsy", async () => {
		const imapMailbox: ImapMailbox = { path: "", name: "" }
		const result = await imapFacade.initializeImapMailSet(imapMailbox, imapAccountSyncStateMock, MailboxMigrationProvider.Other, null, true, false)
		o.check(result).equals(undefined)
	})

	o.test("updateImapFolderSyncState - updates fields and reloads", async () => {
		const imapMailboxStatusMock: ImapMailboxStatus = {
			uidNext: 100,
			uidValidity: BigInt(456),
			syncStatus: MailboxMigrationFolderSyncStatus.FINISHED,
		} as ImapMailboxStatus
		mailboxMigrationFolderSyncStateMock.uidnext = "1"
		mailboxMigrationFolderSyncStateMock.uidvalidity = "123"
		mailboxMigrationFolderSyncStateMock.highestmodseq = null
		mailboxMigrationFolderSyncStateMock.status = MailboxMigrationFolderSyncStatus.RUNNING

		when(entityClientMock.update(mailboxMigrationFolderSyncStateMock)).thenResolve()
		when(entityClientMock.load(MailboxMigrationFolderSyncStateTypeRef, mailboxMigrationFolderSyncStateIdMock)).thenResolve(
			mailboxMigrationFolderSyncStateMock,
		)
		await imapFacade.updateImapFolderSyncState(imapMailboxStatusMock, mailboxMigrationFolderSyncStateMock)

		o.check(mailboxMigrationFolderSyncStateMock.uidnext).equals("100")
		o.check(mailboxMigrationFolderSyncStateMock.uidvalidity).equals("456")
		//We expect this field to not be updated here but on the server instead
		o.check(mailboxMigrationFolderSyncStateMock.highestmodseq!).equals(null)
		o.check(mailboxMigrationFolderSyncStateMock.status).equals(MailboxMigrationFolderSyncStatus.FINISHED.toString())
		verify(entityClientMock.update(mailboxMigrationFolderSyncStateMock), { times: 1 })
	})

	o.test("updateImapFolderSyncState - does not change highestmodseq", async () => {
		const imapMailboxStatusMock: ImapMailboxStatus = {
			uidNext: 200,
			uidValidity: BigInt(789),
			syncStatus: MailboxMigrationFolderSyncStatus.RUNNING,
		} as ImapMailboxStatus
		mailboxMigrationFolderSyncStateMock.highestmodseq = "old"
		await imapFacade.updateImapFolderSyncState(imapMailboxStatusMock, mailboxMigrationFolderSyncStateMock)
		o.check(mailboxMigrationFolderSyncStateMock.highestmodseq).equals("old")
	})

	o.test("deleteImapFolderSyncState - calls service executor delete", async () => {
		const deleteInMock = createImapFolderDeleteIn({ imapFolderSyncState: mailboxMigrationFolderSyncStateIdMock })
		when(serviceExecutorMock.execute(ImapFolderService_DELETE, anything(), null)).thenDo(() => Promise.resolve())

		await imapFacade.deleteImapFolderSyncState(mailboxMigrationFolderSyncStateIdMock)

		verify(serviceExecutorMock.execute(ImapFolderService_DELETE, deleteInMock, null), { times: 1 })
	})

	o.test("getImapAccountSyncStateById - loads entity", async () => {
		when(entityClientMock.load(MailboxMigrationSyncStateTypeRef, imapAccountSyncStateIdMock, anything())).thenResolve(imapAccountSyncStateMock)

		const result = await imapFacade.getImapAccountSyncStateById(imapAccountSyncStateIdMock)

		o.check(result).equals(imapAccountSyncStateMock)
	})

	o.test("getAllImapFolderSyncStates - loads all from list", async () => {
		const listId = "folderStateListId"
		when(entityClientMock.loadAll(MailboxMigrationFolderSyncStateTypeRef, listId)).thenResolve([mailboxMigrationFolderSyncStateMock])

		const result = await imapFacade.getAllImapFolderSyncStates(listId)

		o.check(result).deepEquals([mailboxMigrationFolderSyncStateMock])
	})

	o.test("getImportedMails - loads all from list", async () => {
		const importedMailListId = "importedMailListId"
		const importedMailMock = createTestEntity(ImportedImapMailTypeRef, { _id: ["importedMailListId", "importedMailElementId"] as IdTuple })
		when(entityClientMock.loadAll(ImportedImapMailTypeRef, importedMailListId)).thenResolve([importedMailMock])

		const result = await imapFacade.getImportedMails(importedMailListId)

		o.check(result).deepEquals([importedMailMock])
	})

	o.test("getDeduplicatedImportedAttachmentsList - loads all from mailbox", async () => {
		when(entityClientMock.load(MailboxGroupRootTypeRef, idToElementId(mailGroupId))).thenResolve(mailboxGroupRootMock)
		when(entityClientMock.load(MailBoxTypeRef, idToElementId("mailboxId"))).thenResolve(mailBoxMock)
		const attachmentMock = createTestEntity(DeduplicatedImportedAttachmentTypeRef, { _id: ["attachmentsListId", "attachmentsElementId"] })
		when(entityClientMock.loadAll(DeduplicatedImportedAttachmentTypeRef, "attachmentsListId")).thenResolve([attachmentMock])

		const result = await imapFacade.getDeduplicatedImportedAttachments(mailGroupId)

		o.check(result).deepEquals([attachmentMock])
	})
})
