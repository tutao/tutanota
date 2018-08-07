// @flow
import m from "mithril"
import {Button, ButtonType, createDropDownButton} from "../gui/base/Button"
import {MailView} from "./MailView"
import {assertMainOrNode, Mode} from "../api/Env"
import {ActionBar} from "../gui/base/ActionBar"
import {load, update} from "../api/main/Entity"
import {MailBodyTypeRef} from "../api/entities/tutanota/MailBody"
import {exportAsEml} from "./Exporter"
import {htmlSanitizer} from "../misc/HtmlSanitizer"
import MessageBox from "../gui/base/MessageBox"
import {lang} from "../misc/LanguageViewModel"
import {Icons} from "../gui/base/icons/Icons"
import {getFolderIcon, getFolderName, getSortedCustomFolders, getSortedSystemFolders} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {mailModel} from "./MailModel"
import {logins} from "../api/main/LoginController";
import {FeatureType} from "../api/common/TutanotaConstants";

assertMainOrNode()

/**
 * The MailViewer displays the action buttons for multiple selected emails.
 */
export class MultiMailViewer {
	view: Function;
	_mailView: MailView

	constructor(mailView: MailView) {
		this._mailView = mailView
		let emptyMessageBox = new MessageBox(() => this._getMailSelectionMessage(mailView))
		const actions = this.createActionBar()
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

	_exportAll(mails: Mail[]): Promise<void> {
		return Promise.map(mails, mail => load(MailBodyTypeRef, mail.body).then(body => {
			return exportAsEml(mail, htmlSanitizer.sanitize(body.text, false).text)
		}), {concurrency: 5}).return()
	}

	_markAll(mails: Mail[], unread: boolean): Promise<void> {
		return Promise.all(mails.map(mail => {
			if (mail.unread !== unread) {
				mail.unread = unread
				return update(mail)
			} else {
				return Promise.resolve()
			}
		})).return()

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

	createActionBar(actionCallback: () => void = () => {}): ActionBar {
		let actions = new ActionBar()

		actions.add(createDropDownButton('move_action', () => Icons.Folder, () => {
			let mails = this._mailView.mailList.list.getSelectedEntities()
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
					return new Button(() => getFolderName(f),
						() => mailModel.moveMails(mails, f).then(actionCallback), getFolderIcon(f)
					).setType(ButtonType.Dropdown)
				})
			}
		}))
		actions.add(new Button('delete_action',
			() => this._mailView.deleteSelectedMails().then(actionCallback),
			() => Icons.Trash))
		actions.add(createDropDownButton('more_label', () => Icons.More, () => {
			let moreButtons = []
			moreButtons.push(new Button("markUnread_action",
				() => this._markAll(this._mailView.mailList.list.getSelectedEntities(), true).then(actionCallback),
				() => Icons.NoEye)
				.setType(ButtonType.Dropdown))
			moreButtons.push(new Button("markRead_action",
				() => this._markAll(this._mailView.mailList.list.getSelectedEntities(), false).then(actionCallback),
				() => Icons.Eye)
				.setType(ButtonType.Dropdown))
			moreButtons.push(new Button("export_action",
				() => this._exportAll(this._mailView.mailList.list.getSelectedEntities()).then(actionCallback),
				() => Icons.Download)
				.setType(ButtonType.Dropdown)
				.setIsVisibleHandler(() => env.mode !== Mode.App && !logins.isEnabled(FeatureType.DisableMailExport)))
			return moreButtons
		}))
		return actions
	}
}
