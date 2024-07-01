import { createCreditCard, CreditCard } from "../api/entities/sys/TypeRefs.js"
import { LanguageViewModel, TranslationKey } from "../misc/LanguageViewModel.js"
import { CCViewModel } from "./SimplifiedCreditCardInput.js"
import { isValidCreditCardNumber } from "../misc/FormatValidator.js"
import { typedValues } from "@tutao/tutanota-utils"

// we're using string values to make it easy to iterate all card types
export enum CardType {
	Amex = "Amex",
	Visa = "Visa",
	Mastercard = "Mastercard",
	Maestro = "Maestro",
	Discover = "Discover",
	Other = "Other",
}

/**
 * Tries to find the credit card issuer by credit card number.
 * Therefore, it is checked whether the typed in number is in a known range.
 * Input MUST be sanitized to only contain numerical digits
 * @param cc the credit card number typed in by the user
 */
export function getCardTypeRange(cc: string): CardType {
	for (let cardType of typedValues(CardType)) {
		if (cardType === CardType.Other) continue
		for (let range of CardPrefixRanges[cardType]) {
			const lowestRange = range[0].padEnd(8, "0")
			const highestRange = range[1].padEnd(8, "9")
			const lowestCC = cc.slice(0, 8).padEnd(8, "0")
			const highestCC = cc.slice(0, 8).padEnd(8, "9")
			if (lowestRange <= lowestCC && highestCC <= highestRange) {
				return cardType
			}
		}
	}
	return CardType.Other
}

type CardSpec = { cvvLength: number | null; cvvName: string; name: string | null }

// we can't have enums with
const CardSpecs = Object.freeze({
	[CardType.Visa]: { cvvLength: 3, cvvName: "CVV", name: "Visa" },
	[CardType.Mastercard]: { cvvLength: 3, cvvName: "CVC", name: "Mastercard" },
	[CardType.Maestro]: { cvvLength: 3, cvvName: "CVV", name: "Maestro" },
	[CardType.Amex]: { cvvLength: 4, cvvName: "CSC", name: "American Express" },
	[CardType.Discover]: { cvvLength: 3, cvvName: "CVD", name: "Discover" },
	[CardType.Other]: { cvvLength: null, cvvName: "CVV", name: null },
})

// https://en.wikipedia.org/wiki/Payment_card_number
const CardPrefixRanges: Record<CardType, NumberString[][]> = Object.freeze({
	[CardType.Visa]: [["4", "4"]],
	[CardType.Mastercard]: [
		["51", "55"],
		["2221", "2720"],
	],
	[CardType.Maestro]: [
		["6759", "6759"],
		["676770", "676770"],
		["676774", "676774"],
		["5018", "5018"],
		["5020", "5020"],
		["5038", "5038"],
		["5893", "5893"],
		["6304", "6304"],
		["6759", "6759"],
		["6761", "6763"],
	],
	[CardType.Amex]: [
		["34", "34"],
		["37", "37"],
	],
	[CardType.Discover]: [
		["6011", "6011"],
		["644", "649"],
		["65", "65"],
		["622126", "622925"],
	],
	[CardType.Other]: [[]],
})
type StringInputCorrecter = (value: string, oldValue?: string) => string

const allDigits = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]
const definiteMonthDigits = ["2", "3", "4", "5", "6", "7", "8", "9"]
const secondMonthDigits = ["0", "1", "2"]
const separator = "/"
const niceSeparator = ` ${separator} `

/**
 * completely strip all whitespace from a string
 * @param s the string to clean up
 */
function stripWhitespace(s: string): string {
	return s.replace(/\s/g, "")
}

function stripNonDigits(s: string): string {
	return s.replace(/\D/g, "")
}

/**
 * true if s contains characters and all of them are digits.
 */
export function isDigitString(s: string) {
	if (s.length === 0) return false
	const matches = s.match(/\d/g)
	return matches != null && matches.length === s.length
}

