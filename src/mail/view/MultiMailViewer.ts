import m, {Component} from "mithril"
import {MailView} from "./MailView"
import {assertMainOrNode, isApp} from "../../api/common/Env"
import {ActionBar} from "../../gui/base/ActionBar"
import ColumnEmptyMessageBox from "../../gui/base/ColumnEmptyMessageBox"
import {lang} from "../../misc/LanguageViewModel"
import {Icons} from "../../gui/base/icons/Icons"
import {allMailsAllowedInsideFolder, emptyOrContainsDraftsAndNonDrafts, getFolderIcon, getIndentedFolderNameForDropdown, markMails} from "../model/MailUtils"
import {logins} from "../../api/main/LoginController"
import {FeatureType} from "../../api/common/TutanotaConstants"
import {BootIcons} from "../../gui/base/icons/BootIcons"
import {theme} from "../../gui/theme"
import type {Mail} from "../../api/entities/tutanota/TypeRefs.js"
import {locator} from "../../api/main/MainLocator"
import {moveMails, promptAndDeleteMails} from "./MailGuiUtils"
import {attachDropdown, DropdownButtonAttrs} from "../../gui/base/Dropdown.js"
import {exportMails} from "../export/Exporter"
import {showProgressDialog} from "../../gui/dialogs/ProgressDialog"
import {MailboxDetail} from "../model/MailModel.js"
import {IconButtonAttrs} from "../../gui/base/IconButton.js"
import {haveSameId} from "../../api/common/utils/EntityUtils.js"

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
				m(".fill-absolute.mt-xs",
					mailView.mailList && mailView.mailList.list.getSelectedEntities().length > 0
						? [
							m(".flex-space-between.pl-l", {
								style: {
									marginRight: "6px",
								}
							}, [
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

	getActionBarButtons(prependCancel: boolean = false): IconButtonAttrs[] {
		const selectedMails = this._mailView.mailList?.list.getSelectedEntities() ?? []

		const cancel: IconButtonAttrs[] = prependCancel ?
			[
				{
					title: "cancel_action",
					click: () => this._mailView.mailList?.list.selectNone(),
					icon: Icons.Cancel,
				}
			]
			: []

		// if we have both drafts and non-drafts selected, then there is no good place to move them besides deleting them since drafts otherwise only go to the drafts folder and non-drafts do not
		const move: IconButtonAttrs[] = !emptyOrContainsDraftsAndNonDrafts(selectedMails) ? [
			attachDropdown(
				{
					mainButtonAttrs: {
						title: "move_action",
						icon: Icons.Folder,
					},
					childAttrs: () => this.makeMoveMailButtons(selectedMails)
				},
			)
		] : []

		return [
			...cancel,
			{
				title: "delete_action",
				click: () => {
					promptAndDeleteMails(locator.mailModel, selectedMails, () => this._mailView.mailList?.list.selectNone())
				},
				icon: Icons.Trash,
			},
			...move,
			attachDropdown(
				{
					mainButtonAttrs: {
						title: "more_label",
						icon: Icons.More,
					}, childAttrs: () => [
						{
							label: "markUnread_action",
							click: this._actionBarAction(mails => markMails(locator.entityClient, mails, true)),
							icon: Icons.NoEye,
						},
						{
							label: "markRead_action",
							click: this._actionBarAction(mails => markMails(locator.entityClient, mails, false)),
							icon: Icons.Eye,
						},
						!isApp() && !logins.isEnabled(FeatureType.DisableMailExport)
							? {
								label: "export_action",
								click: this._actionBarAction(mails =>
									showProgressDialog("pleaseWait_msg", exportMails(mails, locator.entityClient, locator.fileController)),
								),
								icon: Icons.Export,
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
	private async makeMoveMailButtons(selectedEntities: Mail[]): Promise<DropdownButtonAttrs[]> {
		let selectedMailbox: MailboxDetail | null = null

		for (const mail of selectedEntities) {
			const mailBox = await locator.mailModel.getMailboxDetailsForMail(mail)

			// We can't move if mails are from different mailboxes
			if (selectedMailbox != null && selectedMailbox !== mailBox) {
				return []
			}

			selectedMailbox = mailBox
		}

		if (selectedMailbox == null) return []
		return selectedMailbox.folders.getIndentedList()
							  .filter(folderInfo => allMailsAllowedInsideFolder(selectedEntities, folderInfo.folder)
								  && (this._mailView.selectedFolder == null || !haveSameId(folderInfo.folder, this._mailView.selectedFolder)))
							  .map(folderInfo => {
								  return {
									  label: () => getIndentedFolderNameForDropdown(folderInfo),
									  click: this._actionBarAction(mails => moveMails({
										  mailModel: locator.mailModel,
										  mails: mails,
										  targetMailFolder: folderInfo.folder
									  })),
									  icon: getFolderIcon(folderInfo.folder)(),
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
			const mails = this._mailView.mailList?.list.getSelectedEntities() ?? []

			this._mailView.mailList?.list.selectNone()

			action(mails)
		}
	}
}