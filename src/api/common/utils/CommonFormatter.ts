import { getByAbbreviation } from "../CountryList.js"

export function formatNameAndAddress(name: string, address: string, countryCode?: string): string {
	let result = ""

	if (name) {
		result += name
	}

	if (address) {
		if (result) {
			result += "\n"
		}

		result += address
	}

	const country = countryCode && getByAbbreviation(countryCode)
	if (country) {
		if (result) {
			result += "\n"
		}

		result += country.n
	}

	return result
}
