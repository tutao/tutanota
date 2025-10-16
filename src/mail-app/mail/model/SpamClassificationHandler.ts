import { createMoveMailData, Mail, MailDetails, MailFolder, MoveMailData,MailTypeRef  } from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, MailSetKind, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier, SpamPredMailDatum, SpamTrainMailDatum } from "../../workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { assertNotNull, debounce, isNotNull, Nullable, ofClass } from "@tutao/tutanota-utils"
import { MailWithMailDetails } from "../../workerUtils/index/BulkMailLoader"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel"
import { LockedError, PreconditionFailedError } from "../../../common/api/common/error/RestError"

const DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS = 200
const DEBOUNCE_CLIENT_CLASSIFIER_RESULT_SERVICE_REQUESTS_MS = 1000

const DEFAULT_CONFIDENCE = "1"

export class SpamClassificationHandler {
	public constructor(
		private readonly mailFacade: MailFacade,
		private readonly spamClassifier: Nullable<SpamClassifier>,
		private readonly entityClient: EntityClient,
		private readonly connectivityModel: WebsocketConnectivityModel,
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
			//FIXME: change the state to reflect the enum.
			return mailFacade.updateMailProcessingState(mailIds, true)
		}
	})

	sendMoveMailServiceRequest = debounce(DEBOUNCE_MOVE_MAIL_SERVICE_REQUESTS_MS, async (mailFacade: MailFacade) => {
		return this.sendMoveMailRequest(mailFacade)
	})

	async sendMoveMailRequest(mailFacade: MailFacade): Promise<void> {
		if (this.hamMoveMailData) {
			const moveToTargetFolder = this.hamMoveMailData
			mailFacade
				.moveMails(this.hamMoveMailData.mails, moveToTargetFolder.targetFolder, null, ClientClassifierType.CLIENT_CLASSIFICATION)
				.catch(
					ofClass(LockedError, (e) => {
						//LockedError should no longer be thrown!?!
						console.log("moving mail failed", e, moveToTargetFolder)
					}),
				)
				.catch(
					ofClass(PreconditionFailedError, (e) => {
						// move mail operation may have been locked by other process
						console.log("moving mail failed", e, moveToTargetFolder)
					}),
				)
		}
	}

	public async predictSpamForNewMail(mail: Mail, folder: MailFolder, folderSystem: FolderSystem): Promise<Nullable<MailFolder>> {
		const usedClientSpamClassifier = ClientClassifierType.CLIENT_CLASSIFICATION

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

		return null
	}

    private async moveMailToTarget(
        mail: Mail,
        classifierMailSetTarget: MailSetKind.SPAM | MailSetKind.INBOX,
        usedClientSpamClassifier: ClientClassifierType.CLIENT_CLASSIFICATION,
        mailDetails: MailDetails,
        folderSystem: FolderSystem,
    ): Promise<MailFolder> {
        await this.mailFacade.simpleMoveMails([mail._id], classifierMailSetTarget, usedClientSpamClassifier)
        await this.storeTrainingDatum({ mail, mailDetails }, classifierMailSetTarget === MailSetKind.SPAM)
        return assertNotNull(folderSystem.getSystemFolderByType(classifierMailSetTarget), `Could not get System folder for owner: ${mail._ownerGroup}`)
    }

	public async dropClassificationData(mailId: IdTuple) {
		await this.spamClassifier?.deleteSpamClassification(mailId)
	}

	public async updateSpamClassificationData(mail: Mail, folderSystem: FolderSystem) {
		if (this.spamClassifier == null) {
			return
		}

		const mailFolder = assertNotNull(folderSystem.getFolderByMail(mail), `Could not get folder for mail: ${mail._id}`)
		const mailSetKind = getMailSetKind(mailFolder)

		const storedClassification = await this.spamClassifier.getSpamClassification(mail._id)

		let isSpamConfidence = this.getSpamConfidence(mail)
		const isSpam = mailSetKind === MailSetKind.SPAM

		if (isNotNull(storedClassification)) {
			// email is in classification data
			const isStoredInTrashFolder = mailSetKind === MailSetKind.TRASH
			const wasDeletedFromSpamFolder = isStoredInTrashFolder && storedClassification.isSpam
			if (wasDeletedFromSpamFolder) {
				// This is the case if we delete from spam Folder, in that case we do not need any change in storedClassification
			} else if (isSpam !== storedClassification.isSpam || isSpamConfidence !== storedClassification.isSpamConfidence) {
				// the model has trained on the mail but the spamFlag was wrong so we refit with higher isSpamConfidence
				await this.spamClassifier.updateSpamClassification(mail._id, isSpam, isSpamConfidence)
			}
		} else {
			// At this point, the mail entity, itself, is cached, so when we go to download it again, it will come from cache
			///const mailDetail = await this.downloadMailDetails(mail)
			// TODO: GET THE mail in the same way as the Create does
			const mailDetail: Nullable<MailDetails> = null
			if (isNotNull(mailDetail)) {
				const spamTrainMailDatum: SpamTrainMailDatum = {
					mailId: mail._id,
					subject: mail.subject,
					body: getMailBodyText(mailDetail.body),
					isSpam,
					isSpamConfidence,
					ownerGroup: assertNotNull(mail._ownerGroup),
				}

				await this.spamClassifier.storeSpamClassification(spamTrainMailDatum)
			} else {
				// race: mail deleted in meantime
			}
		}
	}

	public async storeTrainingDatum(mailWithMailDetails: MailWithMailDetails, isSpam: boolean) {
		const { mailDetails, mail } = mailWithMailDetails
		const confidence = this.getSpamConfidence(mail)
		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			isSpam,
			isSpamConfidence: confidence,
			ownerGroup: assertNotNull(mail._ownerGroup),
		}
		await assertNotNull(this.spamClassifier).storeSpamClassification(spamTrainMailDatum)
	}

	// visible for testing
	public getSpamConfidence(mail: Mail): number {
		return Number(mail.clientSpamClassifierResult?.confidence ?? DEFAULT_CONFIDENCE)
	}
}
