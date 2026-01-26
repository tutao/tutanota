import { Mail, MailDetails, MailSet } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { assertNotNull } from "@tutao/tutanota-utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"

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
	public constructor(private readonly spamClassifier: SpamClassifier) {}

	public async predictSpamForNewMail(
		mail: Mail,
		mailDetails: MailDetails,
		sourceFolder: MailSet,
		folderSystem: FolderSystem,
	): Promise<{ targetFolder: MailSet; processInboxDatum: UnencryptedProcessInboxDatum }> {
		const ownerGroup = assertNotNull(mail._ownerGroup)
		const { modelInput, vectorToUpload } = await this.spamClassifier.createModelInputAndUploadVector(ownerGroup, mail, mailDetails, sourceFolder)

		const useClientSpamClassifier = !SERVER_CLASSIFIERS_TO_TRUST.has(Number(mail.serverClassifier))

		let targetFolder = sourceFolder
		if (useClientSpamClassifier && modelInput) {
			const isSpam = (await this.spamClassifier.predict(modelInput, ownerGroup)) ?? false
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
			vector: vectorToUpload,
			ownerEncMailSessionKeys: [],
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}
}
