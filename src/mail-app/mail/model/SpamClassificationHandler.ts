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
		let targetFolder = sourceFolder
		const vectorizedMail = await this.spamClassifier.vectorize(spamMailDatum)
		const useSpamClassifier = await this.classifyMailUsingSpamClassifier(mail, mailDetails)
		if (useSpamClassifier) {
			const isSpam = (await this.spamClassifier.predict(vectorizedMail, spamMailDatum.ownerGroup)) ?? null
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
			ownerEncMailSessionKeys: [],
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}

	private async classifyMailUsingSpamClassifier(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
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
}
