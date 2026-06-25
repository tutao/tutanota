import m, { Children, Component, Vnode } from "mithril"
import { IconButton } from "../../../../ui/base/IconButton.js"
import { isEmpty } from "../../../../platform-kit/utils"
import { Icons } from "../../../../ui/base/icons/Icons.js"
import { createDropdown, DropdownButtonAttrs } from "../../../../ui/base/Dropdown.js"
import type { MailViewerMoreActions } from "./MailViewerUtils.js"
import { multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { ShowMoveMailsDropdownOpts } from "./MailGuiUtils"

import { PosRect } from "../../../../ui/utils/PosRect"
import { Mail } from "@tutao/entities/tutanota"

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
	unscheduleMailAction: (() => void) | null
	reportNotSpamAction: (() => void) | null
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
				this.renderReportNotSpamButton(attrs),
				this.renderExtraButtons(attrs.exportAction, attrs.mailViewerMoreActions),
			]
		}
	}

	/*
	 * Actions that can only be taken on a single mail (reply, forward, edit, assign)
	 */
	private renderSingleMailActions(attrs: MailViewerToolbarAttrs): Children {
		const { editDraftAction, replyAction, replyAllAction, forwardAction, reportNotSpamAction } = attrs
		if (editDraftAction == null && replyAction == null && replyAllAction == null && forwardAction == null) {
			return null
		}

		const isShowReportNotSpamAction = reportNotSpamAction != null
		if (!isShowReportNotSpamAction) {
			return [this.renderEditButton(editDraftAction), this.renderReplyButton(replyAction, replyAllAction), this.renderForwardButton(forwardAction)]
		} else {
			return []
		}
	}

	private renderTrashButton({ trashMailsAction }: MailViewerToolbarAttrs): Children {
		return (
			trashMailsAction &&
			m(IconButton, {
				label: "trash_action",
				click: trashMailsAction,
				icon: Icons.TrashFilled,
			})
		)
	}

	private renderDeleteButton({ deleteMailAction }: MailViewerToolbarAttrs): Children {
		return (
			deleteMailAction &&
			m(IconButton, {
				label: "delete_action",
				click: deleteMailAction,
				icon: Icons.TrashCrossFilled,
			})
		)
	}

	private renderReportSpamButton({ reportSpamAction }: MailViewerToolbarAttrs): Children {
		return (
			reportSpamAction &&
			m(IconButton, {
				label: "reportSpam_action",
				click: reportSpamAction,
				icon: Icons.BugFilled,
			})
		)
	}

	private renderReportNotSpamButton({ reportNotSpamAction }: MailViewerToolbarAttrs): Children {
		return (
			reportNotSpamAction &&
			m(IconButton, {
				label: "reportNotSpam_action",
				click: reportNotSpamAction,
				icon: Icons.BugCrossedFilled,
			})
		)
	}

	private renderMoveButton({ moveMailsAction }: MailViewerToolbarAttrs): Children {
		return (
			moveMailsAction &&
			m(IconButton, {
				label: "move_action",
				icon: Icons.FolderFilled,
				click: (e, dom) => moveMailsAction(dom.getBoundingClientRect()),
			})
		)
	}

	private renderLabelButton({ applyLabelsAction }: MailViewerToolbarAttrs): Children {
		return (
			applyLabelsAction &&
			m(IconButton, {
				label: "assignLabel_action",
				icon: Icons.LabelFilled,
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
			label: "markRead_action",
			click: () => setUnreadStateAction(false),
			icon: Icons.EyeFilled,
		})
		const markUnreadButton = m(IconButton, {
			label: "markUnread_action",
			click: () => setUnreadStateAction(true),
			icon: Icons.EyeCrossedFilled,
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
				label: "reply_action",
				click: replyAction,
				icon: Icons.ArrowBackFilled,
			}),
		)

		if (replyAllAction != null) {
			actions.push(
				m(IconButton, {
					label: "replyAll_action",
					click: replyAllAction,
					icon: Icons.DoubleArrowBackFilled,
				}),
			)
		}
		return actions
	}

	private renderForwardButton(forwardAction: (() => void) | null) {
		return (
			forwardAction &&
			m(IconButton, {
				label: "forward_action",
				click: forwardAction,
				icon: Icons.ArrowForwardFilled,
			})
		)
	}

	private renderExtraButtons(exportAction: (() => void) | null, moreActions: MailViewerMoreActions | null): Children {
		let actions: DropdownButtonAttrs[] = multipleMailViewerMoreActions(exportAction, moreActions)

		if (isEmpty(actions)) {
			return null
		} else {
			return m(IconButton, {
				label: "more_label",
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
					label: "edit_action",
					click: editDraftAction,
					icon: Icons.PenFilled,
				})
			: null
	}
}
