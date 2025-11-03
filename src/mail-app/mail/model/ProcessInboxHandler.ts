import { SpamClassificationHandler } from "./SpamClassificationHandler"
import { InboxRuleHandler } from "./InboxRuleHandler"
import { Mail, MailFolder, ProcessInboxDatum } from "../../../common/api/entities/tutanota/TypeRefs"
import { FeatureType, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { assertNotNull, debounce, Nullable } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { MailboxDetail } from "../../../common/mailFunctionality/MailboxModel"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { StrippedEntity } from "../../../common/api/common/utils/EntityUtils"
import { LoginController } from "../../../common/api/main/LoginController"

assertMainOrNode()

export type UnencryptedProcessInboxDatum = Omit<StrippedEntity<ProcessInboxDatum>, "encVector" | "ownerEncVectorSessionKey"> & {
	vector: Uint8Array
}

const DEFAULT_DEBOUNCE_PROCESS_INBOX_SERVICE_REQUESTS_MS = 1000

export class ProcessInboxHandler {
	sendProcessInboxServiceRequest: (mailFacade: MailFacade) => Promise<void>

	constructor(
		private readonly logins: LoginController,
		private readonly mailFacade: MailFacade,
		private spamHandler: () => SpamClassificationHandler,
		private readonly inboxRuleHandler: () => InboxRuleHandler,
		private processedMailsByMailGroup: Map<Id, UnencryptedProcessInboxDatum[]> = new Map(),
		private readonly debounceTimeout: number = DEFAULT_DEBOUNCE_PROCESS_INBOX_SERVICE_REQUESTS_MS,
	) {
		this.sendProcessInboxServiceRequest = debounce(this.debounceTimeout, async (mailFacade: MailFacade) => {
			// we debounce the requests to a rate of DEFAULT_DEBOUNCE_PROCESS_INBOX_SERVICE_REQUESTS_MS
			if (this.processedMailsByMailGroup.size > 0) {
				// copy map to prevent inserting into map while we await the server
				const map = this.processedMailsByMailGroup
				this.processedMailsByMailGroup = new Map()
				for (const [mailGroup, processedMails] of map) {
					// send request to server
					await mailFacade.processNewMails(mailGroup, processedMails)
				}
			}
		})
	}

	public async handleIncomingMail(mail: Mail, sourceFolder: MailFolder, mailboxDetail: MailboxDetail, folderSystem: FolderSystem): Promise<MailFolder> {
		await this.logins.loadCustomizations()
		const isSpamClassificationFeatureEnabled = this.logins.isEnabled(FeatureType.SpamClientClassification)
		if (!mail.processNeeded) {
			return sourceFolder
		}

		const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)

		let finalProcessInboxDatum: Nullable<UnencryptedProcessInboxDatum> = null
		let moveToFolder: MailFolder = sourceFolder

		if (sourceFolder.folderType === MailSetKind.INBOX) {
			const result = await this.inboxRuleHandler()?.findAndApplyMatchingRule(mailboxDetail, mail, true)
			if (result) {
				const { targetFolder, processInboxDatum } = result
				finalProcessInboxDatum = processInboxDatum
				moveToFolder = targetFolder
			}
		}

		if (finalProcessInboxDatum === null) {
			if (isSpamClassificationFeatureEnabled) {
				const { targetFolder, processInboxDatum } = await this.spamHandler().predictSpamForNewMail(mail, mailDetails, sourceFolder, folderSystem)
				moveToFolder = targetFolder
				finalProcessInboxDatum = processInboxDatum
			} else {
				finalProcessInboxDatum = {
					mailId: mail._id,
					targetMoveFolder: moveToFolder._id,
					classifierType: null,
					vector: await this.mailFacade.vectorizeAndCompressMails({ mail, mailDetails }),
				}
			}
		}

		const mailGroupId = assertNotNull(mail._ownerGroup)
		if (this.processedMailsByMailGroup.has(mailGroupId)) {
			this.processedMailsByMailGroup.get(mailGroupId)?.push(finalProcessInboxDatum)
		} else {
			this.processedMailsByMailGroup.set(mailGroupId, [finalProcessInboxDatum])
		}

		// noinspection ES6MissingAwait
		this.sendProcessInboxServiceRequest(this.mailFacade)
		return moveToFolder
	}
}
