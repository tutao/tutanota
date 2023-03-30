import { styles } from "../../gui/styles.js"
import m, { Children, Component, Vnode } from "mithril"
import { MailModel } from "../model/MailModel.js"
import { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../gui/base/IconButton.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { UserError } from "../../api/main/UserError.js"
import { showUserError } from "../../misc/ErrorHandlerImpl.js"
import { createAsyncDropdown, createDropdown } from "../../gui/base/Dropdown.js"
import { editDraft, mailViewerMoreActions, makeAssignMailsButtons } from "./MailViewerUtils.js"
import { ButtonColor } from "../../gui/base/Button.js"
import { px, size } from "../../gui/size.js"
import { isApp } from "../../api/common/Env.js"
import { locator } from "../../api/main/MainLocator.js"
import { FeatureType } from "../../api/common/TutanotaConstants.js"
import { showProgressDialog } from "../../gui/dialogs/ProgressDialog.js"
import { exportMails } from "../export/Exporter.js"

export interface MailViewerToolbarAttrs {
	mailModel: MailModel
	mailViewerViewModel?: MailViewerViewModel
	mails: Mail[]
	selectNone: () => void
	readAction: () => unknown
	unreadAction: () => unknown
}

export class MailViewerToolbar implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>): Children {
		if (styles.isSingleColumnLayout()) {
			return null
		}

		return m(
			".flex.pt-xs.pb-xs.list-bg.plr-m.list-border-bottom.items-center",
			// Height keeps the toolbar showing for consistency, even if there are no actions
			{ style: { height: px(size.button_height) } },
			this.leftSideActions(vnode.attrs),
			m(".flex-grow"),
			this.rightSideActions(vnode.attrs),
		)
	}

	private leftSideActions(attrs: MailViewerToolbarAttrs): Children {
		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (attrs.mailViewerViewModel) {
			return [
				this.deleteButton(attrs),
				attrs.mailViewerViewModel.canForwardOrMove() ? this.moveButton(attrs.mailModel, attrs.mails) : null,
				attrs.mailViewerViewModel.isDraftMail() ? null : this.readButton(attrs),
			]
		} else if (attrs.mails.length > 0) {
			return [
				this.deleteButton(attrs),
				locator.logins.getUserController().isInternalUser() ? this.moveButton(attrs.mailModel, attrs.mails) : null,
				this.readButton(attrs),
				this.exportButton(attrs),
			]
		}
	}

	private rightSideActions(attrs: MailViewerToolbarAttrs): Children {
		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (attrs.mailViewerViewModel) {
			if (attrs.mailViewerViewModel.isAnnouncement()) {
				return []
			} else if (attrs.mailViewerViewModel.isDraftMail()) {
				this.editButton(attrs.mailViewerViewModel)
			} else if (attrs.mailViewerViewModel.canForwardOrMove()) {
				return [this.replyButtons(attrs.mailViewerViewModel), this.forwardButton(attrs.mailViewerViewModel), this.moreButton(attrs.mailViewerViewModel)]
			} else if (attrs.mailViewerViewModel.canAssignMails()) {
				return [this.replyButtons(attrs.mailViewerViewModel), this.assignButton(attrs.mailViewerViewModel), this.moreButton(attrs.mailViewerViewModel)]
			} else {
				return [this.replyButtons(attrs.mailViewerViewModel), this.moreButton(attrs.mailViewerViewModel)]
			}
		} else {
			return []
		}
	}

	private deleteButton({ mailModel, mails, selectNone }: MailViewerToolbarAttrs): Children {
		return m(IconButton, {
			title: "delete_action",
			click: () => {
				promptAndDeleteMails(mailModel, mails, selectNone)
			},
			icon: Icons.Trash,
		})
	}

	private moveButton(mailModel: MailModel, mails: Mail[]): Children {
		return m(IconButton, {
			title: "move_action",
			icon: Icons.Folder,
			click: (e, dom) => showMoveMailsDropdown(mailModel, dom.getBoundingClientRect(), mails),
		})
	}

	private readButton({ readAction, unreadAction, mailViewerViewModel }: MailViewerToolbarAttrs): Children {
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

	private exportButton({ mails }: MailViewerToolbarAttrs) {
		if (!isApp() && !locator.logins.isEnabled(FeatureType.DisableMailExport)) {
			return m(IconButton, {
				title: "export_action",
				click: () => showProgressDialog("pleaseWait_msg", exportMails(mails, locator.entityClient, locator.fileController)),
				icon: Icons.Export,
			})
		}
	}

	private replyButtons(viewModel: MailViewerViewModel) {
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

	private forwardButton(viewModel: MailViewerViewModel) {
		return m(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward,
		})
	}

	private moreButton(viewModel: MailViewerViewModel): Children {
		return m(IconButton, {
			title: "more_label",
			icon: Icons.More,
			click: createDropdown({
				lazyButtons: () => mailViewerMoreActions(viewModel, false),
				width: 300,
			}),
		})
	}

	private assignButton(viewModel: MailViewerViewModel) {
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

	private editButton(viewModel: MailViewerViewModel) {
		return m(IconButton, {
			title: "edit_action",
			click: () => editDraft(viewModel),
			icon: Icons.Edit,
		})
	}
}
