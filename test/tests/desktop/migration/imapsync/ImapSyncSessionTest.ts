import o, { assertThrows } from "@tutao/otest"
import { matchers, object, verify, when } from "testdouble"
import { MigrationSyncEventListener } from "../../../../../src/applications/common/desktop/migration/MigrationSyncEventListener"
import type { ImapFlow, ListTreeResponse } from "imapflow"
import {
	ImapFlowFactory,
	ImapSyncConfig,
	ImapSyncSession,
	SyncSessionState,
} from "../../../../../src/applications/common/desktop/migration/imapsync/ImapSyncSession"
import {
	MigrationCredentials,
	MigrationMailboxState,
	MigrationSyncContext,
} from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationSyncContext"
import { MigrationError, MigrationErrorCause } from "../../../../../src/applications/common/api/common/error/MigrationError"
import { MigrationSessionMailbox } from "../../../../../src/applications/common/desktop/migration/MigrationSessionMailbox"
import { CertificateProvider } from "../../../../../src/applications/common/desktop/CertificateProvider"
import { MigrationMailboxSpecialUse } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationMailbox"
import { getFirstOrThrow } from "../../../../../src/platform-kit/utils"
import { MailboxMigrationProvider } from "../../../../../src/applications/common/api/common/utils/migrationImportUtils/MigrationKnownConfigs"

