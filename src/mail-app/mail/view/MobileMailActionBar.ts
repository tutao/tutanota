import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { createDropdown, Dropdown, DROPDOWN_MARGIN, DropdownButtonAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { LabelsPopupOpts, ShowMoveMailsDropdownOpts } from "./MailGuiUtils.js"
import { modal } from "../../../common/gui/base/Modal.js"
import type { MailViewerMoreActions } from "./MailViewerUtils.js"
import { multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { px, size } from "../../../common/gui/size.js"
import { noOp } from "@tutao/tutanota-utils"

export interface MobileMailActionBarAttrs {
	deleteMailsAction: (() => void) | null
	trashMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement, opts: LabelsPopupOpts) => void) | null
	setUnreadStateAction: ((unread: boolean) => void) | null
	isUnread: boolean | null
	editDraftAction: (() => void) | null
	exportAction: (() => void) | null
	replyAction: (() => void) | null
	replyAllAction: (() => void) | null
	forwardAction: (() => void) | null
	mailViewerMoreActions: MailViewerMoreActions | null
	unscheduleMailAction: (() => void) | null
}

export class MobileMailActionBar implements Component<MobileMailActionBarAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<MobileMailActionBarAttrs>): Children {
		const { attrs } = vnode

		return m(
			".bottom-nav.bottom-action-bar.flex.items-center.plr-l.justify-between",
			{
				oncreate: (vnode) => {
					this.dom = vnode.dom as HTMLElement
				},
			},
			[
				this.unscheduleButton(attrs) ?? this.editButton(attrs) ?? this.replyButton(attrs) ?? this.placeholder(),
				this.forwardButton(attrs),
				this.deleteButton(attrs) ?? this.trashButton(attrs),
				this.moveButton(attrs) ?? this.placeholder(),
				this.moreButton(attrs),
			],
		)
	}

	private placeholder() {
		return m("", {
			style: {
				width: px(size.button_height),
			},
		})
	}

	private moveButton({ moveMailsAction }: MobileMailActionBarAttrs) {
		return (
			moveMailsAction &&
			m(IconButton, {
				title: "move_action",
				click: (e, dom) =>
					moveMailsAction(dom.getBoundingClientRect(), {
						width: this.dropdownWidth(),
						withBackground: true,
					}),
				icon: Icons.Folder,
			})
		)
	}

	private dropdownWidth() {
		return this.dom?.offsetWidth ? this.dom.offsetWidth - DROPDOWN_MARGIN * 2 : undefined
	}

	private moreButton({ exportAction, applyLabelsAction, setUnreadStateAction, isUnread, mailViewerMoreActions }: MobileMailActionBarAttrs) {
		return m(IconButton, {
			title: "more_label",
			click: createDropdown({
				lazyButtons: () => {
					const moreButtons: DropdownButtonAttrs[] = []
					if (applyLabelsAction) {
						moreButtons.push({
							label: "assignLabel_action",
							click: (_, dom) => {
								const referenceDom = this.dom ?? dom
								applyLabelsAction(referenceDom, {
									width: this.dropdownWidth(),
									origin: referenceDom.getBoundingClientRect(),
								})
							},
							icon: Icons.Label,
						})
					}
					if (setUnreadStateAction != null) {
						const readButton: DropdownButtonAttrs = {
							label: "markRead_action",
							click: () => setUnreadStateAction(false),
							icon: Icons.Eye,
						}
						const unreadButton: DropdownButtonAttrs = {
							label: "markUnread_action",
							click: () => setUnreadStateAction(true),
							icon: Icons.NoEye,
						}

						// isUnread means we are viewing one mail; otherwise, it is coming from a MultiViewer
						if (isUnread != null) {
							if (isUnread) {
								moreButtons.push(readButton)
							} else {
								moreButtons.push(unreadButton)
							}
						} else {
							moreButtons.push(readButton, unreadButton)
						}
					}
					return [...moreButtons, ...multipleMailViewerMoreActions(exportAction, mailViewerMoreActions)]
				},
				width: this.dropdownWidth(),
				withBackground: true,
			}),
			icon: Icons.More,
		})
	}

	private deleteButton({ deleteMailsAction }: MobileMailActionBarAttrs): Children {
		return (
			deleteMailsAction &&
			m(IconButton, {
				title: "delete_action",
				click: deleteMailsAction,
				icon: Icons.DeleteForever,
			})
		)
	}

	private trashButton({ trashMailsAction }: MobileMailActionBarAttrs): Children {
		return (
			trashMailsAction &&
			m(IconButton, {
				title: "trash_action",
				click: trashMailsAction,
				icon: Icons.Trash,
			})
		)
	}

	private forwardButton({ forwardAction }: MobileMailActionBarAttrs): Children {
		const disabled = forwardAction == null
		return m(IconButton, {
			title: "forward_action",
			click: !disabled ? forwardAction : noOp,
			icon: Icons.Forward,
			disabled,
		})
	}

	private replyButton({ replyAction, replyAllAction }: MobileMailActionBarAttrs) {
		return (
			replyAction &&
			m(IconButton, {
				title: "reply_action",
				click:
					replyAllAction != null
						? (e, dom) => {
								const dropdown = new Dropdown(
									() => [
										{
											label: "replyAll_action",
											icon: Icons.ReplyAll,
											click: replyAllAction,
										},
										{
											label: "reply_action",
											icon: Icons.Reply,
											click: replyAction,
										},
									],
									this.dropdownWidth() ?? 300,
								)

								const domRect = this.dom?.getBoundingClientRect() ?? dom.getBoundingClientRect()
								dropdown.setOrigin(domRect)
								modal.displayUnique(dropdown, true)
							}
						: replyAction,
				icon: replyAllAction != null ? Icons.ReplyAll : Icons.Reply,
			})
		)
	}

	private editButton({ editDraftAction }: MobileMailActionBarAttrs) {
		return (
			editDraftAction &&
			m(IconButton, {
				title: "edit_action",
				icon: Icons.Edit,
				click: editDraftAction,
			})
		)
	}

	private unscheduleButton({ unscheduleMailAction }: MobileMailActionBarAttrs) {
		return (
			unscheduleMailAction &&
			m(IconButton, {
				title: "cancelSend_action",
				icon: Icons.XCross,
				click: unscheduleMailAction,
			})
		)
	}
}
