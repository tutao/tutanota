import type { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { File as TutanotaFile, Mail, MailFolder, MovedMails } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { LockedError, PreconditionFailedError } from "../../../common/api/common/error/RestError"
import { Dialog } from "../../../common/gui/base/Dialog"
import { AllIcons } from "../../../common/gui/base/Icon"
import { Icons } from "../../../common/gui/base/icons/Icons"
import { isApp, isDesktop } from "../../../common/api/common/Env"
import { $Promisable, assertNotNull, clamp, endsWith, first, isEmpty, isNotEmpty, lazyMemoized, neverNull, noOp, promiseMap } from "@tutao/tutanota-utils"
import {
	EncryptionAuthStatus,
	getMailFolderType,
	MailReportType,
	MailSetKind,
	MailState,
	SYSTEM_GROUP_MAIL_ADDRESS,
	SystemFolderType,
} from "../../../common/api/common/TutanotaConstants"
import { getReportConfirmation } from "./MailReportDialog"
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
import {
	FolderInfo,
	getFolderName,
	getIndentedFolderNameForDropdown,
	getMoveTargetFolderSystems,
	getMoveTargetFolderSystemsForMailsInFolder,
	getSystemFolderName,
	MoveService,
	RegularMoveTargets,
	SimpleMoveTargets,
} from "../model/MailUtils.js"
import { FontIcons } from "../../../common/gui/base/icons/FontIcons.js"
import { ProgrammingError } from "../../../common/api/common/error/ProgrammingError.js"
import { isOfTypeOrSubfolderOf } from "../model/MailChecks.js"
import { LabelsPopup } from "./LabelsPopup"
import { styles } from "../../../common/gui/styles"
import { elementIdPart, getIds, isSameId } from "../../../common/api/common/utils/EntityUtils"
import { showSnackBar } from "../../../common/gui/base/SnackBar"
import { UndoModel } from "../../UndoModel"
import { IndentedFolder } from "../../../common/api/common/mail/FolderSystem"
import { computeColor, rgbToHSL } from "../../../common/gui/base/Color"

const UNDO_SNACKBAR_SHOW_TIME = 10 * 1000 // ms

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
	undoModel: UndoModel
	mailIds: ReadonlyArray<IdTuple>
	targetFolder: MailFolder
	moveMode: MoveMode
}

enum MoveMailSnackbarResult {
	/** Undo moving the mail. */
	Undo,

	/** The snackbar timed out. Prompt the user if they want to report mails. */
	Timeout,

	/** The snackbar was cleared. Automatically report mails without showing a snackbar. */
	Replaced,
}

async function showUndoMoveMailSnackbar(undoModel: UndoModel, onUndoMove: () => Promise<void>, undoMoveText: string): Promise<MoveMailSnackbarResult> {
	return new Promise((resolve) => {
		let result: MoveMailSnackbarResult | null = null

		let cancelSnackbar: () => void

		const undoAction = {
			exec: async () => {
				result = MoveMailSnackbarResult.Undo
				resolve(result)

				cancelSnackbar?.()
				await onUndoMove()
			},
			onClear: () => {
				if (result == null) {
					result = MoveMailSnackbarResult.Replaced
					resolve(result)
					cancelSnackbar?.()
				}
			},
		}

		const clearUndoAction = lazyMemoized(() => undoModel.clearUndoActionIfPresent(undoAction))
		const undoMessage: Translation = {
			testId: "undoMoveMail_msg",
			text: undoMoveText,
		}
		cancelSnackbar = showSnackBar({
			message: undoMessage,
			button: {
				label: "undo_action",
				click: async () => {
					await undoAction.exec()

					// we don't want to go through MailViewModel to run the undo function, as we have no idea if there is a
					// different undo action pending
					clearUndoAction()
				},
			},
			dismissButton: {
				title: "close_alt",
				click: () => cancelSnackbar(),
				icon: Icons.Cancel,
			},
			onShow: () => {
				// we don't want to immediately set the undo action, as the user might be looking at a different snackbar
				// than this one momentarily
				undoModel.setUndoAction(undoAction)
			},
			onClose: (timedOut: boolean) => {
				if (result == null) {
					result = timedOut ? MoveMailSnackbarResult.Timeout : MoveMailSnackbarResult.Replaced
					resolve(result)

					// if this times out, we don't want to let the user undo this move anymore
					clearUndoAction()
				}
			},
			showingTime: UNDO_SNACKBAR_SHOW_TIME,
			replace: true,
		})
	})
}

