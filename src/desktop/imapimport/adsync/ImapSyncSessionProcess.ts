import { ImapSyncSessionMailbox } from "./ImapSyncSessionMailbox.js"
import { AdSyncEventListener, AdSyncEventType } from "./AdSyncEventListener.js"
import { ImapAccount, ImapMailIds } from "./ImapSyncState.js"
import { ImapMail } from "./imapmail/ImapMail.js"
import { AdSyncDownloadBatchSizeOptimizer } from "./optimizer/AdSyncDownloadBatchSizeOptimizer.js"
import { ImapError } from "./imapmail/ImapError.js"
import { ImapMailbox, ImapMailboxStatus } from "./imapmail/ImapMailbox.js"
import { AdSyncConfig } from "./ImapAdSync.js"
import { AdSyncProcessesOptimizerEventListener } from "./optimizer/processesoptimizer/AdSyncProcessesOptimizer.js"
import { DifferentialUidLoader, UID_FETCH_REQUEST_WAIT_TIME, UidFetchRequestType } from "./utils/DifferentialUidLoader.js"
import { setTimeout } from "node:timers/promises"
import { ImapFlow } from "imapflow"

export enum SyncSessionProcessState {
	NOT_STARTED,
	STOPPED,
	RUNNING,
	CONNECTION_FAILED_UNKNOWN,
	CONNECTION_FAILED_REJECTED,
}

export class ImapSyncSessionProcess {
	processId: number

	private state: SyncSessionProcessState = SyncSessionProcessState.NOT_STARTED
	private adSyncOptimizer: AdSyncDownloadBatchSizeOptimizer
	private adSyncProcessesOptimizerEventListener: AdSyncProcessesOptimizerEventListener
	private adSyncConfig: AdSyncConfig

	constructor(
		processId: number,
		adSyncOptimizer: AdSyncDownloadBatchSizeOptimizer,
		adSyncProcessesOptimizerEventListener: AdSyncProcessesOptimizerEventListener,
		adSyncConfig: AdSyncConfig,
	) {
		this.processId = processId
		this.adSyncOptimizer = adSyncOptimizer
		this.adSyncProcessesOptimizerEventListener = adSyncProcessesOptimizerEventListener
		this.adSyncConfig = adSyncConfig
	}

	async startSyncSessionProcess(imapAccount: ImapAccount, adSyncEventListener: AdSyncEventListener): Promise<SyncSessionProcessState> {
		const imapClient = new ImapFlow({
			host: imapAccount.host,
			port: imapAccount.port,
			secure: true,
			tls: {
				rejectUnauthorized: false, // TODO deactivate after testing
			},
			logger: false,
			auth: {
				user: imapAccount.username,
				pass: imapAccount.password,
				accessToken: imapAccount.accessToken,
			},
			qresync: this.adSyncConfig.isEnableImapQresync,
		})

		this.setupImapFlowErrorHandler(imapClient, adSyncEventListener)

		try {
			await imapClient.connect()
			if (this.state == SyncSessionProcessState.NOT_STARTED) {
				this.runSyncSessionProcess(imapClient, adSyncEventListener)
				this.state = SyncSessionProcessState.RUNNING
			}
		} catch (error) {
			if (error.message.match("(NO|BAD)")) {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_REJECTED
			} else {
				this.state = SyncSessionProcessState.CONNECTION_FAILED_UNKNOWN
			}
		}
		return this.state
	}

	async stopSyncSessionProcess(): Promise<ImapSyncSessionMailbox> {
		this.state = SyncSessionProcessState.STOPPED
		this.adSyncOptimizer.stopAdSyncOptimizer()
		return this.adSyncOptimizer.optimizedSyncSessionMailbox
	}