/**
 * take a function that corrects whitespace on input that does not contain whitespace
 * and return one that does the same on input that contains arbitrary whitespace.
 * @param fn a function that does not deal with whitespace-containing or empty input
 */
function normalizeInput(fn: StringInputCorrecter): StringInputCorrecter {
	return (v: string, ov: string = "") => {
		v = stripWhitespace(v)
		if (v === "") return v
		ov = stripWhitespace(ov)
		return fn(v, ov)
	}
}

/*
 * take digits from the start of rest and add them to the end of ret until a non-digit is encountered.
 * discards rest from first non-digit.
 *
 * returns modified rest and ret
 */
function nomDigitsUntilLength(rest: string, ret: string, length: number): { rest: string; ret: string } {
	while (rest.length > 0 && ret.length < length) {
		const next = rest[0]
		rest = rest.slice(1)
		if (allDigits.includes(next)) {
			ret += next
		} else {
			rest = ""
			break
		}
	}
	return { rest, ret }
}

/**
 * take a date input string and a previous value to render a version that's non-ambiguous
 * and conforms to a valid prefix of the "MM / YY" or "MM / YYYY" format in the 2000-2099 date range.
 * - should work with pre-emptively adding/removing the backslash
 * - should reformat pasted input
 * - ignores invalid input characters and any leftover input.
 *
 * EXAMPLES: new, old -> output (for more, look at the CreditCardViewModelTest.ts):
 * "1" -> "1" 				ambiguous, we can't complete this
 * "00", "0" -> "0"     	invalid input character
 * "3", "" -> "03 / "       this must be march, there are no months starting with 3
 * "13", "1" -> "01 / 3"    13 as a month is invalid, the 1 must have been january and 3 part of the year
 * "01 /", "01 / 2" -> "01" pre-emptively remove backslash if the user backspaces across it
 * "0126", "" -> "01 / 26"  if the input is valid, we still add the separator even when pasting.
 *
 * @param value the new value of the (potentially partial) expiration date
 * @param oldDate the previous value, needed for some special backspace handling.
 */
export const inferExpirationDate = normalizeInput(inferNormalizedExpirationDate)

/**
 *
 * @param value non-empty string without whitespace specifying a (potentially partial) date as a sequence of 0 to 6 digits.
 * @param oldDate previous value
 */
function inferNormalizedExpirationDate(value: string, oldDate: string): string {
	if (oldDate.startsWith(value) && value.endsWith(separator)) {
		// probably used backspace. in this case, we need to remove the separator
		// in a special way to be consistent.
		return value.slice(0, -1)
	}
	if (!allDigits.includes(value[0])) return ""
	let rest = value
	let ret = ""
	if (definiteMonthDigits.includes(rest[0])) {
		// we already know what month this must be (typed without leading zero)
		ret = "0" + rest[0]
		rest = rest.slice(1)
	} else {
		// we don't know yet if we have 01, 02, ..., 09 or 10, 11, 12
		if (rest[0] === "0") {
			ret = "0"
			rest = rest.slice(1)
			if (rest[0] === "0") {
				// started with "00"
				return "0"
			} else if (allDigits.includes(rest[0])) {
				// started with "0x" x being a digit
				ret = "0" + rest[0]
				rest = rest.slice(1)
			} else {
				// started with 0x x not being a non-zero digit.
				return "0"
			}
		} else if (value.length > 1) {
			/* input started with 1 */
			rest = rest.slice(1)
			if (secondMonthDigits.includes(rest[0])) {
				ret = "1" + rest[0]
				rest = rest.slice(1)
			} else if (allDigits.includes(rest[0])) {
				// any digit other than 0,1,2 after "1" must mean january
				ret = "01"
				// not removing a slash or input that's part of the year here.
			} else if (rest[0] === separator) {
				ret = "01"
				// not stripping separator here, we do that later anyway
			} else {
				// 1x... -> x is invalid in this position
				return "1"
			}
		} else {
			/* input was exactly "1" */
			return "1"
		}
	}

	let hadSlash = false
	while (rest.startsWith(separator)) {
		hadSlash = true
		rest = rest.slice(1)
	}

	if ((ret.length === 2 && rest.length > 0) || hadSlash || value.length > oldDate.length) {
		// if there is more input or the user added a slash at the end of the month or the month just got finished,
		// we need a slash
		ret += separator
	}

	// we have a month + slash + potentially first year digit
	// rest contains only the part of the input that is relevant to the year
	;({ rest, ret } = nomDigitsUntilLength(rest, ret, "xx/xx".length))

	if (!ret.endsWith("/20")) {
		// we only consider years in the 2000-2099 range valid, which
		// means we can assume two-digit year and return.
		return ret.replace(separator, niceSeparator)
	}

	;({ ret } = nomDigitsUntilLength(rest, ret, "xx/xxxx".length))

	return ret.replace(separator, niceSeparator)
}

