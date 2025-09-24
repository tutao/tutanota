import o from "@tutao/otest"
import {
	BITCOIN_PATTERN_TOKEN,
	BITCOIN_REGEX,
	CREDIT_CARD_REGEX,
	CREDIT_CARD_TOKEN,
	DATE_PATTERN_TOKEN,
	DATE_REGEX,
	EMAIL_ADDR_PATTERN,
	EMAIL_ADDR_PATTERN_TOKEN,
	NUMBER_SEQUENCE_REGEX,
	NUMBER_SEQUENCE_TOKEN,
	SPECIAL_CHARACTER_REGEX,
	SPECIAL_CHARACTER_TOKEN,
	URL_PATTERN,
	URL_PATTERN_TOKEN,
} from "../../../../../../src/mail-app/workerUtils/spamClassification/PreprocessPatterns"
import { DOMAIN_REGEXP, isMailAddress } from "../../../../../../src/common/misc/FormatValidator"

o.spec("PreprocessPatterns", () => {
	const otherNumberFormats = [
		//MAC Address
		"FB-94-77-45-96-74",
		"91-58-81-D5-55-7C",
		"B4-09-49-2A-DE-D4",
		// ISBN
		"718385414-0",
		"733065633-X",
		"632756390-2",
		// SSN
		"227-78-2283",
		"134-34-1253",
		"591-61-6459",
		// SHA
		"585eab9b3a5e4430e08f5096d636d0d475a8c69dae21a61c6f1b26c4bd8dd8c1",
		"7233d153f2e0725d3d212d1f27f30258fafd72b286d07b3b1d94e7e3c35dce67",
		"769f65bf44557df44fc5f99c014cbe98894107c9d7be0801f37c55b3776c3990",
		// Phone Numbers
		"(341) 2027690",
		"+385 958 638 7625",
		"430-284-9438",
		// VIN (Vehicle identification number)
		"3FADP4AJ3BM438397",
		"WAULT64B82N564937",
		"KMHTC6AD6EU278390",
		//GUIDs
		"781a9631-0716-4f9c-bb36-25c3364b754b",
		"325783d4-a64e-453b-85e6-ed4b2cd4c9bf",
		"0f77794c-04c9-4c21-ae89-8047796c77c4",
		//Hex Colors
		"#2016c1",
		"#c090a4",
		"#c855f5",
		"#000000",
		//IPV4
		"91.17.182.120",
		"47.232.175.0",
		"171.90.3.93",
	]

	o.spec("Date patterns", () => {
		o.test("All recognized date patterns", async () => {
			const dates = [
				"01-12-2023",
				"1-12-2023",
				"2023-12-01",
				"2023-12-1",
				"01.12.2023",
				"1.12.2023",
				"1.12.23",
				"01.12.23",
				"12/01/2023",
				"12/1/2023",
				"01/12/2023",
				"1/12/2023",
				"2023/12/01",
				"2023/12/1",
			]
			let resultDatesText = dates.join("\n")

			for (const datePattern of DATE_REGEX) {
				resultDatesText = resultDatesText.replace(datePattern, DATE_PATTERN_TOKEN)
			}

			const resultTokenArray = resultDatesText.split(DATE_PATTERN_TOKEN)
			o.check(resultTokenArray.length - 1).equals(dates.length)

			resultDatesText = resultDatesText.replaceAll(DATE_PATTERN_TOKEN, "")
			o.check(resultDatesText.trim()).equals("")
		})

		o.test("Not recognized date-like sequences", async () => {
			const notDates = [
				"01-12--2023",
				"1-12-22023",
				"2023.12-01",
				"2023/12-1",
				"011123221",
				"1.2.3",
				"12/1/023",
				"12/12023",
				"01/12//2023",
				"1//12/23023",
				"2023//12/01",
				"2023//12/1",
				"1-85723-353-0",
				"10.10.10.10",
				"192.168.178.1",
				"10.12.10.100",
				"10.12.22.20",
				"94-77-45",
				"12-12-12",
				"33-33-33",
			]
			const notDatesText = notDates.join("\n")
			let resultNotDatesText = notDatesText

			for (const datePattern of DATE_REGEX) {
				resultNotDatesText = resultNotDatesText.replace(datePattern, DATE_PATTERN_TOKEN)
			}

			const resultTokenArray = resultNotDatesText.split(DATE_PATTERN_TOKEN)
			o.check(resultTokenArray.length - 1).equals(0)

			resultNotDatesText = resultNotDatesText.replaceAll(DATE_PATTERN_TOKEN, "")
			o.check(resultNotDatesText.trim()).equals(notDatesText)
		})
	})

	o.spec("Url patterns", () => {
		o.test("All recognized url patterns", async () => {
			const urlsMap = new Map([
				["https://tuta.com", "<URL-tuta.com>"],
				["https://microsoft.com/outlook/test", "<URL-microsoft.com>"],
				["https://subdomain.microsoft.com/outlook/test", "<URL-subdomain.microsoft.com>"],
				["https://subdomain.spam.com/this/is/not/cool/dsfalkfjd2309jlk234oi2k", "<URL-subdomain.spam.com>"],
				["https://subdomain.test.de/spam!", "<URL-subdomain.test.de>"],
			])

			for (const [domain, expectedToken] of urlsMap.entries()) {
				const cleaned = domain.replace(URL_PATTERN, URL_PATTERN_TOKEN)
				o.check(cleaned.trim()).equals(expectedToken)
			}
		})

		o.test("Not recognized url-like sequences", async () => {
			const notUrls = ["https://tuta/com", "subdomain.:spam.com", "https://microsoft;com/outlook/test"]
			const notUrlsText = notUrls.join("\n")
			let resultNotUrlsText = notUrlsText

			resultNotUrlsText = resultNotUrlsText.replaceAll(DOMAIN_REGEXP, URL_PATTERN_TOKEN)

			const resultTokenArray = resultNotUrlsText.split(URL_PATTERN_TOKEN)
			o.check(resultTokenArray.length - 1).equals(0)

			resultNotUrlsText = resultNotUrlsText.replaceAll(URL_PATTERN_TOKEN, "")
			o.check(resultNotUrlsText.trim()).equals(notUrlsText)
		})
	})

	o.spec("Email patterns", () => {
		o.test("All recognized email patterns", async () => {
			const emails = [
				"test@example.com",
				"mailto:test@example.com",
				"plus+addressing@example.com",
				"cool_user-name123@example.com",
				"cool_user-name123@sub.example.com",
			]

			for (const email of emails) {
				const replaced = email.replace(EMAIL_ADDR_PATTERN, EMAIL_ADDR_PATTERN_TOKEN)
				if (!isMailAddress(email, false)) {
					console.log(email)
				}
				o.check(replaced).equals(EMAIL_ADDR_PATTERN_TOKEN)
			}
		})
	})

	o.spec("Payment patterns", () => {
		o.spec("Credit card patterns", () => {
			o.test("All recognized credit card patterns", async () => {
				const creditCards = [
					"5002355116026522",
					"4041594058552089",
					"4917900523734890",
					"4041 3751 9030 3866",
					"5340 5434 1970 9263",
					"5007662906271472",
					"4098150719517227",
					"4175005629562877",
					"5010124099980232",
				]

				let resultCreditCardsText = creditCards.join("\n")

				resultCreditCardsText = resultCreditCardsText.replace(CREDIT_CARD_REGEX, CREDIT_CARD_TOKEN)

				const resultTokenArray = resultCreditCardsText.split(CREDIT_CARD_TOKEN)
				o.check(resultTokenArray.length - 1).equals(creditCards.length)

				resultCreditCardsText = resultCreditCardsText.replaceAll(CREDIT_CARD_TOKEN, "")
				o.check(resultCreditCardsText.trim()).equals("")
			})

			o.test("Not recognized credit-card-like sequences", async () => {
				const notCreditCards = ["1234", "1234 1234", "1234 1234 1234", "90009", "1 1 1 1", "4444-4444"]
				const notCreditCardText = notCreditCards.join("\n")

				let resultNotCreditCard = notCreditCards.map((cc) => cc.replace(CREDIT_CARD_REGEX, CREDIT_CARD_TOKEN)).join("\n")

				const resultTokenArray = resultNotCreditCard.split(CREDIT_CARD_TOKEN)
				o.check(resultTokenArray.length - 1).equals(0)

				resultNotCreditCard = resultNotCreditCard.replaceAll(CREDIT_CARD_TOKEN, "")
				o.check(resultNotCreditCard.trim()).equals(notCreditCardText)
			})

			o.test("Not recognized other-format sequences", async () => {
				const notCreditCardText = otherNumberFormats.join("\n")

				let resultNotCreditCard = otherNumberFormats.map((cc) => cc.replace(CREDIT_CARD_REGEX, CREDIT_CARD_TOKEN)).join("\n")

				const resultTokenArray = resultNotCreditCard.split(CREDIT_CARD_TOKEN)
				o.check(resultTokenArray.length - 1).equals(0)

				resultNotCreditCard = resultNotCreditCard.replaceAll(CREDIT_CARD_TOKEN, "")
				o.check(resultNotCreditCard.trim()).equals(notCreditCardText)
			})
		})

		o.spec("Bitcoin patterns", () => {
			o.test("All recognized bitcoin patterns", async () => {
				const bitcoinAddresses = [
					"159S1vV25PAxMiCVaErjPznbWB8YBvANAi",
					"18wUQ7NqX1sWuzbtCz4aoDEoLwZrAsq5XD",
					"1FUm2eZK2ETeAo8v95WhZioQDy32YSerkD",
					"1NJmLtKTyHyqdKo6epyF9ecMyuH1xFWjEt",
					"1U11iKhWKyDv7RsRHNf98GSvwCLT6TJvr",
				]
				let resultBitcoinsText = bitcoinAddresses.join("\n")

				resultBitcoinsText = resultBitcoinsText.replace(BITCOIN_REGEX, BITCOIN_PATTERN_TOKEN)

				const resultTokenArray = resultBitcoinsText.split(BITCOIN_PATTERN_TOKEN)
				o.check(resultTokenArray.length - 1).equals(bitcoinAddresses.length)

				resultBitcoinsText = resultBitcoinsText.replaceAll(BITCOIN_PATTERN_TOKEN, "")
				o.check(resultBitcoinsText.trim()).equals("")
			})

			o.test("Not recognized bitcoin-like sequences", async () => {
				const notBitcoins = [
					"5213nYwhhGw2qpNijzfnKcbCG4z3hnrVA",
					"1lwUQ7NqX1sWuzbtCz4aoDEoLwZrAsq5XD",
					"1OUm2eZK2ETeAo8v95WhZioQDy32YSerkD",
					"1IJmLtKTyHyqdKo6epyF9ecMyuH1xFWjEt",
				]
				const notBitcoinText = notBitcoins.join("\n")

				let resultNotBitcoin = notBitcoins.map((cc) => cc.replace(BITCOIN_REGEX, BITCOIN_PATTERN_TOKEN)).join("\n")

				const resultTokenArray = resultNotBitcoin.split(BITCOIN_PATTERN_TOKEN)
				o.check(resultTokenArray.length - 1).equals(0)

				resultNotBitcoin = resultNotBitcoin.replaceAll(BITCOIN_PATTERN_TOKEN, "")
				o.check(resultNotBitcoin.trim()).equals(notBitcoinText)
			})

			o.test("Not recognized other-format sequences", async () => {
				const notBitcoinText = otherNumberFormats.join("\n")

				let resultNotBitcoin = otherNumberFormats.map((cc) => cc.replace(BITCOIN_REGEX, BITCOIN_PATTERN_TOKEN)).join("\n")

				const resultTokenArray = resultNotBitcoin.split(BITCOIN_PATTERN_TOKEN)
				o.check(resultTokenArray.length - 1).equals(0)

				resultNotBitcoin = resultNotBitcoin.replaceAll(BITCOIN_PATTERN_TOKEN, "")
				o.check(resultNotBitcoin.trim()).equals(notBitcoinText)
			})
		})
	})

	o.spec("Special character patterns", () => {
		o.test("All recognized special character patterns", async () => {
			const specialCharsMap = new Map([
				["!", SPECIAL_CHARACTER_TOKEN],
				["@", SPECIAL_CHARACTER_TOKEN],
				["#", SPECIAL_CHARACTER_TOKEN],
				["$", SPECIAL_CHARACTER_TOKEN],
				["%", SPECIAL_CHARACTER_TOKEN],
				["^", SPECIAL_CHARACTER_TOKEN],
				["&", SPECIAL_CHARACTER_TOKEN],
				["*", SPECIAL_CHARACTER_TOKEN],
				["(", SPECIAL_CHARACTER_TOKEN],
				[")", SPECIAL_CHARACTER_TOKEN],
				["+", SPECIAL_CHARACTER_TOKEN],
				["`", SPECIAL_CHARACTER_TOKEN],
				["_", SPECIAL_CHARACTER_TOKEN],
				["=", SPECIAL_CHARACTER_TOKEN],
				["\\", SPECIAL_CHARACTER_TOKEN],
				["{", SPECIAL_CHARACTER_TOKEN],
				["}", SPECIAL_CHARACTER_TOKEN],
				['"', SPECIAL_CHARACTER_TOKEN],
				["'", SPECIAL_CHARACTER_TOKEN],
				[",", SPECIAL_CHARACTER_TOKEN],
				[".", SPECIAL_CHARACTER_TOKEN],
				["~", SPECIAL_CHARACTER_TOKEN],
				["!!", SPECIAL_CHARACTER_TOKEN],
				["! !", `${SPECIAL_CHARACTER_TOKEN} ${SPECIAL_CHARACTER_TOKEN}`],
				["@ @@", `${SPECIAL_CHARACTER_TOKEN} ${SPECIAL_CHARACTER_TOKEN}`],
				["@@@ @@", `${SPECIAL_CHARACTER_TOKEN} ${SPECIAL_CHARACTER_TOKEN}`],
				["%% @@", `${SPECIAL_CHARACTER_TOKEN} ${SPECIAL_CHARACTER_TOKEN}`],
				["-", SPECIAL_CHARACTER_TOKEN],
				["--", SPECIAL_CHARACTER_TOKEN],
				["---", SPECIAL_CHARACTER_TOKEN],
				["--- ---", `${SPECIAL_CHARACTER_TOKEN} ${SPECIAL_CHARACTER_TOKEN}`],
			])

			for (const [specialCharSequence, expectedResult] of specialCharsMap) {
				const tokenized = specialCharSequence.replace(SPECIAL_CHARACTER_REGEX, SPECIAL_CHARACTER_TOKEN)
				o.check(tokenized).equals(expectedResult)
			}
		})

		o.test("Not recognized special-character-like patterns", async () => {
			const notSpecialChars = [":", "[", "]", "<", ">", "test-test", "test+test"]

			const notSpecialCharsText = notSpecialChars.join("\n")
			let resultNotSpecialCharsText = notSpecialCharsText

			resultNotSpecialCharsText = resultNotSpecialCharsText.replaceAll(SPECIAL_CHARACTER_TOKEN, SPECIAL_CHARACTER_TOKEN)

			const resultTokenArray = resultNotSpecialCharsText.split(SPECIAL_CHARACTER_TOKEN)
			o.check(resultTokenArray.length - 1).equals(0)

			resultNotSpecialCharsText = resultNotSpecialCharsText.replaceAll(SPECIAL_CHARACTER_TOKEN, "")
			o.check(resultNotSpecialCharsText.trim()).equals(notSpecialCharsText)
		})
	})

	o.spec("Number sequence patterns", () => {
		o.test("All recognized number sequence patterns", async () => {
			const numberSequenceMap = new Map([
				["19328493214", NUMBER_SEQUENCE_TOKEN],
				["1", NUMBER_SEQUENCE_TOKEN],
				["als 100 partner", `als ${NUMBER_SEQUENCE_TOKEN} partner`],
				["26098375", `${NUMBER_SEQUENCE_TOKEN}`],
				["t24-group, 65, 10557", `t24-group, ${NUMBER_SEQUENCE_TOKEN}, ${NUMBER_SEQUENCE_TOKEN}`],
				[
					"IBAN: DE91 1002 0370 0320 2239 82",
					`IBAN: DE91 ${NUMBER_SEQUENCE_TOKEN} ${NUMBER_SEQUENCE_TOKEN} ${NUMBER_SEQUENCE_TOKEN} ${NUMBER_SEQUENCE_TOKEN} ${NUMBER_SEQUENCE_TOKEN}`,
				],
				["2020-0000-1580", `${NUMBER_SEQUENCE_TOKEN}-${NUMBER_SEQUENCE_TOKEN}-${NUMBER_SEQUENCE_TOKEN}`],
				["809,95 €", `${NUMBER_SEQUENCE_TOKEN},${NUMBER_SEQUENCE_TOKEN} €`],
				["99999999999999999999999999999", NUMBER_SEQUENCE_TOKEN],
			])

			for (const [specialCharSequence, expectedResult] of numberSequenceMap) {
				const tokenized = specialCharSequence.replace(NUMBER_SEQUENCE_REGEX, NUMBER_SEQUENCE_TOKEN)
				o.check(tokenized).equals(expectedResult)
			}
		})

		o.test("Not recognized number-like sequences", async () => {
			const notNumberSequences = ["SHLT116", "Scout24", "gb_67ca4b", "one", "16mb"]
			const notNumberSequenceText = notNumberSequences.join("\n")

			let resultNotNumberSequence = notNumberSequences.map((cc) => cc.replace(NUMBER_SEQUENCE_REGEX, NUMBER_SEQUENCE_TOKEN)).join("\n")

			const resultTokenArray = resultNotNumberSequence.split(NUMBER_SEQUENCE_TOKEN)
			o.check(resultTokenArray.length - 1).equals(0)

			resultNotNumberSequence = resultNotNumberSequence.replaceAll(NUMBER_SEQUENCE_TOKEN, "")
			o.check(resultNotNumberSequence.trim()).equals(notNumberSequenceText)
		})

		o.test("number sequence results on other-format sequences outputs as expected", async () => {
			let resultNotNumberSequence = otherNumberFormats.map((cc) => cc.replace(NUMBER_SEQUENCE_REGEX, NUMBER_SEQUENCE_TOKEN)).join("\n")

			const resultTokenArray = resultNotNumberSequence.split(NUMBER_SEQUENCE_TOKEN)

			const expectedNumberOfTokens = 49
			o.check(resultTokenArray.length).equals(expectedNumberOfTokens)
		})
	})
})
