// The patterns in this file capture variations of their kind, but are only approximations!
// DO NOT use them for validating dates, credit cards, etc.

export const ML_DATE_REGEX = [
	/\b(?<!-)(?:\d{1,2}-){2}(?:\d\d|\d{4})(?!-)\b/g, // 01-12-2023 | 1-12-2023
	/\b(?<!\.)(?:\d{1,2}\.){2}(?:\d\d|\d{4})(?!\.)\b/g, // 01.12.2023 | 1.12.2023
	/\b(?:\d{1,2}\/){2}(?:\d\d|\d{4})\b/g, // 12/01/2023 | 12/1/2023 | 01/12/2023 | 1/12/2023
	/\b\d{4}(?:\/\d{1,2}){2}\b/g, // 2023/12/01 | 2023/12/1
	/\b(?<!-)\d{4}(?:-\d{1,2}){2}(?!-)\b/g, // 2023-12-01 | 2023-12-1
]

export const ML_DATE_TOKEN = " <DATE> "

export const ML_URL_REGEX = /(?:http|https|ftp|sftp):\/\/([\w.-]+)(?:\/[^\s]*)?/g

export const ML_URL_TOKEN = " <URL-$1> "

export const ML_EMAIL_ADDR_REGEX = /(?:mailto:)?[A-Za-z0-9_+\-.]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
export const ML_EMAIL_ADDR_TOKEN = " <EMAIL> "

export const ML_BITCOIN_REGEX = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g

export const ML_BITCOIN_TOKEN = " <BITCOIN> "

export const ML_CREDIT_CARD_REGEX = /\b(\d{4}\s?){4}\b|\b[0-9]\d{13,16}\b/g

export const ML_CREDIT_CARD_TOKEN = " <CREDIT-CARD> "

export const ML_NUMBER_SEQUENCE_REGEX = /\b\d+\b/g

export const ML_NUMBER_SEQUENCE_TOKEN = " <NUMBER> "

export const ML_SPECIAL_CHARACTER_REGEX = /(?<!<url-[^>]*)([!@#$%^&*()+`_=\\{}"':;?/,.~]+)(?![^<]*>)|(?!\w)[-+]+(?!\w)/g

export const ML_SPECIAL_CHARACTER_TOKEN = " <SPECIAL-CHAR> "
