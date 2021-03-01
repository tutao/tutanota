// @flow
import m from "mithril"
import {lang} from "../../misc/LanguageViewModel"
import {List} from "../../gui/base/List"
import {HttpMethod} from "../../api/common/EntityFunctions"
import {serviceRequestVoid} from "../../api/main/Entity"
import {CounterType_UnreadMails, MailFolderType} from "../../api/common/TutanotaConstants"
import type {MailView} from "./MailView"
import type {Mail} from "../../api/entities/tutanota/Mail"
import {MailTypeRef} from "../../api/entities/tutanota/Mail"
import {assertMainOrNode} from "../../api/common/Env"
import {canDoDragAndDropExport, getArchiveFolder, getFolderName, getInboxFolder} from "../model/MailUtils"
import {findAndApplyMatchingRule, isInboxList} from "../model/InboxRuleHandler"
import {NotFoundError} from "../../api/common/error/RestError"
import {size} from "../../gui/size"
import {styles} from "../../gui/styles"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Dialog} from "../../gui/base/Dialog"
import {MonitorService} from "../../api/entities/monitor/Services"
import {createWriteCounterData} from "../../api/entities/monitor/WriteCounterData"
import {assertNotNull, debounce, neverNull} from "../../api/common/utils/Utils"
import {worker} from "../../api/main/WorkerClient"
import {locator} from "../../api/main/MainLocator"
import {getLetId, haveSameId, sortCompareByReverseId} from "../../api/common/utils/EntityUtils";
import {moveMails, promptAndDeleteMails} from "./MailGuiUtils"
import {MailRow} from "./MailRow"
import {fileApp} from "../../native/common/FileApp"
import {makeTrackedProgressMonitor} from "../../api/common/utils/ProgressMonitor"
import {nativeApp} from "../../native/common/NativeWrapper"
import {Request} from "../../api/common/WorkerProtocol"
import type {IProgressMonitor} from "../../api/common/utils/ProgressMonitor"
import {generateMailFile, getMailExportMode} from "../export/Exporter"
import {makeMailBundle} from "../export/Bundler"

assertMainOrNode()

const className = "mail-list"

export class MailListView implements Component {
	listId: Id;
	mailView: MailView;
	list: List<Mail, MailRow>;

	// Mails that are currently being or have already been downloaded/bundled/saved
	// Map of (Mail._id ++ MailExportMode) -> Promise<Filepath>
	// TODO this currently grows bigger and bigger amd bigger if the user goes on an exporting spree. maybe we should deal with this, or maybe this never becomes an issue?
	// TODO this will go out of sync with the filesystem if something happens to the temporary directory during the session after some previous drag and drop.
	//   Do we need to do something about this or do we consider this to be user error?
	exportedMails: Map<string, Promise<string>>

