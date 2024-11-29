import { MailBundle, MailBundleRecipient, MailExportMode } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { createDataFile, DataFile, getCleanedMimeType } from "../../../common/api/common/DataFile.js"
import { assertNotNull, formatSortableDateTime, pad, stringToBase64, stringToUtf8Uint8Array, uint8ArrayToBase64 } from "@tutao/tutanota-utils"
import { sanitizeFilename } from "../../../common/api/common/utils/FileUtils.js"

export function mailToEmlFile(mail: MailBundle, fileName: string): DataFile {
	const data = stringToUtf8Uint8Array(mailToEml(mail))
	return createDataFile(fileName, "message/rfc822", data)
}

export function _formatSmtpDateTime(date: Date): string {
	const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
	const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	return (
		dayNames[date.getUTCDay()] +
		", " +
		date.getUTCDate() +
		" " +
		monthNames[date.getUTCMonth()] +
		" " +
		date.getUTCFullYear() +
		" " +
		pad(date.getUTCHours(), 2) +
		":" +
		pad(date.getUTCMinutes(), 2) +
		":" +
		pad(date.getUTCSeconds(), 2) +
		" +0000"
	)
}

/**
 * Converts a mail into the plain text EML format.
 */
export function mailToEml(mail: MailBundle): string {
	const lines: string[] = []

	if (mail.headers) {
		const filteredHeaders = mail.headers
			// we want to make sure all line endings are exactly \r\n after we're done.
			.split(/\r\n|\n/)
			.filter((line) => !line.match(/^\s*(Content-Type:|boundary=)/))
		lines.push(...filteredHeaders)
	} else {
		lines.push("From: " + mail.sender.address, "MIME-Version: 1.0")

		const formatRecipients = (key: string, recipients: MailBundleRecipient[]) =>
			`${key}: ${recipients
				.map((recipient) => (recipient.name ? `${escapeSpecialCharacters(recipient.name)} ` : "") + `<${recipient.address}>`)
				.join(",")}`

		if (mail.to.length > 0) {
			lines.push(formatRecipients("To", mail.to))
		}

		if (mail.cc.length > 0) {
			lines.push(formatRecipients("CC", mail.cc))
		}

		if (mail.bcc.length > 0) {
			lines.push(formatRecipients("BCC", mail.bcc))
		}

		let subject = mail.subject.trim() === "" ? "" : `=?UTF-8?B?${uint8ArrayToBase64(stringToUtf8Uint8Array(mail.subject))}?=`
		lines.push(
			"Subject: " + subject,
			"Date: " + _formatSmtpDateTime(new Date(mail.sentOn)), // TODO (later) load conversation entries and write message id and references
			//"Message-ID: " + // <006e01cf442b$52864f10$f792ed30$@tutao.de>
			//References: <53074EB8.4010505@tutao.de> <DD374AF0-AC6D-4C58-8F38-7F6D8A0307F3@tutao.de> <530E3529.70503@tutao.de>
		)
	}

	lines.push(
		'Content-Type: multipart/related; boundary="------------79Bu5A16qPEYcVIZL@tutanota"',
		"",
		"--------------79Bu5A16qPEYcVIZL@tutanota",
		"Content-Type: text/html; charset=UTF-8",
		"Content-transfer-encoding: base64",
		"",
	)

	for (let bodyLine of breakIntoLines(stringToBase64(mail.body))) {
		lines.push(bodyLine)
	}

	lines.push("")

	for (let attachment of mail.attachments) {
		const base64Filename = `=?UTF-8?B?${uint8ArrayToBase64(stringToUtf8Uint8Array(attachment.name))}?=`
		const fileContentLines = breakIntoLines(uint8ArrayToBase64(attachment.data))
		lines.push(
			"--------------79Bu5A16qPEYcVIZL@tutanota",
			"Content-Type: " + getCleanedMimeType(attachment.mimeType) + ";",
			" name=" + base64Filename + "",
			"Content-Transfer-Encoding: base64",
			"Content-Disposition: attachment;",
			" filename=" + base64Filename + "",
		)

		if (attachment.cid) {
			lines.push("Content-Id: <" + attachment.cid + ">")
		}

		lines.push("")

		// don't use destructuring, big files can hit callstack limit
		for (let fileLine of fileContentLines) {
			lines.push(fileLine)
		}

		lines.push("")
	}

	lines.push("--------------79Bu5A16qPEYcVIZL@tutanota--")
	return lines.join("\r\n")
}

function escapeSpecialCharacters(name: string): string {
	// There may be other special characters that need escaping
	return name.replace(/[,<>]/gi, "\\$&")
}

/**
 * Break up a long string into lines of up to 78 characters
 * @param string
 * @returns the lines, each as an individual array
 */
function breakIntoLines(string: string): Array<string> {
	return string.length > 0 ? assertNotNull(string.match(/.{1,78}/g)) : []
}

export function generateExportFileName(subject: string, sentOn: Date, mode: MailExportMode): string {
	let filename = [...formatSortableDateTime(sentOn).split(" "), subject].join("-")
	filename = filename.trim()

	if (filename.length === 0) {
		filename = "unnamed"
	} else if (filename.length > 96) {
		// windows MAX_PATH is 260, this should be fairly safe.
		filename = filename.substring(0, 95) + "_"
	}

	return sanitizeFilename(`${filename}.${mode}`)
}
