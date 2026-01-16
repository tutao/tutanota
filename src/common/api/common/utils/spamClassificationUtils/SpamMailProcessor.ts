import type { HashingVectorizer } from "../../../../../mail-app/workerUtils/spamClassification/HashingVectorizer"
import { htmlToText } from "../IndexUtils"
import {
	ML_BITCOIN_REGEX,
	ML_BITCOIN_TOKEN,
	ML_CREDIT_CARD_REGEX,
	ML_CREDIT_CARD_TOKEN,
	ML_DATE_REGEX,
	ML_DATE_TOKEN,
	ML_EMAIL_ADDR_REGEX,
	ML_EMAIL_ADDR_TOKEN,
	ML_NUMBER_SEQUENCE_REGEX,
	ML_NUMBER_SEQUENCE_TOKEN,
	ML_SPACE_BEFORE_NEW_LINE_REGEX,
	ML_SPACE_BEFORE_NEW_LINE_TOKEN,
	ML_SPECIAL_CHARACTER_REGEX,
	ML_SPECIAL_CHARACTER_TOKEN,
	ML_URL_REGEX,
	ML_URL_TOKEN,
} from "./PreprocessPatterns"
import { SparseVectorCompressor } from "./SparseVectorCompressor"
import { assertNotNull, lazyAsync, lazyMemoized, tokenize } from "@tutao/tutanota-utils"
import { ClientSpamTrainingDatum, Mail, MailAddress, MailDetails, MailSet } from "../../../entities/tutanota/TypeRefs"
import { getMailBodyText } from "../../CommonMailUtils"
import { MailAuthenticationStatus, MailSetKind } from "../../TutanotaConstants"
import { splitUint8Array } from "@tutao/tutanota-utils/dist/ArrayUtils"

export type PreprocessConfiguration = {
	isPreprocessMails: boolean
	isRemoveHTML: boolean
	isReplaceDates: boolean
	isReplaceUrls: boolean
	isReplaceMailAddresses: boolean
	isReplaceBitcoinAddress: boolean
	isReplaceCreditCards: boolean
	isReplaceNumbers: boolean
	isReplaceSpecialCharacters: boolean
	isRemoveSpaceBeforeNewLine: boolean
}

export const spamClassifierTokenizer = (text: PreprocessedMailContent): string[] => tokenize(text)

export const DEFAULT_PREPROCESS_CONFIGURATION: PreprocessConfiguration = {
	isPreprocessMails: true,
	isRemoveHTML: true,
	isReplaceDates: true,
	isReplaceUrls: true,
	isReplaceMailAddresses: true,
	isReplaceBitcoinAddress: true,
	isReplaceCreditCards: true,
	isReplaceNumbers: true,
	isReplaceSpecialCharacters: true,
	isRemoveSpaceBeforeNewLine: true,
}

export type SpamMailDatum = {
	subject: string
	body: string
	ownerGroup: Id
	sender: string
	toRecipients: string
	ccRecipients: string
	bccRecipients: string
	authStatus: string
	serverClassifier: number
	serverIsSpam: boolean
}

export type PreprocessedMailContent = string

/**
 * # Format stored in server:
 * compressedMailVector + 1byte number ( serverClassifier ) + 1 byte number ( boolean for severSpamDecision )
 *
 * # Format passed to model
 * {@link DEFAULT_VECTOR_MAX_LENGTH } // mail vector
 * + 1 // serverIsSpam
 * + {@link SpamTrainingDatumV1#serverSideClassifierCount} // serverClassifierType
 */

export class SpamMailProcessor {
	constructor(
		private readonly preprocessConfiguration: PreprocessConfiguration = DEFAULT_PREPROCESS_CONFIGURATION,
		private readonly sparseVectorCompressor: SparseVectorCompressor = new SparseVectorCompressor(),
		private readonly vectorizer: lazyAsync<HashingVectorizer> = lazyMemoized(async () => {
			const { HashingVectorizer } = await import("../../../../../mail-app/workerUtils/spamClassification/HashingVectorizer")
			return new HashingVectorizer(this.sparseVectorCompressor.dimension)
		}),
	) {}

	// visibleForTesting
	public preprocessMail(mail: SpamMailDatum): PreprocessedMailContent {
		const mailText = this.concatSubjectAndBody(mail)

		if (!this.preprocessConfiguration.isPreprocessMails) {
			return mailText
		}

		let preprocessedMail = mailText

		// 1. Remove HTML code
		if (this.preprocessConfiguration.isRemoveHTML) {
			preprocessedMail = htmlToText(preprocessedMail)
		}

		// 2. Replace dates
		if (this.preprocessConfiguration.isReplaceDates) {
			for (const datePattern of ML_DATE_REGEX) {
				preprocessedMail = preprocessedMail.replaceAll(datePattern, ML_DATE_TOKEN)
			}
		}

		// 3. Replace urls
		if (this.preprocessConfiguration.isReplaceUrls) {
			preprocessedMail = preprocessedMail.replaceAll(ML_URL_REGEX, ML_URL_TOKEN)
		}

		// 4. Replace email addresses
		if (this.preprocessConfiguration.isReplaceMailAddresses) {
			preprocessedMail = preprocessedMail.replaceAll(ML_EMAIL_ADDR_REGEX, ML_EMAIL_ADDR_TOKEN)
		}

		// 5. Replace Bitcoin addresses
		if (this.preprocessConfiguration.isReplaceBitcoinAddress) {
			preprocessedMail = preprocessedMail.replaceAll(ML_BITCOIN_REGEX, ML_BITCOIN_TOKEN)
		}

		// 6. Replace credit card numbers
		if (this.preprocessConfiguration.isReplaceCreditCards) {
			preprocessedMail = preprocessedMail.replaceAll(ML_CREDIT_CARD_REGEX, ML_CREDIT_CARD_TOKEN)
		}

		// 7. Replace remaining numbers
		if (this.preprocessConfiguration.isReplaceNumbers) {
			preprocessedMail = preprocessedMail.replaceAll(ML_NUMBER_SEQUENCE_REGEX, ML_NUMBER_SEQUENCE_TOKEN)
		}

		// 8. Remove special characters
		if (this.preprocessConfiguration.isReplaceSpecialCharacters) {
			preprocessedMail = preprocessedMail.replaceAll(ML_SPECIAL_CHARACTER_REGEX, ML_SPECIAL_CHARACTER_TOKEN)
		}

		// 9. Remove spaces at end of lines
		if (this.preprocessConfiguration.isRemoveSpaceBeforeNewLine) {
			preprocessedMail = preprocessedMail.replaceAll(ML_SPACE_BEFORE_NEW_LINE_REGEX, ML_SPACE_BEFORE_NEW_LINE_TOKEN)
		}

		preprocessedMail += this.getHeaderFeatures(mail)

		return preprocessedMail
	}

