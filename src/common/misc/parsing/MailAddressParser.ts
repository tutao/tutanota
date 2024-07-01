import { isMailAddress } from "../FormatValidator"
import { PartialRecipient } from "../../api/common/recipients/Recipient"
import { convertTextToHtml } from "../Formatter.js"

export type ParsedMailto = {
	recipients: {
		to?: PartialRecipient[]
		cc?: PartialRecipient[]
		bcc?: PartialRecipient[]
	}
	subject: string | null
	body: string | null
	attach: Array<string> | null
}

/**
 * takes a URL of the form mailto:a@b.c?body=hello%20world&attach=file:///home/user/cute%20cat.jpg&attach=file:///home/user/ugly%20dog.jpg
 * and returns an object representing the structured information that should be passed to the mail editor for this URL
 *
 * if a param is not given, it is set to null. if it is given, but empty, it will be set to an empty string/array.
 *
 * @param mailtoUrl {string}
 * @returns {ParsedMailto}
 */
export function parseMailtoUrl(mailtoUrl: string): ParsedMailto {
	let url = new URL(mailtoUrl)

	const createMailAddressFromString = (address: string): PartialRecipient | null => {
		const nameAndMailAddress = stringToNameAndMailAddress(address)
		if (!nameAndMailAddress) return null
		return {
			name: nameAndMailAddress.name,
			address: nameAndMailAddress.mailAddress,
		}
	}

	const addresses = url.pathname
		.split(",")
		.map((address) => {
			if (!address) return null
			const decodedAddress = decodeURIComponent(address)
			if (!decodedAddress) return null
			return createMailAddressFromString(decodedAddress)
		})
		.filter(Boolean)
	const result: any = {
		recipients: {
			to: addresses.length > 0 ? addresses : undefined,
			cc: undefined,
			bcc: undefined,
		},
		attach: null,
		subject: null,
		body: null,
	}
	// @ts-ignore Missing definition
	if (!url.searchParams || typeof url.searchParams.entries !== "function") return result

	// @ts-ignore
	for (let pair of url.searchParams.entries()) {
		let paramName = pair[0].toLowerCase()
		let paramValue = pair[1]

		switch (paramName) {
			case "subject":
				result.subject = paramValue
				break

			case "body":
				result.body = convertTextToHtml(paramValue)
				break

			case "to":
			case "cc":
			case "bcc":
				if (result.recipients[paramName] == null) result.recipients[paramName] = []
				const nextAddresses = paramValue
					.split(",")
					.map((address: string) => createMailAddressFromString(address))
					.filter(Boolean)
				result.recipients[paramName].push(...nextAddresses)
				break

			case "attach":
				if (result.attach == null) result.attach = []
				result.attach.push(paramValue)
				break

			default:
				console.warn("unexpected mailto param, ignoring")
		}
	}

	return result
}

/**
 * Parses the given string for a name and mail address. The following formats are recognized: [name][<]mailAddress[>]
 * Additionally, whitespaces at any positions outside name and mailAddress are ignored.
 * @param string The string to check.
 * @return an object with the attributes "name" and "mailAddress" or null if nothing was found.
 */
export function stringToNameAndMailAddress(string: string):
	| {
			name: string
			mailAddress: string
	  }
	| null
	| undefined {
	string = string.trim()

	if (string === "") {
		return null
	}

	let startIndex = string.indexOf("<")

	if (startIndex !== -1) {
		const endIndex = string.indexOf(">", startIndex)

		if (endIndex === -1) {
			return null
		}

		const cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex + 1, endIndex))

		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}

		const name = string.substring(0, startIndex).trim()
		return {
			name: name,
			mailAddress: cleanedMailAddress,
		}
	} else {
		startIndex = string.lastIndexOf(" ")
		startIndex++
		const cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex))

		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}

		const name = string.substring(0, startIndex).trim()
		return {
			name: name,
			mailAddress: cleanedMailAddress,
		}
	}
}

/**
 * Returns a cleaned mail address from the input mail address. Removes leading or trailing whitespaces and converters
 * the address to lower case.
 * @param mailAddress The input mail address.
 * @return The cleaned mail address.
 */
export function getCleanedMailAddress(mailAddress: string): string | null {
	var cleanedMailAddress = mailAddress.toLowerCase().trim()

	if (isMailAddress(cleanedMailAddress, false)) {
		return cleanedMailAddress
	}

	return null
}

export function getDomainPart(mailAddress: string): string | null {
	const cleanedMailAddress = getCleanedMailAddress(mailAddress)

	if (cleanedMailAddress) {
		const parts = mailAddress.split("@")

		if (parts.length === 2) {
			return parts[1]
		} else {
			return null
		}
	} else {
		return null
	}
}

/**
 * Parses the given string for a fist name and a last name separated by whitespace. If there is only one part it is regarded as first name. If there are more than two parts, only the first one is regarded as first name.
 * @param fullName The full name to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function fullNameToFirstAndLastName(fullName: string): {
	firstName: string
	lastName: string
} {
	fullName = fullName.trim()

	if (fullName === "") {
		return {
			firstName: "",
			lastName: "",
		}
	}

	var separator = fullName.indexOf(" ")

	if (separator !== -1) {
		return {
			firstName: fullName.substring(0, separator),
			lastName: fullName.substring(separator + 1),
		}
	} else {
		return {
			firstName: fullName,
			lastName: "",
		}
	}
}

/**
 * Parses the given email address for a fist name and a last name separated by whitespace, comma, dot or underscore.
 * @param mailAddress The email address to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function mailAddressToFirstAndLastName(mailAddress: string): {
	firstName: string
	lastName: string
} {
	const addr = mailAddress.substring(0, mailAddress.indexOf("@"))
	let nameData

	if (addr.indexOf(".") !== -1) {
		nameData = addr.split(".")
	} else if (addr.indexOf("_") !== -1) {
		nameData = addr.split("_")
	} else if (addr.indexOf("-") !== -1) {
		nameData = addr.split("-")
	} else {
		nameData = [addr]
	}

	// first character upper case
	for (let i = 0; i < nameData.length; i++) {
		if (nameData[i].length > 0) {
			nameData[i] = nameData[i].substring(0, 1).toUpperCase() + nameData[i].substring(1)
		}
	}

	return {
		firstName: nameData[0],
		lastName: nameData.slice(1).join(" "),
	}
}