	constructor(mailListId: Id, mailView: MailView) {

		this.listId = mailListId
		this.mailView = mailView
		this.exportedMails = new Map()

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (start, count) => {
				return this._loadMailRange(start, count)
			},
			loadSingle: (elementId) => {
				return locator.entityClient.load(MailTypeRef, [this.listId, elementId]).catch(NotFoundError, (e) => {
					// we return null if the entity does not exist
				})
			},
			sortCompare: sortCompareByReverseId,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => mailView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new MailRow(false),
			showStatus: false,
			className: className,
			swipe: ({
				renderLeftSpacer: () => !logins.isInternalUserLoggedIn() ? [] : [
					m(Icon, {icon: Icons.Folder}),
					m(".pl-s", this.targetInbox() ? lang.get('received_action') : lang.get('archive_action'))
				],
				renderRightSpacer: () => [m(Icon, {icon: Icons.Folder}), m(".pl-s", lang.get('delete_action'))],
				swipeLeft: (listElement: Mail) => promptAndDeleteMails(locator.mailModel, [listElement], () => this.list.selectNone()),
				swipeRight: (listElement: Mail) => {
					if (!logins.isInternalUserLoggedIn()) {
						return Promise.resolve(false) // externals don't have an archive folder
					} else if (this.targetInbox()) {
						this.list.selectNone()
						return locator.mailModel.getMailboxFolders(listElement)
						              .then((folders) => moveMails(locator.mailModel, [listElement], getInboxFolder(folders)))
					} else {
						this.list.selectNone()
						return locator.mailModel.getMailboxFolders(listElement)
						              .then((folders) => moveMails(locator.mailModel, [listElement], getArchiveFolder(folders)))
					}
				},
				enabled: true
			}),
			elementsDraggable: true,
			multiSelectionAllowed: true,
			emptyMessage: lang.get("noMails_msg"),
			listLoadedCompletly: () => this._fixCounterIfNeeded(this.listId, this.list.getLoadedEntities().length),
			dragStart: (event, row, selected: $ReadOnlyArray<Mail>) => {

				if (!row.entity) return

				const mailUnderCursor = row.entity

				if (isExportDragEvent(event)) {
					// We have to preventDefault or we get mysterious and inconsistent electron crashes at the call to startDrag in IPC
					event.preventDefault()
					assertNotNull(document.body).style.cursor = "progress"

					// if the mail being dragged is not included in the mails that are selected, then we only drag
					// the mail that is currently being dragged, to match the behaviour of regular in-app dragging and dropping
					// which seemingly behaves how it does just by default
					const draggedMails = !!selected.find(mail => haveSameId(mail, mailUnderCursor))
						? selected.slice()
						: [mailUnderCursor]

					// We listen to mouseup to detect if the user released the mouse before the download was complete
					// we can't use dragend because we broke the DragEvent chain by calling prevent default
					const mouseupPromise = new Promise(resolve => {
						document.addEventListener("mouseup", resolve, {once: true})
					})

					const progressMonitor =
						makeTrackedProgressMonitor(locator.progressTracker, 2 * draggedMails.length + 1)
					progressMonitor.workDone(1)

					const filePathsPromise = Promise.all(draggedMails.map(mail => this._downloadAndBundleMail(mail, progressMonitor)))

					// If the download completes before the user releases their mouse, then we can call electron start drag and do the operation
					// otherwise we have to give some kind of feedback to the user that the drop was unsuccessful
					Promise.race([filePathsPromise.then(filePaths => [true, filePaths]), mouseupPromise.then(() => [false, []])])
					       .then(([didComplete, filePaths]) => {
						       if (didComplete) {
							       fileApp.startNativeDrag(filePaths)
						       } else {
							       nativeApp.invokeNative(new Request("focusApplicationWindow", []))
							                .then(() => Dialog.error("unsuccessfulDrop_msg"))
						       }
						       neverNull(document.body).style.cursor = "default"
					       })
				} else if (styles.isDesktopLayout()) {
					// Doesn't make sense to drag mails to folders when the folder list and mail list aren't visible at the same time
					neverNull(event.dataTransfer).setData("text", getLetId(neverNull(mailUnderCursor))[1]);
				} else {
					event.preventDefault()
				}
			}
		})
	}

	_downloadAndBundleMail(mail: Mail, progressMonitor: IProgressMonitor): Promise<string> {

		return getMailExportMode().then(exportMode => {

			const key = `${getLetId(mail).join("")}${exportMode}`

			// If the mail has already begun or finished downloading, then we just return it's promise
			// Otherwise we begin the process and return that promise
			if (this.exportedMails.has(key)) {
				progressMonitor.workDone(2)
				return neverNull(this.exportedMails.get(key))
			} else {
				const exportPromise = makeMailBundle(mail, locator.entityClient, worker)
					.then(bundle => {
						progressMonitor.workDone(1)
						return generateMailFile(bundle, exportMode)
					})
					.then(file => {
						progressMonitor.workDone(1)
						return fileApp.saveToExportDir(file)
					})
				this.exportedMails.set(key, exportPromise)
				return exportPromise
			}
		})

	}

	// Do not start many fixes in parallel, do check after some time when counters are more likely to settle
	_fixCounterIfNeeded: ((listId: Id, listLength: number) => void) = debounce(2000, (listId: Id, listLength: number) => {
		// If folders are changed, list won't have the data we need.
		// Do not rely on counters if we are not connected
		if (this.listId !== listId || worker.wsConnection()() !== "connected") {
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
		locator.mailModel.getCounterValue(this.listId).then((counterValue) => {
			if (counterValue != null && counterValue !== unreadMails) {
				locator.mailModel.getMailboxDetailsForMailListId(this.listId).then((mailboxDetails) => {
					const data = createWriteCounterData({
						counterType: CounterType_UnreadMails,
						row: mailboxDetails.mailGroup._id,
						column: this.listId,
						value: String(unreadMails)
					})
					serviceRequestVoid(MonitorService.CounterService, HttpMethod.POST, data)
				})

			}
		})
	})

	view(): Children {
		// Save the folder before showing the dialog so that there's no chance that it will change
		const folder = this.mailView.selectedFolder
		const purgeButtonAttrs: ButtonAttrs = {
			label: "clearFolder_action",
			type: ButtonType.Primary,
			colors: ButtonColors.Nav,
			click: () => {
				if (folder == null) {
					console.warn("Cannot delete folder, no folder is selected")
					return
				}
				Dialog.confirm(() => lang.get("confirmDeleteFinallySystemFolder_msg", {"{1}": getFolderName(folder)}))
				      .then(confirmed => {
					      if (confirmed) {
						      this.mailView._finallyDeleteAllMailsInSelectedFolder(folder)
					      }
				      })
			}
		}

		return this.showingTrashOrSpamFolder()
			? m(".flex.flex-column.fill-absolute", [
				m(".flex.flex-column.justify-center.plr-l.list-border-right.list-bg.list-header", [
					m(".small.flex-grow.pt", lang.get("storageDeletion_msg")),
					m(".mr-negative-s.align-self-end", m(ButtonN, purgeButtonAttrs))
				]),
				m(".rel.flex-grow", m(this.list))
			])
			: m(this.list)
	}

	targetInbox(): boolean {
		if (this.mailView.selectedFolder) {
			return this.mailView.selectedFolder.folderType === MailFolderType.ARCHIVE
				|| this.mailView.selectedFolder.folderType === MailFolderType.TRASH
		} else {
			return false
		}
	}

	showingTrashOrSpamFolder(): boolean {
		if (this.mailView.selectedFolder) {
			return this.mailView.selectedFolder.folderType === MailFolderType.SPAM
				|| this.mailView.selectedFolder.folderType === MailFolderType.TRASH
		} else {
			return false
		}
	}

	_loadMailRange(start: Id, count: number): Promise<Mail[]> {
		return locator.entityClient.loadRange(MailTypeRef, this.listId, start, count, true).then(mails => {
			return locator.mailModel.getMailboxDetailsForMailListId(this.listId).then((mailboxDetail) => {
				if (isInboxList(mailboxDetail, this.listId)) {
					// filter emails
					return Promise.filter(mails, (mail) => {
						return findAndApplyMatchingRule(worker, locator.entityClient, mailboxDetail, mail, true)
							.then(matchingMailId => !matchingMailId)
					}).then(inboxMails => {
						if (mails.length === count && inboxMails.length < mails.length) {
							//console.log("load more because of matching inbox rules")
							return this._loadMailRange(mails[mails.length - 1]._id[1], mails.length - inboxMails.length)
							           .then(filteredMails => {
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
	return canDoDragAndDropExport() && (event.ctrlKey || event.altKey)
}


