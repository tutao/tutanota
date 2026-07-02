import { Mail, MailSet, ProcessInboxDatum } from "@tutao/entities/tutanota"
import { MailSetKind } from "../../../../entities/tutanota/Utils"
import { InstanceSessionKey } from "@tutao/entities/sys"
import { SpamClassificationHandler } from "./SpamClassificationHandler"
import { InboxRuleHandler } from "./InboxRuleHandler"
import { isSameId, StrippedEntity } from "../../../../platform-kit/meta"
import { assertMainOrNode } from "../../../../platform-kit/app-env"
import { assertNotNull, isEmpty, Nullable, throttle } from "../../../../platform-kit/utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { LoginController } from "../../../common/api/main/LoginController"
import { CryptoFacade } from "../../../../platform-kit/base/base-crypto/CryptoFacade"
import { LockedError } from "../../../../platform-kit/rest-client/error"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { MailModel } from "./MailModel"

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
		private readonly mailModel: MailModel,
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

		const inboxRuleHandler = this.inboxRuleHandler()
		const matchingInboxRule = await inboxRuleHandler.findMatchingInboxRule(mail, sourceFolder)
		const excludeFromSpamFilter = matchingInboxRule != null && inboxRuleHandler.doesExcludeFromSpam(matchingInboxRule)
		let moveToFolder: MailSet = (matchingInboxRule && (await inboxRuleHandler.getTargetFolder(matchingInboxRule, mailboxDetail))) ?? sourceFolder

		if (matchingInboxRule != null) {
			const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)
			const folders = await this.mailModel.getMailboxFoldersForId(mailboxDetail.mailbox.mailSets._id)
			const currentFolder = assertNotNull(folders.getFolderByMail(mail))
			const { uploadableVectorLegacy, uploadableVector } = await this.mailFacade.createModelInputAndUploadableVectors(mail, mailDetails, currentFolder)

			finalProcessInboxDatum = {
				mailId: mail._id,
				targetMoveFolder: moveToFolder._id,
				classifierType: ClientClassifierType.CUSTOMER_INBOX_RULES,
				vectorLegacy: uploadableVectorLegacy,
				vectorWithServerClassifiers: uploadableVector,
				ownerEncMailSessionKeys: [],
			}
		}

		if (!excludeFromSpamFilter) {
			// In this case there is no matching inbox rule or it is not excluded from the spam, so we to use the spam classifier
			const { targetFolder, processInboxDatum } = await this.spamHandler().predictSpamForNewMail(mail, mailDetails, sourceFolder, folderSystem)

			if (targetFolder.folderType !== MailSetKind.INBOX || matchingInboxRule == null) {
				// The mail has been classified as SPAM (not HAM) or there is no inbox rule to apply
				finalProcessInboxDatum = processInboxDatum
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
			const datumIsAlreadyAdded = existingData.some((existingDatum) => isSameId(existingDatum.mailId, finalProcessInboxDatum?.mailId ?? null))
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

		// process excluded rules first and then regular ones.
		const inboxRuleHandler = this.inboxRuleHandler()
		const result = await inboxRuleHandler.findMatchingInboxRule(mail, sourceFolder, true)
		if (result) {
			return (await inboxRuleHandler.getTargetFolder(result, mailboxDetail)) ?? sourceFolder
		}

		return sourceFolder
	}
}
