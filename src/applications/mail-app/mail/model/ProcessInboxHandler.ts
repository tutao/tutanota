import { Mail, MailSet, ProcessInboxDatum } from "@tutao/entities/tutanota"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import { InstanceSessionKey } from "@tutao/entities/sys"
import { SkipClientSpamClassificationReason, SpamClassificationHandler } from "./SpamClassificationHandler"
import { isSameId, StrippedEntity } from "../../../../platform-kit/meta"
import { assertMainOrNode } from "../../../../platform-kit/app-env"
import { assertNotNull, isEmpty, throttle } from "../../../../platform-kit/utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { LoginController } from "../../../common/api/main/LoginController"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { LockedError } from "../../../../platform-kit/rest-client/error"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { InboxRuleHandler } from "./InboxRuleHandler"
import { extractServerClassifiers } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"

assertMainOrNode()

export type UnencryptedProcessInboxDatum = Omit<
	StrippedEntity<ProcessInboxDatum>,
	"encVectorLegacy" | "encVectorWithServerClassifiers" | "ownerEncVectorSessionKey"
> & {
	vectorLegacy: Uint8Array
	vectorWithServerClassifiers: Uint8Array
}

const DEFAULT_THROTTLE_PROCESS_INBOX_SERVICE_REQUESTS_MS = 500

export class ProcessInboxHandler {
	constructor(
		private readonly logins: LoginController,
		private readonly mailFacade: MailFacade,
		private readonly cryptoFacade: CryptoFacade,
		private spamHandler: () => SpamClassificationHandler,
		private readonly inboxRuleHandler: () => InboxRuleHandler,
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
							await mailFacade.processNewMails(mailGroup, processedMails)
						} catch (e) {
							if (e instanceof LockedError) {
								// retry in case of LockedError
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

	sendProcessInboxServiceRequest: (mailFacade: MailFacade) => void

	public async handleIncomingMail(
		mail: Mail,
		sourceFolder: MailSet,
		mailboxDetail: MailboxDetail,
		folderSystem: FolderSystem,
		isLeaderClient: boolean,
	): Promise<MailSet> {
		await this.logins.loadCustomizations()
		if (!mail.processNeeded) {
			return sourceFolder
		}

		let instanceSessionKeys: InstanceSessionKey[] = []
		// resolve sessionKeys for mail and their corresponding files if bucket key exists, and we are the
		// leader client, i.e. isLeaderClient == true
		// we resolveWithBucketKey before predicting spam to have an encryptionAuthStatus on the mail instance
		if (isLeaderClient && mail.bucketKey) {
			const resolvedSessionKeys = await this.cryptoFacade.resolveWithBucketKey(mail)
			instanceSessionKeys = resolvedSessionKeys.instanceSessionKeys
		}

		const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)
		const { modelInput, uploadableVectorLegacy, uploadableVector, skipPredictionReason } = await this.spamHandler().preparePredictSpamForNewMail(
			mail,
			mailDetails,
		)

		let targetFolder = sourceFolder
		let applyInboxRuleResultActions = false
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: sourceFolder._id,
			classifierType: null,
			vectorLegacy: uploadableVectorLegacy,
			vectorWithServerClassifiers: uploadableVector,
			ownerEncMailSessionKeys: [],
		}

		if (skipPredictionReason === SkipClientSpamClassificationReason.None) {
			const isSpam = await this.spamHandler().predictSpamForNewMail(modelInput, assertNotNull(mail._ownerGroup))
			if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
				// The mail has been classified as SPAM
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
			} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
				// The mail has been classified as HAM (not SPAM)
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
			}

			processInboxDatum.classifierType = ClientClassifierType.CLIENT_CLASSIFICATION
		} else {
			const serverClassifiers = extractServerClassifiers(assertNotNull(mail.serverClassificationData))
			console.log(
				`skipped spam classification for new mail ${mail._id.join("/")}. reason: ${skipPredictionReason} , serverClassifiers: ${serverClassifiers}`,
			)
		}

		if (targetFolder.folderType === MailSetKind.INBOX || skipPredictionReason === SkipClientSpamClassificationReason.None) {
			// mail landed in Inbox or might have been moved to Spam folder by client side classification
			const inboxRuleHandler = this.inboxRuleHandler()
			const matchingInboxRule = await inboxRuleHandler.findMatchingInboxRule(mail, sourceFolder)

			if (matchingInboxRule != null) {
				const excludeFromSpam = inboxRuleHandler.getExcludeSpamResultValue(matchingInboxRule)
				const ruleMoveTarget =
					(await inboxRuleHandler.getMoveResultValue(matchingInboxRule, mailboxDetail)) ??
					assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))

				// We only apply result actions if: excludedFromSpam, marked as HAM, or marked as SPAM but inbox rule also moves to Spam
				applyInboxRuleResultActions = excludeFromSpam || targetFolder.folderType === MailSetKind.INBOX || ruleMoveTarget.folderType === MailSetKind.SPAM
				if (applyInboxRuleResultActions && ruleMoveTarget.folderType !== targetFolder.folderType) {
					targetFolder = ruleMoveTarget
					processInboxDatum.classifierType = ClientClassifierType.CUSTOMER_INBOX_RULES
				}
			}
		}

		if (!isLeaderClient) {
			// For non-leader clients, we don't apply the processing result, but we process to find the target folder
			// in order to hide mails that will be moved once processed from the list when loading it.
			return targetFolder
		}

		// Update targetMoveFolder after client spam classification and inbox rule handling
		processInboxDatum.targetMoveFolder = targetFolder._id
		// The ProcessInboxService is updating sessionKeys for mail and files on the server by calling UpdateSessionKeyService
		processInboxDatum.ownerEncMailSessionKeys = instanceSessionKeys

		const mailGroupId = assertNotNull(mail._ownerGroup)
		if (this.processedMailsByMailGroup.has(mailGroupId)) {
			const existingData = assertNotNull(this.processedMailsByMailGroup.get(mailGroupId))
			const datumIsAlreadyAdded = existingData.some((existingDatum) => isSameId(existingDatum.mailId, processInboxDatum.mailId))
			if (!datumIsAlreadyAdded) {
				this.processedMailsByMailGroup.get(mailGroupId)?.push(processInboxDatum)
			}
		} else {
			this.processedMailsByMailGroup.set(mailGroupId, [processInboxDatum])
		}

		void this.sendProcessInboxServiceRequest(this.mailFacade)
		/* FIXME: apply the rest of the actions if applyInboxRuleResultActions is true
		 * Note: the move result action is applied through ProcessInboxService, so we only apply the rest of the actions
		 * once the move is done because both move and label update the sets field on the mail.
		 */

		return targetFolder
	}

	/**
	 * Get move target folder of matching inbox rule for mail
	 * @returns {sourceFolder} if: mail.processNeeded, no matching rule is found, or matching rule doesn't move the mail
	 */
	public async getInboxRuleMoveTarget(mail: Mail, sourceFolder: MailSet, mailboxDetail: MailboxDetail): Promise<MailSet> {
		let targetFolder = sourceFolder

		// when processNeeded, the mail should be in process by the regular handler and be eventually processed
		if (!mail.processNeeded) {
			const inboxRuleHandler = this.inboxRuleHandler()
			const matchingRule = await inboxRuleHandler.findMatchingInboxRule(mail, sourceFolder, true)
			if (matchingRule) {
				targetFolder = (await inboxRuleHandler.getMoveResultValue(matchingRule, mailboxDetail)) ?? sourceFolder
			}
		}

		return targetFolder
	}
}
