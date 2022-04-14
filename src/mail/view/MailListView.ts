import m, {Children, Component, Vnode} from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import type {VirtualRow} from "../../gui/base/List"
import {List} from "../../gui/base/List"
import {MailFolderType} from "../../api/common/TutanotaConstants"
import type {MailView} from "./MailView"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {MailTypeRef} from "../../api/entities/tutanota/TypeRefs.js"
import {canDoDragAndDropExport, getArchiveFolder, getFolderName, getInboxFolder} from "../model/MailUtils"
import {findAndApplyMatchingRule, isInboxList} from "../model/InboxRuleHandler"
import {ConnectionError, NotFoundError} from "../../api/common/error/RestError"
import {size} from "../../gui/size"
import {styles} from "../../gui/styles"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColor, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Dialog} from "../../gui/base/Dialog"
import {assertNotNull, AsyncResult, debounce, downcast, neverNull, ofClass, promiseFilter, promiseMap} from "@tutao/tutanota-utils"
import {locator} from "../../api/main/MainLocator"
import {getLetId, haveSameId, sortCompareByReverseId} from "../../api/common/utils/EntityUtils"
import {moveMails, promptAndDeleteMails} from "./MailGuiUtils"
import {MailRow} from "./MailRow"
import {makeTrackedProgressMonitor} from "../../api/common/utils/ProgressMonitor"
import {Request} from "../../api/common/MessageDispatcher"
import {generateExportFileName, generateMailFile, getMailExportMode} from "../export/Exporter"
import {deduplicateFilenames} from "../../api/common/utils/FileUtils"
import {makeMailBundle} from "../export/Bundler"
import {ListColumnWrapper} from "../../gui/ListColumnWrapper"
import {assertMainOrNode} from "../../api/common/Env"
import {WsConnectionState} from "../../api/main/WorkerClient"

assertMainOrNode()
const className = "mail-list"

