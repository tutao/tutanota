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
import { Mail, MailAddress, MailDetails } from "../../../entities/tutanota/TypeRefs"
import { getMailBodyText } from "../../CommonMailUtils"
import { MailAuthenticationStatus } from "../../TutanotaConstants"
import { ProgrammingError } from "../../error/ProgrammingError"

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
}

export type PreprocessedMailContent = string

export class SpamMailProcessor {
	constructor(
		private readonly preprocessConfiguration: PreprocessConfiguration = DEFAULT_PREPROCESS_CONFIGURATION,
		private readonly sparseVectorCompressor: SparseVectorCompressor = new SparseVectorCompressor(),
		private readonly vectorizer: lazyAsync<HashingVectorizer> = lazyMemoized(async () => {
			const { HashingVectorizer } = await import("../../../../../mail-app/workerUtils/spamClassification/HashingVectorizer")
			return new HashingVectorizer(this.sparseVectorCompressor.dimension)
		}),
	) {}

	public async vectorizeAndCompress(spamMailDatum: SpamMailDatum): Promise<Uint8Array> {
		const vector = await this.vectorize(spamMailDatum)
		return this.compress(vector)
	}

	public async vectorize(spamMailDatum: SpamMailDatum): Promise<number[]> {
		const vectorizer = await this.vectorizer()
		const preprocessedMail = this.preprocessMail(spamMailDatum)
		const tokenizedMail = spamClassifierTokenizer(preprocessedMail)
		return await vectorizer.vectorize(tokenizedMail)
	}

	private async compress(uncompressedVector: number[]): Promise<Uint8Array> {
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
