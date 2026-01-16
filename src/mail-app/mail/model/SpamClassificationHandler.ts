import { Mail, MailDetails, MailSet } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailAuthenticationStatus, MailPhishingStatus, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { assertNotNull } from "@tutao/tutanota-utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { createSpamMailDatum, MAX_WORD_FREQUENCY } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade"
import { LoginController } from "../../../common/api/main/LoginController"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

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

		const clampedServerSideInfluence = Math.max(0, Math.min(100, Number(mail.serverSideInfluence)))
		// todo: we can also trust server decision until >95 and not just ==100
		const isFullyConfidentOnServerSideClassification = clampedServerSideInfluence === 100
		const useSpamClassifier = !isFullyConfidentOnServerSideClassification && (await this.shouldClassifyMailUsingSpamClassifier(mail, mailDetails))
		const normalizedServerSideInfluence = SpamClassificationHandler.normalizeServerSideInfluence(
			clampedServerSideInfluence,
			sourceFolder.folderType === MailSetKind.SPAM,
		)
		if (useSpamClassifier) {
			const isSpam = (await this.spamClassifier.predict(vectorizedMail.concat(normalizedServerSideInfluence), spamMailDatum.ownerGroup)) ?? false
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
			serverSideInfluence: normalizedServerSideInfluence.toString(),
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}

	private async shouldClassifyMailUsingSpamClassifier(mail: Mail, mailDetails: MailDetails): Promise<boolean> {
		// classify mail using the client classifier only if the phishingStatus is not suspicious
		return mail.phishingStatus !== MailPhishingStatus.SUSPICIOUS && !(await this.isMailFromSelf(mailDetails, mail))
	}

	// visibleForTesting
	public static normalizeServerSideInfluence(nonNormalizedServerSideInfluence: number, isSpam: boolean): number {
		// nonNormalizedServerSideInfluence: a number between 0 and 100
		// 0 -> confident ham
		// MAX_WORD_FREQUENCY / 2 -> neutral
		// MAX_WORD_FREQUENCY -> confident spam
		if (nonNormalizedServerSideInfluence < 0 || nonNormalizedServerSideInfluence > 100) {
			throw new ProgrammingError("Server side influence is out of bound")
		}

		const ratio = nonNormalizedServerSideInfluence / 100
		if (isSpam) {
			// Neutral → Spam side
			// 0   -> MAX / 2
			// 100 -> MAX
			return MAX_WORD_FREQUENCY / 2 + ratio * (MAX_WORD_FREQUENCY / 2)
		} else {
			// Neutral → Ham side
			// 0   -> MAX / 2
			// 100 -> 0
			return MAX_WORD_FREQUENCY / 2 - ratio * (MAX_WORD_FREQUENCY / 2)
		}
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
