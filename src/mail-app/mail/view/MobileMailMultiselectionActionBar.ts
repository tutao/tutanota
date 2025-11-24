import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { DROPDOWN_MARGIN, PosRect } from "../../../common/gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import { LabelsPopupOpts, ShowMoveMailsDropdownOpts } from "./MailGuiUtils"
import { px, size } from "../../../common/gui/size"

export interface MobileMailMultiselectionActionBarAttrs {
	selectNone: () => unknown
	deleteMailsAction: (() => void) | null
	trashMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement, opts?: LabelsPopupOpts) => void) | null
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
				this.renderDeleteButton(attrs) ?? this.renderTrashAction(attrs) ?? this.placeholder(),
				this.renderMoveButton(attrs) ?? this.placeholder(),
				this.renderLabelsButton(attrs) ?? this.placeholder(),
				this.renderUnreadButton(attrs),
			],
		)
	}

	private dropdownWidth(dom: HTMLElement): number {
		return dom.offsetWidth - DROPDOWN_MARGIN * 2
	}

	private placeholder() {
		return m("", {
			style: {
				width: px(size.button_height),
			},
		})
	}

	private renderUnreadButton({ setUnreadStateAction }: MobileMailMultiselectionActionBarAttrs) {
		return setUnreadStateAction
			? [
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
			: [this.placeholder(), this.placeholder()]
	}

	private renderLabelsButton({ applyLabelsAction }: MobileMailMultiselectionActionBarAttrs) {
		return (
			applyLabelsAction &&
			m(IconButton, {
				icon: Icons.Label,
				title: "assignLabel_action",
				click: (e, dom) => {
					const referenceDom = this.dom ?? dom
					applyLabelsAction(referenceDom, { width: this.dropdownWidth(referenceDom) })
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
						width: this.dropdownWidth(referenceDom),
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
