import { Mail, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { showMoveMailsDropdownForMails, showMoveMailsDropdownForMailsInFolder, trashOrDeleteMails } from "./MailGuiUtils.js"
import { DROPDOWN_MARGIN } from "../../../common/gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../model/MailModel.js"
import { LabelsPopup } from "./LabelsPopup.js"
import { allInSameMailbox } from "../model/MailUtils"

export interface MobileMailMultiselectionActionBarAttrs {
	selectedMails: readonly Mail[]
	mailModel: MailModel
	mailboxModel: MailboxModel
	selectNone: () => unknown
	folder: MailFolder | null
	actionableMails: () => Promise<readonly IdTuple[]>
}

// Note: The MailViewerToolbar is the counterpart for this on non-mobile views. Please update there too if needed
export class MobileMailMultiselectionActionBar {
	private dom: HTMLElement | null = null

	view({ attrs }: Vnode<MobileMailMultiselectionActionBarAttrs>): Children {
		const { selectedMails, selectNone, mailModel, mailboxModel, folder, actionableMails } = attrs
		return m(
			MobileBottomActionBar,
			{
				oncreate: ({ dom }) => (this.dom = dom as HTMLElement),
			},
			[
				m(IconButton, {
					icon: Icons.Trash,
					title: "delete_action",
					click: async () => trashOrDeleteMails(mailModel, actionableMails, folder, selectNone),
				}),
				mailModel.isMovingMailsAllowed()
					? m(IconButton, {
							icon: Icons.Folder,
							title: "move_action",
							click: async (_, dom) => {
								const referenceDom = this.dom ?? dom
								const opts = {
									onSelected: selectNone,
									width: referenceDom.offsetWidth - DROPDOWN_MARGIN * 2,
								}
								if (folder != null) {
									await showMoveMailsDropdownForMailsInFolder(
										mailboxModel,
										mailModel,
										referenceDom.getBoundingClientRect(),
										actionableMails,
										folder,
										opts,
									)
								} else {
									await showMoveMailsDropdownForMails(mailboxModel, mailModel, referenceDom.getBoundingClientRect(), selectedMails, opts)
								}
							},
					  })
					: null,
				mailModel.canAssignLabels() && allInSameMailbox(selectedMails)
					? m(IconButton, {
							icon: Icons.Label,
							title: "assignLabel_action",
							click: (e, dom) => {
								const referenceDom = this.dom ?? dom
								if (selectedMails.length !== 0) {
									const popup = new LabelsPopup(
										referenceDom,
										referenceDom.getBoundingClientRect(),
										referenceDom.offsetWidth - DROPDOWN_MARGIN * 2,
										mailModel.getLabelsForMails(selectedMails),
										mailModel.getLabelStatesForMails(selectedMails),
										async (addedLabels, removedLabels) => mailModel.applyLabels(await actionableMails(), addedLabels, removedLabels),
									)
									popup.show()
								}
							},
					  })
					: null,
				m(IconButton, {
					icon: Icons.Eye,
					title: "markRead_action",
					click: async () => mailModel.markMails(await actionableMails(), false),
				}),
				m(IconButton, {
					icon: Icons.NoEye,
					title: "markUnread_action",
					click: async () => mailModel.markMails(await actionableMails(), true),
				}),
			],
		)
	}
}
