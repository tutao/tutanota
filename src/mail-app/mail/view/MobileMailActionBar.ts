import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { createDropdown, Dropdown, DROPDOWN_MARGIN, DropdownButtonAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { LabelsPopupOpts, ShowMoveMailsDropdownOpts } from "./MailGuiUtils.js"
import { ofClass } from "@tutao/tutanota-utils"
import { modal } from "../../../common/gui/base/Modal.js"
import { multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { px, size } from "../../../common/gui/size.js"
import { MailViewerViewModel } from "./MailViewerViewModel"

export interface MobileMailActionBarAttrs {
	viewModel: MailViewerViewModel
	deleteMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement, opts: LabelsPopupOpts) => void) | null
	setUnreadStateAction: ((unread: boolean) => void) | null
	getUnreadState: (() => boolean) | null
	editDraftAction: (() => void) | null
	exportAction: (() => void) | null
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
				this.editButton(attrs) || this.replyButton(attrs) || this.placeholder(),
				this.forwardButton(attrs),
				this.deleteButton(attrs),
				this.moveButton(attrs) || this.placeholder(),
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

	private moreButton({ viewModel, exportAction, applyLabelsAction, setUnreadStateAction, getUnreadState }: MobileMailActionBarAttrs) {
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
						if (getUnreadState != null) {
							if (getUnreadState()) {
								moreButtons.push(readButton)
							} else {
								moreButtons.push(unreadButton)
							}
						} else {
							moreButtons.push(readButton, unreadButton)
						}
					}
					return [...moreButtons, ...multipleMailViewerMoreActions(viewModel, exportAction)]
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
				icon: Icons.Trash,
			})
		)
	}

	private forwardButton({ viewModel, editDraftAction }: MobileMailActionBarAttrs): Children {
		const disabled = !viewModel.canForwardOrMove() || editDraftAction != null

		return m(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward,
			disabled,
		})
	}

	private replyButton({ viewModel, editDraftAction }: MobileMailActionBarAttrs) {
		// FIXME: don't do the check in here; instead check for the reply action when it's added
		if (viewModel.isAnnouncement() || editDraftAction != null) {
			return null
		}

		return m(IconButton, {
			title: "reply_action",
			click: viewModel.canReplyAll()
				? (e, dom) => {
						const dropdown = new Dropdown(() => {
							const buttons: DropdownButtonAttrs[] = []
							buttons.push({
								label: "replyAll_action",
								icon: Icons.ReplyAll,
								click: () => viewModel.reply(true),
							})

							buttons.push({
								label: "reply_action",
								icon: Icons.Reply,
								click: () => viewModel.reply(false),
							})
							return buttons
						}, this.dropdownWidth() ?? 300)

						const domRect = this.dom?.getBoundingClientRect() ?? dom.getBoundingClientRect()
						dropdown.setOrigin(domRect)
						modal.displayUnique(dropdown, true)
				  }
				: () => viewModel.reply(false),
			icon: viewModel.canReplyAll() ? Icons.ReplyAll : Icons.Reply,
		})
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
}
