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
import { assertNotNull, lazyAsync, lazyMemoized, splitUint8Array, tokenize } from "@tutao/tutanota-utils"
import { ClientSpamTrainingDatum, Mail, MailAddress, MailDetails } from "../../../entities/tutanota/TypeRefs"
import { getMailBodyText } from "../../CommonMailUtils"
import { MailAuthenticationStatus } from "../../TutanotaConstants"

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
	serverClassificationData: string | null
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
		public readonly byteForServerClassificationData: number = BYTES_FOR_SERVER_CLASSIFICATION_DATA,
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

	private extractCompressedVectorParts(vector: Uint8Array): { compressedVectorizedMail: Uint8Array; compressedServerClassificationData: Uint8Array } {
		const [lengthBytes, rest] = splitUint8Array(vector, 2)
		const length = this.sparseVectorCompressor.decodeCompressedVectorLength(lengthBytes)
		const [compressedVectorizedMail, compressedServerClassificationData] = splitUint8Array(rest, length)
		return {
			compressedVectorizedMail,
			compressedServerClassificationData,
		}
	}

	/**
	 * Takes a ClientSpamTrainingDatum and prepares model input from it as a number array.
	 * The model input is a concatenation of the vectorized mail and the server classification data
	 */
	public async processClientSpamTrainingDatum(
		datum: ClientSpamTrainingDatum,
		clientVectorSize: number = DEFAULT_VECTOR_MAX_LENGTH,
		serverVectorSize: number = BYTES_FOR_SERVER_CLASSIFICATION_DATA,
	): Promise<number[]> {
		if (datum.vectorNewFormat) {
			const parts = this.extractCompressedVectorParts(datum.vectorNewFormat)
			const vectorizedMail = this.sparseVectorCompressor.decompress(parts.compressedVectorizedMail, clientVectorSize)
			const serverClassificationData = this.sparseVectorCompressor.decompress(parts.compressedServerClassificationData, serverVectorSize)
			return vectorizedMail.concat(serverClassificationData)
		} else {
			// FIXME: if we are here, then the downloaded ClientSpamTrainingDatum does not have the new vector. Do we need to upload/update the ClientSpamTraininDatum?
			// FIXME: answer: no, as we we won't have spamClassificationData on old mails and it's possible the mail is not even there anymore, how would you update?
			const vectorizedMail = this.sparseVectorCompressor.decompress(datum.vector, clientVectorSize)
			return vectorizedMail.concat(new Array<number>(serverVectorSize).fill(0))
		}
	}

	public async makeVectorizedMail(datum: SpamMailDatum) {
		const vectorizer = await this.vectorizer()
		const preprocessedMail = this.preprocessMail(datum)
		const tokenizedMail = spamClassifierTokenizer(preprocessedMail)
		return await vectorizer.vectorize(tokenizedMail)
	}

	/**
	 * Takes a SpamMailDatum and gives Model Input vector
	 * @param datum
	 * @param serverVectorSize
	 */
	public async processSpamMailDatum(datum: SpamMailDatum, serverVectorSize: number = BYTES_FOR_SERVER_CLASSIFICATION_DATA): Promise<number[]> {
		const vectorizedMail = await this.makeVectorizedMail(datum)
		if (datum.serverClassificationData) {
			return vectorizedMail.concat(this.oneHotEncodeServerClassifiers(datum.serverClassificationData, serverVectorSize))
		} else {
			return vectorizedMail.concat(new Array<number>(serverVectorSize).fill(0))
		}
	}

	public async makeUploadableVectors(
		datum: SpamMailDatum,
		serverVectorSize: number = BYTES_FOR_SERVER_CLASSIFICATION_DATA,
	): Promise<{
		uploadableVectorLegacy: Uint8Array
		uploadableVector: Uint8Array
	}> {
		const vectorizedMail = await this.makeVectorizedMail(datum)
		const uploadableVectorLegacy = this.sparseVectorCompressor.compress(vectorizedMail)
		const compressedVectorSize = uploadableVectorLegacy.length
		// this will be a zero array if we pass an empty string to one-hot encode
		const oneHotEncodedServerData = this.oneHotEncodeServerClassifiers(datum.serverClassificationData ?? "", serverVectorSize)
		const compressedServerClassificationData = this.sparseVectorCompressor.compress(oneHotEncodedServerData)

		const uploadableVector = new Uint8Array([
			...this.sparseVectorCompressor.encodeCompressedVectorLength(compressedVectorSize),
			...uploadableVectorLegacy,
			...compressedServerClassificationData,
		])
		return { uploadableVectorLegacy, uploadableVector }
	}

	public oneHotEncodeServerClassifiers(serverClassificationData: string, serverVectorSize: number = BYTES_FOR_SERVER_CLASSIFICATION_DATA): number[] {
		let result = new Array<number>(serverVectorSize).fill(0)
		const classifierTuples = serverClassificationData.split(":")
		for (const tuple of classifierTuples) {
			const [isSpam, classifier] = tuple.split(",").map((x) => parseInt(x))
			result[2 * classifier] = isSpam
			result[2 * classifier + 1] = 1
		}
		// FIXME: dude!
		// FIXME throw a meaningful error if the serverClassificationData is malformed
		if (result.length !== serverVectorSize) throw new Error("yooo!")
		return result
	}

	public getModelInputSize() {
		return this.vectorizer().then((vectorizer) => vectorizer.dimension + this.byteForServerClassificationData)
	}

	public getVectorDimension() {
		return this.vectorizer().then((vectorizer) => vectorizer.dimension)
	}
}

export function createSpamMailDatum(mail: Mail, mailDetails: MailDetails) {
	const spamMailDatum: SpamMailDatum = {
		subject: mail.subject,
		body: getMailBodyText(mailDetails.body),
		ownerGroup: assertNotNull(mail._ownerGroup),
		serverClassificationData: mail.serverClassificationData,
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

export function extractServerClassifiers(serverClassificationData: string): number[] {
	return serverClassificationData.split(":").map((tuple) => parseInt(tuple.split(",")[1]))
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

export const BYTES_COMPRESSED_MAIL_VECTOR_LENGTH = 2

/**
 * Number of reserved bytes required to store server spam result
 */
export const BYTES_FOR_SERVER_CLASSIFICATION_DATA = 256
