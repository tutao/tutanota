// @flow
import m from "mithril"
import {formatDateTimeFromYesterdayOn} from "../misc/Formatter"
import {lang} from "../misc/LanguageViewModel"
import {List, sortCompareByReverseId} from "../gui/base/List"
import {load, loadRange} from "../api/main/Entity"
import {colors} from "../gui/AlternateColors"
import {ReplyType} from "../api/common/TutanotaConstants"
import {MailView} from "./MailView"
import {MailTypeRef} from "../api/entities/tutanota/Mail"
import {assertMainOrNode} from "../api/Env"
import {getSenderOrRecipientHeading} from "./MailUtils"
import {findAndApplyMatchingRule, isInboxList} from "./InboxRuleHandler"
import {NotFoundError} from "../api/common/error/RestError"
import {size} from "../gui/size"
import {neverNull} from "../api/common/utils/Utils"
import {Icon} from "../gui/base/Icon"
import {Icons} from "../gui/base/icons/Icons"
import {BootIcons} from "../gui/base/icons/BootIcons"

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
					return findAndApplyMatchingRule(neverNull(this.mailView.selectedMailbox), entity).then(ruleFound => {
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
			createVirtualRow: () => new MailRow(this),
			showStatus: false,
			className: className,
			swipe: {
				renderLeftSpacer: () => [m(Icon, {icon: Icons.Folder}), m(".labelId", lang.get('archive_action'))],
				renderRightSpacer: () => [m(Icon, {icon: Icons.Folder}), m(".labelId", lang.get('trash_action'))], // TODO finalDelete_action if the mail is deleted from trash
				swipeLeft: () => console.log("left"),
				swipeRight: () => console.log("right"),
			},
			elementsDraggable: true,
			multiSelectionAllowed: true,
			emptyMessage: lang.get("noMails_msg")
		})

		this.view = (): VirtualElement => {
			return m(this.list)
		}
	}


	_loadMailRange(start: Id, count: number): Promise<Mail[]> {
		return loadRange(MailTypeRef, this.listId, start, count, true).then(mails => {
			if (isInboxList(neverNull(this.mailView.selectedMailbox), this.listId)) {
				// filter emails
				return Promise.filter(mails, (mail) => {
					return findAndApplyMatchingRule(neverNull(this.mailView.selectedMailbox), mail).then(ruleFound => !ruleFound)
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

export class MailRow {
	top: number;
	domElement: HTMLElement; // set from List
	entity: ?Mail;
	_domSubject: HTMLElement;
	_domSender: HTMLElement;
	_domDate: HTMLElement;
	_domReplyIcon: HTMLElement;
	_domForwardIcon: HTMLElement;
	_domAttachmentIcon: HTMLElement;
	_domLockIcon: HTMLElement;
	_domErrorIcon: HTMLElement;
	list: MailListView;

	constructor(list: MailListView) {
		this.top = 0
		this.entity = null
		this.list = list
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

		if (mail.replyType === ReplyType.NONE) {
			this._domReplyIcon.style.display = 'none'
			this._domForwardIcon.style.display = 'none'
		} else if (mail.replyType === ReplyType.REPLY) {
			this._domReplyIcon.style.display = ''  // initial value, "initial" does not work in IE
			this._domForwardIcon.style.display = 'none'
		} else if (mail.replyType === ReplyType.FORWARD) {
			this._domReplyIcon.style.display = 'none'
			this._domForwardIcon.style.display = ''
		} else if (mail.replyType === ReplyType.REPLY_FORWARD) {
			this._domReplyIcon.style.display = ''
			this._domForwardIcon.style.display = ''
		}
		if (mail.confidential) {
			this._domLockIcon.style.display = ''
		} else {
			this._domLockIcon.style.display = 'none'
		}
		if (mail.attachments.length > 0) {
			this._domAttachmentIcon.style.display = ''
		} else {
			this._domAttachmentIcon.style.display = 'none'
		}
		if (mail._errors) {
			this._domErrorIcon.style.display = ''
		} else {
			this._domErrorIcon.style.display = 'none'
		}

		this._domDate.textContent = formatDateTimeFromYesterdayOn(mail.receivedDate)
		this._domSender.textContent = getSenderOrRecipientHeading(mail, true)
		this._domSubject.textContent = mail.subject
		if (mail.unread) {
			this._domSubject.classList.add("b")
		} else {
			this._domSubject.classList.remove("b")
		}
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		let elements = [
			m(".top.flex-space-between", [
				m("small.text-ellipsis", {oncreate: (vnode) => this._domSender = vnode.dom}),
				m("small.text-ellipsis.list-accent-fg.flex-no-shrink", {oncreate: (vnode) => this._domDate = vnode.dom})
			]),
			m(".bottom.flex-space-between", [
				m(".text-ellipsis", {oncreate: (vnode) => this._domSubject = vnode.dom}),
				m(".icons.flex-no-shrink", {style: {"margin-right": "-3px"}}, [ // 3px to neutralize the svg icons internal border border
					m(Icon, {
						icon: Icons.Warning,
						class: "svg-list-accent-fg",
						style: {display: 'none'},
						title: lang.get("corrupted_msg"),
						oncreate: (vnode) => this._domErrorIcon = vnode.dom,
					}),
					m(Icon, {
						icon: Icons.Reply,
						class: "svg-list-accent-fg",
						style: {display: 'none'},
						oncreate: (vnode) => this._domReplyIcon = vnode.dom,
					}),
					m(Icon, {
						icon: Icons.Forward,
						class: "svg-list-accent-fg",
						style: {display: 'none'},
						oncreate: (vnode) => this._domForwardIcon = vnode.dom,
					}),
					m(Icon, {
						icon: BootIcons.Attachment,
						class: "svg-list-accent-fg",
						style: {display: 'none'},
						oncreate: (vnode) => this._domAttachmentIcon = vnode.dom,
					}),
					m(Icon, {
						icon: Icons.Lock,
						class: "svg-list-accent-fg",
						style: {display: 'none'},
						oncreate: (vnode) => this._domLockIcon = vnode.dom,
					}),
				])
			])
		]
		return elements
	}
}
