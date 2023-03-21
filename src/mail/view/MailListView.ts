import m, { Children, Component, Vnode, VnodeDOM } from "mithril"
import { lang } from "../../misc/LanguageViewModel"
import type { ListFetchResult, VirtualRow } from "../../gui/base/List"
import { List } from "../../gui/base/List"
import { MailFolderType, MailState } from "../../api/common/TutanotaConstants"
import type { MailView } from "./MailView"
import type { Mail, MailFolder } from "../../api/entities/tutanota/TypeRefs.js"
import { MailTypeRef } from "../../api/entities/tutanota/TypeRefs.js"
import { canDoDragAndDropExport, getFolderName } from "../model/MailUtils"
import { NotFoundError } from "../../api/common/error/RestError"
import { size } from "../../gui/size"
import { styles } from "../../gui/styles"
import { Icon } from "../../gui/base/Icon"
import { Icons } from "../../gui/base/icons/Icons"
import type { ButtonAttrs } from "../../gui/base/Button.js"
import { Button, ButtonColor, ButtonType } from "../../gui/base/Button.js"
import { Dialog } from "../../gui/base/Dialog"
import { assertNotNull, AsyncResult, count, debounce, downcast, neverNull, ofClass, promiseFilter, promiseMap } from "@tutao/tutanota-utils"
import { locator } from "../../api/main/MainLocator"
import { getLetId, haveSameId, sortCompareByReverseId } from "../../api/common/utils/EntityUtils"
import { moveMails, promptAndDeleteMails } from "./MailGuiUtils"
import { MailRow } from "./MailRow"
import { makeTrackedProgressMonitor } from "../../api/common/utils/ProgressMonitor"
import { generateExportFileName, generateMailFile, getMailExportMode } from "../export/Exporter"
import { deduplicateFilenames } from "../../api/common/utils/FileUtils"
import { makeMailBundle } from "../export/Bundler"
import { ListColumnWrapper } from "../../gui/ListColumnWrapper"
import { assertMainOrNode } from "../../api/common/Env"
import { WsConnectionState } from "../../api/main/WorkerClient"
import { findAndApplyMatchingRule, isInboxList } from "../model/InboxRuleHandler.js"
import { isOfflineError } from "../../api/common/utils/ErrorCheckUtils.js"
import { FolderSystem } from "../../api/common/mail/FolderSystem.js"
import { EntityUpdateData, isUpdateForTypeRef } from "../../api/main/EventController.js"
import { assertSystemFolderOfType, isOfTypeOrSubfolderOf, isSpamOrTrashFolder } from "../../api/common/mail/CommonMailUtils.js"

assertMainOrNode()
const className = "mail-list"

export interface MailListViewAttrs {
	// We would like to not get and hold to the whole MailView eventually
	// but for that we need to rewrite the List
	mailView: MailView
}

export class MailListView implements Component<MailListViewAttrs> {
	listId: Id
	mailView: MailView | null = null
	list: List<Mail, MailRow>
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

