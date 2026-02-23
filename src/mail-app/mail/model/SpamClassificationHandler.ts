import { Mail, MailDetails, MailSet } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailAuthenticationStatus, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { assertNotNull } from "@tutao/tutanota-utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { extractServerClassifiers } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel"

assertMainOrNode()

/// tutadb ClassifierType
/// If this classifier decided something in serverSide already, we can trust the decision
/// and not run predictional locally
export const SERVER_CLASSIFIERS_TO_TRUST = Object.freeze(
	new Set<number>([
		2, 14, 22, 5, 6, 4, 8, 23,
		/// NOTE: Generate from: tutadb#ClassifierTypeTest#tutanota3_SERVER_CLASSIFIERS_TO_TRUST
	]),
)

export class SpamClassificationHandler {
	public constructor(
		private readonly spamClassifier: SpamClassifier,
		private readonly contactModel: ContactModel,
	) {}

	public async predictSpamForNewMail(
		mail: Mail,
		mailDetails: MailDetails,
		sourceFolder: MailSet,
		folderSystem: FolderSystem,
	): Promise<{ targetFolder: MailSet; processInboxDatum: UnencryptedProcessInboxDatum }> {
		const ownerGroup = assertNotNull(mail._ownerGroup)
		const { modelInput, uploadableVectorLegacy, uploadableVector } = await this.spamClassifier.createModelInputAndUploadVector(mail, mailDetails)
		const serverClassifiers = mail.serverClassificationData ? extractServerClassifiers(mail.serverClassificationData) : []
		const isMailFromAContact = await this.isMailFromContacts(mail, mailDetails)
		const isMailClassifiedByTrustedServerClassifier = serverClassifiers.some((c) => SERVER_CLASSIFIERS_TO_TRUST.has(c))
		const useClientSpamClassifier = !isMailClassifiedByTrustedServerClassifier && !isMailFromAContact

		let targetFolder = sourceFolder
		if (useClientSpamClassifier && modelInput) {
			const isSpam = (await this.spamClassifier.predict(modelInput, ownerGroup)) ?? false
			if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
			} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
			}
		} else if (!useClientSpamClassifier) {
			if (isMailFromAContact) {
				console.log(`skipped spam classification for mail from contacts ${mail.sender.address}`)
			} else if (isMailClassifiedByTrustedServerClassifier) {
				console.log(`skipped spam classification for new mail because of trusted server classifiers ${serverClassifiers} for ownerGroup ${ownerGroup}`)
			}
		}

		const processInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: targetFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vectorLegacy: uploadableVectorLegacy,
			vectorWithServerClassifiers: uploadableVector,
			ownerEncMailSessionKeys: [],
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}

	private async isMailFromContacts(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		return (
			((await this.contactModel.searchForContact(mail.sender.address)) != null && mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED) ??
			false
		)
	}
}
