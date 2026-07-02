import { assertMainOrNode, MailAuthenticationStatus } from "../../../../platform-kit/app-env"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { extractServerClassifiers } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel"
import { isTutaTeamMail } from "../../../common/mailFunctionality/SharedMailUtils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { Mail, MailDetails } from "@tutao/entities/tutanota"
import { MailPhishingStatus } from "../../../../entities/tutanota/Utils"

assertMainOrNode()

/// tutadb ClassifierType
/// If this classifier decided something in serverSide already, we can trust the decision
/// and not run predictional locally
export const SERVER_CLASSIFIERS_TO_TRUST = Object.freeze(
	new Set<number>([
		6, 28, 2, 27, 23, 26, 22, 14, 5, 4, 8,
		/// NOTE: Generate from: tutadb#ClassifierTypeTest#tutanota3_SERVER_CLASSIFIERS_TO_TRUST
	]),
)

export const enum SkipClientSpamClassificationReason {
	None, // no reason to skip, do client spam classification
	MarkedAsPhishing,
	FromTrustedSender,
	ClassifiedByTrustedServerClassifier,
}

export class SpamClassificationHandler {
	public constructor(
		private readonly spamClassifier: SpamClassifier,
		private readonly contactModel: ContactModel,
		private readonly mailFacade: MailFacade,
		private readonly loginController: LoginController,
	) {}

	public async predictSpamForNewMail(modelInput: number[], ownerGroup: Id): Promise<boolean> {
		return (await this.spamClassifier.predict(modelInput, ownerGroup)) ?? false
	}

	public async preparePredictSpamForNewMail(
		mail: Mail,
		mailDetails: MailDetails,
	): Promise<{
		modelInput: number[]
		uploadableVectorLegacy: Uint8Array
		uploadableVector: Uint8Array
		skipPredictionReason: SkipClientSpamClassificationReason
	}> {
		const skipPredictionReason = await this.getSkipClientClassificationReason(mail, mailDetails)
		const { modelInput, uploadableVectorLegacy, uploadableVector } = await this.spamClassifier.createModelInputAndUploadVector(mail, mailDetails)

		return { skipPredictionReason, modelInput, uploadableVectorLegacy, uploadableVector }
	}

	private async getSkipClientClassificationReason(mail: Mail, mailDetails: MailDetails): Promise<SkipClientSpamClassificationReason> {
		if (mail.phishingStatus === MailPhishingStatus.SUSPICIOUS) {
			return SkipClientSpamClassificationReason.MarkedAsPhishing
		} else if (await this.isMailFromTrustedSender(mail, mailDetails)) {
			return SkipClientSpamClassificationReason.FromTrustedSender
		} else if (this.isMailClassifiedByTrustedServerClassifier(mail)) {
			return SkipClientSpamClassificationReason.ClassifiedByTrustedServerClassifier
		} else {
			return SkipClientSpamClassificationReason.None
		}
	}

	private isMailClassifiedByTrustedServerClassifier(mail: Mail): boolean {
		if (!mail.serverClassificationData) {
			return false
		}
		return extractServerClassifiers(mail.serverClassificationData).some((c) => SERVER_CLASSIFIERS_TO_TRUST.has(c))
	}

	private async isMailFromTrustedSender(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		// check if phishingStatus is not suspicious and if the sender is a trusted sender
		const isMailFromContact = await this.isMailFromContacts(mail, mailDetails)
		const isMailFromSelf = await this.isMailFromSelf(mail, mailDetails)
		const isMailFromTutaTeam = isTutaTeamMail(mail)

		return mail.phishingStatus !== MailPhishingStatus.SUSPICIOUS && (isMailFromSelf || isMailFromTutaTeam || isMailFromContact)
	}

	private async isMailFromContacts(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
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
	private async isMailFromSelf(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		const allMailAddressesOfUser = await this.mailFacade.getAllMailAddressesForUser(this.loginController.getUserController().user)
		const isMailFromSelf = allMailAddressesOfUser.includes(mail.sender.address)
		return mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED && isMailFromSelf
	}
}
