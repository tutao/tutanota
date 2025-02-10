import m, { Children, Component, Vnode } from "mithril"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { assertNotNull, noOp, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { createDropdown, DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { editDraft, exportAction, multipleMailViewerMoreActions } from "./MailViewerUtils.js"
import { isApp } from "../../../common/api/common/Env.js"
import { MailModel } from "../model/MailModel.js"
import { LabelsPopup } from "./LabelsPopup.js"
import { allInSameMailbox } from "../model/MailUtils"
import { styles } from "../../../common/gui/styles"

/*
	note that mailViewerViewModel has a mailModel, so you do not need to pass both if you pass a mailViewerViewModel
 */
export interface MailViewerToolbarAttrs {
	mailboxModel: MailboxModel
	mailModel: MailModel
	selectedMails: Mail[]
	primaryMailViewerViewModel?: MailViewerViewModel
	actionableMailViewerViewModel?: MailViewerViewModel
	selectNone?: () => void
	actionableMails: () => Promise<readonly IdTuple[]>
}

// Note: this is only used for non-mobile views. Please also update MobileMailMultiselectionActionBar or MobileMailActionBar
export class MailViewerActions implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>) {
		return m(".flex.ml-between-s.items-center", [
			this.renderSingleMailActions(vnode.attrs),
			vnode.attrs.primaryMailViewerViewModel ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
			this.renderMoreButton(vnode.attrs.primaryMailViewerViewModel, vnode.attrs.actionableMails),
		])
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		const mailModel = attrs.primaryMailViewerViewModel ? attrs.primaryMailViewerViewModel.mailModel : attrs.mailModel

		if (!mailModel || !attrs.selectedMails) {
			return null
		} else if (attrs.primaryMailViewerViewModel) {
			return [
				this.renderDeleteButton(mailModel, attrs.selectedMails, attrs.selectNone ?? noOp),
				attrs.primaryMailViewerViewModel.canForwardOrMove() ? this.renderMoveButton(attrs.mailboxModel, mailModel, attrs.selectedMails) : null,
				attrs.mailModel.canAssignLabels() ? this.renderLabelButton(mailModel, attrs.selectedMails, attrs.actionableMails) : null,
				attrs.primaryMailViewerViewModel.isDraftMail() ? null : this.renderReadButton(attrs),
			]
		} else if (attrs.selectedMails.length > 0) {
			return [
				this.renderDeleteButton(mailModel, attrs.selectedMails, attrs.selectNone ?? noOp),
				attrs.mailModel.isMovingMailsAllowed() ? this.renderMoveButton(attrs.mailboxModel, mailModel, attrs.selectedMails) : null,
				attrs.mailModel.canAssignLabels() && allInSameMailbox(attrs.selectedMails)
					? this.renderLabelButton(mailModel, attrs.selectedMails, attrs.actionableMails)
					: null,
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

	private renderDeleteButton(mailModel: MailModel, mails: Mail[], selectNone: () => void): Children {
		return m(IconButton, {
			title: "delete_action",
			click: () => {
				promptAndDeleteMails(mailModel, mails, selectNone)
			},
			icon: Icons.Trash,
		})
	}

	private renderMoveButton(mailboxModel: MailboxModel, mailModel: MailModel, mails: Mail[]): Children {
		return m(IconButton, {
			title: "move_action",
			icon: Icons.Folder,
			click: (e, dom) => showMoveMailsDropdown(mailboxModel, mailModel, dom.getBoundingClientRect(), mails),
		})
	}

	private renderLabelButton(mailModel: MailModel, mails: readonly Mail[], actionableMails: () => Promise<readonly IdTuple[]>): Children {
		return m(IconButton, {
			title: "assignLabel_action",
			icon: Icons.Label,
			click: (_, dom) => {
				const popup = new LabelsPopup(
					dom,
					dom.getBoundingClientRect(),
					styles.isDesktopLayout() ? 300 : 200,
					mailModel.getLabelsForMails(mails),
					mailModel.getLabelStatesForMails(mails),
					async (addedLabels, removedLabels) => mailModel.applyLabels(await actionableMails(), addedLabels, removedLabels),
				)
				popup.show()
			},
		})
	}

	private renderReadButton({ mailModel, primaryMailViewerViewModel, actionableMails }: MailViewerToolbarAttrs): Children {
		const markReadButton = m(IconButton, {
			title: "markRead_action",
			click: async () => mailModel.markMails(await actionableMails(), false),
			icon: Icons.Eye,
		})
		const markUnreadButton = m(IconButton, {
			title: "markUnread_action",
			click: async () => mailModel.markMails(await actionableMails(), true),
			icon: Icons.NoEye,
		})

		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (primaryMailViewerViewModel) {
			if (primaryMailViewerViewModel.isUnread()) {
				return markReadButton
			} else {
				return markUnreadButton
			}
		}

		return [markReadButton, markUnreadButton]
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

	private renderMoreButton(viewModel: MailViewerViewModel | undefined, actionableMails: () => Promise<readonly IdTuple[]>): Children {
		let actions: DropdownButtonAttrs[] = []

		if (viewModel) {
			actions = multipleMailViewerMoreActions(viewModel, actionableMails)
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