export class MailListView implements Component {
	listId: Id
	mailView: MailView
	list: List<Mail, MailRow>
	// Mails that are currently being or have already been downloaded/bundled/saved
	// Map of (Mail._id ++ MailExportMode) -> Promise<Filepath>
	// TODO this currently grows bigger and bigger and bigger if the user goes on an exporting spree.
	//  maybe we should deal with this, or maybe this never becomes an issue?
	exportedMails: Map<string,
		{
			fileName: string
			result: AsyncResult<any>
		}>
	// Used for modifying the cursor during drag and drop
	_listDom: HTMLElement | null
	constructor(mailListId: Id, mailView: MailView) {
		this.listId = mailListId
		this.mailView = mailView
		this.exportedMails = new Map()
		this._listDom = null
		this.list = new List(
			{
				rowHeight: size.list_row_height,
				fetch: (start, count) => {
					return this._loadMailRange(start, count)
				},
				loadSingle: elementId => {
					return locator.entityClient
								  .load<Mail>(MailTypeRef, [this.listId, elementId])
								  .catch(
									  ofClass(NotFoundError, e => {
										  // we return null if the entity does not exist
										  return null
									  }),
								  )
				},
				sortCompare: sortCompareByReverseId,
				elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
					mailView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
				createVirtualRow: () => new MailRow(false),
				showStatus: false,
				className: className,
				swipe: {
					renderLeftSpacer: () =>
						!logins.isInternalUserLoggedIn()
							? []
							: [
								m(Icon, {
									icon: Icons.Folder,
								}),
								m(".pl-s", this.targetInbox() ? lang.get("received_action") : lang.get("archive_action")),
							],
					renderRightSpacer: () => [
						m(Icon, {
							icon: Icons.Trash,
						}),
						m(".pl-s", lang.get("delete_action")),
					],
					swipeLeft: (listElement: Mail) => promptAndDeleteMails(locator.mailModel, [listElement], () => this.list.selectNone()),
					swipeRight: (listElement: Mail) => {
						if (!logins.isInternalUserLoggedIn()) {
							return Promise.resolve(false) // externals don't have an archive folder
						} else if (this.targetInbox()) {
							this.list.selectNone()
							return locator.mailModel
										  .getMailboxFolders(listElement)
										  .then(folders => moveMails({mailModel : locator.mailModel, mails : [listElement], targetMailFolder : getInboxFolder(folders)}))
						} else {
							this.list.selectNone()
							return locator.mailModel
										  .getMailboxFolders(listElement)
										  .then(folders => moveMails({mailModel : locator.mailModel, mails : [listElement], targetMailFolder : getArchiveFolder(folders)}))
						}
					},
					enabled: true,
				},
				multiSelectionAllowed: true,
				emptyMessage: lang.get("noMails_msg"),
				listLoadedCompletly: () => this._fixCounterIfNeeded(this.listId, this.list.getLoadedEntities().length),
				dragStart: (event, row, selected) => this._dragStart(event, row, selected),
			})

		// "this" is incorrectly bound if we don't do it this way
		this.view = this.view.bind(this)
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
			const draggedMails = !!selected.find(mail => haveSameId(mail, mailUnderCursor)) ? selected.slice() : [mailUnderCursor]

			this._doExportDrag(draggedMails)
		} else if (styles.isDesktopLayout()) {
			// Doesn't make sense to drag mails to folders when the folder list and mail list aren't visible at the same time
			neverNull(event.dataTransfer).setData("text", getLetId(neverNull(mailUnderCursor))[1])
		} else {
			event.preventDefault()
		}
	}

	async _doExportDrag(draggedMails: Array<Mail>): Promise<void> {
		assertNotNull(document.body).style.cursor = "progress"
		// We listen to mouseup to detect if the user released the mouse before the download was complete
		// we can't use dragend because we broke the DragEvent chain by calling prevent default
		const mouseupPromise = new Promise(resolve => {
			document.addEventListener("mouseup", resolve, {
				once: true,
			})
		})

		const filePathsPromise = this._prepareMailsForDrag(draggedMails)

		// If the download completes before the user releases their mouse, then we can call electron start drag and do the operation
		// otherwise we have to give some kind of feedback to the user that the drop was unsuccessful
		const [didComplete, fileNames] = await Promise.race([filePathsPromise.then(filePaths => [true, filePaths]), mouseupPromise.then(() => [false, []])])

		if (didComplete) {
			await locator.fileApp.startNativeDrag(fileNames as string[])
		} else {
			await locator.native.invokeNative(new Request("focusApplicationWindow", []))
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

		const notDownloaded: Array<{mail: Mail, fileName: string}> = []
		const downloaded: Array<{fileName: string, promise: Promise<Mail>}> = []

		const handleNotDownloaded = (mail: Mail) => {
			notDownloaded.push({
				mail,
				fileName: generateExportFileName(mail.subject, mail.sentDate, exportMode),
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
						const exists = await locator.fileApp.checkFileExistsInExportDirectory(existing.fileName)

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
			notDownloaded.map(f => f.fileName),
			new Set(downloaded.map(f => f.fileName)),
		)
		const [newFiles, existingFiles] = await Promise.all([
			// Download all the files that need downloading, wait for them, and then return the filename
			promiseMap(notDownloaded, async ({mail, fileName}) => {
				const name = assertNotNull(deduplicatedNames[fileName].shift())
				const key = mapKey(mail)
				const downloadPromise = Promise.resolve().then(async () => {
					const {htmlSanitizer} = await import("../../misc/HtmlSanitizer")
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
			promiseMap(downloaded, result => result.promise.then(() => result.fileName)),
		])
		// combine the list of newly downloaded and previously downloaded files
		return newFiles.concat(existingFiles)
	}

	// Do not start many fixes in parallel, do check after some time when counters are more likely to settle
	_fixCounterIfNeeded: (listId: Id, listLength: number) => void = debounce(2000, async (listId: Id, listLength: number) => {
		// If folders are changed, list won't have the data we need.
		// Do not rely on counters if we are not connected
		if (this.listId !== listId || locator.worker.wsConnection()() !== WsConnectionState.connected) {
			return
		}

		// If list was modified in the meantime, we cannot be sure that we will fix counters correctly (e.g. because of the inbox rules)
		if (listLength !== this.list.getLoadedEntities().length) {
			return
		}

		const unreadMails = this.list.getLoadedEntities().reduce((acc, mail) => {
			if (mail.unread) {
				acc++
			}

			return acc
		}, 0)
		const counterValue = await locator.mailModel.getCounterValue(this.listId)
		if (counterValue != null && counterValue !== unreadMails) {
			await locator.mailModel.fixupCounterForMailList(this.listId, unreadMails)
		}
	})

	view(vnode: Vnode): Children {
		// Save the folder before showing the dialog so that there's no chance that it will change
		const folder = this.mailView.selectedFolder
		const purgeButtonAttrs: ButtonAttrs = {
			label: "clearFolder_action",
			type: ButtonType.Primary,
			colors: ButtonColor.Nav,
			click: () => {
				if (folder == null) {
					console.warn("Cannot delete folder, no folder is selected")
					return
				}

				Dialog.confirm(() =>
					lang.get("confirmDeleteFinallySystemFolder_msg", {
						"{1}": getFolderName(folder),
					}),
				).then(confirmed => {
					if (confirmed) {
						this.mailView.finallyDeleteAllMailsInSelectedFolder(folder)
					}
				})
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

		return m(
			".mail-list-wrapper",
			{
				oncreate: vnode => {
					this._listDom = downcast(vnode.dom.firstChild)

					if (canDoDragAndDropExport()) {
						assertNotNull(document.body).addEventListener("keydown", onKeyDown)
						assertNotNull(document.body).addEventListener("keyup", onKeyUp)
					}
				},
				onbeforeremove: vnode => {
					if (canDoDragAndDropExport()) {
						assertNotNull(document.body).removeEventListener("keydown", onKeyDown)
						assertNotNull(document.body).removeEventListener("keyup", onKeyUp)
					}
				},
			},
			this.showingTrashOrSpamFolder()
				? m(
					ListColumnWrapper,
					{
						headerContent: [
							m(".small.flex-grow.pt", lang.get("storageDeletion_msg")),
							m(".mr-negative-s.align-self-end", m(ButtonN, purgeButtonAttrs)),
						],
					},
					m(this.list),
				)
				: m(this.list),
		)
	}

	targetInbox(): boolean {
		if (this.mailView.selectedFolder) {
			return this.mailView.selectedFolder.folderType === MailFolderType.ARCHIVE || this.mailView.selectedFolder.folderType === MailFolderType.TRASH
		} else {
			return false
		}
	}

	showingTrashOrSpamFolder(): boolean {
		if (this.mailView.selectedFolder) {
			return this.mailView.selectedFolder.folderType === MailFolderType.SPAM || this.mailView.selectedFolder.folderType === MailFolderType.TRASH
		} else {
			return false
		}
	}

	_loadMailRange(start: Id, count: number): Promise<Mail[]> {
		return locator.entityClient.loadRange(MailTypeRef, this.listId, start, count, true).then(mails => {
			return locator.mailModel.getMailboxDetailsForMailListId(this.listId).then(mailboxDetail => {
				if (isInboxList(mailboxDetail, this.listId)) {
					// filter emails
					return promiseFilter(mails, mail => {
						return findAndApplyMatchingRule(locator.mailFacade, locator.entityClient, mailboxDetail, mail, true).then(matchingMailId => !matchingMailId)
					}).then(inboxMails => {
						if (mails.length === count && inboxMails.length < mails.length) {
							//console.log("load more because of matching inbox rules")
							return this._loadMailRange(mails[mails.length - 1]._id[1], mails.length - inboxMails.length).then(filteredMails => {
								return inboxMails.concat(filteredMails)
							})
						}

						return inboxMails
					})
				} else {
					return mails
				}
			})
		})
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