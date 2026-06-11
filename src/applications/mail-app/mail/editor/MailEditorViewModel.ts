import m from "mithril"
import { SendMailModel } from "../../../common/mailFunctionality/SendMailModel.js"
import { contains, debounce, findAllAndRemove, isNotNull, ofClass } from "../../../../platform-kit/utils"
import { PermissionError } from "../../../common/api/common/error/PermissionError"
import { Dialog } from "../../../../ui/base/Dialog"
import { FileNotFoundError } from "../../../common/api/common/error/FileNotFoundError"
import { lang } from "../../../../ui/utils/LanguageViewModel"
import { UserError } from "../../../common/api/main/UserError"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl"
import { locator } from "../../../common/api/main/CommonLocator"
import { showFileChooser } from "../../../common/file/FileController.js"
import { isAndroidApp, isDesktop, Mode } from "../../../../platform-kit/app-env"
import { AttachmentBubbleAttrs, AttachmentType } from "../../../../ui/AttachmentBubble.js"
import { Attachment, FileReference, isDataFile, isFileReference } from "../../../../entities/tutanota/Utils"
import { DataFile } from "../../../../entities/tutanota/MailBundle"
import { AttachmentDownloader } from "../view/MailGuiUtils"

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
			case Mode.Desktop: {
				// this is important for the desktop client so it can attach them as inline images. // we have file refs and want to read them.
				const dataFiles: Array<DataFile> = (
					await Promise.all((files as Array<FileReference>).map(async (f) => locator.fileApp.readDataFile(f.location)))
				).filter(isNotNull)
				model.attachFiles(dataFiles)
				return dataFiles
			}
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

export function createAttachmentBubbleAttrs(
	model: SendMailModel,
	fileDownloader: AttachmentDownloader,
	getDomElement: () => HTMLElement,
): Array<AttachmentBubbleAttrs> {
	return model.getAttachments().map((attachment) => ({
		attachment,
		// If it is a data file, the only option is to download so do not show open option
		open: (isAndroidApp() || isDesktop()) && !isDataFile(attachment) ? () => fileDownloader.openAndDownloadAttachment(attachment, true) : null,
		download: !isFileReference(attachment) ? () => fileDownloader.openAndDownloadAttachment(attachment, false) : null,
		remove: () => {
			// If an attachment has a cid it means it could be in the editor's inline images too
			if (attachment.cid) {
				if (contains(model.getAttachments(), attachment)) {
					model.getRemovedInlineImages().push(attachment)
					const inlineImageElement = getDomElement().querySelector(`[cid='${attachment.cid}']`)
					inlineImageElement?.remove()
				}
			}
			model.removeAttachment(attachment)

			m.redraw()
		},
		fileImport: null,
		type: AttachmentType.GENERIC,
	}))
}

export const cleanupInlineAttachments: (arg0: HTMLElement, arg2: Array<Attachment>, arg3: Array<Attachment>) => void = debounce(
	50,
	(domElement: HTMLElement, attachments: Array<Attachment>, removedInlineImages: Array<Attachment>) => {
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
		if (domElement) {
			const elementsToRemove: Attachment[] = []
			const imagesInDocument = domElement.querySelectorAll("img[cid]")
			const imageCids: string[] = []

			for (let i = 0; i < imagesInDocument.length; i++) {
				const cid = imagesInDocument[i].getAttribute("cid")
				if (cid) {
					imageCids.push(cid)

					// We try to find if image was previously removed and is now being added back in (undo to bring back a removed image)
					const attachmentIndex = removedInlineImages.findIndex((a) => a.cid === cid)
					if (attachmentIndex !== -1) {
						const removedAttachment = removedInlineImages.splice(attachmentIndex, 1)[0]
						attachments.push(removedAttachment)
						m.redraw()
					}
				}
			}

			for (const attachment of attachments) {
				// if the attachment has a cid then it is an inline image
				if (attachment.cid && !imageCids.includes(attachment.cid)) {
					elementsToRemove.push(attachment)
					removedInlineImages.push(attachment)
				}
			}

			if (findAllAndRemove(attachments, (attachment) => elementsToRemove.includes(attachment))) {
				m.redraw()
			}
		}
	},
)

export function getConfidentialStateMessage(isConfidential: boolean): string {
	return isConfidential ? lang.get("confidentialStatus_msg") : lang.get("nonConfidentialStatus_msg")
}
