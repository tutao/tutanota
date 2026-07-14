import { imapMailboxFromSyncSessionMailbox, ImapSyncSessionMailbox } from "./ImapSyncSessionMailbox.js"
import type { ImapSyncEventListener } from "./ImapSyncEventListener.js"
import { ImapCredentials, ImapMailId, ImapSyncContext } from "../../../api/common/utils/imapImportUtils/ImapSyncContext.js"
import { ImapMail } from "../../../api/common/utils/imapImportUtils/ImapMail.js"
import { ImapMailbox, ImapMailboxStatus } from "../../../api/common/utils/imapImportUtils/ImapMailbox.js"
import { ImapSyncConfig } from "./ImapSync.js"
import { DifferentialUidLoader, MAIL_DOWNLOAD_BATCH_SIZE, UID_FETCH_REQUEST_WAIT_TIME, UidFetchRequestType } from "./DifferentialUidLoader.js"
import { setTimeout } from "node:timers/promises"
import { assertNotNull, isEmpty, isNotEmpty } from "@tutao/utils"
import { imapMailFromImapFlowFetchMessageObject } from "./imapmail/ImapParserUtils"
import type { ImapFlow } from "imapflow"
import { ImapFlowFactory, SyncSessionEventListener } from "./ImapSyncSession"
import { ImapFolderSyncStatus, ImapSyncEventType } from "../../../../../entities/tutanota/Utils"
import { fromImapFlowError } from "../../../api/common/error/ImapError"

export enum SyncSessionProcessState {
	NOT_STARTED,
	STOPPED,
	RUNNING,
	CONNECTION_FAILED_UNKNOWN,
	CONNECTION_FAILED_REJECTED,
}

export type DifferentialUidLoaderFactory = (
	imapClient: ImapFlow,
	importedUidToMailIdsMap: Map<number, ImapMailId>,
	isEnableImapQresync: boolean,
	emitImapSyncEventTypes: Set<ImapSyncEventType>,
) => DifferentialUidLoader

/**
 * This class is responsible for the sync session process for a single mailbox.
 */
export class ImapSyncSessionProcess {
	// Visible for testing
	state: SyncSessionProcessState = SyncSessionProcessState.NOT_STARTED

	constructor(
		// Visible for testing
		public readonly syncSessionProcessMailbox: ImapSyncSessionMailbox,
		private syncSessionEventListener: SyncSessionEventListener,
		private imapSyncConfig: ImapSyncConfig,
		private readonly imapFlowFactory: ImapFlowFactory,
		private readonly differentialUidLoaderFactory: DifferentialUidLoaderFactory = (client, map, qresync, eventTypes) =>
			new DifferentialUidLoader(client, map, qresync, eventTypes),
	) {}

	async startSyncSessionProcess(imapCredentials: ImapCredentials, imapSyncEventListener: ImapSyncEventListener): Promise<SyncSessionProcessState> {
		const imapClient = await this.imapFlowFactory(imapCredentials, this.imapSyncConfig)

		this.setupImapFlowErrorHandler(imapClient, imapSyncEventListener)

		try {
			await imapClient.connect()
		} catch (e) {
			this.state = SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN
			return this.state
		}

		try {
			if (this.state === SyncSessionProcessState.NOT_STARTED) {
				await this.runSyncSessionProcess(imapClient, imapSyncEventListener)
				this.state = SyncSessionProcessState.RUNNING
			}
		} catch (error) {
			await this.logout(imapClient, false, 0)
			if (error.response !== undefined && error.response.match(/NO \[LIMIT\]/)) {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_REJECTED
			} else if (error.responseStatus !== undefined && error.responseStatus.match("(NO|BAD)")) {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_REJECTED
			} else {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN
			}
		}
		return this.state
	}

	async stopSyncSessionProcess(): Promise<ImapSyncSessionMailbox> {
		this.state = SyncSessionProcessState.STOPPED
		return this.syncSessionProcessMailbox
	}

