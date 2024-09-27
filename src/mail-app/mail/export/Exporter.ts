import {
	assertNotNull,
	formatSortableDateTime,
	noOp,
	pad,
	promiseMap,
	sortableTimestamp,
	stringToBase64,
	stringToUtf8Uint8Array,
	uint8ArrayToBase64,
} from "@tutao/tutanota-utils"
import { createDataFile, DataFile, getCleanedMimeType } from "../../../common/api/common/DataFile"
import { makeMailBundle } from "./Bundler"
import { isDesktop } from "../../../common/api/common/Env"
import { sanitizeFilename } from "../../../common/api/common/utils/FileUtils"
import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import type { EntityClient } from "../../../common/api/common/EntityClient"
import { locator } from "../../../common/api/main/CommonLocator"
import { FileController, zipDataFiles } from "../../../common/file/FileController"
import { MailFacade } from "../../../common/api/worker/facades/lazy/MailFacade.js"
import { OperationId } from "../../../common/api/main/OperationProgressTracker.js"
import { CancelledError } from "../../../common/api/common/error/CancelledError.js"
import { CryptoFacade } from "../../../common/api/worker/crypto/CryptoFacade.js"
import { MailBundle, MailBundleRecipient, MailExportMode } from "../../../common/mailFunctionality/SharedMailUtils.js"

export async function generateMailFile(bundle: MailBundle, fileName: string, mode: MailExportMode): Promise<DataFile> {
	return mode === "eml" ? mailToEmlFile(bundle, fileName) : locator.fileApp.mailToMsg(bundle, fileName)
}

export async function getMailExportMode(): Promise<MailExportMode> {
	if (isDesktop()) {
		const ConfigKeys = await import("../../../common/desktop/config/ConfigKeys")
		const mailExportMode = (await locator.desktopSettingsFacade
			.getStringConfigValue(ConfigKeys.DesktopConfigKey.mailExportMode)
			.catch(noOp)) as MailExportMode
		return mailExportMode ?? "eml"
	} else {
		return "eml"
	}
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

/**
 * export mails. a single one will be exported as is, multiple will be put into a zip file
 * a save dialog will then be shown
 * @returns {Promise<Mail[]>} resolved with failed mails or empty after the fileController
 * was instructed to open the new zip File containing the exported files
 */
export async function exportMails(
	mails: Array<Mail>,
	mailFacade: MailFacade,
	entityClient: EntityClient,
	fileController: FileController,
	cryptoFacade: CryptoFacade,
	operationId?: OperationId,
	signal?: AbortSignal,
): Promise<{ failed: Mail[] }> {
	let cancelled = false

	const onAbort = () => {
		cancelled = true
	}

	try {
		// Considering that the effort for generating the bundle is higher
		// than generating the files, we need to consider it twice, so the
		// total effort would be (mailsToBundle * 2) + filesToGenerate
		const totalMails = mails.length * 3
		let doneMails = 0
		const errorMails: Mail[] = []

		signal?.addEventListener("abort", onAbort)
		const updateProgress =
			operationId !== undefined ? () => locator.operationProgressTracker.onProgress(operationId, (++doneMails / totalMails) * 100) : noOp

		//The only way to skip a Promise is throwing an error.
		//this throws just a CancelledError to be handled by the try/catch statement.

		//This function must be called in each iteration across all promises since
		//throwing it inside the onAbort function doesn't interrupt the pending promises.
		const checkAbortSignal = () => {
			if (cancelled) throw new CancelledError("export cancelled")
		}

		const downloadPromise = promiseMap(mails, async (mail) => {
			checkAbortSignal()
			try {
				const { htmlSanitizer } = await import("../../../common/misc/HtmlSanitizer")
				return await makeMailBundle(mail, mailFacade, entityClient, fileController, htmlSanitizer, cryptoFacade)
			} catch (e) {
				errorMails.push(mail)
			} finally {
				updateProgress()
				updateProgress()
			}
		})

		const [mode, bundles] = await Promise.all([getMailExportMode(), downloadPromise])
		const dataFiles: DataFile[] = []
		for (const bundle of bundles) {
			if (!bundle) continue

			checkAbortSignal()
			const mailFile = await generateMailFile(bundle, generateExportFileName(bundle.subject, new Date(bundle.receivedOn), mode), mode)
			dataFiles.push(mailFile)
			updateProgress()
		}

		const zipName = `${sortableTimestamp()}-${mode}-mail-export.zip`
		const outputFile = await (dataFiles.length === 1 ? dataFiles[0] : zipDataFiles(dataFiles, zipName))
		await fileController.saveDataFile(outputFile)

		return {
			failed: errorMails,
		}
	} catch (e) {
		if (e.name !== "CancelledError") throw e
	} finally {
		signal?.removeEventListener("abort", onAbort)
	}

	return { failed: [] }
}

export function mailToEmlFile(mail: MailBundle, fileName: string): DataFile {
	const data = stringToUtf8Uint8Array(mailToEml(mail))
	return createDataFile(fileName, "message/rfc822", data)
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
 * Break up a long string into lines of up to 78 characters
 * @param string
 * @returns the lines, each as an individual array
 */
function breakIntoLines(string: string): Array<string> {
	return string.length > 0 ? assertNotNull(string.match(/.{1,78}/g)) : []
}
