// @flow
import m from "mithril"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {List} from "../gui/base/List"
import {HttpMethod, sortCompareByReverseId} from "../api/common/EntityFunctions"
import {load, loadRange, serviceRequestVoid} from "../api/main/Entity"
import {colors} from "../gui/AlternateColors"
import type {MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {CounterType_UnreadMails, getMailFolderType, MailFolderType, ReplyType} from "../api/common/TutanotaConstants"
import {MailView} from "./MailView"
import type {Mail} from "../api/entities/tutanota/Mail"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {assertMainOrNode, isDesktop} from "../api/Env"
import {
	getArchiveFolder,
	getFolderName,
	getInboxFolder,
	getSenderOrRecipientHeading,
	isTutanotaTeamMail,
	showDeleteConfirmationDialog
} from "./MailUtils"
import {findAndApplyMatchingRule, isInboxList} from "./InboxRuleHandler"
import {NotFoundError} from "../api/common/error/RestError"
import {px, size} from "../gui/size"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {logins} from "../api/main/LoginController"
import {FontIcons} from "../gui/base/icons/FontIcons"
import Badge from "../gui/base/Badge"
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonColors, ButtonN, ButtonType} from "../gui/base/ButtonN"
import {Dialog} from "../gui/base/Dialog"
import {MonitorService} from "../api/entities/monitor/Services"
import {createWriteCounterData} from "../api/entities/monitor/WriteCounterData"
import {debounce} from "../api/common/utils/Utils"
import {worker} from "../api/main/WorkerClient"
import {locator} from "../api/main/MainLocator"
import {fileController} from "../file/FileController"

assertMainOrNode()

const className = "mail-list"

const iconMap: {[MailFolderTypeEnum]: string} = {
	[MailFolderType.CUSTOM]: FontIcons.Folder,
	[MailFolderType.INBOX]: FontIcons.Inbox,
	[MailFolderType.SENT]: FontIcons.Sent,
	[MailFolderType.TRASH]: FontIcons.Trash,
	[MailFolderType.ARCHIVE]: FontIcons.Archive,
	[MailFolderType.SPAM]: FontIcons.Spam,
	[MailFolderType.DRAFT]: FontIcons.Edit,
}


export class MailListView implements Component {
	listId: Id;
	mailView: MailView;
	list: List<Mail, MailRow>;
	view: Function;

