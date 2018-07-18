// @flow
import m from "mithril"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {MailView} from "./MailView"
import {assertMainOrNode} from "../api/Env"
import {ActionBar} from "../gui/base/ActionBar"
import {load, update} from "../api/main/Entity"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {exportAsEml} from "./Exporter"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import MessageBox from "../gui/base/MessageBox"
import {lang} from "../misc/LanguageViewModel"
import {Icons} from "../gui/base/icons/Icons"
import {getFolderName, getFolderIcon, getSortedSystemFolders, getSortedCustomFolders} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {mailModel} from "./MailModel"

assertMainOrNode()

/**
 * The MailViewer displays the action buttons for multiple selected emails.
 */
export class MultiMailViewer {
	view: Function;

	constructor(mailView: MailView) {
		let emptyMessageBox = new MessageBox(() => this._getMailSelectionMessage(mailView))
		let actions = new ActionBar()
		actions.add(createDropDownButton('move_action', () => Icons.Folder, () => {
			let mails = mailView.mailList.list.getSelectedEntities()
			let sourceMailboxes = mails.reduce((set, mail) => {
				let mailBox = mailModel.getMailboxDetails(mail)
				if (set.indexOf(mailBox) < 0) {
					set.push(mailBox)
				}
				return set
			}, ([]: MailboxDetail[]))

			if (sourceMailboxes.length !== 1) {
				return []
			} else {
				return (getSortedSystemFolders(sourceMailboxes[0].folders)
					.concat(getSortedCustomFolders(sourceMailboxes[0].folders))).map(f => {
					return new Button(() => getFolderName(f), () => mailModel.moveMails(mails, f), getFolderIcon(f))
						.setType(ButtonType.Dropdown)
				})
			}
		}))
		actions.add(new Button('delete_action', () => mailView.deleteSelectedMails(), () => Icons.Trash))
		actions.add(createDropDownButton('more_label', () => Icons.More, () => {
			let moreButtons = []
			moreButtons.push(new Button("markUnread_action", () => this._markAll(mailView.mailList.list.getSelectedEntities(), true), () => Icons.NoEye).setType(ButtonType.Dropdown))
			moreButtons.push(new Button("markRead_action", () => this._markAll(mailView.mailList.list.getSelectedEntities(), false), () => Icons.Eye).setType(ButtonType.Dropdown))
			moreButtons.push(new Button("export_action", () => this._exportAll(mailView.mailList.list.getSelectedEntities()), () => Icons.Download).setType(ButtonType.Dropdown))
			return moreButtons
		}))
		this.view = () => {
			return [
				m(".fill-absolute.mt-xs.plr-l",
					(mailView.mailList && mailView.mailList.list.getSelectedEntities().length > 0) ? [
						m(".button-height"), // just for the margin
						m(".flex-space-between", [
							m(".flex.items-center", this._getMailSelectionMessage(mailView)),
							m(actions)
						])
					] : [m(emptyMessageBox)])
			]
		}
	}

	_exportAll(mails: Mail[]) {
		Promise.map(mails, mail => load(MailBodyTypeRef, mail.body).then(body => {
			return exportAsEml(mail, htmlSanitizer.sanitize(body.text, false).text)
		}), {concurrency: 5})
	}

	_markAll(mails: Mail[], unread: boolean) {
		mails.map(mail => {
			if (mail.unread !== unread) {
				mail.unread = unread
				update(mail)
			}
		})
	}

	_getMailSelectionMessage(mailView: MailView) {
		let nbrOfSelectedMails = (mailView.mailList) ? mailView.mailList.list.getSelectedEntities().length : 0
		if (nbrOfSelectedMails === 0) {
			return lang.get("noMail_msg")
		} else if (nbrOfSelectedMails === 1) {
			return lang.get("oneMailSelected_msg")
		} else {
			return lang.get("nbrOfMailsSelected_msg", {"{1}": nbrOfSelectedMails})
		}
	}
}
