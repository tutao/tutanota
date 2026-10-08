import { MigrationSessionMailbox } from "../MigrationSessionMailbox.js"
import { MigrationCredentials } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { ImapSyncSessionProcess, SyncSessionProcessState } from "./ImapSyncSessionProcess.js"
import { ProgrammingError } from "@tutao/app-env"
import {
	MigrationMailbox,
	migrationMailboxFromImapFlowListTreeResponse,
	MigrationMailboxSpecialUse,
} from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { MigrationSyncSession, ShutdownSyncAction, SyncSessionState } from "../MigrationSyncSession.js"
import { fromImapFlowError, MigrationError, MigrationErrorCause } from "../../../api/common/error/MigrationError"
import type { ImapFlow, ImapFlowOptions, ListTreeResponse } from "imapflow"
import { MIGRATION_ERROR_POSTPONE_TIME, MigrationSyncEventType } from "../../../../../entities/tutanota/Utils"
import { assertNotNull, first, isEmpty, isNotEmpty, noOp, utf8Uint8ArrayToString } from "@tutao/utils"
import { CertificateProvider } from "../../CertificateProvider"
import { MailboxMigrationProvider } from "../../../api/common/utils/migrationImportUtils/MigrationKnownConfigs"

const IMAP_RATE_LIMIT_POSTPONE_TIME: number = 25 * 60 * 60 * 1000 // 25 hours

const defaultImapSyncConfig: ImapSyncConfig = {
	emitMigrationSyncEventTypes: new Set<MigrationSyncEventType>([MigrationSyncEventType.CREATE]),
	isEnableImapQresync: false,
}

export interface ImapSyncConfig {
	emitMigrationSyncEventTypes: Set<MigrationSyncEventType>
	isEnableImapQresync: boolean
}

export type ImapFlowFactory = (imapCredentials: MigrationCredentials, imapSyncConfig: ImapSyncConfig, verifyOnly?: boolean) => Promise<ImapFlow>

export class ImapSyncSession extends MigrationSyncSession {
	protected readonly mailboxFailurePostponeTime = IMAP_RATE_LIMIT_POSTPONE_TIME
	// Visible for testing
	runningSyncSessionProcess: ImapSyncSessionProcess | null = null

	constructor(
		migrationSyncEventListener: MigrationSyncEventListener,
		private certificateProvider: CertificateProvider,
		private imapSyncConfig: ImapSyncConfig,
		private imapFlowFactory: ImapFlowFactory = async (imapCredentials, imapSyncConfig, verifyOnly?: boolean) => {
			const { ImapFlow } = await import("./imapflow-custom")

			const systemCertificates = await this.certificateProvider.getCertificates()
			const customCertificateData = imapCredentials.customCertificateData
			const customCertificate = customCertificateData !== null ? [utf8Uint8ArrayToString(customCertificateData)] : []
			const options: ImapFlowOptions = {
				host: imapCredentials.host,
				port: imapCredentials.port,
				auth: {
					// We can safely pass password and accessToken because ImapFlow tests for token accessToken being truthy
					// using it instead of password (https://github.com/postalsys/imapflow/blob/b7e57f0e540c789f3b1cb17112edbce2b2085880/lib/imap-flow.js#L1269)
					user: imapCredentials.username,
					pass: imapCredentials.password,
					accessToken: imapCredentials.tokenEndpointResponse?.access_token,
				},
				tls: {
					rejectUnauthorized: !imapCredentials.ignoreCertificateErrors,
					ca: [...systemCertificates, ...customCertificate],
				},
				qresync: imapSyncConfig.isEnableImapQresync,
				logger: {
					warn: console.warn,
					error: console.error,
					debug: noOp,
					info: noOp,
				},
				verifyOnly: verifyOnly ?? false,
			}
			if (imapCredentials.useSSL) {
				options.secure = imapCredentials.useSSL
			}
			return new ImapFlow(options)
		},
	) {
		super(migrationSyncEventListener)
	}

	protected stopRunningSyncProcess() {
		this.runningSyncSessionProcess?.stopSyncSessionProcess()
		this.runningSyncSessionProcess = null
	}

	protected selectSyncSessionMailboxes(syncSessionMailboxes: MigrationSessionMailbox[]): MigrationSessionMailbox[] {
		if (this.migrationSyncContext?.isGmail) {
			const allMailMailboxes = syncSessionMailboxes.filter((mailbox) => mailbox.specialUse === MigrationMailboxSpecialUse.ALL)
			if (isEmpty(allMailMailboxes)) {
				throw new MigrationError("All mails Gmail mailbox is not enabled for IMAP", MigrationErrorCause.GMAIL_ALL_MAILS_IMAP_DISABLED)
			}
			return allMailMailboxes
		}
		return syncSessionMailboxes
	}

