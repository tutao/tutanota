// @flow
import m from "mithril"
import {Button, createAsyncDropDownButton, createDropDownButton} from "../gui/base/Button"
import {MailView} from "./MailView"
import {assertMainOrNode, Mode} from "../api/Env"
import {ActionBar} from "../gui/base/ActionBar"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox"
import {lang} from "../misc/LanguageViewModel"
import {Icons} from "../gui/base/icons/Icons"
import {
	exportMails,
	getFolderIcon,
	getFolderName,
	getSortedCustomFolders,
	getSortedSystemFolders,
	markMails,
	showDeleteConfirmationDialog
} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {logins} from "../api/main/LoginController";
import {FeatureType} from "../api/common/TutanotaConstants";
import {ButtonType} from "../gui/base/ButtonN"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {theme} from "../gui/theme"
import type {Mail} from "../api/entities/tutanota/Mail"
import {locator} from "../api/main/MainLocator"
import type {PosRect} from "../gui/base/Dropdown"

assertMainOrNode()

/**
 * The MailViewer displays the action buttons for multiple selected emails.
 */
export class MultiMailViewer {
	view: Function;
	_mailView: MailView
	_domMailViewer: ?HTMLElement;

	constructor(mailView: MailView) {
		this._mailView = mailView
		const actions = this.createActionBar(true)
		this.view = () => {
			return [
				m(".fill-absolute.mt-xs.plr-l", {
						oncreate: (vnode) => {
							this._domMailViewer = vnode.dom
						},
					},
					(mailView.mailList && mailView.mailList.list.getSelectedEntities().length > 0)
						? [
							m(".button-height"), // just for the margin
							m(".flex-space-between", [
								m(".flex.items-center", this._getMailSelectionMessage(mailView)),
								m(actions)
							])
						]
						: m(ColumnEmptyMessageBox, {
							message: () => this._getMailSelectionMessage(mailView),
							icon: BootIcons.Mail,
							color: theme.content_message_bg,
						}))
			]
		}
	}

	getBounds(): ?PosRect {
		return this._domMailViewer && this._domMailViewer.getBoundingClientRect()
	}

	_getMailSelectionMessage(mailView: MailView): string {
		let nbrOfSelectedMails = (mailView.mailList) ? mailView.mailList.list.getSelectedEntities().length : 0
		if (nbrOfSelectedMails === 0) {
			return lang.get("noMail_msg")
		} else if (nbrOfSelectedMails === 1) {
			return lang.get("oneMailSelected_msg")
		} else {
			return lang.get("nbrOfMailsSelected_msg", {"{1}": nbrOfSelectedMails})
		}
	}

	createActionBar(prependCancel: boolean = false): ActionBar {
		let actions = new ActionBar()

		if (prependCancel) {
			actions.add(new Button("cancel_action", () => this._mailView.mailList.list.selectNone(),
				() => Icons.Cancel))
		}

		actions.add(createAsyncDropDownButton('move_action', () => Icons.Folder, () => {
			return Promise.reduce(this._mailView.mailList.list.getSelectedEntities(), (set, mail) => {
				return locator.mailModel.getMailboxDetailsForMail(mail).then(mailBox => {
					if (set.indexOf(mailBox) < 0) {
						set.push(mailBox)
					}
					return set
				})
			}, ([]: MailboxDetail[])).then((sourceMailboxes) => {
				if (sourceMailboxes.length !== 1) {
					return []
				} else {
					return (getSortedSystemFolders(sourceMailboxes[0].folders).concat(getSortedCustomFolders(sourceMailboxes[0].folders)))
						.filter(f => f !== this._mailView.selectedFolder)
						.map(f => {
							return new Button(() => getFolderName(f),
								this._actionBarAction((mails) => locator.mailModel.moveMails(mails, f)),
								getFolderIcon(f)
							).setType(ButtonType.Dropdown)
						})
				}
			})
		}))
		actions.add(new Button('delete_action', () => {
				let mails = this._mailView.mailList.list.getSelectedEntities()
				showDeleteConfirmationDialog(mails).then((confirmed) => {
					if (confirmed) {
						this._mailView.mailList.list.selectNone()
						locator.mailModel.deleteMails(mails)
					}
				})
			}, () => Icons.Trash
		))
		actions.add(createDropDownButton('more_label', () => Icons.More, () => {
			let moreButtons = []
			moreButtons.push(new Button("markUnread_action", this._actionBarAction((mails) => markMails(mails, true)), () => Icons.NoEye).setType(ButtonType.Dropdown))
			moreButtons.push(new Button("markRead_action", this._actionBarAction((mails) => markMails(mails, false)), () => Icons.Eye).setType(ButtonType.Dropdown))
			if (env.mode !== Mode.App && !logins.isEnabled(FeatureType.DisableMailExport)) {
				moreButtons.push(new Button("export_action", this._actionBarAction((mails) => exportMails(mails)), () => Icons.Export).setType(ButtonType.Dropdown))
			}
			return moreButtons
		}))
		return actions
	}

	/**
	 * Helper function to generate action which will first unselect everything and then execute action with previously
	 * selected mails. Workaround to avoid selecting the next email after the selected emails are removed.
	 * @param action
	 * @returns {Function}
	 * @private
	 */
	_actionBarAction(action: (Mail[]) => mixed): () => void {
		return () => {
			let mails = this._mailView.mailList.list.getSelectedEntities()
			this._mailView.mailList.list.selectNone()
			action(mails)
		}
	}
}
