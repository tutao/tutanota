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
import { InstanceSessionKey } from "../../../common/api/entities/sys/TypeRefs"

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

	sendProcessInboxServiceRequest: (mailFacade: MailFacade) => Promise<void>

	public async handleIncomingMail(
		mail: Mail,
		sourceFolder: MailSet,
		mailboxDetail: MailboxDetail,
		folderSystem: FolderSystem,
		isLeaderClient: boolean,
	): Promise<MailSet> {
		await this.logins.loadCustomizations()
		const isSpamClassificationFeatureEnabled = this.logins.isEnabled(FeatureType.SpamClientClassification)
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
				const result = await this.inboxRuleHandler()?.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, moveToFolder)
				if (result) {
					const { targetFolder, processInboxDatum } = result
					finalProcessInboxDatum = processInboxDatum
					moveToFolder = targetFolder
				}
			}
		}

		// set processInboxDatum if the spam classification is disabled and no inbox rule applies to the mail
		if (finalProcessInboxDatum === null) {
			const { uploadableVector, uploadableVectorLegacy } = await this.mailFacade.createModelInputAndUploadableVectors(mail, mailDetails, sourceFolder)
			finalProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: moveToFolder._id,
				classifierType: null,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: [],
			}
		}

		// the ProcessInboxService is updating sessionKeys for mail and files on the server by calling UpdateSessionKeyService
		finalProcessInboxDatum.ownerEncMailSessionKeys = instanceSessionKeys

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

		if (isLeaderClient) {
			// noinspection ES6MissingAwait
			this.sendProcessInboxServiceRequest(this.mailFacade)
		}
		return moveToFolder
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
			const { targetFolder, processInboxDatum: _ } = result
			moveToFolder = targetFolder
		} else {
			const result = await this.inboxRuleHandler()?.findAndApplyRulesNotExcludedFromSpamFilter(mailboxDetail, mail, sourceFolder, true)
			if (result) {
				const { targetFolder, processInboxDatum: _ } = result
				moveToFolder = targetFolder
			}
		}

		return moveToFolder
	}
}
