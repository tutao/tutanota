import { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../../common/gui/base/IconButton.js"
import { Icons } from "../../../common/gui/base/icons/Icons.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { DROPDOWN_MARGIN } from "../../../common/gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../../common/gui/MobileBottomActionBar.js"
import { MailboxModel } from "../../../common/mailFunctionality/MailboxModel.js"
import { MailModel } from "../model/MailModel.js"

export interface MobileMailMultiselectionActionBarAttrs {
	mails: readonly Mail[]
	mailModel: MailModel
	mailboxModel: MailboxModel
	selectNone: () => unknown
}

export class MobileMailMultiselectionActionBar {
	private dom: HTMLElement | null = null

	view({ attrs }: Vnode<MobileMailMultiselectionActionBarAttrs>): Children {
		const { mails, selectNone, mailModel, mailboxModel } = attrs
		return m(
			MobileBottomActionBar,
			{
				oncreate: ({ dom }) => (this.dom = dom as HTMLElement),
			},
			[
				m(IconButton, {
					icon: Icons.Trash,
					title: "delete_action",
					click: () => promptAndDeleteMails(mailModel, mails, selectNone),
				}),
				mailModel.isMovingMailsAllowed()
					? m(IconButton, {
							icon: Icons.Folder,
							title: "move_action",
							click: (e, dom) => {
								const referenceDom = this.dom ?? dom
								showMoveMailsDropdown(mailboxModel, mailModel, referenceDom.getBoundingClientRect(), mails, {
									onSelected: () => selectNone,
									width: referenceDom.offsetWidth - DROPDOWN_MARGIN * 2,
								})
							},
					  })
					: null,
				m(IconButton, {
					icon: Icons.Eye,
					title: "markRead_action",
					click: () => {
						mailModel.markMails(mails, false)
						// I think these should be left out and it stops a bug, but we'll see
						//selectNone()
					},
				}),
				m(IconButton, {
					icon: Icons.NoEye,
					title: "markUnread_action",
					click: () => {
						mailModel.markMails(mails, true)
						//selectNone()
					},
				}),
			],
		)
	}
}
