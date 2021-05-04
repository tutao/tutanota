//@flow
import type {MailModel} from "../model/MailModel"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {createMail} from "../../api/entities/tutanota/Mail"
import {LockedError, PreconditionFailedError} from "../../api/common/error/RestError"
import {Dialog} from "../../gui/base/Dialog"
import type {MailFolder} from "../../api/entities/tutanota/MailFolder"
import {locator} from "../../api/main/MainLocator";
import {getArchiveFolder, getFolderIcon, getInboxFolder} from "../model/MailUtils"
import type {AllIconsEnum} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import type {InlineImages} from "./MailViewer";
import type {File as TutanotaFile} from "../../api/entities/tutanota/File";
import {isApp, isDesktop} from "../../api/common/Env";
import type {WorkerClient} from "../../api/main/WorkerClient"
import {promiseMap} from "../../api/common/utils/PromiseUtils"
import {neverNull} from "../../api/common/utils/Utils"
import type {MailReportTypeEnum} from "../../api/common/TutanotaConstants"
import {MailFolderType, MailReportType, ReportMovedMailsType} from "../../api/common/TutanotaConstants"
import {getElementId} from "../../api/common/utils/EntityUtils"
import {lang} from "../../misc/LanguageViewModel"
import m from "mithril"
import stream from "mithril/stream/stream.js"
import {showSnackBar} from "../../gui/base/SnackBar"
import type {CheckboxAttrs} from "../../gui/base/CheckboxN"
import {CheckboxN} from "../../gui/base/CheckboxN"
import type {MailboxProperties} from "../../api/entities/tutanota/MailboxProperties"
import {loadMailboxProperties, saveReportMovedMails} from "../../misc/MailboxPropertiesUtils"

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
		return Dialog.confirm(confirmationTextId, "ok_action")
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

function confirmMailReportDialog(mailboxProperties: ?MailboxProperties): Promise<boolean> {
	return new Promise((resolve) => {
		const shallRememberDecision = stream(false)
		const rememberDecisionCheckboxAttrs: CheckboxAttrs = {
			label: () => lang.get("rememberDecision_msg"),
			checked: shallRememberDecision,
			helpLabel: () => lang.get("changeMailSettings_msg")
		}
		const child = {
			view: () => {
				return m("", [
					m(".pt", lang.get("unencryptedTransmission_msg") + " " + lang.get("allowOperation_msg")),
					m(".pb", m(CheckboxN, rememberDecisionCheckboxAttrs))
				])
			}
		}

		function updateSpamReportSetting(areMailsReported: boolean) {
			if (shallRememberDecision()) {
				const reportMovedMails = areMailsReported
					? ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM
					: ReportMovedMailsType.NEVER
				saveReportMovedMails(mailboxProperties, reportMovedMails)
			}
			resolve(areMailsReported)
			dialog.close()
		}

		const actionDialogProps = {
			title: () => lang.get("spamReports_label"),
			child,
			okAction: () => updateSpamReportSetting(true),
			allowCancel: true,
			allowOkWithReturn: true,
			okActionTextId: "yes_label",
			cancelAction: () => updateSpamReportSetting(false),
			cancelActionTextId: "no_label",
		}
		const dialog = Dialog.showActionDialog(actionDialogProps)
	})
}

/**
 * Check if the user wants to report mails as spam when they are moved to the spam folder and report them.
 * May open a dialog for confirmation and otherwise shows a Snackbar before reporting to the server.
 */
function reportMailsAutomatically(mailReportType: MailReportTypeEnum, mailModel: MailModel, mails: $ReadOnlyArray<Mail>): Promise<void> {
	if (mailReportType !== MailReportType.SPAM) {
		return Promise.resolve()
	}
	return loadMailboxProperties().then(mailboxProperties => {
		let promise = Promise.resolve(false)
		let allowUndoing = true // decides if a snackbar is shown to prevent the server request
		if (!mailboxProperties || mailboxProperties.reportMovedMails === ReportMovedMailsType.ALWAYS_ASK) {
			promise = confirmMailReportDialog(mailboxProperties)
			allowUndoing = false
		} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.AUTOMATICALLY_ONLY_SPAM) {
			promise = Promise.resolve(true)
		} else if (mailboxProperties.reportMovedMails === ReportMovedMailsType.NEVER) {
			// no report
		}
		return promise.then((isReportable) => {
			if (isReportable) {
				// only show the snackbar to undo the report if the user was not asked already
				if (allowUndoing) {
					let undoClicked = false
					showSnackBar("undoMailReport_msg",
						{
							label: () => "Undo",
							click: () => undoClicked = true,
						},
						() => {
							if (!undoClicked) {
								mailModel.reportMails(mailReportType, mails)
							}
						}
					)
				} else {
					mailModel.reportMails(mailReportType, mails)
				}
			}
		})
	})
}