	constructor(mailListId: Id, mailView: MailView) {
		this.listId = mailListId
		this.mailView = mailView

		this.list = new List({
			rowHeight: size.list_row_height,
			fetch: (start, count) => {
				return this._loadMailRange(start, count)
			},
			loadSingle: (elementId) => {
				return load(MailTypeRef, [this.listId, elementId]).catch(NotFoundError, (e) => {
					// we return null if the entity does not exist
				})
			},
			sortCompare: sortCompareByReverseId,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => mailView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new MailRow(false),
			showStatus: false,
			className: className,
			dragStart: (ev, virtualRow, mails) => {
				// alt + drag on desktop will attempt to export the mails to the OS.
				if(ev.altKey && isDesktop()) {
					// interpret as an export drag to the file system
					ev.preventDefault()
					fileController.exportMails(mails)
					return true
				}
				return false
			},
			swipe: ({
				renderLeftSpacer: () => !logins.isInternalUserLoggedIn() ? [] : [
					m(Icon, {icon: Icons.Folder}),
					m(".pl-s", this.targetInbox() ? lang.get('received_action') : lang.get('archive_action'))
				],
				renderRightSpacer: () => [m(Icon, {icon: Icons.Folder}), m(".pl-s", lang.get('delete_action'))],
				swipeLeft: (listElement: Mail) => showDeleteConfirmationDialog([listElement]).then((confirmed) => {
					if (confirmed) {
						this.list.selectNone()
						locator.mailModel.deleteMails([listElement])
					}
					return Promise.resolve(confirmed)
				}),
				swipeRight: (listElement: Mail) => {
					if (!logins.isInternalUserLoggedIn()) {
						return Promise.resolve() // externals don't have an archive folder
					} else if (this.targetInbox()) {
						this.list.selectNone()
						return locator.mailModel.getMailboxFolders(listElement)
						              .then((folders) => locator.mailModel.moveMails([listElement], getInboxFolder(folders)))
					} else {
						this.list.selectNone()
						return locator.mailModel.getMailboxFolders(listElement)
						              .then((folders) => locator.mailModel.moveMails([listElement], getArchiveFolder(folders)))
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
	_fixCounterIfNeeded = debounce(2000, (listId: Id, listLength: number) => {
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

	targetInbox() {
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
		return loadRange(MailTypeRef, this.listId, start, count, true).then(mails => {
			return locator.mailModel.getMailboxDetailsForMailListId(this.listId).then((mailboxDetail) => {
				if (isInboxList(mailboxDetail, this.listId)) {
					// filter emails
					return Promise.filter(mails, (mail) => {
						return findAndApplyMatchingRule(mailboxDetail, mail).then(matchingMailId => !matchingMailId)
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


export class MailRow {
	top: number;
	domElement: ?HTMLElement; // set from List
	entity: ?Mail;
	_domSubject: HTMLElement;
	_domSender: HTMLElement;
	_domDate: HTMLElement;
	_iconsDom: HTMLElement;
	_domUnread: HTMLElement;
	_showFolderIcon: boolean;
	_domFolderIcons: {[key: MailFolderTypeEnum]: HTMLElement};
	_domTeamLabel: HTMLElement;

	constructor(showFolderIcon: boolean) {
		this.top = 0
		this.entity = null
		this._showFolderIcon = showFolderIcon
		this._domFolderIcons = {}
	}

	stringToPicto(s: string) {
		let color = (s.charCodeAt(0) + s.charCodeAt(s.length - 1) + s.length) % 36
		s = s.trim()
		return {
			capitalLetter: s.charAt(0).toUpperCase(),
			color: colors['alt_' + color]
		}
	}

	update(mail: Mail, selected: boolean): void {
		if (!this.domElement) {
			return
		}
		if (selected) {
			this.domElement.classList.add("row-selected")
			this._iconsDom.classList.add("secondary")
		} else {
			this.domElement.classList.remove("row-selected")
			this._iconsDom.classList.remove("secondary")
		}

		this._iconsDom.textContent = this._iconsText(mail)

		this._domDate.textContent = formatDateTimeFromYesterdayOn(mail.receivedDate)
		this._domSender.textContent = getSenderOrRecipientHeading(mail, true)
		this._domSubject.textContent = mail.subject
		if (mail.unread) {
			this._domUnread.classList.remove("hidden")
			this._domSubject.classList.add("b")
		} else {
			this._domUnread.classList.add("hidden")
			this._domSubject.classList.remove("b")
		}

		if (isTutanotaTeamMail(mail)) {
			this._domTeamLabel.style.display = ''
		} else {
			this._domTeamLabel.style.display = 'none'
		}
	}


	_iconsText(mail: Mail): string {
		let iconText = "";
		if (this._showFolderIcon) {
			let folder = locator.mailModel.getMailFolder(mail._id[0])
			iconText += folder ? this._getFolderIcon(getMailFolderType(folder)) : ""
		}
		iconText += mail._errors ? FontIcons.Warning : "";
		switch (mail.replyType) {
			case ReplyType.REPLY:
				iconText += FontIcons.Reply
				break
			case ReplyType.FORWARD:
				iconText += FontIcons.Forward
				break
			case ReplyType.REPLY_FORWARD:
				iconText += FontIcons.Reply
				iconText += FontIcons.Forward
				break
		}
		if (mail.confidential) {
			iconText += FontIcons.Confidential
		}
		if (mail.attachments.length > 0) {
			iconText += FontIcons.Attach
		}
		return iconText
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(".flex", [
			m(".flex.items-start.flex-no-grow.no-shrink.pr-s.pb-xs", m(".circle.bg-accent-fg.hidden", {
					oncreate: vnode => this._domUnread = vnode.dom,
				})
			),
			m(".flex-grow.min-width-0", [
				m(".top.flex.badge-line-height", [
					m(Badge, {classes: ".small.mr-s", oncreate: (vnode) => this._domTeamLabel = vnode.dom}, "Tutanota Team"),
					m("small.text-ellipsis", {oncreate: (vnode) => this._domSender = vnode.dom}),
					m(".flex-grow"),
					m("small.text-ellipsis.flex-fixed", {oncreate: (vnode) => this._domDate = vnode.dom})
				]),
				m(".bottom.flex-space-between", {
						style: {
							marginTop: px(2)
						}
					}, [
						m(".text-ellipsis.flex-grow", {oncreate: (vnode) => this._domSubject = vnode.dom}),
						m("span.ion.ml-s.list-font-icons.secondary", {
							oncreate: (vnode) => this._iconsDom = vnode.dom
						})

					]
				)
			])
		])
	}

	_getFolderIcon(type: MailFolderTypeEnum): string {
		return iconMap[type];
	}
}
