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
import { formatEventDuration } from "../CalendarGuiUtils.js"
import { getLocationUrl } from "./EventPreviewView.js"
import { getContactTitle } from "../../../../common/gui/base/GuiUtils.js"
import { isoDateToBirthday } from "../../../../common/api/common/utils/BirthdayUtils.js"
import { createDropdown } from "../../../../common/gui/base/Dropdown.js"
import { writeMail } from "../../../../mail-app/contacts/view/ContactView.js"
import { client } from "../../../../common/misc/ClientDetector.js"

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
					fill: theme.on_surface,
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

export function simulateMailToClick(mailAddress: string) {
	const anchorElement: HTMLAnchorElement = document.createElement("a")
	anchorElement.href = `mailto:${mailAddress}`
	anchorElement.target = "_blank"
	anchorElement.click()
}

const ActionButtons = pureComponent((contact: Contact) => {
	interface ButtonColors {
		borderColor: string
		color: string
	}

	const makeActionButtonAttrs = (onClick: (e: any, dom: any) => unknown, text: TranslationKey, colors: ButtonColors, icon?: Children): BannerButtonAttrs => ({
		text,
		class: "width-min-content flex items-center",
		click: onClick,
		icon,
		...colors,
	})

	const renderIcon = (icon: AllIcons, fillColor: string) =>
		m(Icon, {
			icon,
			class: "flex-center items-center mr-xs",
			style: {
				fill: fillColor,
			},
		})

	const renderSuffix = (text: string) => (text !== "" ? `(${text}) ` : "")

	const showMailDropdown = createDropdown({
		lazyButtons: () =>
			contact.mailAddresses.map((mailAddress, index) => ({
				label: lang.makeTranslation("mailAddress_label", `${renderSuffix(mailAddress.customTypeName)}${mailAddress.address}`),
				click: () => {
					if (client.isCalendarApp()) {
						simulateMailToClick(mailAddress.address)
						return
					}
					return writeMail({
						name: `${contact.firstName} ${contact.lastName}`.trim(),
						address: mailAddress.address,
						contact: contact,
					})
				},
			})),
	})
	const showPhoneDropdown = createDropdown({
		lazyButtons: () =>
			contact.phoneNumbers.map((contactPhone, index) => ({
				label: lang.makeTranslation("phoneNumber", `${renderSuffix(contactPhone.customTypeName)}${contactPhone.number}`),
				click: () => {
					const element: HTMLAnchorElement = document.createElement("a")
					element.href = `tel:${contactPhone.number}`
					element.target = "_blank"
					element.click()
				},
			})),
	})

	const emailButtonColors = {
		borderColor: theme.primary,
		color: theme.primary,
	}
	const phoneButtonColors = {
		borderColor: theme.on_surface_variant,
		color: theme.on_surface,
	}

	const singleEmailAdress = contact.mailAddresses.length === 1
	const singlePhoneNumber = contact.phoneNumbers.length === 1

	const onSendMailClick = (event: MouseEvent, dom: HTMLElement) => {
		if (singleEmailAdress) {
			if (client.isCalendarApp()) {
				return
			} else if (!client.isCalendarApp()) {
				return writeMail({
					name: `${contact.firstName} ${contact.lastName}`.trim(),
					address: contact.mailAddresses[0].address,
					contact: contact,
				})
			}
		}

		showMailDropdown(event, dom)
	}

	return m(".full-width.flex.items-center.flex-end.mt-s.gap-vpad-s.mr-s", [
		contact.mailAddresses.length
			? m(
					singleEmailAdress && client.isCalendarApp() ? `a[href="mailto:${contact.mailAddresses[0].address}"][target=_blank].no-text-decoration` : "",
					m(
						BannerButton,
						makeActionButtonAttrs(onSendMailClick, "sendMail_label", emailButtonColors, renderIcon(BootIcons.Mail, emailButtonColors.color)),
					),
				)
			: null,
		contact.phoneNumbers.length
			? m(
					singlePhoneNumber ? `a[href="tel:${contact.phoneNumbers[0].number}"][target=_blank].no-text-decoration` : "",
					m(
						BannerButton,
						makeActionButtonAttrs(
							singlePhoneNumber ? noOp : showPhoneDropdown,
							"callNumber_label",
							phoneButtonColors,
							renderIcon(Icons.Call, phoneButtonColors.color),
						),
					),
				)
			: null,
	])
})