/**
 * Moves the mails and reports them as spam if the user or settings allow it.
 * @return whether mails were actually moved
 */
export function moveMails(mailModel: MailModel, mails: $ReadOnlyArray<Mail>, targetMailFolder: MailFolder, isReportable: boolean = true): Promise<boolean> {
	return mailModel.moveMails(mails, targetMailFolder)
	                .then(() => {
		                if (targetMailFolder.folderType === MailFolderType.SPAM && isReportable) {
			                const reportableMails = mails.map(mail => {
				                // mails have just been moved
				                const reportableMail = createMail(mail)
				                reportableMail._id = [targetMailFolder.mails, getElementId(mail)]
				                return reportableMail
			                })
			                reportMailsAutomatically(MailReportType.SPAM, mailModel, reportableMails)
		                }
		                return true
	                })
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

export function replaceCidsWithInlineImages(dom: HTMLElement, inlineImages: InlineImages,
                                            onContext: (cid: string, (MouseEvent | TouchEvent), HTMLElement) => mixed): Array<HTMLElement> {
	// all image tags which have cid attribute. The cid attribute has been set by the sanitizer for adding a default image.
	const imageElements: Array<HTMLElement> = Array.from(dom.querySelectorAll("img[cid]"))
	const elementsWithCid = []
	imageElements.forEach((imageElement) => {
		const cid = imageElement.getAttribute("cid")
		if (cid) {
			const inlineImage = inlineImages.get(cid)
			if (inlineImage) {
				elementsWithCid.push(imageElement)
				imageElement.setAttribute("src", inlineImage.objectUrl)
				imageElement.classList.remove("tutanota-placeholder")

				if (isApp()) { // Add long press action for apps
					let timeoutId: ?TimeoutID
					let startCoords: ?{x: number, y: number}
					imageElement.addEventListener("touchstart", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch) return
						startCoords = {x: touch.clientX, y: touch.clientY}
						timeoutId = setTimeout(() => {
							onContext(inlineImage.cid, e, imageElement)
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
						onContext(inlineImage.cid, e, imageElement)
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
	cid: string,
	objectUrl: string,
	blob: Blob
}

export function createInlineImage(file: DataFile): InlineImageReference {
	const cid = Math.random().toString(30).substring(2)
	file.cid = cid
	return createInlineImageReference(file, cid)
}

function createInlineImageReference(file: DataFile, cid: string): InlineImageReference {
	const blob = new Blob([file.data], {type: file.mimeType})
	const objectUrl = URL.createObjectURL(blob)
	return {
		cid,
		objectUrl,
		blob
	}
}

export function cloneInlineImages(inlineImages: InlineImages): InlineImages {
	const newMap = new Map()
	inlineImages.forEach((v, k) => {
		const blob = new Blob([v.blob])
		const objectUrl = URL.createObjectURL(blob)
		newMap.set(k, {cid: v.cid, objectUrl, blob})
	})
	return newMap
}

export function revokeInlineImages(inlineImages: InlineImages): void {
	inlineImages.forEach((v, k) => {
		URL.revokeObjectURL(v.objectUrl)
	})
}

export async function loadInlineImages(worker: WorkerClient, attachments: Array<TutanotaFile>, referencedCids: Array<string>): Promise<InlineImages> {
	const filesToLoad = getReferencedAttachments(attachments, referencedCids)
	const inlineImages = new Map()
	return promiseMap(filesToLoad, async (file) => {
		const dataFile = await worker.downloadFileContent(file)
		const inlineImageReference = createInlineImageReference(dataFile, neverNull(file.cid))
		inlineImages.set(inlineImageReference.cid, inlineImageReference)
	}).then(() => inlineImages)
}

export function getReferencedAttachments(attachments: Array<TutanotaFile>, referencedCids: Array<string>): Array<TutanotaFile> {
	return attachments.filter(file => referencedCids.find(rcid => file.cid === rcid))
}