	private async runSyncSessionProcess(imapClient: ImapFlow, imapSyncEventListener: ImapSyncEventListener) {
		let isMailboxFinished = false

		try {
			// open mailbox readonly
			const mailboxObject = await imapClient.mailboxOpen(this.syncSessionProcessMailbox.mailboxState.path, { readOnly: true })

			// emit ImapMailboxStatus and update SyncSessionMailbox
			const imapMailboxStatus: ImapMailboxStatus = {
				path: mailboxObject.path,
				uidValidity: mailboxObject.uidValidity,
				uidNext: mailboxObject.uidNext,
				messageCount: mailboxObject.exists,
				syncStatus: ImapFolderSyncStatus.RUNNING,
			}
			await imapSyncEventListener.onMailboxStatus(imapMailboxStatus)
			this.updateSyncSessionMailbox(imapMailboxStatus)

			const openedImapMailbox = imapMailboxFromSyncSessionMailbox(this.syncSessionProcessMailbox)

			const imapServerHighestModeSeq = mailboxObject.highestModseq
			const isEnableImapQresync = this.imapSyncConfig.isEnableImapQresync && imapServerHighestModeSeq != null
			if (isEnableImapQresync) {
				this.setupImapFlowExpungeHandler(imapClient, openedImapMailbox, imapSyncEventListener)
			}

			let imapQresyncImapMails: ImapMail[] = []

			// calculate UID differences
			const differentialUidLoader = this.differentialUidLoaderFactory(
				imapClient,
				this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap,
				isEnableImapQresync,
				this.imapSyncConfig.emitImapSyncEventTypes,
			)

			differentialUidLoader
				.calculateUidDiff(this.syncSessionProcessMailbox.lastFetchedMailSeq, this.syncSessionProcessMailbox.mailCount)
				.then((deletedUids) => {
					this.handleDeletedUids(deletedUids, openedImapMailbox, imapSyncEventListener)
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

				const mails = imapClient.fetch(
					nextUidFetchRequest.uidFetchSequenceString,
					{
						uid: true,
						source: true,
						labels: true,
						size: true,
						flags: true,
						internalDate: true,
						headers: true,
					},
					fetchOptions,
				)

				const imapMailsCreate: ImapMail[] = []
				const imapMailsUpdate: ImapMail[] = []
				for await (const mail of mails) {
					if (this.state === SyncSessionProcessState.STOPPED) {
						await this.logout(imapClient, isMailboxFinished, mail.seq - 1)
						return
					}

					if (mail.source) {
						const imapMail = await imapMailFromImapFlowFetchMessageObject(
							mail,
							openedImapMailbox,
							this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.get(mail.uid),
						)

						switch (nextUidFetchRequest.fetchRequestType) {
							case UidFetchRequestType.CREATE:
								this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.set(imapMail.uid, { uid: imapMail.uid })
								if (this.imapSyncConfig.emitImapSyncEventTypes.has(ImapSyncEventType.CREATE)) {
									imapMailsCreate.push(imapMail)
								}
								break
							case UidFetchRequestType.UPDATE:
								if (this.imapSyncConfig.emitImapSyncEventTypes.has(ImapSyncEventType.UPDATE)) {
									imapMailsUpdate.push(imapMail)
								}
								break
							case UidFetchRequestType.QRESYNC:
								imapQresyncImapMails.push(imapMail)

								if (imapQresyncImapMails.length >= MAIL_DOWNLOAD_BATCH_SIZE) {
									await this.handleQresyncFetchResult(imapQresyncImapMails, imapSyncEventListener)
									imapQresyncImapMails = []
								}
								break
						}
					} else {
						await this.logout(imapClient, isMailboxFinished, mail.seq - 1)
						return
					}
				}

				if (isNotEmpty(imapMailsCreate)) {
					await imapSyncEventListener.onMultipleMails(imapMailsCreate, ImapSyncEventType.CREATE)
				}
				if (isNotEmpty(imapMailsUpdate)) {
					await imapSyncEventListener.onMultipleMails(imapMailsUpdate, ImapSyncEventType.UPDATE)
				}
				nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest()
			}

			if (isEnableImapQresync) {
				await this.handleQresyncFetchResult(imapQresyncImapMails, imapSyncEventListener)
			}

			isMailboxFinished = true
			imapMailboxStatus.syncStatus = ImapFolderSyncStatus.FINISHED
			await imapSyncEventListener.onMailboxStatus(imapMailboxStatus)
		} finally {
			await this.logout(imapClient, isMailboxFinished)
		}
	}

	// Visible for testing
	async logout(imapClient: ImapFlow, isMailboxFinished: boolean, lastFetchedMailSeq: number = 0) {
		try {
			await imapClient.logout()
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
			const highestModSeq = [...this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.values()].reduce<bigint>(
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
	async handleQresyncFetchResult(imapMails: ImapMail[], imapSyncEventListener: ImapSyncEventListener) {
		const mailUpdates = imapMails.filter((imapMail) => this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.has(imapMail.uid))
		if (!isEmpty(mailUpdates) && this.imapSyncConfig.emitImapSyncEventTypes.has(ImapSyncEventType.UPDATE)) {
			await imapSyncEventListener.onMultipleMails(mailUpdates, ImapSyncEventType.UPDATE)
		}

		const mailCreates = imapMails.filter((imapMail) => !this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.has(imapMail.uid))
		if (!isEmpty(mailCreates) && this.imapSyncConfig.emitImapSyncEventTypes.has(ImapSyncEventType.CREATE)) {
			for (const imapMail of imapMails) {
				this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.set(imapMail.uid, { uid: imapMail.uid, modSeq: imapMail.modSeq })
			}
			await imapSyncEventListener.onMultipleMails(mailCreates, ImapSyncEventType.CREATE)
		}
	}

	private updateSyncSessionMailbox(imapMailboxStatus: ImapMailboxStatus) {
		const mailboxState = this.syncSessionProcessMailbox.mailboxState
		mailboxState.uidValidity = imapMailboxStatus.uidValidity
		mailboxState.uidNext = imapMailboxStatus.uidNext

		this.syncSessionProcessMailbox.mailCount = imapMailboxStatus.messageCount ?? null
	}

	private async handleDeletedUids(deletedUids: number[], openedImapMailbox: ImapMailbox, imapSyncEventListener: ImapSyncEventListener) {
		for (const deletedUid of deletedUids) {
			await this.emitImapMailDeleteEvent(deletedUid, openedImapMailbox, imapSyncEventListener)
		}
	}

	// Visible for testing
	setupImapFlowErrorHandler(imapClient: ImapFlow, imapSyncEventListener: ImapSyncEventListener) {
		imapClient.on("error", (error: any) => {
			const imapError = fromImapFlowError(error)
			if (error.code) {
				console.error("imap error code", error.code, imapError)
			}
			imapSyncEventListener.onError(imapError)
			this.logout(imapClient, false)
		})
	}

	// emit DELETE events when IMAP QRESYNC is enabled and supported
	private setupImapFlowExpungeHandler(imapClient: ImapFlow, openedImapMailbox: ImapMailbox, imapSyncEventListener: ImapSyncEventListener) {
		imapClient.on("expunge", async (deletedMail) => {
			await this.emitImapMailDeleteEvent(assertNotNull(deletedMail.uid), openedImapMailbox, imapSyncEventListener)
		})
	}

	// Visible for testing
	async emitImapMailDeleteEvent(deletedUid: number, openedImapMailbox: ImapMailbox, imapSyncEventListener: ImapSyncEventListener) {
		if (this.imapSyncConfig.emitImapSyncEventTypes.has(ImapSyncEventType.DELETE)) {
			const imapMail = { uid: deletedUid, belongsToMailbox: openedImapMailbox }
			this.syncSessionProcessMailbox.mailboxState.importedUidToMailIdsMap.delete(deletedUid)
			await imapSyncEventListener.onMultipleMails([imapMail], ImapSyncEventType.DELETE)
		}
	}
}
