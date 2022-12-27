import m from "mithril"
import type { Attachment } from "./SendMailModel"
import { SendMailModel } from "./SendMailModel"
import { debounce, findAllAndRemove, ofClass, remove } from "@tutao/tutanota-utils"
import { Mode } from "../../api/common/Env"
import { PermissionError } from "../../api/common/error/PermissionError"
import { Dialog } from "../../gui/base/Dialog"
import { FileNotFoundError } from "../../api/common/error/FileNotFoundError"
import { lang } from "../../misc/LanguageViewModel"
import type { ButtonAttrs } from "../../gui/base/Button.js"
import { ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { FileOpenError } from "../../api/common/error/FileOpenError"
import { createDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { Icons } from "../../gui/base/icons/Icons"
import { formatStorageSize } from "../../misc/Formatter"
import { UserError } from "../../api/main/UserError"
import { showUserError } from "../../misc/ErrorHandlerImpl"
import { locator } from "../../api/main/MainLocator"
import { FileReference, isDataFile, isFileReference, isTutanotaFile } from "../../api/common/utils/FileUtils"
import { DataFile } from "../../api/common/DataFile"
import { showFileChooser } from "../../file/FileController.js"
import { ProgrammingError } from "../../api/common/error/ProgrammingError.js"

export function chooseAndAttachFile(
	model: SendMailModel,
	boundingRect: ClientRect,
	fileTypes?: Array<string>,
): Promise<ReadonlyArray<FileReference | DataFile> | void> {
	boundingRect.height = Math.round(boundingRect.height)
	boundingRect.width = Math.round(boundingRect.width)
	boundingRect.x = Math.round(boundingRect.x)
	boundingRect.y = Math.round(boundingRect.y)
	return showFileChooserForAttachments(boundingRect, fileTypes)
		.then(async (files) => {
			if (files) {
				model.attachFiles(files)
			}

			return files
		})
		.catch(ofClass(UserError, showUserError))
}

export function showFileChooserForAttachments(boundingRect: ClientRect, fileTypes?: Array<string>): Promise<ReadonlyArray<FileReference | DataFile> | void> {
	const fileSelector = env.mode === Mode.App ? locator.fileApp.openFileChooser(boundingRect) : showFileChooser(true, fileTypes)
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

export function createAttachmentButtonAttrs(model: SendMailModel, inlineImageElements: Array<HTMLElement>): Array<ButtonAttrs> {
	return model.getAttachments().map((file) => {
		const lazyButtonAttrs: DropdownButtonAttrs[] = [
			{
				label: "download_action",
				click: () => _downloadAttachment(file),
			},
			{
				label: "remove_action",
				click: () => {
					model.removeAttachment(file)

					// If an attachment has a cid it means it could be in the editor's inline images too
					if (file.cid) {
						const imageElement = inlineImageElements.find((e) => e.getAttribute("cid") === file.cid)

						if (imageElement) {
							imageElement.remove()
							remove(inlineImageElements, imageElement)
						}
					}

					m.redraw()
				},
			},
		]

		return {
			label: () => file.name,
			icon: () => Icons.Attachment,
			type: ButtonType.Bubble,
			staticRightText: "(" + formatStorageSize(Number(file.size)) + ")",
			colors: ButtonColor.Elevated,
			click: createDropdown({
				lazyButtons: () => lazyButtonAttrs,
			}),
		}
	})
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
		inlineImageElements.forEach((inlineImage) => {
			if (domElement && !domElement.contains(inlineImage)) {
				const cid = inlineImage.getAttribute("cid")
				const attachmentIndex = attachments.findIndex((a) => a.cid === cid)

				if (attachmentIndex !== -1) {
					attachments.splice(attachmentIndex, 1)
					elementsToRemove.push(inlineImage)
					m.redraw()
				}
			}
		})
		findAllAndRemove(inlineImageElements, (imageElement) => elementsToRemove.includes(imageElement))
	},
)

export function getConfidentialStateMessage(isConfidential: boolean): string {
	return isConfidential ? lang.get("confidentialStatus_msg") : lang.get("nonConfidentialStatus_msg")
}
