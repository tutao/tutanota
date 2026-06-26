import { imapMailboxFromSyncSessionMailbox, ImapSyncSessionMailbox, SyncSessionMailboxImportance } from "./ImapSyncSessionMailbox.js"
import { ImapCredentials, ImapSyncContext } from "../../../api/common/utils/imapImportUtils/ImapSyncContext.js"
import type { ImapSyncEventListener } from "./ImapSyncEventListener.js"
import { ImapSyncSessionProcess, SyncSessionProcessState } from "./ImapSyncSessionProcess.js"
import { ProgrammingError } from "@tutao/app-env"
import { ImapMailbox, imapMailboxFromImapFlowListTreeResponse } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapSyncConfig } from "./ImapSync.js"
import { ImapError, ImapErrorCause } from "../../../api/common/error/ImapError"
import type { ImapFlow } from "./imapflow-custom.js"
import { ImapFlowOptions } from "imapflow"
import { ImapSyncEventType } from "../../../../../entities/tutanota/Utils"
import { assertNotNull, first, isEmpty, isNotEmpty } from "@tutao/utils"

const DEFAULT_POSTPONE_TIME: number = 25 * 60 * 60 * 1000 // 25 hours
const ERROR_POSTPONE_TIME: number = 60 * 1000 // 60 seconds
const MAX_MAILBOX_FAILURES_THRESHOLD = 2

export enum SyncSessionState {
	RUNNING,
	PAUSED,
	POSTPONED,
	FINISHED,
}

export enum ShutdownSyncAction {
	MANUAL,
	FINISHED,
	POSTPONE,
	AUTH_FAIL,
	UNKNOWN,
}

export type ImapFlowFactory = (config: ImapFlowOptions) => Promise<ImapFlow>

export interface SyncSessionEventListener {
	startMailboxSync(syncSessionMailbox: ImapSyncSessionMailbox): void

	stopMailboxSync(syncSessionMailbox: ImapSyncSessionMailbox): void

	onMailboxFinish(syncSessionMailbox: ImapSyncSessionMailbox): void

	onMailboxInterrupted(syncSessionMailbox: ImapSyncSessionMailbox): void

	onAllMailboxesFinish(): Promise<void>
}

export class ImapSyncSession implements SyncSessionEventListener {
	// Visible for testing
	state: SyncSessionState
	private imapSyncContext?: ImapSyncContext
	// Visible for testing
	syncSessionMailboxes: ImapSyncSessionMailbox[] = []
	// Visible for testing
	runningSyncSessionProcess: ImapSyncSessionProcess | null = null

	constructor(
		private imapSyncEventListener: ImapSyncEventListener,
		private adSyncConfig: ImapSyncConfig,
		private imapFlowFactory: ImapFlowFactory = async (config) => {
			const { ImapFlow } = await import("./imapflow-custom.js")
			return new ImapFlow(config)
		},
	) {
		this.state = SyncSessionState.PAUSED
	}

	async startSyncSession(imapSyncContext: ImapSyncContext): Promise<void> {
		if (this.state !== SyncSessionState.RUNNING) {
			this.state = SyncSessionState.RUNNING
			this.imapSyncContext = imapSyncContext
			this.runningSyncSessionProcess = null

			return await this.runSyncSession()
		}
	}

	async stopSyncSession(): Promise<void> {
		await this.shutDownSyncSession(ShutdownSyncAction.MANUAL)
		return
	}

	private async shutDownSyncSession(shutdownSyncAction: ShutdownSyncAction, postponeDuration: number = DEFAULT_POSTPONE_TIME) {
		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null

		if (shutdownSyncAction === ShutdownSyncAction.POSTPONE) {
			this.state = SyncSessionState.POSTPONED
			await this.imapSyncEventListener.onPostpone(Date.now() + postponeDuration)
		} else if (shutdownSyncAction === ShutdownSyncAction.FINISHED) {
			this.state = SyncSessionState.FINISHED
		} else {
			this.state = SyncSessionState.PAUSED
		}
	}

	private async runSyncSession(): Promise<void> {
		const setupResult = await this.setupSyncSession()
		if (setupResult instanceof ImapError) {
			throw setupResult
		}
		this.syncSessionMailboxes = setupResult as ImapSyncSessionMailbox[]

		if (this.syncSessionMailboxes != null) {
			this.startNextMailboxSync()
		}
	}