	private async runSyncSessionProcess(imapClient: ImapFlow, adSyncEventListener: AdSyncEventListener) {
		let isMailboxFinished = false

		try {
			let imapQresyncImapMails: ImapMail[] = []
			let highestModSeq = this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.highestModSeq

			// open mailbox readonly
			let mailboxObject = await imapClient.mailboxOpen(this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.path, { readOnly: true })

			// store ImapMailboxStatus
			let imapMailboxStatus = ImapMailboxStatus.fromImapFlowMailboxObject(mailboxObject)
			this.updateMailboxState(imapMailboxStatus)
			this.adSyncOptimizer.optimizedSyncSessionMailbox.initSessionMailbox(imapMailboxStatus.messageCount)
			adSyncEventListener.onMailboxStatus(imapMailboxStatus)

			let openedImapMailbox = ImapMailbox.fromSyncSessionMailbox(this.adSyncOptimizer.optimizedSyncSessionMailbox)
			let isEnableImapQresync = this.adSyncConfig.isEnableImapQresync && highestModSeq != null

			// calculate UID differences
			let differentialUidLoader = new DifferentialUidLoader(
				imapClient,
				adSyncEventListener,
				openedImapMailbox,
				this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap,
				isEnableImapQresync,
				this.adSyncConfig.emitAdSyncEventTypes,
			)

			differentialUidLoader
				.calculateUidDiff(
					this.adSyncOptimizer.optimizedSyncSessionMailbox.lastFetchedMailSeq,
					this.adSyncOptimizer.optimizedSyncSessionMailbox.downloadBatchSize,
					this.adSyncOptimizer.optimizedSyncSessionMailbox.mailCount,
				)
				.then((deletedUids) => {
					this.handleDeletedUids(deletedUids, openedImapMailbox, adSyncEventListener)
				})

			let fetchOptions = this.initFetchOptions(imapMailboxStatus, isEnableImapQresync)
			let nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest(this.adSyncOptimizer.optimizedSyncSessionMailbox.downloadBatchSize)

			while (nextUidFetchRequest) {
				// wait for the differentialUidLoader to calculate more IMAP UID differences
				if (nextUidFetchRequest.fetchRequestType == UidFetchRequestType.WAIT) {
					await setTimeout(UID_FETCH_REQUEST_WAIT_TIME)
					nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest(this.adSyncOptimizer.optimizedSyncSessionMailbox.downloadBatchSize)
					continue
				}

				this.adSyncOptimizer.optimizedSyncSessionMailbox.reportDownloadBatchSizeUsage(nextUidFetchRequest.usedDownloadBatchSize)

				let mailFetchStartTime = Date.now()

				let mails = imapClient.fetch(
					nextUidFetchRequest.uidFetchSequenceString,
					{
						uid: true,
						// @ts-ignore
						source: true,
						labels: true,
						size: true,
						flags: true,
						internalDate: true,
						headers: true,
					},
					fetchOptions,
				)

				// @ts-ignore
				for await (const mail of mails) {
					if (this.state == SyncSessionProcessState.STOPPED) {
						await this.logout(imapClient, isMailboxFinished, mail.seq - 1)
						return
					}

					let mailFetchEndTime = Date.now()
					let mailFetchTime = mailFetchEndTime - mailFetchStartTime

					if (mail.source) {
						let mailSize = mail.source.length
						let mailDownloadTime = mailFetchTime != 0 ? mailFetchTime : 1 // we approximate the mailFetchTime to minimum 1 millisecond
						let currenThroughput = mailSize / mailDownloadTime
						this.adSyncOptimizer.optimizedSyncSessionMailbox.reportCurrentThroughput(currenThroughput)

						this.adSyncProcessesOptimizerEventListener.onDownloadUpdate(this.processId, this.adSyncOptimizer.optimizedSyncSessionMailbox, mailSize)

						let imapMail = await ImapMail.fromImapFlowFetchMessageObject(
							mail,
							openedImapMailbox,
							this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.get(mail.uid),
						)

						switch (nextUidFetchRequest.fetchRequestType) {
							case UidFetchRequestType.CREATE:
								this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.set(
									imapMail.uid,
									new ImapMailIds(imapMail.uid),
								)
								if (this.adSyncConfig.emitAdSyncEventTypes.has(AdSyncEventType.CREATE)) {
									adSyncEventListener.onMail(imapMail, AdSyncEventType.CREATE)
								}
								break
							case UidFetchRequestType.UPDATE:
								if (this.adSyncConfig.emitAdSyncEventTypes.has(AdSyncEventType.UPDATE)) {
									adSyncEventListener.onMail(imapMail, AdSyncEventType.UPDATE)
								}
								break
							case UidFetchRequestType.QRESYNC:
								imapQresyncImapMails.push(imapMail)
								break
						}
					} else {
						adSyncEventListener.onError(new ImapError(`No IMAP mail source available for IMAP mail with UID ${mail.uid}.`))
					}
				}

				nextUidFetchRequest = await differentialUidLoader.getNextUidFetchRequest(this.adSyncOptimizer.optimizedSyncSessionMailbox.downloadBatchSize)
			}

			if (isEnableImapQresync) {
				this.handleQresyncFetchResult(imapQresyncImapMails, adSyncEventListener)
			}

			isMailboxFinished = true
		} catch (error: any) {
			adSyncEventListener.onError(new ImapError(error))
		} finally {
			await this.logout(imapClient, isMailboxFinished)
		}
	}

