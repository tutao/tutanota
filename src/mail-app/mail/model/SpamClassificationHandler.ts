import { Mail, MailDetails, MailSet } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailAuthenticationStatus, MailPhishingStatus, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { assertNotNull } from "@tutao/tutanota-utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { createSpamMailDatum } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../common/api/main/LoginController"

assertMainOrNode()

const TRESHOLD_FOR_SERVER_CLASSIFICATION_OVERRIDE = 96

export class SpamClassificationHandler {
	public constructor(
		private readonly spamClassifier: SpamClassifier,
		private readonly mailFacade: MailFacade,
		private readonly loginController: LoginController,
	) {}

	public async predictSpamForNewMail(
		mail: Mail,
		mailDetails: MailDetails,
		sourceFolder: MailSet,
		folderSystem: FolderSystem,
	): Promise<{ targetFolder: MailSet; processInboxDatum: UnencryptedProcessInboxDatum }> {
		const spamMailDatum = createSpamMailDatum(mail, mailDetails)

		const vectorizedMail = await this.spamClassifier.vectorize(spamMailDatum)
		const { influenceMagnitude, influenceDirection } = this.spamClassifier.extractServerSideInfluenceFromMail(mail, sourceFolder)
		const useSpamClassifier =
			influenceMagnitude < TRESHOLD_FOR_SERVER_CLASSIFICATION_OVERRIDE && (await this.shouldClassifyMailUsingSpamClassifier(mail, mailDetails))

		let targetFolder = sourceFolder
		if (useSpamClassifier) {
			// Even though [direction, clampedInfluence] are not normalized to max of MAX_WORD_FREQUENCY
			// it's fine, cause model itself is not limited by that. And we do not include these two
			// in vector Array while compressing.
			// NOTE:
			// we need to start normalising to MAX_WORD_FREQUENCY if `serverSideInfluence` field is
			// merged together with `vector`
			const modelInput = vectorizedMail.concat([influenceMagnitude, influenceMagnitude])
			const isSpam = (await this.spamClassifier.predict(modelInput, spamMailDatum.ownerGroup)) ?? false
			if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
			} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
				targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
			}
		}
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: targetFolder._id,
			classifierType: ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: await this.spamClassifier.compress(vectorizedMail),
			serverSideInfluence: String(influenceMagnitude * influenceDirection),
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}

	private async shouldClassifyMailUsingSpamClassifier(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		// classify mail using the client classifier only if the phishingStatus is not suspicious
		return mail.phishingStatus !== MailPhishingStatus.SUSPICIOUS && !(await this.isMailFromSelf(mailDetails, mail))
	}

	/**
	 * We check if a mail is from yourself, meaning your own user, aliases and shared mailboxes.
	 *
	 * We cannot use EncryptionAuthStatus, we verify only the authStatus for now, because EncryptionAuthStatus is not
	 * yet updated at the point this check is performed.
	 *
	 */
	private async isMailFromSelf(mailDetails: MailDetails, mail: Mail): Promise<boolean> {
		const allMailAddressesOfUser = await this.mailFacade.getAllMailAddressesForUser(this.loginController.getUserController().user)
		const isMailFromSelf = allMailAddressesOfUser.includes(mail.sender.address)
		return mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED && isMailFromSelf
	}

	public extractServerSideInfluenceFromMail(mail: Mail, targetFolder: MailSet) {
		return this.spamClassifier.extractServerSideInfluenceFromMail(mail, targetFolder)
	}
}