	protected async fetchSyncMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		const imapClient = await this.imapFlowFactory(migrationCredentials, this.imapSyncConfig)
		return await this.getMailboxesFromServer(imapClient)
	}

	protected async handleSetupError(error: any): Promise<MigrationError> {
		console.error("Error during sync", error, error?.serverResponseCode)
		if (error.authenticationFailed || error?.serverResponseCode === "AUTHENTICATIONFAILED") {
			if (error.serverResponseCode !== "LIMIT") {
				await this.shutDownSyncSession(ShutdownSyncAction.AUTH_FAIL)
				return new MigrationError(error.response, MigrationErrorCause.AUTH_FAILED)
			}
		}

		await this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, MIGRATION_ERROR_POSTPONE_TIME)
		return fromImapFlowError(error)
	}

	public async getMigrationMailboxes(migrationCredentials: MigrationCredentials): Promise<MigrationMailbox[]> {
		try {
			await this.verifyImapConnection(migrationCredentials)

			const imapClient = await this.imapFlowFactory(migrationCredentials, this.imapSyncConfig)
			imapClient.on("error", (entry) => {
				console.log(`[${entry.name}] ${entry.message}, ${entry.cause}`)
			})

			const migrationMailboxes = await this.getMailboxesFromServer(imapClient)

			const isGmail = migrationCredentials.provider === MailboxMigrationProvider.Gmail
			if (isGmail && !migrationMailboxes.some((mailbox) => mailbox.specialUse === MigrationMailboxSpecialUse.ALL)) {
				throw new MigrationError("All mails Gmail mailbox is not enabled for IMAP", MigrationErrorCause.GMAIL_ALL_MAILS_IMAP_DISABLED)
			}
			return migrationMailboxes
		} catch (e) {
			if (e instanceof MigrationError) {
				throw e
			}
			console.log(e)
			const errorList = e.errors ?? [e]
			const firstError = first(errorList)
			if (firstError) {
				throw fromImapFlowError(firstError)
			} else {
				throw new MigrationError("initial connection failed", MigrationErrorCause.INITIAL_CONNECT_FAILED)
			}
		}
	}

	private async verifyImapConnection(migrationCredentials: MigrationCredentials) {
		const connectionWorksImapClient = await this.imapFlowFactory(migrationCredentials, this.imapSyncConfig, true)
		connectionWorksImapClient.on("error", (entry) => {
			console.log(`[${entry.name}] ${entry.message}, ${entry.cause}`)
		})
		await connectionWorksImapClient.connect()
	}

	/**
	 * This retrieves the mailboxes for a particular client connection
	 * @param imapClient A fully configured client instance.
	 * @private
	 */
	private async getMailboxesFromServer(imapClient: ImapFlow): Promise<Array<MigrationMailbox>> {
		let listTreeResponse
		try {
			await imapClient.connect()
			listTreeResponse = await imapClient.listTree()
		} finally {
			try {
				await imapClient.logout()
			} catch (e) {
				// Ignore failures to logout, this just means we already have logged out.
			}
		}

		if (listTreeResponse) {
			const migrationMailboxes = this.filterDisabledAndPromoteChildren(listTreeResponse.folders ?? [])
				.filter((folder) => (folder.specialUse || folder.subscribed) ?? true)
				.map((listTreeResponse) => {
					return migrationMailboxFromImapFlowListTreeResponse(listTreeResponse, null)
				})
			// Some providers, e.g. one.com, return a single folder (Inbox) with subfolders.
			// We want to flatten this to a single folder so that the user can map these folders to their own Tuta folders.
			if (migrationMailboxes && migrationMailboxes.length === 1 && isNotEmpty(assertNotNull(first(migrationMailboxes)).subFolders ?? [])) {
				const inboxMailbox = assertNotNull(first(migrationMailboxes))
				const remainingMailboxes = assertNotNull(first(migrationMailboxes)).subFolders ?? []
				return [inboxMailbox, ...remainingMailboxes]
			}
			return migrationMailboxes ?? []
		}
		return []
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

	startMailboxSync(syncSessionMailbox: MigrationSessionMailbox): void {
		if (this.state === SyncSessionState.RUNNING) {
			if (!this.migrationSyncContext) {
				throw new ProgrammingError("The migrationSyncContext has not been set!")
			}

			this.runningSyncSessionProcess?.stopSyncSessionProcess()

			const syncSessionProcess = new ImapSyncSessionProcess(syncSessionMailbox, this, this.imapSyncConfig, this.imapFlowFactory)
			this.runningSyncSessionProcess = syncSessionProcess

			syncSessionProcess.startSyncSessionProcess(this.migrationSyncContext.migrationCredentials, this.migrationSyncEventListener).then((state) => {
				if (state === SyncSessionProcessState.CONNECTION_FAILED_REJECTED) {
					this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, IMAP_RATE_LIMIT_POSTPONE_TIME)
				} else if (state === SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN) {
					this.shutDownSyncSession(ShutdownSyncAction.POSTPONE, MIGRATION_ERROR_POSTPONE_TIME)
				}
			})
		}
	}
}

export function createImapSync(
	migrationSyncEventListener: MigrationSyncEventListener,
	certificateProvider: CertificateProvider,
	imapSyncConfig: ImapSyncConfig = defaultImapSyncConfig,
): ImapSyncSession {
	return new ImapSyncSession(migrationSyncEventListener, certificateProvider, imapSyncConfig)
}
