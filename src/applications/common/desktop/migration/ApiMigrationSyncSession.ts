import { MigrationCredentials, MigrationMailboxState } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationError, MigrationErrorCause } from "../../api/common/error/MigrationError.js"
import { MailboxMigrationFolderSyncStatus, MIGRATION_ERROR_POSTPONE_TIME } from "../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "./MigrationSyncEventListener.js"
import { MigrationSyncSession, ShutdownSyncAction, SyncSessionState } from "./MigrationSyncSession.js"
import { MigrationSessionMailbox, migrationMailboxFromSyncSessionMailbox } from "./MigrationSessionMailbox.js"
import { ProgrammingError } from "@tutao/app-env"

/**
 * Sync session for providers that are synced through an HTTP API (Microsoft Graph, Gmail API) instead of IMAP.
 *
 * The counterpart of ImapSyncSessionProcess is {@link runMailboxSync}, subclasses only implement the API specific parts:
 * the client, the mailboxes and the mails of a mailbox, and how the errors of the API are classified.
 */
export abstract class ApiMigrationSyncSession<TClient> extends MigrationSyncSession {
	// Short compared to ImapSyncSession, a postponed API sync is resumed by the periodic resync anyway.
	protected readonly mailboxFailurePostponeTime = 15 * 60 * 1000 // 15 minutes
	private client?: TClient

	protected constructor(migrationSyncEventListener: MigrationSyncEventListener) {
		super(migrationSyncEventListener)
	}

	protected abstract createClient(migrationCredentials: MigrationCredentials): Promise<TClient>

	/** Fetches the mailbox tree (roots) from the server. */
	protected abstract fetchMailboxes(client: TClient): Promise<MigrationMailbox[]>

	/** Downloads the mails of one mailbox. @return true if the whole mailbox was processed, false if it was interrupted because the session is not running anymore. */
	protected abstract syncMailbox(client: TClient, mailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean>

	protected abstract toMigrationError(e: unknown): MigrationError

	/** How long to postpone for if `e` is a throttling response, null for any other error. */
	protected abstract getRetryAfterMs(e: unknown): number | null

	async getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		try {
			const client = await this.createClient(migrationCredentials)
			return await this.fetchMailboxes(client)
		} catch (e) {
			console.log(e)
			throw this.toMigrationError(e)
		}
	}

	protected async fetchSyncMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		this.client = await this.createClient(migrationCredentials)
		return await this.fetchMailboxes(this.client)
	}

	protected async handleSetupError(error: unknown): Promise<MigrationError | null> {
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
			return null
		}

		await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, MIGRATION_ERROR_POSTPONE_TIME)
		return migrationError
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
}
