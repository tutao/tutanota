import type { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { File as TutanotaFile, Mail, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { LockedError, PreconditionFailedError } from "../../../common/api/common/error/RestError"
import { Dialog } from "../../../common/gui/base/Dialog"
import { AllIcons } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { isApp, isDesktop } from "../../../common/api/common/Env"
import { $Promisable, assertNotNull, endsWith, first, isEmpty, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils"
import {
	EncryptionAuthStatus,
	getMailFolderType,
	MailReportType,
	MailSetKind,
	MailState,
	SYSTEM_GROUP_MAIL_ADDRESS,
	SystemFolderType,
} from "../../../common/api/common/TutanotaConstants"
import { reportMailsAutomatically } from "./MailReportDialog"
import { DataFile } from "../../../common/api/common/DataFile"
import { lang, Translation } from "../../../common/misc/LanguageViewModel"
import { FileController } from "../../../common/file/FileController"
import { DomRectReadOnlyPolyfilled, Dropdown, DropdownChildAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import { modal } from "../../../common/gui/base/Modal.js"
import { ConversationViewModel } from "./ConversationViewModel.js"
import { size } from "../../../common/gui/size.js"
import { PinchZoom } from "../../../common/gui/PinchZoom.js"
import { InlineImageReference, InlineImages } from "../../../common/mailFunctionality/inlineImagesUtils.js"
import { MailModel, MoveMode } from "../model/MailModel.js"
import { hasValidEncryptionAuthForTeamOrSystemMail } from "../../../common/mailFunctionality/SharedMailUtils.js"
import { mailLocator } from "../../mailLocator.js"
import {
	FolderInfo,
	getFolderName,
	getIndentedFolderNameForDropdown,
	getMoveTargetFolderSystems,
	getMoveTargetFolderSystemsForMailsInFolder,
} from "../model/MailUtils.js"
import { FontIcons } from "../../../common/gui/base/icons/FontIcons.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { isOfTypeOrSubfolderOf } from "../model/MailChecks.js"
import type { FolderSystem, IndentedFolder } from "../../../common/api/common/mail/FolderSystem.js"
import { LabelsPopup } from "./LabelsPopup"
import { styles } from "../../../common/gui/styles"
import { getIds } from "../../../common/api/common/utils/EntityUtils"

/**
 * A function that returns an array of mails, or a promise that eventually returns one.
 */
export type LazyMailIdResolver = () => $Promisable<readonly IdTuple[]>

/**
 * @return whether emails were deleted
 */
export async function promptAndDeleteMails(
	mailModel: MailModel,
	mailIds: readonly IdTuple[],
	filterMailSet: IdTuple | null,
	onConfirm: () => void,
): Promise<boolean> {
	const shouldDeletePermanently = await Dialog.confirm("finallyDeleteEmails_msg", "ok_action")
	if (!shouldDeletePermanently) {
		return false
	}

	onConfirm()

	try {
		await mailModel.finallyDeleteMails(mailIds, filterMailSet)
		return true
	} catch (e) {
		return handleMoveError(e)
	}
}

interface MoveMailsParams {
	mailboxModel: MailboxModel
	mailModel: MailModel
	mailIds: ReadonlyArray<IdTuple>
	targetFolder: MailFolder
	moveMode: MoveMode
	isReportable?: boolean
}

async function reportMails(
	system: FolderSystem,
	targetMailFolder: MailFolder,
	isReportable: boolean,
	mails: () => Promise<readonly Mail[]>,
	mailboxModel: MailboxModel,
	mailModel: MailModel,
): Promise<boolean> {
	if (isOfTypeOrSubfolderOf(system, targetMailFolder, MailSetKind.SPAM) && isReportable) {
		const mailboxDetails = await mailboxModel.getMailboxDetailsForMailGroup(assertNotNull(targetMailFolder._ownerGroup))
		await reportMailsAutomatically(MailReportType.SPAM, mailboxModel, mailModel, mailboxDetails, mails)
	}
	return true
}

/**
 * Moves the mails and reports them as spam if the user or settings allow it.
 * @return whether mails were actually moved
 */
export async function moveMails({ mailboxModel, mailModel, mailIds, targetFolder, moveMode, isReportable = true }: MoveMailsParams): Promise<boolean> {
	const system = mailModel.getFolderSystemByGroupId(assertNotNull(targetFolder._ownerGroup))
	if (system == null) {
		return false
	}
	try {
		await mailModel.moveMails(mailIds, targetFolder, moveMode)
		const resolveMails = () => mailModel.loadAllMails(mailIds)
		return await reportMails(system, targetFolder, isReportable, resolveMails, mailboxModel, mailModel)
	} catch (e) {
		//LockedError should no longer be thrown!?!
		if (e instanceof LockedError || e instanceof PreconditionFailedError) {
			return Dialog.message("operationStillActive_msg").then(() => false)
		} else {
			throw e
		}
	}
}

export async function moveMailsToSystemFolder({
	mailboxModel,
	mailModel,
	mailIds,
	targetFolderType,
	currentFolder,
	moveMode,
	isReportable,
}: {
	mailboxModel: MailboxModel
	mailModel: MailModel
	mailIds: ReadonlyArray<IdTuple>
	targetFolderType: SystemFolderType
	currentFolder: MailFolder
	moveMode: MoveMode
	isReportable?: boolean
}): Promise<boolean> {
	const folderSystem = mailModel.getFolderSystemByGroupId(assertNotNull(currentFolder._ownerGroup))
	const targetFolder = folderSystem?.getSystemFolderByType(targetFolderType)
	if (targetFolder == null) return false
	return await moveMails({ mailboxModel, mailModel, mailIds, targetFolder, isReportable, moveMode })
}

function handleMoveError(err: Error) {
	//LockedError should no longer be thrown!?!
	if (err instanceof LockedError || err instanceof PreconditionFailedError) {
		return Dialog.message("operationStillActive_msg").then(() => false)
	} else {
		throw err
	}
}

export async function trashMails(mailModel: MailModel, mailIds: readonly IdTuple[]): Promise<boolean> {
	await mailModel.trashMails(mailIds).catch(handleMoveError)
	return true
}

export async function simpleMoveToArchive(mailIds: readonly IdTuple[]): Promise<void> {
	await mailLocator.mailModel.simpleMoveMails(mailIds, MailSetKind.ARCHIVE).catch(handleMoveError)
}

export async function simpleMoveToInbox(mailIds: readonly IdTuple[]): Promise<void> {
	await mailLocator.mailModel.simpleMoveMails(mailIds, MailSetKind.INBOX).catch(handleMoveError)
}

export function getFolderIconByType(folderType: MailSetKind): AllIcons {
	switch (folderType) {
		case MailSetKind.CUSTOM:
			return Icons.Folder

		case MailSetKind.INBOX:
			return Icons.Inbox

		case MailSetKind.SENT:
			return Icons.Send

		case MailSetKind.TRASH:
			return Icons.TrashBin

		case MailSetKind.ARCHIVE:
			return Icons.Archive

		case MailSetKind.SPAM:
			return Icons.Spam

		case MailSetKind.DRAFT:
			return Icons.Draft

		default:
			return Icons.Folder
	}
}

export function getFolderIcon(folder: MailFolder): AllIcons {
	return getFolderIconByType(getMailFolderType(folder))
}

export function getMailFolderIcon(mail: Mail): AllIcons {
	let folder = mailLocator.mailModel.getMailFolderForMail(mail)

	if (folder) {
		return getFolderIcon(folder)
	} else {
		return Icons.Folder
	}
}

export function replaceCidsWithInlineImages(
	dom: HTMLElement,
	inlineImages: InlineImages,
	onContext: (cid: string, arg1: MouseEvent | TouchEvent, arg2: HTMLElement) => unknown,
): Array<HTMLElement> {
	// all image tags which have cid attribute. The cid attribute has been set by the sanitizer for adding a default image.
	const imageElements: Array<HTMLElement> = Array.from(dom.querySelectorAll("img[cid]"))
	if (dom.shadowRoot) {
		const shadowImageElements: Array<HTMLElement> = Array.from(dom.shadowRoot.querySelectorAll("img[cid]"))
		imageElements.push(...shadowImageElements)
	}
	const elementsWithCid: HTMLElement[] = []
	for (const imageElement of imageElements) {
		const cid = imageElement.getAttribute("cid")

		if (cid) {
			const inlineImage = inlineImages.get(cid)

			if (inlineImage) {
				elementsWithCid.push(imageElement)
				imageElement.setAttribute("src", inlineImage.objectUrl)
				imageElement.classList.remove("tutanota-placeholder")

				if (isApp()) {
					// Add long press action for apps
					let timeoutId: TimeoutID | null
					let startCoords:
						| {
								x: number
								y: number
						  }
						| null
						| undefined
					imageElement.addEventListener("touchstart", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch) return
						startCoords = {
							x: touch.clientX,
							y: touch.clientY,
						}
						if (timeoutId) clearTimeout(timeoutId)
						timeoutId = setTimeout(() => {
							onContext(inlineImage.cid, e, imageElement)
						}, 800)
					})
					imageElement.addEventListener("touchmove", (e: TouchEvent) => {
						const touch = e.touches[0]
						if (!touch || !startCoords || !timeoutId) return

						if (
							Math.abs(touch.clientX - startCoords.x) > PinchZoom.DRAG_THRESHOLD ||
							Math.abs(touch.clientY - startCoords.y) > PinchZoom.DRAG_THRESHOLD
						) {
							clearTimeout(timeoutId)
							timeoutId = null
						}
					})
					imageElement.addEventListener("touchend", () => {
						if (timeoutId) {
							clearTimeout(timeoutId)
							timeoutId = null
						}
					})
				}

				if (isDesktop()) {
					// add right click action for desktop apps
					imageElement.addEventListener("contextmenu", (e: MouseEvent) => {
						onContext(inlineImage.cid, e, imageElement)
						e.preventDefault()
					})
				}
			}
		}
	}
	return elementsWithCid
}

export function replaceInlineImagesWithCids(dom: HTMLElement): HTMLElement {
	const domClone = dom.cloneNode(true) as HTMLElement
	const inlineImages: Array<HTMLElement> = Array.from(domClone.querySelectorAll("img[cid]"))
	for (const inlineImage of inlineImages) {
		const cid = inlineImage.getAttribute("cid")
		inlineImage.setAttribute("src", "cid:" + (cid || ""))
		inlineImage.removeAttribute("cid")
	}
	return domClone
}

export function createInlineImage(file: DataFile): InlineImageReference {
	const cid = Math.random().toString(30).substring(2)
	file.cid = cid
	return createInlineImageReference(file, cid)
}

function createInlineImageReference(file: DataFile, cid: string): InlineImageReference {
	const blob = new Blob([file.data], {
		type: file.mimeType,
	})
	const objectUrl = URL.createObjectURL(blob)
	return {
		cid,
		objectUrl,
		blob,
	}
}

export async function loadInlineImages(fileController: FileController, attachments: Array<TutanotaFile>, referencedCids: Array<string>): Promise<InlineImages> {
	const filesToLoad = getReferencedAttachments(attachments, referencedCids)
	const inlineImages = new Map()
	return promiseMap(filesToLoad, async (file) => {
		let dataFile = await fileController.getAsDataFile(file)
		const { htmlSanitizer } = await import("../../../common/misc/HtmlSanitizer")
		dataFile = htmlSanitizer.sanitizeInlineAttachment(dataFile)
		const inlineImageReference = createInlineImageReference(dataFile, neverNull(file.cid))
		inlineImages.set(inlineImageReference.cid, inlineImageReference)
	}).then(() => inlineImages)
}

export function getReferencedAttachments(attachments: Array<TutanotaFile>, referencedCids: Array<string>): Array<TutanotaFile> {
	return attachments.filter((file) => referencedCids.find((rcid) => file.cid === rcid))
}

export interface ShowMoveMailsDropdownOpts {
	width?: number
	withBackground?: boolean
	onSelected?: () => unknown
}

export async function showMoveMailsFromFolderDropdown(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	origin: PosRect,
	currentFolder: MailFolder,
	mails: LazyMailIdResolver,
	moveMode: MoveMode,
	opts?: ShowMoveMailsDropdownOpts,
): Promise<void> {
	const folders = await getMoveTargetFolderSystemsForMailsInFolder(mailModel, currentFolder)
	await showMailFolderDropdown(
		origin,
		folders,
		async (f) => {
			const resolvedMails = await mails()
			moveMails({
				mailboxModel,
				mailModel,
				mailIds: resolvedMails,
				targetFolder: f.folder,
				moveMode,
			})
		},
		opts,
	)
}

export async function showMoveMailsDropdown(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	origin: PosRect,
	mails: readonly Mail[],
	moveMode: MoveMode,
	opts?: ShowMoveMailsDropdownOpts,
): Promise<void> {
	const firstMail = first(mails)
	if (firstMail == null) return
	const folders = await getMoveTargetFolderSystems(mailModel, mails)
	await showMailFolderDropdown(
		origin,
		folders,
		(f) => {
			moveMails({
				mailboxModel,
				mailModel: mailModel,
				mailIds: getIds(mails),
				targetFolder: f.folder,
				moveMode,
			})
		},
		opts,
	)
}

export async function showMailFolderDropdown(
	origin: PosRect,
	folders: readonly FolderInfo[],
	onClick: (folder: IndentedFolder) => unknown,
	opts?: { width?: number; withBackground?: boolean; onSelected?: () => unknown },
): Promise<void> {
	const { width = 300, withBackground = false, onSelected = noOp } = opts ?? {}

	if (folders.length === 0) return
	const folderButtons = folders.map(
		(f) =>
			({
				// We need to pass in the raw folder name to avoid including it in searches
				label: lang.makeTranslation(
					`dropdown-folder:${getFolderName(f.folder)}`,
					lang.get("folderDepth_label", {
						"{folderName}": getFolderName(f.folder),
						"{depth}": f.level,
					}),
				),
				text: lang.makeTranslation("folder_name", getIndentedFolderNameForDropdown(f)),
				click: () => {
					onSelected()
					onClick(f)
				},
				icon: getFolderIcon(f.folder),
			}) satisfies DropdownChildAttrs,
	)

	const dropdown = new Dropdown(() => folderButtons, width)
	dropdown.setOrigin(new DomRectReadOnlyPolyfilled(origin.left, origin.top, origin.width, origin.height))
	modal.displayUnique(dropdown, withBackground)
}

export function getConversationTitle(conversationViewModel: ConversationViewModel): Translation {
	if (!conversationViewModel.isFinished()) {
		return lang.getTranslation("loading_msg")
	}
	const numberOfEmails = conversationViewModel.conversationItems().length
	if (numberOfEmails === 1) {
		return lang.getTranslation("oneEmail_label")
	} else {
		return lang.getTranslation("nbrOrEmails_label", { "{number}": numberOfEmails })
	}
}

export function getMoveMailBounds(): PosRect {
	// just putting the move mail dropdown in the left side of the viewport with a bit of margin
	return new DomRectReadOnlyPolyfilled(size.hpad_large, size.vpad_large, 0, 0)
}

/**
 * NOTE: DOES NOT VERIFY IF THE MESSAGE IS AUTHENTIC - DO NOT USE THIS OUTSIDE OF THIS FILE OR FOR TESTING
 * @VisibleForTesting
 */
export function isTutanotaTeamAddress(address: string): boolean {
	return endsWith(address, "@tutao.de") || address === "no-reply@tutanota.de"
}

/**
 * Is this a tutao team member email or a system notification
 */
export function isTutanotaTeamMail(mail: Mail): boolean {
	const { confidential, sender, state } = mail
	return (
		confidential &&
		state === MailState.RECEIVED &&
		hasValidEncryptionAuthForTeamOrSystemMail(mail) &&
		(sender.address === SYSTEM_GROUP_MAIL_ADDRESS || isTutanotaTeamAddress(sender.address))
	)
}

/**
 * Returns the confidential icon for the given mail which indicates either RSA or PQ encryption.
 * The caller must ensure that the mail is in a confidential state.
 */
export function getConfidentialIcon(mail: Mail): Icons {
	if (!mail.confidential) throw new ProgrammingError("mail is not confidential")
	if (
		mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED ||
		mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED ||
		mail.encryptionAuthStatus == EncryptionAuthStatus.TUTACRYPT_SENDER
	) {
		return Icons.PQLock
	} else {
		return Icons.Lock
	}
}

/**
 * Returns the confidential font icon for the given mail which indicates either RSA or PQ encryption.
 * The caller must ensure that the mail is in a confidential state.
 */
export function getConfidentialFontIcon(mail: Mail): string {
	const confidentialIcon = getConfidentialIcon(mail)
	return confidentialIcon === Icons.PQLock ? FontIcons.PQConfidential : FontIcons.Confidential
}

export function isMailContrastFixNeeded(editorDom: ParentNode): boolean {
	return (
		Array.from(editorDom.querySelectorAll("*[style]"), (e) => (e as HTMLElement).style).some(
			(s) => (s.color && s.color !== "inherit") || (s.backgroundColor && s.backgroundColor !== "inherit"),
		) || editorDom.querySelectorAll("font[color]").length > 0
	)
}

export interface LabelsPopupOpts {
	origin?: PosRect
	width?: number
}

/**
 *Shortcut Method to show Labels dropdown only when at least one mail is selected.
 */
export function showLabelsPopup(
	mailModel: MailModel,
	selectedMails: readonly Mail[],
	getActionableMails: (mails: readonly Mail[]) => Promise<ReadonlyArray<IdTuple>>,
	dom: HTMLElement | null,
	opts?: LabelsPopupOpts,
) {
	const labels = mailModel.getLabelStatesForMails(selectedMails)

	if (isEmpty(labels) || isEmpty(selectedMails)) {
		return
	}

	const popup = new LabelsPopup(
		dom ?? (document.activeElement as HTMLElement),
		opts?.origin ?? dom?.getBoundingClientRect() ?? getMoveMailBounds(),
		opts?.width ?? (styles.isDesktopLayout() ? 300 : 200),
		mailModel.getLabelsForMails(selectedMails),
		mailModel.getLabelStatesForMails(selectedMails),
		async (addedLabels, removedLabels) => mailModel.applyLabels(await getActionableMails(selectedMails), addedLabels, removedLabels),
	)
	setTimeout(() => popup.show(), 16)
}
