import { Mail, MailDetails, MailFolder, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, MailSetKind, SpamDecision } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier, SpamPredMailDatum, SpamTrainMailDatum } from "../../workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { assertNotNull, isNotNull, Nullable } from "@tutao/tutanota-utils"
import { BulkMailLoader, MailWithMailDetails } from "../../workerUtils/index/BulkMailLoader"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { isDraft } from "./MailChecks"
import { isExpectedErrorForSynchronization } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { WebsocketConnectivityModel } from "../../../common/misc/WebsocketConnectivityModel"

const DEFAULT_CONFIDENCE = "1"

export class SpamClassificationHandler {
	public constructor(
		private readonly mailFacade: MailFacade,
		private readonly spamClassifier: Nullable<SpamClassifier>,
		private readonly entityClient: EntityClient,
		private readonly bulkMailLoader: BulkMailLoader,
		private readonly connectivityModel: WebsocketConnectivityModel,
	) {}

	public async predictSpamForNewMail(inboxRuleOutcome: Promise<Nullable<MailFolder>>, mail: Mail, folderSystem: FolderSystem): Promise<Nullable<MailFolder>> {
		const usedClientSpamClassifier = ClientClassifierType.CLIENT_CLASSIFICATION
		const inboxRuleTargetFolder = await inboxRuleOutcome.catch((err) => {
			console.error(`Error while applying inbox rule: ${err}`)
			return null
		})
		if (isDraft(mail) || this.spamClassifier == null) {
			return inboxRuleOutcome
		}

		const mailIsAffectedByInboxRule = isNotNull(inboxRuleTargetFolder) || mail.isInboxRuleApplied
		const spamAlreadyPredicted = mail.clientSpamClassifierResult?.spamDecision !== SpamDecision.NONE
		const isLeaderClient = this.connectivityModel?.isLeader() ?? false
		const storeOnly = mailIsAffectedByInboxRule || spamAlreadyPredicted || !isLeaderClient
		const serverIsSpam = mail.clientSpamClassifierResult?.spamDecision === SpamDecision.BLACKLIST

		const mailDetails = await this.downloadMailDetails(mail)
		if (mailDetails == null) {
			// maybe mailDetails was deleted in meantime?
			return null
		} else if (storeOnly) {
			await this.storeTrainingDatum({ mail, mailDetails }, serverIsSpam)
			return inboxRuleTargetFolder
		}

		const spamPredMailDatum: SpamPredMailDatum = {
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			ownerGroup: assertNotNull(mail._ownerGroup),
		}

		const predictedSpam = await this.spamClassifier.predict(spamPredMailDatum)
		// use the server classification for initial training, mixed with data from when user moves mails in and out of spam
		const isSpam = predictedSpam ?? serverIsSpam

		if (isSpam && !serverIsSpam) {
			return await this.moveMailToTarget(mail, MailSetKind.SPAM, usedClientSpamClassifier, mailDetails, folderSystem)
		} else if (!isSpam && serverIsSpam) {
			return await this.moveMailToTarget(mail, MailSetKind.INBOX, usedClientSpamClassifier, mailDetails, folderSystem)
		} else {
			await this.storeTrainingDatum({ mail, mailDetails }, serverIsSpam)
			return null
		}
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
			const mailDetail = await this.downloadMailDetails(mail)
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

	public async downloadMail(mailId: IdTuple): Promise<Nullable<Mail>> {
		return await this.entityClient.load(MailTypeRef, mailId).catch((e) => {
			if (isExpectedErrorForSynchronization(e)) {
				return null
			}
			throw e
		})
	}

	// @visibleForTesting
	public async downloadMailDetails(mail: Mail): Promise<Nullable<MailDetails>> {
		return this.bulkMailLoader
			.loadMailDetails([mail])
			.then((mailDetails) => {
				const mailDetail = mailDetails.at(0)
				if (isNotNull(mailDetail)) {
					return mailDetail.mailDetails
				}
				return null
			})
			.catch((e) => {
				if (isExpectedErrorForSynchronization(e)) {
					return null
				}
				throw e
			})
	}

	// visible for testing
	public getSpamConfidence(mail: Mail): number {
		return Number(mail.clientSpamClassifierResult?.confidence ?? DEFAULT_CONFIDENCE)
	}
}
