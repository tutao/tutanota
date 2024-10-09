import type { CalendarEvent, Contact } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { getTimeZone } from "../../../../common/calendar/date/CalendarUtils.js"
import { memoized } from "@tutao/tutanota-utils"
import { TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { BannerButton, BannerButtonAttrs } from "../../../../common/gui/base/buttons/BannerButton.js"
import { pureComponent } from "../../../../common/gui/base/PureComponent.js"
import { formatEventDuration, getDisplayEventTitle } from "../CalendarGuiUtils.js"
import { getLocationUrl } from "./EventPreviewView.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { ButtonColor, getColors } from "../../../../common/gui/base/Button.js"

export type ContactPreviewViewAttrs = {
	event: CalendarEvent
	contact: Contact
}

export class ContactPreviewView implements Component<ContactPreviewViewAttrs> {
	// Cache the parsed URL, so we don't parse the URL on every single view call
	private readonly getLocationUrl: typeof getLocationUrl

	constructor() {
		this.getLocationUrl = memoized(getLocationUrl)
	}

	/**	TO-DO
	 * [ ] Show name
	 * [ ] Show age
	 * [ ] Show email
	 * [ ] Show phone
	 */
	view(vnode: Vnode<ContactPreviewViewAttrs>): Children {
		const { event, contact } = vnode.attrs
		const eventTitle = getDisplayEventTitle(event.summary)

		return m(".flex.col.smaller.scroll.visible-scrollbar", [
			this.renderRow(BootIcons.Calendar, [m("span.h3", eventTitle)]),
			this.renderRow(Icons.Time, [formatEventDuration(event, getTimeZone(), false)]),
			this.renderActions(contact),
		])
	}

	private renderRow(headerIcon: AllIcons, children: Children, isAlignedLeft?: boolean): Children {
		return m(
			".flex.pb-s",
			{
				class: isAlignedLeft ? "items-start" : "items-center",
			},
			[this.renderSectionIndicator(headerIcon, isAlignedLeft ? { marginTop: "2px" } : undefined), m(".selectable.text-break.full-width", children)],
		)
	}

	private renderSectionIndicator(icon: AllIcons, style: Record<string, any> = {}): Children {
		return m(Icon, {
			icon,
			class: "pr",
			size: IconSize.Medium,
			style: Object.assign(
				{
					fill: theme.content_button,
					display: "block",
				},
				style,
			),
		})
	}

	private renderActions(contact: Contact): Children {
		return m(".flex.pb-s", m(ActionButtons))
	}
}

const ActionButtons = pureComponent((contact: Contact) => {
	// FIXME Handle actions correctly
	const colors = {
		borderColor: theme.content_button,
		color: theme.content_fg,
	}
	const highlightColors = {
		borderColor: theme.content_accent,
		color: theme.content_accent,
	}

	const makeActionButtonAttrs = (
		onClick: () => unknown,
		text: TranslationKey,
		colors: {
			borderColor: string
			color: string
		},
		icon?: Children,
	): BannerButtonAttrs =>
		Object.assign(
			{
				text,
				class: "width-min-content flex items-center",
				click: onClick,
				icon,
			},
			colors,
		)

	// FIXME Add translations
	return m(".full-width.flex.items-center.flex-end.mt-s", [
		m(
			BannerButton,
			makeActionButtonAttrs(
				async () => {
					console.log("Action")
				},
				"sendMail_alt",
				highlightColors,
				m(Icon, {
					icon: Icons.PencilSquare,
					class: "flex-center items-center",
					style: {
						fill: highlightColors.color,
					},
				}),
			),
		),
		m(
			BannerButton,
			makeActionButtonAttrs(
				async () => {
					console.log("Action")
				},
				"callNumber_alt",
				colors,
				m(Icon, {
					icon: Icons.Call,
					class: "flex-center items-center",
					style: {
						fill: highlightColors.color,
					},
				}),
			),
		),
	])
})
