import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { Dropdown, DROPDOWN_MARGIN, PosRect } from "../../../common/gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import { LabelsPopupOpts, ShowMoveMailsDropdownOpts } from "./MailGuiUtils"
import { modal } from "../../../common/gui/base/Modal"

export interface MobileMailMultiselectionActionBarAttrs {
	selectNone: () => unknown
	deleteMailsAction: (() => void) | null
	trashMailsAction: (() => void) | null
	markMailsAsSpamAction: (() => void) | null
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
				this.renderDeleteButton(attrs) ?? this.renderTrashAction(attrs),
				this.renderMoveButton(attrs),
				this.renderLabelsButton(attrs),
				this.renderUnreadButton(attrs),
			],
		)
	}

	private dropdownWidth(dom: HTMLElement): number {
		return dom.offsetWidth - DROPDOWN_MARGIN * 2
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

	private renderTrashAction({ trashMailsAction, markMailsAsSpamAction }: MobileMailMultiselectionActionBarAttrs) {
		return (
			trashMailsAction &&
			m(IconButton, {
				icon: Icons.Trash,
				title: "trash_action",
				click:
					markMailsAsSpamAction != null
						? (_, dom) => {
								const dropdown = new Dropdown(
									() => [
										{
											label: "trash_action",
											icon: Icons.Trash,
											click: trashMailsAction,
										},
										{
											label: "spam_action",
											icon: Icons.Spam,
											click: markMailsAsSpamAction,
										},
									],
									this.dropdownWidth(dom) ?? 300,
								)

								const domRect = this.dom?.getBoundingClientRect() ?? dom.getBoundingClientRect()
								dropdown.setOrigin(domRect)
								modal.displayUnique(dropdown, true)
							}
						: trashMailsAction,
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
