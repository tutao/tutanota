// @flow
import {stringToUtf8Uint8Array, uint8ArrayToBase64} from "../api/common/utils/Encoding"
import {pad} from "../api/common/utils/StringUtils"
import {load} from "../api/main/Entity"
import {createFile, FileTypeRef} from "../api/entities/tutanota/File"
import {worker} from "../api/main/WorkerClient"
import {createDataFile, getCleanedMimeType} from "../api/common/DataFile"
import {getMailHeaders, neverNull} from "../api/common/utils/Utils"
import {assertMainOrNode} from "../api/Env"
import {fileController} from "../file/FileController"
import {formatSortableDateTime} from "../misc/Formatter"
import {showProgressDialog} from "../gui/base/ProgressDialog"
import {MailHeadersTypeRef} from "../api/entities/tutanota/MailHeaders"

assertMainOrNode()

export function exportAsEml(mail: Mail, sanitizedHtmlBody: string) {
	return showProgressDialog("pleaseWait_msg",
		toEml(mail, sanitizedHtmlBody).then(emlString => {
			let data = stringToUtf8Uint8Array(emlString)
			let tmpFile = createFile()
			let filename = [...formatSortableDateTime(mail.sentDate).split(' '), mail.subject].join('-')
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
			return fileController.open(createDataFile(tmpFile, data))
		})
	)
}

/**
 * Converts a mail into the plain text EML format.
 */
export function toEml(mail: Mail, sanitizedBodyText: string): Promise<string> {
	const headersPromise = mail.headers ? load(MailHeadersTypeRef, mail.headers) : Promise.resolve(null)
	return headersPromise.then(header => {
		let body = uint8ArrayToBase64(stringToUtf8Uint8Array(sanitizedBodyText)).match(/.{1,78}/g)
		if (!body) {
			body = []
		}
		let bodyText = body.join("\r\n")
		let emlArray

		if (header) {
			emlArray = getMailHeaders(header).split("\n")
			for (let i = emlArray.length - 1; i >= 0; i--) {
				if (emlArray[i].match(/^\s*(Content-Type:|boundary=)/)) {
					emlArray.splice(i, 1)
				}
			}
			emlArray = [emlArray.join("\n")]
		} else {
			emlArray = ["From: " + mail.sender.address, "MIME-Version: 1.0"]
			if (mail.toRecipients.length > 0) {
				emlArray.push(_formatRecipient("To: ", mail.toRecipients))
			}
			if (mail.ccRecipients.length > 0) {
				emlArray.push(_formatRecipient("CC: ", mail.ccRecipients))
			}
			if (mail.bccRecipients.length > 0) {
				emlArray.push(_formatRecipient("BCC: ", mail.bccRecipients))
			}
			let subject = (mail.subject.trim() === "") ? "" : "=?UTF-8?B?"
				+ uint8ArrayToBase64(stringToUtf8Uint8Array(mail.subject)) + "?="
			emlArray.push(...[
				"Subject: " + subject,
				"Date: " + _formatSmtpDateTime(mail.sentDate),
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
		return Promise.map(mail.attachments, fileId => {
			return load(FileTypeRef, fileId).then(attachment => {
				return worker.downloadFileContent(attachment).then(file => {
					let dataFile = ((file: any): DataFile)
					let base64Filename = "=?UTF-8?B?" +
						uint8ArrayToBase64(stringToUtf8Uint8Array(attachment.name)) + "?="
					const fileContent = uint8ArrayToBase64(dataFile.data)
					const lines = [
						"--------------79Bu5A16qPEYcVIZL@tutanota",
						"Content-Type: " + getCleanedMimeType(attachment.mimeType),
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
				})
			})
		}, {concurrency: 1}).then(() => {
			emlArray.push("--------------79Bu5A16qPEYcVIZL@tutanota--")
			return emlArray.join("\r\n")
		})
	})
}

function _formatSmtpDateTime(date) {
	let dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
	let monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
	return dayNames[date.getUTCDay()] + ", " + date.getUTCDate() + " " + monthNames[date.getUTCMonth()] + " "
		+ date.getUTCFullYear() + " " + pad(date.getUTCHours(), 2) + ":" + pad(date.getUTCMinutes(), 2) + ":"
		+ pad(date.getUTCSeconds(), 2) + " +0000"
}

function _formatRecipient(key, recipients) {
	let recipientsString = key
	for (let i = 0; i < recipients.length; i++) {
		recipientsString += recipients[i].address + ",\r\n" + new Array(key.length).join(' ')
	}
	return recipientsString.substr(0, recipientsString.length - (2 + key.length))
}