/**
 * take a sequence of digits and other characters, strip non-digits and group the rest into space-separated groups.
 * @param value non-empty string without whitespace specifying a (potentially partial) credit card number
 * @param groups most credit card number digits are grouped in groups of 4, but there are exceptions
 */
function groupCreditCardNumber(value: string, groups: number[] = [4, 4, 4, 4, 4]): string {
	value = stripNonDigits(value)
	value = value.slice(0, 20)
	let ret = value.slice(0, groups[0])
	value = value.slice(groups[0])
	for (let i = 1; i < groups.length && value.length > 0; i++) {
		ret += " "
		ret += value.slice(0, groups[i])
		value = value.slice(groups[i])
	}
	return ret
}

/*
 * extract a numeric month and year from an expiration date in the form "M... / Y..."
 * if the format is invalid (wrong separator, month not 1 - 12, invalid numbers, year not in 2000 - 2099 range) return null.
 * otherwise, return object containing the year and month properties.
 */
export function getExpirationMonthAndYear(expirationDate: string): { year: number; month: number } | null {
	if (expirationDate.length < "xx / xx".length || !expirationDate.includes(" / ")) {
		return null
	}
	const [monthString, yearString] = expirationDate.split(" / ").map((p) => p.trim())
	if (!isDigitString(monthString) || !isDigitString(yearString)) {
		return null
	}
	const monthNumber = Number(monthString)
	if (monthNumber < 1 || monthNumber > 12) {
		return null
	}
	const yearNumber = Number(yearString)
	if (yearString.length === 4 && yearString.startsWith("20")) {
		return {
			year: Math.floor(yearNumber) - 2000,
			month: Math.floor(monthNumber),
		}
	} else if (yearString.length === 2) {
		return {
			year: Math.floor(yearNumber),
			month: Math.floor(monthNumber),
		}
	} else {
		return null
	}
}

export class SimplifiedCreditCardViewModel implements CCViewModel {
	private _cardHolderName: string = ""
	private _creditCardNumber: string = ""
	private _cvv: string = ""
	private _expirationDate: string = ""

	private creditCardType: CardType = CardType.Other

	constructor(private readonly lang: LanguageViewModel) {}

	get expirationDate(): string {
		return this._expirationDate
	}

	set expirationDate(value: string) {
		this._expirationDate = inferExpirationDate(value, this._expirationDate)
	}

	get cvv(): string {
		return this._cvv
	}

	set cvv(value: string) {
		const correctedCvv = stripWhitespace(stripNonDigits(value))
		this._cvv = correctedCvv.slice(0, 4)
	}

	get creditCardNumber(): string {
		return this._creditCardNumber
	}

	set creditCardNumber(value: string) {
		let cleanedNumber = stripNonDigits(stripWhitespace(value))
		this.creditCardType = getCardTypeRange(cleanedNumber)
		this._creditCardNumber =
			this.creditCardType === CardType.Amex ? groupCreditCardNumber(cleanedNumber, [4, 6, 5, 5]) : groupCreditCardNumber(cleanedNumber)
	}

