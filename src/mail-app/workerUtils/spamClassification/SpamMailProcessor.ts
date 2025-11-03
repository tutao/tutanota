import { HashingVectorizer } from "./HashingVectorizer"
import { htmlToText } from "../../../common/api/common/utils/IndexUtils"
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
import { spamClassifierTokenizer } from "./SpamClassifier"
import { SparseVectorCompressor } from "./SparseVectorCompressor"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError"

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
}

export type PreprocessedMailContent = string

export class SpamMailProcessor {
	constructor(
		private readonly preprocessConfiguration: PreprocessConfiguration = DEFAULT_PREPROCESS_CONFIGURATION,
		readonly vectorizer: HashingVectorizer = new HashingVectorizer(),
		private readonly sparseVectorCompressor: SparseVectorCompressor = new SparseVectorCompressor(),
	) {
		if (vectorizer.dimension !== sparseVectorCompressor.dimension) {
			throw new ProgrammingError(
				`a spam preprocessor was created with different dimensions. Vectorizer:${vectorizer.dimension} compressor: ${sparseVectorCompressor.dimension}`,
			)
		}
	}

	public async vectorizeAndCompress(spamMailDatum: SpamMailDatum): Promise<Uint8Array> {
		const vector = await this.vectorize(spamMailDatum)
		return this.compress(vector)
	}

	public async vectorize(spamMailDatum: SpamMailDatum): Promise<number[]> {
		const preprocessedMail = this.preprocessMail(spamMailDatum)
		const tokenizedMail = spamClassifierTokenizer(preprocessedMail)
		const vector = await this.vectorizer.vectorize(tokenizedMail)
		return vector
	}

	public async compress(uncompressedVector: number[]): Promise<Uint8Array> {
		return this.sparseVectorCompressor.vectorToBinary(uncompressedVector)
	}

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
}
