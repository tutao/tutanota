// @flow
import path from "path"
import {isReservedFilename, legalizeFilenames} from "../api/common/utils/FileUtils"
import {legalizeFilenames} from "../api/common/utils/FileUtils"
import {fileExists, isReservedFilename} from "./PathUtils"
import {promises as fs} from "fs"
import type {MailBundle} from "../mail/export/Bundler"
import {Attachment, Email, MessageEditorFormat} from "oxmsg"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import {createDataFile} from "../api/common/DataFile"
import {generateExportFileName} from "../mail/export/Exporter"
import {promiseMap} from "../api/common/utils/PromiseUtils"

const EXPORT_DIR = "export"

/**
 * Get the directory path into which temporary exports should be exported
 * @returns {Promise<string>}
 * @param dl
 * @param app: electron app for getting temp dir path
 */
export async function getExportDirectoryPath(dl: DesktopDownloadManager): Promise<string> {
	return dl.getTutanotaTempDirectory(EXPORT_DIR)
}

/**
 * @param dirPath
 * @param files Array of named content to write to tmp
 * @returns {string} a list of the full paths of the files that were written
 * */
export async function writeFiles(dirPath: string, files: Array<DataFile>): Promise<Array<string>> {
	const legalNames = legalizeFilenames(files.map(f => f.name), isReservedFilename)
	const legalFiles = files.map(f => ({
		data: f.data,
		name: legalNames[f.name].shift()
	}))

	return promiseMap(legalFiles, async file => {
		await fs.writeFile(path.join(dirPath, file.name), file.data)
		return file.name
	})
}

export async function writeFile(dirPath: string, file: DataFile): Promise<void> {
	const legalName = legalizeFilenames([file.name], isReservedFilename)[file.name][0]
	const fullPath = path.join(dirPath, legalName)
	return fs.writeFile(fullPath, file.data)
}

export async function makeMsgFile(bundle: MailBundle, fileName: string): Promise<DataFile> {
	const subject = `[Tutanota] ${bundle.subject}`
	const email = new Email(bundle.isDraft, bundle.isRead)
		.subject(subject)
		.bodyHtml(bundle.body)
		.bodyFormat(MessageEditorFormat.EDITOR_FORMAT_HTML)
		.sender(bundle.sender.address, bundle.sender.name)
		.tos(bundle.to)
		.ccs(bundle.cc)
		.bccs(bundle.bcc)
		.replyTos(bundle.replyTo)
		.sentOn(new Date(bundle.sentOn))
		.receivedOn(new Date(bundle.receivedOn))
		.headers(bundle.headers || "")
	for (let attachment of bundle.attachments) {
		// When the MailBundle gets passed over via the IPC it loses some of it's type information. the Uint8Arrays stored in the
		// attachment DataFiles cease to be Uint8Arrays and just because regular arrays, thus we have to remake them here.
		// Oxmsg currently doesn't accept regular arrays for binary data, only Uint8Arrays, strings and booleans
		// we could change the Oxmsg behaviour, it's kind of nice for it to be strict though.
		email.attach(new Attachment(new Uint8Array(attachment.data), attachment.name, attachment.cid || ""))
	}

	return createDataFile(fileName, "application/vnd.ms-outlook", email.msg())
}