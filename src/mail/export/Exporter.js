// @flow
import {stringToBase64, stringToUtf8Uint8Array, uint8ArrayToBase64} from "../../api/common/utils/Encoding"
import {pad} from "../../api/common/utils/StringUtils"
import {createFile} from "../../api/entities/tutanota/File"
import {convertToDataFile, getCleanedMimeType} from "../../api/common/DataFile"
import {neverNull} from "../../api/common/utils/Utils"
import {assertMainOrNode} from "../../api/common/Env"
import {formatSortableDateTime} from "../../api/common/utils/DateUtils"
import type {MailBundle} from "./Bundler"

assertMainOrNode()

export function mailToEmlFile(mail: MailBundle): DataFile {
	let data = stringToUtf8Uint8Array(mailToEml(mail))
	let tmpFile = createFile()
	let filename = [...formatSortableDateTime(new Date(mail.sentOn)).split(' '), mail.subject].join('-')
	filename = filename.trim()
	if (filename.length === 0) {
		filename = "unnamed"
	} else if (filename.length > 96) {
		// windows MAX_PATH is 260, this should be fairly safe.
		filename = filename.substring(0, 95) + '_'
	}
	tmpFile.name = filename + ".eml"
	tmpFile.mimeType = "message/rfc822"
	tmpFile.size = String(data.byteLength)
	return convertToDataFile(tmpFile, data)
}

/**
 * Converts a mail into the plain text EML format.
 */
export function mailToEml(mail: MailBundle): string {

	const body = stringToBase64(mail.body).match(/.{1,78}/g) || []
	const bodyText = body.join("\r\n")

	let emlArray

	if (mail.headers) {
		emlArray = mail.headers.split("\n")
		for (let i = emlArray.length - 1; i >= 0; i--) {
			if (emlArray[i].match(/^\s*(Content-Type:|boundary=)/)) {
				emlArray.splice(i, 1)
			}
		}
		emlArray = [emlArray.join("\n")]
	} else {
		emlArray = ["From: " + mail.sender.address, "MIME-Version: 1.0"]
		if (mail.to.length > 0) {
			emlArray.push(_formatRecipients("To: ", mail.to.map(r => r.address)))
		}
		if (mail.cc.length > 0) {
			emlArray.push(_formatRecipients("CC: ", mail.cc.map(r => r.address)))
		}
		if (mail.bcc.length > 0) {
			emlArray.push(_formatRecipients("BCC: ", mail.bcc.map(r => r.address)))
		}
		let subject = (mail.subject.trim() === "") ? "" : "=?UTF-8?B?"
			+ uint8ArrayToBase64(stringToUtf8Uint8Array(mail.subject)) + "?="
		emlArray.push(...[
			"Subject: " + subject,
			"Date: " + _formatSmtpDateTime(new Date(mail.sentOn)),
			// TODO (later) load conversation entries and write message id and references
			//"Message-ID: " + // <006e01cf442b$52864f10$f792ed30$@tutao.de>
			//References: <53074EB8.4010505@tutao.de> <DD374AF0-AC6D-4C58-8F38-7F6D8A0307F3@tutao.de> <530E3529.70503@tutao.de>
		])

	}
	emlArray.push(...[
		"Content-Type: multipart/mixed; boundary=\"------------79Bu5A16qPEYcVIZL@tutanota\"",
		"",
		"--------------79Bu5A16qPEYcVIZL@tutanota",
		"Content-Type: text/html; charset=UTF-8",
		"Content-transfer-encoding: base64",
		"",
		bodyText,
		""
	])
	for (let attachment of mail.attachments) {
		let base64Filename = "=?UTF-8?B?" +
			uint8ArrayToBase64(stringToUtf8Uint8Array(attachment.name)) + "?="
		const fileContent = uint8ArrayToBase64(attachment.data)
		const lines = [
			"--------------79Bu5A16qPEYcVIZL@tutanota",
			"Content-Type: " + getCleanedMimeType(attachment.mimeType) + ";",
			" name=" + base64Filename + "",
			"Content-Transfer-Encoding: base64",
			"Content-Disposition: attachment;",
			" filename=" + base64Filename + ""
		]
		if (attachment.cid) {
			lines.push("Content-Id: <" + attachment.cid + ">")
		}
		lines.push("")
		lines.push(fileContent.length > 0 ? neverNull(fileContent.match(/.{1,78}/g)).join("\r\n") : fileContent)
		emlArray.push(...lines)
	}
	emlArray.push("--------------79Bu5A16qPEYcVIZL@tutanota--")
	return emlArray.join("\r\n")
}


function _formatSmtpDateTime(date: Date) {
	let dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
	let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	return dayNames[date.getUTCDay()] + ", " + date.getUTCDate() + " " + monthNames[date.getUTCMonth()] + " "
		+ date.getUTCFullYear() + " " + pad(date.getUTCHours(), 2) + ":" + pad(date.getUTCMinutes(), 2) + ":"
		+ pad(date.getUTCSeconds(), 2) + " +0000"
}

function _formatRecipients(key: string, recipientAddresses: string[]) {
	let recipientsString = key
	for (let address of recipientAddresses) {
		recipientsString += address + ",\r\n" + new Array(key.length).join(' ')
	}
	return recipientsString.substr(0, recipientsString.length - (2 + key.length))
}