	get cardHolderName(): string {
		return this._cardHolderName
	}

	set cardHolderName(value: string) {
		// no-op for now.
	}

	validateCreditCardPaymentData(): TranslationKey | null {
		const cc = this.getCreditCardData()
		const invalidNumber = this.validateCreditCardNumber(cc.number)
		if (invalidNumber) {
			return invalidNumber
		}
		const invalidCVV = this.validateCVV(cc.cvv)
		if (invalidCVV) {
			return invalidCVV
		}
		const invalidExpirationDate = this.getExpirationDateErrorHint()
		if (invalidExpirationDate) {
			return invalidExpirationDate
		}
		return null
	}

	validateCreditCardNumber(number: string): TranslationKey | null {
		if (number === "") {
			return "creditCardNumberFormat_msg"
		} else if (!isValidCreditCardNumber(number)) {
			return "creditCardNumberInvalid_msg"
		}
		return null
	}

	validateCVV(cvv: string): TranslationKey | null {
		if (cvv.length < 3 || cvv.length > 4) {
			return "creditCardCVVFormat_label"
		}
		return null
	}

	getCreditCardNumberHint(): string | null {
		const spec = CardSpecs[this.creditCardType]
		if (this.creditCardType === CardType.Other) {
			return null
		}
		return spec.name
	}

	getCreditCardNumberErrorHint(): string | null {
		return this.validateCreditCardNumber(this._creditCardNumber) ? this.lang.get("creditCardNumberInvalid_msg") : null
	}

	/**
	 * return a translation string detailing what's wrong with the
	 * contents of the expiration date field, if any.
	 */
	getExpirationDateErrorHint(): TranslationKey | null {
		const expiration = getExpirationMonthAndYear(this._expirationDate)
		if (expiration == null) {
			return "creditCardExprationDateInvalid_msg"
		}
		const today = new Date()
		const currentYear = today.getFullYear() - 2000
		const currentMonth = today.getMonth() + 1
		const { year, month } = expiration
		if (year > currentYear || (year === currentYear && month >= currentMonth)) {
			return null
		}
		return "creditCardExpired_msg"
	}

	getCvvHint(): string | null {
		if (this.creditCardType === CardType.Other) {
			return null
		} else {
			const spec = CardSpecs[this.creditCardType]
			return this.lang.get("creditCardCvvHint_msg", { "{currentDigits}": this.cvv.length, "{totalDigits}": spec.cvvLength })
		}
	}

	getCvvErrorHint(): string | null {
		const spec = CardSpecs[this.creditCardType]
		return this.validateCVV(this.cvv) ? this.lang.get("creditCardSpecificCVVInvalid_msg", { "{securityCode}": spec.cvvName }) : null
	}

	getCvvLabel(): string {
		if (this.creditCardType === CardType.Other) {
			return this.lang.get("creditCardCvvLabelLong_label", { "{cvvName}": CardSpecs[CardType.Other].cvvName })
		} else {
			const spec = CardSpecs[this.creditCardType]
			return this.lang.get("creditCardCvvLabelLong_label", { "{cvvName}": spec.cvvName })
		}
	}

	getCreditCardData(): CreditCard {
		const expiration = getExpirationMonthAndYear(this._expirationDate)
		let cc = createCreditCard({
			number: stripWhitespace(this._creditCardNumber),
			cardHolderName: this._cardHolderName,
			cvv: this._cvv,
			expirationMonth: expiration ? String(expiration.month) : "",
			expirationYear: expiration ? String(expiration.year) : "",
		})
		return cc
	}

	setCreditCardData(data: CreditCard | null): void {
		if (data) {
			this.creditCardNumber = data.number
			this.cvv = data.cvv

			if (data.expirationMonth && data.expirationYear) {
				this.expirationDate = data.expirationMonth + " / " + data.expirationYear
			}
		} else {
			this._creditCardNumber = ""
			this._cvv = ""
			this._expirationDate = ""
		}
	}
}
