import { getMailFolderType, MailSetKind, MailState, ReplyType } from "../../../common/api/common/TutanotaConstants"
import { FontIcons } from "../../../common/gui/base/icons/FontIcons"
import type { Mail } from "../../../common/api/entities/tutanota/TypeRefs.js"
import { formatTimeOrDateOrYesterday } from "../../../common/misc/Formatter.js"
import m, { Children } from "mithril"
import Badge from "../../../common/gui/base/Badge"
import {
	checkboxOpacity,
	scaleXHide,
	scaleXShow,
	selectableRowAnimParams,
	SelectableRowContainer,
	SelectableRowSelectedSetter,
	setVisibility,
	shouldAlwaysShowMultiselectCheckbox,
} from "../../../common/gui/SelectableRowContainer.js"
import { px, size } from "../../../common/gui/size.js"
import { NBSP, noOp } from "@tutao/tutanota-utils"
import { VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { companyTeamLabel } from "../../../common/misc/ClientConstants.js"
import { getConfidentialFontIcon, isTutanotaTeamMail } from "./MailGuiUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { getSenderOrRecipientHeading } from "./MailViewerUtils.js"

const iconMap: Record<MailSetKind, string> = {
	[MailSetKind.CUSTOM]: FontIcons.Folder,
	[MailSetKind.INBOX]: FontIcons.Inbox,
	[MailSetKind.SENT]: FontIcons.Sent,
	[MailSetKind.TRASH]: FontIcons.Trash,
	[MailSetKind.ARCHIVE]: FontIcons.Archive,
	[MailSetKind.SPAM]: FontIcons.Spam,
	[MailSetKind.DRAFT]: FontIcons.Draft,
	[MailSetKind.ALL]: FontIcons.Folder,
}

export const MAIL_ROW_V_MARGIN = 3

const shiftByForCheckbox = px(10)
const translateXHide = "translateX(0)"
const translateXShow = `translateX(${shiftByForCheckbox})`

export class MailRow implements VirtualRow<Mail> {
	top: number
	domElement: HTMLElement | null = null // set from List

	entity: Mail | null = null
	private subjectDom!: HTMLElement
	private senderDom!: HTMLElement
	private dateDom!: HTMLElement
	private iconsDom!: HTMLElement
	private unreadDom!: HTMLElement
	private folderIconsDom: Record<MailSetKind, HTMLElement>
	private teamLabelDom!: HTMLElement
	private checkboxDom!: HTMLInputElement
	private checkboxWasVisible = shouldAlwaysShowMultiselectCheckbox()
	private selectionSetter!: SelectableRowSelectedSetter

	constructor(private readonly showFolderIcon: boolean, private readonly onSelected: (mail: Mail, selected: boolean) => unknown) {
		this.top = 0
		this.entity = null
		this.folderIconsDom = {} as Record<MailSetKind, HTMLElement>
	}

	update(mail: Mail, selected: boolean, isInMultiSelect: boolean): void {
		this.entity = mail

		this.selectionSetter(selected, isInMultiSelect)
		this.checkboxDom.checked = isInMultiSelect && selected

		this.iconsDom.textContent = this.iconsText(mail)
		this.dateDom.textContent = formatTimeOrDateOrYesterday(mail.receivedDate)
		this.senderDom.textContent = getSenderOrRecipientHeading(mail, true)
		this.subjectDom.textContent = mail.subject || NBSP

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
		this.showCheckboxAnimated(shouldAlwaysShowMultiselectCheckbox() || isInMultiSelect)

		checkboxOpacity(this.checkboxDom, selected)
	}

	private showCheckboxAnimated(show: boolean) {
		// this causes a slide animation where checkbox pops up and the text is shifted to make space for it.
		// we can't animate the width of the checkbox as it causes the layout shifts and is very slow so instead we change the padding of the text elements in
		// a single step and then shift them in an animation. The effect is almost the same as if we would expand/shrink the checkbox.
		// using requestAnimationFrame() because when we toggle it some elements might not be there yet. Could also for the end of the event loop too.
		// using web animations to be able to cancel them easily. Could probably use transition and listen for the end instead but it would be harder to
		// do the bookkeeping.
		// using noOp to catch rejection when the animation is cancelled
		const shouldShowCheckbox = show
		if (this.checkboxWasVisible === shouldShowCheckbox) return

		if (shouldShowCheckbox) {
			this.senderDom.style.paddingRight = shiftByForCheckbox
			this.subjectDom.style.paddingRight = shiftByForCheckbox

			const showTranslateTransform = { transform: [translateXHide, translateXShow] }
			const senderAnim = this.senderDom.animate(showTranslateTransform, selectableRowAnimParams)
			const subjectAnim = this.subjectDom.animate(showTranslateTransform, selectableRowAnimParams)
			const badgeAnim = this.teamLabelDom.animate(showTranslateTransform, selectableRowAnimParams)
			const checkboxAnim = this.checkboxDom.animate({ transform: [scaleXHide, scaleXShow] }, selectableRowAnimParams)

			Promise.all([senderAnim.finished, subjectAnim.finished, checkboxAnim.finished]).then(() => {
				this.showCheckbox(true)

				senderAnim.cancel()
				subjectAnim.cancel()
				badgeAnim.cancel()
				checkboxAnim.cancel()
			}, noOp)
		} else {
			this.senderDom.style.paddingRight = "0"
			this.subjectDom.style.paddingRight = "0"

			const hideTranslateTransform = { transform: [translateXShow, translateXHide] }
			const senderAnim = this.senderDom.animate(hideTranslateTransform, selectableRowAnimParams)
			const subjectAnim = this.subjectDom.animate(hideTranslateTransform, selectableRowAnimParams)
			const badgeAnim = this.teamLabelDom.animate(hideTranslateTransform, selectableRowAnimParams)
			const checkboxAnim = this.checkboxDom.animate({ transform: [scaleXShow, scaleXHide] }, selectableRowAnimParams)

			Promise.all([senderAnim.finished, subjectAnim.finished, checkboxAnim.finished]).then(() => {
				this.showCheckbox(false)

				senderAnim.cancel()
				subjectAnim.cancel()
				badgeAnim.cancel()
				checkboxAnim.cancel()
			}, noOp)
		}
		this.checkboxWasVisible = shouldShowCheckbox
	}

	private showCheckbox(show: boolean) {
		let translate
		let scale
		let padding
		if (show) {
			translate = translateXShow
			scale = scaleXShow
			padding = shiftByForCheckbox
		} else {
			translate = translateXHide
			scale = scaleXHide
			padding = "0"
		}
		this.senderDom.style.transform = translate
		this.subjectDom.style.transform = translate
		this.teamLabelDom.style.transform = translate
		this.checkboxDom.style.transform = scale

		this.senderDom.style.paddingRight = padding
		this.subjectDom.style.paddingRight = padding

		// we effectively remove it from interaction
		this.checkboxDom.disabled = !show
		this.checkboxDom.tabIndex = show ? 0 : -1
	}

	/**
	 * Only the structure is managed by mithril. We set all contents on our own (see update) in order to avoid the vdom overhead (not negligible on mobiles)
	 */
	render(): Children {
		return m(
			SelectableRowContainer,
			{
				onSelectedChangeRef: (changer) => {
					this.selectionSetter = changer
				},
				oncreate: () => {
					// doing it right away to avoid visual glitch of it appearing/disappearing
					// but doing it at the end of the event loop because we touch other DOM elements too which might not be there yet
					Promise.resolve().then(() => this.showCheckbox(shouldAlwaysShowMultiselectCheckbox()))
				},
			},
			[
				m(
					".flex.col.items-center.flex-no-grow.no-shrink.pt-xs.abs",
					m("input.checkbox.list-checkbox", {
						type: "checkbox",
						style: {
							marginBottom: "7px",
							transformOrigin: "left",
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
							checkboxOpacity(this.checkboxDom, false)
						},
					}),
					m(".dot.bg-accent-fg.hidden", {
						style: {
							marginTop: px(MAIL_ROW_V_MARGIN),
						},
						oncreate: (vnode) => (this.unreadDom = vnode.dom as HTMLElement),
					}),
				),
				m(
					".flex-grow.min-width-0",
					{
						style: {
							marginLeft: px(size.checkbox_size + size.vpad_xs),
						},
					},
					[
						m(".flex.badge-line-height", [
							m(
								Badge,
								{
									classes: ".small.mr-s",
									oncreate: (vnode) => (this.teamLabelDom = vnode.dom as HTMLElement),
								},
								companyTeamLabel,
							),
							m(".text-ellipsis", {
								oncreate: (vnode) => (this.senderDom = vnode.dom as HTMLElement),
							}),
							m(".flex-grow"),
							m("small.text-ellipsis.flex-fixed", {
								oncreate: (vnode) => (this.dateDom = vnode.dom as HTMLElement),
							}),
						]),
						m(".flex.mt-xxs", [
							m(".smaller.text-ellipsis", {
								oncreate: (vnode) => (this.subjectDom = vnode.dom as HTMLElement),
							}),
							m(".flex-grow"),
							m("span.ion.ml-s.list-font-icons", {
								oncreate: (vnode) => (this.iconsDom = vnode.dom as HTMLElement),
							}),
						]),
					],
				),
			],
		)
	}

	private iconsText(mail: Mail): string {
		let iconText = ""

		if (this.showFolderIcon) {
			let folder = mailLocator.mailModel.getMailFolderForMail(mail)
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
			iconText += getConfidentialFontIcon(mail)
		}

		if (mail.attachments.length > 0) {
			iconText += FontIcons.Attach
		}

		return iconText
	}

	private folderIcon(type: MailSetKind): string {
		return iconMap[type]
	}
}
