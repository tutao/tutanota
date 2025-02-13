import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { DROPDOWN_MARGIN, PosRect } from "../../../common/gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import { MailModel } from "../model/MailModel.js"
import { LabelsPopup } from "./LabelsPopup.js"
import { allInSameMailbox } from "../model/MailUtils"
import { ShowMoveMailsDropdownOpts } from "./MailGuiUtils"

export interface MobileMailMultiselectionActionBarAttrs {
	selectedMails: readonly Mail[]
	mailModel: MailModel
	selectNone: () => unknown
	deleteMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	actionableMails: () => Promise<readonly IdTuple[]>
}

// Note: The MailViewerToolbar is the counterpart for this on non-mobile views. Please update there too if needed
export class MobileMailMultiselectionActionBar {
	private dom: HTMLElement | null = null

	view({ attrs }: Vnode<MobileMailMultiselectionActionBarAttrs>): Children {
		const { selectedMails, selectNone, mailModel, actionableMails, moveMailsAction, deleteMailsAction } = attrs
		return m(
			MobileBottomActionBar,
			{
				oncreate: ({ dom }) => (this.dom = dom as HTMLElement),
			},
			[
				deleteMailsAction &&
					m(IconButton, {
						icon: Icons.Trash,
						title: "delete_action",
						click: deleteMailsAction,
					}),
				moveMailsAction &&
					m(IconButton, {
						icon: Icons.Folder,
						title: "move_action",
						click: (e, dom) => {
							const referenceDom = this.dom ?? dom
							moveMailsAction(referenceDom.getBoundingClientRect(), {
								onSelected: () => selectNone,
								width: referenceDom.offsetWidth - DROPDOWN_MARGIN * 2,
							})
						},
					}),
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
