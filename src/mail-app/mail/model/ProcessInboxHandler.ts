import { SpamClassificationHandler } from "./SpamClassificationHandler"
import { InboxRuleHandler } from "./InboxRuleHandler"
import { Mail, MailSet, ProcessInboxDatum } from "../../../common/api/entities/tutanota/TypeRefs"
import { FeatureType, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { assertNotNull, isEmpty, Nullable, throttle } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { isSameId, StrippedEntity } from "../../../common/api/common/utils/EntityUtils"
import { LoginController } from "../../../common/api/main/LoginController"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade"
import { LockedError } from "../../../common/api/common/error/RestError"
import { ProgressMonitorDelegate } from "../../../common/api/worker/ProgressMonitorDelegate"
import { ProgressTracker } from "../../../common/api/main/ProgressTracker"

assertMainOrNode()

export type UnencryptedProcessInboxDatum = Omit<StrippedEntity<ProcessInboxDatum>, "encVector" | "ownerEncVectorSessionKey"> & {
	vector: Uint8Array
}

const DEFAULT_THROTTLE_PROCESS_INBOX_SERVICE_REQUESTS_MS = 500

export class ProcessInboxHandler {
	private processInboxProgressMonitor: ProgressMonitorDelegate | null = null

	constructor(
		private readonly logins: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly cryptoFacade: CryptoFacade,
		private spamHandler: () => SpamClassificationHandler,
		private readonly inboxRuleHandler: () => InboxRuleHandler,
		private progressTracker: ProgressTracker,
		private processedMailsByMailGroup: Map<Id, UnencryptedProcessInboxDatum[]> = new Map(),
		private readonly throttleTimeout: number = DEFAULT_THROTTLE_PROCESS_INBOX_SERVICE_REQUESTS_MS,
	) {
		this.sendProcessInboxServiceRequest = throttle(this.throttleTimeout, async (mailFacade: MailFacade) => {
			// we debounce the requests to a rate of DEFAULT_THROTTLE_PROCESS_INBOX_SERVICE_REQUESTS_MS
			if (this.processedMailsByMailGroup.size > 0) {
				// copy map to prevent inserting into map while we await the server
				const map = this.processedMailsByMailGroup
				this.processedMailsByMailGroup = new Map()
				for (const [mailGroup, processedMails] of map) {
					// send request to server
					if (!isEmpty(processedMails)) {
						try {
							if (this.processInboxProgressMonitor && !this.processInboxProgressMonitor.isDone()) {
								const newTotalWork = this.processInboxProgressMonitor.totalWork + processedMails.length
								this.processInboxProgressMonitor.updateTotalWork(newTotalWork)
							} else {
								this.processInboxProgressMonitor = new ProgressMonitorDelegate(this.progressTracker, processedMails.length)
							}
							this.processInboxProgressMonitor.workDone(processedMails.length * 0.2)
							await mailFacade.processNewMails(mailGroup, processedMails)
						} catch (e) {
							if (e instanceof LockedError) {
								// retry in case of LockedError
								this.processInboxProgressMonitor?.completed()

								this.processedMailsByMailGroup.set(mailGroup, processedMails)
								this.sendProcessInboxServiceRequest(mailFacade)
							} else {
								console.log("error during processInboxService call:", e.name, processedMails.length)
								throw e
							}
						}
					}
				}
			}
		})
	}

	sendProcessInboxServiceRequest: (mailFacade: MailFacade) => Promise<void>

	public async handleIncomingMail(
		mail: Mail,
		sourceFolder: MailSet,
		mailboxDetail: MailboxDetail,
		folderSystem: FolderSystem,
		sendServerRequest: boolean,
	): Promise<MailSet> {
		await this.logins.loadCustomizations()
		const isSpamClassificationFeatureEnabled = this.logins.isEnabled(FeatureType.SpamClientClassification)
		if (!mail.processNeeded) {
			return sourceFolder
		}

		// resolve sessionKeys for mail and their corresponding files
		const resolvedSessionKeys = await this.cryptoFacade.resolveWithBucketKey(mail)

		const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)

		let finalProcessInboxDatum: Nullable<UnencryptedProcessInboxDatum> = null
		let moveToFolder: MailSet = sourceFolder

		// We process rules which are excluded from spam list first and if none apply then we run spam prediction.
		const result = await this.inboxRuleHandler()?.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, sourceFolder)
		if (result) {
			const { targetFolder, processInboxDatum } = result
			finalProcessInboxDatum = processInboxDatum
			moveToFolder = targetFolder
		} else {
			if (isSpamClassificationFeatureEnabled) {
				const { targetFolder, processInboxDatum } = await this.spamHandler().predictSpamForNewMail(mail, mailDetails, sourceFolder, folderSystem)
				moveToFolder = targetFolder
				finalProcessInboxDatum = processInboxDatum
			}

			// apply regular inbox rules only if the mail is classified as ham by the spam classifier
			if (moveToFolder.folderType === MailSetKind.INBOX) {
				const result = await this.inboxRuleHandler()?.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, sourceFolder)
				if (result) {
					const { targetFolder, processInboxDatum } = result
					finalProcessInboxDatum = processInboxDatum
					moveToFolder = targetFolder
				}
			}
		}

		// set processInboxDatum if the spam classification is disabled and no inbox rule applies to the mail
		if (finalProcessInboxDatum === null) {
			finalProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: moveToFolder._id,
				classifierType: null,
				vector: await this.mailFacade.vectorizeAndCompressMails({ mail, mailDetails }),
				ownerEncMailSessionKeys: [],
			}
		}

		// the ProcessInboxService is updating sessionKeys for mail and files on the server by calling UpdateSessionKeyService
		finalProcessInboxDatum.ownerEncMailSessionKeys = resolvedSessionKeys.instanceSessionKeys

		const mailGroupId = assertNotNull(mail._ownerGroup)
		if (this.processedMailsByMailGroup.has(mailGroupId)) {
			const existingData = assertNotNull(this.processedMailsByMailGroup.get(mailGroupId))
			const datumIsAlreadyAdded = existingData.some((existingDatum) => isSameId(existingDatum.mailId, finalProcessInboxDatum.mailId))
			if (!datumIsAlreadyAdded) {
				this.processedMailsByMailGroup.get(mailGroupId)?.push(finalProcessInboxDatum)
			}
		} else {
			this.processedMailsByMailGroup.set(mailGroupId, [finalProcessInboxDatum])
		}

		if (sendServerRequest) {
			// noinspection ES6MissingAwait
			this.sendProcessInboxServiceRequest(this.mailFacade)
		}
		return moveToFolder
	}

	public async handleProcessedMail(mail: Mail) {
		if (mail.processNeeded) {
			return
		}
		// 0.2 work is done immediately after a work per mail is announced when sending the request to show progress immediately,
		// the remaining 0.8 work are done here after entity event processing for the update event
		this.processInboxProgressMonitor?.workDone(0.8)
	}

	public async processInboxRulesOnly(mail: Mail, sourceFolder: MailSet, mailboxDetail: MailboxDetail): Promise<MailSet> {
		// These should be in process by the regular handler and be eventually processed
		if (mail.processNeeded) {
			return sourceFolder
		}
		let moveToFolder: MailSet = sourceFolder
		// process excluded rules first and then regular ones.
		const result = await this.inboxRuleHandler()?.findAndApplyRulesExcludedFromSpamFilter(mailboxDetail, mail, sourceFolder, true)
		if (result) {
			const { targetFolder, processInboxDatum } = result
			moveToFolder = targetFolder
		} else {
			if (moveToFolder.folderType === MailSetKind.INBOX) {
				const result = await this.inboxRuleHandler()?.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, sourceFolder, true)
				if (result) {
					const { targetFolder, processInboxDatum } = result
					moveToFolder = targetFolder
				}
			}
		}

		return moveToFolder
	}
}
