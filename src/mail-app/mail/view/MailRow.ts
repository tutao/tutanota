import { getMailFolderType, MailSetKind, MailState, ReplyType } from "../../../common/api/common/TutanotaConstants"
import { FontIcons } from "../../../common/gui/base/icons/FontIcons"
import type { Mail, MailFolder } from "../../../common/api/entities/tutanota/TypeRefs.js"
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
import { component_size, px, size } from "../../../common/gui/size.js"
import { noOp } from "@tutao/tutanota-utils"
import { setHTMLElementTextWithHighlighting, VirtualRow } from "../../../common/gui/base/ListUtils.js"
import { companyTeamLabel } from "../../../common/misc/ClientConstants.js"
import { getConfidentialFontIcon, isTutanotaTeamMail } from "./MailGuiUtils.js"
import { mailLocator } from "../../mailLocator.js"
import { getSenderOrRecipientHeading } from "./MailViewerUtils.js"
import { getLabelColor } from "../../../common/gui/base/Label"
import { colorForBg } from "../../../common/gui/base/GuiUtils"
import { theme } from "../../../common/gui/theme"
import { SearchToken } from "../../../common/api/common/utils/QueryTokenUtils"
import { lang } from "../../../common/misc/LanguageViewModel"
import { getFolderName } from "../model/MailUtils"
import { client } from "../../../common/misc/ClientDetector"

const iconMap: Record<MailSetKind, string> = {
	[MailSetKind.CUSTOM]: FontIcons.Folder,
	[MailSetKind.INBOX]: FontIcons.Inbox,
	[MailSetKind.SENT]: FontIcons.Sent,
	[MailSetKind.TRASH]: FontIcons.Trash,
	[MailSetKind.ARCHIVE]: FontIcons.Archive,
	[MailSetKind.SPAM]: FontIcons.Spam,
	[MailSetKind.DRAFT]: FontIcons.Draft,
	[MailSetKind.ALL]: FontIcons.Folder,
	[MailSetKind.LABEL]: FontIcons.Folder,
	[MailSetKind.Imported]: FontIcons.Folder,
}

export const MAIL_ROW_V_MARGIN = 3

const shiftByForCheckbox = px(10)
const translateXHide = "translateX(0)"
const translateXShow = `translateX(${shiftByForCheckbox})`

const ELLIPSIS = "\u2026"

const MAX_DISPLAYED_LABELS = 6

export class MailRow implements VirtualRow<Mail> {
	top: number
	private domElement: HTMLElement | null = null

	entity: Mail | null = null
	private subjectDom!: HTMLElement
	private senderDom!: HTMLElement

	private dateDom!: HTMLElement
	private iconsDom!: HTMLElement
	private unreadDom!: HTMLElement
	private teamLabelDom!: HTMLElement
	private labelsDom: HTMLElement[] = []
	private moreLabelsIndicatorDom!: HTMLElement
	private checkboxDom!: HTMLInputElement
	private checkboxWasVisible = shouldAlwaysShowMultiselectCheckbox()
	private selectionSetter!: SelectableRowSelectedSetter

	private highlightedStrings?: readonly SearchToken[]

	constructor(
		private readonly showFolderIcon: boolean,
		private readonly getLabelsForMail: (mail: Mail) => ReadonlyArray<MailFolder>,
		private readonly onSelected: (mail: Mail, selected: boolean) => unknown,
		private readonly getHighlightedStrings?: () => readonly SearchToken[],
	) {
		this.top = 0
		this.entity = null
	}

