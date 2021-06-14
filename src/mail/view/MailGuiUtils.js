//@flow
import type {MailModel} from "../model/MailModel"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {LockedError, PreconditionFailedError} from "../../api/common/error/RestError"
import {Dialog} from "../../gui/base/Dialog"
import type {MailFolder} from "../../api/entities/tutanota/MailFolder"
import {locator} from "../../api/main/MainLocator";
import {getArchiveFolder, getFolderIcon, getInboxFolder} from "../model/MailUtils"
import type {AllIconsEnum} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import type {InlineImage, InlineImages} from "./MailViewer";
import type {File as TutanotaFile} from "../../api/entities/tutanota/File";
import {isApp} from "../../api/common/Env";
import {downcast} from "../../api/common/utils/Utils"
import {fileController} from "../../file/FileController"
import {getCoordsOfMouseOrTouchEvent} from "../../gui/base/GuiUtils"
import {showDropdownAtPosition} from "../../gui/base/DropdownN"
import {ButtonType} from "../../gui/base/ButtonN"
import {FileOpenError} from "../../api/common/error/FileOpenError"

export function showDeleteConfirmationDialog(mails: $ReadOnlyArray<Mail>): Promise<boolean> {
	let groupedMails = mails.reduce((all, mail) => {
		locator.mailModel.isFinalDelete(locator.mailModel.getMailFolder(mail._id[0])) ? all.trash.push(mail) : all.move.push(mail)
		return all
	}, {trash: [], move: []})

	let confirmationTextId = null
	if (groupedMails.trash.length > 0) {
		if (groupedMails.move.length > 0) {
			confirmationTextId = "finallyDeleteSelectedEmails_msg"
		} else {
			confirmationTextId = "finallyDeleteEmails_msg"
		}
	}
	if (confirmationTextId != null) {
		return Dialog.confirm(confirmationTextId)
	} else {
		return Promise.resolve(true)
	}
}

/**
 * @return whether emails were deleted
 */
export function promptAndDeleteMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, onConfirm: () => void): Promise<boolean> {
	return showDeleteConfirmationDialog(mails).then((confirmed) => {
		if (confirmed) {
			onConfirm()
			return mailModel.deleteMails(mails)
			                .then(() => true)
			                .catch((e) => {
				                //LockedError should no longer be thrown!?!
				                if (e instanceof PreconditionFailedError || e instanceof LockedError) {
					                return Dialog.error("operationStillActive_msg").then(() => false)
				                } else {
					                throw e
				                }
			                })
		} else {
			return Promise.resolve(false)
		}
	})
}

/**
 * @return whether mails were actually moved
 */
export function moveMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, targetMailFolder: MailFolder): Promise<boolean> {
	return mailModel.moveMails(mails, targetMailFolder)
	                .then(() => true)
	                .catch((e) => {
		                //LockedError should no longer be thrown!?!
		                if (e instanceof LockedError || e instanceof PreconditionFailedError) {
			                return Dialog.error("operationStillActive_msg").then(() => false)
		                } else {
			                throw e
		                }
	                })
}

export function archiveMails(mails: Mail[]): Promise<*> {
	if (mails.length > 0) {
		// assume all mails in the array belong to the same Mailbox
		return locator.mailModel.getMailboxFolders(mails[0])
		              .then((folders) => moveMails(locator.mailModel, mails, getArchiveFolder(folders)))
	} else {
		return Promise.resolve()
	}
}

export function moveToInbox(mails: Mail[]): Promise<*> {
	if (mails.length > 0) {
		// assume all mails in the array belong to the same Mailbox
		return locator.mailModel.getMailboxFolders(mails[0])
		              .then((folders) => moveMails(locator.mailModel, mails, getInboxFolder(folders)))
	} else {
		return Promise.resolve()
	}
}

