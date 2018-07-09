// @flow
import m from "mithril"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {List} from "../gui/base/List"
import {sortCompareByReverseId} from "../api/common/EntityFunctions"
import {load, loadRange} from "../api/main/Entity"
import {colors} from "../gui/AlternateColors"
import type {MailFolderTypeEnum} from "../api/common/TutanotaConstants"
import {ReplyType, MailFolderType} from "../api/common/TutanotaConstants"
import {MailView} from "./MailView"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {assertMainOrNode} from "../api/Env"
import {
	getSenderOrRecipientHeading,
	getInboxFolder,
	getArchiveFolder,
	getTrashFolder,
	getFolderIconByType
} from "./MailUtils"
import {findAndApplyMatchingRule, isInboxList} from "./InboxRuleHandler"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {mailModel} from "./MailModel"
import {logins} from "../api/main/LoginController"
import {theme} from "../gui/theme"

assertMainOrNode()

const className = "mail-list"

export class MailListView {
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
				// return new Promise((resolve, reject) => {
				// 	setTimeout(() => {
				// 		this._loadMailRange(start, count).then(mails => {
				// 			resolve(mails)
				// 		})
				// 	}, 10000)
				// })
			},
			loadSingle: (elementId) => {
				return load(MailTypeRef, [this.listId, elementId]).then((entity) => {
					return findAndApplyMatchingRule(mailModel.getMailboxDetailsForMailListId(this.listId), entity).then(ruleFound => {
						if (ruleFound) {
							return null
						} else {
							return entity
						}
					})
				}).catch(NotFoundError, (e) => {
					// we return null if the entity does not exist
				})
			},
			sortCompare: sortCompareByReverseId,
			elementSelected: (entities, elementClicked, selectionChanged, multiSelectionActive) => mailView.elementSelected(entities, elementClicked, selectionChanged, multiSelectionActive),
			createVirtualRow: () => new MailRow(false),
			showStatus: false,
			className: className,
			swipe: ({
				renderLeftSpacer: () => !logins.isInternalUserLoggedIn() ? [] : [m(Icon, {icon: Icons.Folder}), m(".pl-s", this.targetInbox() ? lang.get('received_action') : lang.get('archive_action'))],
				renderRightSpacer: () => [m(Icon, {icon: Icons.Folder}), m(".pl-s", lang.get('delete_action'))], // TODO finalDelete_action if the mail is deleted from trash
				swipeLeft: (listElement: Mail) => mailModel.deleteMails([listElement]),
				swipeRight: (listElement: Mail) => {
					if (!logins.isInternalUserLoggedIn()) {
						return Promise.resolve() // externals don't have an archive folder
					} else if (this.targetInbox()) {
						return mailModel.moveMails([listElement], getInboxFolder(mailModel.getMailboxFolders(listElement)))
					} else {
						return mailModel.moveMails([listElement], getArchiveFolder(mailModel.getMailboxFolders(listElement)))
					}
				},
			}:any),
			elementsDraggable: true,
			multiSelectionAllowed: true,
			emptyMessage: lang.get("noMails_msg")
		})

		this.view = (): VirtualElement => {
			return m(this.list)
		}
	}

	targetInbox() {
		const mailboxDetail = this.mailView.selectedFolder ? mailModel.getMailboxDetailsForMailListId(this.mailView.selectedFolder.mails) : null
		if (mailboxDetail) {
			return this.mailView.selectedFolder == getArchiveFolder(mailboxDetail.folders) || this.mailView.selectedFolder == getTrashFolder(mailboxDetail.folders)
		} else {
			return false
		}
	}


	_loadMailRange(start: Id, count: number): Promise<Mail[]> {
		return loadRange(MailTypeRef, this.listId, start, count, true).then(mails => {
			let mailboxDetail = mailModel.getMailboxDetailsForMailListId(this.listId)
			if (isInboxList(mailboxDetail, this.listId)) {
				// filter emails
				return Promise.filter(mails, (mail) => {
					return findAndApplyMatchingRule(mailboxDetail, mail).then(ruleFound => !ruleFound)
				}).then(inboxMails => {
					if (mails.length == count && inboxMails.length < mails.length) {
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
	}
}

const iconGlyphs = {
	reply: "\uf4c7",
	forward: "\uf499",
	confidential: "\uf31d",
	attach: "\uf28e"
}

export class MailRow {
	top: number;
	domElement: HTMLElement; // set from List
	entity: ?Mail;
	_domSubject: HTMLElement;
	_domSender: HTMLElement;
	_domDate: HTMLElement;
	_iconsDom: HTMLElement;
	_showFolderIcon: boolean;
	_domFolderIcons: {[key:MailFolderTypeEnum]:HTMLElement};

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
		if (selected) {
			this.domElement.classList.add("row-selected")
		} else {
			this.domElement.classList.remove("row-selected")
		}

		this._iconsDom.textContent = this._iconsText(mail)

		this._domDate.textContent = formatDateTimeFromYesterdayOn(mail.receivedDate)
		this._domSender.textContent = getSenderOrRecipientHeading(mail, true)
		this._domSubject.textContent = mail.subject
		if (mail.unread) {
			this._domSubject.classList.add("b")
		} else {
			this._domSubject.classList.remove("b")
		}

		if (this._showFolderIcon) {
			let folder = mailModel.getMailFolder(mail._id[0])
			Object.keys(this._domFolderIcons).forEach(folderType => {
				if (folder && folderType == folder.folderType) {
					this._domFolderIcons[folderType].style.display = ''
				} else {
					this._domFolderIcons[folderType].style.display = 'none'
				}
			})
		}
	}

	_iconsText(mail: Mail): string {
		let iconText = mail._errors ? "\uf268" : "";
		switch (mail.replyType) {
			case ReplyType.REPLY:
				iconText += iconGlyphs.reply
				break
			case ReplyType.FORWARD:
				iconText += iconGlyphs.forward
				break
			case ReplyType.REPLY_FORWARD:
				iconText += iconGlyphs.reply
				iconText += iconGlyphs.forward
				break
		}
		if (mail.confidential) {
			iconText += iconGlyphs.confidential
		}
		if (mail.attachments.length > 0) {
			iconText += iconGlyphs.attach
		}
		return iconText
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return [
			m(".top.flex-space-between", [
				m("small.text-ellipsis", {oncreate: (vnode) => this._domSender = vnode.dom}),
				m("small.text-ellipsis.list-accent-fg.flex-fixed", {oncreate: (vnode) => this._domDate = vnode.dom})
			]),
			m(".bottom.flex-space-between", [
					m(".text-ellipsis", {oncreate: (vnode) => this._domSubject = vnode.dom}),
					m(".flex-fixed", {style: {"margin-right": "-8px"}},
						(this._showFolderIcon ? Object.keys(MailFolderType).map(folderTypeKey => {
								return m(Icon, {
									icon: getFolderIconByType(MailFolderType[folderTypeKey])(),
									class: "svg-list-accent-fg",
									style: {display: 'none'},
									oncreate: (vnode) => this._domFolderIcons[MailFolderType[folderTypeKey]] = vnode.dom,
								})
							}) : []).concat([
							m("span.ion", {
								style: {
									color: theme.content_accent,
									"letter-spacing": "8px",
									"text-align": "right"
								},
								oncreate: (vnode) => this._iconsDom = vnode.dom
							})
						])
					)
				]
			)
		]
	}
}
