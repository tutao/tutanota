import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { DROPDOWN_MARGIN, PosRect } from "../../../common/gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import { ShowMoveMailsDropdownOpts } from "./MailGuiUtils"

export interface MobileMailMultiselectionActionBarAttrs {
	selectNone: () => unknown
	deleteMailsAction: (() => void) | null
	trashMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement) => void) | null
	setUnreadStateAction: ((unread: boolean) => void) | null
}

// Note: The MailViewerToolbar is the counterpart for this on non-mobile views. Please update there too if needed
export class MobileMailMultiselectionActionBar {
	private dom: HTMLElement | null = null

	view({ attrs }: Vnode<MobileMailMultiselectionActionBarAttrs>): Children {
		return m(
			MobileBottomActionBar,
			{
				oncreate: ({ dom }) => (this.dom = dom as HTMLElement),
			},
			[
				this.renderDeleteButton(attrs) ?? this.renderTrashAction(attrs),
				this.renderMoveButton(attrs),
				this.renderLabelsButton(attrs),
				this.renderUnreadButton(attrs),
			],
		)
	}

	private renderUnreadButton({ setUnreadStateAction }: MobileMailMultiselectionActionBarAttrs) {
		return (
			setUnreadStateAction && [
				m(IconButton, {
					icon: Icons.Eye,
					title: "markRead_action",
					click: () => setUnreadStateAction(false),
				}),
				m(IconButton, {
					icon: Icons.NoEye,
					title: "markUnread_action",
					click: () => setUnreadStateAction(true),
				}),
			]
		)
	}

	private renderLabelsButton({ applyLabelsAction }: MobileMailMultiselectionActionBarAttrs) {
		return (
			applyLabelsAction &&
			m(IconButton, {
				icon: Icons.Label,
				title: "assignLabel_action",
				click: (e, dom) => {
					applyLabelsAction(dom)
				},
			})
		)
	}

	private renderMoveButton({ moveMailsAction, selectNone }: MobileMailMultiselectionActionBarAttrs) {
		return (
			moveMailsAction &&
			m(IconButton, {
				icon: Icons.Folder,
				title: "move_action",
				click: (e, dom) => {
					const referenceDom = this.dom ?? dom
					moveMailsAction(referenceDom.getBoundingClientRect(), {
						onSelected: selectNone,
						width: referenceDom.offsetWidth - DROPDOWN_MARGIN * 2,
					})
				},
			})
		)
	}

	private renderTrashAction({ trashMailsAction }: MobileMailMultiselectionActionBarAttrs) {
		return (
			trashMailsAction &&
			m(IconButton, {
				icon: Icons.Trash,
				title: "trash_action",
				click: trashMailsAction,
			})
		)
	}

	private renderDeleteButton({ deleteMailsAction }: MobileMailMultiselectionActionBarAttrs) {
		return (
			deleteMailsAction &&
			m(IconButton, {
				icon: Icons.DeleteForever,
				title: "delete_action",
				click: deleteMailsAction,
			})
		)
	}
}