export function getMailFolderIcon(mail: Mail): AllIconsEnum {
	let folder = locator.mailModel.getMailFolder(mail._id[0])
	if (folder) {
		return getFolderIcon(folder)()
	} else {
		return Icons.Folder
	}
}

export function replaceCidsWithInlineImages(dom: HTMLElement, inlineImages: InlineImages): Array<HTMLElement> {
	// all image tags which have cid attribute. The cid attribute has been set by the sanitizer for adding a default image.
	const imageElements: Array<HTMLElement> = Array.from(dom.querySelectorAll("img[cid]"))
	const elementsWithCid = []
	imageElements.forEach((imageElement) => {
		const cid = imageElement.getAttribute("cid")
		if (cid) {
			const inlineImage = inlineImages.get(cid)
			if (inlineImage) {
				elementsWithCid.push(imageElement)
				imageElement.setAttribute("src", inlineImage.url)
				imageElement.setAttribute("title", inlineImage.file.name)
				imageElement.classList.remove("tutanota-placeholder")

				if (isApp()) { // Add long press action for apps
					let timeoutId: ?TimeoutID
					let startCoords: ?{x: number, y: number}
					imageElement.addEventListener("touchstart", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch) return
						startCoords = {x: touch.clientX, y: touch.clientY}
						timeoutId = setTimeout(() => {
							handleInlineImageContextLongPress(inlineImage, e)
						}, 800)
					})
					imageElement.addEventListener("touchmove", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch || !startCoords || !timeoutId) return
						if (Math.abs(touch.clientX - startCoords.x) > 40 || Math.abs(touch.clientY - startCoords.y) > 40) {
							clearTimeout(timeoutId)
						}
					})

					imageElement.addEventListener("touchend", () => {
						timeoutId && clearTimeout(timeoutId)
					})
				}
			}
		}
	})
	return elementsWithCid
}

function handleInlineImageContextLongPress(inlineImage: InlineImage, event: MouseEvent | TouchEvent) {
	const file = inlineImage.file
	if (file._type !== "DataFile") {
		const coords = getCoordsOfMouseOrTouchEvent(event)
		showDropdownAtPosition([
			{
				label: "download_action",
				click: () => downloadAndMaybeOpenFile(file, false),
				type: ButtonType.Dropdown
			},
			{
				label: "open_action",
				click: () => downloadAndMaybeOpenFile(file, true),
				type: ButtonType.Dropdown
			},
		], coords.x, coords.y)
	}
}

export function downloadAndMaybeOpenFile(file: TutanotaFile, open: boolean): void {
	fileController.downloadAndOpen(file, open)
	              .catch(FileOpenError, () => Dialog.error("canNotOpenFileOnDevice_msg"))
	              .catch(e => {
		              const msg = e || "unknown error"
		              console.error("could not open file:", msg)
		              return Dialog.error("errorDuringFileOpen_msg")
	              })
}

export function replaceInlineImagesWithCids(dom: HTMLElement): HTMLElement {
	const domClone: HTMLElement = dom.cloneNode(true)
	const inlineImages: Array<HTMLElement> = Array.from(domClone.querySelectorAll("img[cid]"))
	inlineImages.forEach((inlineImage) => {
		const cid = inlineImage.getAttribute("cid")
		inlineImage.setAttribute("src", "cid:" + (cid || ""))
		inlineImage.removeAttribute("cid")
	})
	return domClone
}

export type InlineImageReference = {
	cid: string;
	objectUrl: string;
}

export function createInlineImage(file: FileReference | DataFile): InlineImageReference {
	// Let'S assume it's DataFile for now... Editor bar is available for apps but image button is not
	const dataFile: DataFile = downcast(file)
	const cid = Math.random().toString(30).substring(2)
	file.cid = cid
	const blob = new Blob([dataFile.data], {type: file.mimeType})
	const objectUrl = URL.createObjectURL(blob)
	return {
		cid: cid,
		objectUrl: objectUrl
	}
}