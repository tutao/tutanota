import { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import m, { Children, Vnode } from "mithril"
import { IconButton } from "../../gui/base/IconButton.js"
import { Icons } from "../../gui/base/icons/Icons.js"
import { promptAndDeleteMails, showMoveMailsDropdown } from "./MailGuiUtils.js"
import { DROPDOWN_MARGIN } from "../../gui/base/Dropdown.js"
import { MobileBottomActionBar } from "../../gui/MobileBottomActionBar.js"
import { MailModel } from "../model/MailModel.js"

export interface MobileMailMultiselectionActionBarAttrs {
	mails: readonly Mail[]
	mailModel: MailModel
	selectNone: () => unknown
}

export class MobileMailMultiselectionActionBar {
	private dom: HTMLElement | null = null

	view({ attrs }: Vnode<MobileMailMultiselectionActionBarAttrs>): Children {
		const { mails, selectNone, mailModel } = attrs
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
								showMoveMailsDropdown(mailModel, referenceDom.getBoundingClientRect(), mails, {
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
						selectNone()
					},
				}),
				m(IconButton, {
					icon: Icons.NoEye,
					title: "markUnread_action",
					click: () => {
						mailModel.markMails(mails, true)
						selectNone()
					},
				}),
			],
		)
	}
}
