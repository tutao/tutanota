import m, { Children, Component, Vnode } from "mithril"
import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { assertNotNull, getFirstOrThrow, isEmpty, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { createDropdown, DropdownButtonAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import { multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { MailModel } from "../model/MailModel.js"
import { ShowMoveMailsDropdownOpts } from "./MailGuiUtils"

/*
	note that mailViewerViewModel has a mailModel, so you do not need to pass both if you pass a mailViewerViewModel
 */
export interface MailViewerToolbarAttrs {
	mailModel: MailModel
	selectedMails: Mail[]
	primaryMailViewerViewModel?: MailViewerViewModel
	actionableMailViewerViewModel?: MailViewerViewModel
	selectNone?: () => void
	deleteMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement) => void) | null
	setUnreadStateAction: ((unread: boolean) => void) | null
	getUnreadState: (() => boolean) | null
	editDraftAction: (() => void) | null
	exportAction: (() => void) | null
}

// Note: this is only used for non-mobile views. Please also update MobileMailMultiselectionActionBar or MobileMailActionBar
export class MailViewerActions implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>) {
		return m(".flex.ml-between-s.items-center", { "data-testid": "nav:action_bar" }, [
			this.renderSingleMailActions(vnode.attrs),
			vnode.attrs.primaryMailViewerViewModel ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
		])
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		const mailModel = attrs.primaryMailViewerViewModel ? attrs.primaryMailViewerViewModel.mailModel : attrs.mailModel

		if (mailModel && attrs.selectedMails.length > 0) {
			return [
				this.renderDeleteButton(attrs),
				this.renderMoveButton(attrs),
				this.renderLabelButton(attrs),
				this.renderReadButton(attrs),
				this.renderExtraButtons(attrs.primaryMailViewerViewModel, attrs.exportAction),
			]
		}
	}

	/*
	 * Actions that can only be taken on a single mail (reply, forward, edit, assign)
	 * Will only return actions if there is a mailViewerViewModel
	 * */
	private renderSingleMailActions(attrs: MailViewerToolbarAttrs): Children {
		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (attrs.primaryMailViewerViewModel && attrs.actionableMailViewerViewModel) {
			if (attrs.primaryMailViewerViewModel.isAnnouncement()) {
				/* FIXME: move this check to the outside */
				return []
			} else {
				return [
					this.renderEditButton(attrs),
					this.renderReplyButton(attrs.actionableMailViewerViewModel),
					this.renderForwardButton(attrs.actionableMailViewerViewModel),
				]
			}
		} else {
			return []
		}
	}

	private renderDeleteButton({ deleteMailsAction }: MailViewerToolbarAttrs): Children {
		return (
			deleteMailsAction &&
			m(IconButton, {
				title: "delete_action",
				click: deleteMailsAction,
				icon: Icons.Trash,
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

	private renderReadButton({ setUnreadStateAction, getUnreadState }: MailViewerToolbarAttrs): Children {
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

		// getUnreadState means we are viewing one mail; otherwise, it is coming from a MultiViewer
		if (getUnreadState != null) {
			if (getUnreadState()) {
				return markReadButton
			} else {
				return markUnreadButton
			}
		} else {
			return [markReadButton, markUnreadButton]
		}
	}

	private renderReplyButton(viewModel: MailViewerViewModel) {
		const actions: Children = []
		actions.push(
			m(IconButton, {
				title: "reply_action",
				click: () => viewModel.reply(false),
				icon: Icons.Reply,
			}),
		)

		if (viewModel.canReplyAll()) {
			actions.push(
				m(IconButton, {
					title: "replyAll_action",
					click: () => viewModel.reply(true),
					icon: Icons.ReplyAll,
				}),
			)
		}
		return actions
	}

	private renderForwardButton(viewModel: MailViewerViewModel) {
		return viewModel.canForwardOrMove()
			? m(IconButton, {
					title: "forward_action",
					click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
					icon: Icons.Forward,
			  })
			: null
	}

	private renderExtraButtons(viewModel: MailViewerViewModel | undefined, exportAction: (() => void) | null): Children {
		let actions: DropdownButtonAttrs[] = multipleMailViewerMoreActions(viewModel, exportAction)

		if (isEmpty(actions)) {
			return null
		} else if (actions.length === 1) {
			const { label, icon, click } = getFirstOrThrow(actions)
			return m(IconButton, {
				title: label,
				icon: assertNotNull(icon),
				click: assertNotNull(click),
			})
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

	private renderEditButton({ editDraftAction }: MailViewerToolbarAttrs) {
		return editDraftAction
			? m(IconButton, {
					title: "edit_action",
					click: editDraftAction,
					icon: Icons.Edit,
			  })
			: null
	}
}
