import { createMoveMailData, Mail, MailDetails, MailFolder, MoveMailData } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailSetKind, ProcessingState, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier, SpamPredMailDatum, SpamTrainMailDatum } from "./SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { assertNotNull, debounce, isNotNull, Nullable, ofClass } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { LockedError, PreconditionFailedError } from "../../../common/api/common/error/RestError"

const DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS = 500
const DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS = 1000

const DEFAULT_IS_SPAM_CONFIDENCE = 1
const DEFAULT_IS_SPAM = false

export class SpamClassificationHandler {
	public constructor(
		private readonly mailFacade: MailFacade,
		private readonly spamClassifier: Nullable<SpamClassifier>,
	) {}

	hamMoveMailData: MoveMailData | null = null
	spamMoveMailData: MoveMailData | null = null
	classifierResultServiceMailIds: IdTuple[] = []

	sendClassifierResultServiceRequest = debounce(DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS, async (mailFacade: MailFacade) => {
		// Each update to ClientClassifierResultService (for mails that did not move) requires one request
		// We debounce the requests to a rate of DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS
		if (this.classifierResultServiceMailIds.length) {
			const mailIds = this.classifierResultServiceMailIds
			this.classifierResultServiceMailIds = []
			return mailFacade.updateMailPredictionState(mailIds, ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE)
		}
	})

	sendMoveMailServiceRequest = debounce(DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS, async (mailFacade: MailFacade) => {
		// Each update to MoveMailService (for ham or spam mails that did move) requires one request
		// We debounce the requests to a rate of DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS
		if (this.hamMoveMailData) {
			const moveMailData = this.hamMoveMailData
			this.hamMoveMailData = null
			await this.sendMoveMailRequest(mailFacade, moveMailData)
		}
		if (this.spamMoveMailData) {
			const moveMailData = this.spamMoveMailData
			this.spamMoveMailData = null
			await this.sendMoveMailRequest(mailFacade, moveMailData)
		}
	})

	async sendMoveMailRequest(mailFacade: MailFacade, moveMailData: MoveMailData): Promise<void> {
		mailFacade
			.moveMails(moveMailData.mails, moveMailData.targetFolder, null, ClientClassifierType.CLIENT_CLASSIFICATION)
			.catch(
				ofClass(LockedError, (e) => {
					// LockedError should no longer be thrown!?!
					console.log("moving mails failed", e, moveMailData.targetFolder)
				}),
			)
			.catch(
				ofClass(PreconditionFailedError, (e) => {
					// move mail operation may have been locked by other process
					console.log("moving mails failed", e, moveMailData.targetFolder)
				}),
			)
	}

	public async predictSpamForNewMail(mail: Mail, mailDetails: MailDetails, sourceFolder: MailFolder, folderSystem: FolderSystem): Promise<MailFolder> {
		const spamPredMailDatum: SpamPredMailDatum = {
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			ownerGroup: assertNotNull(mail._ownerGroup),
		}
		const isSpam = (await this.spamClassifier?.predict(spamPredMailDatum)) ?? null

		if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
			const spamFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
			if (this.spamMoveMailData) {
				this.spamMoveMailData.mails.push(mail._id)
			} else {
				this.spamMoveMailData = createMoveMailData({
					targetFolder: spamFolder?._id,
					mails: [mail._id],
					excludeMailSet: null,
					moveReason: ClientClassifierType.CLIENT_CLASSIFICATION,
				})
			}
			await this.sendMoveMailServiceRequest(this.mailFacade)
			return spamFolder
		} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
			const hamFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
			if (this.hamMoveMailData) {
				this.hamMoveMailData.mails.push(mail._id)
			} else {
				this.hamMoveMailData = createMoveMailData({
					targetFolder: hamFolder?._id,
					mails: [mail._id],
					excludeMailSet: null,
					moveReason: ClientClassifierType.CLIENT_CLASSIFICATION,
				})
			}
			await this.sendMoveMailServiceRequest(this.mailFacade)
			return hamFolder
		} else if (mail.processingState !== ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE) {
			this.classifierResultServiceMailIds.push(mail._id)
			await this.sendClassifierResultServiceRequest(this.mailFacade)
			return sourceFolder
		} else {
			return sourceFolder
		}
	}

	public async updateSpamClassificationData(mail: Mail) {
		if (this.spamClassifier == null || mail.clientSpamClassifierResult == null) {
			return
		}
		const storedClassification = await this.spamClassifier.getSpamClassification(mail._id)
		const isSpam = mail.clientSpamClassifierResult.spamDecision === SpamDecision.BLACKLIST
		const isSpamConfidence = getSpamConfidence(mail)

		if (isNotNull(storedClassification) && (isSpam !== storedClassification.isSpam || isSpamConfidence !== storedClassification.isSpamConfidence)) {
			// the model has trained on the mail but the spamFlag was wrong so we refit with higher isSpamConfidence
			await this.spamClassifier.updateSpamClassification(mail._id, isSpam, isSpamConfidence)
		}
	}

	public async dropClassificationData(mailId: IdTuple) {
		await this.spamClassifier?.deleteSpamClassification(mailId)
	}

	public async storeTrainingDatum(mail: Mail, mailDetails: MailDetails) {
		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			isSpam: DEFAULT_IS_SPAM,
			isSpamConfidence: DEFAULT_IS_SPAM_CONFIDENCE,
			ownerGroup: assertNotNull(mail._ownerGroup),
		}
		await this.spamClassifier?.storeSpamClassification(spamTrainMailDatum)
	}
}

export function getSpamConfidence(mail: Mail): number {
	return Number(mail.clientSpamClassifierResult?.confidence ?? DEFAULT_IS_SPAM_CONFIDENCE)
}