/**
 * Moves the mails and reports them as spam if the user or settings allow it.
 * @return whether mails were actually moved
 */
export async function moveMails({ mailModel, mailIds, targetFolder, moveMode, mailboxModel, undoModel }: MoveMailsParams): Promise<boolean> {
	try {
		const movedMails = await mailModel.moveMails(mailIds, targetFolder, moveMode)
		if (isEmpty(movedMails)) {
			return false
		}
		// run post-move actions async
		runPostMoveActions(mailModel, mailboxModel, undoModel, movedMails)
		return true
	} catch (e) {
		//LockedError should no longer be thrown!?!
		if (e instanceof LockedError || e instanceof PreconditionFailedError) {
			await Dialog.message("operationStillActive_msg")
			return false
		} else {
			throw e
		}
	}
}

async function runPostMoveActions(mailModel: MailModel, mailboxModel: MailboxModel, undoModel: UndoModel, movedMails: readonly MovedMails[]) {
	// With move we only have two cases: either we move all emails that are in one mailbox to a specific folder or
	// we are moving emails in different mailboxes to respective folders of the same type (e.g. user moves some emails
	// in search into spam, mails of each mailbox go into their own spam folder).
	// Here we are trying to determine if the destination is a spam folder. If the move was done only for one mailbox
	// then it is okay to take the first target folder because it will be the same for each moved chunk.
	// If it was a move in multiple mailboxes it will only be a system folder and all of the target folders will have
	// the same type which is enough for our check.
	const firstTargetFolderId = first(movedMails)?.targetFolder
	if (firstTargetFolderId == null) {
		return
	}
	const firstTargetFolder = await mailModel.getMailSetById(elementIdPart(firstTargetFolderId))
	if (firstTargetFolder == null) {
		return
	}
	const firstFolderGroup = assertNotNull(firstTargetFolder._ownerGroup)
	const firstFolderSystem = mailModel.getFolderSystemByGroupId(firstFolderGroup)
	const reportableMailIds: IdTuple[] = []

	// only report mails when they're moved to Spam or one of its subfolders
	if (firstFolderSystem != null && isOfTypeOrSubfolderOf(firstFolderSystem, firstTargetFolder, MailSetKind.SPAM)) {
		for (const { sourceFolder, mailIds } of movedMails) {
			const mailFolder = await mailModel.getMailSetById(elementIdPart(sourceFolder))
			if (mailFolder == null) {
				continue
			}

			/** because {@link firstTargetFolder} and {@link sourceFolder} might be in different mailboxes, in case of a shared mailbox */
			const sourceFolderGroup = assertNotNull(mailFolder._ownerGroup)
			const sourceFolderSystem = sourceFolderGroup === firstFolderGroup ? firstFolderSystem : mailModel.getFolderSystemByGroupId(sourceFolderGroup)
			if (sourceFolderSystem == null) {
				continue
			}

			// only report mails that aren't already in Spam or its subfolders
			if (!isOfTypeOrSubfolderOf(sourceFolderSystem, mailFolder, MailSetKind.SPAM)) {
				const toReportMailIds: IdTuple[] = mailIds.map((idTupleWrapper) => [idTupleWrapper.listId, idTupleWrapper.listElementId])
				reportableMailIds.push(...toReportMailIds)
			}
		}
	}

	const shouldReportMails = isNotEmpty(reportableMailIds) && (await getReportConfirmation(MailReportType.SPAM, mailboxModel, mailModel))

	const undoMoveText = shouldReportMails
		? `${lang.getTranslation("undoMoveMail_msg", { "{folder}": getFolderName(firstTargetFolder) }).text} ${lang.getTranslation("undoMailReport_msg").text}`
		: lang.getTranslation("undoMoveMail_msg", { "{folder}": getFolderName(firstTargetFolder) }).text

	const onUndoMove = async () => {
		for (const { sourceFolder: sourceFolderId, mailIds, targetFolder: targetFolderId } of movedMails) {
			const sourceFolder = await mailModel.getMailSetById(elementIdPart(sourceFolderId))

			if (sourceFolder === null || isSameId(sourceFolderId, targetFolderId)) {
				continue
			}
			await mailModel.moveMails(
				mailIds.map((idTupleWrapper) => [idTupleWrapper.listId, idTupleWrapper.listElementId]),
				sourceFolder,
				MoveMode.Mails,
			)
		}
	}

	const undoResult = await showUndoMoveMailSnackbar(undoModel, onUndoMove, undoMoveText)

	if (shouldReportMails && undoResult !== MoveMailSnackbarResult.Undo) {
		const reportableMails = (await mailModel.loadAllMails(reportableMailIds)).filter((mail) => !isTutanotaTeamMail(mail))
		await mailModel.reportMails(MailReportType.SPAM, reportableMails)
	}
}

