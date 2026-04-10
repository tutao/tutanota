import { tutanotaTypeRefs } from "@tutao/typeRefs"
import { MailAuthenticationStatus, MailPhishingStatus, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { assertNotNull } from "@tutao/utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { extractServerClassifiers } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel"
import { isTutaTeamMail } from "../../../common/mailFunctionality/SharedMailUtils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { transposeGradConfig } from "@tensorflow/tfjs-core/dist/gradients/Transpose_grad"

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
		private readonly mailFacade: MailFacade,
		private readonly loginController: LoginController,
	) {}

	public async predictSpamForNewMail(
		mail: tutanotaTypeRefs.Mail,
		mailDetails: tutanotaTypeRefs.MailDetails,
		sourceFolder: tutanotaTypeRefs.MailSet,
		folderSystem: FolderSystem,
	): Promise<{ targetFolder: tutanotaTypeRefs.MailSet; processInboxDatum: UnencryptedProcessInboxDatum }> {
		const ownerGroup = assertNotNull(mail._ownerGroup)
		const { modelInput, uploadableVectorLegacy, uploadableVector } = await this.spamClassifier.createModelInputAndUploadVector(mail, mailDetails)
		const isMailMarkedAsPhishing = mail.phishingStatus === MailPhishingStatus.SUSPICIOUS

		const serverClassifiers = mail.serverClassificationData ? extractServerClassifiers(mail.serverClassificationData) : []
		const isMailClassifiedByTrustedServerClassifier = serverClassifiers.some((c) => SERVER_CLASSIFIERS_TO_TRUST.has(c))
		const isMailFromTrustedSender = await this.isMailFromTrustedSender(mail, mailDetails)
		const useClientSpamClassifier = !isMailMarkedAsPhishing && !isMailFromTrustedSender && !isMailClassifiedByTrustedServerClassifier

		let targetFolder = sourceFolder
		if (useClientSpamClassifier && modelInput) {
			const isSpam = (await this.spamClassifier.predict(modelInput, ownerGroup)) ?? false
			if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
			} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
			}
		} else if (!useClientSpamClassifier) {
			if (isMailMarkedAsPhishing) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
				console.log(`skipped spam classification for mail marked as phishing`)
			} else if (isMailFromTrustedSender) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
				console.log(`skipped spam classification for mail from trusted sender`)
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

	private async isMailFromTrustedSender(mail: tutanotaTypeRefs.Mail, mailDetails: tutanotaTypeRefs.MailDetails): Promise<boolean> {
		// check if phishingStatus is not suspicious and if the sender is a trusted sender
		const isMailFromContact = await this.isMailFromContacts(mail, mailDetails)
		const isMailFromSelf = await this.isMailFromSelf(mail, mailDetails)
		const isMailFromTutaTeam = isTutaTeamMail(mail)

		return mail.phishingStatus !== MailPhishingStatus.SUSPICIOUS && (isMailFromSelf || isMailFromTutaTeam || isMailFromContact)
	}

	private async isMailFromContacts(mail: tutanotaTypeRefs.Mail, mailDetails: tutanotaTypeRefs.MailDetails): Promise<boolean> {
		return (
			((await this.contactModel.searchForContact(mail.sender.address)) != null && mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED) ??
			false
		)
	}

	/**
	 * We check if a mail is from yourself, meaning your own user, aliases and shared mailboxes.
	 *
	 * We cannot use EncryptionAuthStatus, we verify only the authStatus for now, because EncryptionAuthStatus is not
	 * yet updated at the point this check is performed.
	 *
	 */
	private async isMailFromSelf(mail: tutanotaTypeRefs.Mail, mailDetails: tutanotaTypeRefs.MailDetails): Promise<boolean> {
		const allMailAddressesOfUser = await this.mailFacade.getAllMailAddressesForUser(this.loginController.getUserController().user)
		const isMailFromSelf = allMailAddressesOfUser.includes(mail.sender.address)
		return mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED && isMailFromSelf
	}
}
