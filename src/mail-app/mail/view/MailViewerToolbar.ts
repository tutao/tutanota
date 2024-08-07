import m, { Children, Component, Vnode } from "mithril"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { createDropdown, DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { editDraft, mailViewerMoreActions } from "./MailViewerUtils.js"
import { ButtonType } from "../../../common/gui/base/Button.js"
import { isApp } from "../../../common/api/common/Env.js"
import { locator } from "../../../common/api/main/CommonLocator.js"
import { showProgressDialog } from "../../../common/gui/dialogs/ProgressDialog.js"
import { lang } from "../../../common/misc/LanguageViewModel.js"
import { DialogHeaderBarAttrs } from "../../../common/gui/base/DialogHeaderBar.js"
import { Dialog, DialogType } from "../../../common/gui/base/Dialog.js"
import { ColumnWidth, Table } from "../../../common/gui/base/Table.js"
import { ExpanderButton, ExpanderPanel } from "../../../common/gui/base/Expander.js"
import stream from "mithril/stream"
import { exportMails } from "../export/Exporter.js"
import { MailModel } from "../model/MailModel.js"

/*
	note that mailViewerViewModel has a mailModel, so you do not need to pass both if you pass a mailViewerViewModel
 */
export interface MailViewerToolbarAttrs {
	mailboxModel: MailboxModel
	mailModel: MailModel
	mailViewerViewModel?: MailViewerViewModel
	mails: Mail[]
	selectNone?: () => void
}

export class MailViewerActions implements Component<MailViewerToolbarAttrs> {
	view(vnode: Vnode<MailViewerToolbarAttrs>) {
		return m(".flex.ml-between-s.items-center", [
			this.renderSingleMailActions(vnode.attrs),
			vnode.attrs.mailViewerViewModel ? m(".nav-bar-spacer") : null,
			this.renderActions(vnode.attrs),
			this.renderMoreButton(vnode.attrs.mailViewerViewModel),
		])
	}

	private renderActions(attrs: MailViewerToolbarAttrs): Children {
		const mailModel = attrs.mailViewerViewModel ? attrs.mailViewerViewModel.mailModel : attrs.mailModel

		if (!mailModel || !attrs.mails) {
			return null
		} else if (attrs.mailViewerViewModel) {
			return [
				this.renderDeleteButton(mailModel, attrs.mails, attrs.selectNone ?? noOp),
				attrs.mailViewerViewModel.canForwardOrMove() ? this.renderMoveButton(attrs.mailboxModel, mailModel, attrs.mails) : null,
				attrs.mailViewerViewModel.isDraftMail() ? null : this.renderReadButton(attrs),
			]
		} else if (attrs.mails.length > 0) {
			return [
				this.renderDeleteButton(mailModel, attrs.mails, attrs.selectNone ?? noOp),
				attrs.mailModel.isMovingMailsAllowed() ? this.renderMoveButton(attrs.mailboxModel, mailModel, attrs.mails) : null,
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
		if (attrs.mailViewerViewModel) {
			if (attrs.mailViewerViewModel.isAnnouncement()) {
				return []
			} else if (attrs.mailViewerViewModel.isDraftMail()) {
				return [this.renderEditButton(attrs.mailViewerViewModel)]
			} else if (attrs.mailViewerViewModel.canForwardOrMove()) {
				return [this.renderReplyButton(attrs.mailViewerViewModel), this.renderForwardButton(attrs.mailViewerViewModel)]
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

	private renderMoveButton(mailboxModel: MailboxModel, mailModel: MailModel, mails: Mail[]): Children {
		return m(IconButton, {
			title: "move_action",
			icon: Icons.Folder,
			click: (e, dom) => showMoveMailsDropdown(mailboxModel, mailModel, dom.getBoundingClientRect(), mails),
		})
	}

	private renderReadButton({ mailModel, mailViewerViewModel, mails }: MailViewerToolbarAttrs): Children {
		const markAction: (unread: boolean) => unknown = mailViewerViewModel
			? (unread) => mailViewerViewModel.setUnread(unread)
			: (unread) => mailModel.markMails(mails, unread)

		const markReadButton = m(IconButton, {
			title: "markRead_action",
			click: () => markAction(false),
			icon: Icons.Eye,
		})
		const markUnreadButton = m(IconButton, {
			title: "markUnread_action",
			click: () => markAction(true),
			icon: Icons.NoEye,
		})

		// mailViewerViewModel means we are viewing one mail; if there is only the mailModel, it is coming from a MultiViewer
		if (mailViewerViewModel) {
			if (mailViewerViewModel.isUnread()) {
				return markReadButton
			} else {
				return markUnreadButton
			}
		}

		return [markReadButton, markUnreadButton]
	}

	private renderExportButton(attrs: MailViewerToolbarAttrs) {
		if (!isApp() && attrs.mailModel.isExportingMailsAllowed()) {
			const operation = locator.operationProgressTracker.startNewOperation()
			const ac = new AbortController()
			const headerBarAttrs: DialogHeaderBarAttrs = {
				left: [
					{
						label: "cancel_action",
						click: () => ac.abort(),
						type: ButtonType.Secondary,
					},
				],
				middle: () => "",
			}

			return m(IconButton, {
				title: "export_action",
				click: () =>
					showProgressDialog(
						() =>
							lang.get("mailExportProgress_msg", {
								"{current}": Math.round((operation.progress() / 100) * attrs.mails.length).toFixed(0),
								"{total}": attrs.mails.length,
							}),
						exportMails(
							attrs.mails,
							locator.mailFacade,
							locator.entityClient,
							locator.fileController,
							locator.cryptoFacade,
							operation.id,
							ac.signal,
						)
							.then((result) => this.handleExportEmailsResult(result.failed))
							.finally(operation.done),
						operation.progress,
						true,
						headerBarAttrs,
					),
				icon: Icons.Export,
			})
		}
	}

	private handleExportEmailsResult(mailList: Mail[]) {
		if (mailList && mailList.length > 0) {
			const lines = mailList.map((mail) => ({
				cells: [mail.sender.address, mail.subject],
				actionButtonAttrs: null,
			}))

			const expanded = stream<boolean>(false)
			const dialog = Dialog.createActionDialog({
				title: lang.get("failedToExport_title"),
				child: () =>
					m("", [
						m(".pt-m", lang.get("failedToExport_msg")),
						m(".flex-start.items-center", [
							m(ExpanderButton, {
								label: () =>
									`${lang.get(expanded() ? "hide_action" : "show_action")} ${lang.get("failedToExport_label", { "{0}": mailList.length })}`,
								expanded: expanded(),
								onExpandedChange: expanded,
							}),
						]),
						m(
							ExpanderPanel,
							{
								expanded: expanded(),
							},
							m(Table, {
								columnHeading: ["email_label", "subject_label"],
								columnWidths: [ColumnWidth.Largest, ColumnWidth.Largest],
								showActionButtonColumn: false,
								lines,
							}),
						),
					]),
				okAction: () => dialog.close(),
				allowCancel: false,
				okActionTextId: "ok_action",
				type: DialogType.EditMedium,
			})

			dialog.show()
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

	private renderEditButton(viewModel: MailViewerViewModel) {
		return m(IconButton, {
			title: "edit_action",
			click: () => editDraft(viewModel),
			icon: Icons.Edit,
		})
	}
}
