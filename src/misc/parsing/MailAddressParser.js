// @flow

import type {MailAddress} from "../../api/entities/tutanota/MailAddress";
import {createMailAddress} from "../../api/entities/tutanota/MailAddress";
import {isMailAddress} from "../FormatValidator"


export function parseMailtoUrl(mailtoUrl: string): {to: MailAddress[], cc: MailAddress[], bcc: MailAddress[], subject: string, body: string} {
	let url = new URL(mailtoUrl)
	let toRecipients = []
	let ccRecipients = []
	let bccRecipients = []
	let addresses = url.pathname.split(",")
	let subject = ""
	let body = ""

	let createMailAddressFromString = (address: string): ?MailAddress => {
		let nameAndMailAddress = stringToNameAndMailAddress(address)
		if (nameAndMailAddress) {
			let mailAddress = createMailAddress()
			mailAddress.name = nameAndMailAddress.name
			mailAddress.address = nameAndMailAddress.mailAddress
			return mailAddress
		} else {
			return null
		}
	}

	addresses.forEach((address) => {
		if (address) {
			const decodedAddress = decodeURIComponent(address)
			if (decodedAddress) {
				const mailAddressObject = createMailAddressFromString(decodedAddress)
				mailAddressObject && toRecipients.push(mailAddressObject)
			}
		}
	})

	if (url.searchParams && typeof url.searchParams.entries === "function") { // not supported in Edge
		for (let pair of url.searchParams.entries()) {
			let paramName = pair[0].toLowerCase()
			let paramValue = pair[1]
			if (paramName === "subject") {
				subject = paramValue
			} else if (paramName === "body") {
				body = paramValue.replace(/\r\n/g, "<br>").replace(/\n/g, "<br>")
			} else if (paramName === "cc") {
				paramValue.split(",")
				          .forEach((ccAddress) => {
					          if (ccAddress) {
						          const addressObject = createMailAddressFromString(ccAddress)
						          addressObject && ccRecipients.push(addressObject)
					          }
				          })
			} else if (paramName === "bcc") {
				paramValue.split(",")
				          .forEach((bccAddress) => {
					          if (bccAddress) {
						          const addressObject = createMailAddressFromString(bccAddress)
						          addressObject && bccRecipients.push(addressObject)
					          }
				          })
			} else if (paramName === "to") {
				paramValue.split(",")
				          .forEach((toAddress) => {
					          if (toAddress) {
						          const addressObject = createMailAddressFromString(toAddress)
						          addressObject && toRecipients.push(addressObject)
					          }
				          })
			}
		}
	}

	return {
		to: toRecipients,
		cc: ccRecipients,
		bcc: bccRecipients,
		subject: subject,
		body: body
	}
}

/**
 * Parses the given string for a name and mail address. The following formats are recognized: [name][<]mailAddress[>]
 * Additionally, whitespaces at any positions outside name and mailAddress are ignored.
 * @param string The string to check.
 * @return an object with the attributes "name" and "mailAddress" or null if nothing was found.
 */
export function stringToNameAndMailAddress(string: string): ?{name: string, mailAddress: string} {
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
		return {name: name, mailAddress: cleanedMailAddress}
	} else {
		startIndex = string.lastIndexOf(" ")
		startIndex++
		const cleanedMailAddress = getCleanedMailAddress(string.substring(startIndex))
		if (cleanedMailAddress == null || !isMailAddress(cleanedMailAddress, false)) {
			return null
		}
		const name = string.substring(0, startIndex).trim()
		return {name: name, mailAddress: cleanedMailAddress}
	}
}

/**
 * Returns a cleaned mail address from the input mail address. Removes leading or trailing whitespaces and converters
 * the address to lower case.
 * @param mailAddress The input mail address.
 * @return The cleaned mail address.
 */
export function getCleanedMailAddress(mailAddress: string): ?string {
	var cleanedMailAddress = mailAddress.toLowerCase().trim()
	if (isMailAddress(cleanedMailAddress, false)) {
		return cleanedMailAddress
	}
	return null
}

export function getDomainPart(mailAddress: string): ?string {
	const cleanedMailAddress = getCleanedMailAddress(mailAddress)
	if (cleanedMailAddress) {
		const parts = mailAddress.split("@");
		if (parts.length === 2) {
			return parts[1]
		} else {
			null
		}
	} else {
		return null;
	}
}

/**
 * Parses the given string for a fist name and a last name separated by whitespace. If there is only one part it is regarded as first name. If there are more than two parts, only the first one is regarded as first name.
 * @param fullName The full name to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function fullNameToFirstAndLastName(fullName: string): {firstName: string, lastName: string} {
	fullName = fullName.trim()
	if (fullName === "") {
		return {firstName: "", lastName: ""}
	}
	var separator = fullName.indexOf(" ")
	if (separator !== -1) {
		return {firstName: fullName.substring(0, separator), lastName: fullName.substring(separator + 1)}
	} else {
		return {firstName: fullName, lastName: ""}
	}
}

/**
 * Parses the given email address for a fist name and a last name separated by whitespace, comma, dot or underscore.
 * @param mailAddress The email address to check.
 * @return Returns an object with the attributes "firstName" and "lastName".
 */
export function mailAddressToFirstAndLastName(mailAddress: string): {firstName: string, lastName: string} {
	var addr = mailAddress.substring(0, mailAddress.indexOf("@"))
	var nameData = []
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
	return {firstName: nameData[0], lastName: nameData.slice(1).join(" ")}
}