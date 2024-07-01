import { neverNull } from "@tutao/tutanota-utils"
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

	if (countryCode) {
		if (result) {
			result += "\n"
		}

		result += neverNull(getByAbbreviation(countryCode)).n
	}

	return result
}