export async function moveMailsToSystemFolder({
	mailboxModel,
	mailModel,
	mailIds,
	targetFolderType,
	currentFolder,
	moveMode,
	undoModel,
}: {
	mailboxModel: MailboxModel
	mailModel: MailModel
	mailIds: ReadonlyArray<IdTuple>
	targetFolderType: SystemFolderType
	currentFolder: MailFolder
	moveMode: MoveMode
	undoModel: UndoModel
}): Promise<boolean> {
	const folderSystem = mailModel.getFolderSystemByGroupId(assertNotNull(currentFolder._ownerGroup))
	const targetFolder = folderSystem?.getSystemFolderByType(targetFolderType)
	if (targetFolder == null) return false
	return await moveMails({
		mailboxModel,
		mailModel,
		mailIds,
		targetFolder,
		moveMode,
		undoModel,
	})
}

function handleMoveError(err: Error) {
	//LockedError should no longer be thrown!?!
	if (err instanceof LockedError || err instanceof PreconditionFailedError) {
		return Dialog.message("operationStillActive_msg").then(() => false)
	} else {
		throw err
	}
}

export async function trashMails(mailboxModel: MailboxModel, mailModel: MailModel, undoModel: UndoModel, mails: readonly Mail[]): Promise<boolean> {
	return simpleMoveToSystemFolder(mailboxModel, mailModel, undoModel, MailSetKind.TRASH, mails)
}

export async function simpleMoveToSystemFolder(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	undoModel: UndoModel,
	targetFolder: SystemFolderType,
	mails: readonly Mail[],
): Promise<boolean> {
	let movedMails: MovedMails[]
	try {
		movedMails = await mailModel.simpleMoveMails(getIds(mails), targetFolder)
	} catch (e) {
		return handleMoveError(e)
	}
	runPostMoveActions(mailModel, mailboxModel, undoModel, movedMails)
	return true
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

export function getMailFolderIcon(mailModel: MailModel, mail: Mail): AllIcons {
	const folder = mailModel.getMailFolderForMail(mail)

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
		const { getHtmlSanitizer } = await import("../../../common/misc/HtmlSanitizer")
		dataFile = getHtmlSanitizer().sanitizeInlineAttachment(dataFile)
		const inlineImageReference = createInlineImageReference(dataFile, neverNull(file.cid))
		inlineImages.set(inlineImageReference.cid, inlineImageReference)
	}).then(() => inlineImages)
}

export function getReferencedAttachments(attachments: Array<TutanotaFile>, referencedCids: Array<string>): Array<TutanotaFile> {
	return attachments.filter((file) => referencedCids.find((rcid) => file.cid === rcid))
}

