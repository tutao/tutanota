import m, {Component} from "mithril"
import {MailView} from "./MailView"
import {assertMainOrNode, isApp} from "../../api/common/Env"
import {ActionBar} from "../../gui/base/ActionBar"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import {lang} from "../../misc/LanguageViewModel"
import {Icons} from "../../gui/base/icons/Icons"
import {getFolderIcon, getFolderName, getSortedCustomFolders, getSortedSystemFolders, markMails} from "../model/MailUtils"
import {logins} from "../../api/main/LoginController"
import {FeatureType} from "../../api/common/TutanotaConstants"
import type {ButtonAttrs} from "../../gui/base/ButtonN"
import {ButtonType} from "../../gui/base/ButtonN"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {theme} from "../../gui/theme"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {locator} from "../../api/main/MainLocator"
import {moveMails, promptAndDeleteMails} from "./MailGuiUtils"
import {attachDropdown} from "../../gui/base/DropdownN"
import {exportMails} from "../export/Exporter"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"

assertMainOrNode()

/**
 * The MailViewer displays the action buttons for multiple selected emails.
 */
export class MultiMailViewer implements Component {
	view: Component["view"]
	private readonly _mailView: MailView

	constructor(mailView: MailView) {
		this._mailView = mailView

		this.view = () => {
			return [
				m(
					".fill-absolute.mt-xs.plr-l",
					mailView.mailList && mailView.mailList.list.getSelectedEntities().length > 0
						? [
							m(".button-height"), // just for the margin
							m(".flex-space-between.mr-negative-s", [
								m(".flex.items-center", this._getMailSelectionMessage(mailView)),
								m(ActionBar, {
									buttons: this.getActionBarButtons(true),
								}),
							]),
						]
						: m(ColumnEmptyMessageBox, {
							message: () => this._getMailSelectionMessage(mailView),
							icon: BootIcons.Mail,
							color: theme.content_message_bg,
						}),
				),
			]
		}
	}

	_getMailSelectionMessage(mailView: MailView): string {
		let nbrOfSelectedMails = mailView.mailList ? mailView.mailList.list.getSelectedEntities().length : 0

		if (nbrOfSelectedMails === 0) {
			return lang.get("noMail_msg")
		} else if (nbrOfSelectedMails === 1) {
			return lang.get("oneMailSelected_msg")
		} else {
			return lang.get("nbrOfMailsSelected_msg", {
				"{1}": nbrOfSelectedMails,
			})
		}
	}

	getActionBarButtons(prependCancel: boolean = false): ButtonAttrs[] {
		const selectedEntities = () => this._mailView.mailList.list.getSelectedEntities()

		const cancel: ButtonAttrs[] = prependCancel ?
			[{
				label: "cancel_action",
				click: () => this._mailView.mailList.list.selectNone(),
				icon: () => Icons.Cancel,
			}]
			: []

		return [
			...cancel,
			attachDropdown(
				{
                    mainButtonAttrs: {
                        label: "move_action",
                        icon: () => Icons.Folder,
                    }, childAttrs: () => this.makeMoveMailButtons()
                },
			),
			{
				label: "delete_action",
				click: () => {
					let mails = selectedEntities()
					promptAndDeleteMails(locator.mailModel, mails, () => this._mailView.mailList.list.selectNone())
				},
				icon: () => Icons.Trash,
			},
			attachDropdown(
				{
                    mainButtonAttrs: {
                        label: "more_label",
                        icon: () => Icons.More,
                    }, childAttrs: () => [
                        {
                            label: "markUnread_action",
                            click: this._actionBarAction(mails => markMails(locator.entityClient, mails, true)),
                            icon: () => Icons.NoEye,
                            type: ButtonType.Dropdown,
                        },
                        {
                            label: "markRead_action",
                            click: this._actionBarAction(mails => markMails(locator.entityClient, mails, false)),
                            icon: () => Icons.Eye,
                            type: ButtonType.Dropdown,
                        },
                        !isApp() && !logins.isEnabled(FeatureType.DisableMailExport)
                            ? {
                                label: "export_action",
                                click: this._actionBarAction(mails =>
                                    showProgressDialog("pleaseWait_msg", exportMails(mails, locator.entityClient, locator.fileController)),
                                ),
                                icon: () => Icons.Export,
                                type: ButtonType.Dropdown,
                            }
                            : null,
                    ]
                },
			),
		]
	}

	/**
	 * Generate buttons that will move the selected mails to respective folders
	 */
	async makeMoveMailButtons(): Promise<ButtonAttrs[]> {
		let selectedMailbox

		for (const mail of this._mailView.mailList.list.getSelectedEntities()) {
			const mailBox = await locator.mailModel.getMailboxDetailsForMail(mail)

			// We can't move if mails are from different mailboxes
			if (selectedMailbox != null && selectedMailbox !== mailBox) {
				return []
			}

			selectedMailbox = mailBox
		}

		if (selectedMailbox == null) return []
		return getSortedSystemFolders(selectedMailbox.folders)
			.concat(getSortedCustomFolders(selectedMailbox.folders))
			.filter(f => f !== this._mailView.selectedFolder)
			.map(f => {
				return {
					label: () => getFolderName(f),
					click: this._actionBarAction(mails => moveMails({mailModel : locator.mailModel, mails : mails, targetMailFolder : f})),
					icon: getFolderIcon(f),
					type: ButtonType.Dropdown,
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
	_actionBarAction(action: (arg0: Mail[]) => unknown): () => void {
		return () => {
			let mails = this._mailView.mailList.list.getSelectedEntities()

			this._mailView.mailList.list.selectNone()

			action(mails)
		}
	}
}