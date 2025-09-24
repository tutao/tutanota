// The patterns in this file capture variations of their kind, but are only approximations!
// DO NOT use them for validating dates, credit cards, etc.

export const DATE_REGEX = [
	/\b(?<!-)(?:\d{1,2}-){2}(?:\d\d|\d{4})(?!-)\b/g, // 01-12-2023 | 1-12-2023
	/\b(?<!\.)(?:\d{1,2}\.){2}(?:\d\d|\d{4})(?!\.)\b/g, // 01.12.2023 | 1.12.2023
	/\b(?:\d{1,2}\/){2}(?:\d\d|\d{4})\b/g, // 12/01/2023 | 12/1/2023 | 01/12/2023 | 1/12/2023
	/\b\d{4}(?:\/\d{1,2}){2}\b/g, // 2023/12/01 | 2023/12/1
	/\b(?<!-)\d{4}(?:-\d{1,2}){2}(?!-)\b/g, // 2023-12-01 | 2023-12-1
]

export const DATE_PATTERN_TOKEN = " <DATE> "

// export const URL_PATTERN = /(?:http|https|ftp|sftp):\/\/(([\w\-+_]+\.[\w\-+_]+\/?)+)[^\s]*/g

export const URL_PATTERN = /(?:http|https|ftp|sftp):\/\/([\w.-]+)(?:\/[^\s]*)?/g

export const URL_PATTERN_TOKEN = " <URL-$1> "

export const EMAIL_ADDR_PATTERN = /(?:mailto:)?[A-Za-z0-9_+\-.]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
export const EMAIL_ADDR_PATTERN_TOKEN = " <EMAIL> "

export const BITCOIN_REGEX = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g

export const BITCOIN_PATTERN_TOKEN = " <BITCOIN> "

export const CREDIT_CARD_REGEX = /\b(\d{4}\s?){4}\b|\b[0-9]\d{13,16}\b/g

export const CREDIT_CARD_TOKEN = " <CREDIT-CARD> "

export const NUMBER_SEQUENCE_REGEX = /\b\d+\b/g

export const NUMBER_SEQUENCE_TOKEN = " <NUMBER> "

export const SPECIAL_CHARACTER_REGEX = /(?<!<url-[^>]*)([!@#$%^&*()+`_=\\{}"':;?/,.~]+)(?![^<]*>)|(?!\w)[-+]+(?!\w)/g

export const SPECIAL_CHARACTER_TOKEN = " <SPECIAL-CHAR> "