	constructor(mailListId: Id) {
		this.listId = mailListId
		this.exportedMails = new Map()
		this._listDom = null
		this.showingTrashOrSpamFolder().then((result) => {
			this.showingSpamOrTrash = result
			m.redraw()
		})
		this.showingDraftFolder().then((result) => {
			this.showingDraft = result
			m.redraw()
		})
		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: async (start, count) => {
				const result = await this.loadMailRange(start, count)
				if (result.complete) {
					this.fixCounterIfNeeded(this.listId, this.list.markCurrentState())
				}
				return result
			},
			loadSingle: (elementId) => {
				return locator.entityClient.load<Mail>(MailTypeRef, [this.listId, elementId]).catch(
					ofClass(NotFoundError, (e) => {
						// we return null if the entity does not exist
						return null
					}),
				)
			},
			sortCompare: sortCompareByReverseId,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) =>
				this.mailView?.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new MailRow(false),
			className: className,
			swipe: {
				renderLeftSpacer: () =>
					!locator.logins.isInternalUserLoggedIn()
						? []
						: this.showingDraft
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
						  ],
				renderRightSpacer: () => [
					m(Icon, {
						icon: Icons.Trash,
					}),
					m(".pl-s", lang.get("delete_action")),
				],
				swipeLeft: (listElement: Mail) => promptAndDeleteMails(locator.mailModel, [listElement], () => this.list.selectNone()),
				swipeRight: (listElement: Mail) => {
					if (!locator.logins.isInternalUserLoggedIn()) {
						return Promise.resolve(false) // externals don't have an archive folder
					} else if (this.showingDraft) {
						// just cancel selection if in drafts
						this.list.selectNone()
						return Promise.resolve(false)
					} else if (this.showingSpamOrTrash) {
						// recover email from trash/spam
						this.list.selectNone()
						return locator.mailModel.getMailboxFolders(listElement).then(
							(folders) =>
								!!folders &&
								moveMails({
									mailModel: locator.mailModel,
									mails: [listElement],
									targetMailFolder: this.getRecoverFolder(listElement, folders),
								}),
						)
					} else {
						this.list.selectNone()
						return locator.mailModel.getMailboxFolders(listElement).then(
							(folders) =>
								!!folders &&
								moveMails({
									mailModel: locator.mailModel,
									mails: [listElement],
									targetMailFolder: assertNotNull(folders.getSystemFolderByType(MailFolderType.ARCHIVE)),
								}),
						)
					}
				},
				enabled: true,
			},
			multiSelectionAllowed: true,
			emptyMessage: lang.get("noMails_msg"),
			dragStart: (event, row, selected) => this._dragStart(event, row, selected),
		})

		// "this" is incorrectly bound if we don't do it this way
		this.view = this.view.bind(this)

		locator.eventController.addEntityListener(this.entityListener)
	}

	dispose() {
		locator.eventController.removeEntityListener(this.entityListener)
	}

	private entityListener = async (events: EntityUpdateData[]) => {
		for (const update of events) {
			if (isUpdateForTypeRef(MailTypeRef, update)) {
				const { instanceListId, instanceId, operation } = update

				if (instanceListId === this.listId) {
					await this.list.entityEventReceived(instanceId, operation)
				}
			}
		}
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

	/**
	 * Do not start many fixes in parallel, do check after some time when counters are more likely to settle
	 * this will make a single post request in case the counters are out of sync (mailboxdetails and counters are already available locally)
	 */
	private fixCounterIfNeeded: (listId: Id, checkIfListChanged: () => boolean) => void = debounce(
		2000,
		async (listId: Id, checkIfListChanged: () => boolean) => {
			// If folders are changed, list won't have the data we need.
			// Do not rely on counters if we are not connected
			if (this.listId !== listId || locator.connectivityModel.wsConnection()() !== WsConnectionState.connected) {
				return
			}

			// If list was modified in the meantime, we cannot be sure that we will fix counters correctly (e.g. because of the inbox rules)
			if (checkIfListChanged()) {
				console.log(`list changed, trying again later`)
				return this.fixCounterIfNeeded(listId, this.list.markCurrentState())
			}

			const unreadMailsCount = count(this.list.getLoadedEntities(), (e) => e.unread)

			const counterValue = await locator.mailModel.getCounterValue(this.listId)
			if (counterValue != null && counterValue !== unreadMailsCount) {
				console.log(`fixing up counter for list ${this.listId}`)
				await locator.mailModel.fixupCounterForMailList(this.listId, unreadMailsCount)
			} else {
				console.log(`same counter, no fixup on list ${this.listId}`)
			}
		},
	)

	view(vnode: Vnode<MailListViewAttrs>): Children {
		this.mailView = vnode.attrs.mailView

		// Save the folder before showing the dialog so that there's no chance that it will change
		const folder = vnode.attrs.mailView.cache.selectedFolder
		const purgeButtonAttrs: ButtonAttrs = {
			label: "clearFolder_action",
			type: ButtonType.Primary,
			colors: ButtonColor.Nav,
			click: async () => {
				if (folder == null) {
					console.warn("Cannot delete folder, no folder is selected")
					return
				}
				const confirmed = await Dialog.confirm(() => lang.get("confirmDeleteFinallySystemFolder_msg", { "{1}": getFolderName(folder) }))
				if (confirmed) {
					vnode.attrs.mailView.finallyDeleteAllMailsInSelectedFolder(folder)
				}
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
					headerContent: this.showingSpamOrTrash
						? [
								m(".flex.flex-column.plr-l", [
									m(".small.flex-grow.pt", lang.get("storageDeletion_msg")),
									m(".mr-negative-s.align-self-end", m(Button, purgeButtonAttrs)),
								]),
						  ]
						: null,
				},
				m(this.list),
			),
		)
	}

	oncreate(vnode: VnodeDOM<MailListViewAttrs>) {
		this.mailView = vnode.attrs.mailView
	}

	onremove(vnode: VnodeDOM<MailListViewAttrs>) {
		// don't hold to the banana and gorilla and the whole jungle (we are being cached, unfortunately, but the MailView isn't)
		this.mailView = null
	}

	private targetInbox(): boolean {
		if (this.mailView && this.mailView.cache.selectedFolder) {
			return (
				this.mailView.cache.selectedFolder.folderType === MailFolderType.ARCHIVE ||
				this.mailView.cache.selectedFolder.folderType === MailFolderType.TRASH
			)
		} else {
			return false
		}
	}

	private async showingTrashOrSpamFolder(): Promise<boolean> {
		const folder = await locator.mailModel.getMailFolder(this.listId)
		if (!folder) {
			return false
		}
		const mailboxDetail = await locator.mailModel.getMailboxDetailsForMailListId(this.listId)
		return mailboxDetail != null && isSpamOrTrashFolder(mailboxDetail.folders, folder)
	}

	private async showingDraftFolder(): Promise<boolean> {
		const mailboxDetail = await locator.mailModel.getMailboxDetailsForMailListId(this.listId)
		if (this.mailView && this.mailView.cache.selectedFolder && mailboxDetail) {
			return isOfTypeOrSubfolderOf(mailboxDetail.folders, this.mailView.cache.selectedFolder, MailFolderType.DRAFT)
		} else {
			return false
		}
	}

	private async loadMailRange(start: Id, count: number): Promise<ListFetchResult<Mail>> {
		try {
			const items = await locator.entityClient.loadRange(MailTypeRef, this.listId, start, count, true)
			const mailboxDetail = await locator.mailModel.getMailboxDetailsForMailListId(this.listId)
			// For inbox rules there are two points where we might want to apply them. The first one is MailModel which applied inbox rules as they are received
			// in real time. The second one is here, when we load emails in inbox. If they are unread we want to apply inbox rules to them. If inbox rule is
			// applies the email is moved out of inbox and we don't return it here.
			if (mailboxDetail && isInboxList(mailboxDetail, this.listId)) {
				const mailsToKeepInInbox = await promiseFilter(items, async (mail) => {
					const wasMatched =
						(await findAndApplyMatchingRule(locator.mailFacade, locator.entityClient, locator.logins, mailboxDetail, mail, true)) != null
					return !wasMatched
				})
				return { items: mailsToKeepInInbox, complete: items.length < count }
			} else {
				return { items, complete: items.length < count }
			}
		} catch (e) {
			// The way the cache works is that it tries to fulfill the API contract of returning as many items as requested as long as it can.
			// This is problematic for offline where we might not have the full page of emails loaded (e.g. we delete part as it's too old or we move emails
			// around). Because of that cache will try to load additional items from the server in order to return `count` items. If it fails to load them,
			// it will not return anything and instead will throw an error.
			// This is generally fine but in case of offline we want to display everything that we have cached. For that we fetch directly from the cache,
			// give it to the list and let list make another request (and almost certainly fail that request) to show a retry button. This way we both show
			// the items we have and also show that we couldn't load everything.
			if (isOfflineError(e)) {
				const items = await locator.cacheStorage.provideFromRange(MailTypeRef, this.listId, start, count, true)
				if (items.length === 0) throw e
				return { items, complete: false }
			} else {
				throw e
			}
		}
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
