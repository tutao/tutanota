import o from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"

import { InitializeMigrationParams, MailboxImporter } from "../../../../../../src/applications/mail-app/workerUtils/migration/MailboxImporter"
import { createTestEntity } from "../../../../TestUtils"
import { MigrationCredentials } from "../../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationMailbox, MigrationMailboxStatus } from "../../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import {
	MigrationMail,
	MigrationMailAttachment,
	MigrationMailEnvelope,
} from "../../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMail"
import { MailboxMigrationProvider } from "../../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"
import { migrationMailToImportMailParams } from "../../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationImportUtils"
import { newMailboxImportSession } from "../../../../../../src/applications/mail-app/workerUtils/migration/MailboxImportSession"
import { MigrationError, MigrationErrorCause } from "../../../../../../src/applications/common/api/common/error/MigrationError"
import { MailboxMigrationFolderSyncStatus, MailboxMigrationSyncStatus, MigrationSyncEventType } from "../../../../../../src/entities/tutanota/Utils"
import { ImportMailFacade, MigrationImportTutaFileId } from "../../../../../../src/applications/common/api/worker/facades/lazy/ImportMailFacade"
import {
	ImportedMigrationMail,
	ImportedMigrationMailTypeRef,
	MailboxMigrationFolderSyncState,
	MailboxMigrationFolderSyncStateTypeRef,
	MailboxMigrationImapConfigurationTypeRef,
	MailboxMigrationSyncState,
	MailboxMigrationSyncStateTypeRef,
	MailBoxTypeRef,
} from "@tutao/entities/tutanota"
import { isSameId, OperationType } from "../../../../../../src/platform-kit/meta"
import { SuspensionError } from "../../../../../../src/platform-kit/rest-client/error"
import { EntityUpdateData } from "../../../../../../src/platform-kit/instance-pipeline/utils/EntityUpdateUtils"
import { uint8ArrayToString } from "../../../../../../src/platform-kit/utils"
import { sha256Hash } from "@tutao/crypto/sha256"
import { MailboxMigrationFacade } from "../../../../../../src/applications/common/api/worker/facades/lazy/MailboxMigrationFacade"
import { MailboxMigrationUiSession } from "../../../../../../src/applications/mail-app/settings/migration/MailboxMigrationController"
import { noPatchesAndInstance } from "../../EventBusClientTest"
import { CacheMode, DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS } from "../../../../../../src/platform-kit/instance-pipeline/RestClientOptions"
import { UserFacade } from "../../../../../../src/platform-kit/base/facades/UserFacade"
import { MigrationSyncSystemFacade } from "../../../../../../src/app-kit/native-bridge/common/generatedipc/types"
import { createIdTupleWrapper, UserMigrationInformationTypeRef } from "@tutao/entities/sys"

const { anything } = matchers