type MoveDropdownParams =
	| (RegularMoveTargets & { onClick: (folder: FolderInfo) => unknown })
	| (SimpleMoveTargets & {
			onClick: (folder: SystemFolderType) => unknown
	  })

export interface ShowMoveMailsDropdownOpts {
	width?: number
	withBackground?: boolean
	onSelected?: () => unknown
}

export async function showMoveMailsFromFolderDropdown(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	undoModel: UndoModel,
	origin: PosRect,
	currentFolder: MailFolder,
	mails: LazyMailIdResolver,
	moveMode: MoveMode,
	opts?: ShowMoveMailsDropdownOpts,
): Promise<void> {
	const folders = await getMoveTargetFolderSystemsForMailsInFolder(mailModel, currentFolder)
	await showMailFolderDropdown(
		origin,
		{
			moveService: MoveService.RegularMove,
			folders,
			onClick: async (f: IndentedFolder) => {
				const resolvedMails = await mails()
				moveMails({
					mailboxModel,
					mailModel,
					mailIds: resolvedMails,
					targetFolder: f.folder,
					moveMode,
					undoModel,
				})
			},
		},
		opts,
	)
}

export async function showMoveMailsDropdown(
	mailboxModel: MailboxModel,
	mailModel: MailModel,
	undoModel: UndoModel,
	origin: PosRect,
	mails: readonly Mail[],
	moveMode: MoveMode,
	opts?: ShowMoveMailsDropdownOpts,
): Promise<void> {
	const firstMail = first(mails)
	if (firstMail == null) return

	const moveTargets = await getMoveTargetFolderSystems(mailModel, mails)
	let moveParams: MoveDropdownParams
	if (moveTargets.moveService === MoveService.SimpleMove) {
		moveParams = {
			...moveTargets,
			onClick: (f: SystemFolderType) => {
				simpleMoveToSystemFolder(mailboxModel, mailModel, undoModel, f, mails)
			},
		}
	} else {
		moveParams = {
			...moveTargets,
			onClick: (f: FolderInfo) => {
				moveMails({
					mailboxModel,
					mailModel,
					mailIds: getIds(mails),
					targetFolder: f.folder,
					moveMode,
					undoModel,
				})
			},
		}
	}

	await showMailFolderDropdown(origin, moveParams, opts)
}