o.spec("ImapSyncSession", () => {
	let eventListenerMock: MigrationSyncEventListener
	let configMock: ImapSyncConfig
	let imapFlowFactory: ImapFlowFactory
	let imapFlowMock: ImapFlow
	let session: ImapSyncSession
	let certificateProviderMock: CertificateProvider

	const imapCredentials: MigrationCredentials = {
		host: "localhost",
		port: 993,
		username: "user",
		password: "pass",
		ignoreCertificateErrors: false,
		isLegacy: false,
		customCertificateData: null,
		provider: MailboxMigrationProvider.Other,
		useSSL: true,
	}
	const imapSyncContext: MigrationSyncContext = {
		migrationCredentials: imapCredentials,
		migrationMailboxStates: [],
		isGmail: false,
	}

	o.beforeEach(() => {
		eventListenerMock = object<MigrationSyncEventListener>()
		configMock = {
			emitMigrationSyncEventTypes: new Set(),
			isEnableImapQresync: true,
		}
		imapFlowMock = object<ImapFlow>()
		certificateProviderMock = object<CertificateProvider>()
		imapFlowFactory = () => Promise.resolve(imapFlowMock)
		const listTreeResponse = { folders: [{ disabled: false, path: "INBOX" }] }
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		when(imapFlowMock.mailboxOpen(matchers.anything(), matchers.anything())).thenResolve({})
		when(imapFlowMock.fetch(matchers.anything(), matchers.anything())).thenResolve((async function* () {})())
		session = new ImapSyncSession(eventListenerMock, certificateProviderMock, configMock, imapFlowFactory)
	})

	o.test("startSync - when not running, sets up and starts sync", async () => {
		await session.startSync(imapSyncContext)
		verify(imapFlowMock.connect(), { times: 2 })
		verify(imapFlowMock.listTree(), { times: 1 })
		verify(imapFlowMock.logout(), { times: 1 })
	})

	o.test("startSync - when already running, does nothing", async () => {
		session.state = SyncSessionState.RUNNING

		await session.startSync(imapSyncContext)

		verify(imapFlowMock.connect(), { times: 0 })
		verify(imapFlowMock.listTree(), { times: 0 })
		verify(imapFlowMock.logout(), { times: 0 })
		o.check(session.state).equals(SyncSessionState.RUNNING)
	})

	o.test("startSync - returns ImapError when authentication fails", async () => {
		const error = new Error("Authentication failed") as any
		error.serverResponseCode = "AUTHENTICATIONFAILED"
		when(imapFlowMock.connect()).thenReject(error)

		const e = await assertThrows(MigrationError, async () => await session.startSync(imapSyncContext))
		o.check(e!.data.cause).equals(MigrationErrorCause.AUTH_FAILED)
	})

	o.test("startSync - returns ImapError with UNKNOWN when unknown error happens", async () => {
		const error = new Error("Server connection failed") as any
		when(imapFlowMock.connect()).thenReject(error)

		const e = await assertThrows(MigrationError, async () => await session.startSync(imapSyncContext))
		o.check(e!.data.cause).equals(MigrationErrorCause.UNKNOWN)
		o.check(session!.state).equals(SyncSessionState.POSTPONED)
	})

	o.test("stopSync - stops all processes", async () => {
		await session.startSync(imapSyncContext)
		await session.stopSync()
		o.check(session.state).equals(SyncSessionState.STOPPED)
	})

	o.test("onAllMailboxesFinish - finishes and calls onFinish", async () => {
		await session.startSync(imapSyncContext)
		await session.onAllMailboxesFinish()

		verify(eventListenerMock.onFinish(), { times: 1 })
		o.check(session.state.valueOf()).equals(SyncSessionState.FINISHED.valueOf())
	})

	o.test("startNextMailboxSync - starts the next mailbox sorted by importance if failureCount is 0", async () => {
		const draftFolderState = {
			path: "DRAFT",
			uidValidity: 1n,
			uidNext: 2,
			highestModSeq: 1n,
			importedSourceIdToMailIdsMap: new Map(),
		} as MigrationMailboxState
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: false, path: "DRAFT", name: "DRAFT" },
				{ disabled: false, path: "Custom", name: "Custom" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: MigrationSyncContext = {
			migrationCredentials: imapCredentials,
			migrationMailboxStates: [],
			isGmail: false,
		}
		await session.startSync(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		const syncSessionMailbox = new MigrationSessionMailbox(draftFolderState)
		session.syncSessionMailboxes[0].importance = 1 // INBOX
		session.syncSessionMailboxes[1].importance = 2 // DRAFT
		session.syncSessionMailboxes[2].importance = 3 // CUSTOM

		await session.onMailboxFinish(syncSessionMailbox)

		o(session.runningSyncSessionProcess?.syncSessionProcessMailbox.mailboxState.path).equals("Custom")
	})

	o.test("startNextMailboxSync - starts the next mailbox sorted by failure count if failureCount is same", async () => {
		const draftFolderState = {
			path: "DRAFT",
			uidValidity: 1n,
			uidNext: 2,
			highestModSeq: 1n,
			importedSourceIdToMailIdsMap: new Map(),
		} as MigrationMailboxState
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: false, path: "DRAFT", name: "DRAFT" },
				{ disabled: false, path: "Custom", name: "Custom" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: MigrationSyncContext = {
			migrationCredentials: imapCredentials,
			migrationMailboxStates: [],
			isGmail: false,
		}
		await session.startSync(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		const syncSessionMailbox = new MigrationSessionMailbox(draftFolderState)
		session.syncSessionMailboxes[0].importance = 2 // INBOX
		session.syncSessionMailboxes[0].failCount = 0 // INBOX
		session.syncSessionMailboxes[2].importance = 2 // CUSTOM
		session.syncSessionMailboxes[2].failCount = 1 // CUSTOM

		await session.onMailboxFinish(syncSessionMailbox)

		o(session.runningSyncSessionProcess?.syncSessionProcessMailbox.mailboxState.path).equals("INBOX")
	})

	o.test("startNextMailboxSync - sorts by failure count and then importance", async () => {
		const draftFolderState = {
			path: "DRAFT",
			uidValidity: 1n,
			uidNext: 2,
			highestModSeq: 1n,
			importedSourceIdToMailIdsMap: new Map(),
		} as MigrationMailboxState
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: false, path: "DRAFT", name: "DRAFT" },
				{ disabled: false, path: "Custom", name: "Custom" },
				{ disabled: false, path: "Another", name: "Another" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: MigrationSyncContext = {
			migrationCredentials: imapCredentials,
			migrationMailboxStates: [],
			isGmail: false,
		}
		await session.startSync(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		const syncSessionMailbox = new MigrationSessionMailbox(draftFolderState)
		session.syncSessionMailboxes[0].importance = 1 // INBOX
		session.syncSessionMailboxes[0].failCount = 0 // INBOX
		session.syncSessionMailboxes[2].importance = 2 // CUSTOM
		session.syncSessionMailboxes[2].failCount = 0 // CUSTOM
		session.syncSessionMailboxes[3].importance = 3 // Another
		session.syncSessionMailboxes[3].failCount = 1 // Another

		await session.onMailboxFinish(syncSessionMailbox)

		o(session.runningSyncSessionProcess?.syncSessionProcessMailbox.mailboxState.path).equals("Custom")
	})

	o.test("startNextMailboxSync - only syncSessionMailbox is ALL mailbox if isGmail is true", async () => {
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "ALL", name: "All Mails", specialUse: MigrationMailboxSpecialUse.ALL },
				{ disabled: false, path: "DRAFT", name: "DRAFT", specialUse: MigrationMailboxSpecialUse.DRAFT },
				{ disabled: false, path: "Custom", name: "INBOX", specialUse: MigrationMailboxSpecialUse.INBOX },
				{ disabled: false, path: "Another", name: "Another" },
				{ disabled: true, path: "Trash", specialUse: MigrationMailboxSpecialUse.TRASH },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)
		const imapSyncContextWithStates: MigrationSyncContext = {
			migrationCredentials: imapCredentials,
			migrationMailboxStates: [],
			isGmail: true,
		}
		await session.startSync(imapSyncContextWithStates)
		session.state = SyncSessionState.RUNNING
		o(session.syncSessionMailboxes?.length).equals(1)
		o(getFirstOrThrow(session.syncSessionMailboxes).specialUse).equals(MigrationMailboxSpecialUse.ALL)
	})

	o.test("getMigrationMailboxes - returns array of ImapMailbox", async () => {
		const listTreeResponse = {
			folders: [
				{ disabled: false, path: "INBOX", name: "INBOX" },
				{ disabled: true, path: "Trash" },
			],
		}
		when(imapFlowMock.listTree()).thenResolve(listTreeResponse)

		const result = await session.getMigrationMailboxes(imapCredentials)
		o.check(result.length).equals(1)
		o.check(result[0].path).equals("INBOX")
		verify(imapFlowMock.connect(), { times: 2 }) // one for verify, one for connect
		verify(imapFlowMock.logout(), { times: 1 })
	})

	o.test("filterDisabledAndPromoteChildren - filters disabled folders, promotes children, and updates names correctly", () => {
		// The label structure (in Gmail) is as the following:
		// Inbox
		// Starred
		// Sent
		// Drafts
		// All Mail
		// Trash
		// Important
		// Cus/tom
		// 		Nested/Slash
		//     		DoubleNested
		// Duplicated/Folder
		// 		DuplicatedFolder
		// example
		// 		Label/With/Slashes
		// New
		// 		Label
		// 			With
		// 				Slashes

		// The list tree response for the above structure is as follows:
		const input: ListTreeResponse[] = [
			{
				name: "INBOX",
				flags: new Set(),
				path: "INBOX",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Inbox",
			},
			{
				name: "Starred",
				flags: new Set(),
				path: "[Gmail]/Starred",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Flagged",
			},
			{
				name: "Sent Mail",
				flags: new Set(),
				path: "[Gmail]/Sent Mail",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Sent",
			},
			{
				name: "Drafts",
				flags: new Set(),
				path: "[Gmail]/Drafts",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Drafts",
			},
			{
				name: "All Mail",
				flags: new Set(),
				path: "[Gmail]/All Mail",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\All",
			},
			{
				name: "Trash",
				flags: new Set(),
				path: "[Gmail]/Trash",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Trash",
			},
			{
				name: "[Gmail]",
				flags: new Set(),
				path: "[Gmail]",
				subscribed: true,
				listed: true,
				delimiter: "/",
				disabled: true,
				folders: [
					{
						name: "Important",
						flags: new Set(),
						path: "[Gmail]/Important",
						subscribed: true,
						listed: true,
						delimiter: "/",
					},
				],
			},
			{
				name: "Cus",
				flags: new Set(),
				path: "Cus",
				subscribed: true,
				listed: true,
				delimiter: "/",
				disabled: true,
				folders: [
					{
						name: "tom",
						flags: new Set(),
						path: "Cus/tom",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [
							{
								name: "Nested",
								flags: new Set(),
								path: "Cus/tom/Nested",
								subscribed: true,
								listed: true,
								delimiter: "/",
								disabled: true,
								folders: [
									{
										name: "Slash",
										flags: new Set(),
										path: "Cus/tom/Nested/Slash",
										subscribed: true,
										listed: true,
										delimiter: "/",
										folders: [
											{
												name: "DoubleNested",
												flags: new Set(),
												path: "Cus/tom/Nested/Slash/DoubleNested",
												subscribed: true,
												listed: true,
												delimiter: "/",
											},
										],
									},
								],
							},
						],
					},
				],
			},
			{
				name: "Duplicated",
				flags: new Set(),
				path: "Duplicated",
				subscribed: true,
				listed: true,
				delimiter: "/",
				disabled: true,
				folders: [
					{
						name: "Folder",
						flags: new Set(),
						path: "Duplicated/Folder",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [
							{
								name: "DuplicatedFolder",
								flags: new Set(),
								path: "Duplicated/Folder/DuplicatedFolder",
								subscribed: true,
								listed: true,
								delimiter: "/",
							},
						],
					},
				],
			},
			{
				name: "example",
				flags: new Set(),
				path: "example",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [
					{
						name: "Label",
						flags: new Set(),
						path: "example/Label",
						subscribed: true,
						listed: true,
						delimiter: "/",
						disabled: true,
						folders: [
							{
								name: "With",
								flags: new Set(),
								path: "example/Label/With",
								subscribed: true,
								listed: true,
								delimiter: "/",
								disabled: true,
								folders: [
									{
										name: "Slashes",
										flags: new Set(),
										path: "example/Label/With/Slashes",
										subscribed: true,
										listed: true,
										delimiter: "/",
									},
								],
							},
						],
					},
				],
			},
			{
				name: "New",
				flags: new Set(),
				path: "New",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [
					{
						name: "Label",
						flags: new Set(),
						path: "New/Label",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [
							{
								name: "With",
								flags: new Set(),
								path: "New/Label/With",
								subscribed: true,
								listed: true,
								delimiter: "/",
								folders: [
									{
										name: "Slashes",
										flags: new Set(),
										path: "New/Label/With/Slashes",
										subscribed: true,
										listed: true,
										delimiter: "/",
									},
								],
							},
						],
					},
				],
			},
		]
		// We expect the following list tree response after filtering disabled mailboxes (corresponding to the labels with / in the name) and promoting children:
		const expected: ListTreeResponse[] = [
			{
				name: "INBOX",
				flags: new Set(),
				path: "INBOX",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Inbox",
				folders: [],
			},
			{
				name: "Starred",
				flags: new Set(),
				path: "[Gmail]/Starred",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Flagged",
				folders: [],
			},
			{
				name: "Sent Mail",
				flags: new Set(),
				path: "[Gmail]/Sent Mail",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Sent",
				folders: [],
			},
			{
				name: "Drafts",
				flags: new Set(),
				path: "[Gmail]/Drafts",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Drafts",
				folders: [],
			},
			{
				name: "All Mail",
				flags: new Set(),
				path: "[Gmail]/All Mail",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\All",
				folders: [],
			},
			{
				name: "Trash",
				flags: new Set(),
				path: "[Gmail]/Trash",
				subscribed: true,
				listed: true,
				delimiter: "/",
				specialUse: "\\Trash",
				folders: [],
			},
			{
				name: "[Gmail]/Important",
				flags: new Set(),
				path: "[Gmail]/Important",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [],
			},
			{
				name: "Cus/tom",
				flags: new Set(),
				path: "Cus/tom",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [
					{
						name: "Nested/Slash",
						flags: new Set(),
						path: "Cus/tom/Nested/Slash",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [
							{
								name: "DoubleNested",
								flags: new Set(),
								path: "Cus/tom/Nested/Slash/DoubleNested",
								subscribed: true,
								listed: true,
								delimiter: "/",
								folders: [],
							},
						],
					},
				],
			},
			{
				name: "Duplicated/Folder",
				flags: new Set(),
				path: "Duplicated/Folder",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [
					{
						name: "DuplicatedFolder",
						flags: new Set(),
						path: "Duplicated/Folder/DuplicatedFolder",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [],
					},
				],
			},
			{
				name: "example",
				flags: new Set(),
				path: "example",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [
					{
						name: "Label/With/Slashes",
						flags: new Set(),
						path: "example/Label/With/Slashes",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [],
					},
				],
			},
			{
				name: "New",
				flags: new Set(),
				path: "New",
				subscribed: true,
				listed: true,
				delimiter: "/",
				folders: [
					{
						name: "Label",
						flags: new Set(),
						path: "New/Label",
						subscribed: true,
						listed: true,
						delimiter: "/",
						folders: [
							{
								name: "With",
								flags: new Set(),
								path: "New/Label/With",
								subscribed: true,
								listed: true,
								delimiter: "/",
								folders: [
									{
										name: "Slashes",
										flags: new Set(),
										path: "New/Label/With/Slashes",
										subscribed: true,
										listed: true,
										delimiter: "/",
										folders: [],
									},
								],
							},
						],
					},
				],
			},
		]

		const result = session.filterDisabledAndPromoteChildren(input)

		o.check(result).deepEquals(expected)
	})

	o.test("onStartSyncSessionProcess - creates a new process and starts it", async () => {
		await session.startSync(imapSyncContext)
		const mailboxMock = object<MigrationSessionMailbox>()
		session.startMailboxSync(mailboxMock)
	})
})