	private concatSubjectAndBody(mail: SpamMailDatum) {
		const subject = mail.subject || ""
		const body = mail.body || ""
		const concatenated = `${subject}\n${body}`.trim()

		return concatenated.length > 0 ? concatenated : " "
	}

	private getHeaderFeatures(mail: SpamMailDatum): string {
		const { sender, toRecipients, ccRecipients, bccRecipients, authStatus } = mail
		return `\n${sender}\n${toRecipients}\n${ccRecipients}\n${bccRecipients}\n${authStatus}`
	}

	public async getModelInputFromTrainingDatum(spaceForServerResult: number, datum: ClientSpamTrainingDatum): Promise<number[]> {
		// actual number of classifier is :
		// spaceNeeded for serverSpamResult - space for isSpam (1)
		// since +1 is applied already while uploading, we do not need to handle UNKNOWN case any special way
		const nmbrOfServerClassifierDuringModelTraining = spaceForServerResult - 1

		const [compressedMailVector, [serverIsSpam, unboundedServerClassifier]] = splitUint8Array(datum.vector, -2)
		const decompressedMailVector = this.sparseVectorCompressor.decompress(compressedMailVector)

		return decompressedMailVector
			.concat(serverIsSpam ? 1 : 0)
			.concat(this.oneHotEncode(nmbrOfServerClassifierDuringModelTraining, unboundedServerClassifier))
	}

	public async makeVectorizedMail(datum: SpamMailDatum) {
		const vectorizer = await this.vectorizer()
		const preprocessedMail = this.preprocessMail(datum)
		const tokenizedMail = spamClassifierTokenizer(preprocessedMail)
		return await vectorizer.vectorize(tokenizedMail)
	}

	public async makeModelInputFromMailDatum(spaceForServerResult: number, datum: SpamMailDatum, vectorizedMail: number[]): Promise<number[]> {
		// since we reserve `0` for classifier that does not fit into current dimension yet ( UNKNOWN ),
		// always shift actual classifier number
		const unboundedServerClassifier = datum.serverClassifier + 1
		// actual number of classifier is :
		// spaceNeeded for serverSpamResult - space for isSpam (1)
		const nmbrOfServerClassifierDuringModelTraining = spaceForServerResult - 1
		const modelInput = vectorizedMail
			.concat(datum.serverIsSpam ? 1 : 0)
			.concat(this.oneHotEncode(nmbrOfServerClassifierDuringModelTraining, unboundedServerClassifier))

		return modelInput
	}

	public async makeUploadVectorFromMailDatum(datum: SpamMailDatum, vectorizedMail: number[]): Promise<Uint8Array> {
		// since we reserve `0` for classifier that does not fit into current dimension yet ( UNKNOWN ),
		// always shift actual classifier number
		const unboundedServerClassifier = datum.serverClassifier + 1

		const compressedVector = this.sparseVectorCompressor.compress(vectorizedMail)
		const serverResult = [datum.serverIsSpam ? 1 : 0, unboundedServerClassifier]
		const vectorToUpload = new Uint8Array(compressedVector.length + serverResult.length)
		vectorToUpload.set(compressedVector, 0)
		vectorToUpload.set(serverResult, compressedVector.length)

		return vectorToUpload
	}

	private oneHotEncode(maxRange: number, numberToEncode: number): number[] {
		const clampedIndex = numberToEncode > maxRange ? 0 : numberToEncode
		const result = new Array<number>(maxRange).fill(0)
		result[clampedIndex] = 1
		return result
	}
}

export function createSpamMailDatum(mail: Mail, mailDetails: MailDetails, currentFolder: MailSet) {
	const spamMailDatum: SpamMailDatum = {
		subject: mail.subject,
		body: getMailBodyText(mailDetails.body),
		ownerGroup: assertNotNull(mail._ownerGroup),
		serverIsSpam: currentFolder.folderType === MailSetKind.SPAM,
		serverClassifier: Number(mail.serverClassifier),
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

export const DEFAULT_IS_SPAM_CONFIDENCE = "1"

export function getSpamConfidence(mail: Mail): string {
	return mail.clientSpamClassifierResult?.confidence ?? DEFAULT_IS_SPAM_CONFIDENCE
}

/**
 * We pick a max word frequency of 2^5 so that we can compress it together
 * with the index (which is 2^11 =2048) into two bytes
 */
export const MAX_WORD_FREQUENCY = 31
export const DEFAULT_VECTOR_MAX_LENGTH = 2048
