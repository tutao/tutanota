import { Mail, MailDetails, MailFolder, MailSetEntryTypeRef, MailTypeRef } from "../../../common/api/entities/tutanota/TypeRefs"
import { getMailSetKind, MailSetKind, SimpleMoveMailTarget } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier, SpamPredMailDatum, SpamTrainMailDatum } from "../../workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { assertNotNull, isNotNull, Nullable } from "@tutao/tutanota-utils"
import { BulkMailLoader, MailWithMailDetails } from "../../workerUtils/index/BulkMailLoader"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { EntityUpdateData, isUpdateForTypeRef } from "../../../common/api/common/utils/EntityUpdateUtils"
import { isDraft } from "./MailChecks"
import { isExpectedErrorForSynchronization } from "../../../common/api/worker/rest/DefaultEntityRestCache"
import { EntityClient } from "../../../common/api/common/EntityClient"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"

export class SpamClassificationHandler {
	public constructor(
		private readonly mailFacade: MailFacade,
		private readonly spamClassifier: Nullable<SpamClassifier>,
		private readonly entityClient: EntityClient,
		private readonly bulkMailLoader: BulkMailLoader,
	) {}

	public async predictSpamForNewMail(inboxRuleOutcome: Promise<Nullable<MailFolder>>, mail: Mail, folderSystem: FolderSystem): Promise<Nullable<MailFolder>> {
		const inboxRuleTargetFolder = await inboxRuleOutcome
		if (isDraft(mail) || this.spamClassifier == null) {
			return inboxRuleTargetFolder
		}

		const usedClientSpamClassifier = ClientClassifierType.CLIENT_CLASSIFICATION

		const serverDeliveredMailFolder = assertNotNull(folderSystem.getFolderByMail(mail), `Could not get current folder for mail: ${mail._id}`)
		const serverDeliveredMailSetKind = getMailSetKind(serverDeliveredMailFolder)
		const mailIsAffectedByInboxRule = isNotNull(inboxRuleTargetFolder)
		const isStoredInSpamFolder = serverDeliveredMailSetKind === MailSetKind.SPAM
		const isNotStoredInSpamOrInbox = !isStoredInSpamFolder && serverDeliveredMailSetKind !== MailSetKind.INBOX
		const mailHasBeenInteracted = mail.isInboxRuleApplied || isNotNull(mail.clientSpamClassifierResult) || isNotStoredInSpamOrInbox

		const mailDetails = await this.downloadMailDetails(mail)
		if (mailDetails == null) {
			// maybe mailDetails was deleted in meantime?
			return serverDeliveredMailFolder
		} else if (mailIsAffectedByInboxRule || mailHasBeenInteracted) {
			const mailSetAfterInboxRule = inboxRuleTargetFolder ? getMailSetKind(inboxRuleTargetFolder) : serverDeliveredMailSetKind
			await this.storeTrainingDatum({ mail, mailDetails }, mailSetAfterInboxRule)
			return inboxRuleTargetFolder
		}

		const spamPredMailDatum: SpamPredMailDatum = {
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			ownerGroup: assertNotNull(mail._ownerGroup),
		}

		const predictedSpam = await this.spamClassifier.predict(spamPredMailDatum)
		// use the server classification for initial training, mixed with data from when user moves mails in and out of spam
		const isSpam = predictedSpam ?? isStoredInSpamFolder

		let classifierMailSetTarget: SimpleMoveMailTarget
		if (isSpam && !isStoredInSpamFolder) {
			classifierMailSetTarget = MailSetKind.SPAM
		} else if (!isSpam && isStoredInSpamFolder) {
			classifierMailSetTarget = MailSetKind.INBOX
		} else {
			return serverDeliveredMailFolder
		}

		await this.mailFacade.simpleMoveMails([mail._id], classifierMailSetTarget, usedClientSpamClassifier)
		await this.storeTrainingDatum({ mail, mailDetails }, classifierMailSetTarget)
		return assertNotNull(folderSystem.getSystemFolderByType(classifierMailSetTarget), `Could not get System folder for owner: ${mail._ownerGroup}`)
	}

	public async dropClassificationData(mailOwnerGroup: Id, mailId: IdTuple) {
		await this.spamClassifier?.deleteSpamClassification(mailOwnerGroup, mailId)
	}

	public async updateSpamClassificationData(events: ReadonlyArray<EntityUpdateData>, mail: Mail, folderSystem: FolderSystem) {
		// TODO:
		// would be nice to still update spam classification data even if spam classifier is not there yet,
		// so next time when we initialize spam classifier we can just rely on what's in this table.
		//
		// currently we can not do so bcz .getStoredClassification() is not exposed in CacheStorage or so
		if (this.spamClassifier == null) {
			return
		}

		const mailFolder = assertNotNull(folderSystem.getFolderByMail(mail), `Could not get folder for mail: ${mail._id}`)
		const mailSetKind = getMailSetKind(mailFolder)

		const changedMailSetEntry = events.find((el) => isUpdateForTypeRef(MailSetEntryTypeRef, el)) != null
		const mailHasBeenRead = !mail.unread
		if (!mailHasBeenRead && !changedMailSetEntry) {
			return
		}

		const storedClassification = await this.spamClassifier.getStoredClassification(mail)

		let isSpamConfidence = this.getSpamConfidence(mail, mailSetKind)
		const isSpam = mailSetKind === MailSetKind.SPAM

		if (isNotNull(storedClassification)) {
			// email is in classification data

			const isStoredInTrashFolder = mailSetKind === MailSetKind.TRASH
			const wasDeletedFromSpamFolder = isStoredInTrashFolder && storedClassification.isSpam
			if (wasDeletedFromSpamFolder) {
				// This is the case if we delete from spam Folder, in that case we do not need any change in storedClassification
			} else if (isSpam !== storedClassification.isSpam || isSpamConfidence !== storedClassification.isSpamConfidence) {
				// the model has trained on the mail but the spamFlag was wrong so we refit with higher isSpamConfidence
				await this.spamClassifier.updateSpamClassificationData(mail._id, isSpam, isSpamConfidence)
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

	public async storeTrainingDatum(mailWithMailDetails: MailWithMailDetails, mailFolder: MailSetKind) {
		const { mailDetails, mail } = mailWithMailDetails
		const confidence = this.getSpamConfidence(mail, mailFolder)
		const spamTrainMailDatum: SpamTrainMailDatum = {
			mailId: mail._id,
			subject: mail.subject,
			body: getMailBodyText(mailDetails.body),
			isSpam: mailFolder === MailSetKind.SPAM,
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
	public getSpamConfidence(mail: Mail, mailSetKind: MailSetKind): number {
		const isStoredInSpamFolder = mailSetKind === MailSetKind.SPAM
		const isStoredInTrashFolder = mailSetKind === MailSetKind.TRASH

		const isReadAndNotInSpamAndNotInTrash = !mail.unread && !isStoredInSpamFolder && !isStoredInTrashFolder
		if (isStoredInSpamFolder || isReadAndNotInSpamAndNotInTrash) {
			return 1
		} else {
			return 0
		}
	}
}
