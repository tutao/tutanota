import { Mail, MailDetails, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { assertNotNull } from "@tutao/tutanota-utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { ClientClassifierType } from "../../../common/api/common/ClientClassifierType"
import { createSpamMailDatum } from "../../../common/api/common/utils/spamClassificationUtils/SpamMailProcessor"
import { isSameId } from "../../../common/api/common/utils/EntityUtils"

assertMainOrNode()

export class SpamClassificationHandler {
	public constructor(private readonly spamClassifier: SpamClassifier) {}

	public async predictSpamForNewMail(
		mail: Mail,
		mailDetails: MailDetails,
		sourceFolder: MailFolder,
		folderSystem: FolderSystem,
	): Promise<{ targetFolder: MailFolder; processInboxDatum: UnencryptedProcessInboxDatum }> {
		const spamMailDatum = createSpamMailDatum(mail, mailDetails)

		const vectorizedMail = await this.spamClassifier.vectorize(spamMailDatum)
		const isSpam = (await this.spamClassifier.predict(vectorizedMail, spamMailDatum.ownerGroup)) ?? null

		let targetFolder = sourceFolder
		if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
			targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
		} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
			targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
		}
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: targetFolder._id,
			classifierType: isSameId(targetFolder._id, sourceFolder._id) ? null : ClientClassifierType.CLIENT_CLASSIFICATION,
			vector: await this.spamClassifier.vectorizeAndCompress(spamMailDatum),
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}
}
