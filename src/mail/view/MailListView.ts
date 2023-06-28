import m, { Children, Component, Vnode } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import type { VirtualRow } from "../../gui/base/List"
import { MailFolderType, MailState } from "../../api/common/TutanotaConstants"
import type { Mail, MailFolder } from "../../api/entities/tutanota/TypeRefs.js"
import { canDoDragAndDropExport } from "../model/MailUtils"
import { size } from "../../gui/size"
import { styles } from "../../gui/styles"
import { Icon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import type { ButtonAttrs } from "../../gui/base/Button.js"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { Dialog } from "../../gui/base/Dialog"
import { assertNotNull, AsyncResult, downcast, neverNull, promiseMap } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/MainLocator"
import { getLetId, haveSameId } from "../../api/common/utils/EntityUtils"
import { moveMails, promptAndDeleteMails } from "./MailGuiUtils"
import { MailRow } from "./MailRow"
import { makeTrackedProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import { generateExportFileName, generateMailFile, getMailExportMode } from "../export/Exporter"
import { deduplicateFilenames } from "../../api/common/utils/FileUtils"
import { makeMailBundle } from "../export/Bundler"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper"
import { assertMainOrNode } from "../../api/common/Env"
import { FolderSystem } from "../../api/common/mail/FolderSystem.js"
import { assertSystemFolderOfType } from "../../api/common/mail/CommonMailUtils.js"
import { MailViewModel } from "./MailViewModel.js"
import { ListSwipeDecision, MultiselectMode, NewList, NewListAttrs, RenderConfig, SwipeConfiguration } from "../../gui/base/NewList.js"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox.js"
import { BootIcons } from "../../gui/base/icons/BootIcons.js"
import { theme } from "../../gui/theme.js"

assertMainOrNode()

export interface MailListViewAttrs {
	// We would like to not get and hold to the whole MailView eventually
	// but for that we need to rewrite the List
	onClearFolder: () => unknown
	mailViewModel: MailViewModel
	listId: Id
	onSingleSelection: (mail: Mail) => unknown
}

export class MailListView implements Component<MailListViewAttrs> {
	listId: Id
	// Mails that are currently being or have already been downloaded/bundled/saved
	// Map of (Mail._id ++ MailExportMode) -> Promise<Filepath>
	// TODO this currently grows bigger and bigger and bigger if the user goes on an exporting spree.
	//  maybe we should deal with this, or maybe this never becomes an issue?
	exportedMails: Map<
		string,
		{
			fileName: string
			result: AsyncResult<any>
		}
	>
	// Used for modifying the cursor during drag and drop
	_listDom: HTMLElement | null
	showingSpamOrTrash: boolean = false
	showingDraft: boolean = false
	private mailViewModel: MailViewModel

	private readonly renderConfig: RenderConfig<Mail, MailRow> = {
		itemHeight: size.list_row_height,
		multiselectionAllowed: MultiselectMode.Enabled,
		createElement: (dom: HTMLElement) => {
			const mailRow = new MailRow(false, (entity) => this.mailViewModel.listModel?.onSingleExclusiveSelection(entity))
			m.render(dom, mailRow.render())
			return mailRow
		},
		swipe: locator.logins.isInternalUserLoggedIn()
			? ({
					renderLeftSpacer: () => this.renderLeftSpacer(),
					renderRightSpacer: () => this.renderRightSpacer(),
					swipeLeft: (listElement: Mail) => this.onSwipeLeft(listElement),
					swipeRight: (listElement: Mail) => this.onSwipeRight(listElement),
			  } satisfies SwipeConfiguration<Mail>)
			: null,
		dragStart: (event, row, selected) => this._newDragStart(event, row, selected),
	}

	constructor({ attrs }: Vnode<MailListViewAttrs>) {
		this.mailViewModel = attrs.mailViewModel
		this.listId = attrs.listId
		this.exportedMails = new Map()
		this._listDom = null
		this.mailViewModel.showingTrashOrSpamFolder().then((result) => {
			this.showingSpamOrTrash = result
			m.redraw()
		})
		this.mailViewModel.showingDraftsFolder().then((result) => {
			this.showingDraft = result
			m.redraw()
		})
		// "this" is incorrectly bound if we don't do it this way
		this.view = this.view.bind(this)
	}

	private getRecoverFolder(mail: Mail, folders: FolderSystem): MailFolder {
		if (mail.state === MailState.DRAFT) {
			return assertSystemFolderOfType(folders, MailFolderType.DRAFT)
		} else {
			return assertSystemFolderOfType(folders, MailFolderType.INBOX)
		}
	}

	// NOTE we do all of the electron drag handling directly inside MailListView, because we currently have no need to generalise
	// would strongly suggest with starting generalising this first if we ever need to support dragging more than just mails
	_newDragStart(event: DragEvent, row: Mail, selected: ReadonlySet<Mail>) {
		if (!row) return
		const mailUnderCursor = row

		if (isExportDragEvent(event)) {
			// We have to remove the drag mod key class here because once the dragstart has begun
			// we won't receive the keyup event that would normally remove it
			this._listDom && this._listDom.classList.remove("drag-mod-key")
			// We have to preventDefault or we get mysterious and inconsistent electron crashes at the call to startDrag in IPC
			event.preventDefault()
			// if the mail being dragged is not included in the mails that are selected, then we only drag
			// the mail that is currently being dragged, to match the behaviour of regular in-app dragging and dropping
			// which seemingly behaves how it does just by default
			//const draggedMails = selected.find((mail) => haveSameId(mail, mailUnderCursor)) ? selected.slice() : [mailUnderCursor]
			const draggedMails = selected.has(mailUnderCursor) ? [...selected] : [mailUnderCursor]

			this._doExportDrag(draggedMails)
		} else if (styles.isDesktopLayout()) {
			// Desktop layout only because it doesn't make sense to drag mails to folders when the folder list and mail list aren't visible at the same time
			neverNull(event.dataTransfer).setData("text", getLetId(neverNull(mailUnderCursor))[1])
		} else {
			event.preventDefault()
		}
	}

	// NOTE we do all of the electron drag handling directly inside MailListView, because we currently have no need to generalise
	// would strongly suggest with starting generalising this first if we ever need to support dragging more than just mails
	_dragStart(event: DragEvent, row: VirtualRow<Mail>, selected: ReadonlyArray<Mail>) {
		if (!row.entity) return
		const mailUnderCursor = row.entity

		if (isExportDragEvent(event)) {
			// We have to remove the drag mod key class here because once the dragstart has begun
			// we won't receive the keyup event that would normally remove it
			this._listDom && this._listDom.classList.remove("drag-mod-key")
			// We have to preventDefault or we get mysterious and inconsistent electron crashes at the call to startDrag in IPC
			event.preventDefault()
			// if the mail being dragged is not included in the mails that are selected, then we only drag
			// the mail that is currently being dragged, to match the behaviour of regular in-app dragging and dropping
			// which seemingly behaves how it does just by default
			const draggedMails = selected.find((mail) => haveSameId(mail, mailUnderCursor)) ? selected.slice() : [mailUnderCursor]

			this._doExportDrag(draggedMails)
		} else if (styles.isDesktopLayout()) {
			// Desktop layout only because it doesn't make sense to drag mails to folders when the folder list and mail list aren't visible at the same time
			neverNull(event.dataTransfer).setData("text", getLetId(neverNull(mailUnderCursor))[1])
		} else {
			event.preventDefault()
		}
	}

	async _doExportDrag(draggedMails: Array<Mail>): Promise<void> {
		assertNotNull(document.body).style.cursor = "progress"
		// We listen to mouseup to detect if the user released the mouse before the download was complete
		// we can't use dragend because we broke the DragEvent chain by calling prevent default
		const mouseupPromise = new Promise((resolve) => {
			document.addEventListener("mouseup", resolve, {
				once: true,
			})
		})

		const filePathsPromise = this._prepareMailsForDrag(draggedMails)

		// If the download completes before the user releases their mouse, then we can call electron start drag and do the operation
		// otherwise we have to give some kind of feedback to the user that the drop was unsuccessful
		const [didComplete, fileNames] = await Promise.race([filePathsPromise.then((filePaths) => [true, filePaths]), mouseupPromise.then(() => [false, []])])

		if (didComplete) {
			await locator.fileApp.startNativeDrag(fileNames as string[])
		} else {
			await locator.desktopSystemFacade.focusApplicationWindow()
			Dialog.message("unsuccessfulDrop_msg")
		}

		neverNull(document.body).style.cursor = "default"
	}

	/**
	 * Given a mail, will prepare it by downloading, bundling, saving, then returns the filepath of the saved file.
	 * @returns {Promise<R>|Promise<string>}
	 * @private
	 * @param mails
	 */
	async _prepareMailsForDrag(mails: Array<Mail>): Promise<Array<string>> {
		const exportMode = await getMailExportMode()
		// 3 actions per mail + 1 to indicate that something is happening (if the downloads take a while)
		const progressMonitor = makeTrackedProgressMonitor(locator.progressTracker, 3 * mails.length + 1)
		progressMonitor.workDone(1)

		const mapKey = (mail: Mail) => `${getLetId(mail).join("")}${exportMode}`

		const notDownloaded: Array<{ mail: Mail; fileName: string }> = []
		const downloaded: Array<{ fileName: string; promise: Promise<Mail> }> = []

		const handleNotDownloaded = (mail: Mail) => {
			notDownloaded.push({
				mail,
				fileName: generateExportFileName(mail.subject, mail.receivedDate, exportMode),
			})
		}

		const handleDownloaded = (fileName: string, promise: Promise<Mail>) => {
			// we don't have to do anything else with the downloaded ones
			// so finish this chunk of work
			progressMonitor.workDone(3)
			downloaded.push({
				fileName,
				promise: promise,
			})
		}

		// Gather up files that have been downloaded
		// and all files that need to be downloaded, or were already downloaded but have disappeared
		for (let mail of mails) {
			const key = mapKey(mail)
			const existing = this.exportedMails.get(key)

			if (!existing || existing.result.state().status === "failure") {
				// Something went wrong last time we tried to drag this file,
				// so try again (not confident that it will work this time, though)
				handleNotDownloaded(mail)
			} else {
				const state = existing.result.state()

				switch (state.status) {
					// Mail is still being prepared, already has a file path assigned to it
					case "pending": {
						handleDownloaded(existing.fileName, state.promise)
						continue
					}

					case "complete": {
						// We have downloaded it, but we need to check if it still exists
						const exists = await locator.fileApp.checkFileExistsInExportDir(existing.fileName)

						if (exists) {
							handleDownloaded(existing.fileName, Promise.resolve(mail))
						} else {
							handleNotDownloaded(mail)
						}
					}
				}
			}
		}

		const deduplicatedNames = deduplicateFilenames(
			notDownloaded.map((f) => f.fileName),
			new Set(downloaded.map((f) => f.fileName)),
		)
		const [newFiles, existingFiles] = await Promise.all([
			// Download all the files that need downloading, wait for them, and then return the filename
			promiseMap(notDownloaded, async ({ mail, fileName }) => {
				const name = assertNotNull(deduplicatedNames[fileName].shift())
				const key = mapKey(mail)
				const downloadPromise = Promise.resolve().then(async () => {
					const { htmlSanitizer } = await import("../../misc/HtmlSanitizer")
					const bundle = await makeMailBundle(mail, locator.entityClient, locator.fileController, htmlSanitizer)
					progressMonitor.workDone(1)
					const file = await generateMailFile(bundle, name, exportMode)
					progressMonitor.workDone(1)
					await locator.fileApp.saveToExportDir(file)
					progressMonitor.workDone(1)
				})
				this.exportedMails.set(key, {
					fileName: name,
					result: new AsyncResult(downloadPromise),
				})
				await downloadPromise
				return name
			}), // Wait for ones that already were downloading or have finished, and  then return their filenames too
			promiseMap(downloaded, (result) => result.promise.then(() => result.fileName)),
		])
		// combine the list of newly downloaded and previously downloaded files
		return newFiles.concat(existingFiles)
	}

	view(vnode: Vnode<MailListViewAttrs>): Children {
		this.mailViewModel = vnode.attrs.mailViewModel

		// Save the folder before showing the dialog so that there's no chance that it will change
		const folder = this.mailViewModel.getSelectedFolder()
		const purgeButtonAttrs: ButtonAttrs = {
			label: "clearFolder_action",
			type: ButtonType.Primary,
			colors: ButtonColor.Nav,
			click: async () => {
				vnode.attrs.onClearFolder()
			},
		}

		// listeners to indicate the when mod key is held, dragging will do something
		const onKeyDown = (event: KeyboardEvent) => {
			if (isDragAndDropModifierHeld(event)) {
				this._listDom && this._listDom.classList.add("drag-mod-key")
			}
		}

		const onKeyUp = (event: KeyboardEvent) => {
			// The event doesn't have a
			this._listDom && this._listDom.classList.remove("drag-mod-key")
		}

		const listModel = vnode.attrs.mailViewModel.listModel!
		return m(
			".mail-list-wrapper",
			{
				oncreate: (vnode) => {
					this._listDom = downcast(vnode.dom.firstChild)

					if (canDoDragAndDropExport()) {
						assertNotNull(document.body).addEventListener("keydown", onKeyDown)
						assertNotNull(document.body).addEventListener("keyup", onKeyUp)
					}
				},
				onbeforeremove: (vnode) => {
					if (canDoDragAndDropExport()) {
						assertNotNull(document.body).removeEventListener("keydown", onKeyDown)
						assertNotNull(document.body).removeEventListener("keyup", onKeyUp)
					}
				},
			},
			// always render the wrapper so that the list is not re-created from scratch when
			// showingSpamOrTrash changes.
			m(
				ListColumnWrapper,
				{
					headerContent: this.renderListHeader(purgeButtonAttrs),
				},
				listModel.isEmptyAndDone()
					? m(ColumnEmptyMessageBox, {
							icon: BootIcons.Mail,
							message: "noMails_msg",
							color: theme.list_message_bg,
					  })
					: m(NewList, {
							state: listModel.state,
							renderConfig: this.renderConfig,
							onLoadMore() {
								listModel.loadMore()
							},
							onRetryLoading() {
								listModel.retryLoading()
							},
							onSingleSelection: (item) => {
								listModel.onSingleSelection(item)
								vnode.attrs.onSingleSelection(item)
							},
							onSingleMultiselection: (item: Mail) => {
								listModel.onSingleInclusiveSelection(item)
							},
							selectRangeTowards: (item: Mail) => {
								listModel.selectRangeTowards(item)
							},
							onStopLoading() {
								listModel.stopLoading()
							},
					  } satisfies NewListAttrs<Mail, MailRow>),
			),
		)
	}

	private renderListHeader(purgeButtonAttrs: ButtonAttrs): Children {
		return m(".flex.col", [
			this.showingSpamOrTrash
				? [
						m(".flex.flex-column.plr-l", [
							m(".small.flex-grow.pt", lang.get("storageDeletion_msg")),
							m(".mr-negative-s.align-self-end", m(Button, purgeButtonAttrs)),
						]),
				  ]
				: null,
		])
	}

	private targetInbox(): boolean {
		const selectedFolder = this.mailViewModel.getSelectedFolder()
		if (selectedFolder) {
			return selectedFolder.folderType === MailFolderType.ARCHIVE || selectedFolder.folderType === MailFolderType.TRASH
		} else {
			return false
		}
	}

	private async onSwipeLeft(listElement: Mail): Promise<ListSwipeDecision> {
		const wereDeleted = await promptAndDeleteMails(locator.mailModel, [listElement], () => this.mailViewModel.listModel?.selectNone())
		return wereDeleted ? ListSwipeDecision.Commit : ListSwipeDecision.Cancel
	}

	private async onSwipeRight(listElement: Mail): Promise<ListSwipeDecision> {
		if (this.showingDraft) {
			// just cancel selection if in drafts
			this.mailViewModel.listModel?.selectNone()
			return ListSwipeDecision.Cancel
		} else {
			const folders = await locator.mailModel.getMailboxFolders(listElement)
			if (folders) {
				const targetMailFolder = this.showingSpamOrTrash
					? this.getRecoverFolder(listElement, folders)
					: assertNotNull(folders.getSystemFolderByType(MailFolderType.ARCHIVE))
				const wereMoved = await moveMails({
					mailModel: locator.mailModel,
					mails: [listElement],
					targetMailFolder,
				})
				return wereMoved ? ListSwipeDecision.Commit : ListSwipeDecision.Cancel
			} else {
				return ListSwipeDecision.Cancel
			}
		}
	}

	private renderLeftSpacer(): Children {
		return this.showingDraft
			? [
					m(Icon, {
						icon: Icons.Cancel,
					}),
					m(".pl-s", lang.get("cancel_action")), // if this is the drafts folder, we can only cancel the selection as we have nowhere else to put the mail
			  ]
			: [
					m(Icon, {
						icon: Icons.Folder,
					}),
					m(
						".pl-s",
						this.showingSpamOrTrash
							? lang.get("recover_label") // show "recover" if this is the trash/spam folder
							: this.targetInbox() // otherwise show "inbox" or "archive" depending on the folder
							? lang.get("received_action")
							: lang.get("archive_action"),
					),
			  ]
	}

	private renderRightSpacer(): Children {
		return [
			m(Icon, {
				icon: Icons.Trash,
			}),
			m(".pl-s", lang.get("delete_action")),
		]
	}
}

export function isExportDragEvent(event: DragEvent): boolean {
	return canDoDragAndDropExport() && isDragAndDropModifierHeld(event)
}

function isDragAndDropModifierHeld(event: DragEvent | KeyboardEvent): boolean {
	return (
		event.ctrlKey ||
		event.altKey ||
		// @ts-ignore
		(!!event.key && ["alt", "ctrl"].includes(downcast(event.key).toLowerCase()))
	)
}