	update(mail: Mail, selected: boolean, isInMultiSelect: boolean): void {
		const oldEntity = this.entity
		this.entity = mail
		const oldHighlightedStrings = this.highlightedStrings
		this.highlightedStrings = this.getHighlightedStrings?.()

		this.selectionSetter(selected, isInMultiSelect)
		this.checkboxDom.checked = isInMultiSelect && selected
		const iconInformation = this.iconsText(mail)
		this.iconsDom.textContent = iconInformation.iconText
		const formattedDate = formatTimeOrDateOrYesterday(mail.receivedDate)
		this.dateDom.textContent = formattedDate

		const senderString = getSenderOrRecipientHeading(mail, true)
		// We need to set our sender/subject, but we should do this sparingly (i.e. when state actually changes)
		//
		// This requires assuming the following:
		// - `this.getHighlightedStrings()` will return the same array instance if the query hasn't changed
		// - `mail` will be a different instance if the entity was changed on the server
		if (oldEntity !== this.entity || oldHighlightedStrings !== this.highlightedStrings) {
			setHTMLElementTextWithHighlighting(this.senderDom, senderString, this.highlightedStrings)
			setHTMLElementTextWithHighlighting(this.subjectDom, mail.subject, this.highlightedStrings)
		}

		if (mail.unread) {
			this.unreadDom.classList.remove("hidden")
			this.subjectDom.classList.add("b")
			this.senderDom.classList.add("b")
		} else {
			this.unreadDom.classList.add("hidden")

			this.subjectDom.classList.remove("b")
			this.senderDom.classList.remove("b")
		}
		const labels = this.updateLabels(mail)

		const isTeamMail = isTutanotaTeamMail(mail)
		setVisibility(this.teamLabelDom, isTeamMail)
		this.showCheckboxAnimated(shouldAlwaysShowMultiselectCheckbox() || isInMultiSelect)

		checkboxOpacity(this.checkboxDom, selected)

		if (this.domElement) {
			let labelsText = ""
			for (const label of labels) {
				labelsText += label.name + " "
			}
			const description = `${isTeamMail ? companyTeamLabel : ""} ${senderString} ${mail.subject} ${labelsText} ${formattedDate} ${mail.unread ? lang.get("unread_label") : ""} ${iconInformation.description} `
			this.domElement.ariaLabel = description
			// VoiceOver on iOS will read both aria-label and aria-description
			// and it NEEDS to have aria-label or it won't read it at all.
			// Some other readers e.g. TalkBack need aria-description instead
			// (at least if it's a child of <li>).
			if (!client.isIos()) {
				this.domElement.ariaDescription = description
			}
		}
	}

	private updateLabels(mail: Mail): readonly MailFolder[] {
		const labels = this.getLabelsForMail(mail)

		for (const [i, element] of this.labelsDom.entries()) {
			const label = labels[i]
			if (label) {
				element.style.display = ""
				element.style.backgroundColor = getLabelColor(label.color)
				element.style.color = colorForBg(label.color ?? theme.primary)
				element.textContent = label.name
			} else {
				element.style.display = "none"
			}
		}
		this.moreLabelsIndicatorDom.style.display = labels.length > this.labelsDom.length ? "" : "none"
		return labels
	}

