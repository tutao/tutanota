import m from "mithril"
import type { Attachment } from "../../../common/mailFunctionality/SendMailModel.js"
import { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { debounce, findAllAndRemove, isNotNull, ofClass, remove } from "@tutao/tutanota-utils"
import { Mode } from "../../../common/api/common/Env"
import { PermissionError } from "../../../common/api/common/error/PermissionError"
import { Dialog } from "../../../common/gui/base/Dialog"
import { FileNotFoundError } from "../../../common/api/common/error/FileNotFoundError"
import { lang } from "../../../common/misc/LanguageViewModel"
import { FileOpenError } from "../../../common/api/common/error/FileOpenError"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { locator } from "../../../common/api/main/CommonLocator"
import { FileReference, isDataFile, isFileReference, isTutanotaFile } from "../../../common/api/common/utils/FileUtils"
import { DataFile } from "../../../common/api/common/DataFile"
import { showFileChooser } from "../../../common/file/FileController.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { AttachmentBubbleAttrs, AttachmentType } from "../../../common/gui/AttachmentBubble.js"

export async function chooseAndAttachFile(
	model: SendMailModel,
	boundingRect: ClientRect,
	fileTypes?: Array<string>,
): Promise<ReadonlyArray<DataFile | FileReference> | void> {
	boundingRect.height = Math.round(boundingRect.height)
	boundingRect.width = Math.round(boundingRect.width)
	boundingRect.x = Math.round(boundingRect.x)
	boundingRect.y = Math.round(boundingRect.y)
	try {
		const files = await showFileChooserForAttachments(boundingRect, fileTypes)
		if (!files || files.length === 0) return
		switch (env.mode) {
			case Mode.App:
				// we have file refs and want to keep them
				model.attachFiles(files)
				return files
			case Mode.Desktop:
				// we have file refs and want to read them.
				// this is important for the desktop client so it can attach them as inline images.
				const dataFiles: Array<DataFile> = (
					await Promise.all((files as Array<FileReference>).map(async (f) => locator.fileApp.readDataFile(f.location)))
				).filter(isNotNull)
				model.attachFiles(dataFiles)
				return dataFiles
			default:
				// we have data files and want to keep them
				model.attachFiles(files)
				return files
		}
	} catch (e) {
		if (e instanceof UserError) {
			await showUserError(e)
		} else {
			const msg = e.message || "unknown error"
			console.error("could not attach files:", msg)
		}
	}
}

export function showFileChooserForAttachments(boundingRect: ClientRect, fileTypes?: Array<string>): Promise<ReadonlyArray<FileReference | DataFile> | void> {
	const fileSelector = [Mode.App, Mode.Desktop].includes(env.mode)
		? locator.fileApp.openFileChooser(boundingRect, fileTypes)
		: showFileChooser(true, fileTypes)
	return fileSelector
		.catch(
			ofClass(PermissionError, () => {
				Dialog.message("fileAccessDeniedMobile_msg")
			}),
		)
		.catch(
			ofClass(FileNotFoundError, () => {
				Dialog.message("couldNotAttachFile_msg")
			}),
		)
}

export function createAttachmentBubbleAttrs(model: SendMailModel, inlineImageElements: Array<HTMLElement>): Array<AttachmentBubbleAttrs> {
	return model.getAttachments().map((attachment) => ({
		attachment,
		open: null,
		download: () => _downloadAttachment(attachment),
		remove: () => {
			model.removeAttachment(attachment)

			// If an attachment has a cid it means it could be in the editor's inline images too
			if (attachment.cid) {
				const imageElement = inlineImageElements.find((e) => e.getAttribute("cid") === attachment.cid)

				if (imageElement) {
					imageElement.remove()
					remove(inlineImageElements, imageElement)
				}
			}

			m.redraw()
		},
		fileImport: null,
		type: AttachmentType.GENERIC,
	}))
}

async function _downloadAttachment(attachment: Attachment) {
	try {
		if (isFileReference(attachment)) {
			await locator.fileApp.open(attachment)
		} else if (isDataFile(attachment)) {
			await locator.fileController.saveDataFile(attachment)
		} else if (isTutanotaFile(attachment)) {
			await locator.fileController.download(attachment)
		} else {
			throw new ProgrammingError("attachment is neither reference, datafile nor tutanotafile!")
		}
	} catch (e) {
		if (e instanceof FileOpenError) {
			return Dialog.message("canNotOpenFileOnDevice_msg")
		} else {
			const msg = e.message || "unknown error"
			console.error("could not open file:", msg)
			return Dialog.message("errorDuringFileOpen_msg")
		}
	}
}

export const cleanupInlineAttachments: (arg0: HTMLElement, arg1: Array<HTMLElement>, arg2: Array<Attachment>) => void = debounce(
	50,
	(domElement: HTMLElement, inlineImageElements: Array<HTMLElement>, attachments: Array<Attachment>) => {
		// Previously we replied on subtree option of MutationObserver to receive info when nested child is removed.
		// It works but it doesn't work if the parent of the nested child is removed, we would have to go over each mutation
		// and check each descendant and if it's an image with CID or not.
		// It's easier and faster to just go over each inline image that we know about. It's more bookkeeping but it's easier
		// code which touches less dome.
		//
		// Alternative would be observe the parent of each inline image but that's more complexity and we need to take care of
		// new (just inserted) inline images and also assign listener there.
		// Doing this check instead of relying on mutations also helps with the case when node is removed but inserted again
		// briefly, e.g. if some text is inserted before/after the element, Squire would put it into another diff and this
		// means removal + insertion.
		const elementsToRemove: HTMLElement[] = []
		for (const inlineImage of inlineImageElements) {
			if (domElement && !domElement.contains(inlineImage)) {
				const cid = inlineImage.getAttribute("cid")
				const attachmentIndex = attachments.findIndex((a) => a.cid === cid)

				if (attachmentIndex !== -1) {
					attachments.splice(attachmentIndex, 1)
					elementsToRemove.push(inlineImage)
					m.redraw()
				}
			}
		}
		findAllAndRemove(inlineImageElements, (imageElement) => elementsToRemove.includes(imageElement))
	},
)

export function getConfidentialStateMessage(isConfidential: boolean): string {
	return isConfidential ? lang.get("confidentialStatus_msg") : lang.get("nonConfidentialStatus_msg")
}