	private async setupSyncSession(): Promise<ImapSyncSessionMailbox[] | ImapError> {
		if (!this.imapSyncContext) {
			throw new ProgrammingError("The imapSyncContext has not been set!")
		}

		const knownMailboxes = this.imapSyncContext.imapMailboxStates.map((mailboxState) => {
			return new ImapSyncSessionMailbox(mailboxState)
		})

		const imapAccount = this.imapSyncContext.imapCredentials
		const imapClient = await this.imapFlowFactory({
			host: imapAccount.host,
			port: imapAccount.port,
			secure: imapAccount.host !== "localhost",
			auth: {
				// We can safely pass password and accessToken because ImapFlow tests for token accessToken being truthy
				// using it instead of password (https://github.com/postalsys/imapflow/blob/b7e57f0e540c789f3b1cb17112edbce2b2085880/lib/imap-flow.js#L1269)
				user: imapAccount.username,
				pass: imapAccount.password,
				accessToken: imapAccount.tokenEndpointResponse?.access_token,
			},
		})

		try {
			const fetchedRootMailboxes = await this.getImapMailboxes(imapClient)

			return await this.getSyncSessionMailboxes(knownMailboxes, fetchedRootMailboxes)
		} catch (error) {
			console.error("Error during sync", error, error?.serverResponseCode)
			if (error.authenticationFailed || error?.serverResponseCode === "AUTHENTICATIONFAILED") {
				await this.shutDownSyncSession(ShutdownSyncAction.AUTH_FAIL)
				return new ImapError(error.response, ImapErrorCause.AUTH_FAILED)
			}

			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, ERROR_POSTPONE_TIME)
			return new ImapError(error.response, ImapErrorCause.POSTPONE)
		}
	}

	private async startNextMailboxSync() {
		const remainingMailboxes = this.syncSessionMailboxes.sort((a, b) => {
			if (a.failCount - b.failCount === 0) {
				return b.importance - a.importance
			} else {
				return a.failCount - b.failCount
			}
		})

		console.log("startNextMailboxSync, #remaining mailboxes -> ", remainingMailboxes.length)

		if (isEmpty(remainingMailboxes)) {
			await this.onAllMailboxesFinish()
			return
		}

		if (remainingMailboxes.every((syncSessionMailbox) => syncSessionMailbox.failCount >= MAX_MAILBOX_FAILURES_THRESHOLD)) {
			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE)
			return
		}

		const nextMailbox = first(remainingMailboxes)

		console.log("startNextMailboxSync, next mailbox -> ", nextMailbox?.mailboxState.path)
		if (nextMailbox) {
			this.startMailboxSync(nextMailbox)
		}
	}

	public async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		const imapClient = await this.imapFlowFactory({
			host: imapCredentials.host,
			port: imapCredentials.port,
			secure: imapCredentials.host !== "localhost",
			auth: {
				user: imapCredentials.username,
				pass: imapCredentials.password,
				accessToken: imapCredentials.tokenEndpointResponse?.access_token,
			},
		})

		return await this.getImapMailboxes(imapClient)
	}

	/**
	 * This retrieves the mailboxes for a particular client connection
	 * @param imapClient A fully configured client instance.
	 * @private
	 */
	private async getImapMailboxes(imapClient: ImapFlow): Promise<Array<ImapMailbox>> {
		await imapClient.connect()
		const listTreeResponse = await imapClient.listTree()
		await imapClient.logout()

		const imapMailboxes = listTreeResponse.folders
			?.filter((listTreeResponse) => !listTreeResponse.disabled)
			.map((listTreeResponse) => {
				return imapMailboxFromImapFlowListTreeResponse(listTreeResponse, null)
			})
		// Some providers, e.g. one.com, return a single folder (Inbox) with subfolders.
		// We want to flatten this to a single folder so that the user can map these folders to their own Tuta folders.
		if (imapMailboxes && imapMailboxes.length === 1 && isNotEmpty(assertNotNull(first(imapMailboxes)).subFolders ?? [])) {
			const inboxMailbox = assertNotNull(first(imapMailboxes))
			const remainingMailboxes = assertNotNull(first(imapMailboxes)).subFolders ?? []
			return [inboxMailbox, ...remainingMailboxes]
		}
		return imapMailboxes ?? []
	}

	private async getSyncSessionMailboxes(knownMailboxes: ImapSyncSessionMailbox[], fetchedRootMailboxes: ImapMailbox[]): Promise<ImapSyncSessionMailbox[]> {
		const resultMailboxes: ImapSyncSessionMailbox[] = []
		for (const fetchedRootMailbox of fetchedRootMailboxes) {
			resultMailboxes.push(...(await this.traverseImapMailboxes(knownMailboxes, fetchedRootMailbox)))
		}

		knownMailboxes.map(async (knownMailbox) => {
			const index = resultMailboxes.findIndex((mailbox) => {
				return mailbox.mailboxState.path === knownMailbox.mailboxState.path
			})

			if (index === -1) {
				const deletedImapMailbox = imapMailboxFromSyncSessionMailbox(knownMailbox)
				await this.imapSyncEventListener.onMailbox(deletedImapMailbox, ImapSyncEventType.DELETE)
				return true
			}

			return false
		})

		return resultMailboxes
	}

	private async traverseImapMailboxes(knownMailboxes: ImapSyncSessionMailbox[], imapMailbox: ImapMailbox): Promise<ImapSyncSessionMailbox[]> {
		const result: ImapSyncSessionMailbox[] = []

		let syncSessionMailbox = knownMailboxes.find((value) => value.mailboxState.path === imapMailbox.path)
		if (syncSessionMailbox === undefined) {
			await this.imapSyncEventListener.onMailbox(imapMailbox, ImapSyncEventType.CREATE)
			syncSessionMailbox = new ImapSyncSessionMailbox({ path: imapMailbox.path, importedUidToMailIdsMap: new Map(), noSync: false })
		}

		if (imapMailbox.specialUse) {
			syncSessionMailbox.specialUse = imapMailbox.specialUse
		}

		// some settings lead to importance "NO_SYNC" which means that the mailbox should not be imported / migrated
		if (syncSessionMailbox.importance !== SyncSessionMailboxImportance.NO_SYNC) {
			result.push(syncSessionMailbox)
		}

		if (imapMailbox.subFolders) {
			for (const imapMailbox1 of imapMailbox.subFolders) {
				result.push(...(await this.traverseImapMailboxes(knownMailboxes, imapMailbox1)))
			}
		}
		return result
	}

	startMailboxSync(syncSessionMailbox: ImapSyncSessionMailbox): void {
		if (this.state === SyncSessionState.RUNNING) {
			console.log("startMailboxSync -> " + syncSessionMailbox.mailboxState.path)

			if (!this.imapSyncContext) {
				throw new ProgrammingError("The imapSyncContext has not been set!")
			}

			const syncSessionProcess = new ImapSyncSessionProcess(syncSessionMailbox, this, this.adSyncConfig, this.imapFlowFactory)

			this.runningSyncSessionProcess = syncSessionProcess

			syncSessionProcess.startSyncSessionProcess(this.imapSyncContext.imapCredentials, this.imapSyncEventListener).then((state) => {
				if (state === SyncSessionProcessState.CONNECTION_FAILED_REJECTED) {
					this.shutDownSyncSession(ShutdownSyncAction.POSTPONE)
				} else if (state === SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN) {
					this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, ERROR_POSTPONE_TIME)
				}
			})
		}
	}

	stopMailboxSync(syncSessionMailbox: ImapSyncSessionMailbox): void {
		console.log("stopSyncSessionProcess -> " + syncSessionMailbox.mailboxState.path)
		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null
	}

	onMailboxFinish(syncSessionMailbox: ImapSyncSessionMailbox): void {
		console.log("onMailboxFinish -> " + syncSessionMailbox.mailboxState.path)
		this.stopMailboxSync(syncSessionMailbox)

		const mailboxIndex = this.syncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path === syncSessionMailbox.mailboxState.path
		})
		if (mailboxIndex !== -1) {
			const isLastMailboxFinish = this.syncSessionMailboxes.length === 1
			this.syncSessionMailboxes.splice(mailboxIndex, 1)

			// call onAllMailboxesFinish() once download of all IMAP folders is finished
			if (isLastMailboxFinish) {
				this.onAllMailboxesFinish()
			} else {
				// start a new sync session processes in replacement for the finished one
				this.startNextMailboxSync()
			}
		}
	}

	onMailboxInterrupted(syncSessionMailbox: ImapSyncSessionMailbox): void {
		console.log("onMailboxInterrupted -> " + syncSessionMailbox.mailboxState.path)
		this.stopMailboxSync(syncSessionMailbox)

		const mailboxIndex = this.syncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path === syncSessionMailbox.mailboxState.path
		})

		if (mailboxIndex !== -1) {
			syncSessionMailbox.failCount = syncSessionMailbox.failCount + 1
			this.syncSessionMailboxes[mailboxIndex] = syncSessionMailbox

			// start a new sync session processes in replacement for the interrupted one
			this.startNextMailboxSync()
		}
	}

	async onAllMailboxesFinish(): Promise<void> {
		console.log("onAllMailboxesFinish")
		if (this.state !== SyncSessionState.FINISHED) {
			await this.shutDownSyncSession(ShutdownSyncAction.FINISHED)

			await this.imapSyncEventListener.onFinish()
		}
	}
}
