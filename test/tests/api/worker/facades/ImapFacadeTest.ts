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
	DeduplicatedImportedAttachmentTypeRef,
	ImapAccountSyncState,
	ImapAccountSyncStateTypeRef,
	ImapAccountTypeRef,
	ImapDeleteInTypeRef,
	ImapFolderService,
	ImapFolderSyncState,
	ImapFolderSyncStateTypeRef,
	ImapService,
	ImportedImapMailTypeRef,
	MailBox,
	MailboxGroupRoot,
	MailboxGroupRootTypeRef,
	MailBoxTypeRef,
	MailSetRefTypeRef,
} from "@tutao/entities/tutanota"
import { ImapAccountSyncStatus, ImapFolderSyncStatus } from "../../../../../src/entities/tutanota/Utils"
import { ProgrammingError } from "../../../../../src/platform-kit/app-env"
import { ImapFacade } from "../../../../../src/applications/common/api/worker/facades/lazy/ImapFacade"
import { KeyLoaderFacade } from "../../../../../src/platform-kit/base/base-crypto/KeyLoaderFacade"

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
	const imapFolderSyncStateIdMock: IdTuple = ["folderSyncStateListId", "folderSyncStateElementId"]
	const mailFolderIdMock: IdTuple = ["mailSetListId", "mailSetElementId"]
	const rootImportMailFolderIdMock: IdTuple = ["mailSetListId", "rootFolderElementId"]

	let imapAccountSyncStateMock: ImapAccountSyncState
	let imapFolderSyncStateMock: ImapFolderSyncState
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
		imapAccountSyncStateMock = createTestEntity(ImapAccountSyncStateTypeRef, {
			_id: imapAccountSyncStateIdMock,
			_ownerGroup: mailGroupId,
			rootImportMailFolder: null,
			imapFolderSyncStateList: "folderSyncStateListId",
		})

		imapFolderSyncStateMock = createTestEntity(ImapFolderSyncStateTypeRef, {
			_id: imapFolderSyncStateIdMock,
			status: ImapFolderSyncStatus.RUNNING,
			uidnext: "1",
			uidvalidity: "123",
			highestmodseq: null,
		})

		mailboxGroupRootMock = createTestEntity(MailboxGroupRootTypeRef, { mailbox: "mailboxId" })
		mailBoxMock = createTestEntity(MailBoxTypeRef, {
			_id: "mailboxId",
			mailSets: createTestEntity(MailSetRefTypeRef, { mailSets: "mailSetListId" }),
			imapAccountSyncStates: "accountSyncStateListId",
			deduplicatedImportedAttachments: "attachmentsListId",
		})
	})

	o.test("initializeImapImport - creates root folder and starts import", async () => {
		const initializeParams: InitializeImapImportParams = {
			mailGroupId,
			rootImportMailFolderName: "IMAP Import",
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			matchImapMailboxesToTutaMailSets: false,
			imapAccount: createTestEntity(ImapAccountTypeRef, {
				host: "imap.test.com",
				port: "993",
				username: "user",
				password: "pass",
				oAuthTokenEndpointResponse: null,
			}),
			maxQuota: "1000",
			imapSyncLabelData: null,
			provider: 1,
		}

		when(mailFacadeMock.createMailFolder("IMAP Import", null, mailGroupId)).thenResolve(rootImportMailFolderIdMock)

		const imapPostOutMock = { imapAccountSyncState: imapAccountSyncStateIdMock }
		when(serviceExecutorMock.post(ImapService, anything(), anything())).thenResolve(imapPostOutMock)
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(imapAccountSyncStateMock)

		const result = await imapFacade.initializeImapImport(initializeParams)

		verify(mailFacadeMock.createMailFolder("IMAP Import", null, mailGroupId), { times: 1 })
		verify(serviceExecutorMock.post(ImapService, anything(), anything()), { times: 1 })
		verify(entityClientMock.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock), { times: 1 })
		o.check(result.imapAccountSyncState).equals(imapAccountSyncStateMock)
	})

	o.test("initializeImapImport - throws if neither root folder nor matching is set", async () => {
		const initializeParams: InitializeImapImportParams = {
			mailGroupId,
			rootImportMailFolderName: "",
			matchImapMailboxesToTutaMailSets: false,
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			imapAccount: {} as any,
			maxQuota: "0",
			imapSyncLabelData: null,
			provider: 1,
		}
		const error = await assertThrows(ProgrammingError, () => imapFacade.initializeImapImport(initializeParams))
		o.check(error.message).equals("Either rootImportMailFolderName or matchImapMailboxesToTutaMailSets must be set")
	})

	o.test("postponeImapImport - updates postponedUntil and pauses folder state(s)", async () => {
		const postponedUntil = new Date(2025, 0, 1)
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(imapAccountSyncStateMock)
		when(entityClientMock.update(imapAccountSyncStateMock)).thenDo(() => (imapAccountSyncStateMock.status = ImapAccountSyncStatus.POSTPONED))
		when(entityClientMock.loadAll(ImapFolderSyncStateTypeRef, imapAccountSyncStateMock.imapFolderSyncStateList)).thenResolve([imapFolderSyncStateMock])

		await imapFacade.postponeImapImport(postponedUntil, imapAccountSyncStateIdMock)

		o.check(imapAccountSyncStateMock.postponedUntil).equals(postponedUntil.getTime().toString())
		o.check(imapAccountSyncStateMock.status).equals(ImapAccountSyncStatus.POSTPONED)
		o.check(imapFolderSyncStateMock.status).equals(ImapFolderSyncStatus.PAUSED)
		verify(entityClientMock.update(imapAccountSyncStateMock), { times: 1 })
	})

	o.test("pauseRunningImapImportFolderSyncStates - sets running folders to Paused", async () => {
		const runningStateMock = { ...imapFolderSyncStateMock, status: ImapFolderSyncStatus.RUNNING }
		const pausedStateMock = {
			...imapFolderSyncStateMock,
			_id: ["folderSyncStateListId", "folderSyncStateElementId2"] as IdTuple,
			status: ImapFolderSyncStatus.PAUSED,
		}
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(imapAccountSyncStateMock)
		when(imapFacade.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([runningStateMock, pausedStateMock])
		when(entityClientMock.update(runningStateMock)).thenResolve()
		when(entityClientMock.update(pausedStateMock)).thenResolve()

		await imapFacade.pauseRunningImapImportFolderSyncStates(imapAccountSyncStateIdMock)

		o.check(runningStateMock.status).equals(ImapFolderSyncStatus.PAUSED)
		verify(entityClientMock.update(runningStateMock), { times: 1 })
		verify(entityClientMock.update(pausedStateMock), { times: 0 })
	})

	o.test("updateAllImapFolderSyncStates - updates all to given status except already matching", async () => {
		const state1Mock = { ...imapFolderSyncStateMock, status: ImapFolderSyncStatus.RUNNING }
		const state2Mock = { ...imapFolderSyncStateMock, status: ImapFolderSyncStatus.PAUSED, _id: ["folderSyncStateListId", "id2"] as IdTuple }
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(imapAccountSyncStateMock)
		when(imapFacade.getAllImapFolderSyncStates("folderSyncStateListId")).thenResolve([state1Mock, state2Mock])
		when(entityClientMock.update(state1Mock)).thenResolve()

		await imapFacade.updateAllImapFolderSyncStates(imapAccountSyncStateIdMock, ImapFolderSyncStatus.PAUSED)

		o.check(state1Mock.status).equals(ImapFolderSyncStatus.PAUSED)
		o.check(state2Mock.status).equals(ImapFolderSyncStatus.PAUSED) // already paused, no update
		verify(entityClientMock.update(state1Mock), { times: 1 })
		verify(entityClientMock.update(state2Mock), { times: 0 })
	})

	o.test("deleteImapImport - calls service executor delete", async () => {
		const deleteInMock = createTestEntity(ImapDeleteInTypeRef, { imapAccountSyncState: imapAccountSyncStateIdMock })
		when(serviceExecutorMock.delete(ImapService, anything(), null)).thenDo(() => Promise.resolve())

		await imapFacade.deleteImapImport(imapAccountSyncStateIdMock)

		verify(serviceExecutorMock.delete(ImapService, deleteInMock, null), { times: 1 })
	})

	o.test("createImportMailFolder - creates folder and returns sync state when no root folder and mapping exists", async () => {
		const imapMailbox: ImapMailbox = { path: "INBOX", name: "INBOX" }
		imapAccountSyncStateMock.rootImportMailFolder = null

		when(entityClientMock.load(MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRootMock)
		when(entityClientMock.load(MailBoxTypeRef, mailboxGroupRootMock.mailbox)).thenResolve(mailBoxMock)
		const postOutMock = { imapFolderSyncState: imapFolderSyncStateIdMock }
		when(serviceExecutorMock.post(ImapFolderService, anything(), anything())).thenResolve(postOutMock)
		when(entityClientMock.load(ImapFolderSyncStateTypeRef, imapFolderSyncStateIdMock)).thenResolve(imapFolderSyncStateMock)

		await imapFacade.initializeImapMailFolder(imapMailbox, imapAccountSyncStateMock, null, true)

		verify(serviceExecutorMock.post(ImapFolderService, anything(), anything()), { times: 1 })
	})

	o.test("createImportMailFolder - creates new folder when root folder is set", async () => {
		const imapMailbox: ImapMailbox = { path: "Sent", name: "Sent" }
		imapAccountSyncStateMock.rootImportMailFolder = rootImportMailFolderIdMock
		when(mailFacadeMock.createMailFolder("Sent", null, mailGroupId)).thenResolve(mailFolderIdMock)

		const postOutMock = { imapFolderSyncState: imapFolderSyncStateIdMock }
		when(serviceExecutorMock.post(ImapFolderService, anything(), anything())).thenResolve(postOutMock)
		when(entityClientMock.load(ImapFolderSyncStateTypeRef, imapFolderSyncStateIdMock)).thenResolve(imapFolderSyncStateMock)

		await imapFacade.initializeImapMailFolder(imapMailbox, imapAccountSyncStateMock, null, true)

		verify(mailFacadeMock.createMailFolder("Sent", null, mailGroupId), { times: 1 })
	})

	o.test("createImportMailFolder - returns undefined if imapMailbox.name is falsy", async () => {
		const imapMailbox: ImapMailbox = { path: "", name: "" }
		const result = await imapFacade.initializeImapMailFolder(imapMailbox, imapAccountSyncStateMock, null, true)
		o.check(result).equals(undefined)
	})

	o.test("updateImapFolderSyncState - updates fields and reloads", async () => {
		const imapMailboxStatusMock: ImapMailboxStatus = {
			uidNext: 100,
			uidValidity: BigInt(456),
			highestModSeq: BigInt(789),
			syncStatus: ImapFolderSyncStatus.FINISHED,
		} as ImapMailboxStatus
		imapFolderSyncStateMock.uidnext = "1"
		imapFolderSyncStateMock.uidvalidity = "123"
		imapFolderSyncStateMock.highestmodseq = null
		imapFolderSyncStateMock.status = ImapFolderSyncStatus.RUNNING

		when(entityClientMock.update(imapFolderSyncStateMock)).thenResolve()
		when(entityClientMock.load(ImapFolderSyncStateTypeRef, imapFolderSyncStateIdMock)).thenResolve(imapFolderSyncStateMock)
		await imapFacade.updateImapFolderSyncState(imapMailboxStatusMock, imapFolderSyncStateMock)

		o.check(imapFolderSyncStateMock.uidnext).equals("100")
		o.check(imapFolderSyncStateMock.uidvalidity).equals("456")
		o.check(imapFolderSyncStateMock.highestmodseq!).equals("789")
		o.check(imapFolderSyncStateMock.status).equals(ImapFolderSyncStatus.FINISHED.toString())
		verify(entityClientMock.update(imapFolderSyncStateMock), { times: 1 })
	})

	o.test("updateImapFolderSyncState - sets highestmodseq to null when not provided", async () => {
		const imapMailboxStatusMock: ImapMailboxStatus = {
			uidNext: 200,
			uidValidity: BigInt(789),
			highestModSeq: null,
			syncStatus: ImapFolderSyncStatus.RUNNING,
		} as ImapMailboxStatus
		imapFolderSyncStateMock.highestmodseq = "old"
		await imapFacade.updateImapFolderSyncState(imapMailboxStatusMock, imapFolderSyncStateMock)
		o.check(imapFolderSyncStateMock.highestmodseq).equals(null)
	})

	o.test("deleteImapFolderSyncState - calls service executor delete", async () => {
		const deleteInMock = createImapFolderDeleteIn({ imapFolderSyncState: imapFolderSyncStateIdMock })
		when(serviceExecutorMock.delete(ImapFolderService, anything(), null)).thenDo(() => Promise.resolve())

		await imapFacade.deleteImapFolderSyncState(imapFolderSyncStateIdMock)

		verify(serviceExecutorMock.delete(ImapFolderService, deleteInMock, null), { times: 1 })
	})

	o.test("getImapAccountSyncStateById - loads entity", async () => {
		when(entityClientMock.load(ImapAccountSyncStateTypeRef, imapAccountSyncStateIdMock)).thenResolve(imapAccountSyncStateMock)

		const result = await imapFacade.getImapAccountSyncStateById(imapAccountSyncStateIdMock)

		o.check(result).equals(imapAccountSyncStateMock)
	})

	o.test("getAllImapFolderSyncStates - loads all from list", async () => {
		const listId = "folderStateListId"
		when(entityClientMock.loadAll(ImapFolderSyncStateTypeRef, listId)).thenResolve([imapFolderSyncStateMock])

		const result = await imapFacade.getAllImapFolderSyncStates(listId)

		o.check(result).deepEquals([imapFolderSyncStateMock])
	})

	o.test("getImportedMails - loads all from list", async () => {
		const importedMailListId = "importedMailListId"
		const importedMailMock = createTestEntity(ImportedImapMailTypeRef, { _id: ["importedMailListId", "importedMailElementId"] as IdTuple })
		when(entityClientMock.loadAll(ImportedImapMailTypeRef, importedMailListId)).thenResolve([importedMailMock])

		const result = await imapFacade.getImportedMails(importedMailListId)

		o.check(result).deepEquals([importedMailMock])
	})

	o.test("getDeduplicatedImportedAttachmentsList - loads all from mailbox", async () => {
		when(entityClientMock.load(MailboxGroupRootTypeRef, mailGroupId)).thenResolve(mailboxGroupRootMock)
		when(entityClientMock.load(MailBoxTypeRef, "mailboxId")).thenResolve(mailBoxMock)
		const attachmentMock = createTestEntity(DeduplicatedImportedAttachmentTypeRef, { _id: ["attachmentsListId", "attachmentsElementId"] })
		when(entityClientMock.loadAll(DeduplicatedImportedAttachmentTypeRef, "attachmentsListId")).thenResolve([attachmentMock])

		const result = await imapFacade.getDeduplicatedImportedAttachments(mailGroupId)

		o.check(result).deepEquals([attachmentMock])
	})
})
