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
import {getArchiveFolder, getFolderName, getInboxFolder} from "../model/MailUtils"
import {findAndApplyMatchingRule, isInboxList} from "../model/InboxRuleHandler"
import {NotFoundError} from "../../api/common/error/RestError"
import {size} from "../../gui/size"
import {Icon} from "../../gui/base/Icon"
import {Icons} from "../../gui/base/icons/Icons"
import {logins} from "../../api/main/LoginController"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../../gui/base/ButtonN"
import {Dialog} from "../../gui/base/Dialog"
import {MonitorService} from "../../api/entities/monitor/Services"
import {createWriteCounterData} from "../../api/entities/monitor/WriteCounterData"
import {debounce} from "../../api/common/utils/Utils"
import {worker} from "../../api/main/WorkerClient"
import {locator} from "../../api/main/MainLocator"
import {sortCompareByReverseId} from "../../api/common/utils/EntityUtils";
import {moveMails, promptAndDeleteMails} from "./MailGuiUtils"
import {MailRow} from "./MailRow"

assertMainOrNode()

const className = "mail-list"


export class MailListView implements Component {
	listId: Id;
	mailView: MailView;
	list: List<Mail, MailRow>;

	constructor(mailListId: Id, mailView: MailView) {
		this.listId = mailListId
		this.mailView = mailView

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
						return Promise.resolve() // externals don't have an archive folder
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
			listLoadedCompletly: () => this._fixCounterIfNeeded(this.listId, this.list.getLoadedEntities().length)
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


