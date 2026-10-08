import { MigrationSessionMailbox, migrationMailboxFromSyncSessionMailbox } from "../MigrationSessionMailbox.js"
import type { MigrationSyncEventListener } from "../MigrationSyncEventListener.js"
import { MigrationMailId, MigrationCredentials } from "../../../api/common/utils/migrationImportUtils/MigrationSyncContext.js"
import { MigrationMail } from "../../../api/common/utils/migrationImportUtils/MigrationMail.js"
import { MigrationMailbox, MigrationMailboxStatus } from "../../../api/common/utils/migrationImportUtils/MigrationMailbox.js"
import { DifferentialUidLoader, MAIL_DOWNLOAD_BATCH_SIZE, UID_FETCH_REQUEST_WAIT_TIME, UidFetchRequestType } from "./DifferentialUidLoader.js"
import { setTimeout } from "node:timers/promises"
import { assertNotNull, isEmpty, isNotEmpty } from "@tutao/utils"
import { migrationMailFromImapFlowFetchMessageObject } from "../mailparser/MailParserUtils"
import type { ImapFlow } from "imapflow"
import { ImapFlowFactory, ImapSyncConfig } from "./ImapSyncSession"
import { SyncSessionEventListener } from "../MigrationSyncSession"
import { MailboxMigrationFolderSyncStatus, MigrationSyncEventType } from "../../../../../entities/tutanota/Utils"
import { fromImapFlowError } from "../../../api/common/error/MigrationError"

export enum SyncSessionProcessState {
	NOT_STARTED,
	STOPPED,
	RUNNING,
	CONNECTION_FAILED_UNKNOWN,
	CONNECTION_FAILED_REJECTED,
}

export type DifferentialUidLoaderFactory = (
	imapClient: ImapFlow,
	importedUidToMailIdsMap: Map<number, MigrationMailId>,
	isEnableImapQresync: boolean,
	emitMigrationSyncEventTypes: Set<MigrationSyncEventType>,
) => DifferentialUidLoader

/**
 * This class is responsible for the sync session process for a single mailbox.
 */
export class ImapSyncSessionProcess {
	// Visible for testing
	state: SyncSessionProcessState = SyncSessionProcessState.NOT_STARTED
	imapClient: ImapFlow | null = null

	constructor(
		// Visible for testing
		public readonly syncSessionProcessMailbox: MigrationSessionMailbox,
		private syncSessionEventListener: SyncSessionEventListener,
		private imapSyncConfig: ImapSyncConfig,
		private readonly imapFlowFactory: ImapFlowFactory,
		private readonly differentialUidLoaderFactory: DifferentialUidLoaderFactory = (client, map, qresync, eventTypes) =>
			new DifferentialUidLoader(client, map, qresync, eventTypes),
	) {}

	async startSyncSessionProcess(
		migrationCredentials: MigrationCredentials,
		migrationSyncEventListener: MigrationSyncEventListener,
	): Promise<SyncSessionProcessState> {
		this.imapClient = await this.imapFlowFactory(migrationCredentials, this.imapSyncConfig)
		this.setupImapFlowErrorLogger(migrationSyncEventListener)

		try {
			await this.imapClient.connect()
		} catch (error) {
			if (error.response !== undefined && error.response.match(/NO \[LIMIT\]/)) {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_REJECTED
			} else if (error.responseStatus !== undefined && error.responseStatus.match("(NO|BAD)")) {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_REJECTED
			} else {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN
			}
			return this.state
		}

		this.state = SyncSessionProcessState.RUNNING
		await this.runSyncSessionProcess(migrationSyncEventListener)
		this.state = SyncSessionProcessState.STOPPED

		return this.state
	}

	async stopSyncSessionProcess(): Promise<MigrationSessionMailbox> {
		this.state = SyncSessionProcessState.STOPPED
		return this.syncSessionProcessMailbox
	}

