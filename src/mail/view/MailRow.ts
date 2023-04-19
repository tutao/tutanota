import { getMailFolderType, MailFolderType, MailState, ReplyType } from "../../api/common/TutanotaConstants"
import { FontIcons } from "../../gui/base/icons/FontIcons"
import type { Mail } from "../../api/entities/tutanota/TypeRefs.js"
import { formatTimeOrDateOrYesterday } from "../../misc/Formatter"
import { getSenderOrRecipientHeading, isTutanotaTeamMail } from "../model/MailUtils"
import { locator } from "../../api/main/MainLocator"
import m, { Children } from "mithril"
import Badge from "../../gui/base/Badge"
import { px } from "../../gui/size"
import type { VirtualRow } from "../../gui/base/List"
import { checkboxOpacity, SelectableRowContainer, setSelectedRowStyle, setVisibility } from "../../gui/SelectableRowContainer.js"
import { styles } from "../../gui/styles.js"

const iconMap: Record<MailFolderType, string> = {
	[MailFolderType.CUSTOM]: FontIcons.Folder,
	[MailFolderType.INBOX]: FontIcons.Inbox,
	[MailFolderType.SENT]: FontIcons.Sent,
	[MailFolderType.TRASH]: FontIcons.Trash,
	[MailFolderType.ARCHIVE]: FontIcons.Archive,
	[MailFolderType.SPAM]: FontIcons.Spam,
	[MailFolderType.DRAFT]: FontIcons.Draft,
}

export class MailRow implements VirtualRow<Mail> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Mail | null = null
	private subjectDom!: HTMLElement
	private senderDom!: HTMLElement
	private dateDom!: HTMLElement
	private iconsDom!: HTMLElement
	private unreadDom!: HTMLElement
	private folderIconsDom: Record<MailFolderType, HTMLElement>
	private teamLabelDom!: HTMLElement
	private innerContainerDom!: HTMLElement
	private checkboxDom!: HTMLInputElement

	constructor(private readonly showFolderIcon: boolean, private readonly onSelected: (mail: Mail, selected: boolean) => unknown) {
		this.top = 0
		this.entity = null
		this.folderIconsDom = {} as Record<MailFolderType, HTMLElement>
	}

	update(mail: Mail, selected: boolean, isInMultiSelect: boolean): void {
		if (!this.domElement) {
			return
		}

		setSelectedRowStyle(this.innerContainerDom, styles.isSingleColumnLayout() ? isInMultiSelect && selected : selected)
		this.checkboxDom.checked = isInMultiSelect && selected

		this.iconsDom.textContent = this.iconsText(mail)
		this.dateDom.textContent = formatTimeOrDateOrYesterday(mail.receivedDate)
		this.senderDom.textContent = getSenderOrRecipientHeading(mail, true)
		this.subjectDom.textContent = mail.subject

		if (mail.unread) {
			this.unreadDom.classList.remove("hidden")

			this.subjectDom.classList.add("b")
			this.senderDom.classList.add("b")
		} else {
			this.unreadDom.classList.add("hidden")

			this.subjectDom.classList.remove("b")
			this.senderDom.classList.remove("b")
		}

		setVisibility(this.teamLabelDom, isTutanotaTeamMail(mail))
		this.updateCheckboxVisibility()

		checkboxOpacity(this.checkboxDom, selected)
	}

	private updateCheckboxVisibility() {
		if (styles.isSingleColumnLayout()) {
			this.checkboxDom.style.display = "none"
			// this.unreadDom.style.marginTop = "3px"
		} else {
			this.checkboxDom.style.display = ""
			// this.unreadDom.style.marginTop = "10px"
		}

		checkboxOpacity(this.checkboxDom, false)
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				oncreate: (vnode) => {
					this.innerContainerDom = vnode.dom as HTMLElement
				},
			},
			[
				m(
					".flex.col.items-center.flex-no-grow.no-shrink.pr.pt-xs",
					m("input.checkbox.list-checkbox", {
						type: "checkbox",
						style: {
							marginBottom: "7px",
						},
						onclick: (e: MouseEvent) => {
							e.stopPropagation()
							// e.redraw = false
						},
						onchange: () => {
							this.entity && this.onSelected(this.entity, this.checkboxDom.checked)
						},
						oncreate: (vnode) => {
							this.checkboxDom = vnode.dom as HTMLInputElement
							// doing it right away to avoid visual glitch of it appearing/disappearing
							this.updateCheckboxVisibility()
						},
					}),
					m(".dot.bg-accent-fg.hidden", {
						style: {
							marginTop: "3px",
						},
						oncreate: (vnode) => (this.unreadDom = vnode.dom as HTMLElement),
					}),
				),
				m(".flex-grow.min-width-0", [
					m(".flex.badge-line-height", [
						m(
							Badge,
							{
								classes: ".small.mr-s",
								oncreate: (vnode) => (this.teamLabelDom = vnode.dom as HTMLElement),
							},
							"Tutanota Team",
						),
						m(".text-ellipsis", {
							oncreate: (vnode) => (this.senderDom = vnode.dom as HTMLElement),
						}),
						m(".flex-grow"),
						m("small.text-ellipsis.flex-fixed", {
							oncreate: (vnode) => (this.dateDom = vnode.dom as HTMLElement),
						}),
					]),
					m(
						".flex",
						{
							style: {
								marginTop: px(2),
							},
						},
						[
							m(".smaller.text-ellipsis", {
								oncreate: (vnode) => (this.subjectDom = vnode.dom as HTMLElement),
							}),
							m(".flex-grow"),
							m("span.ion.ml-s.list-font-icons", {
								oncreate: (vnode) => (this.iconsDom = vnode.dom as HTMLElement),
							}),
						],
					),
				]),
			],
		)
	}

	private iconsText(mail: Mail): string {
		let iconText = ""

		if (this.showFolderIcon) {
			let folder = locator.mailModel.getMailFolder(mail._id[0])
			iconText += folder ? this.folderIcon(getMailFolderType(folder)) : ""
		}

		iconText += mail._errors ? FontIcons.Warning : ""

		if (mail.state === MailState.DRAFT) {
			iconText += FontIcons.Edit
		}

		switch (mail.replyType) {
			case ReplyType.REPLY:
				iconText += FontIcons.Reply
				break

			case ReplyType.FORWARD:
				iconText += FontIcons.Forward
				break

			case ReplyType.REPLY_FORWARD:
				iconText += FontIcons.Reply
				iconText += FontIcons.Forward
				break
		}

		if (mail.confidential) {
			iconText += FontIcons.Confidential
		}

		if (mail.attachments.length > 0) {
			iconText += FontIcons.Attach
		}

		return iconText
	}

	private folderIcon(type: MailFolderType): string {
		return iconMap[type]
	}
}
