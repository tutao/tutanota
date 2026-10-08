import { MigrationCredentials, MigrationMailboxState } from "../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMailbox } from "../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationError, MigrationErrorCause } from "../../api/common/error/MigrationError.js"
import { MailboxMigrationFolderSyncStatus } from "../../../../entities/tutanota/Utils.js"
import type { MigrationSyncEventListener } from "./MigrationSyncEventListener.js"
import { MigrationSyncSession, ShutdownSyncAction, SyncSessionState } from "./MigrationSyncSession.js"
import { MigrationSessionMailbox, migrationMailboxFromSyncSessionMailbox } from "./MigrationSessionMailbox.js"
import { ProgrammingError } from "@tutao/app-env"

/**
 * Sync session for providers that are synced through an HTTP API (Microsoft Graph, Gmail API) instead of IMAP.
 *
 * The counterpart of ImapSyncSessionProcess is {@link runMailboxSync}, subclasses only implement the API specific parts.
 */
export abstract class ApiMigrationSyncSession<TApiClient> extends MigrationSyncSession {
	// Short compared to ImapSyncSession, a postponed API sync is resumed by the periodic resync anyway.
	protected readonly mailboxFailurePostponeTime = 15 * 60 * 1000 // 15 minutes
	private apiClient?: TApiClient

	protected constructor(migrationSyncEventListener: MigrationSyncEventListener) {
		super(migrationSyncEventListener)
	}

	protected abstract createClient(migrationCredentials: MigrationCredentials): Promise<TApiClient>

	protected abstract fetchMailboxes(client: TApiClient): Promise<MigrationMailbox[]>

	protected abstract syncMailbox(client: TApiClient, mailbox: MigrationMailbox, mailboxState: MigrationMailboxState): Promise<boolean>

	protected abstract toMigrationError(e: any): MigrationError

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
		this.apiClient = await this.createClient(migrationCredentials)
		return await this.fetchMailboxes(this.apiClient)
	}

	protected async handleSetupError(e: any): Promise<MigrationError | null> {
		console.error("Error during sync", e)
		const migrationError = this.toMigrationError(e)
		if (migrationError.data.cause === MigrationErrorCause.AUTH_FAILED) {
			await this.shutDownSyncSession(ShutdownSyncAction.AUTH_FAIL)
			return migrationError
		}

		await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, this.mailboxErrorPostponeTime)
		return migrationError
	}

	startMailboxSync(syncSessionMailbox: MigrationSessionMailbox): void {
		if (this.state === SyncSessionState.RUNNING) {
			if (!this.migrationSyncContext || this.apiClient === undefined) {
				throw new ProgrammingError("The migrationSyncContext has not been set!")
			}

			this.runMailboxSync(this.apiClient, syncSessionMailbox)
		}
	}

	/** The counterpart of ImapSyncSessionProcess. Not awaited by the session, results are reported through the listener and the SyncSessionEventListener methods. */
	private async runMailboxSync(client: TApiClient, syncSessionMailbox: MigrationSessionMailbox): Promise<void> {
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
			await this.migrationSyncEventListener.onError(migrationError)

			if (migrationError.data.cause === MigrationErrorCause.AUTH_FAILED) {
				// Access tokens expire (Google: after an hour) which a long import outlives. Postponing makes the importer continue
				// through the controller, where the failing authentication on startSync triggers the refresh-token flow.
				await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, this.mailboxAuthErrorPostponeTime)
				return
			} else {
				await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, this.mailboxErrorPostponeTime)
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
