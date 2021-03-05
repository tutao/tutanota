// @flow
import path from "path"
import {isReservedFilename, sanitizeFilename} from "../api/common/utils/FileUtils"
import {legalizeFilenames} from "../api/common/utils/FileUtils"
import {fileExists, isReservedFilename} from "./PathUtils"
import {promises as fs} from "fs"
import type {MailBundle} from "../mail/export/Bundler"
import {Attachment, Email, MessageEditorFormat} from "oxmsg"
import type {DesktopDownloadManager} from "./DesktopDownloadManager"
import {createDataFile} from "../api/common/DataFile"

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

export async function writeFile(dirPath: string, file: DataFile): Promise<void> {
	const fullPath = path.join(dirPath, sanitizeFilename(file.name, isReservedFilename))
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