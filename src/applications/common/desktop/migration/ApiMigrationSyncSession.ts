import { MigrationCredentials, MigrationMailboxState, MigrationSyncContext } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationError, MigrationErrorCause } from "../../api/common/error/MigrationError.js"
import { MailboxMigrationFolderSyncStatus, MIGRATION_ERROR_POSTPONE_TIME, MigrationSyncEventType } from "../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "./MigrationSyncEventListener.js"
import type { MigrationSync } from "./MigrationSync.js"
import { MigrationSessionMailbox, migrationMailboxFromSyncSessionMailbox, SyncSessionMailboxImportance } from "./MigrationSessionMailbox.js"
import { ShutdownSyncAction, SyncSessionEventListener, SyncSessionState } from "./imapsync/ImapSyncSession.js"
import { ProgrammingError } from "@tutao/app-env"
import { assertNotNull, first, isEmpty } from "@tutao/utils"

// Short compared to ImapSyncSession, a postponed API sync is resumed by the periodic resync anyway.
const MAILBOX_FAILURE_POSTPONE_TIME: number = 15 * 60 * 1000 // 15 minutes
const MAX_MAILBOX_FAILURES_THRESHOLD = 2

/**
 * Sync session for providers that are synced through an HTTP API (Microsoft Graph, Gmail API) instead of IMAP.
 *
 * It has the same structure and the same behaviour as ImapSyncSession: the session state, the mailbox traversal,
 * the ordering by importance and failures, retrying interrupted mailboxes and postponing when all of them keep failing.
 * The counterpart of ImapSyncSessionProcess is {@link runMailboxSync}, subclasses only implement the API specific parts.
 */
export abstract class ApiMigrationSyncSession<TClient> implements SyncSessionEventListener, MigrationSync {
	// Visible for testing
	state: SyncSessionState = SyncSessionState.NOT_STARTED
	private migrationSyncContext?: MigrationSyncContext
	private client?: TClient
	// Visible for testing
	syncSessionMailboxes: MigrationSessionMailbox[] = []
	private readonly migrationMailboxByPath = new Map<string, MigrationMailbox>()

	protected constructor(protected readonly migrationSyncEventListener: MigrationSyncEventListener) {}

	protected abstract createClient(migrationCredentials: MigrationCredentials): Promise<TClient>

	/** Fetches the mailbox tree (roots) from the server. */
	protected abstract fetchMailboxes(client: TClient): Promise<MigrationMailbox[]>

