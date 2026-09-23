import { EncryptionAuthStatus, EnvProvider, MailAuthenticationStatus } from "../../../../platform-kit/app-env"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { extractServerClassifiers } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { ContactModel } from "../../../common/contactsFunctionality/ContactModel"
import { isTutaTeamMail } from "../../../common/mailFunctionality/SharedMailUtils"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { Mail, MailDetails } from "@tutao/entities/tutanota"
import { MailPhishingStatus } from "../../../../entities/tutanota/Utils"

EnvProvider.assertMainOrNode()

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
	SpoofedSender,
	ClassifiedByTrustedServerClassifier,
}

export const enum MailFromSelfPossibilities {
	MailFromSelfAuthenticated,
	MailFromSelfSpoofed,
	MailNotFromSelf,
}

export const enum SpamFilterBehavior {
	DEFAULT = "0",
	STRICT = "1",
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
		uploadableVectorLegacy: Uint8Array<ArrayBuffer>
		uploadableVector: Uint8Array<ArrayBuffer>
		skipPredictionReason: SkipClientSpamClassificationReason
	}> {
		const skipPredictionReason = await this.getSkipClientClassificationReason(mail, mailDetails)
		const { modelInput, uploadableVectorLegacy, uploadableVector } = await this.spamClassifier.createModelInputAndUploadVector(mail, mailDetails)

		return { skipPredictionReason, modelInput, uploadableVectorLegacy, uploadableVector }
	}

	private async getSkipClientClassificationReason(mail: Mail, mailDetails: MailDetails): Promise<SkipClientSpamClassificationReason> {
		const mailFromSelfResult = await this.isMailFromSelf(mail, mailDetails)
		console.log("#####DURING GET SKIP REASON, is auth? ", mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED)
		if (mail.phishingStatus === MailPhishingStatus.SUSPICIOUS) {
			return SkipClientSpamClassificationReason.MarkedAsPhishing
		} else if (mailFromSelfResult === MailFromSelfPossibilities.MailFromSelfAuthenticated || (await this.isMailFromTrustedSender(mail, mailDetails))) {
			return SkipClientSpamClassificationReason.FromTrustedSender
		} else if (mailFromSelfResult === MailFromSelfPossibilities.MailFromSelfSpoofed) {
			return SkipClientSpamClassificationReason.SpoofedSender
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
		let classifiersToTrust = SERVER_CLASSIFIERS_TO_TRUST
		// console.log("the trust:", classifiersToTrust)
		// if (deviceConfig.getSpamFilterBehavior() === SpamFilterBehavior.STRICT) {
		// 	classifiersToTrust = new Set(classifiersToTrust.values())
		// 	classifiersToTrust.add(7)
		// }
		// //mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED
		// //mail.differentEnvelopeSender check?
		// //"mailAuthFailed_msg": "Be careful when trusting this message! The verification of the sender or contents has failed, so this message might be forged!",
		//
		// console.log("afterwards?", classifiersToTrust)
		// console.log(
		// 	"passes?",
		// 	extractServerClassifiers(mail.serverClassificationData).some((c) => classifiersToTrust.has(c)),
		// )
		// console.log("EHHH?", mail.serverClassificationData)
		return extractServerClassifiers(mail.serverClassificationData).some((c) => classifiersToTrust.has(c))
	}

	private async isMailFromTrustedSender(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		// check if phishingStatus is not suspicious and if the sender is a trusted sender
		const isMailFromContact = await this.isMailFromContacts(mail, mailDetails)
		const isMailFromTutaTeam = isTutaTeamMail(mail)

		return mail.phishingStatus !== MailPhishingStatus.SUSPICIOUS && (isMailFromTutaTeam || isMailFromContact)
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
	private async isMailFromSelf(mail: Mail, mailDetails: MailDetails): Promise<MailFromSelfPossibilities> {
		const allMailAddressesOfUser = await this.mailFacade.getAllMailAddressesForUser(this.loginController.getUserController().user)
		const isMailFromSelf = allMailAddressesOfUser.includes(mail.sender.address)
		if (isMailFromSelf) {
			if (
				mail.encryptionAuthStatus === EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED &&
				mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED
			) {
				return MailFromSelfPossibilities.MailFromSelfAuthenticated
			} else {
				return MailFromSelfPossibilities.MailFromSelfSpoofed
			}
		} else {
			return MailFromSelfPossibilities.MailNotFromSelf
		}
	}
}
