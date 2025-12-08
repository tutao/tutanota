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
import { isTutanotaTeamMail } from "../../../common/mailFunctionality/SharedMailUtils"
import { LoginController } from "../../../common/api/main/LoginController"
import { ContactModel, lazyContactListId } from "../../../common/contactsFunctionality/ContactModel"

assertMainOrNode()

export class SpamClassificationHandler {
	public constructor(
		private readonly spamClassifier: SpamClassifier,
		private readonly mailFacade: MailFacade,
		private readonly loginController: LoginController,
		private readonly contactModel: ContactModel,
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
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}

	private async classifyMailUsingSpamClassifier(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		// classify mail using the client classifier only if the phishingStatus is not suspicious
		return (
			mail.phishingStatus !== MailPhishingStatus.SUSPICIOUS &&
			!(isTutanotaTeamMail(mail) || (await this.isMailFromSelf(mailDetails)) || (await this.isMailFromContacts(mail, mailDetails)))
		)
	}

	private async isMailFromSelf(mailDetails: MailDetails): Promise<boolean> {
		const allMailAddressesOfUser = await this.mailFacade.getAllMailAliasesForUser(this.loginController.getUserController().user)
		const allRecipients = mailDetails.recipients.ccRecipients.concat(mailDetails.recipients.toRecipients).concat(mailDetails.recipients.bccRecipients)
		const mailSenderIsInRecipients = allRecipients.some((recipient) => allMailAddressesOfUser.includes(recipient.address))
		return mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED && mailSenderIsInRecipients
	}

	private async isMailFromContacts(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		return (await this.contactModel.searchForContact(mail.sender.address)) != null && mailDetails.authStatus === MailAuthenticationStatus.AUTHENTICATED
	}
}