	/** Downloads the mails of one mailbox. @return true if the whole mailbox was processed, false if it was interrupted because the session is not running anymore. */
	protected abstract syncMailbox(client: TClient, mailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean>

	protected abstract toMigrationError(e: unknown): MigrationError

	/** How long to postpone for if `e` is a throttling response, null for any other error. */
	protected abstract getRetryAfterMs(e: unknown): number | null

	/** Subclasses may restrict which mailboxes have mails downloaded (e.g. Gmail only syncs "All Mail" like ImapSyncSession does). */
	protected selectSyncSessionMailboxes(syncSessionMailboxes: MigrationSessionMailbox[]): MigrationSessionMailbox[] {
		return syncSessionMailboxes
	}

	protected get stopped(): boolean {
		return this.state !== SyncSessionState.RUNNING
	}

	async startSync(migrationSyncContext: MigrationSyncContext): Promise<void> {
		if (this.state !== SyncSessionState.RUNNING) {
			this.state = SyncSessionState.RUNNING
			this.migrationSyncContext = migrationSyncContext

			return await this.runSyncSession()
		}
	}

	async stopSync(): Promise<void> {
		await this.shutDownSyncSession(ShutdownSyncAction.MANUAL)
	}

	private async shutDownSyncSession(shutdownSyncAction: ShutdownSyncAction, postponeDuration?: number) {
		if (shutdownSyncAction === ShutdownSyncAction.POSTPONE) {
			this.state = SyncSessionState.POSTPONED
			await this.migrationSyncEventListener.onPostpone(Date.now() + assertNotNull(postponeDuration))
		} else if (shutdownSyncAction === ShutdownSyncAction.FINISHED) {
			this.state = SyncSessionState.FINISHED
		} else {
			this.state = SyncSessionState.STOPPED
		}
	}

	private async runSyncSession(): Promise<void> {
		const setupResult = await this.setupSyncSession()
		if (setupResult instanceof MigrationError) {
			throw setupResult
		}

		if (this.state !== SyncSessionState.RUNNING) {
			// postponed during the setup
			return
		}

		this.syncSessionMailboxes = this.selectSyncSessionMailboxes(setupResult)

		this.startNextMailboxSync()
	}

	private async setupSyncSession(): Promise<MigrationSessionMailbox[] | MigrationError> {
		if (!this.migrationSyncContext) {
			throw new ProgrammingError("The migrationSyncContext has not been set!")
		}

		const knownMailboxes = this.migrationSyncContext.migrationMailboxStates.map((mailboxState) => {
			return new MigrationSessionMailbox(mailboxState)
		})

		try {
			this.client = await this.createClient(this.migrationSyncContext.migrationCredentials)

			const fetchedRootMailboxes = await this.fetchMailboxes(this.client)

			return await this.getSyncSessionMailboxes(knownMailboxes, fetchedRootMailboxes)
		} catch (error) {
			console.error("Error during sync", error)
			const migrationError = this.toMigrationError(error)
			if (migrationError.data.cause === MigrationErrorCause.AUTH_FAILED) {
				await this.shutDownSyncSession(ShutdownSyncAction.AUTH_FAIL)
				return migrationError
			}

			const retryAfterMs = this.getRetryAfterMs(error)
			if (retryAfterMs !== null) {
				// postponed for as long as the server asks for, there is nothing to report to the caller
				await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, retryAfterMs)
				return []
			}

			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, MIGRATION_ERROR_POSTPONE_TIME)
			return migrationError
		}
	}

	private startNextMailboxSync() {
		if (this.state === SyncSessionState.STOPPED) {
			return
		}

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
			this.onAllMailboxesFinish()
			return
		}

		if (remainingMailboxes.every((syncSessionMailbox) => syncSessionMailbox.failCount >= MAX_MAILBOX_FAILURES_THRESHOLD)) {
			this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, MAILBOX_FAILURE_POSTPONE_TIME)
			return
		}

		const nextMailbox = first(remainingMailboxes)

		if (nextMailbox) {
			this.startMailboxSync(nextMailbox)
		}
	}

	async getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		try {
			const client = await this.createClient(migrationCredentials)
			return await this.fetchMailboxes(client)
		} catch (e) {
			console.log(e)
			throw this.toMigrationError(e)
		}
	}

	private async getSyncSessionMailboxes(
		knownMailboxes: MigrationSessionMailbox[],
		fetchedRootMailboxes: MigrationMailbox[],
	): Promise<MigrationSessionMailbox[]> {
		const resultMailboxes: MigrationSessionMailbox[] = []
		const createdMailboxes: MigrationSessionMailbox[] = []
		for (const fetchedRootMailbox of fetchedRootMailboxes) {
			resultMailboxes.push(...(await this.traverseMailboxes(knownMailboxes, createdMailboxes, fetchedRootMailbox)))
		}

		for (const knownMailbox of knownMailboxes) {
			const index = resultMailboxes.findIndex((mailbox) => {
				return mailbox.mailboxState.path === knownMailbox.mailboxState.path
			})

			if (index === -1) {
				const deletedMailbox = migrationMailboxFromSyncSessionMailbox(knownMailbox)
				await this.migrationSyncEventListener.onMailbox(deletedMailbox, MigrationSyncEventType.DELETE)
			}
		}

		return resultMailboxes
	}

	private async traverseMailboxes(
		knownMailboxes: MigrationSessionMailbox[],
		createdMailboxes: MigrationSessionMailbox[],
		migrationMailbox: MigrationMailbox,
	): Promise<MigrationSessionMailbox[]> {
		const result: MigrationSessionMailbox[] = []

		let syncSessionMailbox = knownMailboxes.find((value) => value.mailboxState.path === migrationMailbox.path)
		if (syncSessionMailbox === undefined) {
			await this.migrationSyncEventListener.onMailbox(migrationMailbox, MigrationSyncEventType.CREATE)
			// children are traversed after their parent, so a parent that was just created is found as well
			const parentMailbox = [...knownMailboxes, ...createdMailboxes].find((mailbox) => mailbox.mailboxState.path === migrationMailbox.parentFolder?.path)
			const noSync = parentMailbox?.importance === SyncSessionMailboxImportance.NO_SYNC
			syncSessionMailbox = new MigrationSessionMailbox({
				path: migrationMailbox.path,
				importedSourceIdToMailIdsMap: new Map(),
				noSync,
			})
			createdMailboxes.push(syncSessionMailbox)
		}
		if (migrationMailbox.specialUse) {
			syncSessionMailbox.specialUse = migrationMailbox.specialUse
		}
		this.migrationMailboxByPath.set(migrationMailbox.path, migrationMailbox)

		// some settings lead to importance "NO_SYNC" which means that the mailbox should not be imported / migrated
		if (syncSessionMailbox.importance !== SyncSessionMailboxImportance.NO_SYNC) {
			result.push(syncSessionMailbox)
		}

		if (migrationMailbox.subFolders) {
			for (const subMailbox of migrationMailbox.subFolders) {
				result.push(...(await this.traverseMailboxes(knownMailboxes, createdMailboxes, subMailbox)))
			}
		}
		return result
	}

	startMailboxSync(syncSessionMailbox: MigrationSessionMailbox): void {
		if (this.state === SyncSessionState.RUNNING) {
			if (!this.migrationSyncContext || this.client === undefined) {
				throw new ProgrammingError("The migrationSyncContext has not been set!")
			}

			this.runMailboxSync(this.client, syncSessionMailbox)
		}
	}

	/** The counterpart of ImapSyncSessionProcess. Not awaited by the session, results are reported through the listener and the SyncSessionEventListener methods. */
	private async runMailboxSync(client: TClient, syncSessionMailbox: MigrationSessionMailbox): Promise<void> {
		const mailboxState = syncSessionMailbox.mailboxState
		const migrationMailbox = this.migrationMailboxByPath.get(mailboxState.path) ?? migrationMailboxFromSyncSessionMailbox(syncSessionMailbox)
		let isMailboxFinished = false

		try {
			await this.migrationSyncEventListener.onMailboxStatus({
				path: mailboxState.path,
				uidNext: 0,
				uidValidity: 1n,
				syncStatus: MailboxMigrationFolderSyncStatus.RUNNING,
			})

			isMailboxFinished = await this.syncMailbox(client, migrationMailbox, mailboxState)

			if (isMailboxFinished) {
				await this.migrationSyncEventListener.onMailboxStatus({
					path: mailboxState.path,
					uidNext: 0,
					uidValidity: 1n,
					syncStatus: MailboxMigrationFolderSyncStatus.FINISHED,
				})
			}
		} catch (e) {
			// we will retry later, see onMailboxInterrupted
			console.error(`Error while syncing mailbox ${mailboxState.path}`, e)
			const migrationError = this.toMigrationError(e)
			const retryAfterMs = this.getRetryAfterMs(e)
			if (retryAfterMs !== null) {
				// throttling applies to the whole account, not to a single mailbox
				await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, retryAfterMs)
				return
			}
			await this.migrationSyncEventListener.onError(migrationError)
			if (migrationError.data.cause === MigrationErrorCause.AUTH_FAILED) {
				// Access tokens expire (Google: after an hour) which a long import outlives. Postponing makes the importer continue
				// through the controller, where the failing authentication on startSync triggers the refresh-token flow.
				await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, MIGRATION_ERROR_POSTPONE_TIME)
				return
			}
		}

		if (isMailboxFinished) {
			this.onMailboxFinish(syncSessionMailbox)
		} else {
			this.onMailboxInterrupted(syncSessionMailbox)
		}
	}

	onMailboxFinish(syncSessionMailbox: MigrationSessionMailbox): void {
		const mailboxIndex = this.syncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path === syncSessionMailbox.mailboxState.path
		})
		if (mailboxIndex !== -1) {
			const isLastMailboxFinish = this.syncSessionMailboxes.length === 1
			this.syncSessionMailboxes.splice(mailboxIndex, 1)

			// call onAllMailboxesFinish() once download of all mailboxes is finished
			if (isLastMailboxFinish) {
				this.onAllMailboxesFinish()
			} else {
				// start a new mailbox sync in replacement for the finished one
				this.startNextMailboxSync()
			}
		}
	}

	onMailboxInterrupted(syncSessionMailbox: MigrationSessionMailbox): void {
		const mailboxIndex = this.syncSessionMailboxes.findIndex((mailbox) => {
			return mailbox.mailboxState.path === syncSessionMailbox.mailboxState.path
		})

		if (mailboxIndex !== -1) {
			syncSessionMailbox.failCount = syncSessionMailbox.failCount + 1
			this.syncSessionMailboxes[mailboxIndex] = syncSessionMailbox

			// start a new mailbox sync in replacement for the interrupted one
			this.startNextMailboxSync()
		}
	}

	async onAllMailboxesFinish(): Promise<void> {
		console.log("onAllMailboxesFinish")
		if (this.state !== SyncSessionState.FINISHED) {
			await this.shutDownSyncSession(ShutdownSyncAction.FINISHED)

			await this.migrationSyncEventListener.onFinish()
		}
	}
}
