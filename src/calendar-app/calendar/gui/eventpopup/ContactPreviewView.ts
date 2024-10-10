import type { CalendarEvent, Contact } from "../../../../common/api/entities/tutanota/TypeRefs.js"
import m, { Children, Component, Vnode } from "mithril"
import { AllIcons, Icon, IconSize } from "../../../../common/gui/base/Icon.js"
import { theme } from "../../../../common/gui/theme.js"
import { BootIcons } from "../../../../common/gui/base/icons/BootIcons.js"
import { Icons } from "../../../../common/gui/base/icons/Icons.js"
import { calculateContactsAge, getTimeZone } from "../../../../common/calendar/date/CalendarUtils.js"
import { memoized, noOp } from "@tutao/tutanota-utils"
import { lang, TranslationKey } from "../../../../common/misc/LanguageViewModel.js"
import { BannerButton, BannerButtonAttrs } from "../../../../common/gui/base/buttons/BannerButton.js"
import { pureComponent } from "../../../../common/gui/base/PureComponent.js"
import { formatEventDuration, getDisplayEventTitle } from "../CalendarGuiUtils.js"
import { getLocationUrl } from "./EventPreviewView.js"
import { ButtonSize } from "../../../../common/gui/base/ButtonSize.js"
import { ButtonColor, getColors } from "../../../../common/gui/base/Button.js"
import { isAllDayEvent } from "../../../../common/api/common/utils/CommonCalendarUtils.js"
import { getContactTitle } from "../../../../common/gui/base/GuiUtils.js"
import { isoDateToBirthday } from "../../../../common/api/common/utils/BirthdayUtils.js"
import { createDropdown } from "../../../../common/gui/base/Dropdown.js"

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
	 * [x] Show name
	 * [x] Show age
	 * [ ] Show email
	 * [ ] Show phone
	 */
	view(vnode: Vnode<ContactPreviewViewAttrs>): Children {
		const { event, contact } = vnode.attrs
		const eventTitle = getContactTitle(contact)

		const birthYear = contact.birthdayIso && isoDateToBirthday(contact.birthdayIso).year
		const age = birthYear && calculateContactsAge(new Date(birthYear).getFullYear(), event.startTime.getFullYear())
		const ageString = age ? lang.get("birthdayEventAge_title", { "{age}": age }) : ""

		return m(".flex.col.smaller.scroll.visible-scrollbar", [
			this.renderRow(BootIcons.Calendar, [m("span.h3", eventTitle)]),
			this.renderRow(Icons.Time, [formatEventDuration(event, getTimeZone(), false)]),
			age ? this.renderRow(Icons.Gift, ageString) : null,
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
		return m(".flex.pb-s", m(ActionButtons, contact))
	}
}

const ActionButtons = pureComponent((contact: Contact) => {
	// FIXME Handle actions correctly
	interface ButtonColors {
		borderColor: string
		color: string
	}

	const emailButtonColors = {
		borderColor: theme.content_accent,
		color: theme.content_accent,
	}
	const phoneButtonColors = {
		borderColor: theme.content_button,
		color: theme.content_button,
	}

	const makeActionButtonAttrs = (onClick: () => unknown, text: TranslationKey, colors: ButtonColors, icon?: Children): BannerButtonAttrs => ({
		text,
		class: "width-min-content flex items-center",
		click: onClick,
		icon,
		...colors,
	})

	const renderIcon = (icon: AllIcons, fillColor: string) =>
		m(Icon, {
			icon,
			class: "flex-center items-center",
			style: {
				fill: fillColor,
			},
		})

	console.log(contact)
	// FIXME Add translations

	const singleEmailAdress = contact.mailAddresses.length === 1
	const singlePhoneNumber = contact.phoneNumbers.length === 1
	return m(".full-width.flex.items-center.flex-end.mt-s", [
		contact.mailAddresses.length
			? m(
					BannerButton,
					makeActionButtonAttrs(
						async () => {
							console.log("Action")
						},
						"sendMail_alt",
						emailButtonColors,
						renderIcon(Icons.PencilSquare, emailButtonColors.color),
					),
			  )
			: null,
		contact.phoneNumbers.length
			? m(
					singlePhoneNumber ? `a[href="tel:${contact.phoneNumbers[0].number}"][target=_blank]` : "",
					m(
						BannerButton,
						makeActionButtonAttrs(
							singlePhoneNumber
								? noOp
								: async () =>
										createDropdown({
											lazyButtons: () =>
												contact.phoneNumbers.map((contactPhone) => {
													return {
														label: () => contactPhone.number,
														click: (event: MouseEvent, dom: HTMLElement) => {
															console.log("Call me babe ;)")
														},
													}
												}),
										}),
							"callNumber_alt",
							phoneButtonColors,
							renderIcon(Icons.Call, phoneButtonColors.color),
						),
					),
			  )
			: null,
	])
})
