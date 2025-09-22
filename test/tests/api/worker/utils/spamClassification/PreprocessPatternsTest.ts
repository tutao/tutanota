import o from "@tutao/otest"
import { DATE_PATTERN_TOKEN, DATE_REGEX, URL_PATTERN_TOKEN } from "../../../../../../src/mail-app/workerUtils/spamClassification/PreprocessPatterns"
import { DOMAIN_REGEX } from "../../../../../../src/common/misc/FormatValidator"

o.spec("PreprocessPatterns", () => {
	o.spec("Date patterns", () => {
		o.test("All recognized date patterns", async () => {
			const dates = [
				"01-12-2023",
				"1-12-2023",
				"2023-12-01",
				"2023-12-1",
				"01.12.2023",
				"1.12.2023",
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
			const urls = new Map([
				["https://tuta.com", "<URL:tuta:com>"],
				["https://microsoft.com/outlook/test", "<URL:microsoft:com>"],
				["https://subdomain.microsoft.com/outlook/test", "<URL:microsoft:com>"],
				["https://subdomain.spam.com/this/is/not/cool/dsfalkfjd2309jlk234oi2k", "<URL:spam:com>"],
				["https://subdomain.test.de/spam", "<URL:test:de>"],
			])

			for (const [domain, expectedToken] of urls.entries()) {
				const tokenized = domain.replace(DOMAIN_REGEX, URL_PATTERN_TOKEN)
				o.check(tokenized).equals(expectedToken)
			}
		})

		o.test("Not recognized url-like sequences", async () => {
			const notUrls = ["https://tuta/com", "subdomain.:spam.com", "https://microsoft;com/outlook/test"]
			const notUrlsText = notUrls.join("\n")
			let resultNotUrlsText = notUrlsText

			resultNotUrlsText = resultNotUrlsText.replaceAll(DOMAIN_REGEX, URL_PATTERN_TOKEN)

			const resultTokenArray = resultNotUrlsText.split(URL_PATTERN_TOKEN)
			o.check(resultTokenArray.length - 1).equals(0)

			resultNotUrlsText = resultNotUrlsText.replaceAll(URL_PATTERN_TOKEN, "")
			o.check(resultNotUrlsText.trim()).equals(notUrlsText)
		})
	})

	// TODO add tests for other patterns
})
