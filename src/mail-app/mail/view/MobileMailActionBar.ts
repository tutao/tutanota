import m, { Children, Component, Vnode } from "mithril"
import { MailViewerViewModel } from "./MailViewerViewModel.js"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { createDropdown, Dropdown, DROPDOWN_MARGIN, DropdownButtonAttrs } from "../../../common/gui/base/Dropdown.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { UserError } from "../../../common/api/main/UserError.js"
import { showUserError } from "../../../common/misc/ErrorHandlerImpl.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { noOp, ofClass } from "@tutao/tutanota-utils"
import { modal } from "../../../common/gui/base/Modal.js"
import { editDraft, mailViewerMoreActions } from "./MailViewerUtils.js"
import { px, size } from "../../../common/gui/size.js"

export interface MobileMailActionBarAttrs {
	viewModel: MailViewerViewModel
}

export class MobileMailActionBar implements Component<MobileMailActionBarAttrs> {
	private dom: HTMLElement | null = null

	view(vnode: Vnode<MobileMailActionBarAttrs>): Children {
		const { attrs } = vnode
		const { viewModel } = attrs
		let actions: Children[]

		if (viewModel.isAnnouncement()) {
			actions = [this.placeholder(), this.placeholder(), this.deleteButton(attrs), this.placeholder(), this.moreButton(attrs)]
		} else if (viewModel.isDraftMail()) {
			actions = [this.placeholder(), this.placeholder(), this.deleteButton(attrs), this.moveButton(attrs), this.editButton(attrs)]
		} else if (viewModel.canForwardOrMove()) {
			actions = [this.replyButton(attrs), this.forwardButton(attrs), this.deleteButton(attrs), this.moveButton(attrs), this.moreButton(attrs)]
		} else {
			actions = [this.replyButton(attrs), this.placeholder(), this.deleteButton(attrs), this.placeholder(), this.moreButton(attrs)]
		}

		return m(
			".bottom-nav.bottom-action-bar.flex.items-center.plr-l.justify-between",
			{
				oncreate: (vnode) => {
					this.dom = vnode.dom as HTMLElement
				},
			},
			[actions],
		)
	}

	private placeholder() {
		return m("", {
			style: {
				width: px(size.button_height),
			},
		})
	}

	private moveButton({ viewModel }: MobileMailActionBarAttrs) {
		return m(IconButton, {
			title: "move_action",
			click: (e, dom) =>
				showMoveMailsDropdown(viewModel.mailboxModel, viewModel.mailModel, dom.getBoundingClientRect(), [viewModel.mail], {
					width: this.dropdownWidth(),
					withBackground: true,
				}),
			icon: Icons.Folder,
		})
	}

	private dropdownWidth() {
		return this.dom?.offsetWidth ? this.dom.offsetWidth - DROPDOWN_MARGIN * 2 : undefined
	}

	private moreButton({ viewModel }: MobileMailActionBarAttrs) {
		return m(IconButton, {
			title: "more_label",
			click: createDropdown({
				lazyButtons: () => mailViewerMoreActions(viewModel),
				width: this.dropdownWidth(),
				withBackground: true,
			}),
			icon: Icons.More,
		})
	}

	private deleteButton({ viewModel }: MobileMailActionBarAttrs): Children {
		return m(IconButton, {
			title: "delete_action",
			click: () => promptAndDeleteMails(viewModel.mailModel, [viewModel.mail], noOp),
			icon: Icons.Trash,
		})
	}

	private forwardButton({ viewModel }: MobileMailActionBarAttrs): Children {
		return m(IconButton, {
			title: "forward_action",
			click: () => viewModel.forward().catch(ofClass(UserError, showUserError)),
			icon: Icons.Forward,
		})
	}

	private replyButton({ viewModel }: MobileMailActionBarAttrs) {
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

	private editButton(attrs: MobileMailActionBarAttrs) {
		return m(IconButton, {
			title: "edit_action",
			icon: Icons.Edit,
			click: () => editDraft(attrs.viewModel),
		})
	}
}
