import m, { Children, Component, Vnode } from "mithril"
import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { isEmpty } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { createDropdown, DropdownButtonAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import type { MailViewerMoreActions } from "./MailViewerUtils.js"
import { multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { ShowMoveMailsDropdownOpts } from "./MailGuiUtils"

/*
	note that mailViewerViewModel has a mailModel, so you do not need to pass both if you pass a mailViewerViewModel
 */
export interface MailViewerToolbarAttrs {
	selectedMails: readonly Mail[]
	selectNone?: () => void
	trashMailsAction: (() => void) | null
	deleteMailAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement) => void) | null
	setUnreadStateAction: ((unread: boolean) => void) | null
	isUnread: boolean | null
	editDraftAction: (() => void) | null
	exportAction: (() => void) | null
	replyAction: (() => void) | null
	replyAllAction: (() => void) | null
	forwardAction: (() => void) | null
	mailViewerMoreActions: MailViewerMoreActions | null
	reportSpamAction: (() => void) | null
}

// Note: this is only used for non-mobile views. Please also update MobileMailMultiselectionActionBar or MobileMailActionBar
export class MailViewerActions implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>) {
		const singleMailActions = this.renderSingleMailActions(vnode.attrs)

		return m(".flex.ml-between-4.items-center", { "data-testid": "nav:action_bar" }, [
			singleMailActions,
			singleMailActions != null ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
		])
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		if (attrs.selectedMails.length > 0) {
			return [
				this.renderDeleteButton(attrs) ?? this.renderTrashButton(attrs),
				this.renderMoveButton(attrs),
				this.renderLabelButton(attrs),
				this.renderReadButton(attrs),
				this.renderReportSpamButton(attrs),
				this.renderExtraButtons(attrs.exportAction, attrs.mailViewerMoreActions),
			]
		}
	}

	/*
	 * Actions that can only be taken on a single mail (reply, forward, edit, assign)
	 */
	private renderSingleMailActions(attrs: MailViewerToolbarAttrs): Children {
		const { editDraftAction, replyAction, replyAllAction, forwardAction } = attrs
		if (editDraftAction == null && replyAction == null && replyAllAction == null && forwardAction == null) {
			return null
		}

		return [this.renderEditButton(editDraftAction), this.renderReplyButton(replyAction, replyAllAction), this.renderForwardButton(forwardAction)]
	}

	private renderTrashButton({ trashMailsAction }: MailViewerToolbarAttrs): Children {
		return (
			trashMailsAction &&
			m(IconButton, {
				title: "trash_action",
				click: trashMailsAction,
				icon: Icons.Trash,
			})
		)
	}

	private renderDeleteButton({ deleteMailAction }: MailViewerToolbarAttrs): Children {
		return (
			deleteMailAction &&
			m(IconButton, {
				title: "delete_action",
				click: deleteMailAction,
				icon: Icons.DeleteForever,
			})
		)
	}

	private renderReportSpamButton({ reportSpamAction }: MailViewerToolbarAttrs): Children {
		return (
			reportSpamAction &&
			m(IconButton, {
				title: "spam_move_action",
				click: reportSpamAction,
				icon: Icons.Spam,
			})
		)
	}

	private renderMoveButton({ moveMailsAction }: MailViewerToolbarAttrs): Children {
		return (
			moveMailsAction &&
			m(IconButton, {
				title: "move_action",
				icon: Icons.Folder,
				click: (e, dom) => moveMailsAction(dom.getBoundingClientRect()),
			})
		)
	}

	private renderLabelButton({ applyLabelsAction }: MailViewerToolbarAttrs): Children {
		return (
			applyLabelsAction &&
			m(IconButton, {
				title: "assignLabel_action",
				icon: Icons.Label,
				click: (_, dom) => {
					applyLabelsAction(dom)
				},
			})
		)
	}

	private renderReadButton({ setUnreadStateAction, isUnread }: MailViewerToolbarAttrs): Children {
		if (setUnreadStateAction == null) {
			return null
		}

		const markReadButton = m(IconButton, {
			title: "markRead_action",
			click: () => setUnreadStateAction(false),
			icon: Icons.Eye,
		})
		const markUnreadButton = m(IconButton, {
			title: "markUnread_action",
			click: () => setUnreadStateAction(true),
			icon: Icons.NoEye,
		})

		// isUnread means we are viewing one mail; otherwise, it is coming from a MultiViewer
		if (isUnread != null) {
			if (isUnread) {
				return markReadButton
			} else {
				return markUnreadButton
			}
		} else {
			return [markReadButton, markUnreadButton]
		}
	}

	private renderReplyButton(replyAction: (() => void) | null, replyAllAction: (() => void) | null) {
		const actions: Children = []

		if (replyAction == null) {
			return actions
		}

		actions.push(
			m(IconButton, {
				title: "reply_action",
				click: replyAction,
				icon: Icons.Reply,
			}),
		)

		if (replyAllAction != null) {
			actions.push(
				m(IconButton, {
					title: "replyAll_action",
					click: replyAllAction,
					icon: Icons.ReplyAll,
				}),
			)
		}
		return actions
	}

	private renderForwardButton(forwardAction: (() => void) | null) {
		return (
			forwardAction &&
			m(IconButton, {
				title: "forward_action",
				click: forwardAction,
				icon: Icons.Forward,
			})
		)
	}

	private renderExtraButtons(exportAction: (() => void) | null, moreActions: MailViewerMoreActions | null): Children {
		let actions: DropdownButtonAttrs[] = multipleMailViewerMoreActions(exportAction, moreActions)

		if (isEmpty(actions)) {
			return null
		} else {
			return m(IconButton, {
				title: "more_label",
				icon: Icons.More,
				click: createDropdown({
					lazyButtons: () => actions,
					width: 300,
				}),
			})
		}
	}

	private renderEditButton(editDraftAction: (() => void) | null) {
		return editDraftAction
			? m(IconButton, {
					title: "edit_action",
					click: editDraftAction,
					icon: Icons.Edit,
				})
			: null
	}
}
