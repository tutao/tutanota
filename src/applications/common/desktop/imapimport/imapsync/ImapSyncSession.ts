import { imapMailboxFromSyncSessionMailbox, ImapSyncSessionMailbox, SyncSessionMailboxImportance } from "./ImapSyncSessionMailbox.js"
import { ImapCredentials, ImapMailboxState, ImapSyncState } from "../../../api/common/utils/imapImportUtils/ImapSyncState.js"
import type { ImapSyncEventListener } from "./ImapSyncEventListener.js"
import { ImapSyncSessionProcess, SyncSessionProcessState } from "./ImapSyncSessionProcess.js"
import { ProgrammingError } from "@tutao/app-env"
import { ImapMailbox } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapSyncConfig } from "./ImapSync.js"
import { ImapError, ImapErrorCause } from "../../../api/common/utils/imapImportUtils/ImapError"
import type { ImapFlow } from "./imapflow-custom.js"
import { ImapFlowOptions } from "imapflow"
import { ImapSyncEventType } from "../../../../../entities/tutanota/Utils"
import { first, isEmpty } from "@tutao/utils"

const DOWNLOADED_QUOTA_SAFETY_THRESHOLD: number = 50000000 // in byte
const DEFAULT_POSTPONE_TIME: number = 24 * 60 * 60 * 1000 // 24 hours
const ERROR_POSTPONE_TIME: number = 60 * 1000 // 60 seconds

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

	onDownloadQuotaUpdate(syncSessionMailbox: ImapSyncSessionMailbox, downloadedQuota: number): void

	onAllMailboxesFinish(): Promise<void>
}

export class ImapSyncSession implements SyncSessionEventListener {
	// Visible for testing
	state: SyncSessionState
	private imapSyncState?: ImapSyncState
	private syncSessionMailboxes: ImapSyncSessionMailbox[] = []
	// Visible for testing
	runningSyncSessionProcess: ImapSyncSessionProcess | null = null
	private downloadedQuotas: number[] = []

	constructor(
		private adSyncEventListener: ImapSyncEventListener,
		private adSyncConfig: ImapSyncConfig,
		private imapFlowFactory: ImapFlowFactory = async (config) => {
			const { ImapFlow } = await import("./imapflow-custom.js")
			return new ImapFlow(config)
		},
	) {
		this.state = SyncSessionState.PAUSED
	}

	async startSyncSession(imapSyncState: ImapSyncState): Promise<ImapError | null> {
		if (this.state !== SyncSessionState.RUNNING) {
			this.state = SyncSessionState.RUNNING
			this.imapSyncState = imapSyncState
			this.runningSyncSessionProcess = null
			this.downloadedQuotas = []
			const runSyncResult = await this.runSyncSession()
			if (runSyncResult !== null) {
				this.state = SyncSessionState.PAUSED
				return runSyncResult
			}
		}
		return null
	}

	async stopSyncSession(): Promise<void> {
		await this.shutDownSyncSession(ShutdownSyncAction.MANUAL)
		return
	}

	private async shutDownSyncSession(shutdownSyncAction: ShutdownSyncAction, postponeDuration: number = DEFAULT_POSTPONE_TIME) {
		this.state = SyncSessionState.PAUSED

		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null

		if (shutdownSyncAction === ShutdownSyncAction.POSTPONE) {
			this.state = SyncSessionState.POSTPONED
			await this.adSyncEventListener.onPostpone(Date.now() + postponeDuration)
		} else if (shutdownSyncAction === ShutdownSyncAction.AUTH_FAIL) {
			// This should only happen now in case Auth is changed on imap server *after* being
			// configured or something expired.
			await this.adSyncEventListener.onError(new ImapError("Authentication failed, please check your password"))
		} else if (shutdownSyncAction === ShutdownSyncAction.UNKNOWN) {
			await this.adSyncEventListener.onError(new ImapError("An unknown error happened, while synchronizing IMAP mailbox"))
		}
	}

	private async runSyncSession(): Promise<ImapError | null> {
		const setupResult = await this.setupSyncSession()
		if (setupResult instanceof ImapError) {
			return setupResult as ImapError
		}
		this.syncSessionMailboxes = setupResult as ImapSyncSessionMailbox[]

		if (this.syncSessionMailboxes != null) {
			await this.startNextMailboxSync()
		}
		return null
	}