	private async runSyncSessionProcess(migrationSyncEventListener: MigrationSyncEventListener) {
		let isMailboxFinished = false

		if (!this.imapClient) {
			return
		}

		try {
			// open mailbox readonly
			const mailboxObject = await this.imapClient.mailboxOpen(this.syncSessionProcessMailbox.mailboxState.path, { readOnly: true })

			// emit MigrationMailboxStatus and update SyncSessionMailbox
			const migrationMailboxStatus: MigrationMailboxStatus = {
				path: mailboxObject.path,
				uidValidity: mailboxObject.uidValidity,
				uidNext: mailboxObject.uidNext,
				messageCount: mailboxObject.exists,
				syncStatus: MailboxMigrationFolderSyncStatus.RUNNING,
			}
			await migrationSyncEventListener.onMailboxStatus(migrationMailboxStatus)
			this.updateSyncSessionMailbox(migrationMailboxStatus)

			const openedMigrationMailbox = migrationMailboxFromSyncSessionMailbox(this.syncSessionProcessMailbox)

			const imapServerHighestModeSeq = mailboxObject.highestModseq
			const isEnableImapQresync = this.imapSyncConfig.isEnableImapQresync && imapServerHighestModeSeq != null
			if (isEnableImapQresync) {
				this.setupImapFlowExpungeHandler(openedMigrationMailbox, migrationSyncEventListener)
			}

			let imapQresyncMigrationMails: MigrationMail[] = []

			const importedUidToMailIdsMap = new Map(
				[...this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap].map(([key, value]) => [Number(key), value]),
			)

			// calculate UID differences
			const differentialUidLoader = this.differentialUidLoaderFactory(
				this.imapClient,
				importedUidToMailIdsMap,
				isEnableImapQresync,
				this.imapSyncConfig.emitMigrationSyncEventTypes,
			)

			differentialUidLoader
				.calculateUidDiff(this.syncSessionProcessMailbox.lastFetchedMailSeq, this.syncSessionProcessMailbox.mailCount)
				.then((deletedUids) => {
					this.handleDeletedUids(deletedUids, openedMigrationMailbox, migrationSyncEventListener)
				})

			const fetchOptions = this.initFetchOptions(isEnableImapQresync)
			let nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest()

			while (nextUidFetchRequest) {
				// wait for the differentialUidLoader to calculate more IMAP UID differences
				if (nextUidFetchRequest.fetchRequestType === UidFetchRequestType.WAIT) {
					await setTimeout(UID_FETCH_REQUEST_WAIT_TIME)
					nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest()
					continue
				}

				const mails = this.imapClient.fetch(
					nextUidFetchRequest.uidFetchSequenceString,
					{
						uid: true,
						source: true,
						labels: true,
						size: true,
						flags: true,
						internalDate: true,
					},
					fetchOptions,
				)

				const migrationMailsCreate: MigrationMail[] = []
				const migrationMailsUpdate: MigrationMail[] = []
				for await (const mail of mails) {
					if (this.state === SyncSessionProcessState.STOPPED) {
						await this.logout(isMailboxFinished, mail.seq - 1)
						return
					}

					if (mail.source) {
						const migrationMail = await migrationMailFromImapFlowFetchMessageObject(mail, openedMigrationMailbox)

						switch (nextUidFetchRequest.fetchRequestType) {
							case UidFetchRequestType.CREATE:
								this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap.set(migrationMail.sourceId, {
									sourceId: migrationMail.sourceId,
								})
								if (this.imapSyncConfig.emitMigrationSyncEventTypes.has(MigrationSyncEventType.CREATE)) {
									migrationMailsCreate.push(migrationMail)
								}
								break
							case UidFetchRequestType.UPDATE:
								if (this.imapSyncConfig.emitMigrationSyncEventTypes.has(MigrationSyncEventType.UPDATE)) {
									migrationMailsUpdate.push(migrationMail)
								}
								break
							case UidFetchRequestType.QRESYNC:
								imapQresyncMigrationMails.push(migrationMail)

								if (imapQresyncMigrationMails.length >= MAIL_DOWNLOAD_BATCH_SIZE) {
									await this.handleQresyncFetchResult(imapQresyncMigrationMails, migrationSyncEventListener)
									imapQresyncMigrationMails = []
								}
								break
						}
					} else {
						await this.logout(isMailboxFinished, mail.seq - 1)
						return
					}
				}

				if (isNotEmpty(migrationMailsCreate)) {
					await migrationSyncEventListener.onMultipleMails(migrationMailsCreate, MigrationSyncEventType.CREATE)
				}
				if (isNotEmpty(migrationMailsUpdate)) {
					await migrationSyncEventListener.onMultipleMails(migrationMailsUpdate, MigrationSyncEventType.UPDATE)
				}
				nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest()
			}

			if (isEnableImapQresync) {
				await this.handleQresyncFetchResult(imapQresyncMigrationMails, migrationSyncEventListener)
			}

			isMailboxFinished = true
			migrationMailboxStatus.syncStatus = MailboxMigrationFolderSyncStatus.FINISHED
			await migrationSyncEventListener.onMailboxStatus(migrationMailboxStatus)
		} catch (e) {
			// catch all exceptions, we will retry later
			// errors are reported using the onError callback inside the setupImapFlowErrorLogger
		} finally {
			await this.logout(isMailboxFinished)
		}
	}