	private showCheckboxAnimated(show: boolean): void {
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

	private showCheckbox(show: boolean): void {
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
		this.checkboxDom.ariaHidden = String(!show)
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
				oncreate: (vnode) => {
					this.domElement = vnode.dom as HTMLElement
					// doing it right away to avoid visual glitch of it appearing/disappearing
					// but doing it at the end of the event loop because we touch other DOM elements too which might not be there yet
					Promise.resolve().then(() => this.showCheckbox(shouldAlwaysShowMultiselectCheckbox()))
				},
			},
			[
				m(
					".flex.col.items-center.flex-no-grow.no-shrink.pt-4.abs",
					{
						"aria-hidden": "true",
					},
					m("input.checkbox.list-checkbox", {
						type: "checkbox",
						style: {
							marginBottom: "7px",
							transformOrigin: "left",
						},
						onclick: (e: MouseEvent) => {
							if (e.shiftKey) {
								// If the shift is pressed, let it bubble up and be handled by List which will do a range select
								e.preventDefault()
							} else {
								e.stopPropagation()
							}
						},
						onchange: () => {
							if (this.entity) this.onSelected(this.entity, this.checkboxDom.checked)
						},
						oncreate: (vnode) => {
							this.checkboxDom = vnode.dom as HTMLInputElement
							checkboxOpacity(this.checkboxDom, false)
						},
					}),
					m(".dot.bg-accent-fg.hidden", {
						"data-testid": "unread-indicator",
						style: {
							marginTop: px(MAIL_ROW_V_MARGIN),
						},
						oncreate: (vnode) => (this.unreadDom = vnode.dom as HTMLElement),
					}),
				),
				m(
					".flex-grow.min-width-0",
					{
						"aria-hidden": "true",
						style: {
							marginLeft: px(component_size.checkbox_size + size.spacing_4),
						},
					},
					[
						m(".flex.badge-line-height", [
							m(
								Badge,
								{
									classes: ".small.mr-8",
									oncreate: (vnode) => (this.teamLabelDom = vnode.dom as HTMLElement),
								},
								companyTeamLabel,
							),
							m(".text-ellipsis", {
								oncreate: (vnode) => (this.senderDom = vnode.dom as HTMLElement),
							}),
							m(
								".flex.flex-grow-shrink-0.justify-end",
								{
									style: {
										minWidth: px(34), // so the moreLabelIndicator is visible on smaller screens
									},
								},
								this.renderLabels(),
								this.renderLabelsMoreIndicator(),
							),
							m("small.text-ellipsis.flex-fixed", {
								oncreate: (vnode) => (this.dateDom = vnode.dom as HTMLElement),
							}),
						]),
						m(".flex.mt-4", [
							m(".smaller.text-ellipsis", {
								"data-testid": "list-row:mail:subject",
								oncreate: (vnode) => (this.subjectDom = vnode.dom as HTMLElement),
							}),
							m(".flex-grow"),
							m("span.ion.ml-8.list-font-icons", {
								oncreate: (vnode) => (this.iconsDom = vnode.dom as HTMLElement),
							}),
						]),
					],
				),
			],
		)
	}

	private renderLabelsMoreIndicator(): Children {
		return m(
			"span.smaller.text-center.text-ellipsis.border-radius-8",
			{
				style: {
					// in dark theme override saturation to aid readability. This is not relative but absolute saturation. We preserve the hue.
					border: `2px solid ${getLabelColor(theme.on_surface_variant)}`,
					color: getLabelColor(theme.on_surface_variant),
					padding: `0px ${size.spacing_4}px 1px`,
					marginRight: px(size.spacing_4),
					minWidth: px(16),
					lineHeight: px(8),
				},
				oncreate: (vnode) => {
					this.moreLabelsIndicatorDom = vnode.dom as HTMLElement
				},
			},
			ELLIPSIS,
		)
	}

	private renderLabels(): Children {
		return m(
			".flex.overflow-hidden",
			{
				style: {
					margin: `0 ${size.spacing_4}px`,
					columnGap: px(size.spacing_4),
					maxWidth: "fit-content",
				},
			},
			Array(MAX_DISPLAYED_LABELS)
				.fill(0)
				.map((_, i) =>
					// Not using the regular Label component as we have too
					// many differences and list is a special case anyway.
					m("span.small.text-center.text-ellipsis.border-radius-8", {
						"data-testid": "label",
						style: {
							padding: `2px ${size.spacing_4}px`,
							minWidth: "4ch",
							maxWidth: px(48),
							lineHeight: "100%",
							textOverflow: "'‥'",
						},
						oncreate: (vnode) => {
							this.labelsDom[i] = vnode.dom as HTMLElement
						},
					}),
				),
		)
	}

	private iconsText(mail: Mail): { iconText: string; description: string } {
		let iconText = ""
		let description = ""

		if (this.showFolderIcon) {
			let folder = mailLocator.mailModel.getMailFolderForMail(mail)
			if (folder) {
				iconText += this.folderIcon(getMailFolderType(folder))
				description += getFolderName(folder) + " "
			}
		}

		if (mail._errors) {
			iconText += FontIcons.Warning
			description += lang.get("corrupted_msg") + " "
		}

		if (mail.state === MailState.DRAFT) {
			iconText += FontIcons.Edit
			description += lang.get("draft_label") + " "
		}

		switch (mail.replyType) {
			case ReplyType.REPLY:
				iconText += FontIcons.Reply
				description += lang.get("replied_label") + " "
				break

			case ReplyType.FORWARD:
				iconText += FontIcons.Forward
				description += lang.get("forwarded_label") + " "
				break

			case ReplyType.REPLY_FORWARD:
				iconText += FontIcons.Reply
				iconText += FontIcons.Forward
				description += lang.get("replied_label") + " "
				description += lang.get("forwarded_label") + " "
				break
		}

		if (mail.confidential) {
			iconText += getConfidentialFontIcon(mail)
			description += lang.get("confidential_label") + " "
		}

		if (mail.attachments.length > 0) {
			iconText += FontIcons.Attach
			description += lang.get("attachment_label")
		}

		return { iconText, description }
	}

	private folderIcon(type: MailSetKind): string {
		return iconMap[type]
	}
}
