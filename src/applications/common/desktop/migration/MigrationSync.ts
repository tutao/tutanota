import { MigrationCredentials, MigrationSyncContext } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationError } from "../../api/common/error/MigrationError.js"
import { MigrationSyncEventType } from "../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "./MigrationSyncEventListener.js"
import { MigrationSessionMailbox, migrationMailboxFromSyncSessionMailbox, SyncSessionMailboxImportance } from "./MigrationSessionMailbox.js"
import { ProgrammingError } from "@tutao/app-env"
import { assertNotNull, first, isEmpty } from "@tutao/utils"

const MAX_MAILBOX_FAILURES_THRESHOLD = 2

export enum SyncSessionState {
	NOT_STARTED,
	RUNNING,
	POSTPONED,
	FINISHED,
	STOPPED,
}

export enum ShutdownSyncAction {
	MANUAL,
	FINISHED,
	POSTPONE,
	AUTH_FAIL,
	UNKNOWN,
}

export interface SyncSessionEventListener {
	startMailboxSync(syncSessionMailbox: MigrationSessionMailbox): void

	onMailboxFinish(syncSessionMailbox: MigrationSessionMailbox): void

	onMailboxInterrupted(syncSessionMailbox: MigrationSessionMailbox): void

	onAllMailboxesFinish(): Promise<void>
}

/**
 * A one-way sync of a mailbox from another provider, started by the DesktopMigrationSyncSystemFacade.
 *
 * It holds what is the same for all providers: the session state, the traversal of the mailboxes of the provider (announcing new and deleted
 * ones), the order in which the mailboxes are synced (by importance and failures), retrying interrupted mailboxes and postponing when all of
 * them keep failing. The subclasses fetch the mailboxes of their provider and sync the mails of one mailbox:
 * - ImapSyncSession for IMAP, with an ImapSyncSessionProcess per mailbox,
 * - ApiMigrationSyncSession for the providers that are synced through an HTTP API (Gmail API, Microsoft Graph).
 */
export abstract class MigrationSync implements SyncSessionEventListener {
	// Visible for testing
	state: SyncSessionState = SyncSessionState.NOT_STARTED
	protected migrationSyncContext?: MigrationSyncContext
	// Visible for testing
	syncSessionMailboxes: MigrationSessionMailbox[] = []
	protected readonly migrationMailboxByPath = new Map<string, MigrationMailbox>()

	protected constructor(protected readonly migrationSyncEventListener: MigrationSyncEventListener) {}

	/** How long to postpone the session for when all the remaining mailboxes failed repeatedly. */
	protected abstract readonly mailboxFailurePostponeTime: number

	/** @return the mailboxes of the provider for the migration wizard, throws a MigrationError if they cannot be fetched */
	abstract getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]>

	/** Fetches the mailbox tree (roots) for a sync. Errors are passed to {@link handleSetupError}. */
	protected abstract fetchSyncMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]>

	/**
	 * Called when fetching the mailboxes for a sync failed, it shuts the session down accordingly.
	 * @return the error to throw to the caller of startSync, null if the session was postponed and there is nothing to report
	 */
	protected abstract handleSetupError(error: unknown): Promise<MigrationError | null>

	abstract startMailboxSync(syncSessionMailbox: MigrationSessionMailbox): void

	/** Stops what is syncing a mailbox at the moment, if the subclass runs something that has to be stopped explicitly. */
	protected stopRunningSyncProcess(): void {}

	/** Subclasses may restrict which of the mailboxes have mails downloaded (e.g. only the "All mail" mailbox of Gmail). */
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
			this.stopRunningSyncProcess()

			return await this.runSyncSession()
		}
	}

	async stopSync(): Promise<void> {
		await this.shutDownSyncSession(ShutdownSyncAction.MANUAL)
	}

	protected async shutDownSyncSession(shutdownSyncAction: ShutdownSyncAction, postponeDuration?: number) {
		this.stopRunningSyncProcess()

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

		if (setupResult === null || this.state !== SyncSessionState.RUNNING) {
			// postponed or stopped during the setup
			return
		}

		this.syncSessionMailboxes = this.selectSyncSessionMailboxes(setupResult)

		this.startNextMailboxSync()
	}

	private async setupSyncSession(): Promise<MigrationSessionMailbox[] | MigrationError | null> {
		const migrationSyncContext = this.migrationSyncContext
		if (!migrationSyncContext) {
			throw new ProgrammingError("The migrationSyncContext has not been set!")
		}

		const knownMailboxes = migrationSyncContext.migrationMailboxStates.map((mailboxState) => {
			return new MigrationSessionMailbox(mailboxState)
		})

		try {
			const fetchedRootMailboxes = await this.fetchSyncMailboxes(migrationSyncContext.migrationCredentials)

			return await this.getSyncSessionMailboxes(knownMailboxes, fetchedRootMailboxes)
		} catch (error) {
			return await this.handleSetupError(error)
		}
	}

	private async startNextMailboxSync() {
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
			await this.onAllMailboxesFinish()
			return
		}

		if (remainingMailboxes.every((syncSessionMailbox) => syncSessionMailbox.failCount >= MAX_MAILBOX_FAILURES_THRESHOLD)) {
			await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, this.mailboxFailurePostponeTime)
			return
		}

		const nextMailbox = first(remainingMailboxes)

		if (nextMailbox) {
			this.startMailboxSync(nextMailbox)
		}
	}

	private async getSyncSessionMailboxes(
		knownMailboxes: MigrationSessionMailbox[],
		fetchedRootMailboxes: MigrationMailbox[],
	): Promise<MigrationSessionMailbox[]> {
		const resultMailboxes: MigrationSessionMailbox[] = []
		for (const fetchedRootMailbox of fetchedRootMailboxes) {
			resultMailboxes.push(...(await this.traverseMigrationMailboxes(knownMailboxes, fetchedRootMailbox)))
		}

		for (const knownMailbox of knownMailboxes) {
			const index = resultMailboxes.findIndex((mailbox) => {
				return mailbox.mailboxState.path === knownMailbox.mailboxState.path
			})

			if (index === -1) {
				const deletedMigrationMailbox = migrationMailboxFromSyncSessionMailbox(knownMailbox)
				await this.migrationSyncEventListener.onMailbox(deletedMigrationMailbox, MigrationSyncEventType.DELETE)
			}
		}

		return resultMailboxes
	}

	private async traverseMigrationMailboxes(
		knownMailboxes: MigrationSessionMailbox[],
		migrationMailbox: MigrationMailbox,
	): Promise<MigrationSessionMailbox[]> {
		const result: MigrationSessionMailbox[] = []

		let syncSessionMailbox = knownMailboxes.find((value) => value.mailboxState.path === migrationMailbox.path)
		if (syncSessionMailbox === undefined) {
			await this.migrationSyncEventListener.onMailbox(migrationMailbox, MigrationSyncEventType.CREATE)
			const parentMailbox = knownMailboxes.find((mailbox) => mailbox.mailboxState.path === migrationMailbox.parentFolder?.path)
			const noSync = parentMailbox?.importance === SyncSessionMailboxImportance.NO_SYNC
			syncSessionMailbox = new MigrationSessionMailbox({
				path: migrationMailbox.path,
				importedSourceIdToMailIdsMap: new Map(),
				noSync,
			})
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
			for (const subFolder of migrationMailbox.subFolders) {
				result.push(...(await this.traverseMigrationMailboxes(knownMailboxes, subFolder)))
			}
		}
		return result
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