	// Visible for testing
	async logout(isMailboxFinished: boolean, lastFetchedMailSeq: number = 0) {
		try {
			await this.imapClient?.logout()
		} catch (e) {
			// Ignore failures to logout, this just means we already have logged out.
		}

		if (isMailboxFinished) {
			this.syncSessionEventListener.onMailboxFinish(this.syncSessionProcessMailbox)
		} else {
			this.syncSessionProcessMailbox.lastFetchedMailSeq = lastFetchedMailSeq
			this.syncSessionEventListener.onMailboxInterrupted(this.syncSessionProcessMailbox)
		}
	}

	private initFetchOptions(isEnableImapQresync: boolean, imapServerHighestModSeq?: bigint | null) {
		let fetchOptions
		if (isEnableImapQresync && imapServerHighestModSeq) {
			const highestModSeq = [...this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap.values()].reduce<bigint>(
				(acc, imapMailIds) => (imapMailIds.modSeq && imapMailIds.modSeq > acc ? imapMailIds.modSeq : acc),
				BigInt(0),
			)
			fetchOptions = {
				uid: true,
				changedSince: imapServerHighestModSeq < highestModSeq ? imapServerHighestModSeq : highestModSeq,
			}
		} else {
			fetchOptions = {
				uid: true,
			}
		}
		return fetchOptions
	}

	// Visible for testing
	async handleQresyncFetchResult(migrationMails: MigrationMail[], migrationSyncEventListener: MigrationSyncEventListener) {
		const mailUpdates = migrationMails.filter((migrationMail) =>
			this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap.has(migrationMail.sourceId),
		)
		if (!isEmpty(mailUpdates) && this.imapSyncConfig.emitMigrationSyncEventTypes.has(MigrationSyncEventType.UPDATE)) {
			await migrationSyncEventListener.onMultipleMails(mailUpdates, MigrationSyncEventType.UPDATE)
		}

		const mailCreates = migrationMails.filter(
			(migrationMail) => !this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap.has(migrationMail.sourceId),
		)
		if (!isEmpty(mailCreates) && this.imapSyncConfig.emitMigrationSyncEventTypes.has(MigrationSyncEventType.CREATE)) {
			for (const migrationMail of migrationMails) {
				this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap.set(migrationMail.sourceId, {
					sourceId: migrationMail.sourceId,
					modSeq: migrationMail.modSeq,
				})
			}
			await migrationSyncEventListener.onMultipleMails(mailCreates, MigrationSyncEventType.CREATE)
		}
	}

	private updateSyncSessionMailbox(migrationMailboxStatus: MigrationMailboxStatus) {
		const mailboxState = this.syncSessionProcessMailbox.mailboxState
		mailboxState.uidValidity = migrationMailboxStatus.uidValidity
		mailboxState.uidNext = migrationMailboxStatus.uidNext

		this.syncSessionProcessMailbox.mailCount = migrationMailboxStatus.messageCount ?? null
	}

	private async handleDeletedUids(deletedUids: number[], openedMigrationMailbox: MigrationMailbox, imapSyncEventListener: MigrationSyncEventListener) {
		for (const deletedUid of deletedUids) {
			await this.emitImapMailDeleteEvent(deletedUid, openedMigrationMailbox, imapSyncEventListener)
		}
	}

	// Visible for testing
	setupImapFlowErrorLogger(imapSyncEventListener: MigrationSyncEventListener) {
		this.imapClient?.on("error", (error: any) => {
			const imapError = fromImapFlowError(error)
			if (error.code) {
				console.error("imap error code", error.code, imapError)
			}
			imapSyncEventListener.onError(imapError)
		})
	}

	// emit DELETE events when IMAP QRESYNC is enabled and supported
	private setupImapFlowExpungeHandler(openedMigrationMailbox: MigrationMailbox, migrationSyncEventListener: MigrationSyncEventListener) {
		this.imapClient?.on("expunge", async (deletedMail) => {
			await this.emitImapMailDeleteEvent(assertNotNull(deletedMail.uid), openedMigrationMailbox, migrationSyncEventListener)
		})
	}

	// Visible for testing
	async emitImapMailDeleteEvent(deletedUid: number, openedMigrationMailbox: MigrationMailbox, migrationSyncEventListener: MigrationSyncEventListener) {
		if (this.imapSyncConfig.emitMigrationSyncEventTypes.has(MigrationSyncEventType.DELETE)) {
			const migrationMail = { uid: deletedUid, sourceId: deletedUid.toString(), belongsToMailbox: openedMigrationMailbox }
			this.syncSessionProcessMailbox.mailboxState.importedSourceIdToMailIdsMap.delete(deletedUid.toString())
			await migrationSyncEventListener.onMultipleMails([migrationMail], MigrationSyncEventType.DELETE)
		}
	}
}