	private async setupSyncSession(): Promise<ImapSyncSessionMailbox[] | ImapError> {
		if (!this.imapSyncState) {
			throw new ProgrammingError("The ImapSyncState has not been set!")
		}

		const knownMailboxes = this.imapSyncState.imapMailboxStates.map((mailboxState) => {
			return new ImapSyncSessionMailbox(mailboxState)
		})

		const imapAccount = this.imapSyncState.imapAccount
		const imapClient = await this.imapFlowFactory({
			host: imapAccount.host,
			port: imapAccount.port,
			secure: imapAccount.port === 993,
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
			console.log("we are getting errors still, ", error)
			let syncAction = ShutdownSyncAction.UNKNOWN
			if (error?.serverResponseCode === "AUTHENTICATIONFAILED" || error.authenticationFailed) {
				return new ImapError(error, ImapErrorCause.AUTH_FAILED)
			} else {
				// For now any other error we are postponing...
				// TODO: Find which error cases are the valid ones for postponing.
				console.log("The error on postpone was: ", error)
				syncAction = ShutdownSyncAction.POSTPONE
			}
			await this.shutDownSyncSession(syncAction, ERROR_POSTPONE_TIME)
			return new ImapError(error)
		}
	}

	private async startNextMailboxSync() {
		const remainingMailboxes = this.syncSessionMailboxes.sort((a, b) => b.importance - a.importance)
		if (isEmpty(remainingMailboxes)) {
			await this.onAllMailboxesFinish()
		}

		const nextMailbox = remainingMailboxes.shift()
		if (nextMailbox) {
			this.startMailboxSync(nextMailbox)
		}
	}

	public async getImapMailboxesFromServer(imapAccount: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		const imapClient = await this.imapFlowFactory({
			host: imapAccount.host,
			port: imapAccount.port,
			secure: imapAccount.port === 993,
			auth: {
				user: imapAccount.username,
				pass: imapAccount.password,
				accessToken: imapAccount.tokenEndpointResponse?.access_token,
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

		return (
			listTreeResponse.folders
				?.filter((listTreeResponse) => !listTreeResponse.disabled)
				.map((listTreeResponse) => {
					return ImapMailbox.fromImapFlowListTreeResponse(listTreeResponse, null)
				}) ?? []
		)
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
				await this.adSyncEventListener.onMailbox(deletedImapMailbox, ImapSyncEventType.DELETE)
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
			await this.adSyncEventListener.onMailbox(imapMailbox, ImapSyncEventType.CREATE)
			syncSessionMailbox = new ImapSyncSessionMailbox(ImapMailboxState.fromImapMailbox(imapMailbox))
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

			if (!this.imapSyncState) {
				throw new ProgrammingError("The ImapSyncState has not been set!")
			}

			const syncSessionProcess = new ImapSyncSessionProcess(syncSessionMailbox, this, this.adSyncConfig, this.imapFlowFactory)

			this.runningSyncSessionProcess = syncSessionProcess

			syncSessionProcess.startSyncSessionProcess(this.imapSyncState.imapAccount, this.adSyncEventListener).then((state) => {
				if (state === SyncSessionProcessState.CONNECTION_FAILED_REJECTED) {
					this.forceStopSyncSessionProcess(syncSessionMailbox, true)
				} else if (state === SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN) {
					this.forceStopSyncSessionProcess(syncSessionMailbox, false)
				}
			})
		}
	}

	stopMailboxSync(syncSessionMailbox: ImapSyncSessionMailbox): void {
		console.log("stopSyncSessionProcess -> " + syncSessionMailbox.mailboxState.path)
		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null
	}

	async onDownloadQuotaUpdate(syncSessionMailbox: ImapSyncSessionMailbox, downloadedQuota: number): Promise<void> {
		this.downloadedQuotas.push(downloadedQuota)

		if (!this.imapSyncState) {
			throw new ProgrammingError("The ImapSyncState has not been set!")
		}

		const downloadedQuotaTotal = this.downloadedQuotas.reduce((quotaSum, quota) => quotaSum + quota, 0)
		if (downloadedQuotaTotal > this.imapSyncState.maxQuota - DOWNLOADED_QUOTA_SAFETY_THRESHOLD) {
			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE)
		}
	}

	onMailboxFinish(syncSessionMailbox: ImapSyncSessionMailbox): void {
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
		this.stopMailboxSync(syncSessionMailbox)

		const mailboxIndex = this.syncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path === syncSessionMailbox.mailboxState.path
		})

		if (mailboxIndex !== -1) {
			this.syncSessionMailboxes[mailboxIndex] = syncSessionMailbox

			// start a new sync session processes in replacement for the interrupted one
			this.startNextMailboxSync()
		}
	}

	forceStopSyncSessionProcess(syncSessionMailbox: ImapSyncSessionMailbox, isExceededRateLimit: boolean = false) {
		console.log("force stopping sync session process, isExceededRateLimit: " + isExceededRateLimit)
		this.stopMailboxSync(syncSessionMailbox)
	}

	async onAllMailboxesFinish(): Promise<void> {
		console.log("onAllMailboxesFinish")
		if (this.state !== SyncSessionState.FINISHED) {
			await this.shutDownSyncSession(ShutdownSyncAction.FINISHED)
			this.state = SyncSessionState.FINISHED

			const downloadedQuotaTotal = this.downloadedQuotas.reduce((quotaSum, quota) => quotaSum + quota, 0)
			await this.adSyncEventListener.onFinish(downloadedQuotaTotal)
		}
	}
}
