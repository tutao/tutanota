import { createMoveMailData, Mail, MailDetails, MailFolder, MoveMailData } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailSetKind, ProcessingState, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier, SpamPredMailDatum, SpamTrainMailDatum } from "../../workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { assertNotNull, debounce, isNotNull, Nullable, ofClass } from "@tutao/tutanota-utils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { LockedError, PreconditionFailedError } from "../../../common/api/common/error/RestError"

const DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS = 500
const DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS = 1000

const DEFAULT_IS_SPAM_CONFIDENCE = 1
const DEFAULT_IS_SPAM = true

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
			return mailFacade.updateMailProcessingState(mailIds, ProcessingState.INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE)
		}
	})

	sendMoveMailServiceRequest = debounce(DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS, async (mailFacade: MailFacade) => {
		// Each update to MoveMailService (for ham or spam mails that did move) requires one request
		// We debounce the requests to a rate of DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS
		await this.sendMoveMailRequest(mailFacade, this.hamMoveMailData)
		await this.sendMoveMailRequest(mailFacade, this.spamMoveMailData)
	})

	async sendMoveMailRequest(mailFacade: MailFacade, moveMailData: MoveMailData | null): Promise<void> {
		if (moveMailData) {
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
	}

	public async predictSpamForNewMail(mail: Mail, folder: MailFolder, folderSystem: FolderSystem): Promise<void> {
		const mailDetails = await this.mailFacade.loadMailDetailsBlob(mail)

		const spamPredMailDatum: SpamPredMailDatum = {
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			ownerGroup: assertNotNull(mail._ownerGroup),
		}
		const isSpam = (await this.spamClassifier?.predict(spamPredMailDatum)) ?? null

		if (isSpam && folder.folderType === MailSetKind.INBOX) {
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
			this.sendMoveMailServiceRequest(this.mailFacade)
		} else if (!isSpam && folder.folderType === MailSetKind.SPAM) {
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
			this.sendMoveMailServiceRequest(this.mailFacade)
		} else {
			this.classifierResultServiceMailIds.push(mail._id)
			this.sendClassifierResultServiceRequest(this.mailFacade)
		}
	}

	public async updateSpamClassificationData(mail: Mail) {
		if (this.spamClassifier == null) {
			return
		}
		const storedClassification = await this.spamClassifier.getSpamClassification(mail._id)
		const isSpam = mail.clientSpamClassifierResult?.spamDecision === SpamDecision.BLACKLIST
		const isSpamConfidence = this.getSpamConfidence(mail)

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

	// visibleForTesting
	public getSpamConfidence(mail: Mail): number {
		return Number(mail.clientSpamClassifierResult?.confidence ?? DEFAULT_IS_SPAM_CONFIDENCE)
	}
}
