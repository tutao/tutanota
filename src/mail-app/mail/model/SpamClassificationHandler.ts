import { Mail, MailAddress, MailDetails, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs"
import { MailAuthenticationStatus, MailSetKind } from "../../../common/api/common/TutanotaConstants"
import { SpamClassifier } from "../../workerUtils/spamClassification/SpamClassifier"
import { getMailBodyText } from "../../../common/api/common/CommonMailUtils"
import { assertNotNull, Nullable } from "@tutao/tutanota-utils"
import { FolderSystem } from "../../../common/api/common/mail/FolderSystem"
import { assertMainOrNode } from "../../../common/api/common/Env"
import { UnencryptedProcessInboxDatum } from "./ProcessInboxHandler"
import { SpamMailDatum, SpamMailProcessor } from "../../workerUtils/spamClassification/SpamMailProcessor"

assertMainOrNode()

export class SpamClassificationHandler {
	public constructor(
		private readonly spamClassifier: Nullable<SpamClassifier>,
		private readonly spamMailProcessor: SpamMailProcessor = new SpamMailProcessor(),
	) {}

	public async predictSpamForNewMail(
		mail: Mail,
		mailDetails: MailDetails,
		sourceFolder: MailFolder,
		folderSystem: FolderSystem,
	): Promise<{ targetFolder: MailFolder; processInboxDatum: UnencryptedProcessInboxDatum }> {
		const spamMailDatum = createSpamMailDatum(mail, mailDetails)
		const vectorizedMail = await this.spamMailProcessor.vectorize(spamMailDatum)
		const isSpam = (await this.spamClassifier?.predict(vectorizedMail, spamMailDatum.ownerGroup)) ?? null

		let targetFolder = sourceFolder
		if (isSpam && sourceFolder.folderType === MailSetKind.INBOX) {
			targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.SPAM))
		} else if (!isSpam && sourceFolder.folderType === MailSetKind.SPAM) {
			targetFolder = assertNotNull(folderSystem.getSystemFolderByType(MailSetKind.INBOX))
		}
		const processInboxDatum: UnencryptedProcessInboxDatum = {
			mailId: mail._id,
			targetMoveFolder: targetFolder._id,
			byInboxRule: false,
			vector: await this.spamMailProcessor.compress(vectorizedMail),
		}
		return { targetFolder, processInboxDatum: processInboxDatum }
	}
}

export function createSpamMailDatum(mail: Mail, mailDetails: MailDetails) {
	const spamMailDatum: SpamMailDatum = {
		subject: mail.subject,
		body: getMailBodyText(mailDetails.body),
		ownerGroup: assertNotNull(mail._ownerGroup),
		...extractSpamHeaderFeatures(mail, mailDetails),
	}
	return spamMailDatum
}

export function extractSpamHeaderFeatures(mail: Mail, mailDetails: MailDetails) {
	const sender = joinNamesAndMailAddresses([mail?.sender])
	const { toRecipients, ccRecipients, bccRecipients } = extractRecipients(mailDetails)
	const authStatus = convertAuthStatusToSpamCategorizationToken(mail.authStatus)

	return { sender, toRecipients, ccRecipients, bccRecipients, authStatus }
}

function extractRecipients({ recipients }: MailDetails) {
	const toRecipients = joinNamesAndMailAddresses(recipients?.toRecipients)
	const ccRecipients = joinNamesAndMailAddresses(recipients?.ccRecipients)
	const bccRecipients = joinNamesAndMailAddresses(recipients?.bccRecipients)

	return { toRecipients, ccRecipients, bccRecipients }
}

function joinNamesAndMailAddresses(recipients: MailAddress[] | null) {
	return recipients?.map((recipient) => `${recipient?.name} ${recipient?.address}`).join(" ") || ""
}

function convertAuthStatusToSpamCategorizationToken(authStatus: string | null): string {
	if (authStatus === MailAuthenticationStatus.AUTHENTICATED) {
		return "TAUTHENTICATED"
	} else if (authStatus === MailAuthenticationStatus.HARD_FAIL) {
		return "THARDFAIL"
	} else if (authStatus === MailAuthenticationStatus.SOFT_FAIL) {
		return "TSOFTFAIL"
	} else if (authStatus === MailAuthenticationStatus.INVALID_MAIL_FROM) {
		return "TINVALIDMAILFROM"
	} else if (authStatus === MailAuthenticationStatus.MISSING_MAIL_FROM) {
		return "TMISSINGMAILFROM"
	}

	return ""
}
