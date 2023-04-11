import { styles } from "../../gui/styles.js"
import m, { Children, Component, Vnode } from "mithril"
import { MailModel } from "../model/MailModel.js"
import { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { UserError } from "../../api/main/UserError.js"
import { showUserError } from "../../misc/ErrorHandlerImpl.js"
import { createAsyncDropdown, createDropdown, DropdownButtonAttrs } from "../../gui/base/Dropdown.js"
import { editDraft, mailViewerMoreActions, makeAssignMailsButtons } from "./MailViewerUtils.js"
import { ButtonColor } from "../../gui/base/Button.js"
import { px, size } from "../../gui/size.js"
import { isApp } from "../../api/common/Env.js"
import { locator } from "../../api/main/MainLocator.js"
import { FeatureType } from "../../api/common/TutanotaConstants.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { exportMails } from "../export/Exporter.js"

/*
	note that mailViewerViewModel has a mailModel, so you do not need to pass both if you pass a mailViewerViewModel
 */
export interface MailViewerToolbarAttrs {
	mailModel: MailModel
	mailViewerViewModel?: MailViewerViewModel
	mails: Mail[]
	selectNone?: () => void
	readAction: () => unknown
	unreadAction: () => unknown
}

export class MailViewerToolbar implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>): Children {
		if (styles.isSingleColumnLayout()) {
			return null
		}

		return m(
			".flex.pt-xs.pb-xs.list-bg.plr-m.list-border-bottom.items-center.ml-between-s",
			// Height keeps the toolbar showing for consistency, even if there are no actions
			m(".flex-grow", { style: { height: px(size.button_height) } }),
			this.renderSingleMailActions(vnode.attrs),
			vnode.attrs.mailViewerViewModel ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
			this.renderMoreButton(vnode.attrs.mailViewerViewModel),
		)
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		const mailModel = attrs.mailViewerViewModel ? attrs.mailViewerViewModel.mailModel : attrs.mailModel

		if (!mailModel || !attrs.mails) {
			return null
		} else if (attrs.mailViewerViewModel) {
			return [
				this.renderDeleteButton(mailModel, attrs.mails, attrs.selectNone ? attrs.selectNone : noOp),
				attrs.mailViewerViewModel.canForwardOrMove() ? this.renderMoveButton(mailModel, attrs.mails) : null,
				attrs.mailViewerViewModel.isDraftMail() ? null : this.renderReadButton(attrs),
			]
		} else if (attrs.mails.length > 0) {
			return [
				this.renderDeleteButton(mailModel, attrs.mails, attrs.selectNone ? attrs.selectNone : noOp),
				locator.logins.getUserController().isInternalUser() ? this.renderMoveButton(mailModel, attrs.mails) : null,
				this.renderReadButton(attrs),
				this.renderExportButton(attrs.mails),
			]
		}
	}

	/*
	 * Actions that can only be taken on a single mail (reply, forward, edit, assign)
	 * Will only return actions if there is a mailViewerViewModel
	 * */
	private renderSingleMailActions(attrs: MailViewerToolbarAttrs): Children {
		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (attrs.mailViewerViewModel) {
			if (attrs.mailViewerViewModel.isAnnouncement()) {
				return []
			} else if (attrs.mailViewerViewModel.isDraftMail()) {
				this.renderEditButton(attrs.mailViewerViewModel)
			} else if (attrs.mailViewerViewModel.canForwardOrMove()) {
				return [this.renderReplyButton(attrs.mailViewerViewModel), this.renderForwardButton(attrs.mailViewerViewModel)]
			} else if (attrs.mailViewerViewModel.canAssignMails()) {
				return [this.renderReplyButton(attrs.mailViewerViewModel), this.renderAssignButton(attrs.mailViewerViewModel)]
			} else {
				return [this.renderReplyButton(attrs.mailViewerViewModel)]
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

	private renderMoveButton(mailModel: MailModel, mails: Mail[]): Children {
		return m(IconButton, {
			title: "move_action",
			icon: Icons.Folder,
			click: (e, dom) => showMoveMailsDropdown(mailModel, dom.getBoundingClientRect(), mails),
		})
	}

	private renderReadButton({ readAction, unreadAction, mailViewerViewModel }: MailViewerToolbarAttrs): Children {
		const readButtons = [
			m(IconButton, {
				title: "markRead_action",
				click: readAction,
				icon: Icons.Eye,
			}),
			m(IconButton, {
				title: "markUnread_action",
				click: unreadAction,
				icon: Icons.NoEye,
			}),
		]

		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (mailViewerViewModel) {
			if (mailViewerViewModel.isUnread()) {
				return readButtons[0]
			} else {
				return readButtons[1]
			}
		}

		return readButtons
	}

	private renderExportButton(mails: Mail[]) {
		if (!isApp() && !locator.logins.isEnabled(FeatureType.DisableMailExport)) {
			return m(IconButton, {
				title: "export_action",
				click: () => showProgressDialog("pleaseWait_msg", exportMails(mails, locator.entityClient, locator.fileController)),
				icon: Icons.Export,
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

	private renderMoreButton(viewModel: MailViewerViewModel | undefined): Children {
		let actions: DropdownButtonAttrs[] = []

		if (viewModel) {
			actions = mailViewerMoreActions(viewModel, false)
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

	private renderAssignButton(viewModel: MailViewerViewModel) {
		return m(IconButton, {
			title: "forward_action",
			icon: Icons.Forward,
			colors: ButtonColor.Content,
			click: createAsyncDropdown({
				width: 250,
				lazyButtons: () => makeAssignMailsButtons(viewModel),
			}),
		})
	}

	private renderEditButton(viewModel: MailViewerViewModel) {
		return m(IconButton, {
			title: "edit_action",
			click: () => editDraft(viewModel),
			icon: Icons.Edit,
		})
	}
}
