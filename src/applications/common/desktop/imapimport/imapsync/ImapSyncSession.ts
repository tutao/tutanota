import { imapMailboxFromSyncSessionMailbox, ImapSyncSessionMailbox, SyncSessionMailboxImportance } from "./ImapSyncSessionMailbox.js"
import { ImapCredentials, ImapSyncContext } from "../../../api/common/utils/imapImportUtils/ImapSyncContext.js"
import type { ImapSyncEventListener } from "./ImapSyncEventListener.js"
import { ImapSyncSessionProcess, SyncSessionProcessState } from "./ImapSyncSessionProcess.js"
import { ProgrammingError } from "@tutao/app-env"
import { ImapMailbox, imapMailboxFromImapFlowListTreeResponse } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapSyncConfig } from "./ImapSync.js"
import { ImapError, ImapErrorCause } from "../../../api/common/error/ImapError"
import type { ImapFlow } from "imapflow"
import type { ImapFlowOptions, ListTreeResponse } from "imapflow"
import { IMAP_ERROR_POSTPONE_TIME, ImapSyncEventType } from "../../../../../entities/tutanota/Utils"
import { assertNotNull, first, isEmpty, isNotEmpty } from "@tutao/utils"

const IMAP_RATE_LIMIT_POSTPONE_TIME: number = 25 * 60 * 60 * 1000 // 25 hours
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
		private imapSyncConfig: ImapSyncConfig,
		private imapFlowFactory: ImapFlowFactory = async (config) => {
			console.log("ImapFlowFactory", config)
			const { ImapFlow } = await import("./imapflow-custom.js")
			console.log("ImapFlowFactory", ImapFlow)
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

	private async shutDownSyncSession(shutdownSyncAction: ShutdownSyncAction, postponeDuration?: number) {
		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null

		if (shutdownSyncAction === ShutdownSyncAction.POSTPONE) {
			this.state = SyncSessionState.POSTPONED
			await this.imapSyncEventListener.onPostpone(Date.now() + assertNotNull(postponeDuration))
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

			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, IMAP_ERROR_POSTPONE_TIME)
			return new ImapError(error.response, ImapErrorCause.POSTPONE)
		}
	}

	private async startNextMailboxSync() {
		const remainingMailboxes = this.syncSessionMailboxes
			.filter((mailbox) => mailbox.importance !== SyncSessionMailboxImportance.NO_SYNC)
			.sort((a, b) => {
				if (a.failCount - b.failCount === 0) {
					return b.importance - a.importance
				} else {
					return a.failCount - b.failCount
				}
			})

		if (isEmpty(remainingMailboxes)) {
			await this.onAllMailboxesFinish()
			return
		}

		if (remainingMailboxes.every((syncSessionMailbox) => syncSessionMailbox.failCount >= MAX_MAILBOX_FAILURES_THRESHOLD)) {
			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, IMAP_RATE_LIMIT_POSTPONE_TIME)
			return
		}

		const nextMailbox = first(remainingMailboxes)

		if (nextMailbox) {
			this.startMailboxSync(nextMailbox)
		}
	}

	public async getImapMailboxesFromServer(imapCredentials: ImapCredentials): Promise<ReadonlyArray<ImapMailbox>> {
		console.log("getImapMailboxesFromServer", imapCredentials)
		try {
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
			console.log("getImapMailboxesFromServer", imapClient)
			return await this.getImapMailboxes(imapClient)
		} catch (error) {
			console.error("Error during sync", error, error?.serverResponseCode)
			return []
		}
	}

	/**
	 * This retrieves the mailboxes for a particular client connection
	 * @param imapClient A fully configured client instance.
	 * @private
	 */
	private async getImapMailboxes(imapClient: ImapFlow): Promise<Array<ImapMailbox>> {
		let listTreeResponse
		try {
			await imapClient.connect()
			listTreeResponse = await imapClient.listTree()
			console.log("listTreeResponse", listTreeResponse)
		} finally {
			await imapClient.logout()
		}
		const imapMailboxes = this.filterDisabledAndPromoteChildren(listTreeResponse.folders ?? []).map((listTreeResponse) => {
			return imapMailboxFromImapFlowListTreeResponse(listTreeResponse, null)
		})
		// Some providers, e.g. one.com, return a single folder (Inbox) with subfolders.
		// We want to flatten this to a single folder so that the user can map these folders to their own Tuta folders.
		if (imapMailboxes && imapMailboxes.length === 1 && isNotEmpty(assertNotNull(first(imapMailboxes)).subFolders ?? [])) {
			const inboxMailbox = assertNotNull(first(imapMailboxes))
			const remainingMailboxes = assertNotNull(first(imapMailboxes)).subFolders ?? []
			return [inboxMailbox, ...remainingMailboxes]
		}
		console.log("imapMailboxes", imapMailboxes)
		return imapMailboxes ?? []
	}

	/**
	 * Filters out disabled folders and promotes children folders, updating their names relative to the provided prefix.
	 * If a folder is disabled, its children are processed and included in the result with the same prefix.
	 * If a folder is not disabled, it is included in the result, and its children are processed with the folder's path as the new prefix.
	 * This is needed because GMail allows slashes (their delimiter) in the folder names but handles them weirdly internally.
	 * See the corresponding test in ImapSyncSessionTest for an example.
	 *
	 * @param {ListTreeResponse[]} folders - The list of folders to process, where each folder may have its own nested children.
	 * @param {string} [currentPrefix=""] - The path of the nearest non-disabled ancestor folder, used as a base for generating relative names.
	 * @return {ListTreeResponse[]} A new list of folders with updated names, excluding disabled folders but promoting their children.
	 */
	// Visible for testing
	filterDisabledAndPromoteChildren(folders: ListTreeResponse[], currentPrefix: string = ""): ListTreeResponse[] {
		const result: ListTreeResponse[] = []

		for (const folder of folders) {
			if (folder.disabled) {
				// Skip this folder, but process its children with the same prefix
				if (folder.folders && isNotEmpty(folder.folders)) {
					const promoted = this.filterDisabledAndPromoteChildren(folder.folders, currentPrefix)
					result.push(...promoted)
				}
			} else {
				// We keep it since it's not disabled, the new name is the relative path from currentPrefix to folder.path
				const folderPath = folder.path ?? ""
				let relativeName: string
				if (folder.specialUse) {
					relativeName = folder.name ?? ""
				} else if (currentPrefix) {
					// Remove prefix and delimiter from the start
					if (folderPath.startsWith(currentPrefix + folder.delimiter)) {
						relativeName = folderPath.substring(currentPrefix.length + 1) // +1 for delimiter
					} else {
						// Just use the name if the path doesn't start with the prefix
						relativeName = folder.name ?? ""
					}
				} else {
					relativeName = folderPath // use full path as name
				}
				// Create a copy and update the name
				const newFolder = { ...folder, name: relativeName }
				// Process children with this folder as the new prefix
				newFolder.folders = folder.folders && isNotEmpty(folder.folders) ? this.filterDisabledAndPromoteChildren(folder.folders, folderPath) : []
				result.push(newFolder)
			}
		}

		return result
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
			const parentMailbox = knownMailboxes.find((mailbox) => mailbox.mailboxState.path === imapMailbox.parentFolder?.path)
			const noSync = parentMailbox?.importance === SyncSessionMailboxImportance.NO_SYNC
			syncSessionMailbox = new ImapSyncSessionMailbox({ path: imapMailbox.path, importedUidToMailIdsMap: new Map(), noSync })
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
			if (!this.imapSyncContext) {
				throw new ProgrammingError("The imapSyncContext has not been set!")
			}

			const syncSessionProcess = new ImapSyncSessionProcess(syncSessionMailbox, this, this.imapSyncConfig, this.imapFlowFactory)

			this.runningSyncSessionProcess = syncSessionProcess

			syncSessionProcess.startSyncSessionProcess(this.imapSyncContext.imapCredentials, this.imapSyncEventListener).then((state) => {
				if (state === SyncSessionProcessState.CONNECTION_FAILED_REJECTED) {
					this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, IMAP_RATE_LIMIT_POSTPONE_TIME)
				} else if (state === SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN) {
					this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, IMAP_ERROR_POSTPONE_TIME)
				}
			})
		}
	}

	stopMailboxSync(syncSessionMailbox: ImapSyncSessionMailbox): void {
		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null
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
			syncSessionMailbox.failCount = syncSessionMailbox.failCount + 1
			this.syncSessionMailboxes[mailboxIndex] = syncSessionMailbox

			// start a new sync session process in replacement for the interrupted one
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
