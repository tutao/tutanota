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
	actionableMails: () => Promise<readonly IdTuple[]>
	deleteMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement) => void) | null
}

// Note: The MailViewerToolbar is the counterpart for this on non-mobile views. Please update there too if needed
export class MobileMailMultiselectionActionBar {
	private dom: HTMLElement | null = null

	view({ attrs }: Vnode<MobileMailMultiselectionActionBarAttrs>): Children {
		const { selectedMails, selectNone, mailModel, actionableMails, moveMailsAction, deleteMailsAction, applyLabelsAction } = attrs
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
				applyLabelsAction
					? m(IconButton, {
							icon: Icons.Label,
							title: "assignLabel_action",
							click: (e, dom) => {
								applyLabelsAction(dom)
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