	private async logout(imapClient: ImapFlow, isMailboxFinished: boolean, lastFetchedMailSeq: number = 0) {
		await imapClient.logout()

		if (isMailboxFinished) {
			this.adSyncProcessesOptimizerEventListener.onMailboxFinish(this.processId, this.adSyncOptimizer.optimizedSyncSessionMailbox)
		} else {
			this.adSyncOptimizer.optimizedSyncSessionMailbox.lastFetchedMailSeq = lastFetchedMailSeq
			this.adSyncProcessesOptimizerEventListener.onMailboxInterrupted(this.processId, this.adSyncOptimizer.optimizedSyncSessionMailbox)
		}
	}

	private initFetchOptions(imapMailboxStatus: ImapMailboxStatus, isEnableImapQresync: boolean) {
		let fetchOptions = {}
		if (isEnableImapQresync) {
			let highestModSeq = [...this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.values()].reduce<bigint>(
				(acc, imapMailIds) => (imapMailIds.modSeq && imapMailIds.modSeq > acc ? imapMailIds.modSeq : acc),
				BigInt(0),
			)
			fetchOptions = {
				uid: true,
				changedSince: highestModSeq,
			}
		} else {
			fetchOptions = {
				uid: true,
			}
		}
		return fetchOptions
	}

	private handleQresyncFetchResult(imapMails: ImapMail[], adSyncEventListener: AdSyncEventListener) {
		imapMails.forEach((imapMail) => {
			let isMailUpdate = this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.has(imapMail.uid)

			if (isMailUpdate && this.adSyncConfig.emitAdSyncEventTypes.has(AdSyncEventType.UPDATE)) {
				adSyncEventListener.onMail(imapMail, AdSyncEventType.UPDATE)
			} else if (this.adSyncConfig.emitAdSyncEventTypes.has(AdSyncEventType.CREATE)) {
				this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.set(imapMail.uid, new ImapMailIds(imapMail.uid))
				adSyncEventListener.onMail(imapMail, AdSyncEventType.CREATE)
			}
		})
	}

	private updateMailboxState(imapMailboxStatus: ImapMailboxStatus) {
		let mailboxState = this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState
		mailboxState.uidValidity = imapMailboxStatus.uidValidity
		mailboxState.uidNext = imapMailboxStatus.uidNext
		mailboxState.highestModSeq = imapMailboxStatus.highestModSeq
	}

	private async handleDeletedUids(deletedUids: number[], openedImapMailbox: ImapMailbox, adSyncEventListener: AdSyncEventListener) {
		deletedUids.forEach((deletedUid) => {
			this.emitImapMailDeleteEvent(deletedUid, openedImapMailbox, adSyncEventListener)
		})
	}

	private setupImapFlowErrorHandler(imapClient: ImapFlow, adSyncEventListener: AdSyncEventListener) {
		imapClient.on("error", (error) => {
			adSyncEventListener.onError(new ImapError(error))
			this.logout(imapClient, false)
		})
	}

	private setupImapFlowExpungeHandler(imapClient: ImapFlow, openedImapMailbox: ImapMailbox, adSyncEventListener: AdSyncEventListener) {
		imapClient.on("expunge", (deletedMail) => {
			this.emitImapMailDeleteEvent(deletedMail.uid, openedImapMailbox, adSyncEventListener)
		})
	}

	private emitImapMailDeleteEvent(deletedUid: number, openedImapMailbox: ImapMailbox, adSyncEventListener: AdSyncEventListener) {
		if (this.adSyncConfig.emitAdSyncEventTypes.has(AdSyncEventType.DELETE)) {
			let imapMail = new ImapMail(deletedUid, openedImapMailbox).setExternalMailId(
				this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.get(deletedUid),
			)
			this.adSyncOptimizer.optimizedSyncSessionMailbox.mailboxState.importedUidToMailIdsMap.delete(deletedUid)
			adSyncEventListener.onMail(imapMail, AdSyncEventType.DELETE)
		}
	}
}
