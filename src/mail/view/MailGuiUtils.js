//@flow
import type {MailModel} from "../model/MailModel"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {LockedError, PreconditionFailedError} from "../../api/common/error/RestError"
import {Dialog} from "../../gui/base/Dialog"
import type {MailFolder} from "../../api/entities/tutanota/MailFolder"
import {locator} from "../../api/main/MainLocator";
import {sortableTimestamp} from "../../api/common/utils/DateUtils"
import {fileController} from "../../file/FileController"
import {getArchiveFolder, getFolderIcon, getInboxFolder} from "../model/MailUtils"
import type {AllIconsEnum} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {worker} from "../../api/main/WorkerClient"
import {mailToEmlFile} from "../export/Exporter"
import type {InlineImages} from "./MailViewer";
import type {File as TutanotaFile} from "../../api/entities/tutanota/File";
import {isApp, isDesktop} from "../../api/common/Env";
import {downcast} from "../../api/common/utils/Utils"
import type {MailBundle} from "../export/Bundler"
import {makeMailBundle} from "../export/Bundler"

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

export function promptAndDeleteMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, onConfirm: () => void): Promise<void> {
	return showDeleteConfirmationDialog(mails).then(() => {
		onConfirm()

		return mailModel.deleteMails(mails)
		                .catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
		                .catch(LockedError, e => Dialog.error("operationStillActive_msg")) //LockedError should no longer be thrown!?!
	})
}

export function moveMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, targetMailFolder: MailFolder): Promise<void> {
	return mailModel.moveMails(mails, targetMailFolder)
	                .catch(LockedError, e => Dialog.error("operationStillActive_msg")) //LockedError should no longer be thrown!?!
	                .catch(PreconditionFailedError, e => Dialog.error("operationStillActive_msg"))
}


/**
 * export a set of mails into a zip file and offer to download
 * @param entityClient
 * @param worker
 * @param mails array of mails to export
 * @returns {Promise<void>} resolved after the fileController
 * was instructed to open the new zip File containing the mail eml
 */
export function exportMails(mails: Array<MailBundle>): Promise<void> {
	const zipName = `${sortableTimestamp()}-mail-export.zip`
	return fileController.zipDataFiles(mails.map(mailToEmlFile), zipName)
	                     .then(zip => fileController.open(zip))
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

/**
 * Uses the global entityClient and worker to bundle a mail
 * (the worker and entityClient can't be imported from mailUtils, and it's nice to keep them as parameters in makeMailBundle anyway, for testing)
 * Convenience function, should maybe be removed?
 * @param mail
 * @returns {Promise<MailBundle>}
 */
export function bundleMail(mail: Mail): Promise<MailBundle> {
	return makeMailBundle(mail, locator.entityClient, worker)
}

/**
 * Uses the global entityClient and worker to bundle some mails
 * Also convenience function that should also maybe be removed
 * @param mails
 * @returns {Promise<MailBundle[]>}
 */
export function bundleMails(mails: Array<Mail>): Promise<Array<MailBundle>> {
	return Promise.mapSeries(mails, bundleMail)
}

export function replaceCidsWithInlineImages(dom: HTMLElement, inlineImages: InlineImages,
                                            onContext: (TutanotaFile | DataFile, Event, HTMLElement) => mixed): Array<HTMLElement> {
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
				imageElement.classList.remove("tutanota-placeholder")

				if (isApp()) { // Add long press action for apps
					let timeoutId: ?TimeoutID
					let startCoords: ?{x: number, y: number}
					imageElement.addEventListener("touchstart", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch) return
						startCoords = {x: touch.clientX, y: touch.clientY}
						timeoutId = setTimeout(() => {
							onContext(inlineImage.file, e, imageElement)
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

				if (isDesktop()) { // add right click action for desktop apps
					imageElement.addEventListener("contextmenu", (e: MouseEvent) => {
						onContext(inlineImage.file, e, imageElement)
						e.preventDefault()
					})
				}
			}
		}
	})
	return elementsWithCid
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