o.spec("MailboxImporter", () => {
	let migrationSyncSystemFacade: MigrationSyncSystemFacade
	let mailboxMigrationFacadeMock: MailboxMigrationFacade
	let importMailFacadeMock: ImportMailFacade
	let userFacadeMock: UserFacade
	let importer: MailboxImporter

	const migrationSyncStateIdMock: IdTuple = ["migrationSyncStateListId", "migrationSyncStateElementId"]
	const folderSyncStateIdMock: IdTuple = ["folderSyncStateListId", "folderSyncStateElementId"]
	const mailFolderIdMock: IdTuple = ["mailSetListId", "mailSetElementId"]
	const mailGroupIdMock = "mailGroup123"
	const userMigrationInfosListIdMock = "userMigrationInfosListId"
	const mailboxMigrationImapConfiguration = createTestEntity(MailboxMigrationImapConfigurationTypeRef, {
		host: "imap.test.com",
		port: "993",
		sharedUsername: "user@test.com",
		sharedPassword: "pass",
		sharedOauthToken: null,
	})
	const migrationCredentials: MigrationCredentials = {
		host: "imap.test.com",
		port: 993,
		username: "user@test.com",
		password: "pass",
		ignoreCertificateErrors: false,
		isLegacy: false,
		customCertificateData: null,
		provider: MailboxMigrationProvider.Other,
		useSSL: true,
	}
	const migrationMailbox: MigrationMailbox = { sourceId: "INBOX", name: "INBOX" }
	const migrationMailboxStatus: MigrationMailboxStatus = {
		sourceId: "INBOX",
		uidNext: 100,
		uidValidity: 12345n,
		highestModSeq: 67890n,
		syncStatus: MailboxMigrationFolderSyncStatus.RUNNING,
	} as MigrationMailboxStatus
	const migrationMail: MigrationMail = {
		sourceId: "42",
		belongsToMailbox: migrationMailbox,
		modSeq: 123n,
		envelope: { messageId: "msg123" } as MigrationMailEnvelope,
		attachments: [],
	}

	let mailboxMigrationSyncStateMock: MailboxMigrationSyncState
	let folderSyncStateMock: MailboxMigrationFolderSyncState
	let importedMailMock: ImportedMigrationMail
	o.beforeEach(async () => {
		migrationSyncSystemFacade = object<MigrationSyncSystemFacade>()
		mailboxMigrationFacadeMock = object<MailboxMigrationFacade>()
		importMailFacadeMock = object<ImportMailFacade>()
		userFacadeMock = object<UserFacade>()

		importer = new MailboxImporter(migrationSyncSystemFacade, mailboxMigrationFacadeMock, importMailFacadeMock, userFacadeMock)

		when(userFacadeMock.getLoggedInUser()).thenReturn({ userMigrationInfos: userMigrationInfosListIdMock } as any)
		when(mailboxMigrationFacadeMock.getAllUserMigrationInformation(anything())).thenResolve([])

		mailboxMigrationSyncStateMock = createTestEntity(MailboxMigrationSyncStateTypeRef, {
			_id: migrationSyncStateIdMock,
			_ownerGroup: mailGroupIdMock,
			imapConfiguration: mailboxMigrationImapConfiguration,
			rootImportMailSet: null,
			mailboxMigrationFolderSyncStates: "folderSyncStateListId",
			status: MailboxMigrationSyncStatus.RUNNING.toString(),
			legacyProvider: MailboxMigrationProvider.Other.toString(),
		})
		folderSyncStateMock = createTestEntity(MailboxMigrationFolderSyncStateTypeRef, {
			_id: folderSyncStateIdMock,
			_ownerGroup: mailGroupIdMock,
			sourceId: "INBOX",
			mailSet: mailFolderIdMock,
			uidnext: "100",
			uidvalidity: "12345",
			highestmodseq: "67890",
			status: MailboxMigrationFolderSyncStatus.RUNNING,
			importedMails: "importedMailsListId",
		})
		importedMailMock = createTestEntity(ImportedMigrationMailTypeRef, {
			sourceId: "42",
			imapModSeq: "123",
			messageId: "msg123",
		})
		const statusArgumentCaptor = matchers.captor()
		when(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				statusArgumentCaptor.capture(),
				anything(),
				anything(),
				anything(),
			),
		).thenDo(() => {
			mailboxMigrationSyncStateMock.status = statusArgumentCaptor.value
		})
	})

	o.test("init - marks sync state permanently deleted when every folder is NO_SYNC or CANCELED", async () => {
		const nonLegacySyncState = {
			...mailboxMigrationSyncStateMock,
			legacyProvider: null,
		}
		const canceledFolder = {
			...folderSyncStateMock,
			status: MailboxMigrationFolderSyncStatus.CANCELED,
		}
		const noSyncFolder = {
			...folderSyncStateMock,
			status: MailboxMigrationFolderSyncStatus.NO_SYNC,
		}
		const userMigrationInformation = createTestEntity(UserMigrationInformationTypeRef, {
			mailboxMigrationSyncStates: [
				createIdTupleWrapper({
					listId: migrationSyncStateIdMock[0],
					listElementId: migrationSyncStateIdMock[1],
				}),
			],
		})
		const mailbox = createTestEntity(MailBoxTypeRef, {
			mailboxMigrationSyncStates: "syncStatesListId",
		})

		when(mailboxMigrationFacadeMock.getAllMailboxMigrationSyncStates("syncStatesListId")).thenResolve([nonLegacySyncState])
		when(mailboxMigrationFacadeMock.getAllUserMigrationInformation(userMigrationInfosListIdMock)).thenResolve([userMigrationInformation])
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates("folderSyncStateListId")).thenResolve([canceledFolder, noSyncFolder])

		await importer.init([mailbox])

		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				nonLegacySyncState,
				MailboxMigrationSyncStatus.ALL_FOLDERS_PERMANENTLY_DELETED,
				MailboxMigrationFolderSyncStatus.CANCELED,
				undefined,
			),
			{ times: 1 },
		)
		o.check(importer.mailboxImportSessions.size).equals(1)
	})

	o.test("init - does not mark sync state permanently deleted when there are folder(s) still syncing", async () => {
		const nonLegacySyncState = {
			...mailboxMigrationSyncStateMock,
			legacyProvider: null,
		}
		const userMigrationInformation = createTestEntity(UserMigrationInformationTypeRef, {
			mailboxMigrationSyncStates: [
				createIdTupleWrapper({
					listId: migrationSyncStateIdMock[0],
					listElementId: migrationSyncStateIdMock[1],
				}),
			],
		})
		const mailbox = createTestEntity(MailBoxTypeRef, {
			mailboxMigrationSyncStates: "syncStatesListId",
		})

		when(mailboxMigrationFacadeMock.getAllMailboxMigrationSyncStates("syncStatesListId")).thenResolve([nonLegacySyncState])
		when(mailboxMigrationFacadeMock.getAllUserMigrationInformation(userMigrationInfosListIdMock)).thenResolve([userMigrationInformation])
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.init([mailbox])

		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				nonLegacySyncState,
				MailboxMigrationSyncStatus.ALL_FOLDERS_PERMANENTLY_DELETED,
				MailboxMigrationFolderSyncStatus.CANCELED,
				undefined,
			),
			{ times: 0 },
		)
		o.check(importer.mailboxImportSessions.size).equals(1)
	})

	o.test("initializeImport - creates new session when no existing sync state", async () => {
		const initParams = {
			mailGroupId: mailGroupIdMock,
			matchMigrationMailboxesToTutaMailSets: false,
			rootImportMailSetName: "IMAP Import",
			spamFolderMigrationInformation: {
				shouldMigrateSpamFolder: false,
				spamMailbox: null,
			},
			imapConfiguration: mailboxMigrationImapConfiguration,
			migrationSyncLabelData: null,
			provider: MailboxMigrationProvider.Other,
		} as InitializeMigrationParams
		when(mailboxMigrationFacadeMock.initializeMailboxImport(initParams)).thenResolve({
			mailboxMigrationSyncState: mailboxMigrationSyncStateMock,
			initialFolderSyncStates: [],
		})
		const session = await importer.initializeNewImport(initParams)

		o.check(session.mailboxMigrationSyncState).equals(mailboxMigrationSyncStateMock)
		o.check(importer.mailboxImportSessions.size).equals(1)
		verify(mailboxMigrationFacadeMock.initializeMailboxImport(initParams), { times: 1 })
	})

	o.test("continueImport - starts import when state is not running and not postponed or postponement expired", async () => {
		mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.PAUSED
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])
		when(mailboxMigrationFacadeMock.getImportedMails("importedMailsListId")).thenResolve([importedMailMock])
		when(mailboxMigrationFacadeMock.getDeduplicatedImportedAttachments(mailGroupIdMock)).thenResolve([])
		when(migrationSyncSystemFacade.startSync(migrationSyncStateIdMock, anything())).thenResolve()
		when(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.RUNNING,
				MailboxMigrationFolderSyncStatus.RUNNING,
			),
		).thenDo(() => {
			session.mailboxMigrationSyncState.status = MailboxMigrationSyncStatus.RUNNING
			folderSyncStateMock.status = MailboxMigrationFolderSyncStatus.RUNNING
		})
		when(
			mailboxMigrationFacadeMock.getMailboxMigrationSyncStateById(migrationSyncStateIdMock, {
				...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
				cacheMode: CacheMode.WriteOnly,
			}),
		).thenResolve(session.mailboxMigrationSyncState)
		const result = await importer.continueImport(migrationSyncStateIdMock)

		o.check(result.state.status).equals(MailboxMigrationSyncStatus.RUNNING)
		o.check(session.mailboxMigrationSyncState.status).equals(MailboxMigrationSyncStatus.RUNNING)
		verify(migrationSyncSystemFacade.startSync(migrationSyncStateIdMock, anything()), { times: 1 })
		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.RUNNING,
				MailboxMigrationFolderSyncStatus.RUNNING,
			),
			{
				times: 1,
			},
		)
	})

	o.test("continueImport - returns postponed if postponedUntil in future", async () => {
		const futureDate = new Date(Date.now() + 60000)
		mailboxMigrationSyncStateMock.postponedUntil = futureDate.getTime().toString()
		mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.POSTPONED
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		when(
			mailboxMigrationFacadeMock.getMailboxMigrationSyncStateById(migrationSyncStateIdMock, {
				...DEFAULT_ENTITY_RESTCLIENT_LOAD_OPTIONS,
				cacheMode: CacheMode.WriteOnly,
			}),
		).thenResolve(session.mailboxMigrationSyncState)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const result = await importer.continueImport(migrationSyncStateIdMock)

		o.check(result.state.status).equals(MailboxMigrationSyncStatus.POSTPONED)
		o.check(result.state.postponedUntil).deepEquals(futureDate)
		verify(migrationSyncSystemFacade.startSync(migrationSyncStateIdMock, anything()), { times: 0 })
	})

	o.test("pauseImport - stops import and updates state", async () => {
		mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.RUNNING
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		session.mailboxMigrationFolderSyncStates = [folderSyncStateMock]
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		when(migrationSyncSystemFacade.stopSync(migrationSyncStateIdMock)).thenResolve()
		when(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.PAUSED,
				MailboxMigrationFolderSyncStatus.PAUSED,
				null,
			),
		).thenDo(() => {
			session.mailboxMigrationSyncState.status = MailboxMigrationSyncStatus.PAUSED
			folderSyncStateMock.status = MailboxMigrationFolderSyncStatus.PAUSED
		})
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.pauseImport(migrationSyncStateIdMock)

		o.check(session.mailboxMigrationSyncState.status).equals(MailboxMigrationSyncStatus.PAUSED)
		verify(migrationSyncSystemFacade.stopSync(migrationSyncStateIdMock), { times: 1 })
		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.PAUSED,
				MailboxMigrationFolderSyncStatus.PAUSED,
				null,
			),
			{
				times: 1,
			},
		)
	})

	o.test("pauseImport - does nothing if session not found", async () => {
		await importer.pauseImport(migrationSyncStateIdMock)
		verify(migrationSyncSystemFacade.stopSync(anything()), { times: 0 })
	})

	o.test("deleteImport - deletes and stops import, removes session", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		when(mailboxMigrationFacadeMock.deleteMigrationImport(migrationSyncStateIdMock)).thenResolve()
		when(migrationSyncSystemFacade.stopSync(migrationSyncStateIdMock)).thenResolve()

		await importer.deleteImport(migrationSyncStateIdMock)

		verify(mailboxMigrationFacadeMock.deleteMigrationImport(migrationSyncStateIdMock), { times: 1 })
		verify(migrationSyncSystemFacade.stopSync(migrationSyncStateIdMock), { times: 1 })
		o.check(importer.mailboxImportSessions.has(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock))).equals(false)
	})

	o.test("onMailbox - handles CREATE event", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		when(
			mailboxMigrationFacadeMock.initializeMigrationMailSet(
				migrationMailbox,
				session.mailboxMigrationSyncState,
				MailboxMigrationProvider.Other,
				null,
				true,
				false,
			),
		).thenResolve(folderSyncStateMock)

		await importer.onMailbox(migrationSyncStateIdMock, migrationMailbox, MigrationSyncEventType.CREATE)

		o.check(session.mailboxMigrationFolderSyncStates.includes(folderSyncStateMock)).equals(true)
	})

	o.test("onMailbox - handles DELETE event", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		when(mailboxMigrationFacadeMock.deleteMigrationFolderSyncState(folderSyncStateIdMock)).thenDo(() => {
			const folderSyncState = session.mailboxMigrationFolderSyncStates.findIndex((folderSyncState) =>
				isSameId(folderSyncState._id, folderSyncStateIdMock),
			)
			if (folderSyncState !== -1) {
				session.mailboxMigrationFolderSyncStates.splice(folderSyncState, 1)
			}
		})

		await importer.onMailbox(migrationSyncStateIdMock, migrationMailbox, MigrationSyncEventType.DELETE)

		o.check(session.mailboxMigrationFolderSyncStates.length).equals(0)
		verify(mailboxMigrationFacadeMock.deleteMigrationFolderSyncState(folderSyncStateIdMock), { times: 1 })
	})

	o.test("onMailboxStatus - updates folder sync state", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const updatedStateMock = { ...folderSyncStateMock, uidnext: "200" }
		when(mailboxMigrationFacadeMock.updateMigrationFolderSyncState(migrationMailboxStatus, folderSyncStateMock)).thenDo(
			() => (session.mailboxMigrationFolderSyncStates[0] = updatedStateMock),
		)

		await importer.onMailboxStatus(migrationSyncStateIdMock, migrationMailboxStatus)

		o.check(session.mailboxMigrationFolderSyncStates[0]).equals(updatedStateMock)
	})

	o.test("onMailboxStatus - if uidvalidity is different set sync state to error", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		migrationMailboxStatus.uidValidity = 123n
		await importer.onMailboxStatus(migrationSyncStateIdMock, migrationMailboxStatus)
		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.ERROR,
				MailboxMigrationFolderSyncStatus.CANCELED,
				anything(),
			),
			{
				times: 1,
			},
		)
	})

	o.test("onMultipleMails - imports mails that are not yet imported", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const migrationMails = [migrationMail]
		const importMailParams = migrationMailToImportMailParams(migrationMails[0], folderSyncStateIdMock, [], [])
		when(importMailFacadeMock.importMails([importMailParams], mailGroupIdMock)).thenResolve()
		when(mailboxMigrationFacadeMock.getDeduplicatedImportedAttachments(mailGroupIdMock)).thenResolve([])
		await importer.onMultipleMails(migrationSyncStateIdMock, migrationMails, MigrationSyncEventType.CREATE)
		verify(importMailFacadeMock.importMails(anything(), mailGroupIdMock), { times: 1 })
	})

	o.test("onMultipleMails - imports even if messageId already seen", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const migrationMails = [migrationMail]
		when(mailboxMigrationFacadeMock.getDeduplicatedImportedAttachments(mailGroupIdMock)).thenResolve([])
		await importer.onMultipleMails(migrationSyncStateIdMock, migrationMails, MigrationSyncEventType.CREATE)

		verify(importMailFacadeMock.importMails(anything(), anything()), { times: 1 })
	})

	o.test("onMultipleMails - handles SuspensionError by postponing import", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const migrationMails = [migrationMail]
		when(importMailFacadeMock.importMails(anything(), anything())).thenReject(new SuspensionError("Server busy", "120"))
		when(migrationSyncSystemFacade.stopSync(anything())).thenResolve()
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates(anything())).thenResolve([])
		when(mailboxMigrationFacadeMock.getDeduplicatedImportedAttachments(mailGroupIdMock)).thenResolve([])

		await importer.onMultipleMails(migrationSyncStateIdMock, migrationMails, MigrationSyncEventType.CREATE)
		verify(importMailFacadeMock.importMails(anything(), anything()), { times: 1 })
		o.check(mailboxMigrationSyncStateMock.status).equals(MailboxMigrationSyncStatus.POSTPONED)
		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.POSTPONED,
				MailboxMigrationFolderSyncStatus.PAUSED,
				null,
				anything(),
			),
			{ times: 1 },
		)
	})

	o.test("onPostpone - postpones the import", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const postponedUntil = Date.now() + 5000
		when(migrationSyncSystemFacade.stopSync(anything())).thenResolve()
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates(anything())).thenResolve([])
		when(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.POSTPONED,
				MailboxMigrationFolderSyncStatus.PAUSED,
				null,
				postponedUntil.toString(),
			),
		).thenDo(() => {
			session.mailboxMigrationSyncState.status = MailboxMigrationSyncStatus.POSTPONED
			session.mailboxMigrationSyncState.postponedUntil = postponedUntil.toString()
		})
		await importer.onPostpone(migrationSyncStateIdMock, postponedUntil)

		o.check(session.mailboxMigrationSyncState.status).equals(MailboxMigrationSyncStatus.POSTPONED)
		o.check(session.mailboxMigrationSyncState.postponedUntil).equals(postponedUntil.toString())
	})

	o.test("onFinish - marks session as FINISHED and updates folder states", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		when(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.FINISHED,
				MailboxMigrationFolderSyncStatus.FINISHED,
			),
		).thenDo(() => {
			mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.FINISHED
		})

		await importer.onFinish(migrationSyncStateIdMock)

		o.check(session.mailboxMigrationSyncState.status).equals(MailboxMigrationSyncStatus.FINISHED)
		verify(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				mailboxMigrationSyncStateMock,
				MailboxMigrationSyncStatus.FINISHED,
				MailboxMigrationFolderSyncStatus.FINISHED,
			),
			{ times: 1 },
		)
	})

	o.test("onError - sets session state to PAUSED when the error is AUTH_FAILED", async () => {
		mailboxMigrationSyncStateMock.status = MailboxMigrationSyncStatus.RUNNING
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)
		when(
			mailboxMigrationFacadeMock.updateMailboxMigrationSyncStateAndAllFolderSyncStates(
				session.mailboxMigrationSyncState,
				MailboxMigrationSyncStatus.PAUSED,
				anything(),
				anything(),
				anything(),
			),
		).thenDo(() => {
			session.mailboxMigrationSyncState.status = MailboxMigrationSyncStatus.PAUSED
		})

		const imapError = new MigrationError("Some error", MigrationErrorCause.AUTH_FAILED)
		await importer.onError(migrationSyncStateIdMock, imapError)

		o.check(session.mailboxMigrationSyncState.status).equals(MailboxMigrationSyncStatus.PAUSED)
	})

	o.test("entityEventsReceived - updates existing session on MailboxMigrationmigrationSyncState update", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [folderSyncStateMock], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const update = {
			instanceListId: "migrationSyncStateListId",
			instanceId: "migrationSyncStateElementId",
			operation: OperationType.UPDATE,
			typeRef: MailboxMigrationSyncStateTypeRef,
			...noPatchesAndInstance,
		} as EntityUpdateData
		when(mailboxMigrationFacadeMock.getMailboxMigrationSyncStateById(migrationSyncStateIdMock)).thenResolve(mailboxMigrationSyncStateMock)
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.onEntityUpdatesReceived([update], "groupId")

		o.check(session.mailboxMigrationSyncState).equals(mailboxMigrationSyncStateMock)
		o.check(session.mailboxMigrationFolderSyncStates).deepEquals([folderSyncStateMock])
	})

	o.test("entityEventsReceived - creates new session on CREATE operation", async () => {
		const update = {
			instanceListId: "migrationSyncStateListId",
			instanceId: "migrationSyncStateElementId",
			operation: OperationType.CREATE,
			typeRef: MailboxMigrationSyncStateTypeRef,
			...noPatchesAndInstance,
		} as EntityUpdateData
		when(mailboxMigrationFacadeMock.getMailboxMigrationSyncStateById(migrationSyncStateIdMock)).thenResolve(mailboxMigrationSyncStateMock)
		when(mailboxMigrationFacadeMock.getAllMailboxMigrationFolderSyncStates("folderSyncStateListId")).thenResolve([folderSyncStateMock])

		await importer.onEntityUpdatesReceived([update], "groupId")

		o.check(importer.mailboxImportSessions.size).equals(1)
		const newSession = importer.mailboxImportSessions.get(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock))
		o.check(newSession!.mailboxMigrationSyncState).equals(mailboxMigrationSyncStateMock)
	})

	o.test("entityEventsReceived - deletes session on DELETE operation", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		importer.mailboxImportSessions.set(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock), session)

		const update = {
			instanceListId: "migrationSyncStateListId",
			instanceId: "migrationSyncStateElementId",
			operation: OperationType.DELETE,
			typeRef: MailboxMigrationSyncStateTypeRef,
			...noPatchesAndInstance,
		} as EntityUpdateData

		// TODO: needs tests for the changes in delete operation.
		await importer.onEntityUpdatesReceived([update], "groupId")

		o.check(importer.mailboxImportSessions.has(importer.getMailboxImportSessionsMapKey(migrationSyncStateIdMock))).equals(false)
	})

	o.test("performAttachmentDeduplication - reuses existing attachment hash", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		session.mailboxMigrationSyncState._ownerGroup = mailGroupIdMock
		const attachment: MigrationMailAttachment = { size: 3, mimeType: "text/plain", content: new Uint8Array([1, 2, 3]) } as MigrationMailAttachment
		const fileHash = uint8ArrayToString("utf-8", sha256Hash(attachment.content))
		const existingFileIdMock: IdTuple = ["fileList", "fileElement"]

		const groupMap = new Map<string, Promise<IdTuple | undefined>>()
		groupMap.set(fileHash, Promise.resolve(existingFileIdMock))
		importer.deduplicatedImportedAttachmentHashToFileIdByMailGroup.set(mailGroupIdMock, groupMap)

		const result = await importer.performAttachmentDeduplication(session, [attachment])

		o.check(result.length).equals(1)
		const attachmentResult = result[0] as MigrationImportTutaFileId
		o.check(attachmentResult._type).equals("MigrationImportTutaFileId")
		o.check(attachmentResult._id).deepEquals(existingFileIdMock)
	})

	o.test("performAttachmentDeduplication - uploads new attachment if not deduplicated", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		session.mailboxMigrationSyncState._ownerGroup = mailGroupIdMock
		const attachment: MigrationMailAttachment = {
			size: 3,
			mimeType: "image/png",
			content: new Uint8Array([1, 2, 3]),
			cid: "cid123",
			filename: "image.png",
		} as MigrationMailAttachment

		const fileHash = uint8ArrayToString("utf-8", sha256Hash(attachment.content))
		when(mailboxMigrationFacadeMock.getDeduplicatedImportedAttachments(mailGroupIdMock)).thenResolve([])

		const result = await importer.performAttachmentDeduplication(session, [attachment])

		o.check(result.length).equals(1)
		const attachmentResult = result[0] as any
		o.check(attachmentResult._type).equals("DataFile")
		o.check(attachmentResult.name).equals("image.png")
		o.check(attachmentResult.data).equals(attachment.content)
		o.check(attachmentResult.fileHash).equals(fileHash)
		o.check(attachmentResult.cid).equals("cid123")
	})

	o.test("getMigrationMailboxes - delegates to system facade", async () => {
		const resultMock: MigrationMailbox[] = []
		when(migrationSyncSystemFacade.getMigrationMailboxes(migrationCredentials)).thenResolve(resultMock)

		const result = await importer.getMigrationMailboxesFromServer(migrationCredentials)

		o.check(result).equals(resultMock)
		verify(migrationSyncSystemFacade.getMigrationMailboxes(migrationCredentials), { times: 1 })
	})

	o.test("getMailboxImportUiSessions - returns sessions map", async () => {
		const session = newMailboxImportSession(mailboxMigrationSyncStateMock, [], null)
		importer.mailboxImportSessions.set("key", session)

		const result = await importer.getMailboxImportUiSessions()

		o.check(result).deepEquals({
			activeSessions: [
				{
					mailGroupId: mailGroupIdMock,
					username: mailboxMigrationSyncStateMock.imapConfiguration!.sharedUsername,
					mailboxMigrationSyncStateId: migrationSyncStateIdMock,
					mailboxMigrationSyncStatus: mailboxMigrationSyncStateMock.status,
					postponedUntil: new Date(parseInt(mailboxMigrationSyncStateMock.postponedUntil)),
					syncProgress: {
						completed: 0,
						total: 0,
					},
					importedMailCount: 0,
					provider: MailboxMigrationProvider.Other,
				} as MailboxMigrationUiSession,
			],
			concludedSessions: [],
		})
	})
})
