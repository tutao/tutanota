//@flow
import type {MailFolderTypeEnum} from "../../api/common/TutanotaConstants";
import {getMailFolderType, MailFolderType, ReplyType} from "../../api/common/TutanotaConstants";
import {FontIcons} from "../../gui/base/icons/FontIcons";
import type {Mail} from "../../api/entities/tutanota/Mail";
import {formatDateTimeFromYesterdayOn} from "../../misc/Formatter";
import {getSenderOrRecipientHeading, isTutanotaTeamMail} from "../model/MailUtils";
import {locator} from "../../api/main/MainLocator";
import m from "mithril";
import Badge from "../../gui/base/Badge";
import {px} from "../../gui/size";

const iconMap: {[MailFolderTypeEnum]: string} = {
	[MailFolderType.CUSTOM]: FontIcons.Folder,
	[MailFolderType.INBOX]: FontIcons.Inbox,
	[MailFolderType.SENT]: FontIcons.Sent,
	[MailFolderType.TRASH]: FontIcons.Trash,
	[MailFolderType.ARCHIVE]: FontIcons.Archive,
	[MailFolderType.SPAM]: FontIcons.Spam,
	[MailFolderType.DRAFT]: FontIcons.Edit,
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