export async function showMailFolderDropdown(origin: PosRect, move: MoveDropdownParams, opts?: ShowMoveMailsDropdownOpts): Promise<void> {
	const { width = 300, withBackground = false, onSelected = noOp } = opts ?? {}

	const folderButton = (attrs: {
		depth: number
		folderType: MailSetKind
		folderName: string
		indentedFolderName: string
		onClick: () => unknown
		onSelected: () => unknown
	}): DropdownChildAttrs => {
		return {
			// We need to pass in the raw folder name to avoid including it in searches
			label: lang.makeTranslation(
				`dropdown-folder:${attrs.folderName}`,
				lang.get("folderDepth_label", {
					"{folderName}": attrs.folderName,
					"{depth}": attrs.depth,
				}),
			),
			text: lang.makeTranslation("folder_name", attrs.indentedFolderName),
			click: () => {
				onSelected()
				attrs.onClick()
			},
			icon: getFolderIconByType(attrs.folderType),
		}
	}

	let folderButtons: DropdownChildAttrs[]
	if (move.moveService === MoveService.SimpleMove) {
		folderButtons = move.folders.map((folderType) => {
			const folderName = getSystemFolderName(folderType)

			return folderButton({
				depth: 0,
				folderType,
				folderName,
				indentedFolderName: folderName,
				onClick: () => move.onClick(folderType),
				onSelected,
			})
		})
	} else {
		if (isEmpty(move.folders)) return

		folderButtons = move.folders.map((f: FolderInfo) =>
			folderButton({
				depth: f.level,
				folderType: getMailFolderType(f.folder),
				folderName: getFolderName(f.folder),
				indentedFolderName: getIndentedFolderNameForDropdown(f),
				onClick: () => move.onClick(f),
				onSelected,
			}),
		)
	}

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
	return new DomRectReadOnlyPolyfilled(size.spacing_24, size.spacing_32, 0, 0)
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
		mail.encryptionAuthStatus === EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_SUCCEEDED ||
		mail.encryptionAuthStatus === EncryptionAuthStatus.TUTACRYPT_AUTHENTICATION_FAILED ||
		mail.encryptionAuthStatus === EncryptionAuthStatus.TUTACRYPT_SENDER
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

function cssAttributeSetNonInherit(color: string): boolean {
	return color !== "" && color !== "inherit"
}

/**
 * All tags that used bgcolor in HTML4
 */
const BGCOLOR_TAGS: readonly string[] = Object.freeze(["body", "td", "th", "tfoot", "tr", "table"])

/**
 * Clone the given dom and return a version of it suitable for dark themes.
 */
export function applyDarkThemeFix<T extends NonElementParentNode & ParentNode>(node: T): T {
	const fixed = node.cloneNode(true) as T

	// Delete anything with a white background color that isn't inside of something else with a background
	// color. Additionally, we want to ensure anything with a non-white background retains its font colors.
	function applyDarkThemeFixToElement(e: HTMLElement | Node, fontColorSetByParent: string | null) {
		if (!("style" in e)) {
			return
		}

		// Fixup deprecated HTML4 attributes to use CSS so we can properly handle them
		const tagName = e.tagName.toLowerCase()
		if (tagName === "font" && e.hasAttribute("color")) {
			// <font style> is technically valid since even unrecognized HTML tags should effectively be treated the
			// same as <span> elements
			e.style.color = assertNotNull(e.getAttribute("color"))
			e.removeAttribute("color")
		}
		if (BGCOLOR_TAGS.includes(tagName) && e.hasAttribute("bgcolor")) {
			e.style.backgroundColor = assertNotNull(e.getAttribute("bgcolor"))
			e.removeAttribute("bgcolor")
		}

		const style = e.style

		const fontColorSet = cssAttributeSetNonInherit(style.color)
		const backgroundColorSet = cssAttributeSetNonInherit(style.backgroundColor)
		let backgroundColorIsWhiteOrTransparent = false

		if (backgroundColorSet) {
			const backgroundColor = computeColor(style.backgroundColor)
			backgroundColorIsWhiteOrTransparent =
				backgroundColor.a === 0 || (backgroundColor.r === 255 && backgroundColor.g === 255 && backgroundColor.b === 255)
		}

		// We want to hold onto the 'original' color for the check below.
		const effectiveFontColor = fontColorSet ? style.color : fontColorSetByParent

		if (
			cssAttributeSetNonInherit(e.style.backgroundImage) ||
			cssAttributeSetNonInherit(e.style.background) ||
			(backgroundColorSet && !backgroundColorIsWhiteOrTransparent)
		) {
			// do not apply the contrast fix to anything inside of this
			style.color = effectiveFontColor != null ? effectiveFontColor : "#000"
			return
		}

		if (backgroundColorIsWhiteOrTransparent) {
			style.backgroundColor = ""
		}

		// If this, in particular, has a font color set, we want it to look good on a dark background
		if (fontColorSet) {
			const color = computeColor(style.color)
			const hsl = rgbToHSL(color)

			// 100 lightness = white
			//
			// we average the reverse with white to give us a color that has good contrast with dark backgrounds
			hsl.l = clamp((100 + (100 - hsl.l)) / 2, 0.0, 100.0)

			style.color = `hsl(${hsl.h} ${hsl.s}% ${hsl.l}% / ${color.a})`
		}

		for (const childElement of Array.from(e.children)) {
			applyDarkThemeFixToElement(childElement, effectiveFontColor)
		}
	}

	for (const childElement of Array.from(fixed.childNodes)) {
		applyDarkThemeFixToElement(childElement, null)
	}

	return fixed
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
