// @flow
import m from "mithril"
import {MailView} from "./MailView"
import {assertMainOrNode, isDesktop, Mode} from "../api/Env"
import {ActionBar} from "../gui/base/ActionBar"
import ColumnEmptyMessageBox from "../gui/base/ColumnEmptyMessageBox"
import {lang} from "../misc/LanguageViewModel"
import {Icons} from "../gui/base/icons/Icons"
import {
	getFolderIcon,
	getFolderName,
	getSortedCustomFolders,
	getSortedSystemFolders, makeMailBundle,
	markMails,
} from "./MailUtils"
import type {MailboxDetail} from "./MailModel"
import {logins} from "../api/main/LoginController";
import {FeatureType} from "../api/common/TutanotaConstants";
import type {ButtonAttrs} from "../gui/base/ButtonN"
import {ButtonType} from "../gui/base/ButtonN"
import {BootIcons} from "../gui/base/icons/BootIcons"
import {theme} from "../gui/theme"
import type {Mail} from "../api/entities/tutanota/Mail"
import {locator} from "../api/main/MainLocator"
import type {PosRect} from "../gui/base/Dropdown"
import {exportMails, moveMails, promptAndDeleteMails} from "./MailGuiUtils"
import {attachDropdown} from "../gui/base/DropdownN"
import {fileApp} from "../native/FileApp"
import {showProgressDialog} from "../gui/base/ProgressDialog"

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
							m(".flex-space-between.mr-negative-s", [
								m(".flex.items-center", this._getMailSelectionMessage(mailView)),
								m(ActionBar, {
									buttons: this.getActionBarButtons(true)
								}),
							]),
						]
						: m(ColumnEmptyMessageBox, {
							message: () => this._getMailSelectionMessage(mailView),
							icon: BootIcons.Mail,
							color: theme.content_message_bg,
						})),
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

	getActionBarButtons(prependCancel: boolean = false): ButtonAttrs[] {
		const selectedEntities = () => this._mailView.mailList.list.getSelectedEntities()
		return [
			{
				label: "cancel_action",
				click: () => this._mailView.mailList.list.selectNone(),
				icon: () => Icons.Cancel,
				isVisible: () => prependCancel
			},
			{
				label: "dragAndDropExport_action",
				click: () => showProgressDialog("pleaseWait_msg", Promise.mapSeries(selectedEntities(), makeMailBundle)).then(fileApp.mailBundleExport),
				icon: () => Icons.Open,
				isVisible: () => isDesktop() /* && env.platformId === "win32" */ // TODO disable before release
			},
			attachDropdown({
				label: "move_action",
				icon: () => Icons.Folder,
			}, () => this.makeMoveMailButtons()),
			{
				label: "delete_action",
				click: () => {
					let mails = selectedEntities()
					promptAndDeleteMails(locator.mailModel, mails, () => this._mailView.mailList.list.selectNone())
				},
				icon: () => Icons.Trash
			},

			attachDropdown({
				label: "more_label",
				icon: () => Icons.More
			}, () => [
				{
					label: "markUnread_action",
					click: this._actionBarAction(mails => markMails(locator.entityClient, mails, true)),
					icon: () => Icons.NoEye,
					type: ButtonType.Dropdown
				},
				{
					label: "markRead_action",
					click: this._actionBarAction(mails => markMails(locator.entityClient, mails, false)),
					icon: () => Icons.Eye,
					type: ButtonType.Dropdown
				},
				{
					label: "export_action",
					click: this._actionBarAction((mails) => exportMails(locator.entityClient, mails)),
					icon: () => Icons.Export,
					type: ButtonType.Dropdown,
					isVisible: () => env.mode !== Mode.App && !logins.isEnabled(FeatureType.DisableMailExport)
				}
			])
		]
	}


	/**
	 * Generate buttons that will move the selected mails to respective folders
	 * @returns {Promise<R>|Promise<ButtonAttrs[]>}
	 */
	makeMoveMailButtons(): Promise<ButtonAttrs[]> {
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
						return {
							label: () => getFolderName(f),
							click: () => this._actionBarAction(mails => moveMails(locator.mailModel, mails, f)),
							icon: getFolderIcon(f)
						}
					})
			}
		})
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
