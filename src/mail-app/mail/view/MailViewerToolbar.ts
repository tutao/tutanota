import m, { Children, Component, Vnode } from "mithril"
import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { assertNotNull, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { createDropdown, DropdownButtonAttrs, PosRect } from "../../../common/gui/base/Dropdown.js"
import { editDraft, exportAction, multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { isApp } from "../../../common/api/common/Env.js"
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
	actionableMails: () => Promise<readonly IdTuple[]>
	deleteMailsAction: (() => void) | null
	moveMailsAction: ((origin: PosRect, opts?: ShowMoveMailsDropdownOpts) => void) | null
	applyLabelsAction: ((dom: HTMLElement) => void) | null
	setUnreadStateAction: (unread: boolean) => void
	getUnreadState: (() => boolean) | null
}

// Note: this is only used for non-mobile views. Please also update MobileMailMultiselectionActionBar or MobileMailActionBar
export class MailViewerActions implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>) {
		return m(".flex.ml-between-s.items-center", [
			this.renderSingleMailActions(vnode.attrs),
			vnode.attrs.primaryMailViewerViewModel ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
			this.renderMoreButton(vnode.attrs),
		])
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		const mailModel = attrs.primaryMailViewerViewModel ? attrs.primaryMailViewerViewModel.mailModel : attrs.mailModel

		if (!mailModel || !attrs.selectedMails) {
			return null
		} else if (attrs.primaryMailViewerViewModel) {
			return [
				this.renderDeleteButton(attrs),
				this.renderMoveButton(attrs),
				this.renderLabelButton(attrs),
				attrs.primaryMailViewerViewModel.isDraftMail() ? null : this.renderReadButton(attrs),
			]
		} else if (attrs.selectedMails.length > 0) {
			return [
				this.renderDeleteButton(attrs),
				this.renderMoveButton(attrs),
				this.renderLabelButton(attrs),
				this.renderReadButton(attrs),
				this.renderExportButton(attrs),
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
				return []
			} else if (attrs.primaryMailViewerViewModel.isDraftMail()) {
				return [this.renderEditButton(attrs.primaryMailViewerViewModel)]
			} else if (attrs.actionableMailViewerViewModel.canForwardOrMove()) {
				return [this.renderReplyButton(attrs.actionableMailViewerViewModel), this.renderForwardButton(attrs.actionableMailViewerViewModel)]
			} else {
				return [this.renderReplyButton(attrs.actionableMailViewerViewModel)]
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

	private renderExportButton(attrs: MailViewerToolbarAttrs) {
		if (!isApp() && attrs.mailModel.isExportingMailsAllowed()) {
			const exportAttrs = exportAction(attrs.actionableMails)
			return m(IconButton, {
				title: exportAttrs.label,
				icon: Icons.Export,
				// we know where we got this from, and we know it has the click attribute
				click: assertNotNull(exportAttrs.click),
			})
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
		return m(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward,
		})
	}

	private renderMoreButton({
		primaryMailViewerViewModel: viewModel,
		actionableMails,
		setUnreadStateAction,
		getUnreadState,
	}: MailViewerToolbarAttrs): Children {
		let actions: DropdownButtonAttrs[] = []

		if (viewModel) {
			actions = multipleMailViewerMoreActions(viewModel, actionableMails, setUnreadStateAction, assertNotNull(getUnreadState))
		}

		return actions.length > 0
			? m(IconButton, {
					title: "more_label",
					icon: Icons.More,
					click: createDropdown({
						lazyButtons: () => actions,
						width: 300,
					}),
			  })
			: null
	}

	private renderEditButton(viewModel: MailViewerViewModel) {
		return m(IconButton, {
			title: "edit_action",
			click: () => editDraft(viewModel),
			icon: Icons.Edit,
		})
	}